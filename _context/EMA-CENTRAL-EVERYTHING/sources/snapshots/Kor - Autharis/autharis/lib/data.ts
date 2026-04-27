export const SKILLS = [
  'Email Triage', 'Calendar Mgmt', 'CRM Admin', 'Data Entry',
  'Customer Support', 'Chat Support', 'Zendesk', 'Intercom',
  'Project Coordination', 'Notion', 'Asana', 'Linear',
  'Market Research', 'Desk Research', 'Outreach', 'Copywriting',
  'Bookkeeping Assist', 'Invoice Admin', 'Travel Coordination',
  'QA Review', 'LLM Output Review', 'Annotation', 'RAG Evals',
  'Care Coordination', 'Intake', 'Outbound Calls',
  'Lead Qualification', 'SDR Support',
];

export const CATEGORIES = [
  { id: 'admin', label: 'Administrative Support', blurb: 'Scheduling, inbox, documents, data entry, logistics.' },
  { id: 'cx',    label: 'Customer Support',       blurb: 'Email, chat, inbound & outbound, account follow-up.' },
  { id: 'ops',   label: 'Operations Support',     blurb: 'Project coordination, workflow tracking, vendor follow-up.' },
  { id: 'care',  label: 'Care & Case Coordination', blurb: 'Navigation, outreach, intake, service coordination.' },
  { id: 'sales', label: 'Sales & Outreach',       blurb: 'Prospecting, list-building, appointment setting.' },
  { id: 'rsrch', label: 'Research & Project',     blurb: 'Market & desk research, light analysis, admin project support.' },
  { id: 'ai',    label: 'AI Review & Ops',        blurb: 'Annotation, output review, QA, edge-case handling.' },
];

export type Talent = {
  id: string; name: string; initials: string; title: string; city: string; timezone: string;
  rate: number; availability: string; categories: string[]; skills: string[]; industries: string[];
  status: string; bio: string; score: number; breakdown: Record<string, number>; yearsExp: number;
};

export const TALENT: Talent[] = [
  { id: 't-001', name: 'Amara Okafor', initials: 'AO', title: 'Operations lead, previously at Cedar Health', city: 'Lagos → GMT', timezone: 'GMT', rate: 42, availability: '20 hrs / week', categories: ['ops', 'care'], skills: ['Project Coordination', 'Care Coordination', 'Notion', 'Intake', 'QA Review'], industries: ['Healthcare', 'SaaS'], status: 'Active', bio: 'Eight years coordinating care navigation and ops. Comfortable running intake queues, building Notion workspaces, and turning messy inboxes into reliable workflows.', score: 94, breakdown: { 'Work category': 30, 'Skill overlap': 28, 'Availability': 15, 'Rate fit': 9, 'Timezone': 7, 'Industry familiarity': 5 }, yearsExp: 8 },
  { id: 't-002', name: 'Daniel Ruiz', initials: 'DR', title: 'CX specialist, ex-Linear support', city: 'Mexico City → CT', timezone: 'CT', rate: 38, availability: '25 hrs / week', categories: ['cx', 'ai'], skills: ['Zendesk', 'Intercom', 'LLM Output Review', 'QA Review', 'Chat Support'], industries: ['SaaS', 'Consumer'], status: 'Active', bio: 'Six years in B2B SaaS support. Fluent in tone calibration — equal parts customer outcomes and AI-assist quality review.', score: 89, breakdown: { 'Work category': 28, 'Skill overlap': 27, 'Availability': 14, 'Rate fit': 9, 'Timezone': 6, 'Industry familiarity': 5 }, yearsExp: 6 },
  { id: 't-003', name: 'Priya Menon', initials: 'PM', title: 'Research analyst & project support', city: 'Bengaluru → IST', timezone: 'IST', rate: 45, availability: '15 hrs / week', categories: ['rsrch', 'ops'], skills: ['Market Research', 'Desk Research', 'Notion', 'Project Coordination'], industries: ['Fintech', 'Consumer'], status: 'Active', bio: 'Bridges research and operations. Ships weekly landscape briefs and keeps workstreams on rails.', score: 82, breakdown: { 'Work category': 25, 'Skill overlap': 24, 'Availability': 13, 'Rate fit': 8, 'Timezone': 7, 'Industry familiarity': 5 }, yearsExp: 5 },
  { id: 't-004', name: 'Jakob Lindqvist', initials: 'JL', title: 'Technical support → RAG evals', city: 'Stockholm → CET', timezone: 'CET', rate: 52, availability: '12 hrs / week', categories: ['ai', 'cx'], skills: ['LLM Output Review', 'RAG Evals', 'QA Review', 'Annotation'], industries: ['AI', 'Developer Tools'], status: 'Active', bio: 'Deep hands-on QA for AI-assisted support and RAG pipelines. Precise rubrics, clear reports.', score: 78, breakdown: { 'Work category': 27, 'Skill overlap': 22, 'Availability': 11, 'Rate fit': 6, 'Timezone': 8, 'Industry familiarity': 4 }, yearsExp: 7 },
  { id: 't-005', name: 'Nia Thompson', initials: 'NT', title: 'Executive assistant, fintech', city: 'Atlanta → ET', timezone: 'ET', rate: 40, availability: '30 hrs / week', categories: ['admin', 'ops'], skills: ['Calendar Mgmt', 'Email Triage', 'Travel Coordination', 'Invoice Admin'], industries: ['Fintech'], status: 'Active', bio: 'Keeps busy founders functional. Lives in calendars, runbooks, and travel logistics.', score: 75, breakdown: { 'Work category': 24, 'Skill overlap': 21, 'Availability': 14, 'Rate fit': 8, 'Timezone': 4, 'Industry familiarity': 4 }, yearsExp: 9 },
  { id: 't-006', name: 'Miguel Alvarez', initials: 'MA', title: 'Sales dev, outbound specialist', city: 'Buenos Aires → ART', timezone: 'ART', rate: 36, availability: '20 hrs / week', categories: ['sales', 'admin'], skills: ['Outreach', 'Lead Qualification', 'SDR Support'], industries: ['SaaS'], status: 'Pending', bio: 'Prospecting and list-building for early-stage B2B teams. Doesn\u2019t blast — writes specific emails.', score: 68, breakdown: { 'Work category': 22, 'Skill overlap': 18, 'Availability': 13, 'Rate fit': 8, 'Timezone': 4, 'Industry familiarity': 3 }, yearsExp: 4 },
];

