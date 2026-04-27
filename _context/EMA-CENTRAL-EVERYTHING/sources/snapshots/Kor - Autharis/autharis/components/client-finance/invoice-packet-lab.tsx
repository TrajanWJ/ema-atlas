'use client';

import Link from 'next/link';
import * as React from 'react';

import { ClientIcons } from '@/components/client/icons';
import { type FinancePacket } from '@/lib/client-finance/data';

type PacketPanel = 'summary' | 'audit' | 'history';

const PANELS: Array<{ id: PacketPanel; label: string }> = [
  { id: 'summary', label: 'Summary' },
  { id: 'audit', label: 'Audit trail' },
  { id: 'history', label: 'History' },
];

export function InvoicePacketLab({ packet }: { packet: FinancePacket }) {
  const [panel, setPanel] = React.useState<PacketPanel>('summary');
  const historyReleased = packet.priorInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

  return (
    <div className="finance-lab finance-lab--packet">
      <div className="finance-lab__frame">
        <header className="finance-lab__hero finance-lab__hero--packet">
          <div className="finance-lab__hero-copy">
            <div className="finance-lab__breadcrumbs">
              <Link href="/client">Client surface</Link>
              <ClientIcons.ChevronRight size={12} />
              <Link href="/client/invoices">Invoices</Link>
              <ClientIcons.ChevronRight size={12} />
              <Link href="/client-finance">Finance lab</Link>
              <ClientIcons.ChevronRight size={12} />
              <span>{packet.invoicePreviewId}</span>
            </div>
            <div className="finance-lab__eyebrow">Invoice packet detail</div>
            <h1>{packet.client}</h1>
            <p>
              {packet.engagementTitle} · {packet.talentName} · {packet.period}
            </p>
          </div>

          <div className="finance-lab__hero-actions">
            <Link className="finance-lab__action finance-lab__action--primary" href="/client-finance">
              <span>Back to finance lab</span>
            </Link>
            <Link className="finance-lab__action" href="/client/invoices">
              <span>Open shipped invoice route</span>
              <ClientIcons.Arrow size={14} />
            </Link>
          </div>
        </header>

        <section className="finance-lab__metrics">
          <article className="finance-lab__metric">
            <span>Packet total</span>
            <strong>{formatMoney(packet.total)}</strong>
            <p>{packet.paymentRail}</p>
          </article>
          <article className="finance-lab__metric">
            <span>Release owner</span>
            <strong>{packet.owner}</strong>
            <p>{packet.nextMilestone}</p>
          </article>
          <article className="finance-lab__metric">
            <span>History released</span>
            <strong>{formatMoney(historyReleased)}</strong>
            <p>{packet.priorInvoices.length} prior invoices on this engagement.</p>
          </article>
          <article className="finance-lab__metric">
            <span>Risk posture</span>
            <strong>{packet.risk}</strong>
            <p>{packet.status}</p>
          </article>
        </section>

        <div className="finance-lab__workspace finance-lab__workspace--packet">
          <main className="finance-lab__main">
            <section className="finance-lab__panel finance-lab__panel--toolbar">
              <div>
                <div className="finance-lab__section-label">Packet view</div>
                <h2>{packet.invoicePreviewId}</h2>
              </div>

              <div className="finance-lab__segmented" role="tablist" aria-label="Invoice packet panels">
                {PANELS.map((option) => (
                  <button
                    aria-pressed={panel === option.id}
                    className="finance-lab__toggle"
                    data-active={panel === option.id ? 'true' : 'false'}
                    key={option.id}
                    onClick={() => setPanel(option.id)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            {panel === 'summary' ? (
              <section className="finance-lab__detail-grid">
                <article className="finance-lab__panel">
                  <div className="finance-lab__panel-head">
                    <div>
                      <div className="finance-lab__section-label">Narrative</div>
                      <h2>Why finance can trust this packet</h2>
                    </div>
                  </div>
                  <p className="finance-lab__body-copy">{packet.narrative}</p>

                  <div className="finance-lab__line-item-stack">
                    {packet.lineItems.map((item) => (
                      <div className="finance-lab__list-row finance-lab__list-row--money" key={item.label}>
                        <strong>{item.label}</strong>
                        <span>{formatMoney(item.amount)}</span>
                        <p>{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="finance-lab__panel">
                  <div className="finance-lab__panel-head">
                    <div>
                      <div className="finance-lab__section-label">Daily breakdown</div>
                      <h2>Source notes from the timesheet</h2>
                    </div>
                  </div>

                  <div className="finance-lab__entry-table">
                    {packet.entries.map((entry) => (
                      <div className="finance-lab__entry-row" key={entry.day}>
                        <div>
                          <strong>{entry.day}</strong>
                          <p>{entry.note}</p>
                        </div>
                        <div className="finance-lab__entry-values">
                          <span>{entry.hours} hrs</span>
                          <strong>{formatMoney(entry.amount)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </section>
            ) : null}

            {panel === 'audit' ? (
              <section className="finance-lab__detail-grid">
                <article className="finance-lab__panel">
                  <div className="finance-lab__panel-head">
                    <div>
                      <div className="finance-lab__section-label">Checklist</div>
                      <h2>Release gates</h2>
                    </div>
                  </div>

                  <div className="finance-lab__checklist">
                    {packet.checklist.map((item) => (
                      <div className="finance-lab__check-row" data-complete={item.complete ? 'true' : 'false'} key={item.label}>
                        <strong>{item.label}</strong>
                        <span>{item.complete ? 'Complete' : 'Open'}</span>
                        <p>{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="finance-lab__panel">
                  <div className="finance-lab__panel-head">
                    <div>
                      <div className="finance-lab__section-label">Event trail</div>
                      <h2>Packet timeline</h2>
                    </div>
                  </div>

                  <div className="finance-lab__timeline">
                    {packet.timeline.map((item) => (
                      <div className="finance-lab__timeline-row finance-lab__timeline-row--detailed" key={item.label}>
                        <strong>{item.label}</strong>
                        <span>{item.stamp}</span>
                        <p>{item.detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="finance-lab__signal-grid">
                    {packet.signals.map((signal) => (
                      <div className="finance-lab__signal" data-tone={signal.tone} key={signal.label}>
                        <span>{signal.label}</span>
                        <strong>{signal.value}</strong>
                        <p>{signal.detail}</p>
                      </div>
                    ))}
                  </div>
                </article>
              </section>
            ) : null}

            {panel === 'history' ? (
              <section className="finance-lab__detail-grid">
                <article className="finance-lab__panel">
                  <div className="finance-lab__panel-head">
                    <div>
                      <div className="finance-lab__section-label">Prior remittances</div>
                      <h2>Paid history on this engagement</h2>
                    </div>
                  </div>

                  <div className="finance-lab__history-stack">
                    {packet.priorInvoices.map((invoice) => (
                      <div className="finance-lab__history-row" key={invoice.id}>
                        <div>
                          <strong>{invoice.id}</strong>
                          <p>
                            {invoice.period} · {invoice.status}
                          </p>
                        </div>
                        <div className="finance-lab__entry-values">
                          <span>{invoice.hours} hrs</span>
                          <strong>{formatMoney(invoice.total)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="finance-lab__panel">
                  <div className="finance-lab__panel-head">
                    <div>
                      <div className="finance-lab__section-label">Recommended actions</div>
                      <h2>Finance follow-through</h2>
                    </div>
                  </div>

                  <div className="finance-lab__stack">
                    {packet.actions.map((action) => (
                      <div className="finance-lab__list-row" key={action}>
                        <strong>Next move</strong>
                        <span>Finance</span>
                        <p>{action}</p>
                      </div>
                    ))}
                  </div>
                </article>
              </section>
            ) : null}
          </main>

          <aside className="finance-lab__aside">
            <section className="finance-lab__panel finance-lab__panel--aside">
              <div className="finance-lab__section-label">Release status</div>
              <h2>{packet.status}</h2>
              <p className="finance-lab__aside-copy">{packet.nextMilestone}</p>
              <div className="finance-lab__chip-row">
                <span className="finance-lab__chip">{packet.paymentRail}</span>
                <span className="finance-lab__chip">{packet.owner}</span>
              </div>
            </section>

            <section className="finance-lab__panel finance-lab__panel--aside">
              <div className="finance-lab__section-label">Source packet</div>
              <h2>{packet.sourceTimesheetId}</h2>
              <div className="finance-lab__stack">
                <div className="finance-lab__list-row">
                  <strong>Submitted</strong>
                  <span>{packet.submittedAt}</span>
                </div>
                <div className="finance-lab__list-row">
                  <strong>Hours</strong>
                  <span>{packet.hours}</span>
                </div>
                <div className="finance-lab__list-row">
                  <strong>Rate</strong>
                  <span>{formatMoney(packet.rate)}/hr</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}
