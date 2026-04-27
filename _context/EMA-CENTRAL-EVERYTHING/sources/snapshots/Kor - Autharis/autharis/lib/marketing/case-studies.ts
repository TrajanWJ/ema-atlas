export type CaseStudyMetric = {
  label: string;
  value: string;
  note: string;
};

export type CaseStudyCheckpoint = {
  phase: string;
  title: string;
  detail: string;
};

export type CaseStudyArtifact = {
  label: string;
  detail: string;
};

export type CaseStudyQuote = {
  text: string;
  attribution: string;
  role: string;
};

export type CaseStudy = {
  slug: string;
  label: string;
  title: string;
  summary: string;
  client: string;
  clientLabel: string;
  sector: string;
  engagement: string;
  timeframe: string;
  team: string;
  heroKicker: string;
  challenge: string;
  response: string;
  outcome: string;
  proofPoints: readonly string[];
  tags: readonly string[];
  metrics: readonly CaseStudyMetric[];
  checkpoints: readonly CaseStudyCheckpoint[];
  artifacts: readonly CaseStudyArtifact[];
  quote: CaseStudyQuote;
  accent: string;
};

export const caseStudyArchiveStats = [
  {
    label: "Typical launch window",
    value: "5 days",
    note: "From scoped brief to a live operator handoff.",
  },
  {
    label: "Operator model",
    value: "Hourly",
    note: "Approved time instead of open-ended retainers.",
  },
  {
    label: "Operating pattern",
    value: "Human-in-loop",
    note: "Used when systems still need judgment and follow-through.",
  },
] satisfies CaseStudyMetric[];

export const caseStudyOperatingNotes = [
  {
    eyebrow: "01 / Friction point",
    title: "The work already exists before Autharis arrives.",
    description:
      "Each engagement begins with a real queue, a backlog, or a launch moment that is already leaking time and attention.",
  },
  {
    eyebrow: "02 / Operator layer",
    title: "Matching is anchored in workflow fit, not generic talent categories.",
    description:
      "We scope for tools, communication range, escalation judgment, and the daily handoff rhythm the internal team actually needs.",
  },
  {
    eyebrow: "03 / Approval loop",
    title: "Proof stays legible from the first hour onward.",
    description:
      "Hours, notes, queue ownership, and exception handling stay visible so the client never loses the operational thread.",
  },
] as const;

