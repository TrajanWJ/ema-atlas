// Audits "untracked daemon-relevant files" — repo files at the root of any
// EMA-relevant active build that look load-bearing but aren't committed.
//
// Heuristic: at the top level of `Active builds/EMA-*/`, any file ending in
// `.md`, `.ts`, `.json`, `.toml`, or `.sh` that is untracked and not in
// `.gitignore`. These are common when ad-hoc capture files get dropped at
// the root and then forgotten.
//
// Class C — never auto-delete; intent must be confirmed.

import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AuditContext, ModuleResult } from "./types.js";

const execFileP = promisify(execFile);

const RELEVANT_EXT = new Set([".md", ".ts", ".tsx", ".json", ".toml", ".sh", ".mjs"]);

async function listEmaBuilds(activeRoot: string): Promise<string[]> {
	try {
		const entries = await fs.readdir(activeRoot, { withFileTypes: true });
		return entries
			.filter((e) => e.isDirectory() && /^EMA-/i.test(e.name))
			.map((e) => path.join(activeRoot, e.name));
	} catch {
		return [];
	}
}

async function untrackedRootFiles(repo: string): Promise<string[]> {
	try {
		const { stdout } = await execFileP(
			"git",
			["-C", repo, "status", "--porcelain", "--untracked-files=normal"],
			{ timeout: 5000 },
		);
		const out: string[] = [];
		for (const line of stdout.split("\n")) {
			if (!line.startsWith("??")) continue;
			const rel = line.slice(3).trim();
			// Only top-level (no path separator).
			if (rel.includes("/")) continue;
			if (rel.startsWith(".")) continue; // hidden -- skip
			out.push(rel);
		}
		return out;
	} catch {
		return [];
	}
}

export async function audit(ctx: AuditContext): Promise<ModuleResult> {
	const t0 = Date.now();
	const findings: ModuleResult["findings"] = [];
	const builds = await listEmaBuilds(ctx.activeBuildsRoot);
	for (const repo of builds) {
		const files = await untrackedRootFiles(repo);
		for (const rel of files) {
			const ext = path.extname(rel).toLowerCase();
			if (!RELEVANT_EXT.has(ext)) continue;
			findings.push({
				category: "untracked-cruft",
				severity: "info",
				fix_class: "C",
				id: `untracked:${repo}:${rel}`,
				path: path.join(repo, rel),
				note: `Untracked top-level ${ext} file in ${path.basename(repo)}: ${rel}`,
				suggested_fix: `Decide: commit, gitignore, or delete`,
			});
		}
	}
	return {
		category: "untracked-cruft",
		findings,
		scan_ms: ctx.verbose ? Date.now() - t0 : undefined,
	};
}
