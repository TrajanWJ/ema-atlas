# peer

Owner: `ema_replication`.

## Kinds

### `peer.seen`
```
payload {
  peer_device: device:<ulid>
  last_txid:   int
  last_checksum: hex
  seen_at:     ISO-8601 UTC
}
```

### `peer.unreachable`
```
payload {
  peer_device:  device:<ulid>
  last_seen_at: ISO-8601 UTC
}
```

### `peer.trust_established`

Emitted on both devices after a successful pairing ceremony. Creates
the cryptographic trust root that authorizes replication between the
two devices.

```
payload {
  peer_device:       device:<ulid>    // the other side
  peer_pubkey:       hex              // Ed25519 public key
  local_pubkey:      hex              // this device's Ed25519 public key
  org_id:            org:<ulid>       // org scope of the trust
  ceremony_kind:     "qr_ble_hybrid" | "recovery_packet" | "genesis"
  ceremony_id:       string           // opaque, shared by both sides
  established_at:    ISO-8601 UTC
  lineage_proof:     hex              // signature over (peer_pubkey, local_pubkey, org_id, ceremony_id)
}
```

Invariants:
- Both paired devices MUST emit `peer.trust_established` with
  identical `ceremony_id` and symmetric key fields (A's `peer_pubkey`
  equals B's `local_pubkey` and vice-versa).
- `ceremony_kind: "genesis"` is reserved for the first device of an
  org (no counterpart — used to seed the trust root).

### `peer.trust_revoked`

```
payload {
  peer_device:  device:<ulid>
  revoked_at:   ISO-8601 UTC
  reason:       "user_requested" | "key_rotation" | "compromised" | "device_retired"
}
```

Consumers: `ema_replication` stops accepting events from the revoked
peer immediately; `ema_identity` marks the device as no longer trusted
for this org.
