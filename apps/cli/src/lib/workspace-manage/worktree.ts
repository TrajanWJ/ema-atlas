// Worktree management: list / prune / add / move git worktrees across the
// EMA root filesystem (Active builds + Projects).

import { promises as fs } from "node:fs";
import path from "node:path";

import {
	currentBranch,
	defaultBranch,
	git,
	isDirty,
	listGitRepos,
	listWorktrees,
	repoName,
} from "./git-utils.js";
import type { ManageAction, ManageContext, WorktreeSummary } from "./types.js";

interface WorktreeRow extends WorktreeSummary {
	repo: string;
}

async function rootRepos(ctx: ManageContext): Promise<string[]> {
	const a = await listGitRepos(ctx.activeBuildsRoot);
	const p = await listGitRepos(ctx.projectsRoot);
	return [...a, ...p];
}

export async function listAll(ctx: ManageContext): Promise<WorktreeRow[]> {
	const repos = await rootRepos(ctx);
	const out: WorktreeRow[] = [];
	for (const repo of repos) {
		const wts = await listWorktrees(repo);
		for (const wt of wts) {
			out.push({ repo, ...wt });
		}
	}
	return out;
}

// Detect every registered worktree whose path no longer exists or is marked
// prunable by git. Class A under --apply.
export async function planPrune(ctx: ManageContext): Promise<ManageAction[]> {
	const repos = await rootRepos(ctx);
	const actions: ManageAction[] = [];
	const seen = new Set<string>();
	for (const repo of repos) {
		const wts = await listWorktrees(repo);
		let needsPrune = false;
		for (const wt of wts) {
			if (wt.path === repo) continue;
			if (!wt.exists || wt.prunable) {
				needsPrune = true;
				actions.push({
					id: `worktree-prune:${repo}:${wt.path}`,
					category: "worktree-prune",
					severity: "warn",
					fix_class: "A",
					repo,
					target: wt.path,
					note: `${repoName(repo)}: stale worktree ${wt.path}${wt.branch ? ` (branch ${wt.branch})` : ""}`,
					command: `git -C "${repo}" worktree prune`,
				});
			}
		}
		// One prune call clears all stale entries for the repo, but we keep one
		// action per stale worktree for transparency. Apply phase dedupes by repo.
		if (needsPrune) seen.add(repo);
	}
	return actions;
}

export async function applyPrune(_ctx: ManageContext, actions: ManageAction[]): Promise<void> {
	const reposToPrune = new Set<string>();
	for (const a of actions) {
		if (a.category !== "worktree-prune" || !a.repo) continue;
		reposToPrune.add(a.repo);
	}
	for (const repo of reposToPrune) {
		const r = await git(repo, ["worktree", "prune"]);
		if (r.code !== 0) {
			for (const a of actions) {
				if (a.repo === repo) {
					a.applied = false;
					a.error = r.stderr.trim() || `git worktree prune failed (code ${r.code})`;
				}
			}
			continue;
		}
		for (const a of actions) {
			if (a.repo === repo && a.category === "worktree-prune") {
				a.applied = true;
			}
		}
	}
}

export async function planAdd(
	_ctx: ManageContext,
	repo: string,
	wtPath: string,
	branch: string,
): Promise<ManageAction[]> {
	const abs = path.isAbsolute(wtPath) ? wtPath : path.resolve(repo, wtPath);
	let exists = false;
	try {
		await fs.access(abs);
		exists = true;
	} catch {
		exists = false;
	}
	if (exists) {
		return [{
			id: `worktree-add:${repo}:${abs}`,
			category: "worktree-add",
			severity: "error",
			fix_class: "C",
			repo,
			target: abs,
			note: `Refused: ${abs} already exists`,
			skipped_reason: "target path exists",
		}];
	}
	return [{
		id: `worktree-add:${repo}:${abs}`,
		category: "worktree-add",
		severity: "info",
		fix_class: "A",
		repo,
		target: abs,
		note: `${repoName(repo)}: would add worktree at ${abs} on branch ${branch}`,
		command: `git -C "${repo}" worktree add "${abs}" "${branch}"`,
	}];
}

export async function applyAdd(
	repo: string,
	wtPath: string,
	branch: string,
): Promise<{ ok: boolean; error?: string }> {
	const r = await git(repo, ["worktree", "add", wtPath, branch]);
	if (r.code !== 0) return { ok: false, error: r.stderr.trim() };
	return { ok: true };
}

export async function planMove(
	repo: string,
	from: string,
	to: string,
): Promise<ManageAction[]> {
	// Refuse if source is dirty — `git worktree move` already refuses but we
	// surface it as a structured action.
	const dirty = await isDirty(from).catch(() => false);
	if (dirty) {
		return [{
			id: `worktree-move:${repo}:${from}`,
			category: "worktree-move",
			severity: "error",
			fix_class: "C",
			repo,
			target: from,
			note: `Refused: source worktree ${from} is dirty`,
			skipped_reason: "source worktree is dirty",
		}];
	}
	return [{
		id: `worktree-move:${repo}:${from}`,
		category: "worktree-move",
		severity: "info",
		fix_class: "A",
		repo,
		target: `${from} → ${to}`,
		note: `${repoName(repo)}: would move worktree ${from} → ${to}`,
		command: `git -C "${repo}" worktree move "${from}" "${to}"`,
	}];
}

export async function applyMove(
	repo: string,
	from: string,
	to: string,
): Promise<{ ok: boolean; error?: string }> {
	const r = await git(repo, ["worktree", "move", from, to]);
	if (r.code !== 0) return { ok: false, error: r.stderr.trim() };
	return { ok: true };
}

// Default-branch helper kept here so `worktree add` callers can resolve a
// reasonable target branch if the user passes "-".
export async function resolveBranch(repo: string, branch: string): Promise<string> {
	if (branch && branch !== "-") return branch;
	const def = await defaultBranch(repo);
	if (def) return def;
	const cur = await currentBranch(repo);
	return cur ?? "HEAD";
}
