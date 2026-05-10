// Remote management: clone-if-missing, fetch-all-prune, ensure-origin,
// push-status reporting. Never pushes without --with-remotes; never
// force-pushes; never modifies remote URLs without --with-remotes.

import path from "node:path";

import {
	git,
	isDirty,
	listGitRepos,
	listLocalBranches,
	originUrl,
	repoName,
} from "./git-utils.js";
import type { ManageAction, ManageContext } from "./types.js";

async function rootRepos(ctx: ManageContext): Promise<string[]> {
	const a = await listGitRepos(ctx.activeBuildsRoot);
	const p = await listGitRepos(ctx.projectsRoot);
	return [...a, ...p];
}

// `remote sync`: Class A fetch --prune for every clone with an origin;
// Class B push of ahead branches (only under --with-remotes).
export async function planSync(ctx: ManageContext): Promise<ManageAction[]> {
	const repos = await rootRepos(ctx);
	const actions: ManageAction[] = [];
	for (const repo of repos) {
		const url = await originUrl(repo);
		if (!url) {
			actions.push({
				id: `remote-sync:no-origin:${repo}`,
				category: "remote-sync",
				severity: "info",
				fix_class: "C",
				repo,
				note: `${repoName(repo)}: no origin remote — cannot fetch`,
				skipped_reason: "no origin remote configured",
			});
			continue;
		}
		actions.push({
			id: `remote-sync:fetch:${repo}`,
			category: "remote-sync",
			severity: "info",
			fix_class: "A",
			repo,
			target: "origin",
			note: `${repoName(repo)}: fetch --prune origin`,
			command: `git -C "${repo}" fetch --prune --all`,
		});
		// Push lag report (Class B, never auto unless --with-remotes).
		const branches = await listLocalBranches(repo);
		for (const b of branches) {
			if (!b.upstream || b.upstream_gone) continue;
			if (b.ahead === 0) continue;
			actions.push({
				id: `remote-sync:push:${repo}:${b.name}`,
				category: "remote-sync",
				severity: b.ahead >= 5 ? "warn" : "info",
				fix_class: "B",
				repo,
				target: b.name,
				note: `${repoName(repo)}: ${b.name} is ${b.ahead} ahead of ${b.upstream}`,
				command: `git -C "${repo}" push`,
				requires_flag: "with-remotes",
			});
		}
	}
	return actions;
}

export async function applySync(ctx: ManageContext, actions: ManageAction[]): Promise<void> {
	const fetched = new Set<string>();
	for (const a of actions) {
		if (a.category !== "remote-sync" || !a.repo) continue;
		if (a.fix_class === "A") {
			if (fetched.has(a.repo)) {
				a.applied = true;
				continue;
			}
			const r = await git(a.repo, ["fetch", "--prune", "--all"]);
			fetched.add(a.repo);
			if (r.code !== 0) {
				a.applied = false;
				a.error = r.stderr.trim() || `fetch failed (code ${r.code})`;
				continue;
			}
			a.applied = true;
			continue;
		}
		if (a.fix_class === "B" && a.id.includes(":push:")) {
			if (!ctx.withRemotes) {
				a.applied = false;
				a.skipped_reason = "requires --with-remotes";
				continue;
			}
			if (await isDirty(a.repo)) {
				a.applied = false;
				a.skipped_reason = `worktree ${a.repo} is dirty`;
				continue;
			}
			const r = await git(a.repo, ["push"]);
			if (r.code !== 0) {
				a.applied = false;
				a.error = r.stderr.trim() || `push failed (code ${r.code})`;
				continue;
			}
			a.applied = true;
		}
	}
}

