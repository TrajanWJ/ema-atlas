// Audits "unborn" project records in Projects/.
//
// An unborn project is a directory under Projects/ that:
//   - is a git repo (has a `.git` dir / file), AND
//   - has no commits yet (HEAD does not resolve)
//
// Today's session created first commits in 4 such repos. Future repos
// dropped under Projects/ should be detected and brought to the operator's
// attention so they get a baseline commit + a remote.
//
// Class B (B because it requires `--with-branches` to autofix; we won't
// touch git state in default --apply mode).

import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AuditContext, ModuleResult } from "./types.js";

const execFileP = promisify(execFile);

async function isDir(p: string): Promise<boolean> {
	try {
		const s = await fs.stat(p);
		return s.isDirectory();
	} catch {
		return false;
	}
}

async function isGitRepo(dir: string): Promise<boolean> {
	const gitPath = path.join(dir, ".git");
	try {
		const s = await fs.lstat(gitPath);
		return s.isDirectory() || s.isFile();
	} catch {
		return false;
	}
}

// `git rev-parse HEAD` exits non-zero on an unborn HEAD.
async function hasCommits(dir: string): Promise<boolean> {
	try {
		await execFileP("git", ["-C", dir, "rev-parse", "--verify", "HEAD"], {
			timeout: 5000,
		});
		return true;
	} catch {
		return false;
	}
}

export async function audit(ctx: AuditContext): Promise<ModuleResult> {
	const t0 = Date.now();
	const findings: ModuleResult["findings"] = [];

	let entries: import("node:fs").Dirent[];
	try {
		entries = await fs.readdir(ctx.projectsRoot, { withFileTypes: true });
	} catch {
		return { category: "unborn-projects", findings, scan_ms: ctx.verbose ? Date.now() - t0 : undefined };
	}

	for (const e of entries) {
		if (!e.isDirectory()) continue;
		if (e.name.startsWith(".") || e.name === "_archive") continue;
		const dir = path.join(ctx.projectsRoot, e.name);
		if (!(await isDir(dir))) continue;
		if (!(await isGitRepo(dir))) continue;
		if (await hasCommits(dir)) continue;
		findings.push({
			category: "unborn-projects",
			severity: "warn",
			fix_class: "B",
			id: `unborn:${e.name}`,
			path: dir,
			note: `Projects/${e.name} is a git repo with no commits (unborn HEAD)`,
			suggested_fix: `cd "${dir}" && git add -A && git commit -m "init: ${e.name}"`,
			requires_flag: "with-branches",
		});
	}

	return {
		category: "unborn-projects",
		findings,
		scan_ms: ctx.verbose ? Date.now() - t0 : undefined,
	};
}
