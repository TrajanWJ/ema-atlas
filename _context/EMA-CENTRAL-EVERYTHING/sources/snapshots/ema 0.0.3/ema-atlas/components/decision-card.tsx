import type { Decision } from "@/lib/decisions";

type DecisionCardProps = {
  decision: Decision;
};

const READINESS_LABEL: Record<Decision["readiness"], string> = {
  red: "Blocks v0.0.3",
  amber: "Watch for v0.0.3",
  green: "Deferred"
};

const STATUS_LABEL: Record<Decision["status"], string> = {
  open: "Open",
  parked: "Parked",
  resolved: "Resolved"
};

export function DecisionCard({ decision }: DecisionCardProps) {
  const { id, title, status, blastRadius, axis, readiness, whereSurfaces, variants, notes } =
    decision;
  return (
    <article className={`panel decision-card decision-card--${readiness}`}>
      <div className="decision-card__head">
        <p className="panel__tag">{id}</p>
        <span className={`decision-card__status decision-card__status--${status}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>
      <h3 className="list__title">{title}</h3>

      <div className="decision-card__axis">
        <span className="decision-card__axis-label">{axis.left}</span>
        <div className="decision-card__axis-bar">
          <span className="decision-card__axis-bar-fill" />
        </div>
        <span className="decision-card__axis-label decision-card__axis-label--right">
          {axis.right}
        </span>
      </div>

      <div className={`decision-card__readiness decision-card__readiness--${readiness}`}>
        <span className="decision-card__dot" aria-hidden />
        {READINESS_LABEL[readiness]}
      </div>

      {blastRadius ? (
        <div className="panel__stack">
          <div>
            <span className="panel__label">Blast Radius</span>
            <p>{blastRadius}</p>
          </div>
        </div>
      ) : null}

      {variants.length > 0 ? (
        <ul className="inline-list">
          {variants.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
      ) : null}

      {notes.length > 0 ? (
        <div className="panel__stack">
          {notes.map((note, i) => (
            <p key={i}>{note}</p>
          ))}
        </div>
      ) : null}

      {whereSurfaces.length > 0 ? (
        <div>
          <span className="panel__label">Where it surfaces</span>
          <ul className="inline-list">
            {whereSurfaces.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
