---
title: rhino-os-product-quality-loop
created: '2026-03-19'
updated: '2026-03-19'
type: research
status: active
source: unknown
tags: []
wiki_id: research/rhino-os-product-quality-loop
imported_from: vault/Research/rhino-os-product-quality-loop.md
imported_at: '2026-04-04T00:23:57.171Z'
summary: ''
---
# Rhino-OS — Prediction-Driven Product Quality Loop

**URL**: https://github.com/rhinehart514/rhino-os  
**What**: Learning plugin for Claude Code — 17 commands, 6 agents, 20 skills  
**Install**: `claude /plugin marketplace add rhinehart514/rhino-os`  
**For**: Solo technical founders building products with Claude Code

## Core Insight

Most dev tools measure **code quality** — linting, test coverage, type safety.  
Rhino-OS measures **product quality** — does the user get value?

The gap it closes: developers using AI coding tools think they're 20% more productive. Studies show they're actually 19% less productive. The gap is measurement — nobody checks if AI-assisted work made the product better.

## The Scoring System

`/score` orchestrates 5 measurement tiers → one honest number:

| Tier | What It Measures |
|---|---|
| Health | Infrastructure / uptime |
| Code eval | Tests, types, linting |
| Visual quality | UI appearance, responsiveness |
| Behavioral testing | Does it do what users need? |
| Agent-backed market viability | Is this feature actually valuable? |

**Confidence badge**: ●●●○○ = 3 of 5 tiers have data. Tells you how much to trust the score.

## Key Commands

- `/score` — orchestrates all measurement tiers, returns one number
- `/plan` — finds the bottleneck in current product
- `/go` — builds autonomously, measures after every change, **reverts regressions**
- `/eval` — scores every feature 0-100

## What Makes It Different

**Prediction-driven**: Plants testable beliefs ("signup flow completes in under 30 seconds"), scores them, reverts changes that make them worse. This is hypothesis-based development, not vibes.

**Regression auto-revert**: `/go` builds + measures + reverts if score drops. CI catches code failures. Rhino-OS catches product failures.

**Cross-session learning**: Accumulates what works, stops doing what doesn't. Each session improves the next.

## Architecture

- 17 commands (slash commands for Claude Code)
- 6 specialized agents (measurement, planning, building, evaluation, market, health)
- 20 skills loaded via Claude Code plugin system
- Mind files for persistent agent state

## Application to OpenClaw

### The Core Pattern

The prediction-driven loop is what our dispatch system lacks:
- We track task done/failed
- We don't track: did completing that task make the product measurably better?

Dispatch enhancement: add `success_assertion` field to task JSON:
```json
{
  "id": "implement-auth",
  "success_assertion": "User can complete signup in <60 seconds",
  "measurement_method": "playwright test: auth-flow.spec.ts"
}
```

After task completion: run assertion. If fails → mark as `DONE_REGRESSION`.

### Prediction Database Pattern

```bash
# ~/.dispatch/predictions/
# - YYYY-MM-DD-task-id.md: assertion + expected + actual + verdict
```

Over time: which types of tasks tend to regress? Which agents make predictions that hold?

### `/go` Pattern → Dispatch Loop with Measurement

`/go` = dispatch task → measure → revert if regression. Our loop already has the "dispatch → measure" part (done/failed). Missing: regression detection.

### Immediate Take

The concept is more valuable than the tool itself. Implement the **prediction-driven assertion** pattern in our dispatch system natively.

## Status
- Interesting conceptually; install low priority unless actively building a product
- Core patterns (prediction assertions, regression revert) worth implementing in dispatch directly
- Study the agent role architecture (6 agents for measurement/planning/building) for our own agent design
