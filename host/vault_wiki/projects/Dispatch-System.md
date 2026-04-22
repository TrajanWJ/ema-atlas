---
title: "Dispatch System"
type: reference
created: 2026-04-06
tags: [project, dispatch, task-engine, agents, sqlite, shell]
summary: "Task dispatch engine for assigning work to specialized agents via JSON queue and SQLite"
---

# Dispatch System

Task dispatch engine that assigns work to specialized agents through a structured pipeline. Uses a JSON task queue backed by SQLite for persistence and shell scripts for orchestration.

## Status

- Operational
- Core pipeline functional

## Location

`~/dispatch/`

## Tech Stack

- **Scripts**: Shell (Bash)
- **Queue Format**: JSON task definitions
- **Database**: SQLite (`dispatch.db`)
- **Scheduling**: Cron-based scanning

## Pipeline

1. **Research** — gather context and requirements
2. **Proposal** — generate implementation plan
3. **Implementation** — execute the proposed work
4. **Verification** — validate results against requirements

## Key Features

- Priority queuing for task ordering
- Cron-based queue scanning for automatic pickup
- Result collection and reporting
- Specialized agent routing based on task type

## Architecture Decisions

- Shell scripts for maximum portability and zero runtime dependencies
- SQLite as single source of truth (`dispatch.db`) — no external database needed
- JSON task format for human-readable, easily-inspectable queue items
- Cron scheduling keeps the system simple — no daemon required
- Pipeline stages enforce structured workflow without complex orchestration

## Related

- [[EMA]] — life OS that dispatches tasks through this system
- [[ClaudeForge]] — remote IDE that can submit tasks to dispatch
- [[ExecuDeck]] — command environment with multi-agent orchestration
- [[Agent-OS-Demo]] — demo app with Missions & Pipelines view showing dispatch concepts
