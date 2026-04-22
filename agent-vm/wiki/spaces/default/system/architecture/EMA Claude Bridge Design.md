---
title: EMA Claude Bridge Design
created: '2026-03-30'
updated: '2026-04-01'
type: knowledge
status: active
tags:
  - ema
  - claude-code
  - bridge
  - citadel
  - harness
  - sri-superman
wiki_id: system/architecture/EMA_Claude_Bridge_Design
imported_from: vault/Architecture/EMA Claude Bridge Design.md
imported_at: '2026-04-04T00:23:56.745Z'
summary: ''
---

# EMA Claude Bridge — Architecture Design

## What This Replaces

The current `Ema.Claude.Runner` does:
```elixir
System.cmd("claude", ["--print", "--output-format", "json", "-p", prompt])
```

One-shot. Blocking. No streaming. No hooks. No circuit breaking. No cost tracking.

## What We're Building

A proper Elixir/OTP bridge to Claude Code CLI that:
1. Manages Claude Code as a **long-running Port subprocess** with bidirectional streaming
2. Parses `stream-json` JSONL events in real-time
3. Implements Citadel-inspired patterns: circuit breaker, cost tracking, quality gates, governance
4. Integrates with EMA's Pipes event bus for workflow automation
5. Supports multi-model pipeline stages (opus/sonnet/haiku per stage)
6. Manages session lifecycle (create, resume, fork, monitor)
7. Works with Max plan via OAuth — no API keys needed

## Module Structure

```
lib/ema/claude/
├── bridge.ex              # GenServer — manages Claude CLI subprocess Port
├── stream_parser.ex       # Parses JSONL stream-json events from Claude CLI
├── session_manager.ex     # Session lifecycle (create, resume, fork, list)
├── circuit_breaker.ex     # Consecutive failure detection + escalation
├── cost_tracker.ex        # Token/usage tracking from session JSONL files
├── quality_gate.ex        # Post-completion verification lenses
├── governance.ex          # Audit logging for all tool calls
├── hook_manager.ex        # Manages .claude/hooks.json per project
├── mcp_server.ex          # HTTP/stdio MCP server exposing EMA tools to Claude
├── runner.ex              # (EXISTING — kept as simple fallback)
├── context_manager.ex     # (EXISTING — kept, enhanced with streaming support)
└── plugin_manager.ex      # Manages Citadel plugin installation + config
```

## Architecture

```
                    EMA Daemon (Elixir/OTP Supervision Tree)
                    ┌──────────────────────────────────────┐
                    │                                      │
┌──────────────┐    │  ┌─────────────────────────────────┐ │
│ Tauri/React  │◄──►│  │ Ema.Claude.Bridge (GenServer)   │ │
│   Frontend   │ WS │  │                                 │ │
└──────────────┘    │  │  ┌─ Port: claude --print         │ │
                    │  │  │  --output-format stream-json  │ │
                    │  │  │  --input-format stream-json   │ │
                    │  │  │  --permission-mode bypass     │ │
                    │  │  │  --session-id <uuid>          │ │
                    │  │  │  --plugin-dir ~/.citadel      │ │
                    │  │  │  --mcp-config ema-tools.json  │ │
                    │  │  │                               │ │
                    │  │  ├─ StreamParser (decode JSONL)   │ │
                    │  │  ├─ CircuitBreaker (failure detect│ │
                    │  │  ├─ CostTracker (token counting)  │ │
                    │  │  └─ Governance (audit log)        │ │
                    │  └─────────────────────────────────┘ │
                    │          │              │             │
                    │          ▼              ▼             │
                    │  ┌───────────┐  ┌──────────────┐     │
                    │  │ Pipes     │  │ PubSub       │     │
                    │  │ EventBus  │  │ Broadcasts   │     │
                    │  └───────────┘  └──────────────┘     │
                    └──────────────────────────────────────┘
```

## Stream-JSON Event Types

Claude CLI with `--output-format stream-json` emits JSONL:

```json
{"type":"system","subtype":"init","session_id":"abc","tools":["Bash","Read",...]}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"..."}]}}
{"type":"content_block_start","content_block":{"type":"tool_use","name":"Bash","id":"..."}}
{"type":"content_block_delta","delta":{"type":"input_json_delta","partial_json":"..."}}
{"type":"content_block_stop"}
{"type":"result","subtype":"success","session_id":"abc","total_cost_usd":0.05}
```

## Drop-In Replacement

The Bridge exposes the same API as the current Runner, plus streaming:

```elixir
# Synchronous (like current Runner — for backward compat)
Ema.Claude.Bridge.run(prompt, model: "sonnet", timeout: 120_000)
# => {:ok, %{result: "...", cost: 0.05, session_id: "abc"}}

# Streaming (new — for real-time UI updates)
Ema.Claude.Bridge.stream(prompt, model: "opus", callback: fn event ->
  # Called for each JSONL event
  broadcast_to_frontend(event)
end)

# Multi-turn (new — for proposal pipeline)
{:ok, session} = Ema.Claude.Bridge.start_session(project: project, model: "opus")
Ema.Claude.Bridge.send(session, "Generate a proposal for: #{seed.prompt}")
# ... later
Ema.Claude.Bridge.send(session, "Now refine it: focus on risks")
Ema.Claude.Bridge.end_session(session)
```

