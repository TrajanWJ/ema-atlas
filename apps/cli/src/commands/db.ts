import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { resolveWorkspaceScope } from "../workspace-scope.js";
import { CANONICAL_DB, dbStatus, parseLimit, sqlEscape, sqliteJson } from "./substrate-utils.js";

type EventRow = {
  txid: number;
  event_id: string;
  kind: string;
  ts?: string | null;
  actor?: string | null;
  org_id?: string | null;
  space_id?: string | null;
  project_id?: string | null;
  dispatch_id?: string | null;
  execution_id?: string | null;
  payload_json?: unknown;
  payload?: unknown;
};

export async function runDb(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0] ?? "status";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return help(args);
  if (verb === "status") return status(args);
  if (verb === "events") return events(args);
  if (verb === "snapshot") return snapshot(args);
  emitError(`ema db: unknown subcommand "${verb}" (expected: status | events | snapshot)`);
  return 64;
}

function help(args: ParsedArgs): number {
  const commands = [
    { verb: "status", summary: "Report canonical SQLite health, tables, row counts, WAL state, and event kinds." },
    { verb: "events", summary: "Read canonical event rows with --kind and --limit filters." },
    { verb: "snapshot", summary: "Return a compact project-scoped DB/event snapshot." },
  ];
  if (flagBool(args, "json")) emitJson({ noun: "db", status: "available", commands });
  else {
    emitPretty("ema db - canonical SQLite/event inspection");
    for (const command of commands) emitPretty(`  ${command.verb.padEnd(10)} ${command.summary}`);
  }
  return 0;
}

function status(args: ParsedArgs): number {
  const value = {
    ok: true,
    command: "db.status",
    source: "canonical_sqlite",
    daemon_authority: "canonical_events",
    database: dbStatus(),
  };
  if (flagBool(args, "json")) emitJson(value);
  else {
    emitPretty(`db: ${value.database.path}`);
    emitPretty(`exists: ${value.database.exists}`);
    emitPretty(`tables: ${value.database.tables.length}`);
    emitPretty(`events: ${value.database.table_counts.events ?? 0}`);
  }
  return value.database.ok ? 0 : 1;
}

function events(args: ParsedArgs): number {
  const kind = flagString(args, "kind");
  const limit = parseLimit(flagString(args, "limit"), 50);
  const where = kind ? `where kind like '${sqlEscape(kind.replace(/\*$/, "%"))}'` : "";
  const rows = sqliteJson<EventRow>(CANONICAL_DB, `
    select txid, event_id, kind, ts, actor, org_id, space_id, project_id,
           dispatch_id, execution_id, payload_json
    from events
    ${where}
    order by txid desc
    limit ${limit};
  `).map((row) => ({
    ...row,
    payload: parsePayload(row.payload_json),
  }));
  const value = {
    ok: true,
    command: "db.events",
    source: "canonical_sqlite",
    daemon_authority: "canonical_events",
    database: CANONICAL_DB,
    kind: kind ?? null,
    limit,
    events: rows,
  };
  if (flagBool(args, "json")) emitJson(value);
  else for (const row of rows) emitPretty(`${row.txid} ${row.kind} ${row.event_id}`);
  return 0;
}

async function snapshot(args: ParsedArgs): Promise<number> {
  const scope = await resolveWorkspaceScope({ args });
  const statusValue = dbStatus();
  const projectId = scope.project_id;
  const projectFilter = projectId ? `where project_id = '${sqlEscape(projectId)}' or project_id is null or project_id = ''` : "";
  const recentEvents = sqliteJson<EventRow>(CANONICAL_DB, `
    select txid, event_id, kind, ts, actor, project_id, dispatch_id, execution_id, payload_json
    from events
    ${projectFilter}
    order by txid desc
    limit 25;
  `).map((row) => ({ ...row, payload: parsePayload(row.payload_json) }));
  const value = {
    ok: true,
    command: "db.snapshot",
    source: "canonical_sqlite",
    daemon_authority: "canonical_events",
    workspace_scope: scope,
    database: statusValue,
    recent_events: recentEvents,
  };
  if (flagBool(args, "json")) emitJson(value);
  else {
    emitPretty(`project: ${scope.project_name ?? scope.project_id ?? "unresolved"}`);
    emitPretty(`recent events: ${recentEvents.length}`);
  }
  return statusValue.ok ? 0 : 1;
}

function parsePayload(value: unknown): unknown {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
