# Swarm Workspace Pack

This folder is the canonical overview pack for EMA's shared swarm workspace.
It exists to keep the coordination model legible in one place: what the
workspace is for, what it owns, what it does not own, and how multiple
orchestrators are supposed to align around the same truth.

Start here if you need the short version:

1. [`fresh-orchestrator-read-order.md`](./fresh-orchestrator-read-order.md) - the
   lean read path for a new orchestrator
2. [`ema-swarm-workspace.md`](./ema-swarm-workspace.md) - the doctrine and
   workspace model
3. [`continuous-progress-protocol.md`](./continuous-progress-protocol.md) - the
   operating loop for active lanes
4. [`orchestrator-alignment.md`](./orchestrator-alignment.md) - multi-orchestrator
   coordination rules
5. [`object-model.md`](./object-model.md) - canonical swarm vocabulary

If Claude is taking the main deliverables lane:

- [`claude-deliverables-orchestrator-prompt.md`](./claude-deliverables-orchestrator-prompt.md)
  - clean orchestrator prompt aimed at EMA's actual product vision
- [`claude-worker-prompt.md`](./claude-worker-prompt.md) - smaller worker-only
  variant
- [`deliverables-support-lanes.md`](./deliverables-support-lanes.md) - what the
  rest of the swarm should do without competing on the main artifact
- [`vision-guardrails.md`](./vision-guardrails.md) - anti-drift product shape
  guardrails
- [`no-drift-rules.md`](./no-drift-rules.md) - practical stop, handoff, and
  anti-sprawl rules

## Canonical rule

> **EMA owns truth. Hermes owns execution. Surfaces do not own state.**

That rule is the load-bearing constraint for the entire pack. The swarm
workspace is not a sidecar notebook, a chat log, or a planner cache. It is a
project-scoped coordination substrate whose artifacts are projections of
EMA-owned facts.

## What this pack covers

- why the shared swarm workspace exists
- the overall workspace model
- the key object families that should be treated as first-class
- how lane ownership, handoffs, queueing, schedules, and checkups fit together
- how multiple orchestrators stay aligned without creating competing truth
  systems
- how to join active work without drowning in the archive
- how to keep support lanes aligned while a main deliverables lane is in motion
- how to keep the product vision intact while the swarm is active

## Core object families

- coordination objects: `lane`, `lane_claim`, `handoff`, `queue_item`
- commitment objects: `responsibility`, `weekly_phase`, `cadence_policy`,
  `checkup`
- work objects: `task`, `workstream`, `execution`, `approval`
- collaboration objects: `thread`, `wiki_document`, `canvas`, `note`, `file`
- identity objects: `actor`, `project`, `space`

## Source basis

This pack is grounded in the EMA atlas doctrine and donor patterns from the
Proslync/Autharis swarm routine, especially the lane registry, claim/hold
lifecycle, planner/control-tower discipline, explicit handoffs, and drift
audits.
