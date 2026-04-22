import { getCurrentUserId } from "../../lib/current-user";
import type { DailyHighlight } from "../../types/daily-highlight";
import type { DbClient } from "../client";

function rowToHighlight(row: Record<string, unknown>): DailyHighlight {
	return {
		date: String(row["date"]),
		text: row["text"] != null ? String(row["text"]) : null,
		taskId: row["task_id"] != null ? String(row["task_id"]) : null,
		completed: row["completed"] === 1 || row["completed"] === true,
		updatedAt: String(row["updated_at"]),
	};
}

function todayLocal(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getHighlight(
	db: DbClient,
	date: string = todayLocal(),
): Promise<DailyHighlight | null> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM daily_highlights WHERE user_id = ? AND date = ? LIMIT 1",
		[userId, date],
	);
	if (rows.length === 0 || rows[0] === undefined) return null;
	return rowToHighlight(rows[0]);
}

export async function setHighlight(
	db: DbClient,
	text: string,
	taskId: string | null = null,
	date: string = todayLocal(),
): Promise<DailyHighlight> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO daily_highlights (user_id, date, text, task_id, completed, updated_at)
		 VALUES (?, ?, ?, ?, 0, ?)
		 ON CONFLICT(user_id, date) DO UPDATE SET
		   text = excluded.text,
		   task_id = excluded.task_id,
		   updated_at = excluded.updated_at`,
		[userId, date, text, taskId, now],
	);
	return {
		date,
		text,
		taskId,
		completed: false,
		updatedAt: now,
	};
}

export async function setHighlightCompleted(
	db: DbClient,
	completed: boolean,
	date: string = todayLocal(),
): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`UPDATE daily_highlights
		    SET completed = ?, updated_at = ?
		  WHERE user_id = ? AND date = ?`,
		[completed ? 1 : 0, now, userId, date],
	);
}

export async function clearHighlight(
	db: DbClient,
	date: string = todayLocal(),
): Promise<void> {
	const userId = getCurrentUserId();
	await db.exec(
		"DELETE FROM daily_highlights WHERE user_id = ? AND date = ?",
		[userId, date],
	);
}
