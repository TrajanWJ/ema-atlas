// Audits wiki / doc-registry coverage:
//   1. Files referenced by the doc-registry (path metadata) that no longer
//      exist on disk.
//   2. Wiki entries missing canonical IDs.
//
// The doc-registry lives at `docs/registry/registry.json` (or .yaml). We do
// a best-effort load; if it doesn't exist, the module reports skipped.
//
// Class C — never auto-fix; registry mutations belong to canon work.

import { promises as fs } from "node:fs";
import path from "node:path";
import type { AuditContext, ModuleResult } from "./types.js";

interface RegistryEntry {
	id?: string;
	path?: string;
	[k: string]: unknown;
}

async function loadRegistry(emaRoot: string): Promise<RegistryEntry[] | null> {
	const candidates = [
		path.join(emaRoot, "docs/registry/registry.json"),
		path.join(emaRoot, "docs/registry.json"),
		path.join(emaRoot, "packages/doc-registry/registry.json"),
	];
	for (const p of candidates) {
		try {
			const raw = await fs.readFile(p, "utf8");
			const parsed = JSON.parse(raw) as unknown;
			if (Array.isArray(parsed)) return parsed as RegistryEntry[];
			if (parsed && typeof parsed === "object") {
				const record = parsed as { entries?: RegistryEntry[]; documents?: RegistryEntry[] };
				if (Array.isArray(record.entries)) return record.entries;
				if (Array.isArray(record.documents)) return record.documents;
			}
		} catch {
			// next
		}
	}
	return null;
}

async function exists(p: string): Promise<boolean> {
	try {
		await fs.stat(p);
		return true;
	} catch {
		return false;
	}
}

export async function audit(ctx: AuditContext): Promise<ModuleResult> {
	const t0 = Date.now();
	const findings: ModuleResult["findings"] = [];
	const registry = await loadRegistry(ctx.emaRoot);
	if (!registry) {
		return {
			category: "wiki-coverage",
			skipped: true,
			skip_reason: "no doc-registry found at any known path",
			findings: [],
			scan_ms: ctx.verbose ? Date.now() - t0 : undefined,
		};
	}
	for (const e of registry) {
		if (!e || typeof e !== "object") continue;
		if (!e.id) {
			findings.push({
				category: "wiki-coverage",
				severity: "warn",
				fix_class: "C",
				id: `wiki-no-id:${e.path ?? "<no-path>"}`,
				path: e.path,
				note: `Doc-registry entry missing canonical id (${e.path ?? "<no-path>"})`,
				suggested_fix: `Assign a stable id in registry.json`,
			});
		}
		if (e.path) {
			const abs = path.isAbsolute(e.path) ? e.path : path.join(ctx.emaRoot, e.path);
			if (!(await exists(abs))) {
				findings.push({
					category: "wiki-coverage",
					severity: "error",
					fix_class: "C",
					id: `wiki-missing:${e.id ?? e.path}`,
					path: abs,
					note: `Doc-registry references missing file: ${e.path}`,
					suggested_fix: `Restore the file or remove the entry`,
				});
			}
		}
	}
	return {
		category: "wiki-coverage",
		findings,
		scan_ms: ctx.verbose ? Date.now() - t0 : undefined,
	};
}
