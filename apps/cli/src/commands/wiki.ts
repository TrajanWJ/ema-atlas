import { promises as fs } from "node:fs";
import path from "node:path";

import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { DESKTOP_ROOT } from "../workspace-state.js";

const REGISTRY_PATH =
	process.env.WIKI_REGISTRY?.trim() ||
	path.join(
		DESKTOP_ROOT,
		"Projects",
		"EMA",
		"atlas",
		"knowledge",
		"doc-registry.json",
	);
const ATLAS_ROOT = path.join(DESKTOP_ROOT, "Projects", "EMA", "atlas");

type RegistryDoc = {
	readonly path: string;
	readonly title?: string;
	readonly project?: string | null;
	readonly tags?: readonly string[];
	readonly description?: string;
};

type WikiRegistry = {
	readonly schema_version?: number;
	readonly description?: string;
	readonly path_root?: string;
	readonly id_schema?: string;
	readonly namespaces?: Readonly<Record<string, string>>;
	readonly docs: Readonly<Record<string, RegistryDoc>>;
};

type RegistryRow = RegistryDoc & {
	readonly id: string;
	readonly absolute_path: string;
	readonly exists: boolean;
};

type RegistryIssue = {
	readonly kind: "missing_path" | "read_error" | "id_mismatch";
	readonly id: string;
	readonly path: string;
	readonly stamped?: string;
	readonly message?: string;
};

type Backlink = {
	readonly id: string;
	readonly via: "see-also" | "wikilink";
	readonly path: string;
};

export async function runWiki(args: ParsedArgs): Promise<number> {
	const verb = args.positional[0];
	if (
		flagBool(args, "help") ||
		args.flags.h === true ||
		verb === undefined ||
		verb === "help"
	) {
		return runHelp(args);
	}
	if (verb === "list") return runList(args);
	if (verb === "search") return runSearch(args);
	if (verb === "get" || verb === "show") return runGet(args);
	if (verb === "resolve") return runResolve(args);
	if (verb === "path") return runPath(args);
	if (verb === "backlinks") return runBacklinks(args);
	if (verb === "check") return runCheck(args);
	if (verb === "dump") return runDump(args);
	emitError(
		`ema wiki: unknown subcommand "${verb}" (expected: list | search | get | resolve | path | backlinks | check | dump)`,
	);
	return 64;
}

async function runHelp(args: ParsedArgs): Promise<number> {
	const json = flagBool(args, "json");
	const body = {
		ok: true,
		noun: "wiki",
		status: "doc_registry",
		source: "doc_registry",
		registry_path: REGISTRY_PATH,
		workspace_root: DESKTOP_ROOT,
		commands: [
			"ema wiki list [--limit 20] [--ns N] [--tag T] [--project P] [--json]",
			"ema wiki search --query <text> [--limit 10] [--json]",
			"ema wiki get <wiki-id> [--json]",
			"ema wiki resolve <wiki-id> [--json]",
			"ema wiki path <absolute-or-workspace-relative-path> [--json]",
			"ema wiki backlinks <wiki-id> [--json]",
			"ema wiki check [--json]",
			"ema wiki dump [--json]",
		],
		wikilinks: [
			"[[namespace:slug]]",
			"<!-- wiki-id: namespace:slug -->",
			"<!-- see-also: id1, id2, id3 -->",
		],
	};
	if (json) emitJson(body);
	else {
		emitPretty("ema wiki — registry-backed markdown network");
		emitPretty(`registry: ${REGISTRY_PATH}`);
		emitPretty("Usage:");
		for (const command of body.commands) emitPretty(`  ${command}`);
		emitPretty("");
		emitPretty("Native links:");
		for (const link of body.wikilinks) emitPretty(`  ${link}`);
	}
	return 0;
}

async function runList(args: ParsedArgs): Promise<number> {
	const json = flagBool(args, "json");
	const limit = parseLimit(args, 30);
	const rows = filterRows(await registryRows(), args).slice(0, limit);
	if (json) {
		emitJson({
			ok: true,
			command: "wiki list",
			source: "doc_registry",
			registry_path: REGISTRY_PATH,
			docs: rows,
		});
	} else {
		emitPretty("# wiki list  (source: doc_registry)");
		const width = Math.max(...rows.map((row) => row.id.length), 10);
		for (const row of rows) {
			emitPretty(`${row.id.padEnd(width)}  ${row.title ?? "(untitled)"}`);
		}
	}
	return 0;
}

