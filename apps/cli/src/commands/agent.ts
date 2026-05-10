import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { withDaemonWorkspaceRecords, workspaceSummary } from "../workspace-state.js";
import { resolveWorkspaceScope } from "../workspace-scope.js";
import { loadRecentWorkspaceTrail } from "../workspace-trail.js";
import { runStubContract } from "./stub-contract.js";
import { DEFAULT_ACTOR, DEFAULT_ORG, readProjection, renderScopedEmaCommand, sendWorkspaceCommand } from "./workspace-daemon.js";

const DOC_REF = "docs/cli/agent-workspace.md";

export async function runAgent(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") {
    return runAgentContract(args);
  }
  if (verb === "orient" || verb === undefined) {
    return runOrient(args);
  }
  if (verb === "meta-progress" || verb === "progress") return runMetaProgress(args);
  if (verb === "prompt") return runPrompt(args);
  if (verb === "report") return runReport(args);
  if (verb === "log") return runAgentLog(args);

  return runAgentContract(args);
}

type RegistryMission = {
  readonly id: string;
  readonly mission_id?: string;
  readonly title?: string;
  readonly status?: string;
  readonly campaign_id?: string | null;
};

type PromptMode = "delegate" | "handoff" | "continue";

function promptMode(args: ParsedArgs): PromptMode {
  const raw = flagString(args, "mode") ?? (flagBool(args, "handoff") ? "handoff" : flagString(args, "kind")) ?? "delegate";
  if (raw === "handoff" || raw === "continue" || raw === "delegate") return raw;
  return "delegate";
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\"'\"'")}'`;
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (value && value.trim()) return value;
  }
  return null;
}

