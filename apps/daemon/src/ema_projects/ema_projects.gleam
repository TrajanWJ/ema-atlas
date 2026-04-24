//// ema_projects — projects inside a space.
////
//// Minimal daemon-side writer for `project.create`.

import ema_daemon/bus
import ema_daemon/event_envelope.{Envelope}
import gleam/erlang/process.{type Subject}
import gleam/json
import gleam/string

pub type CreateError {
  EmptyName
  EmptyOrg
  EmptySpace
  AppendFailed(String)
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
      let payload =
        json.to_string(
          json.object([
            #("project_id", json.string(project_id)),
            #("space_id", json.string(clean_space_id)),
            #("name", json.string(clean_name)),
            #("created_by", json.string("user:dev-local")),
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
        Ok(_) -> Ok(event_id)
        Error(e) -> Error(AppendFailed(describe_append_error(e)))
      }
    }
  }
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
