//// ema_identity — canonical human identity records.
////
//// Google/TOTP prove a human for browser access. They do not create a
//// durable EMA machine peer and do not grant p2p replication authority.

import ema_daemon/bus
import ema_daemon/event_envelope.{type Envelope, Envelope}
import gleam/erlang/process.{type Subject}
import gleam/json
import gleam/string

pub type GoogleUser {
  GoogleUser(user_id: String, event_ids: List(String))
}

pub type DeviceRegistration {
  DeviceRegistration(device_id: String, event_id: String)
}

pub type IdentityError {
  EmptyOrg
  EmptyUser
  EmptyDevice
  EmptyGoogleSub
  EmptyEmail
  EmptyDisplayName
  EmptyName
  EmptyPubkey
  EmptySecretRef
  InvalidBootstrap(String)
  AppendFailed(String)
}

pub fn upsert_google_user(
  bus_subject: Subject(bus.Msg),
  user_id: String,
  google_sub: String,
  email: String,
  display_name: String,
  email_verified: Bool,
) -> Result(GoogleUser, IdentityError) {
  let clean_user = string.trim(user_id)
  let clean_sub = string.trim(google_sub)
  let clean_email = string.lowercase(string.trim(email))
  let clean_name = string.trim(display_name)

  case clean_user, clean_sub, clean_email, clean_name {
    "", _, _, _ -> Error(EmptyUser)
    _, "", _, _ -> Error(EmptyGoogleSub)
    _, _, "", _ -> Error(EmptyEmail)
    _, _, _, "" -> Error(EmptyDisplayName)
    _, _, _, _ -> {
      let now = iso_now()
      let user_event_id = "event:" <> ulid()
      let linked_event_id = "event:" <> ulid()
      let user_payload =
        json.to_string(
          json.object([
            #("user_id", json.string(clean_user)),
            #("display_name", json.string(clean_name)),
            #("email", json.string(clean_email)),
            #("email_verified", json.bool(email_verified)),
          ]),
        )
      let linked_payload =
        json.to_string(
          json.object([
            #("user_id", json.string(clean_user)),
            #("google_sub", json.string(clean_sub)),
            #("email", json.string(clean_email)),
            #("email_verified", json.bool(email_verified)),
            #("linked_at", json.string(now)),
          ]),
        )
      let user_env =
        envelope(
          user_event_id,
          "identity.user_upserted",
          clean_user,
          user_payload,
          now,
        )
      let linked_env =
        envelope(
          linked_event_id,
          "identity.google_linked",
          clean_user,
          linked_payload,
          now,
        )
      case append_event(bus_subject, user_env, user_event_id) {
        Error(e) -> Error(e)
        Ok(first) ->
          case append_event(bus_subject, linked_env, linked_event_id) {
            Error(e) -> Error(e)
            Ok(second) -> Ok(GoogleUser(clean_user, [first, second]))
          }
      }
    }
  }
}

pub fn enable_authenticator(
  bus_subject: Subject(bus.Msg),
  user_id: String,
  secret_ref: String,
) -> Result(String, IdentityError) {
  let clean_user = string.trim(user_id)
  let clean_secret = string.trim(secret_ref)
  case clean_user, clean_secret {
    "", _ -> Error(EmptyUser)
    _, "" -> Error(EmptySecretRef)
    _, _ -> {
      let now = iso_now()
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([
            #("user_id", json.string(clean_user)),
            #("method", json.string("totp")),
            #("secret_ref", json.string(clean_secret)),
            #("verified_at", json.string(now)),
          ]),
        )
      append_event(
        bus_subject,
        envelope(
          event_id,
          "identity.authenticator_enabled",
          clean_user,
          payload,
          now,
        ),
        event_id,
      )
    }
  }
}

pub fn register_device(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  device_id: String,
  user_id: String,
  name: String,
  pubkey: String,
  bootstrap: String,
) -> Result(DeviceRegistration, IdentityError) {
  let clean_org = string.trim(org_id)
  let clean_device = string.trim(device_id)
  let clean_user = string.trim(user_id)
  let clean_name = string.trim(name)
  let clean_pubkey = string.trim(pubkey)
  let clean_bootstrap = string.trim(bootstrap)

  case
    clean_org,
    clean_device,
    clean_user,
    clean_name,
    clean_pubkey,
    clean_bootstrap
  {
    "", _, _, _, _, _ -> Error(EmptyOrg)
    _, "", _, _, _, _ -> Error(EmptyDevice)
    _, _, "", _, _, _ -> Error(EmptyUser)
    _, _, _, "", _, _ -> Error(EmptyName)
    _, _, _, _, "", _ -> Error(EmptyPubkey)
    _, _, _, _, _, "genesis" ->
      append_device_registered(
        bus_subject,
        clean_org,
        clean_device,
        clean_user,
        clean_name,
        clean_pubkey,
        clean_bootstrap,
      )
    _, _, _, _, _, "paired" ->
      append_device_registered(
        bus_subject,
        clean_org,
        clean_device,
        clean_user,
        clean_name,
        clean_pubkey,
        clean_bootstrap,
      )
    _, _, _, _, _, other -> Error(InvalidBootstrap(other))
  }
}

fn append_device_registered(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  device_id: String,
  user_id: String,
  name: String,
  pubkey: String,
  bootstrap: String,
) -> Result(DeviceRegistration, IdentityError) {
  let now = iso_now()
  let event_id = "event:" <> ulid()
  let payload =
    json.to_string(
      json.object([
        #("device_id", json.string(device_id)),
        #("user_id", json.string(user_id)),
        #("name", json.string(name)),
        #("pubkey", json.string(pubkey)),
        #("bootstrap", json.string(bootstrap)),
      ]),
    )
  case
    append_event(
      bus_subject,
      device_envelope(event_id, org_id, payload, now),
      event_id,
    )
  {
    Ok(written) -> Ok(DeviceRegistration(device_id, written))
    Error(e) -> Error(e)
  }
}

fn envelope(
  event_id: String,
  kind: String,
  _user_id: String,
  payload_json: String,
  ts: String,
) -> Envelope {
  Envelope(
    event_id: event_id,
    kind: kind,
    ts: ts,
    actor: "system:ema_identity",
    org_id: "org:identity",
    space_id: event_envelope.none(),
    project_id: event_envelope.none(),
    dispatch_id: event_envelope.none(),
    execution_id: event_envelope.none(),
    payload_json: payload_json,
  )
}

fn device_envelope(
  event_id: String,
  org_id: String,
  payload_json: String,
  ts: String,
) -> Envelope {
  Envelope(
    event_id: event_id,
    kind: "device.registered",
    ts: ts,
    actor: "system:ema_identity",
    org_id: org_id,
    space_id: event_envelope.none(),
    project_id: event_envelope.none(),
    dispatch_id: event_envelope.none(),
    execution_id: event_envelope.none(),
    payload_json: payload_json,
  )
}

fn append_event(
  bus_subject: Subject(bus.Msg),
  env: Envelope,
  event_id: String,
) -> Result(String, IdentityError) {
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
