---
title: "Config: Add model_hint + complexity Fields to Dispatch Task JSON"
type: config-change
created: 2026-03-27
updated: 2026-04-14
confidence: 0.75
confidence_updated: 2026-04-14
source: best-practices-enrichment-001.txt
summary: "Add model_hint and complexity fields to dispatch task JSON schema to enable token-aware model routing — 9.7× thinking token variance makes flat cost estimates unreliable."
tags:
  - intelligence
  - config-change
  - dispatch
  - model-routing
  - token-optimization
impact: 4
project: Auto Delegator Layer
status: proposed
---

# Config Change: Add model_hint + complexity Fields to Dispatch Task JSON

## Problem Statement

The dispatch engine currently routes all tasks to a default model without per-task granularity. This creates a significant cost problem: Claude Opus 4.6's adaptive thinking mode burns approximately 5× the tokens compared to standard mode, and thinking token consumption varies by up to 9.7× across task types. A simple vault backfill task and a complex architectural planning task both consume the same model tier, despite radically different requirements.

Without `model_hint` and `complexity` metadata on each task, the dispatch engine cannot make informed routing decisions. Cost estimates become unreliable because the same "P3 task" might cost $0.02 (simple file edit on Haiku) or $0.80 (deep research on Opus with extended thinking).

## Proposed Schema Changes

Edit the dispatch task JSON schema (used by `dispatch.sh` and all task-creation scripts) to add two optional fields:

```json
{
  "id": "example-task-001",
  "description": "...",
  "agent": "researcher",
  "priority": 3,
  "model_hint": "sonnet",
  "complexity": "medium",
  "...": "..."
}
```

### `model_hint` Field

- **Type:** `string | null` (optional)
- **Values:** `"haiku"`, `"sonnet"`, `"opus"`, or `null` (engine decides)
- **Purpose:** Allows task creators to suggest a model tier. The dispatch engine reads this at pickup time to select the appropriate model.
- **Override behavior:** The engine may override the hint if the selected model is unavailable or if budget constraints require downgrading.

### `complexity` Field

- **Type:** `string` (optional, defaults to `"medium"`)
- **Values:** `"low"`, `"medium"`, `"high"`
- **Purpose:** Provides a coarse signal for expected token consumption and task difficulty. Combined with `model_hint`, this enables the engine to:
  - Route low-complexity tasks (file renames, simple edits) to Haiku
  - Route medium-complexity tasks (code generation, moderate research) to Sonnet
  - Reserve Opus for high-complexity tasks (architectural planning, deep research, multi-step reasoning)

## Routing Decision Matrix

| Complexity | Default Model | Extended Thinking | Estimated Cost Range |
|-----------|---------------|-------------------|---------------------|
| low       | Haiku 4.5     | off               | $0.01–$0.05        |
| medium    | Sonnet 4.6    | off               | $0.05–$0.30        |
| high      | Opus 4.6      | adaptive          | $0.20–$1.50        |

The `model_hint` field overrides the complexity-based default when explicitly set. This allows a task creator to force Opus for a nominally "low" complexity task if they know it requires deeper reasoning.

## Implementation Steps

1. **Schema update:** Add `model_hint` and `complexity` to the task JSON schema with validation in `dispatch.sh`.
2. **Engine routing logic:** At task pickup, read `model_hint` and `complexity`. If `model_hint` is set, use it directly. Otherwise, map `complexity` to the default model per the routing matrix above.
3. **Task creation scripts:** Update all task-creation pathways (cron jobs, manual dispatch, auto-delegator) to optionally accept these fields. Default `complexity` to `"medium"` when omitted for backward compatibility.
4. **Cost tracking:** Log the actual model used alongside the hint/complexity for each task, enabling retrospective analysis of routing accuracy.
5. **Budget guardrails:** Integrate with [[priority-tiered-auto-dispatch-routing-p3p4-non-des|priority-tiered dispatch routing]] — P3/P4 tasks should default to lower model tiers unless explicitly overridden.

## Relationship to Existing Intelligence

This config change directly addresses findings from multiple intelligence notes:

- [[claude-opus-46-adaptive-thinking-burns-5x-tokens-v|Opus 4.6 adaptive thinking burns ~5× tokens]] — the 5× multiplier means routing all tasks to Opus is wasteful for simple operations.
- [[add-complexity-gate-decision-rule-for-claude-code-|Complexity gate decision rule]] — defines thresholds for when to spawn vs. handle inline; `complexity` field extends this concept to model selection.
- [[56-of-claude-code-token-spend-is-conversational-ba|56% of token spend is conversational]] — even with model routing, conversational verbosity remains the dominant cost driver. Model routing addresses the other 44%.
- [[priority-tiered-auto-dispatch-routing-p3p4-non-des|Priority-tiered dispatch routing]] — the priority system determines *whether* a task auto-dispatches; `model_hint`/`complexity` determines *how* it executes.

## Risk Assessment

- **Low risk:** These are additive, optional fields. Existing tasks without these fields continue to work unchanged (defaulting to current behavior).
- **Migration:** No migration needed — new fields are optional. Existing JSON files remain valid.
- **Accuracy concern:** The 9.7× variance figure comes from observed thinking token consumption across task types. Actual savings depend on how accurately task creators estimate complexity. Consider adding a feedback loop that compares predicted vs. actual token usage to calibrate future routing.

## Status

Auto-flagged for application. Verify before applying to production configs. The dispatch engine (`dispatch.sh`) and any task-creation scripts need updating.

---
Tags: #intelligence #config-change #dispatch #model-routing #token-optimization
