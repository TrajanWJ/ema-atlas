---
title: "ops"
created: 2026-03-16
updated: 2026-03-18
type: system
status: active
confidence: 0.40
confidence_updated: 2026-03-18
source: auto-capture
tags: [ops]
summary: "Channel context for ops — system operations, health monitoring, infrastructure"
---
# #ops — Channel Context

- **ID:** 1482955597174140941
- **Category:** 🏗️ Build & Ops
- **Purpose:** System operations, health monitoring, infrastructure updates
- **Primary Agent:** ⚙️ Ops (spawned by Right Hand)
- **Metaprompt:** Post system health, cron results, gateway status, infra changes here.

## Key Infrastructure
- [[OpenClaw]] Gateway: systemd, port 18789
- OAuth Guardian v4: auto-refresh, dual accounts
- Bridge Sync: rsync every 60s (VM ↔ host)
- Crons: session-health (20min), vault-refresh, [[auto-knowledge]], reddit-intel
- Guardian watchdog: auto-restart on crash

## Recent Activity (2026-03-16)
- Gateway restart instability (10+ restarts 05:42-07:30 UTC, now stable)
- cron-restore.sh delivered (auto-restores crons after restart)
- session-monitor.sh delivered (enhanced health monitoring)
- Dual OAuth accounts confirmed working

## Related

- [[research-round-3-deprecation-and-advancement-analysis]]
- [[2026-03-16-1806-trajans-office]]
- [[ai-landscape-2026-03-16]]
- [[channels]]
