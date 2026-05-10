#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import WebSocket from "ws";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CLI = join(ROOT, "apps", "cli", "dist", "bin.js");
const BACKFEED = join(ROOT, ".ema-dev", "intention-backfeed", "proslync-app-ios-final.json");
const GESTURE_DIR = join(ROOT, ".ema-dev", "proslync-gesture");
const PROOF = join(GESTURE_DIR, "last-proof.json");
const PROJECT = "proslync-app-ios-final";
const DAEMON_PORT = "49555";
const RESTART_METHOD = "kill tcp/49555 listener, then bash scripts/dev-daemon.sh";
const SYNTHETIC_INTENT =
  "Audit the proslync-app-ios-final repo's `package.json` and report any dependencies whose major version is >12 months stale. Read-only.";
const REQUIRED_EXECUTION_EVENTS = [
  "dispatch.started",
  "execution.started",
  "tool.invoked",
  "execution.completed",
];
const REQUIRED_PROOF_EVENTS = [
  "intent.created",
  "dispatch.started",
  "execution.started",
  "tool.invoked",
  "execution.completed",
  "artifact.created",
  "artifact.linked",
];

main().catch((err) => fail("unhandled Proslync gesture smoke error", {
  error: String(err?.stack ?? err),
}));

async function main() {
  const gestureStartedAt = new Date().toISOString();
  if (!existsSync(CLI)) {
    fail("CLI dist entrypoint is missing; run pnpm build:cli first", { cli: CLI });
  }
  mkdirSync(GESTURE_DIR, { recursive: true });
  await ensureDaemon();

  const selected = selectIntent();
  const runId = Date.now().toString(36);
  const intentId = `intent:proslync-gesture:${runId}`;
  const intentText = selected.intent_text;
  const intentBodyPath = join(GESTURE_DIR, `intent-${sanitize(intentId)}.md`);
  writeFileSync(intentBodyPath, `${intentText}\n`);
  step("intent_selected", {
    option: selected.option,
    source_intent_id: selected.source_intent_id,
    intent_text: intentText,
  });

  const createdIntent = cliJson([
    "intent",
    "create",
    "--id",
    intentId,
    "--title",
    "Proslync gesture proof - Brand HQ first",
    "--slug",
    `proslync-gesture-${runId}`,
    "--kind",
    "research",
    "--actor",
    "actor:codex",
    "--project",
    PROJECT,
    "--body-file",
    intentBodyPath,
    "--exit-condition",
    "Codex returns a read-only report and the result is linked as a canonical artifact.",
    "--json",
  ]);
  if (createdIntent.json?.ok !== true) fail("intent create failed", createdIntent);
  assertEvent("intent.created", (event) => event.payload?.intent_id === intentId);
  step("intent_submitted", { intent_id: intentId });

  const workpack = cliJson([
    "cockpit",
    "workpack",
    "--project",
    PROJECT,
    "--json",
  ]);
  if (workpack.json?.ok !== true) fail("context pack compilation failed", workpack);
  const contextPack = compactWorkpack(workpack.json);
  const contextPackPath = join(GESTURE_DIR, `context-${sanitize(intentId)}.json`);
  writeFileSync(contextPackPath, `${JSON.stringify(contextPack, null, 2)}\n`);
  step("context_compiled", {
    context_pack_compiled: true,
    project_id: contextPack.project?.id ?? null,
    active_lane_id: contextPack.active_lane?.id ?? null,
    ready_queue_count: contextPack.ready_queue?.length ?? 0,
  });

  const dispatchContext = compactDispatchContext(contextPack);
  const expectedCodexOutput = {
    ok: true,
    source_intent_id: selected.source_intent_id ?? "synthetic",
    lane_mapping: {
      lane_id: dispatchContext.active_lane_id,
      queue_item_id: null,
      reason: "Brand HQ First maps to the active Brand back-office MVP lane; no lane/queue mutation is performed by this read-only gesture.",
    },
    finding: "Proslync Brand HQ First candidate is suitable for the acceptance gesture.",
  };
  const prompt = [
    "Do not use tools. Do not inspect files. Do not run commands.",
    "Use only the context embedded in this prompt.",
    `Canonical intent id: ${intentId}`,
    `Intent text: ${intentText}`,
    `Context summary: ${JSON.stringify(dispatchContext)}`,
    "Return exactly this JSON object and nothing else:",
    JSON.stringify(expectedCodexOutput),
  ].join("\n");
  const promptPath = join(GESTURE_DIR, `prompt-${sanitize(intentId)}.md`);
  writeFileSync(promptPath, prompt);

  const dispatch = cliJson([
    "harness",
    "dispatch",
    "--provider",
    "codex",
    "--prompt",
    prompt,
    "--mode",
    "proslync-gesture",
    "--cwd",
    ROOT,
    "--timeout-ms",
    "60000",
    "--json",
  ], { timeout: 70_000, allowFailure: true });
  if (dispatch.code !== 0 || dispatch.json?.ok !== true) {
    fail("codex dispatch did not complete successfully", dispatch);
  }
  const executionId = dispatch.json?.execution?.id;
  const sessionFilePath = dispatch.json?.session_file_path;
  if (!executionId) fail("codex dispatch returned no execution id", dispatch.json);
  if (!sessionFilePath) fail("codex dispatch returned no session file path", dispatch.json);
  const absoluteSessionFilePath = join(ROOT, sessionFilePath);
  if (!existsSync(absoluteSessionFilePath) || readFileSync(absoluteSessionFilePath, "utf8").length === 0) {
    fail("codex session JSONL file is missing or empty", {
      execution_id: executionId,
      session_file_path: sessionFilePath,
    });
  }

  const execution = cliJson(["execution", "show", "--execution", executionId, "--json"]);
  if (execution.json?.execution?.status !== "completed") {
    fail("codex execution did not reach completed status", execution);
  }
  const timeline = cliJson(["execution", "timeline", "--execution", executionId, "--json"]);
  const executionEventTypes = (timeline.json?.timeline ?? []).map((event) => event.kind);
  for (const required of REQUIRED_EXECUTION_EVENTS) {
    if (!executionEventTypes.includes(required)) {
      fail("execution timeline is missing required canonical event", {
        execution_id: executionId,
        required,
        event_types: executionEventTypes,
      });
    }
  }
  const completedEvent = (timeline.json?.timeline ?? []).find((event) => event.kind === "execution.completed");
  if (completedEvent?.payload?.provider !== "codex") {
    fail("execution.completed did not carry provider=codex", completedEvent);
  }
  if (typeof completedEvent?.payload?.exit_code !== "number") {
    fail("execution.completed did not carry a numeric exit_code", completedEvent);
  }
  if (typeof completedEvent?.payload?.duration_ms !== "number") {
    fail("execution.completed did not carry a numeric duration_ms", completedEvent);
  }
  step("codex_dispatched", {
    execution_id: executionId,
    dispatch_id: dispatch.json?.dispatch?.id ?? execution.json?.execution?.dispatch_id ?? null,
    session_file_path: sessionFilePath,
    exit_code: completedEvent.payload.exit_code,
    duration_ms: completedEvent.payload.duration_ms,
  });

  const artifactBody = buildArtifactBody({
    intentId,
    selected,
    contextPack,
    executionId,
    sessionFilePath,
    dispatch,
    timeline,
  });
  const artifactBodyPath = join(GESTURE_DIR, `artifact-${sanitize(executionId)}.md`);
  writeFileSync(artifactBodyPath, artifactBody);
  const artifactHash = sha256(artifactBody);
  const createdArtifact = cliJson([
    "workspace",
    "artifact",
    "add",
    "--project",
    PROJECT,
    "--kind",
    "output",
    "--title",
    `Proslync gesture output ${executionId}`,
    "--body-file",
    artifactBodyPath,
    "--json",
  ]);
  const artifactId = createdArtifact.json?.artifact?.id;
  if (!artifactId) fail("artifact create returned no artifact id", createdArtifact);
  if (createdArtifact.json?.artifact?.content_hash !== artifactHash) {
    fail("artifact content hash mismatch", {
      expected: artifactHash,
      artifact: createdArtifact.json?.artifact,
    });
  }
  assertEvent("artifact.created", (event) => event.payload?.artifact_id === artifactId);

  const intentLink = cliJson([
    "workspace",
    "artifact",
    "link",
    "--project",
    PROJECT,
    "--artifact",
    artifactId,
    "--target-kind",
    "intent",
    "--target-id",
    intentId,
    "--json",
  ]);
  if (intentLink.json?.ok !== true) fail("artifact intent link failed", intentLink);
  assertEvent("artifact.linked", (event) =>
    event.payload?.artifact_id === artifactId &&
    event.payload?.metadata?.target_kind === "intent" &&
    event.payload?.metadata?.target_id === intentId
  );

  const executionLink = cliJson([
    "workspace",
    "artifact",
    "link",
    "--project",
    PROJECT,
    "--artifact",
    artifactId,
    "--target-kind",
    "execution",
    "--target-id",
    executionId,
    "--json",
  ]);
  if (executionLink.json?.ok !== true) fail("artifact execution link failed", executionLink);
  assertEvent("artifact.linked", (event) =>
    event.payload?.artifact_id === artifactId &&
    event.payload?.metadata?.target_kind === "execution" &&
    event.payload?.metadata?.target_id === executionId
  );
  step("artifact_created", {
    artifact_id: artifactId,
    content_hash: artifactHash,
    linked_to_intent: intentId,
    linked_to_execution: executionId,
  });

  const laneId = null;
  const queueItemId = null;
  step("lane_updated", {
    updated: false,
    lane_id: laneId,
    queue_item_id: queueItemId,
    reason: "No clean lane/queue mutation was meaningful for this read-only acceptance gesture; artifact links carry the canonical update.",
  });

  await restartDaemon();
  await ensureDaemon();

  const intentAfterRestart = cliJson(["intent", "show", intentId, "--json"]);
  if (intentAfterRestart.json?.intent?.intent_id !== intentId) fail("intent not queryable after restart", intentAfterRestart);
  const executionAfterRestart = cliJson(["execution", "show", "--execution", executionId, "--json"]);
  if (executionAfterRestart.json?.execution?.status !== "completed") {
    fail("execution not queryable as completed after restart", executionAfterRestart);
  }
  const artifactAfterRestart = cliJson([
    "workspace",
    "artifact",
    "show",
    "--project",
    PROJECT,
    "--artifact",
    artifactId,
    "--json",
  ]);
  if (artifactAfterRestart.json?.artifact?.id !== artifactId) {
    fail("artifact not queryable after restart", artifactAfterRestart);
  }
  const timelineAfterRestart = cliJson(["execution", "timeline", "--execution", executionId, "--json"]);
  const postRestartTypes = (timelineAfterRestart.json?.timeline ?? []).map((event) => event.kind);
  if (postRestartTypes.includes("execution.interrupted_by_restart")) {
    fail("completed execution was misclassified as interrupted_by_restart after restart", {
      execution_id: executionId,
      event_types: postRestartTypes,
    });
  }
  const postRestartEvents = cliJson([
    "events",
    "list",
    "--since",
    gestureStartedAt,
    "--limit",
    "1000",
    "--json",
  ]);
  const observedEvents = eventsForGesture(postRestartEvents.json?.events ?? [], {
    intentId,
    executionId,
    artifactId,
  });
  for (const required of REQUIRED_PROOF_EVENTS) {
    if (!observedEvents.includes(required)) {
      fail("post-restart event query missing gesture event", {
        required,
        observed_events: observedEvents,
      });
    }
  }
  step("restart_survived", {
    post_restart_query_ok: true,
    event_types: observedEvents,
    daemon_restart_method: RESTART_METHOD,
  });

  const codexVersion = run("codex", ["--version"], { timeout: 5_000 });
  if (codexVersion.code !== 0 || !codexVersion.stdout.trim()) {
    fail("codex --version failed", codexVersion);
  }
  const proof = {
    passed_at: new Date().toISOString(),
    intent_id: intentId,
    execution_id: executionId,
    artifact_id: artifactId,
    lane_id: laneId,
    queue_item_id: queueItemId,
    codex_version: codexVersion.stdout.trim(),
    context_pack_compiled: true,
    events_observed: REQUIRED_PROOF_EVENTS,
    daemon_restart_method: RESTART_METHOD,
    post_restart_query_ok: true,
    smoke_version: 1,
  };
  writeFileSync(PROOF, `${JSON.stringify(proof, null, 2)}\n`);
  step("proof_written", { proof_path: relative(ROOT, PROOF) });

  console.log(JSON.stringify({
    ok: true,
    command: "proslync-gesture-smoke",
    intent_option: selected.option,
    source_intent_id: selected.source_intent_id,
    intent_text: intentText,
    intent_id: intentId,
    execution_id: executionId,
    artifact_id: artifactId,
    lane_id: laneId,
    queue_item_id: queueItemId,
    context_pack_compiled: true,
    session_file_path: sessionFilePath,
    artifact_hash: artifactHash,
    events_observed: REQUIRED_PROOF_EVENTS,
    proof_path: relative(ROOT, PROOF),
    daemon_restart_method: RESTART_METHOD,
    post_restart_query_ok: true,
  }, null, 2));
}

