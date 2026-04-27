import {
  CLIENT_CATEGORIES,
  CLIENT_TALENT,
  type ClientCategoryId,
  type ClientSkill,
  type ClientTalent,
  getCategoryLabel,
} from '@/lib/client/data';

export type RequestLabUrgency = 'Within 48 hours' | 'This week' | 'Flexible';
export type RequestLabTimezone = 'Any' | 'ET or CT' | 'GMT +/- 3' | 'Europe-friendly';

export type RequestLabDraft = {
  client: string;
  title: string;
  category: ClientCategoryId;
  description: string;
  outcome: string;
  hoursPerWeek: number;
  duration: string;
  timezone: RequestLabTimezone;
  urgency: RequestLabUrgency;
  budget: [number, number];
  mustHave: ClientSkill[];
  niceToHave: ClientSkill[];
  industry: string;
  teamNotes: string;
};

export type RequestLabTemplate = {
  id: string;
  label: string;
  blurb: string;
  draft: RequestLabDraft;
};

export type RequestLabScoreLine = {
  label: string;
  value: number;
  max: number;
};

export type RequestLabCandidate = {
  talent: ClientTalent;
  score: number;
  scoreLines: RequestLabScoreLine[];
  matchedSkills: ClientSkill[];
  missingSkills: ClientSkill[];
  watchouts: string[];
  summary: string;
};

export type RequestLabSignal = {
  label: string;
  value: string;
  tone: 'positive' | 'neutral' | 'warning';
  detail: string;
};

export type RequestLabChecklistItem = {
  label: string;
  complete: boolean;
  detail: string;
};

const INDUSTRIES = ['Healthcare', 'SaaS', 'Fintech', 'Consumer', 'AI', 'Developer Tools', 'No preference'] as const;

export const REQUEST_LAB_INDUSTRIES = INDUSTRIES;

export const REQUEST_LAB_TIMEZONES: RequestLabTimezone[] = ['Any', 'ET or CT', 'GMT +/- 3', 'Europe-friendly'];

export const REQUEST_LAB_URGENCY: RequestLabUrgency[] = ['Within 48 hours', 'This week', 'Flexible'];

export const REQUEST_LAB_DEFAULT_DRAFT: RequestLabDraft = {
  client: 'Cedar Health Co-op',
  title: 'Care navigator - after-hours overflow',
  category: 'care',
  description:
    'Own the evening intake queue, respond to inbound referral requests, schedule consults, and escalate urgent edge cases to the clinical lead before the next business day.',
  outcome:
    'By week two, the queue should close nightly with same-day triage notes, clean handoffs, and no unresolved referrals rolling into the morning team.',
  hoursPerWeek: 18,
  duration: '3 months',
  timezone: 'GMT +/- 3',
  urgency: 'Within 48 hours',
  budget: [42, 58],
  mustHave: ['Care Coordination', 'Intake', 'Project Coordination'],
  niceToHave: ['QA Review', 'Notion'],
  industry: 'Healthcare',
  teamNotes: 'Coverage is heaviest Tuesday through Friday, 4pm-9pm ET. Warm tone and reliable documentation matter more than heavy clinical context.',
};

