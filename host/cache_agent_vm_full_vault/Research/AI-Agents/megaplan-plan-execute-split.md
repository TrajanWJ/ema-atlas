---
title: "Megaplan: Plan-Execute Split Architecture — Cross-Pollination for EMA"
type: research
created: 2026-04-04
confidence: 0.75
tags: [ai-agents, planning, orchestration, ema, cross-pollination, swe-bench]
summary: "Megaplan enforces structured planning before execution via state machine. EMA has no equivalent — strong signal to steal the pattern."
---

# Megaplan: Plan-Execute Split Architecture — Cross-Pollination for EMA

*Sources: 10 total (9 primary — GitHub repo files + EMA docs, 1 institutional — SWE-bench leaderboard)*
*Confidence: 0.75 | Date: 2026-04-04*
*Task ID: cross-poll-megaplan-de7c9381*

---

## Summary

Megaplan (peteromallet) is a Python agent harness that enforces a structured planning phase before any code execution. It uses a state machine (INITIALIZED → PLANNED → CRITIQUED → GATED → FINALIZED → EXECUTED) to separate Claude-handled planning from worker-handled execution. EMA has no equivalent planning phase — agents execute immediately from task descriptions. The plan/execute split is directly portable. The SWE-bench 56%+ claim is **unverified** — no public leaderboard entry found, no benchmark results in the repo.

**Verdict: Steal the pattern. Specifically the finalize.json + execution boundary model.**

---

## Findings

### 1. The Plan/Execute Split — How It Works

**State machine** enforced via `handlers.py` + `workflow.py`:

```
INITIALIZED
→ PREPPED        (codebase investigation, engineering brief)
→ PLANNED        (Claude generates markdown plan)
→ RESEARCHED     (devil's advocate pass, doc validation)
→ CRITIQUED      (flag generation — correctness, security, completeness)
→ REVISED        (plan updated to address flags, may loop back to CRITIQUED)
→ GATED          (readiness approval — hard gate before execution)
→ FINALIZED      (plan converted to structured task JSON)
→ EXECUTED       (worker agents run tasks from finalize.json)
→ REVIEWED       (quality validation)
→ DONE
```

**Key design principle**: The executor reads ONLY `finalize.json`. It never sees the full plan history. This self-contained handoff eliminates plan drift — the executor has exactly what it needs, nothing more.

`finalize.json` contains:
- Tasks array with IDs (T1, T2...), descriptions, dependencies, status fields
- Watch items (runtime risks)
- Sense checks (verification questions per task)
- Meta commentary (gotchas, judgment calls)
- Coverage map (every plan step maps to ≥1 task)

### 2. Model Routing Architecture

`workers.py` implements `resolve_agent_mode()` which routes phases to different agents:

- **Planning phases** (`plan`, `prep`, `research`, `critique`, `revise`, `gate`, `finalize`): defaulting to Claude
- **Execution phases** (`execute`, `loop_execute`): defaulting to Hermes/GLM workers via OpenRouter

The "Claude plans, Hermes executes" thesis in the README is directionally accurate but configurable — any agent can handle any phase via `--phase-model` CLI flags. The architecture is a harness, not hardcoded model coupling.

**Hermes worker** (`hermes_worker.py`): uses OpenRouter, supports GLM, Qwen3.5, DeepSeek-R1. Phase-specific tool access: executors get terminal+file+web; planners get file+web only.

### 3. Prompt Architecture

**Planning prompt** (`prompts/planning.py`): Enforces structured markdown with H1 title, Overview, numbered steps, ordering sections. Three-tier success criteria: `must` (hard gates), `should` (quality targets), `info` (non-verifiable). Emphasizes proportional scope — "a 1-line fix needs a 2-step plan."

**Execute prompt** (`prompts/execute.py`): Executor told to "implement the intent, not just the text." Must report deviations. Returns structured JSON: `output`, `files_changed`, `commands_run`, `task_updates`, `sense_check_acknowledgments`.

**The boundary**: Plan prompt builds context; execute prompt consumes self-contained `finalize.json`. Clean handoff.

### 4. The "Autoimprover" — What It Actually Is

No separate `megaplan-autoimprover` repo exists publicly. The self-improvement mechanism IS the critique → revise → gate loop:

- **Critique phase**: Generates `FLAG-XXX` records across categories (correctness, security, completeness, performance)
- **Revise phase**: Plan updated to address flags; system verifies "addressed flags were actually fixed"
- **Gate phase**: Final validation, flag resolutions disputed or accepted as tradeoffs
- **Parallel critique** (`parallel_critique.py`): Runs multiple critique checks concurrently via `ThreadPoolExecutor`, merges results, removes duplicate flags

The self-referential improvement is this critique/revise/gate loop — it iterates until the gate approves. The prompt architecture evolves with each revision cycle.

### 5. SWE-bench 56%+ Claim — Verdict: UNVERIFIED

**Evidence found:**
- `evals/benchmarks/swe_bench.py` exists — prompt builder that formats SWE-bench problems for agents
- No benchmark results files in the repo
- No public leaderboard entry on swebench.com for megaplan or peteromallet
- March 2026 SWE-bench Verified leaders: Claude 4.5 Opus 76.8%, Gemini 3 Flash 75.8%
- Repository has 42 stars — not a widely-benchmarked system

**Assessment**: The "500 problems / 56%+" claim appears to be aspirational or from a private run. The 500-problem number matches SWE-bench Verified. The harness is well-engineered but the score is unsubstantiated. **Do not treat as verified performance data.**

