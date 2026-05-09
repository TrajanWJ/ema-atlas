# tool

The future Hermes/Harness Glue seam. Tool-call events from provider
sessions and model/tool runtimes.

Owner: `ema_exec` seam. Harness Glue may mirror provider events into the
same shape while daemon-owned writers are being built.

Tool events are intentionally provider-agnostic. A workspace-scoped toolkit
such as Argent, XcodeBuildMCP, GitNexus, or an editor MCP server is represented
as a `tool_name` namespace plus optional provider metadata, not as a new event
family. This keeps audit, replay, and See Agent Work projections uniform as
new agent toolkits are adopted.

## Kinds

### `tool.invoked`
```
payload {
  execution_id: execution:<ulid>
  tool_name:    string                    // e.g. "fs.read", "http.get"
  args:         <json>                    // redacted if carrying secrets
  provider?:    "simulated" | "codex" | "claude-code" | "hermes" | "mcp" | string
  server_name?: string                    // e.g. "argent", "XcodeBuildMCP"
  capability?:  string                    // e.g. "ios-simulator", "rn-profiler"
}
```

For MCP-backed tools, prefer `tool_name = "<server>.<tool>"` when the runner
can provide it, for example `argent.gesture-tap` or
`XcodeBuildMCP.simulator.build-and-run`. `server_name` and `capability` are
optional indexing hints for projections and future policy decisions.

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
