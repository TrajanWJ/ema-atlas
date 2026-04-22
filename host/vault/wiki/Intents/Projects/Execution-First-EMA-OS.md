---
title: "Execution-First EMA OS"
intent_level: 2
intent_kind: task
intent_status: implementing
intent_priority: 1
project: ema
parent: "[[Ship-Core-Loop]]"
tags: ["project", "execution", "runtime", "core"]
---

# Execution-First EMA OS

Replace EMA's disconnected proposal/task/session model with a unified execution-first runtime.

## What
Every unit of work is an Execution DB row that links source intent to proposal to agent session to harvested result. Intent lives as markdown in wiki (and .superman for execution workspace). Execution is the runtime bridge.

## Why
The current architecture has all pieces but no connective tissue:
- Proposals are generated but never executed
- Agent sessions are discovered passively but not linked to proposals
- Results are not harvested back into any semantic state
- No feedback loop from outcomes to intent

Without Execution as a first-class object, EMA is a proposal factory with no actuator.

## Status
Phase 2, 50% complete. Sprint 1 (backend) done. Sprint 2 (frontend) in progress.

## Children
- [[Execution-Engine]]
- [[Actor-Workspace]]

## Design Decisions
- D1: agent_sessions separate from claude_sessions
- D5: 6 execution modes (research/outline/implement/review/harvest/refactor)
- D6: Structured delegation packets required (no vague delegation)
- D8: Brain dumps auto-create intent folders
- D10: HQ is ExecutionsApp (dedicated surface, not ProposalsApp extension)

## Related
- [[depends-on::Ship-Core-Loop]]
- [[related::Intent-Wiki-Schematic]]
