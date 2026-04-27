import {
  CLIENT_ENGAGEMENTS,
  CLIENT_INVOICES,
  CLIENT_TIMESHEETS,
  type ClientInvoice,
} from '@/lib/client/data';

export type FinancePacketStatus = 'Needs approval' | 'Ready to release';
export type FinancePacketRisk = 'Low' | 'Medium';
export type FinanceTone = 'positive' | 'neutral' | 'warning';

export type FinanceMetric = {
  label: string;
  value: string;
  note: string;
};

export type FinanceSignal = {
  label: string;
  value: string;
  detail: string;
  tone: FinanceTone;
};

export type FinanceChecklistItem = {
  label: string;
  detail: string;
  complete: boolean;
};

export type FinanceTimelineItem = {
  label: string;
  stamp: string;
  detail: string;
  tone: 'done' | 'current' | 'upcoming';
};

export type FinanceLineItem = {
  label: string;
  amount: number;
  detail: string;
};

export type FinanceClientLedger = {
  client: string;
  released: number;
  pending: number;
  nextRun: string;
  riskCount: number;
  activePacketIds: string[];
};

export type FinancePacket = {
  id: string;
  sourceTimesheetId: string;
  invoicePreviewId: string;
  client: string;
  engagementId: string;
  engagementTitle: string;
  talentName: string;
  period: string;
  submittedAt: string;
  hours: number;
  rate: number;
  subtotal: number;
  fee: number;
  total: number;
  status: FinancePacketStatus;
  risk: FinancePacketRisk;
  owner: string;
  paymentRail: string;
  nextMilestone: string;
  narrative: string;
  actions: string[];
  checklist: FinanceChecklistItem[];
  signals: FinanceSignal[];
  lineItems: FinanceLineItem[];
  timeline: FinanceTimelineItem[];
  entries: Array<{ day: string; hours: number; amount: number; note: string }>;
  priorInvoices: ClientInvoice[];
};

export type FinanceOverview = {
  metrics: FinanceMetric[];
  ledgers: FinanceClientLedger[];
  statusBuckets: Array<{ label: string; value: string; detail: string }>;
};

const PLATFORM_FEE_RATE = 0.1;

const PACKET_BLUEPRINTS: Record<
  string,
  {
    status: FinancePacketStatus;
    risk: FinancePacketRisk;
    owner: string;
    paymentRail: string;
    nextMilestone: string;
    narrative: string;
    actionTrail: string[];
    reviewNotes: string[];
    releaseNote: string;
    budgetNote: string;
  }
> = {
  'ts-001': {
    status: 'Ready to release',
    risk: 'Low',
    owner: 'Dana Shaw · Finance ops',
    paymentRail: 'ACH batch · Wednesday release',
    nextMilestone: 'Release in today’s 4:00 PM ET batch',
    narrative:
      'Cedar Health’s after-hours care packet is clean: the rate matches the active engagement, the notes show the expected queue pattern, and the client already operates on autopay.',
    actionTrail: [
      'Ship the packet in the current ACH batch.',
      'Bundle the queue-closure summary into the client-facing remittance note.',
      'Keep the next week’s packet on the same release cadence unless utilization jumps above 22 hours.',
    ],
    reviewNotes: [
      'Timesheet receipt and shift notes are complete.',
      'Rate is consistent with the engagement and prior paid history.',
      'No budget exceptions are needed before release.',
    ],
    releaseNote: 'Autopay enabled. Funds settle the next business morning.',
    budgetNote: 'Within the expected weekly range for this engagement.',
  },
  'ts-002': {
    status: 'Needs approval',
    risk: 'Medium',
    owner: 'Leah Patel · Client finance',
    paymentRail: 'ACH batch · pending client signoff',
    nextMilestone: 'Await scope confirmation before Thursday noon ET',
    narrative:
      'Lumen AI’s packet is financially sound, but the midweek RAG eval work expanded beyond the usual QA brief. Finance should confirm the extra block before the invoice is released.',
    actionTrail: [
      'Confirm the RAG eval block is billable under the current SOW.',
      'Ask client ops whether the expanded QA rubric should become a recurring line item.',
      'If approved, queue the packet for the next ACH release without changing the talent rate.',
    ],
    reviewNotes: [
      'Timesheet notes clearly explain the additional QA and eval work.',
      'Historical rates match, but this week’s scope is broader than the prior invoice pattern.',
      'Hold release until the client contact acknowledges the expanded batch.',
    ],
    releaseNote: 'Manual hold in place until scope is confirmed.',
    budgetNote: 'Amount is reasonable, but the work mix needs approval before release.',
  },
};

