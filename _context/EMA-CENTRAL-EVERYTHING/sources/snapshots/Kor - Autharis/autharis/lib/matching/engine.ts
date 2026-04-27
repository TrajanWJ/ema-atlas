import {
  MATCH_FACTOR_ORDER,
  type MatchBreakdownItem,
  type MatchFactorKey,
  type MatchScoreResult,
  type MatchingRequest,
  type MatchingTalent,
  type RankedMatch,
} from '@/lib/matching/types';

const MATCH_FACTOR_MAX: Record<MatchFactorKey, number> = {
  'Work category': 30,
  'Skill overlap': 30,
  Availability: 15,
  'Rate fit': 10,
  Timezone: 10,
  'Industry familiarity': 5,
};

const CATEGORY_LABELS: Record<string, string> = {
  admin: 'Administrative Support',
  ai: 'AI Review and Ops',
  care: 'Care Coordination',
  cx: 'Customer Support',
  ops: 'Operations Support',
  rsrch: 'Research and Project',
  sales: 'Sales and Outreach',
};

const CATEGORY_AFFINITY: Record<string, Partial<Record<string, number>>> = {
  admin: { admin: 1, ops: 0.68, cx: 0.34 },
  ai: { ai: 1, cx: 0.74, rsrch: 0.4, ops: 0.18 },
  care: { care: 1, ops: 0.78, cx: 0.46, admin: 0.24 },
  cx: { cx: 1, ai: 0.74, care: 0.46, sales: 0.32, admin: 0.28 },
  ops: { ops: 1, care: 0.78, admin: 0.68, rsrch: 0.42, cx: 0.34 },
  rsrch: { rsrch: 1, ops: 0.42, ai: 0.4 },
  sales: { sales: 1, cx: 0.32, admin: 0.22 },
};

const INDUSTRY_RELATIONSHIPS: Record<string, string[]> = {
  ai: ['developer tools', 'saas'],
  fintech: ['saas', 'consumer'],
  healthcare: ['operations-heavy services', 'saas'],
  consumer: ['saas'],
  saas: ['developer tools', 'consumer', 'fintech', 'ai'],
};

const TIMEZONE_OFFSETS: Record<string, number> = {
  ART: -3,
  CET: 1,
  CT: -5,
  ET: -4,
  GMT: 0,
  IST: 5.5,
  PST: -7,
  UTC: 0,
};

type TimezonePreference =
  | { kind: 'any' }
  | { kind: 'range'; min: number; max: number }
  | { kind: 'fixed'; offset: number; tolerance: number };

export function score(request: MatchingRequest, talent: MatchingTalent): MatchScoreResult {
  const categoryScore = scoreCategory(request, talent);
  const skillScore = scoreSkillOverlap(request, talent);
  const availabilityScore = scoreAvailability(request, talent);
  const rateScore = scoreRateFit(request, talent);
  const timezoneScore = scoreTimezone(request, talent);
  const industryScore = scoreIndustry(request, talent);

  const breakdown: MatchBreakdownItem[] = MATCH_FACTOR_ORDER.map((key) => {
    switch (key) {
      case 'Work category':
        return categoryScore;
      case 'Skill overlap':
        return skillScore.item;
      case 'Availability':
        return availabilityScore;
      case 'Rate fit':
        return rateScore;
      case 'Timezone':
        return timezoneScore;
      case 'Industry familiarity':
        return industryScore;
      default:
        return neverFactor(key);
    }
  });

  const total = breakdown.reduce((sum, item) => sum + item.score, 0);
  const strengths = buildStrengths(breakdown, skillScore.matchedSkills, talent);
  const watchouts = buildWatchouts(
    request,
    talent,
    breakdown,
    skillScore.missingSkills,
    availabilityScore,
    rateScore,
    timezoneScore,
  );

  return {
    total,
    breakdown,
    matchedSkills: skillScore.matchedSkills,
    missingSkills: skillScore.missingSkills,
    strengths,
    watchouts,
    summary: buildSummary(request, talent, total, breakdown, skillScore.matchedSkills),
    confidence: total >= 85 ? 'High' : total >= 70 ? 'Medium' : 'Low',
  };
}

