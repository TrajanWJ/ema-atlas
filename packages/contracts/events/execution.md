# execution

The Hermes seam. An execution is one tool invocation or one task run
inside a dispatch; `execution_id` is stable for later reference.

Owner: `ema_exec` seam.

## Kinds

### `execution.started`
```
payload {
  execution_id: execution:<ulid>
  dispatch_id:  dispatch:<ulid>
  kind:         "tool" | "task"
  name:         string
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
