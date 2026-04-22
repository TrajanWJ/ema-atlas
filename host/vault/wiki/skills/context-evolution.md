---
title: context-evolution
created: '2026-03-16'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: skill-documentation
tags:
  - evolution
  - prompts
  - skill
summary: >-
  Context self-evolution engine. Implements the [[Self-Learning]] Protocol as a
  structured pipeline: post-task reflection, signal accumulation, prompt m
wiki_id: skills/context-evolution
imported_from: vault/Skills/context-evolution.md
imported_at: '2026-04-04T00:23:57.205Z'
---
# context-evolution

**Location:** `~/skills/context-evolution/`
**Type:** ⚙️ Code + Instructions

## What It Does

Context self-evolution engine. Implements the [[Self-Learning]] Protocol as a structured pipeline: post-task reflection, signal accumulation, prompt mutation proposals, version snapshots, and rollback.

Every task outcome becomes a structured signal. When 3+ consistent signals emerge, proposes SOUL.md mutations. All mutations require human approval.

## Key Scripts

- `scripts/reflect.sh` — Run post-task reflection
- `scripts/accumulate.sh` — Accumulate signals from reflections
- `scripts/propose-mutation.sh` — Generate prompt mutation proposals
- `scripts/rollback.sh` — Rollback to a previous prompt version

## Trigger

Use when reviewing agent evolution state, triggering reflection cycles, or managing prompt mutations.

#skill #evolution #prompts

## Related

- [[2026-03-16]]
- [[Agent Capabilities Matrix]]
- [[Autonomous-Learning-System-ABC]]
- [[Devils Advocate Review]]
- [[Evolution Signals]]