export function rankMatches(
  request: MatchingRequest,
  talentPool: MatchingTalent[],
  limit: number = 5,
): RankedMatch[] {
  const resolvedLimit = clamp(limit, 1, 20);

  return talentPool
    .map((talent) => ({ talent, score: score(request, talent) }))
    .sort((left, right) => compareRankedMatches(left, right))
    .slice(0, resolvedLimit)
    .map((candidate, index) => ({
      rank: index + 1,
      talent: candidate.talent,
      score: candidate.score,
    }));
}

function compareRankedMatches(
  left: { talent: MatchingTalent; score: MatchScoreResult },
  right: { talent: MatchingTalent; score: MatchScoreResult },
) {
  const comparisons = [
    right.score.total - left.score.total,
    right.score.matchedSkills.length - left.score.matchedSkills.length,
    getBreakdownScore(right.score.breakdown, 'Work category') - getBreakdownScore(left.score.breakdown, 'Work category'),
    getBreakdownScore(right.score.breakdown, 'Skill overlap') - getBreakdownScore(left.score.breakdown, 'Skill overlap'),
    left.talent.rate - right.talent.rate,
    right.talent.yearsExp - left.talent.yearsExp,
    left.talent.name.localeCompare(right.talent.name),
  ];

  return comparisons.find((value) => value !== 0) ?? 0;
}

function scoreCategory(request: MatchingRequest, talent: MatchingTalent): MatchBreakdownItem {
  const requestCategory = normalizeToken(request.category);
  const bestCategory = talent.categories.reduce(
    (best, category) => {
      const normalizedCategory = normalizeToken(category);
      const affinity =
        CATEGORY_AFFINITY[requestCategory]?.[normalizedCategory] ??
        CATEGORY_AFFINITY[normalizedCategory]?.[requestCategory] ??
        0;

      if (affinity > best.affinity) {
        return { affinity, category };
      }

      return best;
    },
    { affinity: 0, category: talent.categories[0] ?? request.category },
  );

  const label = CATEGORY_LABELS[requestCategory] ?? request.category;
  const matchedLabel =
    CATEGORY_LABELS[normalizeToken(bestCategory.category)] ?? bestCategory.category;

  return createBreakdownItem(
    'Work category',
    bestCategory.affinity,
    bestCategory.affinity >= 0.99
      ? `Exact category fit for ${label}.`
      : bestCategory.affinity > 0
        ? `Adjacent strength via ${matchedLabel}.`
        : `No direct category overlap for ${label}.`,
  );
}

function scoreSkillOverlap(
  request: MatchingRequest,
  talent: MatchingTalent,
): {
  item: MatchBreakdownItem;
  matchedSkills: string[];
  missingSkills: string[];
} {
  const requiredSkills = uniqueStrings(request.skills);
  const normalizedTalentSkills = new Set(talent.skills.map(normalizeToken));
  const matchedSkills = requiredSkills.filter((skill) =>
    normalizedTalentSkills.has(normalizeToken(skill)),
  );
  const missingSkills = requiredSkills.filter((skill) => !matchedSkills.includes(skill));

  const ratio = requiredSkills.length === 0 ? 1 : matchedSkills.length / requiredSkills.length;
  const coverage = matchedSkills.length === requiredSkills.length && requiredSkills.length > 0 ? 1 : ratio;

  return {
    item: createBreakdownItem(
      'Skill overlap',
      coverage,
      requiredSkills.length === 0
        ? 'No hard skill requirements were supplied.'
        : `Matched ${matchedSkills.length} of ${requiredSkills.length} requested skills.`,
    ),
    matchedSkills,
    missingSkills,
  };
}

function scoreAvailability(request: MatchingRequest, talent: MatchingTalent): MatchBreakdownItem {
  const availableHours = parseWeeklyHours(talent.availability);

  if (availableHours == null) {
    return createBreakdownItem(
      'Availability',
      0.55,
      'Availability text could not be normalized, so a neutral score was used.',
    );
  }

  const requestedHours = Math.max(request.hoursPerWeek, 1);
  const ratio = availableHours / requestedHours;

  const normalized =
    ratio >= 1
      ? 1
      : ratio >= 0.9
        ? 0.84
        : ratio >= 0.75
          ? 0.67
          : ratio >= 0.6
            ? 0.47
            : 0.22;

  return createBreakdownItem(
    'Availability',
    normalized,
    availableHours >= requestedHours
      ? `${availableHours} hrs/week covers the requested ${requestedHours}.`
      : `${availableHours} hrs/week trails the requested ${requestedHours}.`,
  );
}

