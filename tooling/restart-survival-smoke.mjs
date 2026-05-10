#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import WebSocket from "ws";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CLI = join(ROOT, "apps", "cli", "dist", "bin.js");
const PROOF = join(ROOT, ".ema-dev", "restart-survival", "last-proof.json");
const DAEMON_PORT = "49555";
const SMOKE_PROMPT = "smoke:sleep:5";
const RESTART_METHOD = "kill tcp/49555 listener, then bash scripts/dev-daemon.sh";

main().catch((err) => fail("unhandled restart survival smoke error", { error: String(err?.stack ?? err) }));

async function main() {
  if (!existsSync(CLI)) fail("CLI dist entrypoint is missing; run pnpm build:cli first", { cli: CLI });

  await ensureDaemon();
  const before = cliJson(["db", "status", "--json"]);
  const beforeEventCount = Number(before.json?.database?.table_counts?.events ?? 0);

  const completed = cliJson(["harness", "dispatch", "--provider", "simulated", "--prompt", "smoke", "--json"]);
  if (completed.code !== 0 || completed.json?.ok !== true || !completed.json?.execution?.id || !completed.json?.canon_id) {
    fail("completed simulated dispatch did not produce execution and canon ids", completed);
  }
  const completedExecutionId = completed.json.execution.id;
  const completedCanonId = completed.json.canon_id;
  const completedBefore = cliJson(["execution", "show", "--execution", completedExecutionId, "--json"]);
  const canonBefore = cliJson(["canon", "show", completedCanonId, "--json"]);
  if (completedBefore.json?.execution?.status !== "completed" || canonBefore.json?.canon?.source_id !== completedExecutionId) {
    fail("completed simulated execution/canon pre-restart query failed", {
      execution: completedBefore.json,
      canon: canonBefore.json,
    });
  }

  const dispatch = cliJson(["harness", "dispatch", "--provider", "simulated", "--prompt", SMOKE_PROMPT, "--json"]);
  if (dispatch.code !== 0 || dispatch.json?.ok !== true) {
    fail("simulated sleep dispatch failed", dispatch);
  }
  const executionId = dispatch.json?.execution?.id;
  if (!executionId) fail("simulated sleep dispatch returned no execution id", dispatch.json);

  await waitFor(`execution ${executionId} to reach running`, () => {
    const show = cliJson(["execution", "show", "--execution", executionId, "--json"], { allowFailure: true });
    return show.json?.execution?.status === "running" ? show : null;
  });

  await restartDaemon();
  await ensureDaemon();

  const recovered = await waitFor(`execution ${executionId} to be interrupted_by_restart`, () => {
    const show = cliJson(["execution", "show", "--execution", executionId, "--json"], { allowFailure: true });
    return show.json?.execution?.status === "interrupted_by_restart" ? show : null;
  });
  const timeline = cliJson(["execution", "timeline", "--execution", executionId, "--json"]);
  const eventTypes = (timeline.json?.timeline ?? []).map((event) => event.kind);

  for (const required of ["dispatch.started", "execution.started", "tool.invoked", "execution.interrupted_by_restart"]) {
    if (!eventTypes.includes(required)) {
      fail("execution timeline is missing required canonical event", {
        execution_id: executionId,
        required,
        event_types: eventTypes,
      });
    }
  }

  const interrupted = (timeline.json?.timeline ?? []).find((event) => event.kind === "execution.interrupted_by_restart");
  if (interrupted?.payload?.prior_status !== "running" || interrupted?.payload?.recovered_by !== "boot_recovery_scanner") {
    fail("interrupted event payload does not match restart recovery contract", interrupted);
  }
  const completedAfter = cliJson(["execution", "show", "--execution", completedExecutionId, "--json"]);
  const canonAfter = cliJson(["canon", "show", completedCanonId, "--json"]);
  if (completedAfter.json?.execution?.status !== completedBefore.json?.execution?.status ||
      canonAfter.json?.canon?.content_hash !== canonBefore.json?.canon?.content_hash) {
    fail("completed execution or canon record changed across restart", {
      completed_before: completedBefore.json?.execution,
      completed_after: completedAfter.json?.execution,
      canon_before: canonBefore.json?.canon,
      canon_after: canonAfter.json?.canon,
    });
  }
  const canonList = cliJson(["canon", "list", "--kind", "execution_result", "--json"]);
  if (!Array.isArray(canonList.json?.canon_nodes) ||
      !canonList.json.canon_nodes.some((node) => node.canon_id === completedCanonId)) {
    fail("canon list did not return the completed execution result node", canonList.json);
  }

  const proof = {
    passed_at: new Date().toISOString(),
    execution_id: executionId,
    completed_execution_id: completedExecutionId,
    completed_canon_id: completedCanonId,
    events_observed: ["dispatch.started", "execution.started", "execution.interrupted_by_restart"],
    daemon_restart_method: RESTART_METHOD,
    smoke_version: 1,
  };
  mkdirSync(dirname(PROOF), { recursive: true });
  writeFileSync(PROOF, `${JSON.stringify(proof, null, 2)}\n`);

  const after = cliJson(["db", "status", "--json"]);
  console.log(JSON.stringify({
    ok: true,
    command: "restart-survival-smoke",
    execution_id: executionId,
    before_event_count: beforeEventCount,
    after_event_count: Number(after.json?.database?.table_counts?.events ?? 0),
    completed_execution_id: completedExecutionId,
    completed_canon_id: completedCanonId,
    event_types: eventTypes,
    recovered_status: recovered.json?.execution?.status,
    proof_path: PROOF,
    daemon_restart_method: RESTART_METHOD,
  }, null, 2));
}

