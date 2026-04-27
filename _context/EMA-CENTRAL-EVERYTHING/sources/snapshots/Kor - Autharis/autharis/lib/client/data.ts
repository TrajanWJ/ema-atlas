export const CLIENT_SKILLS = [
  'Email Triage',
  'Calendar Mgmt',
  'CRM Admin',
  'Data Entry',
  'Customer Support',
  'Chat Support',
  'Zendesk',
  'Intercom',
  'Project Coordination',
  'Notion',
  'Asana',
  'Linear',
  'Market Research',
  'Desk Research',
  'Outreach',
  'Copywriting',
  'Bookkeeping Assist',
  'Invoice Admin',
  'Travel Coordination',
  'QA Review',
  'LLM Output Review',
  'Annotation',
  'RAG Evals',
  'Care Coordination',
  'Intake',
  'Outbound Calls',
  'Lead Qualification',
  'SDR Support',
] as const;

export const CLIENT_CATEGORIES = [
  { id: 'admin', label: 'Administrative Support', blurb: 'Scheduling, inbox, documents, data entry, logistics.' },
  { id: 'cx', label: 'Customer Support', blurb: 'Email, chat, inbound and outbound, account follow-up.' },
  { id: 'ops', label: 'Operations Support', blurb: 'Project coordination, workflow tracking, vendor follow-up.' },
  { id: 'care', label: 'Care and Case Coordination', blurb: 'Navigation, outreach, intake, service coordination.' },
  { id: 'sales', label: 'Sales and Outreach', blurb: 'Prospecting, list-building, appointment setting.' },
  { id: 'rsrch', label: 'Research and Project', blurb: 'Market and desk research, light analysis, admin project support.' },
  { id: 'ai', label: 'AI Review and Ops', blurb: 'Annotation, output review, QA, and edge-case handling.' },
] as const;

export type ClientCategoryId = (typeof CLIENT_CATEGORIES)[number]['id'];
export type ClientSkill = (typeof CLIENT_SKILLS)[number];
export type MatchVariant = 'hero' | 'dossier' | 'stack';

export type ClientTalent = {
  id: string;
  name: string;
  initials: string;
  title: string;
  city: string;
  timezone: string;
  rate: number;
  availability: string;
  categories: ClientCategoryId[];
  skills: ClientSkill[];
  industries: string[];
  status: 'Active' | 'Pending';
  bio: string;
  score: number;
  breakdown: Record<string, number>;
  yearsExp: number;
};

export type ClientJobRequest = {
  id: string;
  title: string;
  category: ClientCategoryId;
  client: string;
  description: string;
  hoursPerWeek: number;
  duration: string;
  timezone: string;
  budget: [number, number];
  skills: ClientSkill[];
  industry: string;
  status: 'Draft' | 'Reviewing' | 'Shortlist ready' | 'Matched';
  posted: string;
  matches: number;
};

export type ClientEngagement = {
  id: string;
  jobId: string;
  jobTitle: string;
  talentId: string;
  talentName: string;
  client: string;
  rate: number;
  status: 'Active';
  started: string;
  hoursThisWeek: number;
  hoursApproved: number;
  hoursPending: number;
};

export type ClientTimesheet = {
  id: string;
  engagementId: string;
  engagementTitle: string;
  talentName: string;
  client: string;
  weekOf: string;
  status: 'Submitted' | 'Approved';
  hours: number;
  rate: number;
  entries: { day: string; hours: number; note: string }[];
  submitted: string;
  approved?: string;
};

export type ClientInvoice = {
  id: string;
  engagement: string;
  client: string;
  period: string;
  hours: number;
  rate: number;
  subtotal: number;
  fee: number;
  total: number;
  status: 'Paid';
  date: string;
};

