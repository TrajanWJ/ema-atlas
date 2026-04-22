---
title: "Proposal Pipeline"
intent_level: 3
intent_kind: feature
intent_status: active
intent_priority: 2
project: ema
parent: "[[EMA-OS]]"
tags: ["feature", "proposals", "pipeline", "ai"]
---

# Proposal Pipeline

## What

9-stage AI proposal generation and review pipeline. Seeds define what to propose; the pipeline generates, refines, debates, scores, tags, and combines proposals for human review.

## Why

EMA needs autonomous initiative — the ability to suggest work without being asked. The pipeline ensures proposals are refined and stress-tested before reaching the user, reducing noise and increasing actionability.

## Status

**Fully operational.** All stages running as GenServers, wired via PubSub on topic `"proposals:pipeline"`.

## Pipeline Flow

```
Seed → Scheduler → Preflight → Generator → Refiner → Debater → Scorer → Tagger → Combiner
                                                                                    ↓
                                                                              KillMemory
```

| Stage | Purpose |
|-------|---------|
| Seed | Defines a generation prompt — what kind of proposal to create |
| Scheduler | Selects which seeds to fire based on timing and priority |
| Preflight | Validates seed context is available before generation |
| Generator | Claude generates a raw proposal from seed + context |
| Refiner | Claude refines the raw proposal for clarity and actionability |
| Debater | Claude stress-tests the proposal — challenges assumptions |
| Scorer | Assigns confidence and impact scores |
| Tagger | Adds category and domain tags |
| Combiner | Deduplicates and merges related proposals |
| KillMemory | Tracks killed patterns to avoid re-proposing rejected ideas |

## User Actions

| Action | Color | Effect |
|--------|-------|--------|
| Approve | Green | Creates an [[Execution-Engine\|Execution]] — work begins |
| Redirect | Yellow | Kills the proposal, spawns 3 new seeds in adjusted directions |
| Kill | Red | Rejects the proposal, pattern stored in KillMemory |

## Related

- [[Proposal-Pipeline]] — Full architecture documentation
- [[related::Execution-Engine]] — approved proposals create executions
- [[Pipes-Routines]] — proposal triggers available for pipe automation
