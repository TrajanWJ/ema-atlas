---
title: "Infrastructure"
space: wiki
tags: ["ops","infrastructure","deployment"]
source: manual
---

# Infrastructure

## Machine Topology

| Machine | Role | IP | Access |
|---------|------|----|--------|
| **FerrissesWheel** (host) | Desktop, Obsidian, interactive Claude Code, SSH bridge | local | Physical |
| **agent-vm** | EMA daemon, dispatch engine, all automation, MCP servers | 192.168.122.10 | SSH `agent-vm` |

## Services on agent-vm

> **Agent-VM (192.168.122.10) is OFFLINE as of 2026-04-06.** All services, databases, and cron jobs on the VM are unreachable.

| Service | Port | Process | Management |
|---------|------|---------|------------|
| EMA Daemon | 4488 | beam.smp (Elixir) | `mix phx.server` (manual/tmux, no systemd) |
| EMA Observer | 3200 | Next.js 16 | systemd (`ema-observer.service`) |
| ClaudeForge | 3001 | node (Express) | Scaffolded, not always running |
| Wiki Engine | 8093 | node | Running |
| Agent VM MCP | 8899 | python3 | systemd (`mcp-server.service`) |
| SearXNG | 8082 | SearXNG | Running |
| Whisper | 8178 | whisper-server | Running |
| Ollama | 11434 | ollama | Running |
| Lightpanda | 9223 | lightpanda | Headless browser |
| Chrome MCP | 8099 | mcpo | DevTools bridge |

## Services on host

| Service | Port | Process |
|---------|------|---------|
| EMA Daemon | 4488 | beam.smp (Elixir Phoenix) |
| Claude Code | — | Interactive CLI |
| QMD | — | Indexes Obsidian vault (72MB, 9951 vectors) |

## Databases

| DB | Path | Engine | Tables | Size | Status |
|----|------|--------|--------|------|--------|
| **dispatch.db** | `~/dispatch/dispatch.db` (agent-vm) | SQLite | 14 | 1.3MB | **Agent-VM only, currently inaccessible** |
| ema_dev.db | `~/.local/share/ema/ema_dev.db` (host) | SQLite (Ecto) | 117 migrations | — | **Empty** (schemas exist in code, not yet populated) |
| Second Brain FTS | `daemon/priv/second_brain_fts.db` (agent-vm) | SQLite FTS5 | 1 | Active | Indexes ~/vault/ |
| Wiki Engine | `wiki-engine/wiki.db` (agent-vm) | SQLite | 5+FTS | ~15MB | Active |
| QMD index | `~/.cache/qmd/index.sqlite` (host) | SQLite | Vectors | 72MB | 2590 files, 9951 vectors |
| CLI mock state | `~/.ema_cli_state.json` (agent-vm) | JSON | 14 collections | Mock data |

## Cron Jobs

### Host (2 active)

| Schedule | Script | Purpose |
|----------|--------|---------|
| Every 30min | `qmd update && qmd embed` | Semantic search index |
| Every 4h | OAuth sync | OAuth token refresh |

### Agent-VM (OFFLINE)

The agent-vm had ~35 cron jobs (dispatch engine every 1min, heartbeat, stale task cleanup, vault autocommit, intel/research/proposal/monitoring jobs). All are unreachable while the VM is offline.

## Key Paths (agent-vm)

| What | Path |
|------|------|
| EMA daemon source | `~/Projects/ema/daemon/` |
| EMA CLI source | `~/Projects/ema/cli/` |
| Dispatch engine | `~/dispatch/` (queue/, active/, done/, failed/) |
| Dispatch DB | `~/dispatch/dispatch.db` |
| Vault | `~/vault/` |
| EMA vault | `~/.local/share/ema/vault/` |
| Execution results | `~/.local/share/ema/results/` |
| Shell scripts | `~/bin/` (~160 scripts) |
| Observer source | `~/projects/frontend-layer/` |
| Wiki engine | `~/Projects/ema/wiki-engine/` |
| MCP server | `~/mcp-server/server.py` |

## Key Paths (host)

| What | Path |
|------|------|
| EMA vault | `~/.local/share/ema/vault/` |
| EMA database | `~/.local/share/ema/ema_dev.db` |
| Obsidian vault | `~/Documents/obsidian_first_stuff/twj1/` |
| Claude Code config | `~/.claude/settings.json` |
| EMA MCP server | Native Elixir: `mix ema.mcp.stdio` |

## Authentication

| Provider | Method | Location |
|----------|--------|----------|
| Anthropic (Claude) | OAuth (Max 20x) | `~/.claude/.credentials.json` (host) |
| OpenAI (Codex) | OAuth | `~/.codex/auth.json` (host) |

**No auth on any daemon endpoint.** The Anthropic proxy at `/v1/messages` accepts anonymous connections — noted security concern.

## Health Checks

```bash
# From host
ema status                           # Full dashboard
ssh agent-vm "curl -s localhost:4488/api/babysitter | jq ."

# From agent-vm
curl localhost:4488/api/babysitter   # Babysitter state
curl localhost:4488/api/surfaces     # Active surfaces
curl localhost:4488/api/vault/stats  # FTS5 index health
```

## Related

- [[Quick Reference]]
- [[MCP Topology]]
- [[Dispatch Engine]]
