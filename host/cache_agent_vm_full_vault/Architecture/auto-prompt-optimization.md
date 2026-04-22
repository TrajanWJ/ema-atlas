---
title: "Auto-Prompt Optimization — Applying AdalFlow to OpenClaw Agents"
created: 2026-03-18
updated: 2026-03-18
type: architecture
status: active
source: unknown
---

# Auto-Prompt Optimization — Applying AdalFlow to OpenClaw Agents

**Status:** Design document · March 2026
**Inspired by:** [AdalFlow](https://github.com/SylphAI-Inc/AdalFlow) + [LLM-AutoDiff](https://arxiv.org/abs/2501.16673)

## Core Insight

> The self-evolution protocol we already have IS a manual version of LLM-AutoDiff. The next step: automate the feedback loop.

## The Mapping

| AdalFlow Concept | OpenClaw Equivalent |
|-----------------|-------------------|
| `adal.Parameter(type=PROMPT)` | SOUL.md file — the agent's "weights" |
| `adal.Parameter(type=DEMOS)` | Few-shot examples in SKILL.md files |
| `Generator` template | Prompt template in SOUL.md + skill instructions |
| `eval_fn` (loss function) | Task success metric per agent |
| `Trainer.fit()` | Self-evolution loop: measure → feedback → edit → approve |
| Textual gradients | Natural language critique of agent output |
| Backward engine LLM | The agent reflecting on its own failures |
| `model_kwargs` config swap | Agent model override in OpenClaw config |

## Agent-Specific Metrics (The Loss Function)

Each agent needs a measurable definition of "good":

| Agent | Metrics |
|-------|---------|
| 🔬 **Researcher** | Source quality (authority, recency), claim accuracy, completeness, citation count |
| 💻 **Coder** | Tests pass rate, no regressions, code review score, build success |
| 🔭 **Scout** | Data completeness, source count, extraction accuracy, freshness |
| 🛡️ **Security** | Findings severity, false positive rate, actionable recommendations |
| 📚 **Vault Keeper** | Link health, cross-reference density, knowledge freshness |
| 🤝 **Right Hand** | Task completion, user satisfaction (thumbs up/down), routing accuracy |

## The Automated Self-Evolution Loop

### Current State (Manual LLM-AutoDiff)
```
Agent completes task
  → Human reviews output  
  → Human decides "this could be better"
  → Human edits SOUL.md
  → Agent improves (maybe)
```

### Target State (Automated)
```
Agent completes task
  → Eval function scores output automatically
  → If score < threshold:
      → Backward engine generates "textual gradient" (critique)
      → Gradient applied to SOUL.md as proposed edit
      → Human reviews proposed change (approve/reject)
  → If approved:
      → SOUL.md updated with versioned change
      → Agent improves measurably
```

### Implementation Architecture

```
┌──────────────────────────────────────┐
│ Task Pipeline (Agent doing work)      │
│ SOUL.md → Prompt → Model → Output    │
└──────────────┬───────────────────────┘
               │ output
               ▼
┌──────────────────────────────────────┐
│ Eval Function                        │
│ Score output against success criteria │
│ Return: pass/fail + specific feedback │
└──────────────┬───────────────────────┘
               │ if fail
               ▼
┌──────────────────────────────────────┐
│ Backward Engine (separate LLM call)  │
│ "Given this failure, what should     │
│  change in the system prompt?"       │
│ Output: proposed SOUL.md diff        │
└──────────────┬───────────────────────┘
               │ proposed change
               ▼
┌──────────────────────────────────────┐
│ Human Review Gate                    │
│ Approve / Reject / Modify            │
└──────────────────────────────────────┘
```

## Few-Shot Optimization (SKILL.md Examples)

SKILL.md files contain examples that guide agent behavior. Treat these as DEMOS parameters:

1. **Collect:** Log successful task completions with full input/output
2. **Filter:** Keep only examples that scored well on eval metrics
3. **Select:** Choose diverse subset that covers different task types
4. **Insert:** Add as examples in SKILL.md
5. **Measure:** Did adding these examples improve task performance?

## Implementation Plan

### Phase 1: Instrumentation (Now)
- Add structured eval to Researcher outputs (source count, confidence levels)
- Log all agent task outcomes to `vault/Agent-Learnings/eval-log.md`
- Start collecting success/failure examples

### Phase 2: Semi-Automated Feedback (Soon)
- After each research task, auto-generate a critique using a separate model
- Present critique + proposed SOUL.md change to Trajan for approval
- Track which changes improved metrics

### Phase 3: Automated Training Loop (Later)
- Implement `adal.Trainer` equivalent:
  - Dataset = past session logs (successes + failures)
  - Eval function = automated scoring
  - Optimizer = backward engine generating SOUL.md diffs
- Run training on batches of past tasks
- Present optimized SOUL.md for approval

### Which Agent First?
**Researcher** — most measurable outputs:
- Clearly right or wrong factual claims
- Countable sources
- Assessable completeness
- Existing session logs to train on

## Key Principles from AdalFlow

1. **Isolate sub-prompts:** Don't optimize the entire SOUL.md at once. Break it into sections (voice, methodology, tools, output format) and optimize each independently.

2. **Selective gradient computation:** Focus on failure cases. If an agent succeeds 90% of the time, only generate feedback for the 10% failures.

3. **Teacher model:** Use a higher-capability model (Opus) as the backward engine to generate feedback for a lower-cost agent (Sonnet) that runs tasks.

4. **Graph-centric view:** Agent workflows are computation graphs. Multi-agent handoffs = multi-component pipelines. Optimize the whole graph, not just individual nodes.

## Related
- [[AdalFlow Concepts]] — Source library details
- [[SciTeX Concepts]] — Complementary framework
- [[Scientific Method for Agents]] — Evidence chain architecture