## Citadel Integration

Two options for getting Citadel's hooks and skills:

### Option A: Use Citadel as a Plugin
```bash
# Install Citadel globally
npm install -g @sethgammon/citadel

# Bridge passes --plugin-dir to Claude CLI
claude --print --plugin-dir ~/.citadel ...
```

Citadel's hooks fire inside Claude's process. EMA reads Citadel's state files
(`.planning/telemetry/`, `.planning/campaigns/`) for UI display.

### Option B: Reimplement Patterns in Elixir (Preferred)
Build Citadel's key patterns natively in Elixir, which gives:
- OTP supervision for fault tolerance
- Direct PubSub integration with Pipes
- PostgreSQL/SQLite persistence instead of JSON files
- Real-time WebSocket updates to frontend

**Recommendation:** Option B for core patterns (circuit breaker, cost tracking,
quality gates, governance), Option A for Citadel's skills that need to run
inside Claude's context (architect, autopilot, fleet mode).

## Hybrid Approach

```
┌─────────────────────────────────────────────┐
│ EMA Bridge Layer (Elixir)                    │
│ ├── CircuitBreaker — OTP GenServer state     │
│ ├── CostTracker — reads session JSONL files  │
│ ├── Governance — audit log to SQLite/PubSub  │
│ ├── QualityGate — post-completion checks     │
│ └── SessionManager — lifecycle management    │
│                                              │
│ + Citadel Plugin (JS, inside Claude process)  │
│ ├── hooks.json — loaded by Claude CLI        │
│ ├── Skills — architect, fleet, autopilot     │
│ └── .planning/ — campaign/task state files   │
│                                              │
│ Bridge reads Citadel state files for UI      │
│ Bridge fires EMA events for Citadel actions  │
└─────────────────────────────────────────────┘
```

## New Capabilities from Claude Code v2.1.89 (April 2026)

### Defer-and-Resume Pattern
```elixir
# EMA's PreToolUse hook can return "defer" for dangerous operations
# Claude pauses, EMA shows approval UI in Tauri frontend
# User approves → EMA calls `claude --print --resume` to continue
# This replaces the need for a custom permission system
```

### MCP Non-Blocking Mode
```bash
# Set in Bridge's env vars so EMA's MCP server doesn't block Claude startup
MCP_CONNECTION_NONBLOCKING=true
```

### PermissionDenied Hook
```elixir
# When auto-mode denies a tool call, EMA can intercept and let user override
# Return {retry: true} to have Claude retry the operation
```

### TaskCreated Hook
```elixir
# Track when Claude spawns internal sub-tasks
# Wire to EMA's task system for visibility
```

## Generator-Evaluator Loop (NEW — from ecosystem analysis)

The proposal pipeline should iterate, not just pass-through:

```elixir
defmodule Ema.ProposalEngine.QualityGate do
  @max_iterations 3
  
  def evaluate_and_iterate(proposal, iteration \\ 1) do
    checks = [
      check_completeness(proposal),
      check_actionability(proposal),
      check_risks_identified(proposal),
      check_scope_bounded(proposal)
    ]
    
    failures = Enum.filter(checks, &match?({:fail, _}, &1))
    
    cond do
      failures == [] -> 
        {:accept, proposal}
      iteration >= @max_iterations -> 
        {:accept_with_warnings, proposal, failures}
      true -> 
        feedback = format_feedback(failures)
        # Feed back to refiner with specific failure context
        {:regenerate, feedback}
    end
  end
end
```

See [[Generator-Evaluator Loops]] for the full pattern.

## Migration Path

1. **Phase 1:** Build `Ema.Claude.Bridge` with streaming Port management
2. **Phase 2:** Add circuit breaker, cost tracking, governance (Elixir-native)
3. **Phase 3:** Install Citadel, configure hooks.json, read state files
4. **Phase 4:** Wire MCP server exposing EMA tools to Claude sessions
5. **Phase 5:** Replace all `Runner.run()` calls with `Bridge.run()` or `Bridge.stream()`
6. **Phase 6:** Multi-turn sessions for proposal pipeline stages
7. **Phase 7:** Generator-evaluator loops in proposal pipeline
8. **Phase 8:** Defer-and-resume for UI-gated approvals

## Cross-References
- [[Harness Engineering Discipline]] — the emerging field
- [[Claude Code CLI Integration Reference]] — full CLI API reference
- [[Citadel Architecture Deep Dive]] — source analysis of Citadel patterns
- [[Generator-Evaluator Loops]] — iteration pattern for quality
- [[Claude Code Harness Ecosystem Analysis]] — competitive landscape
