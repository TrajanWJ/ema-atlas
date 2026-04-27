import {
  MATCH_BREAKDOWN_MAX,
  getCategoryLabel,
  getClientJobRequest,
  getRankedTalent,
  type ClientSkill,
  type ClientJobRequest,
  type ClientTalent,
} from '@/lib/client/data';

export type ClientMatchLabTone = 'accent' | 'positive' | 'muted';

export type ClientMatchLabSignal = {
  label: string;
  value: string;
  note: string;
  tone: ClientMatchLabTone;
};

export type ClientMatchLabNote = {
  label: string;
  detail: string;
};

export type ClientMatchLabStep = {
  label: string;
  detail: string;
};

export type ClientMatchLabCandidate = {
  talent: ClientTalent;
  headline: string;
  confidence: string;
  recommendation: string;
  availabilityStart: string;
  teamNote: string;
  signalCards: ClientMatchLabSignal[];
  proofPoints: ClientMatchLabNote[];
  watchouts: string[];
  interviewPrompts: string[];
  launchPlan: ClientMatchLabStep[];
};

export type ClientMatchLabAxisValue = {
  score: number;
  note: string;
};

export type ClientMatchLabAxis = {
  label: string;
  max: number;
  values: Record<string, ClientMatchLabAxisValue>;
};

export type ClientMatchLabData = {
  job: ClientJobRequest;
  requestSummary: {
    categoryLabel: string;
    weeklyBudget: string;
    targetHours: string;
    shortlistNote: string;
  };
  candidates: ClientMatchLabCandidate[];
  axes: ClientMatchLabAxis[];
  focusTalentId: string;
  compareTalentId: string;
};

const DEFAULT_JOB_ID = 'jr-002';

type CandidateBlueprint = Omit<ClientMatchLabCandidate, 'signalCards' | 'talent'>;

