// Workspace audit kernel: orchestrates the 12 audit modules and (optionally)
// applies Class A fixes.
//
// Plan reference: `your-missing-many-pieces-dazzling-tulip.md` Option 5a.

import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";

import type {
	ApplyResult,
	AuditCategory,
	AuditContext,
	AuditFinding,
	ModuleResult,
	Severity,
	WorkspaceAuditReport,
} from "./types.js";

import * as activeProjectsSymmetry from "./active-projects-symmetry.js";
import * as namingDrift from "./naming-drift.js";
import * as unbornProjects from "./unborn-projects.js";
import * as staleWorktrees from "./stale-worktrees.js";
import * as oldStashes from "./old-stashes.js";
import * as brokenSymlinks from "./broken-symlinks.js";
import * as untrackedCruft from "./untracked-cruft.js";
import * as crossCloneDups from "./cross-clone-dups.js";
import * as branchHygiene from "./branch-hygiene.js";
import * as pushLag from "./push-lag.js";
import * as dsStore from "./ds-store.js";
import * as wikiCoverage from "./wiki-coverage.js";

export const ALL_CATEGORIES: AuditCategory[] = [
	"active-projects-symmetry",
	"naming-drift",
	"unborn-projects",
	"stale-worktrees",
	"old-stashes",
	"broken-symlinks",
	"untracked-cruft",
	"cross-clone-dups",
	"branch-hygiene",
	"push-lag",
	"ds-store",
	"wiki-coverage",
];

const MODULES: Record<AuditCategory, { audit: (ctx: AuditContext) => Promise<ModuleResult> }> = {
	"active-projects-symmetry": activeProjectsSymmetry,
	"naming-drift": namingDrift,
	"unborn-projects": unbornProjects,
	"stale-worktrees": staleWorktrees,
	"old-stashes": oldStashes,
	"broken-symlinks": brokenSymlinks,
	"untracked-cruft": untrackedCruft,
	"cross-clone-dups": crossCloneDups,
	"branch-hygiene": branchHygiene,
	"push-lag": pushLag,
	"ds-store": dsStore,
	"wiki-coverage": wikiCoverage,
};

export interface BuildContextOptions {
	emaRoot?: string;
	desktopRoot?: string;
	apply?: boolean;
	withStash?: boolean;
	withRemotes?: boolean;
	withBranches?: boolean;
	verbose?: boolean;
}

export async function buildContext(opts: BuildContextOptions): Promise<AuditContext> {
	const home = os.homedir();
	const desktopRoot = opts.desktopRoot ?? path.join(home, "Desktop");
	const activeBuildsRoot = path.join(desktopRoot, "Active builds");
	const projectsRoot = path.join(desktopRoot, "Projects");
	const emaRoot = opts.emaRoot ?? path.join(activeBuildsRoot, "EMA-0.0.6");

	return {
		desktopRoot,
		emaRoot,
		activeBuildsRoot,
		projectsRoot,
		apply: !!opts.apply,
		withStash: !!opts.withStash,
		withRemotes: !!opts.withRemotes,
		withBranches: !!opts.withBranches,
		verbose: !!opts.verbose,
	};
}

export async function runAudit(ctx: AuditContext): Promise<WorkspaceAuditReport> {
	const moduleResults = await Promise.all(
		ALL_CATEGORIES.map(async (cat) => {
			try {
				return await MODULES[cat].audit(ctx);
			} catch (err) {
				return {
					category: cat,
					skipped: true,
					skip_reason: `module crashed: ${err instanceof Error ? err.message : String(err)}`,
					findings: [],
				} satisfies ModuleResult;
			}
		}),
	);

	const allFindings = moduleResults.flatMap((m) => m.findings);
	const bySeverity: Record<Severity, number> = { info: 0, warn: 0, error: 0 };
	const byCategory: Record<AuditCategory, number> = ALL_CATEGORIES.reduce((acc, c) => {
		acc[c] = 0;
		return acc;
	}, {} as Record<AuditCategory, number>);
	let classA = 0;
	for (const f of allFindings) {
		bySeverity[f.severity] += 1;
		byCategory[f.category] += 1;
		if (f.fix_class === "A") classA += 1;
	}
	const ok = bySeverity.error === 0 && bySeverity.warn === 0;

	const report: WorkspaceAuditReport = {
		ok,
		desktop_root: ctx.desktopRoot,
		scanned_at: new Date().toISOString(),
		modules: moduleResults,
		totals: {
			findings: allFindings.length,
			by_severity: bySeverity,
			by_category: byCategory,
			auto_fixable_class_a: classA,
		},
		gates: {
			apply: ctx.apply,
			with_stash: ctx.withStash,
			with_remotes: ctx.withRemotes,
			with_branches: ctx.withBranches,
		},
	};

	if (ctx.apply) {
		report.applied = await applyFixes(ctx, allFindings);
	}

	return report;
}

