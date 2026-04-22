---
title: "Superman Context Format Specification"
created: 2026-04-03
updated: 2026-04-03
type: spec
status: active
confidence: 0.90
tags: [superman, context, injection, ema, spec, week-7]
summary: "Definitive spec for Superman context format: schema, builder, injection points, token budget, size limits. Built by Superman.Context module. Injected pre-dispatch and on API request."
author: Security Agent (intelligence-integrations task)
---

# Superman Context Format Specification

> **Status:** Design-complete. Ready for implementation.
> **Target:** EMA Week 7 — unlocks `/api/projects/:id/context` + agent prompt enrichment.

---

## 1. What Is Superman Context?

Superman context is a **structured, token-budgeted block of project-relevant information** injected into agent prompts before dispatch and served to HQ dashboard via REST API. It answers the question *"What does this agent need to know right now?"* before any tool call is made.

It is **not** a full knowledge dump. It is a curated, ranked, trimmed selection of the most relevant information from:
- The `.superman` file (declared project identity, intents, constraints)
- The Superman vector index (semantically related vault notes, tasks, proposals, executions)
- Live project state (active tasks, recent executions, campaigns)

---

## 2. Context Schema (Canonical JSON)

```json
{
  "meta": {
    "project_id": "proj_abc123",
    "project_name": "StudioKamel",
    "generated_at": "2026-04-03T22:00:00Z",
    "token_count": 1847,
    "token_budget": 2000,
    "builder": "Superman.Context",
    "version": "1.0"
  },

  "identity": {
    "description": "StudioKamel client management SaaS — Ruby on Rails + Hotwire, deployed on Render",
    "source": "superman_file",
    "confidence": 1.0
  },

  "intents": [
    {
      "value": "Migrate from Devise to custom JWT auth system",
      "weight": 0.9,
      "source": "superman_file",
      "status": "active"
    },
    {
      "value": "Add multi-tenant workspace support",
      "weight": 0.5,
      "source": "superman_file",
      "status": "active"
    }
  ],

  "constraints": [
    {
      "value": "Never modify billing module without explicit approval",
      "weight": 1.0,
      "source": "superman_file",
      "enforced": true
    },
    {
      "value": "All API endpoints must have request validation",
      "weight": 1.0,
      "source": "superman_file",
      "enforced": true
    }
  ],

  "relationships": [
    {
      "type": "depends_on",
      "target": "EMA",
      "description": "EMA for task management"
    },
    {
      "type": "deployed_on",
      "target": "Render",
      "description": "render.yaml in repo root"
    }
  ],

  "vault_notes": [
    {
      "entity_id": "vault/Projects/studiokamel-auth-notes.md",
      "title": "StudioKamel Auth System Notes",
      "excerpt": "Devise is causing issues with API token generation. JWT approach would clean up the dual-auth mess...",
      "similarity": 0.87,
      "last_modified": "2026-04-01T15:30:00Z"
    }
  ],

  "tasks": [
    {
      "id": "task_111",
      "title": "Replace Devise with JWT auth",
      "status": "in_progress",
      "project_id": "proj_abc123",
      "agent": "coder"
    },
    {
      "id": "task_112",
      "title": "Fix N+1 in dashboard endpoint",
      "status": "pending",
      "project_id": "proj_abc123",
      "agent": null
    }
  ],

  "proposals": [
    {
      "id": "prop_88",
      "title": "Auth system overhaul",
      "status": "approved",
      "created_at": "2026-04-02T10:00:00Z"
    }
  ],

  "executions": [
    {
      "id": "exec_55",
      "summary": "JWT auth PoC — partial success, refresh token flow incomplete",
      "status": "completed",
      "outcome": "partial",
      "timestamp": "2026-04-03T18:00:00Z"
    }
  ],

  "intent_clusters": [
    {
      "id": "cluster_auth_8f2",
      "theme": "JWT auth migration",
      "readiness": 82,
      "item_count": 5,
      "status": "proposed"
    }
  ]
}
```

---

## 3. Fields Reference

