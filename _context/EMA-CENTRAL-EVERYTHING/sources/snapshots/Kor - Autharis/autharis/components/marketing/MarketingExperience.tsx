import styles from "./marketing-experience.module.css";
import {
  marketingContent,
  type MarketingAudienceCard,
  type MarketingCategory,
  type MarketingMetric,
  type MarketingStep,
} from "@/lib/marketing/content";

function Wordmark() {
  return (
    <div className={styles.wordmark}>
      <span className={styles.wordmarkGlyph} aria-hidden="true">
        <svg viewBox="0 0 36 36" role="presentation">
          <rect x="1" y="1" width="34" height="34" rx="10" />
          <circle cx="18" cy="18" r="10.5" className={styles.wordmarkRing} />
          <path d="M18 18V8.5" className={styles.wordmarkHandPrimary} />
          <path d="M18 18 25 22" className={styles.wordmarkHandSecondary} />
          <circle cx="18" cy="18" r="1.9" className={styles.wordmarkPin} />
        </svg>
      </span>
      <span className={styles.wordmarkText}>Autharis</span>
    </div>
  );
}

function ArrowUpRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      className={styles.arrowIcon}
      aria-hidden="true"
      role="presentation"
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

function Metrics({ metrics }: { metrics: readonly MarketingMetric[] }) {
  return (
    <dl className={styles.metricGrid}>
      {metrics.map((metric) => (
        <div key={metric.label} className={styles.metricCard}>
          <dt>{metric.label}</dt>
          <dd>{metric.value}</dd>
          <p>{metric.note}</p>
        </div>
      ))}
    </dl>
  );
}

function Steps({ steps }: { steps: readonly MarketingStep[] }) {
  return (
    <div className={styles.stepGrid}>
      {steps.map((step) => (
        <article key={step.id} className={styles.stepCard}>
          <p className={styles.stepKicker}>{step.id}</p>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
        </article>
      ))}
    </div>
  );
}

