// Audits broken symlinks across the desktop workspace surface.
//
// We walk Active builds/ and Projects/ at depth ≤2 and report any symlink
// whose target does not resolve.
//
// Class A: deletion is safe (the link points nowhere). We still require
// `--apply` to delete; we do not silently rewrite or recreate targets.

import { promises as fs } from "node:fs";
import path from "node:path";
import type { AuditContext, ModuleResult } from "./types.js";

interface BrokenLink {
	linkPath: string;
	target: string;
}

async function walkForSymlinks(root: string, maxDepth: number): Promise<BrokenLink[]> {
	const out: BrokenLink[] = [];
	async function recurse(dir: string, depth: number): Promise<void> {
		if (depth > maxDepth) return;
		let entries: import("node:fs").Dirent[];
		try {
			entries = await fs.readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const e of entries) {
			const full = path.join(dir, e.name);
			if (e.isSymbolicLink()) {
				try {
					await fs.stat(full); // resolves through the link
				} catch {
					try {
						const target = await fs.readlink(full);
						out.push({ linkPath: full, target });
					} catch {
						// readlink failed; treat as broken
						out.push({ linkPath: full, target: "<unreadable>" });
					}
				}
			} else if (e.isDirectory()) {
				if (e.name === "node_modules" || e.name === ".git") continue;
				await recurse(full, depth + 1);
			}
		}
	}
	await recurse(root, 0);
	return out;
}

export async function audit(ctx: AuditContext): Promise<ModuleResult> {
	const t0 = Date.now();
	const findings: ModuleResult["findings"] = [];
	for (const root of [ctx.activeBuildsRoot, ctx.projectsRoot, ctx.desktopRoot]) {
		const broken = await walkForSymlinks(root, root === ctx.desktopRoot ? 1 : 2);
		for (const b of broken) {
			findings.push({
				category: "broken-symlinks",
				severity: "warn",
				fix_class: "A",
				id: `broken-link:${b.linkPath}`,
				path: b.linkPath,
				note: `Symlink target does not resolve: ${b.linkPath} → ${b.target}`,
				suggested_fix: `rm "${b.linkPath}" (or repoint to a live target)`,
			});
		}
	}
	return {
		category: "broken-symlinks",
		findings,
		scan_ms: ctx.verbose ? Date.now() - t0 : undefined,
	};
}

export async function removeLink(linkPath: string): Promise<void> {
	await fs.unlink(linkPath);
}
