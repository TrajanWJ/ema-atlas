# 07 — git-ema

`git-ema` is EMA's attachments + external-source subsystem. Think of it
as "Google Drive or GitHub, but native to EMA." It has two halves:

1. **`ema_attachments`** — the daemon bounded context that owns truth for
   attachments and connectors.
2. **`git-ema`** — the vApp surface that renders it.

Every EMA object (project, space, blueprint section, proposal, lane,
incident, …) can reference an attachment by id. No EMA object stores raw
file bytes. The attachment **record** is canonical truth; the attachment
**content** is external (a pointer to Drive, GitHub, a git URL, or a local
blob).

This is adjacent to, but distinct from, Git-backed project storage. EMA project
records are materialized as local Git worktrees by default; `git-ema` links
external repos/files into those projects. See
`docs/architecture/22-git-backed-project-storage.md`.

## Data plane

Attachments are plane-5 (external/imported) per the data-treatment doc.
The pointer lives in plane 1 (canonical). The content lives outside EMA
and is pulled on demand.

## Attachment record

```
attachment {
  id:            attachment:<ulid>
  kind:          "file" | "folder" | "git_repo" | "git_path"
                | "drive_file" | "drive_folder"
  source:        "local" | "google_drive" | "github" | "git_url"
  display_name:  string
  mime:          string | null          // files only
  size_bytes:    int | null
  source_ref:    SourceRef              // discriminated by source
  linked_to:     [ { object_kind, object_id } ]
                                        // reverse index of attach points
  created_by:    device:<ulid>
  created_at:    ISO-8601 UTC
  updated_at:    ISO-8601 UTC
}
```

`SourceRef` shapes:

- `local`:        `{ blob_id }`
- `google_drive`: `{ drive_file_id, owner_email }`
- `github`:       `{ owner, repo, ref?, path? }`
- `git_url`:      `{ url, ref?, path? }`

## Connector record (demo stub)

```
connector {
  id:            connector:<ulid>
  user_id:       user:<ulid>
  provider:      "google_drive" | "github"
  status:        "disconnected" | "connected"
  connected_at:  ISO-8601 UTC | null
  fake:          true      // explicit marker; real OAuth removes this field later
  display_label: string    // e.g. "demo@example.com" or "gh:demo-user"
}
```

## Events (in catalog)

See `packages/contracts/events/attachment.md`:

- `attachment.created`
- `attachment.renamed`
- `attachment.deleted`
- `attachment.linked`       (to an object — emits both the attachment-side and mirror family events)
- `attachment.unlinked`

And `packages/contracts/events/connector.md`:

- `connector.connected`     (demo-stubbed this wave)
- `connector.disconnected`
- `connector.linked_resource_imported`
  (user picked something from a fake picker and it became an attachment)

## Demo OAuth flow

There is **no** real OAuth in this wave.

1. User clicks **Connect Google Drive** or **Connect GitHub** in the
   connectors panel.
2. Surface sends an IPC command: `{ op: "connector.connect", provider }`.
3. Daemon's `ema_attachments.connectors` writer appends
   `connector.connected` with `fake: true` and a hard-coded
   `display_label`.
4. Projection flips to `connected`. Button becomes **Disconnect**.
5. In `connected` state a **Browse…** button opens a fake picker with
   a hard-coded in-memory catalog:
   - Drive: a few sample Docs, Sheets, folders.
   - GitHub: a few sample repos and repo/path combos.
6. Selecting items creates attachments via `attachment.created` plus one
   `connector.linked_resource_imported`.
7. **Disconnect** appends `connector.disconnected`; existing attachments
   stay (their pointer is dead but the record is preserved for audit;
   surface marks them "source unreachable").

## Replacing stubs with real OAuth (later)

When real OAuth ships:

- `fake: true` is dropped and replaced by `token_ref: secret_ref:<...>`
  pointing into the daemon's secret store.
- `connector.connect_requested` → redirect → `connector.connect_completed`
  becomes the canonical ceremony.
- Fake picker is replaced by real Drive / GitHub API calls, behind the
  same IPC commands so the surface doesn't change shape.

Surface code today should treat connector state as opaque — never inspect
`fake` directly.

## Surface layout (apps/web/src/vapps/git-ema)

- `index.tsx` — standalone page at `/git-ema`.
- `connectors-panel.tsx` — the two stub buttons + state display.
- `attachment-list.tsx` — current-project attachment list.
- `attach-to-object.tsx` — reusable dialog any vApp can render. Takes an
  `object_kind` + `object_id`, lets user either pick from existing
  attachments or add a new one (which routes through a connector or a
  pasted URL).

## Anti-silo rule

Other vApps never open their own attachment stores. They open the
**attach dialog** from git-ema, receive an `attachment:<ulid>`, and
reference it.

## Deduplication + collision rules

When a user imports the same external resource twice (same connector,
same `source_ref`), the daemon MUST NOT create a second attachment.
Instead:

1. Look up by `(source, normalized_source_ref)`; a match short-circuits
   the import.
2. Emit `connector.linked_resource_imported` with the **existing**
   `attachment_id`. No `attachment.created` is emitted.
3. If metadata (display_name, mime, size_bytes) has drifted, emit
   `attachment.renamed` or a future `attachment.metadata_refreshed`
   event — never mutate silently.

`normalized_source_ref` is family-specific:

- `google_drive`: `drive_file_id` alone (ignore `owner_email` for dedup;
  ownership change doesn't create a new attachment).
- `github`: `(owner, repo, ref || "default", path || "")`.
- `git_url`: the URL after stripping trailing `.git` and normalizing case.
- `local`: `blob_id` (content-addressed, so already unique).

## Source-unreachable semantics

When a connector is disconnected (or in the real world, when a token
expires):

- Attachment records are **preserved**. They remain in projections with
  a `source_unreachable: true` derived flag.
- Linked-to relationships are **preserved**. A proposal or blueprint
  section that references an unreachable attachment still shows it,
  greyed, with a re-connect affordance.
- Deleting an attachment is an explicit `attachment.delete` — never
  implicit on disconnect.

## What the surface MUST NOT do

- Never dedupe on the surface side. The daemon is authoritative on
  identity.
- Never hold raw file bytes in a vApp's own state. If a future wave
  adds local preview, it goes through `ema_attachments`' blob store.
- Never inspect `connector.fake`. It's a wire-format marker, not a
  UI signal.
