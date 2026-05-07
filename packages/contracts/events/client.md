# client

Owner: `ema_clients` (Elixir context, new in cwt-absorption buildout).

Clients are first-class records as of 2026-05-07 (per blueprint 09 of the
cwt project: `ema-central-tracker-promotion`). One client owns many
`project` records via the `project.client_id` foreign key (kind="client"
projects only). The denormalized cache (`project.client_label`,
`project.client_color`) is refreshed by the daemon on every
`client.renamed` / `client.recolored` event.

## Kinds

### `client.added`
```
payload {
  client_id:   client:<ulid>
  org_id:      org:<ulid>
  space_id:    space:<ulid>
  name:        string
  contact?:    string                  // email or note line
  color?:      string                  // sidebar accent hex, e.g. "#5b8def"
  status:      "active"                // initial state; paused/archived only via later events
  tags?:       string[]
  added_by:    actor:<ulid> | user:<ulid> | system:<component>
}
```

### `client.renamed`
```
payload {
  client_id: client:<ulid>
  from:      string
  to:        string
  renamed_by: actor:<ulid> | user:<ulid> | system:<component>
}
```

After this event, the daemon refreshes `project.client_label` on every
project where `project.client_id == client_id`.

### `client.recolored`
```
payload {
  client_id: client:<ulid>
  from?:     string                    // previous hex; nullable
  to:        string                    // new hex
  recolored_by: actor:<ulid> | user:<ulid> | system:<component>
}
```

After this event, the daemon refreshes `project.client_color` on every
project where `project.client_id == client_id`.

### `client.contact_updated`
```
payload {
  client_id: client:<ulid>
  to:        string | null             // null clears the contact
  updated_by: actor:<ulid> | user:<ulid> | system:<component>
}
```

### `client.tagged`
```
payload {
  client_id: client:<ulid>
  tags:      string[]                  // tags to add (set-merge with existing)
  tagged_by: actor:<ulid> | user:<ulid> | system:<component>
}
```

### `client.untagged`
```
payload {
  client_id: client:<ulid>
  tags:      string[]                  // tags to remove
  untagged_by: actor:<ulid> | user:<ulid> | system:<component>
}
```

### `client.paused`
```
payload {
  client_id: client:<ulid>
  reason?:   string
  paused_by: actor:<ulid> | user:<ulid> | system:<component>
}
```

### `client.resumed`
```
payload {
  client_id: client:<ulid>
  reason?:   string
  resumed_by: actor:<ulid> | user:<ulid> | system:<component>
}
```

### `client.archived`
```
payload {
  client_id: client:<ulid>
  reason?:   string
  archived_by: actor:<ulid> | user:<ulid> | system:<component>
}
```

A client cannot be archived while it has at least one non-archived
`project` with `kind="client"` and `client_id == client_id`. The daemon
rejects `client.archived` events that violate this invariant.

### `client.restored`
```
payload {
  client_id: client:<ulid>
  restored_by: actor:<ulid> | user:<ulid> | system:<component>
}
```

Restoring an archived client returns its status to "active" and clears
`archived_at` on the projection.

## Invariants

These are enforced at the daemon-projection layer and re-asserted on
replay:

1. A `Project` with `kind="client"` has `client_id != null`.
2. A `Project` with `kind != "client"` has `client_id == null`.
3. `Project.client_label` and `Project.client_color` are denormalized
   caches of `Client.name` and `Client.color`. The daemon refreshes them
   whenever the corresponding event is consumed.
4. A client cannot be archived while linked client-kind projects exist.

These mirror the `CLIENT_INVARIANTS` constant in cwt's
`packages/contracts/src/records/client.ts` (the donor record).
