import Link from "next/link";

import { type MatchingRunDossier, type MatchingDossierTone } from "@/lib/admin/matching";

import adminStyles from "../admin.module.css";
import styles from "./matching-run-detail.module.css";

function metricToneClass(tone: MatchingDossierTone) {
  if (tone === "critical") return styles.metricCritical;
  if (tone === "watch") return styles.metricWatch;
  return styles.metricHealthy;
}

function concernBadgeClass(severity: "critical" | "elevated" | "moderate") {
  if (severity === "critical") return `${adminStyles.badge} ${adminStyles.badgeCritical}`;
  if (severity === "elevated") return `${adminStyles.badge} ${adminStyles.badgeWarning}`;
  return `${adminStyles.badge} ${adminStyles.badgeMuted}`;
}

function checklistStatusClass(status: "complete" | "active" | "queued") {
  if (status === "complete") return styles.statusComplete;
  if (status === "active") return styles.statusActive;
  return styles.statusQueued;
}

function releaseStepClass(status: "complete" | "current" | "upcoming") {
  if (status === "complete") return styles.stepComplete;
  if (status === "current") return styles.stepCurrent;
  return styles.stepUpcoming;
}

export function MatchingRunDetailView({ run }: { run: MatchingRunDossier }) {
  return (
    <div className={adminStyles.page}>
      <div className={styles.topbar}>
        <Link href="/admin/matching" className={styles.backLink}>
          Back to matching review
        </Link>
        <span className={styles.caseMeta}>
          {run.id} · {run.requestId}
        </span>
      </div>

      <header className={`${adminStyles.panel} ${styles.hero}`}>
        <div className={styles.heroHeader}>
          <div className={styles.heroCopy}>
            <div className={adminStyles.queueMeta}>
              <span className={`${adminStyles.badge} ${adminStyles.badgeElevated}`}>{run.stage}</span>
              <span>{run.client}</span>
              <span>{run.generatedAt}</span>
            </div>
            <span className={adminStyles.eyebrow}>Matching dossier</span>
            <h2 className={adminStyles.pageTitle}>{run.requestTitle}</h2>
            <p className={adminStyles.pageDescription}>{run.summary}</p>
          </div>

          <div className={styles.heroCard}>
            <p className={styles.heroLabel}>Release instruction</p>
            <strong className={styles.heroValue}>{run.releaseInstruction}</strong>
            <p className={styles.heroHint}>Decision deadline {run.decisionDeadline}</p>
          </div>
        </div>

        <dl className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <dt>Account owner</dt>
            <dd>{run.accountOwner}</dd>
          </div>
          <div className={styles.metaItem}>
            <dt>Service line</dt>
            <dd>{run.serviceLine}</dd>
          </div>
          <div className={styles.metaItem}>
            <dt>Coverage window</dt>
            <dd>{run.coverageWindow}</dd>
          </div>
          <div className={styles.metaItem}>
            <dt>Budget range</dt>
            <dd>{run.budgetRange}</dd>
          </div>
          <div className={styles.metaItem}>
            <dt>Shift pattern</dt>
            <dd>{run.shiftPattern}</dd>
          </div>
          <div className={styles.metaItem}>
            <dt>Reviewer</dt>
            <dd>{run.reviewer}</dd>
          </div>
        </dl>
      </header>

      <section className={styles.snapshotGrid} aria-label="Run snapshot">
        {run.snapshots.map((snapshot) => (
          <article className={styles.snapshotCard} key={snapshot.label}>
            <p className={styles.snapshotLabel}>{snapshot.label}</p>
            <p className={styles.snapshotValue}>{snapshot.value}</p>
            <p className={styles.snapshotNote}>{snapshot.note}</p>
          </article>
        ))}
      </section>

      <section className={styles.metricGrid} aria-label="Run metrics">
        {run.metrics.map((metric) => (
          <article className={styles.metricCard} key={metric.label}>
            <p className={styles.metricLabel}>{metric.label}</p>
            <p className={styles.metricValue}>{metric.value}</p>
            <p className={metricToneClass(metric.tone)}>{metric.note}</p>
          </article>
        ))}
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.primaryColumn}>
          <article className={adminStyles.panel}>
            <div className={adminStyles.panelTitleRow}>
              <div>
                <h3 className={adminStyles.panelTitle}>Operator recommendation</h3>
                <p className={adminStyles.panelHint}>The human rationale layered on top of the raw shortlist output.</p>
              </div>
            </div>
            <p className={styles.recommendation}>{run.operatorRecommendation}</p>
            <div className={styles.noteList}>
              {run.panelNotes.map((note) => (
                <div className={styles.noteCard} key={note}>
                  <p>{note}</p>
                </div>
              ))}
            </div>
          </article>

          <article className={adminStyles.panel}>
            <div className={adminStyles.panelTitleRow}>
              <div>
                <h3 className={adminStyles.panelTitle}>Candidate panel</h3>
                <p className={adminStyles.panelHint}>What the admin desk should carry into release, hold, or rerun decisions.</p>
              </div>
            </div>

            <div className={styles.candidateList}>
              {run.candidates.map((candidate) => (
                <section className={styles.candidateCard} key={candidate.id}>
                  <div className={styles.candidateHeader}>
                    <div className={adminStyles.person}>
                      <span className={adminStyles.avatar}>{candidate.initials}</span>
                      <div>
                        <h4 className={styles.candidateName}>
                          #{candidate.rank} {candidate.name}
                        </h4>
                        <p className={styles.candidateMeta}>
                          {candidate.score} fit · {candidate.rate} · {candidate.availability}
                        </p>
                      </div>
                    </div>
                    <span className={`${adminStyles.badge} ${adminStyles.badgeRoutine}`}>{candidate.panelVerdict}</span>
                  </div>

                  <p className={styles.candidateAlignment}>{candidate.alignment}</p>

                  <div className={styles.candidateGrid}>
                    <div className={styles.candidateColumn}>
                      <p className={styles.columnLabel}>Strengths</p>
                      <ul className={adminStyles.bulletList}>
                        {candidate.strengths.map((strength) => (
                          <li key={strength}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div className={styles.candidateColumn}>
                      <p className={styles.columnLabel}>Evidence</p>
                      <ul className={adminStyles.bulletList}>
                        {candidate.evidence.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className={styles.candidateFooter}>
                    <p className={styles.riskLine}>Watchouts: {candidate.risks.join(", ")}</p>
                    <div>
                      <p className={styles.columnLabel}>Interview focus</p>
                      <ul className={adminStyles.bulletList}>
                        {candidate.interviewFocus.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </article>

          <article className={adminStyles.panel}>
            <div className={adminStyles.panelTitleRow}>
              <div>
                <h3 className={adminStyles.panelTitle}>Calibration signals</h3>
                <p className={adminStyles.panelHint}>Context that explains whether the engine output should be trusted, held, or rerun.</p>
              </div>
            </div>

            <div className={styles.signalGrid}>
              {run.calibrationSignals.map((signal) => (
                <section className={styles.signalCard} key={signal.label}>
                  <p className={styles.signalLabel}>{signal.label}</p>
                  <p className={styles.signalValue}>{signal.value}</p>
                  <p className={styles.signalNote}>{signal.note}</p>
                </section>
              ))}
            </div>
          </article>
        </div>

        <aside className={styles.sidebarColumn}>
          <article className={adminStyles.panel}>
            <div className={adminStyles.panelTitleRow}>
              <div>
                <h3 className={adminStyles.panelTitle}>Release checklist</h3>
                <p className={adminStyles.panelHint}>Small actions that have to finish before the run leaves the desk.</p>
              </div>
            </div>

            <div className={styles.checklist}>
              {run.checklist.map((item) => (
                <section className={styles.checklistItem} key={item.label}>
                  <div className={styles.checklistHeader}>
                    <strong>{item.label}</strong>
                    <span className={checklistStatusClass(item.status)}>{item.status}</span>
                  </div>
                  <p className={styles.checklistMeta}>
                    {item.owner} · Due {item.due}
                  </p>
                </section>
              ))}
            </div>
          </article>

          <article className={adminStyles.panel}>
            <div className={adminStyles.panelTitleRow}>
              <div>
                <h3 className={adminStyles.panelTitle}>Release path</h3>
                <p className={adminStyles.panelHint}>Where the run sits between engine output and client send.</p>
              </div>
            </div>

            <div className={styles.stepList}>
              {run.releaseSteps.map((step) => (
                <section className={`${styles.stepCard} ${releaseStepClass(step.status)}`} key={step.label}>
                  <div className={styles.stepHeader}>
                    <strong>{step.label}</strong>
                    <span>{step.owner}</span>
                  </div>
                  <p className={styles.stepDetail}>{step.detail}</p>
                </section>
              ))}
            </div>
          </article>

          <article className={adminStyles.panel}>
            <div className={adminStyles.panelTitleRow}>
              <div>
                <h3 className={adminStyles.panelTitle}>Risk watch</h3>
                <p className={adminStyles.panelHint}>Reasons this run could still slip or confuse the client packet.</p>
              </div>
            </div>

            <div className={styles.concernList}>
              {run.concerns.map((concern) => (
                <section className={styles.concernCard} key={concern.title}>
                  <div className={styles.concernHeader}>
                    <h4 className={styles.concernTitle}>{concern.title}</h4>
                    <span className={concernBadgeClass(concern.severity)}>{concern.severity}</span>
                  </div>
                  <p className={styles.concernDetail}>{concern.detail}</p>
                </section>
              ))}
            </div>
          </article>

          <article className={adminStyles.panel}>
            <div className={adminStyles.panelTitleRow}>
              <div>
                <h3 className={adminStyles.panelTitle}>Activity log</h3>
                <p className={adminStyles.panelHint}>Captured admin milestones for this run.</p>
              </div>
            </div>

            <div className={adminStyles.timeline}>
              {run.timeline.map((event) => (
                <div className={adminStyles.timelineItem} key={`${event.at}-${event.label}`}>
                  <strong>{event.label}</strong>
                  <div>{event.detail}</div>
                  <div className={adminStyles.panelHint}>{event.at}</div>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
