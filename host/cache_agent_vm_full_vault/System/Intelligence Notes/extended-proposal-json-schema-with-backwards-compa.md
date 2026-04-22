---
title: Extended Proposal JSON Schema with Backwards-Compatible Fields
type: reference
status: active
created: 2026-03-20
updated: 2026-04-06
tags: [dispatch, proposal-engine, schema, design-pattern, auto-delegator]
summary: Proposal Engine v2 schema extension adding `scope`, structured `source`, `tasks[]`, `success_criteria[]`, and `impact` while preserving compatibility with v1 proposal consumers.
confidence: 0.95
source: dispatch/specs/proposal-engine-v2-spec.md + intelligence extraction + dispatch cross-reference
project: Auto Delegator Layer
related:
  - [[Proposal Lifecycle State Machine]]
  - [[Proposal Scope Estimation]]
  - [[Gap Registry Persistent State]]
  - [[Autonomy Rules Table — Structured Classification of What Auto-Approves vs Requires Human Review]]
---

# Extended Proposal JSON Schema with Backwards-Compatible Fields

> This pattern matters because proposal quality is limited by proposal structure. If proposals are vague blobs, dispatch and autonomy layers stay shallow. If proposals carry typed intent, scope, task breakdown, and success criteria, the rest of the system can become much smarter without becoming more magical.

## Executive Summary

Proposal Engine v2 extends the original proposal JSON schema with five high-value fields:

- `scope`
- `source` (upgraded to a structured object)
- `tasks[]`
- `success_criteria[]`
- `impact`

The crucial design choice is that these additions are **backwards-compatible**:
- v1 consumers can still read the proposal using the original core fields
- v2-aware consumers get richer planning, autonomy, scoring, and execution semantics
- old proposal files remain valid and interpretable

This is a classic **additive schema evolution** pattern: add optional structure first, then gradually upgrade producers and consumers to make use of it.

---

## Why This Schema Exists

The original v1 proposal shape was enough for simple one-off suggestions, but weak for coordinated work.

### v1 could express:
- a title
- a body
- a type
- a priority
- a status

### v1 could not express clearly:
- whether the work was small or large
- whether it was sequential or parallelizable
- which engine produced it and why
- how to split work across agents
- what “done” actually meant
- why it mattered in a structured way
- whether autonomy should be allowed or constrained

That made downstream systems rely too much on inference and prompt interpretation.

The v2 schema is about moving those assumptions into explicit fields.

---

## Schema: Before and After

### v1 Schema (minimal)

```json
{
  "id": "prop-{timestamp}-{random}",
  "type": "dispatch | research | build | idea | pipeline",
  "title": "Short imperative statement",
  "body": "Context and rationale",
  "options": [],
  "source": "agent-output | vault-integration | codebase-analysis",
  "priority": "P0 | P1 | P2 | P3 | P4",
  "status": "pending | approved | dismissed | expired",
  "created_at": "ISO8601",
  "discord_message_id": null
}
```

### v2 Schema (extended)

```json
{
  "id": "prop-{timestamp}-{random}",
  "type": "dispatch | research | build | idea | pipeline",
  "title": "Short imperative statement (≤80 chars)",
  "body": "Context and rationale",

  "scope": {
    "task_count": 5,
    "estimated_sessions": 2,
    "parallelizable": true
  },

  "source": {
    "engine": "audit-gap | goal-alignment | pattern-recognition | codebase-analysis | self-improvement | vault-integration",
    "context": "Specific file/gap/pattern that triggered this",
    "evidence": "Quote or metric from source that justifies generation"
  },

  "tasks": [
    {
      "id": 1,
      "title": "Task title",
      "agent": "suggested-agent",
      "depends_on": [],
      "destructive": false
    }
  ],

  "success_criteria": [
    "Concrete, verifiable outcome 1",
    "Concrete, verifiable outcome 2"
  ],

  "impact": {
    "category": "capability | reliability | velocity | knowledge | security",
    "description": "One sentence on why this matters",
    "effort_vs_value": "high | medium | low"
  },

  "autonomy": "auto | review_required",
  "autonomy_reason": "Classification rationale",
  "priority": "P0 | P1 | P2 | P3 | P4",
  "status": "pending | approved | dismissed | expired",
  "created_at": "ISO8601",
  "discord_message_id": null
}
```

---

## The Five New Fields

## 1. `scope`

`scope` replaces the silent assumption that every proposal is just one task.

