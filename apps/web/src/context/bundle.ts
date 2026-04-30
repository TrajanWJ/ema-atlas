/**
 * Context Bundle readers.
 *
 * These assemble serializable snapshots of place.org state for a time
 * window. Today: used by the Ledger, Pressure Gauge, Wormhole. Later: this
 * is the exact shape AI observers will receive as context.
 *
 * Never write from this module. Pure reads.
 */

import type { DbClient } from "@/src/db/client";
import { getCurrentState } from "@/src/db/queries/right-now";
import { countOpenLoops } from "@/src/db/queries/loops";
import { getPinnedTodayTasks } from "@/src/db/queries/tasks";
import { getWellnessCountsToday, getMorningIntent, getEveningClose } from "@/src/db/queries/trackers";
import { getCurrentUserId } from "@/src/lib/current-user";

export interface DayBundle {
	readonly date: string;
	readonly rightNowText: string | null;
	readonly rightNowStartedAt: string | null;
	readonly openLoopsCount: number;
	readonly pinnedTasksCount: number;
	readonly pinnedTasksDoneCount: number;
	readonly overdueTasksCount: number;
	readonly unprocessedInboxCount: number;
	readonly habitsDoneCount: number;
	readonly habitsTotalCount: number;
	readonly focusSessionCount: number;
	readonly focusMinutesTotal: number;
	readonly fluxEventCount: number;
	readonly wellness: { water: number; movement: number; meal: number };
	readonly morningIntent: string | null;
	readonly eveningClose: string | null;
	readonly capturesCount: number;
}

