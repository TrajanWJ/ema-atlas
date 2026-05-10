// Audits `.DS_Store` infestation across the desktop workspace surface plus
// also flags empty top-level directories on the desktop (Finder leaves
// these behind frequently).
//
// Class A — both deletions are the canonical safe-to-fix category.

import { promises as fs } from "node:fs";
import path from "node:path";
import type { AuditContext, ModuleResult } from "./types.js";

const SKIP_DIR = new Set([
	"node_modules",
	".git",
	"_build",
	".next",
	"dist",
	"build",
	".turbo",
	".cache",
	".pnpm-store",
	"target",
]);

async function walkForDsStore(root: string, maxDepth: number): Promise<string[]> {
	const out: string[] = [];
	async function recurse(dir: string, depth: number): Promise<void> {
		if (depth > maxDepth) return;
		let entries: import("node:fs").Dirent[];
		try {
			entries = await fs.readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const e of entries) {
			if (e.name === ".DS_Store") {
				out.push(path.join(dir, e.name));
				continue;
			}
			if (e.isDirectory()) {
				if (SKIP_DIR.has(e.name)) continue;
				if (e.name.startsWith(".")) continue;
				await recurse(path.join(dir, e.name), depth + 1);
			}
		}
	}
	await recurse(root, 0);
	return out;
}

async function findEmptyDesktopDirs(desktopRoot: string): Promise<string[]> {
	const out: string[] = [];
	let entries: import("node:fs").Dirent[];
	try {
		entries = await fs.readdir(desktopRoot, { withFileTypes: true });
	} catch {
		return out;
	}
	for (const e of entries) {
		if (!e.isDirectory()) continue;
		if (e.name.startsWith(".")) continue;
		// Known top-level fixtures we never touch.
		if (
			e.name === "Active builds" ||
			e.name === "Projects" ||
			e.name === "inbox"
		)
			continue;
		const dir = path.join(desktopRoot, e.name);
		try {
			const sub = await fs.readdir(dir);
			// "Empty" = zero entries OR only a `.DS_Store`.
			if (sub.length === 0 || (sub.length === 1 && sub[0] === ".DS_Store")) {
				out.push(dir);
			}
		} catch {
			// unreadable -- skip
		}
	}
	return out;
}

export async function audit(ctx: AuditContext): Promise<ModuleResult> {
	const t0 = Date.now();
	const findings: ModuleResult["findings"] = [];

	for (const root of [ctx.desktopRoot, ctx.activeBuildsRoot, ctx.projectsRoot]) {
		const depth = root === ctx.desktopRoot ? 1 : 4;
		const hits = await walkForDsStore(root, depth);
		for (const p of hits) {
			findings.push({
				category: "ds-store",
				severity: "info",
				fix_class: "A",
				id: `ds:${p}`,
				path: p,
				note: `.DS_Store at ${p}`,
				suggested_fix: `rm "${p}"`,
			});
		}
	}

	const emptyDirs = await findEmptyDesktopDirs(ctx.desktopRoot);
	for (const p of emptyDirs) {
		findings.push({
			category: "ds-store",
			severity: "info",
			fix_class: "A",
			id: `empty-dir:${p}`,
			path: p,
			note: `Empty top-level desktop dir: ${p}`,
			suggested_fix: `rmdir "${p}"`,
		});
	}

	return {
		category: "ds-store",
		findings,
		scan_ms: ctx.verbose ? Date.now() - t0 : undefined,
	};
}

export async function removePath(p: string): Promise<void> {
	const st = await fs.lstat(p);
	if (st.isDirectory()) {
		// Refuse to recurse — only rmdir empty directories.
		await fs.rmdir(p);
	} else {
		await fs.unlink(p);
	}
}
