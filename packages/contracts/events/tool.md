# tool

The Hermes seam. Tool-call events.

Owner: `ema_exec` seam.

## Kinds

### `tool.invoked`
```
payload {
  execution_id: execution:<ulid>
  tool_name:    string                    // e.g. "fs.read", "http.get"
  args:         <json>                    // redacted if carrying secrets
}
```

### `tool.returned`
```
payload {
  execution_id:   execution:<ulid>
  tool_name:      string
  result_summary: string          // single-line, ≤ 280 chars, no secrets
}
```

Raw results are not in the event; they live in the run's scratch
workspace. The event records enough for audit + replay.

### `tool.errored`
```
payload {
  execution_id: execution:<ulid>
  tool_name:    string
  error_class:  "timeout" | "denied" | "not_found" | "invalid_args"
              | "upstream" | "internal"
  message:      string            // single-line, ≤ 280 chars, no secrets
}
```
