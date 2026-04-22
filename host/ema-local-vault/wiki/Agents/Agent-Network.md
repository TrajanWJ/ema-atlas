---
title: "Agent Network"
space: wiki
tags: ["agents","network","dispatch"]
source: manual
---

# Agent Network

> **Agent-VM (192.168.122.10) is OFFLINE as of 2026-04-06.** dispatch.db is inaccessible (it only existed on the VM). The bash dispatch engine is not running.

3 daemon agents (strategist, coach, archivist) are seeded and active in the host EMA daemon. 4 actors total: 1 human (trajan) + 3 agents. 17 agent definitions exist in code but only 3 are seeded and have data.

## Active Agent System

`Ema.Agents.Supervisor` (DynamicSupervisor) with per-agent:
- `AgentWorker` — GenServer for message handling, Claude CLI calls, tool execution
- `AgentMemory` — Conversation compression (summarizes when >20 messages)
- Channel bridges (API, Webchat, Discord stub, Telegram stub)

Schemas: Agent (slug, model, temperature, tools, settings), Channel, Conversation, Message, Run

Tool execution is minimal — only `brain_dump:create_item` is implemented.

These start on boot and can respond to API calls. 3 agents are seeded: **strategist**, **coach**, **archivist**.

## Actor Model

4 actors in the system: 1 human (trajan) + 3 agents. Actor records are created by `Ema.Actors.Bootstrap.ensure_defaults()` on daemon boot. 17 agent definitions exist in code but only 3 are seeded with data.

## Historical: Dispatch Agent Roster (Legacy)

The bash dispatch engine on agent-vm managed 21 agent slots in dispatch.db with circuit breaker state. This system is currently offline.

## Dispatch Flow (Legacy)

```
Task submitted → dispatch.db (status: queued)
  → dispatch-engine.sh picks up (cron 1min)
  → Selects best idle agent (priority + circuit state)
  → Spawns `claude` CLI with task context
  → Updates agent status to 'active'
  → On completion: agent → 'idle', task → 'done'
  → On failure: agent → 'error', task → 'failed', retry if attempts < max
```

## CLI

```bash
ema agent list               # dispatch.db agents (real)
ema agent get <slug>         # Agent details from daemon API
ema agent chat <slug> "msg"  # Chat via daemon AgentWorker
ema task dispatch <id>       # Submit to dispatch engine
```

## Surfaces Layer

The daemon also manages sessions via Surfaces:
- `POST /api/surfaces/sessions/claude` — interactive Claude sessions
- `POST /api/surfaces/sessions/codex` — interactive Codex sessions
- `POST /api/surfaces/dispatch` — native dispatch

These are separate from the bash dispatch engine.

## Related

- [[Dispatch Engine]]
- [[Execution System]]
- [[OpenClaw Agent System]]
