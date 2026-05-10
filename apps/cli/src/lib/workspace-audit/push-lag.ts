// Audits push-lag — local branches with commits ahead of their tracking
// remote (i.e. work that exists on this device only).
//
// Class C — never auto-pushes. Operator must opt in (`--with-remotes` is
// reserved for *fetch* parity in a future revision; we never push silently).

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

interface AheadInfo {
	branch: string;
	upstream: string;
	ahead: number;
}

async function aheadBranches(repo: string): Promise<AheadInfo[]> {
	try {
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
		const out: AheadInfo[] = [];
		for (const line of stdout.split("\n")) {
			if (!line.trim()) continue;
			const [name, upstream, track] = line.split("|");
			if (!upstream) continue; // no tracking branch — separate concern
			const m = (track ?? "").match(/ahead (\d+)/);
			if (!m) continue;
			out.push({
				branch: name ?? "",
				upstream: upstream ?? "",
				ahead: Number(m[1]),
			});
		}
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
		const ahead = await aheadBranches(repo);
		for (const a of ahead) {
			findings.push({
				category: "push-lag",
				severity: a.ahead >= 5 ? "warn" : "info",
				fix_class: "C",
				id: `ahead:${repo}:${a.branch}`,
				path: repo,
				note: `${path.basename(repo)} ${a.branch} is ${a.ahead} commits ahead of ${a.upstream}`,
				suggested_fix: `git -C "${repo}" push (operator-driven; no --apply path)`,
			});
		}
	}
	return {
		category: "push-lag",
		findings,
		scan_ms: ctx.verbose ? Date.now() - t0 : undefined,
	};
}
