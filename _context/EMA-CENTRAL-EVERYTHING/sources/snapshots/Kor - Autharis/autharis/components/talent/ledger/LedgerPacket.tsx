import Link from "next/link";

import { TalentShell } from "@/components/talent/TalentShell";
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  PulseIcon,
  WalletIcon,
} from "@/components/talent/TalentIcons";
import { type TalentLedgerRecord } from "@/lib/talent/ledger";

import styles from "./LedgerPacket.module.css";

type LedgerPacketProps = {
  record: TalentLedgerRecord;
};

export function LedgerPacket({ record }: LedgerPacketProps) {
  return (
    <TalentShell active="earnings">
      <div className={styles.stack}>
        <section className={`paper talent-hero ${styles.hero}`}>
          <div className="talent-hero__copy">
            <div className="talent-breadcrumbs">
              <span>Talent</span>
              <ChevronRightIcon size={12} />
              <Link className={styles.backLink} href="/talent/earnings">
                Earnings
              </Link>
              <ChevronRightIcon size={12} />
              <span>Ledger</span>
            </div>

            <div className={styles.heroMeta}>
              <span className="badge">Payout packet</span>
              <span className={styles.statusPill}>
                <PulseIcon size={14} />
                {record.statusLabel}
              </span>
            </div>

            <h2>Full payout visibility before funds move.</h2>
            <p>{record.statusDetail}</p>

            <div className={styles.heroActions}>
              <Link className={`btn btn-ghost ${styles.heroActionLink}`} href="/talent/earnings">
                <ChevronRightIcon size={14} style={{ transform: "rotate(180deg)" }} />
                Back to earnings
              </Link>
              <Link className="btn btn-primary" href="/talent/timesheets">
                Review timesheets
                <ArrowRightIcon size={14} />
              </Link>
            </div>
          </div>

          <div className={styles.heroRail}>
            {record.heroStats.map((item) => (
              <div className={styles.summaryCard} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.grid}>
          <div className={styles.mainColumn}>
            <section className="paper">
              <div className={styles.sectionHead}>
                <div>
                  <div className="eyebrow">Current packet</div>
                  <h3>Release context at a glance</h3>
                </div>
                <span className={styles.sectionIcon}>
                  <WalletIcon size={16} />
                </span>
              </div>
              <div className={styles.snapshotGrid}>
                {record.packetSnapshots.map((item) => (
                  <div className={styles.snapshotCard} key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="paper">
              <div className={styles.sectionHead}>
                <div>
                  <div className="eyebrow">Payout math</div>
                  <h3>How this transfer is composed</h3>
                </div>
                <span className={styles.sectionIcon}>
                  <CheckIcon size={16} />
                </span>
              </div>
              <div className={styles.breakdownList}>
                {record.breakdown.map((item) => (
                  <article
                    className={`${styles.breakdownCard} ${
                      item.tone === "accent" ? styles.breakdownCardAccent : ""
                    }`}
                    key={item.label}
                  >
                    <div className={styles.breakdownTop}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <p>{item.detail}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="paper">
              <div className={styles.sectionHead}>
                <div>
                  <div className="eyebrow">Release timeline</div>
                  <h3>Where the payout is blocked or moving</h3>
                </div>
                <span className={styles.sectionIcon}>
                  <ClockIcon size={16} />
                </span>
              </div>
              <div className={styles.timeline}>
                {record.timeline.map((item) => (
                  <article className={styles.timelineRow} key={item.label}>
                    <div
                      className={`${styles.timelineMarker} ${
                        item.status === "complete"
                          ? styles.timelineMarkerComplete
                          : item.status === "active"
                            ? styles.timelineMarkerActive
                            : styles.timelineMarkerQueued
                      }`}
                    />
                    <div className={styles.timelineBody}>
                      <div className={styles.timelineTop}>
                        <strong>{item.label}</strong>
                        <span>{item.timestamp}</span>
                      </div>
                      <p>{item.detail}</p>
                      <span className={styles.timelineOwner}>{item.owner}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="paper">
              <div className={styles.sectionHead}>
                <div>
                  <div className="eyebrow">Ledger history</div>
                  <h3>Recent invoices and payout outcomes</h3>
                </div>
                <span className={styles.sectionIcon}>
                  <ArrowRightIcon size={16} />
                </span>
              </div>
              <div className={styles.ledgerTable}>
                <div className={styles.ledgerHeader}>
                  <span>Invoice</span>
                  <span>Client / period</span>
                  <span>Hours</span>
                  <span>Net payout</span>
                  <span>Status</span>
                </div>
                {record.history.map((item) => (
                  <div className={styles.ledgerRow} key={item.id}>
                    <div>
                      <strong>{item.id}</strong>
                      <span>{item.grossLabel} gross</span>
                    </div>
                    <div>
                      <strong>{item.client}</strong>
                      <span>{item.period}</span>
                    </div>
                    <div>
                      <strong>{item.hoursLabel}</strong>
                      <span>{item.feeLabel} fee</span>
                    </div>
                    <div>
                      <strong>{item.payoutLabel}</strong>
                      <span>{item.dateLabel}</span>
                    </div>
                    <div>
                      <span
                        className={`${styles.tableStatus} ${
                          item.statusTone === "paid"
                            ? styles.tableStatusPaid
                            : styles.tableStatusProcessing
                        }`}
                      >
                        {item.statusLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className={styles.sideColumn}>
            <section className="paper">
              <div className={styles.sectionHead}>
                <div>
                  <div className="eyebrow">Controls</div>
                  <h3>Readiness checklist</h3>
                </div>
              </div>
              <div className={styles.signalList}>
                {record.checklist.map((item) => (
                  <article className={styles.signalCard} key={item.label}>
                    <div className={styles.signalTop}>
                      <span className={styles.signalLabel}>{item.label}</span>
                      <span
                        className={`${styles.signalStatus} ${
                          item.status === "ready"
                            ? styles.signalStatusReady
                            : styles.signalStatusPending
                        }`}
                      >
                        {item.status === "ready" ? "Ready" : "Pending"}
                      </span>
                    </div>
                    <p>{item.detail}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="paper">
              <div className={styles.sectionHead}>
                <div>
                  <div className="eyebrow">Audit trail</div>
                  <h3>What the ledger records</h3>
                </div>
              </div>
              <ul className={styles.auditList}>
                {record.auditTrail.map((item) => (
                  <li className={styles.auditRow} key={`${item.title}-${item.timestamp}`}>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    <span>
                      {item.actor} · {item.timestamp}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="paper">
              <div className={styles.sectionHead}>
                <div>
                  <div className="eyebrow">Next actions</div>
                  <h3>What to watch this week</h3>
                </div>
              </div>
              <ul className={styles.list}>
                {record.nextActions.map((item) => (
                  <li className={styles.listRow} key={item}>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </TalentShell>
  );
}
