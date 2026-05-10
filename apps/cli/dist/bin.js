#!/usr/bin/env node

// src/args.ts
function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (!tok.startsWith("--")) {
      positional.push(tok);
      continue;
    }
    const body = tok.slice(2);
    const eq = body.indexOf("=");
    if (eq !== -1) {
      setFlag(flags, body.slice(0, eq), body.slice(eq + 1));
      continue;
    }
    const next = argv[i + 1];
    if (next !== void 0 && !next.startsWith("--")) {
      setFlag(flags, body, next);
      i += 1;
    } else {
      setFlag(flags, body, true);
    }
  }
  return { positional, flags };
}
function flagString(args, name) {
  const v = args.flags[name];
  if (Array.isArray(v)) return v.at(-1);
  return typeof v === "string" ? v : void 0;
}
function flagBool(args, name) {
  return args.flags[name] === true || args.flags[name] === "true";
}
function flagStrings(args, name) {
  const v = args.flags[name];
  if (Array.isArray(v)) return v;
  if (typeof v === "string") return [v];
  return [];
}
function setFlag(flags, name, value) {
  const current = flags[name];
  if (current === void 0) {
    flags[name] = value;
    return;
  }
  const currentValues = Array.isArray(current) ? current : typeof current === "string" ? [current] : [];
  if (typeof value === "string") flags[name] = [...currentValues, value];
  else flags[name] = value;
}

// src/output.ts
function writeLine(stream, line) {
  stream?._handle?.setBlocking?.(true);
  stream.write(line + "\n");
}
function emitJson(obj) {
  writeLine(process.stdout, JSON.stringify(obj));
}
function emitPretty(line) {
  writeLine(process.stdout, line);
}
function emitError(msg) {
  writeLine(process.stderr, msg);
}

// src/commands/help.ts
var COMMANDS = [
  { name: "ping", summary: "Handshake with the daemon and print round-trip ms." },
  { name: "status", summary: "Print home-current topbar selection plus resolved workspace scope." },
  { name: "bootstrap status", summary: "Run the fast CLI/daemon/data readiness gate for agent work." },
  { name: "readiness", summary: "Report current substrate translation and Proslync execution readiness truth." },
  { name: "capability list/assert", summary: "Classify substrate capabilities and fail on missing required rails." },
  { name: "db status/events/snapshot", summary: "Inspect canonical SQLite tables, row counts, and event rows." },
  { name: "workspace artifact add/update/list/show/link/archive", summary: "Manage shared workspace artifacts through daemon-canonical artifact events." },
  { name: "execution list/show/timeline", summary: "Read canonical dispatch/execution/tool event timelines." },
  { name: "dispatch list", summary: "List dispatch records from canonical events." },
  { name: "proslync bootstrap", summary: "Return the Proslync-first bootstrap workpack and readiness gate." },
  { name: "org create", summary: "Create an organization and its same-name default space." },
  { name: "space create", summary: "Create a space inside an organization." },
  { name: "project create", summary: "Create a project inside an organization space." },
  { name: "actor register/list/show", summary: "Register and inspect canonical actors." },
  { name: "intent create/list/show/update", summary: "Create and advance canonical pipeline-floor intents." },
  { name: "proposal create/list/show/approve/reject", summary: "Create and decide proposals under intents." },
  { name: "canon write/list/show/supersede", summary: "Write and inspect canonical execution result and doctrine nodes." },
  { name: "cockpit summary/projection", summary: "Inspect project/client cockpit state, active builds, vApp surfaces, lanes, and queue." },
  { name: "cockpit builds/surfaces/lanes/queue/open", summary: "List active builds, surfaces, lanes, queue, or print the cockpit URL." },
  { name: "intention harvest/projection/list/show/review", summary: "Mine sessions/docs for reviewable lost intentions." },
  { name: "intention backfeed", summary: "Convert an approved harvested intention into queue/artifact work." },
  { name: "tl about", summary: "Show daemon-backed lane/queue records, fallback workspace records, and current vCalendar phase." },
  { name: "/tl about", summary: "Alias for `ema tl about`; matches slash-command muscle memory." },
  { name: "agent orient", summary: "Print the enforced agent orientation checklist and workspace summary." },
  { name: "agent prompt/report/meta-progress", summary: "Generate handoff prompts, record agent reports, and inspect meta-progress." },
  { name: "next", summary: "Recommend the next lane, queue item, or orientation command." },
  { name: "campaign create/list/show/archive", summary: "Manage long-running initiatives." },
  { name: "mission create/list/show/start/pause/complete", summary: "Manage mission bundles under campaigns." },
  { name: "lane open/list", summary: "Open and list daemon-backed lane ownership records." },
  { name: "lane claim/block/show", summary: "Claim, block, inspect, and close lanes." },
  { name: "queue add/list", summary: "Add and list daemon-backed follow-up work with dependencies." },
  { name: "queue show/ready/block/close", summary: "Inspect and move queue items through lifecycle states." },
  { name: "handoff request/list/accept/reject/complete", summary: "Record transfer contracts between actors and lanes." },
  { name: "problem log/list/show/solution/link", summary: "Graph recursive problems, solutions, and dependencies." },
  { name: "blueprint status/list", summary: "Show current Blueprint daemon state and explicit projection/writer gaps." },
  { name: "wiki search/get/list", summary: "Search and read the project atlas/QMD second-brain layer." },
  { name: "hermes orient/plan/sweep", summary: "Preview the future Hermes orchestrator packet and plan shape. (projection seed)" },
  { name: "harness providers/donors/dispatch", summary: "Prepare Chronicle + Duct Tape Harness Glue rails. (simulated provider ready)" },
  { name: "peer add/doctor/tunnel", summary: "Manage trusted-dev peer rails. (local registry first, SSH first)" },
  { name: "desktop presence", summary: "Show, join, and publish shared vDesktop presence." },
  { name: "recovery scan", summary: "Read-only desktop-wide donor, worktree, stale-lane, and lost-work scan." },
  { name: "cwt status/ingest", summary: "Inspect current-work-tracker shared-files projection and dry-run EMA promotion." },
  { name: "events tail", summary: "Stream daemon events line-by-line (Ctrl-C to quit)." },
  { name: "swarm create/list/show/start/pause/stop/report", summary: "Coordinate daemon-backed swarms over missions, lanes, and queue items." },
  { name: "vcalendar show", summary: "Show an actor's calendar (filtered from the recent event_trail)." },
  { name: "vcalendar week", summary: "Show this week's vcalendar events (filtered from the recent event_trail)." },
  { name: "vcalendar tick", summary: "Compute the current self-controlled planning/execution/review phase." },
  { name: "vcalendar block add", summary: "Append a calendar_block for an actor (kind + label, optional start/end)." },
  { name: "vcalendar block move", summary: "Move a calendar_block to a new start (optional end)." },
  { name: "vcalendar phase set", summary: "Set the current weekly phase label for an actor." },
  { name: "checkup schedule", summary: "Schedule a cadence-based checkup on a lane." },
  { name: "checkup complete", summary: "Mark a checkup complete with a result." },
  { name: "doctor", summary: "Run a daemon/workspace cohesion diagnostic and report drift." },
  { name: "help", summary: "Show this help." }
];
var GLOBAL_FLAGS = [
  { flag: "--json", summary: "Emit NDJSON instead of pretty text." },
  { flag: "--help", summary: "Show command or command-group help." }
];
async function runHelp(args) {
  if (flagBool(args, "json")) {
    emitJson({ commands: COMMANDS, global_flags: GLOBAL_FLAGS });
    return 0;
  }
  emitPretty("ema \u2014 EMA 0.0.6 CLI");
  emitPretty("");
  emitPretty("Usage: ema <command> [args...] [--json]");
  emitPretty("");
  emitPretty("Commands:");
  const width = Math.max(...COMMANDS.map((c) => c.name.length));
  for (const c of COMMANDS) {
    emitPretty(`  ${c.name.padEnd(width)}  ${c.summary}`);
  }
  emitPretty("");
  emitPretty("Global flags:");
  for (const f of GLOBAL_FLAGS) {
    emitPretty(`  ${f.flag.padEnd(width)}  ${f.summary}`);
  }
  emitPretty("");
  emitPretty(
    "Orientation: ema ping --json; ema status --json; ema tl about --summary --json; ema vcalendar tick --json; ema doctor --json; add --project <name-or-id> when the task names a project."
  );
  emitPretty("Full command grammar: docs/cli/agent-workspace.md and docs/cli/see-agent-work.md");
  return 0;
}

// src/ws-client.ts
import WebSocket from "ws";
var DAEMON_URL = process.env.EMA_DAEMON_URL ?? "ws://127.0.0.1:49555";
var HELLO_TIMEOUT_MS = 5e3;
var COMMAND_TIMEOUT_MS = 15e3;
var DaemonUnreachableError = class extends Error {
  constructor(cause) {
    super(
      `daemon not reachable at ${DAEMON_URL} (${cause}). Start it with: bash scripts/dev-daemon.sh`
    );
    this.name = "DaemonUnreachableError";
  }
};
var ProtocolError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ProtocolError";
  }
};
var _counter = 0;
function nextId() {
  _counter += 1;
  return `msg-${Date.now().toString(36)}-${_counter.toString(36)}`;
}
var Client = class {
  ws = null;
  url;
  surface;
  deviceId;
  pendingCommands = /* @__PURE__ */ new Map();
  pendingPings = /* @__PURE__ */ new Map();
  handlers = [];
  droppedChannels = /* @__PURE__ */ new Set();
  hello = null;
  constructor(opts = {}) {
    this.url = opts.url ?? DAEMON_URL;
    this.surface = opts.surface ?? "desktop";
    this.deviceId = opts.deviceId ?? null;
  }
  onMessage(fn) {
    this.handlers.push(fn);
  }
  /** Connect + send hello; resolves when server hello comes back. */
  async connect() {
    await this.openSocket();
    return await this.sendHello();
  }
  openSocket() {
    return new Promise((resolve2, reject) => {
      let settled = false;
      const ws = new WebSocket(this.url);
      this.ws = ws;
      const onOpen = () => {
        if (settled) return;
        settled = true;
        ws.off("error", onErr);
        ws.on("message", (raw) => this.handleRaw(raw));
        ws.on("close", () => this.handleClose());
        ws.on("error", (err) => this.handleSocketError(err));
        resolve2();
      };
      const onErr = (err) => {
        if (settled) return;
        settled = true;
        ws.off("open", onOpen);
        const code = err.code ?? err.message;
        reject(new DaemonUnreachableError(code));
      };
      ws.once("open", onOpen);
      ws.once("error", onErr);
    });
  }
  sendHello() {
    return new Promise((resolve2, reject) => {
      const id = nextId();
      const timer = setTimeout(() => {
        reject(new ProtocolError("hello timed out"));
      }, HELLO_TIMEOUT_MS);
      const handler = (msg) => {
        if (msg.type === "hello" && msg.id === id) {
          clearTimeout(timer);
          this.handlers = this.handlers.filter((h) => h !== handler);
          this.hello = msg;
          resolve2(msg);
        } else if (msg.type === "hello") {
          clearTimeout(timer);
          this.handlers = this.handlers.filter((h) => h !== handler);
          this.hello = msg;
          resolve2(msg);
        }
      };
      this.handlers.push(handler);
      this.sendRaw({
        v: 0,
        id,
        type: "hello",
        surface: this.surface,
        device_id: this.deviceId
      });
    });
  }
  /** Send a command, return the daemon's command_result. */
  command(op, args = {}) {
    return new Promise((resolve2, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new ProtocolError("socket not open"));
        return;
      }
      const id = nextId();
      const timer = setTimeout(() => {
        this.pendingCommands.delete(id);
        reject(new ProtocolError(`command ${op} timed out`));
      }, COMMAND_TIMEOUT_MS);
      this.pendingCommands.set(id, { resolve: resolve2, reject, timer });
      this.sendRaw({ v: 0, id, type: "command", op, args });
    });
  }
  /** Send ping, resolve with RTT ms. */
  ping() {
    return new Promise((resolve2, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new ProtocolError("socket not open"));
        return;
      }
      const id = nextId();
      const sentAt = Date.now();
      const timer = setTimeout(() => {
        this.pendingPings.delete(id);
        reject(new ProtocolError("ping timed out"));
      }, 15e3);
      this.pendingPings.set(id, { sentAt, resolve: resolve2, reject, timer });
      this.sendRaw({ v: 0, id, type: "ping" });
    });
  }
  subscribe(channel, options) {
    this.droppedChannels.delete(channel);
    const msg = { v: 0, id: nextId(), type: "subscribe", channel };
    if (options?.project_id) msg.args = { project_id: options.project_id };
    this.sendRaw(msg);
  }
  unsubscribe(channel) {
    this.sendRaw({ v: 0, id: nextId(), type: "unsubscribe", channel });
  }
  isDropped(channel) {
    return this.droppedChannels.has(channel);
  }
  close() {
    for (const p of this.pendingCommands.values()) clearTimeout(p.timer);
    for (const p of this.pendingPings.values()) clearTimeout(p.timer);
    this.pendingCommands.clear();
    this.pendingPings.clear();
    this.ws?.close();
  }
  sendRaw(obj) {
    this.ws?.send(JSON.stringify(obj));
  }
  handleRaw(raw) {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (msg.type === "ping" && typeof msg.id === "string") {
      this.sendRaw({ v: 0, type: "pong", in_reply_to: msg.id });
      return;
    }
    if (msg.type === "pong") {
      const id = msg.in_reply_to;
      if (id) {
        const p = this.pendingPings.get(id);
        if (p) {
          clearTimeout(p.timer);
          this.pendingPings.delete(id);
          p.resolve(Date.now() - p.sentAt);
          return;
        }
      }
    }
    if (msg.type === "command_result") {
      const r = msg;
      const p = this.pendingCommands.get(r.in_reply_to);
      if (p) {
        clearTimeout(p.timer);
        this.pendingCommands.delete(r.in_reply_to);
        p.resolve(r);
        return;
      }
    }
    if (msg.type === "subscription_dropped") {
      const d = msg;
      this.droppedChannels.add(d.channel);
    }
    for (const h of this.handlers) h(msg);
  }
  handleClose() {
    const err = new ProtocolError("connection closed");
    for (const [id, p] of this.pendingCommands) {
      clearTimeout(p.timer);
      p.reject(err);
      this.pendingCommands.delete(id);
    }
    for (const [id, p] of this.pendingPings) {
      clearTimeout(p.timer);
      p.reject(err);
      this.pendingPings.delete(id);
    }
  }
  handleSocketError(_err) {
  }
};
async function connect(opts = {}) {
  const c = new Client(opts);
  await c.connect();
  return c;
}

// src/commands/stub-contract.ts
function runStubContract(args, opts) {
  const verb = args.positional[0];
  const json = flagBool(args, "json");
  const help11 = flagBool(args, "help") || args.flags.h === true || verb === void 0 || verb === "help";
  if (help11) {
    const status2 = opts.status ?? "pending_daemon_writer";
    if (json) {
      emitJson({
        noun: opts.noun,
        status: status2,
        commands: opts.commands,
        doc: opts.docRef
      });
    } else {
      emitPretty(`ema ${opts.noun} \u2014 agent workspace commands`);
      emitPretty(`status: ${status2}`);
      emitPretty("");
      emitPretty(opts.usage ?? `Usage: ema ${opts.noun} <subcommand> [flags...] [--json]`);
      emitPretty("");
      for (const cmd2 of opts.commands) {
        emitPretty(`  ${cmd2.verb.padEnd(10)} ${cmd2.summary}`);
        const flags2 = cmd2.flags ?? [];
        if (flags2.length > 0) emitPretty(`             flags: ${flags2.map((f) => `--${f}`).join(", ")}`);
        const required = cmd2.required ?? [];
        if (required.length > 0) emitPretty(`             required: ${required.map((f) => `--${f}`).join(", ")}`);
      }
      emitPretty("");
      emitPretty(`Docs: ${opts.docRef}`);
    }
    return 0;
  }
  const cmd = opts.commands.find((c) => c.verb === verb);
  if (!cmd) {
    emitError(
      `ema ${opts.noun}: unknown subcommand "${verb ?? ""}" (expected: ${opts.commands.map((c) => c.verb).join(" | ")})`
    );
    emitError(`See ${opts.docRef} for the full grammar.`);
    return 64;
  }
  const missing = (cmd.required ?? []).filter((name) => !flagString(args, name));
  if (missing.length > 0) {
    emitError(`ema ${opts.noun} ${cmd.verb}: missing ${missing.map((m) => `--${m}`).join(", ")}`);
    emitError(`See ${opts.docRef} for examples and field meanings.`);
    return 64;
  }
  const flags = {};
  for (const name of cmd.flags ?? []) {
    flags[name] = flagString(args, name) ?? (args.flags[name] === true ? true : null);
  }
  const note = `pending daemon writer; command grammar is active for agent/workspace coordination`;
  if (json) {
    emitJson({
      ok: true,
      command: `${opts.noun} ${cmd.verb}`,
      status: "pending_daemon_writer",
      flags,
      note,
      doc: opts.docRef
    });
  } else {
    emitPretty(`ema ${opts.noun} ${cmd.verb}: ${note}`);
    emitPretty(`  ${cmd.summary}`);
    for (const [k, v] of Object.entries(flags)) {
      if (v !== null && v !== void 0) emitPretty(`  --${k} ${String(v)}`);
    }
    emitPretty(`  docs: ${opts.docRef}`);
  }
  return 0;
}

// src/commands/ping.ts
async function runPing(args) {
  if (flagBool(args, "help") || args.flags.h === true || args.positional[0] === "help") {
    return runStubContract(args, {
      noun: "ping",
      status: "available",
      usage: "Usage: ema ping [--json]",
      docRef: "packages/contracts/ipc/shell-protocol.md",
      commands: [
        { verb: "run", flags: ["json"], summary: "Handshake with the daemon and print round-trip latency." }
      ]
    });
  }
  const json = flagBool(args, "json");
  try {
    const c = await connect({ surface: "desktop" });
    const rtt = await c.ping();
    if (json) {
      emitJson({
        ok: true,
        rtt_ms: rtt,
        daemon_version: c.hello?.daemon_version ?? null,
        device_id: c.hello?.accepted_device_id ?? null
      });
    } else {
      emitPretty(
        `ema ping: ${rtt}ms (daemon ${c.hello?.daemon_version ?? "?"}, device ${c.hello?.accepted_device_id ?? "unassigned"})`
      );
    }
    c.close();
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}
function reportError(err, json) {
  const isUnreachable = err instanceof DaemonUnreachableError;
  const msg = err instanceof Error ? err.message : String(err);
  if (json) {
    emitJson({
      ok: false,
      error: {
        class: isUnreachable ? "unavailable" : "internal",
        message: msg
      }
    });
  } else {
    emitError(`ema: ${msg}`);
    if (isUnreachable) {
      emitError("      Start the daemon with: bash scripts/dev-daemon.sh");
    }
  }
  return isUnreachable ? 2 : 1;
}

// src/workspace-scope.ts
import { existsSync as existsSync2, readFileSync as readFileSync2, readdirSync as readdirSync2, realpathSync, statSync as statSync2 } from "fs";
import { join as join2, relative as relative2, resolve as resolvePath, sep } from "path";

// src/workspace-state.ts
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";
var DESKTOP_ROOT = "/Users/trajanm4air/Desktop";
var EMA_ACTIVE_BUILD = join(DESKTOP_ROOT, "Active builds", "EMA-0.0.6");
var AGENT_WORKSPACE_PROJECT = join(DESKTOP_ROOT, "Projects", "agent-workspace-vapp");
var AGENTS_MD = join(DESKTOP_ROOT, "AGENTS.md");
var CLAUDE_MD = join(DESKTOP_ROOT, "CLAUDE.md");
var RECORD_DIRS = [
  "lanes",
  "queue",
  "handoffs",
  "executions",
  "responsibilities",
  "weekly",
  "checkups"
];
function workspaceSummary(opts = {}) {
  const now = opts.now ?? /* @__PURE__ */ new Date();
  const scope = opts.scope ?? null;
  const projectRecord = scope?.project_record ?? null;
  const activeBuild = scope?.active_build ?? null;
  const records = projectRecord ? Object.fromEntries(
    RECORD_DIRS.map((dir) => [dir, readRecords(join(projectRecord, dir))])
  ) : Object.fromEntries(RECORD_DIRS.map((dir) => [dir, []]));
  return {
    source: "file_backed_projection",
    daemon_authority: "pending_workspace_writer",
    root: DESKTOP_ROOT,
    active_build: activeBuild,
    project_record: projectRecord,
    workspace_scope: scope,
    orientation_docs: orientationDocs(projectRecord, activeBuild),
    counts: Object.fromEntries(
      Object.entries(records).map(([key, value]) => [key, value.length])
    ),
    records,
    tick: vcalendarTick(now),
    enforcement: [
      "Start every agent session with `ema ping --json`, `ema status --json`, `ema tl about --summary --json`, `ema vcalendar tick --json`, and `ema doctor --json`.",
      "When a task names a project, run task-layer commands with `--project <name-or-id>`; use unscoped `next` only for environment-level work.",
      "Claim or open a lane before broad edits; keep work inside that scope.",
      "When later work appears, log it as a queue item with why, dependency, done-when, and source.",
      "When a blocker recurs, log a problem and candidate solution edge.",
      "Run `ema vcalendar tick --json` at phase boundaries and before handoff.",
      "Daemon owns canonical lane/queue writes when available; file-backed project records remain fallback context."
    ]
  };
}
function orientationDocs(projectRecord, activeBuild) {
  const docs = [AGENTS_MD, CLAUDE_MD];
  if (activeBuild) docs.push(join(activeBuild, "docs", "cli", "agent-workspace.md"));
  if (projectRecord) {
    docs.push(join(projectRecord, "blueprint", "02-agent-cli-operating-contract.md"));
    docs.push(join(projectRecord, "atlas", "dependency-graph.md"));
  }
  return docs;
}
function withDaemonWorkspaceRecords(summary, overlay) {
  if (!overlay) return summary;
  const records = {
    ...summary.records,
    lanes: overlay.lanes,
    queue: overlay.queue
  };
  return {
    ...summary,
    source: "daemon_workspace_registry",
    daemon_authority: "canonical_events",
    records,
    counts: Object.fromEntries(
      Object.entries(records).map(([key, value]) => [key, value.length])
    ),
    enforcement: summary.enforcement.map(
      (rule) => rule.includes("file-backed project records remain fallback context") ? "Daemon owns canonical workspace lane/queue records; file-backed project records remain fallback context." : rule
    )
  };
}
function vcalendarTick(now = /* @__PURE__ */ new Date()) {
  const hour = now.getHours();
  const minute = now.getMinutes();
  const minutes = hour * 60 + minute;
  const phase = phaseFor(minutes);
  const next = nextBoundary(now, minutes);
  return {
    now: now.toISOString(),
    iso_week: isoWeek(now),
    phase: phase.label,
    mode: phase.mode,
    should_plan: phase.mode === "planning",
    should_checkup: phase.mode === "review" || phase.mode === "handoff",
    should_handoff: phase.mode === "handoff",
    next_tick: next.toISOString(),
    instructions: phase.instructions
  };
}
function readRecords(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => name.endsWith(".md") && name !== "README.md").map((name) => parseRecord(join(dir, name))).filter((record) => record != null);
}
function parseRecord(path2) {
  try {
    if (!statSync(path2).isFile()) return null;
    const raw = readFileSync(path2, "utf8");
    const frontmatter = raw.match(/^---\n([\s\S]*?)\n---/);
    const title = raw.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? fileTitle(path2);
    const meta = frontmatter ? parseFrontmatter(frontmatter[1] ?? "") : {};
    return {
      id: meta.id ?? fileTitle(path2),
      title,
      type: meta.type ?? "markdown_record",
      status: meta.status ?? "unknown",
      path: relative(DESKTOP_ROOT, path2)
    };
  } catch {
    return null;
  }
}
function parseFrontmatter(raw) {
  const out = {};
  for (const line of raw.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}
function fileTitle(path2) {
  return path2.split("/").pop()?.replace(/\.md$/, "") ?? path2;
}
function phaseFor(minutes) {
  if (minutes < 9 * 60) {
    return {
      label: "intake and orientation",
      mode: "planning",
      instructions: [
        "Read orientation docs.",
        "Run `ema status --json`; when the task names a project, run `ema agent orient --project <project> --json`.",
        "Pick or open the lane before editing."
      ]
    };
  }
  if (minutes < 11 * 60) {
    return {
      label: "planning and lane claim",
      mode: "planning",
      instructions: [
        "Clarify campaign, mission, lane, dependencies, and done-when.",
        "Log discovered later work to queue instead of expanding scope.",
        "Schedule checkups for risky or long-running lanes."
      ]
    };
  }
  if (minutes < 16 * 60) {
    return {
      label: "execution block",
      mode: "execution",
      instructions: [
        "Work inside the claimed lane scope.",
        "Keep dependency discoveries in queue/problem graph.",
        "Run verification before crossing into review."
      ]
    };
  }
  if (minutes < 18 * 60) {
    return {
      label: "review and checkup",
      mode: "review",
      instructions: [
        "Run verification and summarize changed files.",
        "Close or update queue items.",
        "Record blockers as problem/solution graph nodes."
      ]
    };
  }
  return {
    label: "handoff and next-day queue",
    mode: "handoff",
    instructions: [
      "Request or complete handoff before leaving partial work.",
      "Move unfinished discoveries to queue with dependencies.",
      "Set next vCalendar block and checkup cadence."
    ]
  };
}
function nextBoundary(now, minutes) {
  const boundaries = [9 * 60, 11 * 60, 16 * 60, 18 * 60, 24 * 60];
  const boundary = boundaries.find((value) => value > minutes) ?? 24 * 60;
  const next = new Date(now);
  next.setHours(0, boundary, 0, 0);
  return next;
}
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
  return `${d.getUTCFullYear()}-w${String(week).padStart(2, "0")}`;
}

// src/workspace-scope.ts
var PROJECTS_DIR = join2(DESKTOP_ROOT, "Projects");
var ACTIVE_BUILDS_DIR = join2(DESKTOP_ROOT, "Active builds");
var DAEMON_PROJECTION_TIMEOUT_MS = 1500;
async function resolveWorkspaceScope(opts = {}) {
  const cwd = canonicalCwd(opts.cwd ?? process.cwd());
  const env = opts.env ?? process.env;
  const projects = mergeProjects(await loadDaemonProjects(), loadFileProjects());
  const flagProject = opts.args ? flagString(opts.args, "project") : void 0;
  const flagSpace = opts.args ? flagString(opts.args, "space") : void 0;
  const flagOrg = opts.args ? flagString(opts.args, "org") : void 0;
  const fromFlag = pickProject(projects, flagProject);
  if (flagProject && fromFlag) {
    return decorate(fromFlag, "flag", cwd, { spaceOverride: flagSpace, orgOverride: flagOrg });
  }
  if (flagProject && !fromFlag) {
    return unresolved(cwd, `--project "${flagProject}" did not match any daemon project record`);
  }
  const envProject = env.EMA_PROJECT;
  const fromEnv = pickProject(projects, envProject);
  if (envProject && fromEnv) {
    return decorate(fromEnv, "env", cwd, {
      spaceOverride: env.EMA_SPACE,
      orgOverride: env.EMA_ORG
    });
  }
  if (envProject && !fromEnv) {
    return unresolved(cwd, `EMA_PROJECT="${envProject}" did not match any daemon project record`);
  }
  const cwdHit = inferFromCwd(cwd, projects);
  if (cwdHit) return cwdHit;
  const topbar = await loadDaemonTopbar();
  if (topbar?.current_project) {
    const match = pickProject(projects, topbar.current_project.id) ?? pickProject(projects, topbar.current_project.name);
    if (match) {
      return decorate(match, "daemon-current", cwd, {
        spaceOverride: topbar.current_space?.id,
        orgOverride: topbar.current_org?.id
      });
    }
  }
  return unresolved(cwd, "no project resolved from flags, env, cwd, or daemon current project");
}
function canonicalCwd(raw) {
  try {
    return realpathSync(raw);
  } catch {
    return resolvePath(raw);
  }
}
function decorate(project, source, cwd, overrides) {
  const projectRecord = project.local_path && project.local_path.length > 0 ? project.local_path : join2(PROJECTS_DIR, project.name);
  const { activeBuild, buildVersion, buildRecord } = inferBuildPaths(project.name, projectRecord, cwd, project.active_build);
  return {
    org_id: nullIfEmpty(overrides.orgOverride ?? project.org_id),
    space_id: nullIfEmpty(overrides.spaceOverride ?? project.space_id),
    project_id: nullIfEmpty(project.id),
    project_name: project.name,
    project_record: projectRecord,
    active_build: activeBuild,
    build_version: buildVersion,
    build_record: buildRecord,
    resolution_source: source,
    cwd,
    note: null
  };
}
function unresolved(cwd, why) {
  return {
    org_id: null,
    space_id: null,
    project_id: null,
    project_name: null,
    project_record: null,
    active_build: null,
    build_version: null,
    build_record: null,
    resolution_source: "unresolved",
    cwd,
    note: `${why}. Pass --project <name> or set EMA_PROJECT, or run from inside Projects/<name>/ or Active builds/<build>/.`
  };
}
function pickProject(projects, needle) {
  if (!needle) return null;
  const lower = needle.toLowerCase();
  return projects.find((p) => p.id === needle) ?? projects.find((p) => p.name.toLowerCase() === lower) ?? projects.find((p) => p.local_path === needle) ?? null;
}
function inferFromCwd(cwd, projects) {
  const byLocalPath = projects.filter((p) => p.local_path && p.local_path.length > 0).map((p) => ({ p, prefix: ensureTrailingSep(p.local_path) })).filter(({ prefix }) => cwd === stripTrailingSep(prefix) || cwd.startsWith(prefix)).sort((a, b) => b.prefix.length - a.prefix.length)[0];
  if (byLocalPath) {
    const project = byLocalPath.p;
    const projectRecord = project.local_path;
    const buildVersion = inferBuildVersionUnderProject(projectRecord, cwd);
    const buildRecord = buildVersion ? join2(projectRecord, "builds", buildVersion) : null;
    return {
      org_id: nullIfEmpty(project.org_id),
      space_id: nullIfEmpty(project.space_id),
      project_id: nullIfEmpty(project.id),
      project_name: project.name,
      project_record: projectRecord,
      active_build: project.active_build ?? matchActiveBuildPath(project.name) ?? null,
      build_version: buildVersion,
      build_record: buildRecord,
      resolution_source: buildVersion ? "cwd-build" : "cwd-project",
      cwd,
      note: null
    };
  }
  const byActiveBuild = projects.filter((p) => p.active_build && p.active_build.length > 0).map((p) => ({ p, prefix: ensureTrailingSep(canonicalMaybe(p.active_build ?? "")) })).filter(({ prefix }) => cwd === stripTrailingSep(prefix) || cwd.startsWith(prefix)).sort((a, b) => b.prefix.length - a.prefix.length)[0];
  if (byActiveBuild) {
    const project = byActiveBuild.p;
    const projectRecord = project.local_path && project.local_path.length > 0 ? project.local_path : join2(PROJECTS_DIR, project.name);
    return {
      org_id: nullIfEmpty(project.org_id),
      space_id: nullIfEmpty(project.space_id),
      project_id: nullIfEmpty(project.id),
      project_name: project.name,
      project_record: projectRecord,
      active_build: canonicalMaybe(project.active_build ?? ""),
      build_version: null,
      build_record: null,
      resolution_source: "cwd-active-build",
      cwd,
      note: null
    };
  }
  const activePrefix = ensureTrailingSep(ACTIVE_BUILDS_DIR);
  if (cwd.startsWith(activePrefix) || cwd === ACTIVE_BUILDS_DIR) {
    const rel = cwd === ACTIVE_BUILDS_DIR ? "" : relative2(ACTIVE_BUILDS_DIR, cwd);
    const buildName = rel.split(sep)[0] ?? "";
    if (buildName) {
      const { projectName: projectName2, version } = parseBuildName(buildName);
      const project = pickProject(projects, projectName2);
      if (project) {
        const projectRecord = project.local_path && project.local_path.length > 0 ? project.local_path : join2(PROJECTS_DIR, project.name);
        const activeBuild = join2(ACTIVE_BUILDS_DIR, buildName);
        const buildRecord = version ? join2(projectRecord, "builds", version) : null;
        return {
          org_id: nullIfEmpty(project.org_id),
          space_id: nullIfEmpty(project.space_id),
          project_id: nullIfEmpty(project.id),
          project_name: project.name,
          project_record: projectRecord,
          active_build: activeBuild,
          build_version: version,
          build_record: buildRecord,
          resolution_source: "cwd-active-build",
          cwd,
          note: null
        };
      }
    }
  }
  return null;
}
function nullIfEmpty(value) {
  return value && value.length > 0 ? value : null;
}
function inferBuildPaths(projectName2, projectRecord, cwd, configuredActiveBuild) {
  const configured = configuredActiveBuild ? canonicalMaybe(configuredActiveBuild) : null;
  if (configured && (cwd === configured || cwd.startsWith(ensureTrailingSep(configured)))) {
    return {
      activeBuild: configured,
      buildVersion: null,
      buildRecord: null
    };
  }
  const activePrefix = ensureTrailingSep(ACTIVE_BUILDS_DIR);
  if (cwd.startsWith(activePrefix)) {
    const buildName = relative2(ACTIVE_BUILDS_DIR, cwd).split(sep)[0] ?? "";
    if (buildName) {
      const parsed = parseBuildName(buildName);
      if (sameProjectName(parsed.projectName, projectName2)) {
        const activeBuild = join2(ACTIVE_BUILDS_DIR, buildName);
        return {
          activeBuild,
          buildVersion: parsed.version,
          buildRecord: parsed.version ? join2(projectRecord, "builds", parsed.version) : null
        };
      }
    }
  }
  const buildVersion = inferBuildVersionUnderProject(projectRecord, cwd);
  return {
    activeBuild: configured ?? matchActiveBuildPath(projectName2),
    buildVersion,
    buildRecord: buildVersion ? join2(projectRecord, "builds", buildVersion) : null
  };
}
function canonicalMaybe(raw) {
  const clean = raw.replaceAll("\\ ", " ");
  try {
    return realpathSync(clean);
  } catch {
    return resolvePath(clean);
  }
}
function inferBuildVersionUnderProject(projectRecord, cwd) {
  const buildsRoot = ensureTrailingSep(join2(projectRecord, "builds"));
  if (!cwd.startsWith(buildsRoot)) return null;
  const rest = relative2(join2(projectRecord, "builds"), cwd);
  return rest.split(sep)[0] ?? null;
}
function matchActiveBuildPath(projectName2) {
  if (!existsSync2(ACTIVE_BUILDS_DIR)) return null;
  const exact = join2(ACTIVE_BUILDS_DIR, projectName2);
  if (existsSync2(exact) && isDirectory(exact)) return exact;
  try {
    const entries = readdirSync2(ACTIVE_BUILDS_DIR);
    const prefixed = entries.find((name) => name.startsWith(`${projectName2}-`));
    return prefixed ? join2(ACTIVE_BUILDS_DIR, prefixed) : null;
  } catch {
    return null;
  }
}
function parseBuildName(buildName) {
  const match = buildName.match(/^(.*)-(\d[\w.\-+]*)$/);
  if (match) return { projectName: match[1] ?? buildName, version: match[2] ?? null };
  return { projectName: buildName, version: null };
}
function sameProjectName(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}
function ensureTrailingSep(path2) {
  return path2.endsWith(sep) ? path2 : `${path2}${sep}`;
}
function stripTrailingSep(path2) {
  return path2.endsWith(sep) ? path2.slice(0, -1) : path2;
}
function isDirectory(path2) {
  try {
    return statSync2(path2).isDirectory();
  } catch {
    return false;
  }
}
async function loadDaemonProjects() {
  try {
    const c = await connect({ surface: "desktop" });
    const projects = await new Promise((resolve2) => {
      const timer = setTimeout(() => resolve2([]), DAEMON_PROJECTION_TIMEOUT_MS);
      c.onMessage((msg) => {
        if (msg.type !== "projection") return;
        if (msg.name !== "project.filesystem_status") return;
        clearTimeout(timer);
        const data = msg.data;
        resolve2((data?.projects ?? []).map(toDaemonProject));
      });
      c.subscribe("project.filesystem_status");
    });
    c.close();
    return projects;
  } catch {
    return [];
  }
}
function loadFileProjects() {
  if (!existsSync2(PROJECTS_DIR)) return [];
  const projectPaths = [
    ...projectRecordPaths(PROJECTS_DIR),
    ...projectRecordPaths(join2(PROJECTS_DIR, "EMA", "subprojects"))
  ];
  return projectPaths.map(readFileProject).filter((project) => project !== null);
}
function projectRecordPaths(root) {
  if (!existsSync2(root)) return [];
  try {
    return readdirSync2(root).map((name) => join2(root, name)).filter((path2) => isDirectory(path2) && existsSync2(join2(path2, "project.md")));
  } catch {
    return [];
  }
}
function readFileProject(path2) {
  try {
    const raw = readFileSync2(join2(path2, "project.md"), "utf8");
    const meta = {
      ...parseMarkdownFields(raw),
      ...parseFrontmatter2(raw)
    };
    const name = meta.name ?? path2.split(sep).pop() ?? "";
    if (!name) return null;
    return {
      id: meta.project_id ?? "",
      name,
      org_id: meta.org_id ?? "",
      space_id: meta.space_id ?? "",
      local_path: path2,
      active_build: meta.active_build ? resolveMetadataPath(path2, meta.active_build) : void 0,
      materialization_status: meta.status ?? "file_record"
    };
  } catch {
    return null;
  }
}
function mergeProjects(daemon, fileProjects) {
  const merged = /* @__PURE__ */ new Map();
  for (const project of fileProjects) {
    merged.set(projectKey(project), project);
  }
  for (const project of daemon) {
    const existing = merged.get(projectKey(project));
    merged.set(projectKey(project), {
      ...existing,
      ...project,
      id: project.id || existing?.id || "",
      org_id: project.org_id || existing?.org_id || "",
      space_id: project.space_id || existing?.space_id || "",
      local_path: project.local_path || existing?.local_path || "",
      active_build: project.active_build || existing?.active_build,
      materialization_status: project.materialization_status || existing?.materialization_status || ""
    });
  }
  return [...merged.values()];
}
function resolveMetadataPath(projectRecord, raw) {
  const clean = raw.replaceAll("\\ ", " ");
  if (clean.startsWith("/")) return canonicalMaybe(clean);
  return canonicalMaybe(join2(projectRecord, clean));
}
function projectKey(project) {
  return project.id || project.name.toLowerCase() || project.local_path;
}
function parseFrontmatter2(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const out = {};
  for (const line of (match[1] ?? "").split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) out[key] = value.replace(/^["']|["']$/g, "");
  }
  return out;
}
function parseMarkdownFields(raw) {
  const out = {};
  for (const line of raw.split("\n")) {
    const match = line.match(/^\s*-\s*([a-zA-Z0-9_]+):\s*`?([^`]+?)`?\s*$/);
    if (!match) continue;
    const key = match[1];
    const value = match[2]?.trim();
    if (key && value) out[key] = value;
  }
  return out;
}
async function loadDaemonTopbar() {
  try {
    const c = await connect({ surface: "desktop" });
    const topbar = await new Promise((resolve2) => {
      const timer = setTimeout(() => resolve2(null), DAEMON_PROJECTION_TIMEOUT_MS);
      c.onMessage((msg) => {
        if (msg.type !== "projection") return;
        if (msg.name !== "topbar") return;
        clearTimeout(timer);
        const d = msg.data ?? {};
        resolve2({
          current_org: pickIdName(d.current_org),
          current_space: pickIdName(d.current_space),
          current_project: pickIdName(d.current_project)
        });
      });
      const userId = c.hello?.accepted_device_id;
      if (userId) c.subscribe(`user.${userId}.orgs`);
    });
    c.close();
    return topbar;
  } catch {
    return null;
  }
}
function toDaemonProject(raw) {
  const r = raw ?? {};
  return {
    id: stringOr(r.project_id, "") || stringOr(r.id, ""),
    name: stringOr(r.name, ""),
    org_id: stringOr(r.org_id, ""),
    space_id: stringOr(r.space_id, ""),
    local_path: stringOr(r.local_path, ""),
    materialization_status: stringOr(r.status, "") || stringOr(r.materialization_status, "")
  };
}
function pickIdName(raw) {
  if (!raw || typeof raw !== "object") return null;
  const r = raw;
  const id = typeof r.id === "string" ? r.id : null;
  const name = typeof r.name === "string" ? r.name : null;
  if (!id || !name) return null;
  return { id, name };
}
function stringOr(value, fallback) {
  return typeof value === "string" ? value : fallback;
}

// src/commands/status.ts
var PROJECTION_TIMEOUT_MS = 5e3;
async function runStatus(args) {
  if (flagBool(args, "help") || args.flags.h === true || args.positional[0] === "help") {
    return runStubContract(args, {
      noun: "status",
      status: "available",
      usage: "Usage: ema status [--project <name-or-id>] [--all-projects] [--json]",
      docRef: "docs/cli/agent-workspace.md",
      commands: [
        { verb: "show", flags: ["project", "all-projects", "json"], summary: "Print home-current topbar selection plus resolved workspace scope." }
      ]
    });
  }
  const json = flagBool(args, "json");
  try {
    const c = await connect({ surface: "desktop" });
    const data = await new Promise((resolve2, reject) => {
      const timer = setTimeout(
        () => reject(new Error("timed out waiting for topbar projection")),
        PROJECTION_TIMEOUT_MS
      );
      c.onMessage((msg) => {
        if (msg.type === "projection" && msg.name === "topbar") {
          clearTimeout(timer);
          resolve2(msg.data);
        }
      });
      const userId = c.hello?.accepted_device_id ?? null;
      if (userId) c.subscribe(`user.${userId}.orgs`);
    });
    const workspaceScope = await resolveWorkspaceScope({ args });
    const homeCurrent = {
      source: "topbar_projection",
      org: data.current_org ?? null,
      space: data.current_space ?? null,
      project: data.current_project ?? null,
      node_state: data.node_state ?? null
    };
    const scopeWarning = homeCurrent.project?.id && workspaceScope.project_id && homeCurrent.project.id !== workspaceScope.project_id ? `home_current project ${homeCurrent.project.name} (${homeCurrent.project.id}) differs from workspace_scope project ${workspaceScope.project_name ?? "(unnamed)"} (${workspaceScope.project_id}); workspace commands use workspace_scope unless --project overrides it.` : null;
    if (json) {
      emitJson({
        ok: true,
        org: data.current_org ?? null,
        space: data.current_space ?? null,
        project: data.current_project ?? null,
        node_state: data.node_state ?? null,
        home_current: homeCurrent,
        workspace_scope: workspaceScope,
        scope_warning: scopeWarning,
        scope_note: "org/space/project are the daemon topbar home_current selection; workspace_scope is the flag/env/cwd-resolved project scope used by workspace commands."
      });
    } else {
      emitPretty("# home current (topbar projection)");
      emitPretty(`org:     ${fmt(data.current_org)}`);
      emitPretty(`space:   ${fmt(data.current_space)}`);
      emitPretty(`project: ${fmt(data.current_project)}`);
      if (data.node_state) emitPretty(`node:    ${data.node_state}`);
      emitPretty("");
      emitPretty("# workspace scope (flags/env/cwd resolver)");
      emitPretty(`project: ${workspaceScope.project_name ?? "(unresolved)"} (${workspaceScope.project_id ?? "no id"})`);
      emitPretty(`source:  ${workspaceScope.resolution_source}`);
      emitPretty(`cwd:     ${workspaceScope.cwd}`);
      if (scopeWarning) emitPretty(`warning: ${scopeWarning}`);
      if (workspaceScope.note) emitPretty(`note:    ${workspaceScope.note}`);
    }
    c.close();
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}
function fmt(x) {
  if (!x) return "(none)";
  return `${x.name} (${x.id})`;
}

// src/commands/substrate-utils.ts
import { execFileSync, spawnSync } from "child_process";
import { existsSync as existsSync3, mkdirSync, readFileSync as readFileSync3, readdirSync as readdirSync3, statSync as statSync3, writeFileSync } from "fs";
import { createHash } from "crypto";
import { dirname, join as join3 } from "path";
var CANONICAL_DB = process.env.EMA_CANONICAL_DB ?? join3(EMA_ACTIVE_BUILD, "apps", "daemon", "canonical.db");
function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
function stableId(prefix, value) {
  return `${prefix}:${sha256(value).slice(0, 16)}`;
}
function sqlEscape(value) {
  return value.replaceAll("'", "''");
}
function readText(path2) {
  return readFileSync3(path2, "utf8");
}
function parseLimit(raw, fallback, max = 500) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}
function sqliteJson(db, sql) {
  const out = execFileSync("sqlite3", ["-json", db, sql], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024
  }).trim();
  if (!out) return [];
  return JSON.parse(out);
}
function dbStatus(db = CANONICAL_DB) {
  if (!existsSync3(db)) {
    return {
      ok: false,
      path: db,
      exists: false,
      wal_exists: existsSync3(`${db}-wal`),
      shm_exists: existsSync3(`${db}-shm`),
      size_bytes: null,
      user_version: null,
      tables: [],
      table_counts: {},
      recent_event_kinds: [],
      duplicate_artifacts: findDuplicateDbs(),
      error: "canonical database not found"
    };
  }
  try {
    const tables = sqliteJson(
      db,
      "select name from sqlite_master where type='table' and name not like 'sqlite_%' order by name;"
    ).map((row) => row.name);
    const counts = {};
    for (const table of tables) {
      const rows = sqliteJson(db, `select count(*) as count from '${sqlEscape(table)}';`);
      counts[table] = Number(rows[0]?.count ?? 0);
    }
    const recentKinds = tables.includes("events") ? sqliteJson(
      db,
      "select kind, count(*) as count from events group by kind order by count desc, kind limit 80;"
    ) : [];
    const userVersion = sqliteJson(db, "pragma user_version;")[0]?.user_version ?? null;
    return {
      ok: true,
      path: db,
      exists: true,
      wal_exists: existsSync3(`${db}-wal`),
      shm_exists: existsSync3(`${db}-shm`),
      size_bytes: statSync3(db).size,
      user_version: Number(userVersion),
      tables,
      table_counts: counts,
      recent_event_kinds: recentKinds,
      duplicate_artifacts: findDuplicateDbs()
    };
  } catch (err) {
    return {
      ok: false,
      path: db,
      exists: true,
      wal_exists: existsSync3(`${db}-wal`),
      shm_exists: existsSync3(`${db}-shm`),
      size_bytes: statSync3(db).size,
      user_version: null,
      tables: [],
      table_counts: {},
      recent_event_kinds: [],
      duplicate_artifacts: findDuplicateDbs(),
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
function findDuplicateDbs() {
  const dir = join3(EMA_ACTIVE_BUILD, "apps", "daemon");
  if (!existsSync3(dir)) return [];
  return readdirSync3(dir).filter((name) => /^canonical .*\.db/.test(name) || /^canonical .*\.db-(wal|shm)$/.test(name)).map((name) => join3(dir, name));
}
function commandExists(name) {
  return spawnSync("which", [name], { encoding: "utf8" }).status === 0;
}
function projectRegistry(project = "proslync-app-ios-final") {
  const roots = {
    app: join3(DESKTOP_ROOT, "Active builds", "proslync-app-ios-final"),
    backend: join3(DESKTOP_ROOT, "Active builds", "proslync-backend"),
    desktop: join3(DESKTOP_ROOT, "Active builds", "proslync-desktop"),
    assets: join3(DESKTOP_ROOT, "Active builds", "proslync-presentation-assets-final")
  };
  return {
    ok: true,
    command: "project.registry.show",
    source: "local_project_registry",
    authority: "file_backed_registry",
    project,
    client: project === "proslync-app-ios-final" ? "Ms. Wilson / Proslync" : null,
    active_builds: Object.entries(roots).map(([id, path2]) => ({
      id,
      path: path2,
      exists: existsSync3(path2)
    })),
    canonical_docs: [
      join3(roots.app, "PLAN.md"),
      join3(roots.app, "research-plane", "cross-pollinators", "identity-absorption-product-plan-2026-05-09.md"),
      join3(roots.assets, "docs", "plans", "proslync-role-happiness-master-plan-2026-05-09", "README.md")
    ].map((path2) => ({ path: path2, exists: existsSync3(path2) })),
    acceptance_commands: [
      "ema bootstrap status --project proslync-app-ios-final --json",
      "ema capability assert --required lane,queue,agent,harness,intention,db,artifact,execution --project proslync-app-ios-final --json",
      "ema db status --json",
      "ema execution list --project proslync-app-ios-final --json",
      "ema cockpit workpack --project proslync-app-ios-final --json"
    ]
  };
}

// src/commands/events.ts
async function runEvents(args) {
  const sub = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || sub === "help") {
    return runStubContract(args, {
      noun: "events",
      status: "available",
      docRef: "packages/contracts/ipc/shell-protocol.md",
      commands: [
        { verb: "tail", flags: ["family", "kind", "since", "json"], summary: "Stream daemon events line-by-line until interrupted." },
        { verb: "list", flags: ["kind", "limit", "project", "json"], summary: "Read recent canonical event rows from SQLite." }
      ]
    });
  }
  if (sub === "list") return listEvents(args);
  if (sub !== "tail") {
    emitError(`ema events: unknown subcommand "${sub ?? ""}" (expected: tail | list)`);
    return 64;
  }
  const json = flagBool(args, "json");
  const family = flagString(args, "family");
  const since = flagString(args, "since");
  const kindArg = flagString(args, "kind");
  const kindPatterns = kindArg ? kindArg.split(",").map((s) => s.trim()).filter(Boolean) : [];
  try {
    let matchesKind2 = function(kind) {
      if (kindPatterns.length === 0) return true;
      return kindPatterns.some((pat) => {
        if (pat.endsWith(".*")) return kind.startsWith(pat.slice(0, -1));
        if (pat.endsWith("*")) return kind.startsWith(pat.slice(0, -1));
        return kind === pat;
      });
    };
    var matchesKind = matchesKind2;
    const c = await connect({ surface: "desktop" });
    if (since && !json) {
      emitPretty(`# --since=${since} accepted (no-op in v0; projections snapshot on subscribe)`);
    }
    if (family && !json) {
      emitPretty(`# filtering to family: ${family}`);
    }
    c.onMessage((msg) => {
      if (msg.type === "event") {
        const env = msg;
        const kind = env.event.kind ?? "";
        if (family && !kind.startsWith(family + ".") && kind !== family) return;
        if (!matchesKind2(kind)) return;
        if (json) {
          emitJson(env.event);
        } else {
          emitPretty(JSON.stringify(env.event));
        }
      } else if (msg.type === "subscription_dropped") {
        const d = msg;
        emitError(`# subscription dropped on ${d.channel} (${d.reason}); re-subscribing`);
        c.subscribe(d.channel);
      }
    });
    const device = c.hello?.accepted_device_id ?? null;
    if (device) {
      c.subscribe(`user.${device}.orgs`);
    }
    await new Promise((resolve2) => {
      const shutdown = () => {
        c.close();
        resolve2();
      };
      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
    });
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}
function listEvents(args) {
  const json = flagBool(args, "json");
  const kind = flagString(args, "kind");
  const project = flagString(args, "project");
  const limit = parseLimit(flagString(args, "limit"), 50);
  const clauses = [
    kind ? `kind like '${sqlEscape(kind.replace(/\*$/, "%"))}'` : "",
    project ? `(project_id = '${sqlEscape(project)}' or project_id is null or project_id = '')` : ""
  ].filter(Boolean);
  const rows = sqliteJson(CANONICAL_DB, `
    select txid, event_id, kind, ts, actor, org_id, space_id, project_id,
           dispatch_id, execution_id, payload_json
    from events
    ${clauses.length ? `where ${clauses.join(" and ")}` : ""}
    order by txid desc
    limit ${limit};
  `).map((row) => ({
    ...row,
    payload: parsePayload(row.payload_json)
  }));
  const payload = {
    ok: true,
    command: "events.list",
    source: "canonical_sqlite",
    daemon_authority: "canonical_events",
    kind: kind ?? null,
    project: project ?? null,
    limit,
    events: rows
  };
  if (json) emitJson(payload);
  else for (const row of rows) emitPretty(`${row.txid} ${row.kind} ${row.event_id}`);
  return 0;
}
function parsePayload(value) {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

// src/commands/workspace-daemon.ts
var DEFAULT_ORG = "org:01J00000000000000000000001";
var DEFAULT_ACTOR = "actor:dev-console";
async function workspaceScopeContext(args) {
  return {
    scope: await resolveWorkspaceScope({ args }),
    allProjects: flagBool(args, "all-projects")
  };
}
function shellArg(value) {
  return /^[A-Za-z0-9_./:@%+=,-]+$/.test(value) ? value : `'${value.replaceAll("'", `'"'"'`)}'`;
}
function workspaceScopeFlagParts(scope, allProjects = false) {
  if (allProjects) return ["--all-projects"];
  const project = scope?.project_name ?? scope?.project_id ?? null;
  return project ? ["--project", project] : [];
}
function renderEmaCommand(parts) {
  return ["ema", ...parts].map(shellArg).join(" ");
}
function renderScopedEmaCommand(context, parts) {
  const scopeParts = workspaceScopeFlagParts(context.scope, context.allProjects ?? false);
  const firstFlag = parts.findIndex((part) => part.startsWith("--"));
  const insertAt = firstFlag === -1 ? parts.length : firstFlag;
  return renderEmaCommand([
    ...parts.slice(0, insertAt),
    ...scopeParts,
    ...parts.slice(insertAt)
  ]);
}
function filterProjectScopedRecords(records, context) {
  if (context.allProjects) return [...records];
  const projectId = context.scope.project_id;
  if (!projectId) return [];
  return records.filter((record) => record.project_id === projectId);
}
function withResolvedWorkspaceScope(argsObj, context) {
  if (context.allProjects) return argsObj;
  const scoped = { ...argsObj };
  if ("org_id" in scoped && context.scope.org_id) scoped.org_id = context.scope.org_id;
  if ("space_id" in scoped && context.scope.space_id) scoped.space_id = context.scope.space_id;
  if ("project_id" in scoped && context.scope.project_id) scoped.project_id = context.scope.project_id;
  return scoped;
}
async function sendWorkspaceCommand(args, op, argsObj, out) {
  const json = flagBool(args, "json");
  try {
    const scopeContext = await workspaceScopeContext(args);
    const c = await connect({ surface: "desktop" });
    const result = await c.command(op, withResolvedWorkspaceScope(argsObj, scopeContext));
    c.close();
    if (result.ok !== true) {
      if (json) {
        emitJson({
          ok: false,
          command: op,
          op,
          source: "daemon_command",
          daemon_authority: "canonical_events",
          events: [],
          resource: null,
          workspace_scope: scopeContext.scope,
          all_projects: scopeContext.allProjects,
          error: result.error,
          blocked_by: result.error?.class === "not_found" ? "missing_resource" : void 0
        });
      } else emitError(`ema ${op}: ${result.error.class}: ${result.error.message}`);
      return 1;
    }
    const events2 = result.events ?? [];
    const resource = typeof result.resource === "string" ? result.resource : null;
    const warning = result.warning ?? null;
    if (json) {
      emitJson({
        ok: true,
        command: op,
        op,
        source: "daemon_command",
        daemon_authority: "canonical_events",
        events: events2,
        resource,
        warning,
        workspace_scope: scopeContext.scope,
        all_projects: scopeContext.allProjects
      });
    } else {
      emitPretty(out.human);
      if (resource) emitPretty(`${out.resourceLabel ?? "resource"}: ${resource}`);
      emitPretty(`events: ${events2.join(", ") || "(none returned)"}`);
      if (warning?.message) emitPretty(`[warn] ${warning.class ?? "warning"}: ${warning.message}`);
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}
async function readProjection(args, spec) {
  const json = flagBool(args, "json");
  try {
    const scopeContext = await workspaceScopeContext(args);
    const projectId = !scopeContext.allProjects && scopeContext.scope.project_id ? scopeContext.scope.project_id : null;
    const c = await connect({ surface: "desktop" });
    const value = await new Promise((resolve2) => {
      const timer = setTimeout(() => resolve2(spec.pick({})), 1200);
      c.onMessage((msg) => {
        if (msg.type === "projection" && msg.name === spec.name) {
          clearTimeout(timer);
          resolve2(spec.pick(msg.data ?? {}));
        }
      });
      c.subscribe(spec.name, projectId ? { project_id: projectId } : void 0);
    });
    c.close();
    return value;
  } catch (err) {
    await reportError(err, json);
    return null;
  }
}
async function readProjectionBatch(args, specs, timeoutMs = 1200) {
  const json = flagBool(args, "json");
  if (specs.length === 0) return [];
  try {
    const scopeContext = await workspaceScopeContext(args);
    const projectId = !scopeContext.allProjects && scopeContext.scope.project_id ? scopeContext.scope.project_id : null;
    const c = await connect({ surface: "desktop" });
    const values = /* @__PURE__ */ new Map();
    const wanted = new Set(specs.map((spec) => spec.name));
    const result = await new Promise((resolve2) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve2(specs.map((spec) => values.has(spec.name) ? values.get(spec.name) : spec.pick({})));
      };
      const timer = setTimeout(finish, timeoutMs);
      c.onMessage((msg) => {
        const name = msg.name;
        if (msg.type !== "projection" || !name || !wanted.has(name) || values.has(name)) return;
        const spec = specs.find((candidate) => candidate.name === name);
        if (!spec) return;
        values.set(name, spec.pick(msg.data ?? {}));
        if (values.size === wanted.size) {
          clearTimeout(timer);
          finish();
        }
      });
      for (const spec of specs) {
        c.subscribe(spec.name, projectId ? { project_id: projectId } : void 0);
      }
    });
    c.close();
    return result;
  } catch (err) {
    await reportError(err, json);
    return specs.map((spec) => spec.pick({}));
  }
}

// src/commands/swarm.ts
var DOC_REF = "docs/cli/see-agent-work.md";
async function runSwarm(args) {
  const verb = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return runSwarmHelp(args);
  if (verb === "create") return createSwarm(args);
  if (verb === "start") return changeSwarm(args, "swarm.start", "started");
  if (verb === "pause") return changeSwarm(args, "swarm.pause", "paused");
  if (verb === "stop") return changeSwarm(args, "swarm.stop", "stopped");
  if (verb === "report") return reportSwarm(args);
  if (verb === "status") return showSwarm(args);
  if (verb === "show") return showSwarm(args);
  return listSwarms(args);
}
function runSwarmHelp(args) {
  return runStubContract(args, {
    noun: "swarm",
    status: "available",
    docRef: DOC_REF,
    commands: [
      { verb: "create", flags: ["name", "project", "mission", "campaign"], required: ["name"], summary: "Create a coordinated swarm under the resolved workspace scope." },
      { verb: "list", flags: ["project", "all-projects", "json"], summary: "List swarms in the resolved workspace scope." },
      { verb: "show", flags: ["swarm"], required: ["swarm"], summary: "Show one swarm from swarm.registry." },
      { verb: "status", flags: ["swarm"], required: ["swarm"], summary: "Show current status for a swarm (alias of show)." },
      { verb: "start", flags: ["swarm"], required: ["swarm"], summary: "Move a swarm to started." },
      { verb: "pause", flags: ["swarm", "reason"], required: ["swarm"], summary: "Pause a swarm with an optional reason." },
      { verb: "stop", flags: ["swarm", "reason"], required: ["swarm"], summary: "Stop a swarm with an optional reason." },
      { verb: "report", flags: ["swarm", "summary"], required: ["swarm"], summary: "Append a swarm report event with an optional summary." }
    ]
  });
}
async function createSwarm(args) {
  const name = flagString(args, "name") ?? flagString(args, "title");
  if (!name) {
    emitError("ema swarm create: --name is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "swarm.create", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    name,
    title: name,
    project_id: flagString(args, "project") ?? null,
    mission_id: flagString(args, "mission") ?? null,
    campaign_id: flagString(args, "campaign") ?? null
  }, { human: `created swarm "${name}"`, resourceLabel: "swarm" });
}
async function changeSwarm(args, op, label) {
  const swarm = flagString(args, "swarm");
  if (!swarm) {
    emitError(`ema swarm ${args.positional[0] ?? "change"}: --swarm is required`);
    return 64;
  }
  return sendWorkspaceCommand(args, op, {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    swarm_id: swarm,
    reason: flagString(args, "reason") ?? null
  }, { human: `${label} swarm ${swarm}` });
}
async function reportSwarm(args) {
  const swarm = flagString(args, "swarm");
  if (!swarm) {
    emitError("ema swarm report: --swarm is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "swarm.report", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    swarm_id: swarm,
    body: flagString(args, "summary") ?? flagString(args, "body") ?? null
  }, { human: `recorded swarm report for ${swarm}`, resourceLabel: "swarm_report" });
}
async function listSwarms(args) {
  const json = flagBool(args, "json");
  const swarms = await loadSwarms(args);
  if (!swarms) return 1;
  if (json) emitJson({ ok: true, source: "swarm.registry", swarms });
  else {
    emitPretty("# swarms");
    if (swarms.length === 0) emitPretty("  (none)");
    for (const swarm of swarms) emitPretty(`  ${swarm.id} [${swarm.status ?? "unknown"}] ${swarm.title ?? ""}`);
  }
  return 0;
}
async function showSwarm(args) {
  const json = flagBool(args, "json");
  const id = flagString(args, "swarm");
  if (!id) {
    emitError("ema swarm show: --swarm is required");
    return 64;
  }
  const swarms = await loadSwarms(args);
  if (!swarms) return 1;
  const swarm = swarms.find((item) => item.id === id || item.swarm_id === id) ?? null;
  if (json) emitJson({ ok: true, source: "swarm.registry", swarm });
  else if (swarm) emitPretty(JSON.stringify(swarm, null, 2));
  else emitPretty(`swarm not found: ${id}`);
  return swarm ? 0 : 1;
}
async function loadSwarms(args) {
  const context = await workspaceScopeContext(args);
  const items = await readProjection(args, {
    name: "swarm.registry",
    pick: (data) => data.swarms ?? []
  });
  if (!items) return null;
  return filterProjectScopedRecords(items, context);
}

// src/commands/org.ts
async function runOrg(args) {
  const sub = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || sub === "help") {
    return runStubContract(args, {
      noun: "org",
      status: "available",
      docRef: "docs/cli/agent-workspace.md",
      commands: [
        { verb: "create", flags: ["name"], required: ["name"], summary: "Create an organization and its same-name default space." }
      ]
    });
  }
  if (sub !== "create") {
    emitError(`ema org: unknown subcommand "${sub ?? ""}" (expected: create)`);
    return 64;
  }
  const json = flagBool(args, "json");
  const name = flagString(args, "name") ?? args.positional.slice(1).join(" ");
  if (!name.trim()) {
    emitError(`ema org create: missing organization name`);
    emitError(`Usage: ema org create --name "Trajan's Organization"`);
    return 64;
  }
  try {
    const c = await connect({ surface: "desktop" });
    const result = await c.command("org.create", { name });
    c.close();
    if (result.ok !== true) {
      if (json) emitJson({ ok: false, error: result.error });
      else emitError(`ema org create: ${result.error.class}: ${result.error.message}`);
      return 1;
    }
    const events2 = result.events ?? [];
    if (json) {
      emitJson({ ok: true, name, events: events2 });
    } else {
      emitPretty(`created org: ${name}`);
      emitPretty(`events: ${events2.join(", ") || "(none returned)"}`);
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}

// src/commands/space.ts
async function runSpace(args) {
  const sub = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || sub === "help") {
    return runStubContract(args, {
      noun: "space",
      status: "available",
      docRef: "docs/cli/agent-workspace.md",
      commands: [
        { verb: "create", flags: ["org", "name"], required: ["org", "name"], summary: "Create a space inside an organization." }
      ]
    });
  }
  if (sub !== "create") {
    emitError(`ema space: unknown subcommand "${sub ?? ""}" (expected: create)`);
    return 64;
  }
  const json = flagBool(args, "json");
  const orgId = flagString(args, "org");
  const name = flagString(args, "name") ?? args.positional.slice(1).join(" ");
  if (!orgId || !name.trim()) {
    emitError(`ema space create: missing --org or --name`);
    emitError(`Usage: ema space create --org org:<id> --name "App Work"`);
    return 64;
  }
  try {
    const c = await connect({ surface: "desktop" });
    const result = await c.command("space.create", {
      org_id: orgId,
      name
    });
    c.close();
    if (result.ok !== true) {
      if (json) emitJson({ ok: false, error: result.error });
      else emitError(`ema space create: ${result.error.class}: ${result.error.message}`);
      return 1;
    }
    const events2 = result.events ?? [];
    if (json) {
      emitJson({ ok: true, org_id: orgId, name, events: events2 });
    } else {
      emitPretty(`created space: ${name}`);
      emitPretty(`events: ${events2.join(", ") || "(none returned)"}`);
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}

// src/commands/project.ts
async function runProject(args) {
  const sub = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || sub === "help") {
    return runStubContract(args, {
      noun: "project",
      status: "available",
      docRef: "docs/cli/agent-workspace.md",
      commands: [
        { verb: "create", flags: ["org", "space", "name"], required: ["org", "space", "name"], summary: "Create a project inside an organization space." },
        { verb: "registry show", flags: ["project"], summary: "Show local project registry metadata and acceptance commands." }
      ]
    });
  }
  if (sub === "registry") return registry(args);
  if (sub !== "create") {
    emitError(`ema project: unknown subcommand "${sub ?? ""}" (expected: create | registry)`);
    return 64;
  }
  const json = flagBool(args, "json");
  const orgId = flagString(args, "org");
  const spaceId = flagString(args, "space");
  const name = flagString(args, "name") ?? args.positional.slice(1).join(" ");
  if (!orgId || !spaceId || !name.trim()) {
    emitError(`ema project create: missing --org, --space, or --name`);
    emitError(`Usage: ema project create --org org:<id> --space space:<id> --name "EMA 0.0.6"`);
    return 64;
  }
  try {
    const c = await connect({ surface: "desktop" });
    const result = await c.command("project.create", {
      org_id: orgId,
      space_id: spaceId,
      name
    });
    c.close();
    if (result.ok !== true) {
      if (json) emitJson({ ok: false, error: result.error });
      else emitError(`ema project create: ${result.error.class}: ${result.error.message}`);
      return 1;
    }
    const events2 = result.events ?? [];
    if (json) {
      emitJson({ ok: true, org_id: orgId, space_id: spaceId, name, events: events2 });
    } else {
      emitPretty(`created project: ${name}`);
      emitPretty(`events: ${events2.join(", ") || "(none returned)"}`);
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}
function registry(args) {
  const verb = args.positional[1] ?? "show";
  if (verb !== "show") {
    emitError(`ema project registry: unknown subcommand "${verb}" (expected: show)`);
    return 64;
  }
  const project = flagString(args, "project") ?? args.positional[2] ?? "proslync-app-ios-final";
  const payload = projectRegistry(project);
  if (flagBool(args, "json")) emitJson(payload);
  else {
    emitPretty(`${payload.project}: ${payload.client ?? "project"}`);
    for (const build of payload.active_builds) emitPretty(`  ${build.id}: ${build.exists ? "present" : "missing"} ${build.path}`);
  }
  return 0;
}

// src/commands/vcalendar.ts
var DEFAULT_ORG2 = "org:01J00000000000000000000001";
var DEFAULT_ACTOR2 = "actor:dev-console";
async function runVcalendar(args) {
  const sub = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || sub === "help") return runVcalendarHelp(args);
  switch (sub) {
    case "show":
      return runShow(args);
    case "week":
      return runWeek(args);
    case "tick":
      return runTick(args);
    case "block":
      return runBlock(args);
    case "phase":
      return runPhase(args);
    case "tick-checkups":
      return runTickCheckups(args);
    default:
      emitError(
        `ema vcalendar: unknown subcommand "${sub ?? ""}" (expected: show | week | tick | block | phase)`
      );
      emitError(`See docs/cli/see-agent-work.md \xA7vCalendar for grammar.`);
      return 64;
  }
}
function runVcalendarHelp(args) {
  return runStubContract(args, {
    noun: "vcalendar",
    status: "available",
    docRef: "docs/cli/see-agent-work.md",
    commands: [
      { verb: "show", flags: ["actor", "json"], summary: "Show an actor's calendar from daemon projections/events." },
      { verb: "week", flags: ["project", "json"], summary: "Show this week's vCalendar events." },
      { verb: "tick", flags: ["actor", "project", "json"], summary: "Compute the current planning/execution/review/handoff phase." },
      { verb: "block add", flags: ["actor", "kind", "label", "start", "end"], required: ["kind", "label"], summary: "Append a calendar block." },
      { verb: "block move", flags: ["block", "start", "end"], required: ["block", "start"], summary: "Move a calendar block." },
      { verb: "phase set", flags: ["actor", "label"], required: ["label"], summary: "Set the canonical phase label." },
      { verb: "tick-checkups", flags: ["actor", "json"], summary: "Run the on-demand checkup tick path." }
    ]
  });
}
async function runBlock(args) {
  const verb = args.positional[1];
  const json = flagBool(args, "json");
  const org = flagString(args, "org") ?? DEFAULT_ORG2;
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR2;
  if (verb === "add") {
    const kind = flagString(args, "kind");
    const label = flagString(args, "label");
    const startAt = flagString(args, "start-at") ?? flagString(args, "start");
    const endAt = flagString(args, "end-at") ?? flagString(args, "end");
    if (!kind || !label) {
      emitError(`ema vcalendar block add: --kind and --label are required`);
      emitError(
        `Usage: ema vcalendar block add --actor actor:<id> --kind focus --label "..."`
      );
      return 64;
    }
    return await send("vcalendar.block.add", {
      org_id: org,
      actor_id: actor,
      block_kind: kind,
      label,
      start_at: startAt ?? null,
      end_at: endAt ?? null
    }, {
      json,
      human: `added ${kind} block "${label}" for ${actor}`,
      resourceLabel: "block"
    });
  }
  if (verb === "move") {
    const blockId = flagString(args, "block");
    const startAt = flagString(args, "start-at") ?? flagString(args, "start");
    const endAt = flagString(args, "end-at") ?? flagString(args, "end");
    if (!blockId || !startAt) {
      emitError(`ema vcalendar block move: --block and --start (or --start-at) are required`);
      emitError(
        `Usage: ema vcalendar block move --block calendar_block:<id> --start "2026-04-24T15:00:00-04:00"`
      );
      return 64;
    }
    return await send("vcalendar.block.move", {
      org_id: org,
      actor_id: actor,
      block_id: blockId,
      start_at: startAt,
      end_at: endAt ?? null
    }, { json, human: `moved ${blockId} \u2192 ${startAt}` });
  }
  emitError(
    `ema vcalendar block: unknown verb "${verb ?? ""}" (expected: add | move)`
  );
  return 64;
}
async function runPhase(args) {
  const verb = args.positional[1];
  const json = flagBool(args, "json");
  const org = flagString(args, "org") ?? DEFAULT_ORG2;
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR2;
  if (verb === "set") {
    const label = flagString(args, "label");
    if (!label) {
      emitError(`ema vcalendar phase set: --label is required`);
      emitError(
        `Usage: ema vcalendar phase set --actor actor:<id> --label "Implementation Week"`
      );
      return 64;
    }
    return await send("vcalendar.phase.set", {
      org_id: org,
      actor_id: actor,
      label
    }, { json, human: `set phase "${label}" for ${actor}` });
  }
  emitError(
    `ema vcalendar phase: unknown verb "${verb ?? ""}" (expected: set)`
  );
  return 64;
}
async function runShow(args) {
  const json = flagBool(args, "json");
  const actor = flagString(args, "actor");
  return await runReadQuery(args, json, {
    header: actor ? `vcalendar for ${actor}` : `vcalendar (all actors)`,
    actor
  });
}
async function runWeek(args) {
  const json = flagBool(args, "json");
  const project = flagString(args, "project");
  return await runReadQuery(args, json, {
    header: project ? `vcalendar week for project ${project}` : `vcalendar week`
  });
}
var PHASE_MODE = {
  "intake and orientation": "planning",
  "planning and lane claim": "planning",
  "execution block": "execution",
  "review and checkup": "review",
  "handoff and next-day queue": "handoff"
};
function modeFromHour(hour, fallback) {
  if (hour < 9) return "planning";
  if (hour < 11) return "planning";
  if (hour < 16) return "execution";
  if (hour < 18) return "review";
  if (hour < 24) return "handoff";
  return fallback;
}
function instructionsForPhase(phase, fallback) {
  switch (phase) {
    case "intake and orientation":
      return [
        "Read orientation docs.",
        "Run `ema status --json`; when the task names a project, run `ema agent orient --project <project> --json`.",
        "Pick or open the lane before editing."
      ];
    case "planning and lane claim":
      return [
        "Clarify campaign, mission, lane, dependencies, and done-when.",
        "Log discovered later work to queue instead of expanding scope.",
        "Schedule checkups for risky or long-running lanes."
      ];
    case "execution block":
      return [
        "Work inside the claimed lane scope.",
        "Keep dependency discoveries in queue/problem graph.",
        "Run verification before crossing into review."
      ];
    case "review and checkup":
      return [
        "Run verification and summarize changed files.",
        "Close or update queue items.",
        "Record blockers as problem/solution graph nodes."
      ];
    case "handoff and next-day queue":
      return [
        "Request or complete handoff before leaving partial work.",
        "Move unfinished discoveries to queue with dependencies.",
        "Set next vCalendar block and checkup cadence."
      ];
    default:
      return fallback;
  }
}
function phaseToMode(phase, setAt, heuristicMode) {
  const mapped = PHASE_MODE[phase];
  if (mapped) return mapped;
  if (setAt) {
    const date = new Date(setAt);
    if (!Number.isNaN(date.getTime())) {
      return modeFromHour(date.getHours(), heuristicMode);
    }
  }
  return heuristicMode;
}
async function readVcalendarState() {
  try {
    const c = await connect({ surface: "desktop" });
    const data = await new Promise((resolve2) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve2(null);
        }
      }, 1500);
      c.onMessage((msg) => {
        if (msg.type === "projection" && msg.name === "vcalendar.state") {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve2(msg.data);
          }
        }
      });
      c.subscribe("vcalendar.state");
    });
    c.close();
    return data;
  } catch {
    return null;
  }
}
async function runTick(args) {
  const json = flagBool(args, "json");
  const heuristic = vcalendarTick();
  const state = await readVcalendarState();
  const canonicalPhase = state && typeof state.current_phase === "string" && state.current_phase.length > 0 ? state.current_phase : null;
  let phase = heuristic.phase;
  let mode = heuristic.mode;
  let source = "cli_computed_vcalendar_tick";
  let canonicalSetAt = null;
  let canonicalSetBy = null;
  let blocks = [];
  let checkupsDue = [];
  if (canonicalPhase) {
    phase = canonicalPhase;
    canonicalSetAt = typeof state?.current_phase_set_at === "string" ? state.current_phase_set_at : null;
    canonicalSetBy = typeof state?.current_phase_set_by === "string" ? state.current_phase_set_by : null;
    mode = phaseToMode(canonicalPhase, canonicalSetAt, heuristic.mode);
    source = "daemon_canonical_phase";
    blocks = Array.isArray(state?.blocks) ? state.blocks : [];
    checkupsDue = Array.isArray(state?.checkups) ? state.checkups.filter(
      (c) => c.status === "scheduled"
    ) : [];
  }
  const tick = {
    now: heuristic.now,
    iso_week: heuristic.iso_week,
    phase,
    mode,
    should_plan: mode === "planning",
    should_checkup: mode === "review" || mode === "handoff",
    should_handoff: mode === "handoff",
    next_tick: heuristic.next_tick,
    instructions: instructionsForPhase(phase, heuristic.instructions)
  };
  if (json) {
    emitJson({
      ok: true,
      source,
      tick,
      canonical_phase_set_at: canonicalSetAt,
      canonical_phase_set_by: canonicalSetBy,
      blocks,
      checkups_due: checkupsDue
    });
    return 0;
  }
  emitPretty(`# vcalendar tick`);
  emitPretty(`source: ${source}`);
  emitPretty(`phase: ${tick.phase}`);
  emitPretty(`mode: ${tick.mode}`);
  emitPretty(`now: ${tick.now}`);
  emitPretty(`next: ${tick.next_tick}`);
  if (canonicalSetAt) emitPretty(`set_at: ${canonicalSetAt}  by: ${canonicalSetBy ?? "?"}`);
  for (const instruction of tick.instructions) {
    emitPretty(`  - ${instruction}`);
  }
  if (blocks.length > 0) {
    emitPretty(`blocks:`);
    for (const block of blocks) {
      const b = block;
      emitPretty(
        `  ${b.start_at ?? "?"} \u2192 ${b.end_at ?? "?"}  ${b.kind ?? "?"}  ${b.label ?? ""}`
      );
    }
  }
  if (checkupsDue.length > 0) {
    emitPretty(`checkups due:`);
    for (const checkup of checkupsDue) {
      const c = checkup;
      emitPretty(`  ${c.id ?? "?"}  lane=${c.lane_id ?? "?"}  cadence=${c.cadence ?? "?"}`);
    }
  }
  return 0;
}
async function runTickCheckups(args) {
  const json = flagBool(args, "json");
  try {
    const c = await connect({ surface: "desktop" });
    const result = await c.command("vcalendar.checkup.tick", {});
    c.close();
    if (result.ok !== true) {
      if (json) emitJson({ ok: false, error: result.error });
      else emitError(`ema vcalendar tick-checkups: ${result.error.class}: ${result.error.message}`);
      return 1;
    }
    const data = result.data ?? {};
    const emitted = data.emitted ?? 0;
    const laneIds = data.lane_ids ?? [];
    const skippedUnscoped = data.skipped_unscoped ?? 0;
    const reason = emitted === 0 ? skippedUnscoped > 0 ? "skipped_unscoped" : "no_due_lanes" : null;
    if (json) {
      emitJson({
        ok: true,
        emitted,
        lane_ids: laneIds,
        skipped_unscoped: skippedUnscoped,
        reason
      });
    } else {
      emitPretty(`# vcalendar tick-checkups`);
      emitPretty(`emitted: ${emitted}`);
      if (skippedUnscoped > 0)
        emitPretty(`skipped_unscoped: ${skippedUnscoped}  (legacy lanes with no envelope org_id; M9 backfill required)`);
      if (reason) emitPretty(`reason: ${reason}`);
      for (const id of laneIds) emitPretty(`  + ${id}`);
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}
async function runReadQuery(_args, json, opts) {
  try {
    const c = await connect({ surface: "desktop" });
    const eventTrailRows = await new Promise((resolve2) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve2([]);
        }
      }, 1200);
      c.onMessage((msg) => {
        if (msg.type === "projection" && msg.name === "event_trail") {
          const data = msg.data;
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve2(data.events ?? []);
          }
        }
      });
      c.subscribe("event_trail");
    });
    c.close();
    const relevant = eventTrailRows.filter(
      (row) => row.kind.startsWith("vcalendar.") || row.kind.startsWith("calendar_block.") || row.kind.startsWith("checkup.")
    );
    if (json) {
      emitJson({
        ok: true,
        header: opts.header,
        events: relevant,
        note: "event_trail projection returns up to 8 recent events; a dedicated vcalendar projection is pending."
      });
    } else {
      emitPretty(`# ${opts.header}`);
      if (relevant.length === 0) {
        emitPretty(`  (no vcalendar events in the last 8-event window)`);
        emitPretty(
          `  Tip: run \`ema events tail --family calendar_block\` or \`ema events tail --family checkup\` for a live stream.`
        );
      } else {
        for (const row of relevant) {
          emitPretty(`  ${row.ts}  ${row.kind.padEnd(24)}  ${row.label}`);
        }
        emitPretty(
          `  (last-8 window from event_trail projection; richer vcalendar projection is pending)`
        );
      }
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}
async function send(op, argsObj, out) {
  try {
    const c = await connect({ surface: "desktop" });
    const result = await c.command(op, argsObj);
    c.close();
    if (result.ok !== true) {
      if (out.json) emitJson({ ok: false, error: result.error });
      else emitError(`ema ${op}: ${result.error.class}: ${result.error.message}`);
      return 1;
    }
    const events2 = result.events ?? [];
    const resource = typeof result.resource === "string" ? result.resource : null;
    if (out.json) {
      emitJson({ ok: true, op, args: argsObj, events: events2, resource });
    } else {
      emitPretty(out.human);
      if (resource) emitPretty(`${out.resourceLabel ?? "created"}: ${resource}`);
      emitPretty(`events: ${events2.join(", ") || "(none returned)"}`);
    }
    return 0;
  } catch (err) {
    return reportError(err, out.json);
  }
}

// src/commands/checkup.ts
var DEFAULT_ORG3 = "org:01J00000000000000000000001";
var DEFAULT_ACTOR3 = "actor:dev-console";
async function runCheckup(args) {
  const sub = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || sub === "help") {
    return runStubContract(args, {
      noun: "checkup",
      status: "available",
      docRef: "docs/cli/see-agent-work.md",
      commands: [
        { verb: "schedule", flags: ["lane", "cadence", "actor"], required: ["lane", "cadence"], summary: "Schedule a cadence-based lane checkup." },
        { verb: "complete", flags: ["checkup", "result", "actor"], required: ["checkup", "result"], summary: "Mark a scheduled checkup complete." },
        { verb: "runtime", flags: ["json"], summary: "Run the daemon-backed checkup tick and report emitted checkups." }
      ]
    });
  }
  switch (sub) {
    case "schedule":
      return runSchedule(args);
    case "complete":
      return runComplete(args);
    case "runtime":
      return runRuntime(args);
    default:
      emitError(
        `ema checkup: unknown subcommand "${sub ?? ""}" (expected: schedule | complete | runtime)`
      );
      emitError(`See docs/cli/see-agent-work.md \xA7vCalendar for grammar.`);
      return 64;
  }
}
async function runSchedule(args) {
  const json = flagBool(args, "json");
  const org = flagString(args, "org") ?? DEFAULT_ORG3;
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR3;
  const lane = flagString(args, "lane");
  const cadence = flagString(args, "cadence");
  if (!lane || !cadence) {
    emitError(`ema checkup schedule: --lane and --cadence are required`);
    emitError(
      `Usage: ema checkup schedule --lane lane:<id> --cadence daily`
    );
    return 64;
  }
  return await send2("checkup.schedule", {
    org_id: org,
    actor_id: actor,
    lane_id: lane,
    cadence
  }, {
    json,
    human: `scheduled ${cadence} checkup on ${lane}`,
    resourceLabel: "checkup"
  });
}
async function runComplete(args) {
  const json = flagBool(args, "json");
  const org = flagString(args, "org") ?? DEFAULT_ORG3;
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR3;
  const checkupId = flagString(args, "checkup");
  const result = flagString(args, "result");
  if (!checkupId || !result) {
    emitError(`ema checkup complete: --checkup and --result are required`);
    emitError(
      `Usage: ema checkup complete --checkup checkup:<id> --result "Ready for review"`
    );
    return 64;
  }
  return await send2("checkup.complete", {
    org_id: org,
    actor_id: actor,
    checkup_id: checkupId,
    result
  }, { json, human: `completed ${checkupId}: ${result}` });
}
async function runRuntime(args) {
  const json = flagBool(args, "json");
  try {
    const c = await connect({ surface: "desktop" });
    const result = await c.command("vcalendar.checkup.tick", {});
    c.close();
    if (result.ok !== true) {
      if (json) {
        emitJson({
          ok: false,
          command: "checkup runtime",
          op: "vcalendar.checkup.tick",
          source: "daemon_command",
          daemon_authority: "canonical_events",
          error: result.error
        });
      } else {
        emitError(`ema checkup runtime: ${result.error.class}: ${result.error.message}`);
      }
      return 1;
    }
    const data = result.data ?? {};
    const emitted = data.emitted ?? 0;
    const laneIds = data.lane_ids ?? [];
    const skippedUnscoped = data.skipped_unscoped ?? 0;
    const reason = emitted === 0 ? skippedUnscoped > 0 ? "skipped_unscoped" : "no_due_lanes" : null;
    if (json) {
      emitJson({
        ok: true,
        command: "checkup runtime",
        op: "vcalendar.checkup.tick",
        source: "daemon_command",
        daemon_authority: "canonical_events",
        emitted,
        lane_ids: laneIds,
        skipped_unscoped: skippedUnscoped,
        reason
      });
    } else {
      emitPretty("checkup runtime");
      emitPretty("source: daemon_command; daemon authority: canonical_events");
      emitPretty(`emitted: ${emitted}`);
      if (skippedUnscoped > 0) emitPretty(`skipped_unscoped: ${skippedUnscoped}`);
      if (reason) emitPretty(`reason: ${reason}`);
      for (const laneId of laneIds) emitPretty(`  + ${laneId}`);
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}
async function send2(op, argsObj, out) {
  try {
    const c = await connect({ surface: "desktop" });
    const res = await c.command(op, argsObj);
    c.close();
    if (res.ok !== true) {
      if (out.json) emitJson({ ok: false, error: res.error });
      else emitError(`ema ${op}: ${res.error.class}: ${res.error.message}`);
      return 1;
    }
    const events2 = res.events ?? [];
    const resource = typeof res.resource === "string" ? res.resource : null;
    if (out.json) {
      emitJson({
        ok: true,
        command: op,
        op,
        source: "daemon_command",
        daemon_authority: "canonical_events",
        args: argsObj,
        events: events2,
        resource
      });
    } else {
      emitPretty(out.human);
      if (resource) emitPretty(`${out.resourceLabel ?? "created"}: ${resource}`);
      emitPretty(`events: ${events2.join(", ") || "(none returned)"}`);
    }
    return 0;
  } catch (err) {
    return reportError(err, out.json);
  }
}

// src/commands/campaign.ts
async function runCampaign(args) {
  const verb = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return runCampaignHelp(args);
  if (verb === "create") return createCampaign(args);
  if (verb === "archive") return archiveCampaign(args);
  if (verb === "show") return showCampaign(args);
  return listCampaigns(args);
}
function runCampaignHelp(args) {
  return runStubContract(args, {
    noun: "campaign",
    status: "available",
    docRef: "docs/cli/agent-workspace.md",
    commands: [
      { verb: "create", flags: ["title", "project", "depends-on", "done-when"], required: ["title"], summary: "Create a long-running initiative in the resolved workspace scope." },
      { verb: "list", flags: ["project", "all-projects", "json"], summary: "List campaigns in the resolved workspace scope." },
      { verb: "show", flags: ["campaign"], required: ["campaign"], summary: "Show one campaign from campaign.registry." },
      { verb: "archive", flags: ["campaign", "reason"], required: ["campaign"], summary: "Archive a campaign with an optional reason." }
    ]
  });
}
async function createCampaign(args) {
  const title = flagString(args, "title");
  if (!title) {
    emitError("ema campaign create: --title is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "campaign.create", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    title,
    project_id: flagString(args, "project") ?? null,
    depends_on: flagString(args, "depends-on") ?? null,
    done_when: flagString(args, "done-when") ?? null
  }, { human: `created campaign "${title}"`, resourceLabel: "campaign" });
}
async function archiveCampaign(args) {
  const campaign = flagString(args, "campaign");
  if (!campaign) {
    emitError("ema campaign archive: --campaign is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "campaign.archive", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    campaign_id: campaign,
    reason: flagString(args, "reason") ?? null
  }, { human: `archived campaign ${campaign}` });
}
async function listCampaigns(args) {
  const json = flagBool(args, "json");
  const campaigns = await loadCampaigns(args);
  if (!campaigns) return 1;
  if (json) emitJson({ ok: true, source: "campaign.registry", campaigns });
  else {
    emitPretty("# campaigns");
    if (campaigns.length === 0) emitPretty("  (none)");
    for (const campaign of campaigns) emitPretty(`  ${campaign.id} [${campaign.status ?? "unknown"}] ${campaign.title ?? ""}`);
  }
  return 0;
}
async function showCampaign(args) {
  const json = flagBool(args, "json");
  const id = flagString(args, "campaign");
  if (!id) {
    emitError("ema campaign show: --campaign is required");
    return 64;
  }
  const campaigns = await loadCampaigns(args);
  if (!campaigns) return 1;
  const campaign = campaigns.find((item) => item.id === id || item.campaign_id === id) ?? null;
  if (json) emitJson({ ok: true, source: "campaign.registry", campaign });
  else if (campaign) emitPretty(JSON.stringify(campaign, null, 2));
  else emitPretty(`campaign not found: ${id}`);
  return campaign ? 0 : 1;
}
async function loadCampaigns(args) {
  const context = await workspaceScopeContext(args);
  const items = await readProjection(args, {
    name: "campaign.registry",
    pick: (data) => data.campaigns ?? []
  });
  if (!items) return null;
  return filterProjectScopedRecords(items, context);
}

// src/commands/mission.ts
async function runMission(args) {
  const verb = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return runMissionHelp(args);
  if (verb === "create") return createMission(args);
  if (verb === "start") return changeMission(args, "mission.start", "started");
  if (verb === "pause") return changeMission(args, "mission.pause", "paused");
  if (verb === "complete") return changeMission(args, "mission.complete", "completed");
  if (verb === "show") return showMission(args);
  return listMissions(args);
}
function runMissionHelp(args) {
  return runStubContract(args, {
    noun: "mission",
    status: "available",
    docRef: "docs/cli/agent-workspace.md",
    commands: [
      { verb: "create", flags: ["campaign", "title", "project", "depends-on", "done-when"], required: ["title"], summary: "Create a goal-oriented bundle, optionally under a campaign." },
      { verb: "list", flags: ["project", "campaign", "all-projects", "json"], summary: "List missions in the resolved workspace scope." },
      { verb: "show", flags: ["mission"], required: ["mission"], summary: "Show one mission from mission.registry." },
      { verb: "start", flags: ["mission", "reason"], required: ["mission"], summary: "Move a mission to started." },
      { verb: "pause", flags: ["mission", "reason"], required: ["mission"], summary: "Pause a mission." },
      { verb: "complete", flags: ["mission", "result", "verify"], required: ["mission"], summary: "Complete a mission with result and verification notes." }
    ]
  });
}
async function createMission(args) {
  const title = flagString(args, "title");
  if (!title) {
    emitError("ema mission create: --title is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "mission.create", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    campaign_id: flagString(args, "campaign") ?? null,
    title,
    project_id: flagString(args, "project") ?? null,
    depends_on: flagString(args, "depends-on") ?? null,
    done_when: flagString(args, "done-when") ?? null
  }, { human: `created mission "${title}"`, resourceLabel: "mission" });
}
async function changeMission(args, op, label) {
  const mission = flagString(args, "mission");
  if (!mission) {
    emitError(`ema mission ${args.positional[0] ?? "change"}: --mission is required`);
    return 64;
  }
  return sendWorkspaceCommand(args, op, {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    mission_id: mission,
    reason: flagString(args, "reason") ?? null,
    result: flagString(args, "result") ?? null,
    verify: flagString(args, "verify") ?? null
  }, { human: `${label} mission ${mission}` });
}
async function listMissions(args) {
  const json = flagBool(args, "json");
  const missions = await loadMissions(args);
  if (!missions) return 1;
  if (json) emitJson({ ok: true, source: "mission.registry", missions });
  else {
    emitPretty("# missions");
    if (missions.length === 0) emitPretty("  (none)");
    for (const mission of missions) emitPretty(`  ${mission.id} [${mission.status ?? "unknown"}] ${mission.title ?? ""}`);
  }
  return 0;
}
async function showMission(args) {
  const json = flagBool(args, "json");
  const id = flagString(args, "mission");
  if (!id) {
    emitError("ema mission show: --mission is required");
    return 64;
  }
  const missions = await loadMissions(args);
  if (!missions) return 1;
  const mission = missions.find((item) => item.id === id || item.mission_id === id) ?? null;
  if (json) emitJson({ ok: true, source: "mission.registry", mission });
  else if (mission) emitPretty(JSON.stringify(mission, null, 2));
  else emitPretty(`mission not found: ${id}`);
  return mission ? 0 : 1;
}
async function loadMissions(args) {
  const context = await workspaceScopeContext(args);
  const items = await readProjection(args, {
    name: "mission.registry",
    pick: (data) => data.missions ?? []
  });
  if (!items) return null;
  return filterProjectScopedRecords(items, context);
}

// src/commands/lane.ts
var DOC_REF2 = "docs/cli/agent-workspace.md";
async function runLane(args) {
  const verb = args.positional[0];
  if (verb === "open") return runOpen(args);
  if (verb === "list") return runRecentList(args);
  if (verb === "show") return runShow2(args);
  if (verb === "claim") return runClaim(args);
  if (verb === "move") return runMove(args);
  if (verb === "block") return runBlock2(args);
  if (verb === "release") return runRelease(args);
  if (verb === "close") return runClose(args);
  return runStubContract(args, {
    noun: "lane",
    status: "available",
    docRef: DOC_REF2,
    commands: [
      {
        verb: "open",
        flags: ["mission", "title", "scope", "done-when", "depends-on"],
        required: ["title"],
        summary: "Open an ownership track inside a mission or workstream."
      },
      {
        verb: "list",
        flags: ["mission", "project", "status", "all-projects"],
        summary: "List lanes in scope."
      },
      {
        verb: "show",
        flags: ["project", "all-projects", "lane", "id"],
        required: ["lane or id"],
        summary: "Show lane owner, scope, protected paths, queue items, blockers, and handoffs."
      },
      {
        verb: "claim",
        flags: ["lane", "actor", "scope", "goal", "next", "refresh-by", "blocker"],
        required: ["lane", "actor", "scope", "goal", "next"],
        summary: "Claim or refresh lane ownership with exact scope and next step."
      },
      {
        verb: "release",
        flags: ["lane", "actor", "handoff", "reason"],
        required: ["lane", "actor"],
        summary: "Release lane ownership after handoff or completion."
      },
      {
        verb: "block",
        flags: ["lane", "reason", "depends-on", "escalate-to"],
        required: ["lane", "reason"],
        summary: "Mark a lane blocked and name the dependency or escalation path."
      },
      {
        verb: "move",
        flags: ["lane", "status"],
        required: ["lane", "status"],
        summary: "Move a lane through idea/ready/active/review/blocked/done."
      },
      {
        verb: "close",
        flags: ["lane", "reason", "verify"],
        required: ["lane"],
        summary: "Close a lane after result, verification, and handoff are recorded."
      }
    ]
  });
}
async function runOpen(args) {
  const title = flagString(args, "title");
  if (!title) {
    emitError("ema lane open: --title is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "lane.open", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    name: title,
    project_id: flagString(args, "project") ?? null,
    mission_id: flagString(args, "mission") ?? null,
    scope: flagString(args, "scope") ?? null,
    done_when: flagString(args, "done-when") ?? null,
    depends_on: flagString(args, "depends-on") ?? null,
    section_id: flagString(args, "blueprint-section") ?? null,
    gac_id: flagString(args, "blueprint-gac") ?? null,
    decision_id: flagString(args, "blueprint-decision") ?? null,
    cadence: flagString(args, "cadence") ?? null
  }, {
    human: `opened lane "${title}"`,
    resourceLabel: "lane"
  });
}
async function runClaim(args) {
  const lane = flagString(args, "lane");
  const scope = flagString(args, "scope");
  const goal = flagString(args, "goal");
  const next = flagString(args, "next");
  if (!lane || !scope || !goal || !next) {
    emitError("ema lane claim: --lane, --scope, --goal, and --next are required");
    return 64;
  }
  return sendWorkspaceCommand(args, "lane.claim", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    project_id: flagString(args, "project") ?? null,
    lane_id: lane,
    scope,
    goal,
    next,
    refresh_by: flagString(args, "refresh-by") ?? null,
    blocker: flagString(args, "blocker") ?? null
  }, { human: `claimed lane ${lane}` });
}
async function runMove(args) {
  const lane = flagString(args, "lane");
  const status2 = flagString(args, "status");
  if (!lane || !status2) {
    emitError("ema lane move: --lane and --status are required");
    return 64;
  }
  return sendWorkspaceCommand(args, "lane.move", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    project_id: flagString(args, "project") ?? null,
    lane_id: lane,
    status: status2
  }, { human: `moved lane ${lane} to ${status2}` });
}
async function runBlock2(args) {
  const lane = flagString(args, "lane");
  const reason = flagString(args, "reason");
  if (!lane || !reason) {
    emitError("ema lane block: --lane and --reason are required");
    return 64;
  }
  return sendWorkspaceCommand(args, "lane.block", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    project_id: flagString(args, "project") ?? null,
    lane_id: lane,
    reason,
    depends_on: flagString(args, "depends-on") ?? null,
    blocked_by: flagString(args, "escalate-to") ?? null
  }, { human: `blocked lane ${lane}` });
}
async function runRelease(args) {
  const lane = flagString(args, "lane");
  if (!lane) {
    emitError("ema lane release: --lane is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "lane.release", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    project_id: flagString(args, "project") ?? null,
    lane_id: lane,
    handoff_id: flagString(args, "handoff") ?? null,
    reason: flagString(args, "reason") ?? null
  }, { human: `released lane ${lane}` });
}
async function runClose(args) {
  const lane = flagString(args, "lane");
  if (!lane) {
    emitError("ema lane close: --lane is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "lane.close", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    project_id: flagString(args, "project") ?? null,
    lane_id: lane,
    reason: flagString(args, "reason") ?? null,
    verify: flagString(args, "verify") ?? null
  }, { human: `closed lane ${lane}` });
}
async function runShow2(args) {
  const json = flagBool(args, "json");
  const laneId = flagString(args, "lane") ?? flagString(args, "id");
  if (!laneId) {
    emitError("ema lane show: --lane or --id is required");
    return 64;
  }
  const lanes = await loadLanes(args);
  if (!lanes) return 1;
  const lane = lanes.items.find((item) => item.id === laneId || item.lane_id === laneId) ?? null;
  if (json) {
    emitJson({
      ok: lane !== null,
      source: "lane.registry",
      daemon_authority: "canonical_events",
      workspace_scope: lanes.context.scope,
      all_projects: lanes.context.allProjects,
      filter: lanes.context.allProjects ? "all_projects" : "project",
      lane,
      error: lane ? null : {
        class: "not_found",
        message: `lane not found in resolved workspace scope: ${laneId}`
      }
    });
  } else if (!lane) emitPretty(`lane not found: ${laneId}`);
  else emitPretty(JSON.stringify(lane, null, 2));
  return lane ? 0 : 1;
}
async function runRecentList(args) {
  const json = flagBool(args, "json");
  const lanes = await loadLanes(args);
  if (!lanes) return 1;
  const activeFilters = listFilters(args);
  const items = filterLanes(lanes.items, activeFilters);
  if (json) {
    emitJson({
      ok: true,
      source: "lane.registry",
      daemon_authority: "canonical_events",
      workspace_scope: lanes.context.scope,
      all_projects: lanes.context.allProjects,
      filter: lanes.context.allProjects ? "all_projects" : "project",
      filters: activeFilters,
      lanes: items
    });
  } else {
    emitPretty("# lanes");
    if (activeFilters.length > 0) {
      emitPretty(`filters: ${activeFilters.map((f) => `${f.key}=${f.value}`).join(" ")}`);
    }
    if (items.length === 0) emitPretty("  (none)");
    for (const lane of items) {
      const owner = lane.actor_id ? ` owner=${lane.actor_id}` : "";
      const mission = lane.mission_id ? ` mission=${lane.mission_id}` : "";
      const updated = lane.updated_at ? ` updated=${lane.updated_at}` : "";
      emitPretty(`  ${lane.id} [${lane.status}] ${lane.title}${owner}${mission}${updated}`);
    }
  }
  return 0;
}
function listFilters(args) {
  return [
    ["status", flagString(args, "status")],
    ["mission", flagString(args, "mission")]
  ].flatMap(
    ([key, value]) => value ? [{ key, value }] : []
  );
}
function filterLanes(items, filters) {
  if (filters.length === 0) return items;
  return items.filter(
    (item) => filters.every((filter) => {
      if (filter.key === "status") return item.status === filter.value;
      return item.mission_id === filter.value;
    })
  );
}
async function loadLanes(args) {
  const context = await workspaceScopeContext(args);
  const items = await readProjection(args, {
    name: "lane.registry",
    pick: (data) => data.lanes ?? []
  });
  if (!items) return null;
  return {
    context,
    items: filterProjectScopedRecords(items, context)
  };
}

// src/commands/queue.ts
var DOC_REF3 = "docs/cli/agent-workspace.md";
async function runQueue(args) {
  const verb = args.positional[0];
  if (verb === "add") return runAdd(args);
  if (verb === "list") return runRecentList2(args);
  if (verb === "show") return runShow3(args);
  if (verb === "ready") return runReady(args);
  if (verb === "block") return runBlock3(args);
  if (verb === "close") return runClose2(args);
  return runStubContract(args, {
    noun: "queue",
    status: "available",
    docRef: DOC_REF3,
    commands: [
      {
        verb: "add",
        flags: ["title", "project", "mission", "lane", "depends-on", "blocked-by", "why", "done-when", "source"],
        required: ["title", "why"],
        summary: "Log follow-up work discovered during execution, with dependency and done-when fields."
      },
      {
        verb: "list",
        flags: ["project", "mission", "lane", "status", "all-projects"],
        summary: "List queued follow-ups and dependency blockers."
      },
      {
        verb: "show",
        flags: ["project", "all-projects", "queue-item", "id"],
        required: ["queue-item or id"],
        summary: "Show a queue item, its dependencies, evidence, and ready condition."
      },
      {
        verb: "ready",
        flags: ["queue-item", "reason"],
        required: ["queue-item"],
        summary: "Mark a queue item ready after dependencies clear."
      },
      {
        verb: "block",
        flags: ["queue-item", "blocked-by", "reason"],
        required: ["queue-item", "blocked-by"],
        summary: "Record why a queue item cannot run yet."
      },
      {
        verb: "close",
        flags: ["queue-item", "result", "verify"],
        required: ["queue-item"],
        summary: "Close a queue item with result and verification notes."
      }
    ]
  });
}
async function runAdd(args) {
  const title = flagString(args, "title");
  const why = flagString(args, "why");
  if (!title || !why) {
    emitError("ema queue add: --title and --why are required");
    return 64;
  }
  return sendWorkspaceCommand(args, "queue.add", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    name: title,
    reason: why,
    project_id: flagString(args, "project") ?? null,
    mission_id: flagString(args, "mission") ?? null,
    lane_id: flagString(args, "lane") ?? null,
    depends_on: flagString(args, "depends-on") ?? null,
    blocked_by: flagString(args, "blocked-by") ?? null,
    done_when: flagString(args, "done-when") ?? null,
    source: flagString(args, "source") ?? null,
    section_id: flagString(args, "blueprint-section") ?? null,
    gac_id: flagString(args, "blueprint-gac") ?? null,
    decision_id: flagString(args, "blueprint-decision") ?? null
  }, {
    human: `queued "${title}"`,
    resourceLabel: "queue_item"
  });
}
async function runReady(args) {
  const item = flagString(args, "queue-item");
  if (!item) {
    emitError("ema queue ready: --queue-item is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "queue.ready", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    project_id: flagString(args, "project") ?? null,
    queue_item_id: item,
    reason: flagString(args, "reason") ?? null
  }, { human: `marked queue item ready ${item}` });
}
async function runBlock3(args) {
  const item = flagString(args, "queue-item");
  const blockedBy = flagString(args, "blocked-by");
  if (!item || !blockedBy) {
    emitError("ema queue block: --queue-item and --blocked-by are required");
    return 64;
  }
  return sendWorkspaceCommand(args, "queue.block", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    project_id: flagString(args, "project") ?? null,
    queue_item_id: item,
    blocked_by: blockedBy,
    reason: flagString(args, "reason") ?? null
  }, { human: `blocked queue item ${item}` });
}
async function runClose2(args) {
  const item = flagString(args, "queue-item");
  if (!item) {
    emitError("ema queue close: --queue-item is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "queue.close", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    project_id: flagString(args, "project") ?? null,
    queue_item_id: item,
    result: flagString(args, "result") ?? null,
    verify: flagString(args, "verify") ?? null
  }, { human: `closed queue item ${item}` });
}
async function runShow3(args) {
  const json = flagBool(args, "json");
  const itemId = flagString(args, "queue-item") ?? flagString(args, "id");
  if (!itemId) {
    emitError("ema queue show: --queue-item or --id is required");
    return 64;
  }
  const queue = await loadQueue(args);
  if (!queue) return 1;
  const item = queue.items.find((record) => record.id === itemId || record.queue_item_id === itemId) ?? null;
  if (json) {
    emitJson({
      ok: item !== null,
      source: "queue.registry",
      daemon_authority: "canonical_events",
      workspace_scope: queue.context.scope,
      all_projects: queue.context.allProjects,
      filter: queue.context.allProjects ? "all_projects" : "project",
      queue_item: item,
      error: item ? null : {
        class: "not_found",
        message: `queue item not found in resolved workspace scope: ${itemId}`
      }
    });
  } else if (!item) emitPretty(`queue item not found: ${itemId}`);
  else emitPretty(JSON.stringify(item, null, 2));
  return item ? 0 : 1;
}
async function runRecentList2(args) {
  const json = flagBool(args, "json");
  const queue = await loadQueue(args);
  if (!queue) return 1;
  const activeFilters = listFilters2(args);
  const items = filterQueue(queue.items, activeFilters);
  if (json) {
    emitJson({
      ok: true,
      source: "queue.registry",
      daemon_authority: "canonical_events",
      workspace_scope: queue.context.scope,
      all_projects: queue.context.allProjects,
      filter: queue.context.allProjects ? "all_projects" : "project",
      filters: activeFilters,
      queue: items
    });
  } else {
    emitPretty("# queue");
    if (activeFilters.length > 0) {
      emitPretty(`filters: ${activeFilters.map((f) => `${f.key}=${f.value}`).join(" ")}`);
    }
    if (items.length === 0) emitPretty("  (none)");
    for (const item of items) {
      const lane = item.lane_id ? ` lane=${item.lane_id}` : "";
      const mission = item.mission_id ? ` mission=${item.mission_id}` : "";
      const blocked = item.blocked_by ? ` blocked_by=${item.blocked_by}` : "";
      emitPretty(`  ${item.id} [${item.status}] ${item.title}${lane}${mission}${blocked}`);
    }
  }
  return 0;
}
function listFilters2(args) {
  return [
    ["status", flagString(args, "status")],
    ["mission", flagString(args, "mission")],
    ["lane", flagString(args, "lane")]
  ].flatMap(
    ([key, value]) => value ? [{ key, value }] : []
  );
}
function filterQueue(items, filters) {
  if (filters.length === 0) return items;
  return items.filter(
    (item) => filters.every((filter) => {
      if (filter.key === "status") return item.status === filter.value;
      if (filter.key === "mission") return item.mission_id === filter.value;
      return item.lane_id === filter.value;
    })
  );
}
async function loadQueue(args) {
  const context = await workspaceScopeContext(args);
  const items = await readProjection(args, {
    name: "queue.registry",
    pick: (data) => data.queue_items ?? []
  });
  if (!items) return null;
  return {
    context,
    items: filterProjectScopedRecords(items, context)
  };
}

// src/commands/handoff.ts
async function runHandoff(args) {
  const verb = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return runHandoffHelp(args);
  if (verb === "request") return requestHandoff(args);
  if (verb === "accept") return changeHandoff(args, "handoff.accept", "accepted");
  if (verb === "reject") return changeHandoff(args, "handoff.reject", "rejected");
  if (verb === "complete") return changeHandoff(args, "handoff.complete", "completed");
  return listHandoffs(args);
}
function runHandoffHelp(args) {
  return runStubContract(args, {
    noun: "handoff",
    status: "available",
    docRef: "docs/cli/agent-workspace.md",
    commands: [
      { verb: "request", flags: ["from", "to", "needed", "context", "source", "verify", "depends-on"], required: ["from", "to", "needed"], summary: "Record a transfer contract between actors, lanes, or execution rails." },
      { verb: "list", flags: ["project", "all-projects", "json"], summary: "List handoffs in scope." },
      { verb: "accept", flags: ["handoff", "reason"], required: ["handoff"], summary: "Accept a requested handoff." },
      { verb: "reject", flags: ["handoff", "reason"], required: ["handoff"], summary: "Reject a requested handoff with a reason." },
      { verb: "complete", flags: ["handoff", "outcome", "verify"], required: ["handoff"], summary: "Mark a handoff complete." }
    ]
  });
}
async function requestHandoff(args) {
  const from = flagString(args, "from");
  const to = flagString(args, "to");
  const needed = flagString(args, "needed");
  if (!from || !to || !needed) {
    emitError("ema handoff request: --from, --to, and --needed are required");
    return 64;
  }
  return sendWorkspaceCommand(args, "handoff.request", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? from,
    project_id: flagString(args, "project") ?? null,
    from,
    to,
    needed,
    context: flagString(args, "context") ?? null,
    source: flagString(args, "source") ?? null,
    verify: flagString(args, "verify") ?? null,
    depends_on: flagString(args, "depends-on") ?? null
  }, { human: `requested handoff from ${from} to ${to}`, resourceLabel: "handoff" });
}
async function changeHandoff(args, op, label) {
  const handoff = flagString(args, "handoff");
  if (!handoff) {
    emitError(`ema handoff ${args.positional[0] ?? "change"}: --handoff is required`);
    return 64;
  }
  return sendWorkspaceCommand(args, op, {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    handoff_id: handoff,
    reason: flagString(args, "reason") ?? null,
    outcome: flagString(args, "outcome") ?? null,
    verify: flagString(args, "verify") ?? null
  }, { human: `${label} handoff ${handoff}` });
}
async function listHandoffs(args) {
  const json = flagBool(args, "json");
  const context = await workspaceScopeContext(args);
  const raw = await readProjection(args, {
    name: "handoff.registry",
    pick: (data) => data.handoffs ?? []
  });
  if (!raw) return 1;
  const handoffs = filterProjectScopedRecords(raw, context);
  if (json) emitJson({ ok: true, source: "handoff.registry", handoffs });
  else {
    emitPretty("# handoffs");
    if (handoffs.length === 0) emitPretty("  (none)");
    for (const handoff of handoffs) emitPretty(`  ${handoff.id} [${handoff.status ?? "unknown"}] ${handoff.from ?? "?"} -> ${handoff.to ?? "?"}: ${handoff.needed ?? ""}`);
  }
  return 0;
}

// src/commands/problem.ts
async function runProblem(args) {
  const verb = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return runProblemHelp(args);
  if (verb === "log") return logProblem(args);
  if (verb === "solution") return addSolution(args);
  if (verb === "link") return linkProblem(args);
  if (verb === "show") return showProblem(args);
  return listProblems(args);
}
function runProblemHelp(args) {
  return runStubContract(args, {
    noun: "problem",
    status: "available",
    docRef: "docs/cli/agent-workspace.md",
    commands: [
      { verb: "log", flags: ["title", "project", "lane", "depends-on", "cause", "source", "recurs"], required: ["title"], summary: "Log a recurring blocker or failure pattern." },
      { verb: "list", flags: ["project", "all-projects", "json"], summary: "List problem graph nodes in scope." },
      { verb: "show", flags: ["problem"], required: ["problem"], summary: "Show a problem with solution and link context." },
      { verb: "solution", flags: ["problem", "title", "depends-on", "verify", "source"], required: ["problem", "title"], summary: "Attach a candidate or implemented solution to a problem." },
      { verb: "link", flags: ["from", "to", "relation"], required: ["from", "to", "relation"], summary: "Link problem graph nodes to lanes, queue items, or other problems." }
    ]
  });
}
async function logProblem(args) {
  const title = flagString(args, "title");
  if (!title) {
    emitError("ema problem log: --title is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "problem.log", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    title,
    project_id: flagString(args, "project") ?? null,
    lane_id: flagString(args, "lane") ?? null,
    depends_on: flagString(args, "depends-on") ?? null,
    cause: flagString(args, "cause") ?? null,
    source: flagString(args, "source") ?? null,
    recurs: flagString(args, "recurs") ?? null
  }, { human: `logged problem "${title}"`, resourceLabel: "problem" });
}
async function addSolution(args) {
  const problem = flagString(args, "problem");
  const title = flagString(args, "title");
  if (!problem || !title) {
    emitError("ema problem solution: --problem and --title are required");
    return 64;
  }
  return sendWorkspaceCommand(args, "problem.solution", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    problem_id: problem,
    title,
    depends_on: flagString(args, "depends-on") ?? null,
    verify: flagString(args, "verify") ?? null,
    source: flagString(args, "source") ?? null
  }, { human: `added solution for ${problem}`, resourceLabel: "solution" });
}
async function linkProblem(args) {
  const from = flagString(args, "from");
  const to = flagString(args, "to");
  const relation = flagString(args, "relation");
  if (!from || !to || !relation) {
    emitError("ema problem link: --from, --to, and --relation are required");
    return 64;
  }
  const problem = from.startsWith("problem:") ? from : to.startsWith("problem:") ? to : from;
  return sendWorkspaceCommand(args, "problem.link", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    problem_id: problem,
    target_kind: from,
    target_value: to,
    relation
  }, { human: `linked ${from} ${relation} ${to}` });
}
async function listProblems(args) {
  const json = flagBool(args, "json");
  const graph = await loadGraph(args);
  if (!graph) return 1;
  if (json) emitJson({ ok: true, source: "problem.graph", ...graph });
  else {
    emitPretty("# problems");
    if (graph.problems.length === 0) emitPretty("  (none)");
    for (const problem of graph.problems) emitPretty(`  ${problem.id} [${problem.status ?? "open"}] ${problem.title ?? ""}`);
  }
  return 0;
}
async function showProblem(args) {
  const json = flagBool(args, "json");
  const id = flagString(args, "problem");
  if (!id) {
    emitError("ema problem show: --problem is required");
    return 64;
  }
  const graph = await loadGraph(args);
  if (!graph) return 1;
  const problem = graph.problems.find((item) => item.id === id || item.problem_id === id) ?? null;
  if (json) emitJson({ ok: true, source: "problem.graph", problem, solutions: graph.solutions, links: graph.links });
  else if (problem) emitPretty(JSON.stringify({ problem, solutions: graph.solutions, links: graph.links }, null, 2));
  else emitPretty(`problem not found: ${id}`);
  return problem ? 0 : 1;
}
async function loadGraph(args) {
  const context = await workspaceScopeContext(args);
  const graph = await readProjection(args, {
    name: "problem.graph",
    pick: (data) => ({
      problems: data.problems ?? [],
      solutions: data.solutions ?? [],
      links: data.links ?? []
    })
  });
  if (!graph) return null;
  return {
    problems: filterProjectScopedRecords(graph.problems, context),
    solutions: graph.solutions,
    links: graph.links
  };
}

// src/workspace-trail.ts
async function loadRecentWorkspaceTrail(args) {
  const context = args ? await workspaceScopeContext(args) : null;
  try {
    const c = await connect({ surface: "desktop" });
    let lanes = null;
    let queue = null;
    const result = await new Promise((resolve2) => {
      const timer = setTimeout(() => resolve2({
        lanes: lanes ?? [],
        queue: queue ?? []
      }), 1200);
      const finish = () => {
        if (lanes && queue) {
          clearTimeout(timer);
          resolve2({ lanes, queue });
        }
      };
      c.onMessage((msg) => {
        if (msg.type !== "projection") return;
        const name = msg.name;
        if (name === "lane.registry") {
          const data = msg.data;
          lanes = data?.lanes ?? [];
          finish();
        }
        if (name === "queue.registry") {
          const data = msg.data;
          queue = data?.queue_items ?? [];
          finish();
        }
      });
      const projectId = context && !context.allProjects && context.scope.project_id ? context.scope.project_id : null;
      c.subscribe("lane.registry", projectId ? { project_id: projectId } : void 0);
      c.subscribe("queue.registry", projectId ? { project_id: projectId } : void 0);
    });
    c.close();
    const lanesScoped = context ? filterProjectScopedRecords(result.lanes, context) : result.lanes;
    const queueScoped = context ? filterProjectScopedRecords(result.queue, context) : result.queue;
    return {
      source: "daemon_workspace_registry",
      daemon_authority: "canonical_events",
      lanes: lanesScoped,
      queue: queueScoped,
      workspace_scope: context?.scope ?? null,
      all_projects: context?.allProjects ?? true,
      filter: context?.allProjects ? "all_projects" : context?.scope.project_id ? "project" : "unresolved",
      note: context?.allProjects ? "Daemon lane.registry and queue.registry are shown in aggregate because --all-projects was passed." : "Daemon lane.registry and queue.registry were subscribed with the resolved project_id; client-side filtering remains a defensive guard."
    };
  } catch (err) {
    return {
      source: "unavailable",
      daemon_authority: "canonical_events",
      lanes: [],
      queue: [],
      workspace_scope: context?.scope ?? null,
      all_projects: context?.allProjects ?? false,
      filter: context?.allProjects ? "all_projects" : context?.scope.project_id ? "project" : "unresolved",
      note: "Could not read daemon workspace registries; file-backed workspace projection is stale fallback context only.",
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

// src/commands/agent.ts
var DOC_REF4 = "docs/cli/agent-workspace.md";
async function runAgent(args) {
  const verb = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") {
    return runAgentContract(args);
  }
  if (verb === "orient" || verb === void 0) {
    return runOrient(args);
  }
  if (verb === "meta-progress" || verb === "progress") return runMetaProgress(args);
  if (verb === "prompt") return runPrompt(args);
  if (verb === "report") return runReport(args);
  if (verb === "log") return runAgentLog(args);
  return runAgentContract(args);
}
function promptMode(args) {
  const raw = flagString(args, "mode") ?? (flagBool(args, "handoff") ? "handoff" : flagString(args, "kind")) ?? "delegate";
  if (raw === "handoff" || raw === "continue" || raw === "delegate") return raw;
  return "delegate";
}
function shellQuote(value) {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}
function firstNonEmpty(...values) {
  for (const value of values) {
    if (value && value.trim()) return value;
  }
  return null;
}
async function runPrompt(args) {
  const json = flagBool(args, "json");
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR;
  const mode = promptMode(args);
  const provider = flagString(args, "provider") ?? (mode === "handoff" ? "codex" : "simulated");
  const target = flagString(args, "target") ?? flagString(args, "to") ?? (provider === "claude-code" ? "actor:claude-code" : "actor:codex");
  const cwd = flagString(args, "cwd") ?? process.cwd();
  const trail = await loadRecentWorkspaceTrail(args);
  const laneId = flagString(args, "lane");
  const requestedMission = flagString(args, "mission");
  const lane = laneId ? trail.lanes.find((item) => item.id === laneId || item.lane_id === laneId) ?? null : trail.lanes.find((item) => item.actor_id === actor && item.status !== "done" && item.status !== "closed") ?? trail.lanes[0] ?? null;
  const missionId = requestedMission ?? lane?.mission_id ?? null;
  const missions = await readProjection(args, {
    name: "mission.registry",
    pick: (data) => data.missions ?? []
  }) ?? [];
  const mission = missionId ? missions.find((item) => item.id === missionId || item.mission_id === missionId) ?? null : null;
  const laneQueue = lane ? trail.queue.filter((item) => item.lane_id === lane.id || item.lane_id === lane.lane_id) : [];
  const readyQueue = laneQueue.filter((item) => item.status === "ready");
  const blockedQueue = laneQueue.filter((item) => item.status === "blocked");
  const title = flagString(args, "title") ?? (mode === "handoff" ? `Handoff ${lane?.id ?? "current EMA work"}` : `Delegate ${lane?.title ?? "EMA work"}`);
  const objective = firstNonEmpty(
    flagString(args, "objective"),
    flagString(args, "needed"),
    mode === "handoff" ? "Continue from the current lane state, preserve context, and report exactly what changed." : null,
    lane?.done_when ? `Drive the lane to done-when: ${lane.done_when}` : null,
    lane?.title ?? null
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
    mission ? `- ${mission.id}: ${mission.title ?? "(untitled)"} [${mission.status ?? "unknown"}]` : `- ${missionId ?? "(none specified)"}`,
    "",
    "Lane:",
    lane ? `- ${lane.id}: ${lane.title} [${lane.status}]` : "- (no lane resolved; run ema agent orient --json before editing)",
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
    mode === "handoff" ? "- If you cannot continue, request or update a handoff rather than leaving chat-only context." : "- Keep the Harness execution tied to the lane and use harness context/events for recovery."
  ].filter((line) => line !== null);
  const prompt = promptLines.join("\n");
  const laneArg = lane ? ` --lane ${shellQuote(lane.id)}` : "";
  const providerArg = ` --provider ${shellQuote(provider)}`;
  const cwdArg = ` --cwd ${shellQuote(cwd)}`;
  const promptArg = ` --prompt ${shellQuote(prompt)}`;
  const harnessCommand = provider === "simulated" ? `ema harness dispatch${providerArg}${laneArg}${cwdArg}${promptArg} --json` : `ema harness start${providerArg}${laneArg}${cwdArg}${promptArg} --json`;
  const handoffCommand = lane ? `ema handoff request --from ${shellQuote(lane.id)} --to ${shellQuote(target)} --needed ${shellQuote(objective ?? title)} --context ${shellQuote(prompt)} --verify ${shellQuote("agent report recorded with changed/verified/risks/next")} --json` : null;
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
      report: lane ? `ema agent report --actor ${shellQuote(target)} --lane ${shellQuote(lane.id)} --changed <changed> --verified <verified> --risks <risks> --next <next> --json` : null
    }
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
function countByStatus(records) {
  return records.reduce((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1;
    return counts;
  }, {});
}
function readReportField(record, field) {
  if (typeof record !== "object" || record === null) return null;
  const value = record[field];
  return typeof value === "string" ? value : null;
}
function toAgentReportRecord(record) {
  return {
    id: readReportField(record, "id") ?? void 0,
    lane_id: readReportField(record, "lane_id"),
    actor_id: readReportField(record, "actor_id"),
    changed: readReportField(record, "changed"),
    verified: readReportField(record, "verified"),
    risks: readReportField(record, "risks"),
    next: readReportField(record, "next"),
    reported_at: readReportField(record, "reported_at"),
    updated_at: readReportField(record, "updated_at")
  };
}
function readStringField(record, field) {
  const value = record[field];
  return typeof value === "string" ? value : null;
}
function toVcalendarState(data) {
  return {
    current_phase: readStringField(data, "current_phase"),
    current_phase_set_at: readStringField(data, "current_phase_set_at"),
    current_phase_set_by: readStringField(data, "current_phase_set_by")
  };
}
function filterResolvedProjectRecords(records, projectId, allProjects) {
  if (allProjects || !projectId) return [...records];
  return records.filter((record) => record.project_id === projectId);
}
async function runMetaProgress(args) {
  const json = flagBool(args, "json");
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR;
  const daemonRecent = await loadRecentWorkspaceTrail(args);
  const reports = await readProjection(args, {
    name: "agent.reports",
    pick: (data) => (data.reports ?? []).map(toAgentReportRecord)
  }) ?? [];
  const tickSummary = workspaceSummary().tick;
  const vcalendarState = await readProjection(args, {
    name: "vcalendar.state",
    pick: toVcalendarState
  });
  const vcalendarPhase = vcalendarState?.current_phase ?? tickSummary.phase;
  const vcalendarMode = vcalendarPhase === "execution block" ? "execution" : vcalendarPhase === "review and checkup" ? "review" : vcalendarPhase === "handoff and next-day queue" ? "handoff" : tickSummary.mode;
  const activeLane = daemonRecent.lanes.find(
    (lane) => lane.actor_id === actor && lane.status !== "done"
  ) ?? null;
  const readyLanes = daemonRecent.lanes.filter((lane) => lane.status === "ready");
  const unownedLanes = daemonRecent.lanes.filter(
    (lane) => !lane.actor_id && lane.status !== "done"
  );
  const blockedQueue = daemonRecent.queue.filter((item) => item.status === "blocked");
  const readyQueue = daemonRecent.queue.filter((item) => item.status === "ready");
  const latestReports = reports.slice(0, 5);
  const commandContext = {
    scope: daemonRecent.workspace_scope,
    allProjects: daemonRecent.all_projects
  };
  const nextAction = activeLane ? `continue ${activeLane.id}: ${activeLane.title}` : readyLanes[0] ? `claim ${readyLanes[0].id}: ${readyLanes[0].title}` : readyQueue[0] ? `pull ${readyQueue[0].id}: ${readyQueue[0].title}` : blockedQueue[0] ? `unblock ${blockedQueue[0].id}: ${blockedQueue[0].title}` : `run ${renderScopedEmaCommand(commandContext, ["next", "--json"])}`;
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
      canonical_phase_set_by: vcalendarState?.current_phase_set_by ?? null
    },
    totals: {
      lanes: daemonRecent.lanes.length,
      queue: daemonRecent.queue.length,
      reports: reports.length
    },
    lane_status: countByStatus(daemonRecent.lanes),
    queue_status: countByStatus(daemonRecent.queue),
    active_lane: activeLane,
    pressure: {
      unowned_lanes: unownedLanes.length,
      ready_lanes: readyLanes.length,
      ready_queue: readyQueue.length,
      blocked_queue: blockedQueue.length
    },
    latest_reports: latestReports,
    next_action: nextAction,
    commands: [
      renderScopedEmaCommand(commandContext, ["tl", "about", "--json"]),
      renderScopedEmaCommand(commandContext, ["agent", "meta-progress", "--json"]),
      activeLane ? renderScopedEmaCommand(commandContext, ["lane", "show", "--lane", activeLane.id, "--json"]) : renderScopedEmaCommand(commandContext, ["lane", "list", "--json"]),
      renderScopedEmaCommand(commandContext, ["queue", "list", "--json"]),
      renderScopedEmaCommand(commandContext, ["vcalendar", "tick", "--json"])
    ]
  };
  if (json) {
    emitJson({ ok: true, command: "agent meta-progress", meta_progress: summary });
    return 0;
  }
  emitPretty("agent meta-progress");
  emitPretty(`source: ${summary.source}; daemon authority: ${summary.daemon_authority}`);
  emitPretty(`actor: ${actor}`);
  emitPretty(`vCalendar: ${summary.vcalendar.iso_week} \xB7 ${summary.vcalendar.phase} \xB7 ${summary.vcalendar.mode}`);
  emitPretty(`lanes: ${summary.totals.lanes} ${JSON.stringify(summary.lane_status)}`);
  emitPretty(`queue: ${summary.totals.queue} ${JSON.stringify(summary.queue_status)}`);
  emitPretty(`reports: ${summary.totals.reports}`);
  emitPretty(`active lane: ${activeLane ? `${activeLane.id} \u2014 ${activeLane.title}` : "(none)"}`);
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
async function runAgentLog(args) {
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
      target_value: flagString(args, "source-node") ?? flagString(args, "wiki-node")
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
      context: flagString(args, "source") ?? flagString(args, "origin-text")
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
      source: flagString(args, "source")
    }, { human: `logged inference: ${question}`, resourceLabel: "gac" });
  }
  emitError(`ema agent log: unknown kind "${kind ?? ""}" (expected: intent | inference | decision)`);
  return 64;
}
async function runReport(args) {
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
    next: flagString(args, "next") ?? null
  }, { human: `recorded agent report for ${lane}`, resourceLabel: "agent_report" });
}
function runAgentContract(args) {
  return runStubContract(args, {
    noun: "agent",
    status: "available",
    docRef: DOC_REF4,
    commands: [
      {
        verb: "orient",
        flags: ["project", "json"],
        summary: "Print the current orientation checklist for an agent starting work."
      },
      {
        verb: "prompt",
        flags: ["actor", "target", "mission", "lane", "project", "mode", "provider", "cwd", "objective", "handoff", "json"],
        summary: "Generate a live handoff/delegation prompt and Harness Glue command from mission, lane, and queue context."
      },
      {
        verb: "meta-progress",
        flags: ["actor", "json"],
        summary: "Summarize daemon-backed orchestration progress: counts, pressure, latest reports, and next action."
      },
      {
        verb: "report",
        flags: ["actor", "lane", "changed", "verified", "risks", "next"],
        required: ["actor", "lane"],
        summary: "Report progress in the stable handoff-friendly format."
      },
      {
        verb: "log intent|inference|decision",
        flags: ["actor", "title", "body", "document", "section", "source"],
        summary: "Log agent intent, inference, or decision into the Blueprint planner rail."
      }
    ]
  });
}
async function runOrient(args) {
  const json = flagBool(args, "json");
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR;
  const scope = await resolveWorkspaceScope({ args });
  const allProjects = flagBool(args, "all-projects");
  const daemonRecent = await loadRecentWorkspaceTrail(args);
  const handoffsRaw = await readProjection(args, {
    name: "handoff.registry",
    pick: (data) => data.handoffs ?? []
  }) ?? [];
  const handoffs = filterResolvedProjectRecords(
    handoffsRaw,
    scope.project_id,
    allProjects
  );
  const reports = await readProjection(args, {
    name: "agent.reports",
    pick: (data) => data.reports ?? []
  }) ?? [];
  const summary = withDaemonWorkspaceRecords(workspaceSummary({ scope }), {
    lanes: daemonRecent.lanes.map((lane) => ({
      id: lane.id,
      title: lane.title,
      type: "daemon_lane",
      status: lane.status,
      path: `daemon://lane.registry/${lane.id}`
    })),
    queue: daemonRecent.queue.map((item) => ({
      id: item.id,
      title: item.title,
      type: "daemon_queue_item",
      status: item.status,
      path: `daemon://queue.registry/${item.id}`
    }))
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
    "ema problem --help"
  ];
  const activeLane = daemonRecent.lanes.find(
    (lane) => lane.actor_id === actor && lane.status !== "done"
  ) ?? null;
  const recommendedNextLane = activeLane ? null : daemonRecent.lanes.find(
    (lane) => (lane.status === "ready" || lane.status === "idea") && !lane.actor_id
  ) ?? null;
  const staleOrUnownedLanes = daemonRecent.lanes.filter(
    (lane) => !lane.actor_id && lane.status !== "done"
  );
  const blockedQueueItems = daemonRecent.queue.filter((item) => item.status === "blocked");
  const nextSuggestedCliCommand = activeLane ? renderScopedEmaCommand(commandContext, ["lane", "show", "--lane", activeLane.id, "--json"]) : recommendedNextLane ? renderScopedEmaCommand(commandContext, ["lane", "claim", "--lane", recommendedNextLane.id, "--actor", actor, "--scope", "<scope>", "--goal", "<goal>", "--next", "<next>", "--json"]) : blockedQueueItems[0] ? renderScopedEmaCommand(commandContext, ["queue", "show", "--queue-item", blockedQueueItems[0].id, "--json"]) : renderScopedEmaCommand(commandContext, ["next", "--json"]);
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
      latest_reports: reports.slice(0, 5)
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
  emitPretty(`vCalendar: ${summary.tick.iso_week} \xB7 ${summary.tick.phase}`);
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

// src/commands/next.ts
async function runNext(args) {
  if (flagBool(args, "help") || args.flags.h === true || args.positional[0] === "help") {
    return runStubContract(args, {
      noun: "next",
      status: "available",
      usage: "Usage: ema next [--project <name-or-id>] [--actor actor:<id>] [--json]",
      docRef: "docs/cli/agent-workspace.md",
      commands: [
        { verb: "recommend", flags: ["project", "all-projects", "actor", "json"], summary: "Recommend the next lane, queue item, or orientation command." }
      ]
    });
  }
  const json = flagBool(args, "json");
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR;
  const daemonRecent = await loadRecentWorkspaceTrail(args);
  const activeLane = daemonRecent.lanes.find(
    (lane) => lane.actor_id === actor && lane.status !== "done"
  ) ?? null;
  const recommendedLane = activeLane ?? daemonRecent.lanes.find(
    (lane) => (lane.status === "ready" || lane.status === "idea") && !lane.actor_id
  ) ?? null;
  const readyQueueItem = daemonRecent.queue.find((item) => item.status === "ready") ?? null;
  const phase = currentPhase();
  const commandContext = {
    scope: daemonRecent.workspace_scope,
    allProjects: daemonRecent.all_projects
  };
  const nextCommand = activeLane ? renderScopedEmaCommand(commandContext, ["lane", "show", "--lane", activeLane.id, "--json"]) : recommendedLane ? renderScopedEmaCommand(commandContext, ["lane", "claim", "--lane", recommendedLane.id, "--actor", actor, "--scope", "<scope>", "--goal", "<goal>", "--next", "<next>", "--json"]) : readyQueueItem ? renderScopedEmaCommand(commandContext, ["queue", "show", "--queue-item", readyQueueItem.id, "--json"]) : renderScopedEmaCommand(commandContext, ["agent", "orient", "--json"]);
  const payload = {
    ok: true,
    command: "next",
    source: daemonRecent.source,
    daemon_authority: daemonRecent.daemon_authority,
    actor,
    vcalendar_phase: phase,
    active_lane: activeLane,
    recommended_lane: recommendedLane,
    ready_queue_item: readyQueueItem,
    next_command: nextCommand
  };
  if (json) emitJson(payload);
  else {
    emitPretty(`phase: ${phase}`);
    emitPretty(`next: ${nextCommand}`);
  }
  return 0;
}
function currentPhase(now = /* @__PURE__ */ new Date()) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < 9 * 60) return "intake and orientation";
  if (minutes < 11 * 60) return "planning and lane claim";
  if (minutes < 16 * 60) return "execution block";
  if (minutes < 18 * 60) return "review and checkup";
  return "handoff and next-day queue";
}

// src/commands/tl.ts
async function runTl(args) {
  const sub = args.positional[0] ?? "about";
  const json = flagBool(args, "json");
  if (flagBool(args, "help") || args.flags.h === true || sub === "help") {
    return runStubContract(args, {
      noun: "tl",
      status: "available",
      docRef: "docs/cli/agent-workspace.md",
      commands: [
        { verb: "about", flags: ["project", "all-projects", "summary", "json"], summary: "Show task-layer orientation and daemon-backed workspace records." },
        { verb: "status", flags: ["project", "all-projects", "summary", "json"], summary: "Alias-style task-layer status view." },
        { verb: "tick", flags: ["project", "all-projects", "summary", "json"], summary: "Show task-layer state with vCalendar tick context." }
      ]
    });
  }
  if (sub !== "about" && sub !== "status" && sub !== "tick") {
    emitError(`ema tl: unknown subcommand "${sub}" (expected: about | status | tick)`);
    return 64;
  }
  const scope = await resolveWorkspaceScope({ args });
  const daemonRecent = await loadRecentWorkspaceTrail(args);
  const summary = withDaemonWorkspaceRecords(workspaceSummary({ scope }), {
    lanes: daemonRecent.lanes.map((lane) => ({
      id: lane.id,
      title: lane.title,
      type: "daemon_lane",
      status: lane.status,
      path: `daemon://lane.registry/${lane.id}`
    })),
    queue: daemonRecent.queue.map((item) => ({
      id: item.id,
      title: item.title,
      type: "daemon_queue_item",
      status: item.status,
      path: `daemon://queue.registry/${item.id}`
    }))
  });
  if (json) {
    if (flagBool(args, "summary") || flagBool(args, "compact")) {
      const actor = flagString(args, "actor") ?? DEFAULT_ACTOR;
      const activeLane = daemonRecent.lanes.find(
        (lane) => lane.actor_id === actor && lane.status !== "done" && lane.status !== "closed"
      ) ?? null;
      const readyLanes = daemonRecent.lanes.filter((lane) => lane.status === "ready" || lane.status === "idea");
      const readyQueue = daemonRecent.queue.filter((item) => item.status === "ready");
      const blockedQueue = daemonRecent.queue.filter((item) => item.status === "blocked");
      emitJson({
        ok: true,
        command: `tl ${sub}`,
        compact: true,
        actor,
        workspace: {
          source: summary.source,
          daemon_authority: summary.daemon_authority,
          root: summary.root,
          project_record: summary.project_record,
          active_build: summary.active_build,
          workspace_scope: summary.workspace_scope,
          orientation_docs: summary.orientation_docs,
          counts: summary.counts,
          tick: summary.tick,
          enforcement: summary.enforcement
        },
        daemon_recent: {
          source: daemonRecent.source,
          daemon_authority: daemonRecent.daemon_authority,
          workspace_scope: daemonRecent.workspace_scope,
          all_projects: daemonRecent.all_projects,
          filter: daemonRecent.filter,
          note: daemonRecent.note,
          error: daemonRecent.error,
          totals: {
            lanes: daemonRecent.lanes.length,
            queue: daemonRecent.queue.length
          },
          lane_status: countByStatus2(daemonRecent.lanes),
          queue_status: countByStatus2(daemonRecent.queue),
          active_lane: activeLane,
          ready_lanes: readyLanes.slice(0, 5),
          ready_queue: readyQueue.slice(0, 10),
          blocked_queue_count: blockedQueue.length
        }
      });
      return 0;
    }
    emitJson({
      ok: true,
      command: `tl ${sub}`,
      workspace: summary,
      daemon_recent: daemonRecent
    });
    return 0;
  }
  emitPretty("agent workspace task layer");
  emitPretty(`source: ${summary.source}`);
  emitPretty(`authority: daemon ${summary.daemon_authority}`);
  emitPretty(`scope: ${scope.project_name ?? "(unresolved)"} (${scope.resolution_source})`);
  emitPretty(`project record: ${summary.project_record ?? "(none)"}`);
  emitPretty(`active build: ${summary.active_build ?? "(none)"}`);
  if (scope.note) emitPretty(`note: ${scope.note}`);
  emitPretty("");
  emitPretty(`vCalendar: ${summary.tick.iso_week} \xB7 ${summary.tick.phase}`);
  emitPretty(`next tick: ${summary.tick.next_tick}`);
  for (const instruction of summary.tick.instructions) {
    emitPretty(`  - ${instruction}`);
  }
  emitPretty("");
  emitPretty("records:");
  for (const [key, count] of Object.entries(summary.counts)) {
    emitPretty(`  ${key.padEnd(18)} ${count}`);
  }
  emitPretty("");
  emitPretty("daemon recent:");
  emitPretty(`  source: ${daemonRecent.source}`);
  emitPretty(`  lanes: ${daemonRecent.lanes.length}`);
  emitPretty(`  queue: ${daemonRecent.queue.length}`);
  emitPretty(`  note: ${daemonRecent.note}`);
  if (daemonRecent.error) emitPretty(`  error: ${daemonRecent.error}`);
  emitPretty("");
  emitPretty("enforcement:");
  for (const rule of summary.enforcement) {
    emitPretty(`  - ${rule}`);
  }
  return 0;
}
function countByStatus2(records) {
  return records.reduce((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1;
    return counts;
  }, {});
}

// src/commands/blueprint.ts
var DOC_REF5 = "packages/contracts/events/blueprint.md";
var STRUCTURAL_PROJECTION = "blueprint.sections";
var PLANNER_PROJECTION = "blueprint.planner";
var DEFAULT_ORG4 = "org:01J00000000000000000000001";
var DEFAULT_ACTOR4 = "actor:dev-console";
var COMMANDS2 = [
  { verb: "status", summary: "Show installed Blueprint vApp + collab/structural state.", status: "available" },
  { verb: "list", summary: "Show all blueprint documents and sections from the daemon projection.", status: "available" },
  { verb: "planner", summary: "Show GAC, blocker, aspiration, and decision nodes from blueprint.planner.", status: "available" },
  {
    verb: "document create",
    flags: ["org", "space", "actor", "project", "title"],
    required: ["project", "title"],
    summary: "Create a structural Blueprint document.",
    status: "available"
  },
  {
    verb: "document rename",
    flags: ["org", "actor", "document", "title"],
    required: ["document", "title"],
    summary: "Rename a structural Blueprint document.",
    status: "available"
  },
  {
    verb: "document archive",
    flags: ["org", "actor", "document", "reason"],
    required: ["document"],
    summary: "Archive a structural Blueprint document.",
    status: "available"
  },
  {
    verb: "section add",
    flags: ["org", "space", "actor", "project", "document", "parent-section", "title", "position"],
    required: ["document", "title"],
    summary: "Add a structural Blueprint section under a document.",
    status: "available"
  },
  {
    verb: "section rename",
    flags: ["org", "actor", "section", "title"],
    required: ["section", "title"],
    summary: "Rename a structural Blueprint section.",
    status: "available"
  },
  {
    verb: "section move",
    flags: ["org", "actor", "section", "parent-section", "position"],
    required: ["section", "position"],
    summary: "Reparent or reorder a structural Blueprint section.",
    status: "available"
  },
  {
    verb: "section remove",
    flags: ["org", "actor", "section"],
    required: ["section"],
    summary: "Remove a structural Blueprint section (soft delete).",
    status: "available"
  },
  {
    verb: "gac create|answer|list",
    flags: ["document", "section", "question", "category", "priority", "gac", "result-action"],
    summary: "Create, answer, or list Blueprint GAC cards.",
    status: "available"
  },
  {
    verb: "blocker open|list",
    flags: ["title", "description", "category", "priority", "document", "section"],
    summary: "Open or list Blueprint blocker cards.",
    status: "available"
  },
  {
    verb: "aspiration capture|list",
    flags: ["title", "body", "timeframe", "origin-app", "origin-text"],
    summary: "Capture or list Blueprint aspirations.",
    status: "available"
  },
  {
    verb: "decision lock|list",
    flags: ["title", "body", "supersedes", "source-node"],
    summary: "Lock or list Blueprint canon-facing decisions.",
    status: "available"
  }
];
async function runBlueprint(args) {
  const verb = args.positional[0];
  const subverb = args.positional[1];
  const help11 = flagBool(args, "help") || args.flags.h === true || verb === void 0 || verb === "help";
  if (help11) return runHelp2(args);
  if (verb === "status") return runStatus2(args);
  if (verb === "list" || verb === "documents" || verb === "sections")
    return runList(args);
  if (verb === "planner") return runPlannerOverview(args);
  if (verb === "document") {
    if (subverb === "create") return runDocumentCreate(args);
    if (subverb === "rename") return runDocumentRename(args);
    if (subverb === "archive") return runDocumentArchive(args);
    emitError(
      `ema blueprint document: unknown subcommand "${subverb ?? ""}" (expected: create | rename | archive)`
    );
    return 64;
  }
  if (verb === "section") {
    if (subverb === "add") return runSectionAdd(args);
    if (subverb === "rename") return runSectionRename(args);
    if (subverb === "move") return runSectionMove(args);
    if (subverb === "remove") return runSectionRemove(args);
    if (subverb === "promote") return runSectionPromote(args);
    emitError(
      `ema blueprint section: unknown subcommand "${subverb ?? ""}" (expected: add | rename | move | remove | promote)`
    );
    return 64;
  }
  if (verb === "gac") {
    if (subverb === "create") return runGacCreate(args);
    if (subverb === "answer") return runGacAnswer(args);
    if (subverb === "list") return runPlannerList(args, "gac_cards", "GAC cards");
    emitError(
      `ema blueprint gac: unknown subcommand "${subverb ?? ""}" (expected: create | answer | list)`
    );
    return 64;
  }
  if (verb === "blocker") {
    if (subverb === "open") return runBlockerOpen(args);
    if (subverb === "resolve") return runBlockerResolve(args);
    if (subverb === "list") return runPlannerList(args, "blockers", "Blockers");
    emitError(
      `ema blueprint blocker: unknown subcommand "${subverb ?? ""}" (expected: open | resolve | list)`
    );
    return 64;
  }
  if (verb === "aspiration") {
    if (subverb === "capture") return runAspirationCapture(args);
    if (subverb === "list")
      return runPlannerList(args, "aspirations", "Aspirations");
    emitError(
      `ema blueprint aspiration: unknown subcommand "${subverb ?? ""}" (expected: capture | list)`
    );
    return 64;
  }
  if (verb === "decision") {
    if (subverb === "lock") return runDecisionLock(args);
    if (subverb === "list") return runPlannerList(args, "decisions", "Decisions");
    emitError(
      `ema blueprint decision: unknown subcommand "${subverb ?? ""}" (expected: lock | list)`
    );
    return 64;
  }
  if (verb === "graph") {
    if (subverb === "view" || subverb === void 0) return runGraphView(args);
    emitError(
      `ema blueprint graph: unknown subcommand "${subverb}" (expected: view)`
    );
    return 64;
  }
  emitError(
    `ema blueprint: unknown subcommand "${verb}" (expected: help | status | list | document | section | gac | blocker | aspiration | decision | graph)`
  );
  emitError(`See ${DOC_REF5} for the structural event contract.`);
  return 64;
}
function runHelp2(args) {
  const json = flagBool(args, "json");
  if (json) {
    emitJson({
      ok: true,
      noun: "blueprint",
      daemon_authority: "canonical_events",
      projection: STRUCTURAL_PROJECTION,
      planner_projection: PLANNER_PROJECTION,
      commands: COMMANDS2,
      doc: DOC_REF5
    });
    return 0;
  }
  emitPretty("ema blueprint \u2014 structural Blueprint document/section CRUD");
  emitPretty(`projection: ${STRUCTURAL_PROJECTION}`);
  emitPretty(`planner_projection: ${PLANNER_PROJECTION}`);
  emitPretty("");
  emitPretty("Usage: ema blueprint <subcommand> [flags...] [--json]");
  emitPretty("");
  for (const cmd of COMMANDS2) {
    emitPretty(`  ${cmd.verb.padEnd(18)} ${cmd.summary}`);
    const flags = cmd.flags ?? [];
    if (flags.length > 0)
      emitPretty(`                     flags: ${flags.map((f) => `--${f}`).join(", ")}`);
    const required = cmd.required ?? [];
    if (required.length > 0)
      emitPretty(`                     required: ${required.map((f) => `--${f}`).join(", ")}`);
    emitPretty(`                     status: ${cmd.status}`);
  }
  emitPretty("");
  emitPretty(`Docs: ${DOC_REF5}`);
  emitPretty("");
  emitPretty("Planner commands:");
  emitPretty("  ema blueprint planner [--json]");
  emitPretty('  ema blueprint gac create --document <id> --question "..."');
  emitPretty('  ema blueprint blocker open --title "..." --description "..."');
  emitPretty('  ema blueprint aspiration capture --title "..." --body "..."');
  emitPretty('  ema blueprint decision lock --title "..." --body "..."');
  return 0;
}
async function runStatus2(args) {
  const json = flagBool(args, "json");
  try {
    const c = await connect({ surface: "desktop" });
    const [vapps, collab, structural] = await Promise.all([
      readProjection2(c, "space.installed_vapps"),
      readProjection2(c, "collab.document"),
      readProjection2(c, STRUCTURAL_PROJECTION)
    ]);
    c.close();
    const installedVapp = findBlueprintVapp(vapps.data);
    const documents = structural.received ? readArray(structural.data, "documents") : [];
    const totalSections = documents.reduce(
      (n, doc) => n + readArray(doc, "sections").length,
      0
    );
    const body = {
      ok: true,
      command: "blueprint status",
      daemon_authority: "canonical_events",
      installed_vapp: installedVapp,
      collab_document: summarizeCollabDocument(collab),
      structural_projection: {
        name: STRUCTURAL_PROJECTION,
        received: structural.received,
        document_count: documents.length,
        section_count: totalSections
      },
      doc: DOC_REF5
    };
    if (json) emitJson(body);
    else {
      emitPretty("# blueprint");
      emitPretty(`installed_vapp: ${installedVapp ? "available" : "not visible"}`);
      const cd = body.collab_document;
      emitPretty(
        `collab_document: ${cd.received ? `${cd.document_id ?? "(unknown)"} (${cd.authority ?? "?"})` : cd.status}`
      );
      emitPretty(
        `structural_projection: ${structural.received ? `${documents.length} doc(s), ${totalSections} section(s)` : "not visible"}`
      );
      emitPretty(`docs: ${DOC_REF5}`);
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}
async function runList(args) {
  const json = flagBool(args, "json");
  try {
    const c = await connect({ surface: "desktop" });
    const structural = await readProjection2(c, STRUCTURAL_PROJECTION);
    c.close();
    const documents = structural.received ? readArray(structural.data, "documents") : [];
    const body = {
      ok: true,
      command: "blueprint list",
      source: STRUCTURAL_PROJECTION,
      received: structural.received,
      documents,
      doc: DOC_REF5
    };
    if (json) emitJson(body);
    else {
      emitPretty(`# blueprint list  (source: ${STRUCTURAL_PROJECTION})`);
      if (documents.length === 0) emitPretty("  (no documents)");
      for (const doc of documents) {
        const d = doc;
        const sections = readArray(d, "sections");
        emitPretty(
          `${d.id} [${d.status ?? "?"}] ${d.title ?? "(untitled)"}  \u2014 ${sections.length} section(s)`
        );
        for (const sec of sections) {
          const s = sec;
          const parent = s.parent_section_id ? ` parent=${s.parent_section_id}` : "";
          emitPretty(
            `  ${String(s.position).padStart(3, " ")}. ${s.id} ${s.title ?? "(untitled)"}${parent}`
          );
        }
      }
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}
async function runPlannerOverview(args) {
  const json = flagBool(args, "json");
  try {
    const c = await connect({ surface: "desktop" });
    const planner = await readProjection2(c, PLANNER_PROJECTION);
    c.close();
    const body = {
      ok: true,
      command: "blueprint planner",
      source: PLANNER_PROJECTION,
      received: planner.received,
      planner: planner.data ?? {},
      doc: DOC_REF5
    };
    if (json) emitJson(body);
    else {
      emitPretty(`# blueprint planner  (source: ${PLANNER_PROJECTION})`);
      for (const key of ["gac_cards", "blockers", "aspirations", "decisions"]) {
        const rows = readArray(planner.data, key);
        emitPretty(`${key}: ${rows.length}`);
        for (const row of rows.slice(0, 8)) {
          const record = row;
          emitPretty(
            `  ${record.id ?? record.gac_id ?? record.blocker_id ?? record.aspiration_id ?? record.decision_id} ${record.title ?? record.question ?? record.status ?? ""}`
          );
        }
      }
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}
async function runDocumentCreate(args) {
  const json = flagBool(args, "json");
  const project = flagString(args, "project");
  const title = flagString(args, "title") ?? flagString(args, "name");
  if (!project) {
    emitError("ema blueprint document create: --project is required");
    return 64;
  }
  if (!title) {
    emitError("ema blueprint document create: --title is required");
    return 64;
  }
  return send3(
    "blueprint.document.create",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG4,
      space_id: flagString(args, "space"),
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR4,
      project_id: project,
      title
    }),
    { json, human: `created blueprint document "${title}"`, resourceLabel: "document" }
  );
}
async function runSectionAdd(args) {
  const json = flagBool(args, "json");
  const document = flagString(args, "document");
  const title = flagString(args, "title") ?? flagString(args, "name");
  if (!document) {
    emitError("ema blueprint section add: --document is required");
    return 64;
  }
  if (!title) {
    emitError("ema blueprint section add: --title is required");
    return 64;
  }
  const positionRaw = flagString(args, "position");
  let position;
  if (positionRaw !== void 0) {
    const parsedPosition = Number(positionRaw);
    if (!Number.isInteger(parsedPosition) || parsedPosition < 0) {
      emitError(`ema blueprint section add: --position must be a non-negative integer (got ${positionRaw})`);
      return 64;
    }
    position = parsedPosition;
  }
  return send3(
    "blueprint.section.add",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG4,
      space_id: flagString(args, "space"),
      project_id: flagString(args, "project"),
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR4,
      document_id: document,
      parent_section_id: flagString(args, "parent-section"),
      title,
      position
    }),
    { json, human: `added section "${title}" to ${document}`, resourceLabel: "section" }
  );
}
async function runDocumentRename(args) {
  const json = flagBool(args, "json");
  const document = flagString(args, "document");
  const title = flagString(args, "title") ?? flagString(args, "name");
  if (!document) {
    emitError("ema blueprint document rename: --document is required");
    return 64;
  }
  if (!title) {
    emitError("ema blueprint document rename: --title is required");
    return 64;
  }
  return send3(
    "blueprint.document.rename",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG4,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR4,
      document_id: document,
      title
    }),
    { json, human: `renamed blueprint document ${document} to "${title}"`, resourceLabel: "document" }
  );
}
async function runDocumentArchive(args) {
  const json = flagBool(args, "json");
  const document = flagString(args, "document");
  if (!document) {
    emitError("ema blueprint document archive: --document is required");
    return 64;
  }
  return send3(
    "blueprint.document.archive",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG4,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR4,
      document_id: document,
      reason: flagString(args, "reason")
    }),
    { json, human: `archived blueprint document ${document}`, resourceLabel: "document" }
  );
}
async function runSectionRename(args) {
  const json = flagBool(args, "json");
  const section = flagString(args, "section");
  const title = flagString(args, "title") ?? flagString(args, "name");
  if (!section) {
    emitError("ema blueprint section rename: --section is required");
    return 64;
  }
  if (!title) {
    emitError("ema blueprint section rename: --title is required");
    return 64;
  }
  return send3(
    "blueprint.section.rename",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG4,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR4,
      section_id: section,
      title
    }),
    { json, human: `renamed blueprint section ${section} to "${title}"`, resourceLabel: "section" }
  );
}
async function runSectionMove(args) {
  const json = flagBool(args, "json");
  const section = flagString(args, "section");
  if (!section) {
    emitError("ema blueprint section move: --section is required");
    return 64;
  }
  const positionRaw = flagString(args, "position");
  if (positionRaw === void 0) {
    emitError("ema blueprint section move: --position is required");
    return 64;
  }
  const position = Number(positionRaw);
  if (!Number.isInteger(position) || position < 0) {
    emitError(`ema blueprint section move: --position must be a non-negative integer (got ${positionRaw})`);
    return 64;
  }
  return send3(
    "blueprint.section.move",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG4,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR4,
      section_id: section,
      parent_section_id: flagString(args, "parent-section"),
      position
    }),
    { json, human: `moved blueprint section ${section} to position ${position}`, resourceLabel: "section" }
  );
}
async function runSectionPromote(args) {
  const json = flagBool(args, "json");
  const section = flagString(args, "section");
  const title = flagString(args, "title") ?? flagString(args, "name");
  const body = flagString(args, "body");
  if (!section) {
    emitError("ema blueprint section promote: --section is required");
    return 64;
  }
  if (!title) {
    emitError("ema blueprint section promote: --title is required");
    return 64;
  }
  if (!body) {
    emitError("ema blueprint section promote: --body is required");
    return 64;
  }
  return send3(
    "blueprint.section.promote",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG4,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR4,
      section_id: section,
      title,
      body
    }),
    { json, human: `promoted section ${section} to proposal`, resourceLabel: "proposal" }
  );
}
async function runSectionRemove(args) {
  const json = flagBool(args, "json");
  const section = flagString(args, "section");
  if (!section) {
    emitError("ema blueprint section remove: --section is required");
    return 64;
  }
  return send3(
    "blueprint.section.remove",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG4,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR4,
      section_id: section
    }),
    { json, human: `removed blueprint section ${section}`, resourceLabel: "section" }
  );
}
async function runGacCreate(args) {
  const json = flagBool(args, "json");
  const document = flagString(args, "document");
  const category = flagString(args, "category");
  const priority = flagString(args, "priority");
  const question = flagString(args, "question");
  if (!document) {
    emitError("ema blueprint gac create: --document is required");
    return 64;
  }
  if (!category) {
    emitError("ema blueprint gac create: --category is required (gap | assumption | clarification)");
    return 64;
  }
  if (!priority) {
    emitError("ema blueprint gac create: --priority is required (critical | high | medium | low)");
    return 64;
  }
  if (!question) {
    emitError("ema blueprint gac create: --question is required");
    return 64;
  }
  return send3(
    "blueprint.gac.create",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG4,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR4,
      document_id: document,
      section_id: flagString(args, "section"),
      category,
      priority,
      question
    }),
    { json, human: `created GAC card`, resourceLabel: "gac" }
  );
}
async function runGacAnswer(args) {
  const json = flagBool(args, "json");
  const gac = flagString(args, "gac");
  const resultAction = flagString(args, "result-action");
  if (!gac) {
    emitError("ema blueprint gac answer: --gac is required");
    return 64;
  }
  if (!resultAction) {
    emitError(
      "ema blueprint gac answer: --result-action is required (create_canon | create_intent | update_node | defer_to_blocker)"
    );
    return 64;
  }
  return send3(
    "blueprint.gac.answer",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG4,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR4,
      gac_id: gac,
      selected: flagString(args, "selected"),
      freeform: flagString(args, "note"),
      result_action: resultAction,
      target: flagString(args, "target")
    }),
    { json, human: `answered GAC ${gac}`, resourceLabel: "gac" }
  );
}
async function runBlockerOpen(args) {
  const json = flagBool(args, "json");
  const category = flagString(args, "category");
  const priority = flagString(args, "priority");
  const title = flagString(args, "title") ?? flagString(args, "name");
  if (!category) {
    emitError("ema blueprint blocker open: --category is required (tricky_question | deferred_decision | blocking_dependency)");
    return 64;
  }
  if (!priority) {
    emitError("ema blueprint blocker open: --priority is required (critical | high | medium | low)");
    return 64;
  }
  if (!title) {
    emitError("ema blueprint blocker open: --title is required");
    return 64;
  }
  return send3(
    "blueprint.blocker.open",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG4,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR4,
      document_id: flagString(args, "document"),
      section_id: flagString(args, "section"),
      category,
      priority,
      title,
      description: flagString(args, "description"),
      refresh_by: flagString(args, "resolve-by"),
      gac_id: flagString(args, "promoted-from")
    }),
    { json, human: `opened blocker "${title}"`, resourceLabel: "blocker" }
  );
}
async function runBlockerResolve(args) {
  const json = flagBool(args, "json");
  const blocker = flagString(args, "blocker");
  if (!blocker) {
    emitError("ema blueprint blocker resolve: --blocker is required");
    return 64;
  }
  return send3(
    "blueprint.blocker.resolve",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG4,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR4,
      blocker_id: blocker,
      target: flagString(args, "resolved-to"),
      reason: flagString(args, "note")
    }),
    { json, human: `resolved blocker ${blocker}`, resourceLabel: "blocker" }
  );
}
async function runAspirationCapture(args) {
  const json = flagBool(args, "json");
  const title = flagString(args, "title") ?? flagString(args, "name");
  const timeframe = flagString(args, "timeframe");
  if (!title) {
    emitError("ema blueprint aspiration capture: --title is required");
    return 64;
  }
  if (!timeframe) {
    emitError("ema blueprint aspiration capture: --timeframe is required (near_term | mid_term | long_term | aspirational)");
    return 64;
  }
  return send3(
    "blueprint.aspiration.capture",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG4,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR4,
      title,
      description: flagString(args, "description"),
      timeframe,
      source_type: flagString(args, "source-type") ?? "manual_tag",
      origin_app: flagString(args, "origin-app"),
      origin_text: flagString(args, "origin-text")
    }),
    { json, human: `captured aspiration "${title}"`, resourceLabel: "aspiration" }
  );
}
async function runDecisionLock(args) {
  const json = flagBool(args, "json");
  const title = flagString(args, "title") ?? flagString(args, "name");
  const body = flagString(args, "body");
  if (!title) {
    emitError("ema blueprint decision lock: --title is required");
    return 64;
  }
  if (!body) {
    emitError("ema blueprint decision lock: --body is required");
    return 64;
  }
  return send3(
    "blueprint.decision.lock",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG4,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR4,
      title,
      body,
      supersedes: flagString(args, "supersedes"),
      source_node: flagString(args, "source-node")
    }),
    { json, human: `locked decision "${title}"`, resourceLabel: "decision" }
  );
}
async function runGraphView(args) {
  const json = flagBool(args, "json");
  try {
    const c = await connect({ surface: "desktop" });
    const graph = await readProjection2(c, "intent_graph");
    c.close();
    if (!graph.received) {
      emitError("ema blueprint graph view: daemon did not return intent_graph projection");
      return 1;
    }
    const nodes = readArray(graph.data, "nodes");
    const edges = readArray(graph.data, "edges");
    if (json) {
      emitJson({
        ok: true,
        command: "blueprint graph view",
        source: "intent_graph",
        node_count: nodes.length,
        edge_count: edges.length,
        nodes,
        edges
      });
    } else {
      const kindCounts = {};
      for (const n of nodes) {
        const k = n.kind ?? "?";
        kindCounts[k] = (kindCounts[k] ?? 0) + 1;
      }
      const relationCounts = {};
      for (const e of edges) {
        const r = e.relation ?? "?";
        relationCounts[r] = (relationCounts[r] ?? 0) + 1;
      }
      emitPretty(`# intent graph  (source: intent_graph)`);
      emitPretty(`nodes: ${nodes.length}  \xB7  edges: ${edges.length}`);
      emitPretty("by kind:");
      for (const [k, n] of Object.entries(kindCounts).sort()) {
        emitPretty(`  ${k.padEnd(12)} ${n}`);
      }
      emitPretty("by relation:");
      for (const [r, n] of Object.entries(relationCounts).sort()) {
        emitPretty(`  ${r.padEnd(14)} ${n}`);
      }
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}
async function runPlannerList(args, field, label) {
  const json = flagBool(args, "json");
  try {
    const c = await connect({ surface: "desktop" });
    const planner = await readProjection2(c, "blueprint.planner");
    c.close();
    const items = planner.received ? readArray(planner.data, field) : [];
    const body = {
      ok: true,
      command: `blueprint ${field}`,
      source: "blueprint.planner",
      received: planner.received,
      [field]: items,
      doc: DOC_REF5
    };
    if (json) emitJson(body);
    else {
      emitPretty(`# ${label}  (source: blueprint.planner)`);
      if (items.length === 0) emitPretty(`  (no ${label.toLowerCase()})`);
      for (const item of items) {
        const r = item;
        const id = r.id ?? "(no id)";
        const status2 = r.status ?? "?";
        const title = r.title ?? r.question ?? "(untitled)";
        emitPretty(`  ${id} [${status2}] ${title}`);
      }
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}
async function send3(op, argsObj, out) {
  try {
    const c = await connect({ surface: "desktop" });
    const result = await c.command(op, argsObj);
    c.close();
    if (result.ok !== true) {
      const message = result.error.message.toLowerCase();
      const isMissingHandler = result.error.class === "unknown_command" || message.includes("unknown command") || message.includes("no handler");
      if (isMissingHandler) {
        const body = {
          ok: false,
          op,
          status: "blocked_missing_ipc_handler",
          blocked_by: `daemon shell IPC has no handler for ${op}`,
          doc: DOC_REF5
        };
        if (out.json) emitJson(body);
        else {
          emitPretty(`ema ${op}: blocked_missing_ipc_handler`);
          emitPretty(`  blocked_by: ${body.blocked_by}`);
          emitPretty(`  docs: ${DOC_REF5}`);
        }
        return 1;
      }
      if (out.json) emitJson({ ok: false, error: result.error });
      else emitError(`ema ${op}: ${result.error.class}: ${result.error.message}`);
      return 1;
    }
    const events2 = result.events ?? [];
    const resource = typeof result.resource === "string" ? result.resource : null;
    const warning = result.warning ?? null;
    if (out.json) emitJson({ ok: true, op, args: argsObj, events: events2, resource, warning });
    else {
      emitPretty(out.human);
      if (resource) emitPretty(`${out.resourceLabel ?? "created"}: ${resource}`);
      emitPretty(`events: ${events2.join(", ") || "(none returned)"}`);
      if (warning?.message) emitPretty(`[warn] ${warning.class ?? "warning"}: ${warning.message}`);
    }
    return 0;
  } catch (err) {
    return reportError(err, out.json);
  }
}
function optionalArgs(args) {
  return Object.fromEntries(Object.entries(args).filter(([, value]) => value !== void 0));
}
function readProjection2(c, channel) {
  return new Promise((resolve2) => {
    const timer = setTimeout(
      () => resolve2({ received: false, name: channel, data: null }),
      1500
    );
    c.onMessage((msg) => {
      const env = msg;
      if (env.type === "projection" && env.name === channel) {
        clearTimeout(timer);
        resolve2({ received: true, name: channel, data: env.data });
      }
    });
    c.subscribe(channel);
  });
}
function findBlueprintVapp(data) {
  const vapps = [...readArray(data, "vapps"), ...readArray(data, "apps")];
  return vapps.find((item) => {
    const record = item;
    return record.slug === "blueprint" || record.id === "vapp-install-blueprint" || record.installation_id === "vapp-install-blueprint";
  }) ?? null;
}
function summarizeCollabDocument(projection2) {
  if (!projection2.received || !projection2.data) {
    return { received: false, status: "not_visible" };
  }
  return {
    received: true,
    document_id: projection2.data.document_id ?? null,
    title: projection2.data.title ?? null,
    target: projection2.data.target ?? null,
    revision: projection2.data.revision ?? projection2.data.version ?? null,
    status: projection2.data.status ?? null,
    authority: projection2.data.authority ?? null,
    storage_authority: projection2.data.storage_authority ?? null,
    updated_at: projection2.data.updated_at ?? null
  };
}
function readArray(data, key) {
  if (!data) return [];
  const value = data[key];
  return Array.isArray(value) ? value : [];
}

// src/commands/wiki.ts
import { promises as fs } from "fs";
import path from "path";
var ATLAS_ROOT = path.join(DESKTOP_ROOT, "Projects", "EMA", "atlas");
var DOC_REF6 = "Projects/EMA/atlas/knowledge/ROOT-MAP.md";
var MAX_FILES = 2500;
async function runWiki(args) {
  const verb = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || verb === void 0 || verb === "help") {
    return runHelp3(args);
  }
  if (verb === "list") return runList2(args);
  if (verb === "search") return runSearch(args);
  if (verb === "get" || verb === "show") return runGet(args);
  emitError(`ema wiki: unknown subcommand "${verb}" (expected: list | search | get)`);
  return 64;
}
function runHelp3(args) {
  const json = flagBool(args, "json");
  const body = {
    ok: true,
    noun: "wiki",
    status: "atlas_file_index",
    atlas_root: ATLAS_ROOT,
    commands: [
      "ema wiki list [--limit 20] [--json]",
      "ema wiki search --query <text> [--limit 10] [--json]",
      "ema wiki get --path <atlas-relative-path> [--json]"
    ],
    doc: DOC_REF6
  };
  if (json) emitJson(body);
  else {
    emitPretty("ema wiki \u2014 atlas/QMD second-brain search");
    emitPretty(`atlas_root: ${ATLAS_ROOT}`);
    emitPretty("Usage:");
    for (const command of body.commands) emitPretty(`  ${command}`);
    emitPretty(`Docs: ${DOC_REF6}`);
  }
  return 0;
}
async function runList2(args) {
  const json = flagBool(args, "json");
  const limit = parseLimit2(args, 30);
  const notes = (await loadNotes()).slice(0, limit);
  if (json) emitJson({ ok: true, command: "wiki list", source: "atlas_files", notes });
  else {
    emitPretty(`# wiki list  (source: atlas_files)`);
    for (const note of notes) emitPretty(`${note.path} \u2014 ${note.title}`);
  }
  return 0;
}
async function runSearch(args) {
  const json = flagBool(args, "json");
  const query = flagString(args, "query") ?? args.positional.slice(1).join(" ");
  if (!query.trim()) {
    emitError("ema wiki search: --query is required");
    return 64;
  }
  const limit = parseLimit2(args, 10);
  const q = query.toLowerCase();
  const scored = (await loadNotes()).map((note) => ({ note, score: scoreNote(note, q) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((item) => item.note);
  if (json) emitJson({ ok: true, command: "wiki search", source: "atlas_files", query, notes: scored });
  else {
    emitPretty(`# wiki search "${query}"`);
    for (const note of scored) {
      emitPretty(`${note.path} \u2014 ${note.title}`);
      if (note.excerpt) emitPretty(`  ${note.excerpt}`);
    }
  }
  return 0;
}
async function runGet(args) {
  const json = flagBool(args, "json");
  const rel = flagString(args, "path") ?? args.positional[1];
  if (!rel) {
    emitError("ema wiki get: --path is required");
    return 64;
  }
  const safePath = path.normalize(rel).replace(/^(\.\.[/\\])+/, "");
  const abs = path.resolve(ATLAS_ROOT, safePath);
  const rootWithSep = `${path.resolve(ATLAS_ROOT)}${path.sep}`;
  if (abs !== path.resolve(ATLAS_ROOT) && !abs.startsWith(rootWithSep)) {
    emitError("ema wiki get: path must stay inside Projects/EMA/atlas");
    return 64;
  }
  try {
    const content = await fs.readFile(abs, "utf8");
    const note = noteFromContent(safePath, content);
    if (json) emitJson({ ok: true, command: "wiki get", source: "atlas_files", note, content });
    else {
      emitPretty(`# ${note.title}`);
      emitPretty(`path: ${note.path}`);
      emitPretty("");
      emitPretty(content);
    }
    return 0;
  } catch (err) {
    emitError(`ema wiki get: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }
}
async function loadNotes() {
  const files = await walk(ATLAS_ROOT);
  const notes = [];
  for (const file of files.slice(0, MAX_FILES)) {
    const rel = path.relative(ATLAS_ROOT, file);
    try {
      const content = await fs.readFile(file, "utf8");
      notes.push(noteFromContent(rel, content));
    } catch {
    }
  }
  return notes.sort((a, b) => a.path.localeCompare(b.path));
}
async function walk(root) {
  const out = [];
  async function visit(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "archive") continue;
        await visit(full);
      } else if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".qmd"))) {
        out.push(full);
      }
    }
  }
  await visit(root);
  return out;
}
function noteFromContent(rel, content) {
  const frontmatter = parseFrontmatter3(content);
  const body = content.replace(/^---[\s\S]*?---\n*/m, "");
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const fallback = path.basename(rel).replace(/\.(qmd|md)$/i, "").replace(/[-_]/g, " ");
  return {
    path: rel,
    title: frontmatter.title ?? heading ?? fallback,
    node_id: frontmatter.node_id ?? frontmatter.id ?? null,
    node_type: frontmatter.node_type ?? frontmatter.type ?? null,
    status: frontmatter.status ?? null,
    excerpt: body.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).slice(0, 2).join(" ").slice(0, 240)
  };
}
function parseFrontmatter3(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/m);
  if (!match?.[1]) return {};
  const out = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (m?.[1] && m[2]) out[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return out;
}
function scoreNote(note, query) {
  const haystack = `${note.path}
${note.title}
${note.node_id ?? ""}
${note.node_type ?? ""}
${note.excerpt}`.toLowerCase();
  let score = 0;
  for (const term of query.split(/\s+/).filter(Boolean)) {
    if (note.title.toLowerCase().includes(term)) score += 8;
    if (note.path.toLowerCase().includes(term)) score += 5;
    if (haystack.includes(term)) score += 1;
  }
  return score;
}
function parseLimit2(args, fallback) {
  const raw = flagString(args, "limit");
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

// src/commands/hermes.ts
import { existsSync as existsSync4 } from "fs";
var HERMES_ACTOR = "actor:hermes";
var DOCS = [
  "README.md",
  "Projects/README.md",
  "Projects/EMA/project.md",
  "Projects/EMA/PROJECT-MAP.md",
  "Projects/EMA/builds/BUILD-MANIFEST.md",
  "Projects/EMA/atlas/README.md",
  "Projects/EMA/subprojects/agent-workspace-vapp/blueprint/02-agent-cli-operating-contract.md",
  "Active builds/README.md",
  "Active builds/EMA-0.0.6/README.md",
  "Active builds/EMA-0.0.6/docs/cli/agent-workspace.md"
];
async function runHermes(args) {
  const verb = args.positional[0] ?? "orient";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return runHermesHelp(args);
  if (verb === "orient" || verb === "status") return runHermesOrient(args, verb);
  if (verb === "plan") return runHermesPlan(args);
  if (verb === "sweep") return runHermesSweep(args);
  if (verb === "dispatch") return runHermesDispatch(args);
  if (verb === "handoff" || verb === "audit") return runHermesPending(args, verb);
  emitError(`ema hermes: unknown subcommand "${verb}" (expected: orient | status | plan | dispatch | sweep | handoff | audit)`);
  return 64;
}
function runHermesHelp(args) {
  const commands = [
    { verb: "orient", summary: "Build the canonical Hermes resume packet from live workspace state." },
    { verb: "status", summary: "Alias of orient with the same swarm-lead projection." },
    { verb: "plan", summary: "Propose the next orchestration plan from lanes, queue, risks, and providers." },
    { verb: "dispatch", summary: "Describe or seed a Harness Glue dispatch from the Hermes plan." },
    { verb: "sweep", summary: "Find lost threads and format queue-ready follow-up records." },
    { verb: "handoff", summary: "Show the handoff contract for Hermes-led work." },
    { verb: "audit", summary: "Show auditable event/projection rails for Hermes work." }
  ];
  if (flagBool(args, "json")) {
    emitJson({ noun: "hermes", status: "daemon_projection_seed", commands, projection: "hermes.orchestrator" });
    return 0;
  }
  emitPretty("ema hermes \u2014 durable swarm lead controls");
  emitPretty("status: daemon projection seed; projection: hermes.orchestrator");
  for (const command of commands) emitPretty(`  ${command.verb.padEnd(10)} ${command.summary}`);
  return 0;
}
async function runHermesOrient(args, verb) {
  const json = flagBool(args, "json");
  const actor = flagString(args, "actor") ?? HERMES_ACTOR;
  const daemonRecent = await loadRecentWorkspaceTrail(args);
  const summary = withDaemonWorkspaceRecords(workspaceSummary(), {
    lanes: daemonRecent.lanes.map((lane) => ({
      id: lane.id,
      title: lane.title,
      type: "daemon_lane",
      status: lane.status,
      path: `daemon://lane.registry/${lane.id}`
    })),
    queue: daemonRecent.queue.map((item) => ({
      id: item.id,
      title: item.title,
      type: "daemon_queue_item",
      status: item.status,
      path: `daemon://queue.registry/${item.id}`
    }))
  });
  const handoffs = await readProjection(args, {
    name: "handoff.registry",
    pick: (data) => Array.isArray(data.handoffs) ? data.handoffs : []
  }) ?? [];
  const reports = await readProjection(args, {
    name: "agent.reports",
    pick: (data) => Array.isArray(data.reports) ? data.reports : []
  }) ?? [];
  const activeLane = daemonRecent.lanes.find((lane) => lane.actor_id === actor && lane.status !== "done") ?? daemonRecent.lanes.find((lane) => lane.actor_id === DEFAULT_ACTOR && lane.title.toLowerCase().includes("hermes") && lane.status !== "done") ?? null;
  const recommendedLane = activeLane ?? daemonRecent.lanes.find((lane) => lane.status === "ready" && !lane.actor_id) ?? daemonRecent.lanes.find((lane) => lane.status === "idea" && !lane.actor_id) ?? null;
  const blockedWork = daemonRecent.queue.filter((item) => item.status === "blocked");
  const activeRisks = [
    ...blockedWork.map((item) => ({ id: item.id, title: item.title, blocked_by: item.blocked_by ?? null })),
    ...daemonRecent.error ? [{ id: "daemon.workspace.read", title: "Workspace registries unavailable", blocked_by: daemonRecent.error }] : []
  ];
  const projections2 = [
    { name: "hermes.orchestrator", status: "available", count: 1 },
    { name: "lane.registry", status: daemonRecent.lanes.length > 0 ? "available" : "empty", count: daemonRecent.lanes.length },
    { name: "queue.registry", status: daemonRecent.queue.length > 0 ? "available" : "empty", count: daemonRecent.queue.length },
    { name: "dispatch.registry", status: "pending_daemon_projection" },
    { name: "execution.registry", status: "pending_daemon_projection" },
    { name: "tool.timeline", status: "pending_daemon_projection" },
    { name: "chronicle.activity", status: "pending_daemon_projection" }
  ];
  const resumePacket = {
    docs_read: DOCS.map((doc) => ({ path: doc, present: existsSync4(`${summary.root}/${doc}`) })),
    dirty_tree: { status: "not_computed", command: "git status --short" },
    daemon_projections: projections2,
    open_lanes: daemonRecent.lanes.filter((lane) => lane.status !== "done").slice(0, 8),
    queue: daemonRecent.queue.filter((item) => item.status !== "closed").slice(0, 8),
    blockers: blockedWork,
    blueprint_planner: { projection: "blueprint.planner", status: "available_via_blueprint_cli_or_pending_projection" },
    wiki_hits: { status: "not_queried", command: "ema wiki search --query <topic> --json" },
    active_dispatches: [],
    chronicle_recent_events: { projection: "chronicle.activity", status: "pending_daemon_projection" },
    peer_status: { rail: "ssh", status: "local_only_until_peer_registry" },
    dev_server_status: { status: "not_checked", commands: ["ema status --json"] },
    recommended_lane: recommendedLane,
    active_risks: activeRisks,
    blocked_work: blockedWork,
    verification_state: {
      required: ["pnpm --filter @ema/cli typecheck", "pnpm --filter @ema/cli build", "node tooling/hermes-harness-cli-smoke.mjs"],
      latest_reports: reports.slice(0, 3)
    },
    next_actions: nextActions(recommendedLane?.id ?? null, blockedWork.length)
  };
  if (json) {
    emitJson({
      ok: true,
      command: `hermes ${verb}`,
      actor,
      projection: "hermes.orchestrator",
      workspace: summary,
      daemon_recent: daemonRecent,
      resume_packet: resumePacket,
      handoffs
    });
    return 0;
  }
  emitPretty("hermes orchestrator");
  emitPretty(`actor: ${actor}`);
  emitPretty(`recommended lane: ${recommendedLane?.id ?? "(none)"}`);
  for (const action of resumePacket.next_actions) emitPretty(`  - ${action}`);
  return 0;
}
async function runHermesPlan(args) {
  const json = flagBool(args, "json");
  const daemonRecent = await loadRecentWorkspaceTrail(args);
  const lane = flagString(args, "lane") ?? daemonRecent.lanes.find((candidate) => candidate.actor_id === HERMES_ACTOR && candidate.status !== "done")?.id ?? daemonRecent.lanes.find((candidate) => candidate.status !== "done")?.id ?? null;
  const plan = {
    goal: "Coordinate EMA work through Hermes while every action remains auditable through workspace and dispatch events.",
    lane,
    dispatches: [
      { provider: "simulated", lane, cwd: "Active builds/EMA-0.0.6", purpose: "prove Harness Glue event normalization" },
      { provider: "codex", lane, cwd: "Active builds/EMA-0.0.6", purpose: "future PTY adapter implementation", status: "planned" },
      { provider: "claude-code", lane, cwd: "Active builds/EMA-0.0.6", purpose: "future PTY adapter implementation", status: "planned" }
    ],
    verification: ["ema hermes orient --json", "ema harness providers --json", "ema harness dispatch --provider simulated --json", "ema peer doctor --json"],
    risks: daemonRecent.queue.filter((item) => item.status === "blocked").map((item) => item.title)
  };
  if (json) emitJson({ ok: true, command: "hermes plan", projection: "hermes.orchestrator", plan });
  else {
    emitPretty("hermes plan");
    for (const dispatch of plan.dispatches) emitPretty(`  - ${dispatch.provider}: ${dispatch.purpose}`);
  }
  return 0;
}
async function runHermesSweep(args) {
  const json = flagBool(args, "json");
  const daemonRecent = await loadRecentWorkspaceTrail(args);
  const staleLanes = daemonRecent.lanes.filter((lane) => !lane.actor_id && lane.status !== "done").slice(0, 5);
  const lostThreads = staleLanes.map((lane) => ({
    title: `Resume or retire lane: ${lane.title}`,
    why: "Hermes sweep found an unowned non-done lane that can become lost work.",
    depends_on: lane.depends_on ?? null,
    blocked_by: null,
    done_when: lane.done_when ?? "lane is claimed, closed, or converted into a queue item with an owner",
    source: `hermes.sweep:${lane.id}`,
    lane_id: lane.id
  }));
  const sweep = { lost_threads: lostThreads, queue_command: "ema queue add --title <title> --why <why> --done-when <done_when> --source <source> --json" };
  if (json) emitJson({ ok: true, command: "hermes sweep", projection: "hermes.orchestrator", sweep });
  else {
    emitPretty(`lost threads: ${lostThreads.length}`);
    for (const thread of lostThreads) emitPretty(`  - ${thread.title}`);
  }
  return 0;
}
function runHermesDispatch(args) {
  const provider = flagString(args, "provider") ?? "simulated";
  const lane = flagString(args, "lane") ?? null;
  const prompt = flagString(args, "prompt") ?? "Hermes planned dispatch";
  const dispatch = {
    provider,
    lane,
    prompt,
    next_cli: `ema harness dispatch --provider ${provider}${lane ? ` --lane ${lane}` : ""} --prompt "${prompt}" --json`
  };
  if (flagBool(args, "json")) emitJson({ ok: true, command: "hermes dispatch", projection: "hermes.orchestrator", dispatch });
  else emitPretty(dispatch.next_cli);
  return 0;
}
function runHermesPending(args, verb) {
  const payload = {
    ok: true,
    command: `hermes ${verb}`,
    status: "reserved_writer",
    projection: "hermes.orchestrator",
    note: "Hermes handoff/audit grammar is reserved; canonical writes should flow through handoff/agent/harness events."
  };
  if (flagBool(args, "json")) emitJson(payload);
  else emitPretty(payload.note);
  return 0;
}
function nextActions(lane, blockedCount) {
  if (lane) {
    return [
      `ema lane show --lane ${lane} --json`,
      "ema harness providers --json",
      'ema harness dispatch --provider simulated --lane <lane> --cwd "Active builds/EMA-0.0.6" --prompt "prove Harness Glue" --json'
    ];
  }
  if (blockedCount > 0) return ["ema hermes sweep --json", "ema queue list --status blocked --json", "ema problem --help"];
  return ["ema lane list --json", "ema hermes plan --json", "ema vcalendar tick --json"];
}

// src/commands/harness.ts
import { createHash as createHash2 } from "crypto";
import { closeSync, existsSync as existsSync6, fsyncSync, mkdirSync as mkdirSync3, openSync, readFileSync as readFileSync5, readdirSync as readdirSync4, writeFileSync as writeFileSync3, writeSync } from "fs";
import { join as join5, relative as relative3 } from "path";
import { spawnSync as spawnSync2 } from "child_process";

// src/commands/capability-roundtrip-cache.ts
import { existsSync as existsSync5, mkdirSync as mkdirSync2, readFileSync as readFileSync4, writeFileSync as writeFileSync2 } from "fs";
import { dirname as dirname2, join as join4 } from "path";
var CACHE_ROOT = join4(EMA_ACTIVE_BUILD, ".ema-dev", "capability-roundtrips");
var CODEX_ROUNDTRIP_PROOF_PATH = join4(EMA_ACTIVE_BUILD, ".ema-dev", "codex-roundtrip", "last-proof.json");
var CODEX_ROUNDTRIP_PROOF_TTL_MS = 7 * 24 * 60 * 60 * 1e3;
function roundtripCachePath(provider) {
  return join4(CACHE_ROOT, `${provider}.json`);
}
function readFreshRoundtrip(provider, ttlMs = CODEX_ROUNDTRIP_PROOF_TTL_MS) {
  if (provider === "codex") {
    const proof = readFreshCodexRoundtripProof(ttlMs);
    if (!proof.ok) return { ok: false, reason: proof.reason, entry: null };
    return {
      ok: true,
      entry: {
        provider: "codex",
        completed_at: proof.proof.passed_at,
        evidence: `proof ${proof.proof.execution_id} via ${proof.proof.session_file_path}`,
        ttl_seconds: Math.round(ttlMs / 1e3)
      },
      age_ms: proof.age_ms
    };
  }
  const path2 = roundtripCachePath(provider);
  if (!existsSync5(path2)) return { ok: false, reason: "missing recent successful roundtrip", entry: null };
  try {
    const entry = JSON.parse(readFileSync4(path2, "utf8"));
    const completedAt = Date.parse(entry.completed_at);
    if (!Number.isFinite(completedAt)) return { ok: false, reason: "cached roundtrip timestamp is invalid", entry };
    const age = Date.now() - completedAt;
    if (age > ttlMs) return { ok: false, reason: `cached roundtrip is stale (${Math.round(age / 1e3)}s old)`, entry };
    return { ok: true, entry, age_ms: age };
  } catch (err) {
    return {
      ok: false,
      reason: `cached roundtrip could not be read: ${err instanceof Error ? err.message : String(err)}`,
      entry: null
    };
  }
}
function readFreshCodexRoundtripProof(ttlMs = CODEX_ROUNDTRIP_PROOF_TTL_MS) {
  if (!existsSync5(CODEX_ROUNDTRIP_PROOF_PATH)) {
    return { ok: false, reason: `missing Codex roundtrip proof at ${CODEX_ROUNDTRIP_PROOF_PATH}`, proof: null };
  }
  try {
    const proof = JSON.parse(readFileSync4(CODEX_ROUNDTRIP_PROOF_PATH, "utf8"));
    const passedAt = Date.parse(proof.passed_at);
    if (!Number.isFinite(passedAt)) return { ok: false, reason: "Codex roundtrip proof timestamp is invalid", proof };
    const age = Date.now() - passedAt;
    if (age > ttlMs) return { ok: false, reason: `Codex roundtrip proof is stale (${Math.round(age / 1e3)}s old)`, proof };
    if (!proof.events_observed?.includes("execution.completed")) {
      return { ok: false, reason: "Codex roundtrip proof does not include execution.completed", proof };
    }
    return { ok: true, proof, age_ms: age };
  } catch (err) {
    return {
      ok: false,
      reason: `Codex roundtrip proof could not be read: ${err instanceof Error ? err.message : String(err)}`,
      proof: null
    };
  }
}
function writeCodexRoundtripProof(proof) {
  mkdirSync2(dirname2(CODEX_ROUNDTRIP_PROOF_PATH), { recursive: true });
  writeFileSync2(CODEX_ROUNDTRIP_PROOF_PATH, JSON.stringify(proof, null, 2) + "\n");
  return proof;
}

// src/commands/pipeline-store.ts
function parsePayload2(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
function payloadObject(value) {
  const parsed = parsePayload2(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}
function tableExists(table) {
  return sqliteJson(
    CANONICAL_DB,
    `select name from sqlite_master where type='table' and name='${sqlEscape(table)}' limit 1;`
  ).length > 0;
}
function actorById(actorId) {
  return actorRecords().find((actor) => actor.actor_id === actorId) ?? null;
}
function actorRecords() {
  const rows = sqliteJson(CANONICAL_DB, `
    select txid, event_id, kind, ts, actor, org_id, space_id, project_id,
           dispatch_id, execution_id, payload_json
    from events
    where kind = 'actor.created'
    order by txid asc;
  `);
  const byId = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const payload = payloadObject(row.payload_json);
    const actorId = stringField(payload, "actor_id") ?? stringField(payload, "id");
    if (!actorId) continue;
    byId.set(actorId, {
      id: actorId,
      actor_id: actorId,
      kind: stringField(payload, "kind") ?? "unknown",
      display_name: stringField(payload, "display_name") ?? actorId,
      role: stringField(payload, "role"),
      dispatch: stringField(payload, "dispatch"),
      perspective: stringField(payload, "perspective"),
      created_at: row.ts,
      created_by: row.actor
    });
  }
  return [...byId.values()];
}
function eventsMentioning(id) {
  return sqliteJson(CANONICAL_DB, `
    select txid, event_id, kind, ts, actor, org_id, space_id, project_id,
           dispatch_id, execution_id, payload_json
    from events
    where actor = '${sqlEscape(id)}'
       or payload_json like '%${sqlEscape(id)}%'
    order by txid asc;
  `).map((row) => ({ ...row, payload: parsePayload2(row.payload_json) }));
}
function intentById(intentId) {
  const fromTable = tableExists("intents") ? sqliteJson(CANONICAL_DB, `
        select intent_id, slug, title, body, kind, status, project_id, space_id,
               actor_id, exit_condition, created_at, updated_at
        from intents
        where intent_id = '${sqlEscape(intentId)}'
        limit 1;
      `)[0] : null;
  if (fromTable) return normalizeIntentRow(fromTable);
  return intentFromEvents(intentId);
}
function intentRecords(filters = {}) {
  if (tableExists("intents")) {
    const where = [
      filters.project ? `project_id = '${sqlEscape(filters.project)}'` : null,
      filters.space ? `space_id = '${sqlEscape(filters.space)}'` : null,
      filters.actor ? `actor_id = '${sqlEscape(filters.actor)}'` : null,
      filters.status ? `status = '${sqlEscape(filters.status)}'` : null,
      filters.kind ? `kind = '${sqlEscape(filters.kind)}'` : null
    ].filter(Boolean);
    return sqliteJson(CANONICAL_DB, `
      select intent_id, slug, title, body, kind, status, project_id, space_id,
             actor_id, exit_condition, created_at, updated_at
      from intents
      ${where.length > 0 ? `where ${where.join(" and ")}` : ""}
      order by created_at desc;
    `).map(normalizeIntentRow);
  }
  return intentRecordsFromEvents().filter(
    (intent) => (!filters.project || intent.project_id === filters.project) && (!filters.space || intent.space_id === filters.space) && (!filters.actor || intent.actor_id === filters.actor) && (!filters.status || intent.status === filters.status) && (!filters.kind || intent.kind === filters.kind)
  );
}
function proposalById(proposalId) {
  const fromTable = tableExists("proposals") ? sqliteJson(CANONICAL_DB, `
        select proposal_id, intent_id, title, body, plan, status,
               approver_required, proposed_by_actor_id, approved_by_actor_id,
               rejected_by_actor_id, rationale, created_at, decided_at
        from proposals
        where proposal_id = '${sqlEscape(proposalId)}'
        limit 1;
      `)[0] : null;
  if (fromTable) return normalizeProposalRow(fromTable);
  return proposalFromEvents(proposalId);
}
function proposalRecords(filters = {}) {
  if (tableExists("proposals")) {
    const where = [
      filters.intent ? `intent_id = '${sqlEscape(filters.intent)}'` : null,
      filters.status ? `status = '${sqlEscape(filters.status)}'` : null
    ].filter(Boolean);
    return sqliteJson(CANONICAL_DB, `
      select proposal_id, intent_id, title, body, plan, status,
             approver_required, proposed_by_actor_id, approved_by_actor_id,
             rejected_by_actor_id, rationale, created_at, decided_at
      from proposals
      ${where.length > 0 ? `where ${where.join(" and ")}` : ""}
      order by created_at desc;
    `).map(normalizeProposalRow);
  }
  return proposalRecordsFromEvents().filter(
    (proposal) => (!filters.intent || proposal.intent_id === filters.intent) && (!filters.status || proposal.status === filters.status)
  );
}
function proposalsForIntent(intentId) {
  return proposalRecords({ intent: intentId });
}
function intentFromEvents(intentId) {
  return intentRecordsFromEvents().find((intent) => intent.intent_id === intentId) ?? null;
}
function intentRecordsFromEvents() {
  const rows = sqliteJson(CANONICAL_DB, `
    select txid, event_id, kind, ts, actor, org_id, space_id, project_id,
           dispatch_id, execution_id, payload_json
    from events
    where kind in ('intent.created', 'intent.updated')
    order by txid asc;
  `);
  const byId = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const payload = payloadObject(row.payload_json);
    const intentId = stringField(payload, "intent_id");
    if (!intentId) continue;
    if (row.kind === "intent.created") {
      byId.set(intentId, {
        id: intentId,
        intent_id: intentId,
        slug: stringField(payload, "slug") ?? intentId.toLowerCase(),
        title: stringField(payload, "title") ?? intentId,
        body: stringField(payload, "body"),
        kind: stringField(payload, "kind") ?? "feature",
        status: stringField(payload, "status") ?? "open",
        project_id: stringField(payload, "project_id"),
        space_id: stringField(payload, "space_id"),
        actor_id: stringField(payload, "actor_id") ?? row.actor,
        exit_condition: stringField(payload, "exit_condition"),
        created_at: stringField(payload, "created_at") ?? row.ts,
        updated_at: row.ts
      });
      continue;
    }
    const current = byId.get(intentId);
    if (!current) continue;
    byId.set(intentId, {
      ...current,
      title: stringField(payload, "title") ?? current.title,
      body: "body" in payload ? stringField(payload, "body") : current.body,
      status: stringField(payload, "status") ?? current.status,
      exit_condition: "exit_condition" in payload ? stringField(payload, "exit_condition") : current.exit_condition,
      updated_at: stringField(payload, "updated_at") ?? row.ts
    });
  }
  return [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}
function proposalFromEvents(proposalId) {
  return proposalRecordsFromEvents().find((proposal) => proposal.proposal_id === proposalId) ?? null;
}
function proposalRecordsFromEvents() {
  const rows = sqliteJson(CANONICAL_DB, `
    select txid, event_id, kind, ts, actor, org_id, space_id, project_id,
           dispatch_id, execution_id, payload_json
    from events
    where kind in ('proposal.drafted', 'proposal.created', 'proposal.approved', 'proposal.rejected')
    order by txid asc;
  `);
  const byId = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const payload = payloadObject(row.payload_json);
    const proposalId = stringField(payload, "proposal_id");
    if (!proposalId) continue;
    if (row.kind === "proposal.created" || row.kind === "proposal.drafted") {
      byId.set(proposalId, {
        id: proposalId,
        proposal_id: proposalId,
        intent_id: stringField(payload, "intent_id") ?? "",
        title: stringField(payload, "title") ?? proposalId,
        body: stringField(payload, "body"),
        plan: stringField(payload, "plan"),
        status: row.kind === "proposal.drafted" ? "drafted" : stringField(payload, "status") ?? "created",
        approver_required: boolField(payload, "approver_required") ?? row.kind !== "proposal.drafted",
        proposed_by_actor_id: stringField(payload, "proposed_by_actor_id") ?? stringField(payload, "draft_by") ?? row.actor,
        approved_by_actor_id: null,
        rejected_by_actor_id: null,
        rationale: null,
        created_at: stringField(payload, "created_at") ?? row.ts,
        decided_at: null
      });
      continue;
    }
    const current = byId.get(proposalId);
    if (!current) continue;
    if (row.kind === "proposal.approved") {
      byId.set(proposalId, {
        ...current,
        status: "approved",
        approved_by_actor_id: stringField(payload, "approved_by_actor_id") ?? row.actor,
        rationale: stringField(payload, "rationale"),
        decided_at: stringField(payload, "approved_at") ?? row.ts
      });
    } else if (row.kind === "proposal.rejected") {
      byId.set(proposalId, {
        ...current,
        status: "rejected",
        rejected_by_actor_id: stringField(payload, "rejected_by_actor_id") ?? row.actor,
        rationale: stringField(payload, "rationale"),
        decided_at: stringField(payload, "rejected_at") ?? row.ts
      });
    }
  }
  return [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}
function normalizeIntentRow(row) {
  return {
    id: row.intent_id,
    intent_id: row.intent_id,
    slug: row.slug,
    title: row.title,
    body: row.body,
    kind: row.kind,
    status: row.status,
    project_id: row.project_id,
    space_id: row.space_id,
    actor_id: row.actor_id,
    exit_condition: row.exit_condition,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
function normalizeProposalRow(row) {
  return {
    id: row.proposal_id,
    proposal_id: row.proposal_id,
    intent_id: row.intent_id,
    title: row.title,
    body: row.body,
    plan: row.plan,
    status: row.status,
    approver_required: boolish(row.approver_required),
    proposed_by_actor_id: row.proposed_by_actor_id,
    approved_by_actor_id: row.approved_by_actor_id,
    rejected_by_actor_id: row.rejected_by_actor_id,
    rationale: row.rationale,
    created_at: row.created_at,
    decided_at: row.decided_at
  };
}
function stringField(payload, key) {
  const value = payload[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}
function boolField(payload, key) {
  const value = payload[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value === "true" || value === "1";
  return null;
}
function boolish(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return value === "1" || value === "true";
}

// src/commands/harness.ts
var DEFAULT_ORG5 = "org:01J00000000000000000000001";
var DEFAULT_ACTOR5 = "actor:harness-cli";
var PROVIDERS = [
  {
    id: "simulated",
    kind: "local",
    status: "ready",
    source: "ema-cli",
    capabilities: ["dispatch", "stream", "stop", "events"],
    normalized_events: ["dispatch.started", "execution.started", "tool.returned", "execution.ended", "dispatch.ended"]
  },
  {
    id: "codex",
    kind: "pty",
    status: "adapter_available",
    source: "duct-tape-onion-harness",
    capabilities: ["dispatch", "start", "list", "log", "context", "events", "grep", "stream", "stop"],
    normalized_events: ["dispatch.started", "execution.started", "tool.invoked", "tool.returned", "execution.completed", "execution.failed", "execution.timeout", "dispatch.ended"]
  },
  {
    id: "claude-code",
    kind: "pty",
    status: "unsupported_provider_adapter",
    source: "duct-tape-onion-harness",
    capabilities: ["dispatch", "start", "list", "log", "context", "events", "grep", "stream", "stop"],
    normalized_events: ["dispatch.started", "execution.started", "tool.invoked", "tool.returned", "execution.ended", "dispatch.ended"]
  },
  {
    id: "hermes",
    kind: "cli",
    status: "unsupported_provider_adapter",
    source: "future-hermes",
    capabilities: ["dispatch", "stream", "handoff"],
    normalized_events: ["dispatch.started", "execution.started", "tool.returned", "execution.ended", "dispatch.ended"]
  }
];
var DONORS = [
  {
    id: "duct-tape-onion-harness",
    active_build: "Active builds/duct-tape-onion-harness",
    role: "provider/session lifecycle, WebSocket transport, adapters, PTY and SDK scaffolding",
    status: "donor_ready"
  },
  {
    id: "chronicle",
    active_build: "Active builds/chronicle",
    role: "activity parsing, ingestion, indexing, search, timeline projections",
    status: "donor_ready"
  }
];
function runHarness(args) {
  const verb = args.positional[0] ?? "providers";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return runHarnessHelp(args);
  if (verb === "providers" || verb === "sessions") return runProviders(args, verb);
  if (verb === "status") return runStatus3(args);
  if (verb === "start") return runStart(args);
  if (verb === "list") return runList3(args);
  if (verb === "assign" || verb === "bind") return runAssign(args);
  if (verb === "context" || verb === "ctx") return runContext(args);
  if (verb === "events") return runEvents2(args);
  if (verb === "grep") return runGrep(args);
  if (verb === "log") return runLog(args);
  if (verb === "dispatch") return runDispatch(args);
  if (verb === "stream") return runStream(args);
  if (verb === "stop") return runStop(args);
  if (verb === "search") return runSearch2(args);
  if (verb === "donors") return runDonors(args);
  emitError(`ema harness: unknown subcommand "${verb}" (expected: providers | sessions | donors | status | start | list | assign | context | events | grep | log | dispatch | stream | stop | search)`);
  return 64;
}
function runHarnessHelp(args) {
  const commands = [
    { verb: "providers", summary: "List Harness Glue providers and normalized event rails." },
    { verb: "sessions", summary: "List provider session capabilities (first slice mirrors providers)." },
    { verb: "status", summary: "Summarize Harness Glue readiness, pending daemon projections, and next adapter work." },
    { verb: "donors", summary: "Show Chronicle and Duct Tape donor roles for future Hermes preparation." },
    { verb: "start", summary: "Start a long-running Codex or Claude worker in a tmux-backed Harness session." },
    { verb: "list", summary: "List file-backed Harness Glue execution records, filterable by --lane." },
    { verb: "assign", summary: "Assign an existing Harness execution/session to a lane." },
    { verb: "context", summary: "Return latest status, registry record, events, and recent session output for an execution or lane." },
    { verb: "events", summary: "Read Harness Glue event log entries for an execution or lane." },
    { verb: "grep", summary: "Ripgrep over registry, event log, and captured session output." },
    { verb: "log", summary: "Capture recent tmux output for a Harness execution." },
    { verb: "dispatch", summary: "Dispatch work to a provider; simulated provider is ready now." },
    { verb: "stream", summary: "Stream normalized execution/tool events for an execution." },
    { verb: "stop", summary: "Request execution stop and emit an audit-friendly event." },
    { verb: "search", summary: "Search Chronicle/Harness activity once chronicle.activity is daemon-backed." }
  ];
  if (flagBool(args, "json")) {
    emitJson({ noun: "harness", status: "preparing_for_hermes", commands, projections: projections(), donors: DONORS });
    return 0;
  }
  emitPretty("ema harness \u2014 Harness Glue preparation rail");
  for (const command of commands) emitPretty(`  ${command.verb.padEnd(10)} ${command.summary}`);
  return 0;
}
function runProviders(args, verb) {
  const payload = {
    ok: true,
    command: `harness ${verb}`,
    status: "preparing_for_hermes",
    projections: projections(),
    providers: PROVIDERS,
    donors: DONORS,
    note: "Harness Glue prepares the Chronicle + Duct Tape runtime substrate that a future Hermes orchestrator can consume."
  };
  if (flagBool(args, "json")) emitJson(payload);
  else {
    emitPretty("harness providers");
    for (const provider of PROVIDERS) emitPretty(`  - ${provider.id}: ${provider.status}`);
  }
  return 0;
}
function runDonors(args) {
  const payload = {
    ok: true,
    command: "harness donors",
    status: "preparing_for_hermes",
    donors: DONORS,
    boundary: "This CLI is not Hermes. It exposes provider/session and activity rails for a future Hermes orchestrator."
  };
  if (flagBool(args, "json")) emitJson(payload);
  else {
    emitPretty("harness donors");
    for (const donor of DONORS) emitPretty(`  - ${donor.id}: ${donor.role}`);
  }
  return 0;
}
function runStatus3(args) {
  const readyProviders = PROVIDERS.filter((provider) => provider.status === "ready");
  const pendingProviders = PROVIDERS.filter((provider) => provider.status !== "ready");
  const payload = {
    ok: true,
    command: "harness status",
    status: "preparing_for_hermes",
    boundary: "Harness Glue is usable preparation rail, not Hermes authority.",
    readiness: {
      usable_now: ["harness.providers", "harness.donors", "simulated dispatch", "tmux-backed worker session planning", "lane-assigned sessions", "session context snapshots", "event log replay", "tool timeline replay", "session grep", "stop audit event"],
      pending_daemon_projections: ["dispatch.registry", "execution.registry", "tool.timeline", "chronicle.activity"],
      pending_provider_adapters: pendingProviders.map((provider) => provider.id)
    },
    providers: {
      ready: readyProviders.map((provider) => provider.id),
      pending: pendingProviders.map((provider) => ({ id: provider.id, status: provider.status, source: provider.source }))
    },
    donors: DONORS,
    next_actions: [
      "Use ema harness context --lane lane:<id> --json to recover assigned sessions, latest logs, and event context.",
      "Use ema harness grep --lane lane:<id> --query <text> --json to search session logs and Harness records.",
      "Back dispatch.registry/execution.registry/tool.timeline/chronicle.activity with daemon canonical events before real PTY adapters.",
      "Expose one unified Harness Glue vApp once daemon projections are readable from web."
    ]
  };
  if (flagBool(args, "json")) emitJson(payload);
  else {
    emitPretty("harness status");
    emitPretty(`  status: ${payload.status}`);
    emitPretty(`  ready providers: ${payload.providers.ready.join(", ") || "none"}`);
    emitPretty(`  pending daemon projections: ${payload.readiness.pending_daemon_projections.join(", ")}`);
  }
  return 0;
}
function runStart(args) {
  const provider = flagString(args, "provider") ?? "simulated";
  if (provider !== "codex" && provider !== "claude-code") {
    emitError("ema harness start: --provider must be codex or claude-code for long-running workers");
    return 64;
  }
  const cwd = flagString(args, "cwd") ?? process.cwd();
  const prompt = flagString(args, "prompt") ?? "Continue EMA Harness Glue work. Orient, claim scope, verify, report, and keep running until blocked.";
  const name = flagString(args, "name") ?? `${provider}-worker`;
  const lane = flagString(args, "lane") ?? null;
  const actor = flagString(args, "actor") ?? (provider === "codex" ? "actor:codex" : "actor:claude-code");
  const executionId = `execution:harness:${stableId2(`${provider}:${name}:${cwd}:${Date.now()}`)}`;
  const dispatchId = `dispatch:harness:${stableId2(`${provider}:${prompt}:${Date.now()}`)}`;
  const session = sanitizeSession(`ema-${provider}-${name}-${stableId2(executionId)}`);
  const command = providerCommand(provider, cwd, prompt);
  const record = {
    ok: true,
    command: "harness start",
    status: flagBool(args, "dry-run") ? "dry_run" : "running",
    daemon_authority: "file_backed_harness_registry",
    backend: "file_backed_tmux_registry",
    provider,
    actor,
    lane,
    cwd,
    prompt_summary: summarize(prompt),
    dispatch: { id: dispatchId, status: flagBool(args, "dry-run") ? "planned" : "started" },
    execution: { id: executionId, status: flagBool(args, "dry-run") ? "planned" : "running", tmux_session: session },
    events: [
      { type: "dispatch.started", dispatch_id: dispatchId, execution_id: executionId, lane_id: lane, provider, actor_id: actor },
      { type: "execution.started", dispatch_id: dispatchId, execution_id: executionId, lane_id: lane, provider, actor_id: actor }
    ],
    paths: { registry: registryPath(executionId), event_log: eventLogPath(), lane_assignment: lane ? laneAssignmentPath(lane) : null },
    commands: {
      tmux_session: session,
      launch: command,
      context: `ema harness context --execution ${executionId} --json`,
      events: `ema harness events --execution ${executionId} --json`,
      grep: `ema harness grep --execution ${executionId} --query <text> --json`,
      log: `ema harness log --execution ${executionId} --json`,
      stop: `ema harness stop --execution ${executionId} --json`
    },
    lane_assignment: lane ? { lane_id: lane, execution_id: executionId, session_id: session, actor_id: actor, provider } : null
  };
  if (!flagBool(args, "dry-run")) {
    const created = spawnSync2("tmux", ["new-session", "-d", "-s", session, "-x", "140", "-y", "40"], { encoding: "utf8" });
    if (created.status !== 0) {
      emitError(`ema harness start: tmux new-session failed: ${created.stderr || created.stdout}`);
      return 1;
    }
    const sent = spawnSync2("tmux", ["send-keys", "-t", session, command, "Enter"], { encoding: "utf8" });
    if (sent.status !== 0) {
      emitError(`ema harness start: tmux send-keys failed: ${sent.stderr || sent.stdout}`);
      return 1;
    }
    if (provider === "claude-code") {
      spawnSync2("tmux", ["send-keys", "-t", session, prompt, "Enter"], { encoding: "utf8" });
    }
    writeRecord(record);
    appendEvents(record.events);
    if (lane) upsertLaneAssignment(lane, record);
  }
  if (flagBool(args, "json")) emitJson(record);
  else emitPretty(`${provider} running in tmux session ${session}`);
  return 0;
}
function runList3(args) {
  const lane = flagString(args, "lane");
  let records = readRecords2();
  if (lane) records = records.filter((record) => record.lane === lane || record.lane_assignment?.lane_id === lane);
  const payload = {
    ok: true,
    command: "harness list",
    backend: "file_backed_tmux_registry",
    daemon_authority: "file_backed_harness_registry",
    lane: lane ?? null,
    lane_assignments: lane ? readLaneAssignment(lane) : readLaneAssignments(),
    executions: records.map((record) => enrichRecordStatus(record))
  };
  if (flagBool(args, "json")) emitJson(payload);
  else for (const record of payload.executions) emitPretty(`${record.execution?.id ?? "execution:unknown"} ${record.provider ?? "unknown"} ${record.execution?.tmux_session ?? "no-session"} ${record.runtime?.tmux ?? "unknown"} ${record.status ?? "unknown"}`);
  return 0;
}
function runAssign(args) {
  const lane = flagString(args, "lane");
  const execution = flagString(args, "execution");
  if (!lane || !execution) {
    emitError("ema harness assign: --lane and --execution are required");
    return 64;
  }
  const record = readRecord(execution);
  if (!record) {
    emitError(`ema harness assign: execution record not found: ${execution}`);
    return 1;
  }
  const updated = { ...record, lane, lane_assignment: { lane_id: lane, execution_id: execution, session_id: record.execution?.tmux_session ?? null, actor_id: record.actor ?? null, provider: record.provider ?? null } };
  const event = { type: "harness.session.assigned", execution_id: execution, lane_id: lane, provider: record.provider ?? null, actor_id: record.actor ?? null, tmux_session: record.execution?.tmux_session ?? null, recorded_at: (/* @__PURE__ */ new Date()).toISOString() };
  if (!flagBool(args, "dry-run")) {
    writeRecord(updated);
    upsertLaneAssignment(lane, updated);
    appendEvents([event]);
  }
  const payload = { ok: true, command: "harness assign", status: flagBool(args, "dry-run") ? "dry_run" : "assigned", daemon_authority: "file_backed_harness_registry", lane_id: lane, execution_id: execution, assignment: updated.lane_assignment, event };
  if (flagBool(args, "json")) emitJson(payload);
  else emitPretty(`${execution} assigned to ${lane}`);
  return 0;
}
function runContext(args) {
  const execution = flagString(args, "execution");
  const lane = flagString(args, "lane");
  const lines = Number(flagString(args, "lines") ?? "120");
  const records = recordsForSelector(execution, lane).map((record) => {
    const enriched = enrichRecordStatus(record);
    const session = enriched.execution?.tmux_session;
    return {
      ...enriched,
      recent_output: session ? captureTmux(session, lines) : null,
      events: readEvents({ execution: enriched.execution?.id, lane: enriched.lane ?? enriched.lane_assignment?.lane_id ?? null })
    };
  });
  const payload = {
    ok: true,
    command: "harness context",
    backend: "file_backed_tmux_registry",
    daemon_authority: "file_backed_harness_registry",
    selector: { execution: execution ?? null, lane: lane ?? null },
    lane_assignment: lane ? readLaneAssignment(lane) : null,
    executions: records
  };
  if (flagBool(args, "json")) emitJson(payload);
  else for (const record of records) emitPretty(`${record.execution?.id ?? "execution:unknown"} ${record.runtime?.tmux ?? "unknown"}
${record.recent_output?.output ?? ""}`);
  return 0;
}
function runEvents2(args) {
  const execution = flagString(args, "execution");
  const lane = flagString(args, "lane");
  const payload = { ok: true, command: "harness events", backend: "file_backed_event_log", daemon_authority: "file_backed_harness_registry", selector: { execution: execution ?? null, lane: lane ?? null }, events: readEvents({ execution, lane }) };
  if (flagBool(args, "json")) emitJson(payload);
  else for (const event of payload.events) emitPretty(`${event.recorded_at ?? ""} ${event.type} ${event.execution_id ?? ""}`);
  return 0;
}
function runGrep(args) {
  const query = flagString(args, "query") ?? flagString(args, "q");
  if (!query) {
    emitError("ema harness grep: --query is required");
    return 64;
  }
  const execution = flagString(args, "execution");
  const lane = flagString(args, "lane");
  const bundle = writeSearchBundle(recordsForSelector(execution, lane));
  const rg = spawnSync2("rg", ["--json", query, bundle], { encoding: "utf8" });
  const matches = (rg.stdout || "").trim().split("\n").filter(Boolean).map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return { type: "parse_error", raw: line };
    }
  }).filter((entry) => entry.type === "match");
  const payload = { ok: rg.status === 0 || rg.status === 1, command: "harness grep", backend: "ripgrep_search_bundle", daemon_authority: "file_backed_harness_registry", selector: { execution: execution ?? null, lane: lane ?? null }, query, bundle, matches };
  if (flagBool(args, "json")) emitJson(payload);
  else emitPretty(matches.map((match) => match.data?.lines?.text ?? "").join(""));
  return payload.ok ? 0 : 1;
}
function runLog(args) {
  const execution = flagString(args, "execution");
  if (!execution) {
    emitError("ema harness log: --execution is required");
    return 64;
  }
  const record = readRecord(execution);
  const session = flagString(args, "session") ?? record?.execution?.tmux_session;
  if (!session) {
    emitError(`ema harness log: no tmux session found for ${execution}`);
    return 1;
  }
  const captured = spawnSync2("tmux", ["capture-pane", "-t", session, "-p", "-S", flagString(args, "lines") ? `-${flagString(args, "lines")}` : "-80"], { encoding: "utf8" });
  const payload = { ok: captured.status === 0, command: "harness log", execution_id: execution, tmux_session: session, output: captured.stdout, error: captured.stderr || null };
  if (flagBool(args, "json")) emitJson(payload);
  else emitPretty(captured.stdout || captured.stderr || "");
  return captured.status === 0 ? 0 : 1;
}
async function runDispatch(args) {
  const provider = flagString(args, "provider") ?? "simulated";
  const found = PROVIDERS.find((candidate) => candidate.id === provider);
  if (!found) {
    emitError(`ema harness dispatch: unknown provider "${provider}"`);
    return 64;
  }
  const lane = flagString(args, "lane") ?? null;
  const cwd = flagString(args, "cwd") ?? process.cwd();
  const prompt = flagString(args, "prompt") ?? "";
  const intentId = flagString(args, "intent") ?? null;
  if (provider === "codex") return runCodexDispatch(args, { provider, lane, cwd, prompt, intentId });
  if (provider !== "simulated") {
    const pending = {
      ok: false,
      command: "harness dispatch",
      status: "unsupported_provider_adapter",
      provider,
      lane,
      cwd,
      prompt,
      required_capability: `${provider} PTY/SDK adapter`,
      remediation: "Use --provider simulated until the guarded PTY/SDK adapter is implemented."
    };
    if (flagBool(args, "json")) emitJson(pending);
    else emitPretty(`${provider} adapter unsupported in this build; simulated provider is ready`);
    return 1;
  }
  const org = flagString(args, "org") ?? DEFAULT_ORG5;
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR5;
  const intent = prompt.length > 0 ? summarize(prompt) : "harness dispatch";
  const useDaemon = !flagBool(args, "no-daemon");
  if (useDaemon) {
    const daemonResult = await tryDaemonDispatch({
      org,
      actor,
      provider,
      intent,
      lane,
      cwd,
      prompt
    });
    if (daemonResult.ok) {
      if (flagBool(args, "json")) emitJson(daemonResult.payload);
      else emitPretty(`execution: ${daemonResult.payload.execution.id}`);
      return 0;
    }
    if (daemonResult.fallback === false) {
      emitError(`ema harness dispatch: ${daemonResult.error}`);
      return 1;
    }
  }
  const executionId = `execution:simulated:${stableId2(`${lane ?? "no-lane"}:${cwd}:${prompt}`)}`;
  const events2 = timeline(executionId, lane, cwd, prompt);
  const payload = {
    ok: true,
    command: "harness dispatch",
    provider,
    status: "simulated_execution_completed",
    source: "client_side_fallback",
    projections: ["dispatch.registry", "execution.registry", "tool.timeline", "chronicle.activity"],
    dispatch: { id: `dispatch:simulated:${stableId2(prompt || executionId)}`, lane, cwd, prompt },
    execution: { id: executionId, provider, status: "completed", lane, cwd },
    events: events2
  };
  if (flagBool(args, "json")) emitJson(payload);
  else emitPretty(`execution: ${executionId}`);
  return 0;
}
async function runCodexDispatch(args, spec) {
  const json = flagBool(args, "json");
  const promptFile = flagString(args, "prompt-file");
  const mode = flagString(args, "mode") ?? "plan";
  const approvedProposal = spec.intentId ? approvedProposalForIntent(spec.intentId) : null;
  if (approvedProposal && !approvedProposal.ok) {
    return emitCodexDispatchFailure(json, approvedProposal.status, approvedProposal.message);
  }
  if (!promptFile && !spec.prompt && !spec.intentId) {
    emitError("ema harness dispatch --provider codex: --prompt-file or --prompt is required");
    return 64;
  }
  const proposalId = approvedProposal?.ok ? approvedProposal.proposal.proposal_id : null;
  const prompt = promptFile ? readFileSync5(promptFile, "utf8") : spec.prompt || promptForApprovedIntent(spec.intentId, proposalId);
  const org = flagString(args, "org") ?? DEFAULT_ORG5;
  const actor = flagString(args, "actor") ?? "actor:01J00000000000000000000003";
  const intent = spec.intentId ?? summarize(prompt);
  const dryRun = flagBool(args, "dry-run");
  const useDaemon = !flagBool(args, "no-daemon");
  const started = (/* @__PURE__ */ new Date()).toISOString();
  let dispatchId = `dispatch:codex:${stableId2(`${spec.cwd}:${prompt}:${Date.now()}`)}`;
  let executionId = `execution:codex:${stableId2(`${dispatchId}:${mode}`)}`;
  const daemonEvents = [];
  if (useDaemon) {
    const opened = await openCodexDaemonLineage({ org, actor, provider: "codex", intent, lane: spec.lane, mode });
    if (!opened.ok) {
      const payload = {
        ok: false,
        command: "harness dispatch",
        provider: "codex",
        status: "daemon_lineage_failed",
        error: opened.error,
        remediation: "Retry with --no-daemon for local-only dry inspection, or restart the EMA daemon."
      };
      if (json) emitJson(payload);
      else emitError(`codex dispatch: ${opened.error}`);
      return 1;
    }
    dispatchId = opened.dispatch_id;
    executionId = opened.execution_id;
    daemonEvents.push(...opened.events);
  }
  if (dryRun) {
    const payload = {
      ok: true,
      command: "harness dispatch",
      provider: "codex",
      status: "dry_run",
      mode,
      source: useDaemon ? "daemon_canonical_planned" : "local_planned",
      dispatch: { id: dispatchId, lane: spec.lane, cwd: spec.cwd, prompt_file: promptFile ?? null, intent, proposal_id: proposalId },
      execution: { id: executionId, provider: "codex", status: "planned", lane: spec.lane, cwd: spec.cwd },
      events: daemonEvents,
      argv: codexExecArgv(spec.cwd, prompt)
    };
    if (json) emitJson(payload);
    else emitPretty(`planned codex execution: ${executionId}`);
    return 0;
  }
  const timeoutMs = Number.parseInt(flagString(args, "timeout-ms") ?? "60000", 10);
  const promptHash = sha2562(prompt);
  const sessionFilePath = codexSessionFilePath(executionId);
  const sessionFileRelative = relative3(EMA_ACTIVE_BUILD, sessionFilePath);
  const result = spawnSync2("codex", codexExecArgv(spec.cwd, prompt).slice(1), {
    cwd: spec.cwd,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    timeout: timeoutMs
  });
  const ended = (/* @__PURE__ */ new Date()).toISOString();
  const timedOut = isTimeoutResult(result);
  const exitCode = typeof result.status === "number" ? result.status : timedOut ? -1 : 1;
  const ok = !timedOut && exitCode === 0;
  const outcome = timedOut ? "timeout" : ok ? "completed" : "failed";
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  writeCodexJsonl(sessionFilePath, stdout);
  const durationMs = Date.parse(ended) - Date.parse(started);
  let canonicalCloseError = null;
  let canonId = null;
  if (useDaemon) {
    const closed = await closeCodexDaemonLineage({
      org,
      actor,
      provider: "codex",
      dispatchId,
      executionId,
      outcome,
      exitCode,
      timeoutMs,
      durationMs,
      stdout,
      stderr,
      sessionFilePath: sessionFileRelative,
      promptHash,
      intentId: spec.intentId,
      proposalId
    });
    daemonEvents.push(...closed.events);
    if (closed.ok) canonId = closed.canon_id;
    if (!closed.ok) canonicalCloseError = closed.error;
  }
  const eventTypes = daemonEvents.map((event) => event.type);
  const canonicalCompleted = useDaemon ? canonicalCloseError === null && eventTypes.includes("execution.completed") : true;
  const recordOk = ok && canonicalCompleted;
  const record = {
    ok: recordOk,
    command: "harness dispatch",
    provider: "codex",
    status: canonicalCloseError ? "canonical_close_failed" : outcome,
    source: useDaemon ? "daemon_canonical" : "local_codex_exec",
    mode,
    actor,
    lane: spec.lane,
    cwd: spec.cwd,
    prompt_summary: intent,
    dispatch: { id: dispatchId, status: canonicalCloseError ? "canonical_close_failed" : outcome },
    execution: { id: executionId, provider: "codex", status: outcome, started_at: started, ended_at: ended },
    canon_id: canonId,
    stdout,
    stderr,
    error: result.error ? String(result.error) : null,
    canonical_close_error: canonicalCloseError,
    exit_code: exitCode,
    duration_ms: durationMs,
    stdout_bytes: byteLength(stdout),
    stderr_bytes: byteLength(stderr),
    session_file_path: sessionFileRelative,
    prompt_hash: promptHash,
    invocation_flags: codexInvocationFlags(spec.cwd),
    events: daemonEvents
  };
  if (recordOk && useDaemon) {
    writeCodexRoundtripProof({
      passed_at: ended,
      execution_id: executionId,
      codex_version: codexVersion(),
      invocation_flags: codexInvocationFlags(spec.cwd),
      prompt_hash: promptHash,
      session_file_path: sessionFileRelative,
      events_observed: eventTypes,
      duration_ms: durationMs,
      smoke_version: 1
    });
  }
  writeRecord(record);
  if (spec.lane) upsertLaneAssignment(spec.lane, record);
  appendEvents([
    { type: "dispatch.started", dispatch_id: dispatchId, execution_id: executionId, lane_id: spec.lane, provider: "codex", actor_id: actor },
    { type: "execution.started", dispatch_id: dispatchId, execution_id: executionId, lane_id: spec.lane, provider: "codex", actor_id: actor },
    { type: outcome === "completed" ? "execution.completed" : outcome === "timeout" ? "execution.timeout" : "execution.failed", dispatch_id: dispatchId, execution_id: executionId, lane_id: spec.lane, provider: "codex", actor_id: actor, outcome }
  ]);
  if (json) emitJson(record);
  else emitPretty(`codex execution ${outcome}: ${executionId}`);
  return recordOk ? 0 : 1;
}
function codexExecArgv(cwd, prompt) {
  return [
    "codex",
    "exec",
    "--json",
    "--sandbox",
    "read-only",
    "--cd",
    cwd,
    "--ephemeral",
    prompt
  ];
}
function codexInvocationFlags(cwd) {
  return ["exec", "--json", "--sandbox", "read-only", "--cd", cwd, "--ephemeral"];
}
async function openCodexDaemonLineage(spec) {
  let client = null;
  try {
    client = await connect({ surface: "desktop" });
    const start = await client.command("dispatch.start", {
      org_id: spec.org,
      actor_id: spec.actor,
      intent: spec.intent,
      provider: spec.provider,
      lane_id: spec.lane
    });
    const startCheck = expectOk(start, "dispatch.start");
    if (startCheck) return { ok: false, error: startCheck };
    const dispatchId = start.resource;
    if (!dispatchId) return { ok: false, error: "dispatch.start returned no resource id" };
    const execStart = await client.command("execution.start", {
      org_id: spec.org,
      actor_id: spec.actor,
      dispatch_id: dispatchId,
      exec_kind: "session",
      name: `codex.${spec.mode}`,
      provider: spec.provider
    });
    const execStartCheck = expectOk(execStart, "execution.start");
    if (execStartCheck) return { ok: false, error: execStartCheck };
    const executionId = execStart.resource;
    if (!executionId) return { ok: false, error: "execution.start returned no resource id" };
    const tool = await client.command("tool.invoke", {
      org_id: spec.org,
      actor_id: spec.actor,
      dispatch_id: dispatchId,
      execution_id: executionId,
      tool_name: "codex.exec",
      args_json: JSON.stringify({ mode: spec.mode }),
      provider: spec.provider
    });
    const toolCheck = expectOk(tool, "tool.invoke");
    if (toolCheck) return { ok: false, error: toolCheck };
    return {
      ok: true,
      dispatch_id: dispatchId,
      execution_id: executionId,
      events: [
        { type: "dispatch.started", event_id: start.events?.[0] ?? "" },
        { type: "execution.started", event_id: execStart.events?.[0] ?? "" },
        { type: "tool.invoked", event_id: tool.events?.[0] ?? "" }
      ]
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    client?.close();
  }
}
function approvedProposalForIntent(intentId) {
  const intent = intentById(intentId);
  if (!intent) return { ok: false, status: "missing_intent", message: `intent not found: ${intentId}` };
  const approved = proposalsForIntent(intentId).find((proposal) => proposal.status === "approved");
  if (!approved) return { ok: false, status: "missing_approved_proposal", message: `intent ${intentId} has no approved proposal` };
  return { ok: true, proposal: approved };
}
function promptForApprovedIntent(intentId, proposalId) {
  if (!intentId) return "EMA Codex capability check.";
  const intent = intentById(intentId);
  const proposal = proposalId ? proposalsForIntent(intentId).find((candidate) => candidate.proposal_id === proposalId) : null;
  return [
    "EMA approved intent execution.",
    `Intent: ${intentId}`,
    intent?.title ? `Title: ${intent.title}` : null,
    intent?.body ? `Body: ${intent.body}` : null,
    proposal?.proposal_id ? `Approved proposal: ${proposal.proposal_id}` : null,
    proposal?.plan ? `Plan: ${proposal.plan}` : null,
    "Sandbox: read-only. Return a concise implementation-readiness result and name any files you inspected."
  ].filter(Boolean).join("\n");
}
function emitCodexDispatchFailure(json, status2, message) {
  const payload = {
    ok: false,
    command: "harness dispatch",
    provider: "codex",
    status: status2,
    error: { class: "invalid_args", message }
  };
  if (json) emitJson(payload);
  else emitError(`codex dispatch: ${message}`);
  return 1;
}
async function closeCodexDaemonLineage(spec) {
  let client = null;
  const events2 = [];
  let canonId = null;
  try {
    client = await connect({ surface: "desktop" });
    const toolReturn = await client.command("tool.return", {
      org_id: spec.org,
      actor_id: spec.actor,
      dispatch_id: spec.dispatchId,
      execution_id: spec.executionId,
      tool_name: "codex.exec",
      result_summary: `${spec.outcome}; stdout=${spec.stdout.length} bytes; stderr=${spec.stderr.length} bytes`
    });
    const toolReturnCheck = expectOk(toolReturn, "tool.return");
    if (toolReturnCheck) return { ok: false, events: events2, error: toolReturnCheck, canon_id: canonId };
    events2.push({ type: "tool.returned", event_id: firstEventId(toolReturn) });
    if (spec.outcome === "completed") {
      const canonBody = JSON.stringify({
        exit_code: spec.exitCode,
        summary: summarizeExecutionResult(spec.stdout, spec.stderr),
        jsonl_path: spec.sessionFilePath,
        tool_call_count: countCodexToolCalls(spec.stdout),
        duration_ms: spec.durationMs
      }, null, 2);
      const links = [
        spec.proposalId ? `result_of:${spec.proposalId}` : null,
        spec.intentId ? `fulfills:${spec.intentId}` : null
      ].filter((value) => Boolean(value));
      const canonWrite = await client.command("canon.write", {
        org_id: spec.org,
        actor_id: "actor:01J00000000000000000000003",
        canon_kind: "execution_result",
        body: canonBody,
        content_hash: sha2562(canonBody),
        source_kind: "execution",
        source_id: spec.executionId,
        links
      });
      const canonCheck = expectOk(canonWrite, "canon.write");
      if (canonCheck) return { ok: false, events: events2, error: canonCheck, canon_id: null };
      canonId = String(canonWrite.resource ?? "");
      events2.push({ type: "canon.written", event_id: firstEventId(canonWrite) });
      const completed = await client.command("execution.complete", {
        org_id: spec.org,
        actor_id: spec.actor,
        dispatch_id: spec.dispatchId,
        execution_id: spec.executionId,
        provider: spec.provider,
        exit_code: spec.exitCode,
        duration_ms: spec.durationMs,
        stdout_bytes: byteLength(spec.stdout),
        stderr_bytes: byteLength(spec.stderr),
        session_file_path: spec.sessionFilePath,
        prompt_hash: spec.promptHash,
        canon_id: canonId
      });
      const completedCheck = expectOk(completed, "execution.complete");
      if (completedCheck) return { ok: false, events: events2, error: completedCheck, canon_id: canonId };
      events2.push({ type: "execution.completed", event_id: firstEventId(completed) });
    } else if (spec.outcome === "timeout") {
      const timedOut = await client.command("execution.timeout", {
        org_id: spec.org,
        actor_id: spec.actor,
        dispatch_id: spec.dispatchId,
        execution_id: spec.executionId,
        provider: spec.provider,
        timeout_ms: spec.timeoutMs,
        duration_ms: spec.durationMs,
        stdout_bytes: byteLength(spec.stdout),
        stderr_bytes: byteLength(spec.stderr),
        session_file_path: spec.sessionFilePath,
        prompt_hash: spec.promptHash
      });
      const timeoutCheck = expectOk(timedOut, "execution.timeout");
      if (timeoutCheck) return { ok: false, events: events2, error: timeoutCheck, canon_id: canonId };
      events2.push({ type: "execution.timeout", event_id: firstEventId(timedOut) });
    } else {
      const failed2 = await client.command("execution.fail", {
        org_id: spec.org,
        actor_id: spec.actor,
        dispatch_id: spec.dispatchId,
        execution_id: spec.executionId,
        error_class: "upstream",
        message: `codex exec exited ${spec.exitCode}`,
        provider: spec.provider,
        exit_code: spec.exitCode,
        duration_ms: spec.durationMs,
        stdout_bytes: byteLength(spec.stdout),
        stderr_bytes: byteLength(spec.stderr),
        session_file_path: spec.sessionFilePath,
        prompt_hash: spec.promptHash
      });
      const failedCheck = expectOk(failed2, "execution.fail");
      if (failedCheck) return { ok: false, events: events2, error: failedCheck, canon_id: canonId };
      events2.push({ type: "execution.failed", event_id: firstEventId(failed2) });
    }
    const dispatchEnd = await client.command("dispatch.end", {
      org_id: spec.org,
      actor_id: spec.actor,
      dispatch_id: spec.dispatchId,
      outcome: spec.outcome === "completed" ? "ok" : "failed",
      provider: spec.provider
    });
    const dispatchEndCheck = expectOk(dispatchEnd, "dispatch.end");
    if (dispatchEndCheck) return { ok: false, events: events2, error: dispatchEndCheck, canon_id: canonId };
    events2.push({ type: "dispatch.ended", event_id: firstEventId(dispatchEnd) });
    return { ok: true, events: events2, canon_id: canonId };
  } catch (err) {
    return { ok: false, events: events2, error: err instanceof Error ? err.message : String(err), canon_id: canonId };
  } finally {
    client?.close();
  }
}
async function tryDaemonDispatch(spec) {
  let client = null;
  try {
    client = await connect({ surface: "desktop" });
  } catch (err) {
    if (err instanceof DaemonUnreachableError) {
      return { ok: false, fallback: true, error: err.message };
    }
    return { ok: false, fallback: false, error: err instanceof Error ? err.message : String(err) };
  }
  try {
    const { org, actor, provider, intent, lane } = spec;
    const startResult = await client.command("dispatch.start", {
      org_id: org,
      actor_id: actor,
      intent,
      provider,
      lane_id: lane
    });
    const startCheck = expectOk(startResult, "dispatch.start");
    if (startCheck) return { ok: false, fallback: false, error: startCheck };
    const dispatchId = startResult.resource;
    const dispatchEventId = startResult.events?.[0] ?? "";
    if (!dispatchId) return { ok: false, fallback: false, error: "dispatch.start returned no resource id" };
    const execStart = await client.command("execution.start", {
      org_id: org,
      actor_id: actor,
      dispatch_id: dispatchId,
      exec_kind: "tool",
      name: "simulated.provider",
      provider
    });
    const execStartCheck = expectOk(execStart, "execution.start");
    if (execStartCheck) return { ok: false, fallback: false, error: execStartCheck };
    const executionId = execStart.resource;
    const execStartEventId = execStart.events?.[0] ?? "";
    if (!executionId)
      return { ok: false, fallback: false, error: "execution.start returned no resource id" };
    const toolInvoke = await client.command("tool.invoke", {
      org_id: org,
      actor_id: actor,
      dispatch_id: dispatchId,
      execution_id: executionId,
      tool_name: "simulated.provider",
      args_json: JSON.stringify({ prompt: spec.prompt, cwd: spec.cwd }),
      provider
    });
    const toolInvokeCheck = expectOk(toolInvoke, "tool.invoke");
    if (toolInvokeCheck) return { ok: false, fallback: false, error: toolInvokeCheck };
    const toolInvokeEventId = toolInvoke.events?.[0] ?? "";
    const sleepSeconds = simulatedSleepSeconds(spec.prompt);
    if (sleepSeconds !== null) {
      return {
        ok: true,
        payload: {
          ok: true,
          command: "harness dispatch",
          provider,
          status: "simulated_execution_running",
          source: "daemon_canonical",
          projections: ["dispatch.registry", "execution.registry", "tool.timeline", "chronicle.activity"],
          dispatch: { id: dispatchId, lane, cwd: spec.cwd, prompt: spec.prompt, intent },
          execution: { id: executionId, provider, status: "running", lane, cwd: spec.cwd },
          events: [
            { type: "dispatch.started", event_id: dispatchEventId },
            { type: "execution.started", event_id: execStartEventId },
            { type: "tool.invoked", event_id: toolInvokeEventId }
          ],
          sleep_seconds: sleepSeconds
        }
      };
    }
    const toolReturn = await client.command("tool.return", {
      org_id: org,
      actor_id: actor,
      dispatch_id: dispatchId,
      execution_id: executionId,
      tool_name: "simulated.provider",
      result_summary: "ok"
    });
    const toolReturnCheck = expectOk(toolReturn, "tool.return");
    if (toolReturnCheck) return { ok: false, fallback: false, error: toolReturnCheck };
    const toolReturnEventId = toolReturn.events?.[0] ?? "";
    const canonBody = JSON.stringify({
      exit_code: 0,
      summary: "simulated provider completed",
      jsonl_path: null,
      tool_call_count: 1,
      duration_ms: 1
    }, null, 2);
    const canonWrite = await client.command("canon.write", {
      org_id: org,
      actor_id: actor,
      canon_kind: "execution_result",
      body: canonBody,
      content_hash: sha2562(canonBody),
      source_kind: "execution",
      source_id: executionId,
      links: []
    });
    const canonCheck = expectOk(canonWrite, "canon.write");
    if (canonCheck) return { ok: false, fallback: false, error: canonCheck };
    const canonId = String(canonWrite.resource ?? "");
    const canonEventId = canonWrite.events?.[0] ?? "";
    const execEnd = await client.command("execution.end", {
      org_id: org,
      actor_id: actor,
      dispatch_id: dispatchId,
      execution_id: executionId,
      outcome: "ok",
      duration_ms: 1
    });
    const execEndCheck = expectOk(execEnd, "execution.end");
    if (execEndCheck) return { ok: false, fallback: false, error: execEndCheck };
    const execEndEventId = execEnd.events?.[0] ?? "";
    const dispatchEnd = await client.command("dispatch.end", {
      org_id: org,
      actor_id: actor,
      dispatch_id: dispatchId,
      outcome: "ok",
      provider
    });
    const dispatchEndCheck = expectOk(dispatchEnd, "dispatch.end");
    if (dispatchEndCheck) return { ok: false, fallback: false, error: dispatchEndCheck };
    const dispatchEndEventId = dispatchEnd.events?.[0] ?? "";
    return {
      ok: true,
      payload: {
        ok: true,
        command: "harness dispatch",
        provider,
        status: "simulated_execution_completed",
        source: "daemon_canonical",
        projections: ["dispatch.registry", "execution.registry", "tool.timeline", "chronicle.activity"],
        dispatch: { id: dispatchId, lane, cwd: spec.cwd, prompt: spec.prompt, intent },
        execution: { id: executionId, provider, status: "completed", lane, cwd: spec.cwd },
        canon_id: canonId,
        events: [
          { type: "dispatch.started", event_id: dispatchEventId },
          { type: "execution.started", event_id: execStartEventId },
          { type: "tool.invoked", event_id: toolInvokeEventId },
          { type: "tool.returned", event_id: toolReturnEventId },
          { type: "canon.written", event_id: canonEventId },
          { type: "execution.ended", event_id: execEndEventId },
          { type: "dispatch.ended", event_id: dispatchEndEventId }
        ]
      }
    };
  } catch (err) {
    return { ok: false, fallback: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    client?.close();
  }
}
function expectOk(result, op) {
  if (result.ok === true) return null;
  const error = result.error;
  return `${op}: ${error.class}: ${error.message}`;
}
function firstEventId(result) {
  return result.events?.[0] ?? "";
}
function byteLength(value) {
  return Buffer.byteLength(value, "utf8");
}
function sha2562(value) {
  return createHash2("sha256").update(value).digest("hex");
}
function isTimeoutResult(result) {
  const err = result.error;
  return err?.code === "ETIMEDOUT";
}
function codexSessionDir() {
  return join5(EMA_ACTIVE_BUILD, ".ema-dev", "harness-glue", "codex");
}
function codexSessionFilePath(executionId) {
  return join5(codexSessionDir(), `${sanitizeFile(executionId)}.jsonl`);
}
function writeCodexJsonl(path2, stdout) {
  mkdirSync3(codexSessionDir(), { recursive: true });
  const fd = openSync(path2, "a");
  try {
    const lines = stdout.trim().length > 0 ? stdout.trimEnd().split("\n") : [];
    for (const line of lines) {
      writeSync(fd, `${line}
`);
      fsyncSync(fd);
    }
    if (lines.length === 0) {
      writeSync(fd, `${JSON.stringify({ type: "empty_stream", recorded_at: (/* @__PURE__ */ new Date()).toISOString() })}
`);
      fsyncSync(fd);
    }
  } finally {
    closeSync(fd);
  }
}
function countCodexToolCalls(stdout) {
  return stdout.split("\n").filter((line) => line.includes('"tool"') || line.includes('"tool_call"') || line.includes('"function_call"')).length;
}
function summarizeExecutionResult(stdout, stderr) {
  const stdoutLines = stdout.trim().split("\n").filter(Boolean);
  if (stdoutLines.length > 0) return stdoutLines.slice(-3).join("\n").slice(0, 1200);
  return (stderr.trim() || "codex exec completed with no stdout").slice(0, 1200);
}
function codexVersion() {
  const result = spawnSync2("codex", ["--version"], { encoding: "utf8", timeout: 5e3 });
  return result.status === 0 ? result.stdout.trim() : "unknown";
}
function runStream(args) {
  const execution = flagString(args, "execution");
  if (!execution) {
    emitError("ema harness stream: --execution is required");
    return 64;
  }
  const lane = flagString(args, "lane") ?? null;
  const payload = {
    ok: true,
    command: "harness stream",
    execution_id: execution,
    projection: "tool.timeline",
    timeline: timeline(execution, lane, flagString(args, "cwd") ?? process.cwd(), flagString(args, "prompt") ?? "stream replay")
  };
  if (flagBool(args, "json")) emitJson(payload);
  else for (const event of payload.timeline) emitPretty(`${event.type} ${event.execution_id}`);
  return 0;
}
function runStop(args) {
  const execution = flagString(args, "execution");
  if (!execution) {
    emitError("ema harness stop: --execution is required");
    return 64;
  }
  const record = readRecord(execution);
  const session = flagString(args, "session") ?? record?.execution?.tmux_session;
  let tmux_status = "not_found";
  let tmux_error = null;
  if (session && !flagBool(args, "record-only")) {
    const killed = spawnSync2("tmux", ["kill-session", "-t", session], { encoding: "utf8" });
    tmux_status = killed.status === 0 ? "killed" : "failed";
    tmux_error = killed.status === 0 ? null : killed.stderr || killed.stdout || "tmux kill-session failed";
  } else if (session) tmux_status = "not_requested";
  const payload = {
    ok: tmux_status !== "failed",
    command: "harness stop",
    execution_id: execution,
    status: "stop_requested",
    tmux_session: session ?? null,
    tmux_status,
    tmux_error,
    event: { type: "execution.stop_requested", execution_id: execution, actor_id: flagString(args, "actor") ?? "actor:harness-glue" }
  };
  if (record) {
    const updated = { ...record, status: "stop_requested", execution: { ...record.execution, status: "stop_requested" }, stop: payload };
    writeRecord(updated);
  }
  appendEvents([{ ...payload.event, tmux_session: session ?? null, recorded_at: (/* @__PURE__ */ new Date()).toISOString() }]);
  if (flagBool(args, "json")) emitJson(payload);
  else emitPretty(`stop requested: ${execution}`);
  return payload.ok ? 0 : 1;
}
function runSearch2(args) {
  return runGrep(args);
}
function projections() {
  return ["harness.providers", "dispatch.registry", "execution.registry", "tool.timeline", "chronicle.activity"];
}
function simulatedSleepSeconds(prompt) {
  const match = prompt.trim().match(/^smoke:sleep:(\d+)$/);
  if (!match) return null;
  const seconds = Number.parseInt(match[1] ?? "", 10);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.min(seconds, 60);
}
function timeline(executionId, lane, cwd, prompt) {
  const base = {
    execution_id: executionId,
    lane_id: lane,
    cwd,
    provider: "simulated"
  };
  return [
    { ...base, type: "dispatch.started", prompt },
    { ...base, type: "execution.started" },
    { ...base, type: "tool.returned", tool: "simulated.provider", result_summary: "ok" },
    { ...base, type: "execution.ended", status: "completed" },
    { ...base, type: "dispatch.ended", status: "completed" }
  ];
}
function harnessGlueRoot() {
  const override = process.env.EMA_HARNESS_ROOT?.trim();
  if (override) return override;
  const home = process.env.EMA_HOME?.trim();
  if (home) return join5(home, ".ema-dev", "harness-glue");
  return join5(process.cwd(), ".ema-dev", "harness-glue");
}
function registryDir() {
  return join5(harnessGlueRoot(), "executions");
}
function registryPath(executionId) {
  return join5(registryDir(), `${sanitizeFile(executionId)}.json`);
}
function writeRecord(record) {
  mkdirSync3(registryDir(), { recursive: true });
  writeFileSync3(registryPath(record.execution.id), JSON.stringify({ ...record, updated_at: (/* @__PURE__ */ new Date()).toISOString() }, null, 2) + "\n");
}
function readRecord(executionId) {
  const path2 = registryPath(executionId);
  if (!existsSync6(path2)) return null;
  return JSON.parse(readFileSync5(path2, "utf8"));
}
function readRecords2() {
  const dir = registryDir();
  if (!existsSync6(dir)) return [];
  return readdirSync4(dir).filter((file) => file.endsWith(".json")).map((file) => JSON.parse(readFileSync5(join5(dir, file), "utf8")));
}
function laneAssignmentsDir() {
  return join5(harnessGlueRoot(), "lane-sessions");
}
function laneAssignmentPath(lane) {
  return join5(laneAssignmentsDir(), `${sanitizeFile(lane)}.json`);
}
function eventLogPath() {
  return join5(harnessGlueRoot(), "events.ndjson");
}
function searchDir() {
  return join5(harnessGlueRoot(), "search-bundles");
}
function upsertLaneAssignment(lane, record) {
  mkdirSync3(laneAssignmentsDir(), { recursive: true });
  const existing = readLaneAssignment(lane);
  const sessions = (existing?.sessions ?? []).filter((session) => session.execution_id !== record.execution?.id);
  sessions.unshift({
    execution_id: record.execution?.id,
    dispatch_id: record.dispatch?.id,
    tmux_session: record.execution?.tmux_session,
    provider: record.provider,
    actor: record.actor,
    status: record.execution?.status ?? record.status,
    cwd: record.cwd,
    prompt_summary: record.prompt_summary,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  });
  writeFileSync3(laneAssignmentPath(lane), JSON.stringify({ lane_id: lane, backend: "file_backed_lane_session_registry", daemon_authority: "file_backed_harness_registry", sessions }, null, 2) + "\n");
}
function readLaneAssignment(lane) {
  const path2 = laneAssignmentPath(lane);
  if (!existsSync6(path2)) return null;
  return JSON.parse(readFileSync5(path2, "utf8"));
}
function readLaneAssignments() {
  const dir = laneAssignmentsDir();
  if (!existsSync6(dir)) return [];
  return readdirSync4(dir).filter((file) => file.endsWith(".json")).map((file) => JSON.parse(readFileSync5(join5(dir, file), "utf8")));
}
function appendEvents(events2) {
  mkdirSync3(harnessGlueRoot(), { recursive: true });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const lines = events2.map((event) => JSON.stringify({ recorded_at: event.recorded_at ?? now, ...event })).join("\n");
  if (lines) writeFileSync3(eventLogPath(), lines + "\n", { flag: "a" });
}
function readEvents(selector) {
  const path2 = eventLogPath();
  let events2 = [];
  if (existsSync6(path2)) {
    events2 = readFileSync5(path2, "utf8").split("\n").filter(Boolean).map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { type: "unparsed", raw: line };
      }
    });
  }
  for (const record of readRecords2()) {
    for (const event of record.events ?? []) events2.push({ recorded_at: record.updated_at ?? null, ...event });
  }
  if (selector.execution) events2 = events2.filter((event) => event.execution_id === selector.execution);
  if (selector.lane) events2 = events2.filter((event) => event.lane_id === selector.lane);
  return events2;
}
function recordsForSelector(execution, lane) {
  if (execution) {
    const record = readRecord(execution);
    return record ? [record] : [];
  }
  let records = readRecords2();
  if (lane) records = records.filter((record) => record.lane === lane || record.lane_assignment?.lane_id === lane);
  return records;
}
function enrichRecordStatus(record) {
  const session = record.execution?.tmux_session;
  const tmux = session ? tmuxHasSession(session) : false;
  return { ...record, runtime: { tmux: tmux ? "running" : "not_found", checked_at: (/* @__PURE__ */ new Date()).toISOString() } };
}
function tmuxHasSession(session) {
  return spawnSync2("tmux", ["has-session", "-t", session], { encoding: "utf8" }).status === 0;
}
function captureTmux(session, lines) {
  const captured = spawnSync2("tmux", ["capture-pane", "-t", session, "-p", "-S", `-${lines}`], { encoding: "utf8" });
  return { ok: captured.status === 0, tmux_session: session, output: captured.stdout, error: captured.stderr || null };
}
function writeSearchBundle(records) {
  mkdirSync3(searchDir(), { recursive: true });
  const path2 = join5(searchDir(), `bundle-${Date.now()}.txt`);
  const chunks = [];
  chunks.push(`# Harness Glue search bundle ${(/* @__PURE__ */ new Date()).toISOString()}
`);
  for (const record of records.length ? records : readRecords2()) {
    chunks.push(`
--- registry ${record.execution?.id ?? "unknown"} ---
${JSON.stringify(record, null, 2)}
`);
    for (const event of readEvents({ execution: record.execution?.id, lane: record.lane })) chunks.push(`event ${JSON.stringify(event)}
`);
    const session = record.execution?.tmux_session;
    if (session) chunks.push(`
--- tmux ${session} ---
${captureTmux(session, 500).output}
`);
  }
  writeFileSync3(path2, chunks.join(""));
  return path2;
}
function providerCommand(provider, cwd, prompt) {
  const quotedCwd = shellQuote2(cwd);
  const quotedPrompt = shellQuote2(prompt);
  if (provider === "codex") return `cd ${quotedCwd} && export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH" && codex exec --sandbox workspace-write ${quotedPrompt}`;
  return `cd ${quotedCwd} && export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH" && claude`;
}
function sanitizeSession(input) {
  return input.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").slice(0, 80);
}
function sanitizeFile(input) {
  return input.replace(/[^a-zA-Z0-9_.-]+/g, "_");
}
function summarize(input) {
  return input.length > 180 ? `${input.slice(0, 177)}...` : input;
}
function shellQuote2(input) {
  return `'${input.replace(/'/g, `'"'"'`)}'`;
}
function stableId2(input) {
  let hash2 = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash2 ^= input.charCodeAt(i);
    hash2 = Math.imul(hash2, 16777619);
  }
  return (hash2 >>> 0).toString(36).padStart(7, "0");
}

// src/commands/peer.ts
import { execFileSync as execFileSync2 } from "child_process";
import { existsSync as existsSync7, readFileSync as readFileSync6, writeFileSync as writeFileSync4 } from "fs";
import { dirname as dirname3, join as join6 } from "path";
var REGISTRY_PATH = join6(EMA_ACTIVE_BUILD, ".ema", "peers.json");
function runPeer(args) {
  const verb = args.positional[0] ?? "doctor";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return runPeerHelp(args);
  if (verb === "add") return runAdd2(args);
  if (verb === "doctor") return runDoctor(args);
  if (verb === "tunnel") return runTunnel(args);
  if (verb === "dispatch") return runDispatch2(args);
  if (verb === "sync-runtime" || verb === "sudo-check") return runPending(args, verb);
  emitError(`ema peer: unknown subcommand "${verb}" (expected: add | doctor | tunnel | dispatch | sync-runtime | sudo-check)`);
  return 64;
}
function runPeerHelp(args) {
  const commands = [
    { verb: "add", summary: "Register a trusted dev peer locally before daemon-backed peer registry." },
    { verb: "doctor", summary: "Check SSH/local reachability and runtime prerequisites." },
    { verb: "tunnel create", summary: "Describe an SSH port-forward rail for a trusted peer." },
    { verb: "dispatch", summary: "Describe remote Harness Glue dispatch over SSH rail." },
    { verb: "sync-runtime", summary: "Prepare runtime sync contract for peer daemon parity." },
    { verb: "sudo-check", summary: "Check explicit grant/sudo readiness without ambient control." }
  ];
  if (flagBool(args, "json")) {
    emitJson({ noun: "peer", status: "local_registry_first", commands, registry: REGISTRY_PATH });
    return 0;
  }
  emitPretty("ema peer \u2014 trusted-dev peer execution rail");
  for (const command of commands) emitPretty(`  ${command.verb.padEnd(12)} ${command.summary}`);
  return 0;
}
function runAdd2(args) {
  const id = flagString(args, "id") ?? flagString(args, "name");
  const host = flagString(args, "host");
  if (!id || !host) {
    emitError("ema peer add: --id and --host are required");
    return 64;
  }
  const peers = loadPeers().filter((peer) => peer.id !== id);
  const record = {
    id,
    host,
    user: flagString(args, "user") ?? null,
    workspace: flagString(args, "workspace") ?? null,
    port: flagString(args, "port") ?? null,
    added_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  peers.push(record);
  savePeers(peers);
  if (flagBool(args, "json")) emitJson({ ok: true, command: "peer add", registry: REGISTRY_PATH, peer: record });
  else emitPretty(`peer registered: ${id}`);
  return 0;
}
function runDoctor(args) {
  const id = flagString(args, "peer") ?? flagString(args, "id") ?? "local";
  const peer = id === "local" ? localPeer() : loadPeers().find((candidate) => candidate.id === id) ?? null;
  if (!peer) {
    emitError(`ema peer doctor: unknown peer "${id}"`);
    return 64;
  }
  const checks = id === "local" ? localChecks() : remoteChecks(peer);
  const ok = checks.every((check) => check.ok || check.optional === true);
  const payload = { ok, command: "peer doctor", rail: "ssh", peer, checks };
  if (flagBool(args, "json")) emitJson(payload);
  else {
    emitPretty(`peer: ${peer.id}`);
    for (const check of checks) emitPretty(`  ${check.ok ? "ok" : "missing"} ${check.name}: ${check.detail}`);
  }
  return ok ? 0 : 1;
}
function runTunnel(args) {
  const action = args.positional[1] ?? "create";
  if (action !== "create") {
    emitError(`ema peer tunnel: unknown action "${action}" (expected: create)`);
    return 64;
  }
  const peer = flagString(args, "peer") ?? "local";
  const localPort = flagString(args, "local-port") ?? "49555";
  const remotePort = flagString(args, "remote-port") ?? "49555";
  const payload = {
    ok: true,
    command: "peer tunnel create",
    peer,
    rail: "ssh",
    status: peer === "local" ? "local_noop" : "planned",
    ssh_command: peer === "local" ? null : `ssh -N -L ${localPort}:127.0.0.1:${remotePort} ${peer}`,
    audit: { actor: flagString(args, "actor") ?? "actor:codex", scope: "ema-daemon-port-forward", ttl: flagString(args, "ttl") ?? "1h" }
  };
  if (flagBool(args, "json")) emitJson(payload);
  else emitPretty(payload.ssh_command ?? "local peer tunnel is a no-op");
  return 0;
}
function runDispatch2(args) {
  const peer = flagString(args, "peer") ?? "local";
  const provider = flagString(args, "provider") ?? "simulated";
  const prompt = flagString(args, "prompt") ?? "remote dispatch";
  const payload = {
    ok: true,
    command: "peer dispatch",
    peer,
    rail: peer === "local" ? "local" : "ssh",
    provider,
    prompt,
    status: peer === "local" && provider === "simulated" ? "ready" : "planned_remote_dispatch",
    next_cli: peer === "local" ? `ema harness dispatch --provider ${provider} --prompt "${prompt}" --json` : `ssh ${peer} 'cd <ema-workspace> && pnpm cli harness dispatch --provider ${provider} --prompt "${prompt}" --json'`,
    audit_required: { actor: flagString(args, "actor") ?? "actor:codex", device: peer, scope: "harness-dispatch", ttl: flagString(args, "ttl") ?? "1h" }
  };
  if (flagBool(args, "json")) emitJson(payload);
  else emitPretty(payload.next_cli);
  return 0;
}
function runPending(args, verb) {
  const payload = {
    ok: true,
    command: `peer ${verb}`,
    status: "pending_peer_daemon_registry",
    rail: "ssh_first_iroh_later",
    audit_required: { actor: flagString(args, "actor") ?? "actor:codex", scope: verb, ttl: flagString(args, "ttl") ?? "1h" }
  };
  if (flagBool(args, "json")) emitJson(payload);
  else emitPretty(`${verb}: pending peer daemon registry`);
  return 0;
}
function localPeer() {
  return { id: "local", host: "127.0.0.1", workspace: EMA_ACTIVE_BUILD, added_at: "builtin" };
}
function localChecks() {
  return [
    commandCheck("node", ["--version"]),
    commandCheck("pnpm", ["--version"]),
    commandCheck("gleam", ["--version"]),
    { name: "workspace", ok: existsSync7(EMA_ACTIVE_BUILD), detail: EMA_ACTIVE_BUILD },
    { name: "daemon_port", ok: true, optional: true, detail: "49555 expected; use ema status --json for live handshake" },
    { name: "web_port", ok: true, optional: true, detail: "5173 expected; browser/web verification is separate" }
  ];
}
function remoteChecks(peer) {
  return [
    { name: "ssh", ok: true, optional: true, detail: `run: ssh ${peer.host} 'echo ok'` },
    { name: "workspace", ok: Boolean(peer.workspace), detail: peer.workspace ?? "missing --workspace in peer registry" },
    { name: "node", ok: true, optional: true, detail: "checked remotely by future daemon rail" },
    { name: "pnpm", ok: true, optional: true, detail: "checked remotely by future daemon rail" },
    { name: "gleam", ok: true, optional: true, detail: "checked remotely by future daemon rail" }
  ];
}
function commandCheck(name, args) {
  try {
    const detail = execFileSync2(name, args, { encoding: "utf8", timeout: 5e3 }).trim();
    return { name, ok: true, detail };
  } catch (err) {
    return { name, ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}
function loadPeers() {
  if (!existsSync7(REGISTRY_PATH)) return [];
  try {
    const parsed = JSON.parse(readFileSync6(REGISTRY_PATH, "utf8"));
    return Array.isArray(parsed.peers) ? parsed.peers : [];
  } catch {
    return [];
  }
}
function savePeers(peers) {
  if (!existsSync7(dirname3(REGISTRY_PATH))) execFileSync2("mkdir", ["-p", dirname3(REGISTRY_PATH)]);
  writeFileSync4(REGISTRY_PATH, `${JSON.stringify({ peers }, null, 2)}
`);
}

// src/commands/gap.ts
var W4_PREFIX = "[W4-gap]";
var DEFAULT_ORG6 = "org:01J00000000000000000000001";
var DEFAULT_ACTOR6 = "actor:dev-console";
async function runGap(args) {
  const verb = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") {
    return runStubContract(args, {
      noun: "gap",
      status: "available",
      docRef: "docs/cli/agent-workspace-cli-improvement-map.md",
      commands: [
        { verb: "list", flags: ["alley", "status", "json"], summary: "List W4 gap lanes from lane.registry." },
        { verb: "show", flags: ["ref", "lane", "id", "json"], summary: "Show a W4 gap by ref or lane id." },
        { verb: "claim", flags: ["ref", "lane", "actor", "scope", "goal", "next"], summary: "Claim a gap lane." },
        { verb: "close", flags: ["ref", "lane", "reason", "verify"], summary: "Close a gap lane." }
      ]
    });
  }
  if (verb === "list" || verb === void 0) return runList4(args);
  if (verb === "show") return runShow4(args);
  if (verb === "claim") return runClaim2(args);
  if (verb === "close") return runClose3(args);
  emitError(`ema gap: unknown subcommand "${verb}" (expected: list | show | claim | close)`);
  return 64;
}
async function readLanes() {
  const c = await connect({ surface: "desktop" });
  const lanes = await new Promise((resolve2) => {
    const timer = setTimeout(() => resolve2([]), 1500);
    c.onMessage((msg) => {
      const env = msg;
      if (env.type === "projection" && env.name === "lane.registry") {
        clearTimeout(timer);
        const data = env.data;
        resolve2(data?.lanes ?? []);
      }
    });
    c.subscribe("lane.registry");
  });
  c.close();
  return lanes;
}
function alleyOf(title) {
  const match = title.match(/^\[W4-gap\]\s+([A-Z])\.(\d+)/);
  return match ? match[1] : null;
}
function refOf(title) {
  const match = title.match(/^\[W4-gap\]\s+([A-Z]\.\d+)/);
  return match ? match[1] : null;
}
async function runList4(args) {
  const json = flagBool(args, "json");
  const alley = flagString(args, "alley");
  const status2 = flagString(args, "status");
  try {
    const lanes = await readLanes();
    const gaps = lanes.filter((l) => l.title.startsWith(W4_PREFIX));
    const filtered = gaps.filter((l) => {
      if (alley && alleyOf(l.title) !== alley.toUpperCase()) return false;
      if (status2 && l.status !== status2) return false;
      return true;
    });
    if (json) {
      emitJson({
        ok: true,
        source: "lane.registry",
        filter: { alley: alley ?? null, status: status2 ?? null },
        gaps: filtered.map((l) => ({
          id: l.id,
          ref: refOf(l.title),
          title: l.title,
          status: l.status,
          done_when: l.done_when ?? null,
          blueprint_section_id: l.linked_blueprint?.section_id ?? null
        }))
      });
      return 0;
    }
    emitPretty(`# gaps  (source: lane.registry)`);
    emitPretty(`${filtered.length} of ${gaps.length} (filtered: alley=${alley ?? "*"} status=${status2 ?? "*"})`);
    const open = filtered.filter((l) => l.status !== "done" && l.status !== "closed");
    const done = filtered.filter((l) => l.status === "done" || l.status === "closed");
    emitPretty("");
    emitPretty(`open (${open.length}):`);
    for (const l of open) {
      const ref = refOf(l.title) ?? "?";
      const summary = l.title.replace(W4_PREFIX, "").trim().replace(/^[A-Z]\.\d+\s+/, "");
      emitPretty(`  ${ref.padEnd(5)} [${l.status.padEnd(8)}] ${summary.slice(0, 76)}`);
    }
    if (done.length > 0) {
      emitPretty("");
      emitPretty(`closed (${done.length}):`);
      for (const l of done) {
        const ref = refOf(l.title) ?? "?";
        emitPretty(`  ${ref.padEnd(5)} \u2713 ${l.title.replace(W4_PREFIX, "").trim().slice(0, 76)}`);
      }
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}
async function runShow4(args) {
  const json = flagBool(args, "json");
  const ref = args.positional[1] ?? flagString(args, "ref");
  const id = flagString(args, "lane") ?? flagString(args, "id");
  if (!ref && !id) {
    emitError(`ema gap show: pass either a positional ref (e.g. A.1) or --lane <id>`);
    return 64;
  }
  try {
    const lanes = await readLanes();
    const gaps = lanes.filter((l) => l.title.startsWith(W4_PREFIX));
    const lane = gaps.find((l) => {
      if (id) return l.id === id;
      return refOf(l.title) === ref?.toUpperCase();
    });
    if (!lane) {
      emitError(`ema gap show: no gap matching ${ref ?? id}`);
      return 1;
    }
    if (json) {
      emitJson({ ok: true, gap: lane });
      return 0;
    }
    emitPretty(`# gap ${refOf(lane.title) ?? "?"}`);
    emitPretty(`title: ${lane.title}`);
    emitPretty(`id: ${lane.id}`);
    emitPretty(`status: ${lane.status}`);
    emitPretty(`actor: ${lane.actor_id ?? "\u2014"}`);
    emitPretty(`done_when: ${lane.done_when ?? "\u2014"}`);
    emitPretty(`scope: ${lane.scope ?? "\u2014"}`);
    const link = lane.linked_blueprint;
    if (link) {
      const lines = [
        link.section_id ? `section=${link.section_id}` : null,
        link.gac_id ? `gac=${link.gac_id}` : null,
        link.decision_id ? `decision=${link.decision_id}` : null
      ].filter(Boolean);
      if (lines.length > 0) emitPretty(`linked_blueprint: ${lines.join("  \xB7  ")}`);
    }
    emitPretty(`updated_at: ${lane.updated_at ?? "\u2014"}`);
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}
async function runClaim2(args) {
  const json = flagBool(args, "json");
  const ref = args.positional[1] ?? flagString(args, "ref");
  const id = flagString(args, "lane");
  if (!ref && !id) {
    emitError(`ema gap claim: pass either positional ref (e.g. A.1) or --lane <id>`);
    return 64;
  }
  try {
    const lanes = await readLanes();
    const lane = lanes.find((l) => {
      if (id) return l.id === id;
      return l.title.startsWith(W4_PREFIX) && refOf(l.title) === ref?.toUpperCase();
    });
    if (!lane) {
      emitError(`ema gap claim: no matching gap`);
      return 1;
    }
    const c = await connect({ surface: "desktop" });
    const result = await c.command("lane.claim", {
      org_id: flagString(args, "org") ?? DEFAULT_ORG6,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR6,
      lane_id: lane.id,
      scope: flagString(args, "scope") ?? lane.scope ?? "ship the gap",
      goal: flagString(args, "goal") ?? `close ${refOf(lane.title) ?? ""}`,
      next: flagString(args, "next") ?? "see lane.done_when"
    });
    c.close();
    if (result.ok !== true) {
      if (json) emitJson({ ok: false, error: result.error });
      else emitError(`ema gap claim: ${result.error.class}: ${result.error.message}`);
      return 1;
    }
    if (json) emitJson({ ok: true, lane_id: lane.id, ref: refOf(lane.title) });
    else emitPretty(`claimed ${refOf(lane.title) ?? lane.id}`);
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}
async function runClose3(args) {
  const json = flagBool(args, "json");
  const ref = args.positional[1] ?? flagString(args, "ref");
  const id = flagString(args, "lane");
  const verify = flagString(args, "verify") ?? "shipped";
  if (!ref && !id) {
    emitError(`ema gap close: pass either positional ref (e.g. A.1) or --lane <id>`);
    return 64;
  }
  try {
    const lanes = await readLanes();
    const lane = lanes.find((l) => {
      if (id) return l.id === id;
      return l.title.startsWith(W4_PREFIX) && refOf(l.title) === ref?.toUpperCase();
    });
    if (!lane) {
      emitError(`ema gap close: no matching gap`);
      return 1;
    }
    const c = await connect({ surface: "desktop" });
    const result = await c.command("lane.close", {
      org_id: flagString(args, "org") ?? DEFAULT_ORG6,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR6,
      lane_id: lane.id,
      reason: flagString(args, "reason") ?? "shipped",
      verify
    });
    c.close();
    if (result.ok !== true) {
      if (json) emitJson({ ok: false, error: result.error });
      else emitError(`ema gap close: ${result.error.class}: ${result.error.message}`);
      return 1;
    }
    if (json) emitJson({ ok: true, lane_id: lane.id, ref: refOf(lane.title), verify });
    else emitPretty(`closed ${refOf(lane.title) ?? lane.id}  (verify: ${verify})`);
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}

// src/commands/readiness.ts
import { existsSync as existsSync9, mkdirSync as mkdirSync4, readFileSync as readFileSync8, writeFileSync as writeFileSync5 } from "fs";
import { dirname as dirname4, join as join8 } from "path";

// src/commands/capability.ts
import { existsSync as existsSync8, readFileSync as readFileSync7, statSync as statSync4 } from "fs";
import { spawnSync as spawnSync3 } from "child_process";
import { join as join7 } from "path";
async function runCapability(args) {
  const verb = args.positional[0] ?? "list";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return help(args);
  if (verb === "list") return list(args);
  if (verb === "assert") return assertRequired(args);
  emitError(`ema capability: unknown subcommand "${verb}" (expected: list | assert)`);
  return 64;
}
function help(args) {
  const commands = [
    { verb: "list", summary: "Classify CLI/daemon capabilities for agent bootstrap." },
    { verb: "assert", summary: "Fail unless required capabilities are usable." }
  ];
  if (flagBool(args, "json")) emitJson({ noun: "capability", status: "available", commands });
  else {
    emitPretty("ema capability - honest substrate readiness");
    for (const command of commands) emitPretty(`  ${command.verb.padEnd(10)} ${command.summary}`);
  }
  return 0;
}
async function capabilityReport(args, options = {}) {
  const scope = await resolveWorkspaceScope({ args });
  const daemon = await daemonStatus();
  const db = dbStatus();
  const capabilities = capabilityList(db.ok, options);
  const staleDocs = [
    join7(EMA_ACTIVE_BUILD, "docs", "WORKSPACE-ENTRYPOINT.md"),
    "/Users/trajanm4air/Desktop/Projects/EMA/atlas/canon/current/ema-0-0-5-current-canon.md",
    "/Users/trajanm4air/Desktop/Projects/EMA/atlas/workspace/README.md"
  ].map((path2) => ({ path: path2, exists: existsSync8(path2), stale_marker: existsSync8(path2) ? containsStaleMarker(path2) : false }));
  return {
    ok: daemon.ok && db.ok,
    command: "capability.list",
    source: "cli_static_checks_plus_daemon_ping",
    daemon,
    database: db,
    cli: cliFreshness(),
    workspace_scope: scope,
    stale_docs: staleDocs,
    capabilities
  };
}
async function list(args) {
  const report = await capabilityReport(args);
  if (flagBool(args, "json")) emitJson(report);
  else {
    for (const capability of report.capabilities) {
      emitPretty(`${capability.id.padEnd(14)} ${capability.state}`);
    }
  }
  return report.ok ? 0 : 1;
}
async function assertRequired(args) {
  const required = (flagString(args, "required") ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  const cached = required.includes("codex") ? readFreshRoundtrip("codex").ok : false;
  const report = await capabilityReport(args, { checkRoundtripProviders: required.includes("codex") ? ["codex"] : [] });
  const capabilityMap = new Map(report.capabilities.map((capability) => [capability.id, capability]));
  const failures = required.map((id) => capabilityMap.get(id) ?? { id, state: "missing", commands: [], evidence: "not registered", blocks_proslync_swarm: true }).filter(isFailureState);
  const payload = {
    ok: failures.length === 0 && report.daemon.ok && report.database.ok,
    command: "capability.assert",
    required,
    cached,
    failures,
    report
  };
  if (flagBool(args, "json")) emitJson(payload);
  else if (payload.ok) emitPretty(`capability assert passed: ${required.join(", ")}`);
  else {
    emitError(`capability assert failed: ${failures.map((failure) => `${failure.id}:${failure.state}`).join(", ")}`);
  }
  return payload.ok ? 0 : 1;
}
function capabilityList(dbOk, options) {
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
    cap("hermes", "unsupported-provider-adapter", ["ema harness dispatch --provider hermes"], "future adapter; do not present as ready", false)
  ];
}
function cap(id, state, commands, evidence, blocks) {
  return { id, state, commands, evidence, blocks_proslync_swarm: blocks };
}
function isFailureState(capability) {
  return capability.state === "missing" || capability.state === "stubbed" || capability.state === "roundtrip-failed" || capability.state === "unsupported-provider-adapter";
}
function codexCapability(options) {
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
      `recent successful Codex roundtrip at ${fresh.entry.completed_at} (${Math.round(fresh.age_ms / 1e3)}s old): ${fresh.entry.evidence}`,
      false
    );
  }
  if (!options.checkRoundtripProviders?.includes("codex")) {
    return cap(
      "codex",
      "roundtrip-failed",
      commands,
      `Codex CLI detected, but ${fresh.reason}; capability assert --required codex must run a smoke roundtrip before this can pass.`,
      true
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
function runCodexCapabilitySmoke() {
  const cli = process.argv[1] && existsSync8(process.argv[1]) ? process.argv[1] : join7(EMA_ACTIVE_BUILD, "apps", "cli", "dist", "bin.js");
  const result = spawnSync3(process.execPath, [
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
    "--json"
  ], {
    cwd: EMA_ACTIVE_BUILD,
    env: { ...process.env, EMA_CAPABILITY_SMOKE: "1" },
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    timeout: 15e3
  });
  const payload = parseJson(result.stdout);
  const ok = result.status === 0 && payload?.ok === true && payload.provider === "codex";
  if (ok) {
    const executionId = executionIdFrom(payload);
    return { ok: true, evidence: `ema harness dispatch --provider codex capability smoke completed (${executionId})` };
  }
  const detail = firstNonEmpty2(
    typeof payload?.stderr === "string" ? payload.stderr : null,
    typeof payload?.error === "string" ? payload.error : null,
    result.stderr,
    result.stdout,
    result.error ? String(result.error) : null
  );
  return {
    ok: false,
    evidence: `Codex capability smoke failed via ema harness dispatch --provider codex --mode capability-check (exit ${result.status ?? "signal"}): ${summarize2(detail)}`
  };
}
function parseJson(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
function executionIdFrom(payload) {
  const execution = payload.execution;
  if (!execution || typeof execution !== "object" || Array.isArray(execution)) return "execution:unknown";
  const id = execution.id;
  return typeof id === "string" ? id : "execution:unknown";
}
function firstNonEmpty2(...values) {
  for (const value of values) {
    if (value && value.trim().length > 0) return value.trim();
  }
  return "no stdout or stderr captured";
}
function summarize2(value) {
  return value.length > 500 ? `${value.slice(0, 497)}...` : value;
}
async function daemonStatus() {
  try {
    const c = await connect({ surface: "desktop" });
    const rtt = await c.ping();
    const status2 = { ok: true, url: "ws://127.0.0.1:49555", rtt_ms: rtt, daemon_version: c.hello?.daemon_version ?? null };
    c.close();
    return status2;
  } catch (err) {
    return { ok: false, url: "ws://127.0.0.1:49555", error: err instanceof Error ? err.message : String(err) };
  }
}
function cliFreshness() {
  const src = join7(EMA_ACTIVE_BUILD, "apps", "cli", "src", "bin.ts");
  const dist = join7(EMA_ACTIVE_BUILD, "apps", "cli", "dist", "bin.js");
  const srcMtime = existsSync8(src) ? statSync4(src).mtimeMs : null;
  const distMtime = existsSync8(dist) ? statSync4(dist).mtimeMs : null;
  return {
    source: src,
    dist,
    dist_exists: existsSync8(dist),
    dist_older_than_source: srcMtime !== null && distMtime !== null ? distMtime < srcMtime : null
  };
}
function containsStaleMarker(path2) {
  try {
    const text = readFileSync7(path2, "utf8");
    return /0\.0\.5|EMA-0\.0\.5|Founding-Fathers-EMA/.test(text);
  } catch {
    return false;
  }
}

// src/commands/readiness.ts
var RESTART_PROOF_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1e3;
var RESTART_PROOF_PATH = join8(EMA_ACTIVE_BUILD, ".ema-dev", "restart-survival", "last-proof.json");
var INTENT_WRITER_CACHE_PATH = join8(EMA_ACTIVE_BUILD, ".ema-dev", "readiness", "intent-writer.json");
var INTENT_WRITER_SUCCESS_TTL_MS = 60 * 1e3;
var INTENT_WRITER_FAILURE_TTL_MS = 15 * 1e3;
var ARTIFACT_WORKSPACE_COMMAND_PATH = join8(EMA_ACTIVE_BUILD, "apps", "cli", "src", "commands", "workspace.ts");
var ARTIFACT_DAEMON_WRITER_PATH = join8(EMA_ACTIVE_BUILD, "apps", "daemon", "src", "ema_artifact", "ema_artifact.gleam");
var ARTIFACT_IPC_PATH = join8(EMA_ACTIVE_BUILD, "apps", "daemon", "src", "ema_shell_ipc", "ema_shell_ipc.gleam");
var CANON_CLI_PATH = join8(EMA_ACTIVE_BUILD, "apps", "cli", "src", "commands", "canon.ts");
var CANON_DAEMON_WRITER_PATH = join8(EMA_ACTIVE_BUILD, "apps", "daemon", "src", "ema_canon", "ema_canon.gleam");
var CANON_IPC_PATH = join8(EMA_ACTIVE_BUILD, "apps", "daemon", "src", "ema_shell_ipc", "ema_shell_ipc.gleam");
var BLOCKER = {
  codexRoundtrip: "codex_roundtrip",
  proslyncRestartSurvival: "proslync_restart_survival",
  artifactContextWriteback: "artifact_context_writeback"
};
async function buildReadiness(args) {
  const capability = await capabilityReport(args, { checkRoundtripProviders: ["codex"] });
  const substrate = await classifySubstrate();
  const codex = capability.capabilities.find((item) => item.id === "codex");
  const codexProof = readFreshCodexRoundtripProof();
  const capabilityState = {
    codex_roundtrip_ready: codexProof.ok,
    codex_evidence: codexProof.ok ? `fresh Codex roundtrip proof at ${codexProof.proof.passed_at}: ${codexProof.proof.execution_id}` : `${codexProof.reason}; capability evidence: ${codex?.evidence ?? "Codex capability is not registered"}`
  };
  const restartProof = readRestartProofState();
  const blockers = deriveBlockers(substrate, capabilityState, restartProof);
  const coordinationReady = capability.daemon.ok && capability.database.ok && substrate.components.lane_writer === "beam" && substrate.components.queue_writer === "beam" && substrate.components.dispatch_writer === "beam" && substrate.components.execution_writer === "beam" && substrate.components.event_log_writer === "beam";
  const proslyncExecutionReady = coordinationReady && blockers.length === 0;
  return {
    capability,
    report: {
      ok: proslyncExecutionReady,
      command: "readiness",
      substrate_translated: substrate,
      coordination_ready: coordinationReady,
      proslync_execution_ready: proslyncExecutionReady,
      blockers
    }
  };
}
async function runReadiness(args) {
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
async function classifySubstrate() {
  const intentWriter = await classifyIntentWriter();
  const artifactWriter = classifyArtifactWriter();
  const canonWriter = classifyCanonWriter();
  const components = {
    daemon_runtime: existsSync9(join8(EMA_ACTIVE_BUILD, "apps", "daemon", "src", "ema_daemon", "supervisor.gleam")) ? "beam" : "absent",
    // This means canonical pipeline-floor `intent.created`, not legacy
    // harvested-session `ema intention ...` behavior.
    intent_writer: intentWriter,
    lane_writer: "beam",
    queue_writer: "beam",
    execution_writer: "beam",
    dispatch_writer: "beam",
    artifact_writer: artifactWriter,
    canon_writer: canonWriter,
    event_log_writer: "beam"
  };
  return {
    summary: summarizeComponents(Object.values(components)),
    components
  };
}
function classifyCanonWriter() {
  const cli = readSourceIfPresent(CANON_CLI_PATH);
  const daemonWriter = readSourceIfPresent(CANON_DAEMON_WRITER_PATH);
  const ipc = readSourceIfPresent(CANON_IPC_PATH);
  const cliWritesThroughDaemon = cli !== null && [
    'client.command("canon.write"',
    'client.command("canon.supersede"'
  ].every((needle) => cli.includes(needle));
  const daemonOwnsCanonEvents = daemonWriter !== null && [
    "pub fn write_canon",
    "pub fn supersede_canon",
    "canon.written",
    "canon.superseded",
    "HashMismatch"
  ].every((needle) => daemonWriter.includes(needle));
  const ipcExposesDaemonWriter = ipc !== null && [
    'Some("canon.write")',
    'Some("canon.supersede")'
  ].every((needle) => ipc.includes(needle));
  return cliWritesThroughDaemon && daemonOwnsCanonEvents && ipcExposesDaemonWriter ? "beam" : "absent";
}
function classifyArtifactWriter() {
  const workspaceCommand = readSourceIfPresent(ARTIFACT_WORKSPACE_COMMAND_PATH);
  const daemonWriter = readSourceIfPresent(ARTIFACT_DAEMON_WRITER_PATH);
  const ipc = readSourceIfPresent(ARTIFACT_IPC_PATH);
  if (!workspaceCommand) return "absent";
  const cliWritesThroughDaemon = [
    'artifactCommand("artifact.create"',
    'artifactCommand("artifact.update"',
    'artifactCommand("artifact.link"',
    'artifactCommand("artifact.archive"'
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
    "artifact.archived"
  ].every((needle) => daemonWriter.includes(needle));
  const ipcExposesDaemonWriter = ipc !== null && [
    'Some("artifact.create")',
    'Some("artifact.update")',
    'Some("artifact.link")',
    'Some("artifact.archive")'
  ].every((needle) => ipc.includes(needle));
  const hasLegacyLocalWritePath = workspaceCommand.includes("local_index_until_daemon_writer") || workspaceCommand.includes("hybrid_file_sqlite_index") || workspaceCommand.includes("sqliteExec(") || workspaceCommand.includes("writeText(");
  if (cliWritesThroughDaemon && daemonOwnsArtifactEvents && ipcExposesDaemonWriter && !hasLegacyLocalWritePath) return "beam";
  if (hasLegacyLocalWritePath && (cliWritesThroughDaemon || daemonOwnsArtifactEvents || ipcExposesDaemonWriter)) return "hybrid";
  if (hasLegacyLocalWritePath) return "node";
  return "absent";
}
function readSourceIfPresent(path2) {
  if (!existsSync9(path2)) return null;
  try {
    return readFileSync8(path2, "utf8");
  } catch {
    return null;
  }
}
async function classifyIntentWriter() {
  const cached = readIntentWriterCache();
  const cachedAge = cached ? Date.now() - Date.parse(cached.checked_at) : Number.POSITIVE_INFINITY;
  if (cached && Number.isFinite(cachedAge)) {
    const ttl = cached.ok ? INTENT_WRITER_SUCCESS_TTL_MS : INTENT_WRITER_FAILURE_TTL_MS;
    if (cachedAge <= ttl) return cached.ok ? "beam" : "absent";
  }
  const smokeId = `READINESS-INTENT-WRITER-${Date.now()}`;
  let client = null;
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
      done_when: "Canonical intent writer smoke succeeds"
    });
    const ok = result.ok === true && intentById(smokeId) !== null;
    writeIntentWriterCache({
      ok,
      checked_at: (/* @__PURE__ */ new Date()).toISOString(),
      reason: ok ? "intent.created roundtrip succeeded" : "intent.created roundtrip failed to project"
    });
    return ok ? "beam" : "absent";
  } catch (err) {
    writeIntentWriterCache({
      ok: false,
      checked_at: (/* @__PURE__ */ new Date()).toISOString(),
      reason: err instanceof Error ? err.message : String(err)
    });
    return "absent";
  } finally {
    client?.close();
  }
}
function readIntentWriterCache() {
  if (!existsSync9(INTENT_WRITER_CACHE_PATH)) return null;
  try {
    const parsed = JSON.parse(readFileSync8(INTENT_WRITER_CACHE_PATH, "utf8"));
    if (typeof parsed.ok !== "boolean" || typeof parsed.checked_at !== "string") return null;
    return { ok: parsed.ok, checked_at: parsed.checked_at, reason: typeof parsed.reason === "string" ? parsed.reason : "" };
  } catch {
    return null;
  }
}
function writeIntentWriterCache(cache) {
  mkdirSync4(dirname4(INTENT_WRITER_CACHE_PATH), { recursive: true });
  writeFileSync5(INTENT_WRITER_CACHE_PATH, `${JSON.stringify(cache, null, 2)}
`);
}
function summarizeComponents(values) {
  if (values.every((value) => value === "beam")) return "full";
  if (values.every((value) => value === "absent" || value === "node")) return "none";
  return "partial";
}
function deriveBlockers(substrate, capability, restartProof) {
  const blockers = [];
  if (!capability.codex_roundtrip_ready) {
    blockers.push({
      id: BLOCKER.codexRoundtrip,
      severity: "blocking",
      reason: `Codex capability requires a completed executable roundtrip; current adapter evidence: ${capability.codex_evidence}`
    });
  }
  if (!restartProof.fresh) {
    blockers.push({
      id: BLOCKER.proslyncRestartSurvival,
      severity: "blocking",
      reason: `Proslync execution readiness requires restart-survival proof; ${restartProof.reason}.`
    });
  }
  if (substrate.components.artifact_writer === "hybrid" || substrate.components.artifact_writer === "absent") {
    blockers.push({
      id: BLOCKER.artifactContextWriteback,
      severity: "blocking",
      reason: `Proslync execution readiness requires artifact/context writeback to be daemon-owned end-to-end; current artifact writer is ${substrate.components.artifact_writer}.`
    });
  }
  if (substrate.components.canon_writer !== "beam") {
    blockers.push({
      id: BLOCKER.artifactContextWriteback,
      severity: "blocking",
      reason: `Proslync execution readiness requires execution result writeback to canon; current canon writer is ${substrate.components.canon_writer}.`
    });
  }
  return blockers;
}
function readRestartProofState() {
  if (!existsSync9(RESTART_PROOF_PATH)) {
    return {
      fresh: false,
      path: RESTART_PROOF_PATH,
      passed_at: null,
      age_ms: null,
      reason: `no proof file exists at ${RESTART_PROOF_PATH}`
    };
  }
  try {
    const parsed = JSON.parse(readFileSync8(RESTART_PROOF_PATH, "utf8"));
    const passedAt = typeof parsed.passed_at === "string" ? parsed.passed_at : null;
    const passedMs = passedAt ? Date.parse(passedAt) : Number.NaN;
    if (!Number.isFinite(passedMs)) {
      return {
        fresh: false,
        path: RESTART_PROOF_PATH,
        passed_at: passedAt,
        age_ms: null,
        reason: "proof file is missing a valid passed_at timestamp"
      };
    }
    const ageMs = Date.now() - passedMs;
    if (ageMs > RESTART_PROOF_MAX_AGE_MS) {
      return {
        fresh: false,
        path: RESTART_PROOF_PATH,
        passed_at: passedAt,
        age_ms: ageMs,
        reason: `proof file is stale (${Math.round(ageMs / (24 * 60 * 60 * 1e3))} days old)`
      };
    }
    return {
      fresh: true,
      path: RESTART_PROOF_PATH,
      passed_at: passedAt,
      age_ms: ageMs,
      reason: "fresh restart-survival proof exists"
    };
  } catch (err) {
    return {
      fresh: false,
      path: RESTART_PROOF_PATH,
      passed_at: null,
      age_ms: null,
      reason: `proof file could not be read: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}

// src/commands/doctor.ts
async function readChannel(channel, timeoutMs) {
  try {
    const c = await connect({ surface: "desktop" });
    const data = await new Promise((resolve2) => {
      const timer = setTimeout(() => resolve2(null), timeoutMs);
      c.onMessage((msg) => {
        const env = msg;
        if (env.type === "projection" && env.name === channel) {
          clearTimeout(timer);
          resolve2(env.data);
        }
      });
      c.subscribe(channel);
    });
    c.close();
    return data;
  } catch {
    return null;
  }
}
var ALLEY_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"];
function alleyOf2(title) {
  const m = title.match(/^\[W4-gap\]\s+([A-Z])\.\d+/);
  return m ? m[1] : null;
}
function emoji(status2) {
  if (status2 === "ok") return "+";
  if (status2 === "partial") return "~";
  return "!";
}
async function runDoctor2(args) {
  if (flagBool(args, "help") || args.flags.h === true || args.positional[0] === "help") {
    return runStubContract(args, {
      noun: "doctor",
      status: "available",
      usage: "Usage: ema doctor [--strict] [--json]",
      docRef: "docs/cli/agent-workspace.md",
      commands: [
        { verb: "run", flags: ["strict", "json"], summary: "Check daemon health separately from execution readiness blockers." }
      ]
    });
  }
  const json = flagBool(args, "json");
  const strict = flagBool(args, "strict");
  try {
    const [bp, planner, graph, vcal, laneReg, queueReg] = await Promise.all([
      readChannel("blueprint.sections", 1500),
      readChannel("blueprint.planner", 1500),
      readChannel("intent_graph", 2500),
      readChannel("vcalendar.state", 1500),
      readChannel("lane.registry", 1500),
      readChannel("queue.registry", 1500)
    ]);
    const docs = bp?.documents ?? [];
    const sectionCount = docs.reduce((n, d) => n + (d.sections?.length ?? 0), 0);
    const lanes = laneReg?.lanes ?? [];
    const gapLanes = lanes.filter((l) => l.title.startsWith("[W4-gap]"));
    const gapsByAlley = {};
    for (const a of ALLEY_LETTERS) gapsByAlley[a] = { open: 0, closed: 0 };
    let gapsOpen = 0;
    let gapsClosed = 0;
    for (const l of gapLanes) {
      const a = alleyOf2(l.title);
      if (!a) continue;
      const isClosed = l.status === "done" || l.status === "closed";
      if (isClosed) {
        gapsClosed += 1;
        gapsByAlley[a].closed += 1;
      } else {
        gapsOpen += 1;
        gapsByAlley[a].open += 1;
      }
    }
    const subsystems = [
      { id: "T1.1 workspace-lifecycle-writers", status: "ok", note: "lane + queue lifecycles wired end-to-end" },
      { id: "T1.2 blueprint-planner-ipc-cli", status: "partial", note: "6 of 12 ops in IPC; 6 missing (C.1)" },
      { id: "T1.3 vcalendar-daemon-record", status: "ok", note: "phase canonical via vcalendar.state projection" },
      { id: "T2.1 cross-ref-fields", status: "ok", note: "blueprint_section_id / gac_id / decision_id on lane.opened + queue_item.added" },
      { id: "T2.2 atlas-decisions-bridge", status: "partial", note: "one-way import done; live re-import on edit pending (C.3)" },
      { id: "T2.3 web-blueprint-surface", status: "partial", note: "Blueprint vApp live; 5 EMA vApp stubs not wired (F.1-5)" },
      { id: "T2.4 intent-graph-projection", status: "ok", note: "nodes + edges joined across all 8 kinds" },
      { id: "T2.5 phase-aware-tick", status: "ok", note: "tick reads canonical phase + blocks + checkups_due" },
      { id: "T3.1 soft-phase-enforcement", status: "partial", note: "lane.open wired; 12 other ops pending (A.1)" },
      { id: "T3.2 auto-checkup-tick", status: "partial", note: "v1 on-demand IPC + CLI; periodic actor pending (D.1)" },
      { id: "T3.3 auto-grow-agent", status: "ok", note: "package builds; detector tests pass" },
      { id: "promote-to-proposal", status: "ok", note: "blueprint.section.promote emits proposal.drafted + mirror" },
      { id: "skills-wiki-runtime", status: "missing", note: "design only (H.1, H.2)" },
      { id: "replication-writers", status: "missing", note: "ADR 17/18; not implemented (I.2)" },
      { id: "incidents-projection", status: "missing", note: "incident.noted lands but no aggregator (O.2)" }
    ];
    const phase = (vcal?.current_phase ?? null) || null;
    const projectionFailures = [];
    const allProjectionReadsTimedOut = [bp, planner, graph, vcal, laneReg, queueReg].every((value) => value === null);
    if (allProjectionReadsTimedOut) {
      projectionFailures.push({ id: "daemon.websocket", message: "no daemon projections received before timeout" });
    }
    if (!vcal) projectionFailures.push({ id: "vcalendar.state", message: "missing vcalendar.state projection" });
    if (!laneReg) projectionFailures.push({ id: "lane.registry", message: "missing lane.registry projection" });
    if (!queueReg) projectionFailures.push({ id: "queue.registry", message: "missing queue.registry projection" });
    const roadmapGaps = subsystems.filter((s) => s.status === "partial" || s.status === "missing").map((s) => ({ id: s.id, status: s.status, note: s.note }));
    const readiness = await buildReadiness(args);
    const healthOk = projectionFailures.length === 0;
    const readinessOk = healthOk && readiness.report.blockers.length === 0;
    const report = {
      ok: healthOk,
      health_ok: healthOk,
      readiness_ok: readinessOk,
      daemon: "ws://127.0.0.1:49555",
      canonical_phase: phase,
      blueprint: {
        documents: docs.length,
        sections: sectionCount,
        gac_cards: planner?.gac_cards?.length ?? 0,
        blockers: planner?.blockers?.length ?? 0,
        aspirations: planner?.aspirations?.length ?? 0,
        decisions: planner?.decisions?.length ?? 0
      },
      intent_graph: {
        nodes: graph?.nodes?.length ?? 0,
        edges: graph?.edges?.length ?? 0
      },
      workspace: {
        lanes: lanes.length,
        queue_items: queueReg?.queue_items?.length ?? 0,
        open_lanes: lanes.filter((l) => l.status !== "done" && l.status !== "closed").length
      },
      gaps: {
        total: gapLanes.length,
        open: gapsOpen,
        closed: gapsClosed,
        by_alley: gapsByAlley
      },
      subsystems,
      roadmap_gaps: roadmapGaps,
      blocking_failures: projectionFailures,
      readiness_blockers: readiness.report.blockers
    };
    if (json) {
      emitJson(report);
      return strict ? readinessOk ? 0 : 1 : healthOk ? 0 : 1;
    }
    emitPretty(`# ema doctor`);
    emitPretty(`daemon:           ${report.daemon}`);
    emitPretty(`canonical phase:  ${report.canonical_phase ?? "(unset)"}`);
    emitPretty("");
    emitPretty(`blueprint:        ${report.blueprint.documents} docs \xB7 ${report.blueprint.sections} sections \xB7 ${report.blueprint.gac_cards} GAC \xB7 ${report.blueprint.blockers} blockers \xB7 ${report.blueprint.aspirations} aspirations \xB7 ${report.blueprint.decisions} decisions`);
    emitPretty(`workspace:        ${report.workspace.lanes} lanes (${report.workspace.open_lanes} open) \xB7 ${report.workspace.queue_items} queue items`);
    emitPretty(`intent graph:     ${report.intent_graph.nodes} nodes \xB7 ${report.intent_graph.edges} edges`);
    emitPretty("");
    emitPretty(`gaps (W4):        ${report.gaps.open} open \xB7 ${report.gaps.closed} closed \xB7 ${report.gaps.total} total`);
    emitPretty(`by alley:         ${ALLEY_LETTERS.map((a) => `${a}:${gapsByAlley[a].open}/${gapsByAlley[a].open + gapsByAlley[a].closed}`).join("  ")}`);
    emitPretty("");
    emitPretty(`subsystems:`);
    for (const s of subsystems) {
      emitPretty(`  [${emoji(s.status)}] ${s.id.padEnd(38)} ${s.note}`);
    }
    emitPretty("");
    if (projectionFailures.length > 0) {
      emitPretty("blocking failures:");
      for (const failure of projectionFailures) emitPretty(`  - ${failure.id}: ${failure.message}`);
      emitPretty("");
    }
    if (report.readiness_blockers.length > 0) {
      emitPretty("readiness blockers:");
      for (const blocker of report.readiness_blockers) emitPretty(`  - ${blocker.id}: ${blocker.reason}`);
      emitPretty("");
    }
    emitPretty(`health:           ${healthOk ? "ok" : "blocked"}`);
    emitPretty(`readiness:        ${readinessOk ? "ok" : "execution blockers remain"}`);
    if (!strict && report.readiness_blockers.length > 0) emitPretty("strict mode:      `ema doctor --strict` exits nonzero while readiness blockers remain");
    return strict ? readinessOk ? 0 : 1 : healthOk ? 0 : 1;
  } catch (err) {
    return reportError(err, json);
  }
}

// src/commands/desktop.ts
async function runDesktop(args) {
  const verb = args.positional[0] ?? "presence";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") {
    return runHelp4(args);
  }
  if (verb === "presence") return runPresence(args);
  emitError(`ema desktop: unknown subcommand "${verb}" (expected: presence)`);
  return 64;
}
function runHelp4(args) {
  const commands = [
    { verb: "presence", summary: "Show daemon-backed shared desktop presence." },
    { verb: "presence join", summary: "Join a shared vDesktop presence room." },
    { verb: "presence cursor", summary: "Publish a named cursor position." },
    { verb: "presence location", summary: "Publish current app/window location." },
    { verb: "presence leave", summary: "Leave a shared vDesktop presence room." }
  ];
  if (flagBool(args, "json")) {
    emitJson({ noun: "desktop", projection: "desktop.presence", commands });
    return 0;
  }
  emitPretty("ema desktop - shared vDesktop controls");
  for (const command of commands) emitPretty(`  ${command.verb.padEnd(18)} ${command.summary}`);
  return 0;
}
async function runPresence(args) {
  const action = args.positional[1] ?? "show";
  if (action === "show" || action === "list") return showPresence(args);
  if (action === "join") return sendPresence(args, "desktop.presence.join", await basePayload(args));
  if (action === "leave") {
    return sendPresence(args, "desktop.presence.leave", {
      session_id: flagString(args, "session") ?? "presence:cli"
    });
  }
  if (action === "cursor") {
    return sendPresence(args, "desktop.presence.cursor", {
      ...await basePayload(args),
      x: intFlag(args, "x", 0),
      y: intFlag(args, "y", 0),
      surface: flagString(args, "surface") ?? "desktop",
      window_id: flagString(args, "window") ?? null,
      app_id: flagString(args, "app") ?? null
    });
  }
  if (action === "location") {
    const app = flagString(args, "app");
    if (!app) {
      emitError("ema desktop presence location: --app is required");
      return 64;
    }
    return sendPresence(args, "desktop.presence.location", {
      ...await basePayload(args),
      window_id: flagString(args, "window") ?? null,
      app_id: app,
      label: flagString(args, "label") ?? app
    });
  }
  emitError(`ema desktop presence: unknown action "${action}" (expected: show | join | cursor | location | leave)`);
  return 64;
}
async function showPresence(args) {
  const json = flagBool(args, "json");
  const projection2 = await readProjection(args, {
    name: "desktop.presence",
    pick: (data) => data
  });
  const payload = projection2 ?? {};
  if (json) {
    emitJson({ ok: true, command: "desktop presence show", projection: "desktop.presence", data: payload });
  } else {
    emitPretty("# desktop.presence");
    emitPretty(`source: ${payload.source ?? "(unavailable)"}`);
    emitPretty(`revision: ${payload.revision ?? 0}`);
    emitPretty(`sessions: ${payload.sessions?.length ?? 0}`);
    emitPretty(`cursors: ${payload.cursors?.length ?? 0}`);
    emitPretty(`app locations: ${payload.app_locations?.length ?? 0}`);
  }
  return 0;
}
async function sendPresence(args, op, payload) {
  const json = flagBool(args, "json");
  try {
    const c = await connect({ surface: "desktop" });
    const result = await c.command(op, payload);
    c.close();
    if (json) emitJson({ ok: result.ok, command: op, projection: "desktop.presence", result });
    else emitPretty(`${op}: ${result.ok ? "ok" : "failed"}`);
    return result.ok ? 0 : 1;
  } catch (err) {
    return reportError(err, json);
  }
}
async function basePayload(args) {
  const scope = await resolveWorkspaceScope({ args });
  return {
    org_id: flagString(args, "org") ?? scope.org_id ?? "org:local",
    space_id: flagString(args, "space") ?? scope.space_id ?? "space:local",
    room_id: flagString(args, "room") ?? "desktop_room:default",
    session_id: flagString(args, "session") ?? "presence:cli",
    actor_id: flagString(args, "actor") ?? "actor:codex",
    display_name: flagString(args, "name") ?? "Codex",
    color: flagString(args, "color") ?? "#5eead4"
  };
}
function intFlag(args, name, fallback) {
  const raw = flagString(args, name);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// src/commands/recovery.ts
import { execFile } from "child_process";
import { join as join9 } from "path";
import { promisify } from "util";
var execFileAsync = promisify(execFile);
async function runRecovery(args) {
  const verb = args.positional[0] ?? "scan";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") {
    return runHelp5(args);
  }
  if (verb === "scan") return runScan(args);
  emitError(`ema recovery: unknown subcommand "${verb}" (expected: scan)`);
  return 64;
}
function runHelp5(args) {
  const commands = [
    { verb: "scan", summary: "Read-only desktop-wide donor/lost-work scan." }
  ];
  if (flagBool(args, "json")) {
    emitJson({ noun: "recovery", commands, policy: "donor projects are read-only" });
    return 0;
  }
  emitPretty("ema recovery - read-only donor and lost-work recovery tools");
  for (const command of commands) emitPretty(`  ${command.verb.padEnd(12)} ${command.summary}`);
  emitPretty("");
  emitPretty("Usage: ema recovery scan [--json] [--limit 250] [--max-depth 8] [--kind stale-queue] [--confidence high]");
  return 0;
}
async function runScan(args) {
  const script = join9(EMA_ACTIVE_BUILD, "tooling", "recovery", "desktop-recovery-scan.mjs");
  const argv = [script];
  if (flagBool(args, "json")) argv.push("--json");
  const limit = flagString(args, "limit");
  const maxDepth = flagString(args, "max-depth");
  const source = flagString(args, "source");
  const kind = flagString(args, "kind");
  const confidence = flagString(args, "confidence");
  if (limit) argv.push("--limit", limit);
  if (maxDepth) argv.push("--max-depth", maxDepth);
  if (source) argv.push("--source", source);
  if (kind) argv.push("--kind", kind);
  if (confidence) argv.push("--confidence", confidence);
  try {
    const { stdout } = await execFileAsync("node", argv, {
      cwd: EMA_ACTIVE_BUILD,
      env: {
        ...process.env,
        EMA_DESKTOP_ROOT: DESKTOP_ROOT
      },
      maxBuffer: 20 * 1024 * 1024
    });
    process.stdout.write(stdout);
    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emitError(`ema recovery scan failed: ${message}`);
    return 1;
  }
}

// src/commands/cwt.ts
import { access, readFile as readFile2 } from "fs/promises";
import { homedir } from "os";
import { join as join11, resolve } from "path";

// src/commands/cwt-ingest-writer.ts
import { readFile } from "fs/promises";
import { join as join10 } from "path";
var CWT_SOURCE_PREFIX = "cwt.shared_files:";
async function runCwtIngestWriter(args, root, manifest) {
  const json = flagBool(args, "json");
  const dryRun = flagBool(args, "dry-run");
  const only = onlyFilter(args);
  const snapshot2 = await readSnapshot(root, only);
  if (dryRun) return emitDryRun(json, root, manifest, snapshot2);
  return commit(args, root, manifest, snapshot2, only);
}
function emitDryRun(json, root, manifest, snapshot2) {
  const result = {
    ok: true,
    source: "cwt.shared_files",
    mode: "dry_run",
    root,
    generated_at: manifest.generated_at ?? null,
    counts: manifest.counts ?? {},
    project_storage: projectStoragePolicy(),
    candidates: {
      projects: snapshot2.projects.map((project) => ({
        cwt_id: project.id ?? null,
        name: project.name ?? project.title ?? "(untitled project)",
        kind: project.kind ?? "project",
        status: project.status ?? "active",
        git: {
          target_driver: "git_worktree",
          versioning: "git",
          remote: project.git_remote ?? project.repo_url ?? null,
          default_branch: project.default_branch ?? "main",
          local_path: project.local_path ?? null
        }
      })),
      lanes: snapshot2.lanes.map((lane) => ({
        cwt_id: lane.id ?? null,
        title: lane.title ?? "(untitled lane)",
        status: lane.status ?? "open",
        project_id: lane.project_id ?? null,
        source_marker: lane.id ? marker(lane.id) : null
      })),
      queue_items: snapshot2.queue.map((item) => ({
        cwt_id: item.id ?? null,
        title: item.title ?? "(untitled)",
        why: item.why ?? "",
        done_when: item.done_when ?? "",
        project_id: item.project_id ?? null,
        priority: item.priority ?? null,
        source: item.id ? sourceWithMarker(item.id, item.source) : item.source ?? "cwt.shared_files"
      })),
      problems: snapshot2.problems.map((problem) => ({
        cwt_id: problem.id ?? null,
        title: problem.title ?? "(untitled problem)",
        why: problem.why ?? "",
        project_id: problem.project_id ?? null,
        source_marker: problem.id ? marker(problem.id) : null
      }))
    },
    promotion_boundary: "preview_only"
  };
  if (json) emitJson(result);
  else {
    emitPretty("CWT ingest dry-run");
    emitPretty(`root: ${root}`);
    emitPretty(`lane candidates: ${snapshot2.lanes.length}`);
    emitPretty(`queue candidates: ${snapshot2.queue.length}`);
    emitPretty(`problem candidates: ${snapshot2.problems.length}`);
  }
  return 0;
}
async function commit(args, root, manifest, snapshot2, only) {
  const json = flagBool(args, "json");
  const actorId = flagString(args, "actor") ?? DEFAULT_ACTOR;
  const results = [];
  const laneMirror = /* @__PURE__ */ new Map();
  let client = null;
  try {
    client = await connect({ surface: "desktop" });
    const daemonProjects = await readProjection3(client, "project.filesystem_status", "projects");
    const daemonLanes = await readProjection3(client, "lane.registry", "lanes");
    const daemonQueue = await readProjection3(client, "queue.registry", "queue_items");
    const daemonProblems = await readProjection3(client, "problem.graph", "problems");
    const resolveProject = makeProjectResolver(snapshot2.projects, daemonProjects);
    for (const lane of snapshot2.lanes) {
      const result = await importLane(client, lane, resolveProject, actorId, daemonLanes);
      results.push(result);
      if (lane.id && result.daemon_id) laneMirror.set(lane.id, result.daemon_id);
      if (result.status === "imported" && result.daemon_id) {
        daemonLanes.push({ id: result.daemon_id, lane_id: result.daemon_id, scope: marker(lane.id ?? "") });
      }
    }
    for (const item of snapshot2.queue) {
      const result = await importQueue(client, item, resolveProject, actorId, daemonQueue, laneMirror);
      results.push(result);
      if (result.status === "imported" && result.daemon_id) {
        daemonQueue.push({ id: result.daemon_id, queue_item_id: result.daemon_id, source: marker(item.id ?? "") });
      }
    }
    for (const problem of snapshot2.problems) {
      const result = await importProblem(client, problem, resolveProject, actorId, daemonProblems, laneMirror);
      results.push(result);
      if (result.status === "imported" && result.daemon_id) {
        daemonProblems.push({ id: result.daemon_id, problem_id: result.daemon_id, source: marker(problem.id ?? "") });
      }
    }
  } catch (err) {
    const result = {
      ok: false,
      source: "cwt.shared_files",
      mode: "commit",
      root,
      generated_at: manifest.generated_at ?? null,
      error: err instanceof Error ? err.message : String(err),
      results
    };
    if (json) emitJson(result);
    else emitError(result.error);
    return 1;
  } finally {
    client?.close();
  }
  const summary = summarize3(results);
  const failures = results.filter((result) => result.status === "failed");
  const output = {
    ok: failures.length === 0,
    source: "cwt.shared_files",
    mode: "commit",
    root,
    generated_at: manifest.generated_at ?? null,
    daemon_authority: "canonical_events",
    filter: { all: flagBool(args, "all"), only: only ? [...only] : null },
    summary,
    results,
    promotion_boundary: "daemon_command_writer"
  };
  if (json) emitJson(output);
  else {
    emitPretty("CWT ingest commit");
    emitPretty(`imported: ${summary.imported}`);
    emitPretty(`skipped: ${summary.skipped}`);
    emitPretty(`failed: ${summary.failed}`);
    for (const failure of failures.slice(0, 8)) {
      emitPretty(`  [failed] ${failure.family} ${failure.cwt_id ?? "(no id)"}: ${failure.reason ?? "unknown"}`);
    }
  }
  return failures.length === 0 ? 0 : 1;
}
async function importLane(client, lane, resolveProject, actorId, daemonLanes) {
  const cwtId = lane.id ?? null;
  const title = lane.title ?? "(untitled lane)";
  if (!cwtId) return failed("lane", cwtId, title, "missing cwt id");
  const existing = findMirrored(daemonLanes, cwtId, (record) => record.scope);
  if (existing) return skipped("lane", cwtId, title, daemonId(existing));
  if (lane.local_daemon_mirror_id) return skipped("lane", cwtId, title, lane.local_daemon_mirror_id);
  const project = resolveProject(lane.project_id);
  if (!project.ok) return failed("lane", cwtId, title, project.reason);
  const result = await commandOrFailure(client, "lane.open", {
    org_id: lane.org_id ?? project.org_id ?? DEFAULT_ORG,
    actor_id: actorId,
    name: title,
    project_id: project.project_id,
    mission_id: lane.mission_id ?? null,
    scope: laneScope(lane),
    done_when: lane.done_when ?? lane.why ?? null,
    depends_on: lane.depends_on ?? null
  }, "lane", cwtId, title, project.project_id);
  if (isImportResult(result)) return result;
  return commandResult("lane", cwtId, title, project.project_id, result);
}
async function importQueue(client, item, resolveProject, actorId, daemonQueue, laneMirror) {
  const cwtId = item.id ?? null;
  const title = item.title ?? "(untitled queue item)";
  if (!cwtId) return failed("queue_item", cwtId, title, "missing cwt id");
  if (!item.why?.trim()) return failed("queue_item", cwtId, title, "missing why");
  if (!item.done_when?.trim()) return failed("queue_item", cwtId, title, "missing done_when");
  const existing = findMirrored(daemonQueue, cwtId, (record) => record.source);
  if (existing) return skipped("queue_item", cwtId, title, daemonId(existing));
  if (item.local_daemon_mirror_id) return skipped("queue_item", cwtId, title, item.local_daemon_mirror_id);
  const project = resolveProject(item.project_id);
  if (!project.ok) return failed("queue_item", cwtId, title, project.reason);
  const result = await commandOrFailure(client, "queue.add", {
    org_id: item.org_id ?? project.org_id ?? DEFAULT_ORG,
    actor_id: actorId,
    name: title,
    reason: item.why,
    project_id: project.project_id,
    mission_id: null,
    lane_id: item.lane_id ? laneMirror.get(item.lane_id) ?? null : null,
    depends_on: firstJsonString(item.depends_on_json) ?? item.depends_on ?? null,
    blocked_by: firstJsonString(item.blocked_by_json) ?? item.blocked_by ?? null,
    done_when: item.done_when,
    source: sourceWithMarker(cwtId, item.source)
  }, "queue_item", cwtId, title, project.project_id);
  if (isImportResult(result)) return result;
  return commandResult("queue_item", cwtId, title, project.project_id, result);
}
async function importProblem(client, problem, resolveProject, actorId, daemonProblems, laneMirror) {
  const cwtId = problem.id ?? null;
  const title = problem.title ?? "(untitled problem)";
  if (!cwtId) return failed("problem", cwtId, title, "missing cwt id");
  const existing = findMirrored(daemonProblems, cwtId, (record) => record.source);
  if (existing) return skipped("problem", cwtId, title, daemonId(existing));
  if (problem.local_daemon_mirror_id) return skipped("problem", cwtId, title, problem.local_daemon_mirror_id);
  const project = resolveProject(problem.project_id);
  if (!project.ok) return failed("problem", cwtId, title, project.reason);
  const result = await commandOrFailure(client, "problem.log", {
    org_id: problem.org_id ?? project.org_id ?? DEFAULT_ORG,
    actor_id: actorId,
    title,
    project_id: project.project_id,
    lane_id: problem.lane_id ? laneMirror.get(problem.lane_id) ?? null : null,
    cause: problem.why ?? null,
    source: sourceWithMarker(cwtId, problem.source)
  }, "problem", cwtId, title, project.project_id);
  if (isImportResult(result)) return result;
  return commandResult("problem", cwtId, title, project.project_id, result);
}
async function commandOrFailure(client, op, args, family, cwtId, title, projectId) {
  try {
    return await client.command(op, args);
  } catch (err) {
    return failed(family, cwtId, title, err instanceof Error ? err.message : String(err), projectId);
  }
}
function commandResult(family, cwtId, title, projectId, result) {
  if (result.ok !== true) {
    return failed(family, cwtId, title, `${result.error.class}: ${result.error.message}`, projectId);
  }
  return {
    family,
    cwt_id: cwtId,
    title,
    status: "imported",
    daemon_id: typeof result.resource === "string" ? result.resource : null,
    events: result.events ?? [],
    project_id: projectId
  };
}
function makeProjectResolver(cwtProjects, daemonProjects) {
  const daemonById = /* @__PURE__ */ new Map();
  const daemonByName = /* @__PURE__ */ new Map();
  for (const project of daemonProjects) {
    const id = project.project_id ?? project.id;
    if (id) daemonById.set(id, project);
    if (project.name) daemonByName.set(project.name.toLowerCase(), project);
  }
  const cwtById = new Map(cwtProjects.flatMap((project) => project.id ? [[project.id, project]] : []));
  return (projectId) => {
    if (!projectId) return { ok: true, project_id: null, org_id: null };
    const exact = daemonById.get(projectId);
    if (exact) return { ok: true, project_id: projectId, org_id: exact.org_id ?? null };
    const cwtProject = cwtById.get(projectId);
    const byName = cwtProject?.name ? daemonByName.get(cwtProject.name.toLowerCase()) : null;
    if (byName) return { ok: true, project_id: byName.project_id ?? byName.id ?? projectId, org_id: byName.org_id ?? cwtProject?.org_id ?? null };
    return { ok: false, reason: `daemon project not found for ${projectId}; run project seeding/materialization before importing this record` };
  };
}
async function readSnapshot(root, only) {
  return {
    projects: await readRecords3(root, "projects", null),
    lanes: await readRecords3(root, "lanes", only),
    queue: await readRecords3(root, "queue", only),
    problems: await readRecords3(root, "problems", only)
  };
}
async function readRecords3(root, dir, only) {
  const index = await readJson(join10(root, "records", dir, "index.json"));
  const rows = [];
  for (const ref of index?.records ?? []) {
    const row = await readJson(join10(root, ref.path));
    if (!row || !isOpen(row)) continue;
    if (only && (!row.id || !only.has(row.id))) continue;
    rows.push(row);
  }
  return rows;
}
async function readProjection3(client, name, key) {
  return new Promise((resolve2) => {
    const timer = setTimeout(() => resolve2([]), 1500);
    client.onMessage((msg) => {
      if (msg.type !== "projection" || msg.name !== name) return;
      clearTimeout(timer);
      const data = msg.data ?? {};
      resolve2(data[key] ?? []);
    });
    client.subscribe(name);
  });
}
async function readJson(path2) {
  try {
    return JSON.parse(await readFile(path2, "utf8"));
  } catch {
    return null;
  }
}
function isOpen(row) {
  if (row.tombstone) return false;
  return !["done", "dropped", "closed", "archived"].includes(row.status ?? "");
}
function skipped(family, cwtId, title, daemonId2) {
  return { family, cwt_id: cwtId, title, status: "skipped", daemon_id: daemonId2, events: [], reason: "already mirrored" };
}
function failed(family, cwtId, title, reason, projectId = null) {
  return { family, cwt_id: cwtId, title, status: "failed", daemon_id: null, events: [], project_id: projectId, reason };
}
function summarize3(results) {
  return {
    imported: results.filter((result) => result.status === "imported").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    failed: results.filter((result) => result.status === "failed").length,
    lanes: summarizeFamily(results, "lane"),
    queue_items: summarizeFamily(results, "queue_item"),
    problems: summarizeFamily(results, "problem")
  };
}
function summarizeFamily(results, family) {
  const scoped = results.filter((result) => result.family === family);
  return {
    imported: scoped.filter((result) => result.status === "imported").length,
    skipped: scoped.filter((result) => result.status === "skipped").length,
    failed: scoped.filter((result) => result.status === "failed").length
  };
}
function findMirrored(records, cwtId, pick) {
  const source = marker(cwtId);
  return records.find((record) => pick(record)?.includes(source)) ?? null;
}
function daemonId(record) {
  return record.id ?? record.lane_id ?? record.queue_item_id ?? record.problem_id ?? null;
}
function isImportResult(value) {
  return typeof value.family === "string" && "cwt_id" in value;
}
function onlyFilter(args) {
  const raw = flagString(args, "only");
  if (!raw) return null;
  const ids = raw.split(",").map((id) => id.trim()).filter(Boolean);
  return ids.length > 0 ? new Set(ids) : null;
}
function marker(id) {
  return `${CWT_SOURCE_PREFIX}${id}`;
}
function sourceWithMarker(id, source) {
  const sourceMarker = marker(id);
  if (!source?.trim()) return sourceMarker;
  if (source.includes(sourceMarker)) return source;
  return `${sourceMarker} | ${source}`;
}
function laneScope(lane) {
  return [
    lane.id ? marker(lane.id) : null,
    parseScopeJson(lane.scope_json ?? void 0),
    lane.why,
    lane.tags ? `tags=${lane.tags}` : null
  ].filter((part) => Boolean(part && part.trim())).join(" | ") || "Imported from CWT shared-files projection.";
}
function parseScopeJson(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === "string").join(", ");
  } catch {
    return raw;
  }
  return raw;
}
function firstJsonString(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.find((item) => typeof item === "string" && item.length > 0) ?? null;
  } catch {
    return raw.trim() || null;
  }
  return null;
}
function projectStoragePolicy() {
  return {
    driver: "git_worktree",
    versioning: "git",
    target_policy: "project_git_repo"
  };
}

// src/commands/cwt.ts
var DOC_REF7 = "docs/architecture/20-cwt-integration.md";
async function runCwt(args) {
  const verb = args.positional[0];
  if (!verb || verb === "help" || flagBool(args, "help") || args.flags.h === true) {
    return runStubContract(args, {
      noun: "cwt",
      status: "available",
      docRef: DOC_REF7,
      commands: [
        {
          verb: "status",
          flags: ["root"],
          summary: "Inspect the current-work-tracker shared-files projection."
        },
        {
          verb: "ingest",
          flags: ["root", "dry-run", "all", "only"],
          summary: "Preview or commit CWT records into EMA daemon records."
        }
      ]
    });
  }
  if (verb === "status") return runStatus4(args);
  if (verb === "ingest") return runIngest(args);
  emitError(`ema cwt: unknown subcommand "${verb}" (expected: status, ingest)`);
  return 64;
}
async function runStatus4(args) {
  const json = flagBool(args, "json");
  const root = projectionRoot(args);
  const manifest = await readManifest(root);
  if (!manifest) {
    const result2 = {
      ok: false,
      source: "cwt.shared_files",
      status: "missing_projection",
      root,
      expected: join11(root, "manifest.json"),
      next: "Run CWT and send `sync` in the in-app Agent Chat."
    };
    if (json) emitJson(result2);
    else {
      emitPretty("CWT projection missing");
      emitPretty(`root: ${root}`);
      emitPretty(result2.next);
    }
    return 1;
  }
  const statePath = join11(root, manifest.local_n_sync?.current_state ?? "local-n-sync/current-state.md");
  const stateExists = await exists(statePath);
  const result = {
    ok: true,
    source: "cwt.shared_files",
    status: "projection_found",
    root,
    generated_at: manifest.generated_at ?? null,
    projection: manifest.projection ?? null,
    counts: manifest.counts ?? {},
    local_n_sync: manifest.local_n_sync ?? null,
    project_storage: projectStoragePolicy2(),
    current_state_exists: stateExists,
    next: "ema cwt ingest --dry-run --json"
  };
  if (json) emitJson(result);
  else {
    emitPretty("CWT projection found");
    emitPretty(`root: ${root}`);
    emitPretty(`generated: ${result.generated_at ?? "(unknown)"}`);
    emitPretty(`projects: ${result.counts.projects ?? 0}`);
    emitPretty(`queue items: ${result.counts.queue_items ?? 0}`);
    emitPretty(`next: ${result.next}`);
  }
  return 0;
}
async function runIngest(args) {
  const json = flagBool(args, "json");
  const root = projectionRoot(args);
  const manifest = await readManifest(root);
  if (!manifest) {
    if (json) emitJson({ ok: false, status: "missing_projection", root });
    else emitError(`CWT projection missing at ${root}`);
    return 1;
  }
  return runCwtIngestWriter(args, root, manifest);
}
function projectStoragePolicy2() {
  return {
    driver: "git_worktree",
    versioning: "git",
    target_policy: "project_git_repo"
  };
}
function projectionRoot(args) {
  const raw = flagString(args, "root");
  if (raw) return resolve(raw);
  return resolve(
    homedir(),
    "Desktop",
    "Space shared files-uploads-vDesktop-vFilesystem-root",
    "current-work-tracker-trajan"
  );
}
async function readManifest(root) {
  return readJson2(join11(root, "manifest.json"));
}
async function readJson2(path2) {
  try {
    return JSON.parse(await readFile2(path2, "utf8"));
  } catch {
    return null;
  }
}
async function exists(path2) {
  try {
    await access(path2);
    return true;
  } catch {
    return false;
  }
}

// src/commands/cockpit.ts
import { execFile as execFile2 } from "child_process";
import { existsSync as existsSync12, readdirSync as readdirSync6, readFileSync as readFileSync10 } from "fs";
import { basename as basename2, join as join14 } from "path";
import { promisify as promisify2 } from "util";

// src/commands/intention.ts
import { existsSync as existsSync11, mkdirSync as mkdirSync5, readFileSync as readFileSync9, readdirSync as readdirSync5, statSync as statSync5, writeFileSync as writeFileSync6 } from "fs";
import { homedir as homedir2 } from "os";
import { basename, dirname as dirname5, join as join13 } from "path";

// src/commands/workspace.ts
import { existsSync as existsSync10 } from "fs";
import { join as join12 } from "path";
var CONTRACT_KINDS = /* @__PURE__ */ new Set(["report", "note", "output", "session_log", "proof", "other"]);
var LEGACY_KIND_ALIASES = /* @__PURE__ */ new Set(["plan", "handoff", "context_bundle", "session_export"]);
var SOURCE = "daemon_canonical_events";
var DAEMON_AUTHORITY = "daemon_artifact_writer";
async function runWorkspace(args) {
  const noun = args.positional[0];
  const verb = args.positional[1] ?? "list";
  if (flagBool(args, "help") || args.flags.h === true || noun === "help") return help2(args);
  if (noun !== "artifact" && noun !== "artifacts") {
    emitError(`ema workspace: unknown subcommand "${noun ?? ""}" (expected: artifact)`);
    return 64;
  }
  if (verb === "add") return addArtifact(args);
  if (verb === "update") return updateArtifact(args);
  if (verb === "list") return listArtifacts(args);
  if (verb === "show") return showArtifact(args);
  if (verb === "link") return linkArtifact(args);
  if (verb === "archive") return archiveArtifact(args);
  emitError(`ema workspace artifact: unknown action "${verb}" (expected: add | update | list | show | link | archive)`);
  return 64;
}
function help2(args) {
  const commands = [
    { verb: "artifact add", summary: "Create a daemon-canonical workspace artifact." },
    { verb: "artifact update", summary: "Update artifact content through the daemon writer." },
    { verb: "artifact list", summary: "List daemon-canonical workspace artifacts for the resolved project." },
    { verb: "artifact show", summary: "Show one artifact by --artifact." },
    { verb: "artifact link", summary: "Link an artifact to a lane, queue item, execution, dispatch, project, or intention." },
    { verb: "artifact archive", summary: "Archive an artifact through the daemon writer." }
  ];
  if (flagBool(args, "json")) emitJson({ noun: "workspace", status: "available", commands });
  else {
    emitPretty("ema workspace - shared project artifacts");
    for (const command of commands) emitPretty(`  ${command.verb.padEnd(18)} ${command.summary}`);
  }
  return 0;
}
async function addArtifact(args) {
  const scope = await resolveWorkspaceScope({ args });
  const rawKind = flagString(args, "kind") ?? "note";
  const kind = normalizeKind(rawKind);
  const title = flagString(args, "title");
  const bodyFile = flagString(args, "body-file");
  if (!kind) return usage(`invalid --kind ${rawKind}`);
  if (!title || !bodyFile) return usage("artifact add requires --title and --body-file");
  if (!existsSync10(bodyFile)) return usage(`body file not found: ${bodyFile}`);
  const projectId = projectIdFor(scope);
  const body = readText(bodyFile);
  const result = await artifactCommand("artifact.create", scope, {
    project_id: projectId,
    source_type: kind,
    title,
    source: bodyFile,
    body
  });
  if (!result.ok) return daemonError(args, "workspace.artifact.add", result);
  const id = String(result.resource ?? "");
  const artifact = findArtifact(scope, id);
  const payload = {
    ok: Boolean(artifact),
    command: "workspace.artifact.add",
    source: SOURCE,
    daemon_authority: DAEMON_AUTHORITY,
    workspace_scope: scope,
    artifact: artifact ?? { id, kind, title, content_hash: sha256(body), status: "active" },
    events: result.events ?? [],
    index: CANONICAL_DB
  };
  if (flagBool(args, "json")) emitJson(payload);
  else emitPretty(`artifact: ${id}
path: ${artifact?.path ?? "(pending projection)"}`);
  return artifact ? 0 : 1;
}
async function updateArtifact(args) {
  const id = flagString(args, "artifact") ?? args.positional[2];
  const bodyFile = flagString(args, "body-file");
  if (!id || !bodyFile) return usage("artifact update requires --artifact and --body-file");
  if (!existsSync10(bodyFile)) return usage(`body file not found: ${bodyFile}`);
  const scope = await resolveWorkspaceScope({ args });
  const current = findArtifact(scope, id);
  if (!current) return notFound(args, "workspace.artifact.update", scope, id);
  const rawKind = flagString(args, "kind") ?? current.kind;
  const kind = normalizeKind(rawKind);
  if (!kind) return usage(`invalid --kind ${rawKind}`);
  const title = flagString(args, "title") ?? current.title;
  const body = readText(bodyFile);
  const result = await artifactCommand("artifact.update", scope, {
    project_id: projectIdFor(scope),
    document_id: id,
    source_type: kind,
    title,
    source: bodyFile,
    body
  });
  if (!result.ok) return daemonError(args, "workspace.artifact.update", result);
  const artifact = findArtifact(scope, id);
  const payload = {
    ok: Boolean(artifact),
    command: "workspace.artifact.update",
    source: SOURCE,
    daemon_authority: DAEMON_AUTHORITY,
    workspace_scope: scope,
    artifact,
    events: result.events ?? [],
    index: CANONICAL_DB
  };
  if (flagBool(args, "json")) emitJson(payload);
  else emitPretty(`artifact updated: ${id}`);
  return artifact ? 0 : 1;
}
async function listArtifacts(args) {
  const scope = await resolveWorkspaceScope({ args });
  const kind = flagString(args, "kind");
  const normalizedKind = kind ? normalizeKind(kind) : null;
  if (kind && !normalizedKind) return usage(`invalid --kind ${kind}`);
  const artifacts = listCanonicalArtifacts(scope).artifacts.filter((artifact) => !normalizedKind || artifact.kind === normalizedKind).sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? "") || a.title.localeCompare(b.title));
  const payload = {
    ok: true,
    command: "workspace.artifact.list",
    source: SOURCE,
    daemon_authority: DAEMON_AUTHORITY,
    workspace_scope: scope,
    index: CANONICAL_DB,
    artifacts
  };
  if (flagBool(args, "json")) emitJson(payload);
  else for (const row of artifacts) emitPretty(`${row.id} [${row.kind}] ${row.title}`);
  return 0;
}
async function showArtifact(args) {
  const id = flagString(args, "artifact") ?? args.positional[2];
  if (!id) return usage("artifact show requires --artifact");
  const scope = await resolveWorkspaceScope({ args });
  const state = listCanonicalArtifacts(scope);
  const artifact = state.artifacts.find((row) => row.id === id) ?? null;
  const links = state.links.filter((link) => link.artifact_id === id);
  const body = artifact && existsSync10(artifact.path) ? readText(artifact.path) : null;
  const payload = {
    ok: Boolean(artifact),
    command: "workspace.artifact.show",
    source: SOURCE,
    daemon_authority: DAEMON_AUTHORITY,
    workspace_scope: scope,
    artifact,
    links,
    body,
    events: state.events.filter((event) => event.artifact_id === id)
  };
  if (flagBool(args, "json")) emitJson(payload);
  else if (artifact) emitPretty(body ?? JSON.stringify(artifact, null, 2));
  else emitError(`artifact not found: ${id}`);
  return artifact ? 0 : 1;
}
async function linkArtifact(args) {
  const artifactId = flagString(args, "artifact");
  const targetKind = flagString(args, "target-kind");
  const targetId = flagString(args, "target-id");
  if (!artifactId || !targetKind || !targetId) return usage("artifact link requires --artifact, --target-kind, and --target-id");
  const scope = await resolveWorkspaceScope({ args });
  const artifact = findArtifact(scope, artifactId);
  if (!artifact) return notFound(args, "workspace.artifact.link", scope, artifactId);
  const result = await artifactCommand("artifact.link", scope, {
    project_id: projectIdFor(scope),
    document_id: artifact.id,
    source_type: artifact.kind,
    title: artifact.title,
    result: artifact.content_hash,
    source: artifact.storage_path,
    duration_ms: artifact.bytes,
    target_kind: targetKind,
    target_value: targetId
  });
  if (!result.ok) return daemonError(args, "workspace.artifact.link", result);
  const link = {
    id: stableId("artifact_link", `${artifactId}:${targetKind}:${targetId}`),
    artifact_id: artifactId,
    target_kind: targetKind,
    target_id: targetId,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const payload = {
    ok: true,
    command: "workspace.artifact.link",
    source: SOURCE,
    daemon_authority: DAEMON_AUTHORITY,
    workspace_scope: scope,
    link,
    events: result.events ?? [],
    index: CANONICAL_DB
  };
  if (flagBool(args, "json")) emitJson(payload);
  else emitPretty(`link: ${link.id}`);
  return 0;
}
async function archiveArtifact(args) {
  const artifactId = flagString(args, "artifact") ?? args.positional[2];
  if (!artifactId) return usage("artifact archive requires --artifact");
  const scope = await resolveWorkspaceScope({ args });
  const artifact = findArtifact(scope, artifactId);
  if (!artifact) return notFound(args, "workspace.artifact.archive", scope, artifactId);
  const result = await artifactCommand("artifact.archive", scope, {
    project_id: projectIdFor(scope),
    document_id: artifact.id,
    source_type: artifact.kind,
    title: artifact.title,
    result: artifact.content_hash,
    source: artifact.storage_path,
    duration_ms: artifact.bytes,
    reason: flagString(args, "reason") ?? "archived by CLI"
  });
  if (!result.ok) return daemonError(args, "workspace.artifact.archive", result);
  const archived = findArtifact(scope, artifactId);
  const payload = {
    ok: Boolean(archived),
    command: "workspace.artifact.archive",
    source: SOURCE,
    daemon_authority: DAEMON_AUTHORITY,
    workspace_scope: scope,
    artifact: archived,
    events: result.events ?? [],
    index: CANONICAL_DB
  };
  if (flagBool(args, "json")) emitJson(payload);
  else emitPretty(`artifact archived: ${artifactId}`);
  return archived ? 0 : 1;
}
async function artifactCommand(op, scope, commandArgs) {
  const client = await connect({ surface: "desktop" });
  try {
    return await client.command(op, {
      org_id: scope.org_id ?? DEFAULT_ORG,
      ...commandArgs
    });
  } finally {
    client.close();
  }
}
function listCanonicalArtifacts(scope) {
  const rows = sqliteJson(CANONICAL_DB, `
    select txid, event_id, kind, ts, project_id, payload_json
    from events
    where kind like 'artifact.%'
    order by txid asc;
  `);
  const artifacts = /* @__PURE__ */ new Map();
  const links = [];
  const events2 = [];
  for (const row of rows) {
    const payload = parsePayload3(row.payload_json);
    const id = stringValue(payload.artifact_id);
    if (!id || !eventMatchesScope(scope, row, payload)) continue;
    events2.push({ ...row, payload, artifact_id: id });
    const metadata = objectValue(payload.metadata);
    const kind = stringValue(payload.kind) ?? "other";
    const title = stringValue(metadata.title) ?? id;
    const contentHash = stringValue(payload.content_hash) ?? "";
    const storagePath = stringValue(payload.storage_path) ?? "";
    const bytes = numberValue(payload.bytes) ?? 0;
    if (row.kind === "artifact.created" || row.kind === "artifact.updated") {
      const previous = artifacts.get(id);
      artifacts.set(id, {
        id,
        project_id: stringValue(payload.project) ?? row.project_id ?? projectIdFor(scope),
        kind,
        title,
        path: absoluteStoragePath(storagePath),
        storage_path: storagePath,
        source_path: stringValue(metadata.source_path),
        content_hash: contentHash,
        bytes,
        status: previous?.status ?? "active",
        created_at: previous?.created_at ?? row.ts,
        updated_at: row.ts
      });
    }
    if (row.kind === "artifact.linked") {
      const targetKind = stringValue(metadata.target_kind) ?? "unknown";
      const targetId = stringValue(metadata.target_id) ?? "unknown";
      links.push({
        id: stableId("artifact_link", `${id}:${targetKind}:${targetId}`),
        artifact_id: id,
        target_kind: targetKind,
        target_id: targetId,
        created_at: row.ts
      });
    }
    if (row.kind === "artifact.archived") {
      const previous = artifacts.get(id);
      artifacts.set(id, {
        id,
        project_id: stringValue(payload.project) ?? row.project_id ?? projectIdFor(scope),
        kind,
        title,
        path: absoluteStoragePath(storagePath),
        storage_path: storagePath,
        source_path: previous?.source_path ?? null,
        content_hash: contentHash,
        bytes,
        status: "archived",
        created_at: previous?.created_at ?? row.ts,
        updated_at: row.ts
      });
    }
  }
  return { artifacts: [...artifacts.values()], links, events: events2 };
}
function findArtifact(scope, artifactId) {
  return listCanonicalArtifacts(scope).artifacts.find((artifact) => artifact.id === artifactId) ?? null;
}
function normalizeKind(value) {
  const clean = value.trim().toLowerCase();
  if (CONTRACT_KINDS.has(clean)) return clean;
  if (LEGACY_KIND_ALIASES.has(clean)) return "other";
  return null;
}
function parsePayload3(value) {
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return objectValue(parsed);
  } catch {
    return {};
  }
}
function eventMatchesScope(scope, row, payload) {
  const expected = scope.project_id;
  if (!expected) return true;
  const actual = stringValue(payload.project) ?? row.project_id;
  return actual === expected;
}
function objectValue(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function stringValue(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}
function numberValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function absoluteStoragePath(storagePath) {
  return storagePath.startsWith("/") ? storagePath : join12(EMA_ACTIVE_BUILD, storagePath);
}
function projectIdFor(scope) {
  return scope.project_id ?? scope.project_name ?? "ema-0-0-6";
}
function usage(message) {
  emitError(`ema workspace: ${message}`);
  return 64;
}
function notFound(args, command, scope, artifact) {
  const payload = {
    ok: false,
    command,
    source: SOURCE,
    daemon_authority: DAEMON_AUTHORITY,
    workspace_scope: scope,
    error: { class: "not_found", message: `artifact not found: ${artifact}` }
  };
  if (flagBool(args, "json")) emitJson(payload);
  else emitError(payload.error.message);
  return 1;
}
function daemonError(args, command, result) {
  const error = result.ok ? { class: "unknown", message: "daemon command did not return an artifact" } : result.error;
  if (flagBool(args, "json")) emitJson({ ok: false, command, source: SOURCE, daemon_authority: DAEMON_AUTHORITY, error });
  else emitError(`ema workspace: ${error.message}`);
  return 1;
}

// src/commands/intention.ts
var STORE_ROOT = join13(DESKTOP_ROOT, "Active builds", "EMA-0.0.6", ".ema-dev", "intention-backfeed");
var REVIEWS_PATH = join13(STORE_ROOT, "reviews.json");
var DEFAULT_PROJECT = "proslync-app-ios-final";
async function runIntention(args) {
  const verb = args.positional[0] ?? "projection";
  if (verb === "help" || flagBool(args, "help") || args.flags.h === true) {
    printHelp();
    return 0;
  }
  if (verb === "harvest") return harvest(args);
  if (verb === "projection") return projection(args);
  if (verb === "list") return list2(args);
  if (verb === "show") return show(args);
  if (verb === "backfeed") return backfeed(args);
  if (verb === "review") return reviewFromVerb(args);
  if (verb === "accept") return reviewIntent(args, "accepted");
  if (verb === "reject") return reviewIntent(args, "rejected");
  if (verb === "defer") return reviewIntent(args, "deferred");
  emitError(`ema intention: unknown subcommand "${verb}"`);
  emitError("Usage: ema intention [harvest|projection|list|show|review|accept|reject|defer|backfeed] [--project <name>] [--json]");
  return 64;
}
async function loadIntentionProjection(args) {
  const project = await projectName(args);
  const stored = readStoredProjection(project);
  return applyReviews(stored ?? emptyProjection(project));
}
async function harvest(args) {
  const project = await projectName(args);
  const maxSources = parsePositiveInt(flagString(args, "max-sources"), 100);
  const maxRecordsPerSource = parsePositiveInt(flagString(args, "max-records-per-source"), 500);
  const sources = discoverSources(project).slice(0, maxSources);
  const { intents, recordsParsed, duplicatesSkipped } = parseSources(sources, maxRecordsPerSource);
  const projection2 = buildProjection(project, sources.length, recordsParsed, duplicatesSkipped, intents);
  writeStoredProjection(project, projection2);
  const reviewedProjection = applyReviews(projection2);
  emit(args, reviewedProjection, () => {
    emitPretty(`harvested ${reviewedProjection.stats.candidate_intents} candidate intentions`);
    emitPretty(`sources: ${reviewedProjection.stats.sources_seen}`);
    emitPretty(`proslync: ${reviewedProjection.stats.proslync_relevant}`);
    emitPretty(`lost followups: ${reviewedProjection.stats.lost_followups}`);
  });
  return 0;
}
async function projection(args) {
  const value = await loadIntentionProjection(args);
  emit(args, value, () => printProjection(value));
  return 0;
}
async function list2(args) {
  const value = await loadIntentionProjection(args);
  const tag = flagString(args, "tag");
  const state = flagString(args, "state");
  const items = value.intents.filter((intent) => {
    if (tag && !intent.tags.includes(tag)) return false;
    if (state && intent.review_state !== state) return false;
    return true;
  });
  const payload = { ...value, command: "intention.list", intents: items };
  emit(args, payload, () => {
    if (items.length === 0) {
      emitPretty("No harvested intentions match.");
      return;
    }
    for (const intent of items) {
      emitPretty(`${intent.id} [${intent.review_state}] ${intent.title}`);
      emitPretty(`  tags: ${intent.tags.join(", ") || "(none)"}`);
      emitPretty(`  destination: ${intent.recommended_destination}`);
      emitPretty(`  evidence: ${intent.evidence_ref}`);
    }
  });
  return 0;
}
async function show(args) {
  const id = flagString(args, "intent");
  if (!id) {
    emitError("ema intention show: --intent is required");
    return 64;
  }
  const value = await loadIntentionProjection(args);
  const found = findIntent(value, id) ?? findIntentAcrossStore(id);
  const intent = found?.intent ?? null;
  emit(args, { ok: intent != null, command: "intention.show", intent }, () => {
    if (!intent) emitPretty(`intent not found: ${id}`);
    else emitPretty(JSON.stringify(intent, null, 2));
  });
  return intent ? 0 : 1;
}
async function backfeed(args) {
  const id = flagString(args, "intent");
  if (!id) {
    emitError("ema intention backfeed: --intent is required");
    return 64;
  }
  const destination = flagString(args, "destination") ?? "queue";
  if (destination !== "queue" && destination !== "artifact") {
    emitError("ema intention backfeed: --destination must be queue or artifact");
    return 64;
  }
  const scopedProjection = await loadIntentionProjection(args);
  const found = findIntent(scopedProjection, id) ?? findIntentAcrossStore(id);
  if (!found) {
    emitError(`ema intention backfeed: intent not found: ${id}`);
    return 1;
  }
  const { projection: value, intent } = found;
  const targetProject = flagString(args, "project") ?? targetProjectForIntent(value.project ?? DEFAULT_PROJECT, intent);
  const queueCommand = queueAddCommand(targetProject, intent);
  if (flagBool(args, "dry-run")) {
    emit(args, {
      ok: true,
      command: "intention.backfeed",
      mode: "dry_run",
      destination,
      target_project: targetProject,
      queue_command: destination === "queue" ? queueCommand : null,
      artifact_preview: destination === "artifact" ? artifactBody(intent) : null,
      intent
    }, () => {
      emitPretty(destination === "queue" ? queueCommand.join(" ") : artifactBody(intent));
    });
    return 0;
  }
  if (flagString(args, "approve") !== "reviewed") {
    emitError("ema intention backfeed: non-dry-run requires --approve reviewed");
    return 64;
  }
  if (intent.review_state !== "accepted") {
    emitError("ema intention backfeed: non-dry-run requires an accepted review state");
    return 64;
  }
  if (destination === "artifact") {
    const bodyPath = writeBackfeedBody(intent);
    return runWorkspace({
      positional: ["artifact", "add"],
      flags: {
        ...args.flags,
        project: targetProject,
        kind: "note",
        title: intent.title,
        "body-file": bodyPath
      }
    });
  }
  return runQueue({
    positional: ["add"],
    flags: {
      ...args.flags,
      project: targetProject,
      title: intent.title,
      why: `${intent.raw_text.slice(0, 400)} Evidence: ${intent.evidence_ref}`,
      "done-when": `Reviewed intention is either shipped, rejected, or merged into the current project plan. Source: ${intent.id}`,
      source: intent.evidence_ref
    }
  });
}
async function reviewFromVerb(args) {
  const raw = flagString(args, "state");
  if (raw !== "accepted" && raw !== "rejected" && raw !== "deferred") {
    emitError("ema intention review: --state must be accepted, rejected, or deferred");
    return 64;
  }
  return reviewIntent(args, raw);
}
async function reviewIntent(args, state) {
  const id = flagString(args, "intent");
  if (!id) {
    emitError(`ema intention ${state}: --intent is required`);
    return 64;
  }
  const reason = flagString(args, "reason") ?? "reviewed in cockpit";
  const reviewer = flagString(args, "reviewer") ?? "actor:trajan";
  const scopedProjection = await loadIntentionProjection(args);
  const found = findIntent(scopedProjection, id) ?? findIntentAcrossStore(id);
  if (!found) {
    emitError(`ema intention ${state}: intent not found: ${id}`);
    return 1;
  }
  const review = {
    intent_id: id,
    state,
    reviewer,
    reason,
    reviewed_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const reviews = readReviews().filter((item) => item.intent_id !== id);
  writeReviews([...reviews, review]);
  const reviewedProjection = applyReviews(found.projection);
  const reviewedIntent = findIntent(reviewedProjection, id)?.intent ?? { ...found.intent, review_state: state };
  emit(args, { ok: true, command: `intention.${state}`, review, intent: reviewedIntent }, () => {
    emitPretty(`${id} -> ${state}`);
  });
  return 0;
}
function targetProjectForIntent(fallbackProject, intent) {
  if (intent.recommended_destination === "ema_queue") return intent.project_hint ?? "EMA";
  if (intent.recommended_destination === "proslync_queue") return intent.project_hint ?? fallbackProject;
  return intent.project_hint ?? fallbackProject;
}
function printHelp() {
  emitPretty("ema intention - session/history intention backfeed");
  emitPretty("");
  emitPretty("Usage:");
  emitPretty("  ema intention harvest --project proslync-app-ios-final --max-sources 100 [--json]");
  emitPretty("  ema intention projection --project proslync-app-ios-final [--json]");
  emitPretty("  ema intention list --project proslync-app-ios-final [--tag lost_followup] [--json]");
  emitPretty("  ema intention list --project proslync-app-ios-final --state accepted [--json]");
  emitPretty("  ema intention show --intent <id> [--json]");
  emitPretty("  ema intention accept --intent <id> --reason <text> --reviewer actor:trajan [--json]");
  emitPretty("  ema intention reject --intent <id> --reason <text> --reviewer actor:trajan [--json]");
  emitPretty("  ema intention defer --intent <id> --reason <text> --reviewer actor:trajan [--json]");
  emitPretty("  ema intention review --intent <id> --state accepted|rejected|deferred --reason <text> [--json]");
  emitPretty("  ema intention backfeed --intent <id> --destination queue --dry-run [--json]");
  emitPretty("  ema intention backfeed --intent <id> --destination queue|artifact --approve reviewed [--json]");
}
function printProjection(value) {
  emitPretty(`${value.project ?? "(unresolved project)"} intention projection`);
  emitPretty(`sources: ${value.stats.sources_seen}`);
  emitPretty(`candidates: ${value.stats.candidate_intents}`);
  emitPretty(`proslync: ${value.stats.proslync_relevant}`);
  emitPretty(`ema: ${value.stats.ema_relevant}`);
  emitPretty(`lost followups: ${value.stats.lost_followups}`);
  emitPretty(`recommended queue: ${value.recommended_queue.length}`);
}
function emit(args, payload, pretty) {
  if (flagBool(args, "json")) emitJson(payload);
  else pretty();
}
async function projectName(args) {
  const explicit = flagString(args, "project");
  if (explicit) return explicit;
  const scope = await resolveWorkspaceScope({ args });
  return scope.project_name ?? DEFAULT_PROJECT;
}
function discoverSources(project) {
  const home = homedir2();
  const paths = [
    join13(DESKTOP_ROOT, "Active builds", "EMA-0.0.6", "docs", "architecture", "18-harness-glue.md"),
    join13(DESKTOP_ROOT, "Active builds", "EMA-0.0.6", "docs", "architecture", "24-harness-vapp-launch.md"),
    join13(DESKTOP_ROOT, "Active builds", "EMA-0.0.6", "docs", "vapps", "duct-tape-onion-harness.md"),
    join13(DESKTOP_ROOT, "Active builds", "EMA-0.0.6", "docs", "superpowers", "specs", "2026-05-09-intention-backlog-farmer.md"),
    join13(DESKTOP_ROOT, "Projects", "EMA", "atlas", "workspace", "cmux-native-orchestrator-proposal.md"),
    ...projectDocs(join13(DESKTOP_ROOT, "Projects", "ema-agent-multiplexer-interface")),
    ...proslyncDocs(),
    join13(home, ".codex/memories/MEMORY.md"),
    ...expandGlob(join13(home, ".codex/memories/rollout_summaries")),
    ...projectDocs(join13(DESKTOP_ROOT, "Active builds", "chronicle")),
    ...projectDocs(join13(DESKTOP_ROOT, "Projects", "chronicle")),
    ...projectDocs(join13(DESKTOP_ROOT, "Active builds", "duct-tape-onion-harness")),
    ...projectDocs(join13(DESKTOP_ROOT, "Projects", "duct-tape-onion-harness")),
    join13(home, ".codex/history.jsonl"),
    join13(home, ".codex/session_index.jsonl"),
    ...expandGlob(join13(home, ".claude/projects")),
    ...expandGlob(join13(home, ".codex/sessions")),
    ...expandGlob(join13(home, ".codex/archived_sessions"))
  ];
  const seen = /* @__PURE__ */ new Set();
  return paths.filter((path2) => existsSync11(path2) && safeStat(path2)?.isFile()).filter((path2) => {
    if (seen.has(path2)) return false;
    seen.add(path2);
    return true;
  }).map((path2) => sourceForPath(path2, project));
}
function expandGlob(root) {
  if (!existsSync11(root)) return [];
  const out = [];
  const stack = [root];
  while (stack.length > 0 && out.length < 500) {
    const current = stack.pop();
    const stat = safeStat(current);
    if (!stat) continue;
    if (stat.isFile() && interestingFile(current)) {
      out.push(current);
      continue;
    }
    if (!stat.isDirectory() || skipDir(current)) continue;
    for (const name of readdirSync5(current)) stack.push(join13(current, name));
  }
  return out.sort();
}
function projectDocs(root) {
  return [
    "AGENTS.md",
    "CLAUDE.md",
    "README.md",
    "project.md",
    "queue/README.md",
    "blueprint/01-executive-summary.md",
    "blueprint/02-system-boundaries.md",
    "blueprint/03-dual-fork-spike.md",
    "blueprint/04-t3code-relationship.md",
    "blueprint/05-stack-decision.md"
  ].map((path2) => join13(root, path2));
}
function proslyncDocs() {
  const roots = [
    join13(DESKTOP_ROOT, "Active builds", "proslync-app-ios-final"),
    join13(DESKTOP_ROOT, "Active builds", "proslync-backend"),
    join13(DESKTOP_ROOT, "Active builds", "proslync-desktop"),
    join13(DESKTOP_ROOT, "Active builds", "proslync-presentation-assets-final")
  ];
  return roots.flatMap(projectDocs).concat([
    join13(DESKTOP_ROOT, "Active builds", "proslync-app-ios-final", "PLAN.md"),
    join13(DESKTOP_ROOT, "Active builds", "proslync-app-ios-final", "research-plane", "cross-pollinators", "identity-absorption-product-plan-2026-05-09.md"),
    join13(DESKTOP_ROOT, "Active builds", "proslync-app-ios-final", "research-plane", "cross-pollinators", "master-plan-integration-2026-05-09.md"),
    join13(DESKTOP_ROOT, "Active builds", "proslync-presentation-assets-final", "docs", "plans", "proslync-role-happiness-master-plan-2026-05-09", "README.md")
  ]);
}
function parseSources(sources, maxRecordsPerSource) {
  const seen = /* @__PURE__ */ new Set();
  const intents = [];
  let recordsParsed = 0;
  let duplicatesSkipped = 0;
  for (const source of sources) {
    const records = parseSource(source, maxRecordsPerSource);
    recordsParsed += records.length;
    for (const intent of records) {
      const key = normalize(intent.raw_text).toLowerCase();
      if (seen.has(key)) {
        duplicatesSkipped += 1;
        continue;
      }
      seen.add(key);
      if (intent.tags.length > 0 && intent.raw_text.length >= 12) intents.push(intent);
    }
  }
  return { intents, recordsParsed, duplicatesSkipped };
}
function parseSource(source, maxRecords) {
  try {
    const body = readFileSync9(source.path, "utf8");
    if (source.path.endsWith(".jsonl")) {
      return body.split("\n").slice(0, maxRecords).flatMap((line, index) => parseJsonLine(source, line, index + 1));
    }
    return parseMarkdown(source, body);
  } catch {
    return [];
  }
}
function parseJsonLine(source, line, lineNumber) {
  if (line.trim() === "") return [];
  let parsed;
  try {
    parsed = JSON.parse(line);
  } catch {
    return [];
  }
  const text = normalize(extractTexts(parsed).join("\n"));
  if (!text) return [];
  const role = stringField2(parsed, ["role", "type"]);
  const occurredAt = stringField2(parsed, ["timestamp", "created_at", "time"]);
  return [card(source, text, `jsonl:${source.path}#${lineNumber}`, role, occurredAt)];
}
function parseMarkdown(source, body) {
  const chunks = body.split(/\n(?=#{1,4}\s+)/).map((chunk) => normalize(chunk)).filter(Boolean).slice(0, 80);
  return chunks.map((chunk, index) => card(source, chunk, `md:${source.path}#${index + 1}`, null, null));
}
function card(source, text, evidenceRef, role, occurredAt) {
  const tags = tagsFor(text, source);
  const confidence = Math.min(0.55 + Math.min(tags.length * 0.1, 0.35) + (text.length > 240 ? 0.1 : 0), 0.99);
  const id = `intent:${hash(`${evidenceRef}:${text}`).slice(0, 24)}`;
  return {
    id,
    title: titleFor(text, tags),
    raw_text: text.slice(0, 1500),
    tags,
    confidence,
    review_state: "new",
    recommended_destination: destinationFor(tags),
    evidence_ref: evidenceRef,
    source_path: source.path,
    source_type: source.source_type,
    source_family: source.source_family,
    project_hint: source.project_hint,
    occurred_at: occurredAt,
    role
  };
}
function extractTexts(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(extractTexts);
  if (value && typeof value === "object") {
    const object = value;
    return ["prompt", "text", "content", "message", "summary", "command", "cmd", "body", "output", "input"].flatMap((key) => extractTexts(object[key])).filter((text) => text.trim().length > 0);
  }
  return [];
}
function tagsFor(text, source) {
  const lower = text.toLowerCase();
  const proslyncSource = source.source_family === "proslync" || lower.includes("proslync");
  const emaSource = source.source_family === "ema" || lower.includes(" ema ") || lower.startsWith("ema ");
  return [
    testTag(lower, /proslync|mrs\.? wilson|\bnil\b|athletic director|\bad\b|brand hq|revenue-share|revenue share|athlete|compliance/, "proslync_product_intent"),
    proslyncSource ? testTag(lower, /tsc|typecheck|build|simulator|backend|desktop|active build|branch|dirty|worktree/, "proslync_build_process_intent") : null,
    emaSource ? testTag(lower, /\bema\b|cockpit|lane|queue|vapp|daemon|projection|active builds/, "ema_build_process_intent") : null,
    testTag(lower, /i want|we need|should|keep|don't|please|follow up|lost|stale|blocker|next/, "lost_followup"),
    testTag(lower, /chronicle|activity|replay|event stream|session history/, "chronicle_pattern"),
    testTag(lower, /duct tape|harness glue|dispatch|execution|tool\.timeline/, "harness_glue_pattern"),
    testTag(lower, /cmux|multiplexer|session manager|\btui\b|codex\/claude sessions|claude tui|codex tui/, "session_manager_pattern")
  ].filter((tag) => tag != null);
}
function testTag(text, regex, tag) {
  return regex.test(text) ? tag : null;
}
function destinationFor(tags) {
  if (tags.includes("proslync_product_intent") || tags.includes("proslync_build_process_intent")) return "proslync_queue";
  if (tags.some((tag) => ["ema_build_process_intent", "harness_glue_pattern", "chronicle_pattern", "session_manager_pattern", "lost_followup"].includes(tag))) return "ema_queue";
  return "doc_only";
}
function titleFor(text, tags) {
  const prefix = tags.includes("proslync_product_intent") ? "Proslync" : tags.includes("ema_build_process_intent") ? "EMA" : tags.includes("harness_glue_pattern") ? "Harness" : tags.includes("chronicle_pattern") ? "Chronicle" : tags.includes("session_manager_pattern") ? "Session" : "Intent";
  return `${prefix}: ${text.split(/\s+/).slice(0, 18).join(" ")}`.slice(0, 160);
}
function buildProjection(project, sourceCount, recordsParsed, duplicatesSkipped, intents) {
  const topTags = Object.entries(
    intents.flatMap((intent) => intent.tags).reduce((acc, tag) => {
      acc[tag] = (acc[tag] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  return {
    ok: true,
    command: "intention.projection",
    source: "ema_intention_cli",
    authority: "file_backed_review_projection",
    generated_at: (/* @__PURE__ */ new Date()).toISOString(),
    project,
    stats: {
      sources_seen: sourceCount,
      records_parsed: recordsParsed,
      candidate_intents: intents.length,
      proslync_relevant: intents.filter((intent) => intent.tags.includes("proslync_product_intent")).length,
      ema_relevant: intents.filter((intent) => intent.tags.includes("ema_build_process_intent")).length,
      lost_followups: intents.filter((intent) => intent.tags.includes("lost_followup")).length,
      duplicates_skipped: duplicatesSkipped
    },
    top_tags: topTags,
    intents,
    recommended_queue: intents.filter((intent) => (intent.recommended_destination === "proslync_queue" || intent.recommended_destination === "ema_queue") && intent.review_state !== "rejected" && intent.review_state !== "deferred").sort((a, b) => queuePriority(b) - queuePriority(a) || b.confidence - a.confidence || a.title.localeCompare(b.title)).slice(0, 25)
  };
}
function queuePriority(intent) {
  let score = 0;
  if (intent.recommended_destination === "proslync_queue") score += 10;
  if (intent.tags.includes("proslync_product_intent")) score += 6;
  if (intent.source_family === "proslync") score += 4;
  if (intent.tags.includes("lost_followup")) score += 2;
  return score;
}
function sourceForPath(path2, project) {
  const lower = path2.toLowerCase();
  const source_family = lower.includes("proslync") ? "proslync" : lower.includes("ema-0.0.6") || lower.includes("/projects/ema/") ? "ema" : lower.includes("chronicle") ? "chronicle" : lower.includes("duct-tape") ? "duct_tape" : lower.includes("multiplexer") || lower.includes("cmux") || lower.includes("t3code") ? "session_manager" : "general";
  const source_type = lower.endsWith(".jsonl") && lower.includes("/.claude/") ? "claude_project" : lower.endsWith(".jsonl") && (lower.includes("/.codex/sessions/") || lower.includes("/.codex/archived_sessions/")) ? "codex_session" : lower.endsWith(".jsonl") && lower.includes("/.codex/") ? "codex_history" : lower.includes("/.codex/memories/") ? "codex_memory" : source_family === "proslync" ? "proslync_repo" : source_family === "ema" ? "ema_doc" : "donor_project";
  return {
    path: path2,
    source_type,
    source_family,
    project_hint: source_family === "proslync" ? project ?? DEFAULT_PROJECT : source_family === "ema" ? "EMA" : basename(dirname5(path2)) || null
  };
}
function readStoredProjection(project) {
  const path2 = storePath(project);
  if (!existsSync11(path2)) return null;
  try {
    return JSON.parse(readFileSync9(path2, "utf8"));
  } catch {
    return null;
  }
}
function readReviews() {
  if (!existsSync11(REVIEWS_PATH)) return [];
  try {
    const parsed = JSON.parse(readFileSync9(REVIEWS_PATH, "utf8"));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isReview);
  } catch {
    return [];
  }
}
function writeReviews(reviews) {
  mkdirSync5(STORE_ROOT, { recursive: true });
  writeFileSync6(REVIEWS_PATH, JSON.stringify(reviews, null, 2) + "\n");
}
function isReview(value) {
  if (!value || typeof value !== "object") return false;
  const record = value;
  return typeof record.intent_id === "string" && (record.state === "accepted" || record.state === "rejected" || record.state === "deferred" || record.state === "new") && typeof record.reviewer === "string" && typeof record.reason === "string" && typeof record.reviewed_at === "string";
}
function applyReviews(projection2) {
  const reviews = new Map(readReviews().map((review) => [review.intent_id, review]));
  const intents = projection2.intents.map((intent) => ({
    ...intent,
    review_state: reviews.get(intent.id)?.state ?? intent.review_state ?? "new"
  }));
  return {
    ...projection2,
    intents,
    recommended_queue: intents.filter((intent) => (intent.recommended_destination === "proslync_queue" || intent.recommended_destination === "ema_queue") && intent.review_state !== "rejected" && intent.review_state !== "deferred").sort((a, b) => queuePriority(b) - queuePriority(a) || b.confidence - a.confidence || a.title.localeCompare(b.title)).slice(0, 25)
  };
}
function findIntent(projection2, id) {
  const intent = projection2.intents.find((candidate) => candidate.id === id) ?? null;
  return intent ? { projection: projection2, intent } : null;
}
function findIntentAcrossStore(id) {
  if (!existsSync11(STORE_ROOT)) return null;
  for (const name of readdirSync5(STORE_ROOT)) {
    if (name === "reviews.json") continue;
    if (!name.endsWith(".json")) continue;
    try {
      const projection2 = applyReviews(JSON.parse(readFileSync9(join13(STORE_ROOT, name), "utf8")));
      const found = findIntent(projection2, id);
      if (found) return found;
    } catch {
      continue;
    }
  }
  return null;
}
function writeStoredProjection(project, projection2) {
  mkdirSync5(STORE_ROOT, { recursive: true });
  writeFileSync6(storePath(project), JSON.stringify(projection2, null, 2) + "\n");
}
function storePath(project) {
  return join13(STORE_ROOT, `${safeName(project ?? "unresolved")}.json`);
}
function emptyProjection(project) {
  return buildProjection(project, 0, 0, 0, []);
}
function queueAddCommand(project, intent) {
  return [
    "ema",
    "queue",
    "add",
    "--project",
    shellQuote3(project),
    "--title",
    shellQuote3(intent.title),
    "--why",
    shellQuote3(`${intent.raw_text.slice(0, 400)} Evidence: ${intent.evidence_ref}`),
    "--done-when",
    shellQuote3(`Reviewed intention is either shipped, rejected, or merged into the current project plan. Source: ${intent.id}`),
    "--source",
    shellQuote3(intent.evidence_ref)
  ];
}
function artifactBody(intent) {
  return [
    `# ${intent.title}`,
    "",
    `Intent ID: \`${intent.id}\``,
    `Review state: \`${intent.review_state}\``,
    `Recommended destination: \`${intent.recommended_destination}\``,
    `Evidence: \`${intent.evidence_ref}\``,
    `Source: \`${intent.source_path}\``,
    "",
    "## Raw Text",
    "",
    intent.raw_text,
    "",
    "## Tags",
    "",
    intent.tags.map((tag) => `- ${tag}`).join("\n") || "- none"
  ].join("\n");
}
function writeBackfeedBody(intent) {
  const dir = join13(STORE_ROOT, "backfeed-bodies");
  mkdirSync5(dir, { recursive: true });
  const path2 = join13(dir, `${safeName(intent.id)}.md`);
  writeFileSync6(path2, artifactBody(intent) + "\n");
  return path2;
}
function safeName(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_");
}
function shellQuote3(value) {
  return JSON.stringify(value);
}
function interestingFile(path2) {
  const lower = path2.toLowerCase();
  return lower.endsWith(".jsonl") || lower.endsWith(".md");
}
function skipDir(path2) {
  const lower = path2.toLowerCase();
  return ["/node_modules", "/.next", "/dist", "/build", "/pods", "/deriveddata"].some((part) => lower.includes(part));
}
function safeStat(path2) {
  try {
    return statSync5(path2);
  } catch {
    return null;
  }
}
function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}
function stringField2(value, keys) {
  if (!value || typeof value !== "object") return null;
  const object = value;
  for (const key of keys) {
    const raw = object[key];
    if (typeof raw === "string" && raw.trim()) return raw.trim();
  }
  return null;
}
function hash(value) {
  let h1 = 3735928559;
  let h2 = 1103547991;
  for (let i = 0; i < value.length; i++) {
    const ch = value.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507) ^ Math.imul(h2 ^ h2 >>> 13, 3266489909);
  h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507) ^ Math.imul(h1 ^ h1 >>> 13, 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, "0")}${(h1 >>> 0).toString(16).padStart(8, "0")}`;
}
function parsePositiveInt(value, fallback) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// src/commands/cockpit.ts
var execFileAsync2 = promisify2(execFile2);
var ACTIVE_BUILDS_ROOT = join14(DESKTOP_ROOT, "Active builds");
var INTENTION_STORE_ROOT = join14(DESKTOP_ROOT, "Active builds", "EMA-0.0.6", ".ema-dev", "intention-backfeed");
var EMA_PIDS_ROOT = join14(DESKTOP_ROOT, "Active builds", "EMA-0.0.6", ".ema-dev", "pids");
async function runCockpit(args) {
  const sub = args.positional[0] ?? "summary";
  if (flagBool(args, "help") || args.flags.h === true || sub === "help") {
    printHelp2();
    return 0;
  }
  if (!["summary", "projection", "workpack", "builds", "surfaces", "lanes", "queue", "intentions", "open"].includes(sub)) {
    emitError(`ema cockpit: unknown subcommand "${sub}"`);
    emitError("Usage: ema cockpit [summary|projection|workpack|builds|surfaces|lanes|queue|intentions|open] [--project <name>] [--json]");
    return 64;
  }
  const json = flagBool(args, "json");
  if (sub === "intentions") {
    const intentions = await loadIntentionProjection(args);
    const payload = {
      ok: true,
      command: "cockpit.intentions",
      project: intentions.project,
      stats: intentions.stats,
      top_tags: intentions.top_tags,
      recommended_queue: intentions.recommended_queue
    };
    if (json) emitJson(payload);
    else printIntentions(payload);
    return 0;
  }
  if (sub === "workpack") {
    const workpackProjection = await loadCockpitProjection(args, { includeTopbar: false });
    const payload = {
      ok: true,
      command: "cockpit.workpack",
      generated_at: (/* @__PURE__ */ new Date()).toISOString(),
      project: workpackProjection.project,
      client: workpackProjection.client,
      health: workpackProjection.health,
      agent_work: agentWorkpackFor(workpackProjection)
    };
    if (json) emitJson(payload);
    else printWorkpack(payload);
    return 0;
  }
  const projection2 = await loadCockpitProjection(args);
  if (sub === "projection") {
    emitJson(projection2);
    return 0;
  }
  if (sub === "builds") {
    if (json) emitJson({ ok: true, command: "cockpit.builds", builds: projection2.active_builds });
    else printBuilds(projection2.active_builds);
    return 0;
  }
  if (sub === "surfaces") {
    if (json) emitJson({ ok: true, command: "cockpit.surfaces", surfaces: projection2.surfaces });
    else printSurfaces(projection2.surfaces);
    return 0;
  }
  if (sub === "lanes") {
    if (json) emitJson({ ok: true, command: "cockpit.lanes", lanes: projection2.lanes });
    else printLanes(projection2.lanes);
    return 0;
  }
  if (sub === "queue") {
    if (json) emitJson({ ok: true, command: "cockpit.queue", queue: projection2.queue });
    else printQueue(projection2.queue);
    return 0;
  }
  if (sub === "open") {
    if (json) emitJson({ ok: true, command: "cockpit.open", url: projection2.workspace.cockpit_url });
    else emitPretty(projection2.workspace.cockpit_url ?? "No cockpit URL: workspace project is unresolved.");
    return 0;
  }
  if (json) emitJson(projection2);
  else printSummary(projection2);
  return 0;
}
async function loadCockpitProjection(args, options = {}) {
  const scope = await resolveWorkspaceScope({ args });
  const includeTopbar = options.includeTopbar ?? true;
  const projectionSpecs = [
    {
      name: "lane.registry",
      pick: (data) => toRecords(data.lanes)
    },
    {
      name: "queue.registry",
      pick: (data) => toRecords(data.queue_items)
    },
    ...includeTopbar ? [{
      name: "topbar",
      pick: (data) => data
    }] : []
  ];
  const [laneProjection, queueProjection, topbar = null] = await readProjectionBatch(args, projectionSpecs);
  const projectId = scope.project_id;
  const lanes = filterProject(laneProjection ?? [], projectId);
  const queue = filterProject(queueProjection ?? [], projectId);
  const client = inferClient(scope);
  const activeBuilds = await discoverBuilds(scope);
  const surfaces = inferSurfaces(scope);
  const runtime = readRuntimeFacts();
  const health = healthFor({
    activeBuilds,
    daemonUp: laneProjection != null || queueProjection != null,
    intentionsUp: intentionProjectionAvailable(scope),
    surfaces,
    runtime
  });
  const cockpitUrl = cockpitUrlFor(scope, client);
  const homeCurrentProject = topbar?.current_project?.name ?? null;
  const scopeWarning = homeCurrentProject && scope.project_name && homeCurrentProject !== scope.project_name ? `home_current project ${homeCurrentProject} differs from workspace_scope project ${scope.project_name}; workspace commands use workspace_scope unless --project overrides it.` : null;
  return {
    ok: true,
    command: "cockpit.projection",
    source: "ema-cockpit-cli",
    generated_at: (/* @__PURE__ */ new Date()).toISOString(),
    client,
    project: {
      id: scope.project_id,
      name: scope.project_name,
      kind: scope.project_id ? client ? "client" : "personal" : "unresolved",
      project_record: scope.project_record,
      active_build: scope.active_build,
      resolution_source: scope.resolution_source
    },
    workspace: {
      workspace_scope: scope,
      home_current_project: homeCurrentProject,
      scope_warning: scopeWarning,
      cockpit_url: cockpitUrl
    },
    counts: {
      lanes: lanes.length,
      active_lanes: lanes.filter((lane) => lane.status === "active").length,
      ready_lanes: lanes.filter((lane) => lane.status === "ready").length,
      queue: queue.length,
      ready_queue: queue.filter((item) => item.status === "ready").length,
      blocked_queue: queue.filter((item) => item.status === "blocked").length,
      builds: activeBuilds.length,
      surfaces: surfaces.length
    },
    lanes,
    queue,
    active_builds: activeBuilds,
    surfaces,
    health
  };
}
function printHelp2() {
  emitPretty("ema cockpit \u2014 client/project cockpit over daemon workspace state");
  emitPretty("");
  emitPretty("Usage:");
  emitPretty("  ema cockpit summary [--project <name>] [--json]");
  emitPretty("  ema cockpit projection [--project <name>] --json");
  emitPretty("  ema cockpit workpack [--project <name>] [--json]");
  emitPretty("  ema cockpit builds [--project <name>] [--json]");
  emitPretty("  ema cockpit surfaces [--project <name>] [--json]");
  emitPretty("  ema cockpit lanes [--project <name>] [--json]");
  emitPretty("  ema cockpit queue [--project <name>] [--json]");
  emitPretty("  ema cockpit intentions [--project <name>] [--json]");
  emitPretty("  ema cockpit open [--project <name>] [--json]");
}
function printWorkpack(payload) {
  emitPretty(`${payload.project.name ?? "(unresolved project)"} workpack`);
  emitPretty(`health: daemon ${payload.health.daemon}, web ${payload.health.web}, ready ${payload.health.proslync_ready}`);
  emitPretty("");
  emitPretty("kickoff:");
  for (const command of payload.agent_work.kickoff_commands) emitPretty(`  ${command}`);
  emitPretty("");
  emitPretty("verification:");
  for (const command of payload.agent_work.verification_commands) emitPretty(`  ${command}`);
  if (payload.agent_work.hazards.length > 0) {
    emitPretty("");
    emitPretty("hazards:");
    for (const hazard of payload.agent_work.hazards) emitPretty(`  ${hazard}`);
  }
}
function printSummary(projection2) {
  const clientPrefix = projection2.client ? `${projection2.client.name} / ` : "";
  emitPretty(`${clientPrefix}${projection2.project.name ?? "(unresolved project)"}`);
  emitPretty(`project: ${projection2.project.id ?? "(none)"}`);
  emitPretty(`record:  ${projection2.project.project_record ?? "(none)"}`);
  emitPretty(`build:   ${projection2.project.active_build ?? "(none)"}`);
  emitPretty(`scope:   ${projection2.project.resolution_source}`);
  if (projection2.workspace.scope_warning) emitPretty(`[warn] ${projection2.workspace.scope_warning}`);
  emitPretty("");
  emitPretty(
    `lanes: ${projection2.counts.lanes} (${projection2.counts.active_lanes} active, ${projection2.counts.ready_lanes} ready)`
  );
  emitPretty(
    `queue: ${projection2.counts.queue} (${projection2.counts.ready_queue} ready, ${projection2.counts.blocked_queue} blocked)`
  );
  emitPretty(`builds: ${projection2.counts.builds}`);
  emitPretty(`surfaces: ${projection2.counts.surfaces}`);
  emitPretty(
    `health: daemon ${projection2.health.daemon}, web ${projection2.health.web}, Proslync ${projection2.health.proslync_ready ? "ready" : "needs review"}`
  );
  if (projection2.workspace.cockpit_url) emitPretty(`url: ${projection2.workspace.cockpit_url}`);
}
function printBuilds(builds) {
  if (builds.length === 0) {
    emitPretty("No active builds discovered for this project.");
    return;
  }
  for (const build of builds) {
    const git = [
      build.git_status,
      build.branch ? `branch ${build.branch}` : null,
      build.head ? `HEAD ${build.head}` : null,
      typeof build.dirty_count === "number" ? `dirty ${build.dirty_count}` : null
    ].filter(Boolean).join(" \xB7 ");
    emitPretty(`${build.label}`);
    emitPretty(`  ${build.path}`);
    emitPretty(`  ${git}`);
    if (build.dev_command) emitPretty(`  dev: ${build.dev_command}`);
  }
}
function printSurfaces(surfaces) {
  if (surfaces.length === 0) {
    emitPretty("No cockpit surfaces registered for this project.");
    return;
  }
  for (const surface of surfaces) {
    emitPretty(`${surface.label} [${surface.status}]`);
    emitPretty(`  ${surface.role}`);
    emitPretty(`  owner: ${surface.owner}`);
    emitPretty(`  path: ${surface.path}`);
    if (surface.local_url) emitPretty(`  url: ${surface.local_url}`);
  }
}
function printLanes(lanes) {
  if (lanes.length === 0) {
    emitPretty("No lanes found for this project.");
    return;
  }
  for (const lane of lanes) {
    emitPretty(`${lane.id} [${lane.status ?? "unknown"}] ${lane.title ?? lane.name ?? "(untitled lane)"}`);
    if (lane.actor_id) emitPretty(`  actor: ${lane.actor_id}`);
    if (lane.scope) emitPretty(`  scope: ${lane.scope}`);
    if (lane.next) emitPretty(`  next: ${lane.next}`);
  }
}
function printQueue(queue) {
  if (queue.length === 0) {
    emitPretty("No queue items found for this project.");
    return;
  }
  for (const item of queue) {
    emitPretty(`${item.id} [${item.status ?? "unknown"}] ${item.title ?? item.name ?? "(untitled queue item)"}`);
    if (item.lane_id) emitPretty(`  lane: ${item.lane_id}`);
    if (item.why) emitPretty(`  why: ${item.why}`);
    if (item.done_when) emitPretty(`  done: ${item.done_when}`);
  }
}
function printIntentions(payload) {
  emitPretty(`${payload.project ?? "(unresolved project)"} intentions`);
  emitPretty(`candidates: ${payload.stats.candidate_intents}`);
  emitPretty(`proslync: ${payload.stats.proslync_relevant}`);
  emitPretty(`lost followups: ${payload.stats.lost_followups}`);
  if (payload.recommended_queue.length === 0) {
    emitPretty("recommended queue: (none)");
    return;
  }
  emitPretty("recommended queue:");
  for (const item of payload.recommended_queue.slice(0, 10)) {
    emitPretty(`  ${item.id} ${item.title}`);
    emitPretty(`    tags: ${item.tags.join(", ")}`);
    emitPretty(`    evidence: ${item.evidence_ref}`);
  }
}
function toRecords(value) {
  return Array.isArray(value) ? value : [];
}
function filterProject(records, projectId) {
  if (!projectId) return [...records];
  return records.filter((record) => record.project_id == null || record.project_id === projectId);
}
function inferClient(scope) {
  if (scope.project_name?.startsWith("proslync")) {
    return { id: "client:ms-wilson", name: "Ms. Wilson", color: "#d49a6a" };
  }
  return null;
}
async function discoverBuilds(scope) {
  const paths = /* @__PURE__ */ new Set();
  if (scope.active_build) paths.add(scope.active_build);
  const family = projectFamily(scope.project_name);
  if (family && existsSync12(ACTIVE_BUILDS_ROOT)) {
    for (const name of readdirSync6(ACTIVE_BUILDS_ROOT)) {
      if (name === family || name.startsWith(`${family}-`)) {
        paths.add(join14(ACTIVE_BUILDS_ROOT, name));
      }
    }
  }
  return await Promise.all([...paths].sort().map((path2) => gitFact(path2)));
}
function intentionProjectionAvailable(scope) {
  const project = scope.project_name ?? "unresolved";
  return existsSync12(join14(INTENTION_STORE_ROOT, `${safeName2(project)}.json`));
}
async function gitFact(path2) {
  const id = basename2(path2);
  const base = {
    id,
    label: labelForBuild(id),
    role: roleForBuild(id),
    path: path2,
    repo_url: repoForBuild(id),
    dev_command: devCommandForBuild(id)
  };
  if (!existsSync12(path2)) {
    return { ...base, branch: null, head: null, dirty_count: null, git_status: "missing" };
  }
  if (!existsSync12(join14(path2, ".git"))) {
    return { ...base, branch: null, head: null, dirty_count: null, git_status: "no_git" };
  }
  const [branch, head, status2] = await Promise.all([
    run("git", ["branch", "--show-current"], path2).catch(() => ""),
    run("git", ["rev-parse", "--short", "HEAD"], path2).catch(() => ""),
    run("git", ["status", "--short"], path2).catch(() => "")
  ]);
  const dirtyCount = status2.split("\n").filter(Boolean).length;
  return {
    ...base,
    branch: branch || null,
    head: head || null,
    dirty_count: dirtyCount,
    git_status: head ? dirtyCount > 0 ? "dirty" : "clean" : "unborn"
  };
}
async function run(command, args, cwd) {
  const { stdout } = await execFileAsync2(command, [...args], {
    cwd,
    encoding: "utf8",
    timeout: 8e3,
    maxBuffer: 4 * 1024 * 1024
  });
  return stdout.trim();
}
function inferSurfaces(scope) {
  if (!scope.project_name?.startsWith("proslync")) return [];
  return [
    {
      id: "ad-cockpit",
      label: "AD cockpit",
      role: "Buyer control room: revenue share, cap context, compliance health.",
      owner: "Proslync desktop",
      build_id: "proslync-desktop",
      path: join14(ACTIVE_BUILDS_ROOT, "proslync-desktop/app/ad/page.tsx"),
      local_url: "http://localhost:3021/ad",
      status: "planned"
    },
    {
      id: "brand-hq",
      label: "Brand HQ",
      role: "Open-deal workflow, ranked applicants, rationale, and trust metadata.",
      owner: "Proslync desktop",
      build_id: "proslync-desktop",
      path: join14(ACTIVE_BUILDS_ROOT, "proslync-desktop/app/brand/page.tsx"),
      local_url: "http://localhost:3021/brand",
      status: "candidate"
    },
    {
      id: "nil-deal-detail",
      label: "NIL Deal Detail",
      role: "Cross-role spine: packet, deliverables, review tracks, audit timeline.",
      owner: "Proslync iOS app",
      build_id: "proslync-app-ios-final",
      path: join14(ACTIVE_BUILDS_ROOT, "proslync-app-ios-final/app/deal/[id].tsx"),
      local_url: null,
      status: "planned"
    },
    {
      id: "nil-manager",
      label: "NIL Manager",
      role: "Consent-aware review queue and approval gates.",
      owner: "Proslync iOS app",
      build_id: "proslync-app-ios-final",
      path: join14(ACTIVE_BUILDS_ROOT, "proslync-app-ios-final/components/nil-manager/nil-manager-view.tsx"),
      local_url: null,
      status: "candidate"
    },
    {
      id: "backend-api",
      label: "Backend API",
      role: "Product-core objects, routes, seed data, and trust metadata.",
      owner: "Proslync backend",
      build_id: "proslync-backend",
      path: join14(ACTIVE_BUILDS_ROOT, "proslync-backend/src"),
      local_url: "http://localhost:3020/api/health",
      status: "candidate"
    },
    {
      id: "master-plan",
      label: "Master plan and assets",
      role: "Client story, role happiness, research, and presentation proof.",
      owner: "Presentation assets",
      build_id: "proslync-presentation-assets-final",
      path: join14(ACTIVE_BUILDS_ROOT, "proslync-presentation-assets-final/docs/plans/proslync-role-happiness-master-plan-2026-05-09/README.md"),
      local_url: null,
      status: "live"
    },
    {
      id: "hero-website",
      label: "Hero website",
      role: "Remote narrative surface for AD wedge, demo proof, and launch story.",
      owner: "Proslync website",
      build_id: "proslync-website",
      path: "https://github.com/TrajanWJ/proslync-website",
      local_url: "https://proslync-hero.vercel.app",
      status: "queued"
    }
  ];
}
function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}
function readPidFile(name) {
  const path2 = join14(EMA_PIDS_ROOT, `${name}.pid`);
  if (!existsSync12(path2)) return null;
  try {
    const raw = readFileSync10(path2, "utf8").trim();
    if (!raw) return null;
    const pid = Number(raw);
    return Number.isFinite(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}
function readRuntimeFacts() {
  const webPid = readPidFile("web");
  const daemonPid = readPidFile("daemon");
  const webAlive = webPid != null && pidAlive(webPid);
  const daemonAlive = daemonPid != null && pidAlive(daemonPid);
  return {
    webUp: webAlive,
    daemonStalePid: daemonPid != null && !daemonAlive,
    webStalePid: webPid != null && !webAlive
  };
}
function healthFor(input) {
  const gitBuilds = new Map(input.activeBuilds.map((build) => [build.id, build]));
  const gitFactsLoaded = ["proslync-app-ios-final", "proslync-backend", "proslync-presentation-assets-final"].every((id) => {
    const status2 = gitBuilds.get(id)?.git_status;
    return status2 != null && status2 !== "missing" && status2 !== "unknown" && status2 !== "no_git";
  });
  const desktopStatus = gitBuilds.get("proslync-desktop")?.git_status;
  const desktopExplicit = desktopStatus != null && desktopStatus !== "missing" && desktopStatus !== "unknown";
  const staleRecords = [];
  if (input.runtime.daemonStalePid) staleRecords.push("daemon.pid points to a process that is not running");
  if (input.runtime.webStalePid) staleRecords.push("web.pid points to a process that is not running");
  return {
    daemon: input.daemonUp ? "up" : "down",
    web: input.runtime.webUp ? "up" : "down",
    dirty_builds: input.activeBuilds.filter((build) => build.git_status === "dirty").length,
    no_git_builds: input.activeBuilds.filter((build) => build.git_status === "no_git").length,
    stale_records: staleRecords,
    proslync_ready: input.daemonUp && input.intentionsUp && input.runtime.webUp && gitFactsLoaded && desktopExplicit && input.surfaces.length >= 6
  };
}
function cockpitUrlFor(scope, client) {
  if (!scope.project_id) return null;
  if (client) {
    return `http://localhost:5173/cockpit#/clients/${client.id}/${scope.project_id}`;
  }
  return `http://localhost:5173/cockpit#/personal/${scope.project_id}`;
}
function projectFamily(name) {
  if (!name) return null;
  if (name.startsWith("proslync")) return "proslync";
  return name;
}
function safeName2(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_");
}
function labelForBuild(id) {
  if (id === "proslync-app-ios-final") return "Proslync iOS app";
  if (id === "proslync-backend") return "Proslync backend";
  if (id === "proslync-desktop") return "Proslync desktop";
  if (id === "proslync-presentation-assets-final") return "Presentation assets";
  return id;
}
function roleForBuild(id) {
  if (id === "proslync-app-ios-final") return "mobile mirror, athlete/brand/persona flows";
  if (id === "proslync-backend") return "Bun/Hono/Drizzle API and product-core persistence";
  if (id === "proslync-desktop") return "AD cockpit and Brand HQ desktop surface";
  if (id === "proslync-presentation-assets-final") return "master plan, research capture, client narrative";
  return "active build";
}
function repoForBuild(id) {
  if (id === "proslync-app-ios-final") return "https://github.com/TrajanWJ/proslync-app-ios-final";
  if (id === "proslync-backend") return "https://github.com/TrajanWJ/proslync-backend-final";
  if (id === "proslync-desktop") return "https://github.com/TrajanWJ/proslync-desktop-site-final";
  if (id === "proslync-presentation-assets-final") return "https://github.com/TrajanWJ/proslync-presentation-assets-final";
  return null;
}
function devCommandForBuild(id) {
  if (id === "proslync-app-ios-final") return "npx expo start";
  if (id === "proslync-backend") return "bun --hot src/server.ts";
  if (id === "proslync-desktop") return "pnpm dev";
  return null;
}
function agentWorkpackFor(projection2) {
  const dirtyBuilds = projection2.active_builds.filter((build) => build.git_status === "dirty");
  const unstableBuilds = projection2.active_builds.filter((build) => build.git_status === "no_git" || build.git_status === "unborn" || build.git_status === "unknown" || build.git_status === "missing");
  const activeOrReadyLane = projection2.lanes.find((lane) => lane.status === "active") ?? projection2.lanes.find((lane) => lane.status === "ready") ?? projection2.lanes[0] ?? null;
  const readyQueue = projection2.queue.filter((item) => item.status === "ready").slice(0, 8);
  const projectName2 = projection2.project.name ?? "proslync-app-ios-final";
  const claimCommand = activeOrReadyLane ? renderEmaCommand(["lane", "claim", "--project", projectName2, "--lane", activeOrReadyLane.id, "--actor", "actor:codex", "--scope", "<paths>", "--goal", "<goal>", "--next", "<next step>"]) : renderEmaCommand(["lane", "open", "--project", projectName2, "--title", "<slice title>", "--scope", "<paths>", "--done-when", "<done criteria>"]);
  return {
    mode: "multi-repo-agent-work",
    project_name: projectName2,
    client_name: projection2.client?.name ?? null,
    cockpit_url: projection2.workspace.cockpit_url,
    active_lane: activeOrReadyLane,
    ready_queue: readyQueue,
    builds: projection2.active_builds.map((build) => ({
      id: build.id,
      path: build.path,
      role: build.role,
      git_status: build.git_status,
      branch: build.branch,
      head: build.head,
      dirty_count: build.dirty_count,
      dev_command: build.dev_command
    })),
    surfaces: projection2.surfaces.map((surface) => ({
      id: surface.id,
      owner: surface.owner,
      build_id: surface.build_id,
      path: surface.path,
      status: surface.status,
      local_url: surface.local_url
    })),
    kickoff_commands: [
      renderEmaCommand(["cockpit", "projection", "--project", projectName2, "--json"]),
      renderEmaCommand(["cockpit", "intentions", "--project", projectName2, "--json"]),
      claimCommand
    ],
    verification_commands: [
      "pnpm --filter @ema/cli typecheck",
      "pnpm build:cli",
      "pnpm --dir apps/web exec tsc --noEmit",
      `ema cockpit workpack --project ${projectName2} --json`
    ],
    hazards: [
      ...dirtyBuilds.map((build) => `${build.id} has ${build.dirty_count ?? 0} dirty file(s); inspect before assigning broad writes.`),
      ...unstableBuilds.map((build) => `${build.id} git status is ${build.git_status}; treat branch/head as unavailable.`),
      ...projection2.health.proslync_ready ? [] : ["Project health is not ready; inspect daemon/web/intentions/build facts before swarm kickoff."]
    ],
    handoff_contract: {
      before_editing: "Read the active build docs and claim a daemon lane with exact path scope.",
      during_work: "Keep writes scoped by build and surface; do not reset or clean dirty worktrees.",
      after_work: "Run verification commands, update lane/queue, and record evidence in the cockpit or release report."
    }
  };
}

// src/commands/actor.ts
async function runActor(args) {
  const verb = args.positional[0] ?? "help";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return help3(args);
  if (verb === "register") return register(args);
  if (verb === "list") return list3(args);
  if (verb === "show") return show2(args);
  emitError(`ema actor: unknown subcommand "${verb}" (expected: register | list | show)`);
  return 64;
}
function help3(args) {
  return runStubContract(args, {
    noun: "actor",
    status: "available",
    docRef: "packages/contracts/events/actor.md",
    commands: [
      {
        verb: "register",
        flags: ["id", "kind", "display-name", "dispatch", "perspective", "json"],
        required: ["id", "kind", "display-name"],
        summary: "Register a human or agent actor through the daemon canonical writer."
      },
      {
        verb: "list",
        flags: ["kind", "json"],
        summary: "List actors by replaying actor.created events."
      },
      {
        verb: "show",
        flags: ["json"],
        required: ["id"],
        summary: "Show one actor and the event rows that mention it."
      }
    ]
  });
}
async function register(args) {
  const actorId = flagString(args, "id");
  const kind = flagString(args, "kind");
  const displayName = flagString(args, "display-name");
  if (!actorId || !kind || !displayName) {
    return fail(args, "actor.register", "invalid_args", "--id, --kind, and --display-name are required", 64);
  }
  if (kind !== "human" && kind !== "agent") {
    return fail(args, "actor.register", "invalid_args", "--kind must be human or agent", 64);
  }
  if (actorById(actorId)) {
    return fail(args, "actor.register", "duplicate_id", `actor already exists: ${actorId}`, 1);
  }
  const json = flagBool(args, "json");
  let client = null;
  try {
    client = await connect({ surface: "desktop" });
    const result = await client.command("actor.register", {
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      actor_id: actorId,
      target_kind: kind,
      display_name: displayName,
      provider: flagString(args, "dispatch") ?? null,
      relation: flagString(args, "perspective") ?? null,
      role: flagString(args, "role") ?? flagString(args, "perspective") ?? flagString(args, "dispatch") ?? kind
    });
    if (result.ok !== true) return commandFailure(args, "actor.register", result.error.class, result.error.message);
    const actor = actorById(actorId);
    const payload = {
      ok: true,
      command: "actor.register",
      source: "daemon_command",
      daemon_authority: "canonical_events",
      events: result.events ?? [],
      actor
    };
    if (json) emitJson(payload);
    else emitPretty(`registered actor ${actorId}`);
    return 0;
  } catch (err) {
    return reportError(err, json);
  } finally {
    client?.close();
  }
}
function list3(args) {
  const kind = flagString(args, "kind");
  const actors = actorRecords().filter((actor) => !kind || actor.kind === kind);
  if (flagBool(args, "json")) {
    emitJson({
      ok: true,
      command: "actor.list",
      source: "canonical_sqlite_events",
      daemon_authority: "canonical_events",
      actors
    });
  } else {
    for (const actor of actors) emitPretty(`${actor.actor_id} ${actor.kind} ${actor.display_name}`);
  }
  return 0;
}
function show2(args) {
  const actorId = args.positional[1] ?? flagString(args, "id");
  if (!actorId) return fail(args, "actor.show", "invalid_args", "actor id is required", 64);
  const actor = actorById(actorId);
  const payload = {
    ok: actor !== null,
    command: "actor.show",
    source: "canonical_sqlite_events",
    daemon_authority: "canonical_events",
    actor,
    events: actor ? eventsMentioning(actorId) : [],
    error: actor ? null : { class: "not_found", message: `actor not found: ${actorId}` }
  };
  if (flagBool(args, "json")) emitJson(payload);
  else if (actor) emitPretty(JSON.stringify(payload, null, 2));
  else emitError(`actor not found: ${actorId}`);
  return actor ? 0 : 1;
}
function commandFailure(args, command, errorClass, message) {
  return fail(args, command, errorClass, message, errorClass === "invalid_args" ? 64 : 1);
}
function fail(args, command, errorClass, message, code) {
  if (flagBool(args, "json")) {
    emitJson({ ok: false, command, error: { class: errorClass, message } });
  } else {
    emitError(`ema ${command}: ${errorClass}: ${message}`);
  }
  return code;
}

// src/commands/intent.ts
import { readFileSync as readFileSync11 } from "fs";
var KINDS = /* @__PURE__ */ new Set(["bootstrap", "feature", "fix", "research", "doctrine", "external"]);
var STATUSES = /* @__PURE__ */ new Set(["open", "proposed", "accepted", "executing", "satisfied", "superseded", "abandoned"]);
var ALLOWED_STATUS_TRANSITIONS = {
  open: ["proposed", "abandoned", "superseded"],
  proposed: ["open", "accepted", "abandoned", "superseded"],
  accepted: ["executing", "satisfied", "abandoned", "superseded"],
  executing: ["satisfied", "abandoned", "superseded"],
  satisfied: ["superseded"],
  abandoned: [],
  superseded: []
};
async function runIntent(args) {
  const verb = args.positional[0] ?? "help";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return help4(args);
  if (verb === "create") return create(args);
  if (verb === "list") return list4(args);
  if (verb === "show") return show3(args);
  if (verb === "update") return update(args);
  emitError(`ema intent: unknown subcommand "${verb}" (expected: create | list | show | update)`);
  return 64;
}
function help4(args) {
  return runStubContract(args, {
    noun: "intent",
    status: "available",
    docRef: "packages/contracts/events/intent.md",
    commands: [
      {
        verb: "create",
        flags: ["id", "title", "kind", "actor", "project", "space", "body", "body-file", "exit-condition", "json"],
        required: ["id", "title", "kind", "actor"],
        summary: "Create a canonical pipeline-floor intent."
      },
      { verb: "list", flags: ["project", "space", "actor", "status", "kind", "json"], summary: "List canonical intents." },
      { verb: "show", flags: ["json"], required: ["id"], summary: "Show one intent with events and linked proposals." },
      {
        verb: "update",
        flags: ["title", "status", "body", "body-file", "exit-condition", "actor", "reason", "json"],
        required: ["id", "actor", "reason", "at least one changed field"],
        summary: "Update an intent and emit intent.updated."
      }
    ]
  });
}
async function create(args) {
  const intentId = flagString(args, "id");
  const title = flagString(args, "title");
  const kind = flagString(args, "kind");
  const actor = flagString(args, "actor");
  if (!intentId || !title || !kind || !actor) {
    return fail2(args, "intent.create", "invalid_args", "--id, --title, --kind, and --actor are required", 64);
  }
  if (!KINDS.has(kind)) return fail2(args, "intent.create", "invalid_args", `invalid kind: ${kind}`, 64);
  if (intentById(intentId)) return fail2(args, "intent.create", "duplicate_id", `intent already exists: ${intentId}`, 1);
  const body = readBody(args);
  const slug = flagString(args, "slug") ?? slugFromTitle(title);
  return writeIntentCommand(args, "intent.create", {
    intent: intentId,
    title,
    target_kind: kind,
    status: "open",
    actor_id: actor,
    project_id: flagString(args, "project") ?? null,
    space_id: flagString(args, "space") ?? null,
    body,
    label: slug,
    done_when: flagString(args, "exit-condition") ?? null
  }, intentId, "created");
}
function list4(args) {
  const intents = intentRecords({
    project: flagString(args, "project"),
    space: flagString(args, "space"),
    actor: flagString(args, "actor"),
    status: flagString(args, "status"),
    kind: flagString(args, "kind")
  });
  if (flagBool(args, "json")) {
    emitJson({
      ok: true,
      command: "intent.list",
      source: "canonical_sqlite",
      daemon_authority: "canonical_events",
      intents
    });
  } else {
    for (const intent of intents) emitPretty(`${intent.intent_id} ${intent.status} ${intent.title}`);
  }
  return 0;
}
function show3(args) {
  const intentId = args.positional[1] ?? flagString(args, "id");
  if (!intentId) return fail2(args, "intent.show", "invalid_args", "intent id is required", 64);
  const intent = intentById(intentId);
  const payload = intentPayload("intent.show", intentId, intent);
  if (flagBool(args, "json")) emitJson(payload);
  else if (intent) emitPretty(JSON.stringify(payload, null, 2));
  else emitError(`intent not found: ${intentId}`);
  return intent ? 0 : 1;
}
async function update(args) {
  const intentId = args.positional[1] ?? flagString(args, "id");
  const actor = flagString(args, "actor");
  const reason = flagString(args, "reason");
  if (!intentId || !actor || !reason) {
    return fail2(args, "intent.update", "invalid_args", "intent id, --actor, and --reason are required", 64);
  }
  const current = intentById(intentId);
  if (!current) return fail2(args, "intent.update", "not_found", `intent not found: ${intentId}`, 1);
  const body = readBody(args);
  const requestedStatus = flagString(args, "status");
  if (requestedStatus && !STATUSES.has(requestedStatus)) {
    return fail2(args, "intent.update", "invalid_args", `invalid status: ${requestedStatus}`, 64);
  }
  if (requestedStatus && requestedStatus !== current.status && !canTransition(current.status, requestedStatus)) {
    return fail2(args, "intent.update", "invalid_transition", `invalid status transition: ${current.status} -> ${requestedStatus}`, 1);
  }
  const changes = changedFields(current, {
    title: flagString(args, "title") ?? null,
    status: requestedStatus ?? null,
    body,
    exit_condition: flagString(args, "exit-condition") ?? null
  });
  if (changes.length === 0) {
    return fail2(args, "intent.update", "invalid_args", "at least one changed field is required", 64);
  }
  return writeIntentCommand(args, "intent.update", {
    intent: intentId,
    actor_id: actor,
    title: flagString(args, "title") ?? null,
    status: requestedStatus ?? null,
    body,
    done_when: flagString(args, "exit-condition") ?? null,
    reason,
    changed: changes.join(",")
  }, intentId, "updated");
}
async function writeIntentCommand(args, op, argsObj, intentId, verb) {
  const json = flagBool(args, "json");
  let client = null;
  try {
    client = await connect({ surface: "desktop" });
    const result = await client.command(op, { org_id: flagString(args, "org") ?? DEFAULT_ORG, ...argsObj });
    if (result.ok !== true) return fail2(args, op, result.error.class, result.error.message, result.error.class === "invalid_args" ? 64 : 1);
    const intent = intentById(intentId);
    const payload = {
      ok: true,
      command: op,
      source: "daemon_command",
      daemon_authority: "canonical_events",
      events: result.events ?? [],
      intent
    };
    if (json) emitJson(payload);
    else emitPretty(`${verb} intent ${intentId}`);
    return 0;
  } catch (err) {
    return reportError(err, json);
  } finally {
    client?.close();
  }
}
function intentPayload(command, intentId, intent) {
  return {
    ok: intent !== null,
    command,
    source: "canonical_sqlite",
    daemon_authority: "canonical_events",
    intent,
    proposals: intent ? proposalsForIntent(intentId) : [],
    events: intent ? eventsMentioning(intentId) : [],
    error: intent ? null : { class: "not_found", message: `intent not found: ${intentId}` }
  };
}
function canTransition(from, to) {
  return (ALLOWED_STATUS_TRANSITIONS[from] ?? []).includes(to);
}
function changedFields(current, candidate) {
  const changes = [];
  if (candidate.title !== null && candidate.title !== current.title) changes.push("title");
  if (candidate.status !== null && candidate.status !== current.status) changes.push("status");
  if (candidate.body !== null && candidate.body !== current.body) changes.push("body");
  if (candidate.exit_condition !== null && candidate.exit_condition !== current.exit_condition) changes.push("exit_condition");
  return changes;
}
function readBody(args) {
  const bodyFile = flagString(args, "body-file");
  if (bodyFile) return readFileSync11(bodyFile, "utf8");
  return flagString(args, "body") ?? null;
}
function slugFromTitle(title) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/g, "");
  return slug || "intent";
}
function fail2(args, command, errorClass, message, code) {
  if (flagBool(args, "json")) emitJson({ ok: false, command, error: { class: errorClass, message } });
  else emitError(`ema ${command}: ${errorClass}: ${message}`);
  return code;
}

// src/commands/proposal.ts
import { readFileSync as readFileSync12 } from "fs";
var CLOSED_INTENT_STATUSES = /* @__PURE__ */ new Set(["satisfied", "abandoned", "superseded"]);
var DECIDED_PROPOSAL_STATUSES = /* @__PURE__ */ new Set(["approved", "rejected", "withdrawn"]);
async function runProposal(args) {
  const verb = args.positional[0] ?? "help";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return help5(args);
  if (verb === "create") return create2(args);
  if (verb === "approve") return decide(args, "approve");
  if (verb === "reject") return decide(args, "reject");
  if (verb === "list") return list5(args);
  if (verb === "show") return show4(args);
  emitError(`ema proposal: unknown subcommand "${verb}" (expected: create | approve | reject | list | show)`);
  return 64;
}
function help5(args) {
  return runStubContract(args, {
    noun: "proposal",
    status: "available",
    docRef: "packages/contracts/events/proposal.md",
    commands: [
      {
        verb: "create",
        flags: ["id", "intent", "title", "body", "body-file", "plan", "plan-file", "proposed-by", "no-approval-required", "json"],
        required: ["id", "intent", "title", "proposed-by"],
        summary: "Create a canonical proposal under an intent."
      },
      { verb: "approve", flags: ["actor", "rationale", "json"], required: ["id", "actor", "rationale"], summary: "Approve a proposal." },
      { verb: "reject", flags: ["actor", "rationale", "json"], required: ["id", "actor", "rationale"], summary: "Reject a proposal." },
      { verb: "list", flags: ["intent", "status", "json"], summary: "List proposals." },
      { verb: "show", flags: ["json"], required: ["id"], summary: "Show one proposal with events and parent intent." }
    ]
  });
}
async function create2(args) {
  const proposalId = flagString(args, "id");
  const intentId = flagString(args, "intent");
  const title = flagString(args, "title");
  const proposedBy = flagString(args, "proposed-by");
  if (!proposalId || !intentId || !title || !proposedBy) {
    return fail3(args, "proposal.create", "invalid_args", "--id, --intent, --title, and --proposed-by are required", 64);
  }
  if (proposalById(proposalId)) {
    return fail3(args, "proposal.create", "duplicate_id", `proposal already exists: ${proposalId}`, 1);
  }
  const intent = intentById(intentId);
  if (!intent) return fail3(args, "proposal.create", "not_found", `intent not found: ${intentId}`, 1);
  if (CLOSED_INTENT_STATUSES.has(intent.status)) {
    return fail3(args, "proposal.create", "invalid_intent_status", `intent status disallows new proposals: ${intent.status}`, 1);
  }
  const approverRequired = !flagBool(args, "no-approval-required");
  const body = readFlagOrFile(args, "body", "body-file");
  const plan = readFlagOrFile(args, "plan", "plan-file");
  const json = flagBool(args, "json");
  let client = null;
  try {
    client = await connect({ surface: "desktop" });
    const result = await client.command("proposal.create", {
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      target: proposalId,
      intent: intentId,
      title,
      body,
      context: plan,
      actor_id: proposedBy,
      verified: approverRequired ? "true" : "false"
    });
    if (result.ok !== true) return fail3(args, "proposal.create", result.error.class, result.error.message, result.error.class === "invalid_args" ? 64 : 1);
    const proposal = proposalById(proposalId);
    const payload = {
      ok: true,
      command: "proposal.create",
      source: "daemon_command",
      daemon_authority: "canonical_events",
      events: result.events ?? [],
      proposal
    };
    if (json) emitJson(payload);
    else emitPretty(`created proposal ${proposalId}`);
    return 0;
  } catch (err) {
    return reportError(err, json);
  } finally {
    client?.close();
  }
}
async function decide(args, decision) {
  const proposalId = args.positional[1] ?? flagString(args, "id");
  const actor = flagString(args, "actor");
  const rationale = flagString(args, "rationale");
  if (!proposalId || !actor || !rationale) {
    return fail3(args, `proposal.${decision}`, "invalid_args", "proposal id, --actor, and --rationale are required", 64);
  }
  const proposal = proposalById(proposalId);
  if (!proposal) return fail3(args, `proposal.${decision}`, "not_found", `proposal not found: ${proposalId}`, 1);
  if (DECIDED_PROPOSAL_STATUSES.has(proposal.status)) {
    return fail3(args, `proposal.${decision}`, "already_decided", `proposal already decided: ${proposal.status}`, 1);
  }
  if (!proposal.approver_required) {
    return fail3(args, `proposal.${decision}`, "approval_not_required", "proposal does not require approval; approval command is not valid", 1);
  }
  const approvingActor = actorById(actor);
  if (!approvingActor) return fail3(args, `proposal.${decision}`, "not_found", `actor not found: ${actor}`, 1);
  if (proposal.proposed_by_actor_id === actor && approvingActor.kind === "agent") {
    return fail3(args, `proposal.${decision}`, "agent_self_approval_refused", "agent self-approval is not allowed for proposals", 1);
  }
  const json = flagBool(args, "json");
  let client = null;
  try {
    client = await connect({ surface: "desktop" });
    const result = await client.command(`proposal.${decision}`, {
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      target: proposalId,
      intent: proposal.intent_id,
      actor_id: actor,
      reason: rationale
    });
    if (result.ok !== true) return fail3(args, `proposal.${decision}`, result.error.class, result.error.message, result.error.class === "invalid_args" ? 64 : 1);
    const updated = proposalById(proposalId);
    const payload = {
      ok: true,
      command: `proposal.${decision}`,
      source: "daemon_command",
      daemon_authority: "canonical_events",
      events: result.events ?? [],
      proposal: updated,
      intent: updated ? intentById(updated.intent_id) : null
    };
    if (json) emitJson(payload);
    else emitPretty(`${decision}d proposal ${proposalId}`);
    return 0;
  } catch (err) {
    return reportError(err, json);
  } finally {
    client?.close();
  }
}
function list5(args) {
  const proposals = proposalRecords({
    intent: flagString(args, "intent"),
    status: flagString(args, "status")
  });
  if (flagBool(args, "json")) {
    emitJson({
      ok: true,
      command: "proposal.list",
      source: "canonical_sqlite",
      daemon_authority: "canonical_events",
      proposals
    });
  } else {
    for (const proposal of proposals) emitPretty(`${proposal.proposal_id} ${proposal.status} ${proposal.title}`);
  }
  return 0;
}
function show4(args) {
  const proposalId = args.positional[1] ?? flagString(args, "id");
  if (!proposalId) return fail3(args, "proposal.show", "invalid_args", "proposal id is required", 64);
  const proposal = proposalById(proposalId);
  const payload = proposalPayload(proposalId, proposal);
  if (flagBool(args, "json")) emitJson(payload);
  else if (proposal) emitPretty(JSON.stringify(payload, null, 2));
  else emitError(`proposal not found: ${proposalId}`);
  return proposal ? 0 : 1;
}
function proposalPayload(proposalId, proposal) {
  return {
    ok: proposal !== null,
    command: "proposal.show",
    source: "canonical_sqlite",
    daemon_authority: "canonical_events",
    proposal,
    intent: proposal ? intentById(proposal.intent_id) : null,
    events: proposal ? eventsMentioning(proposalId) : [],
    error: proposal ? null : { class: "not_found", message: `proposal not found: ${proposalId}` }
  };
}
function readFlagOrFile(args, flag, fileFlag) {
  const file = flagString(args, fileFlag);
  if (file) return readFileSync12(file, "utf8");
  return flagString(args, flag) ?? null;
}
function fail3(args, command, errorClass, message, code) {
  if (flagBool(args, "json")) emitJson({ ok: false, command, error: { class: errorClass, message } });
  else emitError(`ema ${command}: ${errorClass}: ${message}`);
  return code;
}

// src/commands/canon.ts
import { readFileSync as readFileSync13 } from "fs";
var CANON_KINDS = /* @__PURE__ */ new Set(["execution_result", "decision", "doctrine", "observation", "retro", "direction"]);
var SOURCE_KINDS = /* @__PURE__ */ new Set(["execution", "proposal", "intent", "manual", "external"]);
async function runCanon(args) {
  const verb = args.positional[0] ?? "help";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return help6(args);
  if (verb === "write") return write(args);
  if (verb === "show") return show5(args);
  if (verb === "list") return list6(args);
  if (verb === "supersede") return supersede(args);
  emitError(`ema canon: unknown subcommand "${verb}" (expected: write | show | list | supersede)`);
  return 64;
}
function help6(args) {
  return runStubContract(args, {
    noun: "canon",
    status: "available",
    docRef: "packages/contracts/events/canon.md",
    commands: [
      {
        verb: "write",
        flags: ["kind", "body-file", "source-kind", "source-id", "written-by", "id", "approved-by", "link", "json"],
        required: ["kind", "body-file", "source-kind", "source-id", "written-by"],
        summary: "Write a daemon-canonical canon node."
      },
      { verb: "show", flags: ["json"], required: ["id"], summary: "Show one canon node with links and events." },
      { verb: "list", flags: ["kind", "source-kind", "source-id", "linked-to", "json"], summary: "List canon nodes." },
      {
        verb: "supersede",
        flags: ["by", "actor", "rationale", "json"],
        required: ["old-id", "by", "actor", "rationale"],
        summary: "Mark an existing canon node superseded by another canon node."
      }
    ]
  });
}
async function write(args) {
  const kind = flagString(args, "kind");
  const bodyFile = flagString(args, "body-file");
  const sourceKind = flagString(args, "source-kind");
  const sourceId = flagString(args, "source-id");
  const writtenBy = flagString(args, "written-by");
  if (!kind || !bodyFile || !sourceKind || !sourceId || !writtenBy) {
    return fail4(args, "canon.write", "invalid_args", "--kind, --body-file, --source-kind, --source-id, and --written-by are required", 64);
  }
  if (!CANON_KINDS.has(kind)) return fail4(args, "canon.write", "invalid_args", `invalid canon kind: ${kind}`, 64);
  if (!SOURCE_KINDS.has(sourceKind)) return fail4(args, "canon.write", "invalid_args", `invalid source kind: ${sourceKind}`, 64);
  const id = flagString(args, "id");
  if (id && canonById(id)) return fail4(args, "canon.write", "duplicate_id", `canon node already exists: ${id}`, 1);
  const body = readFileSync13(bodyFile, "utf8");
  const links = parseLinks(args);
  if (!links.ok) return fail4(args, "canon.write", "invalid_args", links.error, 64);
  const json = flagBool(args, "json");
  let client = null;
  try {
    client = await connect({ surface: "desktop" });
    const result = await client.command("canon.write", {
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      actor_id: writtenBy,
      canon_id: id ?? null,
      canon_kind: kind,
      body,
      content_hash: sha256(body),
      source_kind: sourceKind,
      source_id: sourceId,
      approved_by_actor_id: flagString(args, "approved-by") ?? null,
      links: links.links.map((link) => `${link.kind}:${link.target_id}`)
    });
    if (result.ok !== true) {
      return fail4(args, "canon.write", result.error.class, result.error.message, result.error.class === "invalid_args" ? 64 : 1);
    }
    const canonId = String(result.resource ?? id ?? "");
    const canon = canonById(canonId);
    const payload = {
      ok: Boolean(canon),
      command: "canon.write",
      source: "daemon_command",
      daemon_authority: "canonical_events",
      events: result.events ?? [],
      canon
    };
    if (json) emitJson(payload);
    else emitPretty(`canon: ${canonId}`);
    return canon ? 0 : 1;
  } catch (err) {
    return reportError(err, json);
  } finally {
    client?.close();
  }
}
function show5(args) {
  const id = args.positional[1] ?? flagString(args, "id");
  if (!id) return fail4(args, "canon.show", "invalid_args", "canon id is required", 64);
  const canon = canonById(id);
  const payload = {
    ok: Boolean(canon),
    command: "canon.show",
    source: "canonical_sqlite",
    daemon_authority: "canonical_events",
    canon,
    events: eventsMentioning(id)
  };
  if (flagBool(args, "json")) emitJson(payload);
  else if (canon) emitPretty(JSON.stringify(payload, null, 2));
  else emitError(`canon node not found: ${id}`);
  return canon ? 0 : 1;
}
function list6(args) {
  const linkedTo = flagString(args, "linked-to");
  const nodes = canonRecords({
    kind: flagString(args, "kind"),
    sourceKind: flagString(args, "source-kind"),
    sourceId: flagString(args, "source-id"),
    linkedTo
  });
  const payload = {
    ok: true,
    command: "canon.list",
    source: "canonical_sqlite",
    daemon_authority: "canonical_events",
    canon_nodes: nodes
  };
  if (flagBool(args, "json")) emitJson(payload);
  else for (const node of nodes) emitPretty(`${node.canon_id} ${node.kind} ${node.source_kind}:${node.source_id ?? ""}`);
  return 0;
}
async function supersede(args) {
  const oldId = args.positional[1] ?? flagString(args, "id");
  const by = flagString(args, "by");
  const actor = flagString(args, "actor");
  const rationale = flagString(args, "rationale");
  if (!oldId || !by || !actor || !rationale) {
    return fail4(args, "canon.supersede", "invalid_args", "old id, --by, --actor, and --rationale are required", 64);
  }
  if (!canonById(oldId)) return fail4(args, "canon.supersede", "not_found", `canon node not found: ${oldId}`, 1);
  if (!canonById(by)) return fail4(args, "canon.supersede", "not_found", `superseding canon node not found: ${by}`, 1);
  const json = flagBool(args, "json");
  let client = null;
  try {
    client = await connect({ surface: "desktop" });
    const result = await client.command("canon.supersede", {
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      actor_id: actor,
      canon_id: oldId,
      superseded_by_canon_id: by,
      reason: rationale
    });
    if (result.ok !== true) {
      return fail4(args, "canon.supersede", result.error.class, result.error.message, result.error.class === "invalid_args" ? 64 : 1);
    }
    const canon = canonById(oldId);
    const payload = {
      ok: Boolean(canon),
      command: "canon.supersede",
      source: "daemon_command",
      daemon_authority: "canonical_events",
      events: result.events ?? [],
      canon
    };
    if (json) emitJson(payload);
    else emitPretty(`canon superseded: ${oldId} -> ${by}`);
    return canon ? 0 : 1;
  } catch (err) {
    return reportError(err, json);
  } finally {
    client?.close();
  }
}
function canonById(canonId) {
  return canonRecords({ id: canonId })[0] ?? null;
}
function canonRecords(filters = {}) {
  if (tableExists("canon_nodes")) {
    const where = [
      filters.id ? `canon_id = '${sqlEscape(filters.id)}'` : null,
      filters.kind ? `kind = '${sqlEscape(filters.kind)}'` : null,
      filters.sourceKind ? `source_kind = '${sqlEscape(filters.sourceKind)}'` : null,
      filters.sourceId ? `source_id = '${sqlEscape(filters.sourceId)}'` : null,
      filters.linkedTo ? `canon_id in (select canon_id from canon_links where target_id = '${sqlEscape(filters.linkedTo)}')` : null
    ].filter(Boolean);
    const nodes = sqliteJson(CANONICAL_DB, `
      select canon_id, kind, content_hash, body, source_kind, source_id,
             written_by_actor_id, approved_by_actor_id, written_at,
             superseded_by, superseded_at
      from canon_nodes
      ${where.length > 0 ? `where ${where.join(" and ")}` : ""}
      order by written_at desc;
    `).map(normalizeCanonRow);
    const links = canonLinks(nodes.map((node) => node.canon_id));
    return nodes.map((node) => ({
      ...node,
      links: links.filter((link) => link.canon_id === node.canon_id)
    }));
  }
  return canonRecordsFromEvents(filters);
}
function canonLinks(ids) {
  if (ids.length === 0 || !tableExists("canon_links")) return [];
  const quoted = ids.map((id) => `'${sqlEscape(id)}'`).join(",");
  return sqliteJson(CANONICAL_DB, `
    select canon_id, kind, target_id
    from canon_links
    where canon_id in (${quoted})
    order by canon_id asc, kind asc, target_id asc;
  `);
}
function canonRecordsFromEvents(filters) {
  const rows = sqliteJson(CANONICAL_DB, `
    select txid, event_id, kind, ts, actor, org_id, space_id, project_id,
           dispatch_id, execution_id, payload_json
    from events
    where kind in ('canon.written', 'canon.superseded')
    order by txid asc;
  `);
  const byId = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const payload = parsePayload2(row.payload_json);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) continue;
    const obj = payload;
    const canonId = stringValue2(obj.canon_id);
    if (!canonId) continue;
    if (row.kind === "canon.written") {
      byId.set(canonId, {
        id: canonId,
        canon_id: canonId,
        kind: stringValue2(obj.kind) ?? "observation",
        content_hash: stringValue2(obj.content_hash) ?? "",
        body: stringValue2(obj.body) ?? "",
        source_kind: stringValue2(obj.source_kind) ?? "manual",
        source_id: stringValue2(obj.source_id),
        written_by_actor_id: stringValue2(obj.written_by_actor_id) ?? row.actor,
        approved_by_actor_id: stringValue2(obj.approved_by_actor_id),
        written_at: stringValue2(obj.written_at) ?? row.ts,
        superseded_by: null,
        superseded_at: null,
        links: linksFromPayload(obj.links, canonId)
      });
      continue;
    }
    const current = byId.get(canonId);
    if (!current) continue;
    byId.set(canonId, {
      ...current,
      superseded_by: stringValue2(obj.superseded_by_canon_id),
      superseded_at: stringValue2(obj.superseded_at) ?? row.ts
    });
  }
  return [...byId.values()].filter(
    (node) => (!filters.id || node.canon_id === filters.id) && (!filters.kind || node.kind === filters.kind) && (!filters.sourceKind || node.source_kind === filters.sourceKind) && (!filters.sourceId || node.source_id === filters.sourceId) && (!filters.linkedTo || node.links.some((link) => link.target_id === filters.linkedTo))
  ).sort((a, b) => b.written_at.localeCompare(a.written_at));
}
function normalizeCanonRow(row) {
  return {
    id: row.canon_id,
    canon_id: row.canon_id,
    kind: row.kind,
    content_hash: row.content_hash,
    body: row.body,
    source_kind: row.source_kind,
    source_id: row.source_id,
    written_by_actor_id: row.written_by_actor_id,
    approved_by_actor_id: row.approved_by_actor_id,
    written_at: row.written_at,
    superseded_by: row.superseded_by,
    superseded_at: row.superseded_at,
    links: []
  };
}
function parseLinks(args) {
  const raw = flagStrings(args, "link").flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
  const links = [];
  for (const value of raw) {
    const index = value.indexOf(":");
    if (index <= 0 || index === value.length - 1) {
      return { ok: false, error: `invalid --link ${value}; expected kind:target-id` };
    }
    links.push({ canon_id: "", kind: value.slice(0, index), target_id: value.slice(index + 1) });
  }
  return { ok: true, links };
}
function linksFromPayload(value, canonId) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const obj = item;
    const kind = stringValue2(obj.kind);
    const targetId = stringValue2(obj.target_id);
    return kind && targetId ? [{ canon_id: canonId, kind, target_id: targetId }] : [];
  });
}
function stringValue2(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}
function fail4(args, command, klass, message, code) {
  const payload = { ok: false, command, error: { class: klass, message } };
  if (flagBool(args, "json")) emitJson(payload);
  else emitError(`${command}: ${message}`);
  return code;
}

// src/commands/bootstrap.ts
async function runBootstrap(args) {
  const verb = args.positional[0] ?? "status";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return help7(args);
  if (verb !== "status") {
    emitError(`ema bootstrap: unknown subcommand "${verb}" (expected: status)`);
    return 64;
  }
  const capability = await capabilityReport(args);
  const required = ["lane", "queue", "agent", "harness", "intention", "db", "artifact", "execution"];
  const failures = capability.capabilities.filter(
    (item) => required.includes(item.id) && (item.state === "missing" || item.state === "stubbed" || item.state === "roundtrip-failed" || item.state === "unsupported-provider-adapter")
  );
  const project = projectRegistry(capability.workspace_scope.project_name ?? "proslync-app-ios-final");
  const payload = {
    ok: capability.ok && failures.length === 0,
    command: "bootstrap.status",
    source: "cli_bootstrap_gate",
    project,
    capability,
    required,
    failures,
    next_safe_commands: [
      "ema status --json",
      "ema agent orient --project proslync-app-ios-final --json",
      "ema capability assert --required lane,queue,agent,harness,intention,db,artifact,execution --project proslync-app-ios-final --json",
      "ema db status --json",
      "ema execution list --project proslync-app-ios-final --json",
      "ema cockpit workpack --project proslync-app-ios-final --json"
    ]
  };
  if (flagBool(args, "json")) emitJson(payload);
  else {
    emitPretty(`bootstrap: ${payload.ok ? "ready" : "blocked"}`);
    if (failures.length) emitPretty(`failures: ${failures.map((item) => `${item.id}:${item.state}`).join(", ")}`);
    for (const command of payload.next_safe_commands) emitPretty(`  ${command}`);
  }
  return payload.ok ? 0 : 1;
}
function help7(args) {
  const commands = [{ verb: "status", summary: "Run the fast CLI/daemon/data readiness gate." }];
  if (flagBool(args, "json")) emitJson({ noun: "bootstrap", status: "available", commands });
  else emitPretty("ema bootstrap status --project proslync-app-ios-final [--json]");
  return 0;
}

// src/commands/db.ts
async function runDb(args) {
  const verb = args.positional[0] ?? "status";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return help8(args);
  if (verb === "status") return status(args);
  if (verb === "events") return events(args);
  if (verb === "snapshot") return snapshot(args);
  emitError(`ema db: unknown subcommand "${verb}" (expected: status | events | snapshot)`);
  return 64;
}
function help8(args) {
  const commands = [
    { verb: "status", summary: "Report canonical SQLite health, tables, row counts, WAL state, and event kinds." },
    { verb: "events", summary: "Read canonical event rows with --kind and --limit filters." },
    { verb: "snapshot", summary: "Return a compact project-scoped DB/event snapshot." }
  ];
  if (flagBool(args, "json")) emitJson({ noun: "db", status: "available", commands });
  else {
    emitPretty("ema db - canonical SQLite/event inspection");
    for (const command of commands) emitPretty(`  ${command.verb.padEnd(10)} ${command.summary}`);
  }
  return 0;
}
function status(args) {
  const value = {
    ok: true,
    command: "db.status",
    source: "canonical_sqlite",
    daemon_authority: "canonical_events",
    database: dbStatus()
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
function events(args) {
  const kind = flagString(args, "kind");
  const limit = parseLimit(flagString(args, "limit"), 50);
  const where = kind ? `where kind like '${sqlEscape(kind.replace(/\*$/, "%"))}'` : "";
  const rows = sqliteJson(CANONICAL_DB, `
    select txid, event_id, kind, ts, actor, org_id, space_id, project_id,
           dispatch_id, execution_id, payload_json
    from events
    ${where}
    order by txid desc
    limit ${limit};
  `).map((row) => ({
    ...row,
    payload: parsePayload4(row.payload_json)
  }));
  const value = {
    ok: true,
    command: "db.events",
    source: "canonical_sqlite",
    daemon_authority: "canonical_events",
    database: CANONICAL_DB,
    kind: kind ?? null,
    limit,
    events: rows
  };
  if (flagBool(args, "json")) emitJson(value);
  else for (const row of rows) emitPretty(`${row.txid} ${row.kind} ${row.event_id}`);
  return 0;
}
async function snapshot(args) {
  const scope = await resolveWorkspaceScope({ args });
  const statusValue = dbStatus();
  const projectId = scope.project_id;
  const projectFilter = projectId ? `where project_id = '${sqlEscape(projectId)}' or project_id is null or project_id = ''` : "";
  const recentEvents = sqliteJson(CANONICAL_DB, `
    select txid, event_id, kind, ts, actor, project_id, dispatch_id, execution_id, payload_json
    from events
    ${projectFilter}
    order by txid desc
    limit 25;
  `).map((row) => ({ ...row, payload: parsePayload4(row.payload_json) }));
  const value = {
    ok: true,
    command: "db.snapshot",
    source: "canonical_sqlite",
    daemon_authority: "canonical_events",
    workspace_scope: scope,
    database: statusValue,
    recent_events: recentEvents
  };
  if (flagBool(args, "json")) emitJson(value);
  else {
    emitPretty(`project: ${scope.project_name ?? scope.project_id ?? "unresolved"}`);
    emitPretty(`recent events: ${recentEvents.length}`);
  }
  return statusValue.ok ? 0 : 1;
}
function parsePayload4(value) {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

// src/commands/execution.ts
async function runExecution(args) {
  const verb = args.positional[0] ?? "list";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return help9(args);
  if (verb === "list") return listExecutions(args);
  if (verb === "show") return showExecution(args);
  if (verb === "timeline") return timeline2(args);
  emitError(`ema execution: unknown subcommand "${verb}" (expected: list | show | timeline)`);
  return 64;
}
async function runDispatch3(args) {
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
  const events2 = eventRows("dispatch.%", limit, scope.project_id);
  const dispatches = groupDispatches(events2);
  const payload = {
    ok: true,
    command: "dispatch.list",
    source: "canonical_sqlite_events",
    daemon_authority: "canonical_events",
    workspace_scope: scope,
    include_unscoped: true,
    dispatches
  };
  if (flagBool(args, "json")) emitJson(payload);
  else for (const item of dispatches) emitPretty(`${item.dispatch_id} ${item.status} ${item.provider ?? ""}`);
  return 0;
}
function help9(args) {
  const commands = [
    { verb: "list", summary: "List executions from canonical dispatch/execution/tool events." },
    { verb: "show", summary: "Show one execution by --execution." },
    { verb: "timeline", summary: "Show ordered dispatch/execution/tool events for one execution." }
  ];
  if (flagBool(args, "json")) emitJson({ noun: "execution", status: "available", commands });
  else {
    emitPretty("ema execution - execution registry over canonical events");
    for (const command of commands) emitPretty(`  ${command.verb.padEnd(10)} ${command.summary}`);
  }
  return 0;
}
async function listExecutions(args) {
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
    executions
  };
  if (flagBool(args, "json")) emitJson(payload);
  else for (const item of executions) emitPretty(`${item.execution_id} ${item.status} ${item.provider ?? ""}`);
  return 0;
}
async function showExecution(args) {
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
    timeline: normalizeEvents(rows)
  };
  if (flagBool(args, "json")) emitJson(payload);
  else if (grouped) emitPretty(JSON.stringify(payload, null, 2));
  else emitError(`execution not found: ${execution}`);
  return grouped ? 0 : 1;
}
async function timeline2(args) {
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
    timeline: normalizeEvents(rows)
  };
  if (flagBool(args, "json")) emitJson(payload);
  else for (const event of payload.timeline) emitPretty(`${event.txid} ${event.kind} ${event.event_id}`);
  return rows.length > 0 ? 0 : 1;
}
function eventRows(kindLike, limit, projectId) {
  const projectFilter = projectId ? `and (project_id = '${sqlEscape(projectId)}' or project_id is null or project_id = '')` : "";
  return sqliteJson(CANONICAL_DB, `
    select txid, event_id, kind, ts, actor, org_id, space_id, project_id,
           dispatch_id, execution_id, payload_json
    from events
    where kind like '${sqlEscape(kindLike)}' ${projectFilter}
    order by txid desc
    limit ${limit};
  `);
}
function rowsForExecution(execution) {
  return sqliteJson(CANONICAL_DB, `
    select txid, event_id, kind, ts, actor, org_id, space_id, project_id,
           dispatch_id, execution_id, payload_json
    from events
    where execution_id = '${sqlEscape(execution)}'
       or dispatch_id in (select dispatch_id from events where execution_id = '${sqlEscape(execution)}' and dispatch_id is not null)
    order by txid asc;
  `);
}
function groupExecutions(rows) {
  const byId = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const id = row.execution_id;
    if (!id) continue;
    byId.set(id, [...byId.get(id) ?? [], row]);
  }
  return [...byId.entries()].map(([executionId, events2]) => {
    const first = events2[events2.length - 1] ?? events2[0];
    const latest = events2[0];
    const payloads = events2.map((event) => parsePayload5(event.payload_json)).filter((value) => value && typeof value === "object");
    const canon = canonRecords({ sourceKind: "execution", sourceId: executionId })[0] ?? null;
    return {
      execution_id: executionId,
      dispatch_id: latest?.dispatch_id ?? first?.dispatch_id ?? null,
      status: statusFrom(events2),
      provider: firstString(payloads, "provider"),
      name: firstString(payloads, "name") ?? firstString(payloads, "tool_name"),
      jsonl_path: firstString(payloads, "session_file_path"),
      canon_id: firstString(payloads, "canon_id") ?? canon?.canon_id ?? null,
      started_at: events2.find((event) => event.kind === "execution.started")?.ts ?? null,
      ended_at: events2.find(
        (event) => event.kind === "execution.completed" || event.kind === "execution.ended" || event.kind === "execution.failed" || event.kind === "execution.timeout" || event.kind === "execution.interrupted_by_restart"
      )?.ts ?? null,
      event_count: events2.length,
      latest_txid: latest?.txid ?? null
    };
  }).sort((a, b) => Number(b.latest_txid ?? 0) - Number(a.latest_txid ?? 0));
}
function groupDispatches(rows) {
  const byId = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const id = row.dispatch_id;
    if (!id) continue;
    byId.set(id, [...byId.get(id) ?? [], row]);
  }
  return [...byId.entries()].map(([dispatchId, events2]) => {
    const latest = events2[0];
    const payloads = events2.map((event) => parsePayload5(event.payload_json)).filter((value) => value && typeof value === "object");
    return {
      dispatch_id: dispatchId,
      status: events2.some((event) => event.kind === "dispatch.ended") ? "ended" : "started",
      provider: firstString(payloads, "provider"),
      intent: firstString(payloads, "intent"),
      event_count: events2.length,
      latest_txid: latest?.txid ?? null
    };
  }).sort((a, b) => Number(b.latest_txid ?? 0) - Number(a.latest_txid ?? 0));
}
function normalizeEvents(rows) {
  return rows.map((row) => ({
    ...row,
    payload: parsePayload5(row.payload_json)
  }));
}
function parsePayload5(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
function statusFrom(events2) {
  const latest = [...events2].sort((a, b) => Number(b.txid ?? 0) - Number(a.txid ?? 0)).find(
    (event) => event.kind === "execution.failed" || event.kind === "execution.timeout" || event.kind === "execution.completed" || event.kind === "execution.ended" || event.kind === "execution.interrupted_by_restart" || event.kind === "execution.started"
  );
  if (latest?.kind === "execution.completed") return "completed";
  if (latest?.kind === "execution.failed") return "failed";
  if (latest?.kind === "execution.timeout") return "timeout";
  if (latest?.kind === "execution.ended") return "completed";
  if (latest?.kind === "execution.interrupted_by_restart") return "interrupted_by_restart";
  if (latest?.kind === "execution.started") return "running";
  return "unknown";
}
function firstString(payloads, key) {
  for (const payload of payloads) {
    const value = payload[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}

// src/commands/proslync.ts
async function runProslync(args) {
  const verb = args.positional[0] ?? "bootstrap";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return help10(args);
  if (verb !== "bootstrap") {
    emitError(`ema proslync: unknown subcommand "${verb}" (expected: bootstrap)`);
    return 64;
  }
  const scopedArgs = {
    ...args,
    flags: { ...args.flags, project: args.flags.project ?? "proslync-app-ios-final" }
  };
  const readiness = await buildReadiness(scopedArgs);
  const capability = readiness.capability;
  const required = ["lane", "queue", "agent", "harness", "intention", "db", "artifact", "execution"];
  const capabilityFailures = capability.capabilities.filter(
    (item) => required.includes(item.id) && (item.state === "missing" || item.state === "stubbed" || item.state === "roundtrip-failed" || item.state === "unsupported-provider-adapter")
  );
  const failures = [...readiness.report.blockers, ...capabilityFailures];
  const payload = {
    ok: readiness.report.proslync_execution_ready,
    command: "proslync.bootstrap",
    source: "proslync_acceptance_workpack",
    project: projectRegistry("proslync-app-ios-final"),
    database: dbStatus(),
    capability,
    readiness: readiness.report,
    blockers: readiness.report.blockers,
    capability_failures: capabilityFailures,
    failures,
    next_safe_commands: [
      "ema cockpit workpack --project proslync-app-ios-final --json",
      "ema lane list --project proslync-app-ios-final --json",
      "ema queue list --project proslync-app-ios-final --json",
      "ema intention list --project proslync-app-ios-final --state accepted --json",
      "ema execution list --project proslync-app-ios-final --json"
    ]
  };
  if (flagBool(args, "json")) emitJson(payload);
  else {
    emitPretty(`Proslync bootstrap: ${payload.ok ? "ready" : "blocked"}`);
    for (const command of payload.next_safe_commands) emitPretty(`  ${command}`);
  }
  return payload.ok ? 0 : 1;
}
function help10(args) {
  const commands = [{ verb: "bootstrap", summary: "Return Proslync-first acceptance workpack readiness." }];
  if (flagBool(args, "json")) emitJson({ noun: "proslync", status: "available", commands });
  else emitPretty("ema proslync bootstrap [--json]");
  return 0;
}

// src/bin.ts
async function main() {
  const [, , cmd, ...rest] = process.argv;
  const args = parseArgs(rest);
  switch (cmd) {
    case void 0:
    case "help":
    case "--help":
    case "-h":
      return runHelp(args);
    case "ping":
      return runPing(args);
    case "status":
      return runStatus(args);
    case "events":
      return runEvents(args);
    case "org":
      return runOrg(args);
    case "space":
      return runSpace(args);
    case "project":
      return runProject(args);
    case "swarm":
      return runSwarm(args);
    case "vcalendar":
      return runVcalendar(args);
    case "checkup":
      return runCheckup(args);
    case "campaign":
      return runCampaign(args);
    case "mission":
      return runMission(args);
    case "lane":
      return runLane(args);
    case "queue":
      return runQueue(args);
    case "handoff":
      return runHandoff(args);
    case "problem":
      return runProblem(args);
    case "blueprint":
      return runBlueprint(args);
    case "wiki":
      return runWiki(args);
    case "hermes":
      return runHermes(args);
    case "harness":
      return runHarness(args);
    case "peer":
      return runPeer(args);
    case "agent":
      return runAgent(args);
    case "next":
      return runNext(args);
    case "tl":
    case "/tl":
      return runTl(args);
    case "gap":
      return runGap(args);
    case "doctor":
      return runDoctor2(args);
    case "desktop":
      return runDesktop(args);
    case "recovery":
      return runRecovery(args);
    case "cwt":
      return runCwt(args);
    case "cockpit":
      return runCockpit(args);
    case "intention":
      return runIntention(args);
    case "actor":
      return runActor(args);
    case "intent":
      return runIntent(args);
    case "proposal":
      return runProposal(args);
    case "canon":
      return runCanon(args);
    case "bootstrap":
      return runBootstrap(args);
    case "capability":
      return runCapability(args);
    case "db":
      return runDb(args);
    case "workspace":
      return runWorkspace(args);
    case "execution":
      return runExecution(args);
    case "dispatch":
      return runDispatch3(args);
    case "proslync":
      return runProslync(args);
    case "readiness":
      return runReadiness(args);
    default:
      emitError(`ema: unknown command "${cmd}"`);
      emitError(`Run "ema help" to list commands.`);
      return 64;
  }
}
main().then(
  (code) => process.exit(code),
  (err) => {
    emitError(`ema: internal error: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
    process.exit(1);
  }
);
