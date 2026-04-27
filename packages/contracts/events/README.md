# Event catalog

See `catalog.v0.md` for the full, flat list of event kinds across every
family.

## Adding a kind

1. Add the kind to the family file (`<family>.md`) with its payload
   shape and consumers.
2. Add the kind to `catalog.v0.md` (single source of truth for the
   contract check).
3. Reference the kind in daemon + surface code.

The pre-commit contract check reads `catalog.v0.md` and fails if any
kind appears in code that is not listed here.

## Envelope (shared by every event)

```
event {
  event_id:      event:<ulid>
  kind:          <family>.<verb>[.<subverb>]
  ts:            ISO-8601 UTC
  actor:         actor:<ulid> | user:<ulid> | device:<ulid> | system:<component>
  org_id:        org:<ulid>
  space_id?:     space:<ulid>
  project_id?:   project:<ulid>
  dispatch_id?:  dispatch:<ulid>     // Hermes seam
  execution_id?: execution:<ulid>    // Hermes seam
  payload:       <family-specific>

  // Authorship (additive; wave-1 logs may omit — see below)
  signing_device?: device:<ulid>     // device that produced the signature
  signing_key?:    hex               // Ed25519 public key of signing_device
  signature?:      hex               // Ed25519 sig over the canonical-serialized fields above
}
```

### Signing rules

- **Wave 1:** `signing_*` fields are optional and typically absent.
  The daemon runs locally, there is no peer to verify anything, and
  unsigned events are accepted on replay.
- **Wave N (replication):** every event written after a daemon's
  first `peer.trust_established` event MUST carry
  `signing_device`, `signing_key`, and `signature`. The signature
  covers a canonical JSON serialization of all non-signature fields in
  the order listed above (see `types/envelope_signing.md` when that
  file lands).
- **Replay tolerance:** projections and replicas MUST accept unsigned
  events that precede the first `peer.trust_established` for the
  emitting device, and MUST reject unsigned events that follow it.
- **Key lookup:** `signing_key` is repeated on every event for
  offline verification; it MUST match the current key for
  `signing_device` as known through `device.registered` /
  `device.key_rotated` / `peer.trust_established`.
- See `../../docs/architecture/11-transport-and-auth-survey.md` §2
  for the broader auth model.

## Ordering + replay semantics

- **Per-daemon total order.** The bus assigns a monotonic `txid` to every
  event it appends. `event_id` is a ULID (time-prefixed) but the
  authoritative order is `txid`, not ULID time.
- **Causal pairs.** When one event logically depends on another
  (e.g. `attachment.linked` after `attachment.created`, or
  `blueprint.attachment.linked` mirroring `attachment.linked`), the
  *canonical* event MUST be appended first and the mirror MUST be
  appended in the same writer call. Projections rely on this to render
  coherently from any prefix of the log.
- **Replayable.** Any projection MUST be reconstructible from the
  canonical log alone, with no external state. If a projection needs
  something that isn't derivable from events (e.g. "last seen wall-clock
  time per device"), that's a bug — either add an event for it or drop
  the field.
- **Collab exception.** The live `collab.document` projection is backed by
  the BEAM collab room's durable frame store plus canonical checkpoint
  metadata. High-frequency document frames are not stuffed into the coarse
  event log; only `collab.document.checkpointed` crosses into canon.
- **Idempotent on replay.** Writers MUST be deterministic given the same
  input commands. Re-running the log on a fresh SQLite MUST produce the
  same projection output, up to hash.
- **No compaction in v0.** Events are never rewritten. A later wave may
  add compacted object tables as a read optimization; the log remains
  authoritative.

## Families

| Family        | File                | Owner context         |
| ------------- | ------------------- | --------------------- |
| actor         | `actor.md`          | ema_identity          |
| org           | `org.md`            | ema_orgs              |
| identity      | `identity.md`       | ema_identity          |
| space         | `space.md`          | ema_spaces            |
| project       | `project.md`        | ema_projects          |
| membership    | `membership.md`     | ema_memberships       |
| invite        | `invite.md`         | ema_invites           |
| access_session | `access_session.md` | ema_access_sessions   |
| device        | `device.md`         | ema_identity          |
| peer          | `peer.md`           | ema_replication       |
| lease         | `lease.md`          | ema_replication       |
| replication   | `replication.md`    | ema_replication       |
| lane          | `lane.md`           | (future) ema_swarm_coordination    |
| handoff       | `handoff.md`        | (future) ema_swarm_coordination    |
| proposal      | `proposal.md`       | (future) ema_swarm_coordination    |
| incident      | `incident.md`       | (future) ema_swarm_coordination    |
| dispatch      | `dispatch.md`       | ema_control seam      |
| execution     | `execution.md`      | ema_exec seam         |
| tool          | `tool.md`           | ema_exec seam         |
| blueprint     | `blueprint.md`      | ema_blueprint         |
| collab        | `collab.md`         | ema_collab            |
| attachment    | `attachment.md`     | ema_attachments       |
| connector     | `connector.md`      | ema_attachments       |
