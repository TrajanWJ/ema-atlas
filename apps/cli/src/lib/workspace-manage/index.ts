// Workspace-manage kernel: thin orchestrator that hands off to the
// per-noun helpers (worktree / branch / remote / sync). Provides the
// `buildContext` factory and a fixture scaffold for tests.
//
// Plan reference: Campaign F brief (worktree/branch/remote management
// counterpart to the workspace-audit kernel).

import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";

import * as worktree from "./worktree.js";
import * as branch from "./branch.js";
import * as remote from "./remote.js";
import * as sync from "./sync.js";
import type { ManageAction, ManageContext, ManageReport } from "./types.js";

export { worktree, branch, remote, sync };
export * from "./types.js";

export interface BuildContextOptions {
	emaRoot?: string;
	desktopRoot?: string;
	apply?: boolean;
	withStash?: boolean;
	withRemotes?: boolean;
	withBranches?: boolean;
	withCreate?: boolean;
	githubOwner?: string;
	verbose?: boolean;
}

export async function buildContext(opts: BuildContextOptions): Promise<ManageContext> {
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
		withCreate: !!opts.withCreate,
		githubOwner: opts.githubOwner ?? "TrajanWJ",
		verbose: !!opts.verbose,
	};
}

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
	await fs.mkdir(path.join(projectsRoot, "EMA"), { recursive: true });
	return { desktopRoot, activeBuildsRoot, projectsRoot, emaRoot };
}

export function totals(actions: ManageAction[]): ManageReport["totals"] {
	let applied = 0;
	let skipped = 0;
	let errors = 0;
	for (const a of actions) {
		if (a.error) errors += 1;
		else if (a.applied === true) applied += 1;
		else if (a.applied === false || a.skipped_reason) skipped += 1;
	}
	return { actions: actions.length, applied, skipped, errors };
}

export function newReport(
	ctx: ManageContext,
	category: ManageReport["category"],
	actions: ManageAction[],
): ManageReport {
	return {
		ok: actions.every((a) => !a.error && a.severity !== "error"),
		category,
		scanned_at: new Date().toISOString(),
		desktop_root: ctx.desktopRoot,
		gates: {
			apply: ctx.apply,
			with_stash: ctx.withStash,
			with_remotes: ctx.withRemotes,
			with_branches: ctx.withBranches,
			with_create: ctx.withCreate,
		},
		actions,
		totals: totals(actions),
	};
}

// Build the omnibus `ema workspace status` report — clones, branches,
// worktrees, remote presence, pair findings — in one structured object.
export async function buildStatus(ctx: ManageContext): Promise<ManageReport> {
	const [clones, pair] = await Promise.all([
		sync.summarizeClones(ctx),
		sync.pairSymmetry(ctx),
	]);
	const report = newReport(ctx, "status", pair.actions);
	report.clones = clones;
	report.pairs = pair.findings;
	return report;
}
