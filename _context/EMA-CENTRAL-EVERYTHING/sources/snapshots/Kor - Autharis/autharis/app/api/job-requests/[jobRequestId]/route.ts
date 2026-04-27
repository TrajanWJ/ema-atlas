import type { NextRequest } from 'next/server';

import { autharisServerClient } from '@/lib/server/autharis-server-client';
import type { UpdateJobRequestInput } from '@/lib/server/contracts';
import { handleRouteError, jsonBadRequest, jsonNotFound, jsonOk, readJsonObject } from '@/lib/server/http';

type JobRequestRouteContext = {
  params: Promise<{ jobRequestId: string }>;
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, context: JobRequestRouteContext) {
  const { jobRequestId } = await context.params;
  const record = await autharisServerClient.jobRequests.get(jobRequestId);

  if (!record) {
    return jsonNotFound('Job request', jobRequestId);
  }

  return jsonOk(record);
}

export async function PATCH(request: NextRequest, context: JobRequestRouteContext) {
  const payload = await readJsonObject<UpdateJobRequestInput>(request);
  if (!payload) {
    return jsonBadRequest('Job request patch payload must be a JSON object.');
  }

  const { jobRequestId } = await context.params;

  try {
    const record = await autharisServerClient.jobRequests.update(jobRequestId, payload);
    return jsonOk(record);
  } catch (error) {
    return handleRouteError(error);
  }
}
