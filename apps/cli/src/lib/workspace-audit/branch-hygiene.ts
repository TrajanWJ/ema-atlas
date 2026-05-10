// Audits branch hygiene across active EMA-relevant repos.
//
// Specifically detects:
//   - `claude/<adjective>-<noun>` branches (Claude Code session branches)
//     that are merged to main/master and can be safely deleted.
//   - Local branches whose tracking remote no longer exists (gone).
//
// Class B (delete only under `--with-branches`).

import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AuditContext, ModuleResult } from "./types.js";

const execFileP = promisify(execFile);

async function listGitRepos(root: string): Promise<string[]> {
	let entries: import("node:fs").Dirent[];
	try {
		entries = await fs.readdir(root, { withFileTypes: true });
	} catch {
		return [];
	}
	const out: string[] = [];
	for (const e of entries) {
		if (!e.isDirectory() && !e.isSymbolicLink()) continue;
		const dir = path.join(root, e.name);
		try {
			const s = await fs.lstat(path.join(dir, ".git"));
			if (s.isDirectory() || s.isFile()) out.push(dir);
		} catch {
			// not git
		}
	}
	return out;
}

interface BranchInfo {
	name: string;
	upstream: string;
	upstreamGone: boolean;
}

async function listLocalBranches(repo: string): Promise<BranchInfo[]> {
	try {
		// %(refname:short) %(upstream:short) %(upstream:track)
		const { stdout } = await execFileP(
			"git",
			[
				"-C",
				repo,
				"for-each-ref",
				"--format=%(refname:short)|%(upstream:short)|%(upstream:track)",
				"refs/heads",
			],
			{ timeout: 5000 },
		);
		const out: BranchInfo[] = [];
		for (const line of stdout.split("\n")) {
			if (!line.trim()) continue;
			const [name, upstream, track] = line.split("|");
			out.push({
				name: name ?? "",
				upstream: upstream ?? "",
				upstreamGone: (track ?? "").includes("gone"),
			});
		}
		return out;
	} catch {
		return [];
	}
}

async function defaultBranch(repo: string): Promise<string | null> {
	for (const cand of ["main", "master"]) {
		try {
			await execFileP("git", ["-C", repo, "rev-parse", "--verify", cand], { timeout: 5000 });
			return cand;
		} catch {
			// try next
		}
	}
	return null;
}

async function isMerged(repo: string, branch: string, into: string): Promise<boolean> {
	try {
		const { stdout } = await execFileP(
			"git",
			["-C", repo, "branch", "--merged", into],
			{ timeout: 5000 },
		);
		return stdout
			.split("\n")
			.map((l) => l.replace(/^[*\s]+/, "").trim())
			.includes(branch);
	} catch {
		return false;
	}
}

export async function audit(ctx: AuditContext): Promise<ModuleResult> {
	const t0 = Date.now();
	const findings: ModuleResult["findings"] = [];
	const repos = await listGitRepos(ctx.activeBuildsRoot);

	for (const repo of repos) {
		const branches = await listLocalBranches(repo);
		const def = await defaultBranch(repo);
		for (const b of branches) {
			if (b.name === def) continue;
			// claude/<word>-<word> stale session branches
			if (/^claude\/[a-z]+(-[a-z]+)+$/.test(b.name)) {
				const merged = def ? await isMerged(repo, b.name, def) : false;
				findings.push({
					category: "branch-hygiene",
					severity: merged ? "info" : "warn",
					fix_class: "B",
					id: `claude-branch:${repo}:${b.name}`,
					path: repo,
					note: `${path.basename(repo)} has Claude session branch "${b.name}"${merged ? " (merged)" : " (NOT merged)"}`,
					suggested_fix: merged
						? `git -C "${repo}" branch -d ${b.name}`
						: `Review work, then delete with --with-branches`,
					requires_flag: "with-branches",
				});
			}
			// upstream gone
			if (b.upstreamGone) {
				findings.push({
					category: "branch-hygiene",
					severity: "info",
					fix_class: "B",
					id: `gone-upstream:${repo}:${b.name}`,
					path: repo,
					note: `${path.basename(repo)} branch "${b.name}" tracks gone upstream ${b.upstream}`,
					suggested_fix: `git -C "${repo}" branch -D ${b.name} (under --with-branches)`,
					requires_flag: "with-branches",
				});
			}
		}
	}
	return {
		category: "branch-hygiene",
		findings,
		scan_ms: ctx.verbose ? Date.now() - t0 : undefined,
	};
}

export async function deleteBranch(repo: string, branch: string, force: boolean): Promise<void> {
	await execFileP(
		"git",
		["-C", repo, "branch", force ? "-D" : "-d", branch],
		{ timeout: 5000 },
	);
}
