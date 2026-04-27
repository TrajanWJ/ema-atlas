import { createSeedSnapshot } from '@/lib/server/seed';
import type {
  AdminQueueFilters,
  AdminQueueRecord,
  AutharisSnapshot,
  CatalogRecord,
  CreateAdminQueueInput,
  CreateEngagementInput,
  CreateInvoiceInput,
  CreateJobRequestInput,
  CreateTalentInput,
  CreateTimesheetInput,
  EngagementFilters,
  EngagementRecord,
  InvoiceFilters,
  InvoiceRecord,
  JobRequestFilters,
  JobRequestRecord,
  TalentFilters,
  TalentRecord,
  TimesheetFilters,
  TimesheetRecord,
  UpdateEngagementInput,
  UpdateJobRequestInput,
  UpdateTalentInput,
  UpdateTimesheetInput,
} from '@/lib/server/contracts';

const AUTHARIS_STORE_KEY = '__autharis_json_store__';

type GlobalWithAutharisStore = typeof globalThis & {
  [AUTHARIS_STORE_KEY]?: AutharisSnapshot;
};

export class AutharisStoreError extends Error {
  constructor(
    readonly code: 'bad_request' | 'conflict' | 'not_found',
    message: string,
  ) {
    super(message);
    this.name = 'AutharisStoreError';
  }
}

function getState(): AutharisSnapshot {
  const globalStore = globalThis as GlobalWithAutharisStore;

  if (!globalStore[AUTHARIS_STORE_KEY]) {
    globalStore[AUTHARIS_STORE_KEY] = createSeedSnapshot();
  }

  return globalStore[AUTHARIS_STORE_KEY];
}

function cloneState<T>(value: T): T {
  return structuredClone(value);
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matchesValue(value: string, expected?: string): boolean {
  return !expected || normalize(value) === normalize(expected);
}

function matchesIncludes(values: string[], expected?: string): boolean {
  return !expected || values.some((value) => normalize(value) === normalize(expected));
}

function withLimit<T>(items: T[], limit?: number): T[] {
  if (limit === undefined) return items;
  return items.slice(0, Math.max(0, limit));
}

function ensureUniqueId<T extends { id: string }>(items: T[], id: string, resourceLabel: string): void {
  if (items.some((item) => item.id === id)) {
    throw new AutharisStoreError('conflict', `${resourceLabel} "${id}" already exists.`);
  }
}

function patchById<T extends { id: string }>(items: T[], id: string, patch: Partial<Omit<T, 'id'>>): T {
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new AutharisStoreError('not_found', `Record "${id}" was not found.`);
  }

  const nextRecord = { ...items[index], ...patch };
  items[index] = nextRecord;
  return cloneState(nextRecord);
}