async function runPrompt(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR;
  const mode = promptMode(args);
  const provider = flagString(args, "provider") ?? (mode === "handoff" ? "codex" : "simulated");
  const target = flagString(args, "target") ?? flagString(args, "to") ?? (provider === "claude-code" ? "actor:claude-code" : "actor:codex");
  const cwd = flagString(args, "cwd") ?? process.cwd();
  const trail = await loadRecentWorkspaceTrail(args);
  const laneId = flagString(args, "lane");
  const requestedMission = flagString(args, "mission");
  const lane = laneId
    ? trail.lanes.find((item) => item.id === laneId || item.lane_id === laneId) ?? null
    : trail.lanes.find((item) => item.actor_id === actor && item.status !== "done" && item.status !== "closed") ?? trail.lanes[0] ?? null;
  const missionId = requestedMission ?? lane?.mission_id ?? null;
  const missions = await readProjection(args, {
    name: "mission.registry",
    pick: (data) => (data.missions as RegistryMission[] | undefined) ?? [],
  }) ?? [];
  const mission = missionId
    ? missions.find((item) => item.id === missionId || item.mission_id === missionId) ?? null
    : null;
  const laneQueue = lane
    ? trail.queue.filter((item) => item.lane_id === lane.id || item.lane_id === lane.lane_id)
    : [];
  const readyQueue = laneQueue.filter((item) => item.status === "ready");
  const blockedQueue = laneQueue.filter((item) => item.status === "blocked");
  const title = flagString(args, "title") ?? (
    mode === "handoff"
      ? `Handoff ${lane?.id ?? "current EMA work"}`
      : `Delegate ${lane?.title ?? "EMA work"}`
  );
  const objective = firstNonEmpty(
    flagString(args, "objective"),
    flagString(args, "needed"),
    mode === "handoff" ? "Continue from the current lane state, preserve context, and report exactly what changed." : null,
    lane?.done_when ? `Drive the lane to done-when: ${lane.done_when}` : null,
    lane?.title ?? null,
  );
  const promptLines = [
    `You are working inside EMA via ${mode === "handoff" ? "a handoff" : "a delegated Harness Glue execution"}.`,
    "",
    "Scope:",
    `- Organization: ${trail.workspace_scope?.org_id ?? "(resolved by EMA CLI)"}`,
    `- Space: ${trail.workspace_scope?.space_id ?? "(resolved by EMA CLI)"}`,
    `- Project: ${trail.workspace_scope?.project_name ?? trail.workspace_scope?.project_id ?? "(resolved by EMA CLI)"}`,
    `- Active build: ${trail.workspace_scope?.active_build ?? cwd}`,
    "",
    "Actor Contract:",
    `- From: ${actor}`,
    `- To: ${target}`,
    `- Mode: ${mode}`,
    `- Provider: ${provider}`,
    "",
    "Mission:",
    mission
      ? `- ${mission.id}: ${mission.title ?? "(untitled)"} [${mission.status ?? "unknown"}]`
      : `- ${missionId ?? "(none specified)"}`,
    "",
    "Lane:",
    lane
      ? `- ${lane.id}: ${lane.title} [${lane.status}]`
      : "- (no lane resolved; run ema agent orient --json before editing)",
    lane?.scope ? `- Scope: ${lane.scope}` : "- Scope: keep work inside the assigned lane",
    lane?.done_when ? `- Done when: ${lane.done_when}` : "- Done when: report a concrete result, verification, and remaining blocker",
    lane?.depends_on ? `- Depends on: ${lane.depends_on}` : null,
    "",
    "Objective:",
    `- ${objective ?? "Orient, claim exact scope if needed, execute the smallest safe slice, verify, and report."}`,
    "",
    "Queue Context:",
    readyQueue.length > 0 ? `- Ready: ${readyQueue.map((item) => `${item.id} ${item.title}`).join("; ")}` : "- Ready: none for this lane",
    blockedQueue.length > 0 ? `- Blocked: ${blockedQueue.map((item) => `${item.id} ${item.title}`).join("; ")}` : "- Blocked: none for this lane",
    "",
    "Required EMA Loop:",
    "- Run ema tl about --json and ema vcalendar tick --json first.",
    "- Use ema lane show/list before edits; claim or refresh ownership if you edit.",
    "- Log later work with ema queue add including why, done-when, source, and blockers.",
    "- Finish with ema agent report --actor <actor> --lane <lane> --changed ... --verified ... --risks ... --next ...",
    mode === "handoff" ? "- If you cannot continue, request or update a handoff rather than leaving chat-only context." : "- Keep the Harness execution tied to the lane and use harness context/events for recovery.",
  ].filter((line): line is string => line !== null);
  const prompt = promptLines.join("\n");
  const laneArg = lane ? ` --lane ${shellQuote(lane.id)}` : "";
  const providerArg = ` --provider ${shellQuote(provider)}`;
  const cwdArg = ` --cwd ${shellQuote(cwd)}`;
  const promptArg = ` --prompt ${shellQuote(prompt)}`;
  const harnessCommand = provider === "simulated"
    ? `ema harness dispatch${providerArg}${laneArg}${cwdArg}${promptArg} --json`
    : `ema harness start${providerArg}${laneArg}${cwdArg}${promptArg} --json`;
  const handoffCommand = lane
    ? `ema handoff request --from ${shellQuote(lane.id)} --to ${shellQuote(target)} --needed ${shellQuote(objective ?? title)} --context ${shellQuote(prompt)} --verify ${shellQuote("agent report recorded with changed/verified/risks/next")} --json`
    : null;
  const payload = {
    ok: true,
    command: "agent prompt",
    mode,
    title,
    actor,
    target,
    provider,
    backend: provider === "simulated" ? "harness_glue_simulated_backend" : "harness_glue_file_backed_tmux_registry",
    target_surface: "harness-glue-vapp",
    workspace_scope: trail.workspace_scope,
    lane,
    mission,
    queue: { ready: readyQueue, blocked: blockedQueue },
    prompt,
    commands: {
      harness: harnessCommand,
      handoff: handoffCommand,
      context: lane ? `ema harness context --lane ${shellQuote(lane.id)} --json` : "ema harness context --json",
      report: lane ? `ema agent report --actor ${shellQuote(target)} --lane ${shellQuote(lane.id)} --changed <changed> --verified <verified> --risks <risks> --next <next> --json` : null,
    },
  };

  if (json) {
    emitJson(payload);
    return 0;
  }
  emitPretty(`# ${title}`);
  emitPretty("");
  emitPretty(prompt);
  emitPretty("");
  emitPretty("Harness command:");
  emitPretty(harnessCommand);
  if (handoffCommand) {
    emitPretty("");
    emitPretty("Handoff command:");
    emitPretty(handoffCommand);
  }
  return 0;
}

