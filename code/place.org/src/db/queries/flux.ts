import { createId } from "../../lib/id";
import { getCurrentUserId } from "../../lib/current-user";
import type { DbClient } from "../client";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface FluxDbEntry {
	readonly id: string;
	readonly date: string;
	readonly appId: string;
	readonly eventType: string;
	readonly content: string;
	readonly metadata: string | null;
	readonly timestamp: number;
	readonly createdAt: string;
}

// ----------------------------------------------------------------------------
// Row mapping
// ----------------------------------------------------------------------------

function rowToFluxEntry(row: Record<string, unknown>): FluxDbEntry {
	return {
		id: String(row["id"]),
		date: String(row["date"]),
		appId: String(row["app_id"]),
		eventType: String(row["event_type"]),
		content: String(row["content"] ?? ""),
		metadata: row["metadata"] != null ? String(row["metadata"]) : null,
		timestamp: Number(row["timestamp"]),
		createdAt: String(row["created_at"]),
	};
}

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------

export async function addFluxEntry(
	db: DbClient,
	entry: Omit<FluxDbEntry, "id" | "createdAt">,
): Promise<FluxDbEntry> {
	const id = createId();
	const now = new Date().toISOString();

	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO flux_entries
			(id, date, app_id, event_type, content, metadata, timestamp, created_at, user_id)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			id,
			entry.date,
			entry.appId,
			entry.eventType,
			entry.content,
			entry.metadata,
			entry.timestamp,
			now,
			userId,
		],
	);

	return { ...entry, id, createdAt: now };
}

export async function getFluxEntriesForDate(
	db: DbClient,
	date: string,
): Promise<readonly FluxDbEntry[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM flux_entries WHERE date = ? AND user_id = ? ORDER BY timestamp ASC",
		[date, userId],
	);
	return rows.map(rowToFluxEntry);
}

export async function getFluxEntriesForRange(
	db: DbClient,
	startDate: string,
	endDate: string,
): Promise<readonly FluxDbEntry[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM flux_entries WHERE date >= ? AND date <= ? AND user_id = ? ORDER BY timestamp ASC",
		[startDate, endDate, userId],
	);
	return rows.map(rowToFluxEntry);
}
