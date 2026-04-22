from pathlib import Path
p = Path('/home/trajan/Projects/ema/services/core/runtime-fabric/schema.ts')
text = p.read_text()
text = text.replace("""  CREATE TABLE IF NOT EXISTS runtime_fabric_session_events (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_kind TEXT NOT NULL,
    summary TEXT NOT NULL,
    payload_json TEXT,
    inserted_at TEXT NOT NULL,
    FOREIGN KEY(session_id) REFERENCES runtime_fabric_sessions(id) ON DELETE CASCADE
  );
""", """  CREATE TABLE IF NOT EXISTS runtime_fabric_session_events (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_kind TEXT NOT NULL,
    summary TEXT NOT NULL,
    payload_json TEXT,
    inserted_at TEXT NOT NULL,
    FOREIGN KEY(session_id) REFERENCES runtime_fabric_sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS runtime_fabric_observed_sessions (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    session_file TEXT NOT NULL,
    project_label TEXT,
    message_count INTEGER NOT NULL DEFAULT 0,
    line_count INTEGER NOT NULL DEFAULT 0,
    modified_at TEXT NOT NULL,
    first_event_at TEXT,
    last_event_at TEXT,
    last_role TEXT,
    last_kind TEXT,
    last_assistant_text_excerpt TEXT,
    last_user_text_excerpt TEXT,
    last_tool_name TEXT,
    status TEXT NOT NULL,
    freshness TEXT NOT NULL,
    idle_minutes INTEGER NOT NULL DEFAULT 0,
    summary TEXT NOT NULL,
    observed_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS runtime_fabric_observed_session_events (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_kind TEXT NOT NULL,
    summary TEXT NOT NULL,
    payload_json TEXT,
    inserted_at TEXT NOT NULL,
    FOREIGN KEY(session_id) REFERENCES runtime_fabric_observed_sessions(id) ON DELETE CASCADE
  );
""")
text = text.replace("""  CREATE INDEX IF NOT EXISTS runtime_fabric_session_events_session_idx
    ON runtime_fabric_session_events(session_id, inserted_at DESC);
""", """  CREATE INDEX IF NOT EXISTS runtime_fabric_session_events_session_idx
    ON runtime_fabric_session_events(session_id, inserted_at DESC);

  CREATE INDEX IF NOT EXISTS runtime_fabric_observed_sessions_status_idx
    ON runtime_fabric_observed_sessions(status, observed_at DESC);

  CREATE INDEX IF NOT EXISTS runtime_fabric_observed_session_events_session_idx
    ON runtime_fabric_observed_session_events(session_id, inserted_at DESC);
""")
p.write_text(text)
