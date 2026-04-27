// Lane F8 — event type contracts for the Bun WebSocket gateway.
//
// The gateway is channel-scoped: every event carries a `channel` field, and
// subscribers connect against one channel at a time. `userId` and
// `engagementId` are optional scoping hints so consumers can filter further
// without a second round-trip.

export type EventChannel =
  | "matches"
  | "timesheets"
  | "invoices"
  | "disputes"
  | "messages";

interface BaseEvent<K extends string, P> {
  kind: K;
  channel: EventChannel;
  userId?: string;
  engagementId?: string;
  ts: number;
  payload: P;
}

export type MatchFoundEvent = BaseEvent<
  "match-found",
  {
    jobId: string;
    talentId: string;
    score: number;
  }
>;

export type TimesheetSubmittedEvent = BaseEvent<
  "timesheet-submitted",
  {
    timesheetId: string;
    hours: number;
    submittedBy: string;
  }
>;

export type InvoicePaidEvent = BaseEvent<
  "invoice-paid",
  {
    invoiceId: string;
    amountCents: number;
    currency: string;
  }
>;

export type DisputeOpenedEvent = BaseEvent<
  "dispute-opened",
  {
    disputeId: string;
    reason: string;
    openedBy: string;
  }
>;

export type MessageReceivedEvent = BaseEvent<
  "message-received",
  {
    messageId: string;
    from: string;
    body: string;
  }
>;

export type Event =
  | MatchFoundEvent
  | TimesheetSubmittedEvent
  | InvoicePaidEvent
  | DisputeOpenedEvent
  | MessageReceivedEvent;

export type EventKind = Event["kind"];

export function isEvent(x: unknown): x is Event {
  if (!x || typeof x !== "object") return false;
  const e = x as Record<string, unknown>;
  if (typeof e.kind !== "string") return false;
  if (typeof e.channel !== "string") return false;
  if (typeof e.ts !== "number") return false;
  if (e.payload === undefined || e.payload === null) return false;
  return true;
}
