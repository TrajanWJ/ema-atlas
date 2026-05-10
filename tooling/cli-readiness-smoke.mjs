#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "apps", "cli", "dist", "bin.js");
const DESKTOP_ROOT = process.env.EMA_DESKTOP_ROOT ?? path.join(homedir(), "Desktop");
process.env.EMA_IROH_MODE ??= "dev-loopback";
const PROJECT = process.env.EMA_SMOKE_PROJECT ?? "proslync-app-ios-final";
const REQUIRED = "lane,queue,agent,harness,intention,db,artifact,execution";
const STARTED = Date.now();
const MAX_TOTAL_MS = Number.parseInt(process.env.EMA_CLI_READINESS_MAX_MS ?? "90000", 10);
const RESTART_PROOF = path.join(ROOT, ".ema-dev", "restart-survival", "last-proof.json");
const CODEX_PROOF = path.join(ROOT, ".ema-dev", "codex-roundtrip", "last-proof.json");
const RESTART_PROOF_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const checks = [];

function run(args, options = {}) {
  const started = Date.now();
  const result = spawnSync("node", [CLI, ...args], {
    cwd: options.cwd ?? ROOT,
    env: { ...process.env, EMA_DESKTOP_ROOT: DESKTOP_ROOT },
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: options.timeout ?? 8_000,
  });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  return {
    args,
    code: result.status,
    signal: result.signal,
    ms: Date.now() - started,
    stdout,
    stderr,
    json: parseJson(stdout),
  };
}

function parseJson(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const lines = trimmed.split(/\r?\n/).filter(Boolean).reverse();
    for (const line of lines) {
      try {
        return JSON.parse(line);
      } catch {
        // Keep scanning; some commands may print contextual text first.
      }
    }
    return null;
  }
}

function assertCheck(name, result, predicate, detail) {
  const ok = predicate(result);
  checks.push({
    name,
    ok,
    command: `node ${path.relative(ROOT, CLI)} ${result.args.join(" ")}`,
    code: result.code,
    ms: result.ms,
    detail: ok ? detail?.(result) ?? null : failureDetail(result),
  });
}

function assertStaticCheck(name, ok, detail = null) {
  checks.push({
    name,
    ok,
    command: "static workspace check",
    code: ok ? 0 : 1,
    ms: 0,
    detail,
  });
}

function hasFreshRestartProof() {
  return hasFreshProof(RESTART_PROOF);
}

function hasFreshCodexProof() {
  return hasFreshProof(CODEX_PROOF);
}

function hasFreshProof(proofPath) {
  if (!existsSync(proofPath)) return false;
  try {
    const proof = JSON.parse(readFileSync(proofPath, "utf8"));
    const passedAt = typeof proof.passed_at === "string" ? Date.parse(proof.passed_at) : Number.NaN;
    return Number.isFinite(passedAt) && Date.now() - passedAt <= RESTART_PROOF_MAX_AGE_MS;
  } catch {
    return false;
  }
}

function failureDetail(result) {
  return {
    stdout: result.stdout.slice(0, 1200),
    stderr: result.stderr.slice(0, 1200),
    json: result.json,
    signal: result.signal,
  };
}

const ping = run(["ping", "--json"]);
assertCheck("daemon ping responds", ping, (r) => r.code === 0 && r.json?.ok === true && typeof r.json?.rtt_ms === "number");

const bootstrap = run(["bootstrap", "status", "--project", PROJECT, "--json"]);
assertCheck("bootstrap status passes required gate", bootstrap, (r) => r.code === 0 && r.json?.ok === true && Array.isArray(r.json?.required));

const capability = run(["capability", "assert", "--required", REQUIRED, "--project", PROJECT, "--json"]);
assertCheck("capability assert passes for swarm substrate", capability, (r) => r.code === 0 && r.json?.ok === true && Array.isArray(r.json?.failures) && r.json.failures.length === 0);

const codexCapability = run(["capability", "assert", "--required", "codex", "--project", PROJECT, "--json"], { timeout: 20_000 });
assertCheck(
  "codex capability is roundtrip-gated, not PATH-gated",
  codexCapability,
  (r) => {
    const payload = JSON.stringify(r.json);
    if (r.code === 0) {
      const capabilities = Array.isArray(r.json?.capabilities)
        ? r.json.capabilities
        : Array.isArray(r.json?.report?.capabilities)
          ? r.json.report.capabilities
          : [];
      return r.json?.ok === true &&
        Array.isArray(r.json?.failures) &&
        !r.json.failures.some((failure) => failure.id === "codex") &&
        capabilities.some((capability) => capability.id === "codex" &&
          capability.state === "daemon-backed" && /roundtrip/i.test(capability.evidence ?? ""));
    }
    return r.code === 1 &&
      r.json?.ok === false &&
      Array.isArray(r.json?.failures) &&
      r.json.failures.some((failure) => failure.id === "codex" &&
        failure.state === "roundtrip-failed" &&
        /roundtrip|smoke/i.test(failure.evidence ?? "")) &&
      !payload.includes("unexpected argument '--ask-for-approval'");
  },
);

