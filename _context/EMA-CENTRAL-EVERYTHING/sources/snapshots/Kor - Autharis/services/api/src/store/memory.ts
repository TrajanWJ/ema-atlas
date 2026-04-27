import type {
  Talent,
  JobRequest,
  Engagement,
  Timesheet,
  Invoice,
  AdminQueueItem,
} from '../domain/types.js';
import {
  seedTalent,
  seedJobs,
  seedEngagements,
  seedTimesheets,
  seedInvoices,
  seedAdminQueue,
} from '../seed/fixtures.js';

export interface Store {
  // talent
  listTalent(): Talent[];
  getTalent(id: string): Talent | undefined;
  createTalent(input: Omit<Talent, 'id'>): Talent;

  // jobs
  listJobs(): JobRequest[];
  getJob(id: string): JobRequest | undefined;
  createJob(input: Omit<JobRequest, 'id'>): JobRequest;

  // engagements
  listEngagements(): Engagement[];
  getEngagement(id: string): Engagement | undefined;
  createEngagement(input: Omit<Engagement, 'id'>): Engagement;

  // timesheets
  listTimesheets(): Timesheet[];
  getTimesheet(id: string): Timesheet | undefined;
  createTimesheet(input: Omit<Timesheet, 'id'>): Timesheet;

  // invoices
  listInvoices(): Invoice[];
  getInvoice(id: string): Invoice | undefined;
  createInvoice(input: Omit<Invoice, 'id'>): Invoice;

  // admin queue
  listAdminQueue(): AdminQueueItem[];
  getAdminQueueItem(id: string): AdminQueueItem | undefined;
  createAdminQueueItem(input: Omit<AdminQueueItem, 'id'>): AdminQueueItem;
}

function nextId(prefix: string, existing: string[]): string {
  let max = 0;
  for (const id of existing) {
    const match = id.match(/(\d+)(?!.*\d)/);
    if (match && match[1]) {
      const n = Number.parseInt(match[1], 10);
      if (!Number.isNaN(n) && n > max) max = n;
    }
  }
  const padded = String(max + 1).padStart(3, '0');
  return `${prefix}-${padded}`;
}

export function createMemoryStore(): Store {
  const talent: Talent[] = [...seedTalent];
  const jobs: JobRequest[] = [...seedJobs];
  const engagements: Engagement[] = [...seedEngagements];
  const timesheets: Timesheet[] = [...seedTimesheets];
  const invoices: Invoice[] = [...seedInvoices];
  const adminQueue: AdminQueueItem[] = [...seedAdminQueue];

  return {
    listTalent: () => talent.slice(),
    getTalent: (id) => talent.find((t) => t.id === id),
    createTalent: (input) => {
      const row: Talent = { id: nextId('t', talent.map((t) => t.id)), ...input };
      talent.push(row);
      return row;
    },

    listJobs: () => jobs.slice(),
    getJob: (id) => jobs.find((j) => j.id === id),
    createJob: (input) => {
      const row: JobRequest = { id: nextId('jr', jobs.map((j) => j.id)), ...input };
      jobs.push(row);
      return row;
    },

    listEngagements: () => engagements.slice(),
    getEngagement: (id) => engagements.find((e) => e.id === id),
    createEngagement: (input) => {
      const row: Engagement = { id: nextId('e', engagements.map((e) => e.id)), ...input };
      engagements.push(row);
      return row;
    },

    listTimesheets: () => timesheets.slice(),
    getTimesheet: (id) => timesheets.find((t) => t.id === id),
    createTimesheet: (input) => {
      const row: Timesheet = { id: nextId('ts', timesheets.map((t) => t.id)), ...input };
      timesheets.push(row);
      return row;
    },

    listInvoices: () => invoices.slice(),
    getInvoice: (id) => invoices.find((i) => i.id === id),
    createInvoice: (input) => {
      const existingNums = invoices
        .map((i) => i.id.match(/(\d+)$/)?.[1])
        .filter((s): s is string => Boolean(s))
        .map((s) => Number.parseInt(s, 10));
      const next = (existingNums.length ? Math.max(...existingNums) : 0) + 1;
      const id = `INV-2026-${String(next).padStart(4, '0')}`;
      const row: Invoice = { id, ...input };
      invoices.push(row);
      return row;
    },

    listAdminQueue: () => adminQueue.slice(),
    getAdminQueueItem: (id) => adminQueue.find((a) => a.id === id),
    createAdminQueueItem: (input) => {
      const row: AdminQueueItem = { id: nextId('aq', adminQueue.map((a) => a.id)), ...input };
      adminQueue.push(row);
      return row;
    },
  };
}
