import Link from "next/link";
import styles from "./case-studies.module.css";
import {
  caseStudies,
  caseStudyArchiveStats,
  caseStudyOperatingNotes,
  featuredCaseStudy,
} from "@/lib/marketing/case-studies";

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

export function CaseStudiesIndex() {
  return (
    <main className={styles.surface}>
      <section className={styles.archiveHero}>
        <header className={styles.masthead}>
          <Link href="/marketing" className={styles.brandLink}>
            <Wordmark />
          </Link>
          <nav className={styles.nav} aria-label="Case study sections">
            <a href="#featured">Featured story</a>
            <a href="#archive">Archive</a>
            <a href="#pattern">Operating pattern</a>
          </nav>
          <div className={styles.headerActions}>
            <Link href="/marketing" className={styles.secondaryAction}>
              Marketing preview
            </Link>
            <a className={styles.primaryAction} href="mailto:hello@autharis.com">
              Start a brief
            </a>
          </div>
        </header>

        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.heroEyebrow}>Case studies archive · Editorial rail</p>
            <h1>
              What the <em>human layer</em> looks like when the queue is real.
            </h1>
            <p className={styles.heroLead}>
              These stories show how Autharis plugs capable operators into the
              moments where software can sort the work but cannot finish it:
              launch crunch, care coordination, intake recovery, and human QA
              around ambiguous systems.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#featured">
                Read the featured story
              </a>
              <a className={styles.secondaryAction} href="#archive">
                Browse the archive
              </a>
            </div>
          </div>

          <div className={styles.heroPanel}>
            <div className={styles.panelShell}>
              <p className={styles.panelEyebrow}>Archive notes</p>
              <h2>Editorial proof, not abstract positioning.</h2>
              <p>
                Each case study tracks the same operating arc: pressure point,
                matched operator layer, approval loop, and the artifacts left
                behind when the sprint ends.
              </p>
              <dl className={styles.metricGrid}>
                {caseStudyArchiveStats.map((metric) => (
                  <div key={metric.label} className={styles.metricCard}>
                    <dt>{metric.label}</dt>
                    <dd>{metric.value}</dd>
                    <p>{metric.note}</p>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section id="featured" className={styles.section}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>01 / Featured story</p>
          <div>
            <h2>
              A patient-outreach surge, an EHR transition, and a queue that
              still needed <em>human judgment.</em>
            </h2>
            <p>
              Meridian Health is the clearest example of the Autharis thesis:
              the workflow was already partially automated, but the outcomes
              still depended on calm humans who could close the loop.
            </p>
          </div>
        </div>

        <article className={styles.featuredCard}>
          <div className={styles.featuredStory}>
            <p className={styles.storyLabel}>{featuredCaseStudy.label}</p>
            <h3>{featuredCaseStudy.title}</h3>
            <p className={styles.storySummary}>{featuredCaseStudy.summary}</p>
            <div className={styles.storyMeta}>
              <span>{featuredCaseStudy.clientLabel}</span>
              <span>{featuredCaseStudy.engagement}</span>
              <span>{featuredCaseStudy.team}</span>
            </div>
            <div className={styles.tagRow}>
              {featuredCaseStudy.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.featuredLedger}>
            <div className={styles.ledgerHeader}>
              <p className={styles.panelEyebrow}>Engagement ledger</p>
              <span>{featuredCaseStudy.timeframe}</span>
            </div>
            <div className={styles.proofGrid}>
              {featuredCaseStudy.proofPoints.map((point) => (
                <p key={point} className={styles.proofPill}>
                  {point}
                </p>
              ))}
            </div>
            <Link
              href={`/case-studies/${featuredCaseStudy.slug}`}
              className={styles.primaryAction}
            >
              Open full case study
              <ArrowUpRight />
            </Link>
          </div>
        </article>
      </section>

      <section id="archive" className={`${styles.section} ${styles.archiveSection}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>02 / Archive</p>
          <div>
            <h2>
              Three different sectors. The same need for a <em>legible operator layer.</em>
            </h2>
            <p>
              The stories vary by client context, but the throughline is
              consistent: urgent work needed accountable follow-through faster
              than a standard hiring cycle could provide it.
            </p>
          </div>
        </div>
        <div className={styles.archiveGrid}>
          {caseStudies.map((study) => (
            <article
              key={study.slug}
              className={styles.archiveCard}
              style={{ "--story-accent": study.accent } as React.CSSProperties}
            >
              <div className={styles.archiveCardTop}>
                <p className={styles.storyLabel}>{study.label}</p>
                <span>{study.heroKicker}</span>
              </div>
              <h3>{study.title}</h3>
              <p className={styles.storySummary}>{study.summary}</p>
              <div className={styles.cardStatRow}>
                {study.metrics.map((metric) => (
                  <div key={metric.label} className={styles.cardStat}>
                    <strong>{metric.value}</strong>
                    <span>{metric.label}</span>
                  </div>
                ))}
              </div>
              <div className={styles.storyMeta}>
                <span>{study.client}</span>
                <span>{study.sector}</span>
              </div>
              <Link href={`/case-studies/${study.slug}`} className={styles.cardLink}>
                Read the full narrative
                <ArrowUpRight />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section id="pattern" className={styles.patternBand}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>03 / Operating pattern</p>
          <div>
            <h2>
              Every case study is really a story about where automation stops
              and <em>operational trust</em> has to begin.
            </h2>
          </div>
        </div>
        <div className={styles.patternGrid}>
          {caseStudyOperatingNotes.map((note) => (
            <article key={note.title} className={styles.patternCard}>
              <p className={styles.panelEyebrow}>{note.eyebrow}</p>
              <h3>{note.title}</h3>
              <p>{note.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.finalSection}>
        <div className={styles.finalCard}>
          <div>
            <p className={styles.sectionIndex}>04 / Next move</p>
            <h2>Bring the queue, the backlog, or the launch week. We&apos;ll build the human layer around it.</h2>
            <p>
              Autharis is for the moments where you do not need another
              strategic deck. You need capable people with a clear operating
              pattern and approved hours.
            </p>
          </div>
          <div className={styles.heroActions}>
            <a className={styles.primaryAction} href="mailto:hello@autharis.com">
              hello@autharis.com
              <ArrowUpRight />
            </a>
            <Link href="/marketing" className={styles.secondaryAction}>
              Return to marketing preview
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
