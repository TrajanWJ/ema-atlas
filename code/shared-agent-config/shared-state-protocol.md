# Shared State Protocol

## Overview

Agents share state through a file-based system at `~/dispatch/`. This enables coordination without direct agent-to-agent communication.

## Directories

```
~/dispatch/
├── shared-state/
│   ├── active-tasks.json    ← what's being worked on right now
│   └── agent-status.json    ← last-known status of each agent
├── artifacts/<task-id>/     ← work products from tasks
├── mailbox/<agent-id>/
│   ├── inbox/               ← incoming messages
│   └── archive/             ← processed messages
└── inter-agent/<agent-id>/  ← legacy inter-agent requests
```

## active-tasks.json

Tracks all currently active tasks across the fleet.

```json
{
  "tasks": {
    "<task-id>": {
      "agent": "coder",
      "orchestrator": "tech-lead",
      "description": "Implement feature X",
      "started_at": "2026-03-18T06:00:00Z",
      "timeout_at": "2026-03-18T06:10:00Z",
      "status": "running"
    }
  },
  "updated_at": "2026-03-18T06:00:00Z"
}
```

## agent-status.json

Last-known status of every agent. Updated by orchestrators and Right Hand.

```json
{
  "agents": {
    "coder": {
      "status": "idle",
      "last_task": "implement-mailbox",
      "last_seen": "2026-03-18T05:30:00Z",
      "current_orchestrator": null
    }
  },
  "updated_at": "2026-03-18T06:00:00Z"
}
```

## Artifacts

Task outputs live at `~/dispatch/artifacts/<task-id>/`. Any agent can read these.

```
~/dispatch/artifacts/
├── task-20260318-001/
│   ├── output.md
│   ├── code-changes.patch
│   └── metadata.json
```

## File Locking

**All writes to shared JSON files must use `flock`** to prevent corruption:

```bash
# Write with lock
(
  flock -x 200
  # ... modify the JSON file ...
  cat > ~/dispatch/shared-state/active-tasks.json <<EOF
  { ... }
EOF
) 200>~/dispatch/shared-state/.active-tasks.lock
```

```bash
# Read with shared lock (allows concurrent reads)
(
  flock -s 200
  cat ~/dispatch/shared-state/active-tasks.json
) 200>~/dispatch/shared-state/.active-tasks.lock
```

## Rules

1. **Always lock before writing** shared JSON files
2. **Artifacts are append-only** — don't modify another agent's artifacts
3. **Status updates are best-effort** — don't block on status writes
4. **Task IDs** use format: `task-YYYYMMDD-NNN`
5. **Cleanup:** Artifacts older than 7 days can be pruned by ops
