---
title: Session Management Best Practices
created: '2026-03-16'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: research
tags:
  - coding
  - general
summary: >-
  This research sprint was triggered by a real incident: **9 hours of autonomous
  work lost** because a session died and the agent hadn't written a CONTI
wiki_id: research/Session_Management_Best_Practices
imported_from: vault/Research/Session Management Best Practices.md
imported_at: '2026-04-04T00:23:57.112Z'
---
# Session Management Best Practices

**Researcher:** 🔬 Researcher | **Date:** 2026-03-16 | **Status:** Research Complete

---

## Context

This research sprint was triggered by a real incident: **9 hours of autonomous work lost** because a session died and the agent hadn't written a CONTINUE.md checkpoint. The goal is to document what [[OpenClaw]] offers, what gaps exist, and what patterns the community has found for managing multi-channel agent sessions.

→ See also: [[Session Architecture Research]] (detailed architecture deep dive), [[Agent Continuity Patterns]] (session death recovery)

---

## 1. OpenClaw Session Architecture (What We Have)

### How Sessions Are Keyed

[[OpenClaw]] resolves every inbound message to a session key automatically:

| Context | Session Key Pattern |
|---|---|
| Discord channel | `agent:<id>:discord:channel:<channelId>` |
| Telegram DM | `agent:<id>:telegram:main` (or per-peer, configurable) |
| Cron job | `cron:<jobId>` |
| Subagent | `agent:<id>:subagent:<uuid>` |

**Critical insight:** Each Discord channel gets its own isolated session. This is the correct architecture for context isolation. The problem is not that channels share sessions — it's that sessions share nothing *useful* across channel boundaries.

### Session Storage Layer

- **sessions.json** — session metadata (IDs, last activity, token counters, toggles)
- **<sessionId>.jsonl** — append-only transcript per session
- **lcm.db** — LCM's SQLite store for summarized context across all sessions

Location: `~/.openclaw/agents/<agentId>/sessions/`

### The LCM Plugin (Lossless Context Management)

This is [[OpenClaw]]'s key differentiator for session continuity. LCM (`lossless-claw`) stores every message in SQLite and builds a DAG of summaries. **Nothing is ever lost** — even after session reset, prior context is searchable via:

```
lcm_grep(pattern: "topic", allConversations: true)
lcm_expand_query(query: "what happened with X", allConversations: true)
```

Current config in Trajan's stack:
```json
{
  "freshTailCount": 32,        // last 32 messages always in full context
  "contextThreshold": 0.75,    // compact at 75% of context window
  "summaryModel": "anthropic-backup/claude-sonnet-4-6"
}
```

---

## 2. Context Pollution Across Channels: The Problem

This is the most common pain point reported in the community. Symptoms:
- Agent conflates work from channel A with context from channel B
- Tasks discussed in #coding bleed into responses in #general
- Agent "remembers" things from the wrong channel

**[[OpenClaw]]'s answer:** Each channel already gets an isolated session. Context pollution across channels shouldn't happen architecturally — if it does, it usually means:

1. The agent's **memory files** (memory/YYYY-MM-DD.md, vault/) are shared across sessions. Memory retrieved via `memory_search` doesn't know which channel the original conversation happened in.
2. **LCM cross-session search** — when an agent uses `allConversations: true`, it deliberately reaches across channels. The lack of channel-tagging makes this noisy.
3. **Startup context injection** — shared workspace files (AGENTS.md, SOUL.md, etc.) load into every session's system prompt.

### Solutions Used in Practice

#### Solution A: Per-Channel Memory Namespacing
Tag every memory write with the source channel:
```
memory_write(content: "...", metadata: {channel: "coding", channelId: "1234"})
```
Filter on recall:
```
memory_search(query: "...", filter: {channel: "coding"})
```
**Status:** Not natively implemented in [[OpenClaw]] yet. Workaround: use separate vault subdirectories per project/channel.

#### Solution B: Channel-Scoped Vault Directories
Instead of one flat `/vault/`, create:
```
/vault/Channels/
  /discord-coding/
  /discord-general/
  /discord-projects/
```
Each channel's context stays in its own directory. Agents know to read from the right scope.

#### Solution C: Session Labels + LCM Tag Filtering
Tag sessions at creation time with a project label. Use `lcm_grep` with regex patterns to scope searches to tagged sessions. The `allConversations` parameter is already available; the missing piece is a tag-based `where` filter.

#### Solution D: Separate Agent Instances Per Channel
Deploy separate agent configs for different channel types (e.g., `main` agent handles Discord, separate `ops` agent handles monitoring cron). Eliminates cross-channel pollution entirely at the cost of more infrastructure.

---

## 3. Session Reset and Daily Cycles

### Current Config
```json
{
  "session": {
    "reset": {
      "mode": "daily",
      "atHour": 4,
      "idleMinutes": 10080
    }
  }
}
```

### Problems With This

1. **Timezone issue:** `atHour: 4` is UTC. Trajan is EST (UTC-5), so sessions reset at 11 PM EST — mid-evening.
2. **Daily mode wipes long-running context** — 4 AM daily is too aggressive if sessions are mid-task.

### Better Approaches

**Option 1: Idle-only mode**
```json
{
  "session": { "reset": { "mode": "idle", "idleMinutes": 4320 } }
}
```
Sessions only reset after 3 days idle. Useful for project-specific channels with intermittent activity.