```json
"scope": {
  "task_count": 5,
  "estimated_sessions": 2,
  "parallelizable": true
}
```

### Why it matters
It allows the proposal system to communicate whether this is:
- a tiny one-shot task
- a medium package
- or a multi-session work bundle that needs coordination

### Practical uses
- queue management
- proposal size caps
- UI grouping (“small / medium / large”)
- autonomy throttling
- deciding whether to split work across agents

### Field meanings
- `task_count` — how many discrete tasks the proposal contains
- `estimated_sessions` — rough estimate of session cost/effort
- `parallelizable` — whether tasks can run concurrently or must stay ordered

---

## 2. `source` as a structured object

The old flat `source` string was too lossy. The new object preserves provenance.

```json
"source": {
  "engine": "audit-gap",
  "context": "pipeline-agent_architecture-20260320-assessment.md",
  "evidence": "4 Bridge API endpoints documented but not implemented"
}
```

### Why it matters
This enables:
- deduplication across source engines
- better trust and auditability
- UI explanation (“why was this proposed?”)
- better downstream analytics on which engines generate useful work

### Source engines documented in the pattern
- `audit-gap`
- `goal-alignment`
- `pattern-recognition`
- `codebase-analysis`
- `self-improvement`
- `vault-integration`

### Important architectural point
This turns source attribution into structured provenance rather than vibes.

---

## 3. `tasks[]`

This is the most consequential addition.

```json
"tasks": [
  {
    "id": 1,
    "title": "Read Agent-OS-Bridge-API.md, extract endpoint list",
    "agent": "architect",
    "depends_on": [],
    "destructive": false
  },
  {
    "id": 2,
    "title": "Implement /api/agents endpoint",
    "agent": "coder",
    "depends_on": [1],
    "destructive": false
  }
]
```

### Why it matters
Instead of saying “someone should improve X,” the proposal can now encode:
- task decomposition
- suggested routing
- sequencing
- destructive-risk flags

### What this unlocks
- multi-agent coordination
- dependency-aware dispatch
- autonomy gating per subtask
- better execution previews before approval

### Important field semantics
- `agent` — suggested executor, not necessarily hard binding
- `depends_on` — local dependency graph for execution ordering
- `destructive` — safety/autonomy hint; if any task is destructive, review becomes much more likely

This field is the bridge between proposal generation and actual dispatchability.

---

## 4. `success_criteria[]`

```json
"success_criteria": [
  "Bridge API /api/agents returns 200 with agent list",
  "curl localhost:PORT/api/agents | jq '.agents | length > 0' exits 0",
  "vault/Architecture/Agent-OS-Bridge-API.md updated with implementation status"
]
```

### Why it matters
This field prevents proposals from degrading into “busywork with a nice description.”

A proposal should not only explain the problem. It should also define:
- what success looks like
- how success can be checked
- what counts as complete

### Good criteria are
- binary
- inspectable
- reproducible
- tied to artifacts, endpoints, commands, or observed behavior

### Why this matters downstream
- eval specialists can verify outcomes
- proposal completion is less subjective
- feedback loops can learn from success/failure more cleanly

---

## 5. `impact`

```json
"impact": {
  "category": "capability",
  "description": "Closes architectural gap between spec and implementation",
  "effort_vs_value": "high"
}
```

### Why it matters
A structured impact field helps separate:
- “this is nice”
from
- “this is strategically meaningful”

### Categories used here
- `capability`
- `reliability`
- `velocity`
- `knowledge`
- `security`

### What it enables
- proposal scoring
- portfolio balancing
- better operator filtering/views
- more consistent explanation of why a proposal exists

It also makes proposal feeds more intelligible: the operator can quickly understand the kind of value being created.

---

## Backwards Compatibility Design

The pattern works because compatibility was designed in from the start.

### Compatibility rules
1. All new fields are optional.
2. Old consumers can still read the original core fields.
3. Missing `tasks[]` implies a single-task proposal.
4. Missing `scope` implies default small/single proposal semantics.
5. Missing structured `source` can fall back to the old source string interpretation.
6. Missing `success_criteria[]` means the proposal is less evaluable, but still readable.
7. Missing `impact` means the UI/scoring layer has less structured information, but the proposal still exists.

### Why this pattern is strong
It avoids:
- hard schema version breakage
- mass migration pressure
- old proposal files becoming unreadable
- every consumer needing immediate upgrade

This is exactly how a live proposal ecosystem should evolve.