export const caseStudies = [
  {
    slug: "meridian-health-overflow-coordination",
    label: "Case study 01",
    title: "Overflow coordination for a regional care network in the week after an EHR transition.",
    summary:
      "Meridian Health needed patient outreach, escalation hygiene, and queue recovery after an internal system change overloaded the care coordination team.",
    client: "Meridian Health",
    clientLabel: "Regional outpatient network",
    sector: "Care coordination",
    engagement: "Four-week coverage sprint",
    timeframe: "Week 16 to Week 19, 2026",
    team: "2 outreach operators + 1 QA lead",
    heroKicker: "System transition pressure",
    challenge:
      "The internal team had live patient callbacks, appointment follow-up, and documentation cleanup stacking up faster than staff could close it. Automation handled categorization, but the work still needed careful outreach and judgment on who required same-day escalation.",
    response:
      "Autharis matched operators with patient communication range, CRM discipline, and comfort working alongside an AI-assisted triage queue. The engagement was structured around daily callback blocks, escalation notes, and a shared handoff ritual with the clinic operations lead.",
    outcome:
      "Within the first week the backlog stabilized. By the end of the sprint, Meridian had a repeatable overflow playbook for callbacks, exception review, and end-of-day handoff notes without rushing into permanent hiring.",
    proofPoints: [
      "Daily callback windows were recovered without dropping same-day escalations.",
      "Every approved hour tied back to queue ownership, not vague administrative time.",
      "The clinic lead had one operator-facing ritual instead of multiple ad hoc check-ins.",
    ],
    tags: ["Patient outreach", "Escalation notes", "AI queue QA"],
    metrics: [
      {
        label: "Callback completion",
        value: "91%",
        note: "Of priority patient outreach logged inside the first six days.",
      },
      {
        label: "Escalation miss rate",
        value: "0",
        note: "No same-day issues were lost during the coverage window.",
      },
      {
        label: "Approved hours",
        value: "26 / wk",
        note: "Visible operator coverage with reviewed notes attached.",
      },
    ],
    checkpoints: [
      {
        phase: "Day 1",
        title: "Mapped the callback queue into urgency bands.",
        detail:
          "The operators separated same-day patient needs from standard follow-up and created a shared escalation note structure for the internal lead.",
      },
      {
        phase: "Day 3",
        title: "Stabilized the outreach rhythm.",
        detail:
          "Callback blocks, voicemail standards, and unresolved-case flags were running on a repeatable cadence instead of reactive inbox work.",
      },
      {
        phase: "Week 2",
        title: "Added QA review around the AI triage lane.",
        detail:
          "Operators verified machine-labeled urgency against patient context and surfaced exceptions before the queue drifted again.",
      },
      {
        phase: "Week 4",
        title: "Handed Meridian an overflow playbook.",
        detail:
          "The team left behind documented note formats, callback thresholds, and a clean escalation ladder for future surges.",
      },
    ],
    artifacts: [
      {
        label: "Daily handoff ledger",
        detail: "Priority callbacks, escalations, and owner notes sent before close.",
      },
      {
        label: "Exception review lane",
        detail: "AI-triaged cases verified by a human before they reached patient-facing teams.",
      },
      {
        label: "Coverage brief",
        detail: "Scope, hours, and communication expectations reset at the start of each week.",
      },
    ],
    quote: {
      text: "What we needed was not more software. We needed calm people who could inherit a live queue without losing the edge cases.",
      attribution: "Clinic operations lead",
      role: "Meridian Health",
    },
    accent: "#bb5f2d",
  },
  {
    slug: "northline-logistics-launch-ops",
    label: "Case study 02",
    title: "Launch-week dispatch support for a logistics team moving too fast for a standard hiring cycle.",
    summary:
      "Northline Logistics was opening a new client lane and needed operator coverage for appointment confirmations, inbox routing, and vendor follow-through before the internal team burned out.",
    client: "Northline Logistics",
    clientLabel: "Regional freight and dispatch group",
    sector: "Customer operations",
    engagement: "Three-week launch support block",
    timeframe: "Week 9 to Week 11, 2026",
    team: "1 dispatch operator + 1 client communication specialist",
    heroKicker: "Launch-week inbox compression",
    challenge:
      "A new customer program multiplied the number of confirmations, scheduling changes, and vendor nudges hitting the team every day. The software stack captured updates, but nobody internal had spare capacity to own the communication loops that kept loads moving.",
    response:
      "Autharis staffed operators around dispatch language, rapid follow-up, and disciplined note-taking. The work was split into morning confirmations, mid-day exception handling, and evening route recap so the internal launch lead could stay inside the highest-leverage decisions.",
    outcome:
      "Northline kept the program on schedule, avoided a reactive hiring scramble, and ended the engagement with a clear communication template library the operations team could reuse.",
    proofPoints: [
      "Inbox ownership moved from reactive forwarding to named operator lanes.",
      "Vendor follow-through stayed tracked against each route and appointment change.",
      "The internal launch lead regained time for exception decisions instead of routine coordination.",
    ],
    tags: ["Dispatch support", "Inbox routing", "Vendor follow-through"],
    metrics: [
      {
        label: "Same-day confirmations",
        value: "97%",
        note: "Load and appointment updates acknowledged before cutoff.",
      },
      {
        label: "Launch lead time recovered",
        value: "14 hrs / wk",
        note: "Shifted from routine coordination back into exception handling.",
      },
      {
        label: "Template library",
        value: "18",
        note: "Reusable communication patterns left with the team.",
      },
    ],
    checkpoints: [
      {
        phase: "Day 2",
        title: "Separated routine confirmations from true exceptions.",
        detail:
          "The operating team stopped treating every change like a fire and created one source of truth for route-level ownership.",
      },
      {
        phase: "Day 5",
        title: "Introduced launch-specific response templates.",
        detail:
          "Operators standardized customer, vendor, and driver notes so context stopped getting lost between updates.",
      },
      {
        phase: "Week 2",
        title: "Built a daily recap ritual for leadership.",
        detail:
          "The internal lead received one concise ledger of outstanding risks instead of scrolling a fragmented inbox thread.",
      },
      {
        phase: "Week 3",
        title: "Closed with reusable operating patterns.",
        detail:
          "Northline kept the communication templates, escalation thresholds, and owner map after the launch surge ended.",
      },
    ],
    artifacts: [
      {
        label: "Owner map",
        detail: "Named operator lanes for confirmations, route changes, and vendor nudges.",
      },
      {
        label: "Launch recap",
        detail: "One end-of-day brief showing blockers, resolved issues, and morning priorities.",
      },
      {
        label: "Message kit",
        detail: "Reusable templates for customer updates, scheduling changes, and exception notices.",
      },
    ],
    quote: {
      text: "Autharis gave us grown-up operational coverage fast enough to matter. The difference was not volume, it was follow-through.",
      attribution: "Program launch manager",
      role: "Northline Logistics",
    },
    accent: "#183129",
  },
  {
    slug: "atlas-legal-intake-recovery",
    label: "Case study 03",
    title: "Intake recovery for a legal support team buried under follow-up and document chasing.",
    summary:
      "Atlas Legal needed a disciplined intake layer for document collection, prospective client follow-up, and status communication without adding permanent headcount mid-quarter.",
    client: "Atlas Legal",
    clientLabel: "Specialized legal support practice",
    sector: "Administrative support",
    engagement: "Six-week intake recovery engagement",
    timeframe: "Week 4 to Week 10, 2026",
    team: "2 intake operators",
    heroKicker: "Document and follow-up drag",
    challenge:
      "Prospective clients were slipping between initial contact, missing-document reminders, and status updates because the firm had no protected time to run a clean intake process. Automation surfaced missing fields, but the work still depended on clear communication and polite persistence.",
    response:
      "Autharis matched operators who could manage intake notes, missing-document reminders, and expectation-setting without sounding robotic. The brief centered on response tone, confidentiality boundaries, and a weekly ledger of who was waiting on what.",
    outcome:
      "Atlas moved from scattered inbox follow-up to a legible intake workflow with named owners, clean reminders, and enough breathing room for the internal team to focus on legal review.",
    proofPoints: [
      "Prospective clients got consistent, human follow-up rather than fragmented reminders.",
      "Document chasing was tracked by owner and status, not buried in email threads.",
      "The firm gained a repeatable intake rhythm without opening a new hiring process.",
    ],
    tags: ["Intake support", "Document reminders", "Status communication"],
    metrics: [
      {
        label: "Missing-document closure",
        value: "68%",
        note: "Of incomplete files resolved during the six-week window.",
      },
      {
        label: "Median follow-up lag",
        value: "18 hrs",
        note: "Down from multi-day gaps before the engagement started.",
      },
      {
        label: "Active matters stabilized",
        value: "42",
        note: "Cases with a named owner and current intake status at closeout.",
      },
    ],
    checkpoints: [
      {
        phase: "Week 1",
        title: "Audited every intake stage for silent drop-off points.",
        detail:
          "The operators identified where prospective clients stalled and created a reminder ladder with explicit ownership.",
      },
      {
        phase: "Week 2",
        title: "Introduced status language that sounded human and specific.",
        detail:
          "Templates were built around expected wait times, missing materials, and what would happen next so conversations stayed clear.",
      },
      {
        phase: "Week 4",
        title: "Reduced lawyer-side inbox triage.",
        detail:
          "Operators captured status questions, handled document follow-up, and escalated only the threads that required legal judgment.",
      },
      {
        phase: "Week 6",
        title: "Closed with an intake operating packet.",
        detail:
          "Atlas kept the reminder cadence, status taxonomy, and ownership ledger for the next quarter.",
      },
    ],
    artifacts: [
      {
        label: "Intake status ledger",
        detail: "Every open matter grouped by missing step, owner, and promised next touch.",
      },
      {
        label: "Reminder ladder",
        detail: "Escalating but respectful touchpoints for document collection and status checks.",
      },
      {
        label: "Closeout packet",
        detail: "Reusable templates, owner definitions, and communication guardrails for future intake spikes.",
      },
    ],
    quote: {
      text: "The value was having people who could keep the intake process moving without sounding canned or needing daily rescue.",
      attribution: "Managing operations partner",
      role: "Atlas Legal",
    },
    accent: "#8b3917",
  },
] satisfies CaseStudy[];

export const featuredCaseStudy = caseStudies[0];

export function getCaseStudyBySlug(slug: string) {
  return caseStudies.find((study) => study.slug === slug);
}
