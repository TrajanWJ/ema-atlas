import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { withDaemonWorkspaceRecords, workspaceSummary } from "../workspace-state.js";
import { resolveWorkspaceScope } from "../workspace-scope.js";
import { loadRecentWorkspaceTrail } from "../workspace-trail.js";
import { runStubContract } from "./stub-contract.js";
import { DEFAULT_ACTOR } from "./workspace-daemon.js";

export async function runTl(args: ParsedArgs): Promise<number> {
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
        { verb: "tick", flags: ["project", "all-projects", "summary", "json"], summary: "Show task-layer state with vCalendar tick context." },
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
    if (flagBool(args, "summary") || flagBool(args, "compact")) {
      const actor = flagString(args, "actor") ?? DEFAULT_ACTOR;
      const activeLane = daemonRecent.lanes.find(
        (lane) => lane.actor_id === actor && lane.status !== "done" && lane.status !== "closed",
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
          enforcement: summary.enforcement,
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
            queue: daemonRecent.queue.length,
          },
          lane_status: countByStatus(daemonRecent.lanes),
          queue_status: countByStatus(daemonRecent.queue),
          active_lane: activeLane,
          ready_lanes: readyLanes.slice(0, 5),
          ready_queue: readyQueue.slice(0, 10),
          blocked_queue_count: blockedQueue.length,
        },
      });
      return 0;
    }
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

function countByStatus(records: readonly { status: string }[]): Record<string, number> {
  return records.reduce<Record<string, number>>((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1;
    return counts;
  }, {});
}
