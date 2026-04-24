# handoff

Owner: (future) `ema_swarm_coordination`.

A handoff is a structured transfer of ownership or attention from one
actor to another.

## Kinds

### `handoff.requested`
```
payload {
  handoff_id: handoff:<ulid>
  from:       user:<ulid> | device:<ulid>
  to:         user:<ulid>
  subject:    { kind: "proposal" | "lane_item" | "incident", id: string }
  note?:      string
}
```

### `handoff.accepted`
```
payload { handoff_id, accepted_by: user:<ulid> }
```

### `handoff.rejected`
```
payload { handoff_id, rejected_by: user:<ulid>, reason?: string }
```

### `handoff.completed`
```
payload { handoff_id, completed_by: user:<ulid>, outcome: string }
```
