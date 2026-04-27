import Link from "next/link";

import { type ActivationQueueDetail } from "@/lib/admin/queue";

import adminStyles from "../admin.module.css";
import styles from "./queue-detail.module.css";

function priorityBadge(priority: ActivationQueueDetail["priority"]) {
  if (priority === "critical") return `${adminStyles.badge} ${adminStyles.badgeCritical}`;
  if (priority === "elevated") return `${adminStyles.badge} ${adminStyles.badgeElevated}`;
  return `${adminStyles.badge} ${adminStyles.badgeRoutine}`;
}

function categoryLabel(category: ActivationQueueDetail["category"]) {
  if (category === "activation") return "Activation";
  if (category === "matching") return "Matching";
  if (category === "dispute") return "Dispute";
  return "Reporting";
}

function stepTone(status: "complete" | "current" | "upcoming") {
  if (status === "complete") return styles.stepComplete;
  if (status === "current") return styles.stepCurrent;
  return styles.stepUpcoming;
}

export function QueueDetailView({ queue }: { queue: ActivationQueueDetail }) {
  return (
    <div className={adminStyles.page}>
      <div className={styles.topbar}>
        <Link href="/admin" className={styles.backLink}>
          Back to activation queue
        </Link>
        <span className={styles.caseMeta}>Queue {queue.id}</span>
      </div>

      <header className={`${adminStyles.panel} ${styles.hero}`}>
        <div className={styles.heroContent}>
          <div className={adminStyles.queueMeta}>
            <span className={priorityBadge(queue.priority)}>{queue.priority}</span>
            <span>{categoryLabel(queue.category)}</span>
            <span>{queue.receivedAt}</span>
            <span>{queue.sla}</span>
          </div>

          <div className={styles.heroHeader}>
            <div className={styles.heroCopy}>
              <span className={adminStyles.eyebrow}>Activation queue drilldown</span>
              <h2 className={adminStyles.pageTitle}>{queue.title}</h2>
              <p className={adminStyles.pageDescription}>{queue.operatorBrief}</p>
            </div>

            <aside className={styles.recommendationCard}>
              <p className={styles.recommendationLabel}>Recommended call</p>
              <strong className={styles.recommendationValue}>{queue.recommendedCall}</strong>
              <p className={styles.recommendationMeta}>
                {queue.reviewLead} · {queue.reviewWindow}
              </p>
            </aside>
          </div>

          <dl className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <dt>Subject</dt>
              <dd>{queue.subject.name}</dd>
            </div>
            <div className={styles.metaItem}>
              <dt>Coverage</dt>
              <dd>{queue.subject.coverage}</dd>
            </div>
            <div className={styles.metaItem}>
              <dt>Status</dt>
              <dd>{queue.status}</dd>
            </div>
            <div className={styles.metaItem}>
              <dt>Owner</dt>
              <dd>{queue.owner}</dd>
            </div>
            <div className={styles.metaItem}>
              <dt>Review lead</dt>
              <dd>{queue.reviewLead}</dd>
            </div>
            <div className={styles.metaItem}>
              <dt>Policy note</dt>
              <dd>{queue.policyNote}</dd>
            </div>
          </dl>
        </div>
      </header>

      <section className={styles.metricGrid} aria-label="Queue metrics">
        {queue.metrics.map((metric) => (
          <article className={styles.metricCard} key={metric.label}>
            <p className={styles.metricLabel}>{metric.label}</p>
            <p className={styles.metricValue}>{metric.value}</p>
            <p className={styles.metricNote}>{metric.note}</p>
          </article>
        ))}
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.primaryColumn}>
          <article className={adminStyles.panel}>
            <div className={adminStyles.panelTitleRow}>
              <div>
                <h3 className={adminStyles.panelTitle}>Record snapshot</h3>
                <p className={adminStyles.panelHint}>The subject currently driving this queue item.</p>
              </div>
            </div>

            <div className={styles.subjectCard}>
              <div className={styles.subjectAvatar}>{queue.subject.initials}</div>
              <div className={styles.subjectBody}>
                <p className={styles.subjectRole}>{queue.subject.role}</p>
                <h3 className={styles.subjectName}>{queue.subject.name}</h3>
                <p className={styles.subjectCoverage}>{queue.subject.coverage}</p>
                <p className={styles.subjectStatus}>{queue.subject.status}</p>
              </div>
            </div>
          </article>

          <article className={adminStyles.panel}>
            <div className={adminStyles.panelTitleRow}>
              <div>
                <h3 className={adminStyles.panelTitle}>Stakeholder context</h3>
                <p className={adminStyles.panelHint}>What each side needs and when they expect a response.</p>
              </div>
            </div>

            <div className={styles.stakeholderList}>
              {queue.stakeholders.map((stakeholder) => (
                <section className={styles.stakeholderCard} key={`${stakeholder.role}-${stakeholder.name}`}>
                  <div className={styles.stakeholderHeader}>
                    <div>
                      <p className={styles.stakeholderRole}>{stakeholder.role}</p>
                      <h4 className={styles.stakeholderName}>{stakeholder.name}</h4>
                    </div>
                    <span className={styles.stakeholderTime}>{stakeholder.responseWindow}</span>
                  </div>
                  <p className={styles.stakeholderDetail}>{stakeholder.detail}</p>
                </section>
              ))}
            </div>
          </article>

          <article className={adminStyles.panel}>
            <div className={adminStyles.panelTitleRow}>
              <div>
                <h3 className={adminStyles.panelTitle}>Evidence bundle</h3>
                <p className={adminStyles.panelHint}>Source material assembled for the operator decision.</p>
              </div>
            </div>

            <div className={styles.evidenceList}>
              {queue.evidence.map((item) => (
                <section className={styles.evidenceCard} key={item.title}>
                  <div className={styles.evidenceMeta}>{item.source}</div>
                  <h4 className={styles.evidenceTitle}>{item.title}</h4>
                  <p className={styles.evidenceDetail}>{item.detail}</p>
                </section>
              ))}
            </div>
          </article>

          <article className={adminStyles.panel}>
            <div className={adminStyles.panelTitleRow}>
              <div>
                <h3 className={adminStyles.panelTitle}>Decision paths</h3>
                <p className={adminStyles.panelHint}>Operator choices prepared before the record leaves the queue.</p>
              </div>
            </div>

            <div className={styles.decisionList}>
              {queue.decisionPaths.map((path) => (
                <section
                  className={`${styles.decisionCard} ${path.recommended ? styles.decisionCardRecommended : ""}`}
                  key={path.title}
                >
                  <div className={styles.decisionHeader}>
                    <div>
                      <h4 className={styles.decisionTitle}>{path.title}</h4>
                      <p className={styles.decisionOutcome}>{path.outcome}</p>
                    </div>
                    {path.recommended ? <span className={styles.recommendedBadge}>Recommended</span> : null}
                  </div>
                  <p className={styles.decisionDetail}>{path.rationale}</p>
                  <p className={styles.decisionRisk}>Risk: {path.risk}</p>
                </section>
              ))}
            </div>
          </article>
        </div>

        <aside className={styles.sidebarColumn}>
          <article className={adminStyles.panel}>
            <div className={adminStyles.panelTitleRow}>
              <div>
                <h3 className={adminStyles.panelTitle}>Operator path</h3>
                <p className={adminStyles.panelHint}>The queue-to-resolution sequence for this record.</p>
              </div>
            </div>

            <div className={styles.stepList}>
              {queue.timeline.map((step) => (
                <section className={`${styles.stepCard} ${stepTone(step.status)}`} key={step.label}>
                  <div className={styles.stepHeader}>
                    <strong>{step.label}</strong>
                    <span>{step.timing}</span>
                  </div>
                  <p className={styles.stepOwner}>{step.owner}</p>
                  <p className={styles.stepDetail}>{step.detail}</p>
                </section>
              ))}
            </div>
          </article>

          <article className={adminStyles.panel}>
            <div className={adminStyles.panelTitleRow}>
              <div>
                <h3 className={adminStyles.panelTitle}>Related records</h3>
                <p className={adminStyles.panelHint}>Other admin surfaces linked to this queue item.</p>
              </div>
            </div>

            <div className={styles.recordList}>
              {queue.relatedRecords.map((record) => (
                <div className={styles.recordCard} key={`${record.label}-${record.value}`}>
                  <p className={styles.recordLabel}>{record.label}</p>
                  {record.href ? (
                    <Link href={record.href} className={styles.recordLink}>
                      {record.value}
                    </Link>
                  ) : (
                    <p className={styles.recordValue}>{record.value}</p>
                  )}
                </div>
              ))}
            </div>
          </article>

          <article className={adminStyles.panel}>
            <div className={adminStyles.panelTitleRow}>
              <div>
                <h3 className={adminStyles.panelTitle}>Activity log</h3>
                <p className={adminStyles.panelHint}>Recent queue-specific notes tied to this record.</p>
              </div>
            </div>

            <div className={adminStyles.timeline}>
              {queue.activity.map((item) => (
                <div className={adminStyles.timelineItem} key={`${item.label}-${item.at}`}>
                  <strong>{item.label}</strong>
                  <div>{item.detail}</div>
                  <div className={adminStyles.panelHint}>{item.at}</div>
                </div>
              ))}
            </div>
          </article>

          <article className={adminStyles.panel}>
            <div className={adminStyles.panelTitleRow}>
              <div>
                <h3 className={adminStyles.panelTitle}>Next moves</h3>
                <p className={adminStyles.panelHint}>Small actions that close the queue item cleanly.</p>
              </div>
            </div>

            <ul className={styles.actionList}>
              {queue.nextMoves.map((move) => (
                <li key={move}>{move}</li>
              ))}
            </ul>
          </article>
        </aside>
      </section>
    </div>
  );
}
