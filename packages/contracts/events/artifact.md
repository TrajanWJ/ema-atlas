# artifact

Daemon-canonical artifact events. Artifact content is content-addressed and
stored by the daemon; event payloads carry the pointer and hash needed to
replay artifact state without consulting project-local sidecar indexes.

Owner: `ema_artifact`.

## Kinds

### `artifact.created`
```
payload {
  artifact_id:  artifact:<ulid>
  kind:         "report" | "note" | "output" | "session_log" | "proof" | "other"
  project:      string
  created_by:   actor reference
  content_hash: sha256 string
  storage_path: string
  bytes:        int
  metadata:     object
}
```

### `artifact.updated`
Same payload fields as `artifact.created`; `metadata` should identify the
update source and any human-facing title.

### `artifact.linked`
Same payload fields as `artifact.created`; `metadata` includes `target_kind`
and `target_id`.

### `artifact.archived`
Same payload fields as `artifact.created`; `metadata` includes the archive
reason when one was supplied.
