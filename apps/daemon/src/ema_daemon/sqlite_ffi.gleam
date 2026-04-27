//// Thin Gleam FFI wrapper over the `esqlite` Erlang NIF.
////
//// Exposes just the minimal surface the daemon needs: open, exec,
//// prepare/bind/step/finalize, close, plus `last_insert_rowid`.
////
//// Values are returned as opaque handles plus minimal data types.

import gleam/dynamic.{type Dynamic}

/// Opaque handle for an open database connection.
pub type Db

/// Opaque handle for a prepared statement.
pub type Stmt

/// Opaque handle returned by `fetchall` / `step`.
pub type Row =
  Dynamic

pub type Error {
  SqliteError(String)
}

/// Open `path` and switch to WAL mode. Creates the file if missing.
pub fn open(path: String) -> Result(Db, Error) {
  case open_raw(path) {
    Ok(db) -> {
      // Best-effort WAL + normal synchronous pragmas. If these fail
      // we still return the open db; tests will catch regressions.
      let _ = exec_raw(db, "PRAGMA journal_mode=WAL;")
      let _ = exec_raw(db, "PRAGMA synchronous=NORMAL;")
      Ok(db)
    }
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn exec(db: Db, sql: String) -> Result(Nil, Error) {
  case exec_raw(db, sql) {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn prepare(db: Db, sql: String) -> Result(Stmt, Error) {
  case prepare_raw(db, sql) {
    Ok(stmt) -> Ok(stmt)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

/// Bind a list of text values to `?1..?N`. The daemon only binds text
/// for now; other types are added on demand.
pub fn bind_text(stmt: Stmt, args: List(String)) -> Result(Nil, Error) {
  case bind_raw(stmt, args) {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

/// Advance the statement by one row. Returns `Ok(Some(row))` for a row,
/// `Ok(None)` when done, or `Error` on failure.
pub fn step(stmt: Stmt) -> Result(StepResult, Error) {
  let result = step_raw(stmt)
  classify_step(result)
}

pub type StepResult {
  StepRow(row: Row)
  StepDone
}

/// Convenience: run a prepared+bound DML statement to completion.
pub fn exec_stmt(stmt: Stmt) -> Result(Nil, Error) {
  case step(stmt) {
    Ok(StepDone) -> Ok(Nil)
    Ok(StepRow(_)) -> Ok(Nil)
    Error(e) -> Error(e)
  }
}

pub fn finalize(_stmt: Stmt) -> Nil {
  // esqlite relies on GC for statement cleanup; no explicit finalize
  // in the public API. Provided here for symmetry with other drivers.
  Nil
}

pub fn close(db: Db) -> Nil {
  let _ = close_raw(db)
  Nil
}

pub fn last_insert_rowid(db: Db) -> Int {
  last_insert_rowid_raw(db)
}

pub fn persist_org_created(
  db: Db,
  org_id: String,
  payload_json: String,
  created_at: String,
  actor: String,
) -> Result(Nil, Error) {
  case persist_org_created_raw(db, org_id, payload_json, created_at, actor) {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn persist_space_created(
  db: Db,
  org_id: String,
  space_id: String,
  payload_json: String,
  created_at: String,
  actor: String,
) -> Result(Nil, Error) {
  case
    persist_space_created_raw(
      db,
      org_id,
      space_id,
      payload_json,
      created_at,
      actor,
    )
  {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn persist_project_created(
  db: Db,
  org_id: String,
  space_id: String,
  project_id: String,
  payload_json: String,
  created_at: String,
  actor: String,
) -> Result(Nil, Error) {
  case
    persist_project_created_raw(
      db,
      org_id,
      space_id,
      project_id,
      payload_json,
      created_at,
      actor,
    )
  {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn persist_membership_role_granted(
  db: Db,
  org_id: String,
  payload_json: String,
  updated_at: String,
  actor: String,
) -> Result(Nil, Error) {
  case
    persist_membership_role_granted_raw(
      db,
      org_id,
      payload_json,
      updated_at,
      actor,
    )
  {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn persist_identity_user_upserted(
  db: Db,
  payload_json: String,
  updated_at: String,
) -> Result(Nil, Error) {
  case persist_identity_user_upserted_raw(db, payload_json, updated_at) {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn persist_identity_google_linked(
  db: Db,
  payload_json: String,
  updated_at: String,
) -> Result(Nil, Error) {
  case persist_identity_google_linked_raw(db, payload_json, updated_at) {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn persist_identity_authenticator_enabled(
  db: Db,
  payload_json: String,
  updated_at: String,
) -> Result(Nil, Error) {
  case
    persist_identity_authenticator_enabled_raw(db, payload_json, updated_at)
  {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn persist_device_registered(
  db: Db,
  org_id: String,
  payload_json: String,
  updated_at: String,
  actor: String,
) -> Result(Nil, Error) {
  case
    persist_device_registered_raw(db, org_id, payload_json, updated_at, actor)
  {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn persist_device_renamed(
  db: Db,
  payload_json: String,
  updated_at: String,
  actor: String,
) -> Result(Nil, Error) {
  case persist_device_renamed_raw(db, payload_json, updated_at, actor) {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn persist_device_revoked(
  db: Db,
  payload_json: String,
  updated_at: String,
  actor: String,
) -> Result(Nil, Error) {
  case persist_device_revoked_raw(db, payload_json, updated_at, actor) {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn persist_device_key_rotated(
  db: Db,
  payload_json: String,
  updated_at: String,
  actor: String,
) -> Result(Nil, Error) {
  case persist_device_key_rotated_raw(db, payload_json, updated_at, actor) {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn persist_peer_trust_established(
  db: Db,
  org_id: String,
  payload_json: String,
  updated_at: String,
  actor: String,
) -> Result(Nil, Error) {
  case
    persist_peer_trust_established_raw(
      db,
      org_id,
      payload_json,
      updated_at,
      actor,
    )
  {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn persist_peer_trust_revoked(
  db: Db,
  org_id: String,
  payload_json: String,
  updated_at: String,
  actor: String,
) -> Result(Nil, Error) {
  case
    persist_peer_trust_revoked_raw(db, org_id, payload_json, updated_at, actor)
  {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn persist_membership_role_revoked(
  db: Db,
  org_id: String,
  payload_json: String,
  updated_at: String,
  actor: String,
) -> Result(Nil, Error) {
  case
    persist_membership_role_revoked_raw(
      db,
      org_id,
      payload_json,
      updated_at,
      actor,
    )
  {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn persist_membership_removed(
  db: Db,
  org_id: String,
  payload_json: String,
  updated_at: String,
  actor: String,
) -> Result(Nil, Error) {
  case
    persist_membership_removed_raw(db, org_id, payload_json, updated_at, actor)
  {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn persist_invite_created(
  db: Db,
  org_id: String,
  payload_json: String,
  updated_at: String,
  actor: String,
) -> Result(Nil, Error) {
  case persist_invite_created_raw(db, org_id, payload_json, updated_at, actor) {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn persist_invite_status(
  db: Db,
  payload_json: String,
  status: String,
  updated_at: String,
  actor: String,
) -> Result(Nil, Error) {
  case persist_invite_status_raw(db, payload_json, status, updated_at, actor) {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn persist_access_session_challenge_created(
  db: Db,
  payload_json: String,
  updated_at: String,
) -> Result(Nil, Error) {
  case
    persist_access_session_challenge_created_raw(db, payload_json, updated_at)
  {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn persist_access_session_approved(
  db: Db,
  payload_json: String,
  updated_at: String,
) -> Result(Nil, Error) {
  case persist_access_session_approved_raw(db, payload_json, updated_at) {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn persist_access_session_status(
  db: Db,
  payload_json: String,
  status: String,
  updated_at: String,
) -> Result(Nil, Error) {
  case persist_access_session_status_raw(db, payload_json, status, updated_at) {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(SqliteError(inspect_reason(reason)))
  }
}

pub fn topbar_projection_json(db: Db) -> String {
  topbar_projection_json_raw(db)
}

pub fn event_trail_projection_json(db: Db) -> String {
  event_trail_projection_json_raw(db)
}

pub fn access_session_projection_json(db: Db) -> String {
  access_session_projection_json_raw(db)
}

pub fn device_projection_json(db: Db) -> String {
  device_projection_json_raw(db)
}

pub fn peer_trust_projection_json(db: Db) -> String {
  peer_trust_projection_json_raw(db)
}

pub fn peer_is_trusted(db: Db, org_id: String, peer_device: String) -> Bool {
  peer_is_trusted_raw(db, org_id, peer_device)
}

pub fn event_exists(db: Db, kind: String, org_id: String) -> Bool {
  event_exists_raw(db, kind, org_id)
}

// --- FFI bindings to esqlite3 ------------------------------------------
//
// `esqlite3:open/1` accepts a string() (i.e. charlist), and `exec` /
// `prepare` accept iodata. The helper module `ema_sqlite_helpers`
// normalises inputs into what esqlite expects.

@external(erlang, "ema_sqlite_helpers", "open")
fn open_raw(path: String) -> Result(Db, Dynamic)

@external(erlang, "ema_sqlite_helpers", "exec")
fn exec_raw(db: Db, sql: String) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "prepare")
fn prepare_raw(db: Db, sql: String) -> Result(Stmt, Dynamic)

@external(erlang, "ema_sqlite_helpers", "bind")
fn bind_raw(stmt: Stmt, args: List(String)) -> Result(Dynamic, Dynamic)

@external(erlang, "esqlite3", "step")
fn step_raw(stmt: Stmt) -> Dynamic

@external(erlang, "esqlite3", "close")
fn close_raw(db: Db) -> Dynamic

@external(erlang, "esqlite3", "last_insert_rowid")
fn last_insert_rowid_raw(db: Db) -> Int

@external(erlang, "ema_sqlite_helpers", "persist_org_created")
fn persist_org_created_raw(
  db: Db,
  org_id: String,
  payload_json: String,
  created_at: String,
  actor: String,
) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "persist_space_created")
fn persist_space_created_raw(
  db: Db,
  org_id: String,
  space_id: String,
  payload_json: String,
  created_at: String,
  actor: String,
) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "persist_project_created")
fn persist_project_created_raw(
  db: Db,
  org_id: String,
  space_id: String,
  project_id: String,
  payload_json: String,
  created_at: String,
  actor: String,
) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "persist_identity_user_upserted")
fn persist_identity_user_upserted_raw(
  db: Db,
  payload_json: String,
  updated_at: String,
) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "persist_identity_google_linked")
fn persist_identity_google_linked_raw(
  db: Db,
  payload_json: String,
  updated_at: String,
) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "persist_identity_authenticator_enabled")
fn persist_identity_authenticator_enabled_raw(
  db: Db,
  payload_json: String,
  updated_at: String,
) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "persist_device_registered")
fn persist_device_registered_raw(
  db: Db,
  org_id: String,
  payload_json: String,
  updated_at: String,
  actor: String,
) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "persist_device_renamed")
fn persist_device_renamed_raw(
  db: Db,
  payload_json: String,
  updated_at: String,
  actor: String,
) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "persist_device_revoked")
fn persist_device_revoked_raw(
  db: Db,
  payload_json: String,
  updated_at: String,
  actor: String,
) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "persist_device_key_rotated")
fn persist_device_key_rotated_raw(
  db: Db,
  payload_json: String,
  updated_at: String,
  actor: String,
) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "persist_peer_trust_established")
fn persist_peer_trust_established_raw(
  db: Db,
  org_id: String,
  payload_json: String,
  updated_at: String,
  actor: String,
) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "persist_peer_trust_revoked")
fn persist_peer_trust_revoked_raw(
  db: Db,
  org_id: String,
  payload_json: String,
  updated_at: String,
  actor: String,
) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "persist_membership_role_granted")
fn persist_membership_role_granted_raw(
  db: Db,
  org_id: String,
  payload_json: String,
  updated_at: String,
  actor: String,
) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "persist_membership_role_revoked")
fn persist_membership_role_revoked_raw(
  db: Db,
  org_id: String,
  payload_json: String,
  updated_at: String,
  actor: String,
) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "persist_membership_removed")
fn persist_membership_removed_raw(
  db: Db,
  org_id: String,
  payload_json: String,
  updated_at: String,
  actor: String,
) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "persist_invite_created")
fn persist_invite_created_raw(
  db: Db,
  org_id: String,
  payload_json: String,
  updated_at: String,
  actor: String,
) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "persist_invite_status")
fn persist_invite_status_raw(
  db: Db,
  payload_json: String,
  status: String,
  updated_at: String,
  actor: String,
) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "persist_access_session_challenge_created")
fn persist_access_session_challenge_created_raw(
  db: Db,
  payload_json: String,
  updated_at: String,
) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "persist_access_session_approved")
fn persist_access_session_approved_raw(
  db: Db,
  payload_json: String,
  updated_at: String,
) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "persist_access_session_status")
fn persist_access_session_status_raw(
  db: Db,
  payload_json: String,
  status: String,
  updated_at: String,
) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_sqlite_helpers", "topbar_projection_json")
fn topbar_projection_json_raw(db: Db) -> String

@external(erlang, "ema_sqlite_helpers", "event_trail_projection_json")
fn event_trail_projection_json_raw(db: Db) -> String

@external(erlang, "ema_sqlite_helpers", "access_session_projection_json")
fn access_session_projection_json_raw(db: Db) -> String

@external(erlang, "ema_sqlite_helpers", "device_projection_json")
fn device_projection_json_raw(db: Db) -> String

@external(erlang, "ema_sqlite_helpers", "peer_trust_projection_json")
fn peer_trust_projection_json_raw(db: Db) -> String

@external(erlang, "ema_sqlite_helpers", "peer_is_trusted")
fn peer_is_trusted_raw(db: Db, org_id: String, peer_device: String) -> Bool

@external(erlang, "ema_sqlite_helpers", "event_exists")
fn event_exists_raw(db: Db, kind: String, org_id: String) -> Bool

@external(erlang, "ema_sqlite_helpers", "classify_step")
fn classify_step(raw: Dynamic) -> Result(StepResult, Error)

@external(erlang, "ema_sqlite_helpers", "inspect_reason")
fn inspect_reason(reason: Dynamic) -> String
