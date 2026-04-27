import type { NextRequest } from 'next/server';

import { autharisServerClient } from '@/lib/server/autharis-server-client';
import type { CreateJobRequestInput } from '@/lib/server/contracts';
import { handleRouteError, jsonBadRequest, jsonCreated, jsonOk, parseLimit, readJsonObject } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const records = await autharisServerClient.jobRequests.list({
    category: searchParams.get('category') ?? undefined,
    client: searchParams.get('client') ?? undefined,
    industry: searchParams.get('industry') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    limit: parseLimit(request),
  });

  return jsonOk(records, { count: records.length });
}

export async function POST(request: NextRequest) {
  const payload = await readJsonObject<CreateJobRequestInput>(request);
  if (!payload) {
    return jsonBadRequest('Job request payload must be a JSON object.');
  }

  try {
    const record = await autharisServerClient.jobRequests.create(payload);
    return jsonCreated(record);
  } catch (error) {
    return handleRouteError(error);
  }
}
