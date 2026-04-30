#!/usr/bin/env node
// Orchestrator doctor — assert the EMA workspace is in the post-repair state
// described in Projects/EMA/atlas/orchestrator-bootstrap.md. Exits 0 if every
// check passes, non-zero with a summary if any fail.
//
// Run from the active-build root:
//   pnpm orchestrator:doctor

import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import WebSocket from "ws";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "apps/cli/dist/bin.js");
const DB = path.join(ROOT, "apps/daemon/canonical.db");
const DAEMON_URL = process.env.EMA_DAEMON_URL ?? "ws://127.0.0.1:49555";

const CANONICAL_EMA_PROJECT_ID = "project:01KQD8D0G9000XHA2KS36VYXX3";
const CANONICAL_ORG_ID = "org:01J00000000000000000000012";
const CANONICAL_SPACE_ID = "space:01J00000000000000000000013";

const execFileP = promisify(execFile);

const checks = [];
function check(name, fn) {
  checks.push({ name, fn });
}

async function cli(...args) {
  const { stdout } = await execFileP("node", [CLI, ...args], {
    cwd: ROOT,
    maxBuffer: 32 * 1024 * 1024,
  });
  return stdout;
}

async function sqlite(query) {
  const { stdout } = await execFileP("sqlite3", [DB, query]);
  return stdout.trim();
}

async function probeProjection(channel, projectId) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(DAEMON_URL);
    let stage = 0;
    const timer = setTimeout(() => {
      ws.terminate();
      reject(new Error(`probe timeout on ${channel}`));
    }, 5_000);
    ws.on("open", () => {
      ws.send(JSON.stringify({ v: 0, id: "doc-1", type: "hello", surface: "desktop", device_id: null }));
    });
    ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "hello" && stage === 0) {
        stage = 1;
        const sub = { v: 0, id: "doc-2", type: "subscribe", channel };
        if (projectId) sub.args = { project_id: projectId };
        ws.send(JSON.stringify(sub));
      } else if (msg.type === "projection" && msg.name === channel) {
        clearTimeout(timer);
        ws.close();
        resolve(msg.data ?? {});
      }
    });
    ws.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// ------------------------------------------------------------------- checks

check("daemon reachable", async () => {
  const out = await cli("ping");
  if (!/daemon/.test(out)) throw new Error("ping did not return daemon banner");
  return out.trim().split("\n").pop();
});

check("scope resolves to canonical EMA", async () => {
  const out = await cli("status", "--json");
  const json = JSON.parse(out.split("\n").filter(Boolean).pop());
  const ws = json.workspace_scope ?? {};
  if (ws.org_id !== CANONICAL_ORG_ID) throw new Error(`org_id ${ws.org_id} != ${CANONICAL_ORG_ID}`);
  if (ws.space_id !== CANONICAL_SPACE_ID) throw new Error(`space_id ${ws.space_id} != ${CANONICAL_SPACE_ID}`);
  if (ws.project_id !== CANONICAL_EMA_PROJECT_ID) throw new Error(`project_id ${ws.project_id} != ${CANONICAL_EMA_PROJECT_ID}`);
  return `${ws.project_name} via ${ws.resolution_source}`;
});

check("PRAGMA user_version = 1", async () => {
  const v = await sqlite("PRAGMA user_version;");
  if (v !== "1") throw new Error(`user_version is ${v}`);
  return "user_version=1";
});

check("UNIQUE(space_id, name) on projects", async () => {
  const out = await sqlite("SELECT name FROM pragma_index_list('projects') WHERE \"unique\"=1;");
  if (!out.includes("sqlite_autoindex_projects")) throw new Error(`no unique autoindex (got ${JSON.stringify(out)})`);
  const dup = await sqlite("SELECT COUNT(*) FROM (SELECT space_id, name FROM projects GROUP BY space_id, name HAVING COUNT(*) > 1);");
  if (dup !== "0") throw new Error(`${dup} duplicate (space_id,name) rows`);
  return "constraint enforced; 0 duplicates";
});

check("0 events with legacy EMA / EMA 0.0.5 strings", async () => {
  const cols = await sqlite("SELECT COUNT(*) FROM events WHERE project_id IN ('EMA', 'EMA 0.0.5');");
  if (cols !== "0") throw new Error(`${cols} events with legacy project_id column`);
  const payload = await sqlite("SELECT COUNT(*) FROM events WHERE payload_json LIKE '%\"project_id\":\"EMA\"%' OR payload_json LIKE '%\"project_id\":\"EMA 0.0.5\"%';");
  if (payload !== "0") throw new Error(`${payload} events with legacy payload project_id`);
  return "column=0, payload=0";
});