const CANDIDATE_BLUEPRINTS: Record<string, CandidateBlueprint> = {
  't-001': {
    headline: 'Operationally steady and empathetic, with the cleanest handoff habits in the pack.',
    confidence: 'High confidence for process-heavy queues.',
    recommendation: 'Best if the client wants judgment, follow-through, and calmer queue management over deep AI QA specialization.',
    availabilityStart: 'Can start this week with a shadow shift.',
    teamNote: 'Feels like the safest generalist if the scope widens beyond pure support QA.',
    proofPoints: [
      { label: 'Queue reliability', detail: 'Used to triage-heavy operating rhythms and documented escalation paths.' },
      { label: 'Cross-functional calm', detail: 'Bio and skills point to structured handoffs across teams, not just solo task completion.' },
      { label: 'Healthcare + SaaS blend', detail: 'Has context switching experience, useful if the workflow becomes more regulated.' },
    ],
    watchouts: [
      'Not the deepest listed Zendesk specialist in the set.',
      'Will likely ask for a clear rubric before moving fast on AI edge cases.',
    ],
    interviewPrompts: [
      'How would you separate tone edits from factual-risk escalations in a live queue?',
      'What is your QA routine when the playbook is incomplete or contradictory?',
      'Which metrics would you send a client after week one to prove coverage quality?',
    ],
    launchPlan: [
      { label: 'Day 1', detail: 'Shadow 20 reviewed replies and annotate escalation reasons in the existing rubric.' },
      { label: 'Day 3', detail: 'Own the overflow queue with one daily calibration pass from the client lead.' },
      { label: 'Week 2', detail: 'Document recurring failure modes and propose playbook changes.' },
    ],
  },
  't-002': {
    headline: 'The sharpest service-operator blend: polished customer judgment with hands-on AI review context.',
    confidence: 'High confidence for client-facing tone calibration.',
    recommendation: 'Strong alternate when brand voice and support empathy matter as much as technical QA coverage.',
    availabilityStart: 'Could ramp after a single calibration session.',
    teamNote: 'Closest thing to a “safe yes” if the client worries about customer experience drift.',
    proofPoints: [
      { label: 'Support fluency', detail: 'Strong listed tooling overlap with Zendesk and Intercom plus prior B2B support context.' },
      { label: 'Tone judgment', detail: 'Bio suggests experience balancing customer outcome, speed, and escalation risk.' },
      { label: 'AI review adjacency', detail: 'Already pairs QA review with LLM output oversight.' },
    ],
    watchouts: [
      'Slightly less specialized than Jakob on RAG-eval style work.',
      'Timezone may require explicit overlap expectations if the team wants same-day feedback loops.',
    ],
    interviewPrompts: [
      'Walk through a support reply that sounds polished but is still unsafe to send.',
      'How do you prevent calibration drift when multiple reviewers touch the same queue?',
      'What would you automate, and what would you never automate, in this workflow?',
    ],
    launchPlan: [
      { label: 'Day 1', detail: 'Review the QA rubric, then co-score ten historical replies with the client lead.' },
      { label: 'Day 4', detail: 'Take first-pass review on low-risk tickets while maintaining an exceptions log.' },
      { label: 'Week 2', detail: 'Own weekly tone trends report and suggest prompt fixes for repeat issues.' },
    ],
  },
  't-003': {
    headline: 'Methodical synthesizer with strong brief-writing instincts and disciplined weekly cadence.',
    confidence: 'Moderate confidence for rubric-first workflows.',
    recommendation: 'Useful when the client needs reporting quality and research rigor more than live support fluency.',
    availabilityStart: 'Available after a narrower pilot scope is defined.',
    teamNote: 'Best framed as an analyst reviewer rather than a frontline support operator.',
    proofPoints: [
      { label: 'Research structure', detail: 'Strong fit for taxonomy clean-up, trend tracking, and recurring reporting.' },
      { label: 'Project control', detail: 'Comfortable managing repeatable work against a fixed template.' },
      { label: 'Written synthesis', detail: 'Likely to surface crisp summaries for weekly client check-ins.' },
    ],
    watchouts: [
      'No direct Zendesk skill listed, so tooling ramp could take longer.',
      'Availability is thinner relative to the ask if the queue spikes.',
    ],
    interviewPrompts: [
      'How would you turn messy reviewer notes into a repeatable scoring rubric?',
      'What makes a weekly QA report useful to a busy support lead?',
      'Describe a time you improved quality without slowing the team down.',
    ],
    launchPlan: [
      { label: 'Day 1', detail: 'Audit recent QA outputs and rewrite the scoring taxonomy for consistency.' },
      { label: 'Day 5', detail: 'Pilot a smaller review batch with heavy reporting ownership.' },
      { label: 'Week 2', detail: 'Package recurring trends into a brief for the client lead and ops manager.' },
    ],
  },
  't-004': {
    headline: 'Most specialized for the live brief: deep AI-support QA instincts with the clearest technical edge.',
    confidence: 'Highest confidence for a tight AI support review scope.',
    recommendation: 'Preferred top pick when the client wants immediate QA depth and credible edge-case handling.',
    availabilityStart: 'Ready for a guided launch this week.',
    teamNote: 'This is the specialist profile. Less generalist polish, more sharpness where the request needs it.',
    proofPoints: [
      { label: 'Direct skills match', detail: 'The cleanest overlap on LLM output review, QA review, and evaluation work.' },
      { label: 'Technical edge', detail: 'RAG-eval background suggests comfort with ambiguous failures and rubric tuning.' },
      { label: 'Client-proof reporting', detail: 'Bio emphasizes precise rubrics, written clarity, and reliable follow-through.' },
    ],
    watchouts: [
      'Availability is tighter, so the workload needs a bounded weekly queue.',
      'Premium rate may need explicit budget sign-off if the client wants future hours expansion.',
    ],
    interviewPrompts: [
      'Show how you would review a hallucinated but well-written support response.',
      'Which edge cases should be auto-escalated instead of simply rewritten?',
      'What would your week-one QA dashboard include for this client?',
    ],
    launchPlan: [
      { label: 'Day 1', detail: 'Run a live calibration on historical AI replies and tune the rubric with the client lead.' },
      { label: 'Day 3', detail: 'Own high-risk edge cases while documenting rubric deltas in plain language.' },
      { label: 'Week 2', detail: 'Ship a recurring issue bank with examples, escalation patterns, and prompt recommendations.' },
    ],
  },
  't-005': {
    headline: 'Calendar-and-comms operator who adds executive steadiness but only partial overlap with the brief.',
    confidence: 'Lower confidence unless the scope broadens toward admin support.',
    recommendation: 'Useful bench option only if the client starts blending founder support with inbox operations.',
    availabilityStart: 'Can start fast, but would need scope reframe.',
    teamNote: 'Strong operator, wrong first brief.',
    proofPoints: [
      { label: 'High availability', detail: 'Could absorb more weekly volume than most of the shortlist.' },
      { label: 'Founder support pattern', detail: 'Strong at async coordination and operational tidiness.' },
      { label: 'Budget room', detail: 'Sits cleanly inside most admin-support bands.' },
    ],
    watchouts: [
      'Little direct evidence of AI-support QA work.',
      'Industry knowledge is solid for fintech but not a natural fit for this AI workflow.',
    ],
    interviewPrompts: [
      'How would you learn a support QA rubric from scratch in two business days?',
      'Which parts of this brief feel most transferable from executive support work?',
      'How do you stay accurate when reviewing high-volume repetitive tasks?',
    ],
    launchPlan: [
      { label: 'Day 1', detail: 'Complete tooling orientation and shadow the queue with scripted examples.' },
      { label: 'Day 4', detail: 'Handle tagged low-risk tickets with a heavy review gate.' },
      { label: 'Week 2', detail: 'Take on adjacent admin work while the client evaluates QA fit.' },
    ],
  },
  't-006': {
    headline: 'Fast outbound operator with energy and volume tolerance, but only light relevance to the core request.',
    confidence: 'Low confidence for this specific lab brief.',
    recommendation: 'Bench only. Better reserved for outreach-heavy requests instead of support QA.',
    availabilityStart: 'Available, though the role alignment is weak.',
    teamNote: 'Good teammate for other lanes, not this match decision.',
    proofPoints: [
      { label: 'Throughput capacity', detail: 'Comfortable with repetitive process motion and fast pacing.' },
      { label: 'Cost efficiency', detail: 'Below the typical budget band for many client-support requests.' },
      { label: 'Commercial energy', detail: 'Could be relevant if the brief shifts toward lead qualification.' },
    ],
    watchouts: [
      'No direct support QA or Zendesk depth in the listed skills.',
      'Would require the heaviest training and the most constrained initial scope.',
    ],
    interviewPrompts: [
      'What is your method for following a strict review rubric with no improvisation?',
      'How do you know when a customer issue should be escalated instead of handled inline?',
      'Which parts of support-quality work feel most adjacent to outbound qualification?',
    ],
    launchPlan: [
      { label: 'Day 1', detail: 'Observe support QA workflow and study the escalation taxonomy.' },
      { label: 'Day 5', detail: 'Pilot only the simplest queue slice with full oversight.' },
      { label: 'Week 2', detail: 'Reassess whether the work should be reshaped around outbound support tasks.' },
    ],
  },
};