function scoreRateFit(request: MatchingRequest, talent: MatchingTalent): MatchBreakdownItem {
  const [budgetFloor, budgetCeiling] = request.budget;
  const range = Math.max(budgetCeiling - budgetFloor, 1);
  const midpoint = budgetFloor + range / 2;
  let normalized = 0;
  let reason = '';

  if (talent.rate >= budgetFloor && talent.rate <= budgetCeiling) {
    const midpointDistance = Math.abs(talent.rate - midpoint);
    normalized = Math.max(0.82, 1 - midpointDistance / Math.max(range, 1) / 2);
    reason = `$${talent.rate}/hr sits inside the stated $${budgetFloor}-$${budgetCeiling} range.`;
  } else if (talent.rate < budgetFloor) {
    const under = budgetFloor - talent.rate;
    normalized = Math.max(0.58, 0.9 - under / Math.max(range, 10) / 2);
    reason = `$${talent.rate}/hr is below the stated range, which helps budget fit.`;
  } else {
    const over = talent.rate - budgetCeiling;
    normalized = Math.max(0, 0.76 - over / Math.max(range, 10) * 0.7);
    reason = `$${talent.rate}/hr is above the stated $${budgetCeiling}/hr ceiling.`;
  }

  return createBreakdownItem('Rate fit', normalized, reason);
}

function scoreTimezone(request: MatchingRequest, talent: MatchingTalent): MatchBreakdownItem {
  const preference = parseTimezonePreference(request.timezone);
  const talentOffset = resolveTimezoneOffset(talent.timezone);

  if (preference.kind === 'any') {
    return createBreakdownItem('Timezone', 1, 'The request accepts any timezone coverage.');
  }

  if (talentOffset == null) {
    return createBreakdownItem(
      'Timezone',
      0.5,
      'Talent timezone is not in the lane-local offset table, so overlap is estimated conservatively.',
    );
  }

  if (preference.kind === 'range') {
    if (talentOffset >= preference.min && talentOffset <= preference.max) {
      return createBreakdownItem('Timezone', 1, `${talent.timezone} lands inside the requested overlap window.`);
    }

    const distance = Math.min(
      Math.abs(talentOffset - preference.min),
      Math.abs(talentOffset - preference.max),
    );

    return createBreakdownItem(
      'Timezone',
      distance <= 1 ? 0.76 : distance <= 3 ? 0.48 : 0.18,
      `${talent.timezone} sits outside the preferred overlap window.`,
    );
  }

  const distance = Math.abs(talentOffset - preference.offset);

  return createBreakdownItem(
    'Timezone',
    distance <= preference.tolerance
      ? 1
      : distance <= preference.tolerance + 2
        ? 0.72
        : distance <= preference.tolerance + 5
          ? 0.42
          : 0.12,
    distance <= preference.tolerance
      ? `${talent.timezone} is aligned with the requested timezone.`
      : `${talent.timezone} is ${distance} hours away from the preferred timezone.`,
  );
}

function scoreIndustry(request: MatchingRequest, talent: MatchingTalent): MatchBreakdownItem {
  const requestIndustry = normalizeToken(request.industry);
  const normalizedTalentIndustries = talent.industries.map(normalizeToken);
  const hasExactIndustry = normalizedTalentIndustries.includes(requestIndustry);
  const hasRelatedIndustry = normalizedTalentIndustries.some((industry) =>
    isIndustryRelated(requestIndustry, industry),
  );

  return createBreakdownItem(
    'Industry familiarity',
    hasExactIndustry ? 1 : hasRelatedIndustry ? 0.6 : 0.2,
    hasExactIndustry
      ? `Direct ${request.industry} experience is listed.`
      : hasRelatedIndustry
        ? `Nearby industry context should shorten ramp time.`
        : `Little stated industry overlap in the lane-local profile.`,
  );
}

function buildStrengths(
  breakdown: MatchBreakdownItem[],
  matchedSkills: string[],
  talent: MatchingTalent,
) {
  const strengths: string[] = [];

  if (matchedSkills.length > 0) {
    strengths.push(`Matched skills: ${matchedSkills.join(', ')}.`);
  }

  for (const item of [...breakdown].sort((left, right) => right.score - left.score)) {
    if (strengths.length >= 3) {
      break;
    }

    if (item.score / item.max >= 0.7) {
      strengths.push(`${item.label}: ${item.reason}`);
    }
  }

  if (strengths.length < 3 && talent.yearsExp >= 6) {
    strengths.push(`${talent.yearsExp} years of experience adds operational maturity.`);
  }

  return uniqueStrings(strengths).slice(0, 3);
}