**Option 2: Fix the timezone**
```json
{
  "session": { "reset": { "mode": "daily", "atHour": 9 } }
}
```
9 AM UTC = 4 AM EST. Same "overnight" behavior, correct timezone.

**Option 3: Idle + never for critical channels**
For project channels with active autonomous work, disable automatic reset entirely and rely on LCM compaction to manage context size.

---

## 4. Multi-Channel Management Patterns

### Observations from Community

No official documentation exists for "managing many Discord channels with one agent." The following patterns are inferred from [[OpenClaw]] architecture + community GitHub issues:

#### Pattern 1: Hub-and-Spoke (recommended)
One primary "main" agent handles routing and user interaction. Specialist agents (Coder, Researcher, Ops) handle specific channels. The main agent spawns subagents for deep work.

**Benefit:** Clean context separation. Main agent doesn't accumulate codebase-specific context from coding channel.

**[[OpenClaw]]'s `sessions_spawn` supports this.** Each subagent gets its own session key.

#### Pattern 2: Single Agent + Channel-Scoped Memory
One agent handles all channels. Implements per-channel vault directories + tagged memories to maintain context separation without managing multiple agents.

**Benefit:** Simpler ops. One config file, one model API key, one restart.
**Downside:** All channel context accumulates in one LCM DB. LCM compaction will eventually blend it.

#### Pattern 3: Router Agent
A lightweight routing agent dispatches messages to specialized channel agents based on rules. The router doesn't accumulate domain context — it just knows how to dispatch.

**Not natively supported yet in [[OpenClaw]]** (as of March 2026), but achievable by chaining `sessions_send` calls with routing logic in the agent's tool use.

---

## 5. Configuration Recommendations

### Immediate Changes (High Impact)

```json
// Fix timezone for daily reset
"session": { "reset": { "mode": "daily", "atHour": 9 } }

// Increase subagent timeout (5min is too short for complex tasks)
"subagents": { "runTimeoutSeconds": 600 }

// Enable cross-session memory search
"memorySearch": {
  "experimental": { "sessionMemory": true },
  "sources": ["memory", "sessions"]
}
```

### BOOTSTRAP.md / CONTINUE.md Protocol

The most impactful non-config change: **every long-running agent session should write a CONTINUE.md at the start of any autonomous work block**, containing:
- What's currently in progress
- What was completed this session
- What state any background tasks are in
- What to do next if the session restarts

This is cheap, human-readable, and survives any crash. The [[session architecture research]] shows LCM handles the "what was discussed" part — but CONTINUE.md handles the "what should I do next" part that LCM alone can't infer.

### Per-Channel Bootstrap Instructions

For channels doing autonomous long-running work, add to the agent's startup flow:
```
1. Read CONTINUE.md (if exists) — what was in progress
2. lcm_grep recent context for this channel
3. Read today's memory file
```

---

## 6. Context Budget Management

For a 200k context window (Claude Sonnet):

| Component | Token Cost | Notes |
|---|---|---|
| System prompt | ~10k | workspace files + skills |
| LCM summaries | Variable | budget-capped by assembler |
| Fresh tail (32 messages) | Variable | always included |
| Tool schemas | 8-10k | browser alone = 2.5k |
| Workspace files | 5-8k | AGENTS.md + SOUL.md + etc. |
| Reserve (25%) | ~50k | for output headroom |

**Practical limit:** ~120k tokens for actual conversation before compaction kicks in.

**Active conversations in #coding with large code pastes or long tool outputs will hit 75% quickly.** LCM compaction handles this gracefully — but large file interception (25k token threshold) should catch code dumps before they consume the budget.

---

## 7. What's Missing (Gaps)

| Gap | Impact | Workaround |
|---|---|---|
| No automatic cross-session context injection at session start | Agent doesn't know prior channel history on restart | Add BOOTSTRAP instructions to read LCM + CONTINUE.md |
| No channel-tag filtering in LCM/memory search | Cross-channel contamination in memory recall | Per-channel vault directories |
| No session-to-session handoff protocol | Lost work on unexpected session death | CONTINUE.md protocol |
| No session analytics dashboard | Hard to see context health per channel | Manual `lcm_grep` + `sessions_list` |
| Subagent timeout too short (5 min) | Complex subagent tasks fail silently | Set `runTimeoutSeconds: 600` |
| LCM database grows indefinitely | Storage + performance over time | No current retention policy |

---

## Summary

[[OpenClaw]]'s session architecture is solid. Each channel gets isolated sessions. LCM preserves everything across resets. The main gaps are:

1. **Session death recovery** — no automatic checkpoint/resume. Manual CONTINUE.md is the stopgap.
2. **Cross-channel memory tagging** — memories written to the vault don't track which channel they came from. Add metadata tagging or use per-channel vault directories.
3. **Startup context injection** — agents should auto-check LCM + CONTINUE.md on every session start, not just when they remember to.

The "context pollution" problem people report is usually not [[OpenClaw]]'s fault — it's the agent conflating memories from different contexts at recall time. Fix recall with scoped queries, not architecture changes.

---

*Related: [[Agent Continuity Patterns]] | [[Session Architecture Research]] | [[OpenClaw Extensions Deep Dive]]*
