import { createId } from "../../lib/id";
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
// Queries
// ----------------------------------------------------------------------------

export async function getEntry(
	db: DbClient,
	date: string,
): Promise<JournalEntry | null> {
	const rows = await db.query(
		"SELECT * FROM journal_entries WHERE date = ?",
		[date],
	);
	if (rows.length === 0 || rows[0] === undefined) return null;
	return rowToJournalEntry(rows[0]);
}

export async function saveEntry(
	db: DbClient,
	entry: JournalEntry,
): Promise<JournalEntry> {
	const now = new Date().toISOString();
	const updatedEntry: JournalEntry = { ...entry, updatedAt: now };

	await db.exec(
		`INSERT INTO journal_entries
			(id, date, content, one_thing, mood, energy_p, energy_m, energy_e, gratitude, tags, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(id) DO UPDATE SET
			content = excluded.content,
			one_thing = excluded.one_thing,
			mood = excluded.mood,
			energy_p = excluded.energy_p,
			energy_m = excluded.energy_m,
			energy_e = excluded.energy_e,
			gratitude = excluded.gratitude,
			tags = excluded.tags,
			updated_at = excluded.updated_at`,
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
			(id, date, content, one_thing, mood, energy_p, energy_m, energy_e, gratitude, tags, created_at, updated_at)
		 VALUES (?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?, ?)`,
		[id, date, content, now, now],
	);

	return entry;
}

export async function listEntries(
	db: DbClient,
	limit = 30,
): Promise<JournalEntry[]> {
	const rows = await db.query(
		"SELECT * FROM journal_entries ORDER BY date DESC LIMIT ?",
		[limit],
	);
	return rows.map(rowToJournalEntry);
}

export async function searchEntries(
	db: DbClient,
	query: string,
): Promise<JournalEntry[]> {
	const rows = await db.query(
		"SELECT * FROM journal_entries WHERE content LIKE ? OR one_thing LIKE ? ORDER BY date DESC LIMIT 20",
		[`%${query}%`, `%${query}%`],
	);
	return rows.map(rowToJournalEntry);
}
