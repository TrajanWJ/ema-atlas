import {
  currentTimesheet,
  earningsSummary,
  formatCurrency,
  payoutInvoices,
  previousTimesheets,
  talentEngagements,
  talentProfile,
} from "@/lib/talent/data";

export type LedgerHeroStat = {
  label: string;
  value: string;
  detail: string;
};

export type LedgerSnapshot = {
  label: string;
  value: string;
};

export type LedgerBreakdownLine = {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "accent";
};

export type LedgerStage = {
  label: string;
  detail: string;
  owner: string;
  timestamp: string;
  status: "complete" | "active" | "queued";
};

export type LedgerChecklistItem = {
  label: string;
  detail: string;
  status: "ready" | "pending";
};

export type LedgerAuditEvent = {
  title: string;
  detail: string;
  actor: string;
  timestamp: string;
};

export type LedgerHistoryRow = {
  id: string;
  period: string;
  client: string;
  statusLabel: string;
  statusTone: "paid" | "processing";
  hoursLabel: string;
  grossLabel: string;
  feeLabel: string;
  payoutLabel: string;
  dateLabel: string;
};

export type TalentLedgerRecord = {
  title: string;
  statusLabel: string;
  statusDetail: string;
  heroStats: LedgerHeroStat[];
  packetSnapshots: LedgerSnapshot[];
  breakdown: LedgerBreakdownLine[];
  timeline: LedgerStage[];
  checklist: LedgerChecklistItem[];
  auditTrail: LedgerAuditEvent[];
  history: LedgerHistoryRow[];
  nextActions: string[];
};