---

## EMA Gap Analysis

### What EMA Has

| Component | Status | Notes |
|-----------|--------|-------|
| ProposalEngine | Built | Generator → Refiner → Debater → Scorer → Tagger — upstream **task creation**, not execution planning |
| Deliberation Gate | Partially built (W7) | Intercepts "structural tasks," requires proposal first — lightweight planning gate |
| AgentWorker | Built | Executes from task description directly — **no intermediate planning step** |
| Campaign Manager | Unbuilt (W10) | Multi-step agent topology — planned not implemented |
| Pre-execution planning phase | **Missing** | Agents go straight from task → execution |

### The Gap

EMA's execution pipeline: `Task → dispatch → AgentWorker → done`

No equivalent to megaplan's `PLANNED → CRITIQUED → GATED → FINALIZED` chain. The Deliberation Gate is the closest analog but only triggers on structural keyword matches and generates a proposal — not a structured execution plan.

The ProposalEngine is about **what to build** (idea-level), not **how to build it** (execution-level). Different planning layers.

### Steal the Pattern: Specific Recommendations

**High-value, low-effort:**

1. **`finalize.json` equivalent for AgentWorker** — Before dispatch, Claude generates a structured task spec: task IDs, dependencies, sense checks, watch items. AgentWorker reads spec, not freeform task description. EMA already sends system prompts to agents; adding a structured planning step before launch is additive.

2. **Expand Deliberation Gate beyond structural detection** — Current gate is keyword-based on task creation. For tasks above a complexity threshold (duration estimate, file scope), require a mini-plan before dispatch. The mini-plan becomes the agent's briefing.

3. **Critique/gate loop before Campaign dispatch** — When Campaign Manager ships (W10), apply a single critique pass to the campaign plan before any agent spawns. Catches dependency issues, scope creep, contradictory intents before execution.

**Medium-effort:**

4. **Phase-level model routing** — EMA's SmartRouter routes whole sessions. Megaplan shows value in phase-level routing: stronger model for planning, cheaper for execution. Wire into SmartRouter when fitness signals are available (F5).

**Not worth copying:**

5. The full 9-phase pipeline is overkill for EMA's task horizon. A 3-phase mini version (plan → check → execute) is appropriate.

---

## Key Takeaways

1. **The boundary matters more than the models.** Megaplan's value is the `finalize.json` handoff contract. The model choice is secondary.

2. **EMA is missing one layer.** Between task creation and agent execution, there's no planning phase. This is the gap.

3. **Deliberation Gate is megaplan-lite.** It has the right instinct. Generalizing it to a planning gate ports megaplan's core idea without a rewrite.

4. **The autoimprover is the critique loop.** Implement flag-tracked critique on EMA's proposal pipeline (F2/F4). The pattern is clear.

5. **Don't trust the SWE-bench claim.** No evidence. Treat as marketing.

---

## Contested / Uncertain

- **Megaplan's actual performance**: No public benchmark data. Critique/revise loop is well-designed but unverified at scale.
- **Whether EMA's ProposalEngine already provides enough pre-planning**: Refiner + Debater stages do multi-pass critique of proposals — structurally similar to megaplan's plan → critique cycle. Difference: proposals are idea-level, not execution-level.

---

## Open Questions

1. Does EMA's AgentWorker receive structured prompts per task, or just task descriptions? (Check `daemon/lib/ema/agents/` when daemon source is accessible)
2. What's the average complexity of tasks EMA dispatches? Megaplan is designed for SWE-bench-scale problems; EMA tasks may be shorter-horizon.
3. When Campaign Manager ships (W10), should it include a built-in planning pass, or treat planning as a campaign step itself?

---

## Sources

1. [T1] [megaplan/handlers.py](https://raw.githubusercontent.com/peteromallet/megaplan/main/megaplan/handlers.py) — State machine, handler list, plan/execute division
2. [T1] [megaplan/workers.py](https://raw.githubusercontent.com/peteromallet/megaplan/main/megaplan/workers.py) — Agent routing, step types, session management
3. [T1] [megaplan/execution.py](https://raw.githubusercontent.com/peteromallet/megaplan/main/megaplan/execution.py) — Execution engine, batch processing
4. [T1] [megaplan/hermes_worker.py](https://raw.githubusercontent.com/peteromallet/megaplan/main/megaplan/hermes_worker.py) — Hermes/GLM worker, model support
5. [T1] [megaplan/prompts/planning.py](https://raw.githubusercontent.com/peteromallet/megaplan/main/megaplan/prompts/planning.py) — Planning prompt structure
6. [T1] [megaplan/prompts/execute.py](https://raw.githubusercontent.com/peteromallet/megaplan/main/megaplan/prompts/execute.py) — Execute prompt, structured output schema
7. [T1] [megaplan/prompts/finalize.py](https://raw.githubusercontent.com/peteromallet/megaplan/main/megaplan/prompts/finalize.py) — finalize.json generation
8. [T1] [megaplan/parallel_critique.py](https://raw.githubusercontent.com/peteromallet/megaplan/main/megaplan/parallel_critique.py) — Parallel critique runner
9. [T1] EMA ARCHITECTURE.md + NEW_FEATURES_SPEC.md — EMA system design, Campaign/Deliberation status
10. [T2] [SWE-bench leaderboard](https://www.swebench.com/) — No megaplan entry found

---

*Related: [[EMA Architecture]] | [[Agent Orchestration Patterns]] | [[ProposalEngine]] | [[Deliberation Gate]]*
