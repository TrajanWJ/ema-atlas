#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CLI = join(ROOT, "apps", "cli", "dist", "bin.js");
const ACTOR = "actor:01J00000000000000000000004";

main();

function main() {
	if (!existsSync(CLI)) fail("CLI dist entrypoint is missing; run pnpm build:cli first", { cli: CLI });
	const temp = mkdtempSync(join(tmpdir(), "ema-canon-writer-"));
	const body = `EMA canon writer smoke ${Date.now()}\n`;
	const bodyFile = join(temp, "body.md");
	writeFileSync(bodyFile, body);

	const help = cli(["canon", "--help"]);
	if (help.code !== 0) fail("canon help failed", help);

	const written = cliJson([
		"canon",
		"write",
		"--kind",
		"execution_result",
		"--body-file",
		bodyFile,
		"--source-kind",
		"execution",
		"--source-id",
		"execution:canon-writer-smoke",
		"--written-by",
		ACTOR,
		"--link",
		"result_of:PROSLYNC-PROP-SMOKE",
		"--json",
	]);
	const canonId = written.json?.canon?.canon_id ?? written.json?.canon?.id;
	if (!canonId) fail("canon write returned no canon id", written);
	if (written.json?.canon?.content_hash !== sha256(body)) {
		fail("canon write content hash mismatch", { expected: sha256(body), written: written.json });
	}

	const shown = cliJson(["canon", "show", canonId, "--json"]);
	if (shown.json?.canon?.canon_id !== canonId) fail("canon show did not return the written record", shown);

	const listed = cliJson(["canon", "list", "--kind", "execution_result", "--json"]);
	const ids = (listed.json?.canon_nodes ?? listed.json?.nodes ?? []).map((node) => node.canon_id ?? node.id);
	if (!ids.includes(canonId)) fail("canon list did not include the written record", { canon_id: canonId, listed: listed.json });

	console.log(JSON.stringify({
		ok: true,
		command: "canon-writer-smoke",
		canon_id: canonId,
		content_hash: sha256(body),
	}, null, 2));
}

function cli(args) {
	const result = spawnSync(process.execPath, [CLI, ...args], {
		cwd: ROOT,
		encoding: "utf8",
		maxBuffer: 16 * 1024 * 1024,
	});
	return { code: result.status ?? 1, stdout: result.stdout, stderr: result.stderr };
}

function cliJson(args) {
	const result = cli(args);
	let json = null;
	try {
		json = result.stdout.trim() ? JSON.parse(result.stdout) : null;
	} catch (err) {
		fail("failed to parse CLI JSON", { args, stdout: result.stdout, stderr: result.stderr, error: String(err) });
	}
	if (result.code !== 0) fail("CLI command failed", { args, ...result, json });
	return { ...result, json };
}

function sha256(value) {
	return createHash("sha256").update(value).digest("hex");
}

function fail(message, details = {}) {
	console.log(JSON.stringify({ ok: false, command: "canon-writer-smoke", error: { message, details } }, null, 2));
	process.exit(1);
}
