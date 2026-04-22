---
title: "Routing Correction Pattern: Complexity Gate for Agent Dispatch"
type: reference
created: 2026-03-20
updated: 2026-04-12
confidence: high
source: operational experience, corrections.md patterns
tags: [best-practice, dispatch, complexity-gate, agent-routing, auto-delegator]
summary: "Apply a complexity gate before spawning agents — trivial tasks should execute inline, not dispatch"
---

# Routing Correction Pattern: Complexity Gate for Agent Dispatch

## Problem Statement

Agent dispatch systems tend toward overuse. When a dispatch mechanism exists, the default behavior drifts toward routing *every* task through it — including trivial ones that a single inline execution could handle in seconds. This creates unnecessary overhead: agent startup cost, context serialization, result parsing, and queue contention — all for work that didn't need coordination in the first place.

This pattern was identified from repeated routing corrections in the [[Intelligence Extractions|corrections log]], where consecutive corrections flagged trivial task spawning as wasteful. The Auto Delegator Layer was dispatching P3/P4 single-step tasks (file reads, simple lookups, config checks) through the full agent pipeline, burning tokens and wall-clock time on orchestration that exceeded the cost of the work itself.

## The Complexity Gate Pattern

A **complexity gate** is a pre-dispatch filter that evaluates whether a task warrants agent spawning or should be handled inline (direct execution without dispatch). The gate sits between task intake and the dispatch router.

### Decision Criteria

A task should be **dispatched to an agent** only when it meets at least one of:

1. **Multi-step execution**: The task requires more than one discrete step (e.g., read file → analyze → write result → validate)
2. **External tool dependency**: The task requires tools or capabilities not available in the current execution context (web search, MCP tools, specialized agents)
3. **Estimated duration > 5 minutes**: The task's expected wall-clock time exceeds the overhead cost of dispatch
4. **Parallelization benefit**: The task can be decomposed into independent subtasks that benefit from concurrent execution
5. **Isolation requirement**: The task modifies state and needs a clean worktree or sandboxed environment

If none of these criteria are met, the task should be executed inline with the result logged as `direct-execute`.

### Implementation Pattern

```bash
# Pseudocode for complexity gate in dispatch router
evaluate_complexity() {
    local task="$1"
    local steps=$(estimate_steps "$task")
    local needs_external=$(check_external_deps "$task")
    local est_duration=$(estimate_duration "$task")

    if [[ $steps -le 1 && "$needs_external" == "false" && $est_duration -lt 300 ]]; then
        echo "direct-execute"
        return 0
    fi
    echo "dispatch"
    return 0
}
```

The gate should be implemented in `dispatch.sh` or `proposal-engine-v2.sh` — wherever the routing decision is made. Skipped dispatches should be logged with reason codes so the gate's effectiveness can be measured.

## Why This Matters

### Cost Amplification

Agent dispatch has fixed overhead regardless of task complexity:
- **Token cost**: System prompts, tool definitions, and context injection consume tokens before any work begins. A simple file-read task might cost 5K tokens inline but 30K+ tokens through dispatch (system prompt alone).
- **Latency**: Agent startup, tool negotiation, and result serialization add 10-30 seconds of wall-clock time per dispatch.
- **Queue contention**: Trivial tasks in the dispatch queue delay substantive work. If the system has concurrency limits (e.g., max 3 active agents), a wave of trivial dispatches blocks meaningful parallelism.

### The Overhead Crossover Point

There exists a crossover where dispatch overhead exceeds task cost. For the Auto Delegator Layer, empirical observation suggests:
- Tasks under ~2 minutes of work are almost always cheaper to execute inline
- Tasks requiring only reads (no writes, no external calls) rarely benefit from dispatch
- Single-file operations (grep, read, simple edit) should never dispatch

### Avoiding the Dispatch Hammer

When you have a dispatch system, everything looks like a dispatchable task. This is the classic "hammer and nail" anti-pattern applied to agent orchestration. The complexity gate is the discipline that prevents it. Without it, systems drift toward dispatching everything because:
- It feels "safer" to delegate (someone else's problem)
- The dispatch path is the default/happy path in the code
- There's no feedback loop showing the cost of unnecessary dispatch

## Related Patterns

- [[add-complexity-gate-decision-rule-for-claude-code-|Complexity Gate Decision Rule]]: The companion note proposing a 3-part decision rule for SOUL.md thresholds
- [[priority-tiered-auto-dispatch-routing-p3p4-non-des|Priority-Tiered Dispatch Routing]]: Safety routing based on priority and destructiveness — complementary to complexity gating
- [[intelligence-preprocess-skip-gate-skip-expensive-i|Intelligence Preprocess Skip Gate]]: Similar guard pattern applied to preprocessing — skip expensive operations when task is already in terminal state
- [[5-agent-teams-produce-31x-output-improvement-at-7x|Agent Teams Output Improvement]]: Context on when multi-agent dispatch *is* justified (complex, parallelizable work)

## Operational Notes

- **Origin**: Extracted from `task-e66d5b3f.txt` on 2026-03-20, following two consecutive routing corrections in corrections.md
- **Impact**: 4/5 — directly reduces token waste and improves dispatch queue throughput
- **Project**: Auto Delegator Layer
- **Status**: Pattern identified and documented; implementation in dispatch router recommended

## Key Takeaway

The cheapest agent call is the one you don't make. A complexity gate ensures dispatch is reserved for work that genuinely benefits from agent orchestration, while trivial tasks execute inline at a fraction of the cost.
