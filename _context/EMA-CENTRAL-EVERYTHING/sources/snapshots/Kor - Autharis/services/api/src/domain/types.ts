// Domain types mirror the seed shapes in autharis/lib/data.ts.
// Kept local on purpose — autharis/ is the Next.js workspace and does not
// publish these to the monorepo. A later packages/schemas lane can unify.

export type Talent = {
  id: string;
  name: string;
  initials: string;
  title: string;
  city: string;
  timezone: string;
  rate: number;
  availability: string;
  categories: string[];
  skills: string[];
  industries: string[];
  status: string;
  bio: string;
  score: number;
  breakdown: Record<string, number>;
  yearsExp: number;
};

export type JobRequest = {
  id: string;
  title: string;
  category: string;
  client: string;
  description: string;
  hoursPerWeek: number;
  duration: string;
  timezone: string;
  budget: [number, number];
  skills: string[];
  industry: string;
  status: string;
  posted: string;
  matches: number;
};

export type Engagement = {
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

export type TimesheetEntry = {
  day: string;
  hours: number;
  note: string;
};

export type Timesheet = {
  id: string;
  engagementId: string;
  engagementTitle: string;
  talentName: string;
  client: string;
  weekOf: string;
  status: string;
  hours: number;
  rate: number;
  entries: TimesheetEntry[];
  submitted: string;
  approved?: string;
};

export type Invoice = {
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

export type AdminQueueItem = {
  id: string;
  kind: string;
  who: string;
  what: string;
  meta: string;
  age: string;
  priority: string;
};
