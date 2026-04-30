import { NextResponse } from 'next/server';
import { getServerDb } from '@/src/db/server';

export const dynamic = 'force-dynamic';

interface FileRow {
	readonly id: string;
	readonly user_id: string;
	readonly folder_id: string;
	readonly filename: string;
	readonly mime_type: string;
	readonly size_bytes: number;
	readonly metadata: string | null;
	readonly created_at: string;
	readonly updated_at: string;
}

function toMetadataResponse(row: FileRow) {
	return {
		id: row.id,
		userId: row.user_id,
		folderId: row.folder_id,
		filename: row.filename,
		mimeType: row.mime_type,
		sizeBytes: row.size_bytes,
		metadata: row.metadata ? (JSON.parse(row.metadata) as unknown) : null,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

// ---------------------------------------------------------------------------
// POST /api/files — Upload a file (multipart/form-data)
// ---------------------------------------------------------------------------
export async function POST(request: Request): Promise<NextResponse> {
	try {
		const userId =
			request.headers.get('X-User-Id') ?? 'guest';

		const formData = await request.formData();
		const file = formData.get('file');

		if (!(file instanceof File)) {
			return NextResponse.json(
				{ error: 'Missing or invalid "file" field' },
				{ status: 400 },
			);
		}

		const folderId =
			(formData.get('folderId') as string | null) ?? 'desktop';

		const now = new Date().toISOString();
		const buffer = Buffer.from(await file.arrayBuffer());
		const mimeType = file.type || 'application/octet-stream';

		const db = getServerDb();

		// Check if a file with the same name already exists in the same folder
		const existing = db
			.prepare(
				`SELECT id, size_bytes, data FROM files WHERE filename = ? AND folder_id = ? AND user_id = ?`,
			)
			.get(file.name, folderId, userId) as
			| { readonly id: string; readonly size_bytes: number; readonly data: Buffer | null }
			| undefined;

		let fileId: string;

		if (existing) {
			// Save old data as a version before overwriting
			if (existing.data) {
				// Get next version number
				const maxRow = db
					.prepare(
						`SELECT MAX(version_num) as max_v FROM file_versions WHERE file_id = ? AND user_id = ?`,
					)
					.get(existing.id, userId) as { max_v: number | null } | undefined;
				const nextVersion = (maxRow?.max_v ?? 0) + 1;
				const versionId = crypto.randomUUID();

				db.prepare(
					`INSERT INTO file_versions (id, file_id, user_id, version_num, size_bytes, data, created_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?)`,
				).run(versionId, existing.id, userId, nextVersion, existing.size_bytes, existing.data, now);

				// Prune to keep max 5 versions
				const keepers = db
					.prepare(
						`SELECT id FROM file_versions WHERE file_id = ? AND user_id = ? ORDER BY version_num DESC LIMIT 5`,
					)
					.all(existing.id, userId) as readonly { readonly id: string }[];
				const keepIds = keepers.map((r) => r.id);

				if (keepIds.length > 0) {
					const placeholders = keepIds.map(() => '?').join(', ');
					db.prepare(
						`DELETE FROM file_versions WHERE file_id = ? AND user_id = ? AND id NOT IN (${placeholders})`,
					).run(existing.id, userId, ...keepIds);
				}
			}

			// Update the existing file record with new data
			db.prepare(
				`UPDATE files SET mime_type = ?, size_bytes = ?, data = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
			).run(mimeType, buffer.byteLength, buffer, now, existing.id, userId);

			fileId = existing.id;
		} else {
			// Brand new file
			fileId = crypto.randomUUID();
			db.prepare(
				`INSERT INTO files (id, user_id, folder_id, filename, mime_type, size_bytes, data, thumbnail, metadata, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)`,
			).run(fileId, userId, folderId, file.name, mimeType, buffer.byteLength, buffer, now, now);
		}

		const row = db
			.prepare(
				`SELECT id, user_id, folder_id, filename, mime_type, size_bytes, metadata, created_at, updated_at
				 FROM files WHERE id = ?`,
			)
			.get(fileId) as FileRow | undefined;

		if (!row) {
			return NextResponse.json(
				{ error: 'Failed to read back inserted file' },
				{ status: 500 },
			);
		}

		return NextResponse.json(toMetadataResponse(row), { status: existing ? 200 : 201 });
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[api/files] POST error:', message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

// ---------------------------------------------------------------------------
// GET /api/files?folderId=xxx&userId=yyy — List files in a folder
// ---------------------------------------------------------------------------
export async function GET(request: Request): Promise<NextResponse> {
	try {
		const userId =
			request.headers.get('X-User-Id') ?? 'guest';

		const { searchParams } = new URL(request.url);
		const folderId = searchParams.get('folderId') ?? 'desktop';

		const db = getServerDb();
		const rows = db
			.prepare(
				`SELECT id, user_id, folder_id, filename, mime_type, size_bytes, metadata, created_at, updated_at
				 FROM files
				 WHERE user_id = ? AND folder_id = ?
				 ORDER BY created_at DESC`,
			)
			.all(userId, folderId) as FileRow[];

		return NextResponse.json(rows.map(toMetadataResponse));
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[api/files] GET error:', message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
