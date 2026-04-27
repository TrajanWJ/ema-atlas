import { NextResponse, type NextRequest } from 'next/server';

import { AutharisStoreError } from '@/lib/db/autharis-store';
import type { ApiFailure, ApiMeta, ApiSuccess } from '@/lib/server/contracts';

export function parseLimit(request: NextRequest): number | undefined {
  const raw = request.nextUrl.searchParams.get('limit');
  if (!raw) return undefined;

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export async function readJsonObject<T extends Record<string, unknown>>(request: NextRequest): Promise<T | null> {
  const payload = (await request.json().catch(() => null)) as unknown;

  if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
    return null;
  }

  return payload as T;
}

export function jsonOk<T>(data: T, meta?: ApiMeta): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(meta ? { ok: true, data, meta } : { ok: true, data });
}

export function jsonCreated<T>(data: T): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ ok: true, data }, { status: 201 });
}

export function jsonError(code: string, message: string, status: number): NextResponse<ApiFailure> {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

export function jsonNotFound(resourceLabel: string, id: string): NextResponse<ApiFailure> {
  return jsonError('not_found', `${resourceLabel} "${id}" was not found.`, 404);
}

export function jsonBadRequest(message: string): NextResponse<ApiFailure> {
  return jsonError('bad_request', message, 400);
}

export function handleRouteError(error: unknown): NextResponse<ApiFailure> {
  if (error instanceof AutharisStoreError) {
    if (error.code === 'not_found') {
      return jsonError(error.code, error.message, 404);
    }

    if (error.code === 'conflict') {
      return jsonError(error.code, error.message, 409);
    }

    return jsonError(error.code, error.message, 400);
  }

  return jsonError('internal_error', 'Unexpected server error.', 500);
}