async function runSearch(args: ParsedArgs): Promise<number> {
	const json = flagBool(args, "json");
	const query = flagString(args, "query") ?? args.positional.slice(1).join(" ");
	if (!query.trim()) {
		emitError("ema wiki search: --query is required");
		return 64;
	}
	const limit = parseLimit(args, 10);
	const q = query.toLowerCase();
	const rows = (await registryRows())
		.map((row) => ({ row, score: scoreRow(row, q) }))
		.filter((item) => item.score > 0)
		.sort((a, b) => b.score - a.score || a.row.id.localeCompare(b.row.id))
		.slice(0, limit)
		.map((item) => item.row);
	if (json) {
		emitJson({
			ok: true,
			command: "wiki search",
			source: "doc_registry",
			registry_path: REGISTRY_PATH,
			query,
			docs: rows,
		});
	} else {
		emitPretty(`# wiki search "${query}"`);
		const width = Math.max(...rows.map((row) => row.id.length), 10);
		for (const row of rows) {
			emitPretty(`${row.id.padEnd(width)}  ${row.title ?? "(untitled)"}`);
			if (row.description) emitPretty(`  ${row.description}`);
		}
	}
	return 0;
}

async function runGet(args: ParsedArgs): Promise<number> {
	const json = flagBool(args, "json");
	const target = flagString(args, "id") ?? args.positional[1];
	const relPath = flagString(args, "path");
	if (!target && !relPath) {
		emitError("ema wiki get: <wiki-id> or --path is required");
		return 64;
	}

	const registry = await loadRegistry();
	const row = target
		? rowForId(registry, target)
		: rowForPath(registry, relPath ?? "");
	if (row) {
		return emitDocContent(json, row);
	}

	if (relPath) return emitAtlasPath(json, relPath);

	emitError(`ema wiki get: unknown id "${target}"`);
	return 1;
}

async function runResolve(args: ParsedArgs): Promise<number> {
	const json = flagBool(args, "json");
	const id = args.positional[1];
	if (!id) {
		emitError("ema wiki resolve: <wiki-id> is required");
		return 64;
	}
	const registry = await loadRegistry();
	const row = rowForId(registry, id);
	if (!row) {
		emitError(`ema wiki resolve: unknown id "${id}"`);
		if (json) {
			emitJson({
				ok: false,
				command: "wiki resolve",
				source: "doc_registry",
				id,
				error: "unknown_id",
			});
		}
		return 1;
	}
	const withExistence = await rowWithExistence(row);
	if (json) {
		emitJson({
			ok: withExistence.exists,
			command: "wiki resolve",
			source: "doc_registry",
			registry_path: REGISTRY_PATH,
			doc: withExistence,
		});
	} else {
		emitPretty(withExistence.absolute_path);
		if (!withExistence.exists) {
			emitError(
				`ema wiki resolve: WARNING path does not exist: ${withExistence.absolute_path}`,
			);
		}
	}
	return withExistence.exists ? 0 : 2;
}

async function runPath(args: ParsedArgs): Promise<number> {
	const json = flagBool(args, "json");
	const input = args.positional[1];
	if (!input) {
		emitError(
			"ema wiki path: <absolute-or-workspace-relative-path> is required",
		);
		return 64;
	}
	const registry = await loadRegistry();
	const row = rowForPath(registry, input);
	if (!row) {
		emitError(`ema wiki path: no registered id for ${input}`);
		if (json)
			emitJson({
				ok: false,
				command: "wiki path",
				source: "doc_registry",
				path: input,
			});
		return 1;
	}
	const withExistence = await rowWithExistence(row);
	if (json) {
		emitJson({
			ok: true,
			command: "wiki path",
			source: "doc_registry",
			registry_path: REGISTRY_PATH,
			doc: withExistence,
		});
	} else {
		emitPretty(withExistence.id);
	}
	return 0;
}

