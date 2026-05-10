// Tests for the `ema workspace` management kernel. Each test scaffolds an
// isolated fixture filesystem under os.tmpdir() with real `git init`d
// clones — the kernel never touches the operator's desktop.

import { describe, it, before, after } from "node:test";
import { strict as assert } from "node:assert";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import {
	branch as mBranch,
	buildContext,
	buildStatus,
	remote as mRemote,
	scaffoldFixture,
	sync as mSync,
	worktree as mWorktree,
} from "../lib/workspace-manage/index.js";

const execFileP = promisify(execFile);

async function mktmp(): Promise<string> {
	return await fs.mkdtemp(path.join(os.tmpdir(), "ema-workspace-manage-"));
}

async function rmrf(p: string): Promise<void> {
	await fs.rm(p, { recursive: true, force: true });
}

async function gitInit(repo: string): Promise<string> {
	await fs.mkdir(repo, { recursive: true });
	await execFileP("git", ["-C", repo, "init", "-q", "-b", "main"]);
	await execFileP("git", ["-C", repo, "config", "user.email", "test@example.com"]);
	await execFileP("git", ["-C", repo, "config", "user.name", "Test"]);
	await execFileP("git", ["-C", repo, "config", "commit.gpgsign", "false"]);
	// Return the symlink-resolved path so tests can compare repo equality
	// to the values the kernel surfaces (git canonicalizes its own paths
	// and `listGitRepos` does the same via fs.realpath).
	return await fs.realpath(repo);
}

async function gitCommit(repo: string, message: string): Promise<void> {
	await execFileP("git", ["-C", repo, "add", "-A"]);
	await execFileP("git", ["-C", repo, "commit", "-q", "-m", message, "--allow-empty"]);
}

