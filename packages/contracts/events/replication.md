# replication

Owner: `ema_replication`.

## Kinds

## Dev-build update lane

Dev-build self-updates are currently handled by
`tooling/p2p-dev-update.mjs`, which publishes a dev manifest and archive over a
peer HTTP endpoint. That is intentionally separate from canonical replication:
it moves runtime files for testing, while the events below describe data-plane
replication posture.

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
