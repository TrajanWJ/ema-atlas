#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import WebSocket from "ws";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CLI = join(ROOT, "apps", "cli", "dist", "bin.js");
const DAEMON_PORT = "49555";
const HUMAN = "actor:01J00000000000000000000002";
const ORCH = "actor:01J00000000000000000000004";
const PROSLYNC_ROOT = "/Users/trajanm4air/Desktop/Active builds/proslync-app-ios-final";
const INTENT_ID = "PROSLYNC-INT-001";
const PROPOSAL_ID = "PROSLYNC-PROP-001";
const INTENT_SCOPE = "Prove Sprint 2.0 short-video NIL activation fields in the Brand HQ UI by surfacing existing NilActivationRequirement fixture data from lib/data/marketplace-intelligence.ts inside the Brand HQ campaign/deal evidence surface, with npx tsc --noEmit --pretty false as the first verification gate.";

process.env.EMA_IROH_MODE ??= "dev-loopback";

const startedAt = Date.now();
const steps = [];

main().catch((err) => fail("unhandled proslync acceptance gesture error", { error: String(err?.stack ?? err) }));

async function main() {
  if (!existsSync(CLI)) fail("CLI dist entrypoint is missing; run pnpm build:cli first", { cli: CLI });
  if (!existsSync(PROSLYNC_ROOT)) fail("Proslync project root is missing", { path: PROSLYNC_ROOT });
  await ensureDaemon();

  const intent = ensureIntent();
  recordStep(1, "PROSLYNC-INT-001 exists in canon", true, {
    intent_id: INTENT_ID,
    status: intent.intent?.status ?? intent.json?.intent?.status ?? null,
  });

  const proposal = ensureApprovedProposal();
  recordStep(2, "PROSLYNC-PROP-001 exists and is HUMAN-approved", proposal.proposal?.status === "approved", {
    proposal_id: PROPOSAL_ID,
    status: proposal.proposal?.status ?? null,
    approved_by_actor_id: proposal.proposal?.approved_by_actor_id ?? null,
  });

  const dispatch = cliJson([
    "harness",
    "dispatch",
    "--provider",
    "codex",
    "--intent",
    INTENT_ID,
    "--cwd",
    PROSLYNC_ROOT,
    "--timeout-ms",
    "180000",
    "--json",
  ], { timeout: 210_000 });
  const executionId = dispatch.json?.execution?.id;
  const canonId = dispatch.json?.canon_id;
  recordStep(3, "codex harness dispatch returns ok:true", dispatch.code === 0 && dispatch.json?.ok === true && Boolean(executionId) && Boolean(canonId), {
    code: dispatch.code,
    execution_id: executionId ?? null,
    canon_id: canonId ?? null,
    status: dispatch.json?.status ?? null,
    stderr_first_20: firstLines(dispatch.stderr, 20),
  });
  if (dispatch.code !== 0 || dispatch.json?.ok !== true || !executionId || !canonId) finish(false, "step 3 failed");

  const jsonlPath = resolve(ROOT, dispatch.json.session_file_path);
  const jsonl = validateJsonl(jsonlPath);
  recordStep(4, "JSONL captured and parseable", jsonl.ok, jsonl);
  if (!jsonl.ok) finish(false, "step 4 failed");

  const execution = cliJson(["execution", "show", "--execution", executionId, "--json"]);
  recordStep(5, "execution show reconstructs provenance", execution.code === 0 && execution.json?.ok === true && execution.json?.execution?.canon_id === canonId && Boolean(execution.json?.execution?.jsonl_path), {
    code: execution.code,
    status: execution.json?.execution?.status ?? null,
    canon_id: execution.json?.execution?.canon_id ?? null,
    jsonl_path: execution.json?.execution?.jsonl_path ?? null,
    event_types: (execution.json?.timeline ?? []).map((event) => event.kind),
  });
  if (execution.code !== 0 || execution.json?.ok !== true) finish(false, "step 5 failed");

  const canon = cliJson(["canon", "show", canonId, "--json"]);
  const canonLinks = canon.json?.canon?.links ?? [];
  const canonLinked =
    canon.code === 0 &&
    canon.json?.ok === true &&
    canon.json?.canon?.source_id === executionId &&
    canonLinks.some((link) => link.kind === "result_of" && link.target_id === PROPOSAL_ID) &&
    canonLinks.some((link) => link.kind === "fulfills" && link.target_id === INTENT_ID);
  recordStep(6, "execution result written to canon and linked to proposal", canonLinked, {
    code: canon.code,
    canon_id: canon.json?.canon?.canon_id ?? null,
    source_id: canon.json?.canon?.source_id ?? null,
    links: canonLinks,
  });
  if (!canonLinked) finish(false, "step 6 failed");

  await restartDaemon();
  await ensureDaemon();
  const executionAfter = cliJson(["execution", "show", "--execution", executionId, "--json"]);
  const canonAfter = cliJson(["canon", "show", canonId, "--json"]);
  const survived =
    executionAfter.code === 0 &&
    canonAfter.code === 0 &&
    executionAfter.json?.execution?.execution_id === execution.json?.execution?.execution_id &&
    executionAfter.json?.execution?.canon_id === execution.json?.execution?.canon_id &&
    canonAfter.json?.canon?.canon_id === canon.json?.canon?.canon_id &&
    canonAfter.json?.canon?.content_hash === canon.json?.canon?.content_hash;
  recordStep(7, "restart and re-query preserve execution and canon records", survived, {
    execution_status_before: execution.json?.execution?.status ?? null,
    execution_status_after: executionAfter.json?.execution?.status ?? null,
    canon_hash_before: canon.json?.canon?.content_hash ?? null,
    canon_hash_after: canonAfter.json?.canon?.content_hash ?? null,
  });

  finish(survived, survived ? null : "step 7 failed", {
    execution_id: executionId,
    canon_id: canonId,
    jsonl_path: dispatch.json.session_file_path,
  });
}

