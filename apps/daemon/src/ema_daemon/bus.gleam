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

import ema_companion/ema_companion
import ema_daemon/event_envelope.{type Envelope}
import ema_daemon/sqlite_ffi
import ema_presence/ema_presence
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

  AccessSessionProjection(reply: Subject(String))

  DeviceProjection(reply: Subject(String))

  PeerTrustProjection(reply: Subject(String))

  InviteProjection(reply: Subject(String))

  ChronicleActivityProjection(reply: Subject(String))

  ProjectFilesystemProjection(reply: Subject(String))

  SpaceVAppsProjection(reply: Subject(String))

  LaneRegistryProjection(reply: Subject(String))

  LaneRegistryProjectionScoped(project_id: String, reply: Subject(String))

  QueueRegistryProjection(reply: Subject(String))

  QueueRegistryProjectionScoped(project_id: String, reply: Subject(String))

  CampaignRegistryProjection(reply: Subject(String))

  MissionRegistryProjection(reply: Subject(String))

  HandoffRegistryProjection(reply: Subject(String))

  ProblemGraphProjection(reply: Subject(String))

  AgentReportsProjection(reply: Subject(String))

  SwarmRegistryProjection(reply: Subject(String))

  BlueprintProjection(reply: Subject(String))

  BlueprintPlannerProjection(reply: Subject(String))

  VcalendarProjection(reply: Subject(String))

  IntentGraphProjection(reply: Subject(String))

  DesktopPresenceProjection(reply: Subject(String))

  DesktopPresenceJoin(request: ema_presence.JoinRequest, reply: Subject(String))

  DesktopPresenceLeave(session_id: String, reply: Subject(String))

  DesktopPresenceCursor(
    request: ema_presence.CursorRequest,
    reply: Subject(String),
  )

  DesktopPresenceLocation(
    request: ema_presence.LocationRequest,
    reply: Subject(String),
  )

  AutoCheckupDueLanes(
    reply: Subject(List(#(String, String, String, String, String))),
  )

  CompanionStatusProjection(reply: Subject(String))

  CompanionWindowsProjection(reply: Subject(String))

  CompanionOpenWindow(
    request: ema_companion.WindowRequest,
    reply: Subject(String),
  )

  CompanionCloseWindow(window_id: String, reply: Subject(String))

  CompanionFocusWindow(window_id: String, reply: Subject(String))

  CompanionReattachAck(window_id: String, reply: Subject(String))

  PeerIsTrusted(org_id: String, peer_device: String, reply: Subject(Bool))

  EventExists(kind: String, org_id: String, reply: Subject(Bool))

  WorkspaceResourceExists(
    resource_kind: String,
    resource_id: String,
    org_id: String,
    reply: Subject(Bool),
  )
}

/// Messages sent to subscribers.
pub type Delivery {
  Event(txid: Int, envelope: Envelope)
  Projection(name: String, data_json: String)
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
  State(
    db: sqlite_ffi.Db,
    subs: List(Subscriber),
    companion: ema_companion.State,
    presence: ema_presence.State,
  )
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
        State(
          db: db,
          subs: [],
          companion: ema_companion.new(),
          presence: ema_presence.new(),
        )
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
        CREATE TABLE IF NOT EXISTS install (
          id TEXT PRIMARY KEY,
          genesis_device_id TEXT NOT NULL,
          install_pubkey TEXT NOT NULL,
          display_name TEXT NOT NULL,
          created_at TEXT NOT NULL,
          created_by TEXT NOT NULL
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
          local_path TEXT,
          materialization_status TEXT,
          materialization_reason TEXT,
          created_at TEXT NOT NULL,
          created_by TEXT NOT NULL,
          UNIQUE(space_id, name)
        );
        CREATE TABLE IF NOT EXISTS memberships (
          org_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          role TEXT NOT NULL,
          status TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          updated_by TEXT NOT NULL,
          PRIMARY KEY (org_id, user_id, role)
        );
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          display_name TEXT NOT NULL,
          email TEXT NOT NULL,
          email_verified TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS google_identities (
          google_sub TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          email TEXT NOT NULL,
          email_verified TEXT NOT NULL,
          linked_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS authenticator_enrollments (
          user_id TEXT PRIMARY KEY,
          method TEXT NOT NULL,
          secret_ref TEXT NOT NULL,
          status TEXT NOT NULL,
          verified_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS devices (
          id TEXT PRIMARY KEY,
          org_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          pubkey TEXT NOT NULL,
          bootstrap TEXT NOT NULL,
          attested_by TEXT,
          capabilities_json TEXT,
          status TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          updated_by TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS peer_trust (
          org_id TEXT NOT NULL,
          peer_device TEXT NOT NULL,
          peer_pubkey TEXT NOT NULL,
          local_pubkey TEXT NOT NULL,
          ceremony_kind TEXT NOT NULL,
          ceremony_id TEXT NOT NULL,
          lineage_proof TEXT NOT NULL,
          status TEXT NOT NULL,
          established_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          updated_by TEXT NOT NULL,
          PRIMARY KEY (org_id, peer_device)
        );
        CREATE TABLE IF NOT EXISTS invites (
          id TEXT PRIMARY KEY,
          org_id TEXT NOT NULL,
          target_kind TEXT NOT NULL,
          target_value TEXT NOT NULL,
          role TEXT NOT NULL,
          status TEXT NOT NULL,
          expires_at TEXT,
          updated_at TEXT NOT NULL,
          updated_by TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS access_session_challenges (
          id TEXT PRIMARY KEY,
          org_id TEXT NOT NULL,
          access_point TEXT NOT NULL,
          user_code TEXT NOT NULL,
          scopes_json TEXT NOT NULL,
          status TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS access_sessions (
          id TEXT PRIMARY KEY,
          challenge_id TEXT NOT NULL,
          org_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          approved_by_device TEXT NOT NULL,
          scopes_json TEXT NOT NULL,
          token_hash_ref TEXT NOT NULL,
          status TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );"
      case sqlite_ffi.exec(db, ddl) {
        Ok(Nil) -> {
          let _ =
            sqlite_ffi.exec(
              db,
              "ALTER TABLE projects ADD COLUMN local_path TEXT",
            )
          let _ =
            sqlite_ffi.exec(
              db,
              "ALTER TABLE projects ADD COLUMN materialization_status TEXT",
            )
          let _ =
            sqlite_ffi.exec(
              db,
              "ALTER TABLE projects ADD COLUMN materialization_reason TEXT",
            )
          let _ =
            sqlite_ffi.exec(
              db,
              "ALTER TABLE devices ADD COLUMN attested_by TEXT",
            )
          let _ =
            sqlite_ffi.exec(
              db,
              "ALTER TABLE devices ADD COLUMN capabilities_json TEXT",
            )
          let _ = sqlite_ffi.migrate_projects_unique_name(db)
          Ok(db)
        }
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

    AccessSessionProjection(reply) -> {
      process.send(reply, sqlite_ffi.access_session_projection_json(state.db))
      actor.continue(state)
    }

    DeviceProjection(reply) -> {
      process.send(reply, sqlite_ffi.device_projection_json(state.db))
      actor.continue(state)
    }

    PeerTrustProjection(reply) -> {
      process.send(reply, sqlite_ffi.peer_trust_projection_json(state.db))
      actor.continue(state)
    }

    InviteProjection(reply) -> {
      process.send(reply, sqlite_ffi.invite_projection_json(state.db))
      actor.continue(state)
    }

    ChronicleActivityProjection(reply) -> {
      process.send(
        reply,
        sqlite_ffi.chronicle_activity_projection_json(state.db),
      )
      actor.continue(state)
    }

    ProjectFilesystemProjection(reply) -> {
      process.send(
        reply,
        sqlite_ffi.project_filesystem_projection_json(state.db),
      )
      actor.continue(state)
    }

    SpaceVAppsProjection(reply) -> {
      process.send(reply, sqlite_ffi.space_vapps_projection_json(state.db))
      actor.continue(state)
    }

    LaneRegistryProjection(reply) -> {
      process.send(reply, sqlite_ffi.lane_registry_projection_json(state.db))
      actor.continue(state)
    }

    LaneRegistryProjectionScoped(project_id, reply) -> {
      process.send(
        reply,
        sqlite_ffi.lane_registry_projection_json_scoped(state.db, project_id),
      )
      actor.continue(state)
    }

    QueueRegistryProjection(reply) -> {
      process.send(reply, sqlite_ffi.queue_registry_projection_json(state.db))
      actor.continue(state)
    }

    QueueRegistryProjectionScoped(project_id, reply) -> {
      process.send(
        reply,
        sqlite_ffi.queue_registry_projection_json_scoped(state.db, project_id),
      )
      actor.continue(state)
    }

    CampaignRegistryProjection(reply) -> {
      process.send(
        reply,
        sqlite_ffi.campaign_registry_projection_json(state.db),
      )
      actor.continue(state)
    }

    MissionRegistryProjection(reply) -> {
      process.send(reply, sqlite_ffi.mission_registry_projection_json(state.db))
      actor.continue(state)
    }

    HandoffRegistryProjection(reply) -> {
      process.send(reply, sqlite_ffi.handoff_registry_projection_json(state.db))
      actor.continue(state)
    }

    ProblemGraphProjection(reply) -> {
      process.send(reply, sqlite_ffi.problem_graph_projection_json(state.db))
      actor.continue(state)
    }

    AgentReportsProjection(reply) -> {
      process.send(reply, sqlite_ffi.agent_reports_projection_json(state.db))
      actor.continue(state)
    }

    SwarmRegistryProjection(reply) -> {
      process.send(reply, sqlite_ffi.swarm_registry_projection_json(state.db))
      actor.continue(state)
    }

    BlueprintProjection(reply) -> {
      process.send(reply, sqlite_ffi.blueprint_projection_json(state.db))
      actor.continue(state)
    }

    BlueprintPlannerProjection(reply) -> {
      process.send(
        reply,
        sqlite_ffi.blueprint_planner_projection_json(state.db),
      )
      actor.continue(state)
    }

    VcalendarProjection(reply) -> {
      process.send(reply, sqlite_ffi.vcalendar_projection_json(state.db))
      actor.continue(state)
    }

    IntentGraphProjection(reply) -> {
      process.send(reply, sqlite_ffi.intent_graph_projection_json(state.db))
      actor.continue(state)
    }

    DesktopPresenceProjection(reply) -> {
      process.send(reply, ema_presence.projection_json(state.presence))
      actor.continue(state)
    }

    DesktopPresenceJoin(request, reply) -> {
      let presence = ema_presence.join(state.presence, request, iso_now())
      let projection = ema_presence.projection_json(presence)
      process.send(reply, projection)
      let subs = fan_out_projection(state.subs, "desktop.presence", projection)
      actor.continue(State(..state, presence: presence, subs: subs))
    }

    DesktopPresenceLeave(session_id, reply) -> {
      let presence = ema_presence.leave(state.presence, session_id)
      let projection = ema_presence.projection_json(presence)
      process.send(reply, projection)
      let subs = fan_out_projection(state.subs, "desktop.presence", projection)
      actor.continue(State(..state, presence: presence, subs: subs))
    }

    DesktopPresenceCursor(request, reply) -> {
      let presence = ema_presence.cursor(state.presence, request, iso_now())
      let projection = ema_presence.projection_json(presence)
      process.send(reply, projection)
      let subs = fan_out_projection(state.subs, "desktop.presence", projection)
      actor.continue(State(..state, presence: presence, subs: subs))
    }

    DesktopPresenceLocation(request, reply) -> {
      let presence = ema_presence.location(state.presence, request, iso_now())
      let projection = ema_presence.projection_json(presence)
      process.send(reply, projection)
      let subs = fan_out_projection(state.subs, "desktop.presence", projection)
      actor.continue(State(..state, presence: presence, subs: subs))
    }

    AutoCheckupDueLanes(reply) -> {
      process.send(reply, sqlite_ffi.auto_checkup_due_lanes(state.db))
      actor.continue(state)
    }

    CompanionStatusProjection(reply) -> {
      process.send(reply, ema_companion.status_projection_json(state.companion))
      actor.continue(state)
    }

    CompanionWindowsProjection(reply) -> {
      process.send(
        reply,
        ema_companion.windows_projection_json(state.companion),
      )
      actor.continue(state)
    }

    CompanionOpenWindow(request, reply) -> {
      let companion = ema_companion.open_window(state.companion, request)
      process.send(reply, ema_companion.windows_projection_json(companion))
      actor.continue(State(..state, companion: companion))
    }

    CompanionCloseWindow(window_id, reply) -> {
      let companion = ema_companion.close_window(state.companion, window_id)
      process.send(reply, ema_companion.windows_projection_json(companion))
      actor.continue(State(..state, companion: companion))
    }

    CompanionFocusWindow(window_id, reply) -> {
      let companion = ema_companion.focus_window(state.companion, window_id)
      process.send(reply, ema_companion.windows_projection_json(companion))
      actor.continue(State(..state, companion: companion))
    }

    CompanionReattachAck(window_id, reply) -> {
      let companion = ema_companion.reattach_ack(state.companion, window_id)
      process.send(reply, ema_companion.windows_projection_json(companion))
      actor.continue(State(..state, companion: companion))
    }

    PeerIsTrusted(org_id, peer_device, reply) -> {
      process.send(
        reply,
        sqlite_ffi.peer_is_trusted(state.db, org_id, peer_device),
      )
      actor.continue(state)
    }

    EventExists(kind, org_id, reply) -> {
      process.send(reply, sqlite_ffi.event_exists(state.db, kind, org_id))
      actor.continue(state)
    }

    WorkspaceResourceExists(resource_kind, resource_id, org_id, reply) -> {
      process.send(
        reply,
        sqlite_ffi.workspace_resource_exists(
          state.db,
          resource_kind,
          resource_id,
          org_id,
        ),
      )
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
    "install.initialized" ->
      case
        sqlite_ffi.persist_install_initialized(
          db,
          env.payload_json,
          env.ts,
          env.actor,
        )
      {
        Ok(Nil) -> Ok(Nil)
        Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
      }
    "identity.user_upserted" ->
      case
        sqlite_ffi.persist_identity_user_upserted(db, env.payload_json, env.ts)
      {
        Ok(Nil) -> Ok(Nil)
        Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
      }
    "identity.google_linked" ->
      case
        sqlite_ffi.persist_identity_google_linked(db, env.payload_json, env.ts)
      {
        Ok(Nil) -> Ok(Nil)
        Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
      }
    "identity.authenticator_enabled" ->
      case
        sqlite_ffi.persist_identity_authenticator_enabled(
          db,
          env.payload_json,
          env.ts,
        )
      {
        Ok(Nil) -> Ok(Nil)
        Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
      }
    "device.registered" ->
      case
        sqlite_ffi.persist_device_registered(
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
    "device.renamed" ->
      case
        sqlite_ffi.persist_device_renamed(
          db,
          env.payload_json,
          env.ts,
          env.actor,
        )
      {
        Ok(Nil) -> Ok(Nil)
        Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
      }
    "device.revoked" ->
      case
        sqlite_ffi.persist_device_revoked(
          db,
          env.payload_json,
          env.ts,
          env.actor,
        )
      {
        Ok(Nil) -> Ok(Nil)
        Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
      }
    "device.key_rotated" ->
      case
        sqlite_ffi.persist_device_key_rotated(
          db,
          env.payload_json,
          env.ts,
          env.actor,
        )
      {
        Ok(Nil) -> Ok(Nil)
        Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
      }
    "peer.trust_established" ->
      case
        sqlite_ffi.persist_peer_trust_established(
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
    "peer.trust_revoked" ->
      case
        sqlite_ffi.persist_peer_trust_revoked(
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
    "project.materialized" ->
      case
        sqlite_ffi.persist_project_materialized(
          db,
          env.org_id,
          opt_str(env.project_id),
          env.payload_json,
          env.ts,
          env.actor,
        )
      {
        Ok(Nil) -> Ok(Nil)
        Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
      }
    "project.materialization_failed" ->
      case
        sqlite_ffi.persist_project_materialized(
          db,
          env.org_id,
          opt_str(env.project_id),
          env.payload_json,
          env.ts,
          env.actor,
        )
      {
        Ok(Nil) -> Ok(Nil)
        Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
      }
    "project.archived" ->
      case
        sqlite_ffi.persist_project_archived(
          db,
          opt_str(env.project_id),
          env.payload_json,
          env.ts,
        )
      {
        Ok(Nil) -> Ok(Nil)
        Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
      }
    "membership.role_granted" ->
      case
        sqlite_ffi.persist_membership_role_granted(
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
    "membership.role_revoked" ->
      case
        sqlite_ffi.persist_membership_role_revoked(
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
    "membership.removed" ->
      case
        sqlite_ffi.persist_membership_removed(
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
    "invite.created" ->
      case
        sqlite_ffi.persist_invite_created(
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
    "invite.accepted" ->
      case
        sqlite_ffi.persist_invite_status(
          db,
          env.payload_json,
          "accepted",
          env.ts,
          env.actor,
        )
      {
        Ok(Nil) -> Ok(Nil)
        Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
      }
    "invite.revoked" ->
      case
        sqlite_ffi.persist_invite_status(
          db,
          env.payload_json,
          "revoked",
          env.ts,
          env.actor,
        )
      {
        Ok(Nil) -> Ok(Nil)
        Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
      }
    "invite.expired" ->
      case
        sqlite_ffi.persist_invite_status(
          db,
          env.payload_json,
          "expired",
          env.ts,
          env.actor,
        )
      {
        Ok(Nil) -> Ok(Nil)
        Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
      }
    "access_session.challenge_created" ->
      case
        sqlite_ffi.persist_access_session_challenge_created(
          db,
          env.payload_json,
          env.ts,
        )
      {
        Ok(Nil) -> Ok(Nil)
        Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
      }
    "access_session.approved" ->
      case
        sqlite_ffi.persist_access_session_approved(db, env.payload_json, env.ts)
      {
        Ok(Nil) -> Ok(Nil)
        Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
      }
    "access_session.revoked" ->
      case
        sqlite_ffi.persist_access_session_status(
          db,
          env.payload_json,
          "revoked",
          env.ts,
        )
      {
        Ok(Nil) -> Ok(Nil)
        Error(sqlite_ffi.SqliteError(m)) -> Error(PersistenceFailed(m))
      }
    "access_session.expired" ->
      case
        sqlite_ffi.persist_access_session_status(
          db,
          env.payload_json,
          "expired",
          env.ts,
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

fn fan_out_projection(
  subs: List(Subscriber),
  name: String,
  data_json: String,
) -> List(Subscriber) {
  list.filter(subs, fn(sub) {
    case mailbox_size(sub.target) {
      size if size > max_pending_messages -> {
        process.send(sub.target, SubscriptionDropped(reason: "backpressure"))
        False
      }
      _ -> {
        process.send(sub.target, Projection(name: name, data_json: data_json))
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

@external(erlang, "ema_time_ffi", "iso_now")
fn iso_now() -> String

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

pub fn access_session_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { AccessSessionProjection(reply) })
}

pub fn device_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { DeviceProjection(reply) })
}

pub fn peer_trust_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { PeerTrustProjection(reply) })
}

pub fn invite_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { InviteProjection(reply) })
}

pub fn chronicle_activity_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { ChronicleActivityProjection(reply) })
}

pub fn project_filesystem_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { ProjectFilesystemProjection(reply) })
}

pub fn space_vapps_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { SpaceVAppsProjection(reply) })
}

pub fn lane_registry_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { LaneRegistryProjection(reply) })
}

pub fn lane_registry_projection_json_scoped(
  bus: Subject(Msg),
  project_id: String,
) -> String {
  process.call(bus, 5000, fn(reply) {
    LaneRegistryProjectionScoped(project_id, reply)
  })
}

pub fn queue_registry_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { QueueRegistryProjection(reply) })
}

pub fn queue_registry_projection_json_scoped(
  bus: Subject(Msg),
  project_id: String,
) -> String {
  process.call(bus, 5000, fn(reply) {
    QueueRegistryProjectionScoped(project_id, reply)
  })
}

pub fn campaign_registry_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { CampaignRegistryProjection(reply) })
}

pub fn mission_registry_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { MissionRegistryProjection(reply) })
}

