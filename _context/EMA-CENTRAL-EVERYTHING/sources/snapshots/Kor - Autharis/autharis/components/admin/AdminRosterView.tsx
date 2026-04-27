"use client";

import { useMemo, useState } from "react";

import { rosterMembers, statusTone } from "@/lib/admin/data";

import styles from "./admin.module.css";

function rosterBadge(status: "active" | "review" | "ramp") {
  const tone = statusTone(status);
  if (tone === "positive") return `${styles.badge} ${styles.badgePositive}`;
  if (tone === "warning") return `${styles.badge} ${styles.badgeWarning}`;
  return `${styles.badge} ${styles.badgeMuted}`;
}

export function AdminRosterView() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rosterMembers;

    return rosterMembers.filter((member) => {
      return (
        member.name.toLowerCase().includes(normalized) ||
        member.title.toLowerCase().includes(normalized) ||
        member.specialties.some((specialty) => specialty.toLowerCase().includes(normalized))
      );
    });
  }, [query]);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Quality roster</span>
          <h2 className={styles.pageTitle}>Talent roster</h2>
          <p className={styles.pageDescription}>
            Track activation status, audit score, and blockers before talent enters a live client workflow.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.button}>Add audit tag</button>
          <button className={`${styles.button} ${styles.buttonPrimary}`}>Open activation batch</button>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.searchRow}>
          <input
            aria-label="Search roster"
            className={styles.search}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search talent, specialty, or role"
            value={query}
          />
          <button className={styles.button} type="button">
            Filter ET overlap
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Talent</th>
                <th>Coverage</th>
                <th>Specialties</th>
                <th>Audit score</th>
                <th>Status</th>
                <th>Blocker</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className={styles.person}>
                      <span className={styles.avatar}>{member.initials}</span>
                      <div>
                        <strong>{member.name}</strong>
                        <div className={styles.panelHint}>{member.title}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>{member.region}</strong>
                    <div className={styles.panelHint}>{member.hoursAvailable}</div>
                  </td>
                  <td>{member.specialties.join(", ")}</td>
                  <td>{member.auditScore}/100</td>
                  <td>
                    <span className={rosterBadge(member.status)}>{member.status}</span>
                  </td>
                  <td>{member.blocker}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
