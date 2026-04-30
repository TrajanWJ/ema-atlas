import Database from 'better-sqlite3';
import path from 'path';
import { migrations } from './schema';

// ----------------------------------------------------------------------------
// Server-side SQLite database — persisted to disk
// ----------------------------------------------------------------------------

const DB_PATH = path.join(process.cwd(), 'data', 'place.db');

let db: Database.Database | null = null;

function ensureDataDir(): void {
	const fs = require('fs') as typeof import('fs');
	const dir = path.dirname(DB_PATH);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

export function getServerDb(): Database.Database {
	if (db) return db;

	ensureDataDir();
	db = new Database(DB_PATH);

	// Enable WAL mode for better concurrent read performance
	db.pragma('journal_mode = WAL');
	db.pragma('busy_timeout = 5000');

	runMigrations(db);
	return db;
}

function runMigrations(database: Database.Database): void {
	// Ensure _meta table exists
	database.exec(`
		CREATE TABLE IF NOT EXISTS _meta (
			key   TEXT PRIMARY KEY,
			value TEXT NOT NULL
		)
	`);

	const row = database.prepare(
		"SELECT value FROM _meta WHERE key = 'schema_version'"
	).get() as { value: string } | undefined;

	const currentVersion = row ? parseInt(row.value, 10) : 0;

	const pending = migrations.filter((m) => m.version > currentVersion);

	const runInTransaction = database.transaction(() => {
		for (const migration of pending) {
			database.exec(migration.sql);
			database.prepare(
				`INSERT INTO _meta (key, value) VALUES ('schema_version', ?)
				 ON CONFLICT(key) DO UPDATE SET value = ?`
			).run(String(migration.version), String(migration.version));
		}
	});

	if (pending.length > 0) {
		runInTransaction();
		console.log(`[db] Ran ${pending.length} migration(s), now at v${pending[pending.length - 1]?.version}`);
	}
}
