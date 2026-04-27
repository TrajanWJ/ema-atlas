import { emitJson, emitPretty } from "../output.js";
import type { ParsedArgs } from "../args.js";
import { flagBool } from "../args.js";

export interface CommandInfo {
  name: string;
  summary: string;
}

export const COMMANDS: CommandInfo[] = [
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
  { name: "help", summary: "Show this help." },
];

const GLOBAL_FLAGS: Array<{ flag: string; summary: string }> = [
  { flag: "--json", summary: "Emit NDJSON instead of pretty text." },
];

export async function runHelp(args: ParsedArgs): Promise<number> {
  if (flagBool(args, "json")) {
    emitJson({ commands: COMMANDS, global_flags: GLOBAL_FLAGS });
    return 0;
  }
  emitPretty("ema — EMA 0.0.5 CLI (wave 1)");
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
