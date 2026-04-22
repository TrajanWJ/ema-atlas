import { createId } from "../../lib/id";
import { getCurrentUserId } from "../../lib/current-user";
import type { Responsibility, ResponsibilityCadence } from "../../types/responsibility";
import type { DbClient } from "../client";

function rowToResponsibility(row: Record<string, unknown>): Responsibility {
	return {
		id: String(row["id"]),
		title: String(row["title"]),
		description: row["description"] != null ? String(row["description"]) : null,
		role: row["role"] != null ? String(row["role"]) : null,
		cadence: row["cadence"] != null ? (String(row["cadence"]) as ResponsibilityCadence) : null,
		active: row["active"] === 1 || row["active"] === true,
		lastTouchedAt: row["last_touched_at"] != null ? String(row["last_touched_at"]) : null,
		sortOrder: Number(row["sort_order"] ?? 0),
		createdAt: String(row["created_at"]),
		updatedAt: String(row["updated_at"]),
	};
}

export async function addResponsibility(
	db: DbClient,
	title: string,
	role: string | null = null,
	cadence: ResponsibilityCadence | null = null,
): Promise<Responsibility> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO responsibilities (id, user_id, title, description, role, cadence, active, last_touched_at, sort_order, created_at, updated_at)
		 VALUES (?, ?, ?, NULL, ?, ?, 1, NULL, 0, ?, ?)`,
		[id, userId, title, role, cadence, now, now],
	);
	return {
		id,
		title,
		description: null,
		role,
		cadence,
		active: true,
		lastTouchedAt: null,
		sortOrder: 0,
		createdAt: now,
		updatedAt: now,
	};
}

export async function getResponsibilities(
	db: DbClient,
	activeOnly: boolean = false,
): Promise<Responsibility[]> {
	const userId = getCurrentUserId();
	if (activeOnly) {
		const rows = await db.query(
			"SELECT * FROM responsibilities WHERE user_id = ? AND active = 1 ORDER BY sort_order ASC, created_at DESC",
			[userId],
		);
		return rows.map(rowToResponsibility);
	}
	const rows = await db.query(
		"SELECT * FROM responsibilities WHERE user_id = ? ORDER BY active DESC, sort_order ASC, created_at DESC",
		[userId],
	);
	return rows.map(rowToResponsibility);
}

export async function getResponsibility(
	db: DbClient,
	id: string,
): Promise<Responsibility | null> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM responsibilities WHERE id = ? AND user_id = ? LIMIT 1",
		[id, userId],
	);
	if (rows.length === 0 || rows[0] === undefined) return null;
	return rowToResponsibility(rows[0]);
}

export async function updateResponsibility(
	db: DbClient,
	id: string,
	fields: Partial<Pick<Responsibility, "title" | "description" | "role" | "cadence" | "active" | "sortOrder">>,
): Promise<void> {
	const now = new Date().toISOString();
	const sets: string[] = ["updated_at = ?"];
	const params: unknown[] = [now];

	if (fields.title !== undefined) { sets.push("title = ?"); params.push(fields.title); }
	if (fields.description !== undefined) { sets.push("description = ?"); params.push(fields.description); }
	if (fields.role !== undefined) { sets.push("role = ?"); params.push(fields.role); }
	if (fields.cadence !== undefined) { sets.push("cadence = ?"); params.push(fields.cadence); }
	if (fields.active !== undefined) { sets.push("active = ?"); params.push(fields.active ? 1 : 0); }
	if (fields.sortOrder !== undefined) { sets.push("sort_order = ?"); params.push(fields.sortOrder); }

	const userId = getCurrentUserId();
	params.push(id, userId);
	await db.exec(
		`UPDATE responsibilities SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`,
		params,
	);
}

export async function touchResponsibility(
	db: DbClient,
	id: string,
): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		"UPDATE responsibilities SET last_touched_at = ?, updated_at = ? WHERE id = ? AND user_id = ?",
		[now, now, id, userId],
	);
}

export async function deleteResponsibility(
	db: DbClient,
	id: string,
): Promise<void> {
	const userId = getCurrentUserId();
	await db.exec("DELETE FROM responsibilities WHERE id = ? AND user_id = ?", [id, userId]);
	await db.exec(
		"UPDATE tasks SET responsibility_id = NULL WHERE responsibility_id = ? AND user_id = ?",
		[id, userId],
	);
}
