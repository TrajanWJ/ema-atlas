---
title: Honcho Decision Framework
created: '2026-04-03'
updated: '2026-04-03'
type: knowledge
status: active
confidence: 0.85
tags:
  - honcho
  - decision
  - user-modeling
  - ema
  - phase-2
  - week-7
summary: >-
  Three-way decision: Managed v3 vs self-hosted v2 vs skip. Recommendation: skip
  in Week 7, use managed v3 in Week 8. Honcho's value is in reasoning + user
  modeling — not worth the operational debt in early phases.
author: Security Agent (intelligence-integrations task)
wiki_id: system/architecture/Intelligence-Integrations/HONCHO-DECISION
imported_from: vault/Architecture/Intelligence-Integrations/HONCHO-DECISION.md
imported_at: '2026-04-04T00:23:56.757Z'
---

# Honcho Decision Framework

> **Decision needed by:** Week 7 start
> **Impact:** Agent Task A (Honcho setup), Week 8 Task H (Honcho integration)
> **Blocking:** Scope Advisor, Reflexion injection, user model context

---

## Context

Honcho is a **user modeling and agent memory system** built by Plastic Labs. It stores interaction history, runs background "formal logical reasoning" on messages to generate persistent peer representations, and makes those representations queryable for context injection.

EMA's intended use case for Honcho:
1. **Pre-dispatch scope advising** — query Honcho before agent spawn: "What does Trajan typically want from auth-related tasks in this project?"
2. **Reflexion injection** — after execution, store outcome + quality signals, retrieve prior outcomes at next dispatch
3. **User model** — build up a persistent model of Trajan's preferences, work patterns, quality standards

Three options:

---

## Option A: Managed v3 (app.honcho.dev)

**What it is:** Honcho v3 is the current production version, operated as a managed service at app.honcho.dev. Sign up, get an API key, start calling their REST API. No infrastructure to run.

**How it works:**
- Write messages to sessions → Honcho's Deriver runs background reasoning
- Query peer representations → get structured insights about a user/agent
- Data model: Workspaces → Peers → Sessions → Messages → Representations

**Integration in EMA:**
```elixir
# One HTTP call per dispatch (pre-dispatch)
Ema.Honcho.query_peer("trajan", "What approach works best for auth tasks in StudioKamel?")
# => "Prefers incremental migration. Avoid touching billing adjacent code. Values test coverage."

# One write per execution (post-dispatch)
Ema.Honcho.store_message(session_id, %{role: "agent", content: outcome_summary})
```

| Dimension | Assessment |
|---|---|
| **Effort to start** | ~2 hours: sign up + write `Ema.Honcho.Client` HTTP module |
| **Ongoing ops** | Zero — managed service |
| **Cost** | $100 free credits on signup. ~$0.04/run at low volume. Months of free tier for a single-user system. |
| **Capability** | Full v3 reasoning layer. Background reasoning on all stored interactions. |
| **Data privacy** | Messages leave the machine → sent to Plastic Labs' infrastructure |
| **Reliability** | External dependency. If app.honcho.dev goes down, scope advisor fails. |
| **Lock-in** | Medium. API is documented but proprietary. Migration = rewrite Honcho client + lose accumulated user model. |
| **EMA fit** | Good. Per-project sessions map cleanly to Honcho's data model. |
| **Week 7 readiness** | ✅ Start today with API key |

**Risks:**
- Service outage breaks pre-dispatch enrichment (mitigated: scope advisor fails open, not closed)
- Data leaves local environment — Trajan's vault content and agent outputs go to an external service
- $100 credits will eventually run out at scale (but months away for single user)
- No self-host option confirmed for v3 — if pricing changes, migration is the only path

---

## Option B: Self-Hosted v2

**What it is:** An older Docker-hostable version of Honcho (pre-v3 reasoning architecture). Referenced in planning docs as `plasticlabs/honcho:latest` but this may be stale.

**Status of self-hosting documentation:**
- `/self-hosting` returns 404 on the current docs site
- No Docker image confirmed for v3
- v2 Docker image (`plasticlabs/honcho:latest`) may exist but lacks the v3 reasoning/Deriver

