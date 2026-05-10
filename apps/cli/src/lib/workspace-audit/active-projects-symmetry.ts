// Audits Active builds/<X> ↔ Projects/<X> symmetry.
//
// Every directory in `Active builds/` should have a matching record in
// `Projects/` (where past versions and atlases live). Asymmetry today
// surfaces as: in-flight code without a project home (orphan code), or a
// project record with no in-flight scratchpad (stale project).
//
// We do NOT auto-fix this; correct resolution requires operator judgement
// (e.g. is this an experimental fork that should not be promoted?). We
// only flag.

import { promises as fs } from "node:fs";
import path from "node:path";
import type { AuditContext, ModuleResult } from "./types.js";

const IGNORE = new Set([
	".DS_Store",
	"README.md",
	".git",
	"_archive",
	"_archive_old",
]);

// Some entries in Active builds are symlinks (e.g. "life-manager 2"
// pointing at ~/lm) — we look at the symlink-resolved name.
async function listDirs(root: string): Promise<string[]> {
	let entries: import("node:fs").Dirent[];
	try {
		entries = await fs.readdir(root, { withFileTypes: true });
	} catch {
		return [];
	}
	const out: string[] = [];
	for (const e of entries) {
		if (IGNORE.has(e.name)) continue;
		if (e.isDirectory() || e.isSymbolicLink()) out.push(e.name);
	}
	return out;
}

// Strip an EMA-style version suffix (e.g. "EMA-0.0.6" → "EMA").
function canonicalProjectName(name: string): string {
	// EMA-0.0.6 / proslync-0.1.0 etc.
	const m = name.match(/^(.+?)-\d+\.\d+\.\d+$/);
	return m ? m[1] : name;
}

export async function audit(ctx: AuditContext): Promise<ModuleResult> {
	const t0 = Date.now();
	const active = await listDirs(ctx.activeBuildsRoot);
	const projects = await listDirs(ctx.projectsRoot);
	const findings: ModuleResult["findings"] = [];

	const projectSet = new Set(projects);
	for (const name of active) {
		const canon = canonicalProjectName(name);
		// Match by raw name OR by canonical (versioned forms collapse).
		if (projectSet.has(name) || projectSet.has(canon)) continue;
		findings.push({
			category: "active-projects-symmetry",
			severity: "warn",
			fix_class: "C",
			id: `orphan-active:${name}`,
			path: path.join(ctx.activeBuildsRoot, name),
			note: `Active build "${name}" has no Projects/ entry`,
			suggested_fix: `Either promote to Projects/${canon} or move under Active builds/_archive/`,
		});
	}

	const activeCanonSet = new Set(active.map(canonicalProjectName));
	const activeRawSet = new Set(active);
	for (const name of projects) {
		if (activeRawSet.has(name) || activeCanonSet.has(name)) continue;
		findings.push({
			category: "active-projects-symmetry",
			severity: "info",
			fix_class: "C",
			id: `dormant-project:${name}`,
			path: path.join(ctx.projectsRoot, name),
			note: `Project "${name}" has no in-flight Active builds entry`,
			suggested_fix: `Either spin up Active builds/${name} or accept dormant status`,
		});
	}

	return {
		category: "active-projects-symmetry",
		findings,
		scan_ms: ctx.verbose ? Date.now() - t0 : undefined,
	};
}