export function getClientFinancePackets(): FinancePacket[] {
  return CLIENT_TIMESHEETS.filter((timesheet) => timesheet.status === 'Submitted').map((timesheet) => {
    const engagement = CLIENT_ENGAGEMENTS.find((item) => item.id === timesheet.engagementId);
    const blueprint = PACKET_BLUEPRINTS[timesheet.id] ?? {
      status: 'Ready to release' as const,
      risk: 'Low' as const,
      owner: 'Finance team',
      paymentRail: 'ACH batch',
      nextMilestone: 'Queue for release',
      narrative: 'Lane-local finance packet.',
      actionTrail: ['Review and release the packet.'],
      reviewNotes: ['Packet assembled from submitted timesheet data.'],
      releaseNote: 'Release planning in progress.',
      budgetNote: 'Budget note pending.',
    };
    const subtotal = roundMoney(timesheet.hours * timesheet.rate);
    const fee = roundMoney(subtotal * PLATFORM_FEE_RATE);
    const total = roundMoney(subtotal + fee);
    const priorInvoices = CLIENT_INVOICES.filter((invoice) => invoice.engagement === timesheet.engagementId);
    const averageHistory = priorInvoices.length > 0 ? priorInvoices.reduce((sum, invoice) => sum + invoice.total, 0) / priorInvoices.length : total;
    const utilizationDelta = roundMoney(total - averageHistory);

    return {
      id: `packet-${timesheet.id}`,
      sourceTimesheetId: timesheet.id,
      invoicePreviewId: `PKT-${timesheet.id.toUpperCase().replace('-', '')}`,
      client: timesheet.client,
      engagementId: timesheet.engagementId,
      engagementTitle: timesheet.engagementTitle,
      talentName: timesheet.talentName,
      period: timesheet.weekOf,
      submittedAt: timesheet.submitted,
      hours: timesheet.hours,
      rate: timesheet.rate,
      subtotal,
      fee,
      total,
      status: blueprint.status,
      risk: blueprint.risk,
      owner: blueprint.owner,
      paymentRail: blueprint.paymentRail,
      nextMilestone: blueprint.nextMilestone,
      narrative: blueprint.narrative,
      actions: blueprint.actionTrail,
      checklist: [
        {
          label: 'Timesheet receipt packaged',
          detail: `${timesheet.entries.length} daily notes included in the packet.`,
          complete: true,
        },
        {
          label: 'Rate verified against engagement',
          detail: engagement ? `$${engagement.rate}/hr on active engagement ${engagement.id}.` : 'No matching engagement found.',
          complete: Boolean(engagement && engagement.rate === timesheet.rate),
        },
        {
          label: 'Budget envelope reviewed',
          detail: blueprint.budgetNote,
          complete: blueprint.status === 'Ready to release',
        },
        {
          label: 'Release path confirmed',
          detail: blueprint.releaseNote,
          complete: blueprint.status === 'Ready to release',
        },
      ],
      signals: [
        {
          label: 'Packet total',
          value: formatCurrency(total),
          detail: `${timesheet.hours} hrs at ${formatCurrency(timesheet.rate)}/hr plus platform fee.`,
          tone: blueprint.status === 'Ready to release' ? 'positive' : 'neutral',
        },
        {
          label: 'Variance vs history',
          value: `${utilizationDelta >= 0 ? '+' : '-'}${formatCurrency(Math.abs(utilizationDelta))}`,
          detail: `Compared with the average of ${priorInvoices.length || 0} prior paid invoices.`,
          tone: Math.abs(utilizationDelta) < 120 ? 'positive' : blueprint.status === 'Ready to release' ? 'neutral' : 'warning',
        },
        {
          label: 'Risk posture',
          value: blueprint.risk,
          detail: blueprint.reviewNotes[1] ?? blueprint.reviewNotes[0],
          tone: blueprint.risk === 'Low' ? 'positive' : 'warning',
        },
      ],
      lineItems: [
        {
          label: 'Labor subtotal',
          amount: subtotal,
          detail: `${timesheet.hours} hrs x ${formatCurrency(timesheet.rate)}`,
        },
        {
          label: 'Platform fee',
          amount: fee,
          detail: '10% Autharis operating fee',
        },
        {
          label: 'Client total',
          amount: total,
          detail: blueprint.releaseNote,
        },
      ],
      timeline: [
        {
          label: 'Timesheet submitted',
          stamp: timesheet.submitted,
          detail: `${timesheet.talentName} submitted ${timesheet.hours} hours for ${timesheet.weekOf}.`,
          tone: 'done',
        },
        {
          label: blueprint.status === 'Ready to release' ? 'Packet assembled' : 'Packet assembled with review hold',
          stamp: 'Apr 22, 2026 · 9:10 AM ET',
          detail: blueprint.reviewNotes[0],
          tone: 'done',
        },
        {
          label: blueprint.status === 'Ready to release' ? 'Finance signoff complete' : 'Waiting on client scope signoff',
          stamp: blueprint.status === 'Ready to release' ? 'Apr 22, 2026 · 10:05 AM ET' : 'Due by Apr 23, 2026 · 12:00 PM ET',
          detail: blueprint.reviewNotes[1],
          tone: blueprint.status === 'Ready to release' ? 'current' : 'current',
        },
        {
          label: 'Release milestone',
          stamp: blueprint.nextMilestone,
          detail: blueprint.reviewNotes[2],
          tone: blueprint.status === 'Ready to release' ? 'upcoming' : 'upcoming',
        },
      ],
      entries: timesheet.entries.map((entry) => ({
        day: entry.day,
        hours: entry.hours,
        amount: roundMoney(entry.hours * timesheet.rate),
        note: entry.note,
      })),
      priorInvoices,
    };
  });
}

