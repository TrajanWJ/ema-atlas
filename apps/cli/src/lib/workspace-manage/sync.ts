// Cross-cutting orchestrator: walks the EMA root filesystem and reports
// pair symmetry plus per-clone state.
//
// Reuses the symmetry detector from the audit kernel (canonical naming
// rules + IGNORE set) and folds it into a `pair` action stream.

import { promises as fs } from "node:fs";
import path from "node:path";

import {
	currentBranch,
	defaultBranch,
	isDirty,
	listGitRepos,
	listLocalBranches,
	listWorktrees,
	originUrl,
	repoName,
} from "./git-utils.js";
import { IGNORE_DIR_NAMES, type CloneSummary, type ManageAction, type ManageContext, type PairFinding } from "./types.js";

async function listDirs(root: string): Promise<string[]> {
	let entries: import("node:fs").Dirent[];
	try {
		entries = await fs.readdir(root, { withFileTypes: true });
	} catch {
		return [];
	}
	const out: string[] = [];
	for (const e of entries) {
		if (IGNORE_DIR_NAMES.has(e.name)) continue;
		if (e.isDirectory() || e.isSymbolicLink()) out.push(e.name);
	}
	return out;
}

function canonicalProjectName(name: string): string {
	const m = name.match(/^(.+?)-\d+\.\d+\.\d+$/);
	return m ? m[1] : name;
}

export async function pairSymmetry(ctx: ManageContext): Promise<{ findings: PairFinding[]; actions: ManageAction[] }> {
	const active = await listDirs(ctx.activeBuildsRoot);
	const projects = await listDirs(ctx.projectsRoot);
	const findings: PairFinding[] = [];
	const projectSet = new Set(projects);
	for (const name of active) {
		const canon = canonicalProjectName(name);
		if (projectSet.has(name) || projectSet.has(canon)) continue;
		findings.push({
			id: `orphan-active:${name}`,
			severity: "warn",
			kind: "orphan-active",
			name,
			path: path.join(ctx.activeBuildsRoot, name),
			note: `Active build "${name}" has no Projects/${canon} sibling`,
		});
	}
	const activeCanon = new Set(active.map(canonicalProjectName));
	const activeRaw = new Set(active);
	for (const name of projects) {
		if (activeRaw.has(name) || activeCanon.has(name)) continue;
		findings.push({
			id: `dormant-project:${name}`,
			severity: "info",
			kind: "dormant-project",
			name,
			path: path.join(ctx.projectsRoot, name),
			note: `Project "${name}" has no in-flight Active builds entry`,
		});
	}
	const actions: ManageAction[] = findings.map((f) => ({
		id: `pair:${f.id}`,
		category: "pair-symmetry",
		severity: f.severity,
		fix_class: "C",
		target: f.path,
		note: f.note,
		skipped_reason: "operator-judgement only",
	}));
	return { findings, actions };
}

// Build a status snapshot for every clone under both roots.
export async function summarizeClones(ctx: ManageContext): Promise<CloneSummary[]> {
	const a = await listGitRepos(ctx.activeBuildsRoot);
	const p = await listGitRepos(ctx.projectsRoot);
	const all = [...a, ...p];
	const out: CloneSummary[] = [];
	for (const repo of all) {
		const [def, cur, dirty, url, branches, wts] = await Promise.all([
			defaultBranch(repo),
			currentBranch(repo),
			isDirty(repo),
			originUrl(repo),
			listLocalBranches(repo),
			listWorktrees(repo),
		]);
		out.push({
			repo,
			name: repoName(repo),
			default_branch: def,
			current_branch: cur,
			dirty,
			has_origin: !!url,
			origin_url: url,
			branches,
			worktrees: wts,
		});
	}
	return out;
}
