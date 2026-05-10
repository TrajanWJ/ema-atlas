import { existsSync, readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { connect } from "../ws-client.js";
import { resolveWorkspaceScope } from "../workspace-scope.js";
import { EMA_ACTIVE_BUILD } from "../workspace-state.js";
import { commandExists, dbStatus } from "./substrate-utils.js";
import { readFreshRoundtrip } from "./capability-roundtrip-cache.js";

type CapabilityState =
  | "daemon-backed"
  | "file-backed"
  | "simulated-only"
  | "roundtrip-failed"
  | "unsupported-provider-adapter"
  | "stubbed"
  | "missing";

type Capability = {
  id: string;
  state: CapabilityState;
  commands: string[];
  evidence: string;
  blocks_proslync_swarm: boolean;
};

export async function runCapability(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0] ?? "list";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return help(args);
  if (verb === "list") return list(args);
  if (verb === "assert") return assertRequired(args);
  emitError(`ema capability: unknown subcommand "${verb}" (expected: list | assert)`);
  return 64;
}

type CapabilityReportOptions = {
  readonly checkRoundtripProviders?: readonly string[];
};

function help(args: ParsedArgs): number {
  const commands = [
    { verb: "list", summary: "Classify CLI/daemon capabilities for agent bootstrap." },
    { verb: "assert", summary: "Fail unless required capabilities are usable." },
  ];
  if (flagBool(args, "json")) emitJson({ noun: "capability", status: "available", commands });
  else {
    emitPretty("ema capability - honest substrate readiness");
    for (const command of commands) emitPretty(`  ${command.verb.padEnd(10)} ${command.summary}`);
  }
  return 0;
}

export async function capabilityReport(args: ParsedArgs, options: CapabilityReportOptions = {}) {
  const scope = await resolveWorkspaceScope({ args });
  const daemon = await daemonStatus();
  const db = dbStatus();
  const capabilities = capabilityList(db.ok, options);
  const staleDocs = [
    join(EMA_ACTIVE_BUILD, "docs", "WORKSPACE-ENTRYPOINT.md"),
    "/Users/trajanm4air/Desktop/Projects/EMA/atlas/canon/current/ema-0-0-5-current-canon.md",
    "/Users/trajanm4air/Desktop/Projects/EMA/atlas/workspace/README.md",
  ].map((path) => ({ path, exists: existsSync(path), stale_marker: existsSync(path) ? containsStaleMarker(path) : false }));
  return {
    ok: daemon.ok && db.ok,
    command: "capability.list",
    source: "cli_static_checks_plus_daemon_ping",
    daemon,
    database: db,
    cli: cliFreshness(),
    workspace_scope: scope,
    stale_docs: staleDocs,
    capabilities,
  };
}

async function list(args: ParsedArgs): Promise<number> {
  const report = await capabilityReport(args);
  if (flagBool(args, "json")) emitJson(report);
  else {
    for (const capability of report.capabilities) {
      emitPretty(`${capability.id.padEnd(14)} ${capability.state}`);
    }
  }
  return report.ok ? 0 : 1;
}

