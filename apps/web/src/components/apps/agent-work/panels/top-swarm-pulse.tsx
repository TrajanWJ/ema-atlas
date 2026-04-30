// RIP: codebase-frontend-layer operator-dashboard pulse grid
//      (adapt — reuses existing .ema-pulse-grid instead of donor Tailwind)
// Region 1 of See Agent Work first screen per SURFACE-SLICE-A.md §"Region 1".
import type { AgentWorkspacePanelProps } from "./component-types";
import { sourcePillClass } from "./component-types";

export function TopSwarmPulse({ projection, sourceLabel, isLive }: AgentWorkspacePanelProps) {
  const { swarms, lanes, blocked_work, vcalendar } = projection;
  const activeLanes = lanes.filter((l) => l.status === "active").length;
  const nextCheckup = vcalendar.checkups_due[0];

  return (
    <section className="ema-panel ema-saw-region ema-saw-pulse" aria-label="Top swarm pulse">
      <div className="ema-panel__heading">
        <div>
          <p className="ema-kicker">top swarm pulse</p>
          <h2>Live control room</h2>
        </div>
        <span className={sourcePillClass(isLive)}>{sourceLabel}</span>
      </div>
      <div className="ema-pulse-grid ema-saw-pulse__grid">
        <article className="ema-pulse-card" data-saw-pulse="swarms">
          <span>active swarms</span>
          <strong>{swarms.length}</strong>
          <p>{swarms[0]?.name ?? "no swarm active"}</p>
        </article>
        <article className="ema-pulse-card" data-saw-pulse="lanes">
          <span>active lanes</span>
          <strong>{activeLanes}</strong>
          <p>of {lanes.length} total across all missions</p>
        </article>
        <article className="ema-pulse-card" data-saw-pulse="blocked">
          <span>blocked items</span>
          <strong>{blocked_work.length}</strong>
          <p>{blocked_work[0] ?? "no blockers"}</p>
        </article>
        <article className="ema-pulse-card" data-saw-pulse="checkup">
          <span>next checkup</span>
          <strong>{nextCheckup ? nextCheckup.label : "—"}</strong>
          <p>{nextCheckup ? nextCheckup.cadence : "no checkups scheduled"}</p>
        </article>
      </div>
    </section>
  );
}
