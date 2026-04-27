//// ema_invites — org invite ceremony.
////
//// Invites make a person eligible for membership. They do not authenticate a
//// browser session and do not pair a durable machine.

import ema_daemon/bus
import ema_daemon/event_envelope.{type Envelope, Envelope}
import ema_memberships/ema_memberships
import gleam/erlang/process.{type Subject}
import gleam/json
import gleam/string

pub type InviteCreated {
  InviteCreated(invite_id: String, event_id: String)
}

pub type InviteError {
  EmptyOrg
  EmptyInvite
  EmptyTarget
  EmptyUser
  EmptyDevice
  EmptyExpiry
  InvalidRole(String)
  AppendFailed(String)
}

pub fn create(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  target_kind: String,
  target_value: String,
  role: String,
  expires_at: String,
) -> Result(InviteCreated, InviteError) {
  let clean_org = string.trim(org_id)
  let clean_target_kind = string.trim(target_kind)
  let clean_target_value = string.trim(target_value)
  let clean_expires = string.trim(expires_at)

  case clean_org, clean_target_kind, clean_target_value, clean_expires {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyTarget)
    _, _, "", _ -> Error(EmptyTarget)
    _, _, _, "" -> Error(EmptyExpiry)
    _, _, _, _ -> {
      case parse_role(role) {
        Error(e) -> Error(e)
        Ok(role_wire) -> {
          let now = iso_now()
          let invite_id = "invite:" <> ulid()
          let event_id = "event:" <> ulid()
          let payload =
            json.to_string(
              json.object([
                #("invite_id", json.string(invite_id)),
                #("scope", json.object([#("org_id", json.string(clean_org))])),
                #(
                  "target",
                  json.object([
                    #("kind", json.string(clean_target_kind)),
                    #("value", json.string(clean_target_value)),
                  ]),
                ),
                #("role", json.string(role_wire)),
                #("created_by", json.string("user:dev-local")),
                #("expires_at", json.string(clean_expires)),
              ]),
            )
          let env =
            Envelope(
              event_id: event_id,
              kind: "invite.created",
              ts: now,
              actor: "actor:dev-console",
              org_id: clean_org,
              space_id: event_envelope.none(),
              project_id: event_envelope.none(),
              dispatch_id: event_envelope.none(),
              execution_id: event_envelope.none(),
              payload_json: payload,
            )
          case append_event(bus_subject, env, event_id) {
            Ok(written) -> Ok(InviteCreated(invite_id, written))
            Error(e) -> Error(e)
          }
        }
      }
    }
  }
}

pub fn accept(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  invite_id: String,
  accepted_by: String,
  accepted_device: String,
  role: String,
) -> Result(List(String), InviteError) {
  let clean_org = string.trim(org_id)
  let clean_invite = string.trim(invite_id)
  let clean_user = string.trim(accepted_by)
  let clean_device = string.trim(accepted_device)
  case clean_org, clean_invite, clean_user, clean_device {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyInvite)
    _, _, "", _ -> Error(EmptyUser)
    _, _, _, "" -> Error(EmptyDevice)
    _, _, _, _ -> {
      case parse_role(role) {
        Error(e) -> Error(e)
        Ok(role_wire) -> {
          let now = iso_now()
          let event_id = "event:" <> ulid()
          let payload =
            json.to_string(
              json.object([
                #("invite_id", json.string(clean_invite)),
                #("accepted_by", json.string(clean_user)),
                #("accepted_device", json.string(clean_device)),
              ]),
            )
          let env =
            Envelope(
              event_id: event_id,
              kind: "invite.accepted",
              ts: now,
              actor: "actor:dev-console",
              org_id: clean_org,
              space_id: event_envelope.none(),
              project_id: event_envelope.none(),
              dispatch_id: event_envelope.none(),
              execution_id: event_envelope.none(),
              payload_json: payload,
            )
          case append_event(bus_subject, env, event_id) {
            Error(e) -> Error(e)
            Ok(invite_event_id) ->
              case
                ema_memberships.grant_role(
                  bus_subject,
                  clean_org,
                  clean_user,
                  role_wire,
                )
              {
                Ok(membership_event_id) ->
                  Ok([invite_event_id, membership_event_id])
                Error(ema_memberships.EmptyOrg) -> Error(EmptyOrg)
                Error(ema_memberships.EmptyUser) -> Error(EmptyUser)
                Error(ema_memberships.InvalidRole(r)) -> Error(InvalidRole(r))
                Error(ema_memberships.AppendFailed(reason)) ->
                  Error(AppendFailed(reason))
              }
          }
        }
      }
    }
  }
}

pub fn revoke(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  invite_id: String,
  reason: String,
) -> Result(String, InviteError) {
  write_status_event(bus_subject, "invite.revoked", org_id, invite_id, [
    #("revoked_by", json.string("user:dev-local")),
    #("reason", json.string(reason)),
  ])
}

pub fn expire(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  invite_id: String,
) -> Result(String, InviteError) {
  write_status_event(bus_subject, "invite.expired", org_id, invite_id, [])
}

fn write_status_event(
  bus_subject: Subject(bus.Msg),
  kind: String,
  org_id: String,
  invite_id: String,
  extra: List(#(String, json.Json)),
) -> Result(String, InviteError) {
  let clean_org = string.trim(org_id)
  let clean_invite = string.trim(invite_id)
  case clean_org, clean_invite {
    "", _ -> Error(EmptyOrg)
    _, "" -> Error(EmptyInvite)
    _, _ -> {
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([#("invite_id", json.string(clean_invite)), ..extra]),
        )
      let env =
        Envelope(
          event_id: event_id,
          kind: kind,
          ts: iso_now(),
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

fn parse_role(role: String) -> Result(String, InviteError) {
  case string.lowercase(string.trim(role)) {
    "owner" -> Ok("owner")
    "admin" -> Ok("admin")
    "member" -> Ok("member")
    "guest" -> Ok("guest")
    other -> Error(InvalidRole(other))
  }
}

fn append_event(
  bus_subject: Subject(bus.Msg),
  env: Envelope,
  event_id: String,
) -> Result(String, InviteError) {
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
