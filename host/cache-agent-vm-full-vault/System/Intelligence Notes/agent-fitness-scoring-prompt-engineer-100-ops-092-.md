---
title: "Agent Fitness Scoring: Measurable Reliability Scores per Agent Type"
type: reference
created: 2026-03-20
updated: 2026-04-12
confidence: 0.70
confidence_updated: 2026-04-12
source: "5-day-analysis-2026-03-18, reliability-first-reorg-v1"
summary: "Fitness scoring formula and baseline measurements for dispatch agent routing — weighted composite of success rate, speed, and quality"
tags:
  - dispatch
  - agent-routing
  - fitness
  - reliability
  - performance
  - intelligence
  - best-practice
aliases:
  - agent fitness
  - fitness scoring
  - agent reliability scores
---

# Agent Fitness Scoring

Fitness scoring assigns a measurable reliability number (0.0–1.0) to each agent type in the dispatch system. The score drives routing decisions: high-fitness agents receive high-priority tasks (P0/P1), while low-fitness agents are routed to lower-priority or narrower-scope work. This prevents unreliable agents from blocking critical workflows.

## The Formula

From [[reliability-first-reorg-v1]]:

```
fitness = (success_rate × 0.6) + (speed_score × 0.2) + (quality_score × 0.2)
```

- **success_rate** (60% weight): Fraction of dispatched tasks that complete without failure. This is the dominant factor — an agent that fails frequently is unfit regardless of speed or quality.
- **speed_score** (20% weight): Normalized measure of average runtime relative to the task timeout. An agent that routinely finishes in 2 minutes on a 10-minute timeout scores higher than one that takes 9 minutes.
- **quality_score** (20% weight): Assessed via the evaluator loop — Right Hand does a spec compliance check on completed work (especially for P0/P1 tasks). Quality reflects whether the output actually meets the task description, not just whether it exited 0.

## Baseline Measurements (March 2026)

From the [[5-day-analysis-2026-03-18|5-day analysis]] covering the first operational week of dispatch-engine.sh:

| Agent | Dispatched | Success Rate | Fitness | Constraints / Notes |
|---|---|---|---|---|
| Prompt Engineer | 1 | 100% | **1.00** | Too few data points for statistical confidence |
| Ops | 1 | 100% | **0.92** | Works well; slight speed deduction |
| Vault Keeper | 2 | 0% | **0.54** | Always times out on scope — ≤50 files per task |
| Researcher | 1 | 0% | **0.46** | Rate limited; needs 8min+ timeout |
| Coder | 1 | 0% | **0.20** | Infra failure (PATH issue in cron env, not agent fault) |
| Security | 0 | — | — | Never tested |
| Scout | 0 | — | — | Never tested |

**Total dispatches in 5 days: 6.** The system was designed for dozens of daily dispatches but hadn't reached operating tempo at the time of measurement.

## How Fitness Drives Routing

The dispatch engine (`dispatch-engine.sh`) uses `agent-cards.json` to store per-agent fitness scores, success rates, average runtimes, and failure modes. The routing logic:

1. **Task arrives** with a priority level (P0–P4) and an optional `agent_hint`.
2. **Agent matching** considers fitness: high-fitness agents are eligible for P0/P1 tasks; low-fitness agents are restricted to P3/P4 or narrower scope.
3. **Circuit breaker** suspends agents after 3 consecutive failures. The agent remains suspended until manual reset or health recovery.
4. **Complexity gate** (from [[routing-correction-pattern-dispatch-is-overused-fo|routing correction pattern]]) prevents trivial tasks from being dispatched at all — only tasks with >1 step, requiring external tools, or estimated >5min duration enter the dispatch queue.

## Known Constraints per Agent

These constraints were discovered empirically during the first dispatch week and should be encoded in `agent-cards.json` or AGENTS.md:

- **Vault Keeper**: Must be scoped to ≤50 files per task. Larger batches cause timeouts. Split vault maintenance into smaller chunks.
- **Researcher**: Requires 8-minute minimum timeout (default 5min is too short). Subject to API rate limiting from external sources. Benefits from [[config-off-peak-dispatch-scheduling-route-non-urgent-p3p4|off-peak scheduling]].
- **Coder**: The early 0% success rate was caused by `exit code 127` — Claude Code binary wasn't in cron's PATH. This was an infrastructure bug, not an agent capability issue. After PATH fix, Coder is expected to perform well.
- **Prompt Engineer / Ops**: Both showed strong initial results but with n=1 sample sizes. Statistical confidence requires 10+ task completions per agent.

## Relationship to Multi-Agent Scaling

The [[5-agent-teams-produce-31x-output-improvement-at-7x|multi-agent scaling research]] found that 5-agent teams produce 3.1x output improvement at 7x cost. Fitness scoring helps mitigate this cost inefficiency by ensuring that only capable agents receive tasks, reducing wasted compute on agents likely to fail.

The [[config-add-modelhint--complexity-fields-to-dispatch-task-|model_hint + complexity fields]] proposal would add another routing dimension: not just which agent, but which model (sonnet/opus/haiku) based on task complexity. Fitness scoring and model routing are complementary — fitness measures agent reliability, model hints control cost-per-task.

## Current Status

As of April 2026, `agent-cards.json` has the fitness fields defined but all values are null — the automated computation pipeline (`computeHealthMetrics()` from the [[agent-health-metrics-computation-from-done-tasks-s|agent health metrics pattern]]) hasn't been connected to populate scores from the `dispatch/done/` task files. This remains a gap: fitness-based routing is designed but not yet active.

## Implementation Recommendations

1. **Backfill scores** from `~/dispatch/done/` task files — sufficient data now exists after weeks of operation.
2. **Set minimum sample size** of 10 tasks before a fitness score influences routing (avoids n=1 artifacts like the Prompt Engineer's perfect 1.00).
3. **Decay old scores** — a 30-day rolling window prevents stale measurements from agents that were fixed or degraded.
4. **Expose scores in dashboard** so Trajan can see at a glance which agents are underperforming.
5. **Connect circuit breaker to fitness** — instead of hard 3-failure cutoff, use fitness < 0.3 as the suspension threshold.

---

*Original intelligence extracted from proposal-prop-1774031326-1698a6fd.txt, enriched with context from the 5-day analysis and reliability-first reorg.*