export function getClientFinancePacket(packetId: string) {
  return getClientFinancePackets().find((packet) => packet.id === packetId) ?? null;
}

export function getDefaultClientFinancePacketId() {
  return getClientFinancePackets()[0]?.id ?? '';
}

export function getClientFinanceOverview(): FinanceOverview {
  const packets = getClientFinancePackets();
  const readyPackets = packets.filter((packet) => packet.status === 'Ready to release');
  const releasedThisMonth = CLIENT_INVOICES.filter((invoice) => invoice.date.includes('Apr')).reduce(
    (sum, invoice) => sum + invoice.total,
    0
  );
  const ledgers = Array.from(new Set([...packets.map((packet) => packet.client), ...CLIENT_INVOICES.map((invoice) => invoice.client)])).map(
    (client) => {
      const clientPackets = packets.filter((packet) => packet.client === client);
      const clientInvoices = CLIENT_INVOICES.filter((invoice) => invoice.client === client);

      return {
        client,
        released: roundMoney(clientInvoices.reduce((sum, invoice) => sum + invoice.total, 0)),
        pending: roundMoney(clientPackets.reduce((sum, packet) => sum + packet.total, 0)),
        nextRun: clientPackets[0]?.nextMilestone ?? 'No active packet',
        riskCount: clientPackets.filter((packet) => packet.risk === 'Medium').length,
        activePacketIds: clientPackets.map((packet) => packet.id),
      };
    }
  );

  return {
    metrics: [
      {
        label: 'Draft packet value',
        value: formatCurrency(packets.reduce((sum, packet) => sum + packet.total, 0)),
        note: `${packets.length} submitted timesheets staged for finance review.`,
      },
      {
        label: 'Ready in this batch',
        value: formatCurrency(readyPackets.reduce((sum, packet) => sum + packet.total, 0)),
        note: `${readyPackets.length} packet${readyPackets.length === 1 ? '' : 's'} can release today.`,
      },
      {
        label: 'Approval holds',
        value: `${packets.filter((packet) => packet.status === 'Needs approval').length}`,
        note: 'Scope or budget confirmations still needed before release.',
      },
      {
        label: 'Released in April',
        value: formatCurrency(releasedThisMonth),
        note: `${CLIENT_INVOICES.length} paid invoices already reconciled this month.`,
      },
    ],
    ledgers,
    statusBuckets: [
      {
        label: 'Ready',
        value: `${readyPackets.length}`,
        detail: 'Packets clear to move into the next ACH batch.',
      },
      {
        label: 'Held',
        value: `${packets.filter((packet) => packet.status === 'Needs approval').length}`,
        detail: 'Packets with a client-facing confirmation still pending.',
      },
      {
        label: 'Low risk',
        value: `${packets.filter((packet) => packet.risk === 'Low').length}`,
        detail: 'Fully documented packets with no scope variance concerns.',
      },
    ],
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
