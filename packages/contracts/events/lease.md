# lease

Owner: `ema_replication`.

See `docs/architecture/04-lease-authority.md` for the full lease design.

## Kinds

### `lease.issued`
```
payload {
  lease_id:          lease:<ulid>
  org_id:            org:<ulid>
  holder:            device:<ulid>
  issued_at:         ISO-8601 UTC
  expires_at:        ISO-8601 UTC
  txid_at_issue:     int
  checksum_at_issue: hex
  signature:         hex          // Ed25519 by holder
}
```

### `lease.renewed`
```
payload {
  lease_id:       lease:<ulid>
  new_expires_at: ISO-8601 UTC
  at_txid:        int
  at_checksum:    hex
  signature:      hex            // Ed25519 by holder
}
```

### `lease.released`
```
payload {
  lease_id:    lease:<ulid>
  at_txid:     int
  at_checksum: hex
}
```

### `lease.expired`
```
payload {
  lease_id: lease:<ulid>
}
```

### `lease.superseded`
```
payload {
  old_lease_id: lease:<ulid>
  new_lease_id: lease:<ulid>
  reason:       "split_brain_resolved" | "election_after_expiry"
}
```