async function runBacklinks(args: ParsedArgs): Promise<number> {
	const json = flagBool(args, "json");
	const id = args.positional[1];
	if (!id) {
		emitError("ema wiki backlinks: <wiki-id> is required");
		return 64;
	}
	const registry = await loadRegistry();
	const row = rowForId(registry, id);
	if (!row) {
		emitError(`ema wiki backlinks: unknown id "${id}"`);
		return 1;
	}
	const backlinks = await findBacklinks(registry, id);
	if (json) {
		emitJson({
			ok: true,
			command: "wiki backlinks",
			source: "doc_registry",
			registry_path: REGISTRY_PATH,
			id,
			backlinks,
		});
	} else if (backlinks.length === 0) {
		emitPretty(`(no backlinks to ${id})`);
	} else {
		const width = Math.max(...backlinks.map((link) => link.id.length), 10);
		for (const link of backlinks)
			emitPretty(`${link.id.padEnd(width)}  via ${link.via}`);
	}
	return 0;
}

async function runCheck(args: ParsedArgs): Promise<number> {
	const json = flagBool(args, "json");
	const registry = await loadRegistry();
	const audit = await auditRegistry(registry);
	const ok = audit.issues.length === 0;
	if (json) {
		emitJson({
			ok,
			command: "wiki check",
			source: "doc_registry",
			registry_path: REGISTRY_PATH,
			entries: Object.keys(registry.docs).length,
			markdown_count: audit.markdownCount,
			stamped_count: audit.stamped.length,
			unstamped: audit.unstamped,
			issues: audit.issues,
		});
	} else {
		emitPretty(
			`wiki check: ${Object.keys(registry.docs).length} entries in registry`,
		);
		emitPretty("---");
		if (audit.missingCount === 0) emitPretty("  all paths resolve cleanly");
		for (const issue of audit.issues) {
			if (issue.kind === "missing_path")
				emitPretty(`  MISSING  ${issue.id}  (${issue.path})`);
			if (issue.kind === "read_error")
				emitPretty(`  READ-ERROR  ${issue.id}  ${issue.message ?? ""}`);
			if (issue.kind === "id_mismatch") {
				emitPretty(
					`  ID-MISMATCH  registered=${issue.id}  stamped=${issue.stamped}  (${issue.path})`,
				);
			}
		}
		emitPretty("---");
		emitPretty(
			`stamped:    ${audit.stamped.length} / ${audit.markdownCount} markdown docs`,
		);
		if (audit.unstamped.length > 0) {
			emitPretty(
				`unstamped:  ${audit.unstamped.length} docs (no <!-- wiki-id: ... --> at top)`,
			);
			for (const id of audit.unstamped) emitPretty(`  - ${id}`);
		}
		emitPretty("---");
		emitPretty(`issues: ${audit.issues.length}`);
	}
	return ok ? 0 : 1;
}

async function runDump(args: ParsedArgs): Promise<number> {
	const json = flagBool(args, "json");
	const registry = await loadRegistry();
	if (json) {
		emitJson({
			ok: true,
			command: "wiki dump",
			source: "doc_registry",
			registry,
		});
	} else {
		const rows = await registryRows();
		for (const row of rows) {
			emitPretty(row.id);
			emitPretty(`  path:    ${row.path}`);
			emitPretty(`  title:   ${row.title ?? "(untitled)"}`);
			emitPretty(`  project: ${row.project ?? "(workspace)"}`);
			emitPretty(`  tags:    ${(row.tags ?? []).join(",")}`);
			emitPretty("");
		}
	}
	return 0;
}

async function loadRegistry(): Promise<WikiRegistry> {
	try {
		const raw = await fs.readFile(REGISTRY_PATH, "utf8");
		const parsed = JSON.parse(raw) as WikiRegistry;
		return {
			...parsed,
			docs: parsed.docs ?? {},
		};
	} catch (err) {
		emitError(
			`ema wiki: registry unavailable at ${REGISTRY_PATH}: ${err instanceof Error ? err.message : String(err)}`,
		);
		throw err;
	}
}

async function registryRows(): Promise<RegistryRow[]> {
	const registry = await loadRegistry();
	const rows = await Promise.all(
		Object.entries(registry.docs).map(async ([id, doc]) =>
			rowWithExistence(toRow(id, doc)),
		),
	);
	return rows.sort((a, b) => a.id.localeCompare(b.id));
}

