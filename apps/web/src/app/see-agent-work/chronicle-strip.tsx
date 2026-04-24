// RIP: lineage-original-elixir-ema @max_events 200 → CHRONICLE_MAX
// RIP: codebase-agent-os-v8 framed WS client UX (visual command vs event)
// Region 8 of See Agent Work first screen per SURFACE-SLICE-A.md §"Region 8".
import { useProjection } from "../../lib/ipc";
import {
  CHRONICLE_MAX,
  MOCK_PROJECTION_LABEL,
  seeAgentWorkProjection,
} from "../mock-projections";

type RecentEvent = {
  ts: string;
  actor: string;
  kind: string;
  summary: string;
};

type EventTrailProjection = {
  events: Array<{ id: string; kind: string; label: string; ts: string }>;
};

export function ChronicleStrip() {
  const real = useProjection<EventTrailProjection>("event_trail");
  const mock: RecentEvent[] = seeAgentWorkProjection.recent_events;
  const feed: RecentEvent[] = real
    ? real.events.slice(-CHRONICLE_MAX).reverse().map((e) => ({
        ts: e.ts.slice(11, 16) || e.ts,
        actor: "daemon",
        kind: e.kind,
        summary: e.label,
      }))
    : mock.slice(0, CHRONICLE_MAX);
  const isLive = real != null;

  return (
    <section className="ema-panel ema-saw-region ema-saw-chronicle" aria-label="Chronicle strip">
      <div className="ema-panel__heading">
        <div>
          <p className="ema-kicker">chronicle strip</p>
          <h2>{isLive ? "Daemon event trail" : "Local projection trail"}</h2>
        </div>
        <span className={isLive ? "ema-pill" : "ema-pill ema-pill--hot"}>
          {isLive ? "live" : MOCK_PROJECTION_LABEL}
        </span>
      </div>
      <ol className="ema-saw-chronicle__list" aria-label={`Recent events, capped at ${CHRONICLE_MAX}`}>
        {feed.map((event, idx) => (
          <li
            key={`${event.ts}-${idx}`}
            className="ema-saw-chronicle__item"
            data-frame={frameBucket(event.kind)}
          >
            <time>{event.ts}</time>
            <span className="ema-saw-chronicle__actor">{event.actor}</span>
            <span className="ema-saw-chronicle__kind">{event.kind}</span>
            <span className="ema-saw-chronicle__summary">{event.summary}</span>
          </li>
        ))}
      </ol>
      <footer className="ema-saw-chronicle__footer">
        <small>
          bounded buffer · cap CHRONICLE_MAX = {CHRONICLE_MAX}
          {" · "}
          donor lineage-original-elixir-ema
        </small>
      </footer>
    </section>
  );
}

function frameBucket(kind: string): "command" | "event" | "projection" | "other" {
  if (kind.includes("command")) return "command";
  if (kind === "projection" || kind.startsWith("projection")) return "projection";
  if (kind === "event" || kind.includes(".")) return "event";
  return "other";
}
