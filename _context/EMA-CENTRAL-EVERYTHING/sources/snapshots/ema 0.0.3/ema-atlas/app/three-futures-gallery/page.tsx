import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { parts, globalVisions } from "@/lib/ema-atlas";

export default function ThreeFuturesGalleryPage() {
  return (
    <SiteShell
      eyebrow="Gallery"
      title="Three futures, every Part"
      intro="This is the cross-atlas view of the three-futures discipline: one page where every EMA Part is rendered with its operator-cathedral, living-workspace, and mesh-commonwealth reading held side by side. It is a reading surface, not a decision surface — nothing here picks a winner, and no Part is shown with a chosen future."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">Legend</p>
          <h2 className="panel__title">The three attitudes, before the Part-specific overrides</h2>
          <p className="panel__lede">
            These are the three attitudes every Part gets. The Part-specific visions below
            override the stance, bet, tension, and question for each attitude.
          </p>
          <div className="card-grid">
            {globalVisions.map((vision) => (
              <article key={vision.id} className="panel vapp-card">
                <div className="vapp-card__head">
                  <p className="list__eyebrow">Global stance</p>
                  <span className="chip">{vision.title}</span>
                </div>
                <h3 className="list__title">{vision.title}</h3>
                <div>
                  <span className="panel__label">Stance</span>
                  <p className="list__copy">{vision.stance}</p>
                </div>
                <div>
                  <span className="panel__label">Bet</span>
                  <p className="list__copy">{vision.bet}</p>
                </div>
                <div>
                  <span className="panel__label">Tension</span>
                  <p className="list__copy">{vision.tension}</p>
                </div>
                <div>
                  <span className="panel__label">Question</span>
                  <p className="list__copy">{vision.question}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Gallery</p>
          <h2 className="panel__title">Every Part, three futures held in tension</h2>
          <p className="panel__lede">
            Eight Parts. Three futures each. Same rhythm across the atlas so the alternatives stay
            legible together instead of flattening into a preferred reading.
          </p>
        </div>
        {parts.map((part) => (
          <section key={part.slug}>
            <div className="panel">
              <p className="panel__tag">Part</p>
              <h3 className="panel__title">
                <Link className="chip" href={`/parts/${part.slug}`}>
                  {part.title}
                </Link>
              </h3>
              <p className="panel__lede">{part.strapline}</p>
            </div>
            <div className="card-grid">
              {part.visions.map((vision) => (
                <article key={vision.id} className="panel vapp-card">
                  <div className="vapp-card__head">
                    <p className="list__eyebrow">{part.title}</p>
                    <span className="chip">{vision.title}</span>
                  </div>
                  <h3 className="list__title">{vision.title}</h3>
                  <div>
                    <span className="panel__label">Stance</span>
                    <p className="list__copy">{vision.stance}</p>
                  </div>
                  <div>
                    <span className="panel__label">Bet</span>
                    <p className="list__copy">{vision.bet}</p>
                  </div>
                  <div>
                    <span className="panel__label">Tension</span>
                    <p className="list__copy">{vision.tension}</p>
                  </div>
                  <div>
                    <span className="panel__label">Question</span>
                    <p className="list__copy">{vision.question}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Boundaries</p>
          <h2 className="panel__title">What this gallery does NOT do</h2>
          <ul className="list">
            <li className="list__item">
              <p className="list__copy">
                Not a tier ranking. There is no &quot;best&quot; future on this page; the three
                readings are held in tension on purpose.
              </p>
            </li>
            <li className="list__item">
              <p className="list__copy">
                Not a roadmap. Nothing here sequences work or claims one attitude will arrive
                before another.
              </p>
            </li>
            <li className="list__item">
              <p className="list__copy">
                Not permission to pick one per Part without evidence. Resolving a Part toward any
                single future is a decision that belongs elsewhere, backed by the atlas&apos;s
                evidence discipline.
              </p>
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Navigate</p>
          <h2 className="panel__title">Related</h2>
          <div className="route-links">
            <Link className="chip" href="/parts">
              Parts
            </Link>
            <Link className="chip" href="/futures-board">
              Futures board
            </Link>
            <Link className="chip" href="/canonical-rule">
              Canonical rule
            </Link>
            <Link className="chip" href="/open-questions-map">
              Open questions map
            </Link>
            <Link className="chip" href="/questions">
              Questions
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
