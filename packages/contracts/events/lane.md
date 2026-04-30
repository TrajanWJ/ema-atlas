# lane

Owner: `ema_swarm_coordination`.

Lanes are first-class coordination objects: a named workstream inside
a project that groups ownership, queue, and handoff context for active work.

## Kinds

### `lane.opened`
```
payload {
  lane_id:                lane:<ulid>
  project_id?:            project:<ulid>
  mission_id?:            mission:<ulid>
  title:                  string
  name:                   string
  scope?:                 string
  done_when?:             string
  depends_on?:            string
  opened_by:              actor:<ulid> | user:<ulid> | system:<component>
  status:                 "idea" | "ready" | "active" | "review" | "blocked" | "done"
  blueprint_section_id?:  blueprint_sec:<ulid>
  blueprint_gac_id?:      blueprint_gac:<ulid>
  blueprint_decision_id?: blueprint_dec:<ulid>
}
```

The three `blueprint_*_id` fields are workspace ↔ blueprint cross-references
introduced in `docs/architecture/08-workspace-blueprint-cross-refs.md`.
All three are optional and additive; old events remain valid.

### `lane.claimed`
```
payload {
  lane_id:     lane:<ulid>
  actor_id:    actor:<ulid>
  scope:       string
  goal:        string
  next:        string
  refresh_by?: string
  blocker?:    string
}
```

### `lane.moved`
```
payload {
  lane_id:   lane:<ulid>
  to_status: "idea" | "ready" | "active" | "review" | "blocked" | "done"
  moved_by:  actor:<ulid> | user:<ulid> | system:<component>
}
```

### `lane.released`
```
payload {
  lane_id:     lane:<ulid>
  actor_id:    actor:<ulid>
  handoff_id?: handoff:<ulid>
  reason?:     string
}
```

### `lane.blocked`
```
payload {
  lane_id:     lane:<ulid>
  reason:      string
  depends_on?: string
  blocked_by:  actor:<ulid> | user:<ulid> | system:<component>
}
```

### `lane.closed`
```
payload {
  lane_id: lane:<ulid>
  reason?: string
  verify?: string
  closed_by?: actor:<ulid> | user:<ulid> | system:<component>
}
```

Historical note: earlier drafts used `lane.item_added` / `lane.item_moved`
for a kanban-container object. EMA 0.0.5 now reserves `lane.*` for ownership
tracks. Backlog work discovered during execution belongs in `queue_item.*`.
