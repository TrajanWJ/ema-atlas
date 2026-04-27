import { ENGAGEMENTS, INVOICES, TALENT, TIMESHEETS, type Timesheet } from "@/lib/data";

export const PLATFORM_FEE_RATE = 0.1;
const DEFAULT_TAX_RATE = 0;

export type PaymentInvoiceStatus = "draft" | "issued" | "paid" | "overdue" | "voided";
export type PaymentTone = "neutral" | "positive" | "warning";

export type PaymentLineItem = {
  label: string;
  amount: number;
  detail: string;
};

export type PaymentTimelineItem = {
  label: string;
  stamp: string;
  detail: string;
  tone: PaymentTone;
};

export type PaymentStat = {
  label: string;
  value: string;
  detail: string;
};

export type PaymentActivity = {
  title: string;
  stamp: string;
  detail: string;
  tone: PaymentTone;
};

export type PaymentStateNode = {
  status: PaymentInvoiceStatus;
  label: string;
  detail: string;
  next: PaymentInvoiceStatus[];
};

export type PaymentInvoiceRecord = {
  id: string;
  providerInvoiceId: string;
  client: string;
  talentName: string;
  engagementId: string;
  engagementTitle: string;
  sourceTimesheetId?: string;
  period: string;
  status: PaymentInvoiceStatus;
  statusLabel: string;
  hours: number;
  rate: number;
  subtotal: number;
  platformFee: number;
  tax: number;
  totalDue: number;
  talentNet: number;
  remittanceEmail: string;
  paymentRail: string;
  payoutEta: string;
  dueDate?: string;
  approvedAt?: string;
  issuedAt?: string;
  paidAt?: string;
  memo: string;
  clientNote: string;
  operationsNote: string;
  webhookReady: boolean;
  lineItems: PaymentLineItem[];
  timeline: PaymentTimelineItem[];
  actions: string[];
};

export type PaymentDashboardData = {
  stats: PaymentStat[];
  records: PaymentInvoiceRecord[];
  stateMachine: PaymentStateNode[];
  activity: PaymentActivity[];
  highlightedInvoiceId: string;
  webhookSample: {
    endpoint: string;
    body: string;
    invoiceId: string;
  };
};

const STATUS_LABELS: Record<PaymentInvoiceStatus, string> = {
  draft: "Draft",
  issued: "Issued",
  paid: "Paid",
  overdue: "Overdue",
  voided: "Voided",
};

const STATUS_FLOW: Record<PaymentInvoiceStatus, PaymentInvoiceStatus[]> = {
  draft: ["issued", "voided"],
  issued: ["paid", "overdue", "voided"],
  paid: [],
  overdue: ["paid", "voided"],
  voided: [],
};

const STATE_COPY: Array<Omit<PaymentStateNode, "next">> = [
  {
    status: "draft",
    label: "Draft",
    detail: "Assembled from approved or pre-cleared hours, but not yet sent to accounts payable.",
  },
  {
    status: "issued",
    label: "Issued",
    detail: "Invoice left ops, has remittance instructions, and can be closed by the webhook stub.",
  },
  {
    status: "paid",
    label: "Paid",
    detail: "Client funds landed, webhook confirmed, and the talent net is ready for settlement.",
  },
  {
    status: "overdue",
    label: "Overdue",
    detail: "Due date passed, so ops needs a manual nudge before the payout ETA stays trustworthy.",
  },
  {
    status: "voided",
    label: "Voided",
    detail: "Terminal path for duplicates or billing corrections before money moves.",
  },
];

type SimulatedTimesheetBlueprint = {
  timesheetId: string;
  invoiceId: string;
  providerInvoiceId: string;
  status: "issued" | "overdue";
  approvedAt: string;
  issuedAt: string;
  dueDate: string;
  paymentRail: string;
  payoutEta: string;
  memo: string;
  clientNote: string;
  operationsNote: string;
  actions: string[];
};

