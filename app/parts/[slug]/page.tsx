import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteShell } from "@/components/site-shell";
import { VisionTriptych } from "@/components/vision-triptych";
import { getPart } from "@/lib/ema-atlas";

type PartPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PartPage({ params }: PartPageProps) {
  const { slug } = await params;
  const part = getPart(slug);

  if (!part) {
    notFound();
  }

  return (
    <SiteShell eyebrow="Part Atlas" title={part.title} intro={part.summary}>
      <section className="card-grid">
        <article className="panel">
          <p className="panel__tag">Lineage Inputs</p>
          <ul className="inline-list">
            {part.branches.map((branch) => (
              <li key={branch}>{branch}</li>
            ))}
          </ul>
        </article>
        <article className="panel">
          <p className="panel__tag">Knowledge Pack</p>
          <ul className="inline-list">
            {part.docs.map((doc) => (
              <li key={doc}>{doc}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="panel">
        <p className="panel__tag">Hard Questions</p>
        <h2 className="panel__title">Make the uncomfortable choices visible.</h2>
        <div className="panel__stack">
          {part.hardQuestions.map((question) => (
            <p key={question}>{question}</p>
          ))}
        </div>
      </section>

      <VisionTriptych part={part} />

      <section className="card-grid">
        <article className="panel">
          <p className="panel__tag">Deliverable Forms</p>
          <ul>
            {part.deliverables.map((deliverable) => (
              <li key={deliverable}>{deliverable}</li>
            ))}
          </ul>
        </article>
        <article className="panel">
          <p className="panel__tag">Artifact Routes</p>
          <div className="route-links">
            <Link className="chip" href={`/briefs/${part.slug}`}>
              Print Brief
            </Link>
            <Link className="chip" href={`/slides/${part.slug}`}>
              Slide Deck
            </Link>
            <Link className="chip" href={`/canvas/${part.slug}`}>
              Canvas Board
            </Link>
            <Link className="chip" href="/graph">
              System Graph
            </Link>
          </div>
        </article>
      </section>
    </SiteShell>
  );
}
