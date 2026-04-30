import type {
  LaneRegistryProjection,
  QueueRegistryProjection,
  SeeAgentWorkProjection as DaemonSeeAgentWorkProjection,
} from "@ema/surface-core/adapter";
import { useMemo } from "react";

import {
  MOCK_PROJECTION_LABEL,
  seeAgentWorkProjection,
} from "@/src/app/mock-projections";
import { useProjection } from "@/src/lib/ipc";

export type AgentWorkspaceProjection = typeof seeAgentWorkProjection;
export type AgentWorkspaceSource = "daemon projection" | typeof MOCK_PROJECTION_LABEL;

export type EventTrailProjection = {
  events: Array<{ id: string; kind: string; label: string; ts: string }>;
};

export type AgentWorkspaceView = {
  projection: AgentWorkspaceProjection;
  eventTrail: EventTrailProjection | null;
  sourceLabel: AgentWorkspaceSource;
  isLive: boolean;
};

export function useAgentWorkspaceProjection(): AgentWorkspaceView {
  const daemonProjection = useProjection<DaemonSeeAgentWorkProjection>(
    "see_agent_work.project_pulse",
  );
  const laneRegistry = useProjection<LaneRegistryProjection>("lane.registry");
  const queueRegistry = useProjection<QueueRegistryProjection>("queue.registry");
  const eventTrail = useProjection<EventTrailProjection>("event_trail");

  return useMemo(() => {
    if (!daemonProjection && !laneRegistry && !queueRegistry) {
      return {
        projection: seeAgentWorkProjection,
        eventTrail,
        sourceLabel: MOCK_PROJECTION_LABEL,
        isLive: false,
      };
    }

    return {
      projection: adaptDaemonProjection(daemonProjection, laneRegistry, queueRegistry),
      eventTrail,
      sourceLabel: "daemon projection",
      isLive: true,
    };
  }, [daemonProjection, eventTrail, laneRegistry, queueRegistry]);
}

function adaptDaemonProjection(
  daemonProjection: DaemonSeeAgentWorkProjection | null,
  laneRegistry: LaneRegistryProjection | null,
  queueRegistry: QueueRegistryProjection | null,
): AgentWorkspaceProjection {
  const base = seeAgentWorkProjection;
  const registryLanes = laneRegistry?.lanes ?? [];
  const registryQueue = queueRegistry?.queue_items ?? [];
  const adaptedLanes = registryLanes.length
    ? registryLanes.map((lane) => ({
        id: lane.id,
        title: lane.title || lane.name || lane.id,
        mission_id: lane.mission_id || base.missions[0]?.id || "mission:daemon-projection",
        owner_actor_id: lane.actor_id || undefined,
        status: laneStatusToBoardStatus(lane.status),
        cli: `ema lane show --lane ${lane.id} --json`,
        scope: lane.scope,
        claim_scope: lane.claim_scope,
        goal: lane.goal,
        next: lane.next,
        blocker: lane.blocker || lane.blocked_reason,
        done_when: lane.done_when,
        updated_at: lane.updated_at,
      }))
    : daemonProjection?.lanes.length
      ? daemonProjection.lanes.map((lane) => ({
        id: lane.id,
        title: lane.name,
        mission_id:
          base.lanes.find((candidate) => candidate.id === lane.id)?.mission_id ??
          base.missions[0]?.id ??
          "mission:daemon-projection",
        owner_actor_id: undefined,
        status: laneStateToBoardStatus(lane.state),
        cli: `ema lane show --lane ${lane.id} --json`,
      }))
    : base.lanes;
  const adaptedQueue = registryQueue.length
    ? registryQueue.map((item) => ({
        id: item.id,
        title: item.title || item.id,
        status: item.status,
        source: item.source || "daemon queue.registry",
        why: item.why || item.blocked_reason || "",
        depends_on: item.depends_on ? [item.depends_on] : [],
        blocked_by: item.blocked_by,
        lane_id: item.lane_id,
        done_when: item.done_when || "",
        result: item.result,
        cli: `ema queue show --queue-item ${item.id} --json`,
      }))
    : base.queue_items;

  const adaptedHandoffs = daemonProjection?.handoffs.length
    ? daemonProjection.handoffs.map((handoff) => ({
        id: handoff.id,
        from: handoff.from_lane,
        to: handoff.to_lane,
        needed: handoff.title,
        status: handoff.state,
      }))
    : base.handoffs;

  const adaptedEvents = daemonProjection?.recent_events.length
    ? daemonProjection.recent_events.map((event) => ({
        ts: event.at.slice(11, 16) || event.at,
        actor: event.actor ?? "daemon",
        kind: event.type,
        summary: event.type,
      }))
    : base.recent_events;

  const adaptedSuggestions =
    daemonProjection && daemonProjection.cli_suggestions.length > 0
      ? daemonProjection.cli_suggestions.map((suggestion) => suggestion.cli)
      : base.cli_suggestions;

  return {
    ...base,
    project_id: daemonProjection?.project_id ?? base.project_id,
    staged: false,
    swarms: base.swarms.map((swarm) => ({ ...swarm, status: "active" })),
    lanes: adaptedLanes,
    queue_items: adaptedQueue,
    handoffs: adaptedHandoffs,
    blocked_work: adaptedLanes
      .filter((lane) => lane.status === "blocked")
      .map((lane) => lane.title),
    recent_events: adaptedEvents,
    cli_suggestions: adaptedSuggestions,
  };
}

function laneStatusToBoardStatus(status: string): AgentWorkspaceProjection["lanes"][number]["status"] {
  if (status === "idea" || status === "ready" || status === "active" || status === "review" || status === "blocked" || status === "done") {
    return status;
  }
  return "active";
}

function laneStateToBoardStatus(
  state: DaemonSeeAgentWorkProjection["lanes"][number]["state"],
): AgentWorkspaceProjection["lanes"][number]["status"] {
  if (state === "running") return "active";
  if (state === "paused") return "review";
  if (state === "blocked") return "blocked";
  return "done";
}
