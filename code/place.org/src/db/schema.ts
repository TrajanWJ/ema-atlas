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
	{
		version: 4,
		sql: `
			ALTER TABLE habits ADD COLUMN color TEXT;
		`,
	},
	{
		version: 5,
		sql: `
			CREATE TABLE IF NOT EXISTS time_blocks (
				id         TEXT PRIMARY KEY,
				label      TEXT NOT NULL,
				category   TEXT NOT NULL DEFAULT 'deep-work',
				start_time TEXT NOT NULL,
				end_time   TEXT NOT NULL,
				date       TEXT NOT NULL,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);
		`,
	},
	{
		version: 6,
		sql: `
			CREATE TABLE IF NOT EXISTS notes (
				id          TEXT PRIMARY KEY,
				title       TEXT NOT NULL DEFAULT 'Untitled',
				content     TEXT NOT NULL DEFAULT '',
				pinned      INTEGER NOT NULL DEFAULT 0,
				archived    INTEGER NOT NULL DEFAULT 0,
				source_id   TEXT,
				source_type TEXT,
				created_at  TEXT NOT NULL,
				updated_at  TEXT NOT NULL
			);
		`,
	},
	{
		version: 7,
		sql: `
			CREATE TABLE IF NOT EXISTS flux_entries (
				id          TEXT PRIMARY KEY,
				date        TEXT NOT NULL,
				app_id      TEXT NOT NULL,
				event_type  TEXT NOT NULL,
				content     TEXT NOT NULL,
				metadata    TEXT,
				timestamp   INTEGER NOT NULL,
				created_at  TEXT NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_flux_date ON flux_entries(date);
		`,
	},
	{
		version: 8,
		sql: `
			ALTER TABLE inbox ADD COLUMN user_id TEXT NOT NULL DEFAULT 'guest';
			ALTER TABLE journal_entries ADD COLUMN user_id TEXT NOT NULL DEFAULT 'guest';
			CREATE INDEX IF NOT EXISTS idx_inbox_user ON inbox(user_id);
			CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_entries(user_id);
		`,
	},
	{
		version: 9,
		sql: `
			ALTER TABLE tasks ADD COLUMN user_id TEXT NOT NULL DEFAULT 'guest';
			ALTER TABLE goals ADD COLUMN user_id TEXT NOT NULL DEFAULT 'guest';
			ALTER TABLE habits ADD COLUMN user_id TEXT NOT NULL DEFAULT 'guest';
			ALTER TABLE habit_logs ADD COLUMN user_id TEXT NOT NULL DEFAULT 'guest';
			ALTER TABLE focus_sessions ADD COLUMN user_id TEXT NOT NULL DEFAULT 'guest';
			ALTER TABLE focus_blocks ADD COLUMN user_id TEXT NOT NULL DEFAULT 'guest';
			ALTER TABLE time_blocks ADD COLUMN user_id TEXT NOT NULL DEFAULT 'guest';
			ALTER TABLE notes ADD COLUMN user_id TEXT NOT NULL DEFAULT 'guest';
			ALTER TABLE flux_entries ADD COLUMN user_id TEXT NOT NULL DEFAULT 'guest';
			ALTER TABLE window_state ADD COLUMN user_id TEXT NOT NULL DEFAULT 'guest';

			CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
			CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
			CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);
			CREATE INDEX IF NOT EXISTS idx_habit_logs_user ON habit_logs(user_id);
			CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON focus_sessions(user_id);
			CREATE INDEX IF NOT EXISTS idx_focus_blocks_user ON focus_blocks(user_id);
			CREATE INDEX IF NOT EXISTS idx_time_blocks_user ON time_blocks(user_id);
			CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
			CREATE INDEX IF NOT EXISTS idx_flux_user ON flux_entries(user_id);
		`,
	},
	{
		version: 10,
		sql: `
			CREATE TABLE IF NOT EXISTS virtual_folders (
				id         TEXT PRIMARY KEY,
				user_id    TEXT NOT NULL DEFAULT 'guest',
				name       TEXT NOT NULL,
				parent_id  TEXT,
				is_system  INTEGER NOT NULL DEFAULT 0,
				sort_order INTEGER NOT NULL DEFAULT 0,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_vfolders_user ON virtual_folders(user_id);
			CREATE INDEX IF NOT EXISTS idx_vfolders_parent ON virtual_folders(parent_id);

			CREATE TABLE IF NOT EXISTS files (
				id          TEXT PRIMARY KEY,
				user_id     TEXT NOT NULL DEFAULT 'guest',
				folder_id   TEXT NOT NULL DEFAULT 'desktop',
				filename    TEXT NOT NULL,
				mime_type   TEXT NOT NULL DEFAULT 'application/octet-stream',
				size_bytes  INTEGER NOT NULL DEFAULT 0,
				data        BLOB,
				thumbnail   BLOB,
				metadata    TEXT,
				created_at  TEXT NOT NULL,
				updated_at  TEXT NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);
			CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id);
			CREATE INDEX IF NOT EXISTS idx_files_name ON files(filename);
		`,
	},
	{
		version: 11,
		sql: `
			CREATE TABLE IF NOT EXISTS file_versions (
				id          TEXT PRIMARY KEY,
				file_id     TEXT NOT NULL,
				user_id     TEXT NOT NULL DEFAULT 'guest',
				version_num INTEGER NOT NULL,
				size_bytes  INTEGER NOT NULL DEFAULT 0,
				data        BLOB,
				created_at  TEXT NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_fversions_file ON file_versions(file_id);
			CREATE INDEX IF NOT EXISTS idx_fversions_user ON file_versions(user_id);
		`,
	},
	{
		version: 12,
		sql: `
			CREATE TABLE IF NOT EXISTS projects (
				id          TEXT PRIMARY KEY,
				user_id     TEXT NOT NULL DEFAULT 'guest',
				title       TEXT NOT NULL,
				description TEXT,
				color       TEXT,
				status      TEXT NOT NULL DEFAULT 'active',
				priority    INTEGER NOT NULL DEFAULT 2,
				sort_order  INTEGER NOT NULL DEFAULT 0,
				created_at  TEXT NOT NULL,
				updated_at  TEXT NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
			CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

			CREATE TABLE IF NOT EXISTS responsibilities (
				id              TEXT PRIMARY KEY,
				user_id         TEXT NOT NULL DEFAULT 'guest',
				title           TEXT NOT NULL,
				description     TEXT,
				role            TEXT,
				cadence         TEXT,
				active          INTEGER NOT NULL DEFAULT 1,
				last_touched_at TEXT,
				sort_order      INTEGER NOT NULL DEFAULT 0,
				created_at      TEXT NOT NULL,
				updated_at      TEXT NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_responsibilities_user ON responsibilities(user_id);
			CREATE INDEX IF NOT EXISTS idx_responsibilities_active ON responsibilities(active);

			CREATE TABLE IF NOT EXISTS daily_highlights (
				user_id     TEXT NOT NULL DEFAULT 'guest',
				date        TEXT NOT NULL,
				text        TEXT,
				task_id     TEXT,
				completed   INTEGER NOT NULL DEFAULT 0,
				updated_at  TEXT NOT NULL,
				PRIMARY KEY (user_id, date)
			);

			ALTER TABLE tasks ADD COLUMN project_id TEXT;
			ALTER TABLE tasks ADD COLUMN responsibility_id TEXT;
			ALTER TABLE tasks ADD COLUMN effort TEXT;
			ALTER TABLE tasks ADD COLUMN pinned_today INTEGER NOT NULL DEFAULT 0;
			ALTER TABLE tasks ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';
			CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
			CREATE INDEX IF NOT EXISTS idx_tasks_responsibility ON tasks(responsibility_id);
			CREATE INDEX IF NOT EXISTS idx_tasks_pinned ON tasks(pinned_today);

			ALTER TABLE notes ADD COLUMN project_id TEXT;
			CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(project_id);

			ALTER TABLE inbox ADD COLUMN project_id TEXT;
			ALTER TABLE inbox ADD COLUMN action_target_id TEXT;
			CREATE INDEX IF NOT EXISTS idx_inbox_project ON inbox(project_id);

			ALTER TABLE time_blocks ADD COLUMN task_id TEXT;
			CREATE INDEX IF NOT EXISTS idx_time_blocks_task ON time_blocks(task_id);
		`,
	},
	{
		version: 13,
		sql: `
			-- Right Now: current-state strip
			CREATE TABLE IF NOT EXISTS right_now_states (
				id          TEXT PRIMARY KEY,
				user_id     TEXT NOT NULL DEFAULT 'guest',
				text        TEXT NOT NULL,
				started_at  TEXT NOT NULL,
				ended_at    TEXT,
				annotations TEXT,
				created_at  TEXT NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_right_now_user ON right_now_states(user_id, started_at DESC);

			-- Loops: open-loop tracking
			CREATE TABLE IF NOT EXISTS loops (
				id          TEXT PRIMARY KEY,
				user_id     TEXT NOT NULL DEFAULT 'guest',
				title       TEXT NOT NULL,
				waiting_on  TEXT,
				weight      INTEGER NOT NULL DEFAULT 2,
				state       TEXT NOT NULL DEFAULT 'open',
				project_id  TEXT,
				tags        TEXT,
				annotations TEXT,
				opened_at   TEXT NOT NULL,
				closed_at   TEXT,
				updated_at  TEXT NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_loops_user_state ON loops(user_id, state);
			CREATE INDEX IF NOT EXISTS idx_loops_weight ON loops(weight);

			-- Feel Check: one-tap emoji mood check
			CREATE TABLE IF NOT EXISTS feel_checks (
				id         TEXT PRIMARY KEY,
				user_id    TEXT NOT NULL DEFAULT 'guest',
				emoji      TEXT NOT NULL,
				note       TEXT,
				at         TEXT NOT NULL,
				created_at TEXT NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_feel_checks_user_at ON feel_checks(user_id, at DESC);

			-- Stuck: what am I stuck on
			CREATE TABLE IF NOT EXISTS stucks (
				id         TEXT PRIMARY KEY,
				user_id    TEXT NOT NULL DEFAULT 'guest',
				text       TEXT NOT NULL,
				state      TEXT NOT NULL DEFAULT 'open',
				resolved_at TEXT,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_stucks_user_state ON stucks(user_id, state);

			-- Avoiding: honesty-first bucket
			CREATE TABLE IF NOT EXISTS avoiding_items (
				id         TEXT PRIMARY KEY,
				user_id    TEXT NOT NULL DEFAULT 'guest',
				text       TEXT NOT NULL,
				state      TEXT NOT NULL DEFAULT 'active',
				resolved_at TEXT,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_avoiding_user_state ON avoiding_items(user_id, state);

			-- One-Word: end-of-day single word
			CREATE TABLE IF NOT EXISTS one_words (
				user_id    TEXT NOT NULL DEFAULT 'guest',
				date       TEXT NOT NULL,
				word       TEXT NOT NULL,
				updated_at TEXT NOT NULL,
				PRIMARY KEY (user_id, date)
			);

			-- Decisions: lightweight decision log
			CREATE TABLE IF NOT EXISTS decisions (
				id         TEXT PRIMARY KEY,
				user_id    TEXT NOT NULL DEFAULT 'guest',
				title      TEXT NOT NULL,
				choice     TEXT,
				why        TEXT,
				reversible INTEGER NOT NULL DEFAULT 1,
				project_id TEXT,
				decided_at TEXT NOT NULL,
				outcome    TEXT,
				outcome_at TEXT,
				annotations TEXT,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_decisions_user_at ON decisions(user_id, decided_at DESC);

			-- Learning Log: what did I learn today
			CREATE TABLE IF NOT EXISTS learning_log (
				id         TEXT PRIMARY KEY,
				user_id    TEXT NOT NULL DEFAULT 'guest',
				text       TEXT NOT NULL,
				topic      TEXT,
				source     TEXT,
				at         TEXT NOT NULL,
				created_at TEXT NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_learning_user_at ON learning_log(user_id, at DESC);

			-- Open Questions: unanswered curiosities
			CREATE TABLE IF NOT EXISTS open_questions (
				id         TEXT PRIMARY KEY,
				user_id    TEXT NOT NULL DEFAULT 'guest',
				text       TEXT NOT NULL,
				state      TEXT NOT NULL DEFAULT 'open',
				answer     TEXT,
				answered_at TEXT,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_oq_user_state ON open_questions(user_id, state);

			-- Contacts touches: who did I talk to
			CREATE TABLE IF NOT EXISTS contact_touches (
				id         TEXT PRIMARY KEY,
				user_id    TEXT NOT NULL DEFAULT 'guest',
				name       TEXT NOT NULL,
				one_word   TEXT,
				channel    TEXT,
				at         TEXT NOT NULL,
				created_at TEXT NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_contact_user_at ON contact_touches(user_id, at DESC);
			CREATE INDEX IF NOT EXISTS idx_contact_name ON contact_touches(name);

			-- Morning Intent: three things I want from today
			CREATE TABLE IF NOT EXISTS morning_intents (
				user_id    TEXT NOT NULL DEFAULT 'guest',
				date       TEXT NOT NULL,
				text       TEXT NOT NULL,
				satisfied  INTEGER,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL,
				PRIMARY KEY (user_id, date)
			);

			-- Evening Close: one-sentence what-did-today-give-me
			CREATE TABLE IF NOT EXISTS evening_closes (
				user_id    TEXT NOT NULL DEFAULT 'guest',
				date       TEXT NOT NULL,
				text       TEXT NOT NULL,
				auto_draft INTEGER NOT NULL DEFAULT 0,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL,
				PRIMARY KEY (user_id, date)
			);

			-- Water/Movement/Meal ping counter (daily buckets)
			CREATE TABLE IF NOT EXISTS wellness_pings (
				id         TEXT PRIMARY KEY,
				user_id    TEXT NOT NULL DEFAULT 'guest',
				kind       TEXT NOT NULL,   -- water / movement / meal
				at         TEXT NOT NULL,
				created_at TEXT NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_wellness_user_kind_at ON wellness_pings(user_id, kind, at DESC);

			-- Week Turn: weekly ritual (three last / three next)
			CREATE TABLE IF NOT EXISTS week_turns (
				user_id     TEXT NOT NULL DEFAULT 'guest',
				week_start  TEXT NOT NULL,   -- YYYY-MM-DD (Monday)
				last_three  TEXT,            -- JSON array of 3 strings
				next_three  TEXT,            -- JSON array of 3 strings
				created_at  TEXT NOT NULL,
				updated_at  TEXT NOT NULL,
				PRIMARY KEY (user_id, week_start)
			);

			-- annotations column on key existing entity tables (AI-later seam)
			ALTER TABLE tasks ADD COLUMN annotations TEXT;
			ALTER TABLE inbox ADD COLUMN annotations TEXT;
			ALTER TABLE notes ADD COLUMN annotations TEXT;
			ALTER TABLE projects ADD COLUMN annotations TEXT;
			ALTER TABLE responsibilities ADD COLUMN annotations TEXT;
			ALTER TABLE journal_entries ADD COLUMN annotations TEXT;
		`,
	},
];
