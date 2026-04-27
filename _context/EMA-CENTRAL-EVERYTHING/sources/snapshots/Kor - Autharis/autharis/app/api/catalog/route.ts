import { autharisServerClient } from '@/lib/server/autharis-server-client';
import { jsonOk } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const catalog = await autharisServerClient.catalog.read();
  return jsonOk(catalog);
}
