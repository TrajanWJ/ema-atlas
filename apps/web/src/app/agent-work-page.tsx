import { MOCK_PROJECTION_LABEL, agentWork, eventTrail } from "./mock-projections";

export function AgentWorkPage() {
  return (
    <section className="ema-vapp ema-vapp--agent-work">
      <header className="ema-vapp__header ema-vapp__header--split">
        <div>
          <p className="ema-kicker">See Agent Work</p>
          <h1>Agent lane visibility</h1>
          <p className="ema-vapp__tagline">
            A projection-only view of who owns which lane, what was touched,
            and what remains explicitly outside this web task.
          </p>
        </div>
        <span className="ema-pill ema-pill--hot">{MOCK_PROJECTION_LABEL}</span>
      </header>

      <div className="ema-work-grid">
        {agentWork.map((lane) => (
          <article key={lane.lane} className="ema-work-card">
            <p>{lane.owner}</p>
            <h2>{lane.lane}</h2>
            <span>{lane.status}</span>
            <strong>{lane.output}</strong>
          </article>
        ))}
      </div>

      <section className="ema-panel">
        <div className="ema-panel__heading">
          <div>
            <p className="ema-kicker">audit shape</p>
            <h2>Recent projection events</h2>
          </div>
        </div>
        <ol className="ema-event-trail ema-event-trail--roomy">
          {eventTrail.map((event) => (
            <li key={`${event.time}-${event.surface}`}>
              <time>{event.time}</time>
              <strong>{event.actor}</strong>
              <span>{event.action}</span>
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}