function selectIntent() {
  if (existsSync(BACKFEED)) {
    const projection = JSON.parse(readFileSync(BACKFEED, "utf8"));
    const intents = Array.isArray(projection.intents) ? projection.intents : [];
    const preferred = intents.find((intent) =>
      intent?.id === "intent:626182643bf2fe3e" &&
      Array.isArray(intent.tags) &&
      intent.tags.includes("proslync_product_intent") &&
      intent.tags.includes("proslync_build_process_intent")
    ) ?? intents.find((intent) =>
      typeof intent?.raw_text === "string" &&
      intent.raw_text.length >= 120 &&
      intent.raw_text.length <= 500 &&
      Array.isArray(intent.tags) &&
      intent.tags.includes("proslync_product_intent")
    );
    if (preferred) {
      return {
        option: "real_backfeed_candidate",
        source_intent_id: preferred.id,
        source_path: preferred.source_path ?? null,
        source_tags: preferred.tags ?? [],
        raw_text: preferred.raw_text,
        intent_text: [
          `Read-only Proslync gesture proof for backfeed candidate ${preferred.id}.`,
          "Inspect the candidate and report its lane/queue mapping; do not modify files.",
          `Candidate text: ${preferred.raw_text}`,
        ].join(" "),
      };
    }
  }
  return {
    option: "synthetic_fallback",
    source_intent_id: null,
    source_path: null,
    source_tags: [],
    raw_text: SYNTHETIC_INTENT,
    intent_text: SYNTHETIC_INTENT,
  };
}

