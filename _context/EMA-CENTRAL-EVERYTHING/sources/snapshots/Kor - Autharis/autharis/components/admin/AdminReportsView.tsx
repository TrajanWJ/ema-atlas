import { regionMix, reportMetrics, statusTone, throughput } from "@/lib/admin/data";

import styles from "./admin.module.css";

function deltaClass(tone: "up" | "flat" | "down") {
  const mapped = statusTone(tone);
  if (mapped === "warning") return styles.deltaWarning;
  if (mapped === "muted") return styles.deltaMuted;
  return styles.delta;
}

export function AdminReportsView() {
  const maxQueue = Math.max(...throughput.map((point) => point.queue));

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Weekly packet</span>
          <h2 className={styles.pageTitle}>Reporting</h2>
          <p className={styles.pageDescription}>
            A compact view for operating health: fill speed, approval lag, gross margin, and regional talent balance.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.button}>Refresh snapshot</button>
          <button className={`${styles.button} ${styles.buttonPrimary}`}>Export board summary</button>
        </div>
      </header>

      <section className={styles.reportGrid}>
        {reportMetrics.map((metric) => (
          <article className={styles.reportCard} key={metric.label}>
            <p className={styles.metricLabel}>{metric.label}</p>
            <p className={styles.reportValue}>{metric.value}</p>
            <p className={deltaClass(metric.tone)}>{metric.delta}</p>
          </article>
        ))}
      </section>

      <section className={styles.gridTwo}>
        <article className={styles.panel}>
          <div className={styles.panelTitleRow}>
            <div>
              <h3 className={styles.panelTitle}>Throughput trend</h3>
              <p className={styles.panelHint}>Queue load vs dispute load across the last five review cycles.</p>
            </div>
          </div>
          <div className={styles.bars}>
            {throughput.map((point) => (
              <div className={styles.barRow} key={point.label}>
                <div className={styles.barLabel}>
                  <span>{point.label}</span>
                  <span>
                    {point.queue} queue / {point.disputes} disputes
                  </span>
                </div>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${(point.queue / maxQueue) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelTitleRow}>
            <div>
              <h3 className={styles.panelTitle}>Regional mix</h3>
              <p className={styles.panelHint}>Live talent capacity balance by operator-ready region.</p>
            </div>
          </div>
          <div className={styles.bars}>
            {regionMix.map((item) => (
              <div className={styles.barRow} key={item.label}>
                <div className={styles.barLabel}>
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
