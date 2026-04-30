import { createId } from "../../lib/id";
import { getCurrentUserId } from "../../lib/current-user";
import type { Project, ProjectStatus } from "../../types/project";
import type { DbClient } from "../client";

function rowToProject(row: Record<string, unknown>): Project {
	return {
		id: String(row["id"]),
		title: String(row["title"]),
		description: row["description"] != null ? String(row["description"]) : null,
		color: row["color"] != null ? String(row["color"]) : null,
		status: (row["status"] as ProjectStatus) ?? "active",
		priority: Number(row["priority"] ?? 2),
		sortOrder: Number(row["sort_order"] ?? 0),
		createdAt: String(row["created_at"]),
		updatedAt: String(row["updated_at"]),
	};
}

export async function addProject(
	db: DbClient,
	title: string,
	description: string | null = null,
	color: string | null = null,
): Promise<Project> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO projects (id, user_id, title, description, color, status, priority, sort_order, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, 'active', 2, 0, ?, ?)`,
		[id, userId, title, description, color, now, now],
	);
	return {
		id,
		title,
		description,
		color,
		status: "active",
		priority: 2,
		sortOrder: 0,
		createdAt: now,
		updatedAt: now,
	};
}

export async function getProjects(
	db: DbClient,
	status?: ProjectStatus,
): Promise<Project[]> {
	const userId = getCurrentUserId();
	if (status !== undefined) {
		const rows = await db.query(
			"SELECT * FROM projects WHERE user_id = ? AND status = ? ORDER BY sort_order ASC, created_at DESC",
			[userId, status],
		);
		return rows.map(rowToProject);
	}
	const rows = await db.query(
		"SELECT * FROM projects WHERE user_id = ? ORDER BY status ASC, sort_order ASC, created_at DESC",
		[userId],
	);
	return rows.map(rowToProject);
}

export async function getActiveProjects(db: DbClient): Promise<Project[]> {
	return getProjects(db, "active");
}

export async function getProject(
	db: DbClient,
	id: string,
): Promise<Project | null> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM projects WHERE id = ? AND user_id = ? LIMIT 1",
		[id, userId],
	);
	if (rows.length === 0 || rows[0] === undefined) return null;
	return rowToProject(rows[0]);
}

export async function updateProject(
	db: DbClient,
	id: string,
	fields: Partial<Pick<Project, "title" | "description" | "color" | "status" | "priority" | "sortOrder">>,
): Promise<void> {
	const now = new Date().toISOString();
	const sets: string[] = ["updated_at = ?"];
	const params: unknown[] = [now];

	if (fields.title !== undefined) { sets.push("title = ?"); params.push(fields.title); }
	if (fields.description !== undefined) { sets.push("description = ?"); params.push(fields.description); }
	if (fields.color !== undefined) { sets.push("color = ?"); params.push(fields.color); }
	if (fields.status !== undefined) { sets.push("status = ?"); params.push(fields.status); }
	if (fields.priority !== undefined) { sets.push("priority = ?"); params.push(fields.priority); }
	if (fields.sortOrder !== undefined) { sets.push("sort_order = ?"); params.push(fields.sortOrder); }

	const userId = getCurrentUserId();
	params.push(id, userId);
	await db.exec(
		`UPDATE projects SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`,
		params,
	);
}

export async function deleteProject(db: DbClient, id: string): Promise<void> {
	const userId = getCurrentUserId();
	await db.exec("DELETE FROM projects WHERE id = ? AND user_id = ?", [id, userId]);
	// Detach project_id from tasks/notes/inbox rather than cascading deletes
	await db.exec("UPDATE tasks SET project_id = NULL WHERE project_id = ? AND user_id = ?", [id, userId]);
	await db.exec("UPDATE notes SET project_id = NULL WHERE project_id = ? AND user_id = ?", [id, userId]);
	await db.exec("UPDATE inbox SET project_id = NULL WHERE project_id = ? AND user_id = ?", [id, userId]);
}
