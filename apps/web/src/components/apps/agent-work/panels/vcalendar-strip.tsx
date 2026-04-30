// Region 4 of See Agent Work first screen per SURFACE-SLICE-A.md §"Region 4".
// Single row: weekly phase label + compact blocks list + checkups_due chips.
import type { AgentWorkspacePanelProps } from "./component-types";
import { sourcePillClass } from "./component-types";

export function VcalendarStrip({ projection, sourceLabel, isLive, tick }: AgentWorkspacePanelProps) {
  const { vcalendar, actors } = projection;
  const ownerOf = (actorId: string | undefined) =>
    actorId ? actors.find((a) => a.id === actorId) : undefined;

  return (
    <section className="ema-panel ema-saw-region ema-saw-vcal-strip" aria-label="vCalendar strip">
      <div className="ema-panel__heading">
        <div>
          <p className="ema-kicker">vcalendar strip</p>
          <h2>{vcalendar.weekly_phase}</h2>
        </div>
        <span className={sourcePillClass(isLive)}>{sourceLabel}</span>
      </div>

      {tick && (
        <article className="ema-saw-vcal-tick" data-mode={tick.mode}>
          <div>
            <p className="ema-kicker">self-controlled tick</p>
            <strong>{tick.phase}</strong>
            <small>next phase boundary {tick.nextTick}</small>
          </div>
          <code className="ema-saw-cli">ema vcalendar tick --json</code>
          <div className="ema-saw-vcal-tick__steps">
            {tick.instructions.map((instruction) => (
              <span key={instruction} className="ema-pill ema-saw-vcal-chip">
                {instruction}
              </span>
            ))}
          </div>
        </article>
      )}

      <div className="ema-saw-vcal-strip__blocks">
        {vcalendar.blocks.map((block) => {
          const owner = ownerOf(block.actor_id);
          return (
            <article key={block.id} className="ema-saw-vcal-block" data-block-kind={block.kind}>
              <p className="ema-kicker">{block.kind}</p>
              <strong>{block.label}</strong>
              <small>{owner ? `${owner.kind} · ${owner.display_name}` : "unassigned"}</small>
            </article>
          );
        })}
      </div>

      <div className="ema-saw-vcal-strip__checkups" aria-label="checkups due">
        <span className="ema-kicker">checkups due</span>
        {vcalendar.checkups_due.map((checkup) => (
          <span key={checkup.id} className="ema-pill ema-saw-vcal-chip">
            {checkup.label} · <small>{checkup.cadence}</small>
          </span>
        ))}
      </div>
    </section>
  );
}