export function getDefaultClientMatchLabJobId() {
  return DEFAULT_JOB_ID;
}

export function getClientMatchLab(jobId: string = DEFAULT_JOB_ID): ClientMatchLabData {
  const job = getClientJobRequest(jobId);
  const candidates = getRankedTalent()
    .slice(0, 4)
    .map((talent) => buildCandidate(job, talent));

  const focusTalentId = candidates[0]?.talent.id ?? '';
  const compareTalentId = candidates.find((candidate) => candidate.talent.id !== focusTalentId)?.talent.id ?? focusTalentId;

  return {
    job,
    requestSummary: {
      categoryLabel: getCategoryLabel(job.category),
      weeklyBudget: `$${job.budget[0]}-${job.budget[1]}/hr`,
      targetHours: `${job.hoursPerWeek} hrs/week`,
      shortlistNote: `${candidates.length} ranked profiles tuned for ${job.industry} workflows.`,
    },
    candidates,
    axes: buildAxes(job, candidates),
    focusTalentId,
    compareTalentId,
  };
}

function buildCandidate(job: ClientJobRequest, talent: ClientTalent): ClientMatchLabCandidate {
  const blueprint = CANDIDATE_BLUEPRINTS[talent.id] ?? buildFallbackBlueprint(talent);

  return {
    ...blueprint,
    talent,
    signalCards: buildSignalCards(job, talent),
  };
}

function buildFallbackBlueprint(talent: ClientTalent): CandidateBlueprint {
  return {
    headline: `${talent.title} with adaptable support instincts and a practical execution style.`,
    confidence: 'Moderate confidence pending live calibration.',
    recommendation: 'Worth a scoped pilot if the higher-ranked options do not move forward.',
    availabilityStart: 'Could start after brief alignment.',
    teamNote: 'Keep in reserve for follow-up comparison.',
    proofPoints: [{ label: 'General fit', detail: 'Brings adjacent experience that could transfer into a structured workflow.' }],
    watchouts: ['Needs deeper calibration against the exact brief.'],
    interviewPrompts: ['What would you need to feel confident taking this queue live in week one?'],
    launchPlan: [
      { label: 'Day 1', detail: 'Complete a guided calibration pass on sample work.' },
      { label: 'Week 1', detail: 'Take a narrow queue segment with explicit reviewer feedback.' },
    ],
  };
}

