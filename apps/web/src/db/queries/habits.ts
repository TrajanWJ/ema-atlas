import { createId } from "../../lib/id";
import { getCurrentUserId } from "../../lib/current-user";
import type { Habit, HabitFrequency, HabitLog } from "../../types/habit";
import type { DbClient } from "../client";

// ----------------------------------------------------------------------------
// Row → domain mapping
// ----------------------------------------------------------------------------

function rowToHabit(row: Record<string, unknown>): Habit {
	return {
		id: String(row["id"]),
		name: String(row["name"]),
		frequency: (row["frequency"] as HabitFrequency) ?? "daily",
		target: row["target"] != null ? String(row["target"]) : null,
		active: row["active"] === 1 || row["active"] === true,
		sortOrder: Number(row["sort_order"] ?? 0),
		color: row["color"] != null ? String(row["color"]) : null,
		createdAt: String(row["created_at"]),
		updatedAt: String(row["updated_at"]),
	};
}

function rowToHabitLog(row: Record<string, unknown>): HabitLog {
	return {
		id: String(row["id"]),
		habitId: String(row["habit_id"]),
		date: String(row["date"]),
		completed: row["completed"] === 1 || row["completed"] === true,
		notes: row["notes"] != null ? String(row["notes"]) : null,
		updatedAt: String(row["updated_at"]),
	};
}

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------

export async function addHabit(
	db: DbClient,
	name: string,
	frequency: HabitFrequency = "daily",
	target: string | null = null,
	color: string | null = null,
): Promise<Habit> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO habits (id, name, frequency, target, active, sort_order, color, created_at, updated_at, user_id)
		 VALUES (?, ?, ?, ?, 1, 0, ?, ?, ?, ?)`,
		[id, name, frequency, target, color, now, now, userId],
	);
	return {
		id,
		name,
		frequency,
		target,
		active: true,
		sortOrder: 0,
		color,
		createdAt: now,
		updatedAt: now,
	};
}

export async function getActiveHabits(db: DbClient): Promise<Habit[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM habits WHERE active = 1 AND user_id = ? ORDER BY sort_order ASC, created_at ASC",
		[userId],
	);
	return rows.map(rowToHabit);
}

export async function archiveHabit(db: DbClient, id: string): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		"UPDATE habits SET active = 0, updated_at = ? WHERE id = ? AND user_id = ?",
		[now, id, userId],
	);
}

export async function getLogsForDate(
	db: DbClient,
	date: string,
): Promise<HabitLog[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM habit_logs WHERE date = ? AND user_id = ?",
		[date, userId],
	);
	return rows.map(rowToHabitLog);
}

export async function upsertHabitLog(
	db: DbClient,
	habitId: string,
	date: string,
	completed: boolean,
): Promise<HabitLog> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO habit_logs (id, habit_id, date, completed, notes, updated_at, user_id)
		 VALUES (?, ?, ?, ?, NULL, ?, ?)
		 ON CONFLICT(habit_id, date) DO UPDATE SET completed = excluded.completed, updated_at = excluded.updated_at`,
		[id, habitId, date, completed ? 1 : 0, now, userId],
	);
	// Return the current state after upsert
	const rows = await db.query(
		"SELECT * FROM habit_logs WHERE habit_id = ? AND date = ? AND user_id = ?",
		[habitId, date, userId],
	);
	if (rows.length === 0 || rows[0] === undefined) {
		return { id, habitId, date, completed, notes: null, updatedAt: now };
	}
	return rowToHabitLog(rows[0]);
}

export async function getLogsForHabit(
	db: DbClient,
	habitId: string,
	limit = 90,
): Promise<HabitLog[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM habit_logs WHERE habit_id = ? AND user_id = ? ORDER BY date DESC LIMIT ?",
		[habitId, userId, limit],
	);
	return rows.map(rowToHabitLog);
}

export async function getLogsForDateRange(
	db: DbClient,
	habitId: string,
	startDate: string,
	endDate: string,
): Promise<HabitLog[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM habit_logs WHERE habit_id = ? AND date >= ? AND date <= ? AND user_id = ? ORDER BY date ASC",
		[habitId, startDate, endDate, userId],
	);
	return rows.map(rowToHabitLog);
}

export async function getAllLogsForDateRange(
	db: DbClient,
	startDate: string,
	endDate: string,
): Promise<HabitLog[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM habit_logs WHERE date >= ? AND date <= ? AND user_id = ? ORDER BY date ASC",
		[startDate, endDate, userId],
	);
	return rows.map(rowToHabitLog);
}

export async function getAllLogsForHabit(
	db: DbClient,
	habitId: string,
): Promise<HabitLog[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM habit_logs WHERE habit_id = ? AND user_id = ? ORDER BY date ASC",
		[habitId, userId],
	);
	return rows.map(rowToHabitLog);
}
