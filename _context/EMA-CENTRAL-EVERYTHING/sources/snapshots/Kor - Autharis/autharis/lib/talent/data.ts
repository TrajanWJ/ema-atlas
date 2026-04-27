export type TalentCategory = {
  id: string;
  label: string;
  blurb: string;
};

export type TalentOpportunity = {
  id: string;
  title: string;
  client: string;
  category: string;
  hoursPerWeek: number;
  duration: string;
  timezone: string;
  budgetRange: [number, number];
  matchScore: number;
  rationale: string;
  skills: string[];
  posted: string;
  format: string;
};

export type TalentEngagement = {
  id: string;
  client: string;
  role: string;
  started: string;
  rate: number;
  weeklyHours: number;
  approvedHours: number;
  pendingHours: number;
  nextMilestone: string;
  relationshipLead: string;
  status: "active" | "review";
  deliverables: string[];
};

export type TimesheetEntry = {
  day: string;
  hours: string;
  note: string;
};

export type TimesheetRecord = {
  id: string;
  weekOf: string;
  status: "submitted" | "approved";
  hours: number;
  submittedAt: string;
  approvedAt?: string;
};

export type PayoutInvoice = {
  id: string;
  period: string;
  client: string;
  hours: number;
  subtotal: number;
  platformFee: number;
  payout: number;
  status: "paid" | "processing";
  date: string;
};

export const talentCategoryOptions: TalentCategory[] = [
  {
    id: "ops",
    label: "Operations Support",
    blurb: "Playbook upkeep, queue movement, vendor follow-up, and calm execution.",
  },
  {
    id: "care",
    label: "Care Coordination",
    blurb: "Intake, patient navigation, referral handling, and human follow-through.",
  },
  {
    id: "cx",
    label: "Customer Support",
    blurb: "High-empathy inbox and chat support with reliable escalation habits.",
  },
  {
    id: "rsrch",
    label: "Research Projects",
    blurb: "Weekly briefs, desk research, source cleaning, and synthesis.",
  },
  {
    id: "ai",
    label: "AI Review Ops",
    blurb: "Annotation, QA review, tone checking, and edge-case handling.",
  },
];

export const talentSkillCatalog = [
  "Project Coordination",
  "Care Coordination",
  "Intake",
  "Notion",
  "QA Review",
  "Email Triage",
  "Calendar Mgmt",
  "Patient Navigation",
  "Workflow Design",
  "Loom Updates",
  "Escalation Handling",
  "Vendor Follow-up",
] as const;

export const talentIndustries = [
  "Healthcare",
  "SaaS",
  "Operations-heavy services",
] as const;

export const talentProfile = {
  name: "Amara Okafor",
  initials: "AO",
  title: "Operations lead, previously Cedar Health Co-op",
  city: "Lagos",
  timezone: "GMT",
  yearsExperience: 8,
  rate: 42,
  weeklyAvailability: 20,
  fitAverage: 94,
  status: "Open to work",
  bio: "Eight years coordinating care navigation and operations. Strong at intake queues, fast-moving inboxes, and turning scattered process into something a team can trust every day.",
  focus: "Best when the role mixes people-facing coordination with operational cleanup.",
  categories: ["ops", "care", "cx"],
  skills: [
    "Project Coordination",
    "Care Coordination",
    "Intake",
    "Notion",
    "QA Review",
    "Escalation Handling",
  ],
  industries: [...talentIndustries],
  resumeFile: "amara_okafor_cv.pdf",
  resumeRoles: 12,
  responseTime: "Replies within 2 hours",
} as const;

export const talentPerformanceMetrics = [
  { label: "Current fit average", value: "94", detail: "Across the last 8 live matches" },
  { label: "Approval rate", value: "98%", detail: "Timesheets approved without edits" },
  { label: "Repeat requests", value: "4", detail: "Clients that asked for renewal or extension" },
] as const;

export const talentMatchSignals = [
  "High overlap on care coordination and intake work",
  "Availability sits inside most 15-20 hour briefs",
  "Strong history in healthcare-adjacent operations",
] as const;

