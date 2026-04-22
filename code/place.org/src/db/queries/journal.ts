import { createId } from "../../lib/id";
import { getCurrentUserId } from "../../lib/current-user";
import type { JournalEntry } from "../../types/journal";
import type { DbClient } from "../client";

// ----------------------------------------------------------------------------
// Row → domain mapping
// ----------------------------------------------------------------------------

function rowToJournalEntry(row: Record<string, unknown>): JournalEntry {
	return {
		id: String(row["id"]),
		date: String(row["date"]),
		content: String(row["content"] ?? ""),
		oneThing: row["one_thing"] != null ? String(row["one_thing"]) : null,
		mood: row["mood"] != null ? Number(row["mood"]) : null,
		energyP: row["energy_p"] != null ? Number(row["energy_p"]) : null,
		energyM: row["energy_m"] != null ? Number(row["energy_m"]) : null,
		energyE: row["energy_e"] != null ? Number(row["energy_e"]) : null,
		gratitude: row["gratitude"] != null ? String(row["gratitude"]) : null,
		tags: row["tags"] != null ? String(row["tags"]) : null,
		createdAt: String(row["created_at"]),
		updatedAt: String(row["updated_at"]),
	};
}

// ----------------------------------------------------------------------------
// Queries — all scoped to current user
// ----------------------------------------------------------------------------

export async function getEntry(
	db: DbClient,
	date: string,
): Promise<JournalEntry | null> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM journal_entries WHERE date = ? AND user_id = ?",
		[date, userId],
	);
	if (rows.length === 0 || rows[0] === undefined) return null;
	return rowToJournalEntry(rows[0]);
}

export async function saveEntry(
	db: DbClient,
	entry: JournalEntry,
): Promise<JournalEntry> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	const updatedEntry: JournalEntry = { ...entry, updatedAt: now };

	await db.exec(
		`INSERT OR REPLACE INTO journal_entries
			(id, date, content, one_thing, mood, energy_p, energy_m, energy_e, gratitude, tags, created_at, updated_at, user_id)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			updatedEntry.id,
			updatedEntry.date,
			updatedEntry.content,
			updatedEntry.oneThing,
			updatedEntry.mood,
			updatedEntry.energyP,
			updatedEntry.energyM,
			updatedEntry.energyE,
			updatedEntry.gratitude,
			updatedEntry.tags,
			updatedEntry.createdAt,
			updatedEntry.updatedAt,
			userId,
		],
	);

	return updatedEntry;
}

export async function createEntry(
	db: DbClient,
	date: string,
	content: string,
): Promise<JournalEntry> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	const entry: JournalEntry = {
		id,
		date,
		content,
		oneThing: null,
		mood: null,
		energyP: null,
		energyM: null,
		energyE: null,
		gratitude: null,
		tags: null,
		createdAt: now,
		updatedAt: now,
	};

	await db.exec(
		`INSERT INTO journal_entries
			(id, date, content, one_thing, mood, energy_p, energy_m, energy_e, gratitude, tags, created_at, updated_at, user_id)
		 VALUES (?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?, ?, ?)`,
		[id, date, content, now, now, userId],
	);

	return entry;
}

export async function listEntries(
	db: DbClient,
	limit = 30,
): Promise<JournalEntry[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM journal_entries WHERE user_id = ? ORDER BY date DESC LIMIT ?",
		[userId, limit],
	);
	return rows.map(rowToJournalEntry);
}

export async function searchEntries(
	db: DbClient,
	query: string,
): Promise<JournalEntry[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM journal_entries WHERE user_id = ? AND (content LIKE ? OR one_thing LIKE ?) ORDER BY date DESC LIMIT 20",
		[userId, `%${query}%`, `%${query}%`],
	);
	return rows.map(rowToJournalEntry);
}
