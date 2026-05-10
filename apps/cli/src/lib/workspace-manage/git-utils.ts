// Shared git plumbing for the workspace-manage kernel. Each helper is
// stdlib-first (execFile, no shell) and returns structured data.

import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { IGNORE_DIR_NAMES, type BranchSummary, type WorktreeSummary } from "./types.js";

const execFileP = promisify(execFile);

export interface RunResult {
	stdout: string;
	stderr: string;
	code: number;
}

export async function git(repo: string, args: string[], timeoutMs = 8000): Promise<RunResult> {
	try {
		const { stdout, stderr } = await execFileP("git", ["-C", repo, ...args], {
			timeout: timeoutMs,
			maxBuffer: 8 * 1024 * 1024,
		});
		return { stdout: stdout.toString(), stderr: stderr.toString(), code: 0 };
	} catch (err) {
		const e = err as NodeJS.ErrnoException & { stdout?: Buffer | string; stderr?: Buffer | string; code?: number };
		const stdout = e.stdout ? e.stdout.toString() : "";
		const stderr = e.stderr ? e.stderr.toString() : (e.message ?? "");
		const code = typeof e.code === "number" ? e.code : 1;
		return { stdout, stderr, code };
	}
}

export async function isGitRepo(dir: string): Promise<boolean> {
	try {
		const s = await fs.lstat(path.join(dir, ".git"));
		return s.isDirectory() || s.isFile();
	} catch {
		return false;
	}
}

// Walk a top-level directory and return absolute paths to every immediate
// child that is a git repo. Mirrors the IGNORE set used by the audit kernel.
// Resolves symlinks so that repo paths compare-equal to the values git
// reports via `worktree list --porcelain` (git canonicalizes its own paths).
export async function listGitRepos(root: string): Promise<string[]> {
	let entries: import("node:fs").Dirent[];
	try {
		entries = await fs.readdir(root, { withFileTypes: true });
	} catch {
		return [];
	}
	const out: string[] = [];
	const seen = new Set<string>();
	for (const e of entries) {
		if (IGNORE_DIR_NAMES.has(e.name)) continue;
		if (!e.isDirectory() && !e.isSymbolicLink()) continue;
		const dir = path.join(root, e.name);
		if (await isGitRepo(dir)) {
			let resolved = dir;
			try {
				resolved = await fs.realpath(dir);
			} catch {
				resolved = dir;
			}
			if (seen.has(resolved)) continue; // dedupe symlinked clones
			seen.add(resolved);
			out.push(resolved);
		}
	}
	return out;
}

export async function defaultBranch(repo: string): Promise<string | null> {
	for (const cand of ["main", "master"]) {
		const r = await git(repo, ["rev-parse", "--verify", cand]);
		if (r.code === 0) return cand;
	}
	return null;
}

export async function currentBranch(repo: string): Promise<string | null> {
	const r = await git(repo, ["rev-parse", "--abbrev-ref", "HEAD"]);
	if (r.code !== 0) return null;
	const name = r.stdout.trim();
	if (!name || name === "HEAD") return null;
	return name;
}

// `true` if the worktree has uncommitted changes.
export async function isDirty(repo: string): Promise<boolean> {
	const r = await git(repo, ["status", "--porcelain"]);
	if (r.code !== 0) return false;
	return r.stdout.trim().length > 0;
}

export async function originUrl(repo: string): Promise<string | null> {
	const r = await git(repo, ["config", "--get", "remote.origin.url"]);
	if (r.code !== 0) return null;
	const u = r.stdout.trim();
	return u || null;
}

export async function listLocalBranches(repo: string): Promise<BranchSummary[]> {
	const r = await git(repo, [
		"for-each-ref",
		"--format=%(refname:short)|%(upstream:short)|%(upstream:track)",
		"refs/heads",
	]);
	if (r.code !== 0) return [];
	const out: BranchSummary[] = [];
	for (const line of r.stdout.split("\n")) {
		if (!line.trim()) continue;
		const [name, upstream, track] = line.split("|");
		const aheadM = (track ?? "").match(/ahead (\d+)/);
		const behindM = (track ?? "").match(/behind (\d+)/);
		out.push({
			name: name ?? "",
			upstream: upstream && upstream.length > 0 ? upstream : null,
			upstream_gone: (track ?? "").includes("gone"),
			ahead: aheadM ? Number(aheadM[1]) : 0,
			behind: behindM ? Number(behindM[1]) : 0,
		});
	}
	return out;
}

export async function listWorktrees(repo: string): Promise<WorktreeSummary[]> {
	const r = await git(repo, ["worktree", "list", "--porcelain"]);
	if (r.code !== 0) return [];
	const out: WorktreeSummary[] = [];
	let cur: { path: string; branch: string | null; prunable: boolean } | null = null;
	for (const line of r.stdout.split("\n")) {
		if (line.startsWith("worktree ")) {
			if (cur) out.push(await materializeWorktree(cur));
			cur = { path: line.slice("worktree ".length).trim(), branch: null, prunable: false };
		} else if (cur && line.startsWith("branch ")) {
			cur.branch = line.slice("branch ".length).trim();
		} else if (cur && line.startsWith("prunable")) {
			cur.prunable = true;
		}
	}
	if (cur) out.push(await materializeWorktree(cur));
	return out;
}

async function materializeWorktree(
	cur: { path: string; branch: string | null; prunable: boolean },
): Promise<WorktreeSummary> {
	let exists = true;
	try {
		const s = await fs.stat(cur.path);
		exists = s.isDirectory();
	} catch {
		exists = false;
	}
	return { path: cur.path, branch: cur.branch, exists, prunable: cur.prunable };
}

export function repoName(repo: string): string {
	return path.basename(repo);
}