export const CLIENT_TALENT: ClientTalent[] = [
  {
    id: 't-001',
    name: 'Amara Okafor',
    initials: 'AO',
    title: 'Operations lead, previously at Cedar Health',
    city: 'Lagos',
    timezone: 'GMT',
    rate: 42,
    availability: '20 hrs / week',
    categories: ['ops', 'care'],
    skills: ['Project Coordination', 'Care Coordination', 'Notion', 'Intake', 'QA Review'],
    industries: ['Healthcare', 'SaaS'],
    status: 'Active',
    bio: 'Eight years coordinating care navigation and ops. Comfortable running intake queues, building Notion workspaces, and turning messy inboxes into reliable workflows.',
    score: 94,
    breakdown: {
      'Work category': 30,
      'Skill overlap': 28,
      Availability: 15,
      'Rate fit': 9,
      Timezone: 7,
      'Industry familiarity': 5,
    },
    yearsExp: 8,
  },
  {
    id: 't-002',
    name: 'Daniel Ruiz',
    initials: 'DR',
    title: 'CX specialist, ex-Linear support',
    city: 'Mexico City',
    timezone: 'CT',
    rate: 38,
    availability: '25 hrs / week',
    categories: ['cx', 'ai'],
    skills: ['Zendesk', 'Intercom', 'LLM Output Review', 'QA Review', 'Chat Support'],
    industries: ['SaaS', 'Consumer'],
    status: 'Active',
    bio: 'Six years in B2B SaaS support. Fluent in tone calibration, balancing customer outcomes with AI-assist quality review.',
    score: 89,
    breakdown: {
      'Work category': 28,
      'Skill overlap': 27,
      Availability: 14,
      'Rate fit': 9,
      Timezone: 6,
      'Industry familiarity': 5,
    },
    yearsExp: 6,
  },
  {
    id: 't-003',
    name: 'Priya Menon',
    initials: 'PM',
    title: 'Research analyst and project support',
    city: 'Bengaluru',
    timezone: 'IST',
    rate: 45,
    availability: '15 hrs / week',
    categories: ['rsrch', 'ops'],
    skills: ['Market Research', 'Desk Research', 'Notion', 'Project Coordination'],
    industries: ['Fintech', 'Consumer'],
    status: 'Active',
    bio: 'Bridges research and operations. Ships weekly landscape briefs and keeps workstreams on rails.',
    score: 82,
    breakdown: {
      'Work category': 25,
      'Skill overlap': 24,
      Availability: 13,
      'Rate fit': 8,
      Timezone: 7,
      'Industry familiarity': 5,
    },
    yearsExp: 5,
  },
  {
    id: 't-004',
    name: 'Jakob Lindqvist',
    initials: 'JL',
    title: 'Technical support to RAG evals',
    city: 'Stockholm',
    timezone: 'CET',
    rate: 52,
    availability: '12 hrs / week',
    categories: ['ai', 'cx'],
    skills: ['LLM Output Review', 'RAG Evals', 'QA Review', 'Annotation'],
    industries: ['AI', 'Developer Tools'],
    status: 'Active',
    bio: 'Deep hands-on QA for AI-assisted support and RAG pipelines. Precise rubrics, clear reports, and reliable follow-through.',
    score: 78,
    breakdown: {
      'Work category': 27,
      'Skill overlap': 22,
      Availability: 11,
      'Rate fit': 6,
      Timezone: 8,
      'Industry familiarity': 4,
    },
    yearsExp: 7,
  },
  {
    id: 't-005',
    name: 'Nia Thompson',
    initials: 'NT',
    title: 'Executive assistant, fintech',
    city: 'Atlanta',
    timezone: 'ET',
    rate: 40,
    availability: '30 hrs / week',
    categories: ['admin', 'ops'],
    skills: ['Calendar Mgmt', 'Email Triage', 'Travel Coordination', 'Invoice Admin'],
    industries: ['Fintech'],
    status: 'Active',
    bio: 'Keeps busy founders functional. Lives in calendars, runbooks, and travel logistics.',
    score: 75,
    breakdown: {
      'Work category': 24,
      'Skill overlap': 21,
      Availability: 14,
      'Rate fit': 8,
      Timezone: 4,
      'Industry familiarity': 4,
    },
    yearsExp: 9,
  },
  {
    id: 't-006',
    name: 'Miguel Alvarez',
    initials: 'MA',
    title: 'Sales dev, outbound specialist',
    city: 'Buenos Aires',
    timezone: 'ART',
    rate: 36,
    availability: '20 hrs / week',
    categories: ['sales', 'admin'],
    skills: ['Outreach', 'Lead Qualification', 'SDR Support'],
    industries: ['SaaS'],
    status: 'Pending',
    bio: 'Prospecting and list-building for early-stage B2B teams. Writes specific outreach instead of volume blasts.',
    score: 68,
    breakdown: {
      'Work category': 22,
      'Skill overlap': 18,
      Availability: 13,
      'Rate fit': 8,
      Timezone: 4,
      'Industry familiarity': 3,
    },
    yearsExp: 4,
  },
];

