import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { VisionTriptych } from "@/components/vision-triptych";
import { parts, topLevelRoutes } from "@/lib/ema-atlas";

export default function HomePage() {
  const featured = parts.slice(0, 4);

  return (
    <SiteShell
      eyebrow="Primary Deliverables Hub"
      title="EMA Atlas"
      intro="A Next.js center of gravity for the EMA project: not just a docs mirror, but a live artifact field for futures, hard questions, graphs, slides, canvas boards, place-like surfaces, and the different parts of the system growing together."
    >
      <section className="section-grid">
        <article className="panel panel--hero">
          <p className="panel__tag">Stage / Now</p>
          <h2 className="panel__title">This repo is now the presentation layer for EMA-in-progress.</h2>
          <p className="panel__lede">
            The build and the way we explain the build should evolve together. This atlas is meant to sit beside EMA
            development and keep pressure on the hard questions, not hide them.
          </p>
          <div className="stat-ribbon">
            <div className="stat">
              <span className="stat__value">{parts.length}</span>
              <span>System parts staged</span>
            </div>
            <div className="stat">
              <span className="stat__value">{parts.length * 3}</span>
              <span>Future takes embedded</span>
            </div>
            <div className="stat">
              <span className="stat__value">{topLevelRoutes.length}</span>
              <span>Top-level routes live</span>
            </div>
          </div>
          <div className="panel__actions">
            <Link className="chip" href="/parts">
              Explore Parts
            </Link>
            <Link className="chip" href="/showroom">
              Open Showroom
            </Link>
            <Link className="chip" href="/program">
              View Program
            </Link>
            <Link className="chip" href="/desktop">
              Open Desktop
            </Link>
            <Link className="chip" href="/graph">
              View Graph
            </Link>
          </div>
        </article>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Three Futures / One System</p>
          <h2 className="panel__title">Every part carries three futures on purpose.</h2>
          <p className="panel__lede">
            Instead of pretending one clean vision already won, the atlas presents each part of EMA through three
            competing attitudes toward the future. The point is to surface tradeoffs early enough that they still
            matter.
          </p>
        </div>
        <VisionTriptych part={parts[0]} visions={parts[0].visions.map((vision) => ({ ...vision }))} />
      </section>

      <section className="card-grid">
        {featured.map((part) => (
          <article className="panel list-card" key={part.slug}>
            <p className="list__eyebrow">{part.strapline}</p>
            <h3 className="list__title">{part.title}</h3>
            <p className="list__copy">{part.summary}</p>
            <ul className="inline-list">
              {part.branches.slice(0, 3).map((branch) => (
                <li key={branch}>{branch}</li>
              ))}
            </ul>
            <div className="route-links">
              <Link className="chip" href={`/parts/${part.slug}`}>
                Atlas
              </Link>
              <Link className="chip" href={`/briefs/${part.slug}`}>
                PDF Brief
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

      <section>
        <div className="panel">
          <p className="panel__tag">Session / New depth</p>
          <h2 className="panel__title">Named surfaces, doctrine, scenarios — now directly routable.</h2>
          <p className="panel__lede">
            Roughly 42 new routes ship this session, covering named surfaces, doctrine, control-plane flows, scenarios,
            and guided tours. The discovery hub is <Link className="chip" href="/surface-index">/surface-index</Link> and
            the rule is <Link className="chip" href="/canonical-rule">/canonical-rule</Link>.
          </p>
          <div className="route-links">
            <Link className="chip" href="/launchpad">/launchpad</Link>
            <Link className="chip" href="/hq">/hq</Link>
            <Link className="chip" href="/wiki">/wiki</Link>
            <Link className="chip" href="/chat">/chat</Link>
            <Link className="chip" href="/threads">/threads</Link>
            <Link className="chip" href="/agent-environment">/agent-environment</Link>
            <Link className="chip" href="/blueprint">/blueprint</Link>
            <Link className="chip" href="/desktop">/desktop</Link>
            <Link className="chip" href="/vapps">/vapps</Link>
          </div>
          <div className="route-links">
            <Link className="chip" href="/canonical-rule">/canonical-rule</Link>
            <Link className="chip" href="/state-planes">/state-planes</Link>
            <Link className="chip" href="/surface-index">/surface-index</Link>
            <Link className="chip" href="/three-futures-gallery">/three-futures-gallery</Link>
            <Link className="chip" href="/tour/for-skeptic">/tour/for-skeptic</Link>
            <Link className="chip" href="/tour/for-engineer">/tour/for-engineer</Link>
            <Link className="chip" href="/tour/for-operator">/tour/for-operator</Link>
            <Link className="chip" href="/demo/surface-tour">/demo/surface-tour</Link>
          </div>
          <p className="panel__lede">Everything else: <Link className="chip" href="/surface-index">/surface-index</Link>.</p>
        </div>
      </section>
    </SiteShell>
  );
}
