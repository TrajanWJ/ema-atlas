---
title: "Agent Dispatch Empty Task Content Bug"
created: 2026-03-31
type: operational-note
status: active
tags: [agents, dispatch, debugging, right-hand, orchestration]
summary: "Tasks can be picked up by dispatch-engine and routed to agents with no actual task content. This is a known failure mode requiring input validation at dispatch time."
summary: "Tasks can be picked up by dispatch-engine and routed to agents with no actual task content. This is a known failure mode requiring input validation at dispatch time."
source: session-fragments (auto-knowledge scanner, consolidated manually)
---

# Agent Dispatch Empty Task Content Bug

## The Problem

During multi-agent orchestration sessions, tasks have been routed to agents (notably Coder) where the task payload contained no actual content — just metadata, empty strings, or partial fragments. The agent receives the dispatch but has nothing meaningful to work on.

Observed symptoms:
- Agent reports `DONE` immediately with no substantive output
- Agent produces generic/hallucinated work unrelated to any real task
- Dispatch appears successful in TASKS.md but output is useless

## Root Cause Pattern

The dispatch pipeline can lose task content when:
1. **Right Hand summarizes** instead of forwarding the original task text
2. **Template variables aren't filled** — spawn prompt uses a placeholder that was never replaced
3. **Context truncation** — task description was at the end of a long message that got cut
4. **Chained dispatch** — Orchestrator passes task reference to Right Hand, Right Hand passes to Coder, but the actual text doesn't travel with it

## Fix Applied

When dispatching, always include the verbatim task content in the spawn prompt — not a reference to it, not a summary. The agent only has what you give it.

Checklist before every dispatch:
- [ ] Does the prompt contain the actual task description?
- [ ] If chaining from Orchestrator, did I copy the task text, not just the task ID?
- [ ] Is the prompt > 1 sentence? (Single-sentence tasks are usually incomplete)

## Detection

If an agent returns output suspiciously fast or clearly unrelated to the task:
1. Check what was actually in the spawn prompt
2. Look for empty `task:` fields or placeholder text
3. Re-dispatch with the complete task content

## Related

- [[AGENTS.md]] — Dispatch protocol
- [[memory/agent-performance.md]] — Coder failure log (infra vs. content issues)
- [[TASKS.md]] — Task tracking