async function assertRequired(args: ParsedArgs): Promise<number> {
  const required = (flagString(args, "required") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const cached = required.includes("codex") ? readFreshRoundtrip("codex").ok : false;
  const report = await capabilityReport(args, { checkRoundtripProviders: required.includes("codex") ? ["codex"] : [] });
  const capabilityMap = new Map(report.capabilities.map((capability) => [capability.id, capability]));
  const failures = required
    .map((id) => capabilityMap.get(id) ?? { id, state: "missing" as CapabilityState, commands: [], evidence: "not registered", blocks_proslync_swarm: true })
    .filter(isFailureState);
  const payload = {
    ok: failures.length === 0 && report.daemon.ok && report.database.ok,
    command: "capability.assert",
    required,
    cached,
    failures,
    report,
  };
  if (flagBool(args, "json")) emitJson(payload);
  else if (payload.ok) emitPretty(`capability assert passed: ${required.join(", ")}`);
  else {
    emitError(`capability assert failed: ${failures.map((failure) => `${failure.id}:${failure.state}`).join(", ")}`);
  }
  return payload.ok ? 0 : 1;
}

function capabilityList(dbOk: boolean, options: CapabilityReportOptions): Capability[] {
  return [
    cap("lane", "daemon-backed", ["ema lane open/list/show/claim/block/move/release/close"], "daemon lane registry and lifecycle writers exist", false),
    cap("queue", "daemon-backed", ["ema queue add/list/show/ready/block/close"], "daemon queue registry and lifecycle writers exist", false),
    cap("campaign", "daemon-backed", ["ema campaign create/list/show/archive"], "daemon campaign registry exists", false),
    cap("mission", "daemon-backed", ["ema mission create/list/show/start/pause/complete"], "daemon mission registry exists", false),
    cap("handoff", "daemon-backed", ["ema handoff request/list/accept/reject/complete"], "daemon handoff registry exists", false),
    cap("problem", "daemon-backed", ["ema problem log/list/show/solution/link"], "daemon problem graph exists", false),
    cap("agent", "daemon-backed", ["ema agent orient/report/meta-progress"], "agent report writes and orientation projections exist", false),
    cap("checkup", "daemon-backed", ["ema checkup schedule/complete/runtime"], "daemon checkup writers exist; periodic actor still future", false),
    cap("vcalendar", "file-backed", ["ema vcalendar show/week/tick/block/phase"], "writes are daemon-backed; show/week still event-trail/fallback", false),
    cap("cockpit", "file-backed", ["ema cockpit workpack/projection"], "composite of daemon projections, git facts, and file-backed intentions", false),
    cap("intention", "file-backed", ["ema intention list/review/backfeed"], "review projection is file-backed; accepted backfeed can create queue/artifact", false),
    cap("harness", "simulated-only", ["ema harness dispatch --provider simulated"], "simulated dispatch writes canonical events; real providers guarded", false),
    cap("db", dbOk ? "daemon-backed" : "missing", ["ema db status/events/snapshot"], "canonical SQLite events are readable", true),
    cap("artifact", "daemon-backed", ["ema workspace artifact add/update/list/show/link/archive"], "artifact mutations route through daemon artifact.* writers and canonical events", true),
    cap("execution", dbOk ? "daemon-backed" : "missing", ["ema execution list/show/timeline", "ema dispatch list"], "canonical dispatch/execution/tool event reads", true),
    codexCapability(options),
    cap("claude", "unsupported-provider-adapter", ["ema harness dispatch --provider claude-code"], "future adapter; do not present as ready", false),
    cap("hermes", "unsupported-provider-adapter", ["ema harness dispatch --provider hermes"], "future adapter; do not present as ready", false),
  ];
}

function cap(id: string, state: CapabilityState, commands: string[], evidence: string, blocks: boolean): Capability {
  return { id, state, commands, evidence, blocks_proslync_swarm: blocks };
}

function isFailureState(capability: { state: CapabilityState }): boolean {
  return capability.state === "missing" ||
    capability.state === "stubbed" ||
    capability.state === "roundtrip-failed" ||
    capability.state === "unsupported-provider-adapter";
}

function codexCapability(options: CapabilityReportOptions): Capability {
  const commands = ["ema harness dispatch --provider codex --prompt <internal capability check> --json"];
  if (!commandExists("codex")) {
    return cap("codex", "missing", commands, "Codex CLI is not on PATH; no executable roundtrip can run.", true);
  }
  const fresh = readFreshRoundtrip("codex");
  if (fresh.ok) {
    return cap(
      "codex",
      "daemon-backed",
      commands,
      `recent successful Codex roundtrip at ${fresh.entry.completed_at} (${Math.round(fresh.age_ms / 1000)}s old): ${fresh.entry.evidence}`,
      false,
    );
  }
  if (!options.checkRoundtripProviders?.includes("codex")) {
    return cap(
      "codex",
      "roundtrip-failed",
      commands,
      `Codex CLI detected, but ${fresh.reason}; capability assert --required codex must run a smoke roundtrip before this can pass.`,
      true,
    );
  }
  const smoke = runCodexCapabilitySmoke();
  if (smoke.ok) {
    const freshAfterSmoke = readFreshRoundtrip("codex");
    if (freshAfterSmoke.ok) {
      return cap("codex", "daemon-backed", commands, `successful Codex capability smoke at ${freshAfterSmoke.entry.completed_at}: ${freshAfterSmoke.entry.evidence}`, false);
    }
    return cap("codex", "roundtrip-failed", commands, `Codex capability smoke returned ok but proof is not fresh: ${freshAfterSmoke.reason}`, true);
  }
  return cap("codex", "roundtrip-failed", commands, smoke.evidence, true);
}

function runCodexCapabilitySmoke(): { ok: true; evidence: string } | { ok: false; evidence: string } {
  const cli = process.argv[1] && existsSync(process.argv[1])
    ? process.argv[1]
    : join(EMA_ACTIVE_BUILD, "apps", "cli", "dist", "bin.js");
  const result = spawnSync(process.execPath, [
    cli,
    "harness",
    "dispatch",
    "--provider",
    "codex",
    "--prompt",
    "EMA capability check: execute a minimal Codex roundtrip and exit without editing files.",
    "--mode",
    "capability-check",
    "--timeout-ms",
    "12000",
    "--json",
  ], {
    cwd: EMA_ACTIVE_BUILD,
    env: { ...process.env, EMA_CAPABILITY_SMOKE: "1" },
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    timeout: 15_000,
  });
  const payload = parseJson(result.stdout);
  const ok = result.status === 0 && payload?.ok === true && payload.provider === "codex";
  if (ok) {
    const executionId = executionIdFrom(payload);
    return { ok: true, evidence: `ema harness dispatch --provider codex capability smoke completed (${executionId})` };
  }
  const detail = firstNonEmpty(
    typeof payload?.stderr === "string" ? payload.stderr : null,
    typeof payload?.error === "string" ? payload.error : null,
    result.stderr,
    result.stdout,
    result.error ? String(result.error) : null,
  );
  return {
    ok: false,
    evidence: `Codex capability smoke failed via ema harness dispatch --provider codex --mode capability-check (exit ${result.status ?? "signal"}): ${summarize(detail)}`,
  };
}

function parseJson(stdout: string): Record<string, unknown> | null {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function executionIdFrom(payload: Record<string, unknown>): string {
  const execution = payload.execution;
  if (!execution || typeof execution !== "object" || Array.isArray(execution)) return "execution:unknown";
  const id = (execution as { id?: unknown }).id;
  return typeof id === "string" ? id : "execution:unknown";
}

function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    if (value && value.trim().length > 0) return value.trim();
  }
  return "no stdout or stderr captured";
}