const db = run(["db", "status", "--json"]);
assertCheck("db status exposes canonical events", db, (r) => r.code === 0 && r.json?.ok === true && r.json?.database?.tables?.includes("events"));

const events = run(["events", "list", "--project", PROJECT, "--kind", "dispatch.started", "--limit", "3", "--json"]);
assertCheck("events list reads canonical event rows", events, (r) => r.code === 0 && r.json?.ok === true && Array.isArray(r.json?.events));

const executions = run(["execution", "list", "--project", PROJECT, "--limit", "5", "--json"]);
assertCheck("execution list projects event registry", executions, (r) => r.code === 0 && r.json?.ok === true && Array.isArray(r.json?.executions));

const dispatches = run(["dispatch", "list", "--project", PROJECT, "--limit", "5", "--json"]);
assertCheck("dispatch list projects dispatch registry", dispatches, (r) => r.code === 0 && r.json?.ok === true && Array.isArray(r.json?.dispatches));

const registry = run(["project", "registry", "show", "--project", PROJECT, "--json"]);
assertCheck("project registry shows Proslync active builds", registry, (r) => r.code === 0 && r.json?.ok === true && r.json?.active_builds?.length >= 4);

const restartProofFresh = hasFreshRestartProof();
const codexProofFresh = hasFreshCodexProof();
const proofBlockersRemain = !restartProofFresh || !codexProofFresh;
const readiness = run(["readiness", "--json"], { timeout: 20_000 });
assertCheck(
  "readiness reports structured substrate truth",
  readiness,
  (r) => {
    const components = r.json?.substrate_translated?.components;
    return r.code === (proofBlockersRemain ? 1 : 0) &&
      r.json?.ok === !proofBlockersRemain &&
      r.json?.command === "readiness" &&
      r.json?.substrate_translated &&
      typeof r.json.substrate_translated.summary === "string" &&
      components &&
      typeof components.daemon_runtime === "string" &&
      typeof components.intent_writer === "string" &&
      typeof components.lane_writer === "string" &&
      typeof components.queue_writer === "string" &&
      typeof components.execution_writer === "string" &&
      typeof components.dispatch_writer === "string" &&
      components.artifact_writer === "beam" &&
      components.canon_writer === "beam" &&
      typeof components.event_log_writer === "string" &&
      r.json.proslync_execution_ready === !proofBlockersRemain &&
      Array.isArray(r.json.blockers) &&
      (codexProofFresh
        ? !r.json.blockers.some((blocker) => blocker.id === "codex_roundtrip")
        : r.json.blockers.some((blocker) => blocker.id === "codex_roundtrip")) &&
      !r.json.blockers.some((blocker) => blocker.id === "artifact_context_writeback") &&
      (restartProofFresh
        ? !r.json.blockers.some((blocker) => blocker.id === "proslync_restart_survival")
        : r.json.blockers.some((blocker) => blocker.id === "proslync_restart_survival"));
  },
);

const proslync = run(["proslync", "bootstrap", "--json"], { timeout: 20_000 });
assertCheck(
  "proslync bootstrap mirrors readiness blockers",
  proslync,
  (r) =>
    r.code === (proofBlockersRemain ? 1 : 0) &&
    r.json?.ok === !proofBlockersRemain &&
    r.json?.project?.project === PROJECT &&
    Array.isArray(r.json?.next_safe_commands) &&
    Array.isArray(r.json?.blockers) &&
    !r.json.blockers.some((blocker) => blocker.id === "artifact_context_writeback") &&
    (codexProofFresh
      ? !r.json.blockers.some((blocker) => blocker.id === "codex_roundtrip")
      : r.json.blockers.some((blocker) => blocker.id === "codex_roundtrip")),
);

const providers = run(["harness", "providers", "--json"]);
assertCheck(
  "harness providers are honest about adapters",
  providers,
  (r) => {
    if (r.code !== 0 || r.json?.ok !== true || !Array.isArray(r.json?.providers)) return false;
    const byId = new Map(r.json.providers.map((provider) => [provider.id, provider.status]));
    return byId.get("simulated") === "ready" && byId.get("codex") === "adapter_available" && byId.get("claude-code") === "unsupported_provider_adapter" && byId.get("hermes") === "unsupported_provider_adapter";
  },
);

const doctor = run(["doctor", "--json"], { timeout: 20_000 });
assertCheck(
  "doctor default exposes readiness blockers separately from health",
  doctor,
  (r) =>
    r.code === 0 &&
    r.json?.ok === true &&
    r.json?.health_ok === true &&
    r.json?.readiness_ok === !proofBlockersRemain &&
    Array.isArray(r.json?.readiness_blockers) &&
    (codexProofFresh
      ? !r.json.readiness_blockers.some((blocker) => blocker.id === "codex_roundtrip")
      : r.json.readiness_blockers.some((blocker) => blocker.id === "codex_roundtrip")) &&
    !r.json.readiness_blockers.some((blocker) => blocker.id === "artifact_context_writeback") &&
    (restartProofFresh
      ? !r.json.readiness_blockers.some((blocker) => blocker.id === "proslync_restart_survival")
      : r.json.readiness_blockers.some((blocker) => blocker.id === "proslync_restart_survival")),
);