export const CLIENT_JOB_REQUESTS: ClientJobRequest[] = [
  {
    id: 'jr-001',
    title: 'Patient intake coordinator - evenings',
    category: 'care',
    client: 'Cedar Health Co-op',
    description: 'Weeknight patient intake and navigation support. Review inbound referrals, triage via our playbook, schedule consults, and flag complex cases to the clinical team.',
    hoursPerWeek: 20,
    duration: '3 months',
    timezone: 'GMT +/- 3',
    budget: [40, 55],
    skills: ['Care Coordination', 'Intake', 'Project Coordination'],
    industry: 'Healthcare',
    status: 'Matched',
    posted: '2 days ago',
    matches: 4,
  },
  {
    id: 'jr-002',
    title: 'AI support review - overflow QA',
    category: 'ai',
    client: 'Lumen AI',
    description: 'Review AI-drafted support replies before customer send. Flag tone, factual accuracy, and edge-case escalations. Weekly QA rubric.',
    hoursPerWeek: 15,
    duration: 'Ongoing',
    timezone: 'Any',
    budget: [45, 65],
    skills: ['LLM Output Review', 'QA Review', 'Zendesk'],
    industry: 'AI',
    status: 'Shortlist ready',
    posted: '5 hours ago',
    matches: 3,
  },
  {
    id: 'jr-003',
    title: 'Weekly market research brief',
    category: 'rsrch',
    client: 'Ladder Fintech',
    description: 'Produce a weekly competitive landscape brief across five fintech categories. Light synthesis, consistent template.',
    hoursPerWeek: 10,
    duration: '2 months',
    timezone: 'Any',
    budget: [40, 60],
    skills: ['Market Research', 'Desk Research'],
    industry: 'Fintech',
    status: 'Reviewing',
    posted: '1 day ago',
    matches: 5,
  },
  {
    id: 'jr-004',
    title: 'EA coverage - founder, 20 hrs',
    category: 'admin',
    client: 'Ladder Fintech',
    description: 'Calendar, travel, meeting prep, and inbox triage for the CEO. Tuesday and Thursday coverage is the heaviest.',
    hoursPerWeek: 20,
    duration: 'Ongoing',
    timezone: 'ET',
    budget: [35, 50],
    skills: ['Calendar Mgmt', 'Email Triage', 'Travel Coordination'],
    industry: 'Fintech',
    status: 'Draft',
    posted: '-',
    matches: 0,
  },
];

export const CLIENT_ENGAGEMENTS: ClientEngagement[] = [
  {
    id: 'e-001',
    jobId: 'jr-001',
    jobTitle: 'Patient intake coordinator - evenings',
    talentId: 't-001',
    talentName: 'Amara Okafor',
    client: 'Cedar Health Co-op',
    rate: 48,
    status: 'Active',
    started: 'Apr 06, 2026',
    hoursThisWeek: 18.5,
    hoursApproved: 142,
    hoursPending: 18.5,
  },
  {
    id: 'e-002',
    jobId: 'jr-002',
    jobTitle: 'AI support review - overflow QA',
    talentId: 't-004',
    talentName: 'Jakob Lindqvist',
    client: 'Lumen AI',
    rate: 58,
    status: 'Active',
    started: 'Mar 23, 2026',
    hoursThisWeek: 12,
    hoursApproved: 86,
    hoursPending: 12,
  },
];

export const CLIENT_TIMESHEETS: ClientTimesheet[] = [
  {
    id: 'ts-001',
    engagementId: 'e-001',
    engagementTitle: 'Patient intake coordinator - evenings',
    talentName: 'Amara Okafor',
    client: 'Cedar Health Co-op',
    weekOf: 'Apr 13 - Apr 19, 2026',
    status: 'Submitted',
    hours: 18.5,
    rate: 48,
    entries: [
      { day: 'Mon, Apr 13', hours: 3.5, note: 'Evening intake queue and three referral triage handoffs.' },
      { day: 'Tue, Apr 14', hours: 4.0, note: 'Complex case handoff to clinical, plus seven consults scheduled.' },
      { day: 'Wed, Apr 15', hours: 3.0, note: 'Playbook update and queue processing.' },
      { day: 'Thu, Apr 16', hours: 4.5, note: 'Referral backlog cleared and two cases escalated.' },
      { day: 'Fri, Apr 17', hours: 3.5, note: 'Weekly summary and handoff note.' },
    ],
    submitted: 'Apr 19, 2026 at 21:42',
  },
  {
    id: 'ts-002',
    engagementId: 'e-002',
    engagementTitle: 'AI support review - overflow QA',
    talentName: 'Jakob Lindqvist',
    client: 'Lumen AI',
    weekOf: 'Apr 13 - Apr 19, 2026',
    status: 'Submitted',
    hours: 12,
    rate: 58,
    entries: [
      { day: 'Mon, Apr 13', hours: 2.5, note: 'Reviewed 42 AI replies and flagged three tone escalations.' },
      { day: 'Wed, Apr 15', hours: 3.5, note: 'RAG eval set v2 covering 120 items.' },
      { day: 'Thu, Apr 16', hours: 3.0, note: 'QA rubric refresh and final pass.' },
      { day: 'Fri, Apr 17', hours: 3.0, note: 'Edge-case batch and weekly report.' },
    ],
    submitted: 'Apr 19, 2026 at 18:05',
  },
  {
    id: 'ts-003',
    engagementId: 'e-001',
    engagementTitle: 'Patient intake coordinator - evenings',
    talentName: 'Amara Okafor',
    client: 'Cedar Health Co-op',
    weekOf: 'Apr 06 - Apr 12, 2026',
    status: 'Approved',
    hours: 19,
    rate: 48,
    entries: [],
    submitted: 'Apr 12, 2026 at 20:11',
    approved: 'Apr 13, 2026 at 09:22',
  },
];

