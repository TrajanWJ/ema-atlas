import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";

import { getDb } from "../../persistence/db.js";
import { applyRuntimeFabricDdl } from "./schema.js";

export type ObservedSessionStatus = "active" | "waiting_for_input" | "stalled" | "completed" | "unknown";
export type ObservedSessionFreshness = "hot" | "warm" | "cold";
export type ObservedSessionEventKind =
  | "session_discovered"
  | "session_updated"
  | "status_changed"
  | "session_completed";

export interface ObservedSessionSnapshot {
  id: string;
  source: "claude_jsonl";
  session_file: string;
  project_label: string | null;
  message_count: number;
  line_count: number;
  modified_at: string;
  first_event_at: string | null;
  last_event_at: string | null;
  last_role: string | null;
  last_kind: string | null;
  last_assistant_text_excerpt: string | null;
  last_user_text_excerpt: string | null;
  last_tool_name: string | null;
  status: ObservedSessionStatus;
  freshness: ObservedSessionFreshness;
  idle_minutes: number;
  summary: string;
}

export interface ObservedSessionSnapshotList {
  observed_at: string;
  counts: Record<ObservedSessionStatus, number>;
  sessions: ObservedSessionSnapshot[];
}

export interface ObservedSessionEvent {
  id: string;
  session_id: string;
  event_kind: ObservedSessionEventKind;
  summary: string;
  payload_json: string | null;
  inserted_at: string;
}

const ACTIVE_MS = 5 * 60_000;
const STALLED_MS = 20 * 60_000;
const WAITING_RE = /(\?|await(?:ing)? (?:input|reply|approval|confirmation)|let me know|press (?:enter|return) to continue|\[y\/n\])/i;
const COMPLETED_RE = /\b(done|completed|finished|all set|implemented|shipped|tests? pass(?:ed)?|build passed)\b/i;

const projectsDir = () => process.env.CLAUDE_PROJECTS_DIR ?? `${process.env.HOME ?? "~"}/.claude/projects`;
const excerpt = (v: string | null, n = 160) => !v ? null : (v.replace(/\s+/g, " ").trim().slice(0, n) || null);
const iso = (v: unknown) => typeof v === "string" && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null;
const epoch = (v: unknown) => Number.isFinite(Number(v)) ? new Date((Number(v) > 1e12 ? Number(v) : Number(v) * 1000)).toISOString() : null;

function files(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return files(full);
    return entry.isFile() && entry.name.endsWith(".jsonl") ? [full] : [];
  });
}

function textOf(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) return v.map(textOf).filter(Boolean).join("\n").trim();
  if (v && typeof v === "object") {
    const r = v as Record<string, unknown>;
    return textOf(r.text ?? r.content ?? r.message ?? r.summary ?? "");
  }
  return "";
}

function roleOf(r: Record<string, unknown>): string | null {
  if (typeof r.role === "string") return r.role;
  const t = typeof r.type === "string" ? r.type : "";
  if (t.includes("user")) return "user";
  if (t.includes("assistant") || t === "commentary") return "assistant";
  if (t.includes("tool")) return "tool";
  return r.payload && typeof r.payload === "object" ? roleOf(r.payload as Record<string, unknown>) : null;
}

