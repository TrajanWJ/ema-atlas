//// ema_memberships — org-level role records.
////
//// Membership is the person/org ceremony. It is separate from browser access
//// sessions and separate from durable machine/peer pairing.

import ema_daemon/bus
import ema_daemon/event_envelope.{type Envelope, Envelope}
import gleam/erlang/process.{type Subject}
import gleam/json
import gleam/string

pub type Role {
  Owner
  Admin
  Member
  Guest
}

pub type MembershipError {
  EmptyOrg
  EmptyUser
  InvalidRole(String)
  AppendFailed(String)
}

pub fn grant_role(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  user_id: String,
  role: String,
) -> Result(String, MembershipError) {
  case parse_role(role) {
    Error(e) -> Error(e)
    Ok(parsed_role) ->
      write_role_event(
        bus_subject,
        "membership.role_granted",
        org_id,
        user_id,
        parsed_role,
      )
  }
}

pub fn revoke_role(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  user_id: String,
  role: String,
) -> Result(String, MembershipError) {
  case parse_role(role) {
    Error(e) -> Error(e)
    Ok(parsed_role) ->
      write_role_event(
        bus_subject,
        "membership.role_revoked",
        org_id,
        user_id,
        parsed_role,
      )
  }
}

pub fn remove(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  user_id: String,
) -> Result(String, MembershipError) {
  let clean_org = string.trim(org_id)
  let clean_user = string.trim(user_id)
  case clean_org, clean_user {
    "", _ -> Error(EmptyOrg)
    _, "" -> Error(EmptyUser)
    _, _ -> {
      let now = iso_now()
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([
            #("org_id", json.string(clean_org)),
            #("user_id", json.string(clean_user)),
          ]),
        )
      let env =
        Envelope(
          event_id: event_id,
          kind: "membership.removed",
          ts: now,
          actor: "actor:dev-console",
          org_id: clean_org,
          space_id: event_envelope.none(),
          project_id: event_envelope.none(),
          dispatch_id: event_envelope.none(),
          execution_id: event_envelope.none(),
          payload_json: payload,
        )
      append_event(bus_subject, env, event_id)
    }
  }
}

fn write_role_event(
  bus_subject: Subject(bus.Msg),
  kind: String,
  org_id: String,
  user_id: String,
  role: Role,
) -> Result(String, MembershipError) {
  let clean_org = string.trim(org_id)
  let clean_user = string.trim(user_id)
  case clean_org, clean_user {
    "", _ -> Error(EmptyOrg)
    _, "" -> Error(EmptyUser)
    _, _ -> {
      let now = iso_now()
      let event_id = "event:" <> ulid()
      let role_wire = role_to_string(role)
      let payload =
        json.to_string(
          json.object([
            #("org_id", json.string(clean_org)),
            #("user_id", json.string(clean_user)),
            #("role", json.string(role_wire)),
          ]),
        )
      let env =
        Envelope(
          event_id: event_id,
          kind: kind,
          ts: now,
          actor: "actor:dev-console",
          org_id: clean_org,
          space_id: event_envelope.none(),
          project_id: event_envelope.none(),
          dispatch_id: event_envelope.none(),
          execution_id: event_envelope.none(),
          payload_json: payload,
        )
      append_event(bus_subject, env, event_id)
    }
  }
}

fn parse_role(role: String) -> Result(Role, MembershipError) {
  case string.lowercase(string.trim(role)) {
    "owner" -> Ok(Owner)
    "admin" -> Ok(Admin)
    "member" -> Ok(Member)
    "guest" -> Ok(Guest)
    other -> Error(InvalidRole(other))
  }
}

pub fn role_to_string(role: Role) -> String {
  case role {
    Owner -> "owner"
    Admin -> "admin"
    Member -> "member"
    Guest -> "guest"
  }
}

fn append_event(
  bus_subject: Subject(bus.Msg),
  env: Envelope,
  event_id: String,
) -> Result(String, MembershipError) {
  case bus.append(bus_subject, env) {
    Ok(_) -> Ok(event_id)
    Error(e) -> Error(AppendFailed(describe_append_error(e)))
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
