import type { DbClient } from "../db/client";
import type { ExportData } from "./data-export";

// ----------------------------------------------------------------------------
// Import result
// ----------------------------------------------------------------------------

export interface ImportResult {
	readonly imported: number;
	readonly skipped: number;
	readonly errors: readonly string[];
}

// ----------------------------------------------------------------------------
// Validation helpers
// ----------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isRecordArray(v: unknown): v is readonly Record<string, unknown>[] {
	return Array.isArray(v) && v.every(isRecord);
}

function validateExportShape(raw: unknown): ExportData {
	if (!isRecord(raw)) {
		throw new Error("Import data must be a JSON object");
	}

	if (raw["version"] !== 1) {
		throw new Error(
			`Unsupported backup version: ${String(raw["version"])}. Expected 1.`,
		);
	}

	if (typeof raw["exported_at"] !== "string") {
		throw new Error("Missing or invalid exported_at field");
	}

	const tables = raw["tables"];
	if (!isRecord(tables)) {
		throw new Error("Missing or invalid tables field");
	}

	const requiredTables = [
		"inbox",
		"journal_entries",
		"focus_sessions",
		"focus_blocks",
		"settings",
	] as const;

	for (const table of requiredTables) {
		if (!isRecordArray(tables[table])) {
			throw new Error(
				`Table "${table}" is missing or not an array of objects`,
			);
		}
	}

	return raw as unknown as ExportData;
}

// ----------------------------------------------------------------------------
// Per-table upsert logic
// ----------------------------------------------------------------------------

async function upsertInbox(
	db: DbClient,
	rows: readonly Record<string, unknown>[],
): Promise<{ imported: number; skipped: number; errors: string[] }> {
	let imported = 0;
	let skipped = 0;
	const errors: string[] = [];

	for (const row of rows) {
		if (typeof row["id"] !== "string" || !row["id"]) {
			errors.push(`inbox row missing id: ${JSON.stringify(row)}`);
			skipped++;
			continue;
		}
		try {
			await db.exec(
				`INSERT INTO inbox
					(id, content, source, processed, action, created_at, processed_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
				 ON CONFLICT(id) DO UPDATE SET
					content = excluded.content,
					source = excluded.source,
					processed = excluded.processed,
					action = excluded.action,
					processed_at = excluded.processed_at,
					updated_at = excluded.updated_at`,
				[
					row["id"],
					row["content"] ?? "",
					row["source"] ?? "text",
					row["processed"] ?? 0,
					row["action"] ?? null,
					row["created_at"] ?? new Date().toISOString(),
					row["processed_at"] ?? null,
					row["updated_at"] ?? new Date().toISOString(),
				],
			);
			imported++;
		} catch (err) {
			errors.push(`inbox[${row["id"]}]: ${String(err)}`);
			skipped++;
		}
	}

	return { imported, skipped, errors };
}

