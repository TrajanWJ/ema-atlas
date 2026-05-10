// Audits stale `git worktree` registrations across every git repo under
// `Active builds/`.
//
// A stale worktree is one whose registered path no longer exists OR whose
// directory exists but contains no working tree (broken).
//
// Class A: clean (committed-and-pushed, dir gone) abandoned worktree → safe
// to `git worktree prune`. Class C: dirty worktrees (uncommitted changes) →
// always require operator action.

import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AuditContext, ModuleResult } from "./types.js";

const execFileP = promisify(execFile);

interface WorktreeEntry {
	path: string;
	branch?: string;
	commit?: string;
	bare?: boolean;
	prunable?: string; // reason if prunable
}

async function listGitRepos(activeRoot: string): Promise<string[]> {
	let entries: import("node:fs").Dirent[];
	try {
		entries = await fs.readdir(activeRoot, { withFileTypes: true });
	} catch {
		return [];
	}
	const out: string[] = [];
	for (const e of entries) {
		if (!e.isDirectory() && !e.isSymbolicLink()) continue;
		const dir = path.join(activeRoot, e.name);
		try {
			const gitPath = path.join(dir, ".git");
			const s = await fs.lstat(gitPath);
			if (s.isDirectory() || s.isFile()) out.push(dir);
		} catch {
			// not a git repo
		}
	}
	return out;
}

async function listWorktrees(repo: string): Promise<WorktreeEntry[]> {
	try {
		const { stdout } = await execFileP("git", ["-C", repo, "worktree", "list", "--porcelain"], {
			timeout: 5000,
		});
		const out: WorktreeEntry[] = [];
		let current: WorktreeEntry | null = null;
		for (const line of stdout.split("\n")) {
			if (line.startsWith("worktree ")) {
				if (current) out.push(current);
				current = { path: line.slice("worktree ".length).trim() };
			} else if (current && line.startsWith("HEAD ")) {
				current.commit = line.slice("HEAD ".length).trim();
			} else if (current && line.startsWith("branch ")) {
				current.branch = line.slice("branch ".length).trim();
			} else if (current && line === "bare") {
				current.bare = true;
			} else if (current && line.startsWith("prunable")) {
				current.prunable = line.slice("prunable".length).trim() || "prunable";
			}
		}
		if (current) out.push(current);
		return out;
	} catch {
		return [];
	}
}

export async function audit(ctx: AuditContext): Promise<ModuleResult> {
	const t0 = Date.now();
	const findings: ModuleResult["findings"] = [];
	const repos = await listGitRepos(ctx.activeBuildsRoot);

	for (const repo of repos) {
		const wts = await listWorktrees(repo);
		for (const wt of wts) {
			// Skip the primary worktree (the repo itself).
			if (wt.path === repo) continue;
			// Skip bare worktrees explicitly.
			if (wt.bare) continue;
			let exists = true;
			try {
				const s = await fs.stat(wt.path);
				exists = s.isDirectory();
			} catch {
				exists = false;
			}
			if (!exists || wt.prunable) {
				findings.push({
					category: "stale-worktrees",
					severity: "warn",
					fix_class: "A",
					id: `stale-wt:${repo}:${wt.path}`,
					path: wt.path,
					note: `Worktree registered in ${path.basename(repo)} but path is gone${wt.branch ? ` (branch ${wt.branch})` : ""}`,
					suggested_fix: `git -C "${repo}" worktree prune`,
				});
			}
		}
	}

	return {
		category: "stale-worktrees",
		findings,
		scan_ms: ctx.verbose ? Date.now() - t0 : undefined,
	};
}

// Exposed for `--apply` Class A handling.
export async function pruneRepo(repo: string): Promise<void> {
	await execFileP("git", ["-C", repo, "worktree", "prune"], { timeout: 5000 });
}
