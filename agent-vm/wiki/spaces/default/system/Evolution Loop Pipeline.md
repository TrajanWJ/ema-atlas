---
type: knowledge
domain: agent-architecture
confidence: 0.8
source: 'agent:vault-keeper'
summary: >-
  Every-6h automated pipeline that evolves agent prompts, skills, and routing
  based on performance data and signals
created: '2026-03-18'
updated: '2026-03-18'
aliases:
  - evolution loop
  - agent evolution
  - self-improvement pipeline
title: Evolution Loop Pipeline
status: active
wiki_id: system/Evolution_Loop_Pipeline
imported_from: vault/System/Evolution Loop Pipeline.md
imported_at: '2026-04-04T00:23:57.234Z'
tags: []
---

# Evolution Loop Pipeline

## Purpose

Automated agent self-improvement cycle that runs every 6 hours. Analyzes performance data, detects patterns, and applies targeted improvements to prompts, skills, and dispatch routing.

## Pipeline Stages

```
Signals → Analysis → Proposals → Application → Verification → Log
```

1. **Signal Collection** — Gathers from `vault/System/Evolution Signals.md`, `memory/outcome-tracker.json`, `memory/agent-performance.md`, `memory/workflow-patterns.json`
2. **Pattern Detection** — `pattern-detector.py` identifies recurring successes/failures, skill crystallization candidates (5+ successes, 70%+ rate)
3. **Proposal Generation** — Suggests prompt edits, new skills, routing changes
4. **Application** — Applies safe changes; flags risky ones for human review
5. **Verification** — Tests that changes don't break existing flows
6. **Logging** — Records all changes to `vault/System/Evolution Log.md` and `vault/System/Evolution Reports/`

## Schedule

- **Cron:** Every 6 hours (`30 */6 * * *`)
- **Script:** `~/skills/evolution-loop/scripts/run-loop.sh --all`
- **Log:** `/tmp/evolution-loop.log`

## Data Sources

| Source | What It Provides |
|---|---|
| `Evolution Signals.md` | Manual observations and improvement ideas |
| `outcome-tracker.json` | Structured task outcomes (agent, type, success/fail, what worked/failed) |
| `agent-performance.md` | Agent fitness scores and historical performance |
| `workflow-patterns.json` | Pattern counts for crystallization candidates |

## Evolution Reports

Stored in `vault/System/Evolution Reports/` with date-stamped filenames. Each report includes: changes made, metrics before/after, and items deferred to next cycle.

## Companion Crons

- `pattern-detector.py` (every 6h) — feeds pattern data to evolution
- `prompt-archaeologist.sh` (Mon 4am) — analyzes prompt quality trends
- `dispatch-optimizer.sh` (Sun 5am) — optimizes dispatch routing

## Related

- [[Evolution Log]] — running log of all evolution changes
- [[Evolution Signals]] — human and agent improvement observations
- [[Agent Capabilities Matrix]] — current agent capabilities
- [[Agent Orchestration Patterns]] — dispatch patterns that evolve
