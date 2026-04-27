//// EMA local machine identity.
////
//// Generates real Ed25519 device keys and registers only the public key in
//// EMA's canonical log. The private key is referenced by secret_ref.

import ema_daemon/bus
import ema_identity/ema_identity
import gleam/erlang/process.{type Subject}

pub type DeviceKeyPair {
  DeviceKeyPair(public_key: String, private_key: String)
}

pub type LocalDevice {
  LocalDevice(
    device_id: String,
    event_id: String,
    public_key: String,
    secret_ref: String,
  )
}

pub type DeviceKeyError {
  KeyGenerationFailed(String)
  KeyStorageFailed(String)
  SigningFailed(String)
  RegisterFailed(ema_identity.IdentityError)
}

pub fn generate_keypair() -> Result(DeviceKeyPair, DeviceKeyError) {
  case generate_ed25519_keypair_raw() {
    Ok(pair) -> Ok(pair)
    Error(reason) -> Error(KeyGenerationFailed(reason))
  }
}

pub fn register_local_macos_device(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  user_id: String,
  name: String,
  bootstrap: String,
) -> Result(LocalDevice, DeviceKeyError) {
  let device_id = "device:" <> ulid()
  let secret_ref = "secret:" <> ulid()
  case generate_keypair() {
    Error(e) -> Error(e)
    Ok(pair) ->
      case store_macos_private_key(secret_ref, device_id, pair.private_key) {
        Error(e) -> Error(e)
        Ok(Nil) ->
          case
            ema_identity.register_device(
              bus_subject,
              org_id,
              device_id,
              user_id,
              name,
              pair.public_key,
              bootstrap,
            )
          {
            Ok(registered) ->
              Ok(LocalDevice(
                device_id: registered.device_id,
                event_id: registered.event_id,
                public_key: pair.public_key,
                secret_ref: secret_ref,
              ))
            Error(e) -> Error(RegisterFailed(e))
          }
      }
  }
}

pub fn sign_lineage_proof(
  device_id: String,
  peer_pubkey: String,
  local_pubkey: String,
  org_id: String,
  ceremony_id: String,
) -> Result(String, DeviceKeyError) {
  case
    sign_macos_lineage_proof_raw(
      device_id,
      peer_pubkey,
      local_pubkey,
      org_id,
      ceremony_id,
    )
  {
    Ok(proof) -> Ok(proof)
    Error(reason) -> Error(SigningFailed(reason))
  }
}

pub fn sign_lineage_proof_with_private_key(
  private_key: String,
  peer_pubkey: String,
  local_pubkey: String,
  org_id: String,
  ceremony_id: String,
) -> Result(String, DeviceKeyError) {
  case
    sign_lineage_proof_with_private_key_raw(
      private_key,
      peer_pubkey,
      local_pubkey,
      org_id,
      ceremony_id,
    )
  {
    Ok(proof) -> Ok(proof)
    Error(reason) -> Error(SigningFailed(reason))
  }
}

fn store_macos_private_key(
  secret_ref: String,
  device_id: String,
  private_key: String,
) -> Result(Nil, DeviceKeyError) {
  case store_macos_device_private_key_raw(secret_ref, device_id, private_key) {
    Ok(_) -> Ok(Nil)
    Error(reason) -> Error(KeyStorageFailed(reason))
  }
}

@external(erlang, "ema_device_keychain", "generate_ed25519_keypair")
fn generate_ed25519_keypair_raw() -> Result(DeviceKeyPair, String)

@external(erlang, "ema_device_keychain", "store_macos_device_private_key")
fn store_macos_device_private_key_raw(
  secret_ref: String,
  device_id: String,
  private_key: String,
) -> Result(Nil, String)

@external(erlang, "ema_device_keychain", "sign_macos_lineage_proof")
fn sign_macos_lineage_proof_raw(
  device_id: String,
  peer_pubkey: String,
  local_pubkey: String,
  org_id: String,
  ceremony_id: String,
) -> Result(String, String)

@external(erlang, "ema_device_keychain", "sign_lineage_proof_with_private_key")
fn sign_lineage_proof_with_private_key_raw(
  private_key: String,
  peer_pubkey: String,
  local_pubkey: String,
  org_id: String,
  ceremony_id: String,
) -> Result(String, String)

@external(erlang, "ema_time_ffi", "ulid")
fn ulid() -> String
