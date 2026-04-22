import { createId } from "../../lib/id";
import { getCurrentUserId } from "../../lib/current-user";
import type { DbClient } from "../client";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface FileVersionRow {
	readonly id: string;
	readonly fileId: string;
	readonly userId: string;
	readonly versionNum: number;
	readonly sizeBytes: number;
	readonly createdAt: string;
}

// ----------------------------------------------------------------------------
// Row mapping
// ----------------------------------------------------------------------------

const VERSION_COLS =
	"id, file_id, user_id, version_num, size_bytes, created_at";

function rowToVersion(row: Record<string, unknown>): FileVersionRow {
	return {
		id: String(row["id"]),
		fileId: String(row["file_id"]),
		userId: String(row["user_id"]),
		versionNum: Number(row["version_num"] ?? 0),
		sizeBytes: Number(row["size_bytes"] ?? 0),
		createdAt: String(row["created_at"]),
	};
}

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------

export async function getVersions(
	db: DbClient,
	fileId: string,
): Promise<FileVersionRow[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		`SELECT ${VERSION_COLS} FROM file_versions WHERE file_id = ? AND user_id = ? ORDER BY version_num DESC`,
		[fileId, userId],
	);
	return rows.map(rowToVersion);
}

export async function getVersionData(
	db: DbClient,
	versionId: string,
): Promise<Buffer | null> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT data FROM file_versions WHERE id = ? AND user_id = ?",
		[versionId, userId],
	);
	if (rows.length === 0 || rows[0] === undefined) return null;
	const data = rows[0]["data"];
	if (data == null) return null;
	return data as Buffer;
}

export async function createVersion(
	db: DbClient,
	fileId: string,
	sizeBytes: number,
	data: Buffer,
): Promise<FileVersionRow> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();

	// Get the next version number
	const rows = await db.query(
		"SELECT MAX(version_num) as max_v FROM file_versions WHERE file_id = ? AND user_id = ?",
		[fileId, userId],
	);
	const maxV = rows[0] ? Number(rows[0]["max_v"] ?? 0) : 0;
	const versionNum = maxV + 1;

	await db.exec(
		`INSERT INTO file_versions (id, file_id, user_id, version_num, size_bytes, data, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		[id, fileId, userId, versionNum, sizeBytes, data, now],
	);

	// Prune to keep max 5
	await pruneVersions(db, fileId, 5);

	return {
		id,
		fileId,
		userId,
		versionNum,
		sizeBytes,
		createdAt: now,
	};
}

export async function pruneVersions(
	db: DbClient,
	fileId: string,
	keepCount: number,
): Promise<void> {
	const userId = getCurrentUserId();

	// Get IDs of versions to keep (most recent by version_num)
	const keepers = await db.query(
		`SELECT id FROM file_versions WHERE file_id = ? AND user_id = ? ORDER BY version_num DESC LIMIT ?`,
		[fileId, userId, keepCount],
	);
	const keepIds = keepers.map((r) => String(r["id"]));

	if (keepIds.length === 0) return;

	// Delete everything not in the keep list
	const placeholders = keepIds.map(() => "?").join(", ");
	await db.exec(
		`DELETE FROM file_versions WHERE file_id = ? AND user_id = ? AND id NOT IN (${placeholders})`,
		[fileId, userId, ...keepIds],
	);
}
