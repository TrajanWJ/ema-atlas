// ---------------------------------------------------------------------------
// db-worker.js — SQLite Web Worker, served as a static file from public/.
//
// WHY THIS IS A STATIC FILE:
// wa-sqlite ships pre-built Emscripten WASM modules. The .mjs loader resolves
// its sibling .wasm file via `new URL("wa-sqlite-async.wasm", import.meta.url)`.
// When Next.js/Turbopack bundles a worker .ts file, import.meta.url inside the
// bundled chunk points to the generated chunk URL — NOT the original node_modules
// path — so the .wasm fetch hits a 404 and Emscripten aborts.
//
// Serving this worker as a plain static file means the browser loads it
// directly. import.meta.url inside /wa-sqlite-async.mjs will be
// `<origin>/wa-sqlite-async.mjs`, and the sibling .wasm fetch resolves to
// `<origin>/wa-sqlite-async.wasm` — which we copy to public/ at build time.
//
// OPFS requires Cross-Origin-Isolation headers (COOP + COEP), which are
// configured in next.config.ts.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Migrations — inlined from src/db/schema.ts (keep in sync manually or via
// a build step that generates this file from the TypeScript source).
// ---------------------------------------------------------------------------

const migrations = [
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
    sql: `ALTER TABLE habits ADD COLUMN color TEXT;`,
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
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let db = null;
let sqlite3 = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function post(msg) {
  self.postMessage(msg);
}

async function runMigrations(exec, query) {
  await exec(`
    CREATE TABLE IF NOT EXISTS _meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  const rows = await query("SELECT value FROM _meta WHERE key = 'schema_version'");
  const currentVersion =
    rows.length > 0 && rows[0] !== undefined
      ? parseInt(String(rows[0]["value"]), 10)
      : 0;

  const pending = migrations.filter((m) => m.version > currentVersion);

  for (const migration of pending) {
    await exec(migration.sql);
    await exec(
      `INSERT INTO _meta (key, value) VALUES ('schema_version', '${migration.version}')
      ON CONFLICT(key) DO UPDATE SET value = '${migration.version}'`,
    );
  }
}

// ---------------------------------------------------------------------------
// Database initialisation
// ---------------------------------------------------------------------------

let storageMode = "unknown";

async function initDatabase() {
  const origin = new URL(import.meta.url).origin;

  const { default: SQLiteModuleFactory } = await import(`${origin}/wa-sqlite-async.mjs`);
  const { Factory } = await import(`${origin}/wa-sqlite/src/sqlite-api.js`);
  const { AccessHandlePoolVFS } = await import(
    `${origin}/wa-sqlite/src/examples/AccessHandlePoolVFS.js`
  );

  const module = await SQLiteModuleFactory();
  sqlite3 = Factory(module);

  // AccessHandlePoolVFS (OPFS) is the only VFS that works reliably with
  // wa-sqlite 1.0.0 async WASM. IDB-based VFS implementations crash on
  // locking operations with this build.
  //
  // Stale OPFS locks from crashed workers or a running service worker can
  // block access. We try the primary directory first, then a fallback.
  // The VFS name is hardcoded as "AccessHandlePool" so we can only register once.
  const primaryDir = "/place-org-db-v4";

  try {
    const vfs = new AccessHandlePoolVFS(primaryDir);
    await vfs.isReady;
    await sqlite3.vfs_register(vfs, false);
    db = await sqlite3.open_v2("place.db", 0x6, "AccessHandlePool");
    storageMode = "opfs";
    console.log("[db-worker] SUCCESS: OPFS database opened at", primaryDir);
  } catch (err) {
    console.warn("[db-worker] OPFS failed:", err?.message);
    db = null;
  }

  if (db === null) {
    storageMode = "memory";
    console.warn("[db-worker] OPFS unavailable. Using in-memory DB (no persistence).");
    console.warn("[db-worker] Fix: go to DevTools > Application > Service Workers > Unregister,");
    console.warn("[db-worker] then DevTools > Application > Storage > Clear site data, then reload.");
    db = await sqlite3.open_v2(":memory:", 0x6);
  }

  // Migrations use only sqlite3.exec (no bind params needed).
  const exec = async (sql) => {
    await sqlite3.exec(db, sql);
  };

  const query = async (sql) => {
    const rows = [];
    await sqlite3.exec(db, sql, (row, columns) => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      rows.push(obj);
    });
    return rows;
  };

  await runMigrations(exec, query);
}

// ---------------------------------------------------------------------------
// Parameter inlining — sqlite3.exec doesn't support bind params, so we
// substitute ? placeholders with properly escaped SQLite literals.
// This avoids execWithParams/statements/step which crash with IDB VFS.
// ---------------------------------------------------------------------------

function sqliteEscape(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") {
    if (Number.isNaN(value)) return "NULL";
    return String(value);
  }
  if (typeof value === "boolean") return value ? "1" : "0";
  // String: escape single quotes by doubling them
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function inlineParams(sql, params) {
  let i = 0;
  return sql.replace(/\?/g, () => {
    if (i >= params.length) return "?"; // leave unmatched
    return sqliteEscape(params[i++]);
  });
}

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

self.onmessage = async (event) => {
  const req = event.data;

  try {
    switch (req.type) {
      case "init": {
        await initDatabase();
        post({ id: req.id, type: "ready", storageMode });
        break;
      }

      case "exec": {
        if (!sqlite3 || db === null) throw new Error("Database not initialised");
        const { sql, params } = req;
        if (params && params.length > 0) {
          await sqlite3.exec(db, inlineParams(sql, params));
        } else {
          await sqlite3.exec(db, sql);
        }
        post({ id: req.id, type: "exec-done" });
        break;
      }

      case "query": {
        if (!sqlite3 || db === null) throw new Error("Database not initialised");
        const { sql, params } = req;
        const finalSql = (params && params.length > 0)
          ? inlineParams(sql, params)
          : sql;

        const resultRows = [];
        let resultColumns = [];
        await sqlite3.exec(db, finalSql, (row, columns) => {
          if (resultColumns.length === 0) resultColumns = columns;
          const obj = {};
          columns.forEach((col, i) => { obj[col] = row[i]; });
          resultRows.push(obj);
        });

        post({ id: req.id, type: "result", rows: resultRows, columns: resultColumns });
        break;
      }

      default: {
        throw new Error(`Unknown request type: ${JSON.stringify(req)}`);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    post({ id: req.id, type: "error", message });
  }
};
