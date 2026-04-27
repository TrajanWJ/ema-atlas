// RIP: codebase-mission-control-claude hierarchical-roles / agent-status panel
//      (inspire — display only; enforcement lands with ema_memberships writer)
// Region 5 of See Agent Work first screen per SURFACE-SLICE-A.md §"Region 5".
import { MOCK_PROJECTION_LABEL, seeAgentWorkProjection } from "../mock-projections";
import { ActorAvatar } from "./actor-avatar";

export function AgentRoster() {
  const { actors, lanes } = seeAgentWorkProjection;

  return (
    <section className="ema-panel ema-saw-region ema-saw-roster" aria-label="Agent roster">
      <div className="ema-panel__heading">
        <div>
          <p className="ema-kicker">agent roster</p>
          <h2>Who is in the room</h2>
        </div>
        <span className="ema-pill ema-pill--hot">{MOCK_PROJECTION_LABEL}</span>
      </div>
      <div className="ema-saw-roster__grid">
        {actors.map((actor) => {
          const activeLanes = lanes.filter(
            (l) => l.owner_actor_id === actor.id && l.status === "active",
          );
          return (
            <article key={actor.id} className="ema-saw-actor-card" data-actor-kind={actor.kind}>
              <header>
                <ActorAvatar actor={actor} size={38} />
                <div>
                  <p className="ema-kicker">{actor.kind}</p>
                  <strong>{actor.display_name}</strong>
                </div>
              </header>
              <dl className="ema-saw-actor-card__meta">
                <div>
                  <dt>role</dt>
                  <dd>
                    {actor.role}
                    <span className="ema-pill ema-pill--hot ema-saw-pill-tight">
                      display only — not yet enforced
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>current lane</dt>
                  <dd>{actor.current_lane}</dd>
                </div>
                <div>
                  <dt>active lane count</dt>
                  <dd>
                    {activeLanes.length}
                    <span className="ema-pill ema-pill--hot ema-saw-pill-tight">
                      pending daemon writer
                    </span>
                  </dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}
