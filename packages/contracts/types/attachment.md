# attachment (record)

```
attachment {
  id:           attachment:<ulid>
  kind:         AttachmentKind
  source:       AttachmentSource
  display_name: string
  mime:         string | null            // files only
  size_bytes:   int | null
  source_ref:   SourceRef                // discriminated by source
  linked_to:    [ LinkPoint ]
  created_by:   device:<ulid>
  created_at:   ISO-8601 UTC
  updated_at:   ISO-8601 UTC
}

AttachmentKind =
  | "file"
  | "folder"
  | "git_repo"
  | "git_path"
  | "drive_file"
  | "drive_folder"

AttachmentSource =
  | "local"
  | "google_drive"
  | "github"
  | "git_url"

SourceRef =
  | { source: "local",        blob_id: string }
  | { source: "google_drive", drive_file_id: string, owner_email: string }
  | { source: "github",       owner: string, repo: string, ref?: string, path?: string }
  | { source: "git_url",      url: string, ref?: string, path?: string }

LinkPoint = {
  object_kind: "project" | "space" | "blueprint_section" | "proposal"
             | "incident" | "lane_item"
  object_id:   string
}
```

## Invariants

- `source_ref.source` MUST equal `attachment.source`.
- `kind` × `source` must be consistent:
  - `drive_*` ↔ `google_drive`
  - `git_*`   ↔ `github` or `git_url`
  - `file`    ↔ any source except `github` where path is absent
  - `folder`  ↔ `local` or `google_drive`
- `linked_to` is a projection derived from `attachment.linked`/`unlinked`
  events, not stored directly.
