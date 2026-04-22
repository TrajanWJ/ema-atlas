---
type: playbook
source: session-transcript
captured: 2026-03-17T21:41:00.000Z
category: fix
score: 4
tags:
  - openclaw
  - gateway
  - troubleshooting
  - port-conflict
summary: >-
  Gateway service stuck in crash loop — `systemctl restart openclaw-gateway`
  fails because an old process is still holding port 18789. Multiple gatewa
status: active
confidence: 0.6
confidence_updated: 2026-03-18T00:00:00.000Z
updated: '2026-03-18'
created: '2026-03-17'
title: 2026-03-17 OpenClaw Gateway Port Conflict Fix
wiki_id: operations/2026-03-17_OpenClaw_Gateway_Port_Conflict_Fix
imported_from: vault/Operations/2026-03-17 OpenClaw Gateway Port Conflict Fix.md
imported_at: '2026-04-04T00:23:56.838Z'
---

# OpenClaw Gateway Port Conflict Fix

## Problem
Gateway service stuck in crash loop — `systemctl restart openclaw-gateway` fails because an old process is still holding port 18789. Multiple gateway processes fight for the same port, causing repeated bind failures.

## Root Cause
When restarting the gateway from inside an active session, the restart kills the process that initiated it, but the old process doesn't release the port cleanly. The new process tries to bind, fails, and enters a crash loop.

## Fix
1. Kill all stale gateway processes: `sudo pkill -f openclaw` or check `sudo lsof -i :18789`
2. Wait for port release, then start fresh: `sudo systemctl start openclaw-gateway`

## Prevention
- **Never restart the gateway from inside a session** — it kills your own process
- Use `~/bin/safe-gateway-restart.sh` which writes CONTINUE.md, detaches, then restarts
- The script handles the sequencing so no port conflicts occur

---
*Consolidated from multiple auto-captured fragments on 2026-03-17*

## Related
- [[System Overview]]
- [[Security Posture - Agent System]]
