import { createId } from "../../lib/id";
import type { Task, TaskPriority, TaskStatus } from "../../types/task";
import type { DbClient } from "../client";

// ----------------------------------------------------------------------------
// Row → domain mapping
// ----------------------------------------------------------------------------

function rowToTask(row: Record<string, unknown>): Task {
	return {
		id: String(row["id"]),
		title: String(row["title"]),
		description: row["description"] != null ? String(row["description"]) : null,
		priority: (row["priority"] as TaskPriority) ?? "should",
		category: row["category"] != null ? String(row["category"]) : null,
		status: (row["status"] as TaskStatus) ?? "pending",
		dueDate: row["due_date"] != null ? String(row["due_date"]) : null,
		goalId: row["goal_id"] != null ? String(row["goal_id"]) : null,
		sortOrder: Number(row["sort_order"] ?? 0),
		createdAt: String(row["created_at"]),
		completedAt: row["completed_at"] != null ? String(row["completed_at"]) : null,
		incompleteReason: row["incomplete_reason"] != null ? String(row["incomplete_reason"]) : null,
		updatedAt: String(row["updated_at"]),
	};
}

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------

export async function addTask(
	db: DbClient,
	title: string,
	priority: TaskPriority = "should",
	category: string | null = null,
): Promise<Task> {
	const id = createId();
	const now = new Date().toISOString();
	await db.exec(
		`INSERT INTO tasks (id, title, description, priority, category, status, due_date, goal_id, sort_order, created_at, completed_at, incomplete_reason, updated_at)
		 VALUES (?, ?, NULL, ?, ?, 'pending', NULL, NULL, 0, ?, NULL, NULL, ?)`,
		[id, title, priority, category, now, now],
	);
	return {
		id,
		title,
		description: null,
		priority,
		category,
		status: "pending",
		dueDate: null,
		goalId: null,
		sortOrder: 0,
		createdAt: now,
		completedAt: null,
		incompleteReason: null,
		updatedAt: now,
	};
}

export async function getTasks(
	db: DbClient,
	status?: TaskStatus,
): Promise<Task[]> {
	if (status !== undefined) {
		const rows = await db.query(
			"SELECT * FROM tasks WHERE status = ? ORDER BY sort_order ASC, created_at ASC",
			[status],
		);
		return rows.map(rowToTask);
	}
	const rows = await db.query(
		"SELECT * FROM tasks ORDER BY sort_order ASC, created_at ASC",
	);
	return rows.map(rowToTask);
}

export async function updateTask(
	db: DbClient,
	id: string,
	fields: Partial<Pick<Task, "title" | "description" | "priority" | "category" | "status" | "dueDate" | "goalId" | "sortOrder">>,
): Promise<void> {
	const now = new Date().toISOString();
	const sets: string[] = ["updated_at = ?"];
	const params: unknown[] = [now];

	if (fields.title !== undefined) { sets.push("title = ?"); params.push(fields.title); }
	if (fields.description !== undefined) { sets.push("description = ?"); params.push(fields.description); }
	if (fields.priority !== undefined) { sets.push("priority = ?"); params.push(fields.priority); }
	if (fields.category !== undefined) { sets.push("category = ?"); params.push(fields.category); }
	if (fields.status !== undefined) { sets.push("status = ?"); params.push(fields.status); }
	if (fields.dueDate !== undefined) { sets.push("due_date = ?"); params.push(fields.dueDate); }
	if (fields.goalId !== undefined) { sets.push("goal_id = ?"); params.push(fields.goalId); }
	if (fields.sortOrder !== undefined) { sets.push("sort_order = ?"); params.push(fields.sortOrder); }

	params.push(id);
	await db.exec(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`, params);
}

export async function completeTask(db: DbClient, id: string): Promise<void> {
	const now = new Date().toISOString();
	await db.exec(
		"UPDATE tasks SET status = 'complete', completed_at = ?, updated_at = ? WHERE id = ?",
		[now, now, id],
	);
}

export async function archiveTask(db: DbClient, id: string): Promise<void> {
	const now = new Date().toISOString();
	await db.exec(
		"UPDATE tasks SET status = 'archived', updated_at = ? WHERE id = ?",
		[now, id],
	);
}

export async function reorderTask(
	db: DbClient,
	id: string,
	newOrder: number,
): Promise<void> {
	const now = new Date().toISOString();
	await db.exec(
		"UPDATE tasks SET sort_order = ?, updated_at = ? WHERE id = ?",
		[newOrder, now, id],
	);
}

export async function getOverdueCount(db: DbClient): Promise<number> {
	const today = new Date().toISOString().slice(0, 10);
	const rows = await db.query(
		"SELECT COUNT(*) AS count FROM tasks WHERE status = 'pending' AND due_date IS NOT NULL AND due_date < ?",
		[today],
	);
	if (rows.length === 0 || rows[0] === undefined) return 0;
	return Number(rows[0]["count"]);
}
