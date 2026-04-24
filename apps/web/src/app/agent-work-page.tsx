// RIP: codebase-frontend-layer read-only observer posture
//      (adopt — this file never writes canon; every data source is a
//      projection or a mock, and every control is pending daemon writer)
//
// See Agent Work first screen per docs/vapps/see-agent-work.md §"First Screen"
// and SURFACE-SLICE-A.md §"Outcome". Eight regions, dense, honest mocks,
// CLI-parity, no UI-local state treated as canon.
import { MOCK_PROJECTION_LABEL, seeAgentWorkProjection } from "./mock-projections";
import {
  AgentInstructionPanel,
  AgentRoster,
  ChronicleStrip,
  CommandPanel,
  LaneBoard,
  MissionRail,
  TopSwarmPulse,
  VcalendarStrip,
} from "./see-agent-work";

export function AgentWorkPage() {
  const swarmName = seeAgentWorkProjection.swarms[0]?.name ?? "EMA 0.0.5 swarm";
  return (
    <section className="ema-vapp ema-vapp--agent-work ema-saw-root">
      <header className="ema-vapp__header ema-vapp__header--split ema-saw-header">
        <div>
          <p className="ema-kicker">See Agent Work</p>
          <h1>Swarm control room</h1>
          <p className="ema-vapp__tagline">
            Dense, operator-grade surface for coordinating external Codex,
            Claude CLI, and human founder work across missions, campaigns,
            lanes, handoffs, and vCalendar time — without pretending mocked
            controls executed real work.
          </p>
          <p className="ema-saw-header__meta">
            <code>{swarmName}</code> · {seeAgentWorkProjection.missions.length}{" "}
            missions · {seeAgentWorkProjection.lanes.length} lanes ·{" "}
            {seeAgentWorkProjection.handoffs.length} handoffs
          </p>
        </div>
        <aside className="ema-saw-header__notice" aria-label="projection notice">
          <span className="ema-pill ema-pill--hot">{MOCK_PROJECTION_LABEL}</span>
          <strong>Every region is honest about its source.</strong>
          <p>
            Live panels render from daemon projections. Mock panels carry a
            visible tag. Controls are <code>pending daemon writer</code>.
          </p>
        </aside>
      </header>

      <TopSwarmPulse />
      <MissionRail />
      <LaneBoard />

      <div className="ema-saw-row ema-saw-row--vcal-roster">
        <VcalendarStrip />
        <AgentRoster />
      </div>

      <div className="ema-saw-row ema-saw-row--command-prompt">
        <CommandPanel />
        <AgentInstructionPanel />
      </div>

      <ChronicleStrip />
    </section>
  );
}
