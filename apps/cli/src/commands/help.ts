import { emitJson, emitPretty } from "../output.js";
import type { ParsedArgs } from "../args.js";
import { flagBool } from "../args.js";

export interface CommandInfo {
  name: string;
  summary: string;
}

export const COMMANDS: CommandInfo[] = [
  { name: "ping", summary: "Handshake with the daemon and print round-trip ms." },
  { name: "status", summary: "Print home-current topbar selection plus resolved workspace scope." },
  { name: "org create", summary: "Create an organization and its same-name default space." },
  { name: "space create", summary: "Create a space inside an organization." },
  { name: "project create", summary: "Create a project inside an organization space." },
  { name: "tl about", summary: "Show daemon-backed lane/queue records, fallback workspace records, and current vCalendar phase." },
  { name: "/tl about", summary: "Alias for `ema tl about`; matches slash-command muscle memory." },
  { name: "agent orient", summary: "Print the enforced agent orientation checklist and workspace summary." },
  { name: "next", summary: "Recommend the next lane, queue item, or orientation command." },
  { name: "campaign create/list/show", summary: "Manage long-running initiatives. (pending daemon writer)" },
  { name: "mission create/list/show", summary: "Manage mission bundles under campaigns. (pending daemon writer)" },
  { name: "lane open/list", summary: "Open and list daemon-backed lane ownership records." },
  { name: "lane claim/block/show", summary: "Claim, block, inspect, and close lanes." },
  { name: "queue add/list", summary: "Add and list daemon-backed follow-up work with dependencies." },
  { name: "queue show/ready/block/close", summary: "Inspect and move queue items through lifecycle states." },
  { name: "handoff request/list", summary: "Record transfer contracts between actors. (pending daemon writer)" },
  { name: "problem log/solution/link", summary: "Graph recursive problems, solutions, and dependencies. (pending daemon writer)" },
  { name: "blueprint status/list", summary: "Show current Blueprint daemon state and explicit projection/writer gaps." },
  { name: "wiki search/get/list", summary: "Search and read the project atlas/QMD second-brain layer." },
  { name: "hermes orient/plan/sweep", summary: "Preview the future Hermes orchestrator packet and plan shape. (projection seed)" },
  { name: "harness providers/donors/dispatch", summary: "Prepare Chronicle + Duct Tape Harness Glue rails. (simulated provider ready)" },
  { name: "peer add/doctor/tunnel", summary: "Manage trusted-dev peer rails. (local registry first, SSH first)" },
  { name: "desktop presence", summary: "Show, join, and publish shared vDesktop presence." },
  { name: "recovery scan", summary: "Read-only desktop-wide donor, worktree, stale-lane, and lost-work scan." },
  { name: "cwt status/ingest", summary: "Inspect current-work-tracker shared-files projection and dry-run EMA promotion." },
  { name: "events tail", summary: "Stream daemon events line-by-line (Ctrl-C to quit)." },
  { name: "swarm list", summary: "List swarms for a project. (wave 1: stubbed)" },
  { name: "swarm show", summary: "Show a single swarm. (wave 1: stubbed)" },
  { name: "vcalendar show", summary: "Show an actor's calendar (filtered from the recent event_trail)." },
  { name: "vcalendar week", summary: "Show this week's vcalendar events (filtered from the recent event_trail)." },
  { name: "vcalendar tick", summary: "Compute the current self-controlled planning/execution/review phase." },
  { name: "vcalendar block add", summary: "Append a calendar_block for an actor (kind + label, optional start/end)." },
  { name: "vcalendar block move", summary: "Move a calendar_block to a new start (optional end)." },
  { name: "vcalendar phase set", summary: "Set the current weekly phase label for an actor." },
  { name: "checkup schedule", summary: "Schedule a cadence-based checkup on a lane." },
  { name: "checkup complete", summary: "Mark a checkup complete with a result." },
  { name: "doctor", summary: "Run a daemon/workspace cohesion diagnostic and report drift." },
  { name: "help", summary: "Show this help." },
];

const GLOBAL_FLAGS: Array<{ flag: string; summary: string }> = [
  { flag: "--json", summary: "Emit NDJSON instead of pretty text." },
  { flag: "--help", summary: "Show command or command-group help." },
];

export async function runHelp(args: ParsedArgs): Promise<number> {
  if (flagBool(args, "json")) {
    emitJson({ commands: COMMANDS, global_flags: GLOBAL_FLAGS });
    return 0;
  }
  emitPretty("ema — EMA 0.0.6 CLI");
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
