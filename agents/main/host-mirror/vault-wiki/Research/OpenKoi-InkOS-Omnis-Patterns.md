---
id: "d52cd4e2-27e2-4d4b-9cc7-15860881a04c"
title: ""
space: wiki
tags: []
source: manual
---

---
title: OpenKoi + InkOS + Omnis Patterns
tags: [research, cross-pollination, openkoi, inkos, omnis, critical]
source: session-2026-04-07
---

# OpenKoi + InkOS + Omnis — Top Steals

## OpenKoi (Highest Priority — Rust CLI agent)

### 1. Parliament-in-One-Call (replaces EMA Debater)
ONE LLM call with 5 perspectives — not 5 agents.
- Guardian: safety, reversibility
- Economist: cost, time
- Empath: user feelings
- Scholar: truth, sources
- Strategist: long-horizon

Cost: 1 inference, not 5. Drop-in replacement for current Debater.

### 2. Sovereign Directive (per-task value frame)
soul.md + task + time → 3-5 sentence value frame injected into every agent prompt in the cycle.
Cheap way to give agents shared context without re-reading full wiki.

### 3. Scout Phase (cheap recon before planning)
Iteration 0: read-only LLM call with 1/10 budget, only grep/glob/read tools.
Output capped at 4000 chars, injected into planner's history.
Saves primary from burning 20k tokens on exploration.

### 4. Tool/Domain/Human Atlas (World Model)
SQLite tables with reliability scores per tool/domain/person.
Auto-categorized failures (rate_limit, timeout, auth_error).
SystemBrain projects to wiki/system/state/tool-reliability.md.
Automates wiki/User/Learnings-Gotchas.md.

### 5. Pattern Miner → Skill Proposer
Scan usage events for recurring sequences (≥3 samples, ≥0.6 confidence).
Auto-generate new Pipe proposals with Claude-drafted YAML.
Fills the missing piece in EMA's Pipes system.

### 6. Epistemic Honesty Audit
Weekly reflect: claimed confidence vs actual outcome per domain.
Surfaces overconfident_cases. Calibration metric.

## InkOS (Architecture Inspiration — Novel-writing CLI)

### 1. Truth Files as Structured Long-Term Memory
state/*.json (Ecto-validated) authoritative, markdown projected via SystemBrain.
- current_focus.json
- responsibilities.json  
- pending_hooks.json (open threads)
- goals.json
- learnings.json (Tool Atlas merge)

### 2. Plan → Compose → Execute Split
Composer runs LOCALLY (no LLM): compiles context + rule-stack + trace.
Generator only runs after Composer.
Inspectable artifact ('what will Generator see?') before spending tokens.

### 3. JSON Delta + Validation (vs Full State Rewrites)
Agent outputs as Ecto-validated deltas with sequence numbers.
Per-actor sequence number in phase_transitions.
Catches 'garbage in, persisted anyway' bugs.

### 4. Memory DB for Relevance-Based Retrieval
v0.6 added story/memory.db — embeddings + cosine similarity.
Inject top-k facts instead of full wiki dumps.
Confirms: biggest lever for long-running agent sessions.

### 5. Tool Guards Against Self-Manipulation
Dispatcher guards prevent agent from:
- Editing progress counter
- Rewriting current_focus.md to trick dispatch
- Sequential write violations
Best example seen of tool-level guardrails.

## Omnis (Autoschedule Algorithm)

### Autoschedule for Ema.Focus
~150 lines of Rust → Elixir port.
1. Group by due date, mark first half High urgency
2. Sort by (importance, urgency, duration)
3. Lay end-to-end from now
4. Push around obstacles (calendar)
5. Recursive day-bumping for overflow

Replace Omnis's median heuristic with EDD (earliest deadline first).
Fills EMA's scaffolded Focus module.

## Top 10 Priority Implementation Order
1. Parliament Debater (OpenKoi) — 1 day
2. Composer pre-step (InkOS) — 2 days
3. Tool Atlas (OpenKoi) — 2 days
4. Omnis autoschedule for Focus — 1 day
5. Tool guards (InkOS) — 1 day
6. JSON delta pattern (InkOS) — 3 days
7. Vault memory DB embeddings (InkOS) — larger spec
8. Pattern Miner (OpenKoi) — 3 days
9. Sovereign Directive (OpenKoi) — 1 day
10. Epistemic honesty audit (OpenKoi) — 2 days