function buildSignalCards(job: ClientJobRequest, talent: ClientTalent): ClientMatchLabSignal[] {
  const matchingSkills = getMatchingSkills(job, talent);
  const weeklyRunRate = talent.rate * job.hoursPerWeek;
  const budgetDelta = job.budget[1] - talent.rate;

  return [
    {
      label: 'Fit score',
      value: `${talent.score}`,
      note: talent.score >= 90 ? 'Ready for decision-room review.' : 'Strong enough to compare live.',
      tone: talent.score >= 90 ? 'accent' : 'positive',
    },
    {
      label: 'Weekly run-rate',
      value: formatCurrency(weeklyRunRate),
      note: `Based on ${job.hoursPerWeek} hrs/week.`,
      tone: 'muted',
    },
    {
      label: 'Skill overlap',
      value: `${matchingSkills.length}/${job.skills.length}`,
      note: matchingSkills.length > 0 ? matchingSkills.join(', ') : 'Adjacent skills, but not direct listed overlap.',
      tone: matchingSkills.length >= Math.max(1, Math.ceil(job.skills.length / 2)) ? 'positive' : 'muted',
    },
    {
      label: 'Rate cushion',
      value: budgetDelta >= 0 ? `${formatCurrency(budgetDelta)}/hr` : `+${formatCurrency(Math.abs(budgetDelta))}/hr`,
      note: budgetDelta >= 0 ? 'Inside the upper budget band.' : 'Needs explicit budget approval.',
      tone: budgetDelta >= 0 ? 'positive' : 'accent',
    },
  ];
}

function buildAxes(job: ClientJobRequest, candidates: ClientMatchLabCandidate[]): ClientMatchLabAxis[] {
  return Object.entries(MATCH_BREAKDOWN_MAX).map(([label, max]) => ({
    label,
    max,
    values: Object.fromEntries(
      candidates.map((candidate) => [
        candidate.talent.id,
        {
          score: candidate.talent.breakdown[label] ?? 0,
          note: describeAxis(label, job, candidate.talent),
        },
      ]),
    ),
  }));
}

function describeAxis(label: string, job: ClientJobRequest, talent: ClientTalent) {
  const matchingSkills = getMatchingSkills(job, talent);
  const availabilityHours = getAvailabilityHours(talent.availability);
  const budgetDelta = job.budget[1] - talent.rate;

  if (label === 'Work category') {
    return talent.categories.includes(job.category)
      ? `Direct overlap with ${getCategoryLabel(job.category)}.`
      : `Adjacent operator fit around ${getCategoryLabel(job.category)} workflows.`;
  }

  if (label === 'Skill overlap') {
    return matchingSkills.length > 0
      ? `Direct overlap on ${matchingSkills.join(', ')}.`
      : 'Leans on adjacent skills instead of exact listed overlap.';
  }

  if (label === 'Availability') {
    return `${talent.availability} against a ${job.hoursPerWeek} hr/week target.`;
  }

  if (label === 'Rate fit') {
    if (budgetDelta >= 0 && talent.rate >= job.budget[0]) {
      return `Inside band at ${formatCurrency(talent.rate)}/hr.`;
    }

    if (budgetDelta >= 0) {
      return `Below band at ${formatCurrency(talent.rate)}/hr, leaving room for expansion.`;
    }

    return `${formatCurrency(Math.abs(budgetDelta))}/hr above the current upper band.`;
  }

  if (label === 'Timezone') {
    return `${getTimezoneNarrative(job.timezone, talent.timezone)} Available ${availabilityHours} hrs weekly.`;
  }

  if (label === 'Industry familiarity') {
    return talent.industries.includes(job.industry)
      ? `Has direct ${job.industry} context.`
      : `Brings transfer from ${talent.industries.join(' and ')}.`;
  }

  return 'Relevant to the brief.';
}

function getMatchingSkills(job: ClientJobRequest, talent: ClientTalent): ClientSkill[] {
  return job.skills.filter((skill) => talent.skills.includes(skill));
}

function getAvailabilityHours(availability: string) {
  const match = availability.match(/\d+/);

  return match ? Number(match[0]) : 0;
}

function getTimezoneNarrative(jobTimezone: string, talentTimezone: string) {
  if (jobTimezone === 'Any') {
    return 'Timezone is flexible for this brief.';
  }

  if (jobTimezone === talentTimezone) {
    return `Direct overlap with the requested ${jobTimezone} coverage.`;
  }

  return `Needs planned overlap because the brief targets ${jobTimezone} and the talent is ${talentTimezone}.`;
}

function formatCurrency(value: number) {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}
