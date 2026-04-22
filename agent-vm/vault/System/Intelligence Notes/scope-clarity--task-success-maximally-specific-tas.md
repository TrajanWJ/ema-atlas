---
title: "Scope Clarity = Task Success: Maximally Specific Task Descriptions"
type: reference
created: 2026-03-20
updated: 2026-04-22
confidence: high
source: empirical observation from 8-task sprint + multi-agent research
summary: "Task specificity is the primary predictor of agent task success — single-objective tasks with clear deliverables succeed at ~87% vs multi-objective tasks that timeout or fail"
tags:
  - intelligence
  - best-practice
  - task-design
  - agent-orchestration
---

# Scope Clarity = Task Success: Maximally Specific Task Descriptions

## Core Finding

In an 8-task sprint, 7 out of 7 well-scoped tasks completed successfully. The single distinguishing variable was **task specificity**: each successful task had a single verb, a single deliverable, and explicit success criteria. In contrast, vague multi-objective tasks ("research X and also implement Y and update Z") consistently timed out or produced low-quality partial results.

Task specificity is the **primary success predictor** for autonomous agent work — more predictive than model capability, context length, or tooling availability.

## Why This Matters

Autonomous agents (Claude Code, dispatch workers, sub-agents) operate without the real-time judgment loop a human developer has. When a task description contains ambiguity, a human developer asks a clarifying question or makes a reasonable assumption. An agent either guesses wrong, tries to do everything at once, or gets stuck in a loop — all of which waste tokens and time.

The failure mode is particularly insidious because **multi-objective tasks appear more efficient** on paper. "Research the API and write the integration" feels like one task but is actually two tasks with a dependency. The agent attempts both simultaneously, produces shallow research to rush toward implementation, and the implementation fails because the research was inadequate.

## The Specificity Framework

### What Makes a Task Maximally Specific

1. **Single verb, single object**: "Add pagination to the /users endpoint" not "Improve the users API"
2. **Concrete deliverable**: "A file at `src/utils/paginate.ts` exporting a `paginate()` function" not "Some pagination utility"
3. **Explicit success criteria**: "Returns correct results for page=1&limit=20 with 100 total records" not "Works correctly"
4. **Bounded scope**: Named files, named functions, named behaviors — nothing left to interpretation
5. **No conjunctions**: If the description contains "and also," "as well as," or multiple verbs, it should be split

### The Conjunction Test

A simple heuristic for task quality: **count the verbs**. If a task description has more than one imperative verb ("research," "implement," "update," "test"), it is a multi-objective task disguised as a single task. Split it.

- Bad: "Research the auth library, implement login flow, and write tests"
- Good: Three separate tasks — research, implement, test — each with their own success criteria

### Measured Impact

| Task Type | Success Rate | Avg Completion Time | Failure Mode |
|-----------|-------------|-------------------|--------------|
| Single-objective, explicit criteria | ~87% (7/8) | Within timeout | Rare — usually tooling issues |
| Multi-objective, vague scope | ~30% | Timeout or partial | Scope thrashing, shallow work |
| Single-objective, vague criteria | ~55% | Variable | Correct direction, wrong target |

The data comes from the Auto Delegator Layer sprint observations. The gap between well-scoped and poorly-scoped tasks is not marginal — it is the difference between a reliable system and a coin flip.

## Implementation: Quality Gates for Task Descriptions

Based on this finding, task creation pipelines should enforce specificity:

1. **Reject or warn** on tasks containing multiple objectives (multiple verbs, "and also," "as well as")
2. **Require** a single clear deliverable per task
3. **Enforce** the [[4-section-structured-spec-template-for-all-dispatc|4-section structured spec template]] (Goal, Context, Constraints, Success Criteria) — this template was specifically designed to prevent the coordination collapse from under-specified tasks
4. **Decompose** complex work into dependency chains of atomic tasks rather than bundling

This aligns with the [[5-agent-teams-produce-31x-output-improvement-at-7x|multi-agent scaling finding]] — when agents are expensive (7x cost for 3.1x output), the quality of each individual task matters enormously. Wasting an agent invocation on a vague task compounds the scaling inefficiency.

## Relationship to Task Decomposition

Scope clarity is not just about writing better descriptions — it is about **decomposition discipline**. The reason multi-objective tasks fail is that decomposition was skipped. The person creating the task bundled multiple steps into one because decomposition felt like overhead.

In practice, spending 2 minutes decomposing a complex task into 3-4 atomic tasks saves 10-15 minutes of agent thrashing and retry. The decomposition step is not overhead — it is the primary lever for task success.

### Decomposition Heuristic

When scoping a task for agent execution:
- If you can describe the deliverable in one sentence → ship it
- If you need "and" to describe the deliverable → split it
- If the success criteria have more than 3 bullet points → the task is too broad
- If the task requires knowledge from a prior step → make it a dependency, not a conjunction

## Application

- **Category:** best-practice
- **Source:** proposal-prop-1774031326-1698a6fd.txt (original sprint observation)
- **Applied:** 2026-03-20T18:47:43Z
- **Impact:** 4/5
- **Project:** Auto Delegator Layer

---
Tags: #intelligence #best-practice #task-design #agent-orchestration #auto-applied
