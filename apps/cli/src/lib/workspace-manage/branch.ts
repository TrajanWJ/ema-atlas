// Branch management: list / clean / sync local branches across every clone
// in the EMA root filesystem.
//
// Class A: ff-only sync of clean clones (`git pull --ff-only` per branch
// with an upstream); fetch --prune is in remote.ts.
// Class B: branch deletion, gated by --with-branches.

import path from "node:path";

import {
	currentBranch,
	defaultBranch,
	git,
	isDirty,
	listGitRepos,
	listLocalBranches,
	repoName,
} from "./git-utils.js";
import type { BranchSummary, ManageAction, ManageContext } from "./types.js";

interface BranchRow {
	repo: string;
	repo_name: string;
	branch: BranchSummary;
}

async function rootRepos(ctx: ManageContext): Promise<string[]> {
	const a = await listGitRepos(ctx.activeBuildsRoot);
	const p = await listGitRepos(ctx.projectsRoot);
	return [...a, ...p];
}

export async function listAll(ctx: ManageContext): Promise<BranchRow[]> {
	const repos = await rootRepos(ctx);
	const out: BranchRow[] = [];
	for (const repo of repos) {
		const branches = await listLocalBranches(repo);
		for (const b of branches) {
			out.push({ repo, repo_name: repoName(repo), branch: b });
		}
	}
	return out;
}

const CLAUDE_BRANCH_RE = /^claude\/[a-z]+(-[a-z]+)+$/;

// Plan branch cleanup. By default both gone-upstream and Claude session
// branches surface as Class B (gated on --with-branches).
export async function planClean(ctx: ManageContext): Promise<ManageAction[]> {
	const repos = await rootRepos(ctx);
	const actions: ManageAction[] = [];
	for (const repo of repos) {
		const def = await defaultBranch(repo);
		const cur = await currentBranch(repo);
		const branches = await listLocalBranches(repo);
		for (const b of branches) {
			if (b.name === def) continue;
			if (b.name === cur) continue; // never target the checked-out branch
			const isClaude = CLAUDE_BRANCH_RE.test(b.name);
			const isGone = b.upstream_gone;
			if (!isClaude && !isGone) continue;
			const merged = def ? await isMerged(repo, b.name, def) : false;
			actions.push({
				id: `${isGone ? "gone-upstream" : "claude-branch"}:${repo}:${b.name}`,
				category: "branch-clean",
				severity: merged ? "info" : "warn",
				fix_class: "B",
				repo,
				target: b.name,
				note: `${repoName(repo)}: ${isGone ? "gone-upstream" : "Claude session"} branch "${b.name}"${merged ? " (merged)" : " (NOT merged)"}`,
				command: `git -C "${repo}" branch -${merged ? "d" : "D"} ${b.name}`,
				requires_flag: "with-branches",
			});
		}
	}
	return actions;
}

async function isMerged(repo: string, branch: string, into: string): Promise<boolean> {
	const r = await git(repo, ["branch", "--merged", into]);
	if (r.code !== 0) return false;
	return r.stdout
		.split("\n")
		.map((l) => l.replace(/^[*\s]+/, "").trim())
		.includes(branch);
}

export async function applyClean(ctx: ManageContext, actions: ManageAction[]): Promise<void> {
	if (!ctx.withBranches) {
		for (const a of actions) {
			if (a.category !== "branch-clean") continue;
			a.applied = false;
			a.skipped_reason = "requires --with-branches";
		}
		return;
	}
	for (const a of actions) {
		if (a.category !== "branch-clean" || !a.repo || !a.target) continue;
		// Hard gate: refuse on dirty trees even with --with-branches.
		if (await isDirty(a.repo)) {
			a.applied = false;
			a.skipped_reason = `worktree ${a.repo} is dirty`;
			continue;
		}
		const force = a.severity === "warn"; // unmerged → -D
		const r = await git(a.repo, ["branch", force ? "-D" : "-d", a.target]);
		if (r.code !== 0) {
			a.applied = false;
			a.error = r.stderr.trim() || `branch delete failed (code ${r.code})`;
			continue;
		}
		a.applied = true;
	}
}

// Plan ff-only sync. For each branch with an upstream, produce a Class A
// action describing the merge. Apply phase fetches first, then ff-merges.
export async function planSync(ctx: ManageContext): Promise<ManageAction[]> {
	const repos = await rootRepos(ctx);
	const actions: ManageAction[] = [];
	for (const repo of repos) {
		const dirty = await isDirty(repo);
		const branches = await listLocalBranches(repo);
		for (const b of branches) {
			if (!b.upstream || b.upstream_gone) continue;
			if (b.behind === 0) continue;
			actions.push({
				id: `branch-sync:${repo}:${b.name}`,
				category: "branch-sync",
				severity: "info",
				fix_class: dirty ? "C" : "A",
				repo,
				target: b.name,
				note: `${repoName(repo)}: ${b.name} is ${b.behind} behind ${b.upstream}${dirty ? " (dirty — refused)" : ""}`,
				command: `git -C "${repo}" merge --ff-only ${b.upstream}`,
				skipped_reason: dirty ? "worktree is dirty" : undefined,
			});
		}
	}
	return actions;
}

export async function applySync(_ctx: ManageContext, actions: ManageAction[]): Promise<void> {
	const fetched = new Set<string>();
	for (const a of actions) {
		if (a.category !== "branch-sync" || !a.repo || !a.target) continue;
		if (a.fix_class !== "A") {
			a.applied = false;
			continue;
		}
		if (await isDirty(a.repo)) {
			a.applied = false;
			a.skipped_reason = "worktree is dirty";
			continue;
		}
		if (!fetched.has(a.repo)) {
			await git(a.repo, ["fetch", "--prune", "--all"]);
			fetched.add(a.repo);
		}
		// Only ff-merge if branch is the currently checked-out branch.
		const cur = await currentBranch(a.repo);
		if (cur === a.target) {
			const r = await git(a.repo, ["merge", "--ff-only"]);
			if (r.code !== 0) {
				a.applied = false;
				a.error = r.stderr.trim() || "ff-only merge refused";
				continue;
			}
			a.applied = true;
			continue;
		}
		// For non-checked-out branches use update-ref-style fast-forward:
		// `git fetch . upstream:branch` is read-only against working tree.
		const branches = await listLocalBranches(a.repo);
		const info = branches.find((x) => x.name === a.target);
		if (!info || !info.upstream) {
			a.applied = false;
			a.skipped_reason = "no upstream";
			continue;
		}
		const r = await git(a.repo, ["fetch", ".", `${info.upstream}:${a.target}`]);
		if (r.code !== 0) {
			a.applied = false;
			a.error = r.stderr.trim() || "ff fetch refused (would diverge)";
			continue;
		}
		a.applied = true;
	}
}

// Helper export for the test suite.
export { rootRepos };

// Path utility re-export to keep callers from re-importing.
export { path };
