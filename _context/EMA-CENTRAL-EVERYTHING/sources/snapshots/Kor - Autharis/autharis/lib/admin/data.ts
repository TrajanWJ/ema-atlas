export type NavItem = {
  href: string;
  label: string;
  badge?: string;
};

export type ActivationQueueItem = {
  id: string;
  category: "activation" | "matching" | "dispute" | "reporting";
  priority: "critical" | "elevated" | "routine";
  title: string;
  summary: string;
  owner: string;
  receivedAt: string;
  sla: string;
  status: string;
};

export type RosterMember = {
  id: string;
  name: string;
  initials: string;
  title: string;
  region: string;
  hoursAvailable: string;
  specialties: string[];
  auditScore: number;
  status: "active" | "review" | "ramp";
  blocker: string;
};

export type CandidateReview = {
  id: string;
  name: string;
  initials: string;
  score: number;
  rate: string;
  availability: string;
  strengths: string[];
  risks: string[];
};

export type MatchReviewRun = {
  id: string;
  requestTitle: string;
  client: string;
  stage: string;
  generatedAt: string;
  reviewer: string;
  fitSummary: string;
  candidateCount: number;
  recommendedAction: string;
  candidates: CandidateReview[];
};

export type DisputeUpdate = {
  label: string;
  detail: string;
  at: string;
};

export type DisputeCase = {
  id: string;
  severity: "critical" | "elevated" | "moderate";
  client: string;
  talent: string;
  issue: string;
  amountAtRisk: string;
  openedAt: string;
  nextCheckpoint: string;
  owner: string;
  updates: DisputeUpdate[];
};

export type MetricCard = {
  label: string;
  value: string;
  delta: string;
  tone: "up" | "flat" | "down";
};

export type ThroughputPoint = {
  label: string;
  queue: number;
  disputes: number;
};

export type RegionMix = {
  label: string;
  value: number;
};

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Activation queue", badge: "11" },
  { href: "/admin/roster", label: "Talent roster" },
  { href: "/admin/matching", label: "Matching review", badge: "3" },
  { href: "/admin/disputes", label: "Disputes", badge: "2" },
  { href: "/admin/reports", label: "Reporting" },
];

export const adminMetrics: MetricCard[] = [
  { label: "Open reviews", value: "11", delta: "-3 since 9 AM", tone: "down" },
  { label: "Activation SLA", value: "4.2 hrs", delta: "Within 6 hr target", tone: "up" },
  { label: "Disputes at risk", value: "$3,480", delta: "2 active cases", tone: "flat" },
  { label: "Weekly placements", value: "14", delta: "+22% vs last week", tone: "up" },
];

export const activationQueue: ActivationQueueItem[] = [
  {
    id: "AQ-1042",
    category: "activation",
    priority: "critical",
    title: "Manual activation needed for Miguel Alvarez",
    summary:
      "Identity passed, but outbound references disagree on title history. Requires human sign-off before publishing to finance-heavy requests.",
    owner: "Ops desk",
    receivedAt: "8:12 AM ET",
    sla: "Due in 48 min",
    status: "Awaiting reviewer",
  },
  {
    id: "AQ-1041",
    category: "matching",
    priority: "elevated",
    title: "Review shortlist for AI support overflow",
    summary:
      "Lumen AI requested a human pass on the top three candidates before client send. Auto-run surfaced a timezone risk on one finalist.",
    owner: "Maya Chen",
    receivedAt: "7:34 AM ET",
    sla: "Due in 1 hr 26 min",
    status: "Needs approval",
  },
  {
    id: "AQ-1038",
    category: "dispute",
    priority: "critical",
    title: "Timesheet dispute on Cedar Health engagement",
    summary:
      "Talent logged 22 hours, client approved 18. Supporting notes and message transcript are attached for same-day resolution.",
    owner: "Case desk",
    receivedAt: "Yesterday",
    sla: "Due today",
    status: "Escalated",
  },
  {
    id: "AQ-1035",
    category: "reporting",
    priority: "routine",
    title: "Weekly board packet needs finance commentary",
    summary:
      "Reporting rollup is complete, but placement margin notes still need an operator summary before export.",
    owner: "RevOps",
    receivedAt: "Yesterday",
    sla: "Due by 3 PM",
    status: "Draft ready",
  },
  {
    id: "AQ-1032",
    category: "activation",
    priority: "routine",
    title: "Resume parsing retry for Sarah Choi",
    summary:
      "The parser flagged layout complexity in an 18-page PDF. Queue for manual skill tagging and profile publishing.",
    owner: "Launch pod",
    receivedAt: "Yesterday",
    sla: "Due tomorrow",
    status: "Queued",
  },
];