export const talentOpportunities: TalentOpportunity[] = [
  {
    id: "opp-cedar-evenings",
    title: "Patient intake coordinator, evening coverage",
    client: "Cedar Health Co-op",
    category: "Care Coordination",
    hoursPerWeek: 20,
    duration: "3 months",
    timezone: "GMT +/- 3",
    budgetRange: [40, 55],
    matchScore: 92,
    rationale: "Strong intake overlap plus timezone fit for evening handoffs.",
    skills: ["Care Coordination", "Intake", "Project Coordination"],
    posted: "Posted 2 days ago",
    format: "Remote / async handoff with weekday evening blocks",
  },
  {
    id: "opp-lumen-review",
    title: "AI support review, overflow QA",
    client: "Lumen AI",
    category: "AI Review Ops",
    hoursPerWeek: 15,
    duration: "Ongoing",
    timezone: "Any",
    budgetRange: [45, 65],
    matchScore: 84,
    rationale: "QA depth is a stretch lane, but review discipline is a strong fit.",
    skills: ["QA Review", "Escalation Handling", "Notion"],
    posted: "Posted 5 hours ago",
    format: "Review queue + weekly quality memo",
  },
  {
    id: "opp-caretide-ops",
    title: "Care ops coordinator, launch support",
    client: "CareTide",
    category: "Operations Support",
    hoursPerWeek: 18,
    duration: "6 weeks",
    timezone: "Europe or Africa overlap preferred",
    budgetRange: [42, 58],
    matchScore: 89,
    rationale: "Launch ops and patient-facing execution sit squarely inside prior work.",
    skills: ["Workflow Design", "Project Coordination", "Patient Navigation"],
    posted: "Posted this morning",
    format: "Two live standups + async tracker ownership",
  },
];

export const talentEngagements: TalentEngagement[] = [
  {
    id: "eng-cedar",
    client: "Cedar Health Co-op",
    role: "Patient intake coordinator",
    started: "Apr 06, 2026",
    rate: 48,
    weeklyHours: 18.5,
    approvedHours: 142,
    pendingHours: 18.5,
    nextMilestone: "Weekly queue review on Friday",
    relationshipLead: "Maya S., Care Operations",
    status: "active",
    deliverables: [
      "Evening intake coverage",
      "Complex referral escalation notes",
      "Weekly throughput summary",
    ],
  },
  {
    id: "eng-ladder",
    client: "Ladder Fintech",
    role: "Ops cleanup sprint",
    started: "Mar 17, 2026",
    rate: 46,
    weeklyHours: 10,
    approvedHours: 54,
    pendingHours: 6,
    nextMilestone: "Closeout handoff package due Apr 25",
    relationshipLead: "Jonah R., Founder",
    status: "review",
    deliverables: [
      "Inbox taxonomy cleanup",
      "Recurring task map in Notion",
      "Travel and calendar SOP handoff",
    ],
  },
];

export const currentTimesheet = {
  weekOf: "Apr 20 - Apr 24, 2026",
  engagement: "Patient intake coordinator",
  client: "Cedar Health Co-op",
  rate: 48,
  entries: [
    { day: "Mon, Apr 20", hours: "3.5", note: "Evening intake queue and three referral escalations." },
    { day: "Tue, Apr 21", hours: "4.0", note: "Scheduled consults and updated the handoff tracker." },
    { day: "Wed, Apr 22", hours: "", note: "" },
    { day: "Thu, Apr 23", hours: "", note: "" },
    { day: "Fri, Apr 24", hours: "", note: "" },
  ] satisfies TimesheetEntry[],
} as const;

export const previousTimesheets: TimesheetRecord[] = [
  {
    id: "ts-204",
    weekOf: "Apr 13 - Apr 19, 2026",
    status: "submitted",
    hours: 18.5,
    submittedAt: "Apr 19, 2026 at 21:42",
  },
  {
    id: "ts-197",
    weekOf: "Apr 06 - Apr 12, 2026",
    status: "approved",
    hours: 19,
    submittedAt: "Apr 12, 2026 at 20:11",
    approvedAt: "Apr 13, 2026 at 09:22",
  },
  {
    id: "ts-188",
    weekOf: "Mar 30 - Apr 05, 2026",
    status: "approved",
    hours: 17.5,
    submittedAt: "Apr 05, 2026 at 19:48",
    approvedAt: "Apr 06, 2026 at 08:57",
  },
];

export const payoutInvoices: PayoutInvoice[] = [
  {
    id: "INV-2026-0042",
    period: "Apr 06 - Apr 12",
    client: "Cedar Health Co-op",
    hours: 19,
    subtotal: 912,
    platformFee: 91.2,
    payout: 820.8,
    status: "paid",
    date: "Apr 14, 2026",
  },
  {
    id: "INV-2026-0041",
    period: "Mar 30 - Apr 05",
    client: "Ladder Fintech",
    hours: 10,
    subtotal: 460,
    platformFee: 46,
    payout: 414,
    status: "paid",
    date: "Apr 07, 2026",
  },
  {
    id: "INV-2026-0047",
    period: "Apr 13 - Apr 19",
    client: "Cedar Health Co-op",
    hours: 18.5,
    subtotal: 888,
    platformFee: 88.8,
    payout: 799.2,
    status: "processing",
    date: "Expected Apr 25, 2026",
  },
];

export const earningsSummary = {
  monthToDate: 2034,
  pendingPayout: 799.2,
  effectiveRate: 46.7,
  approvedHours: 196,
} as const;

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}
