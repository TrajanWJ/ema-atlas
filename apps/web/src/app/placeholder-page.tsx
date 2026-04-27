import {
  MOCK_PROJECTION_LABEL,
  doctrineCards,
  surfaceLinks,
  threadCards,
  type SurfaceId,
} from "./mock-projections";
import { useShell } from "../shell/virtual-desktop-shell";

type PlaceholderPageProps = {
  kind: "wiki" | "threads";
};

type PlanStepState = "ready" | "staged" | "blocked";

type PlanStep = {
  label: string;
  detail: string;
  state: PlanStepState;
};

const PLAN: Record<PlaceholderPageProps["kind"], {
  tagline: string;
  steps: PlanStep[];
  related: SurfaceId[];
}> = {
  wiki: {
    tagline:
      "Durable notes + canon references collect here. Today the surface is a seed directory of doctrine cards; writers land in Wave 2.",
    steps: [
      {
        label: "Doctrine node browse",
        detail: "Read-only view over ema-atlas .qmd snapshots, scoped per project.",
        state: "staged",
      },
      {
        label: "Pin nodes into Blueprint sections",
        detail: "Attach doctrine as context on plan sections — flows through ema_attachments.",
        state: "staged",
      },
      {
        label: "Author from surface",
        detail: "Wiki edits persist through ema_blueprint writer for versioning + review.",
        state: "blocked",
      },
    ],
    related: ["blueprint", "hq", "agent-work"],
  },
  threads: {
    tagline:
      "Coordination stream — messages, threads, cross-references to Blueprint sections and git-ema attachments. Wave 2 surface; canonical writer still gated.",
    steps: [
      {
        label: "Thread membership projection",
        detail: "Who is in which thread, scoped per org/project membership.",
        state: "staged",
      },
      {
        label: "Typed message envelope",
        detail: "Messages flow through the daemon; surfaces never author canon directly.",
        state: "blocked",
      },
      {
        label: "Cross-surface references",
        detail: "Threads cite Blueprint sections + git-ema attachments with provenance.",
        state: "blocked",
      },
    ],
    related: ["agent-work", "hq", "git-ema"],
  },
};

export function PlaceholderPage({ kind }: PlaceholderPageProps) {
  const isWiki = kind === "wiki";
  const title = isWiki ? "Wiki / Doctrine" : "Chat / Threads";
  const kicker = isWiki ? "doctrine foundation" : "coordination foundation";
  const cards = isWiki
    ? doctrineCards.map((card) => ({ ...card, meta: "doctrine" }))
    : threadCards;
  const plan = PLAN[kind];
  const { openSurface } = useShell();
  const relatedSurfaces = plan.related
    .map((id) => surfaceLinks.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => s != null);

  return (
    <section className="ema-vapp ema-vapp--placeholder">
      <header className="ema-vapp__header ema-vapp__header--split">
        <div>
          <p className="ema-kicker">{kicker}</p>
          <h1>{title}</h1>
          <p className="ema-vapp__tagline">{plan.tagline}</p>
        </div>
        <span className="ema-pill ema-pill--hot">{MOCK_PROJECTION_LABEL}</span>
      </header>

      <section className="ema-panel ema-placeholder-plan" aria-label="Surface roadmap">
        <div className="ema-panel__heading">
          <div>
            <p className="ema-kicker">what this surface will hold</p>
            <h2>Coming online</h2>
          </div>
          <span className="ema-pill">{plan.steps.length} milestones</span>
        </div>
        <ol className="ema-placeholder-plan__list">
          {plan.steps.map((step, index) => (
            <li key={step.label} data-state={step.state}>
              <span className="ema-placeholder-plan__step">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{step.label}</strong>
                <small>{step.detail}</small>
              </div>
              <em>{step.state}</em>
            </li>
          ))}
        </ol>
      </section>

      <section className="ema-panel ema-placeholder-related" aria-label="Related surfaces">
        <div className="ema-panel__heading">
          <div>
            <p className="ema-kicker">elsewhere in the shell</p>
            <h2>Navigate the stack</h2>
          </div>
        </div>
        <div className="ema-placeholder-related__grid">
          {relatedSurfaces.map((s) => (
            <button
              key={s.id}
              type="button"
              className="ema-surface-card"
              data-status={s.status}
              onClick={() => openSurface(s.id)}
            >
              <span>{s.eyebrow}</span>
              <strong>{s.label}</strong>
              <small>{s.status}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="ema-panel" aria-label="Seed cards">
        <div className="ema-panel__heading">
          <div>
            <p className="ema-kicker">seed content</p>
            <h2>{isWiki ? "Doctrine nodes" : "Threads queue"}</h2>
          </div>
          <span className="ema-pill ema-pill--hot">local only</span>
        </div>
        <div className="ema-placeholder-grid">
          {cards.map((card) => (
            <article key={card.title} className="ema-placeholder-card">
              <span>{card.meta}</span>
              <h2>{card.title}</h2>
              <p>{card.body}</p>
              <button className="ema-control-button ema-control-button--compact">
                <span>{isWiki ? "Open note" : "Open thread"}</span>
                <strong>staged</strong>
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
