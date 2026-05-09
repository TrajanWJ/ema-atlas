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
      flags[body.slice(0, eq)] = body.slice(eq + 1);
      continue;
    }
    const next = argv[i + 1];
    if (next !== void 0 && !next.startsWith("--")) {
      flags[body] = next;
      i += 1;
    } else {
      flags[body] = true;
    }
  }
  return { positional, flags };
}
function flagString(args, name) {
  const v = args.flags[name];
  return typeof v === "string" ? v : void 0;
}
function flagBool(args, name) {
  return args.flags[name] === true || args.flags[name] === "true";
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
  { name: "org create", summary: "Create an organization and its same-name default space." },
  { name: "space create", summary: "Create a space inside an organization." },
  { name: "project create", summary: "Create a project inside an organization space." },
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
  emitPretty("Orientation: ema tl about --json; ema status --json; ema agent orient --json; ema vcalendar tick --json");
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
  const help = flagBool(args, "help") || args.flags.h === true || verb === void 0 || verb === "help";
  if (help) {
    const status = opts.status ?? "pending_daemon_writer";
    if (json) {
      emitJson({
        noun: opts.noun,
        status,
        commands: opts.commands,
        doc: opts.docRef
      });
    } else {
      emitPretty(`ema ${opts.noun} \u2014 agent workspace commands`);
      emitPretty(`status: ${status}`);
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
var EMA_ACTIVE_BUILD = join(DESKTOP_ROOT, "Active builds", "EMA-0.0.5");
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
      "Start every agent session with `ema next --json`, `ema tl about --summary --json`, and `ema vcalendar tick --json`.",
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
        "Run `ema status --json` and `ema agent orient --json`.",
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
      const { projectName, version } = parseBuildName(buildName);
      const project = pickProject(projects, projectName);
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
function inferBuildPaths(projectName, projectRecord, cwd, configuredActiveBuild) {
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
      if (sameProjectName(parsed.projectName, projectName)) {
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
    activeBuild: configured ?? matchActiveBuildPath(projectName),
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
function matchActiveBuildPath(projectName) {
  if (!existsSync2(ACTIVE_BUILDS_DIR)) return null;
  const exact = join2(ACTIVE_BUILDS_DIR, projectName);
  if (existsSync2(exact) && isDirectory(exact)) return exact;
  try {
    const entries = readdirSync2(ACTIVE_BUILDS_DIR);
    const prefixed = entries.find((name) => name.startsWith(`${projectName}-`));
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

// src/commands/events.ts
async function runEvents(args) {
  const sub = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || sub === "help") {
    return runStubContract(args, {
      noun: "events",
      status: "available",
      docRef: "packages/contracts/ipc/shell-protocol.md",
      commands: [
        { verb: "tail", flags: ["family", "kind", "since", "json"], summary: "Stream daemon events line-by-line until interrupted." }
      ]
    });
  }
  if (sub !== "tail") {
    emitError(`ema events: unknown subcommand "${sub ?? ""}" (expected: tail)`);
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

// src/commands/workspace-daemon.ts
var DEFAULT_ORG = "org:01J00000000000000000000001";
var DEFAULT_ACTOR = "actor:dev-console";
async function workspaceScopeContext(args) {
  return {
    scope: await resolveWorkspaceScope({ args }),
    allProjects: flagBool(args, "all-projects")
  };
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
    const events = result.events ?? [];
    const resource = typeof result.resource === "string" ? result.resource : null;
    const warning = result.warning ?? null;
    if (json) {
      emitJson({
        ok: true,
        command: op,
        op,
        source: "daemon_command",
        daemon_authority: "canonical_events",
        events,
        resource,
        warning,
        workspace_scope: scopeContext.scope,
        all_projects: scopeContext.allProjects
      });
    } else {
      emitPretty(out.human);
      if (resource) emitPretty(`${out.resourceLabel ?? "resource"}: ${resource}`);
      emitPretty(`events: ${events.join(", ") || "(none returned)"}`);
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
    emitError(`Usage: ema org create --name Founding-Fathers-EMA`);
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
    const events = result.events ?? [];
    if (json) {
      emitJson({ ok: true, name, events });
    } else {
      emitPretty(`created org: ${name}`);
      emitPretty(`events: ${events.join(", ") || "(none returned)"}`);
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
    const events = result.events ?? [];
    if (json) {
      emitJson({ ok: true, org_id: orgId, name, events });
    } else {
      emitPretty(`created space: ${name}`);
      emitPretty(`events: ${events.join(", ") || "(none returned)"}`);
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
        { verb: "create", flags: ["org", "space", "name"], required: ["org", "space", "name"], summary: "Create a project inside an organization space." }
      ]
    });
  }
  if (sub !== "create") {
    emitError(`ema project: unknown subcommand "${sub ?? ""}" (expected: create)`);
    return 64;
  }
  const json = flagBool(args, "json");
  const orgId = flagString(args, "org");
  const spaceId = flagString(args, "space");
  const name = flagString(args, "name") ?? args.positional.slice(1).join(" ");
  if (!orgId || !spaceId || !name.trim()) {
    emitError(`ema project create: missing --org, --space, or --name`);
    emitError(`Usage: ema project create --org org:<id> --space space:<id> --name "EMA 0.0.5"`);
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
    const events = result.events ?? [];
    if (json) {
      emitJson({ ok: true, org_id: orgId, space_id: spaceId, name, events });
    } else {
      emitPretty(`created project: ${name}`);
      emitPretty(`events: ${events.join(", ") || "(none returned)"}`);
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
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
        "Run `ema status --json` and `ema agent orient --json`.",
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
    const events = result.events ?? [];
    const resource = typeof result.resource === "string" ? result.resource : null;
    if (out.json) {
      emitJson({ ok: true, op, args: argsObj, events, resource });
    } else {
      emitPretty(out.human);
      if (resource) emitPretty(`${out.resourceLabel ?? "created"}: ${resource}`);
      emitPretty(`events: ${events.join(", ") || "(none returned)"}`);
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
        { verb: "complete", flags: ["checkup", "result", "actor"], required: ["checkup", "result"], summary: "Mark a scheduled checkup complete." }
      ]
    });
  }
  switch (sub) {
    case "schedule":
      return runSchedule(args);
    case "complete":
      return runComplete(args);
    default:
      emitError(
        `ema checkup: unknown subcommand "${sub ?? ""}" (expected: schedule | complete)`
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
    const events = res.events ?? [];
    const resource = typeof res.resource === "string" ? res.resource : null;
    if (out.json) emitJson({ ok: true, op, args: argsObj, events, resource });
    else {
      emitPretty(out.human);
      if (resource) emitPretty(`${out.resourceLabel ?? "created"}: ${resource}`);
      emitPretty(`events: ${events.join(", ") || "(none returned)"}`);
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
        flags: ["lane"],
        required: ["lane"],
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
  const status = flagString(args, "status");
  if (!lane || !status) {
    emitError("ema lane move: --lane and --status are required");
    return 64;
  }
  return sendWorkspaceCommand(args, "lane.move", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    project_id: flagString(args, "project") ?? null,
    lane_id: lane,
    status
  }, { human: `moved lane ${lane} to ${status}` });
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
  const laneId = flagString(args, "lane");
  if (!laneId) {
    emitError("ema lane show: --lane is required");
    return 64;
  }
  const lanes = await loadLanes(args);
  if (!lanes) return 1;
  const lane = lanes.items.find((item) => item.id === laneId || item.lane_id === laneId) ?? null;
  if (json) {
    emitJson({
      ok: true,
      source: "lane.registry",
      daemon_authority: "canonical_events",
      workspace_scope: lanes.context.scope,
      all_projects: lanes.context.allProjects,
      filter: lanes.context.allProjects ? "all_projects" : "project",
      lane
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
        flags: ["queue-item"],
        required: ["queue-item"],
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
  const itemId = flagString(args, "queue-item");
  if (!itemId) {
    emitError("ema queue show: --queue-item is required");
    return 64;
  }
  const queue = await loadQueue(args);
  if (!queue) return 1;
  const item = queue.items.find((record) => record.id === itemId || record.queue_item_id === itemId) ?? null;
  if (json) {
    emitJson({
      ok: true,
      source: "queue.registry",
      daemon_authority: "canonical_events",
      workspace_scope: queue.context.scope,
      all_projects: queue.context.allProjects,
      filter: queue.context.allProjects ? "all_projects" : "project",
      queue_item: item
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
  const nextAction = activeLane ? `continue ${activeLane.id}: ${activeLane.title}` : readyLanes[0] ? `claim ${readyLanes[0].id}: ${readyLanes[0].title}` : readyQueue[0] ? `pull ${readyQueue[0].id}: ${readyQueue[0].title}` : blockedQueue[0] ? `unblock ${blockedQueue[0].id}: ${blockedQueue[0].title}` : "run ema next --json";
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
      "ema tl about --json",
      "ema agent meta-progress --json",
      activeLane ? `ema lane show --lane ${activeLane.id} --json` : "ema lane list --json",
      "ema queue list --json",
      "ema vcalendar tick --json"
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
  const commands = [
    "ema tl about --json",
    "ema status --json",
    "ema next --json",
    "ema lane --help",
    "ema queue --help",
    "ema problem --help",
    "ema vcalendar tick --json"
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
  const nextSuggestedCliCommand = activeLane ? `ema lane show --lane ${activeLane.id} --json` : recommendedNextLane ? `ema lane claim --lane ${recommendedNextLane.id} --actor ${actor} --scope "<scope>" --goal "<goal>" --next "<next>" --json` : blockedQueueItems[0] ? `ema queue show --queue-item ${blockedQueueItems[0].id} --json` : "ema next --json";
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
      usage: "Usage: ema next [--actor actor:<id>] [--json]",
      docRef: "docs/cli/agent-workspace.md",
      commands: [
        { verb: "recommend", flags: ["actor", "json"], summary: "Recommend the next lane, queue item, or orientation command." }
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
  const nextCommand = activeLane ? `ema lane show --lane ${activeLane.id} --json` : recommendedLane ? `ema lane claim --lane ${recommendedLane.id} --actor ${actor} --scope "<scope>" --goal "<goal>" --next "<next>" --json` : readyQueueItem ? `ema queue show --queue-item ${readyQueueItem.id} --json` : "ema agent orient --json";
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
  const help = flagBool(args, "help") || args.flags.h === true || verb === void 0 || verb === "help";
  if (help) return runHelp2(args);
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
        const status = r.status ?? "?";
        const title = r.title ?? r.question ?? "(untitled)";
        emitPretty(`  ${id} [${status}] ${title}`);
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
    const events = result.events ?? [];
    const resource = typeof result.resource === "string" ? result.resource : null;
    const warning = result.warning ?? null;
    if (out.json) emitJson({ ok: true, op, args: argsObj, events, resource, warning });
    else {
      emitPretty(out.human);
      if (resource) emitPretty(`${out.resourceLabel ?? "created"}: ${resource}`);
      emitPretty(`events: ${events.join(", ") || "(none returned)"}`);
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
function summarizeCollabDocument(projection) {
  if (!projection.received || !projection.data) {
    return { received: false, status: "not_visible" };
  }
  return {
    received: true,
    document_id: projection.data.document_id ?? null,
    title: projection.data.title ?? null,
    target: projection.data.target ?? null,
    revision: projection.data.revision ?? projection.data.version ?? null,
    status: projection.data.status ?? null,
    authority: projection.data.authority ?? null,
    storage_authority: projection.data.storage_authority ?? null,
    updated_at: projection.data.updated_at ?? null
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
var ATLAS_ROOT = path.resolve(process.cwd(), "../../Projects/EMA/atlas");
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
  const limit = parseLimit(args, 30);
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
  const limit = parseLimit(args, 10);
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
  const abs = path.join(ATLAS_ROOT, safePath);
  if (!abs.startsWith(ATLAS_ROOT)) {
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
function parseLimit(args, fallback) {
  const raw = flagString(args, "limit");
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

// src/commands/hermes.ts
import { existsSync as existsSync3 } from "fs";
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
  "Active builds/EMA-0.0.5/README.md",
  "Active builds/EMA-0.0.5/docs/cli/agent-workspace.md"
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
    docs_read: DOCS.map((doc) => ({ path: doc, present: existsSync3(`${summary.root}/${doc}`) })),
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
      { provider: "simulated", lane, cwd: "Active builds/EMA-0.0.5", purpose: "prove Harness Glue event normalization" },
      { provider: "codex", lane, cwd: "Active builds/EMA-0.0.5", purpose: "future PTY adapter implementation", status: "planned" },
      { provider: "claude-code", lane, cwd: "Active builds/EMA-0.0.5", purpose: "future PTY adapter implementation", status: "planned" }
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
    status: "pending_daemon_writer",
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
      'ema harness dispatch --provider simulated --lane <lane> --cwd "Active builds/EMA-0.0.5" --prompt "prove Harness Glue" --json'
    ];
  }
  if (blockedCount > 0) return ["ema hermes sweep --json", "ema queue list --status blocked --json", "ema problem --help"];
  return ["ema lane list --json", "ema hermes plan --json", "ema vcalendar tick --json"];
}

// src/commands/harness.ts
import { existsSync as existsSync4, mkdirSync, readFileSync as readFileSync3, readdirSync as readdirSync3, writeFileSync } from "fs";
import { join as join3 } from "path";
import { spawnSync } from "child_process";
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
    status: "ready",
    source: "duct-tape-onion-harness",
    capabilities: ["dispatch", "start", "list", "log", "context", "events", "grep", "stream", "stop"],
    normalized_events: ["dispatch.started", "execution.started", "tool.invoked", "tool.returned", "execution.ended", "dispatch.ended"]
  },
  {
    id: "claude-code",
    kind: "pty",
    status: "ready",
    source: "duct-tape-onion-harness",
    capabilities: ["dispatch", "start", "list", "log", "context", "events", "grep", "stream", "stop"],
    normalized_events: ["dispatch.started", "execution.started", "tool.invoked", "tool.returned", "execution.ended", "dispatch.ended"]
  },
  {
    id: "hermes",
    kind: "cli",
    status: "future_consumer",
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
      usable_now: ["harness.providers", "harness.donors", "simulated dispatch", "tmux-backed long-running Codex/Claude workers", "lane-assigned sessions", "session context snapshots", "event log replay", "tool timeline replay", "session grep", "stop audit event"],
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
  const executionId = `execution:harness:${stableId(`${provider}:${name}:${cwd}:${Date.now()}`)}`;
  const dispatchId = `dispatch:harness:${stableId(`${provider}:${prompt}:${Date.now()}`)}`;
  const session = sanitizeSession(`ema-${provider}-${name}-${stableId(executionId)}`);
  const command = providerCommand(provider, cwd, prompt);
  const record = {
    ok: true,
    command: "harness start",
    status: flagBool(args, "dry-run") ? "dry_run" : "running",
    daemon_authority: "pending_daemon_writer",
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
    const created = spawnSync("tmux", ["new-session", "-d", "-s", session, "-x", "140", "-y", "40"], { encoding: "utf8" });
    if (created.status !== 0) {
      emitError(`ema harness start: tmux new-session failed: ${created.stderr || created.stdout}`);
      return 1;
    }
    const sent = spawnSync("tmux", ["send-keys", "-t", session, command, "Enter"], { encoding: "utf8" });
    if (sent.status !== 0) {
      emitError(`ema harness start: tmux send-keys failed: ${sent.stderr || sent.stdout}`);
      return 1;
    }
    if (provider === "claude-code") {
      spawnSync("tmux", ["send-keys", "-t", session, prompt, "Enter"], { encoding: "utf8" });
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
    daemon_authority: "pending_daemon_writer",
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
  const payload = { ok: true, command: "harness assign", status: flagBool(args, "dry-run") ? "dry_run" : "assigned", daemon_authority: "pending_daemon_writer", lane_id: lane, execution_id: execution, assignment: updated.lane_assignment, event };
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
    daemon_authority: "pending_daemon_writer",
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
  const payload = { ok: true, command: "harness events", backend: "file_backed_event_log", daemon_authority: "pending_daemon_writer", selector: { execution: execution ?? null, lane: lane ?? null }, events: readEvents({ execution, lane }) };
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
  const rg = spawnSync("rg", ["--json", query, bundle], { encoding: "utf8" });
  const matches = (rg.stdout || "").trim().split("\n").filter(Boolean).map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return { type: "parse_error", raw: line };
    }
  }).filter((entry) => entry.type === "match");
  const payload = { ok: rg.status === 0 || rg.status === 1, command: "harness grep", backend: "ripgrep_search_bundle", daemon_authority: "pending_daemon_writer", selector: { execution: execution ?? null, lane: lane ?? null }, query, bundle, matches };
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
  const captured = spawnSync("tmux", ["capture-pane", "-t", session, "-p", "-S", flagString(args, "lines") ? `-${flagString(args, "lines")}` : "-80"], { encoding: "utf8" });
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
  if (provider !== "simulated") {
    const pending = {
      ok: true,
      command: "harness dispatch",
      status: "pending_provider_adapter",
      provider,
      lane,
      cwd,
      prompt,
      required_capability: `${provider} PTY/SDK adapter`
    };
    if (flagBool(args, "json")) emitJson(pending);
    else emitPretty(`${provider} adapter pending; simulated provider is ready`);
    return 0;
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
  const executionId = `execution:simulated:${stableId(`${lane ?? "no-lane"}:${cwd}:${prompt}`)}`;
  const events = timeline(executionId, lane, cwd, prompt);
  const payload = {
    ok: true,
    command: "harness dispatch",
    provider,
    status: "simulated_execution_completed",
    source: "client_side_fallback",
    projections: ["dispatch.registry", "execution.registry", "tool.timeline", "chronicle.activity"],
    dispatch: { id: `dispatch:simulated:${stableId(prompt || executionId)}`, lane, cwd, prompt },
    execution: { id: executionId, provider, status: "completed", lane, cwd },
    events
  };
  if (flagBool(args, "json")) emitJson(payload);
  else emitPretty(`execution: ${executionId}`);
  return 0;
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
        events: [
          { type: "dispatch.started", event_id: dispatchEventId },
          { type: "execution.started", event_id: execStartEventId },
          { type: "tool.invoked", event_id: toolInvokeEventId },
          { type: "tool.returned", event_id: toolReturnEventId },
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
    const killed = spawnSync("tmux", ["kill-session", "-t", session], { encoding: "utf8" });
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
  if (home) return join3(home, ".ema-dev", "harness-glue");
  return join3(process.cwd(), ".ema-dev", "harness-glue");
}
function registryDir() {
  return join3(harnessGlueRoot(), "executions");
}
function registryPath(executionId) {
  return join3(registryDir(), `${sanitizeFile(executionId)}.json`);
}
function writeRecord(record) {
  mkdirSync(registryDir(), { recursive: true });
  writeFileSync(registryPath(record.execution.id), JSON.stringify({ ...record, updated_at: (/* @__PURE__ */ new Date()).toISOString() }, null, 2) + "\n");
}
function readRecord(executionId) {
  const path2 = registryPath(executionId);
  if (!existsSync4(path2)) return null;
  return JSON.parse(readFileSync3(path2, "utf8"));
}
function readRecords2() {
  const dir = registryDir();
  if (!existsSync4(dir)) return [];
  return readdirSync3(dir).filter((file) => file.endsWith(".json")).map((file) => JSON.parse(readFileSync3(join3(dir, file), "utf8")));
}
function laneAssignmentsDir() {
  return join3(harnessGlueRoot(), "lane-sessions");
}
function laneAssignmentPath(lane) {
  return join3(laneAssignmentsDir(), `${sanitizeFile(lane)}.json`);
}
function eventLogPath() {
  return join3(harnessGlueRoot(), "events.ndjson");
}
function searchDir() {
  return join3(harnessGlueRoot(), "search-bundles");
}
function upsertLaneAssignment(lane, record) {
  mkdirSync(laneAssignmentsDir(), { recursive: true });
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
  writeFileSync(laneAssignmentPath(lane), JSON.stringify({ lane_id: lane, backend: "file_backed_lane_session_registry", daemon_authority: "pending_daemon_writer", sessions }, null, 2) + "\n");
}
function readLaneAssignment(lane) {
  const path2 = laneAssignmentPath(lane);
  if (!existsSync4(path2)) return null;
  return JSON.parse(readFileSync3(path2, "utf8"));
}
function readLaneAssignments() {
  const dir = laneAssignmentsDir();
  if (!existsSync4(dir)) return [];
  return readdirSync3(dir).filter((file) => file.endsWith(".json")).map((file) => JSON.parse(readFileSync3(join3(dir, file), "utf8")));
}
function appendEvents(events) {
  mkdirSync(harnessGlueRoot(), { recursive: true });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const lines = events.map((event) => JSON.stringify({ recorded_at: event.recorded_at ?? now, ...event })).join("\n");
  if (lines) writeFileSync(eventLogPath(), lines + "\n", { flag: "a" });
}
function readEvents(selector) {
  const path2 = eventLogPath();
  let events = [];
  if (existsSync4(path2)) {
    events = readFileSync3(path2, "utf8").split("\n").filter(Boolean).map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { type: "unparsed", raw: line };
      }
    });
  }
  for (const record of readRecords2()) {
    for (const event of record.events ?? []) events.push({ recorded_at: record.updated_at ?? null, ...event });
  }
  if (selector.execution) events = events.filter((event) => event.execution_id === selector.execution);
  if (selector.lane) events = events.filter((event) => event.lane_id === selector.lane);
  return events;
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
  return spawnSync("tmux", ["has-session", "-t", session], { encoding: "utf8" }).status === 0;
}
function captureTmux(session, lines) {
  const captured = spawnSync("tmux", ["capture-pane", "-t", session, "-p", "-S", `-${lines}`], { encoding: "utf8" });
  return { ok: captured.status === 0, tmux_session: session, output: captured.stdout, error: captured.stderr || null };
}
function writeSearchBundle(records) {
  mkdirSync(searchDir(), { recursive: true });
  const path2 = join3(searchDir(), `bundle-${Date.now()}.txt`);
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
  writeFileSync(path2, chunks.join(""));
  return path2;
}
function providerCommand(provider, cwd, prompt) {
  const quotedCwd = shellQuote2(cwd);
  const quotedPrompt = shellQuote2(prompt);
  if (provider === "codex") return `cd ${quotedCwd} && export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH" && codex exec --full-auto ${quotedPrompt}`;
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
function stableId(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).padStart(7, "0");
}

// src/commands/peer.ts
import { execFileSync } from "child_process";
import { existsSync as existsSync5, readFileSync as readFileSync4, writeFileSync as writeFileSync2 } from "fs";
import { dirname, join as join4 } from "path";
var REGISTRY_PATH = join4(EMA_ACTIVE_BUILD, ".ema", "peers.json");
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
    { name: "workspace", ok: existsSync5(EMA_ACTIVE_BUILD), detail: EMA_ACTIVE_BUILD },
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
    const detail = execFileSync(name, args, { encoding: "utf8", timeout: 5e3 }).trim();
    return { name, ok: true, detail };
  } catch (err) {
    return { name, ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}
function loadPeers() {
  if (!existsSync5(REGISTRY_PATH)) return [];
  try {
    const parsed = JSON.parse(readFileSync4(REGISTRY_PATH, "utf8"));
    return Array.isArray(parsed.peers) ? parsed.peers : [];
  } catch {
    return [];
  }
}
function savePeers(peers) {
  if (!existsSync5(dirname(REGISTRY_PATH))) execFileSync("mkdir", ["-p", dirname(REGISTRY_PATH)]);
  writeFileSync2(REGISTRY_PATH, `${JSON.stringify({ peers }, null, 2)}
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
  const status = flagString(args, "status");
  try {
    const lanes = await readLanes();
    const gaps = lanes.filter((l) => l.title.startsWith(W4_PREFIX));
    const filtered = gaps.filter((l) => {
      if (alley && alleyOf(l.title) !== alley.toUpperCase()) return false;
      if (status && l.status !== status) return false;
      return true;
    });
    if (json) {
      emitJson({
        ok: true,
        source: "lane.registry",
        filter: { alley: alley ?? null, status: status ?? null },
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
    emitPretty(`${filtered.length} of ${gaps.length} (filtered: alley=${alley ?? "*"} status=${status ?? "*"})`);
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
function emoji(status) {
  if (status === "ok") return "+";
  if (status === "partial") return "~";
  return "!";
}
async function runDoctor2(args) {
  if (flagBool(args, "help") || args.flags.h === true || args.positional[0] === "help") {
    return runStubContract(args, {
      noun: "doctor",
      status: "available",
      usage: "Usage: ema doctor [--json]",
      docRef: "docs/cli/agent-workspace.md",
      commands: [
        { verb: "run", flags: ["json"], summary: "Check daemon projections, Blueprint, workspace, gaps, and subsystem readiness." }
      ]
    });
  }
  const json = flagBool(args, "json");
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
    const subsystemStatuses = subsystems.map((s) => s.status);
    const overallOk = subsystemStatuses.filter((s) => s === "missing").length === 0 && phase !== null;
    const report = {
      ok: overallOk,
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
      subsystems
    };
    if (json) {
      emitJson(report);
      return overallOk ? 0 : 1;
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
    emitPretty(`overall:          ${overallOk ? "ok" : "needs attention"}`);
    return overallOk ? 0 : 1;
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
  const projection = await readProjection(args, {
    name: "desktop.presence",
    pick: (data) => data
  });
  const payload = projection ?? {};
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
  const script = "tooling/recovery/desktop-recovery-scan.mjs";
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
      cwd: process.cwd(),
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
import { join as join6, resolve } from "path";

// src/commands/cwt-ingest-writer.ts
import { readFile } from "fs/promises";
import { join as join5 } from "path";
var CWT_SOURCE_PREFIX = "cwt.shared_files:";
async function runCwtIngestWriter(args, root, manifest) {
  const json = flagBool(args, "json");
  const dryRun = flagBool(args, "dry-run");
  const only = onlyFilter(args);
  const snapshot = await readSnapshot(root, only);
  if (dryRun) return emitDryRun(json, root, manifest, snapshot);
  return commit(args, root, manifest, snapshot, only);
}
function emitDryRun(json, root, manifest, snapshot) {
  const result = {
    ok: true,
    source: "cwt.shared_files",
    mode: "dry_run",
    root,
    generated_at: manifest.generated_at ?? null,
    counts: manifest.counts ?? {},
    project_storage: projectStoragePolicy(),
    candidates: {
      projects: snapshot.projects.map((project) => ({
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
      lanes: snapshot.lanes.map((lane) => ({
        cwt_id: lane.id ?? null,
        title: lane.title ?? "(untitled lane)",
        status: lane.status ?? "open",
        project_id: lane.project_id ?? null,
        source_marker: lane.id ? marker(lane.id) : null
      })),
      queue_items: snapshot.queue.map((item) => ({
        cwt_id: item.id ?? null,
        title: item.title ?? "(untitled)",
        why: item.why ?? "",
        done_when: item.done_when ?? "",
        project_id: item.project_id ?? null,
        priority: item.priority ?? null,
        source: item.id ? sourceWithMarker(item.id, item.source) : item.source ?? "cwt.shared_files"
      })),
      problems: snapshot.problems.map((problem) => ({
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
    emitPretty(`lane candidates: ${snapshot.lanes.length}`);
    emitPretty(`queue candidates: ${snapshot.queue.length}`);
    emitPretty(`problem candidates: ${snapshot.problems.length}`);
  }
  return 0;
}
async function commit(args, root, manifest, snapshot, only) {
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
    const resolveProject = makeProjectResolver(snapshot.projects, daemonProjects);
    for (const lane of snapshot.lanes) {
      const result = await importLane(client, lane, resolveProject, actorId, daemonLanes);
      results.push(result);
      if (lane.id && result.daemon_id) laneMirror.set(lane.id, result.daemon_id);
      if (result.status === "imported" && result.daemon_id) {
        daemonLanes.push({ id: result.daemon_id, lane_id: result.daemon_id, scope: marker(lane.id ?? "") });
      }
    }
    for (const item of snapshot.queue) {
      const result = await importQueue(client, item, resolveProject, actorId, daemonQueue, laneMirror);
      results.push(result);
      if (result.status === "imported" && result.daemon_id) {
        daemonQueue.push({ id: result.daemon_id, queue_item_id: result.daemon_id, source: marker(item.id ?? "") });
      }
    }
    for (const problem of snapshot.problems) {
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
  const summary = summarize2(results);
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
  const index = await readJson(join5(root, "records", dir, "index.json"));
  const rows = [];
  for (const ref of index?.records ?? []) {
    const row = await readJson(join5(root, ref.path));
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
function summarize2(results) {
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
      expected: join6(root, "manifest.json"),
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
  const statePath = join6(root, manifest.local_n_sync?.current_state ?? "local-n-sync/current-state.md");
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
  return readJson2(join6(root, "manifest.json"));
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