---

## Consumer Behavior: How Different Layers Should Interpret the Schema

A schema is only useful if consumers know what to do with it.

## Minimal consumer (v1-compatible)
Reads:
- `id`
- `title`
- `body`
- `priority`
- `status`

Behavior:
- display the proposal
- allow manual review
- ignore advanced structure

## UI consumer
Reads:
- `scope`
- `impact`
- `source.engine`
- `tasks[]`
- `success_criteria[]`

Behavior:
- show proposal size, impact type, originating engine
- render task breakdown
- show rationale and completion checks
- support richer filtering and sorting

## Dispatch consumer
Reads:
- `tasks[]`
- `scope.parallelizable`
- `autonomy`
- `autonomy_reason`
- `source`

Behavior:
- decide whether to dispatch atomically or expand into queued tasks
- enforce dependency ordering
- route by agent suggestion
- escalate destructive work

## Evaluation / feedback consumer
Reads:
- `success_criteria[]`
- `impact`
- final task outcomes
- source provenance

Behavior:
- verify completion
- learn which proposal engines generate valuable work
- improve scoring and proposal quality over time

---

## Why This Pattern Matters Operationally

The v1 schema produced proposals like:
- “Enrich vault note”
- “Disk cleanup”
- “Improve dispatch system”

Those are understandable to a human, but weak for autonomous systems.

The v2 extension enables the proposal engine to express:
- **multi-agent coordination** via `tasks[].agent`
- **dependency ordering** via `tasks[].depends_on`
- **safety classification** via per-task destructiveness and autonomy fields
- **verifiable completion** via `success_criteria[]`
- **source traceability** via `source.engine`, `context`, and `evidence`
- **portfolio-level prioritization** via `impact`

This is the difference between:
- a suggestion feed
and
- a structured work-generation system

---

## Design Lessons Embedded in the Schema

### 1. Additive evolution beats breaking evolution
Optional fields let the ecosystem upgrade gradually.

### 2. Typed structure beats inference
Anything repeatedly inferred from prose should become a field.

### 3. Provenance matters
If proposals are generated automatically, the system must preserve where they came from.

### 4. “Done” must be explicit
Otherwise feedback loops become noisy and fake-success accumulates.

### 5. Safety needs data, not vibes
Autonomy classification works better when proposals carry risk-relevant structure.

---

## Risks / Failure Modes

### 1. Optional fields get ignored forever
If no consumer uses them, the schema becomes aspirational instead of operational.

### 2. Producers emit low-quality structure
Bad task decompositions or fluffy success criteria create a false sense of precision.

### 3. Over-structuring too early
If proposal generation becomes too rigid, the system may stop surfacing useful fuzzy ideas.

### 4. Compatibility drift
If the structured `source` object and legacy `source` string semantics diverge too far, downstream fallbacks get messy.

### 5. Schema bloat
Adding fields is easy; maintaining conceptual clarity is harder.

---

## Recommended Next Improvements

If this schema evolves further, the highest-value additions would probably be:

### `approval_status` or explicit review metadata
To distinguish proposal lifecycle state from autonomy/review requirement more cleanly.

### `owner` / `suggested_owner`
Useful when proposals target a specific human or agent domain.

### `blocked_by` / `prerequisites`
For higher-level dependencies beyond local `tasks[].depends_on`.

### `artifacts[]`
To declare expected deliverables explicitly.

### `confidence`
To distinguish high-certainty proposals from more exploratory ones.

The key is to add only fields that support real downstream behavior.

---

## Bottom Line

The extended proposal JSON schema is valuable because it upgrades proposals from:
- loosely structured suggestions
into
- typed, traceable, dispatchable work objects

And it does so without breaking old consumers.

That is the important part.

The pattern is not “more JSON for the sake of JSON.” It is a way to make proposal generation, review, dispatch, and evaluation all operate on the same richer object without forcing a risky hard migration.

That makes it one of the more important design-pattern upgrades in the proposal/dispatch layer.

---

## Related Notes

- [[Proposal Lifecycle State Machine]]
- [[Proposal Scope Estimation]]
- [[Feedback Loop Pattern]]
- [[Active Large Proposal Cap]]
- [[Gap Registry Persistent State]]
- [[Autonomy Rules Table — Structured Classification of What Auto-Approves vs Requires Human Review]]

#dispatch #proposal-engine #schema #design-pattern #auto-delegator #backwards-compatible
