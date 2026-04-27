import Link from "next/link";

import { formatHours, formatMoney, type PaymentInvoiceRecord } from "@/lib/payments/data";

import styles from "./invoice-printable.module.css";

export function InvoicePrintable({ invoice }: { invoice: PaymentInvoiceRecord }) {
  return (
    <div className={styles.shell}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Autharis invoice packet</p>
            <h1>{invoice.id}</h1>
            <p className={styles.subtitle}>{invoice.memo}</p>
          </div>

          <div className={styles.headerActions}>
            <Link className={styles.link} href="/payments">
              Back to payments
            </Link>
            {invoice.webhookReady ? (
              <Link className={styles.link} href={`/api/payments/webhook?invoiceId=${invoice.id}`}>
                Webhook preview
              </Link>
            ) : null}
          </div>
        </header>

        <section className={styles.metaGrid}>
          <article className={styles.metaCard}>
            <span>Bill to</span>
            <strong>{invoice.client}</strong>
            <p>{invoice.remittanceEmail}</p>
          </article>
          <article className={styles.metaCard}>
            <span>Talent</span>
            <strong>{invoice.talentName}</strong>
            <p>{invoice.engagementTitle}</p>
          </article>
          <article className={styles.metaCard}>
            <span>Status</span>
            <strong>{invoice.statusLabel}</strong>
            <p>{invoice.paymentRail}</p>
          </article>
          <article className={styles.metaCard}>
            <span>Period</span>
            <strong>{invoice.period}</strong>
            <p>{formatHours(invoice.hours)}</p>
          </article>
        </section>

        <div className={styles.contentGrid}>
          <main className={styles.mainCard}>
            <div className={styles.sectionHeader}>
              <p className={styles.eyebrow}>Line items</p>
              <h2>Client billings and payout split</h2>
            </div>

            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <span>Description</span>
                <span>Amount</span>
              </div>

              {invoice.lineItems.map((item) => (
                <div className={styles.tableRow} key={item.label}>
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                  </div>
                  <span>{formatMoney(item.amount)}</span>
                </div>
              ))}

              <div className={styles.tableFooter}>
                <div>
                  <strong>Total due</strong>
                  <p>Client-facing amount for {invoice.client}</p>
                </div>
                <span>{formatMoney(invoice.totalDue)}</span>
              </div>
            </div>

            <div className={styles.notes}>
              <article>
                <p className={styles.eyebrow}>Client note</p>
                <p>{invoice.clientNote}</p>
              </article>
              <article>
                <p className={styles.eyebrow}>Ops note</p>
                <p>{invoice.operationsNote}</p>
              </article>
            </div>
          </main>

          <aside className={styles.sideStack}>
            <section className={styles.sideCard}>
              <p className={styles.eyebrow}>Payout math</p>
              <h2>{formatMoney(invoice.talentNet)}</h2>
              <div className={styles.summaryList}>
                <div>
                  <span>Gross labor</span>
                  <strong>{formatMoney(invoice.subtotal)}</strong>
                </div>
                <div>
                  <span>Platform fee</span>
                  <strong>{formatMoney(invoice.platformFee)}</strong>
                </div>
                <div>
                  <span>Tax seam</span>
                  <strong>{formatMoney(invoice.tax)}</strong>
                </div>
                <div>
                  <span>Payout ETA</span>
                  <strong>{invoice.payoutEta}</strong>
                </div>
              </div>
            </section>

            <section className={styles.sideCard}>
              <p className={styles.eyebrow}>Timeline</p>
              <div className={styles.timeline}>
                {invoice.timeline.map((item) => (
                  <div className={styles.timelineRow} key={`${item.label}-${item.stamp}`}>
                    <strong>{item.label}</strong>
                    <span>{item.stamp}</span>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
