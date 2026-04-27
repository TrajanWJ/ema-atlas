export type FaqMetric = {
  label: string;
  value: string;
  note: string;
};

export type TrustCommitment = {
  eyebrow: string;
  title: string;
  detail: string;
};

export type ObjectionCard = {
  eyebrow: string;
  objection: string;
  response: string;
  proof: string;
  signals: readonly string[];
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqSection = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  items: readonly FaqItem[];
};

export const faqContent = {
  hero: {
    eyebrow: "Buyer trust rail · Editorial FAQ",
    titleLead: "The questions teams ask before they trust",
    titleEmphasis: "an hourly operator layer",
    titleTrail: "with real workflows.",
    lead:
      "This route answers the buyer-side objections behind every Autharis engagement: who the operators are, how hours stay reviewable, what gets scoped before work starts, and why this is different from both generic marketplaces and full-time hiring.",
    support:
      "Built for the moment when a team already knows the work is real, but still needs proof that the operating model will stay calm, legible, and safe.",
    primaryAction: "Read the objections",
    secondaryAction: "Browse the FAQs",
  },
  metrics: [
    {
      label: "Shortlist window",
      value: "72 hrs",
      note: "Typical window from brief alignment to first credible operator options.",
    },
    {
      label: "Billing model",
      value: "Approved hours",
      note: "Clients review the work before payment moves instead of committing to a vague retainer.",
    },
    {
      label: "Best fit",
      value: "Human-in-loop",
      note: "Used where software can sort the queue but not finish the workflow.",
    },
  ] satisfies FaqMetric[],
  commitments: [
    {
      eyebrow: "01 / Scope before staffing",
      title: "We define the workflow, systems, edge cases, and handoffs before we talk about headcount.",
      detail:
        "Autharis starts with the actual operating lane so the match is anchored in judgment, communication range, and review rhythm instead of a generic role label.",
    },
    {
      eyebrow: "02 / Visibility from hour one",
      title: "The client sees approved hours, notes, escalations, and deliverables in plain language.",
      detail:
        "The goal is not just getting help quickly. The goal is getting help without losing operational clarity once the operator is live.",
    },
    {
      eyebrow: "03 / Narrow, trustworthy starts",
      title: "Most engagements begin as a contained lane with explicit guardrails, not an all-or-nothing staffing leap.",
      detail:
        "That keeps the first week reviewable, protects the internal team, and gives both sides a clear decision point before scope expands.",
    },
  ] satisfies TrustCommitment[],
  objections: [
    {
      eyebrow: "Objection 01",
      objection: "“Why would we use this instead of hiring full-time?”",
      response:
        "Because the pressure is already here. Autharis is built for live queues, launch weeks, coverage gaps, and AI-adjacent workflows that need competent humans now, without forcing a permanent headcount decision before the workflow is even fully understood.",
      proof:
        "The operating model stays hourly, reviewable, and narrow enough to learn quickly before the team decides whether the work should expand, stabilize, or convert.",
      signals: [
        "Good for backlog relief, transitions, and scoped recurring lanes",
        "Avoids rushing into a role definition the team has not pressure-tested yet",
        "Keeps the internal owner in control of scope and approvals",
      ],
    },
    {
      eyebrow: "Objection 02",
      objection: "“How is this different from a freelance marketplace or agency bench?”",
      response:
        "Autharis is opinionated about workflow fit. The match is not just skill keywords or account-manager packaging. We scope around systems, escalation rules, communication tone, approval cadence, and what the operator needs to leave behind for the client team each week.",
      proof:
        "That is why the work is strongest where nuance matters: support operations, care coordination, project follow-through, research, QA, and exception handling around automation.",
      signals: [
        "Workflow-first matching instead of generic category shopping",
        "Designed for operational handoffs, not one-off task dumping",
        "Stronger fit when trust and judgment matter more than sheer volume",
      ],
    },
    {
      eyebrow: "Objection 03",
      objection: "“How do we know the hours are real and the work is actually moving?”",
      response:
        "Autharis is structured around approved time and legible output. Each engagement defines what visible progress means: queue movement, escalation notes, outreach summaries, QA logs, or end-of-day handoffs that the internal owner can actually review.",
      proof:
        "The system is built so the client never has to guess what happened during the week or discover surprise work only when the invoice arrives.",
      signals: [
        "Approved-hours model with explicit review checkpoints",
        "Deliverables and escalation rules set before the engagement begins",
        "Visible trail of work instead of opaque “support” time",
      ],
    },
    {
      eyebrow: "Objection 04",
      objection: "“What if our workflow touches sensitive customers, patients, or AI edge cases?”",
      response:
        "Then the operating guardrails matter even more. Autharis works best when communication boundaries, systems access, escalation triggers, and handoff formats are explicit. The service is not positioned as a reckless plug-in for undefined risk.",
      proof:
        "The strongest use cases are the ones where a capable human layer improves judgment and care without blurring who owns the decision, the escalation path, or the final approval.",
      signals: [
        "Clear owner, escalation ladder, and scope boundaries",
        "Best for well-defined operational responsibility with visible checkpoints",
        "Especially valuable where automation needs monitored exception handling",
      ],
    },
  ] satisfies ObjectionCard[],
  faqSections: [
    {
      id: "fit",
      eyebrow: "01 / Workflow fit",
      title: "When should a team reach for Autharis?",
      summary:
        "The best engagements begin where work is already accumulating and the internal team needs accountable human coverage faster than a hiring cycle can close.",
      items: [
        {
          question: "What kinds of work are the strongest fit?",
          answer:
            "Support operations, care coordination, inbox and outreach follow-through, implementation support, research, QA, and AI exception handling are strong fits because they mix process with judgment.",
        },
        {
          question: "When is Autharis not the right model?",
          answer:
            "If the work is undefined, the owner is unclear, or the team expects an operator to magically absorb risk without guardrails, the engagement should be scoped more carefully before launch.",
        },
        {
          question: "Can this start small?",
          answer:
            "Yes. Most buyer-trust conversations lead to a contained first lane with visible weekly hours, clear review points, and a limited set of deliverables.",
        },
      ],
    },
    {
      id: "operators",
      eyebrow: "02 / Operator quality",
      title: "How does Autharis think about matching and trust?",
      summary:
        "The service is built around operator credibility in context, not generic résumé sorting.",
      items: [
        {
          question: "What does “vetted” actually mean here?",
          answer:
            "It means the shortlist is filtered around communication range, workflow fit, reliability signals, tool familiarity, and the kind of judgment the lane actually needs, not just claimed availability.",
        },
        {
          question: "Do we get a random assignment?",
          answer:
            "No. The model is shortlist-first. The client sees operator options aligned to the brief and the work starts with explicit expectations rather than a blind handoff.",
        },
        {
          question: "Can the same operator continue if the fit is strong?",
          answer:
            "That is the intention when the workflow stabilizes. The early structure exists so continuity feels earned and reviewable instead of accidental.",
        },
      ],
    },
    {
      id: "operations",
      eyebrow: "03 / Operating model",
      title: "How do hours, reviews, and handoffs stay legible?",
      summary:
        "Buyers usually do not need more dashboards. They need a simple way to understand what work was done, where judgment was used, and what still needs attention.",
      items: [
        {
          question: "How are hours reviewed?",
          answer:
            "The engagement defines a review cadence up front, often weekly or twice weekly, with notes tied to queue ownership, deliverables, or resolved exceptions rather than vague activity.",
        },
        {
          question: "What do we actually see during the engagement?",
          answer:
            "That depends on the lane, but typically includes handoff notes, escalation logs, queue summaries, outreach coverage, QA findings, and a clear view of what the operator owned that period.",
        },
        {
          question: "What prevents the work from becoming a black box?",
          answer:
            "Narrow starts, explicit deliverables, and an internal owner who can review the operating trail. Autharis is designed to keep the human layer visible, not to hide it behind account-management language.",
        },
      ],
    },
    {
      id: "risk",
      eyebrow: "04 / Risk and rollout",
      title: "How should a cautious team start?",
      summary:
        "The safest first engagement is the one with clear scope, clear ownership, and a clear definition of what success looks like in the first two weeks.",
      items: [
        {
          question: "Do we need a huge onboarding process before starting?",
          answer:
            "No. The goal is a concise brief that captures systems, communication standards, escalation triggers, and approval expectations without turning setup into its own procurement project.",
        },
        {
          question: "How do we protect tone, quality, or customer trust?",
          answer:
            "By making those protection points part of the scope itself. Tone, escalation judgment, and documentation quality should be named outcomes, not assumed soft skills.",
        },
        {
          question: "What should we prepare before reaching out?",
          answer:
            "Bring the live workflow, the tools involved, the edge cases that currently break automation, and the manager who can approve hours and decide where exceptions go.",
        },
      ],
    },
  ] satisfies FaqSection[],
  closingNotes: [
    "Scope the lane before you scale the coverage.",
    "Treat approvals and handoffs as part of the product, not afterthoughts.",
    "Start with the real queue, not a sanitized job description.",
  ],
} as const;
