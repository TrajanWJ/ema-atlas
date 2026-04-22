import { NextResponse } from 'next/server';
import { getServerDb } from '@/src/db/server';

export const dynamic = 'force-dynamic';

interface VersionMetaRow {
	readonly id: string;
	readonly file_id: string;
	readonly user_id: string;
	readonly version_num: number;
	readonly size_bytes: number;
	readonly created_at: string;
}

function toVersionResponse(row: VersionMetaRow) {
	return {
		id: row.id,
		fileId: row.file_id,
		userId: row.user_id,
		versionNum: row.version_num,
		sizeBytes: row.size_bytes,
		createdAt: row.created_at,
	};
}

// ---------------------------------------------------------------------------
// GET /api/files/[id]/versions — List versions (metadata only, no BLOB)
// ---------------------------------------------------------------------------
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
): Promise<Response> {
	try {
		const { id } = await params;
		const userId = request.headers.get('X-User-Id') ?? 'guest';

		const db = getServerDb();
		const rows = db
			.prepare(
				`SELECT id, file_id, user_id, version_num, size_bytes, created_at
				 FROM file_versions
				 WHERE file_id = ? AND user_id = ?
				 ORDER BY version_num DESC`,
			)
			.all(id, userId) as VersionMetaRow[];

		return NextResponse.json(rows.map(toVersionResponse));
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[api/files/[id]/versions] GET error:', message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
