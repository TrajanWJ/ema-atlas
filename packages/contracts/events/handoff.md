# handoff

Owner: `ema_swarm_coordination`.

A handoff is a structured transfer of ownership or attention from one
actor to another.

## Kinds

### `handoff.requested`
```
payload {
  handoff_id: handoff:<ulid>
  from:       actor:<ulid> | user:<ulid> | device:<ulid>
  to:         actor:<ulid> | user:<ulid>
  needed:     string
  context?:   string
  source?:    string
  verify?:    string
  depends_on?: string
  status:     "pending"
}
```

### `handoff.accepted`
```
payload { handoff_id, accepted_by: actor:<ulid> }
```

### `handoff.rejected`
```
payload { handoff_id, rejected_by: actor:<ulid>, reason?: string }
```

### `handoff.completed`
```
payload { handoff_id, completed_by: actor:<ulid>, outcome: string, verify?: string }
```
