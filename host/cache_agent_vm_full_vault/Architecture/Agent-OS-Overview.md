---
type: architecture
status: active
tags: [agent-os, architecture, overview]
created: 2026-03-20
---

# Agent OS Overview

Agent OS is a unified web interface for managing AI agent systems. It provides a single dashboard to monitor, control, and interact with an entire agent infrastructure — bridging the gap between backend orchestration and human oversight.

## What It Connects

- **OpenClaw Gateway** — Agent orchestration engine (port 18789). Manages agent sessions, routing, tool access, and lifecycle.
- **Obsidian Vault** — Knowledge management system (753+ notes). Searchable via QMD, with graph visualization, backlinks, and full-text search.
- **Discord** — Communication layer (20+ channels). Real-time agent activity feed, human-agent conversations, and notification routing.
- **Dispatch System** — Task queue and execution pipeline. File-based queue with proposal → approve → execute → done lifecycle.

## Pages

| Page | Purpose |
|---|---|
| **Stream** | Real-time agent activity feed merging Discord, dispatch events, proposals, and system alerts into a unified chronological view |
| **Inbox** | Actionable items requiring human decisions — pending proposals, questions from agents, items needing approval |
| **Talk** | Discord channel mirror with full send/react/thread capabilities. Read and respond to all channels without leaving Agent OS |
| **Tasks** | Dispatch queue management — create tasks, set priorities, assign agents, approve/cancel/retry. Views: queue, active, done, failed |
| **Mind** | Vault interface — full-text search (via QMD), folder browsing, tag cloud, note editing, graph visualization with force-directed layout |
| **Workbench** | Live terminal-style agent activity viewer. Monitor what agents are doing in real-time via WebSocket streaming |
| **Missions** | Hill chart tracking of long-term goals. Each mission has steps, related tasks, velocity metrics, and timeline |
| **System** | Infrastructure health dashboard — uptime, CPU/memory/disk, service statuses, cron jobs, systemd timers, process list, logs |
| **Roles** | Agent configuration and org chart. 38 agents across 12 departments with capabilities, success rates, and routing rules |

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Browser (WebUI)                                 │
│  Vanilla JS · Catppuccin Mocha · No framework    │
└──────────────────┬──────────────────────────────┘
                   │ HTTP + WebSocket
┌──────────────────▼──────────────────────────────┐
│  Bridge Server (Node.js, Express, port 18790)    │
│  90+ API endpoints · WebSocket broadcast         │
└──┬──────────┬──────────┬───────────┬────────────┘
   │          │          │           │
   ▼          ▼          ▼           ▼
OpenClaw   Discord    Obsidian   Dispatch
Gateway    Bot API    Vault      Queue
(18789)    (REST)     (fs+QMD)   (file-based)
```

## Tech Stack

- **Frontend:** Vanilla JavaScript, CSS with Catppuccin Mocha color scheme, zero framework dependencies. Single-page app with hash-based routing.
- **Bridge Server:** Express.js on Node.js. WebSocket for live push updates (new tasks, feed events, proposals). All state is file-based — no database.
- **Data Layer:** Markdown files (vault), JSON files (dispatch queue, proposals, goals, projects), JSONL (feed/timeline). QMD for full-text search indexing.
- **Auth:** Referer-based validation for local network. Bridge runs on trusted agent VM at 192.168.122.10.
- **Services:** Runs as `agent-os-bridge` systemd service. Bridge-sync timer keeps shared folder synchronized every 60s.

## Key Design Decisions

1. **No framework** — Vanilla JS keeps the bundle at zero, loads instantly, and avoids dependency churn. Every page is a self-contained module.
2. **File-based state** — No database to manage. Dispatch tasks are JSON files in queue/active/done/failed directories. Easy to inspect, debug, and manually edit.
3. **Bridge pattern** — Frontend never talks to OpenClaw or Discord directly. The bridge server handles auth, rate limiting, and data normalization.
4. **WebSocket for liveness** — Real-time updates without polling. New tasks, feed events, and proposal changes push instantly to all connected clients.
5. **Catppuccin Mocha** — Consistent dark theme across the entire UI. Warm, readable, easy on the eyes during long sessions.

## Related Notes

- [[Agent-OS-Bridge-API]] — Complete API endpoint reference
- [[Agent-OS-Agent-Roster]] — All 38 agents with departments and capabilities
