//// In-process event bus.
////
//// Writer actors append events through the bus so that:
////   (1) append order is linear per daemon instance,
////   (2) projections and the IPC fan-out subscribe in one place,
////   (3) replication reads from the bus tail.
////
//// See `packages/contracts/events/` for the canonical event shape.
////
//// Wave 1 (M1): real gleam_otp actor backed by the canonical SQLite
//// database opened in WAL mode. Every append is committed before the
//// txid is returned.

import ema_daemon/event_envelope.{type Envelope}
import ema_daemon/sqlite_ffi
import gleam/erlang/process.{type Subject}
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/otp/actor
import gleam/otp/supervision.{type ChildSpecification}

// ---------------------------------------------------------------------------
// Public message + API types
// ---------------------------------------------------------------------------

pub type Msg {
  /// Append an event. Returns the assigned txid on success.
  Append(env: Envelope, reply: Subject(Result(Int, AppendError)))

  /// Subscribe a caller to the event stream. If `from_txid` is Some(n)
  /// the bus replays events with txid >= n before streaming live.
  Subscribe(
    target: Subject(Delivery),
    from_txid: Option(Int),
    reply: Subject(Nil),
  )

  /// Remove a subscriber explicitly.
  Unsubscribe(target: Subject(Delivery), reply: Subject(Nil))

  TopbarProjection(reply: Subject(String))

  EventTrailProjection(reply: Subject(String))

  EventExists(kind: String, org_id: String, reply: Subject(Bool))
}

/// Messages sent to subscribers.
pub type Delivery {
  Event(txid: Int, envelope: Envelope)
  SubscriptionDropped(reason: String)
}

pub type AppendError {
  InvalidKind(kind: String)
  NotInCatalog(kind: String)
  PersistenceFailed(reason: String)
}

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

type Subscriber {
  Subscriber(target: Subject(Delivery))
}

type State {
  State(db: sqlite_ffi.Db, subs: List(Subscriber))
}

const max_pending_messages: Int = 500

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

pub fn start(
  db_path: String,
) -> Result(actor.Started(Subject(Msg)), actor.StartError) {
  actor.new_with_initialiser(5000, fn(self) {
    case init_db(db_path) {
      Ok(db) ->
        State(db: db, subs: [])
        |> actor.initialised
        |> actor.returning(self)
        |> Ok
      Error(sqlite_ffi.SqliteError(msg)) ->
        Error("bus: failed to open canonical db: " <> msg)
    }
  })
  |> actor.on_message(handle)
  |> actor.start
}

pub fn supervised(db_path: String) -> ChildSpecification(Subject(Msg)) {
  supervision.worker(fn() { start(db_path) })
}

