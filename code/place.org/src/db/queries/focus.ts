import { createId } from "../../lib/id";
import { getCurrentUserId } from "../../lib/current-user";
import type {
	FocusSession,
	FocusBlock,
	TodayFocusStats,
	TimeBlock,
	TimeBlockCategory,
	HistorySession,
	HistoryBlock,
	DailyHistory,
	WeeklySummary,
} from "../../types/focus";
import type { DbClient } from "../client";

// ----------------------------------------------------------------------------
// Row → domain mapping
// ----------------------------------------------------------------------------

function rowToFocusSession(row: Record<string, unknown>): FocusSession {
	return {
		id: String(row["id"]),
		startedAt: String(row["started_at"]),
		endedAt: row["ended_at"] != null ? String(row["ended_at"]) : null,
		status: (row["status"] as FocusSession["status"]) ?? "active",
		updatedAt: String(row["updated_at"]),
	};
}

function rowToFocusBlock(row: Record<string, unknown>): FocusBlock {
	return {
		id: String(row["id"]),
		sessionId: String(row["session_id"]),
		type: (row["type"] as FocusBlock["type"]) ?? "work",
		targetMs: Number(row["target_ms"]),
		actualMs: row["actual_ms"] != null ? Number(row["actual_ms"]) : null,
		label: row["label"] != null ? String(row["label"]) : null,
		tags: row["tags"] != null ? String(row["tags"]) : null,
		startedAt: String(row["started_at"]),
		endedAt: row["ended_at"] != null ? String(row["ended_at"]) : null,
		updatedAt: String(row["updated_at"]),
	};
}

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------

export async function startSession(db: DbClient): Promise<FocusSession> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO focus_sessions (id, started_at, ended_at, status, updated_at, user_id)
		 VALUES (?, ?, NULL, 'active', ?, ?)`,
		[id, now, now, userId],
	);
	return { id, startedAt: now, endedAt: null, status: "active", updatedAt: now };
}

export async function endSession(db: DbClient, id: string): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`UPDATE focus_sessions SET ended_at = ?, status = 'ended', updated_at = ? WHERE id = ? AND user_id = ?`,
		[now, now, id, userId],
	);
}

export async function addBlock(
	db: DbClient,
	block: Omit<FocusBlock, "id" | "updatedAt">,
): Promise<FocusBlock> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO focus_blocks
			(id, session_id, type, target_ms, actual_ms, label, tags, started_at, ended_at, updated_at, user_id)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			id,
			block.sessionId,
			block.type,
			block.targetMs,
			block.actualMs,
			block.label,
			block.tags,
			block.startedAt,
			block.endedAt,
			now,
			userId,
		],
	);
	return { ...block, id, updatedAt: now };
}

export async function updateBlock(
	db: DbClient,
	id: string,
	actualMs: number,
	endedAt: string,
): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`UPDATE focus_blocks SET actual_ms = ?, ended_at = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
		[actualMs, endedAt, now, id, userId],
	);
}

export async function getActiveSession(db: DbClient): Promise<FocusSession | null> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM focus_sessions WHERE status = 'active' AND user_id = ? ORDER BY started_at DESC LIMIT 1",
		[userId],
	);
	if (rows.length === 0 || rows[0] === undefined) return null;
	return rowToFocusSession(rows[0]);
}

export async function getTodayStats(db: DbClient): Promise<TodayFocusStats> {
	const today = new Date().toISOString().slice(0, 10);
	const userId = getCurrentUserId();

	const sessionRows = await db.query(
		`SELECT COUNT(*) as count FROM focus_sessions
		 WHERE date(started_at) = ? AND status = 'ended' AND user_id = ?`,
		[today, userId],
	);

	const blockRows = await db.query(
		`SELECT
			COUNT(*) as block_count,
			COALESCE(SUM(actual_ms), 0) as total_focus_ms,
			COALESCE(AVG(actual_ms), 0) as avg_block_ms
		 FROM focus_blocks fb
		 JOIN focus_sessions fs ON fb.session_id = fs.id
		 WHERE date(fb.started_at) = ? AND fb.type = 'work' AND fb.actual_ms IS NOT NULL AND fb.user_id = ?`,
		[today, userId],
	);

	const sessionCount = blockRows.length > 0 && sessionRows[0] !== undefined
		? Number(sessionRows[0]["count"])
		: 0;

	const blockData = blockRows.length > 0 && blockRows[0] !== undefined ? blockRows[0] : {};

	return {
		totalFocusMs: Number(blockData["total_focus_ms"] ?? 0),
		sessionCount,
		blockCount: Number(blockData["block_count"] ?? 0),
		avgBlockMs: Number(blockData["avg_block_ms"] ?? 0),
	};
}

