import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

import { loadTiers, relToSlug } from "./_tiers";

export default async function DocsPage() {
  const tiers = await loadTiers();
  const total = tiers.reduce((acc, t) => acc + t.files.length, 0);
  const swarmStart = [
    {
      rel: "content/swarm/README.md",
      title: "Swarm Workspace Pack",
      summary:
        "Support-lane entrypoint for active EMA swarm work: doctrine, object families, read order, and alignment rules.",
    },
    {
      rel: "content/swarm/orchestration-kernel.md",
      title: "Orchestration Kernel",
      summary:
        "The control model to start from: one active objective, one main write lane, support lanes around it.",
    },
    {
      rel: "content/swarm/active-wave-current.md",
      title: "Active Wave",
      summary:
        "The live wave contract: current owner, main lane shape, support posture, risks, and stop rules.",
    },
  ];

  return (
    <SiteShell
      eyebrow="Local Knowledge Pack"
      title="EMA Docs"
      intro="The whole markdown corpus, grouped by reading order. Tier 1 first; the rest as you need them. Each tile links to a rendered view of the file."
    >
      <section className="section-grid">
        <article className="panel panel--hero">
          <p className="panel__tag">Reading map</p>
          <h2 className="panel__title">
            {total} documents, five tiers, one path through the system.
          </h2>
          <p className="panel__lede">
            Tiers are reading order, not importance ranking. Tier 1 sets
            context; Tier 2 shows the decisions; Tier 3 maps the system;
            Tier 4 is the handoff narrative; Tier 5 is operational.
          </p>
          <div className="stat-ribbon">
            {tiers.map((t) => (
              <div className="stat" key={t.key}>
                <span className="stat__value">{t.files.length}</span>
                <span>{t.label}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="docs-tier">
        <header className="docs-tier__header">
          <p className="docs-tier__label">Start Here</p>
          <h2 className="docs-tier__title">Active swarm work has its own lean entry path.</h2>
          <p className="docs-tier__blurb">
            If you are joining a live wave, do not reconstruct the swarm from the whole corpus.
            Start with the support-lane pack, then the kernel, then the live wave.
          </p>
        </header>
        <div className="docs-tier__grid">
          {swarmStart.map((item) => (
            <Link
              className="docs-tile"
              key={item.rel}
              href={`/docs/${relToSlug(item.rel)}`}
            >
              <p className="docs-tile__path">{item.rel}</p>
              <h3 className="docs-tile__name">{item.title}</h3>
              <p className="docs-tile__summary">{item.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      {tiers.map((tier) =>
        tier.files.length === 0 ? null : (
          <section className="docs-tier" key={tier.key}>
            <header className="docs-tier__header">
              <p className="docs-tier__label">{tier.label}</p>
              <h2 className="docs-tier__title">{tier.title}</h2>
              <p className="docs-tier__blurb">{tier.blurb}</p>
            </header>
            <div className="docs-tier__grid">
              {tier.files.map((file) => (
                <Link
                  className="docs-tile"
                  key={file.slug}
                  href={`/docs/${file.slug}`}
                >
                  <p className="docs-tile__path">{file.rel}</p>
                  <h3 className="docs-tile__name">{file.name}</h3>
                  <p className="docs-tile__summary">{file.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        )
      )}
    </SiteShell>
  );
}
