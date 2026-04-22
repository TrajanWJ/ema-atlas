---
id: "90ea7293-4d52-4fd0-8171-31c02cdbe789"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Feedback Loop & Evolution Patterns
tags: [research, evolution, feedback, self-improvement, critical]
source: session-2026-04-07
---

# Feedback Loops & Evolution — 17 Systems Analyzed

## EMA Has 8 Components (ALL DISCONNECTED)
1. UCB1 Agent Routing — works but no contextual awareness
2. Prompt A/B Testing — fixed buckets, no feedback
3. Outcome Tracking — JSON file, not queryable, no seed linkage
4. Reflection Loop — heuristic classification (not LLM)
5. Signal Processor — aggregates but no signal→action loop
6. Agent Fitness Store — fixed deltas, no decay
7. Autonomous Improvement Engine — creates proposals, doesn't execute
8. Evolution Rules — manual only, disconnected from signals

## CRITICAL: Signal→Action Loop Missing
Signals recorded → nothing happens. Need:
Signal → draft evolution rule → auto-activate → measure → revert if bad

## Top 5 Wiring Actions
1. Close Signal→Action loop (1-2 days)
2. PromptWizard-style variant optimization (3-4 days) — 60x token efficiency
3. LLM-based outcome evaluation vs heuristics (2-3 days)
4. Seed quality tracking: seed→proposal→outcome chain (1-2 days)
5. Contextual bandits upgrade for UCB router (2-3 days)

## Key External Systems
- AlphaEvolve — evolutionary LLM algorithm design
- Reflexion — episodic reflection memory (10-20pt coding boost)
- PromptWizard — 60x token cost reduction via feedback-driven optimization
- Thompson Sampling — better than UCB for non-stationary environments
- Population Based Training — run N agent variants, evolve hyperparameters
