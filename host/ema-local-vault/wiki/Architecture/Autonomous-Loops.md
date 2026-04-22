---
title: "Autonomous Loop Architectures"
space: wiki
tags: ["architecture","autonomous","loops","patterns"]
source: manual
---

# Autonomous Loop Architectures

Six patterns for running Claude Code autonomously, documented in Obsidian at `.claude/skills/autonomous-loops/SKILL.md`.

## 1. Sequential Pipeline

Simplest pattern. `claude -p "prompt"` chained in bash. Each call is one-shot and stateless — output from one step pipes into the next via files or stdout. No memory between steps.

**When to use:** Scripted CI tasks, simple transforms, linear workflows where each step is independent. Not suitable for tasks requiring iteration or backtracking.

**EMA status:** Not directly used. EMA's execution modes (research → outline → implement → review) follow a similar linear progression but are orchestrated by the Dispatcher rather than bash scripts.

## 2. NanoClaw REPL

Persistent session-based loops using `--session-id`. Maintains conversation context across turns so the agent can build on previous work. The loop reads from a task queue or stdin, feeding work items into a long-running session.

**When to use:** Multi-step research, iterative refinement, any task where the agent needs to remember what it did 3 steps ago. The session persistence eliminates re-prompting overhead.

**EMA status:** Implemented. EMA's Dispatcher + AgentSession is essentially this pattern — each execution gets a session with injected context, and the agent works within that session until completion.

## 3. Infinite Agentic Loop (by disler)

Parent agent spawns child agents via `claude -p`, each handling a sub-task in parallel. Children report back via files, and the parent synthesizes results. The "infinite" aspect comes from the parent continuously generating new sub-tasks from synthesized results.

**When to use:** Parallel research across multiple files or topics, multi-file refactoring where changes are independent. Scales horizontally but requires careful coordination to avoid conflicts.

**EMA status:** Conceptual. EMA's dispatch system could support this via multiple concurrent executions, but the parent-child orchestration layer is not yet built.

## 4. Continuous PR Loop (by AnandChowdhary)

CI-integrated iterative workflow. Each `claude -p` call starts fresh, bridging context via `SHARED_TASK_NOTES.md`. The loop runs: implement → push → wait for CI → read failures → fix → repeat, until the PR passes or hits max iterations.

**When to use:** Automated bugfixes, test-driven development, any workflow where CI provides the feedback signal. The file-based context bridge means each iteration is a clean slate with shared notes.

**EMA status:** Conceptual. Could be built as a pipe (trigger: `system:ci_failed`, action: dispatch execution with failure context), but not yet implemented.

## 5. De-Sloppify Pattern

Dedicated cleanup pass after implementation. One agent writes code, then a separate agent reviews and fixes quality issues. The key insight is that author bias makes self-review unreliable — a fresh agent catches things the implementer normalizes.

**When to use:** Quality enforcement, code standards compliance, any time you want review that isn't compromised by author familiarity. Add as a mandatory post-implementation step.

**EMA status:** Partially implemented. The Proposal Pipeline's Debater stage is this pattern applied to proposals — a separate agent stress-tests what the Generator created. For code, the `review` execution mode serves this role.

## 6. Ralphinho / RFC-Driven DAG (by enitrat)

Multi-agent parallel orchestration with merge queues and conflict resolution. An RFC document drives task decomposition; dependency analysis determines which units can run in parallel. Non-overlapping units land speculatively in parallel branches. Overlapping units rebase one-by-one with eviction context (knowledge of what other agents changed). Complexity tiers control pipeline depth: trivial changes skip research/review, large changes get full scrutiny.

**When to use:** Large-scale refactoring or feature work that spans many files. Requires upfront spec work but enables maximum parallelism. The merge queue strategy is critical — without it, parallel agents create unresolvable conflicts.

**EMA status:** Partially implemented. EMA's dispatch.db tracks execution dependencies, enabling DAG-style scheduling. The complexity tiering maps to execution modes. Full merge queue conflict resolution is not yet built.

## Key Principles

1. **Separate reviewer agents from authors** — eliminates most common missed issues
2. **Add cleanup passes instead of negative instructions** — prevents downstream quality degradation
3. **Spec-driven decomposition before implementation** — upfront dependency analysis enables parallelism
4. **Use persistent notes as context bridge** — each call starts fresh; bridge via files
5. **Complexity-tiered pipeline depth** — trivial changes skip steps; large changes get max scrutiny
6. **Merge queue strategy matters** — parallel work needs conflict resolution strategy

## Relevance to EMA

EMA's dispatch engine is essentially Pattern 2 (NanoClaw REPL) combined with Pattern 6 (DAG scheduling via dispatch.db dependencies). The proposal engine adds Pattern 5 (De-Sloppify via Debater stage).

## Source

Obsidian: `.claude/skills/autonomous-loops/SKILL.md` (613 lines)
Also: `AI Knowledge/Research - AI Spec-Driven Development Patterns 2026.md`

## Related

- [[Dispatch Engine]]
- [[Proposal Pipeline]]
- [[Orchestrator]]
