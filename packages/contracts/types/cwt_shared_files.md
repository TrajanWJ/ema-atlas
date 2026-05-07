# cwt.shared_files

Owner: `current-work-tracker-trajan` until imported by EMA.

This is a projection contract, not a canonical EMA event family. It exists so
EMA surfaces and agents can inspect CWT's local work-state mirror without
coupling to CWT's SQLite schema.

## Projection Name

`cwt.shared_files`

## Authority

- Source authority today: CWT local SQLite.
- Transport today: Desktop shared filesystem projection.
- EMA authority: preview-only until a daemon import writer records canonical
  events.

## Shape

```ts
type CwtSharedFilesProjection = {
  source: "cwt.shared_files" | string
  status: "missing_projection" | "projection_found" | "stale" | "writer_pending" | string
  root: string
  generated_at: string | null
  projection: "cwt-shared-files-v0" | string | null
  counts: {
    projects?: number
    lanes?: number
    queue_items?: number
    campaigns?: number
    problems?: number
    handoffs?: number
    vcalendar_blocks?: number
    executions?: number
    responsibilities?: number
    checkups?: number
  }
  local_n_sync: {
    mode?: "file_projection" | string
    namespace?: string
    index?: string
    current_state?: string
  } | null
  project_storage?: {
    driver: "git_worktree" | string
    versioning: "git" | string
    target_policy: "project_git_repo" | "preview_only" | string
  }
  promotion_boundary: "preview_only" | "daemon_writer_ready" | string
}
```

## Required Validation Before Import

- Every imported queue item has `title`, `why`, `done_when`, and `source`.
- Every imported scoped record has `org_id`, `space_id`, and `project_id`.
- CWT-only local envelope fields are kept as provenance or stripped before
  canonical EMA writes.
- `project.kind` is treated as a known CWT extension until `@ema/contracts`
  either adopts it or exposes an equivalent classification field.
- CWT project and queue previews must name their target EMA project storage
  policy. The default target is a daemon-materialized project Git worktree, not
  an unversioned shared-files folder.