const tick = run(["vcalendar", "tick", "--project", "EMA", "--json"], { cwd: DESKTOP_ROOT });
assertCheck(
  "vcalendar tick uses scoped-orientation instruction text",
  tick,
  (r) => {
    const payload = JSON.stringify(r.json);
    return r.code === 0 &&
      r.json?.ok === true &&
      payload.includes("ema agent orient --project <project> --json") &&
      !payload.includes("ema agent orient --json");
  },
);

const help = run(["help"]);
assertCheck(
  "help prints health-first general orientation",
  help,
  (r) =>
    r.code === 0 &&
    r.stdout.includes("ema ping --json") &&
    r.stdout.includes("ema status --json") &&
    r.stdout.includes("ema doctor --json") &&
    r.stdout.includes("add --project <name-or-id> when the task names a project"),
);

const emaOrient = run(["agent", "orient", "--project", "EMA", "--json"], { cwd: DESKTOP_ROOT });
assertCheck(
  "agent orient renders reusable scoped commands",
  emaOrient,
  (r) => {
    if (r.code !== 0 || r.json?.ok !== true || !Array.isArray(r.json?.commands)) return false;
    const commands = r.json.commands;
    const payload = JSON.stringify(r.json);
    return commands.includes("ema ping --project EMA --json") &&
      commands.includes("ema status --project EMA --json") &&
      commands.includes("ema tl about --project EMA --summary --json") &&
      !commands.some((command) => command.includes("--json --project")) &&
      !payload.includes("ema next --json") &&
      !payload.includes("ema agent orient --json");
  },
);

const emaNext = run(["next", "--project", "EMA", "--json"], { cwd: DESKTOP_ROOT });
assertCheck(
  "next renders reusable scoped next command",
  emaNext,
  (r) => {
    const nextCommand = typeof r.json?.next_command === "string" ? r.json.next_command : "";
    return r.code === 0 &&
      r.json?.ok === true &&
      nextCommand.includes("--project EMA") &&
      !nextCommand.includes("--json --project");
  },
);

const currentAgentDocs = [
  path.join(DESKTOP_ROOT, "AGENTS.md"),
  path.join(DESKTOP_ROOT, "CLAUDE.md"),
  path.join(ROOT, "AGENTS.md"),
  path.join(ROOT, "CLAUDE.md"),
  path.join(ROOT, "docs", "WORKSPACE-ENTRYPOINT.md"),
  path.join(ROOT, "docs", "cli", "agent-workspace.md"),
  path.join(ROOT, "docs", "cli", "see-agent-work.md"),
  path.join(ROOT, "docs", "agents", "see-agent-work-agent-usage.md"),
  path.join(ROOT, "docs", "architecture", "01-topology.md"),
  path.join(ROOT, "docs", "architecture", "10-first-boot.md"),
  path.join(DESKTOP_ROOT, "Projects", "EMA", "atlas", "canon", "current", "_node.md"),
  path.join(DESKTOP_ROOT, "Projects", "EMA", "atlas", "canon", "current", "ema-0-0-6-current-canon.md"),
];

const staleDocPatterns = [
  /Founding-Fathers-EMA/,
  /EMA 0\.0\.5/,
  /multi-first-command/,
  /central[- ]tracker/i,
  /EMA_HOME=Active builds\/EMA-0\.0\.5/,
  /ema next --json/,
  /ema agent orient --json/,
];

for (const filePath of currentAgentDocs) {
  try {
    const text = readFileSync(filePath, "utf8");
    const matched = staleDocPatterns.filter((pattern) => pattern.test(text));
    assertStaticCheck(
      `current agent/env doc is scoped to EMA 0.0.6: ${path.relative(DESKTOP_ROOT, filePath)}`,
      matched.length === 0,
      matched.length === 0 ? null : { file: filePath, patterns: matched.map(String) },
    );
  } catch (error) {
    assertStaticCheck(
      `current agent/env doc is readable: ${path.relative(DESKTOP_ROOT, filePath)}`,
      false,
      { file: filePath, error: error instanceof Error ? error.message : String(error) },
    );
  }
}

const totalMs = Date.now() - STARTED;
const failed = checks.filter((check) => !check.ok);
if (totalMs > MAX_TOTAL_MS) {
  failed.push({
    name: "cli readiness runtime budget",
    ok: false,
    command: "pnpm cli:readiness",
    code: null,
    ms: totalMs,
    detail: { max_ms: MAX_TOTAL_MS, actual_ms: totalMs },
  });
}

const payload = {
  ok: failed.length === 0,
  command: "cli-readiness-smoke",
  desktop_root: DESKTOP_ROOT,
  project: PROJECT,
  max_total_ms: MAX_TOTAL_MS,
  total_ms: totalMs,
  checked: checks.length + (totalMs > MAX_TOTAL_MS ? 1 : 0),
  failed: failed.length,
  checks,
};

console.log(JSON.stringify(payload));
process.exit(failed.length === 0 ? 0 : 1);
