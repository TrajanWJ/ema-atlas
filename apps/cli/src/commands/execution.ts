import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { resolveWorkspaceScope } from "../workspace-scope.js";
import { CANONICAL_DB, parseLimit, sqlEscape, sqliteJson } from "./substrate-utils.js";
import { canonRecords } from "./canon.js";

type EventRow = {
  txid: number;
  event_id: string;
  kind: string;
  ts: string;
  actor: string;
  org_id: string;
  space_id: string | null;
  project_id: string | null;
  dispatch_id: string | null;
  execution_id: string | null;
  payload_json: string;
};

export async function runExecution(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0] ?? "list";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return help(args);
  if (verb === "list") return listExecutions(args);
  if (verb === "show") return showExecution(args);
  if (verb === "timeline") return timeline(args);
  emitError(`ema execution: unknown subcommand "${verb}" (expected: list | show | timeline)`);
  return 64;
}

export async function runDispatch(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0] ?? "list";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") {
    if (flagBool(args, "json")) emitJson({ noun: "dispatch", status: "available", commands: [{ verb: "list", summary: "List dispatches from canonical events." }] });
    else emitPretty("ema dispatch list --project <id> [--json]");
    return 0;
  }
  if (verb !== "list") {
    emitError(`ema dispatch: unknown subcommand "${verb}" (expected: list)`);
    return 64;
  }
  const scope = await resolveWorkspaceScope({ args });
  const limit = parseLimit(flagString(args, "limit"), 50);
  const events = eventRows("dispatch.%", limit, scope.project_id);
  const dispatches = groupDispatches(events);
  const payload = {
    ok: true,
    command: "dispatch.list",
    source: "canonical_sqlite_events",
    daemon_authority: "canonical_events",
    workspace_scope: scope,
    include_unscoped: true,
    dispatches,
  };
  if (flagBool(args, "json")) emitJson(payload);
  else for (const item of dispatches) emitPretty(`${item.dispatch_id} ${item.status} ${item.provider ?? ""}`);
  return 0;
}

function help(args: ParsedArgs): number {
  const commands = [
    { verb: "list", summary: "List executions from canonical dispatch/execution/tool events." },
    { verb: "show", summary: "Show one execution by --execution." },
    { verb: "timeline", summary: "Show ordered dispatch/execution/tool events for one execution." },
  ];
  if (flagBool(args, "json")) emitJson({ noun: "execution", status: "available", commands });
  else {
    emitPretty("ema execution - execution registry over canonical events");
    for (const command of commands) emitPretty(`  ${command.verb.padEnd(10)} ${command.summary}`);
  }
  return 0;
}

async function listExecutions(args: ParsedArgs): Promise<number> {
  const scope = await resolveWorkspaceScope({ args });
  const limit = parseLimit(flagString(args, "limit"), 100);
  const rows = eventRows("execution.%", limit * 4, scope.project_id);
  const executions = groupExecutions(rows).slice(0, limit);
  const payload = {
    ok: true,
    command: "execution.list",
    source: "canonical_sqlite_events",
    daemon_authority: "canonical_events",
    workspace_scope: scope,
    include_unscoped: true,
    executions,
  };
  if (flagBool(args, "json")) emitJson(payload);
  else for (const item of executions) emitPretty(`${item.execution_id} ${item.status} ${item.provider ?? ""}`);
  return 0;
}

async function showExecution(args: ParsedArgs): Promise<number> {
  const execution = flagString(args, "execution") ?? args.positional[1];
  if (!execution) {
    emitError("ema execution show: --execution is required");
    return 64;
  }
  const rows = rowsForExecution(execution);
  const grouped = groupExecutions(rows)[0] ?? null;
  const payload = {
    ok: Boolean(grouped),
    command: "execution.show",
    source: "canonical_sqlite_events",
    daemon_authority: "canonical_events",
    execution: grouped,
    timeline: normalizeEvents(rows),
  };
  if (flagBool(args, "json")) emitJson(payload);
  else if (grouped) emitPretty(JSON.stringify(payload, null, 2));
  else emitError(`execution not found: ${execution}`);
  return grouped ? 0 : 1;
}

async function timeline(args: ParsedArgs): Promise<number> {
  const execution = flagString(args, "execution") ?? args.positional[1];
  if (!execution) {
    emitError("ema execution timeline: --execution is required");
    return 64;
  }
  const rows = rowsForExecution(execution);
  const payload = {
    ok: rows.length > 0,
    command: "execution.timeline",
    source: "canonical_sqlite_events",
    daemon_authority: "canonical_events",
    execution_id: execution,
    timeline: normalizeEvents(rows),
  };
  if (flagBool(args, "json")) emitJson(payload);
  else for (const event of payload.timeline) emitPretty(`${event.txid} ${event.kind} ${event.event_id}`);
  return rows.length > 0 ? 0 : 1;
}