// ----------------------------------------------------------------------------
// Time Blocks (day planner)
// ----------------------------------------------------------------------------

function rowToTimeBlock(row: Record<string, unknown>): TimeBlock {
	return {
		id: String(row["id"]),
		label: String(row["label"]),
		category: String(row["category"]) as TimeBlockCategory,
		startTime: String(row["start_time"]),
		endTime: String(row["end_time"]),
		date: String(row["date"]),
		createdAt: String(row["created_at"]),
		updatedAt: String(row["updated_at"]),
	};
}

export async function getTimeBlocksForDate(
	db: DbClient,
	date: string,
): Promise<readonly TimeBlock[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM time_blocks WHERE date = ? AND user_id = ? ORDER BY start_time ASC",
		[date, userId],
	);
	return rows.map(rowToTimeBlock);
}

export async function getTimeBlocksForDateRange(
	db: DbClient,
	startDate: string,
	endDate: string,
): Promise<readonly TimeBlock[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM time_blocks WHERE date >= ? AND date <= ? AND user_id = ? ORDER BY date ASC, start_time ASC",
		[startDate, endDate, userId],
	);
	return rows.map(rowToTimeBlock);
}

export async function getFocusBlocksForDateRange(
	db: DbClient,
	startDate: string,
	endDate: string,
): Promise<readonly FocusBlock[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		`SELECT * FROM focus_blocks
		 WHERE date(started_at) >= ? AND date(started_at) <= ?
		   AND actual_ms IS NOT NULL AND user_id = ?
		 ORDER BY started_at ASC`,
		[startDate, endDate, userId],
	);
	return rows.map(rowToFocusBlock);
}

export async function createTimeBlock(
	db: DbClient,
	block: Omit<TimeBlock, "id" | "createdAt" | "updatedAt">,
): Promise<TimeBlock> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO time_blocks (id, label, category, start_time, end_time, date, created_at, updated_at, user_id)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[id, block.label, block.category, block.startTime, block.endTime, block.date, now, now, userId],
	);
	return { ...block, id, createdAt: now, updatedAt: now };
}

export async function updateTimeBlock(
	db: DbClient,
	id: string,
	updates: Partial<Pick<TimeBlock, "label" | "category" | "startTime" | "endTime">>,
): Promise<void> {
	const now = new Date().toISOString();
	const sets: string[] = ["updated_at = ?"];
	const params: unknown[] = [now];

	if (updates.label !== undefined) {
		sets.push("label = ?");
		params.push(updates.label);
	}
	if (updates.category !== undefined) {
		sets.push("category = ?");
		params.push(updates.category);
	}
	if (updates.startTime !== undefined) {
		sets.push("start_time = ?");
		params.push(updates.startTime);
	}
	if (updates.endTime !== undefined) {
		sets.push("end_time = ?");
		params.push(updates.endTime);
	}
	const userId = getCurrentUserId();
	params.push(id);
	params.push(userId);
	await db.exec(`UPDATE time_blocks SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`, params);
}

export async function deleteTimeBlock(db: DbClient, id: string): Promise<void> {
	const userId = getCurrentUserId();
	await db.exec("DELETE FROM time_blocks WHERE id = ? AND user_id = ?", [id, userId]);
}

// ----------------------------------------------------------------------------
// History queries
// ----------------------------------------------------------------------------

