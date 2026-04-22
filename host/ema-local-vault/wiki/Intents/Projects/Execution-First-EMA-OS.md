---
title: "Execution-First EMA OS"
intent_level: 2
intent_kind: task
intent_status: implementing
intent_priority: 1
project: ema
parent: "[[EMA-OS]]"
tags: ["execution", "runtime", "core-architecture"]
source: manual
---

# Execution-First EMA OS

## What

Replace EMA's disconnected proposal/task/session model with a unified execution-first runtime. Every unit of work is an Execution DB row that links source intent → proposal → agent session → harvested result. Intent lives as markdown in `.superman/intents/<slug>/`. Execution is the runtime bridge.

## Why

Without a unified execution model, work happens in disconnected silos — proposals create tasks, tasks create sessions, but there's no thread connecting "why this work exists" to "what happened." The execution-first model makes every unit of work traceable from intent to outcome.

## Status

**Phase 2, 50% complete.** Sprint 1 backend done.

- Sprint 1 (research): complete
- Sprint 1 (backend): complete — Execution schema, Dispatcher GenServer, Router, IntentFolder, AgentSession all operational
- Frontend ExecutionsApp: not started (deferred to phases 5-6)

## Key Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D1 | `agent_sessions` is separate from `claude_sessions` | `claude_sessions` is a read-only filesystem mirror; `agent_sessions` is EMA's controlled dispatch record |
| D2 | `intent_path` stored as relative path from project root | Portable — doesn't break if project is moved |
| D3 | `result_path` defaults to `intent_path + /result.md` | Predictable convention so Harvester always knows where to write |
| D4 | `requires_approval` defaults true | Safety — autonomous dispatch should be opt-in per execution mode |
| D5 | Execution mode enum: research, outline, implement, review, harvest, refactor | Each mode implies a different agent prompt template and expected output format |
| D6 | Delegation packet is required, not inferred | Vague delegation produces garbage outputs — specificity is a hard constraint |
| D7 | `status.json` tracks clarity (0-10) and energy (0-10) | These reflect actual intent state and drive EMA's recommendation logic |
| D8 | BrainDump items auto-create intent folders | Every execution needs a semantic anchor — auto-creation ensures results have a place to land |
| D9 | Completion callback: inline for local, REST endpoint for remote | Local completions are synchronous; remote agents call `POST /api/executions/:id/complete` |
| D10 | HQ is the ExecutionsApp — standalone surface, not an extension of ProposalsApp | Proposals shape intent, Executions track runtime — different data sources with different lifecycles |

## Design Artifacts

Full design research, outline, and plan live in `.superman/intents/execution-first-ema-os/` (80KB+):
- `intent.md` — what + why
- `signals.md` — 6 architecture signals
- `decisions.md` — 10 numbered design decisions (D1-D10)
- `research.md` — 8 architecture principles, runtime model
- `outline.md` — complete specification with filesystem structure
- `plan.md` — 5-phase implementation plan

## Children

- [[Execution-Engine]] — the runtime dispatch system (level 3 feature)

## Related

- [[EMA-OS]] — parent project
- [[Intent-System]] — how intents link to executions
- [[Superman-System]] — .superman directory structure
