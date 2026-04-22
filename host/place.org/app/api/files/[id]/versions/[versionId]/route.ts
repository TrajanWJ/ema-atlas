import { NextResponse } from 'next/server';
import { getServerDb } from '@/src/db/server';

export const dynamic = 'force-dynamic';

interface VersionDataRow {
	readonly data: Buffer | null;
	readonly file_id: string;
	readonly size_bytes: number;
}

interface FileDataRow {
	readonly data: Buffer | null;
	readonly size_bytes: number;
	readonly mime_type: string;
	readonly filename: string;
}

// ---------------------------------------------------------------------------
// GET /api/files/[id]/versions/[versionId] — Download a specific version
// ---------------------------------------------------------------------------
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string; versionId: string }> },
): Promise<Response> {
	try {
		const { id, versionId } = await params;
		const userId = request.headers.get('X-User-Id') ?? 'guest';

		const db = getServerDb();

		const version = db
			.prepare(
				'SELECT data FROM file_versions WHERE id = ? AND file_id = ? AND user_id = ?',
			)
			.get(versionId, id, userId) as { readonly data: Buffer | null } | undefined;

		if (!version?.data) {
			return NextResponse.json(
				{ error: 'Version not found' },
				{ status: 404 },
			);
		}

		// Get mime_type and filename from the parent file
		const file = db
			.prepare('SELECT mime_type, filename FROM files WHERE id = ? AND user_id = ?')
			.get(id, userId) as { readonly mime_type: string; readonly filename: string } | undefined;

		const mimeType = file?.mime_type ?? 'application/octet-stream';
		const filename = file?.filename ?? 'download';

		return new Response(new Uint8Array(version.data), {
			headers: {
				'Content-Type': mimeType,
				'Content-Disposition': `inline; filename="${filename}"`,
				'Cache-Control': 'private, max-age=3600',
			},
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[api/files/[id]/versions/[versionId]] GET error:', message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

// ---------------------------------------------------------------------------
// POST /api/files/[id]/versions/[versionId]/restore — Restore a version
// (copies version data back to main file, saving current as new version)
// ---------------------------------------------------------------------------
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string; versionId: string }> },
): Promise<Response> {
	try {
		const { id, versionId } = await params;
		const userId = request.headers.get('X-User-Id') ?? 'guest';
		const now = new Date().toISOString();

		const db = getServerDb();

		// Get the version data to restore
		const version = db
			.prepare(
				'SELECT data, file_id, size_bytes FROM file_versions WHERE id = ? AND file_id = ? AND user_id = ?',
			)
			.get(versionId, id, userId) as VersionDataRow | undefined;

		if (!version?.data) {
			return NextResponse.json(
				{ error: 'Version not found' },
				{ status: 404 },
			);
		}

		// Get current file data so we can save it as a new version
		const currentFile = db
			.prepare('SELECT data, size_bytes, mime_type, filename FROM files WHERE id = ? AND user_id = ?')
			.get(id, userId) as FileDataRow | undefined;

		if (!currentFile) {
			return NextResponse.json(
				{ error: 'File not found' },
				{ status: 404 },
			);
		}

		// Save current file data as a new version
		if (currentFile.data) {
			const maxRow = db
				.prepare(
					'SELECT MAX(version_num) as max_v FROM file_versions WHERE file_id = ? AND user_id = ?',
				)
				.get(id, userId) as { max_v: number | null } | undefined;
			const nextVersion = (maxRow?.max_v ?? 0) + 1;
			const newVersionId = crypto.randomUUID();

			db.prepare(
				`INSERT INTO file_versions (id, file_id, user_id, version_num, size_bytes, data, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?)`,
			).run(newVersionId, id, userId, nextVersion, currentFile.size_bytes, currentFile.data, now);

			// Prune to keep max 5 versions
			const keepers = db
				.prepare(
					'SELECT id FROM file_versions WHERE file_id = ? AND user_id = ? ORDER BY version_num DESC LIMIT 5',
				)
				.all(id, userId) as readonly { readonly id: string }[];
			const keepIds = keepers.map((r) => r.id);

			if (keepIds.length > 0) {
				const placeholders = keepIds.map(() => '?').join(', ');
				db.prepare(
					`DELETE FROM file_versions WHERE file_id = ? AND user_id = ? AND id NOT IN (${placeholders})`,
				).run(id, userId, ...keepIds);
			}
		}

		// Restore version data to the main file
		db.prepare(
			'UPDATE files SET data = ?, size_bytes = ?, updated_at = ? WHERE id = ? AND user_id = ?',
		).run(version.data, version.size_bytes, now, id, userId);

		return NextResponse.json({ restored: true, versionId, fileId: id });
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[api/files/[id]/versions/[versionId]] POST error:', message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
