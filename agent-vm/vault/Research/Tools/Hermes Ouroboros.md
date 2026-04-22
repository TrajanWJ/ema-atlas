---
title: "Hermes Ouroboros"
created: 2026-03-16
updated: 2026-03-16
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: external-research
tags: [agents, research, self-improvement, tools]
summary: "Self-improving multi-agent debate system built on NousResearch Hermes-3. Five adversarial AI agents debate every query, an Arbiter synthesizes a verdi"
---
# Hermes Ouroboros — Self-Improving Multi-Agent Council

> Evaluated: 2026-03-16
> Source: https://github.com/Ridwannurudeen/hermes-ouroboros
> Stars: 0 (very new, ~3 days old)

## What It Is

Self-improving multi-agent debate system built on NousResearch Hermes-3. Five adversarial AI agents debate every query, an Arbiter synthesizes a verdict, and the debate becomes DPO training data for self-improvement.

## Architecture

```
User Query → Master Orchestrator → 4 Agents (parallel) → Round 2 Rebuttals → Arbiter → Verdict + DPO Pairs → Self-Improvement Loop
```

### The 5 Agents
| Agent | Tradition | Role |
|---|---|---|
| Advocate | Steel-manning | Build strongest FOR argument |
| Skeptic | Popperian falsification | Find the fatal flaw |
| Oracle | Base-rate empiricism | Report what evidence shows |
| Contrarian | Kuhnian paradigm challenge | Reject the framing entirely |
| Arbiter | Bayesian reasoning | Synthesize with explicit priors → posteriors |

### Modes
- **Red Team** — stress-test ideas, plans, strategies
- **Verify** — fact-check claims against evidence
- **Research** — deep bull/bear analysis

## Key Insight: Debate AS Training Data

The debate itself generates preference data. When the Arbiter picks winners, that creates DPO (Direct Preference Optimization) pairs:
- chosen = aligned agents' arguments
- rejected = overruled agents' arguments
- Each iteration feeds the next fine-tuning round

## What We Can Steal

1. **Adversarial agent pattern** — Our Devil's Advocate agent could be structured like their Skeptic (Popperian falsification mandate)
2. **Multi-perspective synthesis** — The Arbiter's Bayesian synthesis pattern is more rigorous than simple "combine outputs"
3. **Self-improvement via interaction logs** — We could extract preference pairs from our own agent debates for prompt improvement (not fine-tuning, but prompt evolution)

## What We Don't Need
- The actual DPO fine-tuning loop (we use API models, not local fine-tuning)
- NousResearch Hermes-3 dependency
- The full 5-agent debate for every query (too expensive)

## Verdict

Interesting architecture patterns but 0 stars, very new, and the self-improvement loop requires local fine-tuning which doesn't apply to us. **Steal the Skeptic/Arbiter patterns for our Devil's Advocate agent. Skip the rest.**

#tools #research #self-improvement #agents

## Related

- [[Hermes Ouroboros]]