async function ensureDaemon() {
  const healthy = await pollDaemonHealth(1);
  if (healthy) return;
  startDaemon();
  const started = await pollDaemonHealth(50);
  if (!started) fail("daemon did not become healthy after start", { daemon_restart_method: RESTART_METHOD });
}

async function restartDaemon() {
  stopDaemonByPort("SIGTERM");
  const closed = await waitFor("daemon port to close", () => listenerPids().length === 0 ? { ok: true } : null, { retries: 40, quiet: true });
  if (!closed) {
    stopDaemonByPort("SIGKILL");
    await waitFor("daemon port to close after SIGKILL", () => listenerPids().length === 0 ? { ok: true } : null, { retries: 20 });
  }
  startDaemon();
  const healthy = await pollDaemonHealth(80);
  if (!healthy) fail("daemon did not become healthy after restart", { daemon_restart_method: RESTART_METHOD });
}

function startDaemon() {
  const child = spawn("bash", ["scripts/dev-daemon.sh"], {
    cwd: ROOT,
    detached: true,
    stdio: "ignore",
    env: {
      ...process.env,
      EMA_IROH_MODE: "dev-loopback",
    },
  });
  child.unref();
}

function stopDaemonByPort(signal) {
  for (const pid of listenerPids()) {
    try {
      process.kill(Number(pid), signal);
    } catch {
      // It may have exited between lsof and kill.
    }
  }
}

function listenerPids() {
  const result = spawnSync("lsof", ["-t", "-nP", `-iTCP:${DAEMON_PORT}`, "-sTCP:LISTEN"], { encoding: "utf8" });
  if (result.status !== 0 && !result.stdout.trim()) return [];
  return result.stdout.split(/\s+/).filter(Boolean);
}

async function pollDaemonHealth(retries) {
  const result = await waitFor("daemon health", () => {
    return daemonPing();
  }, { retries, quiet: true });
  return Boolean(result);
}

function daemonPing() {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://127.0.0.1:${DAEMON_PORT}/`);
    const timer = setTimeout(() => finish(false), 750);
    let sawHello = false;

    function finish(ok) {
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        // ignore
      }
      resolve(ok ? { ok: true } : null);
    }

    ws.on("open", () => {
      ws.send(JSON.stringify({
        v: 0,
        id: "restart-smoke-hello",
        type: "hello",
        surface: "desktop",
        device_id: null,
      }));
    });
    ws.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        finish(false);
        return;
      }
      if (msg.type === "hello" && !sawHello) {
        sawHello = true;
        ws.send(JSON.stringify({
          v: 0,
          id: "restart-smoke-ping",
          type: "command",
          op: "debug.ping",
          args: {},
        }));
        return;
      }
      if (msg.type === "command_result" && msg.in_reply_to === "restart-smoke-ping") {
        finish(msg.ok === true);
      }
    });
    ws.on("error", () => finish(false));
  });
}

async function waitFor(label, check, options = {}) {
  const retries = options.retries ?? 60;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const result = await check();
    if (result) return result;
    await delay(250);
  }
  if (options.quiet) return null;
  fail(`timed out waiting for ${label}`, { retries });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cliJson(args, options = {}) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  let json = null;
  try {
    json = result.stdout.trim() ? JSON.parse(result.stdout) : null;
  } catch (err) {
    if (!options.allowFailure) {
      fail("failed to parse CLI JSON output", { args, stdout: result.stdout, stderr: result.stderr, error: String(err) });
    }
  }
  if (!options.allowFailure && result.status !== 0) {
    fail("CLI command failed", { args, code: result.status, stdout: result.stdout, stderr: result.stderr, json });
  }
  return { code: result.status ?? 1, stdout: result.stdout, stderr: result.stderr, json };
}

function fail(message, details = {}) {
  console.log(JSON.stringify({
    ok: false,
    command: "restart-survival-smoke",
    error: { message, details },
  }, null, 2));
  process.exit(1);
}
