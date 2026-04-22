# Routing Rules — Task → Orchestrator Mapping

## Quick Reference

| Domain | Orchestrator | Workers | Trigger Keywords |
|---|---|---|---|
| Life & Executive | `life-lead` | chief-of-staff, finance, wellness | morning briefing, schedule, habits, budget, invoice, routine, accountability, brainrot |
| Business & Revenue | `business-lead` | biz-dev, account-manager, creative-director, marketer, writer | client, Wilson Premier, outreach, proposal, brand, content, social media, SEO, blog post |
| Technical | `tech-lead` | coder, architect, researcher, ops, security | build, fix, implement, deploy, research, audit, architecture, code review, system health |
| Quality & Knowledge | `quality-lead` | prompt-engineer, devils-advocate, strategist, vault-keeper, analyst, pm | optimize prompt, review, challenge, strategy, vault, organize, metrics, project status, sprint |

## Direct-to-Worker (Skip Orchestrator)

For simple single-agent tasks, Right Hand spawns directly:
- Quick code fix → `coder` directly
- Simple question → `researcher` directly  
- Personal request → `concierge` directly
- Quick vault lookup → `vault-keeper` directly

## When to Use Orchestrators

Use orchestrators when:
- Task spans 2+ workers in the same domain
- Task needs synthesis across multiple perspectives
- Complex multi-step workflow within a domain
- You want the orchestrator to manage worker lifecycle

## Cross-Domain Tasks

When a task spans multiple domains:
1. Right Hand spawns multiple orchestrators in parallel
2. Each handles their domain's portion
3. Right Hand synthesizes across domains

Example: "Prepare for Wilson Premier meeting" →
- `business-lead` → account-manager (status), creative-director (materials)
- `tech-lead` → coder (demo prep), ops (system status)
- Right Hand synthesizes into one briefing

## Compound Query Decomposition

When a query spans multiple agents/domains AND uses coordinating structure
("summarize X AND schedule Y", "fix this THEN deploy"), decompose before routing:

1. **Detect compound**: look for coordinating conjunctions linking distinct action verbs
2. **Decompose**: break into independent sub-tasks (max 4)
3. **Route each** to the best specialist in parallel (independent tasks) or sequentially (dependent)
4. **Synthesize**: combine results into a single coherent response

Fallback: if decomposition produces >4 sub-tasks, route original to the most relevant orchestrator.

Examples:
- "Summarize the codebase AND create a project note" → `architect` (summary) + `vault-keeper` (note) in parallel
- "Research X THEN write a proposal" → `researcher` → feeds into → `writer` (sequential)
- "Fix the bug, run tests, and deploy" → `coder` → `coder` (tests) → `ops` (deploy, sequential)

## Pre-Routing Guardrails

Before any agent sees a query, apply guardrail checks (see `guardrails.md`):

**Always-on:**
- Scope check — block completely off-topic requests
- Prompt injection detection — block jailbreak attempts
- PII scrubbing — strip PII from routing logs (forward original to agent)

**Result actions:**
- PASS → continue to routing
- BLOCK → return error, never reaches agent
- TRANSFORM → sanitized query continues

## High-Stakes Routing

Tasks routed to `finance`, `ops`, or `security`, OR tagged `irreversible/external/financial/destructive`,
require dual-router consensus before execution. See `high-stakes-routing.md`.

## Circuit Breaker

Agents in OPEN (degraded) state are skipped during routing. See `circuit-breaker.md`.
If all agents in a domain are OPEN, route to fallback agent and alert.

## Full Routing Stack Order

```
Incoming query
  → Pre-routing Guardrails (guardrails.md)
  → Compound query check → decompose if multi-domain
  → Rule-based routing (this file, Quick Reference)
  → Semantic/embedding match (if no rule match)
  → LLM-as-router (if low confidence)
  → Circuit breaker filter (circuit-breaker.md)
  → High-stakes consensus check (high-stakes-routing.md)
  → Agent invocation
```
