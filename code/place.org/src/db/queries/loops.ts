import { createId } from "../../lib/id";
import { getCurrentUserId } from "../../lib/current-user";
import type { Loop, LoopState } from "../../types/loop";
import type { DbClient } from "../client";

function parseTags(raw: unknown): readonly string[] {
	if (raw == null) return [];
	try {
		const parsed = JSON.parse(String(raw));
		return Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string") : [];
	} catch {
		return [];
	}
}

function rowToLoop(row: Record<string, unknown>): Loop {
	return {
		id: String(row["id"]),
		title: String(row["title"]),
		waitingOn: row["waiting_on"] != null ? String(row["waiting_on"]) : null,
		weight: Number(row["weight"] ?? 2),
		state: (row["state"] as LoopState) ?? "open",
		projectId: row["project_id"] != null ? String(row["project_id"]) : null,
		tags: parseTags(row["tags"]),
		openedAt: String(row["opened_at"]),
		closedAt: row["closed_at"] != null ? String(row["closed_at"]) : null,
		updatedAt: String(row["updated_at"]),
	};
}

export async function getLoops(
	db: DbClient,
	state?: LoopState,
): Promise<Loop[]> {
	const userId = getCurrentUserId();
	if (state) {
		const rows = await db.query(
			"SELECT * FROM loops WHERE user_id = ? AND state = ? ORDER BY weight DESC, opened_at DESC",
			[userId, state],
		);
		return rows.map(rowToLoop);
	}
	const rows = await db.query(
		"SELECT * FROM loops WHERE user_id = ? ORDER BY state ASC, weight DESC, opened_at DESC",
		[userId],
	);
	return rows.map(rowToLoop);
}

export async function insertLoop(
	db: DbClient,
	title: string,
	waitingOn: string | null,
	weight: number,
	projectId: string | null,
): Promise<Loop> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO loops (id, user_id, title, waiting_on, weight, state, project_id, tags, annotations, opened_at, closed_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, 'open', ?, NULL, NULL, ?, NULL, ?)`,
		[id, userId, title, waitingOn, weight, projectId, now, now],
	);
	return {
		id,
		title,
		waitingOn,
		weight,
		state: "open",
		projectId,
		tags: [],
		openedAt: now,
		closedAt: null,
		updatedAt: now,
	};
}

export async function closeLoopRow(db: DbClient, id: string): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		"UPDATE loops SET state = 'closed', closed_at = ?, updated_at = ? WHERE id = ? AND user_id = ?",
		[now, now, id, userId],
	);
}

export async function reopenLoopRow(db: DbClient, id: string): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		"UPDATE loops SET state = 'open', closed_at = NULL, updated_at = ? WHERE id = ? AND user_id = ?",
		[now, id, userId],
	);
}

export async function updateLoopRow(
	db: DbClient,
	id: string,
	fields: Partial<Pick<Loop, "title" | "waitingOn" | "weight" | "projectId">>,
): Promise<void> {
	const now = new Date().toISOString();
	const sets: string[] = ["updated_at = ?"];
	const params: unknown[] = [now];
	if (fields.title !== undefined) { sets.push("title = ?"); params.push(fields.title); }
	if (fields.waitingOn !== undefined) { sets.push("waiting_on = ?"); params.push(fields.waitingOn); }
	if (fields.weight !== undefined) { sets.push("weight = ?"); params.push(fields.weight); }
	if (fields.projectId !== undefined) { sets.push("project_id = ?"); params.push(fields.projectId); }
	const userId = getCurrentUserId();
	params.push(id, userId);
	await db.exec(`UPDATE loops SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`, params);
}

export async function deleteLoopRow(db: DbClient, id: string): Promise<void> {
	const userId = getCurrentUserId();
	await db.exec("DELETE FROM loops WHERE id = ? AND user_id = ?", [id, userId]);
}

export async function countOpenLoops(db: DbClient): Promise<number> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT COUNT(*) AS count FROM loops WHERE user_id = ? AND state = 'open'",
		[userId],
	);
	if (rows.length === 0 || rows[0] === undefined) return 0;
	return Number(rows[0]["count"] ?? 0);
}
