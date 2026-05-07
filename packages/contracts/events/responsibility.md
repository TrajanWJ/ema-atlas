# responsibility

Owner: `ema_responsibilities` (Elixir context, new in cwt-absorption buildout).

A responsibility is a durable ongoing duty — a *standing intent* — distinct
from a `lane` (per-task ownership) or a `queue_item` (a discrete to-do).
Responsibilities live across sessions, recur on a known cadence, and surface
in the cockpit's STANDING section so the operator never has to re-remember
them.

This is the record family that maps to the cockpit's "persistent fields"
surface (`/standing`).

## Kinds

### `responsibility.added`
```
payload {
  responsibility_id: responsibility:<ulid>
  org_id:            org:<ulid>
  space_id:          space:<ulid>
  project_id?:       project:<ulid>             // optional scope; null = workspace-wide
  title:             string
  why:               string
  cadence:           "daily" | "weekly" | "monthly" | "quarterly" | "ongoing"
  status:            "active"                    // initial; paused/retired via later events
  tags?:             string[]
  added_by:          actor:<ulid> | user:<ulid> | system:<component>
}
```

### `responsibility.retitled`
```
payload {
  responsibility_id: responsibility:<ulid>
  from:              string
  to:                string
  retitled_by:       actor:<ulid> | user:<ulid> | system:<component>
}
```

### `responsibility.why_updated`
```
payload {
  responsibility_id: responsibility:<ulid>
  to:                string
  updated_by:        actor:<ulid> | user:<ulid> | system:<component>
}
```

### `responsibility.cadence_changed`
```
payload {
  responsibility_id: responsibility:<ulid>
  from:              "daily" | "weekly" | "monthly" | "quarterly" | "ongoing"
  to:                "daily" | "weekly" | "monthly" | "quarterly" | "ongoing"
  changed_by:        actor:<ulid> | user:<ulid> | system:<component>
}
```

### `responsibility.scoped`
```
payload {
  responsibility_id: responsibility:<ulid>
  to_project_id:     project:<ulid> | null      // null = unscope to workspace-wide
  scoped_by:         actor:<ulid> | user:<ulid> | system:<component>
}
```

### `responsibility.tagged`
```
payload {
  responsibility_id: responsibility:<ulid>
  tags:              string[]                    // tags to add (set-merge)
  tagged_by:         actor:<ulid> | user:<ulid> | system:<component>
}
```

### `responsibility.untagged`
```
payload {
  responsibility_id: responsibility:<ulid>
  tags:              string[]                    // tags to remove
  untagged_by:       actor:<ulid> | user:<ulid> | system:<component>
}
```

### `responsibility.paused`
```
payload {
  responsibility_id: responsibility:<ulid>
  reason?:           string
  paused_by:         actor:<ulid> | user:<ulid> | system:<component>
}
```

A paused responsibility is hidden from the cockpit's STANDING section's
default view but remains in the projection for later resume.

### `responsibility.resumed`
```
payload {
  responsibility_id: responsibility:<ulid>
  reason?:           string
  resumed_by:        actor:<ulid> | user:<ulid> | system:<component>
}
```

### `responsibility.retired`
```
payload {
  responsibility_id: responsibility:<ulid>
  reason?:           string
  retired_by:        actor:<ulid> | user:<ulid> | system:<component>
}
```

A retired responsibility is final — it stays in the event log for history
but no `responsibility.resumed` event applies after retirement. To bring
it back, the operator emits a fresh `responsibility.added` with a new ID.

## Invariants

1. `cadence` value is closed-set: daily / weekly / monthly / quarterly /
   ongoing. No free-form cadences.
2. `status` transitions: active → paused → active (any number of times),
   active → retired (terminal), paused → retired (terminal). No path back
   from retired.
3. If `project_id` is set on `responsibility.added`, the daemon validates
   the project exists and is non-archived; otherwise rejects.
4. The cockpit `/standing` projection groups by `cadence` and filters
   `status == "active"` by default. The "show all" toggle includes paused
   but never retired (those go to a separate history view, out of scope
   for this buildout).

These mirror cwt's `Responsibility` record at
`packages/contracts/src/records/responsibility.ts`.
