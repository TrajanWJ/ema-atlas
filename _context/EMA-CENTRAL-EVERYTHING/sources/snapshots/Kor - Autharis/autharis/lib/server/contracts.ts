import type { JobRequest as LegacyJobRequest, Talent as LegacyTalent, Timesheet as LegacyTimesheet } from '@/lib/data';

export type SkillRecord = string;

export type CategoryRecord = {
  id: string;
  label: string;
  blurb: string;
};

export type TalentRecord = LegacyTalent;
export type JobRequestRecord = LegacyJobRequest;
export type TimesheetRecord = LegacyTimesheet;

export type EngagementRecord = {
  id: string;
  jobId: string;
  jobTitle: string;
  talentId: string;
  talentName: string;
  client: string;
  rate: number;
  status: string;
  started: string;
  hoursThisWeek: number;
  hoursApproved: number;
  hoursPending: number;
};

export type InvoiceRecord = {
  id: string;
  engagement: string;
  client: string;
  period: string;
  hours: number;
  rate: number;
  subtotal: number;
  fee: number;
  total: number;
  status: string;
  date: string;
};

export type AdminQueueRecord = {
  kind: string;
  who: string;
  what: string;
  meta: string;
  age: string;
  priority: string;
};

export type AutharisSnapshot = {
  skills: SkillRecord[];
  categories: CategoryRecord[];
  talent: TalentRecord[];
  jobRequests: JobRequestRecord[];
  engagements: EngagementRecord[];
  timesheets: TimesheetRecord[];
  invoices: InvoiceRecord[];
  adminQueue: AdminQueueRecord[];
};

export type CatalogRecord = Pick<AutharisSnapshot, 'skills' | 'categories'>;

export type TalentFilters = {
  category?: string;
  status?: string;
  skill?: string;
  industry?: string;
  limit?: number;
};

export type JobRequestFilters = {
  category?: string;
  client?: string;
  industry?: string;
  status?: string;
  limit?: number;
};

export type EngagementFilters = {
  client?: string;
  jobId?: string;
  talentId?: string;
  status?: string;
  limit?: number;
};

export type TimesheetFilters = {
  client?: string;
  engagementId?: string;
  status?: string;
  limit?: number;
};

export type InvoiceFilters = {
  client?: string;
  engagementId?: string;
  status?: string;
  limit?: number;
};

export type AdminQueueFilters = {
  kind?: string;
  priority?: string;
  limit?: number;
};

export type CreateTalentInput = Omit<TalentRecord, 'id'> & { id?: string };
export type UpdateTalentInput = Partial<Omit<TalentRecord, 'id'>>;

export type CreateJobRequestInput = Omit<JobRequestRecord, 'id'> & { id?: string };
export type UpdateJobRequestInput = Partial<Omit<JobRequestRecord, 'id'>>;

export type CreateEngagementInput = Omit<EngagementRecord, 'id'> & { id?: string };
export type UpdateEngagementInput = Partial<Omit<EngagementRecord, 'id'>>;

export type CreateTimesheetInput = Omit<TimesheetRecord, 'id'> & { id?: string };
export type UpdateTimesheetInput = Partial<Omit<TimesheetRecord, 'id'>>;

export type CreateInvoiceInput = Omit<InvoiceRecord, 'id'> & { id?: string };

export type CreateAdminQueueInput = AdminQueueRecord;

export type ApiMeta = {
  count?: number;
};

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta?: ApiMeta;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};
