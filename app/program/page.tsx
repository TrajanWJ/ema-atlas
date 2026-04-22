import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { parts } from "@/lib/ema-atlas";

const lanes = [
  {
    title: "Narrative Lane",
    copy: "Atlas, brief, slides, and canvas artifacts that pressure doctrine and product story at the same time."
  },
  {
    title: "Workspace Lane",
    copy: "Desktop, threads, planner, wiki, and HQ surfaces that test whether EMA feels like a real shared environment."
  },
  {
    title: "Implementation Lane",
    copy: "Schema, events, bounded contexts, source packs, and donor recovery that prevent the atlas from drifting away from the real build."
  }
];

export default function ProgramPage() {
  return (
    <SiteShell
      eyebrow="Cross-Part Program"
      title="EMA Program"
      intro="A route for reading the whole EMA effort as one coordinated program: every part should generate deliverables, pressure implementation, and force the uncomfortable questions to stay visible."
    >
      <section className="artifact-grid">
        {lanes.map((lane) => (
          <article className="panel list-card" key={lane.title}>
            <p className="panel__tag">Lane</p>
            <h2 className="list__title">{lane.title}</h2>
            <p className="list__copy">{lane.copy}</p>
          </article>
        ))}
      </section>

      <section className="doc-grid">
        {parts.map((part) => (
          <article className="panel list-card" key={part.slug}>
            <p className="list__eyebrow">{part.strapline}</p>
            <h2 className="list__title">{part.title}</h2>
            <p className="list__copy">{part.summary}</p>
            <div className="route-links">
              <Link className="chip" href={`/parts/${part.slug}`}>
                Atlas
              </Link>
              <Link className="chip" href={`/briefs/${part.slug}`}>
                Brief
              </Link>
              <Link className="chip" href={`/slides/${part.slug}`}>
                Slides
              </Link>
              <Link className="chip" href={`/canvas/${part.slug}`}>
                Canvas
              </Link>
            </div>
            <ul className="question-list">
              {part.visions.map((vision) => (
                <li key={vision.id}>
                  <span>{vision.title}</span>
                  <strong>{vision.question}</strong>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </SiteShell>
  );
}
