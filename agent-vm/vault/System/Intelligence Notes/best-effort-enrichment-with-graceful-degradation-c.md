---
title: "Best-Effort Enrichment with Graceful Degradation"
type: reference
created: 2026-03-20
updated: 2026-04-07
confidence: high
source: task-19d2d0c9, production pattern analysis
summary: "Pattern where _chain enrichment fields are added only when matches exist, never throw — making enrich=true always-safe in production"
tags:
  - intelligence
  - best-practice
  - resilience
  - api-design
  - graceful-degradation
---

# Best-Effort Enrichment with Graceful Degradation

## Core Pattern

Best-effort enrichment is a defensive API design pattern where supplementary data fields (like `_chain`) are attached to responses **only when the enrichment source has data**, and **never throw** when enrichment fails. This makes an `enrich=true` query parameter always safe to pass in production — callers get richer data when available, and unchanged responses when not.

The key insight: enrichment is an **additive decoration**, not a required transformation. The base response is always valid on its own.

## How It Works

### The Enrichment Flow

1. **Client requests data** with an optional `?enrich=true` flag
2. **Server fetches the base response** as normal — this always succeeds or fails on its own terms
3. **Server attempts enrichment** by looking up related entities (tasks → pipelines → goals)
4. **If enrichment data exists**: attach it as prefixed fields (e.g., `_chain`, `_context`, `_meta`)
5. **If enrichment data is missing or lookup fails**: return the base response unchanged, no error

### Implementation Shape

```typescript
// The enrichment layer — never throws, always returns
function enrichEvent(event: FeedEvent, indexes: EnrichmentIndexes): FeedEvent {
  const enriched = { ...event };

  // Each enrichment is independently optional
  const task = indexes.taskIndex.get(event.taskId);
  if (task) {
    enriched._chain = { task: task.name };

    const pipeline = indexes.pipelineIndex.get(task.pipelineId);
    if (pipeline) {
      enriched._chain.pipeline = pipeline.name;

      const goal = indexes.goalIndex.get(pipeline.goalId);
      if (goal) {
        enriched._chain.goal = goal.name;
      }
    }
  }

  return enriched;  // Always returns — worst case, identical to input
}
```

### The `_chain` Convention

In the Agent-OS feed system, the `_chain` field carries the **delegation context** — the path from a goal through a pipeline to a task. This gives feed consumers full context about *why* an event happened:

```json
{
  "id": "evt-001",
  "type": "task.completed",
  "taskId": "task-abc",
  "_chain": {
    "task": "Backfill vault frontmatter",
    "pipeline": "Vault Maintenance",
    "goal": "Knowledge System Quality"
  }
}
```

When a task has no pipeline or goal association, `_chain` is simply absent — not null, not `{}`, just absent. Consumers check for its presence rather than relying on it.

## Why This Pattern Matters

### Production Safety

The alternative — required enrichment — creates a **coupling trap**. If the goal service is down, every feed request fails even though the base data is fine. Best-effort enrichment means your SLA is determined by your core data, not your most fragile dependency.

### Progressive Enhancement for APIs

This is the backend equivalent of CSS progressive enhancement: baseline functionality works everywhere, enhanced experience appears when capabilities are available. Consumers designed for enriched data get it; consumers that ignore `_chain` are unaffected.

### Always-On Flag Safety

Because `enrich=true` never causes errors, it can be:
- Hardcoded in client configs without conditional logic
- Left on in all environments (dev, staging, prod)
- Enabled by default without feature-flag complexity
- Used by monitoring/debugging tools that want maximum context

## Design Rules

1. **Prefix enrichment fields** with `_` to signal they're supplementary (e.g., `_chain`, `_context`)
2. **Never throw from enrichment code** — wrap in try/catch at the enrichment boundary
3. **Build indexes upfront** — use `buildTaskIndex`, `buildPipelineIndex`, `buildGoalIndex` to batch-load related data rather than N+1 querying per event
4. **Make each enrichment level independent** — if pipeline lookup fails, task-level enrichment still attaches
5. **Consumers treat enrichment as optional** — render enriched view when present, plain view when absent

## Related Patterns

- [[context-enrichment-layer-buildtaskindexbuildpipeli]] — The index-building approach that powers this enrichment (buildTaskIndex/buildPipelineIndex/buildGoalIndex compose the `_chain`)
- [[bridge-or-mock-fallback-pattern-component-tries-ap]] — Similar graceful-degradation philosophy applied at the component level: try API first, fall back to mock data
- [[graceful-missing-directory-handling-handoff-histor]] — Same principle applied to filesystem operations: skip silently if directory doesn't exist rather than throwing 500s

## Anti-Patterns to Avoid

- **Required enrichment**: Making enrichment failures cascade to the base response
- **Null-filled enrichment**: Returning `_chain: { task: null, pipeline: null, goal: null }` — this pushes null-checking to every consumer. Prefer absence over null.
- **Enrichment in the hot path**: Enrichment lookups should be batch-indexed, not per-item queries that add latency to every request
- **Silent data staleness**: If enrichment indexes are cached, document the staleness window so consumers know what they're getting

## Origin

Originally extracted from Agent-OS-Frontend feed implementation (task-19d2d0c9), where `?enrich=true` on `/api/feed` attaches delegation chain breadcrumbs (goal → pipeline → task) to each feed event. The pattern proved valuable enough to formalize as a general best practice for any API endpoint that can optionally return richer context.

---
Category: best-practice | Impact: 3/5 | Project: Agent-OS-Frontend