function compactWorkpack(workpack) {
  return {
    project: workpack.project ?? null,
    client: workpack.client ?? null,
    health: workpack.health ?? null,
    active_lane: workpack.agent_work?.active_lane ?? null,
    ready_queue: Array.isArray(workpack.agent_work?.ready_queue)
      ? workpack.agent_work.ready_queue.slice(0, 6)
      : [],
    builds: Array.isArray(workpack.agent_work?.builds) ? workpack.agent_work.builds : [],
    surfaces: Array.isArray(workpack.agent_work?.surfaces) ? workpack.agent_work.surfaces : [],
    hazards: Array.isArray(workpack.agent_work?.hazards) ? workpack.agent_work.hazards : [],
    verification_commands: Array.isArray(workpack.agent_work?.verification_commands)
      ? workpack.agent_work.verification_commands
      : [],
  };
}

function compactDispatchContext(contextPack) {
  return {
    project_id: contextPack.project?.id ?? null,
    project_name: contextPack.project?.name ?? PROJECT,
    active_lane_id: contextPack.active_lane?.id ?? null,
    active_lane_title: contextPack.active_lane?.title ?? null,
    ready_queue: (contextPack.ready_queue ?? []).slice(0, 3).map((item) => ({
      id: item.id ?? item.queue_item_id ?? null,
      title: item.title ?? null,
    })),
  };
}

