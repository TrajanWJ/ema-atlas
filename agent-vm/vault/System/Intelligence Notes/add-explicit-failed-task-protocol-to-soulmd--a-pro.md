---
title: "Add Explicit Failed Task Protocol to SOUL.md"
type: reference
status: active
created: 2026-03-20
updated: 2026-04-13
tags: [best-practice, agent-reliability, soul-md, error-handling, dispatch, auto-delegator]
confidence: 0.9
source: task-c8542e6a.txt, agent-improvements-2026-03-20.md, codex-capability-gaps-2026-04-04.md
project: Auto Delegator Layer
summary: "SOUL.md needs a concrete failed-task protocol replacing the auto-learned stub that recurred 3 times without resolution."
related:
  - "[[consolidate-duplicate-startup-reads--session-end-s|Consolidate Duplicate Startup Reads]]"
  - "[[Proposal Lifecycle State Machine in proposal-state.json]]"
  - "[[add-complexity-gate-decision-rule-for-claude-code-|Complexity Gate Decision Rule]]"
  - "[[agent-fitness-scoring-prompt-engineer-100-ops-092-|Agent Fitness Scoring]]"
---

# Add Explicit Failed Task Protocol to SOUL.md

> A promoted Auto-Learned stub (recurrence: 3) was never given a concrete recovery format or output template. Agents fail tasks inconsistently because SOUL.md tells them *when* to escalate but not *how* to report failures.

## Problem Statement

The coder agent's SOUL.md contains an auto-learned stub promoted from `.learnings` on 2026-03-19:

```
## Auto-Learned Protocol (promoted from .learnings)
<!-- AUTO-LEARNED: coder.failed | promoted: 2026-03-19T07:38:04Z | recurrence: 3 -->

When status is **failed**: This has occurred 3 times for agent coder.
Review ERRORS.md and add explicit handling protocol above.
```

The system detected a recurring failure pattern three times and promoted it to SOUL.md — but the stub is a *placeholder*, not a protocol. It tells future agents to "add explicit handling protocol above" without defining what that protocol should contain. The result: agents that encounter the stub have no concrete guidance, produce inconsistent failure reports, and the same failure modes recur without organizational learning.

## Why This Matters

**Failure reports are the primary feedback signal in the dispatch system.** The [[Proposal Lifecycle State Machine in proposal-state.json]] tracks proposals through `proposed → dispatched → completed` with terminal states of `success` or `fail`. When a task fails, the quality of the failure report determines whether the system can:

1. **Learn from the failure** — route similar tasks differently next time
2. **Avoid repeat failures** — the fleet shares learnings via `vault/Agent-Learnings/mistakes.md`
3. **Enable human triage** — Trajan can quickly decide whether to retry, reroute, or deprioritize

Without a structured failure format, each agent invents its own. Some write detailed postmortems; others return a one-line "task failed" with no context. The dispatch engine cannot distinguish between "failed because the API was down" (retry later) and "failed because the task is impossible" (deprioritize).

## The Proposed Protocol

The [[consolidate-duplicate-startup-reads--session-end-s|research from 2026-03-20]] proposed a concrete 5-step protocol to replace the stub. The protocol covers the full failure lifecycle:

### 5-Step Recovery Format

When a task fails or an agent returns status `BLOCKED` or `FAILED`:

1. **State what you tried** — enumerate at least 2 distinct approaches attempted before giving up. This prevents premature escalation and documents the solution space already explored.

2. **State what failed** — provide the exact error message, command output, or ambiguity that blocked progress. Vague descriptions like "it didn't work" are insufficient; the next agent (or human) needs enough detail to reproduce or diagnose.

3. **State what would unblock you** — specify the concrete information, file access, credentials, or clarification needed. This converts a dead-end into an actionable request.

4. **Write partial findings to file** — never silently discard work completed before the failure. Even a failed task may have produced useful intermediate results (research, partial implementations, discovered constraints). Write these to disk so they survive the session.

5. **Do NOT retry the same approach a third time** — if two attempts with the same strategy have failed, re-plan or escalate. Retrying the same failing approach is the single most common waste pattern in autonomous agents.

### Output Template

```
STATUS: FAILED
Tried: [approach 1], [approach 2]
Blocked by: [specific reason]
Partial output: [file path or summary]
Would unblock: [what you need]
```

### Fleet Learning Integration

After producing the failure report, append a summary to `vault/Agent-Learnings/mistakes.md` so the agent fleet learns from the failure. This creates a shared knowledge base of what *doesn't* work, which is often more valuable than documenting what does.

## Cross-System Applicability

This protocol was originally proposed for the coder agent's SOUL.md, but the gap exists across the entire agent fleet:

- **Codex agents** — the [[codex-capability-gaps-2026-04-04.md|Codex capability gap analysis]] found that CLAUDE.md has "return BLOCKED" but zero guidance on what to report or how to document failures. The same structured format should be added.
- **Researcher agents** — frequently encounter "no results found" or "sources conflict" scenarios that benefit from structured reporting.
- **Ops agents** — system failures need the most rigorous reporting since they may indicate infrastructure issues affecting multiple agents.

The protocol is agent-role-agnostic — it applies to any SOUL.md or agent configuration file. The [[add-complexity-gate-decision-rule-for-claude-code-|Complexity Gate]] and this protocol together address the two most common recurring corrections in the dispatch system: spawning when unnecessary, and failing without useful output.

## Implementation Status

| Step | Status | Notes |
|------|--------|-------|
| Protocol designed | Done | Proposed in agent-improvements-2026-03-20.md |
| Applied to coder SOUL.md | Unknown | Patch was proposed but application not confirmed |
| Applied to other SOUL.md files | Not started | Researcher, ops, docs-writer, threat-analyst templates lack this |
| Added to CLAUDE.md | Not started | Codex/Claude Code agents need equivalent guidance |

## Connection to Agent Fitness

The [[agent-fitness-scoring-prompt-engineer-100-ops-092-|Agent Fitness Scoring]] system tracks agent performance. Structured failure reports feed directly into fitness scores — an agent that fails with a useful report scores higher than one that fails silently, because useful failures contribute to fleet learning.

---

Tags: #intelligence #best-practice #agent-reliability #soul-md #dispatch
