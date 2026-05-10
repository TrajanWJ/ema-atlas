//// Inbound sidecar frame routing.
////
//// This module is intentionally tiny: sidecar bytes become collab frames only
//// through ema_collab_sync, where org-scoped peer trust is enforced.

import ema_collab/ema_collab
import ema_daemon/bus
import ema_replication/ema_collab_sync
import ema_replication/sidecar_protocol
import gleam/bit_array
import gleam/dynamic/decode
import gleam/erlang/process.{type Subject}
import gleam/json
import gleam/string

pub type StreamContext {
  StreamContext(org_id: String, peer_device: String, document_id: String)
}

pub type RouteResult {
  Applied(ema_collab.Snapshot)
  DroppedPeerNotTrusted
  DroppedRevisionGap(reason: String)
  DroppedMalformedPayload(reason: String)
  DroppedUnexpectedMessage
  DroppedCollabError(reason: String)
}

type FramePayload {
  FramePayload(
    frame_id: String,
    revision: Int,
    body: String,
    created_at: String,
  )
}

pub fn route_received_frame(
  bus_subject: Subject(bus.Msg),
  collab_subject: Subject(ema_collab.Msg),
  context: StreamContext,
  message: sidecar_protocol.Message,
) -> RouteResult {
  case message {
    sidecar_protocol.Message(
      _,
      _,
      sidecar_protocol.FrameReceived(payload_b64: payload_b64, ..),
    ) ->
      case decode_payload(payload_b64) {
        Error(reason) -> DroppedMalformedPayload(reason)
        Ok(payload) ->
          apply_payload(bus_subject, collab_subject, context, payload)
      }
    _ -> DroppedUnexpectedMessage
  }
}

fn apply_payload(
  bus_subject: Subject(bus.Msg),
  collab_subject: Subject(ema_collab.Msg),
  context: StreamContext,
  payload: FramePayload,
) -> RouteResult {
  let StreamContext(org_id, peer_device, document_id) = context
  let FramePayload(frame_id, revision, body, created_at) = payload

  case
    ema_collab_sync.apply_frame_from_peer(
      bus_subject,
      collab_subject,
      org_id,
      peer_device,
      document_id,
      frame_id,
      revision,
      body,
      created_at,
    )
  {
    Ok(snapshot) -> Applied(snapshot)
    Error(error) -> map_sync_error(error)
  }
}

fn decode_payload(payload_b64: String) -> Result(FramePayload, String) {
  case sidecar_protocol.payload_from_b64(payload_b64) {
    Error(_) -> Error("payload_b64 is not valid base64")
    Ok(payload) ->
      case bit_array.to_string(payload) {
        Error(_) -> Error("payload_b64 does not decode to utf-8 json")
        Ok(raw) ->
          case json.parse(raw, frame_payload_decoder()) {
            Ok(payload) -> Ok(payload)
            Error(error) -> Error(string.inspect(error))
          }
      }
  }
}

fn frame_payload_decoder() -> decode.Decoder(FramePayload) {
  use frame_id <- decode.field("frame_id", decode.string)
  use revision <- decode.field("revision", decode.int)
  use body <- decode.field("body", decode.string)
  use created_at <- decode.field("created_at", decode.string)
  decode.success(FramePayload(frame_id:, revision:, body:, created_at:))
}

fn map_sync_error(error: ema_collab_sync.CollabSyncError) -> RouteResult {
  case error {
    ema_collab_sync.PeerNotTrusted -> DroppedPeerNotTrusted
    ema_collab_sync.CollabFailed(ema_collab.PersistenceFailed(reason)) ->
      case string.contains(reason, "collab_revision_gap") {
        True -> DroppedRevisionGap(reason)
        False -> DroppedCollabError(reason)
      }
    ema_collab_sync.CollabFailed(other) ->
      DroppedCollabError(string.inspect(other))
    ema_collab_sync.EmptyOrg -> DroppedCollabError("empty org")
    ema_collab_sync.EmptyPeer -> DroppedCollabError("empty peer")
  }
}
