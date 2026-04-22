import { createId } from "../../lib/id";
import type { InboxItem } from "../../types/inbox";
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
		action: (row["action"] as InboxItem["action"]) ?? null,
		createdAt: String(row["created_at"]),
		processedAt: row["processed_at"] != null ? String(row["processed_at"]) : null,
		updatedAt: String(row["updated_at"]),
	};
}

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------
export async function addInboxItem(
	db: DbClient,
	content: string,
	source: "text" | "voice" = "text",
): Promise<InboxItem> {
	const id = createId();
	const now = new Date().toISOString();
	await db.exec(
		`INSERT INTO inbox (id, content, source, processed, action, created_at, updated_at)
		 VALUES (?, ?, ?, 0, NULL, ?, ?)`,
		[id, content, source, now, now],
	);
	return {
		id,
		content,
		source,
		processed: false,
		action: null,
		createdAt: now,
		processedAt: null,
		updatedAt: now,
	};
}

export async function getUnprocessedItems(db: DbClient): Promise<InboxItem[]> {
	const rows = await db.query(
		"SELECT * FROM inbox WHERE processed = 0 ORDER BY created_at ASC",
	);
	return rows.map(rowToInboxItem);
}

export async function getProcessedItems(db: DbClient): Promise<InboxItem[]> {
	const rows = await db.query(
		"SELECT * FROM inbox WHERE processed = 1 ORDER BY processed_at DESC",
	);
	return rows.map(rowToInboxItem);
}

export async function processItem(
	db: DbClient,
	id: string,
	action: "task" | "journal" | "archive",
): Promise<void> {
	const now = new Date().toISOString();
	await db.exec(
		`UPDATE inbox
		    SET processed = 1,
		        action = ?,
		        processed_at = ?,
		        updated_at = ?
		  WHERE id = ?`,
		[action, now, now, id],
	);
}

export async function deleteItem(db: DbClient, id: string): Promise<void> {
	await db.exec("DELETE FROM inbox WHERE id = ?", [id]);
}

export async function getUnprocessedCount(db: DbClient): Promise<number> {
	const rows = await db.query(
		"SELECT COUNT(*) AS count FROM inbox WHERE processed = 0",
	);
	if (rows.length === 0 || rows[0] === undefined) return 0;
	return Number(rows[0]["count"]);
}
