import { createId } from "../../lib/id";
import { getCurrentUserId } from "../../lib/current-user";
import type { DbClient } from "../client";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface VirtualFolderRow {
	readonly id: string;
	readonly userId: string;
	readonly name: string;
	readonly parentId: string | null;
	readonly isSystem: boolean;
	readonly sortOrder: number;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface FileRow {
	readonly id: string;
	readonly userId: string;
	readonly folderId: string;
	readonly filename: string;
	readonly mimeType: string;
	readonly sizeBytes: number;
	readonly metadata: string | null;
	readonly createdAt: string;
	readonly updatedAt: string;
}

// ----------------------------------------------------------------------------
// Row → domain mapping
// ----------------------------------------------------------------------------

function rowToFolder(row: Record<string, unknown>): VirtualFolderRow {
	return {
		id: String(row["id"]),
		userId: String(row["user_id"]),
		name: String(row["name"]),
		parentId: row["parent_id"] != null ? String(row["parent_id"]) : null,
		isSystem: row["is_system"] === 1,
		sortOrder: Number(row["sort_order"] ?? 0),
		createdAt: String(row["created_at"]),
		updatedAt: String(row["updated_at"]),
	};
}

function rowToFile(row: Record<string, unknown>): FileRow {
	return {
		id: String(row["id"]),
		userId: String(row["user_id"]),
		folderId: String(row["folder_id"]),
		filename: String(row["filename"]),
		mimeType: String(row["mime_type"]),
		sizeBytes: Number(row["size_bytes"] ?? 0),
		metadata: row["metadata"] != null ? String(row["metadata"]) : null,
		createdAt: String(row["created_at"]),
		updatedAt: String(row["updated_at"]),
	};
}

// ----------------------------------------------------------------------------
// File column list (excludes BLOB columns: data, thumbnail)
// ----------------------------------------------------------------------------

const FILE_COLS =
	"id, user_id, folder_id, filename, mime_type, size_bytes, metadata, created_at, updated_at";

// ----------------------------------------------------------------------------
// Folder queries
// ----------------------------------------------------------------------------

export async function getUserFolders(
	db: DbClient,
): Promise<VirtualFolderRow[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM virtual_folders WHERE user_id = ? ORDER BY sort_order",
		[userId],
	);
	return rows.map(rowToFolder);
}

export async function createFolder(
	db: DbClient,
	name: string,
	parentId: string | null = null,
): Promise<VirtualFolderRow> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO virtual_folders (id, user_id, name, parent_id, is_system, sort_order, created_at, updated_at)
		 VALUES (?, ?, ?, ?, 0, 0, ?, ?)`,
		[id, userId, name, parentId, now, now],
	);
	return {
		id,
		userId,
		name,
		parentId,
		isSystem: false,
		sortOrder: 0,
		createdAt: now,
		updatedAt: now,
	};
}

export async function renameFolder(
	db: DbClient,
	id: string,
	name: string,
): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		"UPDATE virtual_folders SET name = ?, updated_at = ? WHERE id = ? AND user_id = ?",
		[name, now, id, userId],
	);
}

export async function deleteFolder(
	db: DbClient,
	id: string,
): Promise<void> {
	const userId = getCurrentUserId();
	await db.exec(
		"DELETE FROM virtual_folders WHERE id = ? AND user_id = ? AND is_system = 0",
		[id, userId],
	);
}

const SYSTEM_FOLDERS = [
	{ id: "desktop", name: "Desktop" },
	{ id: "documents", name: "Documents" },
	{ id: "photos", name: "Photos" },
] as const;

export async function ensureSystemFolders(db: DbClient): Promise<void> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT id FROM virtual_folders WHERE user_id = ? AND is_system = 1",
		[userId],
	);
	const existingIds = new Set(rows.map((r) => String(r["id"])));
	const now = new Date().toISOString();

	for (const folder of SYSTEM_FOLDERS) {
		if (!existingIds.has(folder.id)) {
			await db.exec(
				`INSERT INTO virtual_folders (id, user_id, name, parent_id, is_system, sort_order, created_at, updated_at)
				 VALUES (?, ?, ?, NULL, 1, 0, ?, ?)`,
				[folder.id, userId, folder.name, now, now],
			);
		}
	}
}

// ----------------------------------------------------------------------------
// File queries
// ----------------------------------------------------------------------------

export async function getFilesInFolder(
	db: DbClient,
	folderId: string,
): Promise<FileRow[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		`SELECT ${FILE_COLS} FROM files WHERE folder_id = ? AND user_id = ? ORDER BY filename`,
		[folderId, userId],
	);
	return rows.map(rowToFile);
}

export async function getFileById(
	db: DbClient,
	id: string,
): Promise<FileRow | null> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		`SELECT ${FILE_COLS} FROM files WHERE id = ? AND user_id = ?`,
		[id, userId],
	);
	if (rows.length === 0 || rows[0] === undefined) return null;
	return rowToFile(rows[0]);
}

interface CreateFileOpts {
	readonly filename: string;
	readonly folderId: string;
	readonly mimeType: string;
	readonly sizeBytes: number;
	readonly metadata?: string;
}

export async function createFileRecord(
	db: DbClient,
	opts: CreateFileOpts,
): Promise<FileRow> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	const metadata = opts.metadata ?? null;
	await db.exec(
		`INSERT INTO files (id, user_id, folder_id, filename, mime_type, size_bytes, data, thumbnail, metadata, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?)`,
		[id, userId, opts.folderId, opts.filename, opts.mimeType, opts.sizeBytes, metadata, now, now],
	);
	return {
		id,
		userId,
		folderId: opts.folderId,
		filename: opts.filename,
		mimeType: opts.mimeType,
		sizeBytes: opts.sizeBytes,
		metadata,
		createdAt: now,
		updatedAt: now,
	};
}

export async function renameFile(
	db: DbClient,
	id: string,
	filename: string,
): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		"UPDATE files SET filename = ?, updated_at = ? WHERE id = ? AND user_id = ?",
		[filename, now, id, userId],
	);
}

export async function moveFile(
	db: DbClient,
	id: string,
	folderId: string,
): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		"UPDATE files SET folder_id = ?, updated_at = ? WHERE id = ? AND user_id = ?",
		[folderId, now, id, userId],
	);
}

export async function deleteFile(
	db: DbClient,
	id: string,
): Promise<void> {
	const userId = getCurrentUserId();
	await db.exec("DELETE FROM files WHERE id = ? AND user_id = ?", [id, userId]);
}

export async function searchFiles(
	db: DbClient,
	query: string,
): Promise<FileRow[]> {
	const userId = getCurrentUserId();
	const pattern = `%${query}%`;
	const rows = await db.query(
		`SELECT ${FILE_COLS} FROM files WHERE filename LIKE ? AND user_id = ? ORDER BY updated_at DESC`,
		[pattern, userId],
	);
	return rows.map(rowToFile);
}

export async function getAllFiles(db: DbClient): Promise<FileRow[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		`SELECT ${FILE_COLS} FROM files WHERE user_id = ? ORDER BY updated_at DESC`,
		[userId],
	);
	return rows.map(rowToFile);
}
