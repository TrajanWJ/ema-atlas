'use client';

import Link from 'next/link';
import * as React from 'react';

import { ClientIcons } from '@/components/client/icons';
import {
  type FinanceClientLedger,
  type FinanceOverview,
  type FinancePacket,
  type FinancePacketStatus,
} from '@/lib/client-finance/data';

type PacketFilter = 'all' | FinancePacketStatus;

const FILTERS: Array<{ id: PacketFilter; label: string }> = [
  { id: 'all', label: 'All packets' },
  { id: 'Ready to release', label: 'Ready' },
  { id: 'Needs approval', label: 'Needs approval' },
];

export function ClientFinanceLab({
  overview,
  packets,
}: {
  overview: FinanceOverview;
  packets: FinancePacket[];
}) {
  const [filter, setFilter] = React.useState<PacketFilter>('all');
  const [query, setQuery] = React.useState('');
  const deferredQuery = React.useDeferredValue(query.trim().toLowerCase());

  const visiblePackets = packets.filter((packet) => {
    const matchesFilter = filter === 'all' ? true : packet.status === filter;
    const matchesQuery =
      deferredQuery.length === 0
        ? true
        : [packet.client, packet.talentName, packet.engagementTitle, packet.invoicePreviewId]
            .join(' ')
            .toLowerCase()
            .includes(deferredQuery);

    return matchesFilter && matchesQuery;
  });

  return (
    <div className="finance-lab">
      <div className="finance-lab__frame">
        <header className="finance-lab__hero">
          <div className="finance-lab__hero-copy">
            <div className="finance-lab__breadcrumbs">
              <Link href="/client">Client surface</Link>
              <ClientIcons.ChevronRight size={12} />
              <Link href="/client/invoices">Invoices</Link>
              <ClientIcons.ChevronRight size={12} />
              <span>Finance packet lab</span>
            </div>
            <div className="finance-lab__eyebrow">Lane D11 · Client-adjacent finance</div>
            <h1>Turn submitted timesheets into a release-ready finance packet.</h1>
            <p>
              This lab stays next to the client invoices surface, then adds packet assembly, release gating, and payer
              visibility without touching the landed B2 route tree.
            </p>
          </div>

          <div className="finance-lab__hero-actions">
            <Link className="finance-lab__action finance-lab__action--primary" href="/client/invoices">
              <ClientIcons.Sparkles size={15} />
              <span>Open client invoices</span>
            </Link>
            <Link className="finance-lab__action" href={`/client-finance/${packets[0]?.id ?? ''}`}>
              <span>Open lead packet</span>
              <ClientIcons.Arrow size={14} />
            </Link>
          </div>
        </header>

        <section className="finance-lab__metrics">
          {overview.metrics.map((metric) => (
            <article className="finance-lab__metric" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <p>{metric.note}</p>
            </article>
          ))}
        </section>

        <div className="finance-lab__workspace">
          <main className="finance-lab__main">
            <section className="finance-lab__panel finance-lab__panel--toolbar">
              <div>
                <div className="finance-lab__section-label">Packet queue</div>
                <h2>Submitted this week</h2>
              </div>

              <div className="finance-lab__toolbar">
                <div className="finance-lab__segmented" role="tablist" aria-label="Finance packet filters">
                  {FILTERS.map((option) => (
                    <button
                      aria-pressed={filter === option.id}
                      className="finance-lab__toggle"
                      data-active={filter === option.id ? 'true' : 'false'}
                      key={option.id}
                      onClick={() => setFilter(option.id)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <label className="finance-lab__search">
                  <span>Search</span>
                  <input
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Client, talent, packet id"
                    value={query}
                  />
                </label>
              </div>
            </section>

            <section className="finance-lab__packet-grid">
              {visiblePackets.map((packet) => (
                <Link className="finance-lab__packet-card" href={`/client-finance/${packet.id}`} key={packet.id}>
                  <div className="finance-lab__packet-head">
                    <div>
                      <div className="finance-lab__section-label">{packet.invoicePreviewId}</div>
                      <h3>{packet.client}</h3>
                      <p>
                        {packet.engagementTitle} · {packet.talentName}
                      </p>
                    </div>
                    <span className="finance-lab__status" data-tone={statusTone(packet.status, packet.risk)}>
                      {packet.status}
                    </span>
                  </div>

                  <div className="finance-lab__packet-values">
                    <div>
                      <span>Total</span>
                      <strong>{formatMoney(packet.total)}</strong>
                    </div>
                    <div>
                      <span>Period</span>
                      <strong>{packet.period}</strong>
                    </div>
                    <div>
                      <span>Next</span>
                      <strong>{packet.nextMilestone}</strong>
                    </div>
                  </div>

                  <p className="finance-lab__packet-copy">{packet.narrative}</p>

                  <div className="finance-lab__chip-row">
                    {packet.signals.map((signal) => (
                      <span className="finance-lab__chip" data-tone={signal.tone} key={signal.label}>
                        {signal.label}: {signal.value}
                      </span>
                    ))}
                  </div>

                  <div className="finance-lab__packet-foot">
                    <span>{packet.owner}</span>
                    <span className="finance-lab__inline-link">
                      <span>Open packet</span>
                      <ClientIcons.Arrow size={13} />
                    </span>
                  </div>
                </Link>
              ))}
            </section>

            <section className="finance-lab__panel">
              <div className="finance-lab__panel-head">
                <div>
                  <div className="finance-lab__section-label">Client ledger view</div>
                  <h2>Payer health across active packet accounts</h2>
                </div>
                <p>Released history from the shipped invoice data plus this week’s staged packets.</p>
              </div>

              <div className="finance-lab__ledger-grid">
                {overview.ledgers.map((ledger) => (
                  <LedgerCard key={ledger.client} ledger={ledger} />
                ))}
              </div>
            </section>
          </main>

          <aside className="finance-lab__aside">
            <section className="finance-lab__panel finance-lab__panel--aside">
              <div className="finance-lab__section-label">Batch mix</div>
              <h2>Release readiness</h2>
              <div className="finance-lab__stack">
                {overview.statusBuckets.map((bucket) => (
                  <div className="finance-lab__list-row" key={bucket.label}>
                    <strong>{bucket.label}</strong>
                    <span>{bucket.value}</span>
                    <p>{bucket.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="finance-lab__panel finance-lab__panel--aside">
              <div className="finance-lab__section-label">Release windows</div>
              <h2>What happens next</h2>
              <div className="finance-lab__timeline">
                {packets.map((packet) => (
                  <div className="finance-lab__timeline-row" key={packet.id}>
                    <strong>{packet.client}</strong>
                    <span>{packet.nextMilestone}</span>
                    <p>{packet.paymentRail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="finance-lab__panel finance-lab__panel--aside">
              <div className="finance-lab__section-label">Why this lab exists</div>
              <h2>Scope boundary</h2>
              <p className="finance-lab__aside-copy">
                The existing `/client/invoices` route stays untouched. This lab adds a finance-ops packet layer so C1
                can choose later whether any of these moments should merge back into the main product.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function LedgerCard({ ledger }: { ledger: FinanceClientLedger }) {
  return (
    <article className="finance-lab__ledger-card">
      <div className="finance-lab__ledger-head">
        <div>
          <div className="finance-lab__section-label">Client account</div>
          <h3>{ledger.client}</h3>
        </div>
        <span className="finance-lab__risk-pill" data-tone={ledger.riskCount > 0 ? 'warning' : 'positive'}>
          {ledger.riskCount > 0 ? `${ledger.riskCount} held` : 'Clean'}
        </span>
      </div>

      <div className="finance-lab__ledger-values">
        <div>
          <span>Released</span>
          <strong>{formatMoney(ledger.released)}</strong>
        </div>
        <div>
          <span>Pending</span>
          <strong>{formatMoney(ledger.pending)}</strong>
        </div>
      </div>

      <p className="finance-lab__ledger-copy">{ledger.nextRun}</p>

      <div className="finance-lab__chip-row">
        {ledger.activePacketIds.length > 0 ? (
          ledger.activePacketIds.map((packetId) => (
            <span className="finance-lab__chip" key={packetId}>
              {packetId}
            </span>
          ))
        ) : (
          <span className="finance-lab__chip">No active packet</span>
        )}
      </div>
    </article>
  );
}

function statusTone(status: FinancePacketStatus, risk: FinancePacket['risk']) {
  if (status === 'Needs approval') {
    return 'warning';
  }

  return risk === 'Low' ? 'positive' : 'neutral';
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}
