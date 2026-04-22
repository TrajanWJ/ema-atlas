---
name: routing-stack-architecture
domain:
  - core
  - communication
priority: 6
estimated_tokens: 350
dependencies:
  - routing-coordination
description: Full 3-iteration agent routing stack architecture reference
type: agent-learning
status: active
confidence: 0.9
confidence_updated: 2026-03-18T00:00:00.000Z
source: pipeline-research
updated: '2026-03-18'
created: '2026-03-18'
title: routing-stack-architecture
summary: >-
  Complete routing pipeline: guardrails → decomposition → cascading router →
  circuit breaker → consensus → agent invocation
wiki_id: agents/Modules/routing-stack-architecture
imported_from: vault/Agents/Modules/routing-stack-architecture.md
imported_at: '2026-04-04T00:23:56.664Z'
tags: []
---
## Complete Routing Stack Architecture

Built across three research iterations (proposals 074801, 134801, 194801).

### Full Pipeline

```
Incoming query
  │
  ▼
[1] PRE-ROUTING GUARDRAILS  (guardrails.md)
  ├── Scope check (<5ms)
  ├── Prompt injection detection (<20ms)
  ├── PII scrubbing — logs only (<10ms)
  ├── Content policy (<50ms)
  └── Rate limit by intent (<1ms)
  BLOCK → return error (never reaches agents)
  TRANSFORM → sanitized query continues
  │
  ▼
[2] COMPOUND QUERY CLASSIFIER
  ├── Single-domain? → skip decomposition (zero overhead)
  └── Multi-domain? → decompose into ≤4 sub-tasks
        → Route each sub-task independently (steps 3-7)
        → Parallel execution where no dependencies
        → Synthesis step at end
  │
  ▼
[3] CASCADING HYBRID ROUTER
  Layer 1: Rule-based (regex, explicit commands, metadata flags)  ~0ms
  Layer 2: Embedding-based semantic match (cosine similarity)    ~10-50ms
  Layer 3: LLM-as-router (Haiku, structured output)             ~500ms
  │
  ▼
[4] CIRCUIT BREAKER FILTER  (circuit-breaker.md)
  → Filter out OPEN agents before semantic ranking
  → HALF_OPEN agents get probe request
  → No healthy agents → fallback agent + alert
  │
  ▼
[5] HIGH-STAKES CONSENSUS CHECK  (high-stakes-routing.md)
  → Only for: finance, ops, security agents OR irreversible/external/financial tasks
  → Primary + secondary router (different methods) must agree
  → Joint confidence threshold: 0.60
  → Disagreement → escalate to user
  │
  ▼
[6] AGENT SELF-ASSESSMENT (agent-side)
  → Selected agent can reject task and suggest alternative
  │
  ▼
[7] CONTEXT COMPRESSION
  → Compress conversation history to agent-relevant content
  → Relevance filtering: score messages by agent's interest domains
  → Default budget: 2000 tokens of history per agent
  → Always preserve: most recent N turns, resolved entities, routing trace
  │
  ▼
[8] AGENT INVOCATION
  │
  ▼
[9] ROUTING EVENT LOG (observability)
  → RoutingEvent with: selected_agent, confidence, method, circuit_state,
     consensus_result, context_tokens_before/after, guardrails_triggered
```

### Iteration Summary

**Iteration 1 (074801):**
- Dynamic agent registry (agents self-describe via embeddings)
- Embedding-based semantic routing with centroids
- Agent self-assessment (rejection + suggestion)
- Context-preserving handoff (`HandoffContext`)

**Iteration 2 (134801):**
- Cascading hybrid router (rule → embedding → LLM)
- Active learning from production routing decisions
- Routing observability pipeline (`RoutingEvent` telemetry)
- KBA probing (agents probe knowledge base for relevance)
- Semantic cache (near-duplicate queries skip pipeline)

**Iteration 3 (194801 — this iteration):**
- Pre-routing guardrails (scope, injection, PII, content, rate limit)
- Query decomposition router (compound queries → parallel sub-tasks)
- Circuit breaker + latency-weighted routing
- Routing-aware prompt compression
- Intent confidence consensus for high-stakes routing

### Key Config Files

| File | Purpose |
|---|---|
| `~/shared-agent-config/routing-rules.md` | Rule-based routing table + full stack order |
| `~/shared-agent-config/guardrails.md` | Guardrail chain configuration |
| `~/shared-agent-config/circuit-breaker.md` | Circuit breaker thresholds and fallback logic |
| `~/shared-agent-config/high-stakes-routing.md` | Consensus routing for consequential tasks |

## Related

- [[routing-coordination]]
- [[task-decomposition]]
- [[safety-boundaries]]
