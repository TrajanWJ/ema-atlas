# Blueprint Planner — Deeper Convergence

Status: active architecture synthesis
Date: 2026-04-13

## Executive summary

Blueprint Planner should become EMA's primary **planning control surface** across the following layers:
- intention-building
- gap management
- promotion candidate shaping
- selected reviewed provenance inputs

It should not become a universal control plane for all of EMA.

The right role is:
- Blueprint Planner is where humans and agents shape what should exist next.
- Review is where provenance-derived candidate material crosses a durable decision boundary.
- Canon ratification remains stricter than ordinary planning promotion.
- Operational planning (goals/calendar/buildouts) remains the place where work becomes owned and scheduled.
- Runtime/execution remains the place where work actually runs.

## Why a deeper convergence is needed

Current EMA has three partially-overlapping truths about Blueprint Planner:

1. **Canon spec** frames it as the meta-app with GAC queue, blockers, aspirations log, and intent graph view.
2. **Current backend implementation** already provides a real Blueprint service with routes, CLI, MCP tools, and a GAC state machine.
3. **Broader architecture work** now adds explicit planning, gap, provenance, and promotion layers that Blueprint should help humans navigate.

Without convergence, Blueprint risks becoming either:
- too narrow (just a GAC queue)
- or too broad (a vague all-in-one control room)

## Correct system role

Blueprint Planner should be the main human-facing operator surface for the **planning/gap plane intersection**.

That means it should:
- shape intentions
- surface gaps
- stage promotion candidates
- absorb selected reviewed provenance material for planning use
- connect upward to canon targets and downward to operational planning / runtime work

It should not:
- silently rewrite canon
- replace Review as the provenance decision boundary
- replace Goals/Calendar as the operational planning ledger
- replace Executions/Runtime Fabric as the runtime work ledger

## Blueprint as a five-workspace surface

Blueprint Planner should be understood as containing at least five major workspaces.

## 1. GAC / Question Workspace

Purpose:
- surface gaps, assumptions, clarifications
- help the human answer structured planning questions

Primary objects:
- GAC cards
- deferred blockers
- promoted/answered card history

Good for:
- unresolved design choices
- architecture forks
- canonical ambiguity
- decomposition blockers

### Output modes
- answer -> planning node
- answer -> promotion candidate
- answer -> blocker/defer
- answer -> canon candidate (through later ratification)

## 2. Aspirations / Signals Workspace

Purpose:
- hold and curate future-facing desires, recurring themes, and soft directional statements

Primary objects:
- aspirations
- source signals
- linked candidate intents

Good for:
- extracting long-horizon direction from freeform text
- preserving value signals without prematurely operationalizing them

### Output modes
- aspiration -> candidate intent
- aspiration -> planning node
- aspiration -> archive

## 3. Schematic / Candidate Intent Workspace

Purpose:
- shape the planning graph itself
- create and refine candidate intentions and broader planning nodes

Primary objects:
- candidate intents
- planning nodes
- schematic branches
- hierarchy/decomposition structures

Good for:
- project schematic design
- work decomposition
- thematic clustering
- architecture branch planning

### Output modes
- planning node -> promotion candidate
- candidate intent -> intent (with explicit promotion)
- candidate intent -> gap record when blocked

## 4. Gap / Contradiction Workspace

Purpose:
- surface explicit drift and unresolved contradiction across planes

Primary objects:
- canon-reality gaps
- planning-reality gaps
- canon-planning gaps
- contradiction records
- promotion blockers
- trace gaps

Good for:
- finding where the system is lying to itself
- making missing implementation explicit
- converting confusion into structured backlog and review work

### Output modes
- gap -> planning task
- gap -> GAC question
- gap -> promotion blocker
- gap -> review-needed signal

## 5. Promotion Workspace

Purpose:
- stage what is mature enough to move elsewhere

Primary objects:
- promotion candidates
- reviewed provenance inputs relevant to planning
- pending canon candidates
- planning-to-operational handoff candidates

Good for:
- deciding what should become canon
- deciding what should become a goal/proposal
- deciding what should remain planning

### Output modes
- promotion candidate -> canon ratification path
- promotion candidate -> operational planning handoff
- promotion candidate -> proposal generation
- promotion candidate -> archive/supersede

## Blueprint's cross-plane responsibilities

## Upstream inputs it should consume

### From canon
- canon targets
- relevant specs/decisions
- current ruling docs

