#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import WebSocket from "ws";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CLI = join(ROOT, "apps", "cli", "dist", "bin.js");
const DAEMON_PORT = "49555";
const RESTART_METHOD = "kill tcp/49555 listener, then bash scripts/dev-daemon.sh";

main().catch((err) => fail("unhandled artifact canonical smoke error", { error: String(err?.stack ?? err) }));

async function main() {
  if (!existsSync(CLI)) fail("CLI dist entrypoint is missing; run pnpm build:cli first", { cli: CLI });
  await ensureDaemon();

  const before = cliJson(["db", "status", "--json"]);
  const beforeEventCount = Number(before.json?.database?.table_counts?.events ?? 0);
  const temp = mkdtempSync(join(tmpdir(), "ema-artifact-canonical-"));
  const createBody = "EMA artifact canonical smoke create\n";
  const updateBody = "EMA artifact canonical smoke update\n";
  const createBodyFile = join(temp, "create.md");
  const updateBodyFile = join(temp, "update.md");
  writeFileSync(createBodyFile, createBody);
  writeFileSync(updateBodyFile, updateBody);

  const created = cliJson([
    "workspace",
    "artifact",
    "add",
    "--kind",
    "note",
    "--title",
    `Artifact canonical smoke ${Date.now()}`,
    "--body-file",
    createBodyFile,
    "--json",
  ]);
  const artifactId = created.json?.artifact?.id;
  if (!artifactId) fail("artifact create returned no artifact id", created);
  assertEvent(artifactId, "artifact.created");

  const shownCreate = cliJson(["workspace", "artifact", "show", "--artifact", artifactId, "--json"]);
  if (shownCreate.json?.artifact?.content_hash !== sha256(createBody)) {
    fail("created artifact hash mismatch", { expected: sha256(createBody), show: shownCreate.json });
  }

  const updated = cliJson([
    "workspace",
    "artifact",
    "update",
    "--artifact",
    artifactId,
    "--body-file",
    updateBodyFile,
    "--json",
  ]);
  if (updated.json?.artifact?.content_hash !== sha256(updateBody)) {
    fail("updated artifact hash mismatch", { expected: sha256(updateBody), update: updated.json });
  }
  assertEvent(artifactId, "artifact.updated");

  const linked = cliJson([
    "workspace",
    "artifact",
    "link",
    "--artifact",
    artifactId,
    "--target-kind",
    "project",
    "--target-id",
    "ema-0-0-6",
    "--json",
  ]);
  if (linked.json?.ok !== true) fail("artifact link failed", linked);
  assertEvent(artifactId, "artifact.linked");

  const archived = cliJson([
    "workspace",
    "artifact",
    "archive",
    "--artifact",
    artifactId,
    "--reason",
    "artifact canonical smoke complete",
    "--json",
  ]);
  if (archived.json?.artifact?.status !== "archived") fail("artifact archive did not mark artifact archived", archived);
  assertEvent(artifactId, "artifact.archived");

  await restartDaemon();
  await ensureDaemon();

  const shownAfterRestart = cliJson(["workspace", "artifact", "show", "--artifact", artifactId, "--json"]);
  if (shownAfterRestart.json?.artifact?.id !== artifactId) fail("artifact not queryable after daemon restart", shownAfterRestart);
  const eventTypes = (shownAfterRestart.json?.events ?? []).map((event) => event.kind);
  for (const required of ["artifact.created", "artifact.updated", "artifact.linked", "artifact.archived"]) {
    if (!eventTypes.includes(required)) fail("artifact history missing required event after restart", { artifact_id: artifactId, required, event_types: eventTypes });
  }

  const readiness = cliJson(["readiness", "--json"]);
  const blockerIds = (readiness.json?.blockers ?? []).map((blocker) => blocker.id);
  if (blockerIds.includes("artifact_context_writeback") || readiness.json?.proslync_execution_ready !== true) {
    fail("readiness still reports artifact execution blocker after canonical artifact smoke", {
      proslync_execution_ready: readiness.json?.proslync_execution_ready,
      blockers: blockerIds,
      components: readiness.json?.substrate_translated?.components,
    });
  }

  const after = cliJson(["db", "status", "--json"]);
  console.log(JSON.stringify({
    ok: true,
    command: "artifact-canonical-smoke",
    artifact_id: artifactId,
    before_event_count: beforeEventCount,
    after_event_count: Number(after.json?.database?.table_counts?.events ?? 0),
    event_types: eventTypes,
    daemon_restart_method: RESTART_METHOD,
  }, null, 2));
}

function assertEvent(artifactId, kind) {
  const events = cliJson(["events", "list", "--kind", "artifact.*", "--limit", "200", "--json"]);
  const match = (events.json?.events ?? []).find((event) => event.kind === kind && event.payload?.artifact_id === artifactId);
  if (!match) fail("canonical artifact event missing", { artifact_id: artifactId, kind, events: events.json?.events ?? [] });
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
    env: { ...process.env, EMA_IROH_MODE: "dev-loopback" },
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
  const result = await waitFor("daemon health", () => daemonPing(), { retries, quiet: true });
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
      ws.send(JSON.stringify({ v: 0, id: "artifact-smoke-hello", type: "hello", surface: "desktop", device_id: null }));
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
        ws.send(JSON.stringify({ v: 0, id: "artifact-smoke-ping", type: "command", op: "debug.ping", args: {} }));
        return;
      }
      if (msg.type === "command_result" && msg.in_reply_to === "artifact-smoke-ping") finish(msg.ok === true);
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
    if (!options.allowFailure) fail("failed to parse CLI JSON output", { args, stdout: result.stdout, stderr: result.stderr, error: String(err) });
  }
  if (!options.allowFailure && result.status !== 0) fail("CLI command failed", { args, code: result.status, stdout: result.stdout, stderr: result.stderr, json });
  return { code: result.status ?? 1, stdout: result.stdout, stderr: result.stderr, json };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fail(message, details = {}) {
  console.log(JSON.stringify({
    ok: false,
    command: "artifact-canonical-smoke",
    error: { message, details },
  }, null, 2));
  process.exit(1);
}
