import Link from "next/link";

import { getWeeklyWorkbook, type WorkbookTone } from "@/lib/admin/reports";

import styles from "./weekly-workbook.module.css";

function metricDeltaClass(tone: WorkbookTone) {
  if (tone === "critical") return styles.metricDeltaCritical;
  if (tone === "flat") return styles.metricDeltaWarning;
  if (tone === "down") return styles.metricDeltaMuted;
  return styles.metricDelta;
}

function pressureClass(pressure: string) {
  if (pressure === "High demand, healthy supply") return styles.pill;
  if (pressure === "Tight") return styles.pillWarning;
  return styles.pillMuted;
}

function actionStatusClass(status: "active" | "watch" | "queued") {
  if (status === "active") return styles.statusActive;
  if (status === "watch") return styles.statusWatch;
  return styles.statusQueued;
}

function riskSeverityClass(severity: "critical" | "elevated" | "moderate") {
  if (severity === "critical") return styles.severityCritical;
  if (severity === "elevated") return styles.severityElevated;
  return styles.severityModerate;
}

export function WeeklyWorkbookView() {
  const workbook = getWeeklyWorkbook();

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <article className={styles.heroPanel}>
          <span className={styles.eyebrow}>Weekly workbook</span>
          <div className={styles.titleRow}>
            <div className={styles.titleBlock}>
              <h2 className={styles.title}>{workbook.reportingWindow}</h2>
              <p className={styles.summary}>{workbook.summary}</p>
            </div>
            <div className={styles.meta}>
              <div>
                <p className={styles.metaLabel}>Owner</p>
                <p className={styles.metaValue}>{workbook.owner}</p>
              </div>
              <div>
                <p className={styles.metaLabel}>Generated</p>
                <p className={styles.metaValue}>{workbook.generatedAt}</p>
              </div>
              <div>
                <p className={styles.metaLabel}>Packet</p>
                <p className={styles.metaValue}>{workbook.boardVersion}</p>
              </div>
            </div>
          </div>
          <div className={styles.heroFooter}>
            <Link href="/admin/reports" className={styles.ghostButton}>
              Back to reporting
            </Link>
            <Link href="/admin/disputes/DC-017" className={styles.linkButton}>
              Open highest-risk case
            </Link>
          </div>
        </article>

        <aside className={styles.snapshotPanel}>
          <div className={styles.sectionTitleRow}>
            <div>
              <h3 className={styles.sectionTitle}>Packet snapshot</h3>
              <p className={styles.sectionHint}>Fast context for handoff, finance, and board-export prep.</p>
            </div>
          </div>
          <div className={styles.snapshotList}>
            {workbook.snapshots.map((snapshot) => (
              <div className={styles.snapshotItem} key={snapshot.label}>
                <p className={styles.snapshotLabel}>{snapshot.label}</p>
                <p className={styles.snapshotValue}>{snapshot.value}</p>
                <p className={styles.snapshotNote}>{snapshot.note}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className={styles.metricGrid}>
        {workbook.metrics.map((metric) => (
          <article className={styles.metricCard} key={metric.label}>
            <p className={styles.metricLabel}>{metric.label}</p>
            <p className={styles.metricValue}>{metric.value}</p>
            <p className={metricDeltaClass(metric.tone)}>{metric.delta}</p>
            <p className={styles.metricNote}>{metric.note}</p>
          </article>
        ))}
      </section>

      <section className={styles.mainGrid}>
        <div className={styles.column}>
          <article className={styles.section}>
            <div className={styles.sectionTitleRow}>
              <div>
                <h3 className={styles.sectionTitle}>Executive readout</h3>
                <p className={styles.sectionHint}>Board-ready language that explains what moved and what still needs operator attention.</p>
              </div>
            </div>
            <div className={styles.highlightList}>
              {workbook.highlights.map((highlight) => (
                <div className={styles.highlightItem} key={highlight.title}>
                  <p className={styles.highlightTitle}>{highlight.title}</p>
                  <p className={styles.highlightDetail}>{highlight.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.cadencePanel}>
            <div className={styles.sectionTitleRow}>
              <div>
                <h3 className={styles.sectionTitle}>Daily operating cadence</h3>
                <p className={styles.sectionHint}>Queue load, dispute pressure, and placement rhythm across the review week.</p>
              </div>
            </div>
            <table className={styles.cadenceTable}>
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Queue</th>
                  <th scope="col">Disputes</th>
                  <th scope="col">Placements</th>
                  <th scope="col">Margin</th>
                </tr>
              </thead>
              <tbody>
                {workbook.cadence.map((row) => (
                  <tr key={row.day}>
                    <td>
                      <div className={styles.cadenceDay}>{row.day}</div>
                      <div className={styles.cadenceNote}>{row.note}</div>
                    </td>
                    <td>{row.queue}</td>
                    <td>{row.disputes}</td>
                    <td>{row.placements}</td>
                    <td>{row.margin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className={styles.coveragePanel}>
            <div className={styles.sectionTitleRow}>
              <div>
                <h3 className={styles.sectionTitle}>Marketplace coverage</h3>
                <p className={styles.sectionHint}>Regional supply mix and where operator attention is likely to matter next week.</p>
              </div>
            </div>
            <div className={styles.coverageGrid}>
              {workbook.coverage.map((region) => (
                <div className={styles.coverageCard} key={region.label}>
                  <div className={styles.coverageLabel}>
                    <p className={styles.coverageName}>{region.label}</p>
                    <p className={styles.coverageShare}>{region.talentShare}% share</p>
                  </div>
                  <div className={styles.coveragePills}>
                    <span className={styles.pill}>Fill rate {region.fillRate}</span>
                    <span className={pressureClass(region.pressure)}>{region.pressure}</span>
                  </div>
                  <p className={styles.coverageSignal}>{region.signal}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <aside className={styles.sidebar}>
          <article className={styles.sidebarCard}>
            <div className={styles.sectionTitleRow}>
              <div>
                <h3 className={styles.sectionTitle}>Finance guardrails</h3>
                <p className={styles.sectionHint}>What finance and ops need to keep in sync before the packet is exported.</p>
              </div>
            </div>
            <div className={styles.financeList}>
              {workbook.finance.map((item) => (
                <div className={styles.financeItem} key={item.label}>
                  <p className={styles.financeLabel}>
                    {item.label} · {item.value}
                  </p>
                  <p className={styles.financeNote}>{item.note}</p>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.sidebarCard}>
            <div className={styles.sectionTitleRow}>
              <div>
                <h3 className={styles.sectionTitle}>Priority actions</h3>
                <p className={styles.sectionHint}>Operator-owned moves that unblock the board packet and next-week readiness.</p>
              </div>
            </div>
            <div className={styles.actionList}>
              {workbook.actions.map((action) => (
                <div className={styles.actionItem} key={action.title}>
                  <div className={styles.actionHeader}>
                    <p className={styles.actionTitle}>{action.title}</p>
                    <span className={actionStatusClass(action.status)}>{action.status}</span>
                  </div>
                  <p className={styles.actionMeta}>
                    {action.owner} · Due {action.due}
                  </p>
                  <p className={styles.actionDetail}>{action.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.riskPanel}>
            <div className={styles.sectionTitleRow}>
              <div>
                <h3 className={styles.sectionTitle}>Risk watch</h3>
                <p className={styles.sectionHint}>The issues most likely to distort finance, trust, or next-week marketplace coverage.</p>
              </div>
            </div>
            <div className={styles.riskList}>
              {workbook.risks.map((risk) => (
                <div className={styles.riskItem} key={risk.title}>
                  <div className={styles.actionHeader}>
                    <p className={styles.riskTitle}>{risk.title}</p>
                    <span className={riskSeverityClass(risk.severity)}>{risk.severity}</span>
                  </div>
                  <p className={styles.riskDetail}>{risk.detail}</p>
                  <p className={styles.riskMeta}>Mitigation</p>
                  <p className={styles.riskMitigation}>{risk.mitigation}</p>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
