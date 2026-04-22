---
type: system
domain: system-ops
created: 2026-03-19T03:16:28
summary: "Cron health report — 40 jobs analyzed"
confidence: 0.95
source: agent:main
tags: [cron, health, operations]
title: "Cron Health 2026-03-19"
updated: 2026-03-19
status: active
---

# Cron Health Report — 2026-03-19

Generated: 2026-03-19 03:16:28 UTC
Total cron jobs: 40

## Job Inventory

| Job | Schedule | Category | Status |
|-----|----------|----------|--------|
| dispatch-engine | every 1min | dispatch | ✅ ok |
| auto-resume | every 10min | dispatch | ✅ ok |
| session-guardian | every 10min | dispatch | ✅ ok |
| dispatch-heartbeat | every 15min | dispatch | ✅ ok |
| gateway-watchdog | every 2min | monitoring | ✅ ok |
| session-health | every 20min | dispatch | ✅ ok |
| research-implement-pipeline | every 24min | research | ✅ ok |
| memory-pressure | every 30min | vault | ✅ ok |
| cd | every 30min | other | ✅ ok |
| system-watchdog | every 5min | monitoring | ✅ ok |
| message-harvester | every 2h at :0 | other | ✅ ok |
| vault-autocommit | every 2h at :0 | vault | ✅ ok |
| auto-knowledge-gated | every 3h at :0 | research | ✅ ok |
| sync | every 3h at :0 | other | ✅ ok |
| vault-task-ingestion | every 6h at :0 | vault | ✅ ok |
| crontab | every 6h at :0 | other | ✅ ok |
| agent-roster-review | Sun 0:00 | other | ✅ ok |
| overnight-digest | daily 12:00 | research | ✅ ok |
| morning-briefing-v2 | daily 14:00 | research | ✅ ok |
| vault-growth-monitor | Mon 2:00 | vault | ✅ ok |
| vault-tag-backfill | Sun 3:00 | vault | ✅ ok |
| weekly-synthesis | Sun 3:00 | research | ⚠️  stale log |
| vault-semantic-links | Wed 3:00 | vault | ✅ ok |
| vault-backlink | Fri 3:00 | vault | ✅ ok |
| memory-promote | daily 4:00 | vault | ✅ ok |
| vault-frontmatter-enforce | daily 4:00 | vault | ✅ ok |
| session-janitor | daily 4:00 | other | ✅ ok |
| prompt-archaeologist | Mon 4:00 | research | ✅ ok |
| dispatch-optimizer | Sun 5:00 | dispatch | ✅ ok |
| vault-staleness-scan | Mon 5:00 | vault | ✅ ok |
| vault-quality-score | Mon 6:00 | vault | ✅ ok |
| vault-janitor | daily 9:00 | vault | ✅ ok |
| correction-tracker | every 2h at :15 | monitoring | ✅ ok |
| reddit-intel | every 4h at :30 | research | ✅ ok |
| run-loop | every 6h at :30 | other | ✅ ok |
| pattern-detector | every 6h at :30 | research | ✅ ok |
| vault-classify | daily 4:30 | vault | ✅ ok |
| session-watchdog | every 2min | dispatch | ✅ ok |
| proactive-task-generator | every 2h at :0 | dispatch | ✅ ok |

## Frequency Breakdown

- Every-minute: 11 jobs
- Hourly: 11 jobs
- Daily: 7 jobs
- Weekly: 10 jobs

## Conflict Analysis

- ⚠️ **Collision** [0 */6 * * *]: vault-task-ingestion, crontab
- ⚠️ **Collision** [*/30 * * * *]: memory-pressure, cd
- ⚠️ **Collision** [*/10 * * * *]: auto-resume, session-guardian
- ⚠️ **Collision** [0 3 * * 0]: vault-tag-backfill, weekly-synthesis
- ⚠️ **Collision** [0 */2 * * *]: message-harvester, vault-autocommit, proactive-task-generator
- ⚠️ **Collision** [0 4 * * *]: memory-promote, vault-frontmatter-enforce, session-janitor
- ⚠️ **Collision** [0 */3 * * *]: auto-knowledge-gated, sync
- ⚠️ **Collision** [*/2 * * * *]: gateway-watchdog, session-watchdog
- ⚠️ **Collision** [30 */6 * * *]: run-loop, pattern-detector

## Log Health

- ❌ **auto-resume**: log missing (/var/log/auto-resume.log)
- ❌ **gateway-watchdog**: log missing (/var/log/gateway-watchdog.log)
- ❌ **agent-roster-review**: log missing (/tmp/roster-review.log)
- ❌ **vault-growth-monitor**: log missing (/tmp/vault-growth-monitor.log)
- ❌ **vault-tag-backfill**: log missing (/tmp/vault-tag-backfill.log)
- ❌ **vault-semantic-links**: log missing (/tmp/vault-semantic-links.log)
- ❌ **vault-backlink**: log missing (/tmp/vault-backlink.log)
- ❌ **memory-promote**: log missing (/tmp/memory-promote.log)
- ❌ **prompt-archaeologist**: log missing (/tmp/prompt-archaeologist.log)
- ❌ **dispatch-optimizer**: log missing (/home/trajan/.openclaw/logs/dispatch-optimizer.log)
- ❌ **vault-staleness-scan**: log missing (/tmp/vault-staleness.log)
- ❌ **vault-quality-score**: log missing (/tmp/vault-quality.log)
- ❌ **proactive-task-generator**: log missing (/tmp/proactive-task-generator.log)

## Summary

**🔴 Needs Attention** — 22 issues found across 40 jobs.

---
[[Cron Orchestra]] | [[System Operations]]
