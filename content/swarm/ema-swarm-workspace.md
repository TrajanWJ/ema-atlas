# EMA Swarm Workspace

## Frame

The shared swarm workspace is EMA's durable coordination layer for humans and
agents. It exists so work does not scatter into chat scrollback, ad hoc folders,
or surface-local state. The workspace is where coordination becomes addressable:
who owns what, what is blocked, what is waiting, what is scheduled, what was
handed off, and what needs review.

The workspace is not execution. It is not the control plane. It is the durable
shared working set that sits beside execution lineage and is governed by it.

## Why this exists

EMA's source lineages converge on the same problem: once multiple humans and
agents are working at once, informal coordination collapses unless the system
has first-class objects for ownership, handoff, and cadence. Proslync/Autharis
showed that lane discipline, planner upkeep, explicit handoffs, and drift
prevention are not process trivia; they are the mechanics that keep a swarm
coherent.

EMA keeps the useful discipline, but it does not copy the donor control-plane
split. The durable model is:

- one canonical authority layer in EMA
- one shared coordination workspace
- Hermes as the execution fabric
- surfaces as projections, not authorities

That lets the repo absorb swarm behavior without letting every surface invent
its own truth.

## Canonical rule

> **EMA owns truth. Hermes owns execution. Surfaces do not own state.**

Applied to the swarm workspace, that means:

- a planner view is a render of authoritative state, not the state itself
- a handoff document is a coordination artifact, not a hidden source of truth
- a lane claim is only real if EMA can attribute it
- a schedule block is only real if it binds to a project/space/actor context

## Overall workspace model

The cleanest model is:

`Org -> Project -> Space -> Workstream -> Objects`

- `Project` is the hard authority boundary.
- `Space` is the default collaboration boundary inside a project.
- `Workstream` is the continuity object that keeps related work together.
- Workspace objects are the durable units of coordination inside that scope.

The workspace should therefore be treated as project-scoped, with space-scoped
substructure where collaboration needs it. A workspace object should always be
answerable to at least:

- which `project` it belongs to
- which `space` it belongs to, if any
- which `actor` owns or last touched it
- which `workstream` or execution lineage it is attached to

## Key object families

### Coordination objects

- `lane` - bounded unit of swarm work
- `lane_claim` - explicit ownership claim for a lane
- `handoff` - transfer contract between owners or lanes
- `queue_item` - backlog or intake item before promotion into a lane

These are the core anti-drift objects. They make it possible to see what is
claimed, what is waiting, and what has moved.

### Commitment objects

- `responsibility` - durable recurring duty
- `weekly_phase` - self-directed temporal focus block
- `cadence_policy` - rules for recurring checkups and pacing
- `checkup` - scheduled or actual review point for a lane, task, or actor

These are the objects that keep the swarm paced. They separate backlog from
calendar from accountability so the system can reason about cadence instead of
just a pile of tasks.

### Work objects

- `task` - durable intent to do work
- `workstream` - continuity wrapper for related work
- `execution` - a concrete run or attempt recorded by EMA
- `approval` - a control-plane gate for consequential moves

These anchor the relationship between coordination and actual doing. A lane may
point at one or more tasks. A task may have many executions. An execution should
never be mistaken for the workstream itself.

### Collaboration objects

- `thread` - shared conversation object
- `wiki_document` - semantic knowledge object
- `canvas` - graph-like collaborative surface
- `note` - lightweight shared annotation
- `file` - versioned shared asset

These objects carry the shared context around the swarm. They are first-class,
but they do not get to invent authority. They remain linked back to EMA-owned
identities and work objects.

### Identity objects

- `actor` - principal abstraction for a human, agent, or system participant
- `project` - canonical authority boundary for an EMA instance
- `space` - collaboration boundary inside a project

Identity is not optional metadata. The workspace only stays coherent if every
meaningful object is attributable to the correct project, space, and actor.

## Donor-derived discipline

The Proslync/Autharis routine is useful because it names the mechanics that keep
a swarm healthy:

- explicit lane registry
- claim/hold/release lifecycle
- explicit handoffs instead of informal reassignment
- planner or control-tower upkeep as a real job
- backlog, schedule, and waiting separated into different objects
- drift audits for stale claims, missing handoffs, and orphaned work

EMA should preserve that discipline, but it should promote it into canonical
workspace objects rather than leaving it as a human ritual or repo convention.

## Multi-orchestrator alignment

The workspace is only useful if multiple orchestrators can read and act on it
without forking the truth. In EMA, the orchestrators are different layers with
different jobs:

- EMA decides what is canonical
- Hermes executes the runtime work
- planner, HQ, desktop, CLI, and wiki surfaces render or edit the canonical
  objects
- peer or remote executors participate only through EMA-owned leases and
  lineage

Alignment rules:

- one lane should have one active owner claim at a time
- a handoff must be explicit and attributable
- a surface may propose a change, but EMA must own the authoritative record
- schedule objects and backlog objects must remain distinct
- no orchestrator gets a private copy of truth that cannot be reconciled back
  to EMA

This is the key anti-drift guarantee. Without it, you do not have a swarm
workspace; you have several disagreeing coordination boards.

## Practical reading of the workspace

If you are using this pack to implement or review a feature, ask four questions:

1. Is this object about coordination, execution, or collaboration?
2. Which project and space does it belong to?
3. Which actor is responsible for it right now?
4. Does this surface render EMA truth, or does it try to own state?

If the answers are unclear, the object is probably not canonical yet.

## Read next

- [`README.md`](../../README.md)
- [`../briefs/shared-workspace.md`](../briefs/shared-workspace.md)
- [`../briefs/coordination-environment.md`](../briefs/coordination-environment.md)
- [`../briefs/authority-control-plane.md`](../briefs/authority-control-plane.md)
- [`../briefs/semantic-layer.md`](../briefs/semantic-layer.md)
- [`../../04-agent-orchestration-and-shared-workspace-briefing.md`](../../04-agent-orchestration-and-shared-workspace-briefing.md)
- [`../../05-fresh-context-project-app-model.md`](../../05-fresh-context-project-app-model.md)

