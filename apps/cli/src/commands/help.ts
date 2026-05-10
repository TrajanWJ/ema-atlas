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
  emitPretty(
    "Orientation: ema ping --json; ema status --json; ema tl about --summary --json; ema vcalendar tick --json; ema doctor --json; add --project <name-or-id> when the task names a project.",
  );
  emitPretty("Full command grammar: docs/cli/agent-workspace.md and docs/cli/see-agent-work.md");
  return 0;
}