### From provenance/review
- only selected **reviewed** Chronicle-derived material
- especially planning-relevant candidates such as:
  - candidate intents
  - goal suggestions
  - follow-up candidates
  - evidence that reveals a gap or contradiction

### From gap layer
- open critical gaps
- contradiction summaries
- blocked promotions

### From reality/implementation
- enough current-state context to avoid planning against fantasy
- active backend truth where relevant

## Downstream targets it should influence

### To canon
Through explicit ratification paths only.
Blueprint can stage and shape canon candidates, but should not directly rewrite canon as casual side effect.

### To operational planning
Blueprint may hand off mature planning artifacts into:
- goals
- calendar/buildouts
- owned work objects

### To runtime/proposals
Blueprint may hand off mature execution-facing planning into:
- proposal generation
- execution planning surfaces

### To gap layer
Blueprint should be a major producer and consumer of gap records.

## Relationship to Review

This is the crucial boundary.

### Review owns
- provenance decision boundary over Chronicle-derived candidates
- approval/reject/defer of imported material
- durable promotion receipts

### Blueprint owns
- planning use of selected reviewed material
- shaping and maturing planning structures
- converting reviewed insights into planning/gap/promotion artifacts

### Rule
Blueprint must not bypass Review for provenance-derived material.
If something comes from Chronicle/imported raw material, it should become planning-relevant through Review, not by direct informal ingestion.

## Relationship to canon ratification

Blueprint can prepare, compare, cluster, and shape canon candidates.
But canon should still require:
- explicit ruling
- explicit promotion step
- preserved provenance where relevant

That means Blueprint is a staging/control surface, not the final canon authority.

## Relationship to Human Ops / operational planning

Blueprint should not become the day planner.

Operational planning owns:
- goals
- calendar entries
- buildouts
- daily/weekly tractability

Blueprint can hand off into that layer when a planning artifact becomes owned work.
But once work is in the operational planning ledger, Blueprint should observe rather than replace it.

## Relationship to runtime/execution

Blueprint should not become the execution ledger or runtime monitor.

It can:
- shape work before proposal generation
- feed executional planning
- surface execution-driven gaps or evidence

It should not:
- replace proposal approval
- replace execution tracking
- replace runtime fabric/session control

## Recommended object mappings

### Existing backend GAC card
Keep as real active backend object.

### Aspirations
Should gain a clearer structured home in the planning graph (`ema-genesis/planning/aspirations/*`) even if some runtime/UI state remains elsewhere.

### Blockers
Should increasingly map to gap records or promotion blockers rather than floating as UI-only deferrals.

### Intent graph view
Should evolve into a broader planning graph view that can distinguish:
- runtime intents
- candidate intents
- canon targets
- gap nodes
- promotion candidates

This is a major upgrade over a plain intent-only graph.

## Recommended renderer/backend convergence direction

### Near-term
Use the current active backend Blueprint domain for:
- GAC queue CRUD/state transitions
- blockers/defer mechanics
- aspiration-related queueing where already supported

Add read-model joins for:
- planning nodes
- gap counts/status
- promotion candidate counts
- reviewed provenance signals relevant to planning

### Mid-term
Expand Blueprint's backing model so it can query across:
- GAC cards
- planning nodes
- gap nodes
- promotion candidates
- reviewed provenance candidates

without pretending all of them are the same table/entity.

## Recommended read models in Blueprint

Blueprint should eventually expose derived tabs/views like:
- `Questions`
- `Aspirations`
- `Planning Graph`
- `Gaps`
- `Promotion Queue`
- `Reviewed Inputs`

Those are read models over multiple planes, not proof of one unified storage schema.

## Decision boundaries Blueprint should surface explicitly

Blueprint should make these transitions legible:
- planning -> canon candidate
- planning -> goal candidate
- planning -> proposal candidate
- reviewed provenance -> planning artifact
- gap -> blocker
- blocker -> resolved planning decision

The UI should help the human understand which boundary is being crossed.

## Anti-patterns

Do not let Blueprint become:
- a hidden canon editor
- an unreviewed import inbox
- a substitute for Goals/Calendar
- a substitute for Review
- a substitute for Execution control

## Strong recommendation

Blueprint Planner should be treated as EMA's **planning cockpit**, not EMA's total control plane.

That gives it a big enough role to matter, but keeps the surrounding architecture honest.
