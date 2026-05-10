#!/usr/bin/env node
/**
 * Project registry parity check.
 *
 * The Proslync project registry lives in two places — the CLI bundle at
 * `apps/cli/src/project-registry/proslync.ts` and the web mirror at
 * `apps/web/src/lib/project-registry/proslync.ts`. Web routes and React
 * components cannot import from the CLI package (separate tsconfig + bundle),
 * so the contents are duplicated. This script keeps the two honest by
 * extracting the `Proslync` literal from each file with a TypeScript-aware
 * AST walk-equivalent (regex over the literal block) and comparing them as
 * JSON.
 *
 * Run as: `node tooling/check-registry-parity.mjs` (or via pnpm).
 *
 * Exit codes:
 *   0 — registries match
 *   1 — registries differ; diff is printed to stderr
 *   2 — script could not parse one of the registries
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..");

const CLI_PATH = resolve(REPO_ROOT, "apps/cli/src/project-registry/proslync.ts");
const WEB_PATH = resolve(REPO_ROOT, "apps/web/src/lib/project-registry/proslync.ts");

function extractProslyncLiteral(source, sourcePath) {
	const start = source.indexOf("export const Proslync");
	if (start === -1) {
		throw new Error(`could not find "export const Proslync" in ${sourcePath}`);
	}
	const braceStart = source.indexOf("{", start);
	if (braceStart === -1) {
		throw new Error(`could not find object literal start in ${sourcePath}`);
	}
	let depth = 0;
	let end = -1;
	for (let i = braceStart; i < source.length; i += 1) {
		const ch = source[i];
		if (ch === "{") depth += 1;
		else if (ch === "}") {
			depth -= 1;
			if (depth === 0) {
				end = i + 1;
				break;
			}
		}
	}
	if (end === -1) {
		throw new Error(`unterminated object literal in ${sourcePath}`);
	}
	const literal = source.slice(braceStart, end);
	// Substitute the ACTIVE_BUILDS_ROOT template variable so both files yield
	// the same string under JSON normalization.
	const activeBuildsRoot = "/Users/trajanm4air/Desktop/Active builds";
	const interpolated = literal.replace(/`\$\{ACTIVE_BUILDS_ROOT\}([^`]*)`/g, (_, suffix) => {
		return JSON.stringify(`${activeBuildsRoot}${suffix}`);
	});
	// Strip TypeScript "as const" / type-cast suffixes that JSON cannot parse.
	const stripped = interpolated.replace(/\bas const\b/g, "");
	// Convert to JSON: quote keys, replace single quotes with double.
	const jsonish = stripped
		.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3')
		.replace(/'([^']*)'/g, '"$1"')
		// trailing commas before } or ]
		.replace(/,\s*([}\]])/g, "$1");
	try {
		return JSON.parse(jsonish);
	} catch (error) {
		throw new Error(
			`failed to parse Proslync literal from ${sourcePath}: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

function diff(a, b, path = "$") {
	if (a === b) return [];
	if (typeof a !== typeof b) return [`${path}: type mismatch (${typeof a} vs ${typeof b})`];
	if (a === null || b === null) {
		return [`${path}: null mismatch (${a} vs ${b})`];
	}
	if (Array.isArray(a) !== Array.isArray(b)) {
		return [`${path}: array/object shape mismatch`];
	}
	if (Array.isArray(a)) {
		const out = [];
		if (a.length !== b.length) {
			out.push(`${path}: length differs (${a.length} vs ${b.length})`);
		}
		const max = Math.max(a.length, b.length);
		for (let i = 0; i < max; i += 1) {
			out.push(...diff(a[i], b[i], `${path}[${i}]`));
		}
		return out;
	}
	if (typeof a === "object") {
		const out = [];
		const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
		for (const key of keys) {
			out.push(...diff(a[key], b[key], `${path}.${key}`));
		}
		return out;
	}
	return [`${path}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`];
}

function main() {
	let cliLiteral;
	let webLiteral;
	try {
		cliLiteral = extractProslyncLiteral(readFileSync(CLI_PATH, "utf8"), CLI_PATH);
		webLiteral = extractProslyncLiteral(readFileSync(WEB_PATH, "utf8"), WEB_PATH);
	} catch (error) {
		console.error(`registry-parity: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(2);
	}
	const differences = diff(cliLiteral, webLiteral);
	if (differences.length > 0) {
		console.error("registry-parity: CLI and web Proslync registries differ:");
		for (const line of differences) console.error(`  ${line}`);
		console.error("");
		console.error(`  CLI source: ${CLI_PATH}`);
		console.error(`  Web mirror: ${WEB_PATH}`);
		process.exit(1);
	}
	console.log("registry-parity: ok (CLI and web Proslync registries match)");
}

main();
