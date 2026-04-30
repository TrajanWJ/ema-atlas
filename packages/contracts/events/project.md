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
