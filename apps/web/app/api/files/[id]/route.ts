import { NextResponse } from 'next/server';
import { getServerDb } from '@/src/db/server';

export const dynamic = 'force-dynamic';

interface FileDataRow {
	readonly data: Buffer | null;
	readonly mime_type: string;
	readonly filename: string;
}

interface FileThumbnailRow {
	readonly thumbnail: Buffer | null;
	readonly mime_type: string;
	readonly filename: string;
}

interface FileMetaRow {
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

interface PatchBody {
	readonly filename?: string;
	readonly folderId?: string;
}

function toMetadataResponse(row: FileMetaRow) {
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
// GET /api/files/[id] — Download file binary (or thumbnail with ?thumbnail=1)
// ---------------------------------------------------------------------------
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
): Promise<Response> {
	try {
		const { id } = await params;
		const userId =
			request.headers.get('X-User-Id') ?? 'guest';
		const { searchParams } = new URL(request.url);
		const wantThumbnail = searchParams.get('thumbnail') === '1';

		const db = getServerDb();

		if (wantThumbnail) {
			const row = db
				.prepare(
					'SELECT thumbnail, mime_type, filename FROM files WHERE id = ? AND user_id = ?',
				)
				.get(id, userId) as FileThumbnailRow | undefined;

			if (!row?.thumbnail) {
				return NextResponse.json(
					{ error: 'Thumbnail not found' },
					{ status: 404 },
				);
			}

			return new Response(new Uint8Array(row.thumbnail), {
				headers: {
					'Content-Type': row.mime_type,
					'Content-Disposition': `inline; filename="thumb_${row.filename}"`,
					'Cache-Control': 'private, max-age=3600',
				},
			});
		}

		const row = db
			.prepare(
				'SELECT data, mime_type, filename FROM files WHERE id = ? AND user_id = ?',
			)
			.get(id, userId) as FileDataRow | undefined;

		if (!row?.data) {
			return NextResponse.json(
				{ error: 'File not found' },
				{ status: 404 },
			);
		}

		return new Response(new Uint8Array(row.data), {
			headers: {
				'Content-Type': row.mime_type,
				'Content-Disposition': `inline; filename="${row.filename}"`,
				'Cache-Control': 'private, max-age=3600',
			},
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[api/files/[id]] GET error:', message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

// ---------------------------------------------------------------------------
// DELETE /api/files/[id] — Delete a file
// ---------------------------------------------------------------------------
export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
): Promise<Response> {
	try {
		const { id } = await params;
		const userId =
			request.headers.get('X-User-Id') ?? 'guest';

		const db = getServerDb();
		const result = db
			.prepare('DELETE FROM files WHERE id = ? AND user_id = ?')
			.run(id, userId);

		if (result.changes === 0) {
			return NextResponse.json(
				{ error: 'File not found or not owned by user' },
				{ status: 404 },
			);
		}

		return new Response(null, { status: 204 });
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[api/files/[id]] DELETE error:', message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

// ---------------------------------------------------------------------------
// PATCH /api/files/[id] — Update file metadata
// ---------------------------------------------------------------------------
export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
): Promise<Response> {
	try {
		const { id } = await params;
		const userId =
			request.headers.get('X-User-Id') ?? 'guest';

		const body = (await request.json()) as PatchBody;

		if (!body.filename && !body.folderId) {
			return NextResponse.json(
				{ error: 'Nothing to update — provide filename or folderId' },
				{ status: 400 },
			);
		}

		const db = getServerDb();
		const now = new Date().toISOString();

		// Build a dynamic SET clause so we only touch provided fields
		const setClauses: string[] = [];
		const values: unknown[] = [];

		if (body.filename) {
			setClauses.push('filename = ?');
			values.push(body.filename);
		}
		if (body.folderId) {
			setClauses.push('folder_id = ?');
			values.push(body.folderId);
		}

		setClauses.push('updated_at = ?');
		values.push(now);
		values.push(id, userId);

		const result = db
			.prepare(
				`UPDATE files SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`,
			)
			.run(...values);

		if (result.changes === 0) {
			return NextResponse.json(
				{ error: 'File not found or not owned by user' },
				{ status: 404 },
			);
		}

		const updated = db
			.prepare(
				`SELECT id, user_id, folder_id, filename, mime_type, size_bytes, metadata, created_at, updated_at
				 FROM files WHERE id = ?`,
			)
			.get(id) as FileMetaRow | undefined;

		if (!updated) {
			return NextResponse.json(
				{ error: 'Failed to read back updated file' },
				{ status: 500 },
			);
		}

		return NextResponse.json(toMetadataResponse(updated));
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[api/files/[id]] PATCH error:', message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
