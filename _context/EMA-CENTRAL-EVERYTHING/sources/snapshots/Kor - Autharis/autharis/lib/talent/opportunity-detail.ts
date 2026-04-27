import {
  formatCurrency,
  talentOpportunities,
  talentProfile,
  type TalentOpportunity,
} from "@/lib/talent/data";

type OpportunitySignal = {
  label: string;
  score: number;
  detail: string;
};

type OpportunityStakeholder = {
  name: string;
  role: string;
  detail: string;
};

type OpportunityCadence = {
  label: string;
  detail: string;
};

type OpportunityStage = {
  stage: string;
  owner: string;
  timing: string;
};

type OpportunitySnapshot = {
  label: string;
  value: string;
};

type OpportunityDossier = {
  summary: string;
  mandate: string;
  whyNow: string;
  firstThirtyDays: string[];
  workflowCadence: OpportunityCadence[];
  fitSignals: OpportunitySignal[];
  stakeholders: OpportunityStakeholder[];
  interviewPlan: OpportunityStage[];
  highlights: string[];
  watchouts: string[];
  applicationNotes: string[];
  clientSnapshot: OpportunitySnapshot[];
  relatedOpportunityIds: string[];
};

export type OpportunityDetailRecord = {
  opportunity: TalentOpportunity;
  dossier: OpportunityDossier;
  relatedOpportunities: TalentOpportunity[];
  budgetLabel: string;
  availabilityContext: string;
};