| Field | Source | Always Present | Trimmable | Priority |
|---|---|---|---|---|
| `meta` | Generated at build time | ✅ | ❌ | — |
| `identity` | `.superman` IDENTITY | ✅ | ❌ | Critical |
| `intents` | `.superman` INTENT | ✅ (empty array if none) | ❌ | Critical |
| `constraints` | `.superman` CONSTRAINT | ✅ (empty array if none) | ❌ | Critical |
| `relationships` | `.superman` RELATIONSHIP | ✅ (empty array if none) | ✅ (content trim) | Low |
| `vault_notes` | Vector search (similarity) | ❌ | ✅ (reduce count, trim excerpts) | Medium |
| `tasks` | DB query + semantic sort | ✅ (empty array if none) | ✅ (reduce count) | Medium |
| `proposals` | DB query | ❌ | ✅ | Low |
| `executions` | DB query (last N) | ❌ | ✅ (first trimmed) | Medium |
| `intent_clusters` | Superman.IntentCluster | ❌ | ✅ | Low |

**Never trim:** `identity`, `intents`, `constraints`. These are small (~200-300 tokens) and structurally critical. An agent that ignores a constraint because it was trimmed is worse than an agent with fewer vault notes.

---

## 4. Prompt Block Format (Text Injection)

When injecting into agent prompts, the JSON is serialized as a compact text block:

```
=== SUPERMAN CONTEXT (2026-04-03) ===

PROJECT: StudioKamel client management SaaS — Ruby on Rails + Hotwire, deployed on Render

ACTIVE INTENTS:
  • Migrate from Devise to custom JWT auth system [weight: 0.9]
  • Add multi-tenant workspace support [weight: 0.5]

CONSTRAINTS (HARD — do not violate):
  • Never modify billing module without explicit approval
  • All API endpoints must have request validation
  • Database migrations must be reversible

RELATED KNOWLEDGE:
  • StudioKamel Auth System Notes — "Devise is causing issues with API token generation. JWT approach would clean up the dual-auth mess..." [similarity: 0.87]

ACTIVE TASKS:
  • Replace Devise with JWT auth [in_progress, coder]
  • Fix N+1 in dashboard endpoint [pending]

RECENT EXECUTIONS:
  • JWT auth PoC — partial success, refresh token flow incomplete [2026-04-03, partial]

INTENT CLUSTERS:
  • "JWT auth migration" — 5 items, readiness 82/100 [proposed]

=== END SUPERMAN CONTEXT ===
```

---

## 5. Who Builds the Context?

**Builder: `Superman.Context` module (EMA daemon)**

```
Responsibility boundary:

  EMA daemon (Superman.Context)         Bridge
  ─────────────────────────────        ───────
  - Queries .superman file              - Calls Superman.Context.for_project/2
  - Searches vector index               - Passes context to agent dispatch
  - Assembles JSON structure            - Does NOT build or modify context
  - Applies token budget
  - Returns structured map or text block

  EMA API (ProjectContextController)   HQ Frontend
  ──────────────────────────────────   ───────────
  - Calls Superman.Context.for_project  - Fetches GET /api/projects/:id/context
  - Returns JSON response               - Renders sections from JSON
```

**The Bridge does not build context.** It calls `Superman.Context.for_project/2` and receives the assembled result. This keeps context logic in one place.

---

## 6. Injection Points

### Point 1: Pre-Dispatch (Agent Prompt Enrichment)
```
Trigger: Proposal approved → dispatch initiated
Timing:  Before agent Port subprocess is spawned
Method:  Superman.ContextInjector.enrich_dispatch(dispatch)
Output:  dispatch struct with :superman_context field populated
Budget:  2,000 tokens (default)
```

This is the critical path. Every agent dispatch for a project-scoped task gets enriched.

### Point 2: HQ Dashboard API
```
Trigger: GET /api/projects/:id/context request
Timing:  On-demand (frontend fetch)
Method:  Superman.Context.for_project(project_id, max_tokens: 4000)
Output:  Full JSON response
Budget:  4,000 tokens (more context for display)
```

### Point 3: Proposal Generation
```
Trigger: Intent cluster hits readiness threshold → proposal generation starts
Timing:  Before LLM call for proposal content
Method:  Superman.Context.as_prompt_block(project_id, max_tokens: 3000)
Output:  Text block prepended to proposal generation prompt
Budget:  3,000 tokens
```

### Point 4: Brain Dump Classification (Bonus)
```
Trigger: New brain dump item inserted
Timing:  Post-insert, async
Method:  Superman.search(item.content, project_id: project_id)
Output:  Nearest project/intent → auto-suggests categorization
Budget:  N/A (just nearest-neighbor lookup, no injection)
```

