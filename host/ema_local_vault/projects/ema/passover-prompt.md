---
id: "39f22149-3738-4228-8b41-06c7d2e3597d"
title: "EMA Passover Prompt"
space: projects
tags: ["ema"]
source: manual
---

# EMA Passover Prompt — Refined (2026-04-03 21:00 UTC)

> **⚠️ This replaces the earlier passover prompt.** Three exploration agents verified ground truth. Several original claims were wrong. This version is corrected.

## Project Status

| System | Status |
|---|---|
| **EMA** | Phase 1 ✅ complete (commit 5c577f0). Daemon compiles, frontend builds clean. 10 known test failures. |
| **Superman** | Architecture designed. VaultWatcher + GraphBuilder exist. Intelligence engine: not started. |
| **HQ** | UI shells built. ALL data is mock. Zero API connections. |
| **OpenClaw** | Healthy. Gateway + oauth-guardian running. |

## Ground Truth (Verified by Agents)

### EMA Daemon (`~/Projects/ema/daemon/`)
- 346 Elixir modules, 66 migrations, port :4488
- 5 OTP supervision trees: Agents, ProposalEngine, Pipes, SecondBrain, Responsibilities
- Proposal pipeline: Scheduler → Generator → Refiner → Debater → Tagger → Combiner
- WebSocket: 34 Phoenix channels, broadcasting live
- DB: SQLite at `~/.local/share/ema/ema_dev.db`
- CLAUDE.md at daemon root has project-specific rules

**Build status:**
- Compiles with 6 warnings (VaultIndex.semantic_search, Tasks.list_tasks/1, AgentBridge.send_message/3 undefined; unused vars in Temporal)
- 10 test failures: Runner mock arity (5), SecondBrain graph tuple (4), FK constraint (1)
- `erl_crash.dump` from Apr 3 safe to delete

### EMA Frontend (`~/Projects/ema/app/`)
- React 19 + Tauri 2 + Tailwind + glassmorphism
- 56 component dirs, 39+ routable apps in App.tsx
- **60 Zustand stores** (store pattern: `loadViaRest()` + `connect()`)
- Build: **CLEAN** — `tsc -b && vite build` = 0 errors, 250KB gzip

### Infrastructure
- OpenClaw gateway healthy at 192.168.122.10:18789
- OAuth auto-refreshing every 4h via cron
- Bridge sync running (~/shared/, 60s interval)
- Multi-backend bridge staged at ~/shared/inbox-host/vm--ema-bridge-files/ (20 modules, NOT integrated)

## What Doesn't Exist Yet

1. **`/api/projects/:id/context`** — the endpoint that makes HQ real (3-4h work)
2. **`Ema.Campaigns.Flow`** — state machine for campaigns (2h, blocks Dispatch Board)
3. **Superman intelligence engine** — libgraph-based knowledge graph (Week 9)
4. **Honcho integration** — v3 is managed-only, need API key or find v2 Docker image
5. **Async bridge dispatch** — current is synchronous/blocking

## Architecture Decisions (Locked)

| Decision | Choice |
|---|---|
| Knowledge graph | libgraph (pure Elixir) + ETS persistence |
| WebSocket pattern | phoenix npm + Zustand store (not React state) |
| MCP topology | 3 servers: EMA Core (:4489), Vault (:4491), OpenClaw (internal) |
| Superman runtime | VaultWatcher → IntentParser → libgraph → spawn-time injection |
| Prompts storage | EMA DB (versioned, hot-reload, A/B testable) |
| Store pattern | `loadViaRest()` initial + `connect()` for Phoenix channel sync |

## Phase 2 Roadmap

### Week 7: Foundation
- Campaign.Flow struct + Dispatch Board
- Bridge integration (replace 6 Runner.run() callsites)
- Prompts table + hot-reload in daemon
- `/api/projects/:id/context` endpoint

### Week 8: Intelligence
- Scope Advisor + Deliberation Gate + Reflexion Injection
- HQ → live data (project context + WebSocket)
- Outcome tracking → EMA table + vault sync

### Week 9: Superman + Self-Improvement
- Superman knowledge graph (libgraph + VaultWatcher)
- PromptOptimizer GenServer (weekly A/B test)
- Metrics dashboard (prompt success by version)

## The One Metric

> Open HQ → switch to StudioKamel → see actual last commit, actual Render deployment status, actual last EMA execution. Without touching another tab.

## Key Vault Docs

- `vault/Projects/EMA Master Knowledge Base.md` (33.7 KB)
- `vault/Projects/EMA Phase 2 Implementation Guide.md` (34.5 KB)
- `vault/Projects/EMA-Superman-HQ-NextSteps-2026-04-03.md` (3.5 KB)
- `vault/Architecture/EMA-Workflow-Analysis-2026-04-03.md` (11.7 KB)
- `vault/System/EMA-Bootstrap-Metaprompting-Workflow.md` (comprehensive)
- `vault/Research/Honcho-Deployment-Patterns.md` (Honcho v3 ≠ self-hosted)
- `vault/Research/Elixir-Knowledge-Graph-Options.md` (libgraph chosen)
- `vault/Research/Superman-Runtime-Architecture.md` (4-stage pipeline)
- `vault/Research/Phoenix-WebSocket-React-Patterns.md` (Zustand + phoenix npm)

## Session Best Practices

See pinned message in Discord #ema-sessions for full checklist.
Quick version:
1. Load this doc + Master KB + Phase 2 Guide
2. Verify build state (5 min)
3. Post session start message to #ema-sessions
4. When stuck >1h: escalate with logs
5. Before commit: `mix test` + `npm run build`
6. Post session end message with commits + next blocker

---

**Last updated:** 2026-04-03 21:00 UTC  
**By:** Right Hand  
**Confidence:** 0.90 (agent-verified ground truth + 4 research reports)
