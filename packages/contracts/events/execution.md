# execution

The future Hermes/Harness Glue seam. An execution is one tool invocation,
one task run, or one provider session inside a dispatch; `execution_id`
is stable for later reference.

Owner: `ema_exec` seam. Harness Glue prepares provider/session
projection data until `ema_exec` has daemon-owned writers.

## Kinds

### `execution.started`
```
payload {
  execution_id: execution:<ulid>
  dispatch_id:  dispatch:<ulid>
  kind:         "tool" | "task" | "session"
  name:         string
  provider?:    "simulated" | "codex" | "claude-code" | "hermes" | string
}
```

### `execution.ended`
```
payload { execution_id, outcome: "ok" | "failed" | "cancelled", duration_ms: int }
```

### `execution.failed`
```
payload { execution_id, error_class: string, message: string }
```
