import { createId } from "../../lib/id";
import { getCurrentUserId } from "../../lib/current-user";
import type { Goal, GoalLevel, GoalStatus } from "../../types/goal";
import type { DbClient } from "../client";

// ----------------------------------------------------------------------------
// Row → domain mapping
// ----------------------------------------------------------------------------

function rowToGoal(row: Record<string, unknown>): Goal {
	return {
		id: String(row["id"]),
		title: String(row["title"]),
		level: (row["level"] as GoalLevel) ?? "weekly",
		parentId: row["parent_id"] != null ? String(row["parent_id"]) : null,
		progress: Number(row["progress"] ?? 0),
		status: (row["status"] as GoalStatus) ?? "active",
		targetDate: row["target_date"] != null ? String(row["target_date"]) : null,
		createdAt: String(row["created_at"]),
		updatedAt: String(row["updated_at"]),
	};
}

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------

export async function addGoal(
	db: DbClient,
	title: string,
	level: GoalLevel,
	parentId: string | null = null,
): Promise<Goal> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO goals (id, title, level, parent_id, progress, status, target_date, created_at, updated_at, user_id)
		 VALUES (?, ?, ?, ?, 0, 'active', NULL, ?, ?, ?)`,
		[id, title, level, parentId, now, now, userId],
	);
	return {
		id,
		title,
		level,
		parentId,
		progress: 0,
		status: "active",
		targetDate: null,
		createdAt: now,
		updatedAt: now,
	};
}

export async function getGoals(db: DbClient, status?: GoalStatus): Promise<Goal[]> {
	const userId = getCurrentUserId();
	if (status !== undefined) {
		const rows = await db.query(
			"SELECT * FROM goals WHERE status = ? AND user_id = ? ORDER BY created_at ASC",
			[status, userId],
		);
		return rows.map(rowToGoal);
	}
	const rows = await db.query(
		"SELECT * FROM goals WHERE user_id = ? ORDER BY created_at ASC",
		[userId],
	);
	return rows.map(rowToGoal);
}

export async function updateGoal(
	db: DbClient,
	id: string,
	fields: Partial<Pick<Goal, "title" | "progress" | "status" | "targetDate" | "parentId">>,
): Promise<void> {
	const now = new Date().toISOString();
	const sets: string[] = ["updated_at = ?"];
	const params: unknown[] = [now];

	if (fields.title !== undefined) { sets.push("title = ?"); params.push(fields.title); }
	if (fields.progress !== undefined) { sets.push("progress = ?"); params.push(fields.progress); }
	if (fields.status !== undefined) { sets.push("status = ?"); params.push(fields.status); }
	if (fields.targetDate !== undefined) { sets.push("target_date = ?"); params.push(fields.targetDate); }
	if (fields.parentId !== undefined) { sets.push("parent_id = ?"); params.push(fields.parentId); }

	const userId = getCurrentUserId();
	params.push(id);
	params.push(userId);
	await db.exec(`UPDATE goals SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`, params);
}

export async function deleteGoal(db: DbClient, id: string): Promise<void> {
	const userId = getCurrentUserId();
	await db.exec("DELETE FROM goals WHERE id = ? AND user_id = ?", [id, userId]);
}
