import Link from "next/link";

import { TalentShell } from "@/components/talent/TalentShell";
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronRightIcon,
  PulseIcon,
  SparklesIcon,
} from "@/components/talent/TalentIcons";
import { type OpportunityDetailRecord } from "@/lib/talent/opportunity-detail";

import styles from "./OpportunityDossier.module.css";

type OpportunityDossierProps = {
  detail: OpportunityDetailRecord;
};

export function OpportunityDossier({ detail }: OpportunityDossierProps) {
  const { opportunity, dossier, relatedOpportunities, budgetLabel, availabilityContext } = detail;

  return (
    <TalentShell active="opportunities">
      <div className={styles.stack}>
        <section className={`paper talent-hero ${styles.hero}`}>
          <div className="talent-hero__copy">
            <div className="talent-breadcrumbs">
              <span>Talent</span>
              <ChevronRightIcon size={12} />
              <Link className={styles.backLink} href="/talent/opportunities">
                Opportunities
              </Link>
              <ChevronRightIcon size={12} />
              <span>{opportunity.client}</span>
            </div>

            <div className={styles.heroMeta}>
              <span className="badge">{opportunity.category}</span>
              <span className={styles.statusNote}>
                <PulseIcon size={14} />
                {availabilityContext}
              </span>
            </div>

            <h2>{opportunity.title}</h2>
            <p>{dossier.summary}</p>
            <p className="talent-muted">{dossier.mandate}</p>

            <div className={styles.heroActions}>
              <Link className={`btn btn-ghost ${styles.heroActionLink}`} href="/talent/opportunities">
                <ChevronRightIcon size={14} style={{ transform: "rotate(180deg)" }} />
                Back to shortlist
              </Link>
              <button className="btn btn-primary" type="button">
                Express interest
                <ArrowRightIcon size={14} />
              </button>
            </div>
          </div>

          <div className={styles.heroRail}>
            <div className={styles.summaryCard}>
              <span>Fit score</span>
              <strong>{opportunity.matchScore}</strong>
              <p>{opportunity.rationale}</p>
            </div>
            <div className={styles.summaryCard}>
              <span>Compensation</span>
              <strong>{budgetLabel}</strong>
              <p>{opportunity.duration}</p>
            </div>
            <div className={styles.summaryCard}>
              <span>Format</span>
              <strong>{opportunity.format}</strong>
              <p>{opportunity.timezone}</p>
            </div>
          </div>
        </section>

        <div className={styles.grid}>
          <div className={styles.mainColumn}>
            <section className="paper">
              <div className={styles.sectionHead}>
                <div>
                  <div className="eyebrow">Why now</div>
                  <h3>Opportunity brief</h3>
                  <p className={styles.muted}>{dossier.whyNow}</p>
                </div>
                <span className={styles.sectionIcon}>
                  <SparklesIcon size={16} />
                </span>
              </div>

              <div className={styles.snapshotGrid}>
                {dossier.clientSnapshot.map((item) => (
                  <div className={styles.snapshotCard} key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="paper">
              <div className={styles.sectionHead}>
                <div>
                  <div className="eyebrow">First 30 days</div>
                  <h3>What success looks like early</h3>
                </div>
                <span className={styles.sectionIcon}>
                  <CheckIcon size={16} />
                </span>
              </div>
              <ul className={styles.list}>
                {dossier.firstThirtyDays.map((item) => (
                  <li className={styles.listRow} key={item}>
                    <span className={styles.signalLabel}>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="paper">
              <div className={styles.sectionHead}>
                <div>
                  <div className="eyebrow">Workflow cadence</div>
                  <h3>How the week is structured</h3>
                </div>
                <span className={styles.sectionIcon}>
                  <PulseIcon size={16} />
                </span>
              </div>
              <ul className={styles.list}>
                {dossier.workflowCadence.map((item) => (
                  <li className={styles.listRow} key={item.label}>
                    <span className={styles.cadenceLabel}>{item.label}</span>
                    <span className={styles.muted}>{item.detail}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="paper">
              <div className={styles.sectionHead}>
                <div>
                  <div className="eyebrow">Application packet</div>
                  <h3>Signals to reinforce before you say yes</h3>
                </div>
                <span className={styles.sectionIcon}>
                  <ArrowRightIcon size={16} />
                </span>
              </div>
              <ul className={styles.list}>
                {dossier.applicationNotes.map((item) => (
                  <li className={styles.listRow} key={item}>
                    <span className={styles.muted}>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className={styles.sideColumn}>
            <section className="paper">
              <div className={styles.sectionHead}>
                <div>
                  <div className="eyebrow">Fit breakdown</div>
                  <h3>Where the match is strongest</h3>
                </div>
              </div>
              <div className={styles.signalList}>
                {dossier.fitSignals.map((signal) => (
                  <article className={styles.signalCard} key={signal.label}>
                    <div className={styles.signalTop}>
                      <span className={styles.signalLabel}>{signal.label}</span>
                      <span className={styles.signalScore}>{signal.score}</span>
                    </div>
                    <div className={styles.signalBar}>
                      <span style={{ width: `${signal.score}%` }} />
                    </div>
                    <p className={styles.muted}>{signal.detail}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="paper">
              <div className={styles.sectionHead}>
                <div>
                  <div className="eyebrow">Stakeholders</div>
                  <h3>Who this role serves</h3>
                </div>
              </div>
              <div className={styles.signalList}>
                {dossier.stakeholders.map((stakeholder) => (
                  <article className={styles.stakeholderCard} key={stakeholder.name}>
                    <div className={styles.stakeholderName}>{stakeholder.name}</div>
                    <p className={styles.muted}>
                      {stakeholder.role} · {stakeholder.detail}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="paper">
              <div className={styles.sectionHead}>
                <div>
                  <div className="eyebrow">Interview plan</div>
                  <h3>Expected evaluation path</h3>
                </div>
              </div>
              <ul className={styles.list}>
                {dossier.interviewPlan.map((step) => (
                  <li className={styles.listRow} key={`${step.stage}-${step.owner}`}>
                    <span className={styles.stageLabel}>{step.stage}</span>
                    <span className={styles.muted}>
                      {step.owner} · {step.timing}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="paper">
              <div className={styles.sectionHead}>
                <div>
                  <div className="eyebrow">Watchouts</div>
                  <h3>What to validate before committing</h3>
                </div>
              </div>
              <ul className={styles.list}>
                {dossier.watchouts.map((item) => (
                  <li className={styles.listRow} key={item}>
                    <span className={styles.muted}>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="paper">
              <div className={styles.sectionHead}>
                <div>
                  <div className="eyebrow">Related matches</div>
                  <h3>Keep the rest of the shortlist visible</h3>
                </div>
              </div>
              <div className={styles.signalList}>
                {relatedOpportunities.map((related) => (
                  <Link
                    className={styles.relatedCard}
                    href={`/talent/opportunities/${related.id}`}
                    key={related.id}
                  >
                    <div className={styles.relatedTitle}>{related.title}</div>
                    <p className={styles.muted}>
                      {related.client} · {related.hoursPerWeek} hrs/week
                    </p>
                    <div className={styles.relatedMeta}>
                      <strong>{related.matchScore} fit</strong>
                      <span className="badge">{related.category}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="paper">
              <div className={styles.sectionHead}>
                <div>
                  <div className="eyebrow">Why it stands out</div>
                  <h3>Quick dossier notes</h3>
                </div>
              </div>
              <ul className={styles.list}>
                {dossier.highlights.map((item) => (
                  <li className={styles.listRow} key={item}>
                    <span className={styles.muted}>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </TalentShell>
  );
}