function filterRows(
	rows: readonly RegistryRow[],
	args: ParsedArgs,
): RegistryRow[] {
	const ns = flagString(args, "ns");
	const tag = flagString(args, "tag");
	const project = flagString(args, "project");
	return rows.filter((row) => {
		if (ns && !row.id.startsWith(`${ns}:`)) return false;
		if (tag && !(row.tags ?? []).includes(tag)) return false;
		if (project && row.project !== project) return false;
		return true;
	});
}

function rowForId(registry: WikiRegistry, id: string): RegistryRow | null {
	const doc = registry.docs[id];
	return doc ? toRow(id, doc) : null;
}

function rowForPath(registry: WikiRegistry, input: string): RegistryRow | null {
	const rel = workspaceRelativePath(input);
	if (!rel) return null;
	for (const [id, doc] of Object.entries(registry.docs)) {
		if (normalizePath(doc.path) === rel) return toRow(id, doc);
	}
	return null;
}

function toRow(id: string, doc: RegistryDoc): RegistryRow {
	const absolutePath = path.resolve(DESKTOP_ROOT, doc.path);
	return {
		...doc,
		id,
		absolute_path: absolutePath,
		exists: false,
	};
}

async function rowWithExistence(row: RegistryRow): Promise<RegistryRow> {
	return {
		...row,
		exists: await exists(row.absolute_path),
	};
}

async function emitDocContent(
	json: boolean,
	row: RegistryRow,
): Promise<number> {
	const withExistence = await rowWithExistence(row);
	if (!withExistence.exists) {
		emitError(
			`ema wiki get: path does not exist: ${withExistence.absolute_path}`,
		);
		if (json)
			emitJson({
				ok: false,
				command: "wiki get",
				source: "doc_registry",
				doc: withExistence,
			});
		return 2;
	}
	try {
		const content = await fs.readFile(withExistence.absolute_path, "utf8");
		if (json) {
			emitJson({
				ok: true,
				command: "wiki get",
				source: "doc_registry",
				registry_path: REGISTRY_PATH,
				doc: withExistence,
				content,
			});
		} else {
			emitPretty(`# ${withExistence.title ?? withExistence.id}`);
			emitPretty(`id: ${withExistence.id}`);
			emitPretty(`path: ${withExistence.absolute_path}`);
			if (withExistence.tags?.length)
				emitPretty(`tags: ${withExistence.tags.join(", ")}`);
			if (withExistence.description)
				emitPretty(`description: ${withExistence.description}`);
			emitPretty("");
			emitPretty(content);
		}
		return 0;
	} catch (err) {
		emitError(
			`ema wiki get: ${err instanceof Error ? err.message : String(err)}`,
		);
		return 1;
	}
}

async function emitAtlasPath(json: boolean, relPath: string): Promise<number> {
	const safePath = path.normalize(relPath).replace(/^(\.\.[/\\])+/, "");
	const absPath = path.resolve(ATLAS_ROOT, safePath);
	const rootWithSep = `${path.resolve(ATLAS_ROOT)}${path.sep}`;
	if (
		absPath !== path.resolve(ATLAS_ROOT) &&
		!absPath.startsWith(rootWithSep)
	) {
		emitError("ema wiki get: path must stay inside Projects/EMA/atlas");
		return 64;
	}
	try {
		const content = await fs.readFile(absPath, "utf8");
		if (json) {
			emitJson({
				ok: true,
				command: "wiki get",
				source: "atlas_file_fallback",
				path: safePath,
				absolute_path: absPath,
				content,
			});
		} else {
			emitPretty(content);
		}
		return 0;
	} catch (err) {
		emitError(
			`ema wiki get: ${err instanceof Error ? err.message : String(err)}`,
		);
		return 1;
	}
}

