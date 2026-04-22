---
title: "Agent Collaboration"
intent_level: 1
intent_kind: goal
intent_status: active
intent_priority: 1
project: ema
parent: "[[EMA-Life-OS]]"
tags: ["goal", "agents", "collaboration", "workspace"]
---

# Agent Collaboration

Human and agent actors collaborating through shared workspace model.

## What
Both human and agents operate on the same entity graph (tasks, executions, proposals) with mutual visibility, actor-stamped work creation, and phase tracking. Not a task queue -- a collaboration system.

## Current State
First workspace cycle proven:
- 4 actors bootstrapped (1 human + 3 agents); 17 agent definitions in code, 3 seeded
- Tasks/executions stamped with actor_id (default: human)
- Actor-scoped queries working (GET /api/tasks?actor_id=X)
- Phase transitions recorded (idle to plan to execute)
- Entity data collaboration working (agent annotates tasks)
- Bridge between Ema.Actors and Ema.Agents via FK + slug

## Children
- [[Actor-Workspace]]
- [[Intent-Wiki-Schematic]]