type AgentReportRecord = {
  readonly id?: string;
  readonly lane_id?: string | null;
  readonly actor_id?: string | null;
  readonly changed?: string | null;
  readonly verified?: string | null;
  readonly risks?: string | null;
  readonly next?: string | null;
  readonly reported_at?: string | null;
  readonly updated_at?: string | null;
};

type VcalendarStateRecord = {
  readonly current_phase?: string | null;
  readonly current_phase_set_at?: string | null;
  readonly current_phase_set_by?: string | null;
};

type ProjectScopedProjectionRecord = {
  readonly project_id?: string | null;
};

function countByStatus(records: readonly { readonly status: string }[]): Record<string, number> {
  return records.reduce<Record<string, number>>((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1;
    return counts;
  }, {});
}

function readReportField(record: unknown, field: keyof AgentReportRecord): string | null {
  if (typeof record !== "object" || record === null) return null;
  const value = (record as Record<string, unknown>)[field];
  return typeof value === "string" ? value : null;
}

function toAgentReportRecord(record: unknown): AgentReportRecord {
  return {
    id: readReportField(record, "id") ?? undefined,
    lane_id: readReportField(record, "lane_id"),
    actor_id: readReportField(record, "actor_id"),
    changed: readReportField(record, "changed"),
    verified: readReportField(record, "verified"),
    risks: readReportField(record, "risks"),
    next: readReportField(record, "next"),
    reported_at: readReportField(record, "reported_at"),
    updated_at: readReportField(record, "updated_at"),
  };
}

function readStringField(record: Record<string, unknown>, field: string): string | null {
  const value = record[field];
  return typeof value === "string" ? value : null;
}

function toVcalendarState(data: Record<string, unknown>): VcalendarStateRecord {
  return {
    current_phase: readStringField(data, "current_phase"),
    current_phase_set_at: readStringField(data, "current_phase_set_at"),
    current_phase_set_by: readStringField(data, "current_phase_set_by"),
  };
}

function filterResolvedProjectRecords<T extends ProjectScopedProjectionRecord>(
  records: readonly T[],
  projectId: string | null,
  allProjects: boolean,
): T[] {
  if (allProjects || !projectId) return [...records];
  return records.filter((record) => record.project_id === projectId);
}

