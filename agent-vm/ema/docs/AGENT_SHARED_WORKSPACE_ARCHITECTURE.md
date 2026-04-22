# Agent Shared Workspace Architecture

## Intent

EMA needs a repo-owned shared workspace on the agent VM so current agents can work together without losing context across random folders.

This is an architectural primitive, not just a convenience directory.

## Role in EMA

The shared workspace sits between:
- EMA canonical graph / docs
- EMA runtime/control-plane state
- active agent sessions on the VM

It provides a **human-readable, agent-friendly collaboration surface** for the period between raw activity and canonical promotion.

## Path

Primary path:
- `/home/trajan/Projects/ema/workspace/shared/`

## Architectural position

### Canonical graph
Durable truth:
- intents
- proposals
- approvals
- executions
- canon updates

### Shared workspace
Operational collaboration:
- handoffs
- decomposition notes
- schedules/agendas
- session breadcrumbs
- swarm coordination artifacts

### Runtime layer
Live supervised state:
- session GenServers
- clocks/cadences
- control-plane records
- PubSub / swarm coordination

## Principle

The shared workspace is:
- more structured than random scratch space
- less authoritative than canon
- easier for agents to use than digging through the whole repo

## Initial folder set

```text
workspace/shared/
├── README.md
├── WORKSPACE_CONTRACT.md
├── inbox/
├── handoffs/
├── actors/
├── plans/
├── schedules/
├── tasks/
├── sessions/
├── swarm/
├── scratch/
└── exports/
```

## Future integration points

Later, EMA can layer on:
- CLI commands that read/write this workspace
- daemon watchers indexing selected subfolders
- automated promotion into canon entities
- computed agendas/task views from files in `schedules/` and `tasks/`
- actor-scoped workspace views

## Why build it early

This solves an immediate problem now:
- agents getting lost on the VM
- work products becoming undiscoverable
- handoffs failing because there is no known shared location

It also gives EMA a concrete place to stage agent-side project management and temporal planning before richer GUI/runtime integrations exist.
