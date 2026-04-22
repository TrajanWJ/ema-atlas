# ClaudeForge — Remote Claude Code Sessions via Discord

> Last updated: 2026-04-05

ClaudeForge is a remote Claude Code session manager that uses Discord as its command surface and a web UI for monitoring. It is an EMA execution surface — tasks dispatched by EMA can be executed through ClaudeForge when remote session management is needed.

---

## Overview

| Field | Value |
|---|---|
| Repository | `~/Desktop/Coding/Projects/claude-remote-discord/` |
| Discord Guild | `1484262889505292358` |
| Architecture | Turborepo monorepo |
| Runtime | Node.js 22 |
| Package manager | npm 10.x (workspaces) |

ClaudeForge provides two surfaces for interacting with Claude Code sessions:
1. **Discord bot** — slash commands in the ClaudeForge guild to create, monitor, and manage sessions
2. **Web UI** — real-time dashboard showing active sessions, logs, and task status

---

## Packages

### `packages/server/` — Core Daemon

The central process that manages Claude Code sessions.

| Dep | Version |
|---|---|
| Express | HTTP API |
| better-sqlite3 | Persistent storage (sessions, tasks, logs) |
| WebSocket | Real-time communication with web UI and bot |

Responsibilities:
- Spawns and manages Claude Code CLI processes
- Tracks session lifecycle (created, running, completed, failed)
- Stores task history and output in SQLite
- Exposes REST API and WebSocket for bot and web consumers

### `packages/bot/` — Discord Bot

The Discord interface built on discord.js v14.

| Dep | Version |
|---|---|
| discord.js | ^14.18.0 |

Responsibilities:
- Registers slash commands in the ClaudeForge guild
- Routes commands to the server daemon
- Streams session output to `#agent_log`
- Posts status updates to `#status`
- Reports errors to `#errors`

### `packages/web/` — Web UI

Real-time monitoring dashboard.

| Dep | Version |
|---|---|
| Next.js | ^15.3.0 |
| Tailwind CSS | v4 |
| Zustand | State management |
| Lucide React | Icons |

### `packages/shared/` — Shared Types

TypeScript type definitions and constants shared across all packages.

---

## ClaudeForge Discord Guild

Guild ID: `1484262889505292358`

| Channel | ID | Purpose |
|---|---|---|
| command_center | `1484267775512936637` | Primary command interface — slash commands dispatched here |
| task_queue | `1484267777899364354` | Queued tasks awaiting execution |
| agent_log | `1484267780738912527` | Live agent output stream — session stdout/stderr |
| readme | `1484267786321530931` | Guild docs and onboarding |
| commands | `1484267788817268838` | Bot command reference |
| architecture | `1484267790897643636` | System architecture notes |
| changelog | `1484267793519214726` | Release notes |
| status | `1484267798837596181` | Current system health and active sessions |
| errors | `1484267800884416717` | Error reporting and crash logs |
| cron_jobs | `1484267802981302385` | Scheduled task config and execution logs |

---

## Design System

ClaudeForge uses an Obsidian x Discord Dark theme for its web UI:

| Token | Value |
|---|---|
| Background | `#0F0F14` |
| Primary | `#7B61FF` |
| Body font | Inter |
| Mono font | JetBrains Mono |
| Framework | Tailwind v4 utility-first |

---

## EMA Integration

ClaudeForge is an execution surface for EMA. The integration path:

1. **EMA dispatches a task** via `ema_dispatch_execution` or through the dispatch channel
2. **ClaudeForge server receives the task** (via API or Discord command)
3. **Server spawns a Claude Code session** with the task prompt
4. **Output streams** to the ClaudeForge Discord guild (`#agent_log`) and web UI
5. **Completion status** is reported back to EMA via webhook or API callback

This allows EMA to run Claude Code sessions remotely without SSH access to the host machine — Discord acts as the transport layer.

---

## Development

```bash
cd ~/Desktop/Coding/Projects/claude-remote-discord/

# Install dependencies
npm install

# Run all packages in dev mode (parallel)
npm run dev

# Run individual packages
npm run dev:server   # Core daemon
npm run dev:bot      # Discord bot
npm run dev:web      # Web UI on port 3000
```

Build:
```bash
npm run build        # Turbo builds all packages
```
