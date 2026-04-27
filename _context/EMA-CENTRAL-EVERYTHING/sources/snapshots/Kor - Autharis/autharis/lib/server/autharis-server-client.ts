import { autharisJsonStore } from '@/lib/db/autharis-store';
import type {
  AdminQueueFilters,
  CreateAdminQueueInput,
  CreateEngagementInput,
  CreateInvoiceInput,
  CreateJobRequestInput,
  CreateTalentInput,
  CreateTimesheetInput,
  EngagementFilters,
  InvoiceFilters,
  JobRequestFilters,
  TalentFilters,
  TimesheetFilters,
  UpdateEngagementInput,
  UpdateJobRequestInput,
  UpdateTalentInput,
  UpdateTimesheetInput,
} from '@/lib/server/contracts';

export const autharisServerClient = {
  catalog: {
    async read() {
      return autharisJsonStore.readCatalog();
    },
  },
  snapshot: {
    async read() {
      return autharisJsonStore.readSnapshot();
    },
  },
  talent: {
    async list(filters?: TalentFilters) {
      return autharisJsonStore.listTalent(filters);
    },
    async get(id: string) {
      return autharisJsonStore.getTalent(id);
    },
    async create(input: CreateTalentInput) {
      return autharisJsonStore.createTalent(input);
    },
    async update(id: string, patch: UpdateTalentInput) {
      return autharisJsonStore.updateTalent(id, patch);
    },
  },
  jobRequests: {
    async list(filters?: JobRequestFilters) {
      return autharisJsonStore.listJobRequests(filters);
    },
    async get(id: string) {
      return autharisJsonStore.getJobRequest(id);
    },
    async create(input: CreateJobRequestInput) {
      return autharisJsonStore.createJobRequest(input);
    },
    async update(id: string, patch: UpdateJobRequestInput) {
      return autharisJsonStore.updateJobRequest(id, patch);
    },
  },
  engagements: {
    async list(filters?: EngagementFilters) {
      return autharisJsonStore.listEngagements(filters);
    },
    async create(input: CreateEngagementInput) {
      return autharisJsonStore.createEngagement(input);
    },
    async update(id: string, patch: UpdateEngagementInput) {
      return autharisJsonStore.updateEngagement(id, patch);
    },
  },
  timesheets: {
    async list(filters?: TimesheetFilters) {
      return autharisJsonStore.listTimesheets(filters);
    },
    async create(input: CreateTimesheetInput) {
      return autharisJsonStore.createTimesheet(input);
    },
    async update(id: string, patch: UpdateTimesheetInput) {
      return autharisJsonStore.updateTimesheet(id, patch);
    },
  },
  invoices: {
    async list(filters?: InvoiceFilters) {
      return autharisJsonStore.listInvoices(filters);
    },
    async create(input: CreateInvoiceInput) {
      return autharisJsonStore.createInvoice(input);
    },
  },
  adminQueue: {
    async list(filters?: AdminQueueFilters) {
      return autharisJsonStore.listAdminQueue(filters);
    },
    async create(input: CreateAdminQueueInput) {
      return autharisJsonStore.createAdminQueueItem(input);
    },
  },
};
