export const MATCH_FACTOR_ORDER = [
  'Work category',
  'Skill overlap',
  'Availability',
  'Rate fit',
  'Timezone',
  'Industry familiarity',
] as const;

export type MatchFactorKey = (typeof MATCH_FACTOR_ORDER)[number];

export type MatchBreakdownItem = {
  key: MatchFactorKey;
  label: MatchFactorKey;
  score: number;
  max: number;
  reason: string;
};

export type MatchingRequest = {
  id: string;
  title: string;
  category: string;
  client: string;
  description: string;
  hoursPerWeek: number;
  duration: string;
  timezone: string;
  budget: [number, number];
  skills: string[];
  industry: string;
};

export type MatchingTalent = {
  id: string;
  name: string;
  initials: string;
  title: string;
  city: string;
  timezone: string;
  rate: number;
  availability: string;
  categories: string[];
  skills: string[];
  industries: string[];
  status: string;
  bio: string;
  yearsExp: number;
};

export type MatchScoreResult = {
  total: number;
  breakdown: MatchBreakdownItem[];
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  watchouts: string[];
  summary: string;
  confidence: 'High' | 'Medium' | 'Low';
};

export type RankedMatch = {
  rank: number;
  talent: MatchingTalent;
  score: MatchScoreResult;
};

export type RankedMatchesResponse = {
  request: MatchingRequest;
  limit: number;
  totalCandidates: number;
  generatedFrom: 'seed-data' | 'custom-request';
  matches: RankedMatch[];
};
