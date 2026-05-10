// Audits naming drift in Active builds/ and Projects/.
//
// Drift patterns we have hit and want to detect automatically:
//   - " 2", " 3", " copy", " backup" suffixes (Finder duplication)
//   - mixed case where a sibling has the same lowercase name
//   - whitespace-prefixed/suffixed names
//   - uppercase / non-kebab project IDs in `Projects/` (canonical convention
//     is `kebab-case`).
//
// All findings are Class C (manual rename — never auto-rename to avoid
// breaking absolute paths the operator may have linked elsewhere).

import { promises as fs } from "node:fs";
import path from "node:path";
import type { AuditContext, ModuleResult } from "./types.js";

const IGNORE = new Set([".DS_Store", "README.md", ".git", "_archive"]);

async function listEntries(root: string): Promise<string[]> {
	try {
		const entries = await fs.readdir(root, { withFileTypes: true });
		return entries
			.filter((e) => !IGNORE.has(e.name))
			.filter((e) => e.isDirectory() || e.isSymbolicLink())
			.map((e) => e.name);
	} catch {
		return [];
	}
}

const DUP_SUFFIX = / (?:\d+|copy|backup|old|final|FINAL|tmp|temp|TEMP|new|NEW)$/;

export async function audit(ctx: AuditContext): Promise<ModuleResult> {
	const t0 = Date.now();
	const findings: ModuleResult["findings"] = [];

	for (const root of [ctx.activeBuildsRoot, ctx.projectsRoot]) {
		const names = await listEntries(root);
		const lowerMap = new Map<string, string[]>();
		for (const n of names) {
			const lc = n.toLowerCase();
			const arr = lowerMap.get(lc) ?? [];
			arr.push(n);
			lowerMap.set(lc, arr);
		}
		for (const n of names) {
			// Whitespace at edges — almost always accidental.
			if (n !== n.trim()) {
				findings.push({
					category: "naming-drift",
					severity: "warn",
					fix_class: "C",
					id: `whitespace:${root}:${n}`,
					path: path.join(root, n),
					note: `Directory name has leading/trailing whitespace: "${n}"`,
					suggested_fix: `Rename to "${n.trim()}"`,
				});
			}
			// Finder-style duplicate suffix.
			if (DUP_SUFFIX.test(n)) {
				findings.push({
					category: "naming-drift",
					severity: "warn",
					fix_class: "C",
					id: `dup-suffix:${root}:${n}`,
					path: path.join(root, n),
					note: `Directory name carries duplicate-style suffix: "${n}"`,
					suggested_fix: `Confirm intent; rename or move into _archive/`,
				});
			}
			// Mixed-case collision with another sibling.
			const lc = n.toLowerCase();
			const siblings = lowerMap.get(lc) ?? [];
			if (siblings.length > 1) {
				findings.push({
					category: "naming-drift",
					severity: "error",
					fix_class: "C",
					id: `case-collision:${root}:${lc}`,
					path: root,
					note: `Case-insensitive collision: ${siblings.join(", ")}`,
					suggested_fix: `Pick one canonical name; case-folding filesystems break here`,
				});
			}
		}

		// Projects/ specifically: enforce kebab-case.
		if (root === ctx.projectsRoot) {
			for (const n of names) {
				if (/[A-Z\s_]/.test(n)) {
					findings.push({
						category: "naming-drift",
						severity: "info",
						fix_class: "C",
						id: `non-kebab:${n}`,
						path: path.join(root, n),
						note: `Project "${n}" is not kebab-case`,
						suggested_fix: `Rename to ${n.replace(/[\s_]+/g, "-").toLowerCase()}`,
					});
				}
			}
		}
	}

	// Dedupe (case-collision is reported once per pair).
	const seen = new Set<string>();
	const unique = findings.filter((f) => {
		if (seen.has(f.id)) return false;
		seen.add(f.id);
		return true;
	});

	return {
		category: "naming-drift",
		findings: unique,
		scan_ms: ctx.verbose ? Date.now() - t0 : undefined,
	};
}
