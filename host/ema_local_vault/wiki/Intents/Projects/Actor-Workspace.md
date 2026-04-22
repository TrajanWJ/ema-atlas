---
title: "Actor Workspace"
intent_level: 2
intent_kind: task
intent_status: implementing
intent_priority: 1
project: ema
parent: "[[Agent-Collaboration]]"
tags: ["project", "actors", "workspace", "collaboration"]
---

# Actor Workspace

First native EMA agent workspace with human-agent collaboration.

## What
Two differently-structured executive management systems (human + agent) operating on the same shared entity graph. Every space, project, and task is a work container with actor-specific data.

## Completed
- Actor schema + CRUD + phase transitions + tags + entity data + commands
- Bootstrap: 4 actors (1 human + 3 agents) on startup; 17 agent definitions exist in code but only 3 seeded
- Agent to Actor FK bridge with slug fallback
- actor_id stamping on tasks and executions (default: human)
- Actor-scoped queries on /api/tasks and /api/executions
- Phase cadence proven (idle to plan to execute)

## Next
- Frontend actor status badges
- Phase cadence automation (advance on work complete)
- Entity data UI
- Agent-registered CLI commands

## Related
- [[Intent-Wiki-Schematic]] -- intents as navigable wiki for both actors
- [[Execution-Engine]] -- executions stamped with actor_id
