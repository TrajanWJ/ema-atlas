---
title: "Session Architecture Proposal"
created: 2026-03-16
updated: 2026-03-19
type: architecture
status: active
confidence: 0.60
confidence_updated: 2026-03-18
source: system-generated
tags: [general, github-interesting, overview, trajans-office, vault-feed, worklog]
summary: "Every Discord channel, thread, and cron job spawns an independent session with its own context window. This causes:"
---
# Session Architecture Proposal

**Status:** Draft  
**Date:** 2026-03-16  
**Author:** Right Hand  
**Problem:** 96 sessions under `main` agent, many bloated or wasteful. No lifecycle strategy.

## Problem Statement

Every Discord channel, thread, and cron job spawns an independent session with its own context window. This causes:

1. **Context waste** — Feed channels (worklog, vault-feed) accumulate 30-80k tokens on auto-generated content nobody converses with
2. **Session sprawl** — 96 sessions, many at 0 tokens (never used) or stuck at high context
3. **Knowledge isolation** — Something learned in #general isn't available in #trajans-office
4. **Cron bloat** — Heartbeat/cron runs accumulate ~20k tokens each across 48+ invocations
5. **No lifecycle** — Sessions are born but never deliberately archived or killed

## Current State

| Category | Count | Typical Size | Problem |
|---|---|---|---|
| Conversational (#trajans-office, #general, #overview) | 3 | 30-150k | These should persist, they're valuable |
| Feed channels (#worklog, #vault-feed, #github-interesting) | 3 | 30-80k | Write-only, sessions waste context on auto-posts |
| Forum threads (desk/) | 12+ | 0-154k | Mix of active projects and one-shots |
| Cron sessions | 4+ | 20k each | Repeating context, no cross-run memory |
| Subagent sessions | 50+ | varies | Transient, should self-clean |

## Design Principles

1. **Conversational channels get persistent sessions** — These are where Trajan actually talks. Full LCM, full context.
2. **Feed channels are write-only** — No session needed. Post via message tool, no context accumulation.
3. **Forum threads have lifecycles** — Active projects persist, completed/abandoned threads get archived.
4. **Cron sessions are disposable** — Each run gets a fresh context. State carries via files, not chat history.
5. **LCM is the cross-session memory** — lossless-claw already handles within-session context. For cross-session, workspace files + vault are the bridge.

## Proposed Architecture

### Tier 1: Persistent Sessions (full context + LCM)
- `#trajans-office` — Primary conversation channel
- `#overview` — Status/briefing channel (Trajan sometimes responds)
- `#general` — Casual conversation
- **Config:** Full LCM compaction, 30d retention, auto-maintenance

### Tier 2: Write-Only Channels (no session persistence)
- `#worklog` — Automated daily posts, ops logs
- `#vault-feed` — Vault change notifications
- `#github-interesting` — Auto-discovered repos
- **Implementation:** Post via `message` tool from a Tier 1 session. Channel itself has no session. If Trajan messages in these channels, route to the nearest Tier 1 session.

### Tier 3: Project Threads (lifecycle-managed)
- Forum threads in `desk/` category
- **Lifecycle:** IDEA → ACTIVE → SHIPPED/ABANDONED
- **Active threads:** Persist with LCM, session lives as long as thread is ACTIVE
- **Completed threads:** Archive session, keep transcript for reference
- **Config:** `pruneAfter: 14d` for non-active threads

### Tier 4: Ephemeral Sessions (disposable)
- Cron jobs, subagents, one-shot tasks
- **Config:** No persistence. Fresh context each run. Results written to files.
- Session auto-pruned after 24h

## Implementation Plan

### Phase 1: Session Maintenance (immediate)
Already partially done via `session-health.sh`:
```json
{
  "session": {
    "maintenance": {
      "mode": "enforce",
      "pruneAfter": "14d",
      "maxEntries": 200,
      "rotateBytes": "10mb",
      "resetArchiveRetention": "7d"
    }
  }
}
```

### Phase 2: Feed Channel Routing (needs research)
[[OpenClaw]] doesn't natively support "write-only channels" — every inbound message creates/uses a session. Options:
1. **Activation gating** — Set activation to `never` for feed channels so the bot never processes inbound messages there
2. **Manual posting** — Always post to feed channels from a Tier 1 session using the `message` tool
3. **Session grouping** — If [[OpenClaw]] supports it, route multiple channels to one session (needs investigation)

### Phase 3: Cross-Session Context
- **Workspace files** remain the primary cross-session state carrier (MEMORY.md, vault, daily notes)
- **LCM grep** can search across conversations when `allConversations: true`
- **Startup protocol** (AGENTS.md) already reads key files on session init
- **Missing:** No way for a Tier 2 post to trigger context in a Tier 1 session. Acceptable — files bridge this.

### Phase 4: Cron Optimization
- Cron sessions should use smaller/cheaper models where possible
- Heartbeat crons could share a single rotating session instead of creating new ones
- Investigation: Can `session.mainKey` be used to force cron runs into one session?

## Open Questions

1. Can [[OpenClaw]] route multiple channels to one session? (The `bindings` system routes agents, not sessions)
2. Can feed channels be set to `activation: "never"` to prevent session creation on inbound?
3. Does LCM's cross-conversation search (`allConversations: true`) work well enough to replace shared sessions?
4. Should cron sessions be on a cheaper model (sonnet vs opus) to save budget?

## Metrics to Track

- Total session count (target: <50 active)
- Highest context usage across sessions
- Token spend per channel category (conversation vs feed vs cron)
- Cross-session recall accuracy (can I find info from another channel?)

## Related
- [[Research/Session Management Best Practices|Session Health Automation]] — `~/bin/session-health.sh`
- [[Gateway Exposure Audit]] — Security implications of session sprawl
- [[Research/LCM Context Compression|LCM Plugin]] — lossless-claw context management
- [[reliability-first-reorg-v1]]
