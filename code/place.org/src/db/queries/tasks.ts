import { createId } from "../../lib/id";
import { getCurrentUserId } from "../../lib/current-user";
import type { Task, TaskPriority, TaskStatus, TaskSource, TaskEffort } from "../../types/task";
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
		projectId: row["project_id"] != null ? String(row["project_id"]) : null,
		responsibilityId: row["responsibility_id"] != null ? String(row["responsibility_id"]) : null,
		effort: row["effort"] != null ? (String(row["effort"]) as TaskEffort) : null,
		pinnedToday: row["pinned_today"] === 1 || row["pinned_today"] === true,
		source: (row["source"] as TaskSource) ?? "manual",
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
	status: TaskStatus = "backlog",
	existingId?: string,
	opts?: {
		readonly projectId?: string | null;
		readonly responsibilityId?: string | null;
		readonly source?: TaskSource;
		readonly pinnedToday?: boolean;
		readonly effort?: TaskEffort | null;
	},
): Promise<Task> {
	const id = existingId ?? createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	const projectId = opts?.projectId ?? null;
	const responsibilityId = opts?.responsibilityId ?? null;
	const source: TaskSource = opts?.source ?? "manual";
	const pinnedToday = opts?.pinnedToday ? 1 : 0;
	const effort = opts?.effort ?? null;
	await db.exec(
		`INSERT INTO tasks (id, title, description, priority, category, status, due_date, goal_id, sort_order, created_at, completed_at, incomplete_reason, updated_at, user_id, project_id, responsibility_id, effort, pinned_today, source)
		 VALUES (?, ?, NULL, ?, ?, ?, NULL, NULL, 0, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?)`,
		[id, title, priority, category, status, now, now, userId, projectId, responsibilityId, effort, pinnedToday, source],
	);
	return {
		id,
		title,
		description: null,
		priority,
		category,
		status,
		dueDate: null,
		goalId: null,
		projectId,
		responsibilityId,
		effort,
		pinnedToday: pinnedToday === 1,
		source,
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
	const userId = getCurrentUserId();
	if (status !== undefined) {
		const rows = await db.query(
			"SELECT * FROM tasks WHERE status = ? AND user_id = ? ORDER BY sort_order ASC, created_at ASC",
			[status, userId],
		);
		return rows.map(rowToTask);
	}
	const rows = await db.query(
		"SELECT * FROM tasks WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC",
		[userId],
	);
	return rows.map(rowToTask);
}

export async function updateTask(
	db: DbClient,
	id: string,
	fields: Partial<Pick<Task, "title" | "description" | "priority" | "category" | "status" | "dueDate" | "goalId" | "projectId" | "responsibilityId" | "effort" | "pinnedToday" | "source" | "sortOrder">>,
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
	if (fields.projectId !== undefined) { sets.push("project_id = ?"); params.push(fields.projectId); }
	if (fields.responsibilityId !== undefined) { sets.push("responsibility_id = ?"); params.push(fields.responsibilityId); }
	if (fields.effort !== undefined) { sets.push("effort = ?"); params.push(fields.effort); }
	if (fields.pinnedToday !== undefined) { sets.push("pinned_today = ?"); params.push(fields.pinnedToday ? 1 : 0); }
	if (fields.source !== undefined) { sets.push("source = ?"); params.push(fields.source); }
	if (fields.sortOrder !== undefined) { sets.push("sort_order = ?"); params.push(fields.sortOrder); }

	params.push(id);
	const userId = getCurrentUserId();
	params.push(userId);
	await db.exec(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`, params);
}

export async function getPinnedTodayTasks(db: DbClient): Promise<Task[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		`SELECT * FROM tasks
		  WHERE user_id = ? AND pinned_today = 1 AND status != 'complete' AND status != 'archived'
		  ORDER BY
		    CASE priority WHEN 'must' THEN 0 WHEN 'should' THEN 1 WHEN 'could' THEN 2 ELSE 3 END,
		    sort_order ASC, created_at ASC`,
		[userId],
	);
	return rows.map(rowToTask);
}

export async function getTasksByProject(db: DbClient, projectId: string): Promise<Task[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM tasks WHERE user_id = ? AND project_id = ? ORDER BY sort_order ASC, created_at ASC",
		[userId, projectId],
	);
	return rows.map(rowToTask);
}

export async function getTasksByResponsibility(db: DbClient, responsibilityId: string): Promise<Task[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM tasks WHERE user_id = ? AND responsibility_id = ? ORDER BY sort_order ASC, created_at ASC",
		[userId, responsibilityId],
	);
	return rows.map(rowToTask);
}

export async function completeTask(db: DbClient, id: string): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		"UPDATE tasks SET status = 'complete', completed_at = ?, updated_at = ? WHERE id = ? AND user_id = ?",
		[now, now, id, userId],
	);
}

export async function archiveTask(db: DbClient, id: string): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		"UPDATE tasks SET status = 'archived', updated_at = ? WHERE id = ? AND user_id = ?",
		[now, id, userId],
	);
}

export async function reorderTask(
	db: DbClient,
	id: string,
	newOrder: number,
): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		"UPDATE tasks SET sort_order = ?, updated_at = ? WHERE id = ? AND user_id = ?",
		[newOrder, now, id, userId],
	);
}

export async function getOverdueCount(db: DbClient): Promise<number> {
	const today = new Date().toISOString().slice(0, 10);
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT COUNT(*) AS count FROM tasks WHERE status = 'pending' AND due_date IS NOT NULL AND due_date < ? AND user_id = ?",
		[today, userId],
	);
	if (rows.length === 0 || rows[0] === undefined) return 0;
	return Number(rows[0]["count"]);
}