describe("workspace-manage kernel", () => {
	let root: string;

	before(async () => {
		root = await mktmp();
	});

	after(async () => {
		await rmrf(root);
	});

	it("buildStatus enumerates clones, branches, worktrees, pair findings", async () => {
		const fix = await scaffoldFixture(path.join(root, "status"));
		const repo = await gitInit(path.join(fix.activeBuildsRoot, "alpha"));
		await gitCommit(repo, "init");
		await fs.mkdir(path.join(fix.projectsRoot, "alpha"), { recursive: true });
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
		});
		const report = await buildStatus(ctx);
		assert.equal(report.category, "status");
		assert.ok(report.clones && report.clones.length >= 1);
		const alpha = report.clones!.find((c) => c.name === "alpha");
		assert.ok(alpha);
		assert.equal(alpha!.default_branch, "main");
		assert.equal(alpha!.dirty, false);
		assert.ok(Array.isArray(alpha!.branches));
		assert.ok(Array.isArray(alpha!.worktrees));
		assert.ok(report.pairs);
		// EMA-0.0.6 has Projects/EMA, alpha has Projects/alpha → no orphan.
		assert.equal(report.pairs!.length, 0);
	});

	it("worktree prune detects path-gone worktree (Class A) and removes under --apply", async () => {
		const fix = await scaffoldFixture(path.join(root, "wt-prune"));
		const repo = await gitInit(path.join(fix.activeBuildsRoot, "wt-host"));
		await gitCommit(repo, "init");
		const wtParent = await fs.realpath(root);
		const wtPath = path.join(wtParent, "external-worktree-target");
		await execFileP("git", ["-C", repo, "worktree", "add", "-b", "feature/x", wtPath]);
		// kill the worktree directory to simulate stale registration
		await rmrf(wtPath);
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
		});
		const actions = await mWorktree.planPrune(ctx);
		const stale = actions.find((a) => a.target === wtPath);
		assert.ok(stale, "expected stale worktree finding");
		assert.equal(stale!.fix_class, "A");
		// apply
		const applyCtx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
			apply: true,
		});
		const applyActions = await mWorktree.planPrune(applyCtx);
		await mWorktree.applyPrune(applyCtx, applyActions);
		// after prune, no stale entries should remain
		const after = await mWorktree.planPrune(ctx);
		assert.equal(after.length, 0, "stale worktree should be pruned");
	});

	it("branch clean refuses without --with-branches; deletes with the flag", async () => {
		const fix = await scaffoldFixture(path.join(root, "br-clean"));
		const repo = await gitInit(path.join(fix.activeBuildsRoot, "br-host"));
		await gitCommit(repo, "init");
		await execFileP("git", ["-C", repo, "branch", "claude/dazzling-tulip"]);
		// Default-mode plan: Class B with requires_flag
		const ctxNoFlag = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
			apply: true,
			withBranches: false,
		});
		const actions = await mBranch.planClean(ctxNoFlag);
		const claude = actions.find((a) => a.target === "claude/dazzling-tulip");
		assert.ok(claude, "expected Claude session branch finding");
		assert.equal(claude!.fix_class, "B");
		assert.equal(claude!.requires_flag, "with-branches");
		await mBranch.applyClean(ctxNoFlag, actions);
		assert.equal(claude!.applied, false);
		assert.match(claude!.skipped_reason ?? "", /with-branches/);
		// branch should still exist
		const list1 = await execFileP("git", ["-C", repo, "branch"]);
		assert.ok(list1.stdout.includes("claude/dazzling-tulip"));

		// With --with-branches → branch deleted
		const ctxFlag = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
			apply: true,
			withBranches: true,
		});
		const actions2 = await mBranch.planClean(ctxFlag);
		const claude2 = actions2.find((a) => a.target === "claude/dazzling-tulip");
		assert.ok(claude2);
		await mBranch.applyClean(ctxFlag, actions2);
		assert.equal(claude2!.applied, true);
		const list2 = await execFileP("git", ["-C", repo, "branch"]);
		assert.ok(!list2.stdout.includes("claude/dazzling-tulip"));
	});

	it("remote sync reports no-origin clones and never pushes without --with-remotes", async () => {
		const fix = await scaffoldFixture(path.join(root, "rsync"));
		const repo = await gitInit(path.join(fix.activeBuildsRoot, "noorigin"));
		await gitCommit(repo, "init");
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
		});
		const actions = await mRemote.planSync(ctx);
		const noOrigin = actions.find((a) => a.repo === repo && a.id.includes("no-origin"));
		assert.ok(noOrigin, "expected no-origin finding");
		assert.equal(noOrigin!.fix_class, "C");
		// no push actions should appear (no upstream tracked)
		const pushes = actions.filter((a) => a.id.includes(":push:"));
		assert.equal(pushes.length, 0);
	});

	it("remote ensure proposes adding origin under --with-remotes (Class B) without it being a push", async () => {
		const fix = await scaffoldFixture(path.join(root, "rensure"));
		const repo = await gitInit(path.join(fix.activeBuildsRoot, "ensure-me"));
		await gitCommit(repo, "init");
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
		});
		const actions = await mRemote.planEnsure(ctx);
		const add = actions.find((a) => a.id.includes(":add:"));
		assert.ok(add);
		assert.equal(add!.fix_class, "B");
		assert.equal(add!.requires_flag, "with-remotes");
		// Without --with-remotes the action is refused under --apply
		const applyNoFlag = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
			apply: true,
			withRemotes: false,
		});
		const actions2 = await mRemote.planEnsure(applyNoFlag);
		await mRemote.applyEnsure(applyNoFlag, actions2);
		const add2 = actions2.find((a) => a.id.includes(":add:"));
		assert.equal(add2!.applied, false);
	});

	it("pair-symmetry surfaces orphan Active builds with no Projects/ sibling", async () => {
		const fix = await scaffoldFixture(path.join(root, "pair"));
		await fs.mkdir(path.join(fix.activeBuildsRoot, "stranger"), { recursive: true });
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
		});
		const pair = await mSync.pairSymmetry(ctx);
		const orphan = pair.findings.find((f) => f.id === "orphan-active:stranger");
		assert.ok(orphan, "expected orphan-active finding");
		assert.equal(orphan!.kind, "orphan-active");
		const action = pair.actions.find((a) => a.id.endsWith("orphan-active:stranger"));
		assert.ok(action);
		assert.equal(action!.fix_class, "C");
	});

	it("dirty-tree gate blocks Class B branch deletion even with --with-branches", async () => {
		const fix = await scaffoldFixture(path.join(root, "dirty"));
		const repo = await gitInit(path.join(fix.activeBuildsRoot, "dirty-host"));
		await gitCommit(repo, "init");
		await execFileP("git", ["-C", repo, "branch", "claude/sparkly-fern"]);
		// dirty the worktree
		await fs.writeFile(path.join(repo, "scratch.txt"), "uncommitted\n");
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
			apply: true,
			withBranches: true,
		});
		const actions = await mBranch.planClean(ctx);
		const claude = actions.find((a) => a.target === "claude/sparkly-fern");
		assert.ok(claude);
		await mBranch.applyClean(ctx, actions);
		assert.equal(claude!.applied, false);
		assert.match(claude!.skipped_reason ?? "", /dirty/);
	});

	it("worktree add refuses if target path already exists", async () => {
		const fix = await scaffoldFixture(path.join(root, "wt-add"));
		const repo = await gitInit(path.join(fix.activeBuildsRoot, "wt-add-host"));
		await gitCommit(repo, "init");
		const wtPath = path.join(root, "wt-add-target-exists");
		await fs.mkdir(wtPath, { recursive: true });
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
		});
		const actions = await mWorktree.planAdd(ctx, repo, wtPath, "main");
		assert.equal(actions[0].fix_class, "C");
		assert.equal(actions[0].severity, "error");
	});

	it("branch list returns one row per local branch per clone", async () => {
		const fix = await scaffoldFixture(path.join(root, "br-list"));
		const repo = await gitInit(path.join(fix.activeBuildsRoot, "list-host"));
		await gitCommit(repo, "init");
		await execFileP("git", ["-C", repo, "branch", "feature/a"]);
		await execFileP("git", ["-C", repo, "branch", "feature/b"]);
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
		});
		const rows = await mBranch.listAll(ctx);
		const fromHost = rows.filter((r) => r.repo === repo);
		const names = fromHost.map((r) => r.branch.name).sort();
		assert.deepEqual(names, ["feature/a", "feature/b", "main"]);
	});

	it("worktree list returns the primary worktree at minimum", async () => {
		const fix = await scaffoldFixture(path.join(root, "wt-list"));
		const repo = await gitInit(path.join(fix.activeBuildsRoot, "wt-list-host"));
		await gitCommit(repo, "init");
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
		});
		const rows = await mWorktree.listAll(ctx);
		const primary = rows.find((r) => r.repo === repo && r.path === repo);
		assert.ok(primary, "expected primary worktree");
	});

	it("remote status emits one action per clone with origin presence", async () => {
		const fix = await scaffoldFixture(path.join(root, "rstatus"));
		const repo = await gitInit(path.join(fix.activeBuildsRoot, "rs-host"));
		await gitCommit(repo, "init");
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
		});
		const actions = await mRemote.reportStatus(ctx);
		const row = actions.find((a) => a.repo === repo);
		assert.ok(row);
		// no origin set → severity warn
		assert.equal(row!.severity, "warn");
	});

	it("buildStatus json shape is parseable and stable", async () => {
		const fix = await scaffoldFixture(path.join(root, "json-shape"));
		const repo = await gitInit(path.join(fix.activeBuildsRoot, "shape-host"));
		await gitCommit(repo, "init");
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
		});
		const report = await buildStatus(ctx);
		const json = JSON.parse(JSON.stringify(report));
		assert.equal(typeof json.scanned_at, "string");
		assert.equal(typeof json.gates.apply, "boolean");
		assert.equal(typeof json.totals.actions, "number");
		assert.ok(Array.isArray(json.actions));
		assert.ok(Array.isArray(json.clones));
	});

	it("worktree prune is idempotent when no stale worktrees exist", async () => {
		const fix = await scaffoldFixture(path.join(root, "idem"));
		const repo = await gitInit(path.join(fix.activeBuildsRoot, "clean-host"));
		await gitCommit(repo, "init");
		const ctx = await buildContext({
			desktopRoot: fix.desktopRoot,
			emaRoot: fix.emaRoot,
			apply: true,
		});
		const actions = await mWorktree.planPrune(ctx);
		assert.equal(actions.length, 0);
	});
});
