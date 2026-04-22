---
title: "Auto Delegator Layer"
created: 2026-03-18
updated: 2026-04-17
type: project
status: active
confidence: 0.80
confidence_updated: 2026-04-17
source: project
tags: [auto-delegator, dispatch, sqlite]
summary: "Autonomous task dispatch system with SQLite backend, 1-minute engine cycle, and vault research loops."
---
# Auto Delegator Layer

> Autonomous task extraction, agent routing, dispatch orchestration, research loops, and self-improving delegation.

---

| Key | Value |
|---|---|
| **Status** | 🔨 ACTIVE |
| **Channel** | #auto-delegator |
| **Owner** | Right Hand (orchestration layer) |
| **Started** | 2026-03-18 |

---

## Architecture

```
INPUT SOURCES → TASK EXTRACTION → ROUTING → DISPATCH → TRACKING → FEEDBACK
```

### Complete Toolkit (verified 2026-04-17)

| Script | Purpose | Schedule |
|---|---|---|
| `dispatch-engine.sh` | Core dispatch loop, spawns agents | ***/1 cron** |
| `dispatch.sh` | Task creation + scheduling CLI | Manual / hourly cron |
| `dispatch-heartbeat.sh` | Stall detection for active tasks | */15 cron |
| `dispatch-monitor.sh` | Metrics and monitoring | On demand |
| `dispatch-notify.sh` | Notification dispatch | On demand |
| `dispatch-db.sh` | SQLite DB operations | CLI |
| `dispatch-db-migrate.sh` | DB schema migrations | On demand |
| `dispatch-completion-hook.sh` | Post-task completion handler | Hook |
| `dispatch-context-inject.sh` | Context injection for agents | Hook |
| `dispatch-replay.sh` | Replay failed/stalled tasks | Manual |
| `vault-task-ingestion.sh` | Vault signals → dispatch tasks | */6h cron |
| `vault-research-loop.sh` | Research-ingest-implement cycle | */4h cron |

**Note:** System now uses SQLite (`~/dispatch/dispatch.db`) alongside file-based queue. Done tasks at `~/dispatch/done/` (90 completed as of 2026-04-17). Several original scripts (`dispatch-dashboard.sh`, `dispatch-failure-analyzer.sh`, `dispatch-optimizer.sh`, `dispatch-channel-sweep.sh`) have been retired or consolidated into `dispatch-monitor.sh` and the DB layer.

### Phases Completed

- [x] **Phase 0** — Reliability assessment, disk cleanup, service verification
- [x] **Phase 1** — File-based dispatch queue (`~/dispatch/active/done/failed/`) + SQLite DB
- [x] **Phase 2** — `dispatch-engine.sh` with circuit breakers, priority scheduling
- [x] **Phase 3** — Heartbeat stall detection, vault ingestion, desk-watcher hook
- [x] **Phase 4** — Dashboard with metrics, per-agent stats, trend tracking
- [x] **Phase 5** — Self-improving: failure analyzer, weekly optimizer, learnings persistence
- [x] **Phase 6** — Channel sweep, research loop, aspirational vault layer

### Research-Ingest-Implement Loop

Every 4 hours, `vault-research-loop.sh` rotates through 8 focus areas:
1. vault_structure, agent_architecture, knowledge_quality, self_learning
2. vault_formatting, performance_optimization, content_gaps, aspirational_alignment

Each cycle: assess → research → propose → implement → self-feed.
Proposals posted to #desk forum. Results enrich the vault for next cycle.

### Aspirational Vault Layer

New `vault/Aspirational/` directory separates goals from current state:
- Reduces agent hallucination (can't confuse plans with reality)
- Provides direction for research loop
- Each doc links back to current-state counterpart
- Status tags: 🎯 TARGETED, 🔨 IN PROGRESS, ✅ ACHIEVED, ❌ ABANDONED

## Links

- [[Aspirational Agent System]]
- [[Aspirational Knowledge Loop]]
- [[Aspirational Vault Architecture]]
- [[reliability-first-reorg-v1]]

## Related

- [[harvest-2026-03-18-0200]]
