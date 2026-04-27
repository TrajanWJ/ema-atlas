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
function emitJson(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}
function emitPretty(line) {
  process.stdout.write(line + "\n");
}
function emitError(msg) {
  process.stderr.write(msg + "\n");
}

// src/commands/help.ts
var COMMANDS = [
  { name: "ping", summary: "Handshake with the daemon and print round-trip ms." },
  { name: "status", summary: "Print the current org / space / project from the topbar projection." },
  { name: "org create", summary: "Create an organization and its same-name default space." },
  { name: "project create", summary: "Create a project inside an organization space." },
  { name: "events tail", summary: "Stream daemon events line-by-line (Ctrl-C to quit)." },
  { name: "swarm list", summary: "List swarms for a project. (wave 1: stubbed)" },
  { name: "swarm show", summary: "Show a single swarm. (wave 1: stubbed)" },
  { name: "vcalendar show", summary: "Show an actor's calendar (filtered from the recent event_trail)." },
  { name: "vcalendar week", summary: "Show this week's vcalendar events (filtered from the recent event_trail)." },
  { name: "vcalendar block add", summary: "Append a calendar_block for an actor (kind + label, optional start/end)." },
  { name: "vcalendar block move", summary: "Move a calendar_block to a new start (optional end)." },
  { name: "vcalendar phase set", summary: "Set the current weekly phase label for an actor." },
  { name: "checkup schedule", summary: "Schedule a cadence-based checkup on a lane." },
  { name: "checkup complete", summary: "Mark a checkup complete with a result." },
  { name: "help", summary: "Show this help." }
];
var GLOBAL_FLAGS = [
  { flag: "--json", summary: "Emit NDJSON instead of pretty text." }
];
async function runHelp(args) {
  if (flagBool(args, "json")) {
    emitJson({ commands: COMMANDS, global_flags: GLOBAL_FLAGS });
    return 0;
  }
  emitPretty("ema \u2014 EMA 0.0.5 CLI (wave 1)");
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
  emitPretty("Full command grammar: docs/cli/see-agent-work.md");
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
    return new Promise((resolve, reject) => {
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
        resolve();
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
    return new Promise((resolve, reject) => {
      const id = nextId();
      const timer = setTimeout(() => {
        reject(new ProtocolError("hello timed out"));
      }, HELLO_TIMEOUT_MS);
      const handler = (msg) => {
        if (msg.type === "hello" && msg.id === id) {
          clearTimeout(timer);
          this.handlers = this.handlers.filter((h) => h !== handler);
          this.hello = msg;
          resolve(msg);
        } else if (msg.type === "hello") {
          clearTimeout(timer);
          this.handlers = this.handlers.filter((h) => h !== handler);
          this.hello = msg;
          resolve(msg);
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
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new ProtocolError("socket not open"));
        return;
      }
      const id = nextId();
      const timer = setTimeout(() => {
        this.pendingCommands.delete(id);
        reject(new ProtocolError(`command ${op} timed out`));
      }, COMMAND_TIMEOUT_MS);
      this.pendingCommands.set(id, { resolve, reject, timer });
      this.sendRaw({ v: 0, id, type: "command", op, args });
    });
  }
  /** Send ping, resolve with RTT ms. */
  ping() {
    return new Promise((resolve, reject) => {
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
      this.pendingPings.set(id, { sentAt, resolve, reject, timer });
      this.sendRaw({ v: 0, id, type: "ping" });
    });
  }
  subscribe(channel) {
    this.droppedChannels.delete(channel);
    this.sendRaw({ v: 0, id: nextId(), type: "subscribe", channel });
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

// src/commands/ping.ts
async function runPing(args) {
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

// src/commands/status.ts
var PROJECTION_TIMEOUT_MS = 5e3;
async function runStatus(args) {
  const json = flagBool(args, "json");
  try {
    const c = await connect({ surface: "desktop" });
    const data = await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("timed out waiting for topbar projection")),
        PROJECTION_TIMEOUT_MS
      );
      c.onMessage((msg) => {
        if (msg.type === "projection" && msg.name === "topbar") {
          clearTimeout(timer);
          resolve(msg.data);
        }
      });
      const userId = c.hello?.accepted_device_id ?? null;
      if (userId) c.subscribe(`user.${userId}.orgs`);
    });
    if (json) {
      emitJson({
        ok: true,
        org: data.current_org ?? null,
        space: data.current_space ?? null,
        project: data.current_project ?? null,
        node_state: data.node_state ?? null
      });
    } else {
      emitPretty(`org:     ${fmt(data.current_org)}`);
      emitPretty(`space:   ${fmt(data.current_space)}`);
      emitPretty(`project: ${fmt(data.current_project)}`);
      if (data.node_state) emitPretty(`node:    ${data.node_state}`);
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
  if (sub !== "tail") {
    emitError(`ema events: unknown subcommand "${sub ?? ""}" (expected: tail)`);
    return 64;
  }
  const json = flagBool(args, "json");
  const family = flagString(args, "family");
  const since = flagString(args, "since");
  try {
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
    await new Promise((resolve) => {
      const shutdown = () => {
        c.close();
        resolve();
      };
      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
    });
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}

// src/commands/swarm.ts
var DOC_REF = "docs/cli/see-agent-work.md";
async function runSwarm(args) {
  const sub = args.positional[0];
  const json = flagBool(args, "json");
  switch (sub) {
    case "list":
      return stub("swarm list", { project: flagString(args, "project") ?? null }, json);
    case "show":
      return stub("swarm show", { swarm: flagString(args, "swarm") ?? null }, json);
    case "start":
    case "pause":
    case "stop":
    case "status":
    case "report":
      return stub(`swarm ${sub}`, { swarm: flagString(args, "swarm") ?? null }, json);
    default:
      emitError(
        `ema swarm: unknown subcommand "${sub ?? ""}" (expected: list | show | start | pause | stop | status | report)`
      );
      emitError(`See ${DOC_REF} for the full grammar.`);
      return 64;
  }
}
function stub(name, args, json) {
  const note = `not yet implemented; command grammar defined in ${DOC_REF}`;
  if (json) {
    emitJson({ ok: true, command: name, args, note });
  } else {
    emitPretty(`ema ${name}: ${note}`);
    for (const [k, v] of Object.entries(args)) {
      if (v !== null && v !== void 0) emitPretty(`  --${k} ${String(v)}`);
    }
  }
  return 0;
}

// src/commands/org.ts
async function runOrg(args) {
  const sub = args.positional[0];
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

// src/commands/project.ts
async function runProject(args) {
  const sub = args.positional[0];
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
var DEFAULT_ORG = "org:01J00000000000000000000001";
var DEFAULT_ACTOR = "actor:dev-console";
async function runVcalendar(args) {
  const sub = args.positional[0];
  switch (sub) {
    case "show":
      return runShow(args);
    case "week":
      return runWeek(args);
    case "block":
      return runBlock(args);
    case "phase":
      return runPhase(args);
    default:
      emitError(
        `ema vcalendar: unknown subcommand "${sub ?? ""}" (expected: show | week | block | phase)`
      );
      emitError(`See docs/cli/see-agent-work.md \xA7vCalendar for grammar.`);
      return 64;
  }
}
async function runBlock(args) {
  const verb = args.positional[1];
  const json = flagBool(args, "json");
  const org = flagString(args, "org") ?? DEFAULT_ORG;
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR;
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
  const org = flagString(args, "org") ?? DEFAULT_ORG;
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR;
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
async function runReadQuery(_args, json, opts) {
  try {
    const c = await connect({ surface: "desktop" });
    const eventTrailRows = await new Promise((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve([]);
        }
      }, 1200);
      c.onMessage((msg) => {
        if (msg.type === "projection" && msg.name === "event_trail") {
          const data = msg.data;
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(data.events ?? []);
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
var DEFAULT_ORG2 = "org:01J00000000000000000000001";
var DEFAULT_ACTOR2 = "actor:dev-console";
async function runCheckup(args) {
  const sub = args.positional[0];
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
  const org = flagString(args, "org") ?? DEFAULT_ORG2;
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR2;
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
  const org = flagString(args, "org") ?? DEFAULT_ORG2;
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR2;
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
    case "project":
      return runProject(args);
    case "swarm":
      return runSwarm(args);
    case "vcalendar":
      return runVcalendar(args);
    case "checkup":
      return runCheckup(args);
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