export const rosterMembers: RosterMember[] = [
  {
    id: "TR-201",
    name: "Amara Okafor",
    initials: "AO",
    title: "Care navigation + operations",
    region: "GMT / Lagos",
    hoursAvailable: "20 hrs / week",
    specialties: ["Care coordination", "Notion ops", "QA review"],
    auditScore: 94,
    status: "active",
    blocker: "None",
  },
  {
    id: "TR-204",
    name: "Jakob Lindqvist",
    initials: "JL",
    title: "AI support QA specialist",
    region: "CET / Stockholm",
    hoursAvailable: "12 hrs / week",
    specialties: ["RAG evals", "Support QA", "Annotation"],
    auditScore: 88,
    status: "active",
    blocker: "Awaiting more ET-compatible shifts",
  },
  {
    id: "TR-205",
    name: "Nia Thompson",
    initials: "NT",
    title: "Executive assistant",
    region: "ET / Atlanta",
    hoursAvailable: "30 hrs / week",
    specialties: ["Calendar management", "Travel", "Invoice admin"],
    auditScore: 81,
    status: "review",
    blocker: "Hours dispute open on Cedar Health",
  },
  {
    id: "TR-209",
    name: "Miguel Alvarez",
    initials: "MA",
    title: "Outbound SDR support",
    region: "ART / Buenos Aires",
    hoursAvailable: "20 hrs / week",
    specialties: ["Lead qualification", "Outbound", "CRM hygiene"],
    auditScore: 76,
    status: "ramp",
    blocker: "Pending final activation review",
  },
];

export const matchReviewRuns: MatchReviewRun[] = [
  {
    id: "MR-880",
    requestTitle: "AI support review - overflow QA",
    client: "Lumen AI",
    stage: "Client-ready shortlist",
    generatedAt: "Today, 7:14 AM ET",
    reviewer: "Maya Chen",
    fitSummary:
      "The engine produced three strong finalists. Human review should confirm timezone overlap and escalation-writing quality before release.",
    candidateCount: 3,
    recommendedAction: "Approve Jakob and Daniel, hold Priya for timezone mismatch follow-up.",
    candidates: [
      {
        id: "c-1",
        name: "Jakob Lindqvist",
        initials: "JL",
        score: 92,
        rate: "$58/hr",
        availability: "12 hrs / week",
        strengths: ["Best QA rubric depth", "AI support background", "Highest calibration score"],
        risks: ["Low ET overlap"],
      },
      {
        id: "c-2",
        name: "Daniel Ruiz",
        initials: "DR",
        score: 89,
        rate: "$38/hr",
        availability: "25 hrs / week",
        strengths: ["Strong customer tone", "Flexible schedule", "Proven Zendesk workflows"],
        risks: ["Less RAG-specific evaluation work"],
      },
      {
        id: "c-3",
        name: "Priya Menon",
        initials: "PM",
        score: 81,
        rate: "$45/hr",
        availability: "15 hrs / week",
        strengths: ["Structured research synthesis", "Reliable written handoff notes"],
        risks: ["Timezone gap for live escalations", "Needs QA ramp"],
      },
    ],
  },
  {
    id: "MR-874",
    requestTitle: "Founder EA coverage",
    client: "Ladder Fintech",
    stage: "Pre-publish review",
    generatedAt: "Yesterday, 4:52 PM ET",
    reviewer: "Jordan Lee",
    fitSummary:
      "Request draft is solid, but the client budget floor needs to be widened before publishing or the pool will be too narrow.",
    candidateCount: 2,
    recommendedAction: "Adjust budget to $38-$55/hr, then publish with Nia and Miguel as internal benchmark fits.",
    candidates: [
      {
        id: "c-4",
        name: "Nia Thompson",
        initials: "NT",
        score: 86,
        rate: "$40/hr",
        availability: "30 hrs / week",
        strengths: ["Best founder support fit", "Travel + inbox depth", "ET timezone match"],
        risks: ["Open dispute needs closure first"],
      },
      {
        id: "c-5",
        name: "Miguel Alvarez",
        initials: "MA",
        score: 71,
        rate: "$36/hr",
        availability: "20 hrs / week",
        strengths: ["Strong outbound structure", "Documentation discipline"],
        risks: ["Activation not complete", "Less calendar-heavy experience"],
      },
    ],
  },
];

