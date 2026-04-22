---
title: Babysitter Surface Governor Execution Plan
created: 2026-04-04
updated: 2026-04-04
type: execution-plan
status: ready-for-execution
tags: [babysitter, ema, observability, stream, cadence, execution]
---
# Babysitter Surface Governor Execution Plan

## Overview

This is the execution-ready plan for shifting EMA babysitter behavior from a loose stream/tick system into a **surface governor** model.

Core decision:
- **Babysitter governs the visible surface**
- **Semantic lanes describe what kind of update is being shown**
- **Cadence buckets describe how fast that lane is allowed to move**
- **Adaptive tick policy adjusts within the bucket, not across the whole system blindly**

This plan intentionally preserves the best parts of the older EMA design:
1. semantic stream lanes from `Ema.Stream.Manager`
2. adaptive bounded ticking from `Ema.Babysitter.StreamTicker`
3. operator-facing `babysitter:*` realtime surface

The target is not “more chatter.” The target is **clearer surface behavior with explicit routing, bounded tempo, and operator-meaningful visibility**.

---

## Decision Summary

### Canonical architectural rule

Babysitter is the **surface orchestrator** for EMA.

It decides:
- what becomes visible
- where it is visible
- how frequently it is allowed to tick
- when it should suppress updates
- when operator attention is required

### Three-layer model

#### 1. Control plane
- `#babysitter-sprint`
- human directives, approvals, decisions, escalations

#### 2. Semantic lanes
- `#system-heartbeat`
- `#intent-stream`
- `#pipeline-flow`
- `#agent-thoughts`
- `#intelligence-layer`
- `#memory-writes`
- `#execution-log`
- `#babysitter-live`

#### 3. Cadence buckets
- **hot** → 5s–30s
- **warm** → 30s–120s
- **medium** → 5m–30m
- **slow** → 30m–3h
- **archive/trend** → 3h+

Semantic lane and cadence bucket are independent dimensions.
A lane keeps its meaning while its cadence bucket determines motion.

---

## Why this change exists

The current system mixes together three separate concerns:
- lane semantics
- operator rollup behavior
- tick cadence

That creates drift where one channel starts acting like:
- a heartbeat lane
- a thought stream
- an operator console
- and a generic ticking feed

all at once.

The new model fixes that by making the split explicit:
- **lane = meaning**
- **bucket = speed**
- **babysitter = governor**

---

## Truth From Existing EMA Code

### Older semantic-lane model
From `daemon/lib/ema/stream/manager.ex`:
- `#system-heartbeat` — every 5 min
- `#agent-thoughts` — every 10 min
- `#intent-stream` — every 15 min
- `#pipeline-flow` — every 20 min
- `#intelligence-layer` — every 40 min
- `#babysitter-digest` — adaptive around ~20 min

This is still the clearest description of **what kinds of streams EMA wants**.

### Newer adaptive babysitter model
From `daemon/lib/ema/babysitter/stream_channels.ex` and `stream_ticker.ex`:
- `babysitter-live` — base 20s, min 8s, max 180s
- `babysitter-ops` — base 45s, min 15s, max 300s
- `babysitter-alerts` — base 90s, min 30s, max 600s

Adaptive inputs already implemented:
- weighted recent activity
- idleness
- token pressure
- manual override

### Current realtime truth
From `docs/REALTIME_SURFACE.md`:
- current actual websocket family is `babysitter:*`
- broader live surface in docs is partly planned / partly mock-only

So the rollout should **extend from the babysitter pattern outward**, not pretend all broader realtime topics already exist.

---

## Target Behavior Model

## A. Semantic Lane Contracts

### `#system-heartbeat`
**Purpose:** raw machine/system health facts
**Examples:** gateway up/down, active sessions count, queue depth, auth state, degraded mode state
**Never:** reasoning, milestone prose, operator narrative
**Default bucket:** medium
**Escalates to:** warm during active incidents

### `#intent-stream`
**Purpose:** declarations of intended action before execution
**Examples:** dispatch intent, anti-collision claim, ownership claim, next intended step
**Default bucket:** medium
**Escalates to:** warm when active contention or high operator visibility is needed

### `#pipeline-flow`
**Purpose:** state transitions and handoffs
**Examples:** queued → running, running → blocked, blocked → done, proposal → worker handoff
**Default bucket:** medium
**Escalates to:** warm when many transitions are landing quickly

### `#agent-thoughts`
**Purpose:** provisional internal reasoning and hypotheses
**Examples:** uncertainty, hypothesis, local diagnosis, design tension
**Default bucket:** medium
**Escalates to:** warm only for active debugging sessions

### `#intelligence-layer`
**Purpose:** second-order synthesis after multiple events
**Examples:** repeated failure pattern, cross-lane lesson, strategy adjustment, pattern summary
**Default bucket:** slow

### `#memory-writes`
**Purpose:** durable confirmed facts worth retaining
**Examples:** lessons, resolved root causes, chosen schema ownership, stable runbook updates
**Default bucket:** slow
**Can be event-driven only** when preferred