function buildWatchouts(
  request: MatchingRequest,
  talent: MatchingTalent,
  breakdown: MatchBreakdownItem[],
  missingSkills: string[],
  availabilityScore: MatchBreakdownItem,
  rateScore: MatchBreakdownItem,
  timezoneScore: MatchBreakdownItem,
) {
  const watchouts: string[] = [];

  if (missingSkills.length > 0) {
    watchouts.push(`Missing requested skills: ${missingSkills.join(', ')}.`);
  }

  if (availabilityScore.score / availabilityScore.max < 0.7) {
    watchouts.push(
      `${talent.availability} is light against the requested ${request.hoursPerWeek} hrs/week.`,
    );
  }

  if (rateScore.score / rateScore.max < 0.7) {
    watchouts.push(rateScore.reason);
  }

  if (timezoneScore.score / timezoneScore.max < 0.7) {
    watchouts.push(timezoneScore.reason);
  }

  if (watchouts.length === 0) {
    const weakest = [...breakdown].sort((left, right) => left.score - right.score)[0];

    if (weakest) {
      watchouts.push(`${weakest.label} is the weakest factor in an otherwise strong fit.`);
    }
  }

  return uniqueStrings(watchouts).slice(0, 3);
}

function buildSummary(
  request: MatchingRequest,
  talent: MatchingTalent,
  total: number,
  breakdown: MatchBreakdownItem[],
  matchedSkills: string[],
) {
  const topFactors = [...breakdown]
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map((item) => item.label.toLowerCase());
  const skillsSummary =
    matchedSkills.length > 0
      ? `${matchedSkills.length}/${request.skills.length || matchedSkills.length} requested skills matched`
      : 'no direct requested skills matched';

  return `${talent.name} scored ${total}/100 for "${request.title}" with strong ${topFactors.join(
    ' and ',
  )}; ${skillsSummary}.`;
}

function parseWeeklyHours(value: string) {
  const match = value.match(/(\d+(?:\.\d+)?)\s*hrs?/i);
  return match ? Number(match[1]) : null;
}

function parseTimezonePreference(value: string): TimezonePreference {
  const normalizedValue = value.trim();
  const lowerValue = normalizedValue.toLowerCase();

  if (!normalizedValue || lowerValue.includes('any')) {
    return { kind: 'any' };
  }

  const plusMinusMatch = normalizedValue.match(/([A-Za-z]{2,4}|GMT|UTC)\s*\+\/-\s*(\d+(?:\.\d+)?)/);

  if (plusMinusMatch) {
    const center = resolveTimezoneOffset(plusMinusMatch[1]);
    const tolerance = Number(plusMinusMatch[2]);

    if (center != null) {
      return {
        kind: 'range',
        min: center - tolerance,
        max: center + tolerance,
      };
    }
  }

  const directOffset = resolveTimezoneOffset(normalizedValue);

  if (directOffset != null) {
    return {
      kind: 'fixed',
      offset: directOffset,
      tolerance: 1,
    };
  }

  if (lowerValue.includes('europe') || lowerValue.includes('africa')) {
    return { kind: 'range', min: -1, max: 3 };
  }

  if (lowerValue.includes('america') || lowerValue.includes('us')) {
    return { kind: 'range', min: -8, max: -3 };
  }

  return { kind: 'any' };
}

function resolveTimezoneOffset(value: string) {
  return TIMEZONE_OFFSETS[value.trim().toUpperCase()] ?? null;
}

function getBreakdownScore(
  breakdown: MatchBreakdownItem[],
  key: MatchFactorKey,
) {
  return breakdown.find((item) => item.key === key)?.score ?? 0;
}

function createBreakdownItem(
  key: MatchFactorKey,
  normalizedScore: number,
  reason: string,
): MatchBreakdownItem {
  const max = MATCH_FACTOR_MAX[key];

  return {
    key,
    label: key,
    score: clamp(Math.round(max * normalizedScore), 0, max),
    max,
    reason,
  };
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase();
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}

function isIndustryRelated(left: string, right: string) {
  return (
    INDUSTRY_RELATIONSHIPS[left]?.includes(right) ||
    INDUSTRY_RELATIONSHIPS[right]?.includes(left) ||
    false
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function neverFactor(value: never): never {
  throw new Error(`Unhandled factor: ${String(value)}`);
}
