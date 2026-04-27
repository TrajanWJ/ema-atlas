// @autharis/sdk — types.ts
// Hand-written mirrors of `autharis/lib/data.ts`. Do not import from there:
// the SDK is a standalone package with zero runtime dependencies.

// ---------- Shared primitives ----------

export type ISODate = string;

export interface Paginated<T> {
  readonly items: ReadonlyArray<T>;
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly hasMore: boolean;
}

export interface ApiError {
  readonly status: number;
  readonly code: string;
  readonly message: string;
  readonly requestId?: string;
  readonly details?: unknown;
}

// ---------- Status enums (narrow unions) ----------

export type TalentStatus = 'Active' | 'Pending' | 'Paused' | 'Offboarded';
export type JobStatus =
  | 'Draft'
  | 'Reviewing'
  | 'Shortlist ready'
  | 'Matched'
  | 'Closed';
export type EngagementStatus = 'Active' | 'Paused' | 'Closed';
export type TimesheetStatus = 'Draft' | 'Submitted' | 'Approved' | 'Disputed' | 'Rejected';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Void';
export type AdminQueueKind = 'profile' | 'match' | 'dispute' | 'payout';
export type AdminQueuePriority = 'low' | 'normal' | 'high';

// ---------- Resources ----------

export interface Talent {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly title: string;
  readonly city: string;
  readonly timezone: string;
  readonly rate: number;
  readonly availability: string;
  readonly categories: ReadonlyArray<string>;
  readonly skills: ReadonlyArray<string>;
  readonly industries: ReadonlyArray<string>;
  readonly status: TalentStatus;
  readonly bio: string;
  readonly score: number;
  readonly breakdown: Readonly<Record<string, number>>;
  readonly yearsExp: number;
}

export interface JobRequest {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly client: string;
  readonly description: string;
  readonly hoursPerWeek: number;
  readonly duration: string;
  readonly timezone: string;
  readonly budget: readonly [number, number];
  readonly skills: ReadonlyArray<string>;
  readonly industry: string;
  readonly status: JobStatus;
  readonly posted: string;
  readonly matches: number;
}

export interface CreateJobRequestInput {
  readonly title: string;
  readonly category: string;
  readonly client: string;
  readonly description: string;
  readonly hoursPerWeek: number;
  readonly duration: string;
  readonly timezone: string;
  readonly budget: readonly [number, number];
  readonly skills: ReadonlyArray<string>;
  readonly industry: string;
}

export interface Engagement {
  readonly id: string;
  readonly jobId: string;
  readonly jobTitle: string;
  readonly talentId: string;
  readonly talentName: string;
  readonly client: string;
  readonly rate: number;
  readonly status: EngagementStatus;
  readonly started: ISODate;
  readonly hoursThisWeek: number;
  readonly hoursApproved: number;
  readonly hoursPending: number;
}

export interface TimesheetEntry {
  readonly day: string;
  readonly hours: number;
  readonly note: string;
}

export interface Timesheet {
  readonly id: string;
  readonly engagementId: string;
  readonly engagementTitle: string;
  readonly talentName: string;
  readonly client: string;
  readonly weekOf: string;
  readonly status: TimesheetStatus;
  readonly hours: number;
  readonly rate: number;
  readonly entries: ReadonlyArray<TimesheetEntry>;
  readonly submitted: string;
  readonly approved?: string;
}

export interface SubmitTimesheetInput {
  readonly engagementId: string;
  readonly weekOf: string;
  readonly entries: ReadonlyArray<TimesheetEntry>;
}

export interface Invoice {
  readonly id: string;
  readonly engagement: string;
  readonly client: string;
  readonly period: string;
  readonly hours: number;
  readonly rate: number;
  readonly subtotal: number;
  readonly fee: number;
  readonly total: number;
  readonly status: InvoiceStatus;
  readonly date: ISODate;
}

export interface AdminQueueItem {
  readonly kind: AdminQueueKind;
  readonly who: string;
  readonly what: string;
  readonly meta: string;
  readonly age: string;
  readonly priority: AdminQueuePriority;
}

export type AdminQueueAction = 'approve' | 'reject' | 'escalate' | 'snooze';

export interface AdminQueueActInput {
  readonly action: AdminQueueAction;
  readonly note?: string;
}

// ---------- Query/listing shapes ----------

export interface ListQuery {
  readonly page?: number;
  readonly pageSize?: number;
  readonly q?: string;
}

export interface TalentListQuery extends ListQuery {
  readonly status?: TalentStatus;
  readonly category?: string;
  readonly skill?: string;
}

export interface JobListQuery extends ListQuery {
  readonly status?: JobStatus;
  readonly category?: string;
}

export interface EngagementListQuery extends ListQuery {
  readonly status?: EngagementStatus;
  readonly talentId?: string;
  readonly jobId?: string;
}

export interface TimesheetListQuery extends ListQuery {
  readonly status?: TimesheetStatus;
  readonly engagementId?: string;
}

export interface InvoiceListQuery extends ListQuery {
  readonly status?: InvoiceStatus;
  readonly engagementId?: string;
}

export interface AdminQueueListQuery extends ListQuery {
  readonly kind?: AdminQueueKind;
  readonly priority?: AdminQueuePriority;
}
