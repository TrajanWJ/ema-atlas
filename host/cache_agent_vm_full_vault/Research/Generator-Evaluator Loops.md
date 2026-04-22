---
title: "Generator-Evaluator Loops"
created: 2026-04-01
updated: 2026-04-01
type: reference
status: active
confidence: 0.85
tags: [generator-evaluator, harness-engineering, quality-gates, iteration, patterns]
summary: "The generator-evaluator loop pattern — how RalphCTL, Harness Evolver, and EMA's proposal pipeline use iterative generation with quality feedback to produce better outputs."
---

# Generator-Evaluator Loops

## The Pattern

Don't accept the first output. Generate, evaluate, feed back, regenerate — iterate until a quality threshold passes or a budget is exhausted.

```
Seed/Task
  → Generate (using model + context)
  → Evaluate (independent check — different model, linter, test suite, human)
  → Pass? → Accept output
  → Fail? → Feed evaluation back as context → Regenerate
  → Budget exhausted? → Accept best-effort with warnings
```

## Why It Works

From Anthropic's own engineering blog on harness design for long-running apps: the generator and evaluator should be **independent**. The generator optimizes for completeness. The evaluator optimizes for correctness. Tension between them produces better results than either alone.

## Implementations

### RalphCTL
- Generator: Claude Code or GitHub Copilot executes a task
- Evaluator: Independent AI review of the task output
- Loop: Iterates until quality passes or budget exhausted
- Scope: Per-task, within a sprint

### Harness Evolver
- Generator: 5 parallel proposers modify harness code
- Evaluator: LangSmith-based evaluation + LLM-as-judge
- Meta-loop: Winners merged, losers discarded, next generation spawned
- Scope: Evolves the harness itself, not the output

### Citadel /review
- Generator: Claude Code writes/edits code
- Evaluator: 5-pass structured review (correctness, style, security, performance, tests)
- Not a loop per se — review happens post-completion, but findings feed next session

### EMA Proposal Pipeline (Designed, Not Yet Implemented)
```
Seed → Generator (opus) → Raw Proposal
  → Refiner (sonnet) → Strengthened Proposal  
  → Debater (opus) → Steelman + Red Team + Synthesis
  → Tagger (haiku) → Categorized + Scored
  → Quality Gate → Accept to queue OR regenerate with feedback
```

## Design Principles

### 1. Independence
Generator and evaluator should not share state. Ideally different models, different prompts, different system instructions. If the same model generates and evaluates, it'll rubber-stamp its own work.

### 2. Bounded Iterations
Always cap iterations. Recommended: **max 3 attempts**. After 3 failures:
- Accept best-effort with quality warnings
- Escalate to human
- Skip and move to next task

### 3. Feedback Specificity
Don't just say "try again." Feed the evaluation result as context:
```
"Your previous attempt failed these checks:
1. Missing error handling in auth.py line 45
2. Test coverage dropped from 82% to 71%
3. Import 'foo' is unused

Fix these specific issues."
```

### 4. Budget Awareness
Each iteration costs tokens. Track cumulative cost per task:
```
Iteration 1: 5,000 tokens ($0.02)
Iteration 2: 7,000 tokens ($0.03) — addressed 2/3 issues
Iteration 3: 4,000 tokens ($0.015) — all issues resolved
Total: 16,000 tokens ($0.065)
```

On Max plan, budget = time against 5h rolling window, not dollars.

### 5. Different Models Per Stage
| Stage | Recommended Model | Why |
|---|---|---|
| Generate | opus | Maximum creativity and completeness |
| Evaluate | sonnet | Cheaper, focused on correctness checks |
| Quick tag/classify | haiku | Cheapest, just structured extraction |
| Final review | opus | Catch subtle issues |

## Anti-Patterns

❌ **Same-model self-evaluation** — Model reviews its own output, always says it's great.
❌ **Unbounded loops** — Iterates 10+ times, burning context window and tokens.
❌ **Generic feedback** — "Please improve this" without specific failures.
❌ **No budget tracking** — 50 iterations later, you've spent $5 on a $0.02 task.
❌ **Evaluator harder than generator** — If evaluation criteria are stricter than what the model can achieve, you loop forever.

## Application to EMA

The proposal pipeline already has the right structure (generator → refiner → debater → tagger). The missing piece is the **feedback loop** — if the quality gate fails, the proposal should cycle back to the refiner with specific failure reasons, not just die.

```elixir
defmodule Ema.ProposalEngine.QualityGate do
  @max_iterations 3
  
  def evaluate(proposal, iteration \\ 1) do
    checks = [
      check_completeness(proposal),
      check_actionability(proposal),
      check_risks_identified(proposal),
      check_scope_bounded(proposal)
    ]
    
    failures = Enum.filter(checks, &match?({:fail, _}, &1))
    
    cond do
      failures == [] -> {:accept, proposal}
      iteration >= @max_iterations -> {:accept_with_warnings, proposal, failures}
      true -> {:regenerate, format_feedback(failures)}
    end
  end
end
```

## Cross-References
- [[Harness Engineering Discipline]] — broader context
- [[Citadel Architecture Deep Dive]] — Citadel's approach to quality
- [[EMA Claude Bridge Design]] — where this fits in EMA
