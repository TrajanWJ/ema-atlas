---
type: knowledge
domain: system-ops
confidence: 0.95
source: 'agent:vault-keeper'
summary: >-
  Complete map of ~35 cron jobs powering dispatch, vault maintenance,
  monitoring, and intelligence gathering
created: '2026-03-18'
updated: '2026-03-18'
aliases:
  - crontab
  - scheduled tasks
  - cron ecosystem
title: Cron Jobs Ecosystem
status: active
wiki_id: system/Cron_Jobs_Ecosystem
imported_from: vault/System/Cron Jobs Ecosystem.md
imported_at: '2026-04-04T00:23:57.222Z'
tags: []
---

# Cron Jobs Ecosystem

## Overview

The agent-vm runs ~35 cron jobs under user `trajan`, organized into five functional groups. A backup is auto-saved every 6h to `vault/System/cron-backup.txt`, with `cron-recreate.sh` for disaster recovery.

## Core Engine (Every 1–5 min)

| Interval | Script | Purpose |
|---|---|---|
| `*/1` | `dispatch-engine.sh` | Process dispatch queue (PID-locked, max 3 concurrent) |
| `*/2` | `gateway-watchdog.sh` | Ensure openclaw-gateway stays running |
| `*/2` | `session-watchdog.sh` | Monitor active session health |
| `*/5` | `system-watchdog.sh` | System resource monitoring (CPU, disk, memory) |

## Agent & Session Health (Every 10–20 min)

| Interval | Script | Purpose |
|---|---|---|
| `*/10` | `auto-resume.sh` | Check for CONTINUE.md, trigger resume flow |
| `*/10` | `session-guardian.sh` | Guard against zombie sessions |
| `*/15` | `dispatch-heartbeat.sh` | Alert on dispatch stalls |
| `*/20` | `session-health.sh` | Session health metrics |

## Knowledge & Memory (Every 30 min – 3h)

| Interval | Script | Purpose |
|---|---|---|
| `*/24` | `research-implement-pipeline.sh` | Research → implementation pipeline |
| `*/30` | `memory-pressure.sh --quiet` | Monitor memory tier usage |
| `*/30` | `qmd update && qmd embed` | Vault semantic search index |
| `*/2h` | `message-harvester.sh` | Harvest Discord messages for knowledge |
| `*/2h` | `vault-autocommit.sh` | Git-commit vault changes |
| `*/2h` | `correction-tracker.sh` | Track agent correction patterns |
| `*/3h` | `auto-knowledge-gated.sh` | Extract knowledge from transcripts (usage-gated) |
| `*/3h` | `ontology-sync extract` | Entity extraction for knowledge graph |

## Vault Maintenance (Daily/Weekly)

| Schedule | Script | Purpose |
|---|---|---|
| Daily 4am | `vault-frontmatter-enforce.sh` | Enforce frontmatter standards |
| Daily 4am | `memory-promote.sh --dry-run` | Identify memories for promotion |
| Daily 4:30am | `vault-classify.sh` | Classify uncategorized notes |
| Daily 9am | `vault-janitor.sh` | Clean orphans, fix links |
| Daily noon | `overnight-digest.sh` | Generate overnight activity digest |
| Daily 2pm | `morning-briefing-v2.sh` | Morning briefing (9 AM EST) |
| Mon 2am | `vault-growth-monitor.sh` | Track vault growth metrics |
| Mon 4am | `prompt-archaeologist.sh` | Analyze prompt patterns |
| Mon 5am | `vault-staleness-scan.sh` | Flag stale notes |
| Mon 6am | `vault-quality-score.sh` | Weekly quality report |
| Wed 3am | `vault-semantic-links.sh` | Build semantic links (limit 100) |
| Fri 3am | `vault-backlink.sh` | Build backlinks |
| Sun 3am | `vault-tag-backfill.sh` | Backfill missing tags |
| Sun 3am | `weekly-synthesis.sh` | Weekly synthesis report |
| Sun midnight | `agent-roster-review.py` | Review agent roster |

## Intelligence (Every 4–6h)

| Interval | Script | Purpose |
|---|---|---|
| `*/4h` | `reddit-intel.sh` | Reddit research feed |
| `*/6h` | `evolution-loop run-loop.sh --all` | Agent evolution cycle |
| `*/6h` | `pattern-detector.py` | Detect workflow patterns |
| `*/6h` | `vault-task-ingestion.sh` | Ingest vault-based tasks |
| `*/6h` | Crontab self-backup | Save crontab to vault |

## Disaster Recovery

- **Backup:** `vault/System/cron-backup.txt` (auto-saved every 6h)
- **Restore:** `vault/System/cron-recreate.sh`
- **Boot:** `@reboot cron-restore.sh` runs 30s after boot

## Related

- [[System Overview]] — where crons fit in the architecture
- [[Dispatch Architecture Review]] — dispatch-engine details
- [[Evolution Log]] — evolution loop outputs
