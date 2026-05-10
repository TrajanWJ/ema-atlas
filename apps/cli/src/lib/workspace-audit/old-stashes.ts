// Audits old `git stash` entries across repos under Active builds/.
//
// Stashes older than 30 days are nearly always either (a) recoverable
// material that should become a branch, or (b) abandoned debris. We flag
// both, never auto-drop.
//
// Class B (drop only under `--with-stash`).

import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AuditContext, ModuleResult } from "./types.js";

const execFileP = promisify(execFile);

const STALE_MS = 30 * 24 * 60 * 60 * 1000;

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

interface StashEntry {
	ref: string;
	subject: string;
	timestamp: number;
}

async function listStashes(repo: string): Promise<StashEntry[]> {
	try {
		const { stdout } = await execFileP(
			"git",
			["-C", repo, "stash", "list", "--format=%gd|%ct|%gs"],
			{ timeout: 5000 },
		);
		const out: StashEntry[] = [];
		for (const line of stdout.split("\n")) {
			if (!line.trim()) continue;
			const [ref, ts, ...rest] = line.split("|");
			const subject = rest.join("|");
			const timestamp = Number(ts) * 1000;
			if (!ref || !Number.isFinite(timestamp)) continue;
			out.push({ ref, subject: subject.trim(), timestamp });
		}
		return out;
	} catch {
		return [];
	}
}

export async function audit(ctx: AuditContext): Promise<ModuleResult> {
	const t0 = Date.now();
	const findings: ModuleResult["findings"] = [];
	const now = Date.now();
	const repos = await listGitRepos(ctx.activeBuildsRoot);

	for (const repo of repos) {
		const stashes = await listStashes(repo);
		for (const s of stashes) {
			const age = now - s.timestamp;
			if (age < STALE_MS) continue;
			const ageDays = Math.floor(age / (24 * 60 * 60 * 1000));
			findings.push({
				category: "old-stashes",
				severity: "info",
				fix_class: "B",
				id: `stash:${repo}:${s.ref}`,
				path: repo,
				note: `${path.basename(repo)} ${s.ref} is ${ageDays}d old: "${s.subject}"`,
				suggested_fix: `Promote to branch (git stash branch <name> ${s.ref}) or drop with --with-stash`,
				requires_flag: "with-stash",
			});
		}
	}

	return {
		category: "old-stashes",
		findings,
		scan_ms: ctx.verbose ? Date.now() - t0 : undefined,
	};
}

export async function dropStash(repo: string, ref: string): Promise<void> {
	await execFileP("git", ["-C", repo, "stash", "drop", ref], { timeout: 5000 });
}
