---
title: "Execution Engine"
intent_level: 3
intent_kind: feature
intent_status: active
intent_priority: 2
project: ema
parent: "[[Ship-Core-Loop]]"
tags: ["feature", "execution", "dispatch", "runtime"]
---

# Execution Engine

## What

Execution-first runtime: every unit of work is an Execution DB row that links source intent → proposal → agent session → harvested result. The Dispatcher dispatches executions to Claude agents with injected context (project memory, reflexion lessons, intent state).

## Why

EMA needs a single model for "work happening" — whether triggered by brain dump, proposal approval, manual dispatch, or automated pipe. Executions are the runtime thread; intents are the semantic anchor.

## Status

**Backend: operational.** Dispatcher, Router, IntentFolder, AgentSession all implemented and running.

**Frontend:** ExecutionsPage exists in LaunchpadHQ (hq-frontend). Phases 5-6 (execution events timeline, agent session viewer, diff viewer) deferred.

## Components

| Module | Source | Purpose |
|--------|--------|---------|
| Dispatcher | `daemon/lib/ema/executions/dispatcher.ex` | GenServer dispatching approved executions to agents |
| Router | `daemon/lib/ema/executions/router.ex` | Pure classification logic — mode selection |
| IntentFolder | `daemon/lib/ema/executions/intent_folder.ex` | `.superman/intents/` disk management |
| AgentSession | `daemon/lib/ema/executions/agent_session.ex` | Per-execution agent session tracking |
| Event | `daemon/lib/ema/executions/event.ex` | Execution event log |

## Execution Modes

| Mode | Agent Role | Reads | Writes | Phase |
|------|-----------|-------|--------|-------|
| research | researcher | — | research.md | exploration (1) |
| outline | outliner | research.md | outline.md, decisions.md | specification (2) |
| implement | implementer | plan | result.md | execution (3) |
| review | reviewer | result | result.md | validation (4) |
| refactor | refactorer | result | result.md | maintenance (4) |
| harvest | harvester | result | result.md | maintenance (5) |

## Children

No child intents currently defined. Execution engine is a leaf feature of [[Ship-Core-Loop]].

## Related

- [[Execution-System]] — Full architecture documentation
- [[Intent-System]] — How intents link to executions
- [[Reflexion-System]] — Lessons injected pre-dispatch
- [[depends-on::Actor-Workspace]] — executions stamped with actor_id
- [[related::Proposal-Pipeline]] — approved proposals create executions
