import { TalentShell } from "@/components/talent/TalentShell";
import { ChevronRightIcon } from "@/components/talent/TalentIcons";
import { earningsSummary, formatCurrency, payoutInvoices } from "@/lib/talent/data";

export default function TalentEarningsPage() {
  return (
    <TalentShell active="earnings">
      <section className="paper talent-hero">
        <div className="talent-hero__copy">
          <div className="talent-breadcrumbs">
            <span>Talent</span>
            <ChevronRightIcon size={12} />
            <span>Earnings</span>
          </div>
          <h2>Visibility into what has cleared, what is pending, and what actually lands.</h2>
          <p>
            This view keeps approved hours, platform fee math, and payout timing in one place.
          </p>
        </div>
        <div className="talent-summaryGrid">
          <div className="talent-summaryCard">
            <span>Month to date</span>
            <strong>{formatCurrency(earningsSummary.monthToDate)}</strong>
          </div>
          <div className="talent-summaryCard">
            <span>Pending payout</span>
            <strong>{formatCurrency(earningsSummary.pendingPayout)}</strong>
          </div>
          <div className="talent-summaryCard">
            <span>Effective rate</span>
            <strong>{formatCurrency(earningsSummary.effectiveRate)}/hr</strong>
          </div>
          <div className="talent-summaryCard">
            <span>Approved hours</span>
            <strong>{earningsSummary.approvedHours}</strong>
          </div>
        </div>
      </section>

      <section className="paper talent-panel">
        <div className="talent-panel__head">
          <div>
            <div className="eyebrow">Invoices</div>
            <h2>Payout ledger</h2>
          </div>
        </div>
        <div className="talent-ledgerTable">
          <div className="talent-ledgerHeader">
            <span>Period</span>
            <span>Client</span>
            <span>Hours</span>
            <span>Net payout</span>
            <span>Status</span>
          </div>
          {payoutInvoices.map((invoice) => (
            <div className="talent-ledgerRow" key={invoice.id}>
              <div>
                <strong>{invoice.period}</strong>
                <span>{invoice.id}</span>
              </div>
              <div>
                <strong>{invoice.client}</strong>
                <span>{invoice.date}</span>
              </div>
              <div>
                <strong>{invoice.hours}</strong>
                <span>{formatCurrency(invoice.subtotal)} gross</span>
              </div>
              <div>
                <strong>{formatCurrency(invoice.payout)}</strong>
                <span>{formatCurrency(invoice.platformFee)} fee</span>
              </div>
              <div>
                <span className={`status ${invoice.status === "paid" ? "status-paid" : "status-review"}`}>
                  {invoice.status === "paid" ? "Paid" : "Processing"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </TalentShell>
  );
}
