import Link from "next/link";

import { type DisputeCaseDetail } from "@/lib/admin/disputes";

import adminStyles from "../admin.module.css";
import styles from "./dispute-detail.module.css";

function severityBadge(severity: DisputeCaseDetail["severity"]) {
  if (severity === "critical") return `${adminStyles.badge} ${adminStyles.badgeCritical}`;
  if (severity === "elevated") return `${adminStyles.badge} ${adminStyles.badgeWarning}`;
  return `${adminStyles.badge} ${adminStyles.badgeMuted}`;
}

function stepTone(status: "complete" | "current" | "upcoming") {
  if (status === "complete") return styles.stepComplete;
  if (status === "current") return styles.stepCurrent;
  return styles.stepUpcoming;
}

export function DisputeDetailView({ dispute }: { dispute: DisputeCaseDetail }) {
  return (
    <div className={adminStyles.page}>
      <div className={styles.topbar}>
        <Link href="/admin/disputes" className={styles.backLink}>
          Back to dispute desk
        </Link>
        <span className={styles.caseMeta}>Case {dispute.id}</span>
      </div>

      <header className={`${adminStyles.panel} ${styles.hero}`}>
        <div className={styles.heroContent}>
          <div className={adminStyles.queueMeta}>
            <span className={severityBadge(dispute.severity)}>{dispute.severity}</span>
            <span>{dispute.engagement.id}</span>
            <span>{dispute.serviceWindow}</span>
          </div>

          <div className={styles.heroHeader}>
            <div>
              <span className={adminStyles.eyebrow}>Case drilldown</span>
              <h2 className={adminStyles.pageTitle}>{dispute.issue}</h2>
              <p className={adminStyles.pageDescription}>{dispute.summary}</p>
            </div>

            <div className={styles.amountCard}>
              <span className={styles.amountLabel}>Amount at risk</span>
              <strong className={styles.amountValue}>{dispute.amountAtRisk}</strong>
              <span className={styles.amountHint}>Next checkpoint {dispute.nextCheckpoint}</span>
            </div>
          </div>

          <dl className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <dt>Client</dt>
              <dd>{dispute.client}</dd>
            </div>
            <div className={styles.metaItem}>
              <dt>Talent</dt>
              <dd>{dispute.talent}</dd>
            </div>
            <div className={styles.metaItem}>
              <dt>Owner</dt>
              <dd>{dispute.owner}</dd>
            </div>
            <div className={styles.metaItem}>
              <dt>Opened</dt>
              <dd>{dispute.openedAt}</dd>
            </div>
            <div className={styles.metaItem}>
              <dt>Service line</dt>
              <dd>{dispute.engagement.role}</dd>
            </div>
            <div className={styles.metaItem}>
              <dt>Policy status</dt>
              <dd>{dispute.policyStatus}</dd>
            </div>
          </dl>
        </div>
      </header>

      <section className={styles.metricsGrid} aria-label="Case metrics">
        {dispute.metrics.map((metric) => (
          <article className={styles.metricCard} key={metric.label}>
            <span className={styles.metricLabel}>{metric.label}</span>
            <strong className={styles.metricValue}>{metric.value}</strong>
            <p className={styles.metricNote}>{metric.note}</p>
          </article>
        ))}
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.primaryColumn}>
          <article className={adminStyles.panel}>
            <div className={adminStyles.panelTitleRow}>
              <div>
                <h3 className={adminStyles.panelTitle}>Participant positions</h3>
                <p className={adminStyles.panelHint}>What each side is asking for and when they need a response.</p>
              </div>
            </div>

            <div className={styles.participantList}>
              {dispute.participants.map((participant) => (
                <section className={styles.participantCard} key={participant.role}>
                  <div className={styles.participantHeader}>
                    <div>
                      <p className={styles.participantRole}>{participant.role}</p>
                      <h4 className={styles.participantName}>{participant.name}</h4>
                    </div>
                    <span className={styles.participantTime}>{participant.nextResponse}</span>
                  </div>
                  <p className={styles.participantStance}>{participant.stance}</p>
                </section>
              ))}
            </div>
          </article>

          <article className={adminStyles.panel}>
            <div className={adminStyles.panelTitleRow}>
              <div>
                <h3 className={adminStyles.panelTitle}>Evidence bundle</h3>
                <p className={adminStyles.panelHint}>Source material already attached to the operator review.</p>
              </div>
            </div>

            <div className={styles.evidenceList}>
              {dispute.evidence.map((item) => (
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
                <h3 className={adminStyles.panelTitle}>Resolution paths</h3>
                <p className={adminStyles.panelHint}>Operator choices prepared for the final ruling.</p>
              </div>
            </div>

            <div className={styles.resolutionList}>
              {dispute.resolutionPaths.map((option) => (
                <section
                  className={`${styles.resolutionCard} ${option.recommended ? styles.resolutionCardRecommended : ""}`}
                  key={option.title}
                >
                  <div className={styles.resolutionHeader}>
                    <div>
                      <h4 className={styles.resolutionTitle}>{option.title}</h4>
                      <p className={styles.resolutionPayout}>{option.payout}</p>
                    </div>
                    {option.recommended ? <span className={styles.recommendedBadge}>Recommended</span> : null}
                  </div>
                  <p className={styles.resolutionDetail}>{option.rationale}</p>
                  <p className={styles.resolutionRisk}>Risk: {option.risk}</p>
                </section>
              ))}
            </div>
          </article>
        </div>

        <div className={styles.sidebarColumn}>
          <article className={adminStyles.panel}>
            <div className={adminStyles.panelTitleRow}>
              <div>
                <h3 className={adminStyles.panelTitle}>Operator path</h3>
                <p className={adminStyles.panelHint}>Current case flow from intake through payout instruction.</p>
              </div>
            </div>

            <div className={styles.stepList}>
              {dispute.steps.map((step) => (
                <section className={`${styles.stepCard} ${stepTone(step.status)}`} key={step.label}>
                  <div className={styles.stepHeader}>
                    <strong>{step.label}</strong>
                    <span>{step.eta}</span>
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
                <h3 className={adminStyles.panelTitle}>Activity log</h3>
                <p className={adminStyles.panelHint}>Captured updates from the active dispute thread.</p>
              </div>
            </div>

            <div className={adminStyles.timeline}>
              {dispute.updates.map((update) => (
                <div className={adminStyles.timelineItem} key={`${dispute.id}-${update.label}`}>
                  <strong>{update.label}</strong>
                  <div>{update.detail}</div>
                  <div className={adminStyles.panelHint}>{update.at}</div>
                </div>
              ))}
            </div>
          </article>

          <article className={adminStyles.panel}>
            <div className={adminStyles.panelTitleRow}>
              <div>
                <h3 className={adminStyles.panelTitle}>Next actions</h3>
                <p className={adminStyles.panelHint}>Checklist to close the case cleanly.</p>
              </div>
            </div>

            <ul className={styles.actionList}>
              {dispute.nextActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
