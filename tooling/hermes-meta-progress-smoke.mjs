#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const result = spawnSync("pnpm", ["cli", "agent", "meta-progress", "--actor", "actor:hermes", "--json"], {
	cwd: repoRoot,
	encoding: "utf8",
});

if (result.status !== 0) {
	process.stderr.write(result.stderr || result.stdout || result.error?.message || "meta-progress command failed");
	process.exit(result.status ?? 1);
}

const lines = result.stdout.trim().split(/\n+/);
const jsonLine = [...lines].reverse().find((line) => line.trim().startsWith("{"));
if (!jsonLine) {
	process.stderr.write(`No JSON object found in output:\n${result.stdout}`);
	process.exit(1);
}

const payload = JSON.parse(jsonLine);
const progress = payload.meta_progress;
const failures = [];

if (payload.ok !== true) failures.push("ok must be true");
if (payload.command !== "agent meta-progress") failures.push("command must be agent meta-progress");
if (!progress || typeof progress !== "object") failures.push("meta_progress object missing");
if (typeof progress?.totals?.lanes !== "number") failures.push("totals.lanes missing");
if (typeof progress?.totals?.queue !== "number") failures.push("totals.queue missing");
if (typeof progress?.pressure?.blocked_queue !== "number") failures.push("pressure.blocked_queue missing");
if (typeof progress?.next_action !== "string" || progress.next_action.length === 0) failures.push("next_action missing");
if (!Array.isArray(progress?.commands)) failures.push("commands missing");

if (failures.length > 0) {
	process.stderr.write(`meta-progress smoke failed:\n- ${failures.join("\n- ")}\n`);
	process.exit(1);
}

console.log(JSON.stringify({
	ok: true,
	command: "hermes-meta-progress-smoke",
	lanes: progress.totals.lanes,
	queue: progress.totals.queue,
	next_action: progress.next_action,
}));
