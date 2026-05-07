import { NextResponse } from 'next/server';
import { getServerDb } from '@/src/db/server';

export const dynamic = 'force-dynamic';

interface DbRequestBody {
	readonly type: 'exec' | 'query';
	readonly sql: string;
	readonly params?: readonly unknown[];
}

let warnedAboutSqliteBindings = false;

function isSqliteBindingUnavailable(message: string): boolean {
	return (
		message.includes('Could not locate the bindings file') ||
		message.includes('better_sqlite3.node') ||
		message.includes("Cannot find module 'better-sqlite3'")
	);
}

function degradedDbResponse(body: DbRequestBody): NextResponse {
	if (!warnedAboutSqliteBindings) {
		console.warn(
			'[api/db] better-sqlite3 native binding is unavailable; using read-empty/write-noop fallback.',
		);
		warnedAboutSqliteBindings = true;
	}

	const headers = { 'X-EMA-DB-Degraded': 'sqlite-binding-unavailable' };
	if (body.type === 'query') {
		return NextResponse.json(
			{
				type: 'result',
				rows: [],
				degraded: true,
				reason: 'sqlite-binding-unavailable',
			},
			{ headers },
		);
	}

	return NextResponse.json(
		{
			type: 'exec-done',
			degraded: true,
			reason: 'sqlite-binding-unavailable',
		},
		{ headers },
	);
}

export async function POST(request: Request): Promise<NextResponse> {
	let body: DbRequestBody | null = null;
	try {
		body = (await request.json()) as DbRequestBody;
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
		if (body && isSqliteBindingUnavailable(message)) {
			return degradedDbResponse(body);
		}
		console.error('[api/db] Error:', message);
		return NextResponse.json(
			{ type: 'error', message },
			{ status: 500 },
		);
	}
}
