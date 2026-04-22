# Blueprint + Review + Decision Convergence

Status: active architecture synthesis
Date: 2026-04-13

## Executive summary

EMA should converge **Blueprint Planner**, **Review**, and **Decision Log** into one coherent decision architecture.

The current problem is fragmentation:
- Blueprint shapes planning and asks GAC questions
- Review governs provenance-derived candidate material
- canon owns durable architectural decisions
- the renderer has a draft-linked `decision-log` surface
- legacy docs describe a separate decisions backend/schema/API

The correct future is **not** to resurrect a standalone decisions CRUD silo.
The correct future is to make decisions a first-class cross-plane object family with:
- Blueprint as a major decision-shaping surface
- Review as a provenance decision boundary
- Decision Log as a read/write surface over decision objects and precedent
- canon decisions as the strongest ratified subset

## Current reality

### Blueprint
Live backend domain today:
- `services/core/blueprint/*`
- CLI support
- GAC queue/state machine

### Review
Live backend domain today:
- `services/core/chronicle/*`
- `services/core/review/*`
- Chronicle extractions
- review items
- promotion receipts

### Decision Log
Current state:
- renderer surface exists
- currently `draft-linked`
- no active decision backend owner in current TS backend

### Canon decisions
Live semantic home:
- `ema-genesis/canon/decisions/*`

### Legacy decision model
Old docs/schema show decisions with fields like:
- title
- context
- options
- chosen option
- reasoning
- outcome
- outcome_score
- tags
- reviewed_at

This is still useful, but should be reinterpreted inside the current multi-plane architecture.

## The core insight

A **decision** is not one single storage object.

EMA should distinguish at least four layers:

### 1. Decision candidate
A candidate decision under formation or review.

May originate from:
- GAC answer
- Blueprint planning synthesis
- Chronicle-derived reviewed material
- explicit operator capture

Likely plane:
- planning or provenance

### 2. Decision record
A durable operational/provenance-backed record that a real decision was made.

Likely plane:
- provenance / operational / runtime

### 3. Canon decision
A ratified architectural or policy decision.

Plane:
- canon

### 4. Decision outcome / precedent
A later layer linking decisions to consequences and surfacing similar cases.

Plane:
- provenance / gap / derived graph/read-model layer

## Proposed convergence model

## Blueprint owns decision shaping
Blueprint should be where humans and agents:
- examine open design questions
- compare alternatives
- refine candidate decisions
- stage canon decision candidates
- stage operational/runtime handoff decisions

Blueprint is the place where a decision is often *formed*.

## Review owns provenance decision boundary
If candidate decisions are derived from imported material / Chronicle provenance, they should pass through Review.

Review should be able to:
- approve a decision candidate
- reject it
- defer it
- promote it into a downstream decision record or target

Review is the place where a provenance-derived decision becomes trustworthy enough to matter downstream.

## Decision Log owns decision visibility and precedent
Decision Log should become the cross-plane surface for:
- listing decision candidates, decisions, and outcomes
- browsing rationale and alternatives
- viewing links to canon/proposals/goals/executions/gaps
- surfacing precedent when a similar new decision arises

Decision Log should be a **read/write surface over decision architecture**, not a detached CRUD app.

## Canon owns the narrowest strongest subset
Canon decisions remain:
- the most authoritative
- the most stable
- the most ratified

Not all decisions belong here.
Only the subset that defines EMA architecture/policy should be promoted into canon.

## Recommended decision pathways

### Path A: Blueprint-native planning decision
`Blueprint question / planning synthesis -> decision candidate -> promotion candidate -> canon decision OR operational handoff OR proposal generation`

### Path B: Provenance-derived decision
`Chronicle import -> extraction -> review item -> promotion receipt -> decision candidate / decision record -> downstream target`

### Path C: Operational decision
`Human Ops / review / planning handoff -> operational decision record -> goal/calendar/buildout/runtime demand`

### Path D: Runtime decision
`proposal/execution/harness context -> runtime decision record -> runtime-fabric control action -> execution evidence / outcome link`

## Decision Log app role after convergence

The `decision-log` app should stop being treated as:
- a dead or resurrected CRUD shell
- a fake standalone domain

It should become the UI/read-model over:
- canon decisions
- reviewed decision records
- Blueprint decision candidates
- decision outcome links
- precedent search / similar decisions
- links to goals, proposals, executions, gaps, and canon

### Suggested tabs or views
- `Candidates`
- `Canon`
- `Operational`
- `Runtime`
- `Outcomes`
- `Precedents`

## Backend ownership recommendation

Do **not** create a disconnected `services/core/decisions/*` domain immediately unless the boundaries are clear.

Instead, near-term ownership should be:
- Blueprint owns planning-side decision shaping inputs
- Review owns provenance-backed decision approval state
- canon files own ratified canon decisions
- operational/runtime layers own bounded decision records where needed
- Decision Log app reads across these layers

A dedicated decisions domain may emerge later as a unifying query/write facade, but should not be created as a premature silo.

## Precedent surfacing

This is one of the highest-value capabilities and should be designed into the convergence now.

When a new decision candidate appears in Blueprint or Review, EMA should eventually be able to surface:
- similar past canon decisions
- similar reviewed decision records
- similar outcomes or regrets
- related gaps or contradictions

This makes decisions part of EMA's working intelligence, not just its archive.

## Outcome linking

Decision architecture should support explicit links from decisions to:
- proposals created because of the decision
- executions launched because of the decision
- goals/calendar/buildouts changed because of the decision
- gaps created or resolved by the decision
- later outcomes showing whether the decision aged well

## Strong recommendation

Decision Log should be reconceived as the **decision memory and precedent surface** over Blueprint + Review + canon + operational/runtime decision records.

That is much stronger than bringing back a standalone `/decisions` CRUD domain and calling it done.

## Immediate next work implied

1. Add `decision_candidate` to the conceptual target set for Blueprint and Review integration.
2. Define read models for Decision Log over multiple planes.
3. Add decision-to-outcome and decision-to-gap link conventions.
4. Keep canon decision promotion stricter than ordinary decision recording.
5. Avoid reviving a standalone decisions backend until the converged architecture is clearer.
