#!/usr/bin/env node
import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "apps/cli/dist/bin.js");

function runCli(args) {
	return new Promise((resolve) => {
		execFile("node", [CLI, ...args, "--json"], { cwd: ROOT, timeout: 10_000, maxBuffer: 5_000_000 }, (error, stdout, stderr) => {
			resolve({ code: error?.code ?? 0, stdout, stderr });
		});
	});
}

function parseJsonLines(stdout) {
	return stdout
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => JSON.parse(line));
}

function assert(condition, message) {
	if (!condition) throw new Error(message);
}

async function expectOk(args, label) {
	const result = await runCli(args);
	assert(result.code === 0, `${label} failed with ${result.code}: ${result.stderr || result.stdout}`);
	const lines = parseJsonLines(result.stdout);
	assert(lines.length > 0, `${label} emitted no JSON`);
	const last = lines.at(-1);
	assert(last.ok === true || last.commands, `${label} did not report ok/help JSON`);
	return last;
}

const hermesOrient = await expectOk(["hermes", "orient"], "hermes orient");
assert(hermesOrient.command === "hermes orient", "hermes orient command mismatch");
assert(hermesOrient.actor === "actor:hermes", "hermes orient default actor should be actor:hermes");
assert(Array.isArray(hermesOrient.resume_packet?.next_actions), "hermes orient should include resume_packet.next_actions");
assert(hermesOrient.resume_packet.next_actions.length === 3, "hermes orient should recommend exactly 3 next actions");
assert(Array.isArray(hermesOrient.resume_packet?.docs_read), "hermes orient should include docs_read");
assert(hermesOrient.resume_packet?.verification_state, "hermes orient should include verification_state");

const hermesPlan = await expectOk(["hermes", "plan"], "hermes plan");
assert(hermesPlan.command === "hermes plan", "hermes plan command mismatch");
assert(Array.isArray(hermesPlan.plan?.dispatches), "hermes plan should include planned dispatches");
assert(hermesPlan.plan.dispatches.some((d) => d.provider === "simulated"), "hermes plan should include simulated dispatch seed");

const hermesSweep = await expectOk(["hermes", "sweep"], "hermes sweep");
assert(hermesSweep.command === "hermes sweep", "hermes sweep command mismatch");
assert(Array.isArray(hermesSweep.sweep?.lost_threads), "hermes sweep should include lost_threads array");

const providers = await expectOk(["harness", "providers"], "harness providers");
assert(providers.command === "harness providers", "harness providers command mismatch");
assert(providers.projections?.includes("harness.providers"), "harness providers should name harness.providers projection");
assert(providers.providers.some((provider) => provider.id === "simulated" && provider.status === "ready"), "simulated provider should be ready");

const dispatch = await expectOk([
	"harness",
	"dispatch",
	"--provider",
	"simulated",
	"--lane",
	"lane:test",
	"--cwd",
	ROOT,
	"--prompt",
	"prove simulated dispatch",
], "harness dispatch");
assert(dispatch.execution?.id?.startsWith("execution:simulated:"), "harness dispatch should return simulated execution id");
assert(dispatch.events?.some((event) => event.type === "dispatch.started"), "harness dispatch should normalize dispatch.started event");

const stream = await expectOk(["harness", "stream", "--execution", dispatch.execution.id], "harness stream");
assert(stream.timeline?.some((event) => event.type === "execution.ended"), "harness stream should include execution.ended");

const stop = await expectOk(["harness", "stop", "--execution", dispatch.execution.id], "harness stop");
assert(stop.command === "harness stop", "harness stop command mismatch");
assert(stop.execution_id === dispatch.execution.id, "harness stop should echo execution id");

const peerDoctor = await expectOk(["peer", "doctor"], "peer doctor");
assert(peerDoctor.command === "peer doctor", "peer doctor command mismatch");
assert(peerDoctor.peer?.id === "local", "peer doctor should default to local peer");
assert(peerDoctor.checks?.some((check) => check.name === "node"), "peer doctor should include node check");
assert(peerDoctor.checks?.some((check) => check.name === "pnpm"), "peer doctor should include pnpm check");

console.log("hermes-harness-cli-smoke: ok");
