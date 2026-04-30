import type { ParsedArgs } from "../args.js";
import { flagBool } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { withDaemonWorkspaceRecords, workspaceSummary } from "../workspace-state.js";
import { resolveWorkspaceScope } from "../workspace-scope.js";
import { loadRecentWorkspaceTrail } from "../workspace-trail.js";
import { runStubContract } from "./stub-contract.js";

export async function runTl(args: ParsedArgs): Promise<number> {
  const sub = args.positional[0] ?? "about";
  const json = flagBool(args, "json");
  if (flagBool(args, "help") || args.flags.h === true || sub === "help") {
    return runStubContract(args, {
      noun: "tl",
      status: "available",
      docRef: "docs/cli/agent-workspace.md",
      commands: [
        { verb: "about", flags: ["project", "all-projects", "json"], summary: "Show task-layer orientation and daemon-backed workspace records." },
        { verb: "status", flags: ["project", "all-projects", "json"], summary: "Alias-style task-layer status view." },
        { verb: "tick", flags: ["project", "all-projects", "json"], summary: "Show task-layer state with vCalendar tick context." },
      ],
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
      path: `daemon://lane.registry/${lane.id}`,
    })),
    queue: daemonRecent.queue.map((item) => ({
      id: item.id,
      title: item.title,
      type: "daemon_queue_item",
      status: item.status,
      path: `daemon://queue.registry/${item.id}`,
    })),
  });

  if (json) {
    emitJson({
      ok: true,
      command: `tl ${sub}`,
      workspace: summary,
      daemon_recent: daemonRecent,
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
  emitPretty(`vCalendar: ${summary.tick.iso_week} · ${summary.tick.phase}`);
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
