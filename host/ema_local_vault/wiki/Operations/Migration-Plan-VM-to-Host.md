---
title: "Migration Plan: VM to Host"
space: wiki
tags: ["ops","migration","infrastructure","architecture"]
source: manual
---

# Migration Plan: VM → Host

Goal: Eliminate agent-vm as a hard dependency. Run everything on the host. Package VM as an optional P2P node within EMA.

## Current State (2026-04-06)

**Two daemons running, different versions:**

| Location | Version | DB | Migrations | Tables | Router |
|----------|---------|-----|-----------|--------|--------|
| **Host (localhost:4488)** | Full CLAUDE.md version | `~/.local/share/ema/ema_dev.db` (16MB) | 114 | 110+ | Full (projects, tasks, goals, proposals, agents, brain dump, executions, etc.) |
| **Agent-VM (192.168.122.10:4488)** | Surfaces-only | Empty | 0 | 0 | Babysitter, surfaces, vault, claude only (29 endpoints) |

The host daemon is the real system. The VM daemon is legacy.

## What Lives on VM That Must Move

| Component | Current Location | Migration Strategy |
|-----------|-----------------|-------------------|
| **dispatch.db** (14 tables, 84 tasks, 21 agents) | VM ~/dispatch/ | Read via SSH → eventually replace with EMA executions |
| **dispatch-engine.sh** + cron | VM crontab | Rewrite as Elixir GenServer or keep as external process on host |
| **338 shell scripts** | VM ~/bin/ | Audit. Move critical ones to host ~/bin/. Archive the rest. |
| **36 cron jobs** | VM crontab | Move essential crons to host crontab or Quantum (Elixir scheduler) |
| **3,036 vault files** | VM ~/vault/ | Already have FTS5 indexer on host. Rsync vault to host. |
| **EMA Observer** (Next.js, port 3200) | VM systemd | Move to host or replace with CLI TUI |
| **Wiki engine** (port 8093) | VM | Redundant — host daemon has wiki tables. Kill it. |
| **Agent VM MCP server** (port 8899) | VM | Replace with host EMA MCP (already done for most tools) |
| **ClaudeForge Discord bot** | VM systemd | Move to host or fold into EMA daemon |
| **OpenClaw gateway** (port 18789) | VM systemd | Kill. Already archived. |
| **Ollama** (port 11434) | VM | Install on host (has GPU). VM ollama is CPU-only. |
| **SearXNG** (port 8082) | VM | Keep on VM (low priority) or install on host |

## Phase Plan

### Phase 1: Vault Sync (do now)
```bash
rsync -avz trajan@192.168.122.10:~/vault/ ~/vault/
```
Set up cron on host to sync every 30 min. Host FTS5 indexer picks it up.

### Phase 2: Essential Crons to Host
Move these cron jobs to host:
- `dispatch-engine.sh` (needs rewrite — see Phase 4)
- `vault-autocommit.sh` (git commit vault)
- `qmd update && qmd embed` (already on host)
- OAuth token refresh (already on host)

### Phase 3: Kill Dead Services on VM
- Stop `openclaw-gateway.service`
- Stop wiki engine (port 8093) — redundant
- Disable stale crons

### Phase 4: Replace Dispatch Engine
Options:
1. **Port dispatch-engine.sh to host as-is** — copy script + dispatch.db, run from host crontab
2. **Elixir GenServer** — `Ema.Dispatch.Engine` wrapping the same SQLite logic
3. **Use existing EMA executions** — the host daemon already has executions table (33 rows). Retire dispatch.db entirely.

Recommend: Option 3 long-term, Option 1 as bridge.

### Phase 5: VM Becomes Optional Node
- VM still available for: heavy compute, Ollama inference, isolated experiments
- Register VM as P2P node: `ema node register agent-vm 192.168.122.10:4488`
- VM runs its own daemon with surfaces-only (babysitter, Claude sessions)
- Host is primary, VM is secondary failover

### Phase 6: Package EMA for Single-Machine
- `mix release` for production deployment
- systemd service for EMA daemon on host
- Single `ema setup` command bootstraps everything

## What's Already Done
- EMA daemon running on host (PID 1283)
- Full Ecto schema (114 migrations, 110+ tables)
- 6 goals, 74 proposals, 17 agents, 87 vault notes
- EMA CLI on host (`~/.local/bin/ema`)
- MCP server on host (native Elixir: `mix ema.mcp.stdio`)
- Wiki in host vault (`~/.local/share/ema/vault/wiki/`, 33 pages)

## Related
- [[Infrastructure]]
- [[EMA Architecture Overview]]
- [[Dispatch Engine]]
