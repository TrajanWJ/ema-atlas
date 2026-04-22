import { createId } from "../../lib/id";
import type { FocusSession, FocusBlock, TodayFocusStats } from "../../types/focus";
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
	await db.exec(
		`INSERT INTO focus_sessions (id, started_at, ended_at, status, updated_at)
		 VALUES (?, ?, NULL, 'active', ?)`,
		[id, now, now],
	);
	return { id, startedAt: now, endedAt: null, status: "active", updatedAt: now };
}

export async function endSession(db: DbClient, id: string): Promise<void> {
	const now = new Date().toISOString();
	await db.exec(
		`UPDATE focus_sessions SET ended_at = ?, status = 'ended', updated_at = ? WHERE id = ?`,
		[now, now, id],
	);
}

export async function addBlock(
	db: DbClient,
	block: Omit<FocusBlock, "id" | "updatedAt">,
): Promise<FocusBlock> {
	const id = createId();
	const now = new Date().toISOString();
	await db.exec(
		`INSERT INTO focus_blocks
			(id, session_id, type, target_ms, actual_ms, label, tags, started_at, ended_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
	await db.exec(
		`UPDATE focus_blocks SET actual_ms = ?, ended_at = ?, updated_at = ? WHERE id = ?`,
		[actualMs, endedAt, now, id],
	);
}

export async function getActiveSession(db: DbClient): Promise<FocusSession | null> {
	const rows = await db.query(
		"SELECT * FROM focus_sessions WHERE status = 'active' ORDER BY started_at DESC LIMIT 1",
	);
	if (rows.length === 0 || rows[0] === undefined) return null;
	return rowToFocusSession(rows[0]);
}

export async function getTodayStats(db: DbClient): Promise<TodayFocusStats> {
	const today = new Date().toISOString().slice(0, 10);

	const sessionRows = await db.query(
		`SELECT COUNT(*) as count FROM focus_sessions
		 WHERE date(started_at) = ? AND status = 'ended'`,
		[today],
	);

	const blockRows = await db.query(
		`SELECT
			COUNT(*) as block_count,
			COALESCE(SUM(actual_ms), 0) as total_focus_ms,
			COALESCE(AVG(actual_ms), 0) as avg_block_ms
		 FROM focus_blocks fb
		 JOIN focus_sessions fs ON fb.session_id = fs.id
		 WHERE date(fb.started_at) = ? AND fb.type = 'work' AND fb.actual_ms IS NOT NULL`,
		[today],
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
