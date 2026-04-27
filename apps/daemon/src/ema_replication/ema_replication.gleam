//// ema_replication — lease, peer state, replication transport.
////
//// Wave 1 records the daemon contract shape while real daemon↔daemon
//// replication remains disabled. See `docs/architecture/04-lease-authority.md`
//// and `docs/architecture/11-transport-and-auth-survey.md`.

pub type NodeState {
  HomeCurrent
  ReplicaCurrent
  ReplicaProvisional
  ReplicaStale
  LocalDraft
  OfflineReadonly
}

pub type Placement {
  Local
  Daemon
  Peer(String)
  HostAffinity(String)
}

pub type ReplicableKind {
  EventLogTail
  WorkspaceArtifact
  BlueprintProse
}

pub type PeerStatus {
  PeerStatus(
    peer_device_id: String,
    last_txid: Int,
    last_checksum: String,
    node_state: NodeState,
  )
}

pub type CollabSyncDecision {
  CollabInSync
  CollabSendFrames(after_revision: Int)
  CollabPeerAhead(peer_revision: Int, local_revision: Int)
}

pub type ReplicationError {
  Deferred(reason: String)
}

pub fn replication_enabled() -> Bool {
  False
}

pub fn node_state_wire(state: NodeState) -> String {
  case state {
    HomeCurrent -> "home_current"
    ReplicaCurrent -> "replica_current"
    ReplicaProvisional -> "replica_provisional"
    ReplicaStale -> "replica_stale"
    LocalDraft -> "local_draft"
    OfflineReadonly -> "offline_readonly"
  }
}

pub fn placement_allowed(
  placement: Placement,
) -> Result(Nil, ReplicationError) {
  case placement {
    Local -> Ok(Nil)
    Daemon -> Ok(Nil)
    HostAffinity(_) -> Ok(Nil)
    Peer(_) ->
      Error(Deferred(
        "peer placement is deferred until pairing, leases, and signed replication land",
      ))
  }
}

pub fn collab_sync_decision(
  peer_last_revision: Int,
  local_revision: Int,
) -> CollabSyncDecision {
  case
    peer_last_revision < local_revision,
    peer_last_revision > local_revision
  {
    True, _ -> CollabSendFrames(after_revision: peer_last_revision)
    _, True ->
      CollabPeerAhead(
        peer_revision: peer_last_revision,
        local_revision: local_revision,
      )
    _, _ -> CollabInSync
  }
}

pub fn collab_sync_decision_wire(decision: CollabSyncDecision) -> String {
  case decision {
    CollabInSync -> "in_sync"
    CollabSendFrames(_) -> "send_frames"
    CollabPeerAhead(_, _) -> "peer_ahead"
  }
}
