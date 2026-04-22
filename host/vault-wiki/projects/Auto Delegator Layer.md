---
title: Auto Delegator Layer
created: '2026-03-18'
updated: '2026-03-18'
type: project
status: active
confidence: 0.6
confidence_updated: 2026-03-18T00:00:00.000Z
source: project
tags:
  - auto-delegator
  - desk
summary: '```'
wiki_id: projects/Auto_Delegator_Layer
imported_from: vault/Projects/Auto Delegator Layer.md
imported_at: '2026-04-04T00:23:56.864Z'
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

### Complete Toolkit

| Script | Purpose | Schedule |
|---|---|---|
| `dispatch-engine.sh` | Core dispatch loop, spawns agents | */10 cron |
| `dispatch-task.sh` | Quick task creation CLI | Manual |
| `dispatch-heartbeat.sh` | Stall detection for active tasks | */15 cron |
| `dispatch-dashboard.sh` | Metrics, performance, circuit breakers | Heartbeat |
| `dispatch-failure-analyzer.sh` | Failure categorization + recommendations | On demand |
| `dispatch-optimizer.sh` | Self-tuning from performance data | Weekly cron |
| `dispatch-channel-sweep.sh` | Catch dropped messages | Heartbeat |
| `vault-task-ingestion.sh` | Vault signals → dispatch tasks | */6h cron |
| `vault-research-loop.sh` | Research-ingest-implement cycle | */4h cron |
| `desk-watcher` hook | Real-time Discord → dispatch queue | [[OpenClaw]] hook |

### Phases Completed

- [x] **Phase 0** — Reliability assessment, disk cleanup, service verification
- [x] **Phase 1** — File-based dispatch queue (`~/dispatch/queue/active/done/failed/`)
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