export const REQUEST_LAB_TEMPLATES: RequestLabTemplate[] = [
  {
    id: 'care-overflow',
    label: 'After-hours intake',
    blurb: 'Evening queue coverage with fast triage and careful handoffs.',
    draft: REQUEST_LAB_DEFAULT_DRAFT,
  },
  {
    id: 'ai-qa',
    label: 'AI support QA',
    blurb: 'Review AI-assisted support replies before send.',
    draft: {
      client: 'Lumen AI',
      title: 'AI support review lead - overflow QA',
      category: 'ai',
      description:
        'Review AI-drafted support replies for tone, accuracy, policy compliance, and escalation quality before customer send. Keep a weekly exception log with examples.',
      outcome:
        'By the first Friday, the team should have a reliable QA rubric, faster turnaround on flagged replies, and a clear list of repeat failure modes.',
      hoursPerWeek: 15,
      duration: 'Ongoing',
      timezone: 'Europe-friendly',
      urgency: 'This week',
      budget: [48, 68],
      mustHave: ['LLM Output Review', 'QA Review', 'Zendesk'],
      niceToHave: ['RAG Evals', 'Annotation', 'Intercom'],
      industry: 'AI',
      teamNotes: 'The support lead wants concise daily notes and two hours of overlap with CET.',
    },
  },
  {
    id: 'founder-ops',
    label: 'Founder coverage',
    blurb: 'Executive support with inbox, calendar, and travel ownership.',
    draft: {
      client: 'Ladder Fintech',
      title: 'Executive assistant - founder coverage',
      category: 'admin',
      description:
        'Run calendar triage, travel, meeting prep, and inbox cleanup for a busy founder who needs stronger weekly operating rhythm and clean follow-through.',
      outcome:
        'Within ten business days, travel and calendar chaos should be under control and the founder should have a reliable prep packet ahead of every investor and leadership meeting.',
      hoursPerWeek: 20,
      duration: 'Ongoing',
      timezone: 'ET or CT',
      urgency: 'Flexible',
      budget: [38, 52],
      mustHave: ['Calendar Mgmt', 'Email Triage', 'Travel Coordination'],
      niceToHave: ['Project Coordination', 'Invoice Admin'],
      industry: 'Fintech',
      teamNotes: 'Needs someone comfortable protecting focus blocks and nudging stakeholders for missing materials.',
    },
  },
];

export function getRequestLabShortlist(draft: RequestLabDraft): RequestLabCandidate[] {
  return CLIENT_TALENT.map((talent) => {
    const scoreLines = buildScoreLines(talent, draft);
    const matchedSkills = draft.mustHave.filter((skill) => talent.skills.includes(skill));
    const missingSkills = draft.mustHave.filter((skill) => !talent.skills.includes(skill));
    const watchouts = buildWatchouts(talent, draft, missingSkills);

    return {
      talent,
      score: scoreLines.reduce((total, line) => total + line.value, 0),
      scoreLines,
      matchedSkills,
      missingSkills,
      watchouts,
      summary: buildSummary(talent, draft, matchedSkills),
    };
  }).sort((left, right) => right.score - left.score);
}

export function getRequestLabSignals(draft: RequestLabDraft) {
  const shortlist = getRequestLabShortlist(draft);
  const top = shortlist[0];
  const readyNow = shortlist.filter((candidate) => candidate.talent.status === 'Active').length;
  const strongBudgetFit = shortlist.filter((candidate) => candidate.scoreLines.find((line) => line.label === 'Budget fit')?.value === 18).length;

  return [
    {
      label: 'Top score',
      value: top ? `${top.score}/100` : 'No matches',
      tone: top && top.score >= 78 ? 'positive' : top && top.score >= 64 ? 'neutral' : 'warning',
      detail: top ? `${top.talent.name} leads for ${getCategoryLabel(draft.category).toLowerCase()}.` : 'Adjust the request to improve fit.',
    },
    {
      label: 'Ready now',
      value: `${readyNow} active profiles`,
      tone: readyNow >= 4 ? 'positive' : readyNow >= 2 ? 'neutral' : 'warning',
      detail: draft.urgency === 'Within 48 hours' ? 'Urgent briefs benefit from already-active talent.' : 'You have enough active bench depth for this request.',
    },
    {
      label: 'Budget reach',
      value: `${strongBudgetFit} clear fits`,
      tone: strongBudgetFit >= 3 ? 'positive' : strongBudgetFit >= 2 ? 'neutral' : 'warning',
      detail: `Current band is $${draft.budget[0]}-$${draft.budget[1]}/hr.`,
    },
  ] satisfies RequestLabSignal[];
}

export function getRequestLabChecklist(draft: RequestLabDraft): RequestLabChecklistItem[] {
  return [
    {
      label: 'Clear title and scope',
      complete: draft.title.trim().length >= 12 && draft.description.trim().length >= 100,
      detail: 'Title and brief should make the daily ownership obvious.',
    },
    {
      label: 'Must-have skills selected',
      complete: draft.mustHave.length >= 2,
      detail: 'At least two concrete skills sharpen the shortlist.',
    },
    {
      label: 'Budget and hours aligned',
      complete: draft.budget[0] > 0 && draft.budget[1] >= draft.budget[0] && draft.hoursPerWeek >= 5,
      detail: 'Set a realistic weekly load and rate band.',
    },
    {
      label: 'Outcome and handoff notes',
      complete: draft.outcome.trim().length >= 60 && draft.teamNotes.trim().length >= 40,
      detail: 'Strong launch notes reduce false-positive matches.',
    },
  ];
}

