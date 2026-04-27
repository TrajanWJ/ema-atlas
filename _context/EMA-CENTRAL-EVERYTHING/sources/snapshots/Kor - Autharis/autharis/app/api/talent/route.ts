import type { NextRequest } from 'next/server';

import { autharisServerClient } from '@/lib/server/autharis-server-client';
import type { CreateTalentInput } from '@/lib/server/contracts';
import { handleRouteError, jsonBadRequest, jsonCreated, jsonOk, parseLimit, readJsonObject } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const records = await autharisServerClient.talent.list({
    category: searchParams.get('category') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    skill: searchParams.get('skill') ?? undefined,
    industry: searchParams.get('industry') ?? undefined,
    limit: parseLimit(request),
  });

  return jsonOk(records, { count: records.length });
}

export async function POST(request: NextRequest) {
  const payload = await readJsonObject<CreateTalentInput>(request);
  if (!payload) {
    return jsonBadRequest('Talent payload must be a JSON object.');
  }

  try {
    const record = await autharisServerClient.talent.create(payload);
    return jsonCreated(record);
  } catch (error) {
    return handleRouteError(error);
  }
}
