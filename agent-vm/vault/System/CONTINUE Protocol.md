---
type: reference
domain: system-ops
confidence: 0.95
source: agent:vault-keeper
summary: "Session continuity protocol using CONTINUE.md file — survives gateway restarts and session kills"
created: 2026-03-18
updated: 2026-03-18
aliases: [CONTINUE.md, session continuity, auto-resume]
title: "CONTINUE Protocol"
status: active
---

# CONTINUE.md Protocol

## Purpose

Agent sessions are ephemeral — a gateway restart kills the running session. CONTINUE.md is a checkpoint file that lets the next session pick up exactly where the previous one left off. Files survive; sessions don't.

## Location

`~/.openclaw/agents/main/workspace/CONTINUE.md`

## Write Triggers

CONTINUE.md must be written before any disruptive action:
- Gateway restart (always use `~/bin/safe-gateway-restart.sh`, never raw `systemctl restart`)
- Config reload requiring restart
- Any operation that might kill the current session

## Format

```markdown
# CONTINUE.md — [Reason]

## Restart Info
- **Time:** ISO timestamp
- **Reason:** why the restart happened
- **Triggered by:** script or manual

## Checkpointed Agents
- agent-id: task description, status at checkpoint

## Resume Actions
1. Re-spawn checkpointed agents
2. Post status to resume channel
3. Check dispatch queue
4. Run heartbeat
5. Delete CONTINUE.md once recovery complete

## Resume Channel
#channel-name (ID)
```

## Resume Flow

1. New session starts → reads CONTINUE.md
2. Posts to resume channel: "Picking back up — [summary]"
3. Re-creates interrupted tasks in `~/dispatch/queue/` as P1
4. Re-executes any direct-handling work
5. Deletes CONTINUE.md once fully caught up
6. Resume is automatic — never waits for user instruction

## Supporting Scripts

| Script | Role |
|---|---|
| `~/bin/safe-gateway-restart.sh` | Writes CONTINUE.md, then restarts gateway |
| `~/bin/auto-resume.sh` | Cron every 10min, checks for CONTINUE.md |
| `~/bin/graceful-gateway-restart.sh` | Drains active agents, checkpoints, then restarts |

## Hard Rule

**Never restart the gateway from inside a session without writing CONTINUE.md first.** This is a learned-the-hard-way rule — violating it means lost work with no recovery path.

## Related

- [[Dispatch Architecture Review]] — dispatch queue recovery
- [[System Overview]] — session lifecycle
