//// Manual device pairing v0.
////
//// This module produces copyable pairing offers and approves them by
//// appending an attested `device.registered` event. v0 is intentionally
//// stateless: the offer carries all fields needed for approval, and the
//// short code is a human confirmation guard.

import ema_daemon/bus
import ema_identity/ema_identity
import gleam/erlang/process.{type Subject}
import gleam/json
import gleam/list
import gleam/option.{Some}
import gleam/string

pub type PairingOffer {
  PairingOffer(
    offer_id: String,
    org_id: String,
    user_id: String,
    device_id: String,
    name: String,
    pubkey: String,
    capabilities: List(String),
    short_code: String,
    created_at: String,
  )
}

pub type PairingApproval {
  PairingApproval(offer_id: String, device_id: String, event_id: String)
}

pub type PairingError {
  EmptyOffer
  EmptyOrg
  EmptyUser
  EmptyDevice
  EmptyName
  EmptyPubkey
  EmptyShortCode
  EmptyAttester
  ShortCodeMismatch
  AppendFailed(String)
}

pub fn create_offer(
  org_id: String,
  user_id: String,
  name: String,
  pubkey: String,
  capabilities: List(String),
) -> Result(PairingOffer, PairingError) {
  let clean_org = string.trim(org_id)
  let clean_user = string.trim(user_id)
  let clean_name = string.trim(name)
  let clean_pubkey = string.trim(pubkey)
  let clean_capabilities = clean_string_list(capabilities)

  case clean_org, clean_user, clean_name, clean_pubkey {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyUser)
    _, _, "", _ -> Error(EmptyName)
    _, _, _, "" -> Error(EmptyPubkey)
    _, _, _, _ ->
      Ok(PairingOffer(
        offer_id: "pairing_offer:" <> ulid(),
        org_id: clean_org,
        user_id: clean_user,
        device_id: "device:" <> ulid(),
        name: clean_name,
        pubkey: clean_pubkey,
        capabilities: clean_capabilities,
        short_code: random_digits(6),
        created_at: iso_now(),
      ))
  }
}

pub fn approve_offer(
  bus_subject: Subject(bus.Msg),
  offer_id: String,
  org_id: String,
  user_id: String,
  device_id: String,
  name: String,
  pubkey: String,
  capabilities: List(String),
  short_code: String,
  confirmed_short_code: String,
  attested_by: String,
) -> Result(PairingApproval, PairingError) {
  let clean_offer = string.trim(offer_id)
  let clean_org = string.trim(org_id)
  let clean_user = string.trim(user_id)
  let clean_device = string.trim(device_id)
  let clean_name = string.trim(name)
  let clean_pubkey = string.trim(pubkey)
  let clean_short_code = string.trim(short_code)
  let clean_confirmed = string.trim(confirmed_short_code)
  let clean_attester = string.trim(attested_by)
  let clean_capabilities = clean_string_list(capabilities)

  case
    clean_offer,
    clean_org,
    clean_user,
    clean_device,
    clean_name,
    clean_pubkey,
    clean_short_code,
    clean_confirmed,
    clean_attester
  {
    "", _, _, _, _, _, _, _, _ -> Error(EmptyOffer)
    _, "", _, _, _, _, _, _, _ -> Error(EmptyOrg)
    _, _, "", _, _, _, _, _, _ -> Error(EmptyUser)
    _, _, _, "", _, _, _, _, _ -> Error(EmptyDevice)
    _, _, _, _, "", _, _, _, _ -> Error(EmptyName)
    _, _, _, _, _, "", _, _, _ -> Error(EmptyPubkey)
    _, _, _, _, _, _, "", _, _ -> Error(EmptyShortCode)
    _, _, _, _, _, _, _, "", _ -> Error(EmptyShortCode)
    _, _, _, _, _, _, _, _, "" -> Error(EmptyAttester)
    _, _, _, _, _, _, code, confirmed, _ if code != confirmed ->
      Error(ShortCodeMismatch)
    _, _, _, _, _, _, _, _, _ -> {
      case
        ema_identity.register_device_with_attestation(
          bus_subject,
          clean_org,
          clean_device,
          clean_user,
          clean_name,
          clean_pubkey,
          "paired",
          Some(clean_attester),
          clean_capabilities,
        )
      {
        Ok(registered) ->
          Ok(PairingApproval(
            offer_id: clean_offer,
            device_id: registered.device_id,
            event_id: registered.event_id,
          ))
        Error(e) -> Error(AppendFailed(describe_identity_error(e)))
      }
    }
  }
}

pub fn offer_json(offer: PairingOffer) -> String {
  json.to_string(
    json.object([
      #("offer_id", json.string(offer.offer_id)),
      #("org_id", json.string(offer.org_id)),
      #("user_id", json.string(offer.user_id)),
      #("device_id", json.string(offer.device_id)),
      #("name", json.string(offer.name)),
      #("pubkey", json.string(offer.pubkey)),
      #(
        "capabilities",
        json.preprocessed_array(list.map(offer.capabilities, json.string)),
      ),
      #("short_code", json.string(offer.short_code)),
      #("created_at", json.string(offer.created_at)),
    ]),
  )
}

fn clean_string_list(values: List(String)) -> List(String) {
  values
  |> list.map(string.trim)
  |> list.filter(fn(value) { value != "" })
}

fn describe_identity_error(error: ema_identity.IdentityError) -> String {
  case error {
    ema_identity.EmptyOrg -> "org_id is required"
    ema_identity.EmptyUser -> "user_id is required"
    ema_identity.EmptyDevice -> "device_id is required"
    ema_identity.EmptyGoogleSub -> "google_sub is required"
    ema_identity.EmptyEmail -> "email is required"
    ema_identity.EmptyDisplayName -> "display_name is required"
    ema_identity.EmptyName -> "device name is required"
    ema_identity.EmptyPubkey -> "pubkey is required"
    ema_identity.EmptySecretRef -> "secret_ref is required"
    ema_identity.InvalidBootstrap(value) -> "invalid bootstrap " <> value
    ema_identity.AppendFailed(reason) -> reason
  }
}

@external(erlang, "ema_time_ffi", "iso_now")
fn iso_now() -> String

@external(erlang, "ema_time_ffi", "ulid")
fn ulid() -> String

@external(erlang, "ema_pairing_ffi", "random_digits")
fn random_digits(length: Int) -> String