### `#execution-log`
**Purpose:** action/result evidence
**Examples:** patch applied, command succeeded, verification evidence, deployment result
**Default bucket:** warm during active work, medium otherwise

### `#babysitter-live`
**Purpose:** operator rollup of active work
**Examples:** changed/impact/blocked/next/attention deltas
**Never:** raw heartbeat duplication, freeform thoughts, vague vibes
**Default bucket:** hot during active operations, warm during lower-motion operation

---

## B. Cadence Bucket Contracts

### Hot bucket — 5s to 30s
Use for:
- active operator-visible execution
- live incidents
- takeover moments
- active blockers changing quickly

Behavior:
- delta-only
- suppress duplicates hard
- tight adaptation within 5s–30s
- should feel alive but not noisy

Primary lanes:
- `#babysitter-live`
- `#execution-log` during active work
- alert-focused babysitter overlays

### Warm bucket — 30s to 120s
Use for:
- active ops updates that matter but are not second-by-second
- flow transitions during a busy run
- stateful execution telemetry

Primary lanes:
- `#pipeline-flow`
- `#execution-log`
- `#system-heartbeat` during incident mode
- `#intent-stream` during active contention

### Medium bucket — 5m to 30m
Use for:
- normal steady-state observability
- session summaries
- intent rollups
- flow summaries

Primary lanes:
- `#system-heartbeat`
- `#intent-stream`
- `#pipeline-flow`
- `#agent-thoughts`

### Slow bucket — 30m to 3h
Use for:
- synthesis
- durable patterning
- memory-worthy summaries
- trend visibility

Primary lanes:
- `#intelligence-layer`
- `#memory-writes`
- `#evolution-signals`

### Archive / trend bucket — 3h+
Use for:
- long-range reporting
- periodic reviews
- fitness/evolution summaries
- long-horizon trend output

---

## C. Surface Governor Rules

Babysitter should govern visibility with these rules:

1. **Every event gets classified by lane**
2. **Every lane gets a default cadence bucket**
3. **Live state can temporarily promote/demote cadence within allowed rules**
4. **Operator mode can force a temporary lock**
5. **No lane can violate its semantic contract to chase activity**

Examples:
- a hot incident can temporarily move `#system-heartbeat` from medium to warm
- `#intelligence-layer` should not become a hot stream just because the system is busy
- `#babysitter-live` can stay hot, but only with real deltas

---

## Execution Scope

## Phase 1 — Lock the docs and routing model
**Goal:** make the model unambiguous before code changes.

### Deliverables
- this execution plan in wiki/vault
- updated master guide reference
- project rollout note under EMA project docs
- explicit semantic-lane to cadence-bucket mapping table

### Validation
- one canonical execution note exists
- future implementation can point to exact contracts instead of Discord memory

---

## Phase 2 — Define code touchpoints
**Goal:** make implementation scope explicit and safe.

### Primary code touchpoints

#### `daemon/lib/ema/babysitter/stream_channels.ex`
Current role:
- defines known babysitter streams
- defines per-stream bounded intervals

Required change:
- evolve from a small hardcoded babysitter stream family into a **cadence-profile registry**
- separate:
  - stream identity
  - lane class
  - default cadence bucket
  - min/base/max cadence bounds

Target shape:
- lane profile metadata
- cadence bucket metadata
- stream-to-lane mapping
- operator override compatibility

#### `daemon/lib/ema/babysitter/stream_ticker.ex`
Current role:
- adaptive ticker based on activity, idleness, token pressure, manual overrides

Required change:
- make adaptation bucket-aware
- adapt within lane-assigned cadence bucket
- support temporary promotion/demotion rules
- expose reason as both:
  - quieting reason
  - bucket reason

New behavior needed:
- `lane`
- `bucket`
- `effective_interval`
- `promotion_reason`
- `suppression_reason`

#### `daemon/lib/ema/babysitter/channel_policy.ex`
Current role:
- classifies stream state into hot/medium/quiet tier for emission suppression

Required change:
- align tier logic with the explicit cadence-bucket model
- treat current `hot/medium/quiet` as **emission policy**, not as the whole architecture
- preserve keep-alive suppression rules, but separate them from lane semantics

#### `daemon/lib/ema/stream/manager.ex`
Current role:
- old semantic lane model and cadence gates

Required change:
- treat this module as the semantic source map
- either:
  1. fold its lane contracts into babysitter registry logic, or
  2. keep it as a semantic producer and make babysitter the timing governor

Preferred direction:
- preserve `Stream.Manager` as semantic producer / recorder
- move cadence authority fully into babysitter governor logic

#### `daemon/lib/ema/stream/babysitter.ex`
Current role:
- control-plane polling of `#babysitter-sprint`

Required change:
- keep as control-plane intake
- ensure directive detection can promote relevant visible lanes and request hot/warm operator treatment when needed