function formatHours(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)} hrs`;
}

export function getTalentLedgerRecord(): TalentLedgerRecord {
  const currentPacket =
    payoutInvoices.find((invoice) => invoice.status === "processing") ?? payoutInvoices[0];
  const currentEngagement =
    talentEngagements.find((engagement) => engagement.client === currentPacket.client) ??
    talentEngagements[0];
  const sourceTimesheet =
    previousTimesheets.find((timesheet) => timesheet.weekOf.startsWith(currentPacket.period)) ??
    previousTimesheets[0];

  const totalPaid = payoutInvoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.payout, 0);
  const totalFees = payoutInvoices.reduce((sum, invoice) => sum + invoice.platformFee, 0);
  const currentDraftHours = currentTimesheet.entries.reduce(
    (sum, entry) => sum + Number.parseFloat(entry.hours || "0"),
    0,
  );
  const netRate = currentPacket.payout / currentPacket.hours;

  return {
    title: "Payout packet and ledger",
    statusLabel: currentPacket.status === "processing" ? "Processing" : "Paid",
    statusDetail:
      "The invoice is staged in payouts, but final release still depends on client approval before the April 25, 2026 ACH window.",
    heroStats: [
      {
        label: "Net payout",
        value: formatCurrency(currentPacket.payout),
        detail: `${formatHours(currentPacket.hours)} staged for ${currentPacket.client}.`,
      },
      {
        label: "Release window",
        value: currentPacket.date,
        detail: "Visible here so payout timing and blockers sit in the same place.",
      },
      {
        label: "Effective rate",
        value: `${formatCurrency(netRate)}/hr`,
        detail: `${formatCurrency(currentPacket.platformFee)} platform fee already separated.`,
      },
      {
        label: "Month to date",
        value: formatCurrency(earningsSummary.monthToDate),
        detail: `${earningsSummary.approvedHours} approved hours currently reflected in earnings.`,
      },
    ],
    packetSnapshots: [
      { label: "Invoice", value: currentPacket.id },
      { label: "Coverage period", value: `${currentPacket.period}, 2026` },
      { label: "Source engagement", value: currentEngagement.role },
      { label: "Relationship lead", value: currentEngagement.relationshipLead },
      { label: "Bank destination", value: "ACH to Chase •••• 1184" },
      { label: "Tax profile", value: "US tax form on file" },
    ],
    breakdown: [
      {
        label: "Gross billings",
        value: formatCurrency(currentPacket.subtotal),
        detail: `${formatHours(currentPacket.hours)} at the engagement rate for ${currentEngagement.client}.`,
      },
      {
        label: "Platform fee",
        value: formatCurrency(currentPacket.platformFee),
        detail: "Applied before bank release so the packet reconciles to the net transfer.",
      },
      {
        label: "Net payout",
        value: formatCurrency(currentPacket.payout),
        detail: "Expected transfer amount once the release checkpoint clears.",
        tone: "accent",
      },
    ],
    timeline: [
      {
        label: "Timesheet submitted",
        detail: `${sourceTimesheet.id} for ${sourceTimesheet.weekOf} is in the ledger and tied to this invoice.`,
        owner: talentProfile.name,
        timestamp: sourceTimesheet.submittedAt,
        status: "complete",
      },
      {
        label: "Client approval pending",
        detail: `${currentEngagement.relationshipLead} still needs to approve the submitted hours before funds are released.`,
        owner: currentPacket.client,
        timestamp: "Awaiting sign-off",
        status: "active",
      },
      {
        label: "ACH batch release",
        detail: "Once approval clears, payouts includes this invoice in the next bank file without needing a second talent action.",
        owner: "Autharis payouts",
        timestamp: currentPacket.date,
        status: "queued",
      },
    ],
    checklist: [
      {
        label: "Identity + banking verified",
        detail: "Talent profile and payout destination are already on file.",
        status: "ready",
      },
      {
        label: "Invoice math locked",
        detail: "Hours, fee, and net payout reconcile against the staged invoice total.",
        status: "ready",
      },
      {
        label: "Client sign-off",
        detail: "Still pending on the submitted Apr 13 - Apr 19, 2026 timesheet.",
        status: "pending",
      },
      {
        label: "Current week draft",
        detail: `${formatHours(currentDraftHours)} entered so far for ${currentTimesheet.weekOf}.`,
        status: "pending",
      },
    ],
    auditTrail: [
      {
        title: "Timesheet packet attached",
        detail: `${sourceTimesheet.id} was associated with ${currentPacket.id} after submission.`,
        actor: talentProfile.name,
        timestamp: sourceTimesheet.submittedAt,
      },
      {
        title: "Fee + payout split calculated",
        detail: `${formatCurrency(currentPacket.platformFee)} fee separated from ${formatCurrency(currentPacket.subtotal)} gross billings.`,
        actor: "Autharis ledger",
        timestamp: "Apr 20, 2026 at 08:14",
      },
      {
        title: "Release window projected",
        detail: `Funds are expected to land on ${currentPacket.date.replace("Expected ", "")} once approval clears.`,
        actor: "Autharis payouts",
        timestamp: "Apr 20, 2026 at 08:16",
      },
      {
        title: "Current week draft opened",
        detail: `${formatHours(currentDraftHours)} already logged for the next cycle in ${currentTimesheet.client}.`,
        actor: talentProfile.name,
        timestamp: "Apr 22, 2026 at 10:12",
      },
    ],
    history: payoutInvoices.map((invoice) => ({
      id: invoice.id,
      period: `${invoice.period}, 2026`,
      client: invoice.client,
      statusLabel: invoice.status === "paid" ? "Paid" : "Processing",
      statusTone: invoice.status,
      hoursLabel: formatHours(invoice.hours),
      grossLabel: formatCurrency(invoice.subtotal),
      feeLabel: formatCurrency(invoice.platformFee),
      payoutLabel: formatCurrency(invoice.payout),
      dateLabel: invoice.date,
    })),
    nextActions: [
      `Follow up with ${currentEngagement.relationshipLead} if approval is still missing by Apr 24, 2026.`,
      `Keep ${currentTimesheet.weekOf} current so the next payout cycle does not inherit missing hours.`,
      `${formatCurrency(totalPaid)} has already landed this cycle, with ${formatCurrency(totalFees)} retained in platform fees across all ledger entries.`,
    ],
  };
}
