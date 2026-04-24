//// ema_orgs — organizations.
////
//// First vertical slice: handle `org.create` by producing one canonical
//// `org.created` event and appending it through the daemon bus.

import ema_daemon/bus
import ema_daemon/event_envelope.{Envelope}
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
) -> Result(String, CreateError) {
  let clean_name = string.trim(name)

  case clean_name {
    "" -> Error(EmptyName)
    _ -> {
      let now = iso_now()
      let suffix = id_suffix(now)
      let org_id = "org:" <> suffix
      let event_id = "event:" <> suffix <> "-org-created"
      let payload =
        json.to_string(
          json.object([
            #("id", json.string(org_id)),
            #("name", json.string(clean_name)),
            #("created_by", json.string("actor:dev-console")),
          ]),
        )

      let env =
        Envelope(
          event_id: event_id,
          kind: "org.created",
          ts: now,
          actor: "actor:dev-console",
          org_id: org_id,
          space_id: event_envelope.none(),
          project_id: event_envelope.none(),
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

fn id_suffix(now: String) -> String {
  now
  |> string.replace(each: "-", with: "")
  |> string.replace(each: ":", with: "")
  |> string.replace(each: ".", with: "")
  |> string.replace(each: "T", with: "")
  |> string.replace(each: "Z", with: "")
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
