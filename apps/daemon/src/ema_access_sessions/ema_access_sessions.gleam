//// ema_access_sessions — browser access-point ceremony.
////
//// A browser session lets a user reach an EMA organization. It is not a
//// machine peer and never joins the p2p replication network.

import ema_daemon/bus
import ema_daemon/event_envelope.{type Envelope, Envelope}
import gleam/erlang/process.{type Subject}
import gleam/json
import gleam/list
import gleam/string

pub type Challenge {
  Challenge(challenge_id: String, user_code: String, event_id: String)
}

pub type Approval {
  Approval(session_id: String, token_hash_ref: String, event_id: String)
}

pub type AccessSessionError {
  EmptyOrg
  EmptyChallenge
  EmptySession
  EmptyUser
  EmptyDevice
  EmptyAccessPoint
  EmptyExpiry
  EmptyScopes
  AppendFailed(String)
}

pub fn create_challenge(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  access_point: String,
  scopes: List(String),
  expires_at: String,
) -> Result(Challenge, AccessSessionError) {
  let clean_org = string.trim(org_id)
  let clean_access_point = string.trim(access_point)
  let clean_expires = string.trim(expires_at)
  let clean_scopes = clean_scope_list(scopes)

  case clean_org, clean_access_point, clean_expires, clean_scopes {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyAccessPoint)
    _, _, "", _ -> Error(EmptyExpiry)
    _, _, _, [] -> Error(EmptyScopes)
    _, _, _, _ -> {
      let challenge_id = "access_challenge:" <> ulid()
      let user_code = "EMA-" <> string.slice(ulid(), 0, 8)
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([
            #("challenge_id", json.string(challenge_id)),
            #("org_id", json.string(clean_org)),
            #("access_point", json.string(clean_access_point)),
            #("user_code", json.string(user_code)),
            #(
              "scopes",
              json.preprocessed_array(list.map(clean_scopes, json.string)),
            ),
            #("expires_at", json.string(clean_expires)),
          ]),
        )
      let env =
        Envelope(
          event_id: event_id,
          kind: "access_session.challenge_created",
          ts: iso_now(),
          actor: "actor:dev-console",
          org_id: clean_org,
          space_id: event_envelope.none(),
          project_id: event_envelope.none(),
          dispatch_id: event_envelope.none(),
          execution_id: event_envelope.none(),
          payload_json: payload,
        )
      case append_event(bus_subject, env, event_id) {
        Ok(written) -> Ok(Challenge(challenge_id, user_code, written))
        Error(e) -> Error(e)
      }
    }
  }
}

pub fn approve(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  challenge_id: String,
  user_id: String,
  approved_by_device: String,
  scopes: List(String),
  expires_at: String,
) -> Result(Approval, AccessSessionError) {
  let clean_org = string.trim(org_id)
  let clean_challenge = string.trim(challenge_id)
  let clean_user = string.trim(user_id)
  let clean_device = string.trim(approved_by_device)
  let clean_expires = string.trim(expires_at)
  let clean_scopes = clean_scope_list(scopes)

  case
    clean_org,
    clean_challenge,
    clean_user,
    clean_device,
    clean_expires,
    clean_scopes
  {
    "", _, _, _, _, _ -> Error(EmptyOrg)
    _, "", _, _, _, _ -> Error(EmptyChallenge)
    _, _, "", _, _, _ -> Error(EmptyUser)
    _, _, _, "", _, _ -> Error(EmptyDevice)
    _, _, _, _, "", _ -> Error(EmptyExpiry)
    _, _, _, _, _, [] -> Error(EmptyScopes)
    _, _, _, _, _, _ -> {
      let session_id = "access_session:" <> ulid()
      let token_hash_ref = "secret_ref:access_session:" <> ulid()
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([
            #("challenge_id", json.string(clean_challenge)),
            #("session_id", json.string(session_id)),
            #("org_id", json.string(clean_org)),
            #("user_id", json.string(clean_user)),
            #("approved_by_device", json.string(clean_device)),
            #(
              "scopes",
              json.preprocessed_array(list.map(clean_scopes, json.string)),
            ),
            #("token_hash_ref", json.string(token_hash_ref)),
            #("expires_at", json.string(clean_expires)),
          ]),
        )
      let env =
        Envelope(
          event_id: event_id,
          kind: "access_session.approved",
          ts: iso_now(),
          actor: "actor:dev-console",
          org_id: clean_org,
          space_id: event_envelope.none(),
          project_id: event_envelope.none(),
          dispatch_id: event_envelope.none(),
          execution_id: event_envelope.none(),
          payload_json: payload,
        )
      case append_event(bus_subject, env, event_id) {
        Ok(written) -> Ok(Approval(session_id, token_hash_ref, written))
        Error(e) -> Error(e)
      }
    }
  }
}

pub fn revoke(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  session_id: String,
  reason: String,
) -> Result(String, AccessSessionError) {
  write_terminal_event(
    bus_subject,
    "access_session.revoked",
    org_id,
    session_id,
    [
      #("revoked_by", json.string("user:dev-local")),
      #("reason", json.string(reason)),
    ],
  )
}

pub fn expire(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  session_id: String,
) -> Result(String, AccessSessionError) {
  write_terminal_event(
    bus_subject,
    "access_session.expired",
    org_id,
    session_id,
    [],
  )
}

fn write_terminal_event(
  bus_subject: Subject(bus.Msg),
  kind: String,
  org_id: String,
  session_id: String,
  extra: List(#(String, json.Json)),
) -> Result(String, AccessSessionError) {
  let clean_org = string.trim(org_id)
  let clean_session = string.trim(session_id)
  case clean_org, clean_session {
    "", _ -> Error(EmptyOrg)
    _, "" -> Error(EmptySession)
    _, _ -> {
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([
            #("session_id", json.string(clean_session)),
            #("org_id", json.string(clean_org)),
            ..extra
          ]),
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

fn clean_scope_list(scopes: List(String)) -> List(String) {
  scopes
  |> list.map(string.trim)
  |> list.filter(fn(scope) { scope != "" })
}

fn append_event(
  bus_subject: Subject(bus.Msg),
  env: Envelope,
  event_id: String,
) -> Result(String, AccessSessionError) {
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
