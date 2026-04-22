# First Meta-EMA Space / Project / Workline

Status: active planning definition
Date: 2026-04-13
Owner: meta-EMA operator
Plane: planning

## Purpose

This document defines the **first coherent meta-EMA space** for the real EMA repo.

It exists to answer one practical question:

**If EMA is its own first project, what is the first space that both agents and the human operator can actually work inside without confusing canon, plans, implementation reality, and gaps?**

This is a planning document.
It is **not** canon.
It is **not** a claim that the full workspace already exists in the shipped product.

---

## Short answer

The first meta-EMA space should be:

- **Space name:** `EMA Control Room`
- **Space slug:** `ema-control-room`
- **Project housed inside it:** `meta-ema`
- **Primary workline:** `control-plane-reconciliation`

This is the first space because it matches what is already most real in the repo:

- EMA already has real backend entities for `spaces`, `intents`, `proposals`, `executions`, `goals`, `calendar`, `review`, and `chronicle`-adjacent work.
- EMA already has a broad but uneven GUI surface.
- EMA already has agent-facing CLI/query surfaces.
- EMA already has a documented need to reconcile **canon vs planning vs runtime reality vs gap**.

So the first space should **not** try to model every future project type.
It should center the one thing EMA already demonstrably needs and can support:

**operating EMA itself as a living system of record.**

---

## The definition

### Space

**`EMA Control Room`** is the top-level operational space for running EMA as its own first project.

This space is where the operator and agents look at:

- what EMA says it is
- what EMA has planned
- what EMA actually implements now
- what is missing, contradicted, or blocked
- what work should be approved and executed next

### Project

Inside that space, the first project is:

**`meta-ema`** — the project of making EMA capable of governing, inspecting, and improving itself.

This project is narrower than “build all of Genesis.”
It is specifically about making EMA usable as:

- its own operating context
- its own planning environment
- its own implementation tracker
- its own gap-reconciliation surface

### Workline

Inside that project, the first workline is:

**`control-plane-reconciliation`**

This workline owns the continuous loop:

1. read canon
2. read planning
3. read runtime reality
4. identify gaps / contradictions
5. shape concrete next work
6. approve proposals
7. execute bounded changes
8. record outcomes back into the system

That workline is the first one because it produces the system clarity required for every later workline.
Without it, all later work risks being built on mixed-truth context.

---

## Why this is the right first space

## Reality

The repo already supports a meaningful subset of this space better than it supports more ambitious workspace concepts.

Implemented or partially implemented now:

- flat `spaces` domain with members and lifecycle
- real `intents` services
- real durable `proposal` lifecycle
- real durable `execution` lifecycle
- renderer surfaces for proposals / executions / blueprint / wiki / agenda-like and operator-facing apps
- backend source-of-truth docs and operating-reality docs

Not yet coherent enough for “full Genesis space” operation:

- no single authoritative GUI map for all product surfaces
- CLI is still more canon/query oriented than full operator control plane
- multiple overlapping intent/execution representations still exist
- many renderer apps are broader than their backed runtime truth

So the first space should be chosen by **operational coherence**, not by maximal ambition.

## Canon

Genesis defines EMA as a shared home for humans and agents with spaces, intents, proposals, executions, wiki, research, and operational management.

`EMA Control Room` fits that canon because it is a real instance of EMA being used as intended:

- shared human + agent environment
- project-bounded work
- intent -> proposal -> execution loop
- visible relationship between knowledge and action

## Gap

The main unresolved gap is not “we lack a visionary name.”
It is:

**there is not yet one clearly defined first place where EMA’s self-operation is supposed to happen.**

This document fills that planning gap.

---

## What belongs in this first space

The first space should expose four explicit panes or sections, whether file-backed first or GUI-backed later.

### 1. Canon pane

Purpose:
- show the authoritative semantic target

Primary contents:
- `ema-genesis/EMA-GENESIS-PROMPT.md`
- `ema-genesis/_meta/CANON-STATUS.md`
- selected canon specs / decisions

Operator question:
- **What should EMA be?**

### 2. Planning pane

Purpose:
- show shaped but not-yet-ratified work

Primary contents:
- blueprint docs
- intention-building docs
- this first-space definition
- concrete work decomposition docs

Operator question:
- **What should we do next, and how should we shape it before execution?**

### 3. Reality pane

Purpose:
- show what actually exists now

Primary contents:
- `docs/OPERATING-REALITY.md`
- `docs/GROUND-TRUTH.md`
- `docs/backend/*`
- verified service/runtime status

Operator question:
- **What is actually true and working right now?**

### 4. Gap pane

Purpose:
- show contradictions, missing implementation, and promotion blockers

Primary contents:
- explicit gap ledger entries
- canon/reality contradictions
- planning/reality drift
- workline blockers

Operator question:
- **What is preventing clean alignment?**

These four panes are the minimum viable product shape for the first meta-EMA space.

---

## Human vs agent operating model inside the first space

## Agent lane

Agents should use the first space primarily as a **control-plane work context**.

Agent responsibilities:

