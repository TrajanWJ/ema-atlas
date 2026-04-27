import Link from "next/link";
import styles from "./talent-join-experience.module.css";
import {
  talentJoinContent,
  type TalentJoinExpectation,
  type TalentJoinMetric,
  type TalentJoinPillar,
  type TalentJoinStep,
  type TalentJoinTrack,
} from "@/lib/marketing/talent-join";

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

function Metrics({ metrics }: { metrics: readonly TalentJoinMetric[] }) {
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

function Pillars({ pillars }: { pillars: readonly TalentJoinPillar[] }) {
  return (
    <div className={styles.pillarGrid}>
      {pillars.map((pillar) => (
        <article key={pillar.title} className={styles.storyCard}>
          <p className={styles.cardEyebrow}>{pillar.eyebrow}</p>
          <h3>{pillar.title}</h3>
          <p className={styles.storySummary}>{pillar.description}</p>
          <ul className={styles.storyList}>
            {pillar.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function Tracks({ tracks }: { tracks: readonly TalentJoinTrack[] }) {
  return (
    <div className={styles.trackGrid}>
      {tracks.map((track) => (
        <article key={track.title} className={styles.trackCard}>
          <p className={styles.cardEyebrow}>{track.eyebrow}</p>
          <h3>{track.title}</h3>
          <p className={styles.trackSummary}>{track.summary}</p>
          <ul className={styles.trackList}>
            {track.signals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function Steps({ steps }: { steps: readonly TalentJoinStep[] }) {
  return (
    <div className={styles.stepGrid}>
      {steps.map((step) => (
        <article key={step.id} className={styles.stepCard}>
          <p className={styles.stepKicker}>{step.id}</p>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
          <span>{step.output}</span>
        </article>
      ))}
    </div>
  );
}

function Expectations({
  expectations,
}: {
  expectations: readonly TalentJoinExpectation[];
}) {
  return (
    <div className={styles.expectationGrid}>
      {expectations.map((expectation) => (
        <article key={expectation.title} className={styles.expectationCard}>
          <h3>{expectation.title}</h3>
          <p>{expectation.signal}</p>
          <div className={styles.watchoutBlock}>
            <strong>Watchout</strong>
            <span>{expectation.watchout}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

export function TalentJoinExperience() {
  const {
    evidencePack,
    expectations,
    faqs,
    finalCall,
    hero,
    metrics,
    pillars,
    profile,
    rhythm,
    steps,
    ticker,
    tracks,
  } = talentJoinContent;

  return (
    <main className={styles.surface}>
      <section className={styles.heroSection}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <header className={styles.masthead}>
          <Wordmark />
          <nav className={styles.nav} aria-label="Talent join sections">
            <Link href="/marketing">Marketing</Link>
            <a href="#why">Why join</a>
            <a href="#path">Entry path</a>
            <a href="#standards">Standards</a>
          </nav>
          <div className={styles.headerActions}>
            <Link className={styles.secondaryAction} href="/brief">
              Brief demo
            </Link>
            <a className={styles.primaryAction} href="#path">
              {hero.primaryAction}
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
            <p className={styles.heroSupport}>{hero.support}</p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#path">
                {hero.primaryAction}
              </a>
              <a className={styles.secondaryAction} href="#standards">
                {hero.secondaryAction}
              </a>
            </div>
            <Metrics metrics={metrics} />
          </div>

          <aside className={styles.profilePanel}>
            <p className={styles.panelKicker}>{profile.status}</p>
            <div className={styles.profileHeader}>
              <div>
                <h2>{profile.name}</h2>
                <p>{profile.title}</p>
              </div>
              <span className={styles.profileBadge}>{profile.availability}</span>
            </div>
            <p className={styles.profileSummary}>{profile.summary}</p>

            <div className={styles.profileBlock}>
              <strong>Operating strengths</strong>
              <ul>
                {profile.strengths.map((strength) => (
                  <li key={strength}>{strength}</li>
                ))}
              </ul>
            </div>

            <div className={styles.profileStack}>
              {profile.stack.map((tool) => (
                <span key={tool}>{tool}</span>
              ))}
            </div>

            <div className={styles.profileProof}>
              <strong>{profile.proofLabel}</strong>
              <ul>
                {profile.proofPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <div className={styles.ticker} aria-label="Example talent tracks">
        {ticker.map((item) => (
          <span key={item} className={styles.tickerItem}>
            <span className={styles.tickerDot} aria-hidden="true" />
            {item}
          </span>
        ))}
      </div>

      <section id="why" className={styles.section}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>01 / Why this route exists</p>
          <div>
            <h2>
              Autharis is for people who make the ambiguous parts of work feel{" "}
              <em>operable.</em>
            </h2>
            <p>
              The network is designed around actual workflow fit. If your value
              lives in follow-through, note quality, tone, client safety, and
              escalation judgment, the join story should read like a clearer
              version of work you already know how to do.
            </p>
          </div>
        </div>
        <Pillars pillars={pillars} />
      </section>

      <section className={`${styles.section} ${styles.trackSection}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>02 / Who tends to fit</p>
          <div>
            <h2>
              Four lanes where Autharis talent most often creates immediate{" "}
              <em>stability.</em>
            </h2>
            <p>
              These are not the only profiles that work, but they capture the
              current center of gravity: remote professionals who can walk into
              a live workflow and improve the signal, not just absorb hours.
            </p>
          </div>
        </div>
        <Tracks tracks={tracks} />
      </section>

      <section id="path" className={`${styles.section} ${styles.pathSection}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>03 / Entry path</p>
          <div>
            <h2>
              The join flow is meant to turn your experience into something a
              client can trust <em>quickly.</em>
            </h2>
            <p>
              No giant funnel. No performance theater. Just enough structure to
              understand the work you can already carry, how you communicate,
              and where you are most likely to match cleanly.
            </p>
          </div>
        </div>

        <div className={styles.pathGrid}>
          <Steps steps={steps} />

          <aside className={styles.evidenceCard}>
            <p className={styles.panelKicker}>{evidencePack.eyebrow}</p>
            <h3>{evidencePack.title}</h3>
            <ul className={styles.evidenceList}>
              {evidencePack.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section id="standards" className={`${styles.section} ${styles.standardsSection}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>04 / Standards</p>
          <div>
            <h2>
              The bar is less about polish and more about whether the work stays{" "}
              <em>legible.</em>
            </h2>
            <p>
              Great operators make the invisible parts of remote work visible:
              notes, next steps, ownership, escalation, and a weekly rhythm that
              the client can actually approve.
            </p>
          </div>
        </div>

        <Expectations expectations={expectations} />

        <div className={styles.rhythmCard}>
          <div className={styles.rhythmHeader}>
            <div>
              <p className={styles.panelKicker}>{rhythm.eyebrow}</p>
              <h3>{rhythm.title}</h3>
            </div>
            <p>{rhythm.summary}</p>
          </div>

          <div className={styles.rhythmRows}>
            {rhythm.rows.map((row) => (
              <div key={row.label} className={styles.rhythmRow}>
                <span>{row.label}</span>
                <span>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.faqSection}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>05 / FAQ</p>
          <div>
            <h2>
              A few questions talent usually asks before deciding whether the
              network sounds <em>worth it.</em>
            </h2>
          </div>
        </div>

        <div className={styles.faqGrid}>
          {faqs.map((faq) => (
            <article key={faq.question} className={styles.faqCard}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.finalSection}>
        <div className={styles.finalCard}>
          <p className={styles.sectionIndex}>{finalCall.eyebrow}</p>
          <h2>{finalCall.title}</h2>
          <p>{finalCall.body}</p>
          <div className={styles.finalActions}>
            <Link className={styles.primaryAction} href={finalCall.primaryHref}>
              {finalCall.primaryLabel}
            </Link>
            <Link className={styles.secondaryAction} href={finalCall.secondaryHref}>
              {finalCall.secondaryLabel}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
