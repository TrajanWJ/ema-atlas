---
title: evolution-loop
created: '2026-03-16'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: skill-documentation
tags:
  - automation
  - evolution
  - skill
summary: >-
  Self-evolution orchestrator. Reads [[agent-performance]] logs, feeds them
  through [[context-evolution]] reflection, generates mutation proposals, auto
wiki_id: skills/evolution-loop
imported_from: vault/Skills/evolution-loop.md
imported_at: '2026-04-04T00:23:57.207Z'
---
# evolution-loop

**Location:** `~/skills/evolution-loop/`
**Type:** ⚙️ Code + Instructions
**Dependencies:** [[agent-performance]], [[context-evolution]]

## What It Does

Self-evolution orchestrator. Reads [[agent-performance]] logs, feeds them through [[context-evolution]] reflection, generates mutation proposals, auto-applies high-confidence proposals, and logs everything.

Designed to run on a 6-hour cron cycle.

## Key Scripts

- `scripts/run-cycle.sh` — Execute a full evolution cycle
- `scripts/status.sh` — Check evolution loop status

## Trigger

Use when checking evolution status or triggering a manual evolution cycle.

#skill #evolution #automation

## Related

- [[Agent Capabilities Matrix]]
- [[Autonomous-Learning-System-ABC]]
- [[Devils Advocate Review]]
- [[Evolution Signals]]
- Review
- Evolution
- [[-]]
- [[Favorites]]
