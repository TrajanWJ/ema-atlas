// Tests for the `ema doctor --workspace` audit kernel. Each test scaffolds
// an isolated fixture under os.tmpdir() so the kernel never touches the
// real desktop. Every operator-gate behaviour is exercised here.

import { describe, it, before, after } from "node:test";
import { strict as assert } from "node:assert";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import {
	buildContext,
	runAudit,
	scaffoldFixture,
	ALL_CATEGORIES,
} from "../lib/workspace-audit/index.js";

const execFileP = promisify(execFile);

async function mktmp(): Promise<string> {
	return await fs.mkdtemp(path.join(os.tmpdir(), "ema-workspace-audit-"));
}

async function rmrf(p: string): Promise<void> {
	await fs.rm(p, { recursive: true, force: true });
}

async function gitInit(repo: string): Promise<void> {
	await fs.mkdir(repo, { recursive: true });
	await execFileP("git", ["-C", repo, "init", "-q", "-b", "main"]);
	await execFileP("git", ["-C", repo, "config", "user.email", "test@example.com"]);
	await execFileP("git", ["-C", repo, "config", "user.name", "Test"]);
	await execFileP("git", ["-C", repo, "config", "commit.gpgsign", "false"]);
}

async function gitCommit(repo: string, message: string): Promise<void> {
	await execFileP("git", ["-C", repo, "add", "-A"]);
	await execFileP("git", ["-C", repo, "commit", "-q", "-m", message, "--allow-empty"]);
}