export type JobRequest = {
  id: string; title: string; category: string; client: string; description: string;
  hoursPerWeek: number; duration: string; timezone: string; budget: [number, number];
  skills: string[]; industry: string; status: string; posted: string; matches: number;
};

export const JOB_REQUESTS: JobRequest[] = [
  { id: 'jr-001', title: 'Patient intake coordinator — evenings', category: 'care', client: 'Cedar Health Co-op', description: 'Weeknight patient intake & navigation support. Review inbound referrals, triage via our playbook, schedule consults, and flag complex cases to the clinical team.', hoursPerWeek: 20, duration: '3 months', timezone: 'GMT ± 3', budget: [40, 55], skills: ['Care Coordination', 'Intake', 'Project Coordination'], industry: 'Healthcare', status: 'Matched', posted: '2 days ago', matches: 4 },
  { id: 'jr-002', title: 'AI support review — overflow QA', category: 'ai', client: 'Lumen AI', description: 'Review AI-drafted support replies before customer send. Flag tone, factual accuracy, and edge-case escalations. Weekly QA rubric.', hoursPerWeek: 15, duration: 'Ongoing', timezone: 'Any', budget: [45, 65], skills: ['LLM Output Review', 'QA Review', 'Zendesk'], industry: 'AI', status: 'Shortlist ready', posted: '5 hours ago', matches: 3 },
  { id: 'jr-003', title: 'Weekly market research brief', category: 'rsrch', client: 'Ladder Fintech', description: 'Produce a weekly competitive landscape brief across five fintech categories. Light synthesis, consistent template.', hoursPerWeek: 10, duration: '2 months', timezone: 'Any', budget: [40, 60], skills: ['Market Research', 'Desk Research'], industry: 'Fintech', status: 'Reviewing', posted: '1 day ago', matches: 5 },
  { id: 'jr-004', title: 'EA coverage — founder, 20 hrs', category: 'admin', client: 'Ladder Fintech', description: 'Calendar, travel, meeting prep, and inbox triage for the CEO. Tuesday/Thursday heavy.', hoursPerWeek: 20, duration: 'Ongoing', timezone: 'ET', budget: [35, 50], skills: ['Calendar Mgmt', 'Email Triage', 'Travel Coordination'], industry: 'Fintech', status: 'Draft', posted: '—', matches: 0 },
];

export const ENGAGEMENTS = [
  { id: 'e-001', jobId: 'jr-001', jobTitle: 'Patient intake coordinator — evenings', talentId: 't-001', talentName: 'Amara Okafor', client: 'Cedar Health Co-op', rate: 48, status: 'Active', started: 'Apr 06, 2026', hoursThisWeek: 18.5, hoursApproved: 142, hoursPending: 18.5 },
  { id: 'e-002', jobId: 'jr-002', jobTitle: 'AI support review — overflow QA', talentId: 't-004', talentName: 'Jakob Lindqvist', client: 'Lumen AI', rate: 58, status: 'Active', started: 'Mar 23, 2026', hoursThisWeek: 12, hoursApproved: 86, hoursPending: 12 },
];

