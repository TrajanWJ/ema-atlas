# collab

Owner: `ema_collab`.

BEAM-owned live document rooms. The collab family records durable boundary
facts for live prose documents; high-frequency edit/update frames live in the
collab document store owned by the BEAM room process, not in the coarse
canonical event log.

The first target is Blueprint prose, addressed by `blueprint_sec:<ulid>`.
The protocol is intentionally target-shaped so future EMA document kinds can
reuse the same room contract without a new command family.

## Kinds

### `collab.document.checkpointed`

Emitted when the room commits a durable checkpoint for a document body. This
event is metadata: it lets the canonical log and projections know a checkpoint
exists, while the actual body/update frame remains in the collab store.

```
payload {
  target: {
    kind: "blueprint_section"
    id:   blueprint_sec:<ulid>
  }
  frame_id:       collab_frame:<ulid>
  revision:       int
  text_sha256:    hex
  checkpointed_by: user:<ulid> | device:<ulid> | system:ema_collab
  checkpointed_at: ISO-8601 UTC
  previous_revision?: int
}
```

## Non-events

- Opening a document room is not a canonical event. Use the IPC command
  `collab.document.open`; the room replies with the `collab.document`
  projection.
- Presence changes are not canonical events. They are ephemeral fields on the
  `collab.document` projection.
- Per-keystroke or CRDT update frames are not canonical events. The BEAM room
  persists them as collab frames and may periodically emit
  `collab.document.checkpointed`.
- Peer replication uses the daemon-internal frame boundary:
  `ema_collab.frames_since` exports frames after a revision and
  `ema_collab.apply_frame` applies a received frame idempotently. Transport
  events remain in `replication.*`; collab frames themselves stay out of the
  coarse canonical event log.

## Authority

The document authority is the supervised BEAM room process. Node, Yjs,
Hocuspocus, browser localStorage, Google Docs, and Google Drive MUST NOT be
document authority for EMA live prose.
