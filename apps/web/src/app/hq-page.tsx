import {
  MOCK_PROJECTION_LABEL,
  agentWork,
  eventTrail,
  hqProjection,
  surfaceLinks,
} from "./mock-projections";
import { Link } from "react-router-dom";
import { useProjection } from "../lib/ipc";

type EventTrailProjection = {
  events: Array<{ id: string; kind: string; label: string; ts: string }>;
};

export function HqPage() {
  const realEventTrail = useProjection<EventTrailProjection>("event_trail");
  const trail =
    realEventTrail?.events.map((event) => ({
      time: event.ts.slice(11, 16) || event.ts,
      surface: event.kind,
      action: event.label,
    })) ?? eventTrail;
  const trailIsReal = realEventTrail != null;

  return (
    <section className="ema-hq">
      <header className="ema-hero">
        <div>
          <p className="ema-kicker">EMA 0.0.5 localhost shell</p>
          <h1>Operational control room for sovereign project surfaces.</h1>
          <p className="ema-hero__copy">
            A dense, link-forward hub for moving through HQ, Blueprint,
            git-ema, agent work, doctrine, and threads without pretending
            local projections are canon.
          </p>
        </div>
        <aside className="ema-hero__card" aria-label="Projection notice">
          <span className="ema-pill ema-pill--hot">{MOCK_PROJECTION_LABEL}</span>
          <strong>Projection mode is visible by design.</strong>
          <p>
            Controls below are mocked affordances. Canonical changes still
            require daemon-owned commands and review.
          </p>
        </aside>
      </header>

      <section className="ema-pulse-grid" aria-label="HQ pulse">
        {hqProjection.pulse.map((item) => (
          <article key={item.label} className="ema-pulse-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.detail}</p>
          </article>
        ))}
      </section>

      <div className="ema-hq__matrix">
        <section className="ema-panel ema-panel--wide">
          <div className="ema-panel__heading">
            <div>
              <p className="ema-kicker">multi-surface navigation</p>
              <h2>Surface switchboard</h2>
            </div>
            <span className="ema-pill">all localhost</span>
          </div>
          <div className="ema-surface-board">
            {surfaceLinks.map((surface) => (
              <Link
                key={surface.id}
                to={surface.path}
                className="ema-surface-card"
                data-status={surface.status}
              >
                <span>{surface.eyebrow}</span>
                <strong>{surface.label}</strong>
                <small>{surface.status}</small>
              </Link>
            ))}
          </div>
        </section>

        <section className="ema-panel">
          <div className="ema-panel__heading">
            <div>
              <p className="ema-kicker">mocked controls</p>
              <h2>Operator console</h2>
            </div>
          </div>
          <div className="ema-control-stack">
            {hqProjection.controls.map((control) => (
              <button key={control.label} className="ema-control-button">
                <span>{control.label}</span>
                <strong>{control.state}</strong>
                <small>{control.detail}</small>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="ema-hq__matrix ema-hq__matrix--lower">
        <section className="ema-panel">
          <div className="ema-panel__heading">
            <div>
              <p className="ema-kicker">link-dense hub</p>
              <h2>Reference lattice</h2>
            </div>
          </div>
          <div className="ema-link-lattice">
            {hqProjection.hubLinks.map((link) => (
              <a key={link} href={`#${link.replaceAll("/", "-")}`}>
                {link}
              </a>
            ))}
          </div>
        </section>

        <section className="ema-panel">
          <div className="ema-panel__heading">
            <div>
              <p className="ema-kicker">see agent work</p>
              <h2>Lane status</h2>
            </div>
            <Link to="/agent-work" className="ema-text-link">
              open lane
            </Link>
          </div>
          <div className="ema-lane-list">
            {agentWork.map((lane) => (
              <article key={lane.lane} className="ema-lane-row">
                <span>{lane.lane}</span>
                <strong>{lane.status}</strong>
                <p>{lane.output}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="ema-panel">
          <div className="ema-panel__heading">
            <div>
              <p className="ema-kicker">event trail</p>
              <h2>{trailIsReal ? "Daemon event trail" : "Local projection trail"}</h2>
            </div>
          </div>
          <ol className="ema-event-trail">
            {trail.map((event) => (
              <li key={`${event.time}-${event.action}`}>
                <time>{event.time}</time>
                <strong>{event.surface}</strong>
                <span>{event.action}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  );
}