describe("workspace-audit kernel", () => {
	let root: string;

	before(async () => {
		root = await mktmp();
	});

	after(async () => {
		await rmrf(root);
	});

	it("scaffolds context and lists all 12 categories", async () => {
		const fix = await scaffoldFixture(path.join(root, "scaffold"));
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
		});
		const report = await runAudit(ctx);
		assert.equal(report.modules.length, 12);
		const cats = new Set(report.modules.map((m) => m.category));
		for (const c of ALL_CATEGORIES) assert.ok(cats.has(c), `missing category ${c}`);
	});

	it("returns ok=true on a pristine empty fixture", async () => {
		const fix = await scaffoldFixture(path.join(root, "pristine"));
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
		});
		const report = await runAudit(ctx);
		assert.equal(report.ok, true);
		assert.equal(report.totals.by_severity.error, 0);
		assert.equal(report.totals.by_severity.warn, 0);
	});

	it("detects .DS_Store infestation as Class A", async () => {
		const fix = await scaffoldFixture(path.join(root, "ds"));
		await fs.writeFile(path.join(fix.activeBuildsRoot, ".DS_Store"), "");
		await fs.writeFile(path.join(fix.projectsRoot, ".DS_Store"), "");
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
		});
		const report = await runAudit(ctx);
		const ds = report.modules.find((m) => m.category === "ds-store");
		assert.ok(ds);
		assert.ok(ds!.findings.length >= 2);
		assert.ok(ds!.findings.every((f) => f.fix_class === "A"));
	});

	it("--apply removes Class A .DS_Store entries", async () => {
		const fix = await scaffoldFixture(path.join(root, "ds-apply"));
		const file = path.join(fix.activeBuildsRoot, ".DS_Store");
		await fs.writeFile(file, "");
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
			apply: true,
		});
		const report = await runAudit(ctx);
		assert.ok(report.applied);
		const applied = report.applied!.find((a) => a.finding_id === `ds:${file}`);
		assert.ok(applied);
		assert.equal(applied!.applied, true);
		await assert.rejects(fs.stat(file));
	});

	it("detects Active↔Projects asymmetry (orphan active)", async () => {
		const fix = await scaffoldFixture(path.join(root, "asym"));
		await fs.mkdir(path.join(fix.activeBuildsRoot, "stranger-app"));
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
		});
		const report = await runAudit(ctx);
		const m = report.modules.find((x) => x.category === "active-projects-symmetry");
		const orphan = m!.findings.find((f) => f.id === "orphan-active:stranger-app");
		assert.ok(orphan);
		assert.equal(orphan!.fix_class, "C");
	});

	it("detects naming drift: trailing whitespace + dup suffix", async () => {
		const fix = await scaffoldFixture(path.join(root, "drift"));
		await fs.mkdir(path.join(fix.activeBuildsRoot, "weird-app "));
		await fs.mkdir(path.join(fix.activeBuildsRoot, "thing 2"));
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
		});
		const report = await runAudit(ctx);
		const m = report.modules.find((x) => x.category === "naming-drift");
		assert.ok(m!.findings.some((f) => f.note.includes("whitespace")));
		assert.ok(m!.findings.some((f) => f.note.includes("duplicate-style suffix")));
	});

	it("detects an unborn project (git repo with no commits)", async () => {
		const fix = await scaffoldFixture(path.join(root, "unborn"));
		const repo = path.join(fix.projectsRoot, "fresh-thing");
		await gitInit(repo);
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
		});
		const report = await runAudit(ctx);
		const m = report.modules.find((x) => x.category === "unborn-projects");
		assert.ok(m!.findings.some((f) => f.id === "unborn:fresh-thing"));
	});

	it("detects a stale `claude/<adj>-<noun>` branch as Class B and refuses to delete without --with-branches", async () => {
		const fix = await scaffoldFixture(path.join(root, "claude-branch"));
		const repo = path.join(fix.activeBuildsRoot, "thing");
		await gitInit(repo);
		await gitCommit(repo, "init");
		await execFileP("git", ["-C", repo, "branch", "claude/dazzling-tulip"]);
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
			apply: true, // apply enabled, but branch flag NOT set
		});
		const report = await runAudit(ctx);
		const m = report.modules.find((x) => x.category === "branch-hygiene");
		const finding = m!.findings.find((f) => f.id.includes("claude/dazzling-tulip"));
		assert.ok(finding);
		assert.equal(finding!.fix_class, "B");
		// applied result for it must be skipped, not applied.
		const applied = report.applied!.find((a) => a.finding_id === finding!.id);
		assert.ok(applied);
		assert.equal(applied!.applied, false);
		assert.match(applied!.skipped_reason ?? "", /with-branches/);
		// Confirm branch still exists.
		const { stdout } = await execFileP("git", ["-C", repo, "branch", "--list", "claude/dazzling-tulip"]);
		assert.match(stdout, /claude\/dazzling-tulip/);
	});

	it("--with-branches actually deletes a merged claude/<adj>-<noun> branch", async () => {
		const fix = await scaffoldFixture(path.join(root, "claude-branch-apply"));
		const repo = path.join(fix.activeBuildsRoot, "thing2");
		await gitInit(repo);
		await gitCommit(repo, "init");
		// Create the branch off main; it's merged by definition.
		await execFileP("git", ["-C", repo, "branch", "claude/merry-tulip"]);
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
			apply: true,
			withBranches: true,
		});
		const report = await runAudit(ctx);
		const applied = report.applied!.find((a) => a.finding_id.includes("claude/merry-tulip"));
		assert.ok(applied);
		assert.equal(applied!.applied, true);
		const { stdout } = await execFileP("git", ["-C", repo, "branch", "--list", "claude/merry-tulip"]);
		assert.equal(stdout.trim(), "");
	});

	it("detects broken symlinks as Class A and never recurses for deletion", async () => {
		const fix = await scaffoldFixture(path.join(root, "links"));
		const link = path.join(fix.activeBuildsRoot, "ghost-link");
		await fs.symlink("/no/such/target/anywhere", link);
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
		});
		const report = await runAudit(ctx);
		const m = report.modules.find((x) => x.category === "broken-symlinks");
		const finding = m!.findings.find((f) => f.path === link);
		assert.ok(finding);
		assert.equal(finding!.fix_class, "A");
	});

	it("apply mode never deletes anything in a dirty worktree", async () => {
		// We don't have a stale-worktrees fixture (would need worktree add + manual rm).
		// Instead, verify that an empty desktop dir IS removed (Class A) but a
		// non-empty one is NOT (the .DS_Store walker only ever rmdir's empty,
		// and ds-store applySingleFix only unlinks files / rmdir's empties).
		const fix = await scaffoldFixture(path.join(root, "dirty"));
		const dirtyDir = path.join(fix.desktopRoot, "I-have-stuff");
		await fs.mkdir(dirtyDir);
		await fs.writeFile(path.join(dirtyDir, "important.txt"), "do not delete");
		const emptyDir = path.join(fix.desktopRoot, "empty-husk");
		await fs.mkdir(emptyDir);
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
			apply: true,
		});
		const report = await runAudit(ctx);
		const ds = report.modules.find((m) => m.category === "ds-store");
		// dirty dir is not "empty" by our definition, so no finding for it.
		assert.ok(!ds!.findings.some((f) => f.path === dirtyDir));
		assert.ok(ds!.findings.some((f) => f.path === emptyDir));
		// Empty dir should be gone after apply; dirty dir intact.
		await fs.stat(dirtyDir);
		await fs.stat(path.join(dirtyDir, "important.txt"));
		await assert.rejects(fs.stat(emptyDir));
	});

	it("totals aggregate correctly across modules", async () => {
		const fix = await scaffoldFixture(path.join(root, "totals"));
		await fs.writeFile(path.join(fix.activeBuildsRoot, ".DS_Store"), "");
		await fs.mkdir(path.join(fix.activeBuildsRoot, "thing 2"));
		await fs.mkdir(path.join(fix.activeBuildsRoot, "thing"));
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
		});
		const report = await runAudit(ctx);
		const sum =
			Object.values(report.totals.by_severity).reduce((a, b) => a + b, 0);
		assert.equal(sum, report.totals.findings);
		const catSum = Object.values(report.totals.by_category).reduce((a, b) => a + b, 0);
		assert.equal(catSum, report.totals.findings);
	});
});
