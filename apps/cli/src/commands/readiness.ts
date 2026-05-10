import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ParsedArgs } from "../args.js";
import { flagBool } from "../args.js";
import { emitJson, emitPretty } from "../output.js";
import { EMA_ACTIVE_BUILD } from "../workspace-state.js";
import { connect } from "../ws-client.js";
import { capabilityReport } from "./capability.js";
import { readFreshCodexRoundtripProof } from "./capability-roundtrip-cache.js";
import { intentById } from "./pipeline-store.js";
import { DEFAULT_ORG } from "./workspace-daemon.js";

type ComponentRuntime = "beam" | "node" | "hybrid" | "absent";
type Summary = "none" | "partial" | "full";

export interface ReadinessBlocker {
  readonly id: string;
  readonly severity: "blocking";
  readonly reason: string;
}

export interface SubstrateTranslation {
  readonly summary: Summary;
  readonly components: {
    readonly daemon_runtime: "beam" | "node" | "absent";
    readonly intent_writer: ComponentRuntime;
    readonly lane_writer: ComponentRuntime;
    readonly queue_writer: ComponentRuntime;
    readonly execution_writer: ComponentRuntime;
    readonly dispatch_writer: ComponentRuntime;
    readonly artifact_writer: ComponentRuntime;
    readonly canon_writer: ComponentRuntime;
    readonly event_log_writer: ComponentRuntime;
  };
}

export interface ReadinessReport {
  readonly ok: boolean;
  readonly command: "readiness";
  readonly substrate_translated: SubstrateTranslation;
  readonly coordination_ready: boolean;
  readonly proslync_execution_ready: boolean;
  readonly blockers: ReadinessBlocker[];
}

export interface CapabilityReadinessState {
  readonly codex_roundtrip_ready: boolean;
  readonly codex_evidence: string;
}

export interface RestartProofState {
  readonly fresh: boolean;
  readonly path: string;
  readonly passed_at: string | null;
  readonly age_ms: number | null;
  readonly reason: string;
}

const RESTART_PROOF_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const RESTART_PROOF_PATH = join(EMA_ACTIVE_BUILD, ".ema-dev", "restart-survival", "last-proof.json");
const INTENT_WRITER_CACHE_PATH = join(EMA_ACTIVE_BUILD, ".ema-dev", "readiness", "intent-writer.json");
const INTENT_WRITER_SUCCESS_TTL_MS = 60 * 1000;
const INTENT_WRITER_FAILURE_TTL_MS = 15 * 1000;
const ARTIFACT_WORKSPACE_COMMAND_PATH = join(EMA_ACTIVE_BUILD, "apps", "cli", "src", "commands", "workspace.ts");
const ARTIFACT_DAEMON_WRITER_PATH = join(EMA_ACTIVE_BUILD, "apps", "daemon", "src", "ema_artifact", "ema_artifact.gleam");
const ARTIFACT_IPC_PATH = join(EMA_ACTIVE_BUILD, "apps", "daemon", "src", "ema_shell_ipc", "ema_shell_ipc.gleam");
const CANON_CLI_PATH = join(EMA_ACTIVE_BUILD, "apps", "cli", "src", "commands", "canon.ts");
const CANON_DAEMON_WRITER_PATH = join(EMA_ACTIVE_BUILD, "apps", "daemon", "src", "ema_canon", "ema_canon.gleam");
const CANON_IPC_PATH = join(EMA_ACTIVE_BUILD, "apps", "daemon", "src", "ema_shell_ipc", "ema_shell_ipc.gleam");

const BLOCKER = {
  codexRoundtrip: "codex_roundtrip",
  proslyncRestartSurvival: "proslync_restart_survival",
  artifactContextWriteback: "artifact_context_writeback",
} as const;

