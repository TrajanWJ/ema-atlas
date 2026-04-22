---
title: "System State 2026-04-07"
space: wiki
tags: ["operations", "state", "snapshot"]
source: manual
---

# System State — 2026-04-07

Verified system state snapshot. Supersedes portions of [[System-Audit-2026-04-06]] where state has changed.

## Running Services

| Service | Process | Port | Status |
|---------|---------|------|--------|
| EMA Daemon | beam.smp (PID active) | 4488 | Running |
| EMA Desktop | target/debug/ema | — | Running (Tauri dev) |
| Vite Dev Server | node | 1420 | Running |
| HQ Frontend | vite + esbuild | — | Running |
| Expo (ProSlync) | node | 8081 | Running |
| n8n | node | — | Running |
| QMD MCP | multiple sessions | — | Running |

## Not Running

| Service | Reason |
|---------|--------|
| Agent-VM (192.168.122.10) | Unreachable — ping fails, SSH fails |
| OpenClaw (port 18789) | Offline — VM hosting it is unreachable |
| Dispatch Engine (bash) | Dormant — dispatch.db on offline VM |

## Database State

| Database | Path | Status |
|----------|------|--------|
| ema.db | ~/.local/share/ema/ema.db | Exists, **empty** (schemas in code, no data populated) |
| dispatch.db | agent-vm only | Inaccessible (VM offline) |

## Agent & Actor State

- **3 agents:** strategist, coach, archivist (seeded via `priv/repo/seeds/agents_seed.exs`)
- **4 actors:** 1 human (trajan) + 3 agent actors (bootstrapped on startup)
- **17 agent definitions** exist in code but only 3 are seeded and active

## Infrastructure

- **Host crons:** 2 (qmd update q30min, oauth sync q4h)
- **CLI:** 79 command groups, escript binary at `bin/ema` (121KB)
- **TUI:** Blocked by ex_termbox Python 3.12 incompatibility (ADR 002)
- **MCP:** 17 core tools + workspace tools, 11 resources
- **Vault:** 76 files across 8 spaces at `~/.local/share/ema/vault/`
- **Wiki:** 55+ pages across 10 sections
- **.superman:** 3 layers (global, project, daemon)

## Changes Since 2026-04-06 Audit

- Wiki rebuilt and expanded (41 → 55+ pages)
- Intent schematic established in wiki/Intents/ (10 pages)
- IntentProjector implemented (bidirectional wiki ↔ DB sync)
- Agent-VM confirmed offline (was listed as running in prior audit)
- OpenClaw confirmed not running (was ambiguous in prior audit)

## Related

- [[System-Audit-2026-04-06]] — prior audit with detailed findings
- [[Infrastructure]] — machine topology and services