async function findBacklinks(
	registry: WikiRegistry,
	target: string,
): Promise<Backlink[]> {
	const links: Backlink[] = [];
	const seeAlsoRe = /<!--\s*see-also:\s*([^>]*?)\s*-->/g;
	const wikiLinkRe = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
	for (const [id, doc] of Object.entries(registry.docs)) {
		if (id === target) continue;
		const absPath = path.resolve(DESKTOP_ROOT, doc.path);
		if (!doc.path.endsWith(".md") || !(await exists(absPath))) continue;
		let text = "";
		try {
			text = await fs.readFile(absPath, "utf8");
		} catch {
			continue;
		}
		if (hasWikilink(text, target, wikiLinkRe)) {
			links.push({ id, via: "wikilink", path: absPath });
			continue;
		}
		if (hasSeeAlso(text.slice(0, 4_000), target, seeAlsoRe)) {
			links.push({ id, via: "see-also", path: absPath });
		}
	}
	return links.sort((a, b) => a.id.localeCompare(b.id));
}

function hasWikilink(
	text: string,
	target: string,
	wikiLinkRe: RegExp,
): boolean {
	wikiLinkRe.lastIndex = 0;
	for (const match of text.matchAll(wikiLinkRe)) {
		if (match[1]?.trim() === target) return true;
	}
	return false;
}

function hasSeeAlso(text: string, target: string, seeAlsoRe: RegExp): boolean {
	seeAlsoRe.lastIndex = 0;
	for (const match of text.matchAll(seeAlsoRe)) {
		const ids = (match[1] ?? "").split(",").map((part) => part.trim());
		if (ids.includes(target)) return true;
	}
	return false;
}

async function auditRegistry(registry: WikiRegistry): Promise<{
	readonly markdownCount: number;
	readonly missingCount: number;
	readonly stamped: readonly string[];
	readonly unstamped: readonly string[];
	readonly issues: readonly RegistryIssue[];
}> {
	const issues: RegistryIssue[] = [];
	const stamped: string[] = [];
	const unstamped: string[] = [];
	let markdownCount = 0;
	let missingCount = 0;
	const stampRe = /<!--\s*wiki-id:\s*([\w-]+:[\w-]+)\s*-->/;

	for (const [id, doc] of Object.entries(registry.docs)) {
		const absPath = path.resolve(DESKTOP_ROOT, doc.path);
		const existsPath = await exists(absPath);
		if (!existsPath) {
			missingCount += 1;
			issues.push({ kind: "missing_path", id, path: absPath });
			continue;
		}
		if (!doc.path.endsWith(".md")) continue;
		markdownCount += 1;
		try {
			const text = await fs.readFile(absPath, "utf8");
			const stamp = stampRe.exec(text.slice(0, 2_000))?.[1]?.trim();
			if (!stamp) {
				unstamped.push(id);
				continue;
			}
			stamped.push(id);
			if (stamp !== id)
				issues.push({ kind: "id_mismatch", id, path: absPath, stamped: stamp });
		} catch (err) {
			issues.push({
				kind: "read_error",
				id,
				path: absPath,
				message: err instanceof Error ? err.message : String(err),
			});
		}
	}

	return {
		markdownCount,
		missingCount,
		stamped: stamped.sort(),
		unstamped: unstamped.sort(),
		issues,
	};
}

function workspaceRelativePath(input: string): string | null {
	const absPath = path.isAbsolute(input)
		? path.resolve(input)
		: path.resolve(DESKTOP_ROOT, input);
	const rel = path.relative(DESKTOP_ROOT, absPath);
	if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
	return normalizePath(rel);
}

function normalizePath(input: string): string {
	return input.split(path.sep).join("/");
}

async function exists(absPath: string): Promise<boolean> {
	try {
		await fs.access(absPath);
		return true;
	} catch {
		return false;
	}
}

function scoreRow(row: RegistryRow, query: string): number {
	const haystack =
		`${row.id}\n${row.title ?? ""}\n${row.description ?? ""}\n${row.project ?? ""}\n${(row.tags ?? []).join(" ")}\n${row.path}`.toLowerCase();
	let score = 0;
	for (const term of query.split(/\s+/).filter(Boolean)) {
		if (row.id.toLowerCase().includes(term)) score += 12;
		if ((row.title ?? "").toLowerCase().includes(term)) score += 8;
		if (row.path.toLowerCase().includes(term)) score += 5;
		if (haystack.includes(term)) score += 1;
	}
	return score;
}

function parseLimit(args: ParsedArgs, fallback: number): number {
	const raw = flagString(args, "limit");
	if (!raw) return fallback;
	const parsed = Number(raw);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
