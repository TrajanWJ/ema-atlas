//// BEAM-native live collaboration room for the first single-document slice.
////
//// The room is the high-frequency document authority: edits are serialized
//// through this actor and persisted to SQLite update-frame tables. The coarse
//// canonical event log is deliberately not used for every prose edit.

import ema_daemon/sqlite_ffi
import gleam/dynamic.{type Dynamic}
import gleam/erlang/process.{type Subject}
import gleam/list
import gleam/otp/actor
import gleam/otp/supervision.{type ChildSpecification}

pub const default_document_id: String = "blueprint_sec:01J00000000000000000000008"

pub type Msg {
  Open(
    document_id: String,
    actor_id: String,
    reply: Subject(Result(Snapshot, CollabError)),
  )
  ReplaceBody(
    document_id: String,
    body: String,
    actor_id: String,
    reply: Subject(Result(Snapshot, CollabError)),
  )
  UpdateBody(
    document_id: String,
    body: String,
    actor_id: String,
    reply: Subject(Result(Snapshot, CollabError)),
  )
  FramesSince(
    document_id: String,
    after_revision: Int,
    reply: Subject(Result(FrameBacklog, CollabError)),
  )
  ApplyFrame(
    document_id: String,
    frame_id: String,
    revision: Int,
    body: String,
    actor_id: String,
    created_at: String,
    reply: Subject(Result(Snapshot, CollabError)),
  )
  PeerCursor(
    peer_device_id: String,
    document_id: String,
    reply: Subject(Result(PeerCursorSnapshot, CollabError)),
  )
  MarkPeerApplied(
    peer_device_id: String,
    document_id: String,
    revision: Int,
    frame_id: String,
    reply: Subject(Result(PeerCursorSnapshot, CollabError)),
  )
  Projection(document_id: String, reply: Subject(Result(Snapshot, CollabError)))
  Subscribe(target: Subject(Delivery), reply: Subject(Nil))
  Unsubscribe(target: Subject(Delivery), reply: Subject(Nil))
}

pub type Delivery {
  DocumentChanged(snapshot: Snapshot)
  SubscriptionDropped(reason: String)
}

pub type Snapshot {
  Snapshot(data_json: String, update_id: String)
}

pub type FrameBacklog {
  FrameBacklog(data_json: String)
}

pub type PeerCursorSnapshot {
  PeerCursorSnapshot(data_json: String)
}

pub type CollabError {
  EmptyDocument
  EmptyPeer
  PersistenceFailed(reason: String)
}

type Subscriber {
  Subscriber(target: Subject(Delivery))
}

type State {
  State(db: sqlite_ffi.Db, subs: List(Subscriber))
}

const max_pending_messages: Int = 500

pub fn start(
  db_path: String,
) -> Result(actor.Started(Subject(Msg)), actor.StartError) {
  actor.new_with_initialiser(5000, fn(self) {
    case sqlite_ffi.open(db_path) {
      Error(sqlite_ffi.SqliteError(msg)) ->
        Error("collab: failed to open db: " <> msg)
      Ok(db) ->
        case init_raw(db) {
          Ok(_) ->
            State(db: db, subs: [])
            |> actor.initialised
            |> actor.returning(self)
            |> Ok
          Error(reason) ->
            Error(
              "collab: failed to initialise tables: " <> inspect_reason(reason),
            )
        }
    }
  })
  |> actor.on_message(handle)
  |> actor.start
}

pub fn supervised(db_path: String) -> ChildSpecification(Subject(Msg)) {
  supervision.worker(fn() { start(db_path) })
}

