export type MarketingMetric = {
  label: string;
  value: string;
  note: string;
};

export type MarketingStep = {
  id: string;
  title: string;
  description: string;
};

export type MarketingAudienceCard = {
  eyebrow: string;
  title: string;
  summary: string;
  points: string[];
};

export type MarketingCategory = {
  title: string;
  description: string;
};

export const marketingContent = {
  hero: {
    eyebrow: "The human layer · Est. 2026",
    titleLead: "Remote hourly talent for the work",
    titleEmphasis: "AI cannot",
    titleTrail: "close on its own.",
    lead:
      "Autharis connects businesses with vetted remote professionals for the workflows that still need judgment, communication, and accountable follow-through. Teams approve the hours. Operators carry the nuance.",
    primaryAction: "Start a brief",
    secondaryAction: "See the operating model",
    support:
      "Built for teams that need capable humans around customer operations, care coordination, research, QA, and AI-adjacent workflows.",
  },
  metrics: [
    {
      label: "Shortlist speed",
      value: "72 hrs",
      note: "From scoped brief to focused operator options.",
    },
    {
      label: "Approval model",
      value: "Hours only",
      note: "Pay for reviewed work instead of fixed retainers.",
    },
    {
      label: "Workflow fit",
      value: "Human-in-loop",
      note: "Built for judgment calls, handoffs, and edge cases.",
    },
  ] satisfies MarketingMetric[],
  ticker: [
    "Inbox coverage during hiring gaps",
    "Patient or client outreach with documented follow-up",
    "Human QA around AI triage queues",
    "Project coordination during launches or transitions",
    "Backlog relief for support and operations teams",
    "Research and structured handoff work",
  ],
  steps: [
    {
      id: "i · Describe",
      title: "Describe the work that is piling up.",
      description:
        "Bring the real brief: the team context, the systems involved, the decision points, and where automation currently stops short.",
    },
    {
      id: "ii · Match",
      title: "Review operators who fit the workflow.",
      description:
        "Autharis narrows to a practical shortlist based on skills, availability, communication range, and adjacent domain context.",
    },
    {
      id: "iii · Approve",
      title: "Run the work with visible hours and clean handoffs.",
      description:
        "Operators track the output, teams approve the time, and the engagement stays legible from day one instead of becoming a black box.",
    },
  ] satisfies MarketingStep[],
  audienceCards: [
    {
      eyebrow: "For businesses",
      title: "Capable humans on call, not added payroll drag.",
      summary:
        "Use Autharis when the team needs more judgment, responsiveness, and follow-through without opening a full hiring cycle.",
      points: [
        "Add coverage across support, operations, and special projects.",
        "Handle spikes, transitions, and backlog without a procurement maze.",
        "Keep hourly work reviewable before payment is released.",
        "Wrap reliable people around systems that still need human care.",
      ],
    },
    {
      eyebrow: "For talent",
      title: "Flexible remote work for people who already know how to operate.",
      summary:
        "Professionals join the network around what they can actually do today, then match into hourly engagements that respect that experience.",
      points: [
        "Turn existing experience into a clear work-ready profile.",
        "Match around real skills instead of generic application funnels.",
        "Take short-term or recurring work that fits your schedule.",
        "Build a stronger remote portfolio through approved outcomes.",
      ],
    },
  ] satisfies MarketingAudienceCard[],
  proofPoints: [
    {
      label: "Judgment-first workflows",
      value: "Support + Ops",
      note: "The first classes of work center communication, coordination, and review.",
    },
    {
      label: "Why this market exists",
      value: "Nuance",
      note: "Edge cases, relationship handling, and accountability still need a person.",
    },
    {
      label: "Why teams stay",
      value: "Legibility",
      note: "Scoped work, visible hours, and approvals before the invoice lands.",
    },
  ],
  categories: [
    {
      title: "Administrative support",
      description:
        "Scheduling, inbox management, documentation, logistics, and the repetitive coordination tasks that keep teams unstuck.",
    },
    {
      title: "Customer operations",
      description:
        "Email, chat, follow-up, and account coordination work where clarity, tone, and responsiveness shape the experience.",
    },
    {
      title: "Care coordination",
      description:
        "Outreach, intake, navigation, reminders, and member or patient support that need context and careful communication.",
    },
    {
      title: "Project support",
      description:
        "Launch tracking, implementation follow-through, vendor nudges, and all the operational glue work that rarely fits into software.",
    },
    {
      title: "Research and QA",
      description:
        "Structured research, list building, review, annotation, and human verification around machine-generated outputs.",
    },
    {
      title: "AI workflow coverage",
      description:
        "Operators who can watch the queue, resolve exceptions, handle the hard cases, and make sure the workflow actually closes.",
    },
  ] satisfies MarketingCategory[],
  timecard: {
    signalTitle: "Meridian Health needed overflow coordination in under a week.",
    signalSummary:
      "The shortlist emphasized patient communication strength, CRM discipline, and enough operational calm to cleanly inherit an active queue.",
    signalPoints: [
      "Customer and patient outreach background",
      "AI-assisted triage QA comfort",
      "Daily handoff notes for internal teams",
    ],
    stamp: "Hours approved",
    reference: "No. 00472",
    weekLabel: "Week 16 · 2026",
    worker: "Maya L.",
    assignment: "Customer operations · Meridian Health",
    entries: [
      { day: "Mon", task: "Inbox triage and escalation notes", hours: "4.0h" },
      { day: "Tue", task: "Patient outreach call block", hours: "3.5h" },
      { day: "Wed", task: "Case coordination follow-up", hours: "5.0h" },
      { day: "Thu", task: "AI queue QA and exception review", hours: "4.5h" },
      { day: "Fri", task: "Documentation and handoff summary", hours: "3.0h" },
    ],
    totalLabel: "Total",
    totalValue: "20.0 hrs · $840",
  },
} as const;
