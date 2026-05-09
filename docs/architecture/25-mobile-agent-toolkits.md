# 25 - Mobile Agent Toolkits

Argent integration for the Proslync mobile app exposed a recurring EMA need:
third-party agent toolkits should be first-class workspace capabilities, not
one-off editor config.

This document defines the native shape EMA should grow toward for iOS/mobile
agent tooling such as Argent, XcodeBuildMCP, Apple docs MCP, GitNexus, and
future Android equivalents.

## Principle

EMA should model a mobile toolkit as a project-scoped capability pack:

- MCP server registration and runtime command.
- Skills/rules/agent prompts copied or linked into the workspace.
- Tool namespace and capability tags for audit/projections.
- Environment inspector output describing build, run, simulator, and QA paths.
- Optional flow artifacts for repeatable UI/profiling work.

The toolkit itself remains external. EMA records the operational contract and
execution trail.

## Event Contract

Use existing Hermes execution events:

- `dispatch.started` grants scoped work.
- `execution.started` records the runner execution.
- `tool.invoked`, `tool.returned`, and `tool.errored` record toolkit calls.

Do not create `argent.*` event families. Argent is a provider/tool namespace
inside the `tool` family:

```text
provider: "mcp"
server_name: "argent"
tool_name: "argent.gesture-tap"
capability: "ios-simulator"
```

This keeps See Agent Work, replay, auditing, and future policy enforcement on
one path for every provider.

## Workspace Projection

Future EMA projections should expose:

```text
agent_toolkit.registry {
  project_id
  toolkit_id
  provider
  server_name
  command
  config_files[]
  skills[]
  capabilities[]
  status
  version
  last_checked_at
}
```

For Proslync + Argent, expected capabilities are:

- `ios-simulator`
- `react-native-debugger`
- `react-native-profiler`
- `ios-profiler`
- `network-logs`
- `ui-flow-recorder`

## CLI Direction

Add a future `ema toolkit` command group:

```bash
ema toolkit detect --project <project>
ema toolkit register --project <project> --server argent --command "argent mcp"
ema toolkit status --project <project>
ema toolkit sync-skills --project <project> --server argent
```

These commands should not replace upstream installers. They should discover,
record, verify, and project the capability pack EMA relies on.

## Doctrine From Proslync

Proslync's active app workspace now has Argent registered through `.mcp.json`,
`.codex/config.toml`, `.vscode/mcp.json`, `.agents/skills/`, and Claude rules.
EMA should treat that as the concrete v0 donor pattern:

- Project-local config wins over global config when both exist.
- Skills belong in a shared workspace location when multiple agents consume
  them.
- Tool calls must flow into Hermes `tool.*` audit events when EMA owns the
  runner.
- UI automation artifacts such as Argent flows should be attached to lanes or
  executions when they become durable regression/profiling assets.

## Proslync Install Facts

Installed on 2026-05-09 in:

```text
/Users/trajanm4air/Desktop/Active builds/proslync-app-ios-final
```

Observed install surface:

- `argent` CLI version: `0.6.1`.
- MCP handshake: `argent mcp` responds to `initialize`; `serverInfo.version`
  reports `0.5.3`.
- Tool list: MCP `tools/list` returns simulator, app interaction, debugger,
  profiler, native-devtools, workspace-data, flow, update, and cleanup tools.
- Codex project config generated 61 Argent tool approval entries.
- Claude Code allowlist added `mcp__argent`.
- Skills installed under `.agents/skills/argent-*`.
- Rules/subagent installed under `.claude/rules/argent.md` and
  `.claude/agents/argent-environment-inspector.md`.

Durable EMA records created in the project atlas:

- `Projects/proslync-app-ios-final/atlas/argent-integration.md`
- `Projects/EMA/atlas/reference/tooling/argent-ios-simulator-mcp.md`
- `Projects/EMA/atlas/intent/decisions/argent-as-mobile-simulator-driver.md`
- `Projects/EMA/queue/2026-05-09-argent-driver-registry-native-support.md`
