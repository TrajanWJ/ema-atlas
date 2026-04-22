---
title: System Data Flow
type: reference
status: active
created: 2026-04-02
updated: 2026-04-06
tags: [system, data-flow, architecture, vault, qmd, hooks, automation]
source: vault cross-reference + system docs + hook architecture notes
confidence: 0.9
summary: End-to-end map of how information moves through the agent system: inbound messages and sessions, Claude Code hooks, vault writes, QMD indexing, automated knowledge extraction, bridge sync, and downstream reuse in later sessions.
related:
  - [[System Claude Code]]
  - [[Auto-Knowledge Capture]]
  - [[Bridge Sync]]
  - [[System Obsidian]]
  - [[Evolution Loop Pipeline]]
---

# System Data Flow

> The system is not just "agents talk to files." It is a layered feedback loop: messages become sessions, sessions produce files, files become indexed/searchable knowledge, and that knowledge shapes later sessions.

## Executive Summary

This system has **five primary data-flow layers**:

1. **Interaction layer** — Discord / chat / CLI / user prompts enter the system as tasks, sessions, or direct conversations.
2. **Execution layer** — Claude Code / OpenClaw / hooks / scripts produce outputs, edits, logs, and side effects.
3. **Persistence layer** — vault notes, session logs, config files, and archives store durable state.
4. **Indexing & extraction layer** — QMD, ontology sync, transcript scanning, and message harvesting turn raw files into searchable and reusable knowledge.
5. **Reuse layer** — future sessions, recalls, routing, and self-improvement loops read that persisted knowledge back in.

The key design principle running through all of it is:

> **Sessions are disposable. The vault and supporting indexes are the durable memory.**

---

## Core Architecture at a Glance

```text
Inbound message / task / user prompt
    ↓
Claude Code / OpenClaw session starts
    ↓
SessionStart hooks add orientation + subconscious context
    ↓
Work happens (read, search, edit, bash, message, browse)
    ↓
PostToolUse hooks validate writes + refresh vault indexes
    ↓
Stop hooks capture session summary / transcript sync
    ↓
Automations scan new material (QMD, auto-knowledge, harvesting, ontology sync)
    ↓
Future sessions query vault + indexes for context
    ↓
Richer next session / better routing / stronger memory
```

That is the real loop: **interaction → work → persistence → indexing → retrieval → better future work**.

---

## 1. Primary Sources of Data Entering the System

### A. Human interaction surfaces

These are the main inputs that introduce new information:
- Discord messages / dispatch tasks
- direct assistant chats
- Claude Code sessions
- OpenClaw agent sessions
- shell commands and script output
- browser / web fetch results
- imported docs / transcripts / harvested content

### B. Machine-generated system signals

The system also generates its own data:
- hook events (`SessionStart`, `PreToolUse`, `PostToolUse`, `Stop`)
- dispatch engine task state
- cron outputs
- sync jobs
- ontology extraction artifacts
- evolution reports
- session memories / project logs

These machine signals are important because they create **operational memory**, not just content memory.

---

## 2. Session Lifecycle Data Flow

The best-documented session pipeline in the vault is Claude Code, so it is the clearest backbone for the system.

### Session start

According to [[System Claude Code]], a session begins with layered configuration plus startup hooks.

#### Inputs loaded at or near startup
- `~/.claude/CLAUDE.md` — global instructions
- per-project `CLAUDE.md` / project context where applicable
- vault notes and system references
- optional external MCP / search / memory surfaces

#### SessionStart hooks
- `~/.claude/hooks/ori/orient.mjs` — Ori session briefing
- `~/.claude/hooks/letta-subconscious/session-start.mjs` — subconscious init

These hooks are the first transformation layer: they take a raw session and enrich it with orientation and prior context before the main work starts.

### During work

While the session is running, information flows through multiple channels:
- direct file reads/writes
- MCP queries (QMD, vault filesystem, graph-memory, etc.)
- shell commands
- browser and fetch tools
- Discord / messaging output
- generated plans, notes, decisions, and logs

### PreToolUse guardrails

Before certain actions execute, the system can apply safety or shaping logic:
- `~/bin/chop hook`
- `~/.claude/hooks/safety-check.sh`

This is not just about safety — it also shapes what kinds of outputs enter the persistence layer.

### PostToolUse write path

When a write occurs, two important post-write flows kick in:
- `~/.claude/hooks/ori/validate.mjs` — note validation / structure checks
- `~/.claude/hooks/vault-post-write.sh` — vault post-write operations, notably QMD refresh

This is one of the most important transitions in the whole system:

> **Transient session output becomes durable, indexed knowledge.**

### Stop hooks

