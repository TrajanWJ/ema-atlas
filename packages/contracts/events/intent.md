# intent

Owner: `ema_swarm_coordination`.

An intent is the canonical pipeline-floor unit of work. It is distinct from
`ema intention`, the harvested-session review surface.

## Kinds

### `intent.created`
```
payload {
  intent_id: string
  slug: string
  title: string
  body?: string
  kind: "bootstrap" | "feature" | "fix" | "research" | "doctrine" | "external"
  status: "open" | "proposed" | "accepted" | "executing" | "satisfied" | "superseded" | "abandoned"
  project_id?: string
  space_id?: string
  actor_id: actor:<ulid> | string
  exit_condition?: string
  created_at: iso8601
}
```

### `intent.updated`
```
payload {
  intent_id: string
  changed_fields: string[]
  actor_id: actor:<ulid> | string
  updated_at: iso8601
  reason: string
  title?: string
  status?: "open" | "proposed" | "accepted" | "executing" | "satisfied" | "superseded" | "abandoned"
  body?: string
  exit_condition?: string
}
```