function build(file: string, root: string, now: number): ObservedSessionSnapshot {
  const lines = readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
  let first: string | null = null, last: string | null = null, lastRole: string | null = null, lastKind: string | null = null, a: string | null = null, u: string | null = null, tool: string | null = null;
  for (const line of lines) {
    let r: Record<string, unknown>;
    try { r = JSON.parse(line); } catch { continue; }
    const ts = iso(r.timestamp) ?? iso(r.created_at) ?? iso(r.updated_at) ?? epoch(r.ts) ?? epoch(r.time) ?? (r.payload && typeof r.payload === "object" ? iso((r.payload as Record<string, unknown>).timestamp) : null);
    if (ts && (!first || ts < first)) first = ts;
    if (ts && (!last || ts > last)) last = ts;
    const role = roleOf(r);
    const kind = typeof r.type === "string" ? r.type : typeof r.kind === "string" ? r.kind : null;
    const text = textOf(r.content ?? r.message ?? r.text ?? r.payload ?? "");
    if (role) lastRole = role;
    if (kind) lastKind = kind;
    if (typeof r.tool_name === "string") tool = r.tool_name;
    if (role === "assistant" && text) a = text;
    if (role === "user" && text) u = text;
  }
  const modified_at = new Date(statSync(file).mtimeMs).toISOString();
  const idleMs = Math.max(0, now - Date.parse(last ?? modified_at));
  const freshness: ObservedSessionFreshness = idleMs <= ACTIVE_MS ? "hot" : idleMs <= STALLED_MS ? "warm" : "cold";
  const status: ObservedSessionStatus = a && COMPLETED_RE.test(a) ? "completed" : a && WAITING_RE.test(a) ? "waiting_for_input" : idleMs <= ACTIVE_MS ? "active" : idleMs >= STALLED_MS ? "stalled" : lastRole === "assistant" ? "waiting_for_input" : lastRole ? "active" : "unknown";
  const rel = file.startsWith(root) ? file.slice(root.length).replace(/^\/+/, "") : file;
  const segs = rel.split("/").filter(Boolean);
  const project_label = segs.length <= 1 ? basename(file, ".jsonl") : segs.slice(0, -1).join("/");
  const summary = excerpt(a ?? u ?? `${lines.length} messages`) ?? `${lines.length} messages`;
  return { id: `claude:${project_label}:${basename(file)}`, source: "claude_jsonl", session_file: file, project_label, message_count: lines.length, line_count: lines.length, modified_at, first_event_at: first, last_event_at: last, last_role: lastRole, last_kind: lastKind, last_assistant_text_excerpt: excerpt(a), last_user_text_excerpt: excerpt(u), last_tool_name: tool, status, freshness, idle_minutes: Math.floor(idleMs / 60_000), summary };
}

function ensureObserverTables(): void {
  applyRuntimeFabricDdl(getDb());
}

function eventPayload(previous: ObservedSessionSnapshot | null, current: ObservedSessionSnapshot): string {
  return JSON.stringify({
    previous_status: previous?.status ?? null,
    status: current.status,
    previous_message_count: previous?.message_count ?? null,
    message_count: current.message_count,
    previous_last_event_at: previous?.last_event_at ?? null,
    last_event_at: current.last_event_at,
    session_file: current.session_file,
    project_label: current.project_label,
    last_tool_name: current.last_tool_name,
    summary: current.summary,
  });
}

function insertObservedEvent(sessionId: string, eventKind: ObservedSessionEventKind, summary: string, payloadJson: string | null, insertedAt: string): void {
  getDb().prepare(`
    INSERT INTO runtime_fabric_observed_session_events (
      id, session_id, event_kind, summary, payload_json, inserted_at
    ) VALUES (
      @id, @session_id, @event_kind, @summary, @payload_json, @inserted_at
    )
  `).run({
    id: `${sessionId}:${eventKind}:${insertedAt}`,
    session_id: sessionId,
    event_kind: eventKind,
    summary,
    payload_json: payloadJson,
    inserted_at: insertedAt,
  });
}

function readPersistedObservedSessions(): Map<string, ObservedSessionSnapshot> {
  ensureObserverTables();
  const rows = getDb().prepare(`
    SELECT
      id,
      source,
      session_file,
      project_label,
      message_count,
      line_count,
      modified_at,
      first_event_at,
      last_event_at,
      last_role,
      last_kind,
      last_assistant_text_excerpt,
      last_user_text_excerpt,
      last_tool_name,
      status,
      freshness,
      idle_minutes,
      summary
    FROM runtime_fabric_observed_sessions
  `).all() as ObservedSessionSnapshot[];
  return new Map(rows.map((row) => [row.id, row]));
}