---

## 7. Token Budget

### Default Allocation (2,000 tokens)

```
Component                        Tokens    % of Budget    Trimmable?
─────────────────────────────    ──────    ───────────    ──────────
Identity + intents + constraints  ~300         15%            No
Related vault notes (3-5)         ~700         35%            Yes
Active tasks (titles + status)    ~350         17%            Yes
Recent executions (summaries)     ~300         15%            Yes
Intent clusters                   ~200         10%            Yes
Relationships                     ~150          7%            Yes
─────────────────────────────    ──────    ───────────    ──────────
Total                            ~2,000       100%
```

### Budget Variants by Use Case

| Use Case | Budget | Scope |
|---|---|---|
| Quick task dispatch | 1,000 | Identity + intents + constraints + top 2 tasks |
| Standard dispatch | 2,000 | All sections, default trim |
| Deep analysis/proposal | 3,000 | All sections, more vault notes, more executions |
| HQ dashboard | 4,000 | Full context, all sections |
| Max (research / architecture) | 8,000 | Uncapped within budget |

### Token Counting

Token estimation: `String.length(text) / 4` (rough approximation).

For production accuracy, use `Tiktoken` or count via the model's actual tokenizer. Current approximation is ~±15% — acceptable for budget management since we have headroom on the total context window (~100K tokens for Claude).

### Trimming Priority (Lowest to Highest)

```
1. Trim relationship descriptions (keep type + target only)
2. Reduce vault note count (5 → 3 → 1)
3. Trim vault note excerpts (500 chars → 200 chars → title only)
4. Reduce execution count (5 → 3 → 1)
5. Remove execution summaries (keep id + status + timestamp only)
6. Reduce proposal count (5 → 2)
7. Remove intent cluster details (keep theme + readiness only)
8. Reduce task descriptions (keep title + status only)
--- HARD STOP: never trim identity, intents, or constraints ---
```

---

## 8. Size Limits

| Limit | Value | Reason |
|---|---|---|
| Total context budget (default) | 2,000 tokens | Leaves room for system prompt + history |
| Total context budget (max) | 8,000 tokens | Hard cap, never exceed |
| Vault note excerpt (default) | 500 chars | ~125 tokens per note |
| Task title max | 120 chars | Enforced at insert |
| Execution summary max | 300 chars | ~75 tokens per execution |
| Intent cluster items returned | 3 | Dashboard widget constraint |
| .superman IDENTITY max | 200 chars | One-line description |
| .superman INTENT count | No hard limit | Practically 3-7 |
| .superman CONSTRAINT count | No hard limit | All must always be included |

---

## 9. Implementation Checklist

- [ ] `Superman.Context.for_project/2` — assembles JSON struct from all sources
- [ ] `Superman.Context.as_prompt_block/2` — formats as text block for injection
- [ ] `Superman.Context.apply_token_budget/2` — trims in priority order
- [ ] `Superman.ContextInjector.enrich_dispatch/2` — enriches dispatch struct
- [ ] `Superman.FileReader.parse/1` — parses .superman file into entries
- [ ] `EmaWeb.ProjectContextController.show/2` — REST endpoint
- [ ] Token estimation utility
- [ ] Config: `superman.default_context_budget`, `superman.max_context_budget`

---

## 10. Open Questions

1. **Streaming injection:** Should Superman context be streaming (updated during execution) or static (injected once at spawn)? Current spec: static, injected pre-spawn. Streaming adds complexity for marginal benefit at Week 7 scale.

2. **Agent-type tuning:** Should different agent roles (coder vs researcher vs security) receive different context shapes? Deferred to Phase 2 — standard shape for all agents in MVP.

3. **.superman file location:** Per-repo root vs. per-EMA-project? Current design: per-project path configured in EMA project record. If no path → no .superman data, graceful fallback to vector-only context.

4. **Honcho integration point:** If Honcho is deployed (Phase 2), it would add a `user_model` section to context (Trajan's preferences, work patterns). This slot is reserved in the schema but not populated until Honcho integration is complete.

---

*Cross-references: `superman-architecture.md`, `EMA-Claude-Bridge-Design.md`, `EMA-Phase-2-Corrected-Roadmap-2026-04-03.md`*
