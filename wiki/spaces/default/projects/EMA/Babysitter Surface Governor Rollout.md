---
title: Babysitter Surface Governor Rollout
project: EMA
type: rollout-plan
status: ready-for-execution
date: 2026-04-04
tags: [ema, babysitter, rollout, observability, cadence]
---
# Babysitter Surface Governor Rollout

## Goal
Move EMA babysitter from an ambiguous mixed stream/tick model into a **surface governor** model that combines:
- semantic lanes from older stream architecture
- bounded adaptive cadence from newer babysitter runtime
- operator-visible Discord behavior that matches both

## Execution order

### Phase 1 — Contract lock
- Treat [[Babysitter Surface Governor Execution Plan]] as source of truth
- Keep [[Babysitter Stream Master Guide]] as lane/tick behavior reference
- Keep [[Babysitter Operator Cheat Sheet]] as operator quick-reference

### Phase 2 — Registry refactor
Code touchpoints:
- `daemon/lib/ema/babysitter/stream_channels.ex`
- `daemon/lib/ema/babysitter/stream_ticker.ex`
- `daemon/lib/ema/babysitter/channel_policy.ex`

Target:
- lane registry
- cadence bucket registry
- stream-to-lane mapping
- interval reasons exposed in snapshot

### Phase 3 — Producer alignment
Code touchpoints:
- `daemon/lib/ema/stream/manager.ex`
- `daemon/lib/ema/stream/babysitter.ex`

Target:
- keep semantic producers
- make babysitter the timing governor
- reduce cross-posting and role confusion

### Phase 4 — Surface verification
Docs/code touchpoint:
- `docs/REALTIME_SURFACE.md`

Target:
- current realtime truth stays honest
- future expansion described from babysitter pattern outward

## Success criteria
- `#babysitter-live` reads as operator mission-control lane
- health facts stay in `#system-heartbeat`
- transitions stay in `#pipeline-flow`
- thoughts stay in `#agent-thoughts`
- synthesis stays in `#intelligence-layer`
- adaptive intervals stay bounded by explicit bucket rules

## First coding pass constraints
- do not invent unreleased realtime families
- do not remove current babysitter API routes
- do not rewrite the whole system at once
- do preserve existing adaptive bounded logic where possible

## Handoff brief
Use [[Babysitter Surface Governor Execution Plan]] as the coding brief.
