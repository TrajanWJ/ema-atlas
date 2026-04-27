import { disputes, statusTone } from "@/lib/admin/data";

import styles from "./admin.module.css";

function severityBadge(severity: "critical" | "elevated" | "moderate") {
  const tone = statusTone(severity);
  if (tone === "critical") return `${styles.badge} ${styles.badgeCritical}`;
  if (tone === "warning") return `${styles.badge} ${styles.badgeWarning}`;
  return `${styles.badge} ${styles.badgeMuted}`;
}

export function AdminDisputesView() {
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Case desk</span>
          <h2 className={styles.pageTitle}>Disputes</h2>
          <p className={styles.pageDescription}>
            Timesheet and approval issues routed into one operating view with owner, amount at risk, and next checkpoint.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.button}>Send reminder</button>
          <button className={`${styles.button} ${styles.buttonPrimary}`}>Escalate to finance</button>
        </div>
      </header>

      <section className={styles.gridTwo}>
        {disputes.map((entry) => (
          <article className={styles.panel} key={entry.id}>
            <div className={styles.panelTitleRow}>
              <div>
                <div className={styles.queueMeta}>
                  <span className={severityBadge(entry.severity)}>{entry.severity}</span>
                  <span>{entry.id}</span>
                </div>
                <h3 className={styles.panelTitle}>{entry.issue}</h3>
                <p className={styles.panelHint}>
                  {entry.client} vs {entry.talent}
                </p>
              </div>
              <div>
                <strong>{entry.amountAtRisk}</strong>
                <div className={styles.panelHint}>Owner: {entry.owner}</div>
              </div>
            </div>

            <div className={styles.queueMeta}>
              <span>Opened {entry.openedAt}</span>
              <span>Checkpoint {entry.nextCheckpoint}</span>
            </div>

            <div className={styles.timeline}>
              {entry.updates.map((update) => (
                <div className={styles.timelineItem} key={`${entry.id}-${update.label}`}>
                  <strong>{update.label}</strong>
                  <div>{update.detail}</div>
                  <div className={styles.panelHint}>{update.at}</div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
