// Audits cross-clone duplicates: multiple directories under Active builds/
// (or Projects/) that share the same `origin` git remote URL.
//
// Today we hit this when an alternate clone gets dropped on the desktop and
// the operator forgets which is canonical. Surfacing the duplicate lets
// the operator pick one and archive the rest.
//
// Class C — refuses to touch remotes / repos automatically.

import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AuditContext, ModuleResult } from "./types.js";

const execFileP = promisify(execFile);

async function listGitRepos(roots: string[]): Promise<string[]> {
	const out: string[] = [];
	for (const root of roots) {
		let entries: import("node:fs").Dirent[];
		try {
			entries = await fs.readdir(root, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const e of entries) {
			if (!e.isDirectory()) continue;
			if (e.name.startsWith(".") || e.name === "_archive") continue;
			const dir = path.join(root, e.name);
			try {
				const s = await fs.lstat(path.join(dir, ".git"));
				if (s.isDirectory() || s.isFile()) out.push(dir);
			} catch {
				// not git
			}
		}
	}
	return out;
}

async function originUrl(repo: string): Promise<string | null> {
	try {
		const { stdout } = await execFileP(
			"git",
			["-C", repo, "config", "--get", "remote.origin.url"],
			{ timeout: 5000 },
		);
		return stdout.trim() || null;
	} catch {
		return null;
	}
}

// Normalize git URLs so https/ssh forms collapse to the same identity.
function normalizeUrl(u: string): string {
	let url = u.trim().toLowerCase();
	url = url.replace(/\.git$/, "");
	// git@github.com:foo/bar  →  github.com/foo/bar
	url = url.replace(/^git@([^:]+):/, "$1/");
	// https://github.com/foo/bar  →  github.com/foo/bar
	url = url.replace(/^https?:\/\//, "");
	url = url.replace(/^ssh:\/\/[^/]+\//, "");
	return url;
}

export async function audit(ctx: AuditContext): Promise<ModuleResult> {
	const t0 = Date.now();
	const findings: ModuleResult["findings"] = [];
	const repos = await listGitRepos([ctx.activeBuildsRoot, ctx.projectsRoot]);

	const byUrl = new Map<string, string[]>();
	for (const repo of repos) {
		const url = await originUrl(repo);
		if (!url) continue;
		const key = normalizeUrl(url);
		const arr = byUrl.get(key) ?? [];
		arr.push(repo);
		byUrl.set(key, arr);
	}
	for (const [url, repos2] of byUrl) {
		if (repos2.length < 2) continue;
		findings.push({
			category: "cross-clone-dups",
			severity: "warn",
			fix_class: "C",
			id: `dup-clone:${url}`,
			path: repos2[0],
			note: `${repos2.length} clones share origin ${url}: ${repos2.map((r) => path.basename(r)).join(", ")}`,
			suggested_fix: `Pick one canonical clone; archive the others`,
		});
	}

	return {
		category: "cross-clone-dups",
		findings,
		scan_ms: ctx.verbose ? Date.now() - t0 : undefined,
	};
}
