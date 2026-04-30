# dispatch

The future Hermes/Harness Glue seam — dispatches are named runs that travel with every
emitted event inside a bounded execution. A `dispatch_id` in the envelope
ties a run's events together.

Owner: `ema_control` seam (daemon-internal). Harness Glue may prepare
or mirror provider/session records, but canonical dispatch writes remain
daemon-owned.

## Kinds

### `dispatch.started`
```
payload {
  dispatch_id:  dispatch:<ulid>
  initiator:    user:<ulid> | device:<ulid> | system:<component>
  intent:       string             // short human label
  workspace_ref: {                 // snapshot pointer at dispatch time
    org_id, space_id?, project_id?
  }
  provider?:    "simulated" | "codex" | "claude-code" | "hermes" | string
  lane_id?:     lane:<ulid>
}
```

### `dispatch.scope_granted`
```
payload {
  dispatch_id: dispatch:<ulid>
  scope: {
    read?:  [ <resource-pattern> ]
    write?: [ <resource-pattern> ]
    call?:  [ <tool-pattern> ]
  }
  secrets?: [ secret_ref:<provider>.<kind>:<scope> ]
}
```

Scope is enforced by the runtime; events that describe grant expansion
also flow here.

### `dispatch.ended`
```
payload { dispatch_id, outcome: "ok" | "failed" | "cancelled", provider?: string }
```