// `remote ensure`: every Active build with no origin → propose adding one
// pointing at github.com/<owner>/<repo>. With --with-create, additionally
// runs `gh repo create` if the remote doesn't exist on GitHub.
export async function planEnsure(ctx: ManageContext): Promise<ManageAction[]> {
	const repos = await listGitRepos(ctx.activeBuildsRoot);
	const actions: ManageAction[] = [];
	for (const repo of repos) {
		const url = await originUrl(repo);
		const name = repoName(repo);
		const wantUrl = `git@github.com:${ctx.githubOwner}/${name}.git`;
		if (!url) {
			actions.push({
				id: `remote-ensure:add:${repo}`,
				category: "remote-ensure",
				severity: "warn",
				fix_class: "B",
				repo,
				target: wantUrl,
				note: `${name}: no origin — would add origin → ${wantUrl}`,
				command: `git -C "${repo}" remote add origin "${wantUrl}"`,
				requires_flag: "with-remotes",
			});
			if (ctx.withCreate) {
				actions.push({
					id: `remote-ensure:create:${repo}`,
					category: "remote-ensure",
					severity: "info",
					fix_class: "B",
					repo,
					target: `${ctx.githubOwner}/${name}`,
					note: `${name}: would call gh repo create ${ctx.githubOwner}/${name} --private --source "${repo}"`,
					command: `gh repo create ${ctx.githubOwner}/${name} --private --source "${repo}"`,
					requires_flag: "with-create",
				});
			}
		} else if (!url.includes(`/${name}`)) {
			// Origin exists but doesn't seem to point at the canonical name.
			actions.push({
				id: `remote-ensure:mismatch:${repo}`,
				category: "remote-ensure",
				severity: "info",
				fix_class: "C",
				repo,
				target: url,
				note: `${name}: origin url ${url} does not contain canonical name`,
				skipped_reason: "operator review required",
			});
		}
	}
	return actions;
}

export async function applyEnsure(ctx: ManageContext, actions: ManageAction[]): Promise<void> {
	if (!ctx.withRemotes) {
		for (const a of actions) {
			if (a.category !== "remote-ensure") continue;
			if (a.fix_class === "B") {
				a.applied = false;
				a.skipped_reason = a.skipped_reason ?? "requires --with-remotes";
			}
		}
		return;
	}
	for (const a of actions) {
		if (a.category !== "remote-ensure" || !a.repo) continue;
		if (a.fix_class !== "B") continue;
		if (a.id.includes(":add:") && a.target) {
			const r = await git(a.repo, ["remote", "add", "origin", a.target]);
			if (r.code !== 0) {
				a.applied = false;
				a.error = r.stderr.trim() || `remote add failed (code ${r.code})`;
				continue;
			}
			a.applied = true;
			continue;
		}
		if (a.id.includes(":create:")) {
			if (!ctx.withCreate) {
				a.applied = false;
				a.skipped_reason = "requires --with-create";
				continue;
			}
			// We do not actually shell out to `gh` from the kernel — gh may
			// prompt for auth. The command line is reported; the operator
			// runs it. Mark the action as a recorded intent.
			a.applied = false;
			a.skipped_reason = "deferred to operator (gh repo create not auto-invoked)";
		}
	}
}

// `remote status`: present-or-absent + ahead/behind summary across all clones.
export async function reportStatus(ctx: ManageContext): Promise<ManageAction[]> {
	const repos = await rootRepos(ctx);
	const actions: ManageAction[] = [];
	for (const repo of repos) {
		const url = await originUrl(repo);
		const name = repoName(repo);
		if (!url) {
			actions.push({
				id: `remote-status:no-origin:${repo}`,
				category: "remote-status",
				severity: "warn",
				fix_class: "C",
				repo,
				note: `${name}: no origin remote`,
			});
			continue;
		}
		const branches = await listLocalBranches(repo);
		const aheadCount = branches.filter((b) => b.ahead > 0 && !b.upstream_gone).length;
		const behindCount = branches.filter((b) => b.behind > 0 && !b.upstream_gone).length;
		const goneCount = branches.filter((b) => b.upstream_gone).length;
		const sev = aheadCount > 0 || behindCount > 0 || goneCount > 0 ? "info" : "info";
		actions.push({
			id: `remote-status:${repo}`,
			category: "remote-status",
			severity: sev,
			fix_class: "C",
			repo,
			target: url,
			note: `${name}: origin ${url} · ${aheadCount} ahead · ${behindCount} behind · ${goneCount} gone-upstream`,
		});
	}
	return actions;
}

export { path };
