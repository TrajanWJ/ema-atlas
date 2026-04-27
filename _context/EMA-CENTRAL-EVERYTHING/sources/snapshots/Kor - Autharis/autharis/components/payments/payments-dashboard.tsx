'use client';

import Link from "next/link";
import * as React from "react";

import {
  formatHours,
  formatMoney,
  type PaymentDashboardData,
  type PaymentInvoiceRecord,
  type PaymentInvoiceStatus,
} from "@/lib/payments/data";

import styles from "./payments-dashboard.module.css";

const FILTERS: Array<{ id: PaymentInvoiceStatus | "all"; label: string }> = [
  { id: "all", label: "All invoices" },
  { id: "draft", label: "Draft" },
  { id: "issued", label: "Issued" },
  { id: "paid", label: "Paid" },
  { id: "overdue", label: "Overdue" },
];

export function PaymentsDashboard({ data }: { data: PaymentDashboardData }) {
  const [filter, setFilter] = React.useState<PaymentInvoiceStatus | "all">("all");
  const [query, setQuery] = React.useState("");
  const deferredQuery = React.useDeferredValue(query.trim().toLowerCase());

  const visibleRecords = React.useMemo(() => {
    return data.records.filter((record) => {
      const matchesFilter = filter === "all" ? true : record.status === filter;
      const matchesQuery =
        deferredQuery.length === 0
          ? true
          : [record.id, record.client, record.talentName, record.engagementTitle]
              .join(" ")
              .toLowerCase()
              .includes(deferredQuery);

      return matchesFilter && matchesQuery;
    });
  }, [data.records, deferredQuery, filter]);

  const featured = data.records.find((record) => record.id === data.highlightedInvoiceId) ?? data.records[0];

  return (
    <div className={styles.shell}>
      <div className={styles.backdrop} />
      <div className={styles.frame}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Lane E3 / Payments and invoicing engine</p>
            <h1>Run the entire billing path without touching the live client or talent surfaces.</h1>
            <p className={styles.lead}>
              This lane-local module turns timesheets into invoice packets, maps client billings against talent net
              payouts, and exposes a Stripe-style webhook seam under <code>/api/payments/webhook</code>.
            </p>

            <div className={styles.heroActions}>
              <Link className={styles.primaryAction} href={`/invoice/${featured.id}`}>
                Open printable invoice
              </Link>
              <Link className={styles.secondaryAction} href={`/api/payments/webhook?invoiceId=${featured.id}`}>
                Preview webhook JSON
              </Link>
            </div>
          </div>

          <div className={styles.heroPanel}>
            <div className={styles.heroPanelHeader}>
              <span>Featured flow</span>
              <strong>{featured.id}</strong>
            </div>

            <div className={styles.heroPanelGrid}>
              <Metric label="Client total" value={formatMoney(featured.totalDue)} detail={featured.client} />
              <Metric label="Talent net" value={formatMoney(featured.talentNet)} detail={featured.talentName} />
              <Metric label="State" value={featured.statusLabel} detail={featured.payoutEta} />
              <Metric label="Source" value={featured.sourceTimesheetId ?? "Seeded"} detail={featured.paymentRail} />
            </div>

            <div className={styles.sampleBlock}>
              <div className={styles.sampleHeader}>
                <span>Webhook sample</span>
                <strong>{data.webhookSample.invoiceId}</strong>
              </div>
              <pre>{data.webhookSample.body}</pre>
            </div>
          </div>
        </header>

        <section className={styles.statGrid}>
          {data.stats.map((stat) => (
            <article className={styles.statCard} key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <p>{stat.detail}</p>
            </article>
          ))}
        </section>

        <div className={styles.workspace}>
          <main className={styles.main}>
            <section className={styles.toolbar}>
              <div>
                <p className={styles.sectionLabel}>Invoice queue</p>
                <h2>Timesheet to invoice to payout simulation</h2>
              </div>

              <div className={styles.controls}>
                <div className={styles.segmented} role="tablist" aria-label="Invoice status filter">
                  {FILTERS.map((item) => (
                    <button
                      aria-pressed={filter === item.id}
                      className={styles.segment}
                      data-active={filter === item.id}
                      key={item.id}
                      onClick={() => setFilter(item.id)}
                      type="button"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <label className={styles.search}>
                  <span>Search</span>
                  <input
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Invoice, client, talent"
                    value={query}
                  />
                </label>
              </div>
            </section>

            <section className={styles.recordList}>
              {visibleRecords.map((record) => (
                <InvoiceCard key={record.id} record={record} />
              ))}
            </section>
          </main>

          <aside className={styles.aside}>
            <section className={styles.sideCard}>
              <p className={styles.sectionLabel}>State machine</p>
              <h2>Allowed transitions</h2>
              <div className={styles.stateList}>
                {data.stateMachine.map((node) => (
                  <div className={styles.stateRow} key={node.status}>
                    <div>
                      <strong>{node.label}</strong>
                      <p>{node.detail}</p>
                    </div>
                    <span>{node.next.length > 0 ? node.next.join(" / ") : "terminal"}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.sideCard}>
              <p className={styles.sectionLabel}>Recent activity</p>
              <h2>Ops notes</h2>
              <div className={styles.activityList}>
                {data.activity.map((item) => (
                  <div className={styles.activityRow} data-tone={item.tone} key={item.title}>
                    <strong>{item.title}</strong>
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

function InvoiceCard({ record }: { record: PaymentInvoiceRecord }) {
  return (
    <article className={styles.recordCard}>
      <div className={styles.recordHeader}>
        <div>
          <p className={styles.invoiceId}>{record.id}</p>
          <h3>{record.client}</h3>
          <p className={styles.recordMeta}>
            {record.engagementTitle} / {record.talentName}
          </p>
        </div>

        <span className={styles.statusPill} data-status={record.status}>
          {record.statusLabel}
        </span>
      </div>

      <div className={styles.valueGrid}>
        <Metric label="Hours" value={formatHours(record.hours)} detail={record.period} />
        <Metric label="Client total" value={formatMoney(record.totalDue)} detail={record.remittanceEmail} />
        <Metric label="Talent net" value={formatMoney(record.talentNet)} detail={record.payoutEta} />
      </div>

      <p className={styles.copy}>{record.memo}</p>

      <div className={styles.lineList}>
        {record.lineItems.map((item) => (
          <div className={styles.lineRow} key={item.label}>
            <div>
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
            </div>
            <span>{formatMoney(item.amount)}</span>
          </div>
        ))}
      </div>

      <div className={styles.timeline}>
        {record.timeline.map((item) => (
          <div className={styles.timelineRow} data-tone={item.tone} key={`${record.id}-${item.label}-${item.stamp}`}>
            <strong>{item.label}</strong>
            <span>{item.stamp}</span>
            <p>{item.detail}</p>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.footerNotes}>
          <p>{record.clientNote}</p>
          <p>{record.operationsNote}</p>
        </div>

        <div className={styles.footerActions}>
          <Link className={styles.inlineAction} href={`/invoice/${record.id}`}>
            Printable invoice
          </Link>
          {record.webhookReady ? (
            <Link className={styles.inlineAction} href={`/api/payments/webhook?invoiceId=${record.id}`}>
              Simulate invoice.paid
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}