async function runMetaProgress(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR;
  const daemonRecent = await loadRecentWorkspaceTrail(args);
  const reports = (await readProjection(args, {
    name: "agent.reports",
    pick: (data) => ((data.reports as unknown[] | undefined) ?? []).map(toAgentReportRecord),
  })) ?? [];
  const tickSummary = workspaceSummary().tick;
  const vcalendarState = await readProjection(args, {
    name: "vcalendar.state",
    pick: toVcalendarState,
  });
  const vcalendarPhase = vcalendarState?.current_phase ?? tickSummary.phase;
  const vcalendarMode = vcalendarPhase === "execution block"
    ? "execution"
    : vcalendarPhase === "review and checkup"
      ? "review"
      : vcalendarPhase === "handoff and next-day queue"
        ? "handoff"
        : tickSummary.mode;
  const activeLane = daemonRecent.lanes.find(
    (lane) => lane.actor_id === actor && lane.status !== "done",
  ) ?? null;
  const readyLanes = daemonRecent.lanes.filter((lane) => lane.status === "ready");
  const unownedLanes = daemonRecent.lanes.filter(
    (lane) => !lane.actor_id && lane.status !== "done",
  );
  const blockedQueue = daemonRecent.queue.filter((item) => item.status === "blocked");
  const readyQueue = daemonRecent.queue.filter((item) => item.status === "ready");
  const latestReports = reports.slice(0, 5);
  const commandContext = {
    scope: daemonRecent.workspace_scope,
    allProjects: daemonRecent.all_projects,
  };
  const nextAction = activeLane
    ? `continue ${activeLane.id}: ${activeLane.title}`
    : readyLanes[0]
      ? `claim ${readyLanes[0].id}: ${readyLanes[0].title}`
      : readyQueue[0]
        ? `pull ${readyQueue[0].id}: ${readyQueue[0].title}`
        : blockedQueue[0]
          ? `unblock ${blockedQueue[0].id}: ${blockedQueue[0].title}`
          : `run ${renderScopedEmaCommand(commandContext, ["next", "--json"])}`;
  const summary = {
    source: daemonRecent.source,
    daemon_authority: daemonRecent.daemon_authority,
    actor,
    vcalendar: {
      iso_week: tickSummary.iso_week,
      phase: vcalendarPhase,
      mode: vcalendarMode,
      next_tick: tickSummary.next_tick,
      source: vcalendarState?.current_phase ? "daemon_vcalendar_state" : "cli_computed_vcalendar_tick",
      canonical_phase_set_at: vcalendarState?.current_phase_set_at ?? null,
      canonical_phase_set_by: vcalendarState?.current_phase_set_by ?? null,
    },
    totals: {
      lanes: daemonRecent.lanes.length,
      queue: daemonRecent.queue.length,
      reports: reports.length,
    },
    lane_status: countByStatus(daemonRecent.lanes),
    queue_status: countByStatus(daemonRecent.queue),
    active_lane: activeLane,
    pressure: {
      unowned_lanes: unownedLanes.length,
      ready_lanes: readyLanes.length,
      ready_queue: readyQueue.length,
      blocked_queue: blockedQueue.length,
    },
    latest_reports: latestReports,
    next_action: nextAction,
    commands: [
      renderScopedEmaCommand(commandContext, ["tl", "about", "--json"]),
      renderScopedEmaCommand(commandContext, ["agent", "meta-progress", "--json"]),
      activeLane
        ? renderScopedEmaCommand(commandContext, ["lane", "show", "--lane", activeLane.id, "--json"])
        : renderScopedEmaCommand(commandContext, ["lane", "list", "--json"]),
      renderScopedEmaCommand(commandContext, ["queue", "list", "--json"]),
      renderScopedEmaCommand(commandContext, ["vcalendar", "tick", "--json"]),
    ],
  };

  if (json) {
    emitJson({ ok: true, command: "agent meta-progress", meta_progress: summary });
    return 0;
  }

  emitPretty("agent meta-progress");
  emitPretty(`source: ${summary.source}; daemon authority: ${summary.daemon_authority}`);
  emitPretty(`actor: ${actor}`);
  emitPretty(`vCalendar: ${summary.vcalendar.iso_week} · ${summary.vcalendar.phase} · ${summary.vcalendar.mode}`);
  emitPretty(`lanes: ${summary.totals.lanes} ${JSON.stringify(summary.lane_status)}`);
  emitPretty(`queue: ${summary.totals.queue} ${JSON.stringify(summary.queue_status)}`);
  emitPretty(`reports: ${summary.totals.reports}`);
  emitPretty(`active lane: ${activeLane ? `${activeLane.id} — ${activeLane.title}` : "(none)"}`);
  emitPretty(`pressure: unowned lanes ${summary.pressure.unowned_lanes}; ready queue ${summary.pressure.ready_queue}; blocked queue ${summary.pressure.blocked_queue}`);
  emitPretty(`next action: ${nextAction}`);
  if (latestReports.length > 0) {
    emitPretty("");
    emitPretty("latest reports:");
    for (const report of latestReports) {
      emitPretty(`  - ${report.lane_id ?? report.id ?? "report"}: ${report.next ?? report.changed ?? "(no summary)"}`);
    }
  }
  return 0;
}