type DirectInvoiceSeed = {
  id: string;
  providerInvoiceId: string;
  client: string;
  talentName: string;
  engagementId: string;
  engagementTitle: string;
  period: string;
  status: PaymentInvoiceStatus;
  hours: number;
  rate: number;
  approvedAt?: string;
  issuedAt?: string;
  paidAt?: string;
  dueDate?: string;
  paymentRail: string;
  payoutEta: string;
  memo: string;
  clientNote: string;
  operationsNote: string;
  actions: string[];
  timeline: PaymentTimelineItem[];
};

const SIMULATED_TIMESHEETS: SimulatedTimesheetBlueprint[] = [
  {
    timesheetId: "ts-001",
    invoiceId: "INV-2026-0047",
    providerInvoiceId: "in_autharis_0047",
    status: "issued",
    approvedAt: "Apr 22, 2026 · 09:18 ET",
    issuedAt: "Apr 22, 2026 · 09:31 ET",
    dueDate: "Apr 24, 2026",
    paymentRail: "ACH autopay / Cedar Health Co-op",
    payoutEta: "Expected Apr 25, 2026",
    memo: "End-to-end path: submitted -> approved -> invoice issued -> webhook closes the loop.",
    clientNote: "This packet matches the pending Amara payout packet already visible in the talent earnings lane.",
    operationsNote: "Webhook-ready invoice. Marking this paid should settle a net talent payout of $799.20.",
    actions: [
      "Send the remittance note to billing@cedarhealth.co.",
      "Fire the invoice.paid webhook once the ACH confirmation lands.",
    ],
  },
  {
    timesheetId: "ts-002",
    invoiceId: "INV-2026-0048",
    providerInvoiceId: "in_autharis_0048",
    status: "overdue",
    approvedAt: "Apr 20, 2026 · 11:04 ET",
    issuedAt: "Apr 20, 2026 · 11:42 ET",
    dueDate: "Apr 22, 2026",
    paymentRail: "Manual approval rail / Lumen AI",
    payoutEta: "Held pending A/P release",
    memo: "The invoice is mathematically correct, but the customer is slow to release funds.",
    clientNote: "RAG eval expansion was approved after finance review, so the hold is operational rather than contractual.",
    operationsNote: "Overdue invoices can still transition to paid from the webhook stub without mutating repo state.",
    actions: [
      "Send a same-day follow-up to client ops.",
      "If funds land, replay the webhook stub and clear the payout hold.",
    ],
  },
];

