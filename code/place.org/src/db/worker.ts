// Web Worker: runs SQLite WASM with OPFS persistence.
// This file is intentionally kept as a .ts shell that imports JS modules at
// runtime. wa-sqlite ships pre-built ESM (.mjs) files; importing them through
// Next.js's bundler is unreliable, so the worker resolves them via dynamic
// import relative to itself — which works correctly when the worker is loaded
// as a dedicated worker from the browser.
//
// NOTE: This worker MUST be loaded with { type: 'module' } in the Worker
// constructor (see client.ts) because it uses top-level ESM imports.

import type { DbRequest, DbResponse } from "../types/db";
import { runMigrations } from "./migrations";

// ----------------------------------------------------------------------------
// Types we use from wa-sqlite (lightweight, no full import needed at TS level)
// ----------------------------------------------------------------------------
interface SQLiteAPI {
	open_v2: (
		filename: string,
		flags?: number,
		vfs?: string,
	) => Promise<number>;
	exec: (
		db: number,
		sql: string,
		callback?: (row: unknown[], columns: string[]) => void | Promise<void>,
	) => Promise<number>;
	execWithParams: (
		db: number,
		sql: string,
		params: unknown[],
	) => Promise<{ rows: unknown[][]; columns: string[] }>;
	close: (db: number) => Promise<void>;
	vfs_register: (vfs: unknown, makeDefault?: boolean) => Promise<number>;
}

// ----------------------------------------------------------------------------
// State
// ----------------------------------------------------------------------------
let db: number | null = null;
let sqlite3: SQLiteAPI | null = null;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
function post(msg: DbResponse): void {
	self.postMessage(msg);
}

async function initDatabase(): Promise<void> {
	// Dynamic imports — resolved at worker runtime, not build time.
	// The async variant is required for OPFS (it uses Asyncify).
	const SQLiteModule = await import(
		/* @vite-ignore */
		"wa-sqlite/dist/wa-sqlite-async.mjs"
	);
	const { Factory } = await import(
		/* @vite-ignore */
		"wa-sqlite/src/sqlite-api.js"
	);
	const { AccessHandlePoolVFS } = await import(
		/* @vite-ignore */
		"wa-sqlite/src/examples/AccessHandlePoolVFS.js"
	);

	const module = await SQLiteModule.default();
	sqlite3 = Factory(module) as SQLiteAPI;

	// Register OPFS VFS and open the database
	const vfs = new AccessHandlePoolVFS("/place-org-db");
	await vfs.isReady;
	await sqlite3.vfs_register(vfs, /* makeDefault */ false);

	// SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE = 0x6
	db = await sqlite3.open_v2("place.db", 0x6, "AccessHandlePoolVFS");

	// Run migrations
	await runMigrations(
		async (sql) => {
			await sqlite3!.exec(db!, sql);
		},
		async (sql, params) => {
			if (params && params.length > 0) {
				const result = await sqlite3!.execWithParams(db!, sql, params as unknown[]);
				return result.rows.map((row) => {
					const obj: Record<string, unknown> = {};
					result.columns.forEach((col, i) => {
						obj[col] = row[i];
					});
					return obj;
				});
			}
			const rows: Record<string, unknown>[] = [];
			await sqlite3!.exec(db!, sql, (row, columns) => {
				const obj: Record<string, unknown> = {};
				columns.forEach((col, i) => {
					obj[col] = row[i];
				});
				rows.push(obj);
			});
			return rows;
		},
	);
}

// ----------------------------------------------------------------------------
// Message handler
// ----------------------------------------------------------------------------
self.onmessage = async (event: MessageEvent<DbRequest>) => {
	const req = event.data;

	try {
		switch (req.type) {
			case "init": {
				await initDatabase();
				const ready: DbResponse = { id: req.id, type: "ready" };
				post(ready);
				break;
			}

			case "exec": {
				if (!sqlite3 || db === null) {
					throw new Error("Database not initialised");
				}
				const { sql, params } = req;
				if (params && params.length > 0) {
					await sqlite3.execWithParams(db, sql, params as unknown[]);
				} else {
					await sqlite3.exec(db, sql);
				}
				const done: DbResponse = { id: req.id, type: "exec-done" };
				post(done);
				break;
			}

			case "query": {
				if (!sqlite3 || db === null) {
					throw new Error("Database not initialised");
				}
				const { sql, params } = req;
				let resultRows: Record<string, unknown>[];
				let resultColumns: string[];

				if (params && params.length > 0) {
					const result = await sqlite3.execWithParams(db, sql, params as unknown[]);
					resultColumns = result.columns;
					resultRows = result.rows.map((row) => {
						const obj: Record<string, unknown> = {};
						resultColumns.forEach((col, i) => {
							obj[col] = row[i];
						});
						return obj;
					});
				} else {
					resultRows = [];
					resultColumns = [];
					await sqlite3.exec(db, sql, (row, columns) => {
						if (resultColumns.length === 0) {
							resultColumns = columns;
						}
						const obj: Record<string, unknown> = {};
						columns.forEach((col, i) => {
							obj[col] = row[i];
						});
						resultRows.push(obj);
					});
				}

				const result: DbResponse = {
					id: req.id,
					type: "result",
					rows: resultRows,
					columns: resultColumns,
				};
				post(result);
				break;
			}

			default: {
				const _exhaustive: never = req;
				throw new Error(`Unknown request type: ${JSON.stringify(_exhaustive)}`);
			}
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		const error: DbResponse = { id: req.id, type: "error", message };
		post(error);
	}
};
