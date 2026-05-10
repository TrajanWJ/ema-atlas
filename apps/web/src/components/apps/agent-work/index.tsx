"use client";

import { useEffect, useState } from "react";

import {
  AgentInstructionPanel,
  AgentRoster,
  ChronicleStrip,
  CommandPanel,
  LaneBoard,
  MissionRail,
  ProblemGraphPanel,
  QueuePanel,
  TopSwarmPulse,
  VcalendarStrip,
} from "./panels";
import type { VcalendarTickView } from "./panels/component-types";
import { useAgentWorkspaceProjection } from "./projection";
import "./agent-work.css";

export function SeeAgentWorkVApp() {
  const { projection, eventTrail, sourceLabel, isLive } = useAgentWorkspaceProjection();
  const tick = useVcalendarTick();
  const swarmName = projection.swarms[0]?.name ?? "EMA 0.0.6 readiness swarm";

  return (
    <section className="ema-vapp ema-vapp--agent-work ema-saw-root" data-app="agent-work">
      <header className="ema-vapp__header ema-vapp__header--split ema-saw-header">
        <div>
          <p className="ema-kicker">Agent Workspace</p>
          <h1>Workspace, calendar, and queue</h1>
          <p className="ema-vapp__tagline">
            Live human view over the agent workspace: campaigns, missions,
            lanes, handoffs, queue, recursive problems, and vCalendar blocks.
            The daemon owns truth; this vApp renders projections and exposes
            CLI parity for agent use.
          </p>
          <p className="ema-saw-header__meta">
            <code>{swarmName}</code> · {projection.missions.length} missions ·{" "}
            {projection.lanes.length} lanes · {projection.queue_items.length} queue items ·{" "}
            {projection.problems.length} problems
          </p>
        </div>
        <aside className="ema-saw-header__notice" aria-label="projection notice">
          <span className={isLive ? "ema-pill" : "ema-pill ema-pill--hot"}>{sourceLabel}</span>
          <strong>Daemon owns workspace information.</strong>
          <p>
            GUI regions render projection state. Controls expose matching CLI
            commands; lane and queue lifecycle actions are daemon-backed while
            unreleased writers remain explicitly marked.
          </p>
        </aside>
      </header>

      <TopSwarmPulse projection={projection} sourceLabel={sourceLabel} isLive={isLive} tick={tick} />
      <MissionRail projection={projection} sourceLabel={sourceLabel} isLive={isLive} tick={tick} />
      <LaneBoard projection={projection} sourceLabel={sourceLabel} isLive={isLive} tick={tick} />

      <div className="ema-saw-row ema-saw-row--queue-graph">
        <QueuePanel projection={projection} sourceLabel={sourceLabel} isLive={isLive} tick={tick} />
        <ProblemGraphPanel projection={projection} sourceLabel={sourceLabel} isLive={isLive} tick={tick} />
      </div>

      <div className="ema-saw-row ema-saw-row--vcal-roster">
        <VcalendarStrip projection={projection} sourceLabel={sourceLabel} isLive={isLive} tick={tick} />
        <AgentRoster projection={projection} sourceLabel={sourceLabel} isLive={isLive} tick={tick} />
      </div>

      <div className="ema-saw-row ema-saw-row--command-prompt">
        <CommandPanel projection={projection} sourceLabel={sourceLabel} isLive={isLive} tick={tick} />
        <AgentInstructionPanel projection={projection} sourceLabel={sourceLabel} />
      </div>

      <ChronicleStrip
        projection={projection}
        eventTrail={eventTrail}
        sourceLabel={sourceLabel}
        isLive={isLive}
        tick={tick}
      />
    </section>
  );
}

export function AgentWorkApp() {
  return <SeeAgentWorkVApp />;
}

export default AgentWorkApp;

function useVcalendarTick(): VcalendarTickView {
  const [tick, setTick] = useState(() => computeTick());

  useEffect(() => {
    const id = window.setInterval(() => setTick(computeTick()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  return tick;
}

function computeTick(now = new Date()): VcalendarTickView {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const phase = phaseFor(minutes);
  return {
    ...phase,
    nextTick: nextBoundary(now, minutes).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function phaseFor(minutes: number): Omit<VcalendarTickView, "nextTick"> {
  if (minutes < 9 * 60) {
    return {
      phase: "intake and orientation",
      mode: "planning",
      instructions: ["orient", "inspect workspace", "pick lane"],
    };
  }
  if (minutes < 11 * 60) {
    return {
      phase: "planning and lane claim",
      mode: "planning",
      instructions: ["define scope", "name dependencies", "schedule checkup"],
    };
  }
  if (minutes < 16 * 60) {
    return {
      phase: "execution block",
      mode: "execution",
      instructions: ["stay in lane", "queue later work", "verify before review"],
    };
  }
  if (minutes < 18 * 60) {
    return {
      phase: "review and checkup",
      mode: "review",
      instructions: ["run checks", "update queue", "graph blockers"],
    };
  }
  return {
    phase: "handoff and next-day queue",
    mode: "handoff",
    instructions: ["handoff partials", "close loop", "set next block"],
  };
}

function nextBoundary(now: Date, minutes: number): Date {
  const boundaries = [9 * 60, 11 * 60, 16 * 60, 18 * 60, 24 * 60];
  const boundary = boundaries.find((value) => value > minutes) ?? 24 * 60;
  const next = new Date(now);
  next.setHours(0, boundary, 0, 0);
  return next;
}
