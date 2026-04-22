---
title: "Bayesian Agent Routing"
type: reference
created: 2026-03-19
updated: 2026-04-07
confidence: high
source: "kbot (isaacsight/kernel) GitHub intel sweep + internal analysis"
tags: [agent-routing, bayesian, trueskill, multi-agent, architecture]
summary: "Analysis of Bayesian skill-rating routing (TrueSkill-style) for agent dispatch, with implementation roadmap and decision to defer"
---

# Bayesian Agent Routing

*Date: 2026-03-19*
*Source: kbot (isaacsight/kernel) GitHub Intel sweep*
*Status: Pattern documented. NOT implementing. See "Why Not Yet."*

---

## What kbot Does

kbot uses Bayesian skill ratings — similar to TrueSkill (Microsoft's Bayesian rating system for competitive games) — to route tasks to agents. Each agent has a per-task-type skill distribution (mean μ, variance σ²). When a task arrives, kbot selects the agent with the highest expected skill for that task type. After completion, the rating updates based on outcome: success → μ increases, failure → μ decreases, σ² decreases with each observation (more certain estimate).

This is fundamentally different from static routing: the router *learns* which agents are actually good at which things, rather than relying on static rules.

kbot also decomposes tasks using a 23-agent roster — each agent is narrow enough that skill ratings are meaningful signals.

---

## How It Differs From Our Current Routing

| Dimension | Our System | kbot Bayesian |
|---|---|---|
| Routing decision | Right Hand reads task, applies explicit rules | Skill distribution lookup per agent per task type |
| Improvement | Manual SOUL.md updates | Automatic rating updates from outcomes |
| Explainability | "I sent this to Coder because it's a code task" | "Coder has μ=0.82 for Python tasks; Researcher has μ=0.31" |
| Cold start | Works immediately (rules are explicit) | Requires data before skill estimates are reliable |
| Failure mode | Predictable (wrong rules = wrong routing) | Unpredictable (noisy outcomes → corrupted ratings) |
| Debuggability | High — trace the rule | Medium — need to inspect rating history |

Our current routing is *static* and *rule-based*. It works because Trajan's task distribution is predictable and our 8 agents are well-differentiated. The question isn't whether Bayesian routing would be smarter — it probably would be, eventually. The question is whether it would be smarter *faster than it introduces new failure modes.*

---

## What We'd Need to Implement It

### 1. Outcome Tracking
Every dispatched task needs a structured outcome record:
```json
{
  "task_id": "uuid",
  "task_type": "code|research|ops|security|...",
  "agent_assigned": "coder",
  "timestamp": "ISO8601",
  "outcome": "success|partial|fail",
  "confidence": 0.8,
  "notes": "optional"
}
```

This doesn't exist yet. `memory/outcome-tracker.json` is the intended location but has minimal data.

### 2. Task Type Taxonomy
Bayesian routing requires a stable task type classification. Without it, you can't compute "Coder's skill at Python tasks" — you need consistent labels.

Proposed taxonomy (initial):
- `code/write` — generating new code
- `code/debug` — fixing broken code
- `code/review` — analyzing existing code
- `research/web` — web search + synthesis
- `research/vault` — querying internal knowledge
- `ops/infra` — system administration
- `ops/monitoring` — checking system health
- `security/audit` — security analysis
- `security/hardening` — applying security fixes
- `knowledge/write` — vault note creation/update
- `knowledge/search` — retrieval tasks

### 3. Per-Agent Per-Task-Type Priors
Initial prior for each agent × task type: `(μ=0.5, σ²=1.0)` — maximum uncertainty, neutral expectation.

Informative priors (what we'd encode from current knowledge):
- Coder: high prior on `code/*`
- Researcher: high prior on `research/*`
- Security: high prior on `security/*`
- etc.

### 4. Update Rule
On task completion:
```
new_μ = μ + (outcome - μ) / n  # running mean
new_σ² = σ² * (1 - 1/n)       # variance shrinks with evidence
```

Or full TrueSkill update (accounts for performance uncertainty, not just binary outcome).

### 5. Routing Decision
Given task type T, select agent A* = argmax_A μ(A, T).
Tie-break by σ² (prefer agent with more certain skill estimate).

---

## Concrete Implementation Sketch

**Phase 1 — Data collection (no routing changes):**
- Add outcome logging to every dispatch
- Run for 50+ tasks, collect ground truth

**Phase 2 — Skill estimation (shadow mode):**
- Compute current agent × task type skill estimates from log data
- Run Bayesian router in shadow mode: log what it *would* have routed, compare to actual
- Measure: does the Bayesian suggestion agree with current routing? When it disagrees, who's right?

**Phase 3 — Hybrid routing:**
- For task types with ≥20 labeled examples and clear skill differentiation: use Bayesian routing
- For everything else: fall back to current rules

**Phase 4 — Full Bayesian:**
- Only after Phase 3 demonstrates improvement on >30% of tasks

---

## Why NOT to Implement It Yet

**Per Pike Rule 1: Don't optimize until measured.**

We have approximately zero outcome data. We don't know:
1. What fraction of tasks are routed correctly by current rules
2. Which task types are ambiguous for current routing
3. Whether routing is even the bottleneck (vs. agent capability, prompt quality, etc.)

Without this, a Bayesian router would be optimizing a problem we haven't confirmed exists.

**Additional reasons:**

- **Cold start problem:** With no data, initial ratings are uniform — the router is random. Rules-based routing is better than random.
- **Label noise:** Outcome labeling requires someone to judge success/failure. If labeling is inconsistent, ratings diverge from truth.
- **23 vs. 8 agents:** kbot's Bayesian router is solving a harder problem (23 agents × many task types). Our 8-agent roster has less routing ambiguity. The benefit of learned routing scales with ambiguity.
- **Maintenance:** Bayesian routing adds a data pipeline, a rating store, and a routing algorithm to maintain. This is engineering overhead we can't currently afford.

**Decision: Implement Phase 1 (outcome logging) now. Revisit Phase 2 when we have 50+ labeled outcomes.**

---

## What to Watch For (Leading Indicators)

Implement Bayesian routing if we observe:
- Right Hand mis-routing >20% of tasks (based on outcome data)
- Clear skill differentiation between agents on the same task type
- Routing decisions taking Right Hand significant prompt tokens (cognitive overhead)
- A task type that consistently fails because the wrong agent gets it

---

*Related: [[pike-rules-agent-architecture]], [[Agent Evaluation Frameworks]], [[Multi-Agent Coordination Patterns]], [[dispatch-nag-protocol]], [[fleet-mem-coordination]]*
