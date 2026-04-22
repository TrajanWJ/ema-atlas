import type { DbClient } from "../db/client";

// ----------------------------------------------------------------------------
// Export shape
// ----------------------------------------------------------------------------

export interface ExportData {
	readonly version: 1;
	readonly exported_at: string;
	readonly tables: {
		readonly inbox: readonly Record<string, unknown>[];
		readonly journal_entries: readonly Record<string, unknown>[];
		readonly focus_sessions: readonly Record<string, unknown>[];
		readonly focus_blocks: readonly Record<string, unknown>[];
		readonly settings: readonly Record<string, unknown>[];
	};
}

// ----------------------------------------------------------------------------
// exportAllData
// ----------------------------------------------------------------------------

export async function exportAllData(db: DbClient): Promise<ExportData> {
	const [inbox, journal_entries, focus_sessions, focus_blocks, settings] =
		await Promise.all([
			db.query("SELECT * FROM inbox ORDER BY created_at ASC"),
			db.query("SELECT * FROM journal_entries ORDER BY date ASC"),
			db.query("SELECT * FROM focus_sessions ORDER BY started_at ASC"),
			db.query("SELECT * FROM focus_blocks ORDER BY started_at ASC"),
			db.query("SELECT * FROM settings ORDER BY key ASC"),
		]);

	return {
		version: 1,
		exported_at: new Date().toISOString(),
		tables: {
			inbox,
			journal_entries,
			focus_sessions,
			focus_blocks,
			settings,
		},
	};
}

// ----------------------------------------------------------------------------
// triggerJsonDownload — browser helper
// ----------------------------------------------------------------------------

export function triggerJsonDownload(data: ExportData): void {
	const date = new Date().toISOString().slice(0, 10);
	const filename = `place-org-backup-${date}.json`;
	const json = JSON.stringify(data, null, 2);
	const blob = new Blob([json], { type: "application/json" });
	triggerBlobDownload(blob, filename);
}

function triggerBlobDownload(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
