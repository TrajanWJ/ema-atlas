export type TalentJoinMetric = {
  label: string;
  value: string;
  note: string;
};

export type TalentJoinPillar = {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
};

export type TalentJoinTrack = {
  eyebrow: string;
  title: string;
  summary: string;
  signals: string[];
};

export type TalentJoinStep = {
  id: string;
  title: string;
  description: string;
  output: string;
};

export type TalentJoinExpectation = {
  title: string;
  signal: string;
  watchout: string;
};

export type TalentJoinFaq = {
  question: string;
  answer: string;
};

export const talentJoinContent = {
  hero: {
    eyebrow: "Join the network · For talent",
    titleLead: "Bring the work you already know how to",
    titleEmphasis: "carry",
    titleTrail: "from a distance.",
    lead:
      "Autharis is building a talent network for remote professionals who can calm a queue, protect the tone, document the decision, and keep the work legible after the handoff.",
    support:
      "This is for operators, coordinators, specialists, and utility players whose value shows up in judgment, follow-through, and the ability to make messy workflows feel stable.",
    primaryAction: "See the entry path",
    secondaryAction: "Read the standards",
  },
  metrics: [
    {
      label: "Review rhythm",
      value: "5 days",
      note: "A clear first pass on fit, writing, and workflow range.",
    },
    {
      label: "Engagement shape",
      value: "Hourly",
      note: "Most work starts as scoped weekly coverage with approvals.",
    },
    {
      label: "What matters",
      value: "Judgment",
      note: "Documentation, tone, reliability, and clean escalation habits.",
    },
  ] satisfies TalentJoinMetric[],
  ticker: [
    "Customer operations specialists",
    "Care coordinators and intake operators",
    "Executive and admin support leads",
    "Research and QA operators",
    "AI workflow reviewers",
    "Project and implementation coordinators",
  ],
  profile: {
    status: "Illustrative operator profile",
    name: "Nia R.",
    title: "Customer operations and care coordination",
    summary:
      "Seven years across patient communication, inbox recovery, and CRM-heavy operations with a record of calm follow-through.",
    availability: "20 to 25 hours per week",
    strengths: [
      "Written tone that can move between warm, direct, and clinical",
      "Fast note hygiene inside CRMs, shared inboxes, and handoff docs",
      "Knows when to escalate ambiguity instead of improvising around it",
    ],
    stack: ["HubSpot", "Athena", "Intercom", "Notion", "Slack"],
    proofLabel: "What a strong profile shows",
    proofPoints: [
      "A few concrete workflows, not a list of vague buzzwords",
      "Examples of ownership, follow-up, and exception handling",
      "Availability that matches the engagement you actually want",
    ],
  },
  pillars: [
    {
      eyebrow: "01 / Join around real strengths",
      title: "We do not flatten experience into a generic remote-VA bucket.",
      description:
        "Autharis wants to know the workflows you can already run cleanly: support recovery, care navigation, admin coordination, research, QA, scheduling, or AI review lanes that still need a human call.",
      points: [
        "Name the systems and environments you have operated inside.",
        "Show where your judgment matters, not just where you were present.",
        "Frame your experience around repeatable outcomes and handoffs.",
      ],
    },
    {
      eyebrow: "02 / Matchability over volume",
      title: "The goal is not to spray applications. It is to become easy to place.",
      description:
        "Strong profiles read like operating documents. A buyer can quickly see your range, your communication level, and the conditions where you are likely to do good work.",
      points: [
        "Clear scope beats long self-description.",
        "Specific examples beat inflated titles.",
        "Reliable availability beats saying yes to everything.",
      ],
    },
    {
      eyebrow: "03 / Trust is operational",
      title: "Hourly work only scales when the work stays reviewable.",
      description:
        "The best talent in the network keeps decisions visible. That means concise notes, explicit escalations, and enough process discipline that the client never wonders where the work stands.",
      points: [
        "Document the context, next step, and owner.",
        "Protect tone in any client-, patient-, or account-facing workflow.",
        "Treat edge cases as signals to escalate, not to bury.",
      ],
    },
  ] satisfies TalentJoinPillar[],
  tracks: [
    {
      eyebrow: "Track / Customer ops",
      title: "Customer operations and support recovery",
      summary:
        "For people who can move through inboxes, chat queues, follow-up, renewals, and account logistics without losing tone or creating more management overhead.",
      signals: [
        "Strong written communication under pressure",
        "Good triage judgment and note quality",
        "Comfort routing risk before it becomes churn",
      ],
    },
    {
      eyebrow: "Track / Care coordination",
      title: "Patient, member, and care coordination support",
      summary:
        "For coordinators who understand sensitive outreach, intake, reminders, scheduling, and the discipline required in healthcare-adjacent workflows.",
      signals: [
        "Clear documentation after every interaction",
        "Comfort with sensitive communication and escalation",
        "Can preserve empathy while staying operationally crisp",
      ],
    },
    {
      eyebrow: "Track / Admin utility",
      title: "Executive, admin, and implementation support",
      summary:
        "For operators who can stabilize calendars, follow-ups, internal logistics, launch coordination, and all the glue work that keeps teams from drifting.",
      signals: [
        "High ownership around loose ends",
        "Calm follow-through across multiple systems",
        "Can turn ambiguity into orderly next steps",
      ],
    },
    {
      eyebrow: "Track / Research and QA",
      title: "Research, QA, and AI workflow coverage",
      summary:
        "For people who can review machine-generated output, catch the misses, structure findings, and leave behind usable notes instead of vague flags.",
      signals: [
        "Pattern recognition plus process discipline",
        "Comfort in structured review environments",
        "Knows how to escalate repeat failures with evidence",
      ],
    },
  ] satisfies TalentJoinTrack[],
  steps: [
    {
      id: "i",
      title: "Map the work you can already run.",
      description:
        "Start with real workflows, real systems, and the kinds of edge cases you know how to hold. The strongest profiles sound like the start of an operating brief.",
      output: "Output: a profile that names scope, tools, tone, and availability.",
    },
    {
      id: "ii",
      title: "Share proof that you can protect the handoff.",
      description:
        "Examples of note quality, escalation thinking, and communication range help us understand whether you are likely to make a client's workflow feel safer, not just faster.",
      output: "Output: a tighter signal on writing quality and judgment.",
    },
    {
      id: "iii",
      title: "Review fit before we talk about volume.",
      description:
        "Autharis calibrates for matchability first. We would rather understand the conditions where you are excellent than force a broad but blurry profile into the market.",
      output: "Output: a clear read on where you slot best in the network.",
    },
    {
      id: "iv",
      title: "Enter the shortlist with the right expectations.",
      description:
        "Most engagements begin with scoped hourly work, explicit review checkpoints, and a first-week operating shape that both sides can actually sustain.",
      output: "Output: a cleaner first conversation when a brief is live.",
    },
  ] satisfies TalentJoinStep[],
  evidencePack: {
    eyebrow: "What to prepare",
    title: "A strong first pass usually includes:",
    items: [
      "Two or three workflow examples you could confidently run this month",
      "Tools, systems, or channels you can already operate inside",
      "A note on your communication range: support, care, admin, research, QA",
      "Availability that is honest enough to schedule around",
      "A short writing sample or process explanation if your work depends on it",
    ],
  },
  expectations: [
    {
      title: "Reliable communication",
      signal: "You can acknowledge quickly, write clearly, and leave notes another operator could trust.",
      watchout: "Profiles that feel polished but give no evidence of day-to-day operating discipline.",
    },
    {
      title: "Escalation judgment",
      signal: "You know when something is out of scope, sensitive, blocked, or better handled by the client team.",
      watchout: "Treating confidence as a substitute for escalation hygiene.",
    },
    {
      title: "System fluency",
      signal: "You can move between tools without losing the thread of the work or the audit trail.",
      watchout: "Listing many systems without describing how you used them.",
    },
    {
      title: "Availability clarity",
      signal: "Your weekly range and working windows are specific enough to build a real engagement around.",
      watchout: "Saying yes to every workload shape instead of naming the one you actually want.",
    },
  ] satisfies TalentJoinExpectation[],
  rhythm: {
    eyebrow: "First-week shape",
    title: "How a good engagement usually starts",
    summary:
      "Strong placements feel calm in week one. Scope stays tight, expectations stay visible, and no one has to guess where the work lives.",
    rows: [
      {
        label: "Monday",
        value: "Systems access, escalation rules, and success definition",
      },
      {
        label: "Tuesday",
        value: "Initial queue movement with documented decisions",
      },
      {
        label: "Wednesday",
        value: "Spot check on tone, notes, and workflow fit",
      },
      {
        label: "Friday",
        value: "Approved hours plus a concise handoff summary",
      },
    ],
  },
  faqs: [
    {
      question: "Is this only for traditional executive assistants?",
      answer:
        "No. The network spans support, care coordination, operations, admin utility, research, QA, and AI-adjacent review work. The throughline is judgment and follow-through, not a single job title.",
    },
    {
      question: "Do I need to be available full-time?",
      answer:
        "No. Many briefs are scoped around part-time weekly coverage. The better move is to be precise about the rhythm you can genuinely support.",
    },
    {
      question: "What makes someone stand out?",
      answer:
        "Specific workflow ownership, clean communication, credible availability, and proof that you can keep the work reviewable once things get messy.",
    },
    {
      question: "Is there a live application backend here?",
      answer:
        "Not in this route. This page is an editorial join narrative for the isolated marketing surface, designed to show the talent proposition and operating standards.",
    },
  ] satisfies TalentJoinFaq[],
  finalCall: {
    eyebrow: "Join with signal",
    title: "If you already know how to keep important work moving, Autharis should feel familiar.",
    body:
      "Bring the workflows, systems, and communication range you can actually stand behind. The market does not need more generic profiles. It needs operators who make the human layer dependable.",
    primaryLabel: "Back to marketing",
    primaryHref: "/marketing",
    secondaryLabel: "See the brief demo",
    secondaryHref: "/brief",
  },
} as const;
