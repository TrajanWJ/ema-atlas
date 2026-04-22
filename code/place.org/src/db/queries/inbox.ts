import { createId } from "../../lib/id";
import { getCurrentUserId } from "../../lib/current-user";
import type { InboxItem, InboxAction } from "../../types/inbox";
import type { DbClient } from "../client";

// ----------------------------------------------------------------------------
// Row → domain mapping
// ----------------------------------------------------------------------------
function rowToInboxItem(row: Record<string, unknown>): InboxItem {
	return {
		id: String(row["id"]),
		content: String(row["content"]),
		source: (row["source"] as "text" | "voice") ?? "text",
		processed: row["processed"] === 1 || row["processed"] === true,
		action: (row["action"] as InboxAction) ?? null,
		projectId: row["project_id"] != null ? String(row["project_id"]) : null,
		actionTargetId: row["action_target_id"] != null ? String(row["action_target_id"]) : null,
		createdAt: String(row["created_at"]),
		processedAt: row["processed_at"] != null ? String(row["processed_at"]) : null,
		updatedAt: String(row["updated_at"]),
	};
}

// ----------------------------------------------------------------------------
// Queries — all scoped to current user
// ----------------------------------------------------------------------------
export async function addInboxItem(
	db: DbClient,
	content: string,
	source: "text" | "voice" = "text",
	projectId: string | null = null,
): Promise<InboxItem> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	console.log(`[inbox] addInboxItem: userId=${userId}, content="${content.slice(0, 30)}"`);
	await db.exec(
		`INSERT INTO inbox (id, content, source, processed, action, project_id, action_target_id, created_at, updated_at, user_id)
		 VALUES (?, ?, ?, 0, NULL, ?, NULL, ?, ?, ?)`,
		[id, content, source, projectId, now, now, userId],
	);
	return {
		id,
		content,
		source,
		processed: false,
		action: null,
		projectId,
		actionTargetId: null,
		createdAt: now,
		processedAt: null,
		updatedAt: now,
	};
}

export async function getUnprocessedItems(db: DbClient): Promise<InboxItem[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM inbox WHERE processed = 0 AND user_id = ? ORDER BY created_at ASC",
		[userId],
	);
	return rows.map(rowToInboxItem);
}

export async function getProcessedItems(db: DbClient): Promise<InboxItem[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM inbox WHERE processed = 1 AND user_id = ? ORDER BY processed_at DESC",
		[userId],
	);
	return rows.map(rowToInboxItem);
}

export async function processItem(
	db: DbClient,
	id: string,
	action: "task" | "journal" | "archive" | "note" | "idea",
	targetId: string | null = null,
): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	// "idea" stays unprocessed — it's a bucket tag, not a terminal action.
	const processed = action === "idea" ? 0 : 1;
	const processedAt = action === "idea" ? null : now;
	await db.exec(
		`UPDATE inbox
		    SET processed = ?,
		        action = ?,
		        action_target_id = ?,
		        processed_at = ?,
		        updated_at = ?
		  WHERE id = ? AND user_id = ?`,
		[processed, action, targetId, processedAt, now, id, userId],
	);
}

export async function getIdeaItems(db: DbClient): Promise<InboxItem[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM inbox WHERE user_id = ? AND action = 'idea' ORDER BY created_at DESC",
		[userId],
	);
	return rows.map(rowToInboxItem);
}

export async function deleteItem(db: DbClient, id: string): Promise<void> {
	const userId = getCurrentUserId();
	await db.exec("DELETE FROM inbox WHERE id = ? AND user_id = ?", [id, userId]);
}

export async function setItemAction(
	db: DbClient,
	id: string,
	action: "processing",
): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`UPDATE inbox SET action = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
		[action, now, id, userId],
	);
}

export async function getProcessingItems(db: DbClient): Promise<InboxItem[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM inbox WHERE action = 'processing' AND processed = 0 AND user_id = ? ORDER BY created_at ASC",
		[userId],
	);
	return rows.map(rowToInboxItem);
}

export async function getAllItems(db: DbClient): Promise<InboxItem[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM inbox WHERE user_id = ? ORDER BY created_at DESC",
		[userId],
	);
	console.log(`[inbox] getAllItems: userId=${userId}, found ${rows.length} rows`);
	return rows.map(rowToInboxItem);
}

export async function unprocessItem(
	db: DbClient,
	id: string,
): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`UPDATE inbox
		    SET processed = 0,
		        action = NULL,
		        processed_at = NULL,
		        updated_at = ?
		  WHERE id = ? AND user_id = ?`,
		[now, id, userId],
	);
}

export async function getUnprocessedCount(db: DbClient): Promise<number> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT COUNT(*) AS count FROM inbox WHERE processed = 0 AND user_id = ?",
		[userId],
	);
	if (rows.length === 0 || rows[0] === undefined) return 0;
	return Number(rows[0]["count"]);
}
