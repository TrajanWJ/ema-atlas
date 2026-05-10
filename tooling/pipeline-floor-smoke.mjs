#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "apps", "cli", "dist", "bin.js");
const RUN_ID = process.env.EMA_PIPELINE_FLOOR_RUN_ID ?? `${Date.now()}`;
const ACTOR_TEST_ID = `actor:01JTEST${RUN_ID}`.slice(0, 32);
const INTENT_ID = `BOOTSTRAP-INT-SMOKE-${RUN_ID}`;
const PROPOSAL_ID = `BOOTSTRAP-PROP-SMOKE-${RUN_ID}`;
const HUMAN = "actor:01J00000000000000000000002";
const ORCH = "actor:01J00000000000000000000004";

function run(args) {
	const result = spawnSync("node", [CLI, ...args], {
		cwd: ROOT,
		encoding: "utf8",
		maxBuffer: 16 * 1024 * 1024,
	});
	return {
		args,
		code: result.status ?? 1,
		stdout: result.stdout ?? "",
		stderr: result.stderr ?? "",
		json: parseJson(result.stdout ?? ""),
	};
}

function parseJson(stdout) {
	const trimmed = stdout.trim();
	if (!trimmed) return null;
	try {
		return JSON.parse(trimmed);
	} catch {
		return null;
	}
}

function assert(condition, message, result = null) {
	if (!condition) {
		const detail = result ? `\n${result.stdout}\n${result.stderr}` : "";
		throw new Error(`${message}${detail}`);
	}
}

let result = run(["actor", "--help"]);
assert(result.code === 0, "actor help should exist", result);

result = run(["actor", "list", "--json"]);
assert(result.code === 0 && Array.isArray(result.json?.actors), "actor list should return actors", result);
for (const actorId of [HUMAN, ORCH, "actor:01J00000000000000000000003"]) {
	assert(result.json.actors.some((actor) => actor.id === actorId || actor.actor_id === actorId), `missing actor ${actorId}`, result);
}

result = run([
	"actor",
	"register",
	"--id",
	ACTOR_TEST_ID,
	"--kind",
	"agent",
	"--display-name",
	"pipeline smoke actor",
	"--dispatch",
	"codex-cli",
	"--perspective",
	"executor",
	"--json",
]);
assert(result.code === 0 && result.json?.ok === true, "actor register should succeed", result);

result = run(["actor", "show", ACTOR_TEST_ID, "--json"]);
assert(result.code === 0 && result.json?.actor?.actor_id === ACTOR_TEST_ID, "actor show should return registered actor", result);

result = run([
	"intent",
	"create",
	"--id",
	INTENT_ID,
	"--title",
	"Pipeline floor smoke",
	"--kind",
	"bootstrap",
	"--actor",
	ORCH,
	"--project",
	"ema-0-0-6",
	"--exit-condition",
	"Smoke reaches approved proposal",
	"--json",
]);
assert(result.code === 0 && result.json?.ok === true && result.json.intent?.intent_id === INTENT_ID, "intent create should succeed", result);

result = run([
	"intent",
	"update",
	INTENT_ID,
	"--status",
	"proposed",
	"--actor",
	ORCH,
	"--reason",
	"Proposal generated",
	"--json",
]);
assert(result.code === 0 && result.json?.intent?.status === "proposed", "intent update should set proposed", result);

result = run([
	"proposal",
	"create",
	"--id",
	PROPOSAL_ID,
	"--intent",
	INTENT_ID,
	"--title",
	"Approve pipeline floor smoke",
	"--body",
	"Smoke proposal body.",
	"--plan",
	"Create, refuse agent self-approval, approve by human.",
	"--proposed-by",
	ORCH,
	"--json",
]);
assert(result.code === 0 && result.json?.ok === true && result.json.proposal?.proposal_id === PROPOSAL_ID, "proposal create should succeed", result);

result = run([
	"proposal",
	"approve",
	PROPOSAL_ID,
	"--actor",
	ORCH,
	"--rationale",
	"self-approval should fail",
	"--json",
]);
assert(result.code !== 0 && /self-approval/i.test(result.stdout + result.stderr), "agent self-approval should fail clearly", result);

result = run([
	"proposal",
	"approve",
	PROPOSAL_ID,
	"--actor",
	HUMAN,
	"--rationale",
	"pipeline floor smoke accepted",
	"--json",
]);
assert(result.code === 0 && result.json?.proposal?.status === "approved", "human approval should succeed", result);

result = run(["intent", "show", INTENT_ID, "--json"]);
assert(result.code === 0 && result.json?.intent?.status === "accepted", "intent should become accepted", result);

console.log(JSON.stringify({ ok: true, command: "pipeline-floor-smoke", intent_id: INTENT_ID, proposal_id: PROPOSAL_ID }));
