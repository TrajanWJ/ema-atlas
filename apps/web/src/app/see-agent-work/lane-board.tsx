// RIP: codebase-agent-os-bridge mission/handoff/proposal state transitions
//      (adapt — idea→ready→active→review→blocked→done columns, donor vocab)
// Region 3 of See Agent Work first screen per SURFACE-SLICE-A.md §"Region 3".
import { MOCK_PROJECTION_LABEL, seeAgentWorkProjection } from "../mock-projections";

const COLUMNS = ["idea", "ready", "active", "review", "blocked", "done"] as const;
type ColumnStatus = (typeof COLUMNS)[number];

export function LaneBoard() {
  const { lanes, actors } = seeAgentWorkProjection;
  const ownerOf = (actorId: string | undefined) =>
    actorId ? actors.find((a) => a.id === actorId) : undefined;

  const bucketed: Record<ColumnStatus, typeof lanes> = {
    idea: [],
    ready: [],
    active: [],
    review: [],
    blocked: [],
    done: [],
  };
  for (const lane of lanes) {
    const col = (COLUMNS as readonly string[]).includes(lane.status)
      ? (lane.status as ColumnStatus)
      : "active";
    bucketed[col].push(lane);
  }

  return (
    <section className="ema-panel ema-panel--wide ema-saw-region ema-saw-lane-board" aria-label="Lane board">
      <div className="ema-panel__heading">
        <div>
          <p className="ema-kicker">lane board</p>
          <h2>Lanes by state</h2>
        </div>
        <span className="ema-pill ema-pill--hot">{MOCK_PROJECTION_LABEL}</span>
      </div>
      <div className="ema-saw-lane-board__grid">
        {COLUMNS.map((col) => (
          <div key={col} className="ema-saw-lane-column" data-column={col}>
            <header className="ema-saw-lane-column__heading">
              <span className="ema-kicker">{col}</span>
              <strong>{bucketed[col].length}</strong>
            </header>
            <ol className="ema-saw-lane-column__list">
              {bucketed[col].length === 0 && (
                <li className="ema-saw-lane-column__empty">
                  no lanes in this column
                </li>
              )}
              {bucketed[col].map((lane) => {
                const owner = ownerOf(lane.owner_actor_id);
                return (
                  <li key={lane.id} className="ema-saw-lane-card">
                    <p className="ema-kicker">
                      {owner ? `${owner.kind} · ${owner.display_name}` : "unassigned"}
                    </p>
                    <strong>{lane.title}</strong>
                    <code className="ema-saw-cli">{lane.cli}</code>
                    <footer>
                      <span className="ema-pill ema-pill--hot">pending daemon writer</span>
                    </footer>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
