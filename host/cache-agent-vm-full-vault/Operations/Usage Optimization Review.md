---
title: "Usage Optimization Review"
created: 2026-03-14
updated: 2026-03-14
type: operations
status: active
confidence: 0.40
confidence_updated: 2026-03-18
source: auto-capture
tags: [discord, knowledge, openclaw, ops, prompts, skills]
summary: "[[OpenClaw]] is burning through Claude Max usage too fast. $151 in a single ~5h session window. Root causes identified:"
---
# Usage Optimization Review

**Date:** 2026-03-14
**Status:** 🔴 Needs Action
**Priority:** High

## Problem

[[OpenClaw]] is burning through Claude Max usage too fast. $151 in a single ~5h session window. Root causes identified:

## Root Causes

### 1. System Prompt Bloat (38KB / ~10k tokens)
Every message — including heartbeats, "hi", status checks — loads ALL workspace files:
- AGENTS.md: 13.6KB (huge — includes Discord formatting guide, heartbeat instructions, [[auto-knowledge]] rules)
- TOOLS.md: 8KB (full system inventory, repeated every call)
- MEMORY.md: 7.3KB (growing unbounded, full history)
- SOUL.md: 5.3KB
- HEARTBEAT.md: 1.6KB
- USER.md: 1.2KB
- IDENTITY.md: 0.6KB

**Fix:** Aggressively trim these files. Move reference material to vault (where it belongs) and keep workspace .md files lean — just essential persona + behavioral rules.

### 2. Opus for Everything
Claude Opus 4 is used for heartbeats, status checks, casual greetings. These don't need the most expensive model.

**Fix:** Configure per-session model overrides:
- Heartbeats → Sonnet
- Status/dashboard channel → Sonnet  
- Complex tasks → Opus (on demand)

### 3. Heartbeat Frequency
Every 30min = 48 Opus calls/day just for heartbeats, each loading 10k+ system tokens.

**Fix:** Reduce to every 60min, or use Sonnet for heartbeat sessions.

### 4. Session Proliferation
45 sessions in one window. Sub-agent spawns, delivery mirrors, cron jobs — each starts fresh with full system prompt.

**Fix:** Be more judicious about spawning. Batch work where possible.

## Action Items

- [ ] Trim AGENTS.md — move Discord formatting, [[auto-knowledge]] rules, heartbeat details to vault references
- [ ] Trim MEMORY.md — archive completed items, keep only active context
- [ ] Trim TOOLS.md — move detailed service inventory to vault
- [ ] Configure Sonnet as default model for heartbeat sessions
- [ ] Consider Sonnet as default for dashboard channel
- [ ] Reduce heartbeat interval to 60min
- [ ] Review [[auto-knowledge]] and vault systems for token efficiency
- [ ] Add token budget awareness to HEARTBEAT.md checks

## Ideal Target

Workspace .md files should total <15KB (currently 38KB). That's ~4k tokens instead of ~10k — saves 6k tokens × every message.

## Notes

The [[auto-knowledge]] system and vault capture rules in AGENTS.md are good in principle but they add significant prompt weight. Consider:
- Moving the detailed "how to capture" instructions to a skill (loaded on demand)
- Keeping just a one-liner in AGENTS.md: "Follow [[auto-knowledge]] skill for vault captures"
- Same for Discord rich output — move the component v2 JSON examples to the [[discord-rich-output]] skill

## Related

- [[research]]
- Round
- [[3]]
- [[-]]
- [[Deprecation]]
- [[and]]
- [[Advancement]]
- [[Analysis]]
