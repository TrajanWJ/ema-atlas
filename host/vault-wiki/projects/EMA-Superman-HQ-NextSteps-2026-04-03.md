---
title: 'Superman + HQ — Next Steps, Research Gaps, Agent Delegation'
created: '2026-04-03'
updated: '2026-04-03'
type: project
status: active
confidence: 0.95
tags:
  - ema
  - superman
  - hq
  - planning
  - delegation
  - honcho
  - dispatch-board
  - deliberation-gate
summary: >-
  Full session synthesis: 5 implementation gaps, 4 research tasks, 5 agent tasks
  (A-E). A and B first; C/D/E parallel after B.
author: Trajan
wiki_id: projects/EMA-Superman-HQ-NextSteps-2026-04-03
imported_from: vault/Projects/EMA-Superman-HQ-NextSteps-2026-04-03.md
imported_at: '2026-04-04T00:23:56.886Z'
---

# Superman + HQ — Next Steps (2026-04-03)

## Project Status

| Project | Status |
|---|---|
| **EMA** | Phase 1 complete. Execution loop live, WebSocket broadcasting, frontend builds, port orphan fixed. |
| **Superman** | Architecture defined. VaultWatcher + GraphBuilder exist. Knowledge graph engine: not started. |
| **HQ** | Mockups built, architecture locked. Zero real API connections. |
| **OpenClaw** | Running on VPS. oauth-guardian + gateway were down. Bridge dispatch still synchronous/blocking. |
| **Recursive Research System** | Spec v2 locked. Not yet implemented as OpenClaw skill. |

## The 5 Real Gaps

1. **Superman has no running code** — VaultWatcher + static GraphBuilder ≠ intelligent engine
2. **HQ has no real data** — everything renders mock data, `/api/projects/:id/context` doesn't exist
3. **Honcho is not running** — one Docker command away, highest leverage per effort
4. **`.superman` file has no runtime reader** — format designed, nothing reads it at runtime
5. **Campaign topology doesn't exist** — `Ema.Campaigns.Flow` struct not written, dispatch board blocked

## Priority Order

**This week:**
1. `docker run -d -p 8000:8000 plasticlabs/honcho:latest` — do today
2. Fix oauth-guardian + gateway on VPS
3. Write `GET /api/projects/:id/context` — single endpoint that makes HQ real

**Week 7 (parallel):**
- Track A: Dispatch Board (Ema.Campaigns.Flow + step state)
- Track B: Honcho integration (pre-dispatch query, scope advisor, quality gate)
- Track C: Deliberation Gate (StructuralDetector + UI prompt)
- Track D: HQ project context endpoint + project switcher

**Week 8:** Wire HQ to live data. Real executions feed. Real project switcher.

**After Week 8:** Superman knowledge graph generalization to project/client/infrastructure domain.

## The One Metric

> Open HQ → switch to StudioKamel → see actual last commit, actual Render deployment status, actual last EMA execution. Without touching another tab.

Everything before that is construction.

## Research Tasks (→ researcher)

| Task | Topic | Rounds |
|---|---|---|
| R1 | Honcho production deployment patterns | 1-2 |
| R2 | Knowledge graph implementations for Elixir/OTP | 2 |
| R3 | `.superman` file runtime architecture | 1 |
| R4 | WebSocket pattern for HQ (Phoenix + React 19 + Zustand) | 1 |

See: [[Research/Honcho-Deployment-Patterns]], [[Research/Elixir-Knowledge-Graph-Options]], [[Research/Superman-Runtime-Architecture]], [[Research/Phoenix-WebSocket-React-Patterns]]

## Agent Tasks (→ coder)

| Agent | Task | Prerequisite |
|---|---|---|
| A | Honcho setup + integration (EMA backend) | VPS + Docker |
| B | EMA project context API (`/api/projects`, `/api/projects/:id/context`) | None |
| C | Dispatch Board (Campaigns.Flow struct + React component) | B |
| D | Deliberation Gate (StructuralDetector + UI) | None |
| E | HQ project switcher + context-aware dashboard | B |

A and B first. C, D, E parallel after B. Research tasks R1-R4 can start immediately.

## Related

- [[Recursive-Research-System-Spec-v2]]
- [[EMA-Claude-Bridge-Design]]
- [[Agents/OpenClaw]]