export function getRequestLabNarrative(draft: RequestLabDraft) {
  return `${draft.client} needs ${draft.title || 'a new operator'} for ${draft.hoursPerWeek} hours per week over ${
    draft.duration
  }. Prioritize ${draft.mustHave.slice(0, 3).join(', ')} with ${draft.industry === 'No preference' ? 'no industry preference' : draft.industry} context and ${draft.timezone.toLowerCase()} coverage.`;
}

export function getRequestLabCategories() {
  return CLIENT_CATEGORIES;
}

function buildScoreLines(talent: ClientTalent, draft: RequestLabDraft): RequestLabScoreLine[] {
  const categoryFit = talent.categories.includes(draft.category) ? 28 : 10;
  const mustHaveHits = draft.mustHave.filter((skill) => talent.skills.includes(skill)).length;
  const niceToHaveHits = draft.niceToHave.filter((skill) => talent.skills.includes(skill)).length;
  const skillFit = Math.min(28, mustHaveHits * 9 + niceToHaveHits * 3);
  const availabilityHours = getAvailabilityHours(talent.availability);
  const availabilityFit = availabilityHours >= draft.hoursPerWeek ? 16 : availabilityHours >= Math.floor(draft.hoursPerWeek * 0.7) ? 11 : 6;
  const budgetFit = talent.rate >= draft.budget[0] && talent.rate <= draft.budget[1] ? 18 : talent.rate <= draft.budget[1] + 5 ? 12 : 6;
  const timezoneFit = scoreTimezone(draft.timezone, talent.timezone);
  const industryFit =
    draft.industry === 'No preference' ? 8 : talent.industries.includes(draft.industry) ? 8 : talent.industries.some((industry) => industry === 'AI' || industry === 'SaaS') ? 5 : 3;

  return [
    { label: 'Category fit', value: categoryFit, max: 28 },
    { label: 'Skill fit', value: skillFit, max: 28 },
    { label: 'Availability', value: availabilityFit, max: 16 },
    { label: 'Budget fit', value: budgetFit, max: 18 },
    { label: 'Timezone fit', value: timezoneFit, max: 10 },
    { label: 'Industry fit', value: industryFit, max: 8 },
  ];
}

function buildSummary(talent: ClientTalent, draft: RequestLabDraft, matchedSkills: string[]) {
  const skillsLine =
    matchedSkills.length > 0 ? `Hits ${matchedSkills.slice(0, 3).join(', ')}.` : 'Needs deeper skill validation before outreach.';

  return `${talent.name} is a ${talent.title.toLowerCase()} with ${talent.availability.toLowerCase()} availability. ${skillsLine}`;
}

function buildWatchouts(talent: ClientTalent, draft: RequestLabDraft, missingSkills: string[]) {
  const watchouts: string[] = [];

  if (missingSkills.length > 0) {
    watchouts.push(`Missing ${missingSkills.slice(0, 2).join(' and ')} from the must-have stack.`);
  }

  if (talent.rate > draft.budget[1]) {
    watchouts.push(`Rate is above the target band at $${talent.rate}/hr.`);
  }

  if (getAvailabilityHours(talent.availability) < draft.hoursPerWeek) {
    watchouts.push(`Availability may be light for ${draft.hoursPerWeek} hours per week.`);
  }

  if (draft.urgency === 'Within 48 hours' && talent.status !== 'Active') {
    watchouts.push('Currently pending, so immediate start may be slower.');
  }

  return watchouts.length > 0 ? watchouts : ['No obvious watchouts for the current brief.'];
}

function getAvailabilityHours(availability: string) {
  const match = availability.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function scoreTimezone(preference: RequestLabTimezone, timezone: string) {
  if (preference === 'Any') {
    return 10;
  }

  if (preference === 'ET or CT') {
    return timezone === 'ET' || timezone === 'CT' ? 10 : timezone === 'ART' ? 7 : 4;
  }

  if (preference === 'GMT +/- 3') {
    return timezone === 'GMT' || timezone === 'CET' ? 10 : timezone === 'IST' ? 6 : 4;
  }

  return timezone === 'CET' || timezone === 'GMT' ? 10 : timezone === 'IST' ? 7 : 5;
}
