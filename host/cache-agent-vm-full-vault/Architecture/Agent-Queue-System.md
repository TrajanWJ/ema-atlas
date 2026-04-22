# Agent Queue System

> Status: 💡 IDEA → 🔨 ACTIVE
> Created: 2026-03-20
> Confidence: 0.75
> Type: Architecture

## Overview

A unified queue where agents surface decisions, proposals, and artifacts for human review — auto-populated, auto-sorted, with Discord ↔ WebUI bidirectional mirroring.

## Core Concepts

### Queue Item Types

| Type | Description | Example |
|---|---|---|
| `decision` | Binary or multi-choice requiring human input | "Deploy v5.2 to prod?" |
| `review` | Artifact ready for approval | PR review, generated code, report |
| `proposal` | Idea or plan for consideration | "Research vector DB migration" |
| `dispatch` | Multi-agent sequence needing approval | "3-agent parallel: research + code + test" |
| `alert` | System state requiring attention | "Disk at 87%, swap active" |
| `info` | FYI, no action required | "Completed vault sync, 12 notes updated" |

### Priority Scoring (auto-sort)

```
P0 (critical)  — Revenue impact, security, data loss risk
P1 (high)      — Direct Trajan request, blocked workflow
P2 (medium)    — Reliability, agent failures, infrastructure
P3 (low)       — Improvement proposals, optimization ideas
P4 (minimal)   — Maintenance, cleanup, housekeeping
```

Items auto-sort by: priority → age → source agent reliability score

### Auto-Resolve Gate

Before escalating to queue, agent MUST:
1. Check vault via `qmd search` for relevant prior decisions
2. Check `vault/Trajan/Preferences.md` for stated preferences
3. Check `memory/corrections.md` for past corrections on this topic
4. If confidence ≥ 0.85 and prior precedent exists → resolve silently, log decision
5. Otherwise → queue for human review

## Queue Format

```json
{
  "id": "q-20260320-001",
  "type": "decision",
  "priority": "P1",
  "title": "Deploy Agent OS v5.2?",
  "context": "All tests pass. 3 new features. No breaking changes.",
  "options": ["Deploy now", "Deploy after review", "Hold"],
  "source_agent": "ops",
  "source_cycle": "heartbeat-2026-03-20T05:00Z",
  "created_at": "2026-03-20T05:15:00Z",
  "auto_resolve_check": {
    "vault_searched": true,
    "precedent_found": false,
    "confidence": 0.60
  },
  "status": "pending",
  "resolved_at": null,
  "resolution": null
}
```

## Storage

- **File:** `~/dispatch/queue/*.json` (one file per item)
- **Index:** `~/dispatch/queue/index.json` (sorted manifest)
- **Archive:** `~/dispatch/done/` and `~/dispatch/failed/` (as today)

## Discord Mirror

### Channel: `#agent-queue`

- Items posted as components v2 messages with action buttons
- Priority badge + type emoji + agent avatar
- Buttons: ✅ Approve | ❌ Reject | ⏸️ Defer | 💬 Discuss
- Button clicks update queue item status + trigger agent response
- Thread auto-created for `discuss` to keep channel clean

### Sync Direction

```
Agent generates item → writes to queue/ → posts to #agent-queue
                                        → appears in WebUI Queue page

User clicks button in Discord → updates queue/*.json → WebUI reflects
User acts in WebUI             → updates queue/*.json → edits Discord msg
```

### Message Format (Discord)

```
🔴 P1 DECISION | ⚙️ Ops

**Deploy Agent OS v5.2?**
All tests pass. 3 new features. No breaking changes.

Options:
1️⃣ Deploy now
2️⃣ Deploy after review  
3️⃣ Hold

[Approve] [Reject] [Defer] [Discuss]
```

## Agent Generation Hooks

### Where queue items originate

| Source | Generates | Priority |
|---|---|---|
| Heartbeat checks | Alerts, decisions | P2-P3 |
| Dispatch failures | Retry decisions | P2 |
| Work engine cycles | Proposals, dispatch plans | P3-P4 |
| Goal system | Implementation proposals | P2-P3 |
| Code review | Review artifacts | P1-P2 |
| Security scans | Alerts | P0-P1 |
| Research agent | Research proposals, findings | P3 |
| Auto-knowledge | Knowledge proposals | P4 |

### Integration Points

1. **dispatch.sh** — `add` command writes queue item + posts to Discord
2. **Heartbeat** — step 12 (executive functions) emits queue items
3. **Work engine** — cycle completion emits proposals
4. **Agent completion** — any agent can emit queue items via `queue-emit.sh`

## WebUI Queue Page

The existing Queue page in the Agent OS demo shows:
- Priority-sorted card list
- Filter by type, agent, priority
- Action buttons per card
- Live counter in nav badge

To make it real:
- Poll `~/dispatch/queue/index.json` via API endpoint
- Or use WebSocket from OpenClaw gateway for live updates
- Actions POST back to queue endpoint

## Implementation Plan

### Phase 1: Queue Format + CLI (1 session)
- [ ] Define JSON schema for queue items
- [ ] Create `queue-emit.sh` for agents to call
- [ ] Extend `dispatch.sh` with queue commands
- [ ] Auto-resolve gate logic

### Phase 2: Discord Mirror (1 session)  
- [ ] Create `#agent-queue` channel
- [ ] Post function with components v2 + buttons
- [ ] Button handler → update queue item
- [ ] Thread creation for discuss

### Phase 3: Agent Hooks (1 session)
- [ ] Wire heartbeat to emit queue items
- [ ] Wire dispatch failures
- [ ] Wire work engine proposals
- [ ] Wire goal system

### Phase 4: WebUI Live (future)
- [ ] API endpoint for queue data
- [ ] WebSocket for live updates
- [ ] Queue page reads real data instead of mocks

## Links

- [[Agent-OS-Frontend]] — WebUI architecture
- [[Dispatch Protocol]] — Current dispatch system
- [[Future-Frontend-Layer]] — Frontend vision
