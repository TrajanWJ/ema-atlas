import type { NextRequest } from 'next/server';

import { autharisServerClient } from '@/lib/server/autharis-server-client';
import type { CreateEngagementInput } from '@/lib/server/contracts';
import { handleRouteError, jsonBadRequest, jsonCreated, jsonOk, parseLimit, readJsonObject } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const records = await autharisServerClient.engagements.list({
    client: searchParams.get('client') ?? undefined,
    jobId: searchParams.get('jobId') ?? undefined,
    talentId: searchParams.get('talentId') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    limit: parseLimit(request),
  });

  return jsonOk(records, { count: records.length });
}

export async function POST(request: NextRequest) {
  const payload = await readJsonObject<CreateEngagementInput>(request);
  if (!payload) {
    return jsonBadRequest('Engagement payload must be a JSON object.');
  }

  try {
    const record = await autharisServerClient.engagements.create(payload);
    return jsonCreated(record);
  } catch (error) {
    return handleRouteError(error);
  }
}