const opportunityDossiers: Record<string, OpportunityDossier> = {
  "opp-cedar-evenings": {
    summary:
      "Evening intake coverage for Cedar's care team, with a bias toward calm handoffs and clean referral notes instead of reactive queue-clearing.",
    mandate:
      "Own the weekday evening window, keep referrals moving before the overnight queue forms, and leave a clean operating picture for the day shift.",
    whyNow:
      "Cedar expanded partner referrals this month and needs extra coverage during the hours when approvals, callbacks, and escalations bunch together.",
    firstThirtyDays: [
      "Stabilize the 4pm-9pm intake queue with same-day triage notes and clean tagging.",
      "Reduce unresolved referral handoffs by tightening what gets documented before shift-end.",
      "Publish a weekly exceptions memo so day-shift leads can see repeat blockers before they become backlog.",
    ],
    workflowCadence: [
      {
        label: "Mon-Fri evening block",
        detail: "Four to five hours of intake coverage with a hard handoff note before sign-off.",
      },
      {
        label: "Tuesday coordination pass",
        detail: "Review complex referrals with care ops and flag cases that need a clinical callback.",
      },
      {
        label: "Friday throughput recap",
        detail: "Summarize queue volume, escalations, and patterns the client should address next week.",
      },
    ],
    fitSignals: [
      {
        label: "Care coordination overlap",
        score: 96,
        detail: "The brief is nearly identical to your strongest intake and patient-navigation work.",
      },
      {
        label: "Timezone compatibility",
        score: 94,
        detail: "Your GMT evening coverage lines up with Cedar's afternoon backlog window.",
      },
      {
        label: "Tooling readiness",
        score: 88,
        detail: "The role leans on trackers and escalation notes rather than new software ramp-up.",
      },
      {
        label: "Relationship context",
        score: 93,
        detail: "You already know the operating language, which lowers onboarding risk immediately.",
      },
    ],
    stakeholders: [
      {
        name: "Maya S.",
        role: "Care Operations Lead",
        detail: "Owns queue quality and signs off on escalation thresholds.",
      },
      {
        name: "Devon K.",
        role: "Referral Partnerships Manager",
        detail: "Tracks partner SLA risk and will care about consistency in end-of-day notes.",
      },
      {
        name: "Evening RN desk",
        role: "Clinical escalation partner",
        detail: "Needs crisp flags on any referral that may change urgency overnight.",
      },
    ],
    interviewPlan: [
      { stage: "Brief sync", owner: "Talent ops", timing: "20 minutes" },
      { stage: "Client fit review", owner: "Cedar care ops", timing: "30 minutes" },
      { stage: "Shadow shift sample", owner: "Working session", timing: "One paid evening block" },
    ],
    highlights: [
      "Same client language as your current Cedar placement, so the dossier mostly asks for bandwidth validation.",
      "Clear definition of success: lower queue carryover and cleaner exception notes.",
      "High trust role with little performative meetings and a lot of operational ownership.",
    ],
    watchouts: [
      "You are already carrying Cedar hours, so the real constraint is total weekly load, not skill fit.",
      "The busiest window is emotionally heavy; crisp escalation rules matter as much as speed.",
      "The role requires reliable Friday reporting, not just daily queue handling.",
    ],
    applicationNotes: [
      "Lead with referral handoff process improvements you have already implemented.",
      "Call out approval history and response-time reliability to reinforce trust on a sensitive queue.",
      "Be explicit about which current engagement hours could flex if this expands.",
    ],
    clientSnapshot: [
      { label: "Role shape", value: "Evening intake + escalation hygiene" },
      { label: "Decision pressure", value: "Need coverage inside 7 days" },
      { label: "Budget posture", value: `${formatCurrency(40)}-${formatCurrency(55)}/hr` },
    ],
    relatedOpportunityIds: ["opp-caretide-ops", "opp-lumen-review"],
  },
  "opp-lumen-review": {
    summary:
      "Overflow AI review ops for a support team that needs disciplined QA eyes, concise edge-case notes, and a weekly quality memo leaders can act on.",
    mandate:
      "Protect review quality while volume climbs, especially on nuanced support interactions where tone and escalation judgment matter.",
    whyNow:
      "Lumen's queue volume rose after a product launch, and the internal team needs a steady reviewer before customer-support quality drifts.",
    firstThirtyDays: [
      "Calibrate on Lumen's review rubric and establish what counts as a true escalation versus a coaching note.",
      "Own overflow QA batches with consistent annotation quality and exception comments.",
      "Ship a one-page weekly memo that surfaces repeat failure patterns, not just raw counts.",
    ],
    workflowCadence: [
      {
        label: "Async review blocks",
        detail: "Three to four focused windows each week to score and annotate support interactions.",
      },
      {
        label: "Midweek quality huddle",
        detail: "A short sync with the QA lead to confirm edge-case handling and rubric drift.",
      },
      {
        label: "Friday memo",
        detail: "Summarize quality regressions, coaching opportunities, and unresolved escalation themes.",
      },
    ],
    fitSignals: [
      {
        label: "Review discipline",
        score: 90,
        detail: "Your QA and escalation handling background fits the judgment-heavy review loop.",
      },
      {
        label: "Category stretch",
        score: 78,
        detail: "This is adjacent to your strongest lane, so the fit depends on comfort with abstraction.",
      },
      {
        label: "Async compatibility",
        score: 92,
        detail: "The work is document-first and favors steady written synthesis over live meetings.",
      },
      {
        label: "Ramp complexity",
        score: 84,
        detail: "You can likely ramp quickly if the rubric is clear and examples are strong.",
      },
    ],
    stakeholders: [
      {
        name: "Ari T.",
        role: "QA Lead",
        detail: "Owns the rubric and will evaluate note quality more than raw throughput.",
      },
      {
        name: "Noah P.",
        role: "Support Ops Manager",
        detail: "Needs weekly themes translated into operational fixes for the support team.",
      },
      {
        name: "Model tuning squad",
        role: "Internal partner",
        detail: "Consumes examples of failure modes when the queue reveals product edge cases.",
      },
    ],
    interviewPlan: [
      { stage: "Rubric walkthrough", owner: "Talent ops", timing: "15 minutes" },
      { stage: "Calibration exercise", owner: "Lumen QA", timing: "45 minutes" },
      { stage: "Offer check-in", owner: "Support ops", timing: "20 minutes" },
    ],
    highlights: [
      "The role rewards careful judgment and written synthesis more than visible meeting performance.",
      "A weekly memo gives you a clear chance to turn review work into strategic signal.",
      "Hours are moderate, so this can complement an existing portfolio if the abstraction feels energizing.",
    ],
    watchouts: [
      "The fit is real, but this is the biggest category stretch in the current shortlist.",
      "Review fatigue can creep in if the rubric is vague or the queue is too repetitive.",
      "You should validate whether success is measured by throughput, calibration accuracy, or memo quality.",
    ],
    applicationNotes: [
      "Anchor your story in judgment, escalation handling, and written QA rigor rather than generic AI enthusiasm.",
      "Ask for sample annotations early so you can see whether the review bar is concrete.",
      "Signal that you are comfortable translating edge cases into repeatable operating guidance.",
    ],
    clientSnapshot: [
      { label: "Role shape", value: "Overflow QA + weekly insight memo" },
      { label: "Decision pressure", value: "Ramp target within 2 weeks" },
      { label: "Budget posture", value: `${formatCurrency(45)}-${formatCurrency(65)}/hr` },
    ],
    relatedOpportunityIds: ["opp-caretide-ops", "opp-cedar-evenings"],
  },
  "opp-caretide-ops": {
    summary:
      "Launch-phase care ops coordination for a team standing up new workflows and needing someone who can keep people, process, and trackers aligned under pressure.",
    mandate:
      "Translate a messy launch period into visible operating rhythm: clear ownership, dependable patient follow-through, and fewer dropped handoffs.",
    whyNow:
      "CareTide is entering a six-week launch window and wants temporary operational maturity before permanent hires are in place.",
    firstThirtyDays: [
      "Stand up a repeatable tracker for launch tasks, patient follow-ups, and blockers.",
      "Coordinate live standups into clear next actions that actually move work between owners.",
      "Catch process gaps early enough that the launch doesn't create hidden cleanup work later.",
    ],
    workflowCadence: [
      {
        label: "Twice-weekly standups",
        detail: "Drive concise updates, extract owners, and close loops after the call.",
      },
      {
        label: "Async tracker ownership",
        detail: "Maintain the system of record so launch decisions are visible across functions.",
      },
      {
        label: "Escalation sweep",
        detail: "Pull forward anything that could block patient navigation or implementation timing.",
      },
    ],
    fitSignals: [
      {
        label: "Launch operations fit",
        score: 91,
        detail: "You already have the coordination instincts this brief is trying to buy quickly.",
      },
      {
        label: "Patient-facing relevance",
        score: 89,
        detail: "The work blends internal operations with external care experience, which matches your profile well.",
      },
      {
        label: "Intensity tolerance",
        score: 87,
        detail: "The pace is higher than the Cedar extension, but still inside your operating style.",
      },
      {
        label: "Tooling flexibility",
        score: 90,
        detail: "This asks for workflow design and tracker stewardship, both strong overlap areas.",
      },
    ],
    stakeholders: [
      {
        name: "Rina O.",
        role: "Launch Program Manager",
        detail: "Needs someone who can convert standup talk into dependable movement.",
      },
      {
        name: "Cam H.",
        role: "Patient Success Lead",
        detail: "Watches for missed follow-ups and needs better visibility into edge cases.",
      },
      {
        name: "Implementation pod",
        role: "Cross-functional team",
        detail: "Depends on a clean tracker and quick follow-through more than polished reporting.",
      },
    ],
    interviewPlan: [
      { stage: "Launch brief", owner: "Talent ops", timing: "20 minutes" },
      { stage: "Scenario interview", owner: "CareTide PM", timing: "40 minutes" },
      { stage: "Tracker review", owner: "Working session", timing: "30 minutes" },
    ],
    highlights: [
      "Strong balance of patient-facing context and operational cleanup, which is exactly where your profile reads strongest.",
      "Short duration makes it easier to evaluate alongside existing work without a long commitment.",
      "Success is visible in tracker quality, escalation hygiene, and launch steadiness rather than vanity output.",
    ],
    watchouts: [
      "Launch work can create context-switching overhead if the client has weak internal ownership.",
      "You should confirm whether the tracker already exists or needs to be built from scratch.",
      "The two live standups mean this role is less purely async than the other shortlist items.",
    ],
    applicationNotes: [
      "Lead with examples where you turned ambiguity into a calm operating system for a team.",
      "Highlight patient navigation and workflow design together, since the role needs both.",
      "Ask who owns final decisions after standups so the execution burden is clear before you commit.",
    ],
    clientSnapshot: [
      { label: "Role shape", value: "Launch coordination + tracker ownership" },
      { label: "Decision pressure", value: "Launch starts next Monday" },
      { label: "Budget posture", value: `${formatCurrency(42)}-${formatCurrency(58)}/hr` },
    ],
    relatedOpportunityIds: ["opp-cedar-evenings", "opp-lumen-review"],
  },
};

export function getOpportunityDetailParams() {
  return talentOpportunities.map((opportunity) => ({
    opportunityId: opportunity.id,
  }));
}

export function getOpportunityDetail(opportunityId: string): OpportunityDetailRecord | null {
  const opportunity = talentOpportunities.find((entry) => entry.id === opportunityId);
  const dossier = opportunityDossiers[opportunityId];

  if (!opportunity || !dossier) {
    return null;
  }

  const relatedOpportunities = dossier.relatedOpportunityIds
    .map((relatedId) => talentOpportunities.find((entry) => entry.id === relatedId))
    .filter((entry): entry is TalentOpportunity => Boolean(entry));

  return {
    opportunity,
    dossier,
    relatedOpportunities,
    budgetLabel: `${formatCurrency(opportunity.budgetRange[0])} - ${formatCurrency(
      opportunity.budgetRange[1],
    )}/hr`,
    availabilityContext: `${talentProfile.weeklyAvailability} hrs/week available, ${opportunity.hoursPerWeek} hrs/week requested`,
  };
}
