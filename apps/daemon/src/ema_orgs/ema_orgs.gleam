//// ema_orgs — organizations.
////
//// Handles `org.create` by appending `org.created`, then the required
//// same-name default `space.created` event through the daemon bus.

import ema_daemon/bus
import ema_daemon/event_envelope.{Envelope}
import ema_spaces/ema_spaces
import gleam/erlang/process.{type Subject}
import gleam/json
import gleam/string

pub type CreateError {
  EmptyName
  AppendFailed(String)
}

pub fn create(
  bus_subject: Subject(bus.Msg),
  name: String,
) -> Result(List(String), CreateError) {
  let clean_name = string.trim(name)

  case clean_name {
    "" -> Error(EmptyName)
    _ -> {
      let now = iso_now()
      let org_id = "org:" <> ulid()
      let space_id = "space:" <> ulid()
      let org_event_id = "event:" <> ulid()
      let space_event_id = "event:" <> ulid()
      let actor = "actor:dev-console"
      let created_by = "user:dev-local"
      let payload =
        json.to_string(
          json.object([
            #("org_id", json.string(org_id)),
            #("name", json.string(clean_name)),
            #("personal", json.bool(False)),
            #("owner_user_id", json.string(created_by)),
          ]),
        )

      let org_created =
        Envelope(
          event_id: org_event_id,
          kind: "org.created",
          ts: now,
          actor: actor,
          org_id: org_id,
          space_id: event_envelope.none(),
          project_id: event_envelope.none(),
          dispatch_id: event_envelope.none(),
          execution_id: event_envelope.none(),
          payload_json: payload,
        )

      let default_space_created =
        ema_spaces.default_created_envelope(
          event_id: space_event_id,
          ts: now,
          actor: actor,
          org_id: org_id,
          space_id: space_id,
          name: clean_name,
          created_by: created_by,
        )

      case bus.append(bus_subject, org_created) {
        Ok(_) ->
          case bus.append(bus_subject, default_space_created) {
            Ok(_) -> Ok([org_event_id, space_event_id])
            Error(e) -> Error(AppendFailed(describe_append_error(e)))
          }
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
