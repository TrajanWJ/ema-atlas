export type BriefScenario = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  operatorProfile: string;
  weeklyHours: string;
  matchWindow: string;
  systems: string[];
  deliverables: string[];
  operatorSignals: string[];
  watchouts: string[];
  timeline: {
    label: string;
    detail: string;
  }[];
  approvalCadence: string;
};

export type BriefStage = {
  id: string;
  label: string;
  note: string;
};

export type BriefCoverage = {
  id: string;
  label: string;
  note: string;
};

export type BriefPriority = {
  id: string;
  label: string;
  detail: string;
};

export const briefIntakeContent = {
  hero: {
    eyebrow: "Start a brief · Editorial demo",
    title: "Describe the work with enough signal for a trustworthy shortlist.",
    lead:
      "This isolated demo shows how Autharis can turn a nuanced request into a concise operator brief: business context, systems, decision points, coverage expectations, and the approvals that keep hourly work legible.",
    support:
      "No form backend here. The goal is to make the intake feel calm, credible, and ready for client conversation.",
  },
  principles: [
    "Scope the workflow before we scope the person.",
    "Turn vague urgency into concrete approvals and handoffs.",
    "Keep the final brief readable by both the client lead and the matched operator.",
  ],
  stages: [
    {
      id: "pilot",
      label: "Pilot launch",
      note: "A first engagement with tight scope, visible hours, and fast feedback loops.",
    },
    {
      id: "expansion",
      label: "Team expansion",
      note: "A proven workflow that needs more coverage or steadier execution.",
    },
    {
      id: "transition",
      label: "Coverage gap",
      note: "A queue or process that needs short-term relief during change, hiring, or leave.",
    },
  ] satisfies BriefStage[],
  coverages: [
    {
      id: "focused",
      label: "10 to 15 hrs / week",
      note: "Good for one queue, one handoff rhythm, and one accountable operator.",
    },
    {
      id: "steady",
      label: "20 to 25 hrs / week",
      note: "Enough room for daily continuity, exception handling, and documented follow-through.",
    },
    {
      id: "extended",
      label: "30+ hrs / week",
      note: "Used when the workflow behaves like a real operating lane rather than ad hoc overflow.",
    },
  ] satisfies BriefCoverage[],
  priorities: [
    {
      id: "handoff-quality",
      label: "Clean handoffs",
      detail: "Daily notes, clear next actions, and no lost context between teams.",
    },
    {
      id: "response-time",
      label: "Fast response time",
      detail: "Reliable queue movement for teams carrying active outreach or support load.",
    },
    {
      id: "ai-exceptions",
      label: "AI exception handling",
      detail: "A human layer for nuanced edge cases where automation stalls or needs judgment.",
    },
    {
      id: "client-tone",
      label: "Client-safe communication",
      detail: "Tone, empathy, and professionalism in customer, patient, or account-facing work.",
    },
    {
      id: "process-rigor",
      label: "Process discipline",
      detail: "Operators who can stay consistent inside SOPs, CRMs, and review checkpoints.",
    },
  ] satisfies BriefPriority[],
  scenarios: [
    {
      id: "patient-outreach",
      eyebrow: "Care coordination",
      title: "Overflow outreach and follow-up for a healthcare operations team",
      summary:
        "A clinic group needs calm, documented outreach support around reminders, reschedules, and follow-up notes while internal staff focus on escalations.",
      operatorProfile:
        "Patient-facing coordinator with CRM discipline, clear call notes, and comfort escalating edge cases.",
      weeklyHours: "20.0 hrs",
      matchWindow: "Shortlist in 72 hours",
      systems: ["Athena queue", "Shared Gmail", "HubSpot notes", "Daily handoff doc"],
      deliverables: [
        "Daily completed-outreach summary",
        "Escalation list with owner and status",
        "Weekly patterns memo for missed appointments",
      ],
      operatorSignals: [
        "Comfort with sensitive communication",
        "Strong documentation and callback hygiene",
        "Can inherit an existing process without adding noise",
      ],
      watchouts: [
        "Avoid overpromising scheduling authority",
        "Escalate clinical or billing ambiguity immediately",
      ],
      timeline: [
        {
          label: "Day 1",
          detail: "Align on scripts, escalation triggers, and completed-contact definition.",
        },
        {
          label: "Day 3",
          detail: "Review outreach notes quality and missed-contact recovery rate.",
        },
        {
          label: "Week 2",
          detail: "Confirm queue stability and decide whether to extend or narrow scope.",
        },
      ],
      approvalCadence: "Client lead reviews hours and escalations twice weekly.",
    },
    {
      id: "support-recovery",
      eyebrow: "Customer operations",
      title: "Inbox recovery and account follow-through after a launch spike",
      summary:
        "A software team needs someone to cleanly work through a support backlog, maintain tone, and route high-risk issues without creating a second management problem.",
      operatorProfile:
        "Customer operations specialist who can balance empathy, queue speed, and crisp internal escalation.",
      weeklyHours: "24.0 hrs",
      matchWindow: "First operator options by Thursday",
      systems: ["Intercom", "Notion SOPs", "Linear bug queue", "Slack escalation channel"],
      deliverables: [
        "Same-day triage coverage during the spike",
        "Tagging and escalation notes for product issues",
        "Weekly inbox themes and friction report",
      ],
      operatorSignals: [
        "Strong written communication under pressure",
        "Good judgment about when to escalate vs. resolve",
        "Can keep queue labels and notes consistent",
      ],
      watchouts: [
        "Do not let backlog speed erode brand tone",
        "Escalate account-risk signals before promising resolution windows",
      ],
      timeline: [
        {
          label: "Day 1",
          detail: "Define queue tiers, macros, and issue classes that require escalation.",
        },
        {
          label: "Day 4",
          detail: "Check handle time, note quality, and whether the escalation path is too noisy.",
        },
        {
          label: "Week 2",
          detail: "Shift from backlog relief toward stable daily coverage if the fit is strong.",
        },
      ],
      approvalCadence: "Ops manager approves time weekly with a note-quality spot check.",
    },
    {
      id: "ai-qa-desk",
      eyebrow: "AI workflow coverage",
      title: "Human review desk around an AI-assisted operations queue",
      summary:
        "A growing team has automation in place, but the final 20% still needs a person to catch nuanced misses, make the call, and close the loop.",
      operatorProfile:
        "QA-minded operator who understands confidence thresholds, pattern logging, and exception review.",
      weeklyHours: "15.0 hrs",
      matchWindow: "Recommended shortlist in 3 business days",
      systems: ["Internal triage console", "Airtable tracking", "Prompt QA log", "Slack approvals"],
      deliverables: [
        "Reviewed exception queue with disposition notes",
        "False-positive / false-negative pattern tracker",
        "Escalation digest for workflow owners",
      ],
      operatorSignals: [
        "Comfort reading structured AI outputs",
        "Pattern recognition plus disciplined note-taking",
        "Knows when to pause automation and ask for a decision",
      ],
      watchouts: [
        "Keep review criteria stable before widening scope",
        "Flag repeated model failures as a systems issue, not operator error",
      ],
      timeline: [
        {
          label: "Day 1",
          detail: "Clarify confidence rules, override permissions, and escalation owners.",
        },
        {
          label: "Day 5",
          detail: "Assess whether review notes are usable for prompt and policy tuning.",
        },
        {
          label: "Week 3",
          detail: "Decide if this stays a review lane or becomes a broader operations role.",
        },
      ],
      approvalCadence: "Workflow owner approves hours after a weekly QA review.",
    },
  ] satisfies BriefScenario[],
  trustNotes: [
    {
      title: "What the client gives us",
      detail:
        "Context, systems, edge cases, and the approvals that make the engagement safe to run.",
    },
    {
      title: "What Autharis returns",
      detail:
        "A focused brief, a shortlist calibrated to the workflow, and a first-week operating shape.",
    },
    {
      title: "What stays visible",
      detail:
        "Hours, escalation rules, deliverables, and the handoff rhythm that keeps work reviewable.",
    },
  ],
} as const;

