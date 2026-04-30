# queue_item

Owner: `ema_swarm_coordination`.

Queue items are schedulable follow-up work discovered while agents or humans
are executing a lane. They preserve dependencies and done-when conditions so
work does not disappear into chat scrollback.

## Kinds

### `queue_item.added`
```
payload {
  queue_item_id:          queue_item:<ulid>
  project_id?:            project:<ulid>
  mission_id?:            mission:<ulid>
  lane_id?:               lane:<ulid>
  title:                  string
  why:                    string
  done_when?:             string
  depends_on?:            string
  blocked_by?:            string
  source?:                string
  added_by:               actor:<ulid> | user:<ulid> | system:<component>
  status:                 "ready" | "blocked"
  blueprint_section_id?:  blueprint_sec:<ulid>
  blueprint_gac_id?:      blueprint_gac:<ulid>
  blueprint_decision_id?: blueprint_dec:<ulid>
}
```

The three `blueprint_*_id` fields are workspace ↔ blueprint cross-references
introduced in `docs/architecture/08-workspace-blueprint-cross-refs.md`.
All three are optional and additive; old events remain valid.

### `queue_item.ready`
```
payload {
  queue_item_id: queue_item:<ulid>
  reason?:       string
  marked_by:     actor:<ulid> | user:<ulid> | system:<component>
}
```

### `queue_item.blocked`
```
payload {
  queue_item_id: queue_item:<ulid>
  blocked_by:    string
  reason?:       string
  marked_by:     actor:<ulid> | user:<ulid> | system:<component>
}
```

### `queue_item.closed`
```
payload {
  queue_item_id: queue_item:<ulid>
  result?:       string
  verify?:       string
  closed_by:     actor:<ulid> | user:<ulid> | system:<component>
}
```
