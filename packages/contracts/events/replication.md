# replication

Owner: `ema_replication`.

## Kinds

## Dev-build update lane

Dev-build self-updates are currently handled by
`tooling/p2p-dev-update.mjs`, which publishes a dev manifest and archive over a
peer HTTP endpoint. That is intentionally separate from canonical replication:
it moves runtime files for testing, while the events below describe data-plane
replication posture.

## Collab frame lane

Live prose frames are not individual canonical events. `ema_collab` owns the
durable frame ledger and exposes a local replication boundary:

- `frames_since(document_id, after_revision)` returns a `CollabFrameBacklog`.
- `apply_frame(document_id, frame_id, revision, text, actor, created_at)`
  applies one frame idempotently and rejects revision gaps.

The future Iroh stream should move those frames between trusted devices, then
use the batch events below to describe replication posture. Until peer trust,
leases, and signed transport land, `ema_replication.replication_enabled()`
remains false.

The local planner is intentionally pure:

- peer cursor revision == local revision → `in_sync`
- peer cursor revision < local revision → send `frames_since(after_revision)`
- peer cursor revision > local revision → peer is ahead; require resync logic
  rather than guessing or truncating

The daemon implementation must gate this local boundary through peer trust:

- `ema_replication/ema_collab_sync.frames_since_for_peer(...)` only exports
  frames when `peer.trust_established` is active for `(org_id, peer_device)`.
- `ema_replication/ema_collab_sync.apply_frame_from_peer(...)` only applies
  frames from an active trusted peer and records the peer device as the frame
  actor.
- Transport implementations, including the future Iroh sidecar, should remain
  byte pipes and call this gate rather than reading `ema_collab` directly.

### `replication.batch_sent`
```
payload {
  to_device: device:<ulid>
  from_txid: int
  to_txid:   int
  count:     int
}
```

### `replication.batch_applied`
```
payload {
  from_device: device:<ulid>
  applied_up_to_txid: int
  new_checksum: hex
}
```

### `replication.diverged`
```
payload {
  peer_device:       device:<ulid>
  local_txid:        int
  local_checksum:    hex
  peer_txid:         int
  peer_checksum:     hex
  divergence_point?: int     // highest shared txid if known
}
```

### `replication.resynced`
```
payload {
  peer_device:      device:<ulid>
  resolved_at_txid: int
  resolution:       "snapshot_from_peer" | "kept_local" | "user_merge"
}
```