// applyFixes: Class A unconditionally; B only if its `requires_flag` is set.
// C never. Operator-gate enforcement is done here so each module stays pure.
export async function applyFixes(
	ctx: AuditContext,
	findings: AuditFinding[],
): Promise<ApplyResult[]> {
	const results: ApplyResult[] = [];
	for (const f of findings) {
		if (f.fix_class === "C") {
			results.push({
				finding_id: f.id,
				category: f.category,
				applied: false,
				skipped_reason: "fix_class C requires operator action",
			});
			continue;
		}
		if (f.fix_class === "B") {
			const flag = f.requires_flag;
			const ok =
				(flag === "with-stash" && ctx.withStash) ||
				(flag === "with-remotes" && ctx.withRemotes) ||
				(flag === "with-branches" && ctx.withBranches);
			if (!ok) {
				results.push({
					finding_id: f.id,
					category: f.category,
					applied: false,
					skipped_reason: `requires --${flag ?? "<unknown>"}`,
				});
				continue;
			}
		}
		try {
			await applySingleFix(f);
			results.push({ finding_id: f.id, category: f.category, applied: true });
		} catch (err) {
			results.push({
				finding_id: f.id,
				category: f.category,
				applied: false,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	}
	return results;
}

async function applySingleFix(f: AuditFinding): Promise<void> {
	switch (f.category) {
		case "ds-store": {
			if (!f.path) throw new Error("missing path");
			await dsStore.removePath(f.path);
			return;
		}
		case "broken-symlinks": {
			if (!f.path) throw new Error("missing path");
			await brokenSymlinks.removeLink(f.path);
			return;
		}
		case "stale-worktrees": {
			if (!f.path) throw new Error("missing path");
			// `path` was the missing worktree; we prune the parent repo. The
			// finding id encodes "<repo>:<path>".
			const idParts = f.id.split(":");
			const repo = idParts[1];
			if (!repo) throw new Error("repo missing from finding id");
			await staleWorktrees.pruneRepo(repo);
			return;
		}
		case "old-stashes": {
			const idParts = f.id.split(":");
			const repo = idParts[1];
			const ref = idParts.slice(2).join(":");
			if (!repo || !ref) throw new Error("repo/ref missing from finding id");
			await oldStashes.dropStash(repo, ref);
			return;
		}
		case "branch-hygiene": {
			const idParts = f.id.split(":");
			const repo = idParts[1];
			const branch = idParts.slice(2).join(":");
			if (!repo || !branch) throw new Error("repo/branch missing from finding id");
			// `claude-branch:` may be unmerged → use force; gone-upstream → force too.
			const force = f.id.startsWith("gone-upstream:") ||
				(f.id.startsWith("claude-branch:") && f.severity === "warn");
			await branchHygiene.deleteBranch(repo, branch, force);
			return;
		}
		default:
			throw new Error(`no apply path for category ${f.category}`);
	}
}

// Convenience helper for tests: scaffold a fixture root and return absolute paths.
export async function scaffoldFixture(rootBase: string): Promise<{
	desktopRoot: string;
	activeBuildsRoot: string;
	projectsRoot: string;
	emaRoot: string;
}> {
	const desktopRoot = rootBase;
	const activeBuildsRoot = path.join(desktopRoot, "Active builds");
	const projectsRoot = path.join(desktopRoot, "Projects");
	const emaRoot = path.join(activeBuildsRoot, "EMA-0.0.6");
	await fs.mkdir(activeBuildsRoot, { recursive: true });
	await fs.mkdir(projectsRoot, { recursive: true });
	await fs.mkdir(emaRoot, { recursive: true });
	// Mirror under Projects/ so the scaffolded build does not self-flag as
	// an Active↔Projects orphan in the symmetry audit.
	await fs.mkdir(path.join(projectsRoot, "EMA"), { recursive: true });
	return { desktopRoot, activeBuildsRoot, projectsRoot, emaRoot };
}
