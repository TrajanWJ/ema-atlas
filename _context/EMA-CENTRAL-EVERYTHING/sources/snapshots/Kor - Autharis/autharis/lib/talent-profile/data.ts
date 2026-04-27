import {
  formatCurrency,
  talentCategoryOptions,
  talentEngagements,
  talentOpportunities,
  talentPerformanceMetrics,
  talentProfile,
} from "@/lib/talent/data";

export type PublicProfileMetric = {
  label: string;
  value: string;
  detail: string;
};

export type PublicProfilePracticeArea = {
  label: string;
  blurb: string;
};

export type PublicProfileProof = {
  client: string;
  role: string;
  detail: string;
  cadence: string;
  deliverables: string[];
};

export type PublicProfileOpportunitySignal = {
  title: string;
  client: string;
  rationale: string;
  format: string;
};

export type PublicProfileAvailability = {
  label: string;
  detail: string;
};

const selectedCategoryIds = new Set<string>(talentProfile.categories);

const practiceAreas = talentCategoryOptions
  .filter((category) => selectedCategoryIds.has(category.id))
  .map((category) => ({
    label: category.label,
    blurb: category.blurb,
  })) satisfies PublicProfilePracticeArea[];

const recentProof = talentEngagements.map((engagement) => ({
  client: engagement.client,
  role: engagement.role,
  detail: `${formatCurrency(engagement.rate)}/hr · ${engagement.weeklyHours} hrs/week · ${engagement.relationshipLead}`,
  cadence: engagement.nextMilestone,
  deliverables: engagement.deliverables,
})) satisfies PublicProfileProof[];

const opportunitySignals = talentOpportunities.slice(0, 2).map((opportunity) => ({
  title: opportunity.title,
  client: opportunity.client,
  rationale: opportunity.rationale,
  format: opportunity.format,
})) satisfies PublicProfileOpportunitySignal[];

export const publicProfileMetrics = talentPerformanceMetrics.map((metric) => ({
  label: metric.label,
  value: metric.value,
  detail: metric.detail,
})) satisfies PublicProfileMetric[];

export const publicProfileAvailability = [
  {
    label: "Weekly capacity",
    detail: `${talentProfile.weeklyAvailability} hours available for a new client brief`,
  },
  {
    label: "Timezone rhythm",
    detail: `${talentProfile.timezone} with consistent overlap into Europe and East Coast handoffs`,
  },
  {
    label: "Response window",
    detail: talentProfile.responseTime,
  },
] satisfies PublicProfileAvailability[];

export const talentPublicProfile = {
  slug: "amara-okafor",
  dossierId: "TAL-PP-0422-AO",
  updatedAt: "Apr 22, 2026",
  name: talentProfile.name,
  initials: talentProfile.initials,
  publicTitle: "Fractional operations and care coordination partner",
  internalTitle: talentProfile.title,
  summary:
    "Amara steadies messy coordination work, closes intake loops, and leaves behind the sort of operating rhythm that clients can trust after week one.",
  focus: talentProfile.focus,
  location: `${talentProfile.city} · ${talentProfile.timezone}`,
  rate: `Starting at ${formatCurrency(talentProfile.rate)}/hr`,
  availabilityLine: `${talentProfile.weeklyAvailability} hrs/week available for a new brief`,
  fitSignal: `${talentProfile.fitAverage} average fit score`,
  status: talentProfile.status,
  responseTime: talentProfile.responseTime,
  bio: talentProfile.bio,
  introPoints: [
    "Best for healthcare-adjacent queues, founder-led operations cleanup, and care workflows that need a calmer hand.",
    "Brings a strong mix of people-facing coordination, documentation discipline, and fast handoff hygiene.",
  ],
  practiceAreas,
  recentProof,
  opportunitySignals,
  principles: [
    "Turns scattered updates into one reliable tracker the team can actually use.",
    "Flags risk early, especially when a queue or escalation path starts to drift.",
    "Keeps client communication calm, concise, and visibly accountable.",
  ],
  toolbelt: talentProfile.skills,
  artifacts: [
    "Queue handoff notes with owner, blocker, and next-step clarity",
    "Weekly throughput summary for founders or ops leads",
    "Notion cleanup passes that leave behind reusable SOPs",
  ],
  references: [
    "Reference conversations coordinated through Autharis",
    `Resume on file: ${talentProfile.resumeFile}`,
    `${talentProfile.resumeRoles} prior roles and project snapshots available for review`,
  ],
} as const;
