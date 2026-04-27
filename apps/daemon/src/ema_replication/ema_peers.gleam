//// EMA peer trust writers.
////
//// This records org-scoped trust between device keys. It is not yet the
//// daemon-to-daemon transport; Iroh will consume this trust root later.

import ema_daemon/bus
import ema_daemon/event_envelope.{type Envelope, Envelope}
import gleam/erlang/process.{type Subject}
import gleam/json
import gleam/string

pub type PeerTrust {
  PeerTrust(event_id: String)
}

pub type PeerTrustError {
  EmptyOrg
  EmptyPeerDevice
  EmptyPeerPubkey
  EmptyLocalPubkey
  EmptyCeremony
  EmptyLineageProof
  InvalidCeremony(String)
  AppendFailed(String)
}

pub fn establish_trust(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  peer_device: String,
  peer_pubkey: String,
  local_pubkey: String,
  ceremony_kind: String,
  ceremony_id: String,
  lineage_proof: String,
) -> Result(PeerTrust, PeerTrustError) {
  let clean_org = string.trim(org_id)
  let clean_peer_device = string.trim(peer_device)
  let clean_peer_pubkey = string.trim(peer_pubkey)
  let clean_local_pubkey = string.trim(local_pubkey)
  let clean_ceremony_kind = string.trim(ceremony_kind)
  let clean_ceremony_id = string.trim(ceremony_id)
  let clean_lineage_proof = string.trim(lineage_proof)

  case
    clean_org,
    clean_peer_device,
    clean_peer_pubkey,
    clean_local_pubkey,
    clean_ceremony_kind,
    clean_ceremony_id,
    clean_lineage_proof
  {
    "", _, _, _, _, _, _ -> Error(EmptyOrg)
    _, "", _, _, _, _, _ -> Error(EmptyPeerDevice)
    _, _, "", _, _, _, _ -> Error(EmptyPeerPubkey)
    _, _, _, "", _, _, _ -> Error(EmptyLocalPubkey)
    _, _, _, _, _, "", _ -> Error(EmptyCeremony)
    _, _, _, _, _, _, "" -> Error(EmptyLineageProof)
    _, _, _, _, "qr_ble_hybrid", _, _ ->
      append_established(
        bus_subject,
        clean_org,
        clean_peer_device,
        clean_peer_pubkey,
        clean_local_pubkey,
        clean_ceremony_kind,
        clean_ceremony_id,
        clean_lineage_proof,
      )
    _, _, _, _, "recovery_packet", _, _ ->
      append_established(
        bus_subject,
        clean_org,
        clean_peer_device,
        clean_peer_pubkey,
        clean_local_pubkey,
        clean_ceremony_kind,
        clean_ceremony_id,
        clean_lineage_proof,
      )
    _, _, _, _, "genesis", _, _ ->
      append_established(
        bus_subject,
        clean_org,
        clean_peer_device,
        clean_peer_pubkey,
        clean_local_pubkey,
        clean_ceremony_kind,
        clean_ceremony_id,
        clean_lineage_proof,
      )
    _, _, _, _, other, _, _ -> Error(InvalidCeremony(other))
  }
}

fn append_established(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  peer_device: String,
  peer_pubkey: String,
  local_pubkey: String,
  ceremony_kind: String,
  ceremony_id: String,
  lineage_proof: String,
) -> Result(PeerTrust, PeerTrustError) {
  let now = iso_now()
  let event_id = "event:" <> ulid()
  let payload =
    json.to_string(
      json.object([
        #("peer_device", json.string(peer_device)),
        #("peer_pubkey", json.string(peer_pubkey)),
        #("local_pubkey", json.string(local_pubkey)),
        #("org_id", json.string(org_id)),
        #("ceremony_kind", json.string(ceremony_kind)),
        #("ceremony_id", json.string(ceremony_id)),
        #("established_at", json.string(now)),
        #("lineage_proof", json.string(lineage_proof)),
      ]),
    )
  case bus.append(bus_subject, envelope(event_id, org_id, payload, now)) {
    Ok(_) -> Ok(PeerTrust(event_id))
    Error(e) -> Error(AppendFailed(describe_append_error(e)))
  }
}

fn envelope(
  event_id: String,
  org_id: String,
  payload_json: String,
  ts: String,
) -> Envelope {
  Envelope(
    event_id: event_id,
    kind: "peer.trust_established",
    ts: ts,
    actor: "system:ema_replication",
    org_id: org_id,
    space_id: event_envelope.none(),
    project_id: event_envelope.none(),
    dispatch_id: event_envelope.none(),
    execution_id: event_envelope.none(),
    payload_json: payload_json,
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