- inspect canon / planning / reality / gap separately
- assemble bounded context for a specific task
- create or refine intents and proposals
- execute approved work
- write results back into durable docs / runtime stores
- avoid flattening aspirations into “already true” system claims

Agent default workflow:

1. open the `meta-ema` project
2. identify the active workline (`control-plane-reconciliation` unless another is explicitly active)
3. gather the relevant canon/planning/reality/gap inputs
4. produce a bounded next action
5. update the relevant durable record after execution

## Human lane

Trajan should use the first space as the **operator cockpit** for EMA itself.

Human responsibilities:

- inspect current system truth
- review high-value gaps
- approve / reject proposed work
- choose next priorities
- inspect execution outcomes
- decide when planning material is mature enough for canon promotion

Human default workflow:

1. open `EMA Control Room`
2. scan today’s reality + active gaps + pending proposals
3. choose one workline slice
4. approve bounded work
5. inspect resulting execution / artifact / doc changes

---

## The first workline in detail: `control-plane-reconciliation`

## Goal

Keep EMA’s self-understanding honest and actionable.

## Scope

This workline includes:

- source-of-truth hierarchy cleanup
- doc-plane separation
- GUI truth-surface cleanup
- CLI/operator workflow definition
- conversion of broad ambition into bounded approved work
- explicit ledgering of contradictions and missing pieces

This workline does **not** include:

- implementing every Genesis module
- pretending the broad route inventory is already product authority
- replacing canon with current implementation shortcuts

## Inputs

- canon docs
- planning docs
- backend/runtime docs
- verified codebase/runtime inspection
- pending operator questions

## Outputs

- clarified space/project/workline definitions
- gap entries
- concrete proposals
- execution records
- promoted doc updates when warranted

## Success condition

A session should be able to answer, quickly and honestly:

- what EMA is aiming at
- what EMA has actually implemented
- what the biggest active gaps are
- what one bounded next move should be

---

## Initial object model for this space

This is a planning-level object layout, not a claim that every field is already wired end to end.

### Space record

```yaml
name: EMA Control Room
slug: ema-control-room
description: "Operator and agent control room for running EMA as its own first project."
```

### Project record

```yaml
id: meta-ema
space: ema-control-room
summary: "EMA operating on itself as a governed project."
```

### Primary workline record

```yaml
id: control-plane-reconciliation
project: meta-ema
summary: "Continuously reconcile canon, planning, runtime reality, and gaps into bounded next work."
```

### Suggested initial queues inside the workline

- `pending-gaps`
- `pending-proposals`
- `approved-executions`
- `promotion-candidates`
- `operator-questions`

---

## Recommended first GUI expression

When rendered for the human, the first space should bias toward **operator clarity**, not vApp count.

Recommended day-1 sections:

- **Overview**
  - current reality summary
  - pending proposals
  - highest-severity gaps
- **Canon**
  - canonical target docs
- **Plan**
  - active planning nodes / next decomposition
- **Reality**
  - runtime status + backend truth references
- **Gaps**
  - open contradictions and missing implementation
- **Executions**
  - recent bounded work and artifacts

Avoid making the first space a generic app launcher for every route.
It should be a **workline cockpit**.

---

## Recommended first CLI expression

A CLI/operator-oriented expression of the first space should let an agent answer:

- what space/project/workline is active
- what the top open gaps are
- what proposals await review
- what executions most recently changed the system
- what docs define canon vs reality

If a dedicated control-room command set does not exist yet, file-backed docs and existing intent/proposal/execution surfaces should be treated as the temporary implementation path.

---

## Boundaries and non-goals

### This document does not do

- define nested future org/team/space hierarchy
- declare new canon
- claim the GUI already implements this whole model
- replace existing source-of-truth docs
- prescribe exact backend schema changes beyond naming the desired planning model

### This document does do

- define the first coherent meta-EMA operating space
- choose one project and one primary workline
- make the human/agent usage pattern concrete
- give future sessions a stable place to continue from

---

## Immediate next moves

1. **Create durable planning/gap artifacts for the workline itself.**
   - add a planning node for `meta-ema / control-plane-reconciliation`
   - add initial gap records for the biggest known contradictions

2. **Bind the first space to current runtime surfaces.**
   - decide which existing renderer route becomes the temporary `EMA Control Room` entry surface
   - decide which existing services provide its truthful summary data

3. **Make proposal review the center of motion.**
   - ensure workline outputs become proposals/executions instead of staying as floating docs

4. **Reduce GUI truth drift.**
   - stop presenting low-trust or placeholder surfaces as equal to the real control-plane surfaces for this first space

---

## Canon / Plan / Reality / Gap summary

### Canon
EMA is meant to be a shared human-agent workspace with spaces, intents, proposals, executions, and durable knowledge.

### Plan
The first actual space should be `EMA Control Room`, housing project `meta-ema` with primary workline `control-plane-reconciliation`.

### Reality
The repo already supports enough of this shape in docs, backend domains, and partial UI/CLI surfaces to make it the most coherent first space.

### Gap
EMA still lacks a single implemented operator surface that cleanly unifies canon, planning, reality, and gaps for self-operation. That should be the next convergence target.
