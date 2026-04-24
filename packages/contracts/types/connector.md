# connector (record)

```
connector {
  id:            connector:<ulid>
  user_id:       user:<ulid>
  provider:      "google_drive" | "github"
  status:        "disconnected" | "connected"
  connected_at:  ISO-8601 UTC | null
  display_label: string                 // e.g. "demo@example.com"
  fake:          bool                   // true for demo-stubbed connectors
}
```

## Invariants (v0)

- `fake = true` implies no token is stored and no real API calls occur.
- Surfaces MUST NOT inspect `fake`; they treat `status` as opaque.
- When real OAuth ships, `fake` is replaced by
  `token_ref: secret_ref:<...>` pointing into the daemon's secret store.
  That change is additive at the wire layer — surfaces don't need to
  change.
