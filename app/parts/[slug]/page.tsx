import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteShell } from "@/components/site-shell";
import { VisionTriptych } from "@/components/vision-triptych";
import { countDiagrams } from "@/lib/diagrams";
import { getPart } from "@/lib/ema-atlas";

type PartPageProps = {
  params: Promise<{ slug: string }>;
};

const SESSION_ADDITIONS: Record<string, string[]> = {
  "authority-control-plane": [
    "/canonical-rule",
    "/state-planes",
    "/chronicle",
    "/event-kinds",
    "/proposal-flow",
  ],
  "harness-execution": [
    "/driver-matrix",
    "/hermes-contract",
    "/chat",
    "/chat/tenanted",
    "/incidents",
  ],
  "shared-workspace": [
    "/handoff",
    "/inbox",
    "/workspace-contract",
    "/agent-environment",
    "/weekly-cadence",
  ],
  "coordination-environment": [
    "/agent-environment",
    "/weekly-cadence",
    "/agent-day",
    "/human-day",
    "/handoff",
  ],
  "semantic-layer": [
    "/wiki",
    "/wiki/node/example",
    "/blueprint",
    "/collab-plane-options",
    "/glossary-app",
  ],
  "shells-surfaces": [
    "/launchpad",
    "/launchpad/command",
    "/hq",
    "/hq/project",
    "/hq/personal",
    "/surfaces-map",
  ],
  "identity-project-space": [
    "/project-space",
    "/personal-ai",
    "/chat/tenanted",
    "/open-questions-map",
  ],
  "mesh-replication": [
    "/mesh",
    "/state-planes",
    "/canonical-rule",
    "/anti-patterns",
  ],
};

export default async function PartPage({ params }: PartPageProps) {
  const { slug } = await params;
  const part = getPart(slug);

  if (!part) {
    notFound();
  }

  const diagramCount = await countDiagrams(slug);
  const sessionRoutes = SESSION_ADDITIONS[part.slug] ?? [];

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
            {diagramCount > 0 && (
              <Link className="chip" href={`/canvas/${part.slug}#diagrams`}>
                {diagramCount} diagram{diagramCount === 1 ? "" : "s"}
              </Link>
            )}
            <Link className="chip" href="/graph">
              System Graph
            </Link>
          </div>
        </article>
      </section>

      {sessionRoutes.length > 0 && (
        <section className="panel">
          <p className="panel__tag">Session additions</p>
          <h2 className="panel__title">Routes that now pressure this Part</h2>
          <p className="panel__lede">
            Static mockups added this session to pressure-test where this Part shows up in the product.
          </p>
          <div className="route-links">
            {sessionRoutes.map((route) => (
              <Link key={route} className="chip" href={route}>
                {route}
              </Link>
            ))}
          </div>
        </section>
      )}
    </SiteShell>
  );
}
