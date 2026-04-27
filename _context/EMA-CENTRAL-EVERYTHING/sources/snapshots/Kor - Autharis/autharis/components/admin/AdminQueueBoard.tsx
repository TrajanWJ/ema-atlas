"use client";

import { useMemo, useState } from "react";

import { activationQueue, priorityTone } from "@/lib/admin/data";

import styles from "./admin.module.css";

const filters = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "activation", label: "Activation" },
  { id: "matching", label: "Matching" },
  { id: "dispute", label: "Disputes" },
] as const;

type FilterId = (typeof filters)[number]["id"];

function badgeClass(priority: "critical" | "elevated" | "routine") {
  const tone = priorityTone(priority);
  if (tone === "critical") return `${styles.badge} ${styles.badgeCritical}`;
  if (tone === "elevated") return `${styles.badge} ${styles.badgeElevated}`;
  return `${styles.badge} ${styles.badgeRoutine}`;
}

export function AdminQueueBoard() {
  const [filter, setFilter] = useState<FilterId>("all");
  const [handled, setHandled] = useState<string[]>([]);

  const visibleItems = useMemo(() => {
    return activationQueue.filter((item) => {
      if (filter === "all") return true;
      if (filter === "critical") return item.priority === "critical";
      return item.category === filter;
    });
  }, [filter]);

  const pendingCount = activationQueue.length - handled.length;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Lane B4</span>
          <h2 className={styles.pageTitle}>Activation queue</h2>
          <p className={styles.pageDescription}>
            Clear the human review stack without touching the protected prototype lanes. Every item here is local to
            the isolated admin surface.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.button}>Export queue</button>
          <button className={`${styles.button} ${styles.buttonPrimary}`}>Run 11 AM sweep</button>
        </div>
      </header>

      <section className={styles.split}>
        <div className={styles.panel}>
          <div className={styles.queueToolbar}>
            <div className={styles.segmented}>
              {filters.map((entry) => (
                <button
                  key={entry.id}
                  className={`${styles.chip} ${filter === entry.id ? styles.chipActive : ""}`}
                  onClick={() => setFilter(entry.id)}
                  type="button"
                >
                  {entry.label}
                </button>
              ))}
            </div>
            <span className={`${styles.badge} ${styles.badgeRoutine}`}>{pendingCount} pending actions</span>
          </div>

          <div className={styles.queueList}>
            {visibleItems.map((item) => {
              const done = handled.includes(item.id);
              return (
                <article className={styles.queueCard} key={item.id} style={{ opacity: done ? 0.58 : 1 }}>
                  <div className={styles.queueMeta}>
                    <span className={badgeClass(item.priority)}>{item.priority}</span>
                    <span>{item.id}</span>
                    <span>{item.receivedAt}</span>
                    <span>{item.sla}</span>
                  </div>

                  <div className={styles.queueTitleRow}>
                    <div>
                      <h3 className={styles.queueTitle}>{item.title}</h3>
                      <p className={styles.queueSummary}>{item.summary}</p>
                    </div>
                    <span className={`${styles.badge} ${styles.badgeMuted}`}>{item.status}</span>
                  </div>

                  <div className={styles.queueTitleRow}>
                    <span className={styles.panelHint}>Owner: {item.owner}</span>
                    <div className={styles.queueActions}>
                      <button className={styles.button} type="button">
                        Open brief
                      </button>
                      <button
                        className={`${styles.button} ${styles.buttonPrimary}`}
                        onClick={() => setHandled((current) => [...new Set([...current, item.id])])}
                        type="button"
                      >
                        {done ? "Handled" : "Mark handled"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            {visibleItems.length === 0 ? (
              <div className={styles.emptyState}>No items match this filter.</div>
            ) : null}
          </div>
        </div>

        <aside className={styles.stack}>
          <section className={styles.summaryCard}>
            <span className={styles.eyebrow}>Today</span>
            <p className={styles.summaryValue}>7 items closed</p>
            <p className={styles.summarySubtle}>Best operator window has been 8-10 AM ET for activation reviews.</p>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelTitleRow}>
              <div>
                <h3 className={styles.panelTitle}>Escalation rules</h3>
                <p className={styles.panelHint}>Critical disputes same-day. Matching reviews within two hours.</p>
              </div>
            </div>
            <div className={styles.summaryList}>
              <div className={styles.reportCard}>
                <strong>Activation</strong>
                <p className={styles.panelHint}>Manual verification required when resume and references disagree.</p>
              </div>
              <div className={styles.reportCard}>
                <strong>Matching</strong>
                <p className={styles.panelHint}>Human release required for shortlist batches sent to enterprise clients.</p>
              </div>
              <div className={styles.reportCard}>
                <strong>Disputes</strong>
                <p className={styles.panelHint}>Route finance-risk cases above $750 into the noon operator review.</p>
              </div>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