function persistObservedSessions(sessions: readonly ObservedSessionSnapshot[], observedAt: string): void {
  ensureObserverTables();
  const db = getDb();
  const previous = readPersistedObservedSessions();
  const upsert = db.prepare(`
    INSERT INTO runtime_fabric_observed_sessions (
      id, source, session_file, project_label, message_count, line_count,
      modified_at, first_event_at, last_event_at, last_role, last_kind,
      last_assistant_text_excerpt, last_user_text_excerpt, last_tool_name,
      status, freshness, idle_minutes, summary, observed_at
    ) VALUES (
      @id, @source, @session_file, @project_label, @message_count, @line_count,
      @modified_at, @first_event_at, @last_event_at, @last_role, @last_kind,
      @last_assistant_text_excerpt, @last_user_text_excerpt, @last_tool_name,
      @status, @freshness, @idle_minutes, @summary, @observed_at
    )
    ON CONFLICT(id) DO UPDATE SET
      source = excluded.source,
      session_file = excluded.session_file,
      project_label = excluded.project_label,
      message_count = excluded.message_count,
      line_count = excluded.line_count,
      modified_at = excluded.modified_at,
      first_event_at = excluded.first_event_at,
      last_event_at = excluded.last_event_at,
      last_role = excluded.last_role,
      last_kind = excluded.last_kind,
      last_assistant_text_excerpt = excluded.last_assistant_text_excerpt,
      last_user_text_excerpt = excluded.last_user_text_excerpt,
      last_tool_name = excluded.last_tool_name,
      status = excluded.status,
      freshness = excluded.freshness,
      idle_minutes = excluded.idle_minutes,
      summary = excluded.summary,
      observed_at = excluded.observed_at
  `);

  const tx = db.transaction(() => {
    for (const session of sessions) {
      const prior = previous.get(session.id) ?? null;
      upsert.run({ ...session, observed_at: observedAt });
      const payloadJson = eventPayload(prior, session);
      if (!prior) {
        insertObservedEvent(session.id, "session_discovered", `Observed session ${session.project_label ?? session.id}`, payloadJson, observedAt);
        continue;
      }
      if (prior.status !== session.status) {
        insertObservedEvent(session.id, "status_changed", `${prior.status} → ${session.status}`, payloadJson, observedAt);
      }
      if (prior.message_count !== session.message_count || prior.last_event_at !== session.last_event_at) {
        insertObservedEvent(session.id, "session_updated", `${session.project_label ?? session.id} advanced to ${session.message_count} messages`, payloadJson, observedAt);
      }
      if (prior.status !== "completed" && session.status === "completed") {
        insertObservedEvent(session.id, "session_completed", `${session.project_label ?? session.id} marked completed`, payloadJson, observedAt);
      }
    }
  });
  tx();
}

export function listObservedSessions(limit = 50): ObservedSessionSnapshotList {
  const root = projectsDir();
  const observed_at = new Date().toISOString();
  const counts: Record<ObservedSessionStatus, number> = { active: 0, waiting_for_input: 0, stalled: 0, completed: 0, unknown: 0 };
  const sessions = files(root).map((file) => build(file, root, Date.now())).sort((a, b) => Date.parse(b.last_event_at ?? b.modified_at) - Date.parse(a.last_event_at ?? a.modified_at)).slice(0, Math.max(1, Math.min(limit, 500)));
  persistObservedSessions(sessions, observed_at);
  for (const s of sessions) counts[s.status] += 1;
  return { observed_at, counts, sessions };
}

export function listObservedSessionEvents(limit = 100): ObservedSessionEvent[] {
  ensureObserverTables();
  return getDb().prepare(`
    SELECT id, session_id, event_kind, summary, payload_json, inserted_at
    FROM runtime_fabric_observed_session_events
    ORDER BY inserted_at DESC
    LIMIT ?
  `).all(Math.max(1, Math.min(limit, 500))) as ObservedSessionEvent[];
}