fn handle(state: State, msg: Msg) -> actor.Next(State, Msg) {
  case msg {
    Open(document_id, actor_id, reply) -> {
      let result = do_open(state.db, document_id, actor_id)
      process.send(reply, result)
      actor.continue(state)
    }

    Projection(document_id, reply) -> {
      let result = do_open(state.db, document_id, "actor:dev-console")
      process.send(reply, result)
      actor.continue(state)
    }

    ReplaceBody(document_id, body, actor_id, reply) -> {
      case do_write(state.db, document_id, body, actor_id, "replace") {
        Ok(snapshot) -> {
          process.send(reply, Ok(snapshot))
          let subs = fan_out(state.subs, snapshot)
          actor.continue(State(..state, subs: subs))
        }
        Error(e) -> {
          process.send(reply, Error(e))
          actor.continue(state)
        }
      }
    }

    UpdateBody(document_id, body, actor_id, reply) -> {
      case do_write(state.db, document_id, body, actor_id, "replace") {
        Ok(snapshot) -> {
          process.send(reply, Ok(snapshot))
          let subs = fan_out(state.subs, snapshot)
          actor.continue(State(..state, subs: subs))
        }
        Error(e) -> {
          process.send(reply, Error(e))
          actor.continue(state)
        }
      }
    }

    FramesSince(document_id, after_revision, reply) -> {
      let result = do_frames_since(state.db, document_id, after_revision)
      process.send(reply, result)
      actor.continue(state)
    }

    ApplyFrame(
      document_id,
      frame_id,
      revision,
      body,
      actor_id,
      created_at,
      reply,
    ) -> {
      case
        do_apply_remote_frame(
          state.db,
          document_id,
          frame_id,
          revision,
          body,
          actor_id,
          created_at,
        )
      {
        Ok(snapshot) -> {
          process.send(reply, Ok(snapshot))
          let subs = fan_out(state.subs, snapshot)
          actor.continue(State(..state, subs: subs))
        }
        Error(e) -> {
          process.send(reply, Error(e))
          actor.continue(state)
        }
      }
    }

    PeerCursor(peer_device_id, document_id, reply) -> {
      let result = do_peer_cursor(state.db, peer_device_id, document_id)
      process.send(reply, result)
      actor.continue(state)
    }

    MarkPeerApplied(peer_device_id, document_id, revision, frame_id, reply) -> {
      let result =
        do_mark_peer_applied(
          state.db,
          peer_device_id,
          document_id,
          revision,
          frame_id,
        )
      process.send(reply, result)
      actor.continue(state)
    }

    Subscribe(target, reply) -> {
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
  }
}

fn do_open(
  db: sqlite_ffi.Db,
  document_id: String,
  actor_id: String,
) -> Result(Snapshot, CollabError) {
  case document_id == "" {
    True -> Error(EmptyDocument)
    False ->
      case open_raw(db, document_id, actor_id, iso_now()) {
        Ok(data_json) -> Ok(Snapshot(data_json: data_json, update_id: ""))
        Error(reason) -> Error(PersistenceFailed(inspect_reason(reason)))
      }
  }
}

fn do_write(
  db: sqlite_ffi.Db,
  document_id: String,
  body: String,
  actor_id: String,
  kind: String,
) -> Result(Snapshot, CollabError) {
  case document_id == "" {
    True -> Error(EmptyDocument)
    False ->
      case write_raw(db, document_id, body, actor_id, kind, iso_now()) {
        Ok(result) -> {
          let #(data_json, update_id) = result
          Ok(Snapshot(data_json: data_json, update_id: update_id))
        }
        Error(reason) -> Error(PersistenceFailed(inspect_reason(reason)))
      }
  }
}

fn do_frames_since(
  db: sqlite_ffi.Db,
  document_id: String,
  after_revision: Int,
) -> Result(FrameBacklog, CollabError) {
  case document_id == "" {
    True -> Error(EmptyDocument)
    False ->
      case frames_since_raw(db, document_id, after_revision) {
        Ok(data_json) -> Ok(FrameBacklog(data_json: data_json))
        Error(reason) -> Error(PersistenceFailed(inspect_reason(reason)))
      }
  }
}

fn do_apply_remote_frame(
  db: sqlite_ffi.Db,
  document_id: String,
  frame_id: String,
  revision: Int,
  body: String,
  actor_id: String,
  created_at: String,
) -> Result(Snapshot, CollabError) {
  case document_id == "" {
    True -> Error(EmptyDocument)
    False ->
      case
        apply_frame_raw(
          db,
          document_id,
          frame_id,
          revision,
          body,
          actor_id,
          created_at,
        )
      {
        Ok(result) -> {
          let #(data_json, update_id) = result
          Ok(Snapshot(data_json: data_json, update_id: update_id))
        }
        Error(reason) -> Error(PersistenceFailed(inspect_reason(reason)))
      }
  }
}

fn do_peer_cursor(
  db: sqlite_ffi.Db,
  peer_device_id: String,
  document_id: String,
) -> Result(PeerCursorSnapshot, CollabError) {
  case peer_device_id == "", document_id == "" {
    True, _ -> Error(EmptyPeer)
    _, True -> Error(EmptyDocument)
    _, _ ->
      case peer_cursor_raw(db, peer_device_id, document_id) {
        Ok(data_json) -> Ok(PeerCursorSnapshot(data_json: data_json))
        Error(reason) -> Error(PersistenceFailed(inspect_reason(reason)))
      }
  }
}

fn do_mark_peer_applied(
  db: sqlite_ffi.Db,
  peer_device_id: String,
  document_id: String,
  revision: Int,
  frame_id: String,
) -> Result(PeerCursorSnapshot, CollabError) {
  case peer_device_id == "", document_id == "" {
    True, _ -> Error(EmptyPeer)
    _, True -> Error(EmptyDocument)
    _, _ ->
      case
        mark_peer_applied_raw(
          db,
          peer_device_id,
          document_id,
          revision,
          frame_id,
        )
      {
        Ok(data_json) -> Ok(PeerCursorSnapshot(data_json: data_json))
        Error(reason) -> Error(PersistenceFailed(inspect_reason(reason)))
      }
  }
}

fn fan_out(subs: List(Subscriber), snapshot: Snapshot) -> List(Subscriber) {
  list.filter(subs, fn(sub) {
    case mailbox_size(sub.target) {
      size if size > max_pending_messages -> {
        process.send(sub.target, SubscriptionDropped(reason: "backpressure"))
        False
      }
      _ -> {
        process.send(sub.target, DocumentChanged(snapshot))
        True
      }
    }
  })
}

fn mailbox_size(_target: Subject(Delivery)) -> Int {
  0
}

fn subjects_equal(a: Subject(x), b: Subject(x)) -> Bool {
  a == b
}

pub fn open(
  collab: Subject(Msg),
  document_id: String,
  actor_id: String,
) -> Result(Snapshot, CollabError) {
  process.call(collab, 5000, fn(reply) { Open(document_id, actor_id, reply) })
}

pub fn replace_body(
  collab: Subject(Msg),
  document_id: String,
  body: String,
  actor_id: String,
) -> Result(Snapshot, CollabError) {
  process.call(collab, 5000, fn(reply) {
    ReplaceBody(document_id, body, actor_id, reply)
  })
}

pub fn update_body(
  collab: Subject(Msg),
  document_id: String,
  body: String,
  actor_id: String,
) -> Result(Snapshot, CollabError) {
  process.call(collab, 5000, fn(reply) {
    UpdateBody(document_id, body, actor_id, reply)
  })
}

pub fn projection(
  collab: Subject(Msg),
  document_id: String,
) -> Result(Snapshot, CollabError) {
  process.call(collab, 5000, fn(reply) { Projection(document_id, reply) })
}

pub fn frames_since(
  collab: Subject(Msg),
  document_id: String,
  after_revision: Int,
) -> Result(FrameBacklog, CollabError) {
  process.call(collab, 5000, fn(reply) {
    FramesSince(document_id, after_revision, reply)
  })
}

pub fn apply_frame(
  collab: Subject(Msg),
  document_id: String,
  frame_id: String,
  revision: Int,
  body: String,
  actor_id: String,
  created_at: String,
) -> Result(Snapshot, CollabError) {
  process.call(collab, 5000, fn(reply) {
    ApplyFrame(
      document_id,
      frame_id,
      revision,
      body,
      actor_id,
      created_at,
      reply,
    )
  })
}

pub fn apply_remote_frame(
  collab: Subject(Msg),
  document_id: String,
  frame_id: String,
  revision: Int,
  body: String,
  actor_id: String,
  created_at: String,
) -> Result(Snapshot, CollabError) {
  apply_frame(
    collab,
    document_id,
    frame_id,
    revision,
    body,
    actor_id,
    created_at,
  )
}

pub fn peer_cursor(
  collab: Subject(Msg),
  peer_device_id: String,
  document_id: String,
) -> Result(PeerCursorSnapshot, CollabError) {
  process.call(collab, 5000, fn(reply) {
    PeerCursor(peer_device_id, document_id, reply)
  })
}

pub fn mark_peer_applied(
  collab: Subject(Msg),
  peer_device_id: String,
  document_id: String,
  revision: Int,
  frame_id: String,
) -> Result(PeerCursorSnapshot, CollabError) {
  process.call(collab, 5000, fn(reply) {
    MarkPeerApplied(peer_device_id, document_id, revision, frame_id, reply)
  })
}

pub fn subscribe(collab: Subject(Msg), target: Subject(Delivery)) -> Nil {
  process.call(collab, 5000, fn(reply) { Subscribe(target, reply) })
}

pub fn unsubscribe(collab: Subject(Msg), target: Subject(Delivery)) -> Nil {
  process.call(collab, 5000, fn(reply) { Unsubscribe(target, reply) })
}

@external(erlang, "ema_collab_sqlite", "init")
fn init_raw(db: sqlite_ffi.Db) -> Result(Dynamic, Dynamic)

@external(erlang, "ema_collab_sqlite", "open_document")
fn open_raw(
  db: sqlite_ffi.Db,
  document_id: String,
  actor_id: String,
  now: String,
) -> Result(String, Dynamic)

@external(erlang, "ema_collab_sqlite", "write_body")
fn write_raw(
  db: sqlite_ffi.Db,
  document_id: String,
  body: String,
  actor_id: String,
  kind: String,
  now: String,
) -> Result(#(String, String), Dynamic)

@external(erlang, "ema_collab_sqlite", "frames_since")
fn frames_since_raw(
  db: sqlite_ffi.Db,
  document_id: String,
  after_revision: Int,
) -> Result(String, Dynamic)

@external(erlang, "ema_collab_sqlite", "apply_frame")
fn apply_frame_raw(
  db: sqlite_ffi.Db,
  document_id: String,
  frame_id: String,
  revision: Int,
  body: String,
  actor_id: String,
  created_at: String,
) -> Result(#(String, String), Dynamic)

@external(erlang, "ema_collab_sqlite", "peer_cursor")
fn peer_cursor_raw(
  db: sqlite_ffi.Db,
  peer_device_id: String,
  document_id: String,
) -> Result(String, Dynamic)

@external(erlang, "ema_collab_sqlite", "mark_peer_applied")
fn mark_peer_applied_raw(
  db: sqlite_ffi.Db,
  peer_device_id: String,
  document_id: String,
  revision: Int,
  frame_id: String,
) -> Result(String, Dynamic)

@external(erlang, "ema_sqlite_helpers", "inspect_reason")
fn inspect_reason(reason: Dynamic) -> String

@external(erlang, "ema_time_ffi", "iso_now")
fn iso_now() -> String