const DIRECT_SEEDS: DirectInvoiceSeed[] = [
  {
    id: "INV-2026-0051",
    providerInvoiceId: "in_autharis_0051",
    client: "Ladder Fintech",
    talentName: "Nia Thompson",
    engagementId: "sim-eng-001",
    engagementTitle: "Founder office coverage",
    period: "Apr 20 - Apr 24, 2026",
    status: "draft",
    hours: 16,
    rate: 40,
    paymentRail: "Manual release / finance review",
    payoutEta: "Pending issue",
    memo: "Draft packet shows the generator before anything is sent to the customer.",
    clientNote: "Scope is inside the expected weekly envelope, but finance wants a final glance before release.",
    operationsNote: "This is the clean draft branch of the state machine. It can issue or void with no external dependency.",
    actions: [
      "Review line items with the account lead.",
      "Issue the invoice or void it before Thursday close.",
    ],
    timeline: [
      {
        label: "Packet assembled",
        stamp: "Apr 22, 2026 · 08:42 ET",
        detail: "Draft invoice generated from the office coverage worklog.",
        tone: "neutral",
      },
      {
        label: "Awaiting issue",
        stamp: "Finance hold",
        detail: "No customer-facing remittance note has been sent yet.",
        tone: "warning",
      },
    ],
  },
];

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatHours(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)} hrs`;
}

export function isPaymentInvoiceStatus(value: string): value is PaymentInvoiceStatus {
  return value in STATUS_LABELS;
}

export function getAllowedTransitions(status: PaymentInvoiceStatus) {
  return STATUS_FLOW[status];
}

export function calculateInvoiceTotals({
  hours,
  rate,
  taxRate = DEFAULT_TAX_RATE,
}: {
  hours: number;
  rate: number;
  taxRate?: number;
}) {
  const subtotal = roundCurrency(hours * rate);
  const platformFee = roundCurrency(subtotal * PLATFORM_FEE_RATE);
  const tax = roundCurrency(subtotal * taxRate);
  const totalDue = roundCurrency(subtotal + platformFee + tax);
  const talentNet = roundCurrency(subtotal - platformFee);

  return {
    subtotal,
    platformFee,
    tax,
    totalDue,
    talentNet,
  };
}

export function createInvoiceFromTimesheet(
  timesheet: Timesheet,
  blueprint: SimulatedTimesheetBlueprint,
) {
  const engagement = ENGAGEMENTS.find((item) => item.id === timesheet.engagementId);
  const talent = engagement ? TALENT.find((item) => item.id === engagement.talentId) : undefined;
  const totals = calculateInvoiceTotals({ hours: timesheet.hours, rate: timesheet.rate });

  return {
    id: blueprint.invoiceId,
    providerInvoiceId: blueprint.providerInvoiceId,
    client: timesheet.client,
    talentName: talent?.name ?? timesheet.talentName,
    engagementId: timesheet.engagementId,
    engagementTitle: timesheet.engagementTitle,
    sourceTimesheetId: timesheet.id,
    period: normalizePeriod(timesheet.weekOf),
    status: blueprint.status,
    statusLabel: STATUS_LABELS[blueprint.status],
    hours: timesheet.hours,
    rate: timesheet.rate,
    subtotal: totals.subtotal,
    platformFee: totals.platformFee,
    tax: totals.tax,
    totalDue: totals.totalDue,
    talentNet: totals.talentNet,
    remittanceEmail: buildRemittanceEmail(timesheet.client),
    paymentRail: blueprint.paymentRail,
    payoutEta: blueprint.payoutEta,
    dueDate: blueprint.dueDate,
    approvedAt: blueprint.approvedAt,
    issuedAt: blueprint.issuedAt,
    memo: blueprint.memo,
    clientNote: blueprint.clientNote,
    operationsNote: blueprint.operationsNote,
    webhookReady: blueprint.status === "issued" || blueprint.status === "overdue",
    lineItems: [
      {
        label: "Approved labor",
        amount: totals.subtotal,
        detail: `${formatHours(timesheet.hours)} x ${formatMoney(timesheet.rate)}/hr`,
      },
      {
        label: "Platform fee",
        amount: totals.platformFee,
        detail: "10% Autharis operating fee",
      },
      {
        label: "Tax hook",
        amount: totals.tax,
        detail: "Present in the generator seam, currently set to 0%.",
      },
    ],
    timeline: [
      {
        label: "Timesheet submitted",
        stamp: timesheet.submitted,
        detail: `${timesheet.talentName} submitted ${formatHours(timesheet.hours)} for ${normalizePeriod(timesheet.weekOf)}.`,
        tone: "neutral",
      },
      {
        label: "Client approval simulated",
        stamp: blueprint.approvedAt,
        detail: "E3 uses a lane-local approval moment so the invoice path can run end-to-end without touching product surfaces.",
        tone: "positive",
      },
      {
        label: blueprint.status === "overdue" ? "Invoice became overdue" : "Invoice issued",
        stamp: blueprint.status === "overdue" ? blueprint.dueDate : blueprint.issuedAt,
        detail:
          blueprint.status === "overdue"
            ? `Due date ${blueprint.dueDate} passed before the customer released funds.`
            : "Customer remittance note sent and webhook can now confirm settlement.",
        tone: blueprint.status === "overdue" ? "warning" : "positive",
      },
    ],
    actions: blueprint.actions,
  } satisfies PaymentInvoiceRecord;
}

function buildSeedPaidRecord(invoiceId: string, sourceTimesheetId?: string) {
  const invoice = INVOICES.find((item) => item.id === invoiceId);

  if (!invoice) {
    throw new Error(`Unknown invoice seed: ${invoiceId}`);
  }

  const engagement = ENGAGEMENTS.find((item) => item.id === invoice.engagement);
  const talent = engagement ? TALENT.find((item) => item.id === engagement.talentId) : undefined;
  const sourceTimesheet = sourceTimesheetId
    ? TIMESHEETS.find((item) => item.id === sourceTimesheetId)
    : undefined;

  return {
    id: invoice.id,
    providerInvoiceId: `in_${invoice.id.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
    client: invoice.client,
    talentName: talent?.name ?? "Assigned talent",
    engagementId: invoice.engagement,
    engagementTitle: engagement?.jobTitle ?? "Engagement",
    sourceTimesheetId,
    period: normalizePeriod(invoice.period),
    status: "paid",
    statusLabel: STATUS_LABELS.paid,
    hours: invoice.hours,
    rate: invoice.rate,
    subtotal: invoice.subtotal,
    platformFee: invoice.fee,
    tax: 0,
    totalDue: invoice.total,
    talentNet: roundCurrency(invoice.subtotal - invoice.fee),
    remittanceEmail: buildRemittanceEmail(invoice.client),
    paymentRail: "ACH settled",
    payoutEta: `Settled ${invoice.date}`,
    dueDate: invoice.date,
    approvedAt: sourceTimesheet?.approved ?? "Prior approval carried from closed cycle",
    issuedAt: invoice.date,
    paidAt: invoice.date,
    memo: "Historical invoice imported from the shared seed data.",
    clientNote: "This invoice mirrors the already-paid shared billing rows so C1 can consume it later without math drift.",
    operationsNote: "Paid rows establish the baseline for GMV and talent net calculations.",
    webhookReady: false,
    lineItems: [
      {
        label: "Approved labor",
        amount: invoice.subtotal,
        detail: `${formatHours(invoice.hours)} x ${formatMoney(invoice.rate)}/hr`,
      },
      {
        label: "Platform fee",
        amount: invoice.fee,
        detail: "10% Autharis operating fee",
      },
      {
        label: "Tax hook",
        amount: 0,
        detail: "Tax seam reserved, no tax applied in the shipped seed.",
      },
    ],
    timeline: [
      {
        label: "Approved hours synced",
        stamp: sourceTimesheet?.approved ?? "Closed cycle",
        detail: `Billing packet for ${normalizePeriod(invoice.period)} aligned to the shared invoice seed.`,
        tone: "positive",
      },
      {
        label: "Invoice issued",
        stamp: invoice.date,
        detail: "Customer remittance note landed in the settled cycle.",
        tone: "positive",
      },
      {
        label: "Funds captured",
        stamp: invoice.date,
        detail: `Net talent payout ${formatMoney(invoice.subtotal - invoice.fee)} was released after fee separation.`,
        tone: "positive",
      },
    ],
    actions: [
      "Download the printable invoice.",
      "Use this row as the paid-state reference when comparing webhook previews.",
    ],
  } satisfies PaymentInvoiceRecord;
}