function eventRows(kindLike: string, limit: number, projectId: string | null): EventRow[] {
  const projectFilter = projectId ? `and (project_id = '${sqlEscape(projectId)}' or project_id is null or project_id = '')` : "";
  return sqliteJson<EventRow>(CANONICAL_DB, `
    select txid, event_id, kind, ts, actor, org_id, space_id, project_id,
           dispatch_id, execution_id, payload_json
    from events
    where kind like '${sqlEscape(kindLike)}' ${projectFilter}
    order by txid desc
    limit ${limit};
  `);
}

function rowsForExecution(execution: string): EventRow[] {
  return sqliteJson<EventRow>(CANONICAL_DB, `
    select txid, event_id, kind, ts, actor, org_id, space_id, project_id,
           dispatch_id, execution_id, payload_json
    from events
    where execution_id = '${sqlEscape(execution)}'
       or dispatch_id in (select dispatch_id from events where execution_id = '${sqlEscape(execution)}' and dispatch_id is not null)
    order by txid asc;
  `);
}

function groupExecutions(rows: EventRow[]) {
  const byId = new Map<string, EventRow[]>();
  for (const row of rows) {
    const id = row.execution_id;
    if (!id) continue;
    byId.set(id, [...(byId.get(id) ?? []), row]);
  }
  return [...byId.entries()].map(([executionId, events]) => {
    const first = events[events.length - 1] ?? events[0];
    const latest = events[0];
    const payloads = events.map((event) => parsePayload(event.payload_json)).filter((value) => value && typeof value === "object") as Record<string, unknown>[];
    const canon = canonRecords({ sourceKind: "execution", sourceId: executionId })[0] ?? null;
    return {
      execution_id: executionId,
      dispatch_id: latest?.dispatch_id ?? first?.dispatch_id ?? null,
      status: statusFrom(events),
      provider: firstString(payloads, "provider"),
      name: firstString(payloads, "name") ?? firstString(payloads, "tool_name"),
      jsonl_path: firstString(payloads, "session_file_path"),
      canon_id: firstString(payloads, "canon_id") ?? canon?.canon_id ?? null,
      started_at: events.find((event) => event.kind === "execution.started")?.ts ?? null,
      ended_at: events.find((event) =>
        event.kind === "execution.completed" ||
        event.kind === "execution.ended" ||
        event.kind === "execution.failed" ||
        event.kind === "execution.timeout" ||
        event.kind === "execution.interrupted_by_restart"
      )?.ts ?? null,
      event_count: events.length,
      latest_txid: latest?.txid ?? null,
    };
  }).sort((a, b) => Number(b.latest_txid ?? 0) - Number(a.latest_txid ?? 0));
}

function groupDispatches(rows: EventRow[]) {
  const byId = new Map<string, EventRow[]>();
  for (const row of rows) {
    const id = row.dispatch_id;
    if (!id) continue;
    byId.set(id, [...(byId.get(id) ?? []), row]);
  }
  return [...byId.entries()].map(([dispatchId, events]) => {
    const latest = events[0];
    const payloads = events.map((event) => parsePayload(event.payload_json)).filter((value) => value && typeof value === "object") as Record<string, unknown>[];
    return {
      dispatch_id: dispatchId,
      status: events.some((event) => event.kind === "dispatch.ended") ? "ended" : "started",
      provider: firstString(payloads, "provider"),
      intent: firstString(payloads, "intent"),
      event_count: events.length,
      latest_txid: latest?.txid ?? null,
    };
  }).sort((a, b) => Number(b.latest_txid ?? 0) - Number(a.latest_txid ?? 0));
}

function normalizeEvents(rows: EventRow[]) {
  return rows.map((row) => ({
    ...row,
    payload: parsePayload(row.payload_json),
  }));
}

function parsePayload(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function statusFrom(events: EventRow[]): string {
  const latest = [...events]
    .sort((a, b) => Number(b.txid ?? 0) - Number(a.txid ?? 0))
    .find((event) =>
      event.kind === "execution.failed" ||
      event.kind === "execution.timeout" ||
      event.kind === "execution.completed" ||
      event.kind === "execution.ended" ||
      event.kind === "execution.interrupted_by_restart" ||
      event.kind === "execution.started"
    );
  if (latest?.kind === "execution.completed") return "completed";
  if (latest?.kind === "execution.failed") return "failed";
  if (latest?.kind === "execution.timeout") return "timeout";
  if (latest?.kind === "execution.ended") return "completed";
  if (latest?.kind === "execution.interrupted_by_restart") return "interrupted_by_restart";
  if (latest?.kind === "execution.started") return "running";
  return "unknown";
}

function firstString(payloads: Record<string, unknown>[], key: string): string | null {
  for (const payload of payloads) {
    const value = payload[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}