async function runAgentLog(args: ParsedArgs): Promise<number> {
  const kind = args.positional[1];
  if (kind === "decision") {
    const title = flagString(args, "title") ?? flagString(args, "name");
    const body = flagString(args, "body") ?? flagString(args, "decision");
    if (!title || !body) {
      emitError("ema agent log decision: --title and --body are required");
      return 64;
    }
    return sendWorkspaceCommand(args, "blueprint.decision.lock", {
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
      title,
      body,
      source: flagString(args, "supersedes"),
      target_value: flagString(args, "source-node") ?? flagString(args, "wiki-node"),
    }, { human: `logged locked decision: ${title}`, resourceLabel: "decision" });
  }
  if (kind === "intent") {
    const title = flagString(args, "title") ?? flagString(args, "name");
    if (!title) {
      emitError("ema agent log intent: --title is required");
      return 64;
    }
    return sendWorkspaceCommand(args, "blueprint.aspiration.capture", {
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
      title,
      body: flagString(args, "body") ?? flagString(args, "description"),
      status: flagString(args, "timeframe") ?? "near_term",
      source: "agent_log",
      app_id: "agent-workspace-cli",
      context: flagString(args, "source") ?? flagString(args, "origin-text"),
    }, { human: `logged intent: ${title}`, resourceLabel: "aspiration" });
  }
  if (kind === "inference") {
    const document = flagString(args, "document");
    const question = flagString(args, "question") ?? flagString(args, "body");
    if (!document || !question) {
      emitError("ema agent log inference: --document and --question are required");
      return 64;
    }
    return sendWorkspaceCommand(args, "blueprint.gac.create", {
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
      document_id: document,
      section_id: flagString(args, "section"),
      target_kind: flagString(args, "category") ?? "assumption",
      status: flagString(args, "priority") ?? "medium",
      body: question,
      source: flagString(args, "source"),
    }, { human: `logged inference: ${question}`, resourceLabel: "gac" });
  }
  emitError(`ema agent log: unknown kind "${kind ?? ""}" (expected: intent | inference | decision)`);
  return 64;
}

async function runReport(args: ParsedArgs): Promise<number> {
  const lane = flagString(args, "lane");
  if (!lane) {
    emitError("ema agent report: --lane is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "agent.report", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    lane_id: lane,
    changed: flagString(args, "changed") ?? null,
    verified: flagString(args, "verified") ?? flagString(args, "verify") ?? null,
    risks: flagString(args, "risks") ?? null,
    next: flagString(args, "next") ?? null,
  }, { human: `recorded agent report for ${lane}`, resourceLabel: "agent_report" });
}

function runAgentContract(args: ParsedArgs): number {
  return runStubContract(args, {
    noun: "agent",
    status: "available",
    docRef: DOC_REF,
    commands: [
      {
        verb: "orient",
        flags: ["project", "json"],
        summary: "Print the current orientation checklist for an agent starting work.",
      },
      {
        verb: "prompt",
        flags: ["actor", "target", "mission", "lane", "project", "mode", "provider", "cwd", "objective", "handoff", "json"],
        summary: "Generate a live handoff/delegation prompt and Harness Glue command from mission, lane, and queue context.",
      },
      {
        verb: "meta-progress",
        flags: ["actor", "json"],
        summary: "Summarize daemon-backed orchestration progress: counts, pressure, latest reports, and next action.",
      },
      {
        verb: "report",
        flags: ["actor", "lane", "changed", "verified", "risks", "next"],
        required: ["actor", "lane"],
        summary: "Report progress in the stable handoff-friendly format.",
      },
      {
        verb: "log intent|inference|decision",
        flags: ["actor", "title", "body", "document", "section", "source"],
        summary: "Log agent intent, inference, or decision into the Blueprint planner rail.",
      },
    ],
  });
}

