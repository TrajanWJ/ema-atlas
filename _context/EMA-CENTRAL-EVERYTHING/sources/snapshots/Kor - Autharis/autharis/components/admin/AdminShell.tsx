"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { adminMetrics, adminNav, statusTone } from "@/lib/admin/data";

import styles from "./admin.module.css";

function GridIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.25" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.25" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.25" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <div className={styles.frame}>
        <aside className={styles.sidebar}>
          <div className={styles.brandBlock}>
            <span className={styles.eyebrow}>Autharis ops</span>
            <h1 className={styles.brandTitle}>Admin console</h1>
            <p className={styles.brandSummary}>
              Human review for activations, matching, disputes, and performance reporting.
            </p>
          </div>

          <nav className={styles.navGroup} aria-label="Admin navigation">
            {adminNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                >
                  <span className={styles.navLabel}>
                    <GridIcon />
                    {item.label}
                  </span>
                  {item.badge ? <span className={styles.navBadge}>{item.badge}</span> : null}
                </Link>
              );
            })}
          </nav>

          <div className={styles.metricsList}>
            {adminMetrics.map((metric) => {
              const tone = statusTone(metric.tone);
              return (
                <section className={styles.metricCard} key={metric.label}>
                  <p className={styles.metricLabel}>{metric.label}</p>
                  <p className={styles.metricValue}>{metric.value}</p>
                  <p
                    className={[
                      styles.delta,
                      tone === "warning" ? styles.deltaWarning : "",
                      tone === "muted" ? styles.deltaMuted : "",
                    ].join(" ")}
                  >
                    {metric.delta}
                  </p>
                </section>
              );
            })}
          </div>

          <div className={styles.sidebarNote}>
            <strong>On call:</strong> Maya Chen
            <br />
            Next finance packet freeze at 3:00 PM ET.
          </div>
        </aside>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
