//// Trust-gated live-collab replication boundary.
////
//// The future Iroh sidecar should call this layer after it receives a stream
//// packet. Transport moves bytes; this module decides whether the peer may
//// read or apply collab frames for an org.

import ema_collab/ema_collab
import ema_daemon/bus
import gleam/erlang/process.{type Subject}
import gleam/string

pub type CollabSyncError {
  EmptyOrg
  EmptyPeer
  PeerNotTrusted
  CollabFailed(ema_collab.CollabError)
}

pub fn frames_since_for_peer(
  bus_subject: Subject(bus.Msg),
  collab_subject: Subject(ema_collab.Msg),
  org_id: String,
  peer_device: String,
  document_id: String,
  after_revision: Int,
) -> Result(ema_collab.FrameBacklog, CollabSyncError) {
  case ensure_trusted(bus_subject, org_id, peer_device) {
    Error(e) -> Error(e)
    Ok(Nil) ->
      case
        ema_collab.frames_since(collab_subject, document_id, after_revision)
      {
        Ok(backlog) -> Ok(backlog)
        Error(e) -> Error(CollabFailed(e))
      }
  }
}

pub fn apply_frame_from_peer(
  bus_subject: Subject(bus.Msg),
  collab_subject: Subject(ema_collab.Msg),
  org_id: String,
  peer_device: String,
  document_id: String,
  frame_id: String,
  revision: Int,
  body: String,
  created_at: String,
) -> Result(ema_collab.Snapshot, CollabSyncError) {
  case ensure_trusted(bus_subject, org_id, peer_device) {
    Error(e) -> Error(e)
    Ok(Nil) ->
      case
        ema_collab.apply_frame(
          collab_subject,
          document_id,
          frame_id,
          revision,
          body,
          peer_device,
          created_at,
        )
      {
        Ok(snapshot) -> Ok(snapshot)
        Error(e) -> Error(CollabFailed(e))
      }
  }
}

fn ensure_trusted(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  peer_device: String,
) -> Result(Nil, CollabSyncError) {
  let clean_org = string.trim(org_id)
  let clean_peer = string.trim(peer_device)
  case clean_org, clean_peer {
    "", _ -> Error(EmptyOrg)
    _, "" -> Error(EmptyPeer)
    _, _ ->
      case bus.peer_is_trusted(bus_subject, clean_org, clean_peer) {
        True -> Ok(Nil)
        False -> Error(PeerNotTrusted)
      }
  }
}