function buildDirectSeedRecord(seed: DirectInvoiceSeed) {
  const totals = calculateInvoiceTotals({ hours: seed.hours, rate: seed.rate });
  const statusLabel = STATUS_LABELS[seed.status];

  return {
    id: seed.id,
    providerInvoiceId: seed.providerInvoiceId,
    client: seed.client,
    talentName: seed.talentName,
    engagementId: seed.engagementId,
    engagementTitle: seed.engagementTitle,
    period: seed.period,
    status: seed.status,
    statusLabel,
    hours: seed.hours,
    rate: seed.rate,
    subtotal: totals.subtotal,
    platformFee: totals.platformFee,
    tax: totals.tax,
    totalDue: totals.totalDue,
    talentNet: totals.talentNet,
    remittanceEmail: buildRemittanceEmail(seed.client),
    paymentRail: seed.paymentRail,
    payoutEta: seed.payoutEta,
    dueDate: seed.dueDate,
    approvedAt: seed.approvedAt,
    issuedAt: seed.issuedAt,
    paidAt: seed.paidAt,
    memo: seed.memo,
    clientNote: seed.clientNote,
    operationsNote: seed.operationsNote,
    webhookReady: seed.status === "issued" || seed.status === "overdue",
    lineItems: [
      {
        label: seed.status === "draft" ? "Projected labor" : "Approved labor",
        amount: totals.subtotal,
        detail: `${formatHours(seed.hours)} x ${formatMoney(seed.rate)}/hr`,
      },
      {
        label: "Platform fee",
        amount: totals.platformFee,
        detail: "10% Autharis operating fee",
      },
      {
        label: "Tax hook",
        amount: totals.tax,
        detail: "Present for provider swaps and jurisdiction logic later.",
      },
    ],
    timeline: seed.timeline,
    actions: seed.actions,
  } satisfies PaymentInvoiceRecord;
}

