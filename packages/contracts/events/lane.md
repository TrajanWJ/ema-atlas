# lane

Owner: (future) `ema_swarm_coordination`.

Lanes are first-class coordination objects: a named workstream inside
a project that groups items (issues, tasks, proposals-in-flight). This
wave ships the event family stubs only; implementation is a later wave.

## Kinds

### `lane.opened`
```
payload {
  lane_id:    lane:<ulid>
  project_id: project:<ulid>
  name:       string
  opened_by:  user:<ulid>
}
```

### `lane.closed`
```
payload {
  lane_id: lane:<ulid>
  reason?: string
}
```

### `lane.item_added`
```
payload {
  lane_id: lane:<ulid>
  item:
    | { kind: "proposal",          id: proposal:<ulid> }
    | { kind: "incident",          id: incident:<ulid> }
    | { kind: "blueprint_section", id: blueprint_sec:<ulid> }
    | { kind: "attachment",        id: attachment:<ulid> }
  position: int
}
```

### `lane.item_moved`
```
payload {
  lane_id:       lane:<ulid>
  item_id:       string          // typed id matching the kind in lane.item_added
  from_position: int
  to_position:   int
}
```

`item_id` MUST carry the typed prefix (`proposal:`, `incident:`,
`blueprint_sec:`, `attachment:`) of the lane entry being moved.