async function upsertJournalEntries(
	db: DbClient,
	rows: readonly Record<string, unknown>[],
): Promise<{ imported: number; skipped: number; errors: string[] }> {
	let imported = 0;
	let skipped = 0;
	const errors: string[] = [];

	for (const row of rows) {
		if (typeof row["id"] !== "string" || !row["id"]) {
			errors.push(`journal_entries row missing id: ${JSON.stringify(row)}`);
			skipped++;
			continue;
		}
		try {
			await db.exec(
				`INSERT INTO journal_entries
					(id, date, content, one_thing, mood, energy_p, energy_m, energy_e, gratitude, tags, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				 ON CONFLICT(id) DO UPDATE SET
					date = excluded.date,
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
					row["id"],
					row["date"] ?? "",
					row["content"] ?? "",
					row["one_thing"] ?? null,
					row["mood"] ?? null,
					row["energy_p"] ?? null,
					row["energy_m"] ?? null,
					row["energy_e"] ?? null,
					row["gratitude"] ?? null,
					row["tags"] ?? null,
					row["created_at"] ?? new Date().toISOString(),
					row["updated_at"] ?? new Date().toISOString(),
				],
			);
			imported++;
		} catch (err) {
			errors.push(`journal_entries[${row["id"]}]: ${String(err)}`);
			skipped++;
		}
	}

	return { imported, skipped, errors };
}

async function upsertFocusSessions(
	db: DbClient,
	rows: readonly Record<string, unknown>[],
): Promise<{ imported: number; skipped: number; errors: string[] }> {
	let imported = 0;
	let skipped = 0;
	const errors: string[] = [];

	for (const row of rows) {
		if (typeof row["id"] !== "string" || !row["id"]) {
			errors.push(`focus_sessions row missing id: ${JSON.stringify(row)}`);
			skipped++;
			continue;
		}
		try {
			await db.exec(
				`INSERT INTO focus_sessions
					(id, started_at, ended_at, status, updated_at)
				 VALUES (?, ?, ?, ?, ?)
				 ON CONFLICT(id) DO UPDATE SET
					started_at = excluded.started_at,
					ended_at = excluded.ended_at,
					status = excluded.status,
					updated_at = excluded.updated_at`,
				[
					row["id"],
					row["started_at"] ?? new Date().toISOString(),
					row["ended_at"] ?? null,
					row["status"] ?? "ended",
					row["updated_at"] ?? new Date().toISOString(),
				],
			);
			imported++;
		} catch (err) {
			errors.push(`focus_sessions[${row["id"]}]: ${String(err)}`);
			skipped++;
		}
	}

	return { imported, skipped, errors };
}

async function upsertFocusBlocks(
	db: DbClient,
	rows: readonly Record<string, unknown>[],
): Promise<{ imported: number; skipped: number; errors: string[] }> {
	let imported = 0;
	let skipped = 0;
	const errors: string[] = [];

	for (const row of rows) {
		if (typeof row["id"] !== "string" || !row["id"]) {
			errors.push(`focus_blocks row missing id: ${JSON.stringify(row)}`);
			skipped++;
			continue;
		}
		try {
			await db.exec(
				`INSERT INTO focus_blocks
					(id, session_id, type, target_ms, actual_ms, label, tags, started_at, ended_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				 ON CONFLICT(id) DO UPDATE SET
					session_id = excluded.session_id,
					type = excluded.type,
					target_ms = excluded.target_ms,
					actual_ms = excluded.actual_ms,
					label = excluded.label,
					tags = excluded.tags,
					started_at = excluded.started_at,
					ended_at = excluded.ended_at,
					updated_at = excluded.updated_at`,
				[
					row["id"],
					row["session_id"] ?? "",
					row["type"] ?? "work",
					row["target_ms"] ?? 0,
					row["actual_ms"] ?? null,
					row["label"] ?? null,
					row["tags"] ?? null,
					row["started_at"] ?? new Date().toISOString(),
					row["ended_at"] ?? null,
					row["updated_at"] ?? new Date().toISOString(),
				],
			);
			imported++;
		} catch (err) {
			errors.push(`focus_blocks[${row["id"]}]: ${String(err)}`);
			skipped++;
		}
	}

	return { imported, skipped, errors };
}

async function upsertSettings(
	db: DbClient,
	rows: readonly Record<string, unknown>[],
): Promise<{ imported: number; skipped: number; errors: string[] }> {
	let imported = 0;
	let skipped = 0;
	const errors: string[] = [];

	for (const row of rows) {
		if (typeof row["key"] !== "string" || !row["key"]) {
			errors.push(`settings row missing key: ${JSON.stringify(row)}`);
			skipped++;
			continue;
		}
		try {
			await db.exec(
				`INSERT INTO settings (key, value) VALUES (?, ?)
				 ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
				[row["key"], row["value"] ?? ""],
			);
			imported++;
		} catch (err) {
			errors.push(`settings[${row["key"]}]: ${String(err)}`);
			skipped++;
		}
	}

	return { imported, skipped, errors };
}

// ----------------------------------------------------------------------------
// importData — main entry point
// ----------------------------------------------------------------------------

export async function importData(
	db: DbClient,
	json: string,
): Promise<ImportResult> {
	let raw: unknown;
	try {
		raw = JSON.parse(json) as unknown;
	} catch {
		return {
			imported: 0,
			skipped: 0,
			errors: ["Failed to parse JSON: invalid format"],
		};
	}

	let data: ExportData;
	try {
		data = validateExportShape(raw);
	} catch (err) {
		return {
			imported: 0,
			skipped: 0,
			errors: [String(err)],
		};
	}

	const results = await Promise.all([
		upsertInbox(db, data.tables.inbox),
		upsertJournalEntries(db, data.tables.journal_entries),
		upsertFocusSessions(db, data.tables.focus_sessions),
		upsertFocusBlocks(db, data.tables.focus_blocks),
		upsertSettings(db, data.tables.settings),
	]);

	const imported = results.reduce((sum, r) => sum + r.imported, 0);
	const skipped = results.reduce((sum, r) => sum + r.skipped, 0);
	const errors = results.flatMap((r) => r.errors);

	return { imported, skipped, errors };
}

// ----------------------------------------------------------------------------
// previewImport — returns counts without writing
// ----------------------------------------------------------------------------

export interface ImportPreview {
	readonly inbox: number;
	readonly journal_entries: number;
	readonly focus_sessions: number;
	readonly focus_blocks: number;
	readonly settings: number;
	readonly total: number;
}

export function previewImport(json: string): ImportPreview | { error: string } {
	let raw: unknown;
	try {
		raw = JSON.parse(json) as unknown;
	} catch {
		return { error: "Invalid JSON" };
	}

	let data: ExportData;
	try {
		data = validateExportShape(raw);
	} catch (err) {
		return { error: String(err) };
	}

	const inbox = data.tables.inbox.length;
	const journal_entries = data.tables.journal_entries.length;
	const focus_sessions = data.tables.focus_sessions.length;
	const focus_blocks = data.tables.focus_blocks.length;
	const settings = data.tables.settings.length;

	return {
		inbox,
		journal_entries,
		focus_sessions,
		focus_blocks,
		settings,
		total: inbox + journal_entries + focus_sessions + focus_blocks + settings,
	};
}
