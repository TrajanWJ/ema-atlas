import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { parts } from "@/lib/ema-atlas";

export default function PartsPage() {
  return (
    <SiteShell
      eyebrow="System Parts"
      title="EMA By Part"
      intro="Each part page acts like an atlas panel: the current summary, the branch lineage feeding it, three future takes, and the artifact routes that express it in different formats."
    >
      <section className="card-grid">
        {parts.map((part) => (
          <article className="panel list-card" key={part.slug}>
            <p className="list__eyebrow">{part.strapline}</p>
            <h2 className="list__title">{part.title}</h2>
            <p className="list__copy">{part.summary}</p>
            <div>
              <span className="panel__label">Hard Questions</span>
              <ul>
                {part.hardQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>
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
          </article>
        ))}
      </section>
    </SiteShell>
  );
}