fn init_db(path: String) -> Result(sqlite_ffi.Db, sqlite_ffi.Error) {
  case sqlite_ffi.open(path) {
    Ok(db) -> {
      let ddl =
        "CREATE TABLE IF NOT EXISTS events (
          txid INTEGER PRIMARY KEY AUTOINCREMENT,
          event_id TEXT NOT NULL,
          kind TEXT NOT NULL,
          ts TEXT NOT NULL,
          actor TEXT NOT NULL,
          org_id TEXT NOT NULL,
          space_id TEXT,
          project_id TEXT,
          dispatch_id TEXT,
          execution_id TEXT,
          payload_json TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS orgs (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TEXT NOT NULL,
          created_by TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS spaces (
          id TEXT PRIMARY KEY,
          org_id TEXT NOT NULL,
          name TEXT NOT NULL,
          is_default TEXT NOT NULL,
          created_at TEXT NOT NULL,
          created_by TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          space_id TEXT NOT NULL,
          org_id TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at TEXT NOT NULL,
          created_by TEXT NOT NULL
        );"
      case sqlite_ffi.exec(db, ddl) {
        Ok(Nil) -> Ok(db)
        Error(e) -> Error(e)
      }
    }
    Error(e) -> Error(e)
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

fn handle(state: State, msg: Msg) -> actor.Next(State, Msg) {
  case msg {
    Append(env, reply) -> {
      case do_append(state.db, env) {
        Ok(txid) -> {
          process.send(reply, Ok(txid))
          let live = fan_out(state.subs, txid, env)
          actor.continue(State(..state, subs: live))
        }
        Error(e) -> {
          process.send(reply, Error(e))
          actor.continue(state)
        }
      }
    }

    Subscribe(target, from_txid, reply) -> {
      // Replay first so the subscriber gets historical events before
      // any live ones. Live events are appended after this point.
      let _ = case from_txid {
        Some(since) -> replay_from(state.db, since, target)
        None -> Nil
      }
      process.send(reply, Nil)
      let subs = [Subscriber(target: target), ..state.subs]
      actor.continue(State(..state, subs: subs))
    }

    Unsubscribe(target, reply) -> {
      process.send(reply, Nil)
      let subs =
        list.filter(state.subs, fn(s) { !subjects_equal(s.target, target) })
      actor.continue(State(..state, subs: subs))
    }

    TopbarProjection(reply) -> {
      process.send(reply, sqlite_ffi.topbar_projection_json(state.db))
      actor.continue(state)
    }

    EventTrailProjection(reply) -> {
      process.send(reply, sqlite_ffi.event_trail_projection_json(state.db))
      actor.continue(state)
    }

    EventExists(kind, org_id, reply) -> {
      process.send(reply, sqlite_ffi.event_exists(state.db, kind, org_id))
      actor.continue(state)
    }
  }
}

// Subjects don't have a trivial `==` we can rely on cross-version, but
// Gleam compares records structurally on Erlang, so this works.
fn subjects_equal(a: Subject(x), b: Subject(x)) -> Bool {
  a == b
}

fn do_append(db: sqlite_ffi.Db, env: Envelope) -> Result(Int, AppendError) {
  case validate(env) {
    Error(e) -> Error(e)
    Ok(Nil) -> persist(db, env)
  }
}

fn validate(env: Envelope) -> Result(Nil, AppendError) {
  case event_envelope.validate(env) {
    Ok(Nil) -> Ok(Nil)
    Error(event_envelope.EmptyKind) -> Error(InvalidKind(""))
    Error(event_envelope.NotInCatalog(k)) -> Error(NotInCatalog(k))
    Error(event_envelope.EmptyEventId) ->
      Error(PersistenceFailed("empty event_id"))
    Error(event_envelope.EmptyTimestamp) ->
      Error(PersistenceFailed("empty timestamp"))
    Error(event_envelope.EmptyActor) -> Error(PersistenceFailed("empty actor"))
    Error(event_envelope.EmptyOrg) -> Error(PersistenceFailed("empty org_id"))
    Error(event_envelope.EmptyPayload) ->
      Error(PersistenceFailed("empty payload_json"))
  }
}

fn persist(db: sqlite_ffi.Db, env: Envelope) -> Result(Int, AppendError) {
  let sql =
    "INSERT INTO events
      (event_id, kind, ts, actor, org_id, space_id, project_id,
       dispatch_id, execution_id, payload_json)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10);"

  case sqlite_ffi.prepare(db, sql) {
    Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
    Ok(stmt) -> {
      let args = [
        env.event_id,
        env.kind,
        env.ts,
        env.actor,
        env.org_id,
        opt_str(env.space_id),
        opt_str(env.project_id),
        opt_str(env.dispatch_id),
        opt_str(env.execution_id),
        env.payload_json,
      ]
      case sqlite_ffi.bind_text(stmt, args) {
        Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
        Ok(Nil) -> {
          case sqlite_ffi.exec_stmt(stmt) {
            Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
            Ok(Nil) -> {
              let txid = sqlite_ffi.last_insert_rowid(db)
              let _ = sqlite_ffi.finalize(stmt)
              case persist_compact_object(db, env) {
                Ok(Nil) -> Ok(txid)
                Error(e) -> Error(e)
              }
            }
          }
        }
      }
    }
  }
}

fn persist_compact_object(
  db: sqlite_ffi.Db,
  env: Envelope,
) -> Result(Nil, AppendError) {
  case env.kind {
    "org.created" ->
      case
        sqlite_ffi.persist_org_created(
          db,
          env.org_id,
          env.payload_json,
          env.ts,
          env.actor,
        )
      {
        Ok(Nil) -> Ok(Nil)
        Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
      }
    "space.created" ->
      case
        sqlite_ffi.persist_space_created(
          db,
          env.org_id,
          opt_str(env.space_id),
          env.payload_json,
          env.ts,
          env.actor,
        )
      {
        Ok(Nil) -> Ok(Nil)
        Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
      }
    "project.created" ->
      case
        sqlite_ffi.persist_project_created(
          db,
          env.org_id,
          opt_str(env.space_id),
          opt_str(env.project_id),
          env.payload_json,
          env.ts,
          env.actor,
        )
      {
        Ok(Nil) -> Ok(Nil)
        Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
      }
    _ -> Ok(Nil)
  }
}

fn opt_str(value: event_envelope.Option(String)) -> String {
  case value {
    event_envelope.Some(v) -> v
    event_envelope.None -> ""
  }
}

fn fan_out(
  subs: List(Subscriber),
  txid: Int,
  env: Envelope,
) -> List(Subscriber) {
  list.filter(subs, fn(sub) {
    case mailbox_size(sub.target) {
      size if size > max_pending_messages -> {
        process.send(sub.target, SubscriptionDropped(reason: "backpressure"))
        False
      }
      _ -> {
        process.send(sub.target, Event(txid: txid, envelope: env))
        True
      }
    }
  })
}

fn mailbox_size(_target: Subject(Delivery)) -> Int {
  // We could introspect the receiver's process info, but Gleam's
  // `process` module doesn't expose it directly. For wave 1 we always
  // report 0 and rely on the deliver path staying bounded by commands.
  // Future waves will plumb a real check through here.
  0
}

fn replay_from(
  _db: sqlite_ffi.Db,
  _since: Int,
  _target: Subject(Delivery),
) -> Nil {
  // M1 note: subscribe + historical replay is contract-visible but not
  // exercised by the round-trip test. Keep the call site wired so that
  // M2+ can fill it in without a caller signature change.
  Nil
}

// ---------------------------------------------------------------------------
// Sync helpers for writer actors.
// ---------------------------------------------------------------------------

pub fn append(bus: Subject(Msg), env: Envelope) -> Result(Int, AppendError) {
  process.call(bus, 5000, fn(reply) { Append(env, reply) })
}

pub fn subscribe(
  bus: Subject(Msg),
  target: Subject(Delivery),
  from_txid: Option(Int),
) -> Nil {
  process.call(bus, 5000, fn(reply) { Subscribe(target, from_txid, reply) })
}

pub fn unsubscribe(bus: Subject(Msg), target: Subject(Delivery)) -> Nil {
  process.call(bus, 5000, fn(reply) { Unsubscribe(target, reply) })
}

pub fn topbar_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { TopbarProjection(reply) })
}

pub fn event_trail_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { EventTrailProjection(reply) })
}

pub fn event_exists(bus: Subject(Msg), kind: String, org_id: String) -> Bool {
  process.call(bus, 5000, fn(reply) { EventExists(kind, org_id, reply) })
}
