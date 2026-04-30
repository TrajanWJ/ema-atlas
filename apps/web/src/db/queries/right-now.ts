import { createId } from "../../lib/id";
import { getCurrentUserId } from "../../lib/current-user";
import type { RightNowState } from "../../types/right-now";
import type { DbClient } from "../client";

function rowToState(row: Record<string, unknown>): RightNowState {
	return {
		id: String(row["id"]),
		text: String(row["text"]),
		startedAt: String(row["started_at"]),
		endedAt: row["ended_at"] != null ? String(row["ended_at"]) : null,
		createdAt: String(row["created_at"]),
	};
}

export async function getCurrentState(db: DbClient): Promise<RightNowState | null> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM right_now_states WHERE user_id = ? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1",
		[userId],
	);
	if (rows.length === 0 || rows[0] === undefined) return null;
	return rowToState(rows[0]);
}

export async function getRecentStates(
	db: DbClient,
	limit: number = 10,
): Promise<RightNowState[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM right_now_states WHERE user_id = ? ORDER BY started_at DESC LIMIT ?",
		[userId, limit],
	);
	return rows.map(rowToState);
}

export async function insertState(
	db: DbClient,
	text: string,
): Promise<RightNowState> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();

	// Close any currently-open state first
	await db.exec(
		"UPDATE right_now_states SET ended_at = ? WHERE user_id = ? AND ended_at IS NULL",
		[now, userId],
	);

	await db.exec(
		`INSERT INTO right_now_states (id, user_id, text, started_at, ended_at, annotations, created_at)
		 VALUES (?, ?, ?, ?, NULL, NULL, ?)`,
		[id, userId, text, now, now],
	);

	return {
		id,
		text,
		startedAt: now,
		endedAt: null,
		createdAt: now,
	};
}

export async function clearCurrentState(db: DbClient): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		"UPDATE right_now_states SET ended_at = ? WHERE user_id = ? AND ended_at IS NULL",
		[now, userId],
	);
}