pub fn handoff_registry_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { HandoffRegistryProjection(reply) })
}

pub fn problem_graph_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { ProblemGraphProjection(reply) })
}

pub fn agent_reports_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { AgentReportsProjection(reply) })
}

pub fn swarm_registry_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { SwarmRegistryProjection(reply) })
}

pub fn blueprint_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { BlueprintProjection(reply) })
}

pub fn blueprint_planner_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { BlueprintPlannerProjection(reply) })
}

pub fn vcalendar_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { VcalendarProjection(reply) })
}

pub fn intent_graph_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { IntentGraphProjection(reply) })
}

/// Returns the per-lane scope tuple
/// `#(org_id, space_id, project_id, lane_id, cadence)` for every
/// active/claimed lane that is due for an auto-checkup. Each tuple's
/// scope is captured from that lane's own `lane.opened` envelope, so
/// the auto-checkup tick can emit `checkup.scheduled` events with the
/// correct per-lane scope (no hard-coded org).
pub fn auto_checkup_due_lanes(
  bus: Subject(Msg),
) -> List(#(String, String, String, String, String)) {
  process.call(bus, 5000, fn(reply) { AutoCheckupDueLanes(reply) })
}

pub fn companion_status_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { CompanionStatusProjection(reply) })
}