At the end of a session, Stop hooks capture and synchronize what happened:
- `~/.claude/hooks/ori/capture.mjs`
- `~/.claude/hooks/letta-subconscious/sync-transcript.mjs`

This turns ephemeral interaction into reusable history.

---

## 3. Persistence Layer: Where Data Actually Lives

The vault is the main durable memory substrate, but it is not the only one.

### A. Vault notes

The vault stores:
- research notes
- system docs
- project notes
- preferences
- architecture decisions
- operational runbooks
- daily notes
- auto-generated intelligence notes
- agent learnings

This is the **human-readable canonical layer**.

### B. Session / transcript stores

In parallel to the vault, the system keeps machine-oriented session state in places like:
- Claude Code project/session directories
- OpenClaw session logs
- transcript sync outputs
- dispatch artifacts
- automation logs

These are often the **raw materials** later distilled into vault notes.

### C. Config and control files

The system also persists operational intent/state in:
- `~/.claude/settings.json`
- `~/.claude/mcp.json`
- cron and timer configs
- shared bridge directories
- usage / pace files
- ontology graph data

These do not read like knowledge notes, but they are essential to how the system behaves.

---

## 4. The Vault Write → Index → Retrieval Loop

This is the center of gravity of the architecture.

### Write path

A session creates or updates a vault note.

Examples:
- session summary written to a project/system note
- research note added under `Research/`
- system fix documented under `System/`
- preference captured under `Trajan/`

### Post-write processing

After write events, `vault-post-write.sh` updates the search/index layer. Older notes also reference periodic QMD refresh, but the more important pattern now is:
- **on write:** refresh the relevant search/index state
- **periodically:** cron/timers catch anything missed and keep indexes warm

### Indexed state

From the surrounding notes, QMD is the main semantic/keyword retrieval layer. It provides:
- keyword retrieval
- semantic/vector retrieval
- hybrid retrieval / reranking
- machine-friendly query access

The effect is simple:
- files stop being isolated markdown blobs
- they become queryable memory

### Retrieval in later sessions

Later work can query this accumulated body of notes and logs for:
- prior decisions
- prior fixes
- relevant research
- user preferences
- architecture context
- recurring patterns

This is what makes the system compound instead of restart from zero every time.

---

## 5. Automated Extraction / Distillation Flows

Not all durable knowledge is written directly by a human or in-session agent. Some is created by background systems.

### Auto-Knowledge Capture

[[Auto-Knowledge Capture]] documents a recurring extraction pipeline:

```text
Cron
  → auto-knowledge-gated.sh
    → usage gate check
    → transcript-scanner.py
    → capture.sh
```

This flow turns raw transcripts/messages into structured vault knowledge.

#### Why it matters
This is the bridge between:
- **what happened** and
- **what should be remembered**

Without it, many insights would stay trapped inside transcripts.

### Message harvesting

Companion jobs harvest message streams and Discord content as additional knowledge inputs.

### Ontology sync

Ontology extraction turns notes into entities/relationships for graph-like reuse. This adds a more structured layer on top of plain text notes.

### Memory promotion

Recurring signals can be promoted from more volatile logs into more stable knowledge artifacts.

Together these systems create a second loop:

> **raw interaction data → extracted patterns → structured knowledge → better future behavior**

---

## 6. Cross-Machine / Cross-Environment Data Flow

The system is not confined to one filesystem context.

### Bridge Sync

[[Bridge Sync]] documents a bidirectional rsync bridge between VM and host via `~/shared/`.

#### High-level flow
```text
host ~/shared/  ⇄  rsync every 60s  ⇄  vm ~/shared/
```

#### Typical exchanged artifacts
- inbox files
- task payloads
- reports
- completed work products
- archived processed items

This matters because it means some knowledge and task artifacts travel through a **staging/shared layer** before or in addition to being written into the vault.

### Why the bridge matters architecturally
The bridge separates:
- **execution environment** from
- **host environment / downstream consumers**

It enables controlled movement of outputs without requiring every tool to run in the same place.

---

## 7. Obsidian-Side Data Flow

Obsidian is both a storage surface and an interaction surface.

From [[System Obsidian]] and related notes:
- the vault lives at `~/vault/`
- Obsidian plugins expose additional access paths (e.g. claude-code-mcp)
- Obsidian CLI adds a first-party terminal control layer
- Claudian embeds Claude Code-style interaction into the vault UI

### Practical implication
The same underlying knowledge can flow through multiple access modes:
- direct filesystem access
- Obsidian desktop UI
- Obsidian plugin bridge / MCP
- Obsidian CLI
- QMD semantic search

This redundancy is useful. It means the vault remains useful even if one surface is down.

