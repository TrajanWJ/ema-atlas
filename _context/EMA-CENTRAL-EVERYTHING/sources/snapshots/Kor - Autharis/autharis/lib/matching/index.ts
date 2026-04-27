export {
  getSeedRequestById,
  getSeedTalentPool,
  rankMatchesForRequest,
  rankMatchesForRequestId,
  scoreSeedMatch,
  toMatchingRequest,
  toMatchingTalent,
} from '@/lib/matching/client';
export { rankMatches, score } from '@/lib/matching/engine';
export type {
  MatchBreakdownItem,
  MatchFactorKey,
  MatchScoreResult,
  MatchingRequest,
  MatchingTalent,
  RankedMatch,
  RankedMatchesResponse,
} from '@/lib/matching/types';
export { MATCH_FACTOR_ORDER } from '@/lib/matching/types';
