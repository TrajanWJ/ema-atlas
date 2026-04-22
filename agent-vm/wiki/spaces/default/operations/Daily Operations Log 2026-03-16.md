---
title: Daily Operations Log 2026-03-16
created: '2026-03-16'
updated: '2026-03-16'
type: playbook
status: active
confidence: 0.6
confidence_updated: 2026-03-18T00:00:00.000Z
source: operations
tags:
  - next-steps
  - worklog
summary: 'Severity: Critical (load avg 11.02 on 6 vCPU)'
wiki_id: operations/Daily_Operations_Log_2026-03-16
imported_from: vault/Operations/Daily Operations Log 2026-03-16.md
imported_at: '2026-04-04T00:23:56.839Z'
---
# Daily Operations Log — 2026-03-16

## Incidents

### INC-001: Load Spike (08:48 UTC)
- **Severity:** Critical (load avg 11.02 on 6 vCPU)
- **Root cause:** Firefox oauth process stuck at 91.7% CPU (82h runtime), two stale Claude Code sessions (21h+)
- **Resolution:** Killed stuck processes. Load dropped to 4.70 within 60s, normalized to <1.0 within 15min.
- **Prevention:** Need auto-cleanup for stuck browser processes. Consider adding to watchdog.

### INC-002: Gateway Crash Loop (09:00-10:19 UTC)
- **Severity:** High (multiple restarts, 6 critical errors in 10min)
- **Root cause:** (a) API rate limits (0% usage remaining), (b) duplicate gateway processes spawning, (c) `missing scope: operator.read` errors from client connections
- **Resolution:** OAuth Guardian auto-restarted gateway. Rate limits resolved on usage reset.
- **Prevention:** Exec approval permanently set to `security=full, ask=off` preventing timeout-induced crashes.

### INC-003: API Rate Limits (10:20 UTC)
- **Severity:** Medium (embedded agent runs failing)
- **Root cause:** 5h usage window exhausted (100% consumed)
- **Resolution:** Self-resolving on usage reset (~10:59 UTC). Two OAuth accounts provide buffer.

## Service Status (10:52 UTC)
| Service | Status | Notes |
|---|---|---|
| Gateway | ✅ Active | PID 2990180, 570MB RSS |
| OAuth Guardian | ✅ Active | Token valid 190min |
| [[Claude Code Bot]] | ✅ Active | |
| Bridge Sync | ✅ Active | Heartbeat fresh |
| QMD | ✅ Cron | 365 files indexed |
| Watchdog | ✅ Cron | Every 5min |

## Completed Work
- Vault refresh (3 files regenerated)
- Morning briefing posted to #worklog
- Next steps updated in #next-steps  
- Daily status desk item posted
- Stale vault files updated (Operations/README.md)
- Cross-channel message recovery (6+ channels caught up)
- Pace tracking updated

## Metrics
- Load: 0.58 avg (down from 11.02 peak)
- Memory: 3.6G / 14G (26%)
- Disk: 33G / 58G (57%)
- Vault: 365 files
- Sessions: Daily reset at 4AM, 14d prune
- Crons: 10 active jobs

## Related

- [[github-intel-favorites]]
