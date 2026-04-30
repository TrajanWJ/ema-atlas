/**
 * Week-scale context bundle. Used by the Rewind app (rule-based today,
 * AI-assisted later).
 */

import type { DbClient } from "@/src/db/client";
import { dayBundle } from "./bundle";
import type { DayBundle } from "./bundle";
import { getCurrentUserId } from "@/src/lib/current-user";

function pad(n: number): string {
	return n < 10 ? `0${n}` : `${n}`;
}

function isoDate(d: Date): string {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export interface WeekBundle {
	readonly weekStart: string;
	readonly weekEnd: string;
	readonly days: readonly DayBundle[];
	readonly tasksCompleted: number;
	readonly focusMinutes: number;
	readonly capturesTotal: number;
	readonly habitsCompleted: number;
	readonly loopsClosed: number;
	readonly topRightNowStates: readonly string[];
	readonly decisionsCount: number;
	readonly learningsCount: number;
}

export async function weekBundle(
	db: DbClient,
	endDate: Date = new Date(),
): Promise<WeekBundle> {
	const userId = getCurrentUserId();

	// Last 7 days ending today
	const days: DayBundle[] = [];
	for (let i = 6; i >= 0; i--) {
		const d = new Date(endDate);
		d.setDate(d.getDate() - i);
		const b = await dayBundle(db, isoDate(d));
		days.push(b);
	}

	const weekStart = days[0]?.date ?? isoDate(endDate);
	const weekEnd = days[days.length - 1]?.date ?? isoDate(endDate);

	const startIso = `${weekStart}T00:00:00.000Z`;
	const endIso = `${weekEnd}T23:59:59.999Z`;

	let tasksCompleted = 0;
	let loopsClosed = 0;
	let decisionsCount = 0;
	let learningsCount = 0;

	try {
		const r = await db.query(
			"SELECT COUNT(*) AS c FROM tasks WHERE user_id = ? AND completed_at IS NOT NULL AND completed_at >= ? AND completed_at <= ?",
			[userId, startIso, endIso],
		);
		tasksCompleted = r[0] ? Number(r[0]["c"] ?? 0) : 0;
	} catch {
		/* silent */
	}

	try {
		const r = await db.query(
			"SELECT COUNT(*) AS c FROM loops WHERE user_id = ? AND state = 'closed' AND closed_at >= ? AND closed_at <= ?",
			[userId, startIso, endIso],
		);
		loopsClosed = r[0] ? Number(r[0]["c"] ?? 0) : 0;
	} catch {
		/* silent */
	}

	try {
		const r = await db.query(
			"SELECT COUNT(*) AS c FROM decisions WHERE user_id = ? AND decided_at >= ? AND decided_at <= ?",
			[userId, startIso, endIso],
		);
		decisionsCount = r[0] ? Number(r[0]["c"] ?? 0) : 0;
	} catch {
		/* silent */
	}

	try {
		const r = await db.query(
			"SELECT COUNT(*) AS c FROM learning_log WHERE user_id = ? AND at >= ? AND at <= ?",
			[userId, startIso, endIso],
		);
		learningsCount = r[0] ? Number(r[0]["c"] ?? 0) : 0;
	} catch {
		/* silent */
	}

	// Pull top right-now states this week (top by frequency of distinct text)
	let topRightNowStates: string[] = [];
	try {
		const r = await db.query(
			"SELECT text, COUNT(*) AS c FROM right_now_states WHERE user_id = ? AND started_at >= ? AND started_at <= ? GROUP BY text ORDER BY c DESC LIMIT 5",
			[userId, startIso, endIso],
		);
		topRightNowStates = r.map((row) => String(row["text"] ?? "")).filter(Boolean);
	} catch {
		/* silent */
	}

	const focusMinutes = days.reduce((acc, d) => acc + d.focusMinutesTotal, 0);
	const capturesTotal = days.reduce((acc, d) => acc + d.capturesCount, 0);
	const habitsCompleted = days.reduce((acc, d) => acc + d.habitsDoneCount, 0);

	return {
		weekStart,
		weekEnd,
		days,
		tasksCompleted,
		focusMinutes,
		capturesTotal,
		habitsCompleted,
		loopsClosed,
		topRightNowStates,
		decisionsCount,
		learningsCount,
	};
}

export function composeWeekNarrative(bundle: WeekBundle): string {
	const parts: string[] = [];
	if (bundle.tasksCompleted > 0) {
		parts.push(
			`${bundle.tasksCompleted} ${bundle.tasksCompleted === 1 ? "task" : "tasks"} shipped`,
		);
	}
	if (bundle.focusMinutes > 0) {
		const hours = Math.floor(bundle.focusMinutes / 60);
		const mins = bundle.focusMinutes % 60;
		parts.push(`${hours > 0 ? `${hours}h ` : ""}${mins}m focused`);
	}
	if (bundle.loopsClosed > 0) {
		parts.push(`${bundle.loopsClosed} loops closed`);
	}
	if (bundle.capturesTotal > 0) {
		parts.push(`${bundle.capturesTotal} thoughts captured`);
	}
	if (bundle.habitsCompleted > 0) {
		parts.push(`${bundle.habitsCompleted} habit checks`);
	}
	if (bundle.decisionsCount > 0) {
		parts.push(`${bundle.decisionsCount} decisions logged`);
	}
	if (bundle.learningsCount > 0) {
		parts.push(`${bundle.learningsCount} learnings`);
	}
	if (parts.length === 0) return "This week was quiet — nothing logged.";
	return `This week: ${parts.join(", ")}.`;
}