const PAYMENT_INVOICES: PaymentInvoiceRecord[] = [
  buildDirectSeedRecord(DIRECT_SEEDS[0]),
  ...SIMULATED_TIMESHEETS.map((blueprint) => {
    const timesheet = TIMESHEETS.find((item) => item.id === blueprint.timesheetId);

    if (!timesheet) {
      throw new Error(`Unknown timesheet seed: ${blueprint.timesheetId}`);
    }

    return createInvoiceFromTimesheet(timesheet, blueprint);
  }),
  buildSeedPaidRecord("INV-2026-0042", "ts-003"),
  buildSeedPaidRecord("INV-2026-0041"),
];

export function getPaymentInvoices() {
  return PAYMENT_INVOICES;
}

export function getPaymentInvoiceById(id: string) {
  return PAYMENT_INVOICES.find((record) => record.id === id);
}

export function getPaymentInvoiceParams() {
  return PAYMENT_INVOICES.map((record) => ({ id: record.id }));
}

export function getPaymentStateMachine(): PaymentStateNode[] {
  return STATE_COPY.map((node) => ({
    ...node,
    next: STATUS_FLOW[node.status],
  }));
}

export function transitionInvoiceStatus(
  record: PaymentInvoiceRecord,
  nextStatus: PaymentInvoiceStatus,
  stamp = "Simulated just now",
) {
  if (!STATUS_FLOW[record.status].includes(nextStatus)) {
    throw new Error(`Invalid transition from ${record.status} to ${nextStatus}`);
  }

  const nextTimelineEntry: PaymentTimelineItem = {
    label: buildTransitionLabel(nextStatus),
    stamp,
    detail: buildTransitionDetail(record, nextStatus),
    tone: nextStatus === "paid" ? "positive" : nextStatus === "overdue" ? "warning" : "neutral",
  };

  return {
    ...record,
    status: nextStatus,
    statusLabel: STATUS_LABELS[nextStatus],
    paidAt: nextStatus === "paid" ? stamp : record.paidAt,
    issuedAt: nextStatus === "issued" && !record.issuedAt ? stamp : record.issuedAt,
    dueDate: nextStatus === "issued" && !record.dueDate ? "Pending due date" : record.dueDate,
    payoutEta:
      nextStatus === "paid"
        ? `Settled ${stamp}`
        : nextStatus === "overdue"
          ? "Escalate payout hold"
          : nextStatus === "voided"
            ? "No payout - invoice voided"
            : record.payoutEta,
    webhookReady: nextStatus === "issued" || nextStatus === "overdue",
    timeline: [...record.timeline, nextTimelineEntry],
  };
}

