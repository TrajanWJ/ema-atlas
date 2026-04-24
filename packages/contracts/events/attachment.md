# attachment

Owner: `ema_attachments` (the git-ema backend).

See `docs/architecture/07-git-ema.md` and `types/attachment.md`.

## Kinds

### `attachment.created`
```
payload {
  attachment_id: attachment:<ulid>
  kind:          "file" | "folder" | "git_repo" | "git_path"
               | "drive_file" | "drive_folder"
  display_name:  string
  mime?:         string
  size_bytes?:   int
  source_ref:
    | { source: "local",        blob_id: string }
    | { source: "google_drive", drive_file_id: string, owner_email: string }
    | { source: "github",       owner: string, repo: string, ref?: string, path?: string }
    | { source: "git_url",      url: string, ref?: string, path?: string }
  created_by:    device:<ulid>
}
```

The `source` discriminator on `source_ref` is authoritative; a separate
top-level `source` field is NOT emitted. Consumers switch on
`source_ref.source`.

### `attachment.renamed`
```
payload {
  attachment_id: attachment:<ulid>
  from:          string
  to:            string
}
```

### `attachment.deleted`
```
payload {
  attachment_id: attachment:<ulid>
  deleted_by:    user:<ulid>
  reason?:       string
}
```

### `attachment.linked`
```
payload {
  attachment_id: attachment:<ulid>
  object_kind:   "project" | "space" | "blueprint_section" | "proposal"
               | "incident" | "lane_item"
  object_id:     string
  by:            user:<ulid>
}
```

`object_id` MUST carry the typed prefix matching `object_kind`:

| `object_kind`       | `object_id` prefix   |
| ------------------- | -------------------- |
| `project`           | `project:`           |
| `space`             | `space:`             |
| `blueprint_section` | `blueprint_sec:`     |
| `proposal`          | `proposal:`          |
| `incident`          | `incident:`          |
| `lane_item`         | lane item id (carries its own kind; see `lane.md`) |

Contexts that want to know about attachments on their own objects SHOULD
subscribe to `attachment.linked` and filter on `object_kind`. They MAY
also mirror it into their own family (e.g. `blueprint.attachment.linked`)
for convenience — the mirror is always appended *after* the canonical
event, in the same writer call. See
`docs/architecture/06-blueprint-boundaries.md` for mirror-event ordering
and failure semantics.

### `attachment.unlinked`
```
payload {
  attachment_id: attachment:<ulid>
  object_kind:   "project" | "space" | "blueprint_section" | "proposal"
               | "incident" | "lane_item"
  object_id:     string         // same prefix-matching rule as attachment.linked
  by:            user:<ulid>
}
```