export async function getSessionHistory(
	db: DbClient,
	limit = 30,
): Promise<readonly DailyHistory[]> {
	const userId = getCurrentUserId();
	const sessions = await db.query(
		`SELECT * FROM focus_sessions
		 WHERE status = 'ended' AND user_id = ?
		 ORDER BY started_at DESC
		 LIMIT ?`,
		[userId, limit],
	);

	if (sessions.length === 0) return [];

	const sessionIds = sessions.map((s) => String(s["id"]));
	const placeholders = sessionIds.map(() => "?").join(",");
	const blocks = await db.query(
		`SELECT * FROM focus_blocks
		 WHERE session_id IN (${placeholders})
		 ORDER BY started_at ASC`,
		sessionIds,
	);

	const blocksBySession = new Map<string, HistoryBlock[]>();
	for (const row of blocks) {
		const sid = String(row["session_id"]);
		const block: HistoryBlock = {
			id: String(row["id"]),
			type: (row["type"] as HistoryBlock["type"]) ?? "work",
			actualMs: row["actual_ms"] != null ? Number(row["actual_ms"]) : null,
			label: row["label"] != null ? String(row["label"]) : null,
			tags: row["tags"] != null ? String(row["tags"]) : null,
			startedAt: String(row["started_at"]),
		};
		const existing = blocksBySession.get(sid);
		if (existing) {
			existing.push(block);
		} else {
			blocksBySession.set(sid, [block]);
		}
	}

	const dailyMap = new Map<string, DailyHistory>();
	for (const row of sessions) {
		const session: HistorySession = {
			id: String(row["id"]),
			startedAt: String(row["started_at"]),
			endedAt: row["ended_at"] != null ? String(row["ended_at"]) : null,
			status: (row["status"] as HistorySession["status"]) ?? "ended",
			blocks: blocksBySession.get(String(row["id"])) ?? [],
		};
		const date = session.startedAt.slice(0, 10);
		const existing = dailyMap.get(date);
		if (existing) {
			const mutableSessions = [...existing.sessions, session];
			const totalMs = mutableSessions.reduce((sum, s) => {
				const blockMs = s.blocks
					.filter((b) => b.type === "work" && b.actualMs !== null)
					.reduce((bSum, b) => bSum + (b.actualMs ?? 0), 0);
				return sum + blockMs;
			}, 0);
			dailyMap.set(date, {
				date,
				sessions: mutableSessions,
				totalFocusMs: totalMs,
				sessionCount: mutableSessions.length,
			});
		} else {
			const blockMs = session.blocks
				.filter((b) => b.type === "work" && b.actualMs !== null)
				.reduce((sum, b) => sum + (b.actualMs ?? 0), 0);
			dailyMap.set(date, {
				date,
				sessions: [session],
				totalFocusMs: blockMs,
				sessionCount: 1,
			});
		}
	}

	return Array.from(dailyMap.values()).sort(
		(a, b) => b.date.localeCompare(a.date),
	);
}

export async function getWeeklySummary(
	db: DbClient,
): Promise<readonly WeeklySummary[]> {
	const userId = getCurrentUserId();
	const result: WeeklySummary[] = [];
	for (let i = 6; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		const dateStr = d.toISOString().slice(0, 10);
		const rows = await db.query(
			`SELECT COALESCE(SUM(fb.actual_ms), 0) as total
			 FROM focus_blocks fb
			 JOIN focus_sessions fs ON fb.session_id = fs.id
			 WHERE date(fb.started_at) = ? AND fb.type = 'work' AND fb.actual_ms IS NOT NULL AND fb.user_id = ?`,
			[dateStr, userId],
		);
		const total = rows.length > 0 && rows[0] !== undefined
			? Number(rows[0]["total"] ?? 0)
			: 0;
		result.push({ date: dateStr, focusMs: total });
	}
	return result;
}

export async function getTodayBlocks(
	db: DbClient,
): Promise<readonly FocusBlock[]> {
	const today = new Date().toISOString().slice(0, 10);
	const userId = getCurrentUserId();
	const rows = await db.query(
		`SELECT * FROM focus_blocks
		 WHERE date(started_at) = ? AND actual_ms IS NOT NULL AND user_id = ?
		 ORDER BY started_at ASC`,
		[today, userId],
	);
	return rows.map(rowToFocusBlock);
}
