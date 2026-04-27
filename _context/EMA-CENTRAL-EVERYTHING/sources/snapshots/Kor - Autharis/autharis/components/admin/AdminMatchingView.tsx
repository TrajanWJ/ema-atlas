"use client";

import { useState } from "react";

import { matchReviewRuns } from "@/lib/admin/data";

import styles from "./admin.module.css";

export function AdminMatchingView() {
  const [selectedId, setSelectedId] = useState(matchReviewRuns[0]?.id ?? "");
  const selectedRun = matchReviewRuns.find((run) => run.id === selectedId) ?? matchReviewRuns[0];

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Deterministic review</span>
          <h2 className={styles.pageTitle}>Matching review</h2>
          <p className={styles.pageDescription}>
            Auditable shortlist review with human sign-off before client release. Engine output stays visible next to the operator recommendation.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.button}>Tune weights</button>
          <button className={`${styles.button} ${styles.buttonPrimary}`}>Approve selected run</button>
        </div>
      </header>

      <section className={styles.split}>
        <div className={styles.panel}>
          <div className={styles.panelTitleRow}>
            <div>
              <h3 className={styles.panelTitle}>Review runs</h3>
              <p className={styles.panelHint}>Choose a run to inspect candidate strengths, risks, and operator guidance.</p>
            </div>
          </div>
          <div className={styles.runList}>
            {matchReviewRuns.map((run) => (
              <button
                className={`${styles.runCard} ${run.id === selectedRun.id ? styles.runCardActive : ""}`}
                key={run.id}
                onClick={() => setSelectedId(run.id)}
                type="button"
              >
                <div className={styles.runMeta}>
                  <span className={`${styles.badge} ${styles.badgeElevated}`}>{run.stage}</span>
                  <span>{run.generatedAt}</span>
                </div>
                <h3 className={styles.runTitle}>{run.requestTitle}</h3>
                <p className={styles.panelHint}>
                  {run.client} · reviewer {run.reviewer}
                </p>
                <p className={styles.panelHint}>{run.fitSummary}</p>
              </button>
            ))}
          </div>
        </div>

        <aside className={styles.stack}>
          <section className={styles.panel}>
            <div className={styles.panelTitleRow}>
              <div>
                <h3 className={styles.panelTitle}>Selected run</h3>
                <p className={styles.panelHint}>{selectedRun.recommendedAction}</p>
              </div>
              <span className={`${styles.badge} ${styles.badgeRoutine}`}>{selectedRun.candidateCount} candidates</span>
            </div>

            <div className={styles.candidateGrid}>
              {selectedRun.candidates.map((candidate) => (
                <article className={styles.candidateCard} key={candidate.id}>
                  <div className={styles.person}>
                    <span className={styles.avatar}>{candidate.initials}</span>
                    <div>
                      <strong>{candidate.name}</strong>
                      <div className={styles.panelHint}>
                        {candidate.score} fit · {candidate.rate} · {candidate.availability}
                      </div>
                    </div>
                  </div>
                  <ul className={styles.bulletList}>
                    {candidate.strengths.map((strength) => (
                      <li key={strength}>{strength}</li>
                    ))}
                  </ul>
                  <p className={styles.panelHint}>Watchouts: {candidate.risks.join(", ")}</p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
