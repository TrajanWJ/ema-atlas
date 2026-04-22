---
title: "Gateway Resilience Protocol"
created: 2026-03-16
updated: 2026-03-16
type: operations
status: active
confidence: 0.60
confidence_updated: 2026-03-18
source: operations
tags: [agents, architecture, knowledge, openclaw, ops, prompts]
summary: "Documented after the 2026-03-16 self-inflicted gateway restart incident that caused an 8-hour blackout."
---
# Gateway Resilience Protocol

Documented after the 2026-03-16 self-inflicted gateway restart incident that caused an 8-hour blackout.

## The Incident (2026-03-16 ~10:45 UTC)

During overnight autonomous work, Right Hand ran `systemctl restart openclaw-gateway` **from within a live session**. This killed the process that was running the agent, resulting in:
- Complete session loss — no CONTINUE.md written, no graceful shutdown
- 8-hour unattended blackout (Trajan was asleep)
- All in-progress agent work lost
- No auto-resume possible

**Root cause:** The agent restarted the service hosting itself, with no pre-restart state persistence.

## Fixes Implemented

### 1. `safe-gateway-restart.sh`
Script at `~/bin/safe-gateway-restart.sh` that:
- Writes `CONTINUE.md` with current state before restart
- Detaches the restart command via `nohup` + `disown`
- Allows 5-second grace period for clean session exit
- Usage: `~/bin/safe-gateway-restart.sh "reason"`

### 2. QMD Embed Timeout
Added 300-second timeout to QMD embed cron to prevent runaway processes from blocking gateway operations.

### 3. Rate Limit Backoff Protocol
Documented backoff strategy for API calls to prevent cascading failures during recovery.

### 4. Pre-Restart CONTINUE.md Mandate
Hardcoded into SOUL.md and AGENTS.md: **never restart gateway without writing CONTINUE.md first.** No exceptions.

### 5. Daily Note Auto-Creation
First heartbeat each day ensures `vault/Daily Notes/YYYY-MM-DD.md` exists, so there's always a persistent record even if sessions die.

## The CONTINUE.md Protocol

Before any disruptive action (restart, config reload, context exhaustion):
1. Write `CONTINUE.md` with: what's in progress, what's done, what's next, resume channel
2. On new session start, check for `CONTINUE.md`
3. Resume immediately — don't wait for user
4. Delete `CONTINUE.md` once caught up

## Hard Rule

> **Never run `systemctl restart openclaw-gateway` from inside a session.** Always use `safe-gateway-restart.sh`.

## Gateway Restart History (2026-03-16)

- **05:42–07:30 UTC:** 10+ restarts during initial system buildout (config changes)
- **10:45 UTC:** Self-inflicted restart → 8-hour blackout
- **~18:30 UTC:** Post-recovery, all fixes applied

## Related

- [[Agent Continuity Patterns]]
- [[Session Management Deep Dive]]
- [[Daily Notes/2026-03-16]]
- [[briefing-2026-03-16]]
