---
title: Hermes Agent Memory Model
type: knowledge
tags:
  - memory
  - agent-architecture
  - bounded-memory
  - hermes
source: 'https://hermes-agent.nousresearch.com/docs/user-guide/features/memory'
created: '2026-03-18'
summary: >-
  Hermes memory architecture: bounded dual-target stores, frozen snapshot
  injection, § delimiters, capacity management, save/skip heuristics.
key_topics:
  - bounded-memory
  - frozen-snapshot
  - dual-target
  - capacity-management
  - memory-hygiene
updated: '2026-03-18'
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
wiki_id: reference/Agent-Memory-Model-Hermes
imported_from: vault/Reference/Agent-Memory-Model-Hermes.md
imported_at: '2026-04-04T00:23:56.908Z'
---

# Hermes Agent Memory Model

The most battle-tested [[memory architecture]] from the [[Hermes agent]] (Nous Research).

## Core Architecture

Two files, bounded size, frozen snapshot at session start:

| File | Purpose | Char Limit | ~Tokens |
|---|---|---|---|
| `MEMORY.md` | Agent's personal notes | 2,200 chars | ~800 |
| `USER.md` | User profile | 1,375 chars | ~500 |

**Total memory overhead: ~1,300 tokens per session.** Fixed cost regardless of history.

## Frozen Snapshot Pattern

Memory is injected once at session start and **never changes mid-session**.
- Preserves LLM prefix cache (huge performance benefit)
- Changes written to disk immediately but only visible next session
- Tool responses always show live state for feedback

## The § Delimiter

Entries separated by `§` (section sign). Benefits:
- Unambiguous entry boundary (not in normal text)
- Substring matching for replace/remove: just match a unique fragment
- Easy counting and capacity management

## System Prompt Injection Format

```
══════════════════════════════════════════════
MEMORY (your personal notes) [67% — 1,474/2,200 chars]
══════════════════════════════════════════════
User's project is a Rust web service at ~/code/myapi using Axum + SQLx
§
This machine runs Ubuntu 22.04, has Docker and Podman installed
§
User prefers concise responses, dislikes verbose explanations
```

The header shows `[67% — 1,474/2,200 chars]` — agent knows remaining capacity without counting.

## Dual Target

**memory** = agent's environment facts:
- OS, tools, project structure
- Conventions, config values
- Discovered quirks and workarounds
- Completed task diary

**user** = user profile:
- Name, timezone, communication style
- Pet peeves and preferences
- Technical skill level
- Workflow habits

## What to Save vs Skip

### SAVE (proactively, without being asked)
- User preferences: "I prefer TypeScript over JavaScript" → user target
- Environment facts: "This server runs Debian 12 with PostgreSQL 16" → memory target
- Corrections: "Don't use sudo for Docker, user is in docker group" → memory
- Project conventions: tabs, 120-char lines, Google docstrings → memory
- Completed significant work: "Migrated DB from MySQL to Postgres 2026-01-15" → memory

### SKIP
- Trivial/obvious: "User asked about Python" — too vague
- Re-discoverable: stdlib behavior, version notes
- Raw data: code blocks, log dumps, tables
- Session-ephemeral: temp file paths, one-session debug context
- Already in SOUL.md / AGENTS.md

## Entry Principles

```
# GOOD: Dense, packs multiple related facts
User runs macOS 14 Sonoma, uses Homebrew, has Docker Desktop. Shell: zsh+oh-my-zsh. Editor: VS Code + Vim keys.

# GOOD: Specific, actionable  
The staging server (10.0.1.50) needs SSH port 2222, not 22. Key is at ~/.ssh/staging_ed25519.

# BAD: Too vague
User has a server.

# BAD: Too verbose (50 words where 8 would do)
On January 5th, 2026, the user asked me to look at their project...
```

## Capacity Management

- At **80% capacity**: consolidate before adding new entries
- Merge related entries: three "project uses X" → one comprehensive project entry
- Character limit rejection returns current entries list for manual pruning

## Security Scanning

Entries scanned for injection/exfiltration patterns before acceptance. Memory is injected into system prompt — a malicious entry IS a prompt injection.

## Our Implementation (adapted)

- `MEMORY.md` in each agent workspace (bounded, § delimiters)
- `USER.md` in each agent workspace  
- `mem.sh store fact/event/decision/status` for typed persistence beyond 2200 chars
- `vault/System/memory/` for long-term typed memory that doesn't go in system prompt
