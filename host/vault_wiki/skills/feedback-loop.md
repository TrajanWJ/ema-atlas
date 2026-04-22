---
title: feedback-loop
created: '2026-03-16'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.4
confidence_updated: 2026-03-18T00:00:00.000Z
source: auto-capture
tags:
  - auto-knowledge
  - automation
  - skill
summary: >-
  Closes the gap between pattern detection and skill generation. Reviews [[skill
  proposals]] from vault, auto-generates skill skeletons when signal stre
wiki_id: skills/feedback-loop
imported_from: vault/Skills/feedback-loop.md
imported_at: '2026-04-04T00:23:57.207Z'
---
# feedback-loop

**Location:** `~/skills/feedback-loop/`
**Type:** ⚙️ Code + Instructions

## What It Does

Closes the gap between pattern detection and skill generation. Reviews [[skill proposals]] from vault, auto-generates skill skeletons when signal strength is high enough, tracks usage of auto-generated skills, and provides heartbeat-compatible status checks.

Completes the [[auto-knowledge]] cycle: pattern detection → proposal review → skill generation → usage tracking → staleness cleanup.

## Key Scripts

- `scripts/review-proposals.sh` — Review pending [[skill proposals]]
- `scripts/generate-skeleton.sh` — Auto-generate skill from high-signal proposal
- `scripts/track-usage.sh` — Track usage of auto-generated skills

## Trigger

Use when reviewing [[skill proposals]], generating new skills from patterns, or auditing auto-generated skill usage.

#skill #auto-knowledge #automation

## Related

- [[README]]
