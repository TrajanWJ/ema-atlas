//// ema_spaces — spaces inside an organization.
////
//// The public functions here are the daemon-side writer surface for
//// `space.create` plus the default-space event produced by `org.create`.

import ema_daemon/bus
import ema_daemon/event_envelope.{type Envelope, Envelope}
import gleam/erlang/process.{type Subject}
import gleam/json
import gleam/string

pub type CreateError {
  EmptyName
  EmptyOrg
  AppendFailed(String)
}

pub fn create(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  name: String,
) -> Result(String, CreateError) {
  let clean_org_id = string.trim(org_id)
  let clean_name = string.trim(name)

  case clean_org_id, clean_name {
    "", _ -> Error(EmptyOrg)
    _, "" -> Error(EmptyName)
    _, _ -> {
      let now = iso_now()
      let space_id = "space:" <> ulid()
      let event_id = "event:" <> ulid()
      let env =
        created_envelope(
          event_id: event_id,
          ts: now,
          actor: "actor:dev-console",
          org_id: clean_org_id,
          space_id: space_id,
          name: clean_name,
          created_by: "user:dev-local",
          is_default: False,
        )

      case bus.append(bus_subject, env) {
        Ok(_) -> Ok(event_id)
        Error(e) -> Error(AppendFailed(describe_append_error(e)))
      }
    }
  }
}

pub fn default_created_envelope(
  event_id event_id: String,
  ts ts: String,
  actor actor: String,
  org_id org_id: String,
  space_id space_id: String,
  name name: String,
  created_by created_by: String,
) -> Envelope {
  created_envelope(
    event_id: event_id,
    ts: ts,
    actor: actor,
    org_id: org_id,
    space_id: space_id,
    name: name,
    created_by: created_by,
    is_default: True,
  )
}

fn created_envelope(
  event_id event_id: String,
  ts ts: String,
  actor actor: String,
  org_id org_id: String,
  space_id space_id: String,
  name name: String,
  created_by created_by: String,
  is_default is_default: Bool,
) -> Envelope {
  let payload =
    json.to_string(
      json.object([
        #("space_id", json.string(space_id)),
        #("org_id", json.string(org_id)),
        #("name", json.string(name)),
        #("created_by", json.string(created_by)),
        #("default", json.bool(is_default)),
      ]),
    )

  Envelope(
    event_id: event_id,
    kind: "space.created",
    ts: ts,
    actor: actor,
    org_id: org_id,
    space_id: event_envelope.some(space_id),
    project_id: event_envelope.none(),
    dispatch_id: event_envelope.none(),
    execution_id: event_envelope.none(),
    payload_json: payload,
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
