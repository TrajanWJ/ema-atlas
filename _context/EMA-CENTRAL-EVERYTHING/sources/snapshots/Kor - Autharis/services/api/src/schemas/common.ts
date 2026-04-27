import { Type } from '@sinclair/typebox';

export const ErrorSchema = Type.Object(
  {
    statusCode: Type.Integer(),
    error: Type.String(),
    message: Type.String(),
  },
  { $id: 'Error' },
);

export const IdParamSchema = Type.Object({
  id: Type.String({ minLength: 1 }),
});

export const TalentSchema = Type.Object(
  {
    id: Type.String(),
    name: Type.String(),
    initials: Type.String(),
    title: Type.String(),
    city: Type.String(),
    timezone: Type.String(),
    rate: Type.Number(),
    availability: Type.String(),
    categories: Type.Array(Type.String()),
    skills: Type.Array(Type.String()),
    industries: Type.Array(Type.String()),
    status: Type.String(),
    bio: Type.String(),
    score: Type.Number(),
    breakdown: Type.Record(Type.String(), Type.Number()),
    yearsExp: Type.Number(),
  },
  { $id: 'Talent' },
);

export const TalentCreateSchema = Type.Omit(TalentSchema, ['id'], { $id: 'TalentCreate' });

export const JobSchema = Type.Object(
  {
    id: Type.String(),
    title: Type.String(),
    category: Type.String(),
    client: Type.String(),
    description: Type.String(),
    hoursPerWeek: Type.Number(),
    duration: Type.String(),
    timezone: Type.String(),
    budget: Type.Tuple([Type.Number(), Type.Number()]),
    skills: Type.Array(Type.String()),
    industry: Type.String(),
    status: Type.String(),
    posted: Type.String(),
    matches: Type.Integer(),
  },
  { $id: 'JobRequest' },
);

export const JobCreateSchema = Type.Omit(JobSchema, ['id'], { $id: 'JobRequestCreate' });

export const EngagementSchema = Type.Object(
  {
    id: Type.String(),
    jobId: Type.String(),
    jobTitle: Type.String(),
    talentId: Type.String(),
    talentName: Type.String(),
    client: Type.String(),
    rate: Type.Number(),
    status: Type.String(),
    started: Type.String(),
    hoursThisWeek: Type.Number(),
    hoursApproved: Type.Number(),
    hoursPending: Type.Number(),
  },
  { $id: 'Engagement' },
);

export const EngagementCreateSchema = Type.Omit(EngagementSchema, ['id'], {
  $id: 'EngagementCreate',
});

export const TimesheetEntrySchema = Type.Object(
  {
    day: Type.String(),
    hours: Type.Number(),
    note: Type.String(),
  },
  { $id: 'TimesheetEntry' },
);

export const TimesheetSchema = Type.Object(
  {
    id: Type.String(),
    engagementId: Type.String(),
    engagementTitle: Type.String(),
    talentName: Type.String(),
    client: Type.String(),
    weekOf: Type.String(),
    status: Type.String(),
    hours: Type.Number(),
    rate: Type.Number(),
    entries: Type.Array(TimesheetEntrySchema),
    submitted: Type.String(),
    approved: Type.Optional(Type.String()),
  },
  { $id: 'Timesheet' },
);

export const TimesheetCreateSchema = Type.Omit(TimesheetSchema, ['id'], {
  $id: 'TimesheetCreate',
});

export const InvoiceSchema = Type.Object(
  {
    id: Type.String(),
    engagement: Type.String(),
    client: Type.String(),
    period: Type.String(),
    hours: Type.Number(),
    rate: Type.Number(),
    subtotal: Type.Number(),
    fee: Type.Number(),
    total: Type.Number(),
    status: Type.String(),
    date: Type.String(),
  },
  { $id: 'Invoice' },
);

export const InvoiceCreateSchema = Type.Omit(InvoiceSchema, ['id'], { $id: 'InvoiceCreate' });

export const AdminQueueItemSchema = Type.Object(
  {
    id: Type.String(),
    kind: Type.String(),
    who: Type.String(),
    what: Type.String(),
    meta: Type.String(),
    age: Type.String(),
    priority: Type.String(),
  },
  { $id: 'AdminQueueItem' },
);

export const AdminQueueItemCreateSchema = Type.Omit(AdminQueueItemSchema, ['id'], {
  $id: 'AdminQueueItemCreate',
});