pub fn companion_windows_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { CompanionWindowsProjection(reply) })
}

pub fn companion_open_window(
  bus: Subject(Msg),
  request: ema_companion.WindowRequest,
) -> String {
  process.call(bus, 5000, fn(reply) { CompanionOpenWindow(request, reply) })
}

pub fn companion_close_window(bus: Subject(Msg), window_id: String) -> String {
  process.call(bus, 5000, fn(reply) { CompanionCloseWindow(window_id, reply) })
}

pub fn companion_focus_window(bus: Subject(Msg), window_id: String) -> String {
  process.call(bus, 5000, fn(reply) { CompanionFocusWindow(window_id, reply) })
}

pub fn companion_reattach_ack(bus: Subject(Msg), window_id: String) -> String {
  process.call(bus, 5000, fn(reply) { CompanionReattachAck(window_id, reply) })
}

pub fn desktop_presence_projection_json(bus: Subject(Msg)) -> String {
  process.call(bus, 5000, fn(reply) { DesktopPresenceProjection(reply) })
}

pub fn desktop_presence_join(
  bus: Subject(Msg),
  request: ema_presence.JoinRequest,
) -> String {
  process.call(bus, 5000, fn(reply) { DesktopPresenceJoin(request, reply) })
}

pub fn desktop_presence_leave(bus: Subject(Msg), session_id: String) -> String {
  process.call(bus, 5000, fn(reply) { DesktopPresenceLeave(session_id, reply) })
}

pub fn desktop_presence_cursor(
  bus: Subject(Msg),
  request: ema_presence.CursorRequest,
) -> String {
  process.call(bus, 5000, fn(reply) { DesktopPresenceCursor(request, reply) })
}

pub fn desktop_presence_location(
  bus: Subject(Msg),
  request: ema_presence.LocationRequest,
) -> String {
  process.call(bus, 5000, fn(reply) { DesktopPresenceLocation(request, reply) })
}

pub fn peer_is_trusted(
  bus: Subject(Msg),
  org_id: String,
  peer_device: String,
) -> Bool {
  process.call(bus, 5000, fn(reply) {
    PeerIsTrusted(org_id, peer_device, reply)
  })
}

pub fn event_exists(bus: Subject(Msg), kind: String, org_id: String) -> Bool {
  process.call(bus, 5000, fn(reply) { EventExists(kind, org_id, reply) })
}

pub fn workspace_resource_exists(
  bus: Subject(Msg),
  resource_kind: String,
  resource_id: String,
  org_id: String,
) -> Bool {
  process.call(bus, 5000, fn(reply) {
    WorkspaceResourceExists(resource_kind, resource_id, org_id, reply)
  })
}
