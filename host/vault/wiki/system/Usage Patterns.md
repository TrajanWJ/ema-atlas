---
title: Usage Patterns
created: '2026-03-16'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: system
tags:
  - chat
  - overview
  - trajans-office
summary: >-
  Tracks Trajan's usage patterns: time-of-day, domain distribution, and channel
  preferences.
wiki_id: system/Usage_Patterns
imported_from: vault/System/Usage Patterns.md
imported_at: '2026-04-04T00:23:57.270Z'
---
# Usage Patterns

**Tracking started:** 2026-03-16
**Last updated:** 2026-03-16 09:47 UTC

## Session Stats (Day 2)
- 53 active sessions under `main`
- Primary conversation channels: #chat, #trajans-office, #overview
- 11 desk task threads created, 6 have active work
- 16 cron jobs running via system crontab

## Time-of-Day Patterns
- Trajan is in **EST** (UTC-5 / UTC-4 DST)
- Active: late night EST (11pm-4am = 4am-9am UTC)
- Expects overnight autonomous work when sleeping
- No morning data yet (first morning briefing hasn't fired)

## Domain Distribution (observed Day 1-2)
- 🏗️ Infrastructure/Discord: 35%
- 📚 Vault/Knowledge: 25%
- 🔬 Research/Analysis: 20%
- ⚙️ Ops/Config: 15%
- 💻 Coding: 5%

## Agent Usage
| Agent | Spawns | Avg Duration | Notes |
|---|---|---|---|
| Right Hand | persistent | — | All Discord interaction |
| Researcher | 3 | ~5min | Research, community discovery |
| Vault Keeper | 2 | ~3min | Vault cleanup, file maintenance |
| Coder | 2 | ~5min | Feature building, [[Claude Code Bot]] |
| Scout | 2 | ~3min | ClawHub, GitHub, Reddit scanning |
| Ops | 2 | ~3min | System health, cron audit |
| Security | 1 | ~5min | Skills audit, gateway exposure check |

## Token Usage Patterns
- 5h windows, frequently hitting 78-100% usage
- Weekly: 35% remaining after Day 1 heavy buildout
- Subagent spawns are the biggest token consumer
- LCM compaction moved to backup account ✅
- Need: route subagents through backup account for capacity doubling

## Cron Activity
| Cron | Status | Last Run |
|---|---|---|
| QMD update+embed | ✅ Working | Every 30min |
| Vault autocommit | ✅ Working | Every 2h |
| Ontology sync | ✅ Working | Every 3h |
| Evolution loop | ✅ Working (no mutations) | Every 6h |
| Session janitor | ✅ Working | Daily 4am UTC |
| System watchdog | ✅ Working | Every 5min |
| [[auto-knowledge]]-gated | ⚠️ Fixed today | Every 3h |
| morning-briefing | ❓ Never ran | Daily 14:00 UTC |
| overnight-digest | ❓ Never ran | Daily 12:00 UTC |
| vault-janitor | ❓ Never ran | Daily 09:00 UTC |

## Key Metrics to Watch
- Session context % (alert at >80%)
- Usage pace (pace > 1.5x = throttle github-interesting)
- Gateway restart count (alert if >3 in 1h)
- Cron health (any failures lasting >6h)

## Related

- [[Usage Patterns]]
- [[Claude Usage Gated Cron]]
- [[auto-knowledge-architecture]]
- [[README]]
- [[Vault Maintenance Log]]