check("canonical EMA org alignment", async () => {
  const out = await sqlite(`SELECT COUNT(*) FROM events WHERE project_id = '${CANONICAL_EMA_PROJECT_ID}' AND org_id != '${CANONICAL_ORG_ID}';`);
  if (out !== "0") throw new Error(`${out} EMA-scoped events under non-canonical org`);
  return "0 EMA events under non-canonical org";
});

check("project.archived in catalog", async () => {
  const out = await execFileP("grep", ["-c", '"project.archived" -> True', path.join(ROOT, "apps/daemon/src/ema_daemon/event_envelope.gleam")]);
  if (parseInt(out.stdout.trim(), 10) < 1) throw new Error("project.archived not in catalog");
  return "event kind catalogued";
});

check("persist_project_archived writer present", async () => {
  const out = await execFileP("grep", ["-c", "^persist_project_archived", path.join(ROOT, "apps/daemon/src/ema_sqlite_helpers.erl")]);
  if (parseInt(out.stdout.trim(), 10) < 1) throw new Error("persist_project_archived not defined");
  return "writer present";
});

check("server-side scope filter on lane.registry", async () => {
  const scoped = await probeProjection("lane.registry", CANONICAL_EMA_PROJECT_ID);
  if (!scoped.scope_filter) throw new Error("scope_filter missing on scoped subscribe");
  if (scoped.scope_filter !== CANONICAL_EMA_PROJECT_ID) throw new Error(`scope_filter ${scoped.scope_filter} != canonical`);
  const unscoped = await probeProjection("lane.registry");
  if (unscoped.scope_filter) throw new Error(`unscoped subscribe leaked scope_filter ${unscoped.scope_filter}`);
  if (unscoped.lanes.length <= scoped.lanes.length) throw new Error(`unscoped lanes ${unscoped.lanes.length} not greater than scoped ${scoped.lanes.length}`);
  return `scoped=${scoped.lanes.length} unscoped=${unscoped.lanes.length}`;
});

check("server-side scope filter on queue.registry", async () => {
  const scoped = await probeProjection("queue.registry", CANONICAL_EMA_PROJECT_ID);
  if (!scoped.scope_filter) throw new Error("scope_filter missing on scoped subscribe");
  const unscoped = await probeProjection("queue.registry");
  if (unscoped.scope_filter) throw new Error("unscoped subscribe leaked scope_filter");
  if (unscoped.queue_items.length <= scoped.queue_items.length) throw new Error(`unscoped ${unscoped.queue_items.length} not greater than scoped ${scoped.queue_items.length}`);
  return `scoped=${scoped.queue_items.length} unscoped=${unscoped.queue_items.length}`;
});

check("ema next is consistent with lane show", async () => {
  const next = JSON.parse((await cli("next", "--json")).split("\n").filter(Boolean).pop());
  const recommended = next.recommended_lane?.id ?? next.active_lane?.id;
  if (!recommended) return "no recommended lane (workspace clean)";
  const show = JSON.parse((await cli("lane", "show", "--lane", recommended, "--json")).split("\n").filter(Boolean).pop());
  if (!show.lane) throw new Error(`next recommends ${recommended} but lane show returns null`);
  if (show.lane.project_id !== CANONICAL_EMA_PROJECT_ID) throw new Error(`recommended lane project_id ${show.lane.project_id} != canonical`);
  return `${recommended} agrees`;
});

check("help labels match reality", async () => {
  const help = await cli("help", "--json");
  const json = JSON.parse(help.split("\n").filter(Boolean).pop());
  for (const cmd of json.commands) {
    if ((cmd.name === "lane claim/block/show" || cmd.name === "queue show/ready/block/close") && /pending daemon writer/.test(cmd.summary)) {
      throw new Error(`stale label on ${cmd.name}: ${cmd.summary}`);
    }
  }
  return "lane + queue lifecycle labels current";
});

// ------------------------------------------------------------------- run

let pass = 0;
let fail = 0;
const failures = [];

for (const { name, fn } of checks) {
  try {
    const detail = await fn();
    pass += 1;
    console.log(`  PASS  ${name}` + (detail ? ` — ${detail}` : ""));
  } catch (err) {
    fail += 1;
    failures.push({ name, err: err.message ?? String(err) });
    console.log(`  FAIL  ${name} — ${err.message ?? err}`);
  }
}

console.log();
console.log(`${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log();
  console.log("failures:");
  for (const f of failures) console.log(`  - ${f.name}: ${f.err}`);
  process.exit(1);
}
