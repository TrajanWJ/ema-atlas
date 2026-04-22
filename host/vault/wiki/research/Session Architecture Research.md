---
title: Session Architecture Research
created: '2026-03-16'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: research
tags:
  - mcp
  - openclaw
  - ops
  - prompts
  - research
  - skills
summary: '1. [Current Capabilities](#1-current-capabilities)'
wiki_id: research/Session_Architecture_Research
imported_from: vault/Research/Session Architecture Research.md
imported_at: '2026-04-04T00:23:57.112Z'
---
# OpenClaw Session Architecture Deep Dive

**Researcher:** 🔬 Researcher | **Date:** 2026-03-16 | **Priority:** High

---

## Table of Contents

1. [Current Capabilities](#1-current-capabilities)
2. [LCM (Lossless Context Management)](#2-lcm-lossless-context-management)
3. [Cross-Session Knowledge Sharing](#3-cross-session-knowledge-sharing)
4. [Context Hygiene](#4-context-hygiene)
5. [Session Lifecycle Management](#5-session-lifecycle-management)
6. [Gaps & Missing Pieces](#6-gaps--missing-pieces)
7. [Recommended Configuration Changes](#7-recommended-configuration-changes)
8. [ClawHub Skills Worth Evaluating](#8-clawhub-skills-worth-evaluating)
9. [Architecture Diagram](#9-architecture-diagram)

---

## 1. Current Capabilities

### Session Routing

[[OpenClaw]] routes inbound messages to sessions via **session keys**:

- **Direct chats:** `agent:<agentId>:<mainKey>` (default `main`)
- **Groups/channels:** `agent:<agentId>:<channel>:group:<id>` or `:channel:<id>`
- **Cron:** `cron:<job.id>`
- **Webhooks:** `hook:<uuid>`
- **Subagents:** `agent:<agentId>:subagent:<uuid>`

Key routing config: `session.dmScope` controls DM isolation (`main`, `per-peer`, `per-channel-peer`, `per-account-channel-peer`). Trajan's current setup uses the default `main` — all DMs share one session. This is fine for single-user.

### Session Persistence (Two Layers)

1. **Session store** (`sessions.json`) — key/value metadata map (session ID, last activity, token counters, toggles, model overrides)
2. **Transcript** (`<sessionId>.jsonl`) — append-only conversation history with tree structure

Locations: `~/.openclaw/agents/<agentId>/sessions/`

### Session Lifecycle

Current config:
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

Sessions reset at either 4 AM local time or after 7 days idle (whichever comes first). The `mode: "daily"` means the daily reset at 4 AM wins most of the time for active sessions.

### Session Tools (Agent-Facing)

- `sessions_list` — enumerate sessions with metadata
- `sessions_history` — fetch transcript for any session
- `sessions_send` — send messages cross-session (with ping-pong up to 5 turns)
- `sessions_spawn` — create isolated subagent sessions

### Compaction System

Two layers of context management:

1. **Session pruning** — trims old tool results in-memory per request (doesn't rewrite transcript). Mode: `cache-ttl` with TTL-aware pruning for Anthropic prompt caching.
2. **Compaction** — summarizes older conversation into persistent summary entries. Current mode: `safeguard` ([[OpenClaw]]'s built-in), but **overridden by LCM plugin** via context engine slot.

### Memory System

- **File-based:** `memory/YYYY-MM-DD.md` (daily) + `MEMORY.md` (curated)
- **Vector search:** `memory_search` + `memory_get` tools, with session memory indexing enabled
- **Pre-compaction flush:** automatic silent turn that writes durable notes before compaction
- **QMD backend:** available but not currently configured (using default SQLite indexer)

---

## 2. LCM (Lossless Context Management)

### What It Is

LCM is a **context engine plugin** (`lossless-claw` v0.3.0) that replaces [[OpenClaw]]'s built-in sliding-window compaction with a DAG-based summarization system. It's **currently installed and active** as `plugins.slots.contextEngine: "lossless-claw"`.

**Core principle:** Nothing is ever lost. Every message is persisted in SQLite. Summaries form a directed acyclic graph (DAG) that can be traversed to recover original detail.

### How It Works

```
Raw Messages → Leaf Summaries (d0) → Condensed Summaries (d1) → Higher Condensed (d2+)
     │                  │                       │
     └──── All persisted in SQLite (lcm.db) ────┘
```

1. **Ingestion:** Every message stored with seq number, role, content, token count, and structured parts
2. **Leaf compaction (d0):** Chunks of 8+ messages outside the fresh tail → ~1200 token summary
3. **Condensation (d1+):** Groups of 4+ same-depth summaries → higher-level ~2000 token summary
4. **Assembly:** Each turn: `[summary₁, ..., summaryₙ, message₁, ..., messageₘ]` within token budget

### Current Configuration

```json
{
  "lossless-claw": {
    "enabled": true,
    "config": {
      "freshTailCount": 32,
      "contextThreshold": 0.75,
      "incrementalMaxDepth": -1,
      "summaryModel": "anthropic-backup/claude-sonnet-4-6",
      "summaryProvider": "anthropic-backup"
    }
  }
}
```

- **freshTailCount: 32** — last 32 messages always in full context
- **contextThreshold: 0.75** — compact when context hits 75% of window
- **incrementalMaxDepth: -1** — unlimited cascade condensation
- **summaryModel:** Uses backup Anthropic key for summarization (smart — doesn't eat the primary quota)

### Agent Tools (LCM-provided)

| Tool | Purpose | Cost |
|------|---------|------|
| `lcm_grep` | Search messages/summaries by regex or full-text | Fast (direct DB query) |
| `lcm_describe` | Inspect a specific summary or stored file | Fast (direct DB query) |
| `lcm_expand_query` | Deep recall via sub-agent DAG expansion | 30-120s, spawns sub-agent |
| `lcm_expand` | Low-level DAG walk (sub-agent only) | Only available inside expansion sub-agents |

**Escalation pattern:** `lcm_grep` → `lcm_describe` → `lcm_expand_query`

### Large File Handling

Files >25k tokens are intercepted at ingestion, stored separately in `~/.openclaw/lcm-files/`, and replaced with a compact reference + exploration summary. Retrievable via `lcm_describe(id: "file_xxx")`.

### Database

Single SQLite database at `~/.openclaw/lcm.db`. Tables: conversations, messages, message_parts, summaries, summary_messages, summary_parents, context_items, large_files.

---

## 3. Cross-Session Knowledge Sharing

### What Works Today

**LCM cross-conversation search:** All LCM tools support `allConversations: true` to search across ALL agent sessions. This is the most powerful cross-session feature available today.

```
lcm_grep(pattern: "deployment", allConversations: true)
lcm_expand_query(query: "OAuth fix", prompt: "What was the root cause?", allConversations: true)
```

**Session memory search (experimental):** Enabled in config:
```json
{
  "memorySearch": {
    "experimental": { "sessionMemory": true },
    "sources": ["memory", "sessions"]
  }
}
```
This indexes session transcripts and surfaces them via `memory_search`.

**sessions_send / sessions_history:** Agents can read other sessions' transcripts and send messages cross-session.

**File-based memory:** All agents can read/write to the shared workspace `memory/` directory and vault. This is the current cross-session knowledge sharing mechanism — it's manual but effective.

### What's Missing

1. **No automatic cross-session context injection** — when a new session starts, it doesn't automatically know what happened in other sessions unless the model uses LCM tools or reads memory files
2. **No session-to-session knowledge graphs** — decisions made in one session aren't automatically surfaced in another
3. **No session handoff protocol** — when a session dies/resets, there's no structured way to transfer context to the successor

---

## 4. Context Hygiene

### Current Mechanisms

| Mechanism | Layer | Persistence | Status |
|-----------|-------|-------------|--------|
| Session pruning | In-memory | No (per-request) | Default (cache-ttl for Anthropic) |
| Auto-compaction | LCM | Yes (SQLite DAG) | Active (threshold 0.75) |
| Memory flush | Pre-compaction | Yes (memory files) | Enabled |
| Bootstrap file truncation | System prompt | No | 20k chars/file, 150k total |
| Large file interception | LCM | Yes (separate storage) | Active (25k token threshold) |
| Maintenance | Session store | Yes | Enforce mode, 14d prune, 300 max entries |

### Context Budget Breakdown

For a 200k token context window:
- **System prompt:** ~10k tokens (workspace files, tool schemas, skills list)
- **LCM summaries:** Variable, budget-constrained by assembler
- **Fresh tail (32 messages):** Variable, always included
- **Tool calls/results:** Variable, pruned after TTL
- **Reserve:** 25% (50k tokens) for model output + headroom

### Pain Points

1. **Tool schema bloat:** The `browser` tool schema alone is ~2.5k tokens. Combined tool schemas can eat 8-10k tokens.
2. **Workspace file injection:** AGENTS.md + SOUL.md + TOOLS.md + IDENTITY.md + USER.md can be 5-8k tokens. These are injected every turn.
3. **Skills list overhead:** 12 skills = ~550 tokens in system prompt
4. **Compaction-adjacent issue:** LCM's `safeguard` mode in [[OpenClaw config]] is effectively overridden by the plugin — the `compaction.mode: "safeguard"` in agents.defaults may cause confusion

---

## 5. Session Lifecycle Management

### Current Flow

```
Message arrives
  → Session key resolved (routing rules)
  → Session ID resolved (existing or new)
  → Context assembled (LCM: summaries + fresh tail)
  → Model inference
  → Tool execution loop
  → Post-turn: ingest to LCM, evaluate compaction
  → Response delivery
```

### Reset Triggers

1. **Daily reset:** 4 AM local time (gateway host = UTC)
2. **Idle reset:** 7 days (10080 minutes) — ⚠️ this is very generous
3. **Manual:** `/new` or `/reset` command
4. **Thread parent fork guard:** 100k token threshold (skips parent forking for huge sessions)

### Subagent Lifecycle

- Spawned via `sessions_spawn` into isolated `agent:<agentId>:subagent:<uuid>` sessions
- Auto-archived after 60 minutes (configurable via `subagents.archiveAfterMinutes`)
- 5-minute timeout by default (`subagents.runTimeoutSeconds: 300`)
- Can't spawn sub-sub-agents
- Result announced back to parent

### Session Maintenance

Currently enforcing:
- Prune sessions older than 14 days
- Max 300 entries
- Archive retention: 7 days

---

## 6. Gaps & Missing Pieces

### Critical Gaps

1. **Session reset kills LCM continuity (partially)**
   - When a session resets, a NEW conversation is created in LCM
   - Old conversation's summaries are still searchable via `allConversations: true`
   - But the agent doesn't automatically know to search old conversations
   - **Fix needed:** Add startup instructions that remind the agent to check prior conversations, or configure LCM to auto-inject a "previously on..." summary at session start

2. **No context engine for subagent sessions**
   - LCM's `prepareSubagentSpawn` and `onSubagentEnded` hooks exist but subagent sessions are ephemeral
   - Subagent findings die with the session unless explicitly written to files
   - **Fix needed:** Could be addressed by having subagents write to shared memory files (already partially done via AGENTS.md instructions)

3. **Daily reset at 4 AM UTC might be wrong**
   - Trajan is EST (UTC-5), so 4 AM UTC = 11 PM EST
   - Sessions could reset mid-evening conversation
   - **Fix needed:** Set `atHour` to 9 (4 AM EST = 9 AM UTC)

### Moderate Gaps

4. **No session tagging/labeling for search**
   - Sessions have `origin.label` metadata but no user-defined tags
   - Makes it harder to find specific project-related sessions

5. **Memory search not configured optimally**
   - Using default SQLite indexer instead of QMD
   - No hybrid search (BM25 + vector) enabled
   - No temporal decay configured
   - No MMR deduplication

6. **Compaction model could be cheaper**
   - Using `anthropic-backup/claude-sonnet-4-6` for summarization
   - Could potentially use a smaller/cheaper model for leaf summaries while keeping Sonnet for condensed summaries

### Nice-to-Have Gaps

7. **No session analytics/dashboard**
   - No easy way to see session health, compaction rates, token usage trends

8. **No auto-pruning of LCM database**
   - `lcm.db` will grow indefinitely
   - No retention policy for old conversations

9. **Context engine plugin API for cross-agent sharing**
   - LCM is per-agent (each agent could have its own conversations)
   - No built-in way for agent A to access agent B's LCM data

---

## 7. Recommended Configuration Changes

### Immediate (High Impact)

#### 7.1 Fix daily reset hour for EST timezone

```json
{
  "session": {
    "reset": {
      "mode": "daily",
      "atHour": 9,
      "idleMinutes": 10080
    }
  }
}
```
4 AM EST = 9 AM UTC. Currently 4 AM UTC = 11 PM EST.

**Or better:** Switch to idle-only mode since LCM handles continuity:
```json
{
  "session": {
    "reset": {
      "mode": "idle",
      "idleMinutes": 10080
    }
  }
}
```

#### 7.2 Enable hybrid memory search with temporal decay and MMR

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "enabled": true,
        "sources": ["memory", "sessions"],
        "experimental": { "sessionMemory": true },
        "query": {
          "hybrid": {
            "enabled": true,
            "vectorWeight": 0.7,
            "textWeight": 0.3,
            "mmr": { "enabled": true, "lambda": 0.7 },
            "temporalDecay": { "enabled": true, "halfLifeDays": 30 }
          }
        }
      }
    }
  }
}
```

#### 7.3 Clean up compaction config confusion

Since LCM owns compaction now, the `compaction.mode: "safeguard"` in agents.defaults is effectively bypassed. Consider:
```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "mode": "safeguard",
        "memoryFlush": { "enabled": true },
        "reserveTokensFloor": 20000
      }
    }
  }
}
```
Note: LCM handles compaction, but [[OpenClaw]]'s `memoryFlush` still fires independently. Confirm whether the memory flush is running correctly alongside LCM or if LCM's own lifecycle makes it redundant.

### Medium Priority

#### 7.4 Consider QMD backend for memory search

QMD combines BM25 + vectors + reranking and supports session transcript indexing natively:
```json
{
  "memory": {
    "backend": "qmd",
    "citations": "auto",
    "qmd": {
      "includeDefaultMemory": true,
      "update": { "interval": "5m" },
      "limits": { "maxResults": 8, "timeoutMs": 5000 },
      "sessions": { "enabled": true }
    }
  }
}
```
QMD is already installed on the system (`qmd` binary available).

#### 7.5 Increase subagent timeout for complex tasks

Current: 300s (5 min). Observed: Vault Keeper needs 8min+, Researcher needs 8min+.
```json
{
  "agents": {
    "defaults": {
      "subagents": {
        "runTimeoutSeconds": 600
      }
    }
  }
}
```

#### 7.6 Enable session pruning explicitly for cost savings

```json
{
  "agents": {
    "defaults": {
      "contextPruning": {
        "mode": "cache-ttl",
        "ttl": "5m",
        "keepLastAssistants": 3
      }
    }
  }
}
```

### Lower Priority

#### 7.7 Configure per-channel session reset

Discord sessions could use longer idle windows since conversations there are more project-oriented:
```json
{
  "session": {
    "resetByChannel": {
      "discord": { "mode": "idle", "idleMinutes": 43200 }
    }
  }
}
```

---

## 8. ClawHub Skills Worth Evaluating

### High Relevance

| Skill | Score | Why |
|-------|-------|-----|
| `compaction-survival` | 3.32 | Compaction survival strategies — could complement LCM |
| `session-memory` | 3.48 | Session memory management — may have cross-session patterns |
| `session-memory-workspace` | 3.32 | Workspace-based session memory — could bridge LCM and file memory |
| `context-aware-delegation` | 0.89 | SmartBeat — context-aware task delegation, relevant to subagent dispatch |
| `elite-longterm-memory` | 3.77 | Long-term memory management — highest scored memory skill |
| `memory-tiering` | 3.59 | Tiered memory (hot/warm/cold) — complementary to LCM's DAG tiers |

### Moderate Relevance

| Skill | Score | Why |
|-------|-------|-----|
| `session-watchdog` | 3.36 | Session health monitoring |
| `session-cleanup` | 3.37 | Session cleanup automation |
| `session-cleanup-pro` | 3.32 | Advanced session cleanup |
| `miliger-context-manager` | 3.31 | Context management v2 |
| `context-preserver` | 3.26 | Context preservation strategies |

### Already Installed (via AGENTS.md roster)

- `elite-longterm-memory` — Vault Keeper has this
- `memory-hygiene` — Vault Keeper has this
- `context-evolution` — Ops has this

### Note on ClawHub

`clawhub info` returned empty for most skills — the detailed info endpoint may be rate-limited or these skills may lack full metadata. Installation would be needed to evaluate them properly.

---

## 9. Architecture Diagram

```
                              ┌──────────────────────┐
                              │   OpenClaw Gateway    │
                              │   (Session Router)    │
                              └──────┬───────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                 │
              ┌─────▼─────┐  ┌──────▼──────┐  ┌──────▼──────┐
              │  Discord   │  │  Telegram   │  │   Cron/     │
              │  Channel   │  │  Channel    │  │   Webhooks  │
              └─────┬─────┘  └──────┬──────┘  └──────┬──────┘
                    │                │                 │
                    └────────┬───────┘─────────┬──────┘
                             │                 │
                    ┌────────▼─────────┐ ┌─────▼──────────┐
                    │  Session Store   │ │  LCM Plugin     │
                    │  sessions.json   │ │  (Context Engine)│
                    │  *.jsonl         │ │  lcm.db          │
                    └──────────────────┘ └────────┬────────┘
                                                  │
                              ┌────────────────────┤
                              │                    │
                    ┌─────────▼────────┐  ┌───────▼──────────┐
                    │  Summary DAG     │  │  Message Store    │
                    │  (Leaf → Cond.)  │  │  (Full History)   │
                    └──────────────────┘  └──────────────────┘
                              │
                    ┌─────────▼────────┐
                    │  Agent Tools     │
                    │  lcm_grep        │
                    │  lcm_describe    │
                    │  lcm_expand_query│
                    └──────────────────┘
                              │
                    ┌─────────▼────────┐
                    │  Memory Layer    │
                    │  memory/*.md     │
                    │  MEMORY.md       │
                    │  memory_search   │
                    │  (SQLite/QMD)    │
                    └──────────────────┘
```

### Data Flow: What Happens on Each Turn

```
1. Message arrives → Session key resolved → Session ID resolved
2. LCM bootstrap (if new session): reconcile JSONL with LCM DB
3. LCM ingest: persist message to DB + context_items
4. LCM assemble: summaries (budget-fit) + fresh tail (32 msgs)
5. System prompt built: workspace files + tools + skills
6. Model inference + tool loop
7. LCM afterTurn: ingest responses, evaluate compaction
8. If over threshold: leaf pass → condensation cascade
9. Memory flush (if nearing compaction): silent write to memory/
10. Response delivery
```

---

## Summary

**Trajan's setup is already quite good.** LCM is the right tool for the job and it's correctly configured. The main wins are:

1. **Fix the timezone** — daily reset at 4 AM UTC = 11 PM EST (or switch to idle-only)
2. **Enable hybrid memory search** — BM25 + vector + temporal decay + MMR for much better recall
3. **Consider QMD** — better search quality than the default SQLite indexer
4. **Increase subagent timeouts** — 5 min is too short for complex agents
5. **Add cross-session recall instructions** to agent prompts (remind agents to use `allConversations: true`)

The biggest conceptual gap is **automatic cross-session context injection at session start** — today the agent has to actively use LCM tools to recall prior sessions. A startup hook or BOOTSTRAP.md instruction that auto-queries recent LCM history could close this gap significantly.

## Related

- [[README]]
- [[Session Management Best Practices]]
- [[briefing-2026-03-16]]
