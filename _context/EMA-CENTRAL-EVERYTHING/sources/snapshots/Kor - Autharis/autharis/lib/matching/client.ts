import {
  CLIENT_JOB_REQUESTS,
  CLIENT_TALENT,
  type ClientJobRequest,
  type ClientTalent,
} from '@/lib/client/data';
import { rankMatches, score } from '@/lib/matching/engine';
import type {
  MatchingRequest,
  MatchingTalent,
  RankedMatchesResponse,
} from '@/lib/matching/types';

export function toMatchingRequest(request: ClientJobRequest): MatchingRequest {
  return {
    id: request.id,
    title: request.title,
    category: request.category,
    client: request.client,
    description: request.description,
    hoursPerWeek: request.hoursPerWeek,
    duration: request.duration,
    timezone: request.timezone,
    budget: request.budget,
    skills: [...request.skills],
    industry: request.industry,
  };
}

export function toMatchingTalent(talent: ClientTalent): MatchingTalent {
  return {
    id: talent.id,
    name: talent.name,
    initials: talent.initials,
    title: talent.title,
    city: talent.city,
    timezone: talent.timezone,
    rate: talent.rate,
    availability: talent.availability,
    categories: [...talent.categories],
    skills: [...talent.skills],
    industries: [...talent.industries],
    status: talent.status,
    bio: talent.bio,
    yearsExp: talent.yearsExp,
  };
}

export function getSeedRequestById(requestId: string) {
  const request = CLIENT_JOB_REQUESTS.find((candidate) => candidate.id === requestId);
  return request ? toMatchingRequest(request) : null;
}

export function getSeedTalentPool(talentIds?: string[]) {
  const normalizedIds = new Set((talentIds ?? []).map((id) => id.trim()).filter(Boolean));
  const pool = CLIENT_TALENT.filter((talent) =>
    normalizedIds.size === 0 ? true : normalizedIds.has(talent.id),
  );

  return pool.map(toMatchingTalent);
}

export function rankMatchesForRequestId(
  requestId: string,
  options: { limit?: number; talentIds?: string[] } = {},
): RankedMatchesResponse | null {
  const request = getSeedRequestById(requestId);

  if (!request) {
    return null;
  }

  return rankMatchesForRequest(request, {
    ...options,
    generatedFrom: 'seed-data',
  });
}

export function rankMatchesForRequest(
  request: MatchingRequest,
  options: {
    limit?: number;
    talentIds?: string[];
    generatedFrom?: RankedMatchesResponse['generatedFrom'];
  } = {},
): RankedMatchesResponse {
  const talentPool = getSeedTalentPool(options.talentIds);
  const matches = rankMatches(request, talentPool, options.limit);

  return {
    request,
    limit: matches.length,
    totalCandidates: talentPool.length,
    generatedFrom: options.generatedFrom ?? 'custom-request',
    matches,
  };
}

export function scoreSeedMatch(requestId: string, talentId: string) {
  const request = getSeedRequestById(requestId);
  const talent = getSeedTalentPool([talentId])[0];

  if (!request || !talent) {
    return null;
  }

  return score(request, talent);
}