export const disputes: DisputeCase[] = [
  {
    id: "DC-017",
    severity: "critical",
    client: "Cedar Health Co-op",
    talent: "Nia Thompson",
    issue: "Hours mismatch on TS-00017",
    amountAtRisk: "$960",
    openedAt: "Today, 6:20 AM ET",
    nextCheckpoint: "11:30 AM ET",
    owner: "Case desk",
    updates: [
      {
        label: "Client note received",
        detail: "Client approved 18 of 22 hours and requested 4 hours be moved to next week.",
        at: "6:20 AM",
      },
      {
        label: "Talent response logged",
        detail: "Talent shared task notes showing prep work happened before launch deadline.",
        at: "7:02 AM",
      },
      {
        label: "Operator action",
        detail: "Escalated to human review with recommendation to split 2 hours now, 2 hours next cycle.",
        at: "8:11 AM",
      },
    ],
  },
  {
    id: "DC-014",
    severity: "moderate",
    client: "Lumen AI",
    talent: "Jakob Lindqvist",
    issue: "Approval lag on QA batch",
    amountAtRisk: "$2,520",
    openedAt: "Yesterday, 2:14 PM ET",
    nextCheckpoint: "2:00 PM ET",
    owner: "Maya Chen",
    updates: [
      {
        label: "Aging alert",
        detail: "Invoice-ready hours passed the 48 hour approval window.",
        at: "Yesterday",
      },
      {
        label: "Client follow-up sent",
        detail: "Operations contact acknowledged and promised sign-off after leadership sync.",
        at: "Today, 8:40 AM",
      },
    ],
  },
];

export const reportMetrics: MetricCard[] = [
  { label: "Gross margin", value: "29.4%", delta: "+1.8 pts WoW", tone: "up" },
  { label: "Median fill time", value: "26 hrs", delta: "-4 hrs WoW", tone: "up" },
  { label: "Approval lag", value: "18 hrs", delta: "+2 hrs vs target", tone: "flat" },
  { label: "Activation pass rate", value: "84%", delta: "+6 pts MoM", tone: "up" },
];

export const throughput: ThroughputPoint[] = [
  { label: "Mon", queue: 9, disputes: 1 },
  { label: "Tue", queue: 12, disputes: 2 },
  { label: "Wed", queue: 7, disputes: 1 },
  { label: "Thu", queue: 10, disputes: 3 },
  { label: "Fri", queue: 6, disputes: 2 },
];

export const regionMix: RegionMix[] = [
  { label: "North America", value: 46 },
  { label: "Europe", value: 28 },
  { label: "Africa", value: 16 },
  { label: "LATAM", value: 10 },
];

export function priorityTone(priority: ActivationQueueItem["priority"]) {
  if (priority === "critical") return "critical";
  if (priority === "elevated") return "elevated";
  return "routine";
}

export function statusTone(status: RosterMember["status"] | DisputeCase["severity"] | MetricCard["tone"]) {
  if (status === "active" || status === "up") return "positive";
  if (status === "critical") return "critical";
  if (status === "review" || status === "elevated" || status === "flat") return "warning";
  return "muted";
}
