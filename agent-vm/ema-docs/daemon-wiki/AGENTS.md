# EMA Agent System

EMA uses dynamic agent supervision via OTP — agents are spawned on demand, not a fixed roster. Each agent gets its own supervision subtree with worker, memory, and channel bridges.

## Architecture

```
Ema.Agents.Supervisor (DynamicSupervisor)
└── per agent: AgentSupervisor (one_for_one)
    ├── AgentWorker      — executes tasks, manages Claude sessions
    ├── AgentMemory      — persistent memory per agent (SQLite-backed)
    └── ChannelSupervisor (DynamicSupervisor)
        ├── WebchatChannelBridge   — working, real-time web UI
        ├── DiscordChannelBridge   — stub, pending ClaudeForge integration
        └── TelegramChannelBridge  — stub, future
```

## Dynamic Agent Spawning

Agents are created on demand via the Agents supervisor:

```elixir
# Spawn a new agent
Ema.Agents.Supervisor.start_agent(%{
  id: "researcher-42",
  type: :researcher,
  config: %{model: "claude-sonnet-4-6", context_window: "200k"}
})

# Agent is supervised — crashes restart automatically
# Agent state persists in SQLite via AgentMemory
```

## Agent Types

Agents are data-driven, not hardcoded roles. The `type` field determines behavior:

| Type | Purpose | Typical Tasks |
|------|---------|---------------|
| `:researcher` | Deep dives, web search, analysis | Research tasks, competitive intel |
| `:coder` | Code generation, debugging, review | Feature implementation, bug fixes |
| `:ops` | System health, deployments, monitoring | Infrastructure tasks |
| `:analyst` | Data crunching, metrics, reporting | Dashboard updates, trend analysis |
| `:writer` | Documentation, content, proposals | Blog posts, docs, email drafts |
| `:general` | Catch-all for unclassified tasks | Ad-hoc requests |

New types can be added by defining a configuration — no code changes needed.

## AgentWorker

The core execution unit. Manages a Claude Bridge session and processes tasks:

```elixir
defmodule Ema.Agents.AgentWorker do
  use GenServer

  # Receives task from dispatch or direct API call
  def handle_cast({:execute, task}, state) do
    session = Ema.Claude.Bridge.create_session(state.config)
    result = Ema.Claude.Bridge.run(session, task.prompt)
    Ema.Agents.AgentMemory.record(state.id, task, result)
    {:noreply, %{state | last_task: task.id}}
  end
end
```

## AgentMemory

Persistent per-agent memory backed by SQLite:

- Task history (what was executed, outcomes)
- Learned patterns (successful approaches for task types)
- Context accumulation (project knowledge built over sessions)

## Channel Bridges

Channel bridges connect agents to external surfaces:

### WebchatChannelBridge (active)
Real-time bidirectional communication via Phoenix Channels (WebSocket). The React frontend connects here for the agent chat UI.

### DiscordChannelBridge (stub)
Will integrate with ClaudeForge (see `docs/discord/CLAUDEFORGE.md`) to enable Discord-based agent interaction. Each agent maps to a Discord channel.

### TelegramChannelBridge (stub)
Future integration for Telegram bot surface.

## Dispatch Integration

The shell-based `dispatch-engine.sh` spawns Claude Code sessions as "agents" outside the OTP tree. These are complementary to OTP-supervised agents:

- **OTP agents:** Long-lived, stateful, managed by the daemon
- **Dispatch agents:** Ephemeral, task-scoped, spawned by cron

Both write results to `~/dispatch/results/` and can trigger follow-up tasks.
