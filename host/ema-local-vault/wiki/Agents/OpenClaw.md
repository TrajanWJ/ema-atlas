---
id: "7f4bbe6a-2cc3-4b50-9589-e68ed712d54d"
title: "OpenClaw Agent System"
space: wiki
tags: ["openclaw","agents","vm"]
source: manual
status: archived
---

# OpenClaw Agent System

**Status: OFFLINE.** Port 18789 unused. Agent-VM hosting OpenClaw is unreachable as of 2026-04-06.

Agent VM was running at `192.168.122.10:18789`. Hosted autonomous agents with Discord integration, session management, and vault access. Retained below as historical documentation.

## Agents

| Agent | Role | Heartbeat |
|-------|------|-----------|
| main | Default executor, general purpose | 60m |
| concierge | Personal assistant, triage | — |
| right-hand | Primary interface | — |
| researcher | Deep research tasks | — |
| ops | Infrastructure management | — |
| security | Security review | — |
| vault-keeper | Knowledge curation | — |

## REST API

| Endpoint | Purpose |
|----------|---------|
| `/rest/sessions` | List live agent sessions |
| `/gateway` | Web dashboard |
| `/rest/agents` | Agent registry |

## EMA Integration

- **Adapter:** `Ema.Claude.Adapters.OpenClaw` with circuit breaker (5 failures/60s → 5min cooldown)
- **Dispatch:** `POST /api/openclaw/dispatch` routes tasks through gateway
- **Fallback:** Auto-falls back to local Claude CLI if gateway is down or fused
- **Vault sync:** Bidirectional — OpenClaw vault → EMA SecondBrain via reconcile loop

## Access

```bash
ssh trajan@192.168.122.10
openclaw gateway status
openclaw agent list
```

## CLI

```
ema sync openclaw          # Check connection status
ema task dispatch <id>     # Routes through OpenClaw by default
```

## Related

- [[Agent Network]]
- [[MCP Topology]]
- [[Execution System]]
