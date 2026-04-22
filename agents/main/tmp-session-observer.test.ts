import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const memoryDb = new Database(":memory:");
memoryDb.pragma("journal_mode = MEMORY");
memoryDb.pragma("foreign_keys = ON");

vi.mock("../../persistence/db.js", () => ({
  getDb: () => memoryDb,
  closeDb: () => memoryDb.close(),
}));

const observer = await import("./session-observer.js");

let root = "";
const originalEnv = { ...process.env };
const fixedNow = new Date("2026-04-13T09:24:00.000Z").getTime();

beforeEach(() => {
  memoryDb.exec(`
    DROP TABLE IF EXISTS runtime_fabric_observed_session_events;
    DROP TABLE IF EXISTS runtime_fabric_observed_sessions;
    DROP TABLE IF EXISTS runtime_fabric_session_events;
    DROP TABLE IF EXISTS runtime_fabric_sessions;
    DROP TABLE IF EXISTS runtime_fabric_tools;
  `);
  vi.useFakeTimers();
  vi.setSystemTime(fixedNow);
  root = mkdtempSync(join(tmpdir(), "ema-session-observer-"));
  process.env = { ...originalEnv, CLAUDE_PROJECTS_DIR: root };

  mkdirSync(join(root, "ema"), { recursive: true });
  mkdirSync(join(root, "ops"), { recursive: true });
  mkdirSync(join(root, "done"), { recursive: true });

  writeFileSync(join(root, "ema", "active.jsonl"), [
    JSON.stringify({ role: "user", content: "Inspect the runtime fabric.", timestamp: "2026-04-13T09:20:00.000Z" }),
    JSON.stringify({ role: "assistant", content: "Scanning it now.", timestamp: "2026-04-13T09:23:30.000Z" }),
  ].join("\n"), "utf8");

  writeFileSync(join(root, "ops", "waiting.jsonl"), [
    JSON.stringify({ role: "user", content: "Ship the fix.", timestamp: "2026-04-13T08:40:00.000Z" }),
    JSON.stringify({ role: "assistant", content: "I found the issue. Want me to patch the schema now?", timestamp: "2026-04-13T09:00:00.000Z" }),
  ].join("\n"), "utf8");

  writeFileSync(join(root, "done", "completed.jsonl"), [
    JSON.stringify({ role: "user", content: "Add the tests.", timestamp: "2026-04-13T08:10:00.000Z" }),
    JSON.stringify({ role: "assistant", content: "Implemented the tests and the build passed.", timestamp: "2026-04-13T08:20:00.000Z" }),
  ].join("\n"), "utf8");
});

afterEach(() => {
  vi.useRealTimers();
  process.env = { ...originalEnv };
  if (root) rmSync(root, { recursive: true, force: true });
});

describe("runtime-fabric session observer", () => {
  it("derives structured session snapshots from Claude JSONL histories", () => {
    const snapshot = observer.listObservedSessions(10);

    expect(snapshot.sessions).toHaveLength(3);
    expect(snapshot.counts.active).toBe(1);
    expect(snapshot.counts.waiting_for_input).toBe(1);
    expect(snapshot.counts.completed).toBe(1);

    const active = snapshot.sessions.find((session) => session.project_label === "ema");
    expect(active?.status).toBe("active");
    expect(active?.last_assistant_text_excerpt).toContain("Scanning it now");

    const waiting = snapshot.sessions.find((session) => session.project_label === "ops");
    expect(waiting?.status).toBe("waiting_for_input");
    expect(waiting?.summary).toContain("Want me to patch");

    const completed = snapshot.sessions.find((session) => session.project_label === "done");
    expect(completed?.status).toBe("completed");
    expect(completed?.freshness).toBe("cold");
  });

  it("persists snapshots and emits durable observer events when sessions advance", () => {
    observer.listObservedSessions(10);

    let events = observer.listObservedSessionEvents(20);
    expect(events).toHaveLength(3);
    expect(events.every((event) => event.event_kind === "session_discovered")).toBe(true);

    writeFileSync(join(root, "ops", "waiting.jsonl"), [
      JSON.stringify({ role: "user", content: "Ship the fix.", timestamp: "2026-04-13T08:40:00.000Z" }),
      JSON.stringify({ role: "assistant", content: "I found the issue. Want me to patch the schema now?", timestamp: "2026-04-13T09:00:00.000Z" }),
      JSON.stringify({ role: "assistant", content: "Implemented the schema patch and tests passed.", timestamp: "2026-04-13T09:24:30.000Z" }),
    ].join("\n"), "utf8");

    vi.setSystemTime(new Date("2026-04-13T09:25:00.000Z"));
    observer.listObservedSessions(10);

    events = observer.listObservedSessionEvents(20);
    expect(events.some((event) => event.event_kind === "session_updated")).toBe(true);
    expect(events.some((event) => event.event_kind === "status_changed" && event.summary.includes("waiting_for_input → completed"))).toBe(true);
    expect(events.some((event) => event.event_kind === "session_completed")).toBe(true);

    const persisted = memoryDb.prepare("SELECT status, message_count FROM runtime_fabric_observed_sessions WHERE project_label = ?").get("ops") as { status: string; message_count: number } | undefined;
    expect(persisted?.status).toBe("completed");
    expect(persisted?.message_count).toBe(3);
  });
});