function readById<T extends { id: string }>(items: T[], id: string): T | null {
  const item = items.find((candidate) => candidate.id === id);
  return item ? cloneState(item) : null;
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${random}`;
}

export class AutharisJsonStore {
  readCatalog(): CatalogRecord {
    const state = getState();
    return cloneState({
      skills: state.skills,
      categories: state.categories,
    });
  }

  readSnapshot(): AutharisSnapshot {
    return cloneState(getState());
  }

  listTalent(filters: TalentFilters = {}): TalentRecord[] {
    const state = getState();
    const filtered = state.talent.filter((record) => {
      return (
        matchesValue(record.status, filters.status) &&
        matchesIncludes(record.categories, filters.category) &&
        matchesIncludes(record.skills, filters.skill) &&
        matchesIncludes(record.industries, filters.industry)
      );
    });

    return cloneState(withLimit(filtered, filters.limit));
  }

  getTalent(id: string): TalentRecord | null {
    return readById(getState().talent, id);
  }

  createTalent(input: CreateTalentInput): TalentRecord {
    const state = getState();
    const id = input.id ?? createId('t');

    ensureUniqueId(state.talent, id, 'Talent');

    const nextRecord: TalentRecord = { ...input, id };
    state.talent.unshift(nextRecord);
    return cloneState(nextRecord);
  }

  updateTalent(id: string, patch: UpdateTalentInput): TalentRecord {
    return patchById(getState().talent, id, patch);
  }

  listJobRequests(filters: JobRequestFilters = {}): JobRequestRecord[] {
    const state = getState();
    const filtered = state.jobRequests.filter((record) => {
      return (
        matchesValue(record.category, filters.category) &&
        matchesValue(record.client, filters.client) &&
        matchesValue(record.industry, filters.industry) &&
        matchesValue(record.status, filters.status)
      );
    });

    return cloneState(withLimit(filtered, filters.limit));
  }

  getJobRequest(id: string): JobRequestRecord | null {
    return readById(getState().jobRequests, id);
  }

  createJobRequest(input: CreateJobRequestInput): JobRequestRecord {
    const state = getState();
    const id = input.id ?? createId('jr');

    ensureUniqueId(state.jobRequests, id, 'Job request');

    const nextRecord: JobRequestRecord = { ...input, id };
    state.jobRequests.unshift(nextRecord);
    return cloneState(nextRecord);
  }

  updateJobRequest(id: string, patch: UpdateJobRequestInput): JobRequestRecord {
    return patchById(getState().jobRequests, id, patch);
  }

  listEngagements(filters: EngagementFilters = {}): EngagementRecord[] {
    const state = getState();
    const filtered = state.engagements.filter((record) => {
      return (
        matchesValue(record.client, filters.client) &&
        matchesValue(record.jobId, filters.jobId) &&
        matchesValue(record.talentId, filters.talentId) &&
        matchesValue(record.status, filters.status)
      );
    });

    return cloneState(withLimit(filtered, filters.limit));
  }

  createEngagement(input: CreateEngagementInput): EngagementRecord {
    const state = getState();
    const id = input.id ?? createId('e');

    ensureUniqueId(state.engagements, id, 'Engagement');

    const nextRecord: EngagementRecord = { ...input, id };
    state.engagements.unshift(nextRecord);
    return cloneState(nextRecord);
  }

  updateEngagement(id: string, patch: UpdateEngagementInput): EngagementRecord {
    return patchById(getState().engagements, id, patch);
  }

  listTimesheets(filters: TimesheetFilters = {}): TimesheetRecord[] {
    const state = getState();
    const filtered = state.timesheets.filter((record) => {
      return (
        matchesValue(record.client, filters.client) &&
        matchesValue(record.engagementId, filters.engagementId) &&
        matchesValue(record.status, filters.status)
      );
    });

    return cloneState(withLimit(filtered, filters.limit));
  }

  createTimesheet(input: CreateTimesheetInput): TimesheetRecord {
    const state = getState();
    const id = input.id ?? createId('ts');

    ensureUniqueId(state.timesheets, id, 'Timesheet');

    const nextRecord: TimesheetRecord = { ...input, id };
    state.timesheets.unshift(nextRecord);
    return cloneState(nextRecord);
  }

  updateTimesheet(id: string, patch: UpdateTimesheetInput): TimesheetRecord {
    return patchById(getState().timesheets, id, patch);
  }

  listInvoices(filters: InvoiceFilters = {}): InvoiceRecord[] {
    const state = getState();
    const filtered = state.invoices.filter((record) => {
      return (
        matchesValue(record.client, filters.client) &&
        matchesValue(record.engagement, filters.engagementId) &&
        matchesValue(record.status, filters.status)
      );
    });

    return cloneState(withLimit(filtered, filters.limit));
  }

  createInvoice(input: CreateInvoiceInput): InvoiceRecord {
    const state = getState();
    const id = input.id ?? createId('inv');

    ensureUniqueId(state.invoices, id, 'Invoice');

    const nextRecord: InvoiceRecord = { ...input, id };
    state.invoices.unshift(nextRecord);
    return cloneState(nextRecord);
  }

  listAdminQueue(filters: AdminQueueFilters = {}): AdminQueueRecord[] {
    const state = getState();
    const filtered = state.adminQueue.filter((record) => {
      return matchesValue(record.kind, filters.kind) && matchesValue(record.priority, filters.priority);
    });

    return cloneState(withLimit(filtered, filters.limit));
  }

  createAdminQueueItem(input: CreateAdminQueueInput): AdminQueueRecord {
    const state = getState();
    state.adminQueue.unshift(input);
    return cloneState(input);
  }
}

export const autharisJsonStore = new AutharisJsonStore();