function buildArtifactBody({ intentId, selected, contextPack, executionId, sessionFilePath, dispatch, timeline }) {
  return [
    "# Proslync Gesture Output",
    "",
    `intent_id: ${intentId}`,
    `source_intent_id: ${selected.source_intent_id ?? "synthetic"}`,
    `execution_id: ${executionId}`,
    `session_file_path: ${sessionFilePath}`,
    `project_id: ${contextPack.project?.id ?? PROJECT}`,
    `active_lane_id: ${contextPack.active_lane?.id ?? "none"}`,
    "",
    "## Intent",
    selected.intent_text,
    "",
    "## Codex Dispatch",
    `status: ${dispatch.json?.status ?? "unknown"}`,
    `exit_code: ${dispatch.json?.exit_code ?? "unknown"}`,
    `duration_ms: ${dispatch.json?.duration_ms ?? "unknown"}`,
    "",
    "## Canonical Timeline",
    ...((timeline.json?.timeline ?? []).map((event) => `- ${event.kind} ${event.event_id}`)),
    "",
    "## Captured Output",
    "The full Codex JSONL session is durable at the session_file_path above.",
    "",
  ].join("\n");
}

function eventsForGesture(events, ids) {
  const kinds = [];
  for (const event of events) {
    const payload = event.payload ?? {};
    const payloadText = JSON.stringify(payload);
    const matchesIntent = payload.intent_id === ids.intentId || payloadText.includes(ids.intentId);
    const matchesExecution = event.execution_id === ids.executionId || payloadText.includes(ids.executionId);
    const matchesArtifact = payload.artifact_id === ids.artifactId || payloadText.includes(ids.artifactId);
    if (matchesIntent || matchesExecution || matchesArtifact) kinds.push(event.kind);
  }
  return [...new Set(kinds)];
}

