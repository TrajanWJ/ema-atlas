import Link from "next/link";
import styles from "./faq-experience.module.css";
import { faqContent } from "@/lib/marketing/faq";

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

export function FaqExperience() {
  const { closingNotes, commitments, faqSections, hero, metrics, objections } =
    faqContent;

  return (
    <main className={styles.surface}>
      <section className={styles.heroSection}>
        <header className={styles.masthead}>
          <Link href="/marketing" className={styles.brandLink}>
            <Wordmark />
          </Link>
          <nav className={styles.nav} aria-label="FAQ sections">
            <a href="#trust">Trust model</a>
            <a href="#objections">Objections</a>
            <a href="#faq">Buyer FAQs</a>
          </nav>
          <div className={styles.headerActions}>
            <Link href="/marketing" className={styles.secondaryAction}>
              Marketing preview
            </Link>
            <Link href="/brief" className={styles.primaryAction}>
              Start a brief
            </Link>
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
              <a href="#objections" className={styles.primaryAction}>
                {hero.primaryAction}
              </a>
              <a href="#faq" className={styles.secondaryAction}>
                {hero.secondaryAction}
              </a>
            </div>
            <p className={styles.heroSupport}>{hero.support}</p>

            <dl className={styles.metricGrid}>
              {metrics.map((metric) => (
                <div key={metric.label} className={styles.metricCard}>
                  <dt>{metric.label}</dt>
                  <dd>{metric.value}</dd>
                  <p>{metric.note}</p>
                </div>
              ))}
            </dl>
          </div>

          <aside className={styles.heroPanel}>
            <div className={styles.heroPanelInner}>
              <p className={styles.panelEyebrow}>What buyers usually need to verify</p>
              <h2>Is this credible, controllable, and safe to start?</h2>
              <p>
                The buyer-trust conversation is usually less about whether the
                work exists and more about whether the operating model will stay
                legible once somebody else is inside it.
              </p>
              <ul className={styles.noteList}>
                {closingNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section id="trust" className={styles.section}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>01 / Trust model</p>
          <div>
            <h2>
              Autharis is designed to make the human layer <em>inspectable.</em>
            </h2>
            <p>
              The core promise is not just faster help. It is faster help that
              still keeps scope, approvals, and handoffs visible enough for a
              cautious buyer to say yes.
            </p>
          </div>
        </div>

        <div className={styles.commitmentGrid}>
          {commitments.map((commitment) => (
            <article key={commitment.title} className={styles.commitmentCard}>
              <p className={styles.panelEyebrow}>{commitment.eyebrow}</p>
              <h3>{commitment.title}</h3>
              <p>{commitment.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="objections" className={`${styles.section} ${styles.objectionSection}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>02 / Buyer objections</p>
          <div>
            <h2>
              The real objections are about risk, not curiosity. <em>Answer them directly.</em>
            </h2>
            <p>
              These are the concerns that tend to sit behind a cautious first
              meeting. The route treats them as reasonable, then answers them
              with structure instead of sales language.
            </p>
          </div>
        </div>

        <div className={styles.objectionGrid}>
          {objections.map((objection) => (
            <article key={objection.objection} className={styles.objectionCard}>
              <p className={styles.objectionEyebrow}>{objection.eyebrow}</p>
              <h3>{objection.objection}</h3>
              <p className={styles.objectionResponse}>{objection.response}</p>
              <p className={styles.objectionProof}>{objection.proof}</p>
              <ul className={styles.signalList}>
                {objection.signals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className={styles.section}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>03 / Buyer FAQ</p>
          <div>
            <h2>
              Practical answers for the team that wants to move, but wants to
              move <em>carefully.</em>
            </h2>
            <p>
              Organized around fit, operator trust, operating visibility, and
              cautious rollout so the route can support both first calls and
              internal buyer review.
            </p>
          </div>
        </div>

        <div className={styles.faqGrid}>
          {faqSections.map((section) => (
            <article key={section.id} className={styles.faqCard}>
              <p className={styles.panelEyebrow}>{section.eyebrow}</p>
              <h3>{section.title}</h3>
              <p className={styles.faqSummary}>{section.summary}</p>
              <div className={styles.faqList}>
                {section.items.map((item) => (
                  <details key={item.question} className={styles.faqItem}>
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.finalSection}>
        <div className={styles.finalCard}>
          <div>
            <p className={styles.sectionIndex}>04 / Next move</p>
            <h2>
              If the queue is already real, the best next step is not a longer
              deck. It is a clearer brief.
            </h2>
            <p>
              Bring the workflow, the systems, the edge cases, and the person
              who can approve hours. Autharis can help turn that into a first
              lane that is narrow enough to trust and useful enough to matter.
            </p>
          </div>
          <div className={styles.heroActions}>
            <Link href="/brief" className={styles.primaryAction}>
              Start a brief
              <ArrowUpRight />
            </Link>
            <Link href="/marketing" className={styles.secondaryAction}>
              Return to marketing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
