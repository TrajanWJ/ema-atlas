import { NextResponse, type NextRequest } from 'next/server';

import {
  rankMatchesForRequest,
  rankMatchesForRequestId,
  type MatchingRequest,
} from '@/lib/matching';

export const dynamic = 'force-dynamic';

type MatchingRouteBody = {
  limit?: number;
  request?: Partial<MatchingRequest>;
  requestId?: string;
  talentIds?: string[];
};

const DEFAULT_REQUEST: MatchingRequest = {
  id: 'inline-request',
  title: 'Untitled request',
  category: 'ops',
  client: 'Autharis client',
  description: '',
  hoursPerWeek: 20,
  duration: 'TBD',
  timezone: 'Any',
  budget: [0, 999],
  skills: [],
  industry: 'General',
};

export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get('requestId');

  if (!requestId) {
    return NextResponse.json(
      { error: 'Missing requestId. Use /api/matching?requestId=jr-002&limit=3.' },
      { status: 400 },
    );
  }

  const limit = parseLimit(request.nextUrl.searchParams.get('limit'));
  const talentIds = request.nextUrl.searchParams.getAll('talentId');
  const rankedMatches = rankMatchesForRequestId(requestId, { limit, talentIds });

  if (!rankedMatches) {
    return NextResponse.json(
      { error: `No lane-local request found for "${requestId}".` },
      { status: 404 },
    );
  }

  return NextResponse.json(rankedMatches);
}

export async function POST(request: NextRequest) {
  let body: MatchingRouteBody;

  try {
    body = (await request.json()) as MatchingRouteBody;
  } catch {
    return NextResponse.json({ error: 'Expected a JSON request body.' }, { status: 400 });
  }

  const limit = parseLimit(body.limit);
  const talentIds = Array.isArray(body.talentIds)
    ? body.talentIds.filter((talentId) => typeof talentId === 'string')
    : undefined;

  if (typeof body.requestId === 'string' && body.requestId.trim()) {
    const rankedMatches = rankMatchesForRequestId(body.requestId.trim(), { limit, talentIds });

    if (!rankedMatches) {
      return NextResponse.json(
        { error: `No lane-local request found for "${body.requestId}".` },
        { status: 404 },
      );
    }

    return NextResponse.json(rankedMatches);
  }

  if (body.request && typeof body.request === 'object') {
    return NextResponse.json(
      rankMatchesForRequest(normalizeInlineRequest(body.request), {
        limit,
        talentIds,
        generatedFrom: 'custom-request',
      }),
    );
  }

  return NextResponse.json(
    { error: 'Provide either requestId or request in the JSON body.' },
    { status: 400 },
  );
}

function normalizeInlineRequest(request: Partial<MatchingRequest>): MatchingRequest {
  const budget = Array.isArray(request.budget) ? request.budget : DEFAULT_REQUEST.budget;

  return {
    id: typeof request.id === 'string' && request.id.trim() ? request.id.trim() : DEFAULT_REQUEST.id,
    title:
      typeof request.title === 'string' && request.title.trim()
        ? request.title.trim()
        : DEFAULT_REQUEST.title,
    category:
      typeof request.category === 'string' && request.category.trim()
        ? request.category.trim()
        : DEFAULT_REQUEST.category,
    client:
      typeof request.client === 'string' && request.client.trim()
        ? request.client.trim()
        : DEFAULT_REQUEST.client,
    description:
      typeof request.description === 'string' ? request.description : DEFAULT_REQUEST.description,
    hoursPerWeek:
      typeof request.hoursPerWeek === 'number' && Number.isFinite(request.hoursPerWeek)
        ? request.hoursPerWeek
        : DEFAULT_REQUEST.hoursPerWeek,
    duration:
      typeof request.duration === 'string' && request.duration.trim()
        ? request.duration.trim()
        : DEFAULT_REQUEST.duration,
    timezone:
      typeof request.timezone === 'string' && request.timezone.trim()
        ? request.timezone.trim()
        : DEFAULT_REQUEST.timezone,
    budget: normalizeBudget(budget),
    skills: Array.isArray(request.skills)
      ? request.skills.filter((skill): skill is string => typeof skill === 'string')
      : DEFAULT_REQUEST.skills,
    industry:
      typeof request.industry === 'string' && request.industry.trim()
        ? request.industry.trim()
        : DEFAULT_REQUEST.industry,
  };
}

function normalizeBudget(value: unknown): [number, number] {
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((entry) => typeof entry === 'number' && Number.isFinite(entry))
  ) {
    const [left, right] = value;
    return left <= right ? [left, right] : [right, left];
  }

  return DEFAULT_REQUEST.budget;
}

function parseLimit(value: number | string | null | undefined) {
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(numericValue)) {
    return 5;
  }

  return Math.min(Math.max(Math.round(numericValue), 1), 20);
}