**What you'd get:**
- Message storage (write + retrieve interaction history)
- Basic session/peer management
- **No** background reasoning / Deriver
- **No** formal logical peer representations
- Essentially: a structured conversation store, not a user modeling system

**Effort:**
```
Day 1: Find v2 Docker image (not confirmed available), attempt docker compose up
       → honcho-api + honcho-db (postgres + pgvector) + honcho-redis
       → 4 services to maintain
Day 2: Write Ema.Honcho.Client against v2 API (may differ from v3)
Day 3: Wire to EMA dispatch + store messages
       → No reasoning = no peer representations = no pre-dispatch query
       
Result: You have a conversation log, not a user model.
```

| Dimension | Assessment |
|---|---|
| **Effort to start** | ~2-3 days: find image, setup compose, write client |
| **Ongoing ops** | 4 Docker services to maintain (API, Deriver, Postgres, Redis) |
| **Cost** | Infrastructure only (a few MB RAM, minimal disk) |
| **Capability** | Message storage only. No reasoning layer. No peer representations. |
| **Data privacy** | ✅ Fully local |
| **Reliability** | Local — no external dependency |
| **Lock-in** | Low — easily replaced since no reasoning data accumulated |
| **EMA fit** | Poor. The value of Honcho is the reasoning layer. Without it, you have a structured chat log. |
| **Week 7 readiness** | ❌ Blocked on finding confirmed v2 image + compose config |

**Risks:**
- Time spent on setup yields little value (no reasoning → no scope advisor quality)
- v2 API may diverge significantly from v3 docs — double implementation work later
- Postgres + pgvector + Redis = 4 more services to monitor, restart, backup

---

## Option C: Skip Honcho Entirely

**What it is:** Honcho is not deployed. Scope advising and reflexion injection are implemented with simpler alternatives internal to EMA.

**What you'd build instead:**
```elixir
# Reflexion: store outcome notes in EMA's existing Executions table
# Retrieve last 3 executions by agent + task_type at dispatch time
# Format as "lessons from prior similar tasks" block
# No external service, no reasoning — just structured history lookup

defmodule Ema.ReflexionStore do
  def prior_outcomes(agent_role, task_type, project_id, limit \\ 3) do
    Ema.Executions.list(
      agent_role: agent_role, 
      task_type: task_type,
      project_id: project_id,
      limit: limit,
      order: :desc
    )
    |> Enum.map(&format_outcome/1)
  end
  
  def store_outcome(execution_id, agent_role, task_type, quality_signals) do
    Ema.Executions.update(execution_id, %{
      agent_role: agent_role,
      task_type: task_type,
      quality_signals: quality_signals
    })
  end
end

# Scope Advisor: LLM call with project context + execution history
# No Honcho needed — just a well-crafted prompt
defmodule Ema.ScopeAdvisor do
  def advise(proposal, project_id) do
    context = Superman.Context.for_project(project_id)
    prior = ReflexionStore.prior_outcomes("coder", proposal.task_type, project_id)
    prompt = build_scope_prompt(proposal, context, prior)
    Ema.Claude.Bridge.run(prompt, model: "haiku", max_tokens: 500)
  end
end
```

| Dimension | Assessment |
|---|---|
| **Effort to start** | 0 hours — nothing to set up |
| **Ongoing ops** | Zero |
| **Cost** | Zero (uses existing EMA models) |
| **Capability** | Manual reflexion (lookup by type) + LLM scope advisor without user model |
| **Data privacy** | ✅ Fully local |
| **Reliability** | Same as EMA daemon — one less dependency |
| **Lock-in** | None |
| **EMA fit** | Good for Week 7-8. Missing: cross-session pattern detection, persistent user preferences. |
| **Week 7 readiness** | ✅ Can implement in parallel with other Week 7 tasks |

**Gaps vs Honcho:**
- No persistent user model that reasons across sessions
- No semantic search over past interactions
- Scope advisor quality limited to explicit structured lookups (not inferred patterns)

