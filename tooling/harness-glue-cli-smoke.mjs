#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

function run(args) {
	const output = execFileSync("/bin/bash", ["scripts/run-cli.sh", ...args, "--json"], {
		cwd: root,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	});
	const jsonLine = output.trim().split("\n").find((line) => line.startsWith("{"));
	if (!jsonLine) throw new Error(`No JSON payload for: ema ${args.join(" ")}`);
	return JSON.parse(jsonLine);
}

function assert(condition, message) {
	if (!condition) throw new Error(message);
}

const donors = run(["harness", "donors"]);
assert(donors.status === "preparing_for_hermes", "harness donors must be preparation status");
assert(donors.boundary.includes("not Hermes"), "harness donors must state the Hermes boundary");
assert(donors.donors.some((donor) => donor.id === "chronicle"), "chronicle donor missing");
assert(donors.donors.some((donor) => donor.id === "duct-tape-onion-harness"), "duct tape donor missing");

const providers = run(["harness", "providers"]);
assert(providers.projections.includes("chronicle.activity"), "chronicle.activity projection missing");
assert(providers.providers.some((provider) => provider.id === "simulated" && provider.status === "ready"), "simulated provider missing");

const status = run(["harness", "status"]);
assert(status.boundary.includes("not Hermes authority"), "harness status must keep Hermes authority boundary");
assert(status.readiness.pending_daemon_projections.includes("dispatch.registry"), "dispatch.registry pending status missing");
assert(status.providers.ready.includes("simulated"), "harness status must show simulated provider ready");
assert(status.providers.ready.includes("codex"), "harness status must show codex tmux provider ready");
assert(status.providers.ready.includes("claude-code"), "harness status must show claude-code tmux provider ready");
assert(status.readiness.usable_now.includes("lane-assigned sessions"), "harness status must expose lane-assigned sessions as usable now");

const dryStart = run(["harness", "start", "--provider", "codex", "--name", "smoke", "--lane", "lane:smoke", "--cwd", root, "--prompt", "smoke long-running worker", "--dry-run"]);
assert(dryStart.status === "dry_run", "harness start --dry-run must avoid launching a process");
assert(dryStart.backend === "file_backed_tmux_registry", "harness start must identify the tmux registry backend");
assert(dryStart.events.some((event) => event.type === "dispatch.started"), "harness start must normalize dispatch.started");
assert(dryStart.execution.tmux_session.includes("codex"), "harness start should allocate a codex tmux session");
assert(dryStart.lane_assignment?.lane_id === "lane:smoke", "harness start should prepare a lane session assignment");
assert(dryStart.commands.context.includes("harness context"), "harness start should advertise context retrieval");
assert(dryStart.commands.grep.includes("harness grep"), "harness start should advertise session grep");

const dispatch = run([
	"harness",
	"dispatch",
	"--provider",
	"simulated",
	"--lane",
	"lane:smoke",
	"--cwd",
	"Active builds/EMA-0.0.5",
	"--prompt",
	"prove Harness Glue",
]);
const eventTypes = dispatch.events.map((event) => event.type);
assert(eventTypes.includes("dispatch.started"), "dispatch.started missing");
assert(eventTypes.includes("execution.started"), "execution.started missing");
assert(eventTypes.includes("tool.returned"), "tool.returned missing");
assert(eventTypes.includes("execution.ended"), "execution.ended missing");
assert(eventTypes.includes("dispatch.ended"), "dispatch.ended missing");

const peer = run(["peer", "dispatch", "--peer", "local", "--provider", "simulated", "--prompt", "smoke"]);
assert(peer.audit_required.actor === "actor:codex", "peer dispatch must not default to actor:hermes");

console.log(JSON.stringify({ ok: true, command: "harness-glue-cli-smoke", checked: ["donors", "providers", "status", "start-dry-run", "lane-session-assignment", "dispatch", "peer"] }));