function AudienceCards({
  cards,
}: {
  cards: readonly MarketingAudienceCard[];
}) {
  return (
    <div className={styles.audienceGrid}>
      {cards.map((card) => (
        <article key={card.title} className={styles.audienceCard}>
          <p className={styles.cardEyebrow}>{card.eyebrow}</p>
          <h3>{card.title}</h3>
          <p className={styles.cardSummary}>{card.summary}</p>
          <ul className={styles.cardList}>
            {card.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function Categories({
  categories,
}: {
  categories: readonly MarketingCategory[];
}) {
  return (
    <div className={styles.categoryGrid}>
      {categories.map((category, index) => (
        <article key={category.title} className={styles.categoryCard}>
          <p className={styles.categoryNumber}>
            {String(index + 1).padStart(2, "0")} / {String(categories.length).padStart(2, "0")}
          </p>
          <h3>{category.title}</h3>
          <p>{category.description}</p>
        </article>
      ))}
    </div>
  );
}

export function MarketingExperience() {
  const { audienceCards, categories, hero, metrics, steps, ticker, timecard } =
    marketingContent;

  return (
    <main id="top" className={styles.surface}>
      <section className={styles.heroSection}>
        <header className={styles.masthead}>
          <Wordmark />
          <nav className={styles.nav} aria-label="Marketing sections">
            <a href="#system">How it works</a>
            <a href="#business">For businesses</a>
            <a href="#talent">For talent</a>
            <a href="#brief">Start a brief</a>
          </nav>
          <div className={styles.headerActions}>
            <a className={styles.secondaryAction} href="#talent">
              Join the network
            </a>
            <a className={styles.primaryAction} href="#brief">
              Request operators
            </a>
          </div>
        </header>

        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.heroEyebrow}>{hero.eyebrow}</p>
            <h1>
              {hero.titleLead} <em>{hero.titleEmphasis}</em> {hero.titleTrail}
            </h1>
            <p className={styles.heroLead}>{hero.lead}</p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#brief">
                {hero.primaryAction}
              </a>
              <a className={styles.secondaryAction} href="#system">
                {hero.secondaryAction}
              </a>
            </div>
            <p className={styles.heroSupport}>{hero.support}</p>
            <Metrics metrics={metrics} />
          </div>

          <div className={styles.heroFigure}>
            <div className={styles.figureBackdrop} aria-hidden="true" />
            <aside className={styles.signalPanel}>
              <p className={styles.signalEyebrow}>This week&apos;s live brief</p>
              <h2>{timecard.signalTitle}</h2>
              <p>{timecard.signalSummary}</p>
              <ul>
                {timecard.signalPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </aside>

            <div className={styles.timecardWrap}>
              <div className={styles.timecardPunches} aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <article className={styles.timecard}>
                <p className={styles.timecardStamp}>{timecard.stamp}</p>
                <div className={styles.timecardTop}>
                  <span>{timecard.reference}</span>
                  <span>{timecard.weekLabel}</span>
                </div>
                <h2>{timecard.worker}</h2>
                <p className={styles.timecardSubtitle}>{timecard.assignment}</p>
                <div className={styles.timecardRows}>
                  {timecard.entries.map((entry) => (
                    <div key={`${entry.day}-${entry.task}`} className={styles.timecardRow}>
                      <span>{entry.day}</span>
                      <span>{entry.task}</span>
                      <span>{entry.hours}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.timecardFooter}>
                  <span>{timecard.totalLabel}</span>
                  <span>{timecard.totalValue}</span>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.ticker} aria-label="Example operator workflows">
        {ticker.map((item) => (
          <span key={item} className={styles.tickerItem}>
            <span className={styles.tickerDot} aria-hidden="true" />
            {item}
          </span>
        ))}
      </div>

      <section id="system" className={styles.section}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>01 / Operating system</p>
          <div>
            <h2>
              Three steps. <em>No long procurement cycle.</em>
            </h2>
            <p>
              Autharis is designed for work that arrives fast, carries nuance,
              and still needs a real person on the loop. The operating model is
              tight, legible, and approvals-first.
            </p>
          </div>
        </div>
        <Steps steps={steps} />
      </section>

      <section id="business" className={`${styles.section} ${styles.sectionSplit}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>02 / Both sides of the market</p>
          <div>
            <h2>
              Human capacity exactly where automation <em>starts to fray.</em>
            </h2>
            <p>
              The surface is built around the same premise for both audiences:
              businesses gain reliable hourly operators, and professionals gain
              flexible, skill-aligned work without flattening their experience.
            </p>
          </div>
        </div>
        <AudienceCards cards={audienceCards} />
      </section>

      <section className={styles.manifestoBand}>
        <div className={styles.manifestoCopy}>
          <p className={styles.sectionIndex}>03 / The human layer</p>
          <h2>
            When the model gets you 80% there, <em>Autharis carries the last mile.</em>
          </h2>
          <p>
            Teams still need someone to interpret ambiguity, handle edge cases,
            make the call, and close the loop. That is where the marketplace
            becomes operational infrastructure instead of marketing copy.
          </p>
        </div>
        <div className={styles.manifestoProof}>
          {marketingContent.proofPoints.map((point) => (
            <div key={point.label} className={styles.proofCard}>
              <p>{point.label}</p>
              <strong>{point.value}</strong>
              <span>{point.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="talent" className={styles.section}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>04 / Categories</p>
          <div>
            <h2>Flexible support across the work that still needs judgment.</h2>
            <p>
              These are the kinds of workflows the new marketing surface keeps
              foregrounded: communication, coordination, review, follow-through,
              and human accountability around complex systems.
            </p>
          </div>
        </div>
        <Categories categories={categories} />
      </section>

      <section id="brief" className={`${styles.section} ${styles.finalSection}`}>
        <div className={styles.finalCard}>
          <div>
            <p className={styles.sectionIndex}>05 / Start the brief</p>
            <h2>Describe the work. We&apos;ll match the human layer around it.</h2>
            <p>
              Whether the need is backlog relief, customer coordination, care
              navigation, or human review around AI outputs, the operating
              pattern stays the same: scoped brief, focused shortlist, approved
              hours.
            </p>
          </div>
          <div className={styles.finalActions}>
            <a className={styles.primaryAction} href="mailto:hello@autharis.com">
              hello@autharis.com
              <ArrowUpRight />
            </a>
            <a className={styles.secondaryAction} href="#top">
              Back to top
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
