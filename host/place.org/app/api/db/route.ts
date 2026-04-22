import { NextResponse } from 'next/server';
import { getServerDb } from '@/src/db/server';

export const dynamic = 'force-dynamic';

interface DbRequestBody {
	readonly type: 'exec' | 'query';
	readonly sql: string;
	readonly params?: readonly unknown[];
}

export async function POST(request: Request): Promise<NextResponse> {
	try {
		const body = (await request.json()) as DbRequestBody;
		const db = getServerDb();

		if (body.type === 'exec') {
			if (body.params && body.params.length > 0) {
				db.prepare(body.sql).run(...body.params);
			} else {
				db.exec(body.sql);
			}
			return NextResponse.json({ type: 'exec-done' });
		}

		if (body.type === 'query') {
			let rows: unknown[];
			if (body.params && body.params.length > 0) {
				rows = db.prepare(body.sql).all(...body.params);
			} else {
				rows = db.prepare(body.sql).all();
			}
			return NextResponse.json({ type: 'result', rows });
		}

		return NextResponse.json(
			{ type: 'error', message: `Unknown type: ${body.type}` },
			{ status: 400 },
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[api/db] Error:', message);
		return NextResponse.json(
			{ type: 'error', message },
			{ status: 500 },
		);
	}
}