export async function buildReadiness(args: ParsedArgs): Promise<{
  readonly report: ReadinessReport;
  readonly capability: Awaited<ReturnType<typeof capabilityReport>>;
}> {
  const capability = await capabilityReport(args, { checkRoundtripProviders: ["codex"] });
  const substrate = await classifySubstrate();
  const codex = capability.capabilities.find((item) => item.id === "codex");
  const codexProof = readFreshCodexRoundtripProof();
  const capabilityState: CapabilityReadinessState = {
    codex_roundtrip_ready: codexProof.ok,
    codex_evidence: codexProof.ok
      ? `fresh Codex roundtrip proof at ${codexProof.proof.passed_at}: ${codexProof.proof.execution_id}`
      : `${codexProof.reason}; capability evidence: ${codex?.evidence ?? "Codex capability is not registered"}`,
  };
  const restartProof = readRestartProofState();
  const blockers = deriveBlockers(substrate, capabilityState, restartProof);
  const coordinationReady =
    capability.daemon.ok &&
    capability.database.ok &&
    substrate.components.lane_writer === "beam" &&
    substrate.components.queue_writer === "beam" &&
    substrate.components.dispatch_writer === "beam" &&
    substrate.components.execution_writer === "beam" &&
    substrate.components.event_log_writer === "beam";
  const proslyncExecutionReady = coordinationReady && blockers.length === 0;
  return {
    capability,
    report: {
      ok: proslyncExecutionReady,
      command: "readiness",
      substrate_translated: substrate,
      coordination_ready: coordinationReady,
      proslync_execution_ready: proslyncExecutionReady,
      blockers,
    },
  };
}

export async function runReadiness(args: ParsedArgs): Promise<number> {
  if (flagBool(args, "help") || args.flags.h === true || args.positional[0] === "help") {
    const commands = [{ verb: "run", summary: "Report current substrate and Proslync execution readiness truth." }];
    if (flagBool(args, "json")) emitJson({ noun: "readiness", status: "available", commands });
    else emitPretty("ema readiness [--json]");
    return 0;
  }
  const { report } = await buildReadiness(args);
  if (flagBool(args, "json")) emitJson(report);
  else {
    emitPretty(`readiness: ${report.proslync_execution_ready ? "ready" : "blocked"}`);
    emitPretty(`substrate: ${report.substrate_translated.summary}`);
    for (const blocker of report.blockers) emitPretty(`  - ${blocker.id}: ${blocker.reason}`);
  }
  return report.ok ? 0 : 1;
}

async function classifySubstrate(): Promise<SubstrateTranslation> {
  const intentWriter = await classifyIntentWriter();
  const artifactWriter = classifyArtifactWriter();
  const canonWriter = classifyCanonWriter();
  const components: SubstrateTranslation["components"] = {
    daemon_runtime: existsSync(join(EMA_ACTIVE_BUILD, "apps", "daemon", "src", "ema_daemon", "supervisor.gleam")) ? "beam" : "absent",
    // This means canonical pipeline-floor `intent.created`, not legacy
    // harvested-session `ema intention ...` behavior.
    intent_writer: intentWriter,
    lane_writer: "beam",
    queue_writer: "beam",
    execution_writer: "beam",
    dispatch_writer: "beam",
    artifact_writer: artifactWriter,
    canon_writer: canonWriter,
    event_log_writer: "beam",
  };
  return {
    summary: summarizeComponents(Object.values(components)),
    components,
  };
}

function classifyCanonWriter(): ComponentRuntime {
  const cli = readSourceIfPresent(CANON_CLI_PATH);
  const daemonWriter = readSourceIfPresent(CANON_DAEMON_WRITER_PATH);
  const ipc = readSourceIfPresent(CANON_IPC_PATH);
  const cliWritesThroughDaemon = cli !== null && [
    "client.command(\"canon.write\"",
    "client.command(\"canon.supersede\"",
  ].every((needle) => cli.includes(needle));
  const daemonOwnsCanonEvents = daemonWriter !== null && [
    "pub fn write_canon",
    "pub fn supersede_canon",
    "canon.written",
    "canon.superseded",
    "HashMismatch",
  ].every((needle) => daemonWriter.includes(needle));
  const ipcExposesDaemonWriter = ipc !== null && [
    "Some(\"canon.write\")",
    "Some(\"canon.supersede\")",
  ].every((needle) => ipc.includes(needle));
  return cliWritesThroughDaemon && daemonOwnsCanonEvents && ipcExposesDaemonWriter ? "beam" : "absent";
}

