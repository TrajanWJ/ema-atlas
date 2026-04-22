export interface Migration {
	readonly version: number;
	readonly sql: string;
}

export const migrations: readonly Migration[] = [
	{
		version: 1,
		sql: `
			CREATE TABLE IF NOT EXISTS _meta (
				key   TEXT PRIMARY KEY,
				value TEXT NOT NULL
			);

			CREATE TABLE IF NOT EXISTS inbox (
				id           TEXT PRIMARY KEY,
				content      TEXT NOT NULL,
				source       TEXT NOT NULL DEFAULT 'text',
				processed    INTEGER NOT NULL DEFAULT 0,
				action       TEXT,
				created_at   TEXT NOT NULL,
				processed_at TEXT,
				updated_at   TEXT NOT NULL
			);

			CREATE TABLE IF NOT EXISTS window_state (
				id         TEXT PRIMARY KEY,
				app_id     TEXT NOT NULL,
				x          REAL NOT NULL,
				y          REAL NOT NULL,
				width      REAL NOT NULL,
				height     REAL NOT NULL,
				z_index    INTEGER NOT NULL DEFAULT 0,
				minimized  INTEGER NOT NULL DEFAULT 0,
				maximized  INTEGER NOT NULL DEFAULT 0,
				updated_at TEXT NOT NULL
			);

			CREATE TABLE IF NOT EXISTS settings (
				key   TEXT PRIMARY KEY,
				value TEXT NOT NULL
			);
		`,
	},
	{
		version: 2,
		sql: `
			CREATE TABLE IF NOT EXISTS journal_entries (
				id          TEXT PRIMARY KEY,
				date        TEXT NOT NULL UNIQUE,
				content     TEXT NOT NULL DEFAULT '',
				one_thing   TEXT,
				mood        INTEGER,
				energy_p    INTEGER,
				energy_m    INTEGER,
				energy_e    INTEGER,
				gratitude   TEXT,
				tags        TEXT,
				created_at  TEXT NOT NULL,
				updated_at  TEXT NOT NULL
			);

			CREATE TABLE IF NOT EXISTS focus_sessions (
				id          TEXT PRIMARY KEY,
				started_at  TEXT NOT NULL,
				ended_at    TEXT,
				status      TEXT NOT NULL DEFAULT 'active',
				updated_at  TEXT NOT NULL
			);

			CREATE TABLE IF NOT EXISTS focus_blocks (
				id          TEXT PRIMARY KEY,
				session_id  TEXT NOT NULL,
				type        TEXT NOT NULL,
				target_ms   INTEGER NOT NULL,
				actual_ms   INTEGER,
				label       TEXT,
				tags        TEXT,
				started_at  TEXT NOT NULL,
				ended_at    TEXT,
				updated_at  TEXT NOT NULL
			);
		`,
	},
	{
		version: 3,
		sql: `
			CREATE TABLE IF NOT EXISTS tasks (
				id               TEXT PRIMARY KEY,
				title            TEXT NOT NULL,
				description      TEXT,
				priority         TEXT NOT NULL DEFAULT 'should',
				category         TEXT,
				status           TEXT NOT NULL DEFAULT 'pending',
				due_date         TEXT,
				goal_id          TEXT,
				sort_order       INTEGER NOT NULL DEFAULT 0,
				created_at       TEXT NOT NULL,
				completed_at     TEXT,
				incomplete_reason TEXT,
				updated_at       TEXT NOT NULL
			);

			CREATE TABLE IF NOT EXISTS goals (
				id          TEXT PRIMARY KEY,
				title       TEXT NOT NULL,
				level       TEXT NOT NULL,
				parent_id   TEXT,
				progress    INTEGER NOT NULL DEFAULT 0,
				status      TEXT NOT NULL DEFAULT 'active',
				target_date TEXT,
				created_at  TEXT NOT NULL,
				updated_at  TEXT NOT NULL
			);

			CREATE TABLE IF NOT EXISTS habits (
				id         TEXT PRIMARY KEY,
				name       TEXT NOT NULL,
				frequency  TEXT NOT NULL,
				target     TEXT,
				active     INTEGER NOT NULL DEFAULT 1,
				sort_order INTEGER NOT NULL DEFAULT 0,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);

			CREATE TABLE IF NOT EXISTS habit_logs (
				id         TEXT PRIMARY KEY,
				habit_id   TEXT NOT NULL,
				date       TEXT NOT NULL,
				completed  INTEGER NOT NULL DEFAULT 0,
				notes      TEXT,
				updated_at TEXT NOT NULL
			);

			CREATE TABLE IF NOT EXISTS reviews (
				id             TEXT PRIMARY KEY,
				type           TEXT NOT NULL,
				date           TEXT NOT NULL,
				wins           TEXT,
				challenges     TEXT,
				lessons        TEXT,
				next_one_thing TEXT,
				content        TEXT,
				created_at     TEXT NOT NULL,
				updated_at     TEXT NOT NULL
			);
		`,
	},
];