async function runOrient(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR;
  const scope = await resolveWorkspaceScope({ args });
  const allProjects = flagBool(args, "all-projects");
  const daemonRecent = await loadRecentWorkspaceTrail(args);
  const handoffsRaw = await readProjection(args, {
    name: "handoff.registry",
    pick: (data) => (data.handoffs as unknown[] | undefined) ?? [],
  }) ?? [];
  const handoffs = filterResolvedProjectRecords(
    handoffsRaw as ProjectScopedProjectionRecord[],
    scope.project_id,
    allProjects,
  );
  const reports = await readProjection(args, {
    name: "agent.reports",
    pick: (data) => (data.reports as unknown[] | undefined) ?? [],
  }) ?? [];
  const summary = withDaemonWorkspaceRecords(workspaceSummary({ scope }), {
    lanes: daemonRecent.lanes.map((lane) => ({
      id: lane.id,
      title: lane.title,
      type: "daemon_lane",
      status: lane.status,
      path: `daemon://lane.registry/${lane.id}`,
    })),
    queue: daemonRecent.queue.map((item) => ({
      id: item.id,
      title: item.title,
      type: "daemon_queue_item",
      status: item.status,
      path: `daemon://queue.registry/${item.id}`,
    })),
  });
  const commandContext = { scope, allProjects };
  const commands = [
    renderScopedEmaCommand(commandContext, ["ping", "--json"]),
    renderScopedEmaCommand(commandContext, ["status", "--json"]),
    renderScopedEmaCommand(commandContext, ["tl", "about", "--summary", "--json"]),
    renderScopedEmaCommand(commandContext, ["vcalendar", "tick", "--json"]),
    renderScopedEmaCommand(commandContext, ["doctor", "--json"]),
    renderScopedEmaCommand(commandContext, ["next", "--json"]),
    "ema lane --help",
    "ema queue --help",
    "ema problem --help",
  ];
  const activeLane = daemonRecent.lanes.find(
    (lane) => lane.actor_id === actor && lane.status !== "done",
  ) ?? null;
  const recommendedNextLane = activeLane ? null : daemonRecent.lanes.find(
    (lane) => (lane.status === "ready" || lane.status === "idea") && !lane.actor_id,
  ) ?? null;
  const staleOrUnownedLanes = daemonRecent.lanes.filter(
    (lane) => !lane.actor_id && lane.status !== "done",
  );
  const blockedQueueItems = daemonRecent.queue.filter((item) => item.status === "blocked");
  const nextSuggestedCliCommand = activeLane
    ? renderScopedEmaCommand(commandContext, ["lane", "show", "--lane", activeLane.id, "--json"])
    : recommendedNextLane
      ? renderScopedEmaCommand(commandContext, ["lane", "claim", "--lane", recommendedNextLane.id, "--actor", actor, "--scope", "<scope>", "--goal", "<goal>", "--next", "<next>", "--json"])
      : blockedQueueItems[0]
        ? renderScopedEmaCommand(commandContext, ["queue", "show", "--queue-item", blockedQueueItems[0].id, "--json"])
        : renderScopedEmaCommand(commandContext, ["next", "--json"]);

  if (json) {
    emitJson({
      ok: true,
      command: "agent orient",
      status: summary.source,
      daemon_authority: summary.daemon_authority,
      commands,
      workspace: summary,
      daemon_recent: daemonRecent,
      actor,
      active_lane: activeLane,
      recommended_next_lane: recommendedNextLane,
      stale_or_unowned_lanes: staleOrUnownedLanes,
      blocked_queue_items: blockedQueueItems,
      next_suggested_cli_command: nextSuggestedCliCommand,
      handoffs,
      latest_reports: reports.slice(0, 5),
    });
    return 0;
  }

  emitPretty("agent orientation");
  emitPretty(`status: ${summary.source}; daemon authority: ${summary.daemon_authority}`);
  emitPretty(`scope: ${scope.project_name ?? "(unresolved)"} (${scope.resolution_source})`);
  if (scope.note) emitPretty(`note: ${scope.note}`);
  emitPretty("");
  emitPretty("run:");
  for (const command of commands) emitPretty(`  ${command}`);
  emitPretty("");
  emitPretty(`vCalendar: ${summary.tick.iso_week} · ${summary.tick.phase}`);
  for (const instruction of summary.tick.instructions) emitPretty(`  - ${instruction}`);
  emitPretty("");
  emitPretty("daemon recent:");
  emitPretty(`  source: ${daemonRecent.source}`);
  emitPretty(`  lanes: ${daemonRecent.lanes.length}`);
  emitPretty(`  queue: ${daemonRecent.queue.length}`);
  emitPretty(`  active_lane: ${activeLane?.id ?? "(none)"}`);
  emitPretty(`  next: ${nextSuggestedCliCommand}`);
  emitPretty(`  note: ${daemonRecent.note}`);
  if (daemonRecent.error) emitPretty(`  error: ${daemonRecent.error}`);
  emitPretty("");
  emitPretty("enforcement:");
  for (const rule of summary.enforcement) emitPretty(`  - ${rule}`);
  return 0;
}
