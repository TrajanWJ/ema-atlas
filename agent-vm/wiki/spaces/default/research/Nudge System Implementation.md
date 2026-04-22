---
title: Nudge System Implementation
created: '2026-03-16'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: research
tags:
  - architecture
  - evolution
  - knowledge
  - prompts
  - research
  - skills
summary: >-
  Added a `## Self-Check Nudges` section to SOUL.md with three periodic internal
  prompts:
wiki_id: research/Nudge_System_Implementation
imported_from: vault/Research/Nudge System Implementation.md
imported_at: '2026-04-04T00:23:57.097Z'
---
# Nudge System Implementation

**Date:** 2026-03-16
**Status:** ✅ Implemented
**Inspired by:** [[Hermes Agent Architecture Study]] — their most impactful self-improvement mechanism

## What Was Implemented

### 1. Self-Check Nudges (SOUL.md)

Added a `## Self-Check Nudges` section to SOUL.md with three periodic internal prompts:

| Nudge | Frequency | Action |
|---|---|---|
| **Preference Check** | ~10 interactions | Write new preferences to `vault/Trajan/Preferences.md` |
| **Skill Check** | ~15 tool-heavy interactions | Identify repetitive patterns → create skill or log to [[Evolution Signals]] |
| **Memory Hygiene** | ~20 interactions | Prune stale MEMORY.md entries, add missing context |

**Key design decision:** These are internalized behaviors, not external injection. Hermes injects reminders from outside; we made them part of the agent's identity. Heartbeats serve as natural checkpoints — no literal counting needed.

### 2. Bounded MEMORY.md (SOUL.md + MEMORY.md)

- Added `## Bounded MEMORY.md` section to SOUL.md with a 2500-char cap and pruning rules
- Added `<!-- Usage: X/2500 chars -->` tracker to bottom of MEMORY.md
- Current MEMORY.md is ~4530 chars — already over cap, so the Memory Hygiene nudge will trigger pruning on next session

### Design Rationale

Hermes uses external injection (system messages every N turns). We chose internalization because:
1. Right Hand already has a [[self-learning]] protocol — nudges extend it naturally
2. Heartbeats provide built-in periodic checkpoints
3. Internalized rules survive across sessions via SOUL.md (external injections require runtime state)
4. The agent should *want* to self-improve, not be *reminded* to

### What Differs from Hermes

| Aspect | Hermes | Right Hand |
|---|---|---|
| Mechanism | External system message injection | Internalized SOUL.md behavior |
| Timing | Exact turn count (every 10) | Approximate, heartbeat-aligned |
| Memory cap | Not mentioned | 2500 chars with usage tracker |
| Skill creation trigger | 15+ tool iterations → prompt | Pattern recognition → create or log |
| Persistence | Runtime only | Survives across sessions (in SOUL.md) |

## Files Modified

- `SOUL.md` — Added "Self-Check Nudges" and "Bounded MEMORY.md" sections
- `MEMORY.md` — Added char usage tracker comment

## Next Steps

- First Memory Hygiene pass needed — MEMORY.md is ~4530 chars, needs pruning to 2500
- Monitor whether nudge frequency feels right after a few sessions
- Consider adding nudge effectiveness tracking to `memory/agent-performance.md`
