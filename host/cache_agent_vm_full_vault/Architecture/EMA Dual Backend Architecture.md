---
title: "EMA Dual Backend Architecture"
created: 2026-04-01
updated: 2026-04-01
type: architecture
status: active
confidence: 0.90
tags: [ema, claude-code, openclaw, backend, architecture, bridge]
summary: "EMA's Claude Bridge supports two backends — direct Claude CLI subprocess or OpenClaw gateway routing. Runtime switchable."
---

# EMA Dual Backend Architecture

## The Two Modes

EMA's Bridge can route Claude requests through either backend, switchable at runtime:

```
┌─────────────────────────────────────────────────────┐
│ Ema.Claude.Bridge (GenServer)                        │
│                                                      │
│  prompt + opts                                       │
│       │                                              │
│       ▼                                              │
│  ┌──────────────────┐                                │
│  │ Ema.Claude.Backend│ ◄── set_mode(:claude_cli)     │
│  │                   │ ◄── set_mode(:openclaw)       │
│  └────────┬─────────┘                                │
│           │                                          │
│     ┌─────┴─────┐                                    │
│     ▼           ▼                                    │
│  :claude_cli  :openclaw                              │
│     │           │                                    │
│     ▼           ▼                                    │
│  Port:        Port:                                  │
│  claude       openclaw agent run                     │
│  --print      --print                                │
│  --stream-json --stream-json                         │
│  --plugin-dir  --agent main                          │
│  --session-id  --session-id                          │
└─────────────────────────────────────────────────────┘
```

## Mode Comparison

| Feature | Claude CLI | OpenClaw |
|---|---|---|
| **Subprocess** | `claude --print --output-format stream-json` | `openclaw agent run --print --output-format stream-json` |
| **Auth** | Max plan OAuth (`~/.claude/`) | Gateway token / Max plan passthrough |
| **Streaming** | ✅ stream-json JSONL | ✅ stream-json JSONL |
| **Session resume** | ✅ `--resume` | ✅ via gateway session management |
| **Session fork** | ✅ `--fork-session` | ❌ not supported |
| **Plugin dir** | ✅ `--plugin-dir` (Citadel) | ❌ plugins managed by gateway |
| **Hooks (file-based)** | ✅ `.claude/hooks.json` | ❌ gateway handles hooks |
| **MCP tools** | ✅ `--mcp-config` | ✅ `--mcp-config` |
| **Defer/resume** | ✅ v2.1.89 | ❌ |
| **Multi-channel output** | ❌ | ✅ Discord, Telegram, etc. |
| **Persistent sessions** | File-based | ✅ LCM + gateway state |
| **Subagent spawn** | ❌ | ✅ via gateway |
| **Cost tracking** | Parse session JSONLs | ✅ built-in |

## When to Use Which

### Claude CLI Mode (`:claude_cli`)
- **Local development** — full control, plugin experimentation
- **Citadel integration** — `--plugin-dir` only works here
- **Session forking** — exploration branches
- **Defer-and-resume** — UI-gated approvals
- **Maximum feature access** — every Claude Code flag available

### OpenClaw Mode (`:openclaw`)
- **Production daemon** — OpenClaw manages sessions, restarts, health
- **Multi-channel** — results can route to Discord/Telegram
- **Shared infrastructure** — multiple apps can use the same gateway
- **Persistent context** — LCM provides lossless context management
- **Subagents** — spawn specialist agents via the gateway

## Runtime Switching

```elixir
# In EMA's Tauri frontend or API
Ema.Claude.Bridge.set_backend(:openclaw)
Ema.Claude.Bridge.set_backend(:claude_cli)

# Check current mode
Ema.Claude.Bridge.backend()
# => :openclaw

# Check capabilities of current mode
Ema.Claude.Backend.capabilities()
# => %{streaming: true, plugin_dir: false, multi_channel: true, ...}
```

## Configuration

```elixir
# config/config.exs
config :ema, :claude_backend, :claude_cli  # default mode

# Claude CLI specific
config :ema, Ema.Claude.Bridge,
  plugin_dir: "~/.citadel",
  mcp_config: "~/.ema/mcp-tools.json",
  default_model: "sonnet"

# OpenClaw specific
config :ema, Ema.Claude.Backend,
  gateway_url: "http://localhost:18789",
  agent_id: "main"
```

## Model Name Resolution

EMA uses short model names internally. Backend resolves them:

| EMA Name | Claude CLI | OpenClaw |
|---|---|---|
| `"opus"` | `opus` (native) | `anthropic/claude-opus-4-6` |
| `"sonnet"` | `sonnet` (native) | `anthropic/claude-sonnet-4-20250514` |
| `"haiku"` | `haiku` (native) | `anthropic/claude-haiku-3-5-20241022` |

## Cross-References
- [[EMA Claude Bridge Design]] — the overall bridge architecture
- [[Claude Code CLI Integration Reference]] — Claude CLI flag reference
- [[Harness Engineering Discipline]] — broader context
