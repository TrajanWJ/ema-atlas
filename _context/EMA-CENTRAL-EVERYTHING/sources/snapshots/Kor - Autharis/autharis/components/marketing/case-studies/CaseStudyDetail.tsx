import type { CSSProperties } from "react";
import Link from "next/link";
import styles from "./case-studies.module.css";
import type { CaseStudy } from "@/lib/marketing/case-studies";

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

export function CaseStudyDetail({
  study,
  relatedStudies,
}: {
  study: CaseStudy;
  relatedStudies: readonly CaseStudy[];
}) {
  return (
    <main
      className={`${styles.surface} ${styles.detailSurface}`}
      style={{ "--story-accent": study.accent } as CSSProperties}
    >
      <section className={styles.detailHero}>
        <div className={styles.detailShell}>
          <div className={styles.detailHeading}>
            <Link href="/case-studies" className={styles.backLink}>
              ← Back to archive
            </Link>
            <p className={styles.heroEyebrow}>{study.label}</p>
            <h1>{study.title}</h1>
            <p className={styles.heroLead}>{study.summary}</p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="mailto:hello@autharis.com">
                Start a similar brief
                <ArrowUpRight />
              </a>
              <Link href="/marketing" className={styles.secondaryAction}>
                Marketing preview
              </Link>
            </div>
          </div>

          <aside className={styles.detailSidebar}>
            <div className={styles.sidebarCard}>
              <p className={styles.panelEyebrow}>Engagement facts</p>
              <dl className={styles.sidebarList}>
                <div>
                  <dt>Client</dt>
                  <dd>{study.client}</dd>
                </div>
                <div>
                  <dt>Sector</dt>
                  <dd>{study.sector}</dd>
                </div>
                <div>
                  <dt>Engagement</dt>
                  <dd>{study.engagement}</dd>
                </div>
                <div>
                  <dt>Window</dt>
                  <dd>{study.timeframe}</dd>
                </div>
                <div>
                  <dt>Team</dt>
                  <dd>{study.team}</dd>
                </div>
              </dl>
            </div>
            <div className={styles.sidebarCard}>
              <p className={styles.panelEyebrow}>Signal tags</p>
              <div className={styles.tagRow}>
                {study.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.detailMetrics}>
        {study.metrics.map((metric) => (
          <article key={metric.label} className={styles.metricCard}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.note}</span>
          </article>
        ))}
      </section>

      <section className={styles.detailBody}>
        <div className={styles.narrativeColumn}>
          <article className={styles.narrativeCard}>
            <p className={styles.sectionIndex}>Pressure point</p>
            <h2>What was breaking before Autharis entered the workflow.</h2>
            <p>{study.challenge}</p>
          </article>

          <article className={styles.narrativeCard}>
            <p className={styles.sectionIndex}>Operator layer</p>
            <h2>How the brief was structured and staffed.</h2>
            <p>{study.response}</p>
          </article>

          <article className={styles.narrativeCard}>
            <p className={styles.sectionIndex}>Operational result</p>
            <h2>What changed once the queue had accountable humans on it.</h2>
            <p>{study.outcome}</p>
          </article>

          <article className={styles.quoteCard}>
            <p className={styles.panelEyebrow}>Client note</p>
            <blockquote>{study.quote.text}</blockquote>
            <footer>
              <strong>{study.quote.attribution}</strong>
              <span>{study.quote.role}</span>
            </footer>
          </article>
        </div>

        <aside className={styles.detailRail}>
          <div className={styles.sidebarCard}>
            <p className={styles.panelEyebrow}>Artifacts left behind</p>
            <div className={styles.artifactList}>
              {study.artifacts.map((artifact) => (
                <div key={artifact.label} className={styles.artifactCard}>
                  <strong>{artifact.label}</strong>
                  <p>{artifact.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.sidebarCard}>
            <p className={styles.panelEyebrow}>Proof points</p>
            <div className={styles.proofGrid}>
              {study.proofPoints.map((point) => (
                <p key={point} className={styles.proofPill}>
                  {point}
                </p>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className={styles.timelineSection}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>Timeline</p>
          <div>
            <h2>The engagement arc, checkpoint by checkpoint.</h2>
          </div>
        </div>
        <div className={styles.timelineList}>
          {study.checkpoints.map((checkpoint) => (
            <article key={checkpoint.title} className={styles.timelineCard}>
              <div className={styles.timelineMarker} aria-hidden="true" />
              <p className={styles.panelEyebrow}>{checkpoint.phase}</p>
              <h3>{checkpoint.title}</h3>
              <p>{checkpoint.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.relatedSection}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>Related stories</p>
          <div>
            <h2>Other operating environments where the human layer mattered.</h2>
          </div>
        </div>
        <div className={styles.archiveGrid}>
          {relatedStudies.map((relatedStudy) => (
            <article key={relatedStudy.slug} className={styles.archiveCard}>
              <div className={styles.archiveCardTop}>
                <p className={styles.storyLabel}>{relatedStudy.label}</p>
                <span>{relatedStudy.client}</span>
              </div>
              <h3>{relatedStudy.title}</h3>
              <p className={styles.storySummary}>{relatedStudy.summary}</p>
              <Link
                href={`/case-studies/${relatedStudy.slug}`}
                className={styles.cardLink}
              >
                Read the case study
                <ArrowUpRight />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
