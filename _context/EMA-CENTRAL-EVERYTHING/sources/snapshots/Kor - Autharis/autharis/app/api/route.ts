import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    ok: true,
    data: {
      service: 'autharis-api',
      storage: 'typed-json-seed',
      endpoints: [
        '/api/catalog',
        '/api/talent',
        '/api/talent/[talentId]',
        '/api/job-requests',
        '/api/job-requests/[jobRequestId]',
        '/api/engagements',
        '/api/timesheets',
        '/api/invoices',
        '/api/admin/queue',
      ],
    },
  });
}