function classifyArtifactWriter(): ComponentRuntime {
  const workspaceCommand = readSourceIfPresent(ARTIFACT_WORKSPACE_COMMAND_PATH);
  const daemonWriter = readSourceIfPresent(ARTIFACT_DAEMON_WRITER_PATH);
  const ipc = readSourceIfPresent(ARTIFACT_IPC_PATH);
  if (!workspaceCommand) return "absent";

  const cliWritesThroughDaemon = [
    "artifactCommand(\"artifact.create\"",
    "artifactCommand(\"artifact.update\"",
    "artifactCommand(\"artifact.link\"",
    "artifactCommand(\"artifact.archive\"",
  ].every((needle) => workspaceCommand.includes(needle));
  const daemonOwnsArtifactEvents = daemonWriter !== null && [
    "pub fn create_artifact",
    "pub fn update_artifact",
    "pub fn link_artifact",
    "pub fn archive_artifact",
    "write_content(",
    "artifact.created",
    "artifact.updated",
    "artifact.linked",
    "artifact.archived",
  ].every((needle) => daemonWriter.includes(needle));
  const ipcExposesDaemonWriter = ipc !== null && [
    "Some(\"artifact.create\")",
    "Some(\"artifact.update\")",
    "Some(\"artifact.link\")",
    "Some(\"artifact.archive\")",
  ].every((needle) => ipc.includes(needle));
  const hasLegacyLocalWritePath =
    workspaceCommand.includes("local_index_until_daemon_writer") ||
    workspaceCommand.includes("hybrid_file_sqlite_index") ||
    workspaceCommand.includes("sqliteExec(") ||
    workspaceCommand.includes("writeText(");

  if (cliWritesThroughDaemon && daemonOwnsArtifactEvents && ipcExposesDaemonWriter && !hasLegacyLocalWritePath) return "beam";
  if (hasLegacyLocalWritePath && (cliWritesThroughDaemon || daemonOwnsArtifactEvents || ipcExposesDaemonWriter)) return "hybrid";
  if (hasLegacyLocalWritePath) return "node";
  return "absent";
}

