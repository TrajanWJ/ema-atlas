#!/usr/bin/env node
// Verify that every entry in the canonical STATIC_POPOUT_APPS list (sourced
// from apps/web/app/popout/[appId]/page.tsx) has a generated static page in
// apps/web/out/popout/<appId>/index.html. Used by scripts/build-web-static-out.sh
// to replace the previously hand-maintained POPOUT_APPS bash array.

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const POPOUT_PAGE = join(ROOT, "apps", "web", "app", "popout", "[appId]", "page.tsx");
const OUT_DIR = join(ROOT, "apps", "web", "out");

function parseStaticPopoutApps(source) {
	const match = source.match(/STATIC_POPOUT_APPS\s*=\s*\[([\s\S]*?)\]/);
	if (!match) {
		throw new Error(`STATIC_POPOUT_APPS array not found in ${POPOUT_PAGE}`);
	}
	const body = match[1];
	const ids = [];
	const re = /["']([a-z0-9-]+)["']/g;
	let m;
	while ((m = re.exec(body)) !== null) {
		ids.push(m[1]);
	}
	if (ids.length === 0) {
		throw new Error(`STATIC_POPOUT_APPS array parsed but contained no ids in ${POPOUT_PAGE}`);
	}
	return ids;
}

function main() {
	if (!existsSync(POPOUT_PAGE)) {
		console.error(`canonical popout page missing: ${POPOUT_PAGE}`);
		process.exit(1);
	}
	const source = readFileSync(POPOUT_PAGE, "utf8");
	const expected = parseStaticPopoutApps(source);
	if (!existsSync(OUT_DIR)) {
		console.error(`static output directory missing: ${OUT_DIR}`);
		process.exit(1);
	}

	const indexHtml = join(OUT_DIR, "index.html");
	if (!existsSync(indexHtml)) {
		console.error(`static index missing: ${indexHtml}`);
		process.exit(1);
	}

	const missing = [];
	for (const appId of expected) {
		const target = join(OUT_DIR, "popout", appId, "index.html");
		if (!existsSync(target)) {
			missing.push({ appId, target });
		}
	}

	const wantJson = process.argv.includes("--json");
	const result = {
		ok: missing.length === 0,
		expected_count: expected.length,
		expected,
		missing,
		out_dir: OUT_DIR,
		source_file: POPOUT_PAGE,
	};

	if (wantJson) {
		console.log(JSON.stringify(result, null, 2));
	} else if (missing.length === 0) {
		console.log(
			`static-popout parity: OK (${expected.length}/${expected.length} popout pages present)`,
		);
	} else {
		console.error(
			`static-popout parity FAILED: ${missing.length}/${expected.length} popout pages missing`,
		);
		for (const m of missing) {
			console.error(`  - ${m.appId}: missing ${m.target}`);
		}
	}

	process.exit(result.ok ? 0 : 1);
}

main();