function ensureIntent() {
  const existing = cliJson(["intent", "show", INTENT_ID, "--json"], { allowFailure: true });
  if (existing.code === 0 && existing.json?.ok === true) return existing.json;
  const created = cliJson([
    "intent",
    "create",
    "--id",
    INTENT_ID,
    "--title",
    "Brand HQ activation-field UI proof",
    "--kind",
    "external",
    "--actor",
    ORCH,
    "--project",
    "proslync-app-ios-final",
    "--body",
    INTENT_SCOPE,
    "--exit-condition",
    "Codex execution result is written to canon and survives daemon restart",
    "--json",
  ]);
  if (created.code !== 0 || created.json?.ok !== true) fail("intent create failed", created);
  return created.json;
}

function ensureApprovedProposal() {
  const existing = cliJson(["proposal", "show", PROPOSAL_ID, "--json"], { allowFailure: true });
  if (existing.code === 0 && existing.json?.ok === true) {
    const proposal = existing.json.proposal;
    if (proposal?.status === "approved") return existing.json;
    if (proposal?.status === "rejected" || proposal?.status === "withdrawn") {
      fail("existing proposal is decided in a non-approvable state", proposal);
    }
  } else {
    const created = cliJson([
      "proposal",
      "create",
      "--id",
      PROPOSAL_ID,
      "--intent",
      INTENT_ID,
      "--title",
      "Prove Brand HQ activation fields",
      "--body",
      INTENT_SCOPE,
      "--plan",
      "Run a read-only Codex execution against the Proslync Brand HQ activation-field proof and write the result to canon.",
      "--proposed-by",
      ORCH,
      "--json",
    ]);
    if (created.code !== 0 || created.json?.ok !== true) fail("proposal create failed", created);
  }
  const approved = cliJson([
    "proposal",
    "approve",
    PROPOSAL_ID,
    "--actor",
    HUMAN,
    "--rationale",
    "sprint 3 acceptance gesture",
    "--json",
  ]);
  if (approved.code !== 0 || approved.json?.ok !== true) fail("proposal approve failed", approved);
  return approved.json;
}

function validateJsonl(path) {
  if (!existsSync(path)) return { ok: false, path, reason: "missing" };
  const text = readFileSync(path, "utf8");
  if (text.trim().length === 0) return { ok: false, path, reason: "empty" };
  const lines = text.trim().split(/\r?\n/);
  try {
    for (const line of lines) JSON.parse(line);
    return { ok: true, path, line_count: lines.length };
  } catch (err) {
    return { ok: false, path, reason: err instanceof Error ? err.message : String(err) };
  }
}

async function ensureDaemon() {
  const healthy = await pollDaemonHealth(1);
  if (healthy) return;
  startDaemon();
  const started = await pollDaemonHealth(80);
  if (!started) fail("daemon did not become healthy after start", {});
}

async function restartDaemon() {
  stopDaemonByPort("SIGTERM");
  const closed = await waitFor("daemon port to close", () => listenerPids().length === 0 ? { ok: true } : null, { retries: 40, quiet: true });
  if (!closed) {
    stopDaemonByPort("SIGKILL");
    await waitFor("daemon port to close after SIGKILL", () => listenerPids().length === 0 ? { ok: true } : null, { retries: 20 });
  }
  startDaemon();
  const healthy = await pollDaemonHealth(100);
  if (!healthy) fail("daemon did not become healthy after restart", {});
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
      // Process may exit between lsof and kill.
    }
  }
}

function listenerPids() {
  const result = spawnSync("lsof", ["-t", "-nP", `-iTCP:${DAEMON_PORT}`, "-sTCP:LISTEN"], { encoding: "utf8" });
  if (result.status !== 0 && !result.stdout.trim()) return [];
  return result.stdout.split(/\s+/).filter(Boolean);
}

async function pollDaemonHealth(retries) {
  return Boolean(await waitFor("daemon health", () => daemonPing(), { retries, quiet: true }));
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
        id: "proslync-gesture-hello",
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
          id: "proslync-gesture-ping",
          type: "command",
          op: "debug.ping",
          args: {},
        }));
        return;
      }
      if (msg.type === "command_result" && msg.in_reply_to === "proslync-gesture-ping") {
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
    env: { ...process.env, EMA_IROH_MODE: "dev-loopback" },
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: options.timeout ?? 20_000,
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

function recordStep(step, name, ok, detail = {}) {
  steps.push({ step, name, ok, detail });
}

function finish(ok, reason = null, extra = {}) {
  const payload = {
    ok,
    command: "proslync-acceptance-gesture",
    status: ok ? "closed" : "not_closed",
    reason,
    total_ms: Date.now() - startedAt,
    steps,
    ...extra,
  };
  console.log(JSON.stringify(payload, null, 2));
  process.exit(ok ? 0 : 1);
}

function fail(message, details = {}) {
  recordStep(steps.length + 1, message, false, details);
  finish(false, message);
}

function firstLines(value, count) {
  return String(value ?? "").split(/\r?\n/).slice(0, count);
}
