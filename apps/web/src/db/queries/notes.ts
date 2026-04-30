import { createId } from "../../lib/id";
import { getCurrentUserId } from "../../lib/current-user";
import type { Note } from "../../types/note";
import type { DbClient } from "../client";

// ----------------------------------------------------------------------------
// Row → domain mapping
// ----------------------------------------------------------------------------

function rowToNote(row: Record<string, unknown>): Note {
	return {
		id: String(row["id"]),
		title: String(row["title"]),
		content: String(row["content"]),
		pinned: row["pinned"] === 1,
		archived: row["archived"] === 1,
		sourceId: row["source_id"] != null ? String(row["source_id"]) : null,
		sourceType: row["source_type"] != null ? String(row["source_type"]) : null,
		createdAt: String(row["created_at"]),
		updatedAt: String(row["updated_at"]),
	};
}

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------

interface CreateNoteOpts {
	readonly title?: string;
	readonly content?: string;
	readonly sourceId?: string;
	readonly sourceType?: string;
}

export async function createNote(
	db: DbClient,
	opts?: CreateNoteOpts,
): Promise<Note> {
	const id = createId();
	const now = new Date().toISOString();
	const title = opts?.title ?? "Untitled";
	const content = opts?.content ?? "";
	const sourceId = opts?.sourceId ?? null;
	const sourceType = opts?.sourceType ?? null;

	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO notes (id, title, content, pinned, archived, source_id, source_type, created_at, updated_at, user_id)
		 VALUES (?, ?, ?, 0, 0, ?, ?, ?, ?, ?)`,
		[id, title, content, sourceId, sourceType, now, now, userId],
	);

	return {
		id,
		title,
		content,
		pinned: false,
		archived: false,
		sourceId,
		sourceType,
		createdAt: now,
		updatedAt: now,
	};
}

export async function getNote(
	db: DbClient,
	id: string,
): Promise<Note | null> {
	const userId = getCurrentUserId();
	const rows = await db.query("SELECT * FROM notes WHERE id = ? AND user_id = ?", [id, userId]);
	if (rows.length === 0 || rows[0] === undefined) return null;
	return rowToNote(rows[0]);
}

export async function getAllNotes(db: DbClient): Promise<Note[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM notes WHERE archived = 0 AND user_id = ? ORDER BY updated_at DESC",
		[userId],
	);
	return rows.map(rowToNote);
}

export async function updateNote(
	db: DbClient,
	id: string,
	fields: { readonly title?: string; readonly content?: string },
): Promise<void> {
	const now = new Date().toISOString();
	const sets: string[] = ["updated_at = ?"];
	const params: unknown[] = [now];

	if (fields.title !== undefined) {
		sets.push("title = ?");
		params.push(fields.title);
	}
	if (fields.content !== undefined) {
		sets.push("content = ?");
		params.push(fields.content);
	}

	const userId = getCurrentUserId();
	params.push(id);
	params.push(userId);
	await db.exec(`UPDATE notes SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`, params);
}

export async function deleteNote(
	db: DbClient,
	id: string,
): Promise<void> {
	const userId = getCurrentUserId();
	await db.exec("DELETE FROM notes WHERE id = ? AND user_id = ?", [id, userId]);
}

export async function archiveNote(
	db: DbClient,
	id: string,
): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		"UPDATE notes SET archived = 1, updated_at = ? WHERE id = ? AND user_id = ?",
		[now, id, userId],
	);
}

export async function pinNote(
	db: DbClient,
	id: string,
	pinned: boolean,
): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		"UPDATE notes SET pinned = ?, updated_at = ? WHERE id = ? AND user_id = ?",
		[pinned ? 1 : 0, now, id, userId],
	);
}

export async function searchNotes(
	db: DbClient,
	query: string,
): Promise<Note[]> {
	const userId = getCurrentUserId();
	const pattern = `%${query}%`;
	const rows = await db.query(
		`SELECT * FROM notes
		 WHERE archived = 0 AND (title LIKE ? OR content LIKE ?) AND user_id = ?
		 ORDER BY updated_at DESC`,
		[pattern, pattern, userId],
	);
	return rows.map(rowToNote);
}