function summarize(value: string): string {
  return value.length > 500 ? `${value.slice(0, 497)}...` : value;
}

async function daemonStatus() {
  try {
    const c = await connect({ surface: "desktop" });
    const rtt = await c.ping();
    const status = { ok: true, url: "ws://127.0.0.1:49555", rtt_ms: rtt, daemon_version: c.hello?.daemon_version ?? null };
    c.close();
    return status;
  } catch (err) {
    return { ok: false, url: "ws://127.0.0.1:49555", error: err instanceof Error ? err.message : String(err) };
  }
}

function cliFreshness() {
  const src = join(EMA_ACTIVE_BUILD, "apps", "cli", "src", "bin.ts");
  const dist = join(EMA_ACTIVE_BUILD, "apps", "cli", "dist", "bin.js");
  const srcMtime = existsSync(src) ? statSync(src).mtimeMs : null;
  const distMtime = existsSync(dist) ? statSync(dist).mtimeMs : null;
  return {
    source: src,
    dist,
    dist_exists: existsSync(dist),
    dist_older_than_source: srcMtime !== null && distMtime !== null ? distMtime < srcMtime : null,
  };
}

function containsStaleMarker(path: string): boolean {
  try {
    const text = readFileSync(path, "utf8");
    return /0\.0\.5|EMA-0\.0\.5|Founding-Fathers-EMA/.test(text);
  } catch {
    return false;
  }
}