function readSourceIfPresent(path: string): string | null {
  if (!existsSync(path)) return null;
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

async function classifyIntentWriter(): Promise<ComponentRuntime> {
  const cached = readIntentWriterCache();
  const cachedAge = cached ? Date.now() - Date.parse(cached.checked_at) : Number.POSITIVE_INFINITY;
  if (cached && Number.isFinite(cachedAge)) {
    const ttl = cached.ok ? INTENT_WRITER_SUCCESS_TTL_MS : INTENT_WRITER_FAILURE_TTL_MS;
    if (cachedAge <= ttl) return cached.ok ? "beam" : "absent";
  }

  const smokeId = `READINESS-INTENT-WRITER-${Date.now()}`;
  let client: Awaited<ReturnType<typeof connect>> | null = null;
  try {
    client = await connect({ surface: "desktop" });
    const result = await client.command("intent.create", {
      org_id: DEFAULT_ORG,
      intent: smokeId,
      title: "Readiness intent writer smoke",
      target_kind: "bootstrap",
      status: "open",
      actor_id: "actor:01J00000000000000000000004",
      project_id: "ema-0-0-6",
      label: smokeId.toLowerCase(),
      done_when: "Canonical intent writer smoke succeeds",
    });
    const ok = result.ok === true && intentById(smokeId) !== null;
    writeIntentWriterCache({
      ok,
      checked_at: new Date().toISOString(),
      reason: ok ? "intent.created roundtrip succeeded" : "intent.created roundtrip failed to project",
    });
    return ok ? "beam" : "absent";
  } catch (err) {
    writeIntentWriterCache({
      ok: false,
      checked_at: new Date().toISOString(),
      reason: err instanceof Error ? err.message : String(err),
    });
    return "absent";
  } finally {
    client?.close();
  }
}

interface IntentWriterCache {
  readonly ok: boolean;
  readonly checked_at: string;
  readonly reason: string;
}

function readIntentWriterCache(): IntentWriterCache | null {
  if (!existsSync(INTENT_WRITER_CACHE_PATH)) return null;
  try {
    const parsed = JSON.parse(readFileSync(INTENT_WRITER_CACHE_PATH, "utf8")) as Partial<IntentWriterCache>;
    if (typeof parsed.ok !== "boolean" || typeof parsed.checked_at !== "string") return null;
    return { ok: parsed.ok, checked_at: parsed.checked_at, reason: typeof parsed.reason === "string" ? parsed.reason : "" };
  } catch {
    return null;
  }
}

function writeIntentWriterCache(cache: IntentWriterCache): void {
  mkdirSync(dirname(INTENT_WRITER_CACHE_PATH), { recursive: true });
  writeFileSync(INTENT_WRITER_CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`);
}

function summarizeComponents(values: readonly ComponentRuntime[]): Summary {
  if (values.every((value) => value === "beam")) return "full";
  if (values.every((value) => value === "absent" || value === "node")) return "none";
  return "partial";
}

export function deriveBlockers(
  substrate: SubstrateTranslation,
  capability: CapabilityReadinessState,
  restartProof: RestartProofState,
): ReadinessBlocker[] {
  const blockers: ReadinessBlocker[] = [];
  if (!capability.codex_roundtrip_ready) {
    blockers.push({
      id: BLOCKER.codexRoundtrip,
      severity: "blocking",
      reason: `Codex capability requires a completed executable roundtrip; current adapter evidence: ${capability.codex_evidence}`,
    });
  }
  if (!restartProof.fresh) {
    blockers.push({
      id: BLOCKER.proslyncRestartSurvival,
      severity: "blocking",
      reason: `Proslync execution readiness requires restart-survival proof; ${restartProof.reason}.`,
    });
  }
  if (substrate.components.artifact_writer === "hybrid" || substrate.components.artifact_writer === "absent") {
    blockers.push({
      id: BLOCKER.artifactContextWriteback,
      severity: "blocking",
      reason: `Proslync execution readiness requires artifact/context writeback to be daemon-owned end-to-end; current artifact writer is ${substrate.components.artifact_writer}.`,
    });
  }
  if (substrate.components.canon_writer !== "beam") {
    blockers.push({
      id: BLOCKER.artifactContextWriteback,
      severity: "blocking",
      reason: `Proslync execution readiness requires execution result writeback to canon; current canon writer is ${substrate.components.canon_writer}.`,
    });
  }
  return blockers;
}

function readRestartProofState(): RestartProofState {
  if (!existsSync(RESTART_PROOF_PATH)) {
    return {
      fresh: false,
      path: RESTART_PROOF_PATH,
      passed_at: null,
      age_ms: null,
      reason: `no proof file exists at ${RESTART_PROOF_PATH}`,
    };
  }
  try {
    const parsed = JSON.parse(readFileSync(RESTART_PROOF_PATH, "utf8")) as { passed_at?: unknown };
    const passedAt = typeof parsed.passed_at === "string" ? parsed.passed_at : null;
    const passedMs = passedAt ? Date.parse(passedAt) : Number.NaN;
    if (!Number.isFinite(passedMs)) {
      return {
        fresh: false,
        path: RESTART_PROOF_PATH,
        passed_at: passedAt,
        age_ms: null,
        reason: "proof file is missing a valid passed_at timestamp",
      };
    }
    const ageMs = Date.now() - passedMs;
    if (ageMs > RESTART_PROOF_MAX_AGE_MS) {
      return {
        fresh: false,
        path: RESTART_PROOF_PATH,
        passed_at: passedAt,
        age_ms: ageMs,
        reason: `proof file is stale (${Math.round(ageMs / (24 * 60 * 60 * 1000))} days old)`,
      };
    }
    return {
      fresh: true,
      path: RESTART_PROOF_PATH,
      passed_at: passedAt,
      age_ms: ageMs,
      reason: "fresh restart-survival proof exists",
    };
  } catch (err) {
    return {
      fresh: false,
      path: RESTART_PROOF_PATH,
      passed_at: null,
      age_ms: null,
      reason: `proof file could not be read: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
