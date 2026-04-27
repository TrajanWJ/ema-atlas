# Collab document types

Shared shapes for BEAM-owned live document rooms.

## CollabDocumentTarget

```
CollabDocumentTarget =
  | { kind: "blueprint_section", id: blueprint_sec:<ulid> }
```

The first supported target is a Blueprint section prose body. Do not introduce
path-style room names; room identity is the typed target id.

## CollabFrame

Durable row owned by `ema_collab`, persisted outside the coarse canonical
event log.

```
CollabFrame {
  frame_id:   collab_frame:<ulid>
  target:     CollabDocumentTarget
  kind:       "replace" | "checkpoint"
  revision:   int
  text:       string
  text_sha256: hex
  actor:      user:<ulid> | device:<ulid> | system:ema_collab
  created_at: ISO-8601 UTC
}
```

For v0, `collab.document.replace` writes a whole-body replacement frame. Later
CRDT/update-frame formats can add frame kinds without changing the IPC command
names or projection name.

## CollabFrameBacklog

Internal daemon/replication shape returned by `ema_collab.frames_since`.
This is not browser document authority; it is the durable frame backlog that a
trusted machine peer stream will move.

```
CollabFrameBacklog {
  document_id:    blueprint_sec:<ulid>
  target:         CollabDocumentTarget
  after_revision: int
  frames:         CollabFrame[]
}
```

`ema_collab.apply_frame` MUST be idempotent by `frame_id` and MUST reject
revision gaps. That keeps the first Iroh stream simple: request frames after the
last applied revision, apply in ascending revision order, then fan out the live
`collab.document` projection locally.

## CollabPeerCursor

Durable local bookkeeping for a trusted peer's progress through one document's
frame ledger. This is not a trust grant and does not imply the peer is paired;
`peer.*`, `device.*`, lease, and signed transport still gate real replication.

```
CollabPeerCursor {
  peer_device_id: device:<ulid>
  document_id:    blueprint_sec:<ulid>
  target:         CollabDocumentTarget
  last_revision:  int
  last_frame_id:  collab_frame:<ulid> | ""
  updated_at:     ISO-8601 UTC | ""
}
```

`ema_collab.mark_peer_applied` may only advance the cursor to a frame that
already exists locally for the same `(document_id, revision, frame_id)`. A stale
revision MUST NOT move `last_revision` or `last_frame_id` backwards, and an
unknown or mismatched frame MUST be rejected.

## CollabDocumentProjection

```
CollabDocumentProjection {
  target:       CollabDocumentTarget
  title?:       string
  text:         string
  revision:     int
  status:       "opening" | "live" | "saving" | "offline"
  authority:    "beam"
  updated_at?:  ISO-8601 UTC
  presence: [
    {
      session_id: access_session:<ulid>
      user_id?: user:<ulid>
      display_name?: string
      color?: string
      cursor?: int
      selection_start?: int
      selection_end?: int
      last_seen_at: ISO-8601 UTC
    }
  ]
}
```

Presence is ephemeral and MUST NOT be reconstructed as canonical history.
