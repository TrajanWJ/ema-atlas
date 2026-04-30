import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitJson, emitPretty } from "../output.js";
import { loadRecentWorkspaceTrail } from "../workspace-trail.js";
import { DEFAULT_ACTOR } from "./workspace-daemon.js";
import { runStubContract } from "./stub-contract.js";

export async function runNext(args: ParsedArgs): Promise<number> {
  if (flagBool(args, "help") || args.flags.h === true || args.positional[0] === "help") {
    return runStubContract(args, {
      noun: "next",
      status: "available",
      usage: "Usage: ema next [--actor actor:<id>] [--json]",
      docRef: "docs/cli/agent-workspace.md",
      commands: [
        { verb: "recommend", flags: ["actor", "json"], summary: "Recommend the next lane, queue item, or orientation command." },
      ],
    });
  }
  const json = flagBool(args, "json");
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR;
  const daemonRecent = await loadRecentWorkspaceTrail(args);
  const activeLane = daemonRecent.lanes.find(
    (lane) => lane.actor_id === actor && lane.status !== "done",
  ) ?? null;
  const recommendedLane = activeLane ?? daemonRecent.lanes.find(
    (lane) => (lane.status === "ready" || lane.status === "idea") && !lane.actor_id,
  ) ?? null;
  const readyQueueItem = daemonRecent.queue.find((item) => item.status === "ready") ?? null;
  const phase = currentPhase();
  const nextCommand = activeLane
    ? `ema lane show --lane ${activeLane.id} --json`
    : recommendedLane
      ? `ema lane claim --lane ${recommendedLane.id} --actor ${actor} --scope "<scope>" --goal "<goal>" --next "<next>" --json`
      : readyQueueItem
        ? `ema queue show --queue-item ${readyQueueItem.id} --json`
        : "ema agent orient --json";

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
    next_command: nextCommand,
  };

  if (json) emitJson(payload);
  else {
    emitPretty(`phase: ${phase}`);
    emitPretty(`next: ${nextCommand}`);
  }
  return 0;
}

function currentPhase(now = new Date()): string {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < 9 * 60) return "intake and orientation";
  if (minutes < 11 * 60) return "planning and lane claim";
  if (minutes < 16 * 60) return "execution block";
  if (minutes < 18 * 60) return "review and checkup";
  return "handoff and next-day queue";
}
