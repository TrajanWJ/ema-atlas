# project

Owner: `ema_projects`.

## Kinds

### `project.created`
```
payload {
  project_id: project:<ulid>
  space_id:   space:<ulid>
  name:       string
  created_by: user:<ulid>
}
```

### `project.renamed`
```
payload {
  project_id: project:<ulid>
  from:       string
  to:         string
}
```

### `project.materialized`
```
payload {
  project_id:       project:<ulid>
  space_id:         space:<ulid>
  name:             string
  created_event_id: event:<ulid>
  status:           "materialized"
  local_path:       string
  storage_driver:   "git_worktree"
  versioning:       "git"
  git_repo_path:    string
  git_branch:       string
}
```

### `project.materialization_failed`
```
payload {
  project_id:       project:<ulid>
  space_id:         space:<ulid>
  name:             string
  created_event_id: event:<ulid>
  status:           "materialization_failed"
  reason:           string
}
```

### `project.archived`
```
payload {
  project_id: project:<ulid>
  reason?:    string
}
```

### `project.moved`
```
payload {
  project_id:     project:<ulid>
  from_space_id:  space:<ulid>
  to_space_id:    space:<ulid>
  lineage_note?:  string              // optional human reason
}
```

Moving a project preserves its id. The event log is the lineage —
consumers that care about space-local ordering should respect
`project.moved` and re-anchor.

## Storage Versioning Rule

EMA project storage is Git-backed by default. `project.materialized` means the
daemon created the project record folder and initialized a local Git worktree
at `local_path`.

The Git repo versions files, build artifacts, imported CWT records, and project
storage snapshots. EMA daemon events remain the canonical coordination truth;
Git is the storage/versioning substrate for project files and promotion
artifacts.

If Git initialization fails, project materialization fails with
`project.materialization_failed` rather than silently creating an unversioned
project record.
