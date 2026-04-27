import Database from "better-sqlite3";
import path from "node:path";

export interface PingRow {
  id: number;
  service: string;
  ts: number;
  ok: number;
  latency_ms: number | null;
}

export interface IncidentRow {
  id: number;
  service: string;
  opened_at: number;
  closed_at: number | null;
  note: string;
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  const file = process.env.AUTHARIS_STATUS_DB
    ? process.env.AUTHARIS_STATUS_DB
    : path.join(process.cwd(), "uptime.sqlite");
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS pings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service TEXT NOT NULL,
      ts INTEGER NOT NULL,
      ok INTEGER NOT NULL,
      latency_ms INTEGER
    );
    CREATE INDEX IF NOT EXISTS pings_service_ts ON pings(service, ts);
    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service TEXT NOT NULL,
      opened_at INTEGER NOT NULL,
      closed_at INTEGER,
      note TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS incidents_service ON incidents(service, opened_at);
  `);
  _db = db;
  return db;
}

export function recordPing(
  service: string,
  ts: number,
  ok: boolean,
  latencyMs: number | null,
): void {
  const db = getDb();
  db.prepare(
    "INSERT INTO pings(service, ts, ok, latency_ms) VALUES(?, ?, ?, ?)",
  ).run(service, ts, ok ? 1 : 0, latencyMs);
}

export function pingsSince(service: string, since: number): PingRow[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, service, ts, ok, latency_ms FROM pings WHERE service = ? AND ts >= ? ORDER BY ts ASC",
    )
    .all(service, since) as PingRow[];
}

export function listIncidents(): IncidentRow[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, service, opened_at, closed_at, note FROM incidents ORDER BY opened_at DESC",
    )
    .all() as IncidentRow[];
}

export function getIncident(id: number): IncidentRow | undefined {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, service, opened_at, closed_at, note FROM incidents WHERE id = ?",
    )
    .get(id) as IncidentRow | undefined;
}

export function openIncident(
  service: string,
  openedAt: number,
  note: string,
): number {
  const db = getDb();
  const info = db
    .prepare(
      "INSERT INTO incidents(service, opened_at, note) VALUES(?, ?, ?)",
    )
    .run(service, openedAt, note);
  return Number(info.lastInsertRowid);
}

export function closeIncident(id: number, closedAt: number): void {
  const db = getDb();
  db.prepare("UPDATE incidents SET closed_at = ? WHERE id = ?").run(
    closedAt,
    id,
  );
}
