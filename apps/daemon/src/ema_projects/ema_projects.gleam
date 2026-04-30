//// ema_projects — projects inside a space.
////
//// Minimal daemon-side writer for `project.create`.

import ema_daemon/bus
import ema_daemon/ema_env
import ema_daemon/event_envelope.{type Envelope, Envelope}
import gleam/erlang/process.{type Subject}
import gleam/json
import gleam/list
import gleam/string

pub type CreateError {
  EmptyName
  EmptyOrg
  EmptySpace
  AppendFailed(String)
  MaterializationFailed(String)
}

pub fn create(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  space_id: String,
  name: String,
) -> Result(String, CreateError) {
  let clean_org_id = string.trim(org_id)
  let clean_space_id = string.trim(space_id)
  let clean_name = string.trim(name)

  case clean_org_id, clean_space_id, clean_name {
    "", _, _ -> Error(EmptyOrg)
    _, "", _ -> Error(EmptySpace)
    _, _, "" -> Error(EmptyName)
    _, _, _ -> {
      let now = iso_now()
      let project_id = "project:" <> ulid()
      let event_id = "event:" <> ulid()
      let desktop_root =
        ema_env.getenv_or("EMA_DESKTOP_ROOT", "/Users/trajanm4air/Desktop")
      let materialized =
        materialize_project(clean_name, project_id, desktop_root)
      let materialized_path = case materialized {
        Ok(path) -> path
        Error(_) -> ""
      }
      let payload =
        json.to_string(
          json.object([
            #("project_id", json.string(project_id)),
            #("space_id", json.string(clean_space_id)),
            #("name", json.string(clean_name)),
            #("created_by", json.string("user:dev-local")),
            #("local_path", json.string(materialized_path)),
          ]),
        )

      let env =
        Envelope(
          event_id: event_id,
          kind: "project.created",
          ts: now,
          actor: "actor:dev-console",
          org_id: clean_org_id,
          space_id: event_envelope.some(clean_space_id),
          project_id: event_envelope.some(project_id),
          dispatch_id: event_envelope.none(),
          execution_id: event_envelope.none(),
          payload_json: payload,
        )

      case bus.append(bus_subject, env) {
        Ok(_) -> {
          let materialization_event =
            materialization_envelope(
              materialized,
              event_id,
              clean_org_id,
              clean_space_id,
              project_id,
              clean_name,
              now,
            )
          case bus.append(bus_subject, materialization_event) {
            Ok(_) -> Ok(event_id)
            Error(e) -> Error(AppendFailed(describe_append_error(e)))
          }
        }
        Error(e) -> Error(AppendFailed(describe_append_error(e)))
      }
    }
  }
}

fn materialization_envelope(
  materialized: Result(String, String),
  created_event_id: String,
  org_id: String,
  space_id: String,
  project_id: String,
  name: String,
  now: String,
) -> Envelope {
  let event_id = "event:" <> ulid()
  let fields = [
    #("project_id", json.string(project_id)),
    #("space_id", json.string(space_id)),
    #("name", json.string(name)),
    #("created_event_id", json.string(created_event_id)),
    ..case materialized {
      Ok(path) -> [
        #("status", json.string("materialized")),
        #("local_path", json.string(path)),
      ]
      Error(reason) -> [
        #("status", json.string("materialization_failed")),
        #("reason", json.string(reason)),
      ]
    }
  ]
  Envelope(
    event_id: event_id,
    kind: case materialized {
      Ok(_) -> "project.materialized"
      Error(_) -> "project.materialization_failed"
    },
    ts: now,
    actor: "actor:dev-console",
    org_id: org_id,
    space_id: event_envelope.some(space_id),
    project_id: event_envelope.some(project_id),
    dispatch_id: event_envelope.none(),
    execution_id: event_envelope.none(),
    payload_json: json.to_string(json.object(list.reverse(fields))),
  )
}

fn describe_append_error(e: bus.AppendError) -> String {
  case e {
    bus.InvalidKind(kind) -> "invalid event kind: " <> kind
    bus.NotInCatalog(kind) -> "event kind not in catalog: " <> kind
    bus.PersistenceFailed(reason) -> "persistence failed: " <> reason
  }
}

@external(erlang, "ema_time_ffi", "iso_now")
fn iso_now() -> String

@external(erlang, "ema_time_ffi", "ulid")
fn ulid() -> String

@external(erlang, "ema_project_fs", "materialize_project")
fn materialize_project(
  project_name: String,
  project_id: String,
  desktop_root: String,
) -> Result(String, String)