export function getPaymentDashboardData(): PaymentDashboardData {
  const records = getPaymentInvoices();
  const totalGMV = roundCurrency(records.filter((record) => record.status !== "voided").reduce((sum, record) => sum + record.totalDue, 0));
  const totalTalentNet = roundCurrency(records.filter((record) => record.status !== "voided").reduce((sum, record) => sum + record.talentNet, 0));
  const atRisk = roundCurrency(
    records
      .filter((record) => record.status === "issued" || record.status === "overdue")
      .reduce((sum, record) => sum + record.totalDue, 0),
  );
  const webhookReady = records.filter((record) => record.webhookReady).length;

  return {
    stats: [
      {
        label: "Simulated GMV",
        value: formatMoney(totalGMV),
        detail: "Combined client-side total across draft, live, and settled invoice paths.",
      },
      {
        label: "Talent net",
        value: formatMoney(totalTalentNet),
        detail: "Net payout after the 10% platform fee, matching the Amara payout math for INV-2026-0047.",
      },
      {
        label: "Webhook ready",
        value: `${webhookReady}`,
        detail: "Invoices that can close through the stubbed invoice.paid endpoint right now.",
      },
      {
        label: "At-risk A/R",
        value: formatMoney(atRisk),
        detail: "Issued and overdue invoices that still control payout timing.",
      },
    ],
    records,
    stateMachine: getPaymentStateMachine(),
    activity: [
      {
        title: "INV-2026-0047 is ready for a paid webhook",
        stamp: "Now",
        detail: "Cedar Health Co-op can flip the end-to-end demo from issued to paid with one stubbed event.",
        tone: "positive",
      },
      {
        title: "INV-2026-0048 aged into overdue",
        stamp: "Apr 22, 2026",
        detail: "Lumen AI funds are late, so talent payout stays paused until finance receives confirmation.",
        tone: "warning",
      },
      {
        title: "INV-2026-0042 proves the settled path",
        stamp: "Apr 14, 2026",
        detail: "Paid client total and net talent payout already reconcile against the shared seed invoice.",
        tone: "neutral",
      },
    ],
    highlightedInvoiceId: "INV-2026-0047",
    webhookSample: {
      endpoint: "/api/payments/webhook",
      invoiceId: "INV-2026-0047",
      body: JSON.stringify(
        {
          invoiceId: "INV-2026-0047",
          type: "invoice.paid",
        },
        null,
        2,
      ),
    },
  };
}

function buildTransitionLabel(status: PaymentInvoiceStatus) {
  if (status === "paid") {
    return "Webhook reconciled payment";
  }

  if (status === "issued") {
    return "Invoice issued";
  }

  if (status === "overdue") {
    return "Invoice marked overdue";
  }

  if (status === "voided") {
    return "Invoice voided";
  }

  return "Invoice saved as draft";
}

function buildTransitionDetail(record: PaymentInvoiceRecord, status: PaymentInvoiceStatus) {
  if (status === "paid") {
    return `Settlement confirmed for ${record.id}; talent net ${formatMoney(record.talentNet)} can clear on the next payout run.`;
  }

  if (status === "overdue") {
    return `Due date passed for ${record.id}; the payout ETA stays blocked until finance hears back from ${record.client}.`;
  }

  if (status === "voided") {
    return `${record.id} was closed before funds moved, preserving a clean audit trail.`;
  }

  if (status === "issued") {
    return `${record.id} was released to ${record.remittanceEmail} and is ready for provider settlement.`;
  }

  return `${record.id} remains editable inside the draft branch.`;
}

function buildRemittanceEmail(client: string) {
  const slug = client
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^the/, "");

  return `billing@${slug || "autharis"}.co`;
}

function normalizePeriod(period: string) {
  return period.replace(/ — /g, " - ");
}
