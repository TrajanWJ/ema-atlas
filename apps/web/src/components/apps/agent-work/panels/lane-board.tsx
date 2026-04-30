// RIP: codebase-agent-os-bridge mission/handoff/proposal state transitions
//      (adapt — idea→ready→active→review→blocked→done columns, donor vocab)
// Region 3 of See Agent Work first screen per SURFACE-SLICE-A.md §"Region 3".
import type { AgentWorkspacePanelProps } from "./component-types";
import { sourcePillClass } from "./component-types";
import { ActorAvatar } from "./actor-avatar";

const COLUMNS = ["idea", "ready", "active", "review", "blocked", "done"] as const;
type ColumnStatus = (typeof COLUMNS)[number];

export function LaneBoard({ projection, sourceLabel, isLive }: AgentWorkspacePanelProps) {
  const { lanes, actors } = projection;
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
        <span className={sourcePillClass(isLive)}>{sourceLabel}</span>
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
                const ownerLabel = owner?.display_name ?? lane.owner_actor_id ?? "unassigned";
                const laneDetails = lane as typeof lane & {
                  scope?: string | null;
                  goal?: string | null;
                  next?: string | null;
                  blocker?: string | null;
                  done_when?: string | null;
                  updated_at?: string | null;
                };
                return (
                  <li
                    key={lane.id}
                    className="ema-saw-lane-card"
                    data-owner-kind={owner?.kind ?? "unassigned"}
                    data-status={lane.status}
                    tabIndex={0}
                  >
                    <header className="ema-saw-lane-card__head">
                      <ActorAvatar actor={owner} size={26} />
                      <div className="ema-saw-lane-card__owner">
                        <span className="ema-saw-lane-card__name">
                          {ownerLabel}
                        </span>
                        <span className="ema-kicker">
                          {owner ? owner.role : "awaiting owner"}
                        </span>
                      </div>
                    </header>
                    <strong>{lane.title}</strong>
                    {laneDetails.scope && <p>{laneDetails.scope}</p>}
                    {laneDetails.goal && <p>{laneDetails.goal}</p>}
                    {laneDetails.next && <p>next: {laneDetails.next}</p>}
                    {laneDetails.blocker && <p>blocked: {laneDetails.blocker}</p>}
                    {laneDetails.done_when && <p>done when: {laneDetails.done_when}</p>}
                    {laneDetails.updated_at && <p className="ema-kicker">updated {laneDetails.updated_at}</p>}
                    <code className="ema-saw-cli">{lane.cli}</code>
                    <footer>
                      <span className="ema-pill">daemon-backed</span>
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