---

## Decision Matrix

| Criterion | Weight | Managed v3 | Self-hosted v2 | Skip |
|---|---|---|---|---|
| Implementation effort | 20% | ✅ Low (2h) | ❌ High (3d) | ✅ Zero |
| Operational complexity | 15% | ✅ Zero | ❌ 4 services | ✅ Zero |
| Capability | 25% | ✅ Full reasoning | ❌ Storage only | ⚠️ Manual/LLM |
| Data privacy | 15% | ❌ External | ✅ Local | ✅ Local |
| Risk | 15% | ⚠️ External dep | ⚠️ Stale image | ✅ Low |
| Week 7 velocity impact | 10% | ✅ Fast | ❌ Blocks | ✅ Fast |

**Weighted scores:**
- Managed v3: ~0.78
- Self-hosted v2: ~0.42
- Skip: ~0.71

---

## Recommendation

**Week 7: Skip Honcho entirely. Implement lightweight reflexion in EMA directly.**

**Week 8: Evaluate managed v3 if reflexion quality is insufficient.**

### Rationale

1. **Week 7 has a full plate.** Honcho setup (even managed v3) competes with Task A, B, C, D, E. None of those tasks require Honcho. Adding it risks blocking the critical path for marginal benefit.

2. **The skip option is not a regression.** Simple reflexion (last 3 outcomes by type) is 80% of the value. Honcho adds cross-session pattern detection and LLM-reasoned user model — these matter at Month 3, not Week 7.

3. **Data privacy concern is real.** Trajan's vault content, agent outputs, and project details leaving the machine to a third-party service is a meaningful trust boundary. This deserves an explicit decision, not implicit acceptance.

4. **Self-hosted v2 is not viable.** The Docker image is unconfirmed, the API likely differs from v3 docs, and it lacks the reasoning layer that makes Honcho valuable. Effort/value ratio is negative.

5. **The managed v3 path remains available for Week 8.** If the Week 7 reflexion implementation reveals gaps (scope advisor not smart enough, no cross-project patterns), switch to managed v3. The integration cost is ~2 hours.

### Week 7 Implementation (Skip Path)

```elixir
# In Ema.Loop.Orchestrator, before dispatch:
defp enrich_with_reflexion(dispatch) do
  outcomes = Ema.ReflexionStore.prior_outcomes(
    dispatch.agent_role,
    dispatch.task_type, 
    dispatch.project_id,
    limit: 3
  )
  
  if Enum.any?(outcomes) do
    reflexion_block = format_reflexion_block(outcomes)
    Map.update!(dispatch, :prompt, &("#{reflexion_block}\n\n---\n\n#{&1}"))
  else
    dispatch
  end
end
```

Add `agent_role`, `task_type`, `quality_signals` fields to Executions schema if not present.

### Decision Trigger for Switching to Managed v3

Switch to Honcho managed v3 if any of the following occur:
- Scope advisor quality complaints from Trajan (agent scope creep 2+ times in a week)
- Need cross-project pattern detection (e.g., "Trajan always wants tests, regardless of project")
- Week 8 reflexion lookup produces repeated irrelevant outcomes
- Phase 2 user modeling requirements are explicit (currently unspecified)

---

## If Going with Managed v3 (When Ready)

1. Sign up at app.honcho.dev → get API key
2. Add `HONCHO_API_KEY` to EMA config
3. Write `Ema.Honcho.Client` (HTTP wrapper, ~50 lines via `Req`)
4. Map EMA sessions to Honcho sessions (per-project session boundary recommended)
5. Wire `after_dispatch` → store outcome in Honcho session
6. Wire `before_dispatch` → query Honcho peer representation for project context
7. Add `user_model` section to Superman context (reserved slot)
8. Monitor costs via Honcho dashboard

---

*Cross-references: `Honcho-Deployment-Patterns.md`, `honcho-scope-advisor.md`, `EMA-Phase-2-Corrected-Roadmap-2026-04-03.md`*
