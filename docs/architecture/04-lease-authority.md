# 04 — Lease authority

EMA uses a static-lease primary/replica model inspired by LiteFS, with no
external coordinator (no Consul, no etcd).

## Roles

- **Home** — the node that holds the current valid lease for an
  organization's canonical data. Exactly one home at a time.
- **Replica** — any other node holding a copy of the canonical log and
  applying it to its local SQLite.

## Lease record

Stored in the canonical log as a `lease.issued` / `lease.renewed` event;
the current lease is always the latest such event that has not been
superseded or expired.

```
lease {
  lease_id:         lease:<ulid>
  org_id:           org:<ulid>
  holder:           device:<ulid>
  issued_at:        ISO-8601 UTC
  expires_at:       ISO-8601 UTC        (issued_at + TTL)
  txid_at_issue:    int                 (monotonic log position)
  checksum_at_issue: hex                (rolling CRC64 of log up to txid)
  signature:        hex                 (Ed25519 over the above, signed by holder device key)
}
```

## Renewal

- TTL defaults to 30s in dev, longer in prod.
- Holder renews every `TTL / 3` while online.
- Clean shutdown appends `lease.released` → immediate re-election.
- Crash without release: replicas wait for `expires_at` before electing.

## Election

When no valid lease exists for an org, the highest-priority reachable
device for that org appends `lease.issued` with itself as holder.
Priority = (is_preferred_home, txid_at_last_seen, device_id lex order).
Ties broken deterministically so two replicas never both elect.

## Split-brain resolution

If two lease events exist with overlapping time ranges:

1. Whichever has the higher `txid_at_issue` wins.
2. If tied on txid but checksums differ, the log has forked — both sides
   must stop accepting writes and route to the **divergence UX**: user
   chooses to promote, discard, or fork the provisional branch.

## Peer UI states (measurable)

The four UI states in the data-treatment doc map to concrete lease math:

| UI state              | Condition                                                         |
| --------------------- | ----------------------------------------------------------------- |
| `home_current`        | Local device holds a non-expired lease.                           |
| `replica_current`     | Not holder; last applied txid ≥ lease.txid_at_issue - N and CRC matches chain. |
| `replica_provisional` | Holds a provisional lease under fallback (home unreachable, TTL crossed). |
| `replica_stale`       | Behind by > N txids OR checksum divergence not yet resolved.      |

`N` is per-org, default 64.

## Out of scope for 0.0.5 wave 1

The `lease.*` event family ships in the catalog with full payload shapes,
but the election + renewal + replication transport is implementation work
for a later wave. What's in this wave: the record shape, the event family
stubs, the UI-state mapping table.
