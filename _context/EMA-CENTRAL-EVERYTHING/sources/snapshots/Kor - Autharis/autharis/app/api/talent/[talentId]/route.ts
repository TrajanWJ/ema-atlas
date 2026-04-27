import type { NextRequest } from 'next/server';

import { autharisServerClient } from '@/lib/server/autharis-server-client';
import type { UpdateTalentInput } from '@/lib/server/contracts';
import { handleRouteError, jsonBadRequest, jsonNotFound, jsonOk, readJsonObject } from '@/lib/server/http';

type TalentRouteContext = {
  params: Promise<{ talentId: string }>;
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, context: TalentRouteContext) {
  const { talentId } = await context.params;
  const record = await autharisServerClient.talent.get(talentId);

  if (!record) {
    return jsonNotFound('Talent', talentId);
  }

  return jsonOk(record);
}

export async function PATCH(request: NextRequest, context: TalentRouteContext) {
  const payload = await readJsonObject<UpdateTalentInput>(request);
  if (!payload) {
    return jsonBadRequest('Talent patch payload must be a JSON object.');
  }

  const { talentId } = await context.params;

  try {
    const record = await autharisServerClient.talent.update(talentId, payload);
    return jsonOk(record);
  } catch (error) {
    return handleRouteError(error);
  }
}
