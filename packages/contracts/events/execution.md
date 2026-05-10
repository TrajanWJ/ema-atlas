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

`execution.ended` intentionally coexists with the more specific terminal
events below. Simulated and legacy harness surfaces still emit and consume
`execution.ended`; executable provider runs that need exit-code, byte-count,
session-file, and prompt-hash evidence emit `execution.completed`,
`execution.failed`, or `execution.timeout`. Consumers that need execution
status should accept both families until the legacy simulated harness contract
is migrated.

### `execution.completed`
```
payload {
  execution_id:      execution:<ulid>
  provider:          "codex" | "simulated" | "claude-code" | "hermes" | string
  exit_code:         int
  duration_ms:       int
  stdout_bytes:      int
  stderr_bytes:      int
  session_file_path: string
  prompt_hash:       sha256 string
  canon_id?:         canon:<ulid> | string
}
```

### `execution.failed`
```
payload { execution_id, error_class: string, message: string }
```

Executable provider runs may include the same `provider`, `exit_code`,
`duration_ms`, `stdout_bytes`, `stderr_bytes`, `session_file_path`, and
`prompt_hash` fields as `execution.completed`.

### `execution.timeout`
```
payload {
  execution_id:      execution:<ulid>
  provider:          "codex" | "simulated" | "claude-code" | "hermes" | string
  exit_code:         -1
  timeout_ms:        int
  duration_ms:       int
  stdout_bytes:      int
  stderr_bytes:      int
  session_file_path: string
  prompt_hash:       sha256 string
}
```

### `execution.interrupted_by_restart`
```
payload {
  execution_id:  execution:<ulid>
  prior_status:  "running"
  last_event_kind: "execution.started" | string
  last_event_ts: ISO-8601 timestamp
  prior_dispatch_state: string
  interrupted_at: ISO-8601 timestamp
  restarted_at:  ISO-8601 timestamp
  recovered_by:  "boot_recovery_scanner"
}
```