export type Timesheet = {
  id: string; engagementId: string; engagementTitle: string; talentName: string; client: string;
  weekOf: string; status: string; hours: number; rate: number;
  entries: { day: string; hours: number; note: string }[];
  submitted: string; approved?: string;
};

export const TIMESHEETS: Timesheet[] = [
  { id: 'ts-001', engagementId: 'e-001', engagementTitle: 'Patient intake coordinator — evenings', talentName: 'Amara Okafor', client: 'Cedar Health Co-op', weekOf: 'Apr 13 — Apr 19, 2026', status: 'Submitted', hours: 18.5, rate: 48, entries: [
    { day: 'Mon, Apr 13', hours: 3.5, note: 'Evening intake queue + 3 referral triage.' },
    { day: 'Tue, Apr 14', hours: 4.0, note: 'Complex case handoff to clinical; scheduled 7 consults.' },
    { day: 'Wed, Apr 15', hours: 3.0, note: 'Playbook update + queue processing.' },
    { day: 'Thu, Apr 16', hours: 4.5, note: 'Referral backlog cleared; escalated 2 cases.' },
    { day: 'Fri, Apr 17', hours: 3.5, note: 'Weekly summary + handover note.' },
  ], submitted: 'Apr 19, 2026 · 21:42' },
  { id: 'ts-002', engagementId: 'e-002', engagementTitle: 'AI support review — overflow QA', talentName: 'Jakob Lindqvist', client: 'Lumen AI', weekOf: 'Apr 13 — Apr 19, 2026', status: 'Submitted', hours: 12, rate: 58, entries: [
    { day: 'Mon, Apr 13', hours: 2.5, note: 'Reviewed 42 AI replies; 3 tone escalations.' },
    { day: 'Wed, Apr 15', hours: 3.5, note: 'RAG eval set v2 — 120 items.' },
    { day: 'Thu, Apr 16', hours: 3.0, note: 'QA rubric refresh.' },
    { day: 'Fri, Apr 17', hours: 3.0, note: 'Edge-case batch + weekly report.' },
  ], submitted: 'Apr 19, 2026 · 18:05' },
  { id: 'ts-003', engagementId: 'e-001', engagementTitle: 'Patient intake coordinator — evenings', talentName: 'Amara Okafor', client: 'Cedar Health Co-op', weekOf: 'Apr 06 — Apr 12, 2026', status: 'Approved', hours: 19, rate: 48, entries: [], submitted: 'Apr 12, 2026 · 20:11', approved: 'Apr 13, 2026 · 09:22' },
];

export const INVOICES = [
  { id: 'INV-2026-0042', engagement: 'e-001', client: 'Cedar Health Co-op', period: 'Apr 06 — Apr 12', hours: 19, rate: 48, subtotal: 912, fee: 91.2, total: 1003.2, status: 'Paid', date: 'Apr 14, 2026' },
  { id: 'INV-2026-0041', engagement: 'e-002', client: 'Lumen AI', period: 'Apr 06 — Apr 12', hours: 11.5, rate: 58, subtotal: 667, fee: 66.7, total: 733.7, status: 'Paid', date: 'Apr 14, 2026' },
  { id: 'INV-2026-0036', engagement: 'e-001', client: 'Cedar Health Co-op', period: 'Mar 30 — Apr 05', hours: 20, rate: 48, subtotal: 960, fee: 96, total: 1056, status: 'Paid', date: 'Apr 07, 2026' },
  { id: 'INV-2026-0034', engagement: 'e-002', client: 'Lumen AI', period: 'Mar 30 — Apr 05', hours: 10, rate: 58, subtotal: 580, fee: 58, total: 638, status: 'Paid', date: 'Apr 07, 2026' },
];

export const ADMIN_QUEUE = [
  { kind: 'profile', who: 'Miguel Alvarez', what: 'Pending talent activation', meta: 'Identity verified · 4 yrs exp · SDR', age: '2 hrs', priority: 'normal' },
  { kind: 'match', who: 'AI support review · Lumen AI', what: 'Match review — shortlist of 3', meta: 'Top: Jakob Lindqvist (78)', age: '5 hrs', priority: 'high' },
  { kind: 'match', who: 'EA coverage · Ladder Fintech', what: 'Draft request not yet published', meta: 'Client requested guidance', age: '1 day', priority: 'low' },
  { kind: 'dispute', who: 'Timesheet TS-00017', what: 'Approval disputed — hours mismatch', meta: 'Cedar Health Co-op ↔ N. Thompson', age: '6 hrs', priority: 'high' },
  { kind: 'profile', who: 'Sarah Choi', what: 'Resume parsing failed', meta: 'PDF 18 pgs · retry queued', age: '1 day', priority: 'low' },
];