export const CLIENT_INVOICES: ClientInvoice[] = [
  {
    id: 'INV-2026-0042',
    engagement: 'e-001',
    client: 'Cedar Health Co-op',
    period: 'Apr 06 - Apr 12',
    hours: 19,
    rate: 48,
    subtotal: 912,
    fee: 91.2,
    total: 1003.2,
    status: 'Paid',
    date: 'Apr 14, 2026',
  },
  {
    id: 'INV-2026-0041',
    engagement: 'e-002',
    client: 'Lumen AI',
    period: 'Apr 06 - Apr 12',
    hours: 11.5,
    rate: 58,
    subtotal: 667,
    fee: 66.7,
    total: 733.7,
    status: 'Paid',
    date: 'Apr 14, 2026',
  },
  {
    id: 'INV-2026-0036',
    engagement: 'e-001',
    client: 'Cedar Health Co-op',
    period: 'Mar 30 - Apr 05',
    hours: 20,
    rate: 48,
    subtotal: 960,
    fee: 96,
    total: 1056,
    status: 'Paid',
    date: 'Apr 07, 2026',
  },
  {
    id: 'INV-2026-0034',
    engagement: 'e-002',
    client: 'Lumen AI',
    period: 'Mar 30 - Apr 05',
    hours: 10,
    rate: 58,
    subtotal: 580,
    fee: 58,
    total: 638,
    status: 'Paid',
    date: 'Apr 07, 2026',
  },
];

export const MATCH_BREAKDOWN_MAX: Record<string, number> = {
  'Work category': 30,
  'Skill overlap': 30,
  Availability: 15,
  'Rate fit': 10,
  Timezone: 10,
  'Industry familiarity': 5,
};

export const CLIENT_MATCH_VARIANTS: { id: MatchVariant; label: string }[] = [
  { id: 'hero', label: 'Editorial' },
  { id: 'dossier', label: 'Dossier' },
  { id: 'stack', label: 'Stack' },
];

export function getCategoryLabel(categoryId: ClientCategoryId) {
  return CLIENT_CATEGORIES.find((category) => category.id === categoryId)?.label ?? categoryId;
}

export function getClientJobRequest(jobId: string) {
  return CLIENT_JOB_REQUESTS.find((job) => job.id === jobId) ?? CLIENT_JOB_REQUESTS[0];
}

export function getRankedTalent() {
  return [...CLIENT_TALENT].sort((left, right) => right.score - left.score);
}

export function getDashboardSummary() {
  const submittedTimesheets = CLIENT_TIMESHEETS.filter((timesheet) => timesheet.status === 'Submitted');

  return {
    pendingTimesheets: submittedTimesheets.length,
    openRequests: CLIENT_JOB_REQUESTS.filter((request) => request.status !== 'Matched').length,
    activeEngagements: CLIENT_ENGAGEMENTS.length,
    matchReady: CLIENT_JOB_REQUESTS.filter((request) => request.status === 'Shortlist ready').length,
    thisWeekHours: CLIENT_ENGAGEMENTS.reduce((sum, engagement) => sum + engagement.hoursThisWeek, 0),
    currentSpend: CLIENT_INVOICES.filter((invoice) => invoice.date.includes('Apr')).reduce((sum, invoice) => sum + invoice.total, 0),
  };
}