function todayLocal(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Assemble a DayBundle for the given date (defaults to today).
 * All queries are parallelized. Failures degrade to zero rather than throwing.
 */
export async function dayBundle(db: DbClient, date: string = todayLocal()): Promise<DayBundle> {
	const userId = getCurrentUserId();
	const dayStart = `${date}T00:00:00.000Z`;
	const dayEnd = `${date}T23:59:59.999Z`;

	const safeQuery = async <T>(sql: string, params: readonly unknown[], map: (rows: readonly Record<string, unknown>[]) => T, fallback: T): Promise<T> => {
		try {
			const rows = await db.query(sql, params);
			return map(rows);
		} catch {
			return fallback;
		}
	};

	const [
		rightNow,
		openLoops,
		pinnedTasks,
		overdueCount,
		unprocessedInbox,
		habits,
		focus,
		focusMinutes,
		fluxCount,
		wellness,
		morning,
		evening,
		capturesToday,
	] = await Promise.all([
		getCurrentState(db).catch(() => null),
		countOpenLoops(db).catch(() => 0),
		getPinnedTodayTasks(db).catch(() => []),
		safeQuery(
			"SELECT COUNT(*) AS c FROM tasks WHERE user_id = ? AND due_date IS NOT NULL AND due_date < ? AND status NOT IN ('complete','archived')",
			[userId, date],
			(rows) => (rows[0] ? Number(rows[0]["c"] ?? 0) : 0),
			0,
		),
		safeQuery(
			"SELECT COUNT(*) AS c FROM inbox WHERE user_id = ? AND processed = 0 AND (action IS NULL OR action != 'idea')",
			[userId],
			(rows) => (rows[0] ? Number(rows[0]["c"] ?? 0) : 0),
			0,
		),
		safeQuery(
			`SELECT
			   (SELECT COUNT(*) FROM habits WHERE user_id = ? AND active = 1) AS total,
			   (SELECT COUNT(*) FROM habit_logs WHERE user_id = ? AND date = ? AND completed = 1) AS done`,
			[userId, userId, date],
			(rows) => ({
				total: rows[0] ? Number(rows[0]["total"] ?? 0) : 0,
				done: rows[0] ? Number(rows[0]["done"] ?? 0) : 0,
			}),
			{ total: 0, done: 0 },
		),
		safeQuery(
			"SELECT COUNT(*) AS c FROM focus_sessions WHERE user_id = ? AND started_at >= ? AND started_at <= ?",
			[userId, dayStart, dayEnd],
			(rows) => (rows[0] ? Number(rows[0]["c"] ?? 0) : 0),
			0,
		),
		safeQuery(
			"SELECT COALESCE(SUM(actual_ms), 0) AS ms FROM focus_blocks WHERE user_id = ? AND started_at >= ? AND started_at <= ?",
			[userId, dayStart, dayEnd],
			(rows) => (rows[0] ? Math.round(Number(rows[0]["ms"] ?? 0) / 60000) : 0),
			0,
		),
		safeQuery(
			"SELECT COUNT(*) AS c FROM flux_entries WHERE user_id = ? AND date = ?",
			[userId, date],
			(rows) => (rows[0] ? Number(rows[0]["c"] ?? 0) : 0),
			0,
		),
		getWellnessCountsToday(db, date).catch(() => ({ water: 0, movement: 0, meal: 0 })),
		getMorningIntent(db, date).catch(() => null),
		getEveningClose(db, date).catch(() => null),
		safeQuery(
			"SELECT COUNT(*) AS c FROM inbox WHERE user_id = ? AND created_at >= ? AND created_at <= ?",
			[userId, dayStart, dayEnd],
			(rows) => (rows[0] ? Number(rows[0]["c"] ?? 0) : 0),
			0,
		),
	]);

	const pinnedDone = pinnedTasks.filter((t) => t.status === "complete").length;

	return {
		date,
		rightNowText: rightNow?.text ?? null,
		rightNowStartedAt: rightNow?.startedAt ?? null,
		openLoopsCount: openLoops,
		pinnedTasksCount: pinnedTasks.length,
		pinnedTasksDoneCount: pinnedDone,
		overdueTasksCount: overdueCount,
		unprocessedInboxCount: unprocessedInbox,
		habitsDoneCount: habits.done,
		habitsTotalCount: habits.total,
		focusSessionCount: focus,
		focusMinutesTotal: focusMinutes,
		fluxEventCount: fluxCount,
		wellness,
		morningIntent: morning?.text ?? null,
		eveningClose: evening?.text ?? null,
		capturesCount: capturesToday,
	};
}

/**
 * Pressure score 0-100 derived from the bundle. Not exposed to users as a
 * number — the Pressure Gauge and Latest Breath tiles interpret it tonally.
 */
export function pressureScore(bundle: DayBundle): number {
	let score = 0;
	score += Math.min(bundle.openLoopsCount * 8, 40);
	score += Math.min(bundle.overdueTasksCount * 10, 30);
	score += Math.min(bundle.unprocessedInboxCount * 3, 20);
	score += bundle.pinnedTasksCount > 8 ? 10 : 0;
	return Math.min(score, 100);
}

export function pressureTone(score: number): "calm" | "steady" | "loaded" | "heavy" {
	if (score < 20) return "calm";
	if (score < 45) return "steady";
	if (score < 70) return "loaded";
	return "heavy";
}

/** One-sentence Ledger composer, pure function over the bundle. */
export function composeLedger(bundle: DayBundle): string {
	const parts: string[] = [];
	if (bundle.pinnedTasksDoneCount > 0) {
		parts.push(
			`${bundle.pinnedTasksDoneCount} ${bundle.pinnedTasksDoneCount === 1 ? "task" : "tasks"} done`,
		);
	}
	if (bundle.focusMinutesTotal > 0) {
		const hours = Math.floor(bundle.focusMinutesTotal / 60);
		const mins = bundle.focusMinutesTotal % 60;
		parts.push(`${hours > 0 ? `${hours}h ` : ""}${mins}m focused`);
	}
	if (bundle.capturesCount > 0) {
		parts.push(
			`${bundle.capturesCount} ${bundle.capturesCount === 1 ? "thought" : "thoughts"} captured`,
		);
	}
	if (bundle.habitsDoneCount > 0) {
		parts.push(`${bundle.habitsDoneCount}/${bundle.habitsTotalCount} habits`);
	}
	if (bundle.openLoopsCount > 0) {
		parts.push(`${bundle.openLoopsCount} open loops`);
	}
	if (parts.length === 0) return "Today is quiet — nothing logged yet.";
	return `Today: ${parts.join(", ")}.`;
}

/** Breath sentence — gentle, tonal, non-numeric. */
export function composeBreath(bundle: DayBundle): string {
	const score = pressureScore(bundle);
	const tone = pressureTone(score);
	if (tone === "calm") return "You have space right now.";
	if (tone === "steady") return "You're moving at a steady pace.";
	if (tone === "loaded") return "You're carrying a lot. One thing at a time.";
	return "Heavy load. Close one loop, then breathe.";
}