---

## 8. Retrieval Paths (How Data Comes Back Into Use)

The system has several retrieval paths, each with different strengths.

### 1. Direct filesystem reads
Best for:
- exact files already known
- deterministic edits
- raw durability

### 2. QMD / semantic search
Best for:
- finding relevant prior knowledge across many notes
- context recall
- avoiding repetitive rediscovery

### 3. MCP surfaces
Best for:
- structured access through tool protocols
- richer interaction than plain shell commands
- app/runtime-aware actions

### 4. Graph / ontology layers
Best for:
- entity relationships
- structured memory queries
- cross-note conceptual linking

### 5. Session / transcript stores
Best for:
- forensic review
- recovering exact past conversation state
- mining details not yet promoted into vault notes

---

## 9. Feedback Loops That Make the System Compound

There are multiple overlapping loops, not just one.

### A. Session learning loop

```text
session work
  → note/log written
  → indexed
  → found by later session
  → later session starts smarter
```

### B. Knowledge extraction loop

```text
messages/transcripts
  → scanners/harvesters
  → structured note capture
  → vault enrichment
  → future recall improves
```

### C. Operational health loop

```text
system incidents / fixes
  → system docs / runbooks / failure notes
  → next operator session finds fix path faster
```

### D. Evolution / self-improvement loop

```text
performance signals / outcomes / reports
  → evolution analysis
  → proposed changes
  → changed behavior / routing / prompts
  → new outcomes
```

This last loop is the most powerful and the riskiest, which is why other system notes emphasize rollback and signal quality.

---

## 10. Failure Modes

### QMD/index layer degrades
**Impact:** context retrieval weakens; notes exist but become hard to find.  
**Effect on system:** intelligence drops before core durability drops.

### Hooks fail silently
**Impact:** writes may skip validation, capture, or index refresh.  
**Effect on system:** the loop still runs, but memory quality degrades.

### Extraction jobs stop
**Impact:** transcripts/messages accumulate without distillation.  
**Effect on system:** raw data grows, but reusable knowledge stalls.

### Bridge sync breaks
**Impact:** VM ↔ host artifact exchange stalls.  
**Effect on system:** cross-environment coordination degrades even if local work continues.

### Obsidian-side integrations go down
**Impact:** fewer convenient access surfaces.  
**Effect on system:** vault still survives via filesystem/QMD, but user experience worsens.

### Session logs bloat without promotion/archiving
**Impact:** recall becomes noisy and index cost/latency can rise.  
**Effect on system:** memory exists but becomes less sharp.

---

## 11. Design Principles Visible in the Data Flow

### 1. Persistence beats session memory
If it matters, write it down.

### 2. Retrieval matters as much as storage
A note that exists but cannot be found is only half-kept memory.

### 3. Redundant access paths are intentional
Filesystem, MCP, Obsidian, QMD, graph layers: each compensates for another's weaknesses.

### 4. Automation should distill, not just accumulate
Raw transcripts are not the final product. Distilled notes and indexed knowledge are.

### 5. Hooks are the connective tissue
Without hooks, sessions and vault would be much more loosely coupled.

---

## 12. Recommended Mental Model

The cleanest way to think about the system is:

### Layer 1 — Live cognition
- sessions
- chat turns
- tool calls
- active reasoning

### Layer 2 — Durable memory
- vault notes
- project docs
- system docs
- archived logs

### Layer 3 — Retrieval and transformation
- QMD
- MCP
- ontology sync
- transcript scanning
- message harvesting

### Layer 4 — Behavior shaping
- hooks
- routing
- evolution loop
- safety checks

The system works when all four layers reinforce each other.

---

## Bottom Line

The old simplified story was:
- start session
- do work
- write notes
- index notes
- next session benefits

That was directionally right, but incomplete.

The fuller reality is:
- **multiple ingestion surfaces** feed sessions
- **hooks** shape execution and persistence
- **vault notes + transcripts + config state** form the durable layer
- **QMD, harvesting, and extraction jobs** convert raw output into reusable memory
- **bridge sync and Obsidian surfaces** move that memory across environments and interfaces
- **future sessions and evolution loops** consume it again

So the actual system data flow is not a line. It is a **compounding memory graph with hooks and automation glued around a vault-centered truth layer**.

---

## Sources

### Primary vault references
- [[System Claude Code]]
- [[Auto-Knowledge Capture]]
- [[Bridge Sync]]
- [[System Obsidian]]
- [[Evolution Loop Pipeline]]

### Supporting notes
- `wiki/system/Wiki-Navigation.md`
- vault README / knowledge-vault usage docs

#system #data-flow #feedback-loop #vault #qmd