type BuildBriefPreviewArgs = {
  scenarioId: string;
  stageId: string;
  coverageId: string;
  priorityIds: string[];
};

type BriefPreview = {
  scenario: BriefScenario;
  stage: BriefStage;
  coverage: BriefCoverage;
  priorities: BriefPriority[];
  briefLabel: string;
  summary: string;
  intakeChecklist: string[];
  shortlistHeadline: string;
};

function findStage(stageId: string) {
  return (
    briefIntakeContent.stages.find((stage) => stage.id === stageId) ??
    briefIntakeContent.stages[0]
  );
}

function findCoverage(coverageId: string) {
  return (
    briefIntakeContent.coverages.find((coverage) => coverage.id === coverageId) ??
    briefIntakeContent.coverages[0]
  );
}

export function getBriefScenario(scenarioId: string) {
  return (
    briefIntakeContent.scenarios.find((scenario) => scenario.id === scenarioId) ??
    briefIntakeContent.scenarios[0]
  );
}

export function buildBriefPreview({
  scenarioId,
  stageId,
  coverageId,
  priorityIds,
}: BuildBriefPreviewArgs): BriefPreview {
  const scenario = getBriefScenario(scenarioId);
  const stage = findStage(stageId);
  const coverage = findCoverage(coverageId);
  const priorities = briefIntakeContent.priorities.filter((priority) =>
    priorityIds.includes(priority.id),
  );

  return {
    scenario,
    stage,
    coverage,
    priorities,
    briefLabel: `${scenario.eyebrow} · ${stage.label}`,
    summary: `${scenario.summary} The initial coverage is scoped at ${coverage.label.toLowerCase()} with an approvals-first operating model and an operator profile centered on ${scenario.operatorProfile.toLowerCase()}.`,
    intakeChecklist: [
      `Confirm workflow owner, escalation owner, and who approves the hours.`,
      `List the live systems in scope: ${scenario.systems.slice(0, 3).join(", ")}.`,
      `Define success around ${priorities.length > 0 ? priorities.map((priority) => priority.label.toLowerCase()).join(", ") : "clean execution"}.`,
    ],
    shortlistHeadline: `Autharis would shortlist around ${scenario.operatorProfile.toLowerCase()} with emphasis on ${priorities.length > 0 ? priorities[0].detail.toLowerCase() : "documented follow-through"}.`,
  };
}