#### `docs/REALTIME_SURFACE.md`
Required change:
- update to describe current realtime truth plus planned expansion path
- explicitly state that babysitter surface is the pattern for future realtime slices

---

## Phase 3 — Implement semantic lane × cadence bucket registry
**Goal:** encode the architecture in data, not vibes.

### Required work
1. Define lane registry
2. Define cadence bucket registry
3. Map streams/lane outputs to default buckets
4. Add promotion rules
5. Add suppression rules
6. Expose snapshot/debug visibility through API

### Acceptance criteria
- every visible stream has a lane identity
- every visible stream has a bucket identity
- every ticker decision reports why
- no stream is “just ticking” without semantic ownership

### Verification
- `GET /api/babysitter` or equivalent snapshot returns:
  - stream
  - lane
  - bucket
  - current interval
  - suppression state
  - promotion state
  - reason

---

## Phase 4 — Restore operator-facing behavior
**Goal:** make the Discord-visible surface match the model.

### Required work
- enforce `#babysitter-live` as operator rollup only
- stop routing raw health facts there
- ensure `#system-heartbeat` gets health facts
- ensure `#pipeline-flow` gets transitions
- ensure `#agent-thoughts` gets provisional reasoning
- ensure `#execution-log` receives action/evidence where appropriate

### Acceptance criteria
- last 20 visible messages in `#babysitter-live` read as operator deltas
- lane duplication sharply reduced
- `#babysitter-live` feels like mission control, not a raw log

---

## Phase 5 — Execution packet for coding run
**Goal:** make handoff to coder/codex trivial.

### Implementation brief
The coding agent should be instructed to:
1. inspect `stream_channels.ex`, `stream_ticker.ex`, `channel_policy.ex`, `stream/manager.ex`, `stream/babysitter.ex`
2. encode semantic-lane × cadence-bucket separation
3. preserve existing adaptive bounded ticking
4. preserve existing suppression/keep-alive logic where valid
5. surface bucket/lane info in babysitter API snapshot
6. avoid claiming broader websocket families exist if they do not

### Non-goals for first execution pass
- do not invent full new Phoenix channel families yet
- do not rewrite all realtime architecture in one pass
- do not remove current babysitter APIs
- do not break current Discord output while refactoring internal policy

---

## Suggested Task Breakdown

### Sprint 1 — Contract + registry refactor
- add lane registry and cadence bucket registry
- update stream metadata model
- keep behavior equivalent where possible
- expose lane/bucket metadata in snapshot

### Sprint 2 — Ticker policy refactor
- update `StreamTicker` to compute effective interval from bucket rules
- preserve activity/idleness/token pressure adaptation
- add promotion/demotion reasoning
- keep suppression logic compatible

### Sprint 3 — Routing alignment
- align producers so semantic lanes feed the right surfaced channels
- reduce duplication
- make `#babysitter-live` operator-only in practice

### Sprint 4 — Verification + docs
- update `REALTIME_SURFACE.md`
- update project sprint note
- record final operator runbook
- verify end-to-end behavior

---

## Validation Checklist

### Static validation
- metadata registry exists
- ticker code refers to lane + bucket explicitly
- snapshot output includes lane + bucket + reason
- master docs match code model

### Runtime validation
- hot lane ticks stay within 5s–30s bounds
- warm lane ticks stay within 30s–120s bounds
- medium lane summaries stay within 5m–30m bounds
- slow lane synthesis stays within 30m–3h bounds
- `#babysitter-live` does not receive heartbeat duplication

### Operator validation
- can answer from visible surface:
  - what changed
  - what matters
  - what is blocked
  - what happens next
  - whether attention is needed

---

## Risks

### Risk 1 — Semantic/cadence coupling remains muddy
**Mitigation:** enforce separate registries and separate naming in code.

### Risk 2 — Too much change in one pass
**Mitigation:** refactor policy first, not full channel architecture.

### Risk 3 — Old docs keep contradicting new model
**Mitigation:** treat this note plus the master guide as canonical until implementation lands.

### Risk 4 — `#babysitter-live` still attracts random content
**Mitigation:** route by lane first; use governor to reject invalid posts.

---

## Rollback

If rollout causes confusion:
1. preserve semantic lane docs
2. preserve tick template
3. fall back to old per-stream bounds
4. keep snapshot metadata additions
5. revert only the promotion/demotion complexity

Do **not** revert to a single ambiguous generic tick feed.

---

## Immediate Next Actions

1. treat this note as the execution source of truth
2. update the master guide to reference surface-governor model
3. create EMA project rollout note pointing to exact code touchpoints
4. dispatch coding execution against the EMA repo using this note as the brief
5. verify runtime behavior and then update `REALTIME_SURFACE.md`

---

## Related Notes
- [[Babysitter Stream Master Guide]]
- [[Babysitter Operator Cheat Sheet]]
- [[EMA Sprint — 2026-04-04]]
- [[REALTIME_SURFACE]]