function assertEvent(kind, predicate) {
  const events = cliJson(["events", "list", "--kind", kind, "--limit", "300", "--json"]);
  const match = (events.json?.events ?? []).find((event) => event.kind === kind && predicate(event));
  if (!match) fail("canonical event missing", { kind, events: events.json?.events ?? [] });
  return match;
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
  const closed = await waitFor("daemon port to close", () =>
    listenerPids().length === 0 ? { ok: true } : null, { retries: 40, quiet: true });
  if (!closed) {
    stopDaemonByPort("SIGKILL");
    await waitFor("daemon port to close after SIGKILL", () =>
      listenerPids().length === 0 ? { ok: true } : null, { retries: 20 });
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
  const result = spawnSync("lsof", ["-t", "-nP", `-iTCP:${DAEMON_PORT}`, "-sTCP:LISTEN"], {
    encoding: "utf8",
  });
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
  const result = run(process.execPath, [CLI, ...args], options);
  let json = null;
  try {
    json = result.stdout.trim() ? JSON.parse(result.stdout) : null;
  } catch (err) {
    if (!options.allowFailure) {
      fail("failed to parse CLI JSON output", {
        args,
        stdout: result.stdout,
        stderr: result.stderr,
        error: String(err),
      });
    }
  }
  if (!options.allowFailure && result.code !== 0) {
    fail("CLI command failed", {
      args,
      code: result.code,
      stdout: result.stdout,
      stderr: result.stderr,
      json,
    });
  }
  return { ...result, json };
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    env: process.env,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: options.timeout ?? 10_000,
  });
  return {
    command,
    args,
    code: result.status ?? 1,
    signal: result.signal,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error ? String(result.error) : null,
  };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sanitize(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function step(stepName, details = {}) {
  console.log(JSON.stringify({
    ok: true,
    command: "proslync-gesture-smoke",
    step: stepName,
    ...details,
  }));
}

function fail(message, details = {}) {
  console.log(JSON.stringify({
    ok: false,
    command: "proslync-gesture-smoke",
    error: { message, details },
  }, null, 2));
  process.exit(1);
}
