---
title: "EMA"
space: wiki
tags: ["projects","ema","primary"]
source: manual
updated: 2026-04-06
---

# EMA — Executive Management Assistant

Personal AI desktop app: autonomous thinking companion and life OS.

## Quick Info

| Field | Value |
|-------|-------|
| Path | `~/Projects/ema` |
| Stack | Elixir/Phoenix 1.8 + Tauri 2 + React 19 + SQLite |
| Daemon | localhost:4488 |
| Slug | `ema` |
| Phase | LaunchpadHQ frontend expansion, backend mature |
| Modules | ~673 (daemon/lib/) |
| Migrations | 117 |
| Frontend Apps | 52+ vApps (Tauri app) + 8 pages (LaunchpadHQ web) |
| Stores | 73 (Tauri app) + 9 (LaunchpadHQ) |
| Tables | 84 |
| REST Routes | 318+ |
| Channels | 37 |
| MCP Tools | 23 |

## Surfaces (Entry Points)

| Surface | Stack | Port | Status |
|---------|-------|------|--------|
| Tauri Desktop | React 19 + Zustand + Tauri 2 | 1420 (dev) | Working, 52+ vApps |
| **LaunchpadHQ** | React 18 + Zustand + Vite | 5173 (dev) | **NEW — 8 pages, wired to daemon** |
| CLI | Elixir escript v3 | — | Working, 55+ commands |
| MCP Server | JSON-RPC 2.0 / stdio | — | Working, 23 tools + 10 resources |
| Discord Bridge | 7 semantic lanes | — | Babysitter integration |
| Jarvis Orb | Always-on 80×80 Tauri window | — | Stub |

## LaunchpadHQ (hq-frontend/) — NEW

Web-accessible command center at `~/Projects/ema/hq-frontend/`. Rewired from dead hq-api (port 3002) to the real Phoenix daemon (port 4488). Uses Phoenix WebSocket channels for real-time sync.

### Pages (9)
1. **Dashboard** — Stat cards (running/projects/inbox/approval/completed), execution feed, agent dispatch, brain dump widget, today widget (journal + habits)
2. **Projects** — CRUD, color picker, linked_path, slug
3. **Executions** — Full lifecycle (created→approved→running→completed/failed), approve/cancel actions, mode/status filters
4. **Agents** — Dispatch executions with mode selection, registered agent actors list
5. **Brain Dump** — Capture, process/delete, unprocessed vs processed sections
6. **Intents** — 6-level hierarchy (L0 Vision → L5 Step), grouped by level, status/kind/priority, create modal
7. **Actors** — Human + agent actors, phase visualization (plan→execute→review→retro), transition history, manual phase advance
8. **Spaces** — Space management grouped by org, type badges (personal/team/project), active space switching
9. **Orgs** — Organization CRUD, member management, invitation link generation/revocation

### Stores (9)
projectStore, executionStore, actorStore, spaceStore, orgStore, tagStore, intentStore, dashboardStore, uiStore

### Sidebar Groups
- **Core:** Dashboard, Projects, Executions
- **Intelligence:** Intents, Brain Dump, Agents
- **Management:** Actors, Spaces, Orgs

### Build
```bash
cd hq-frontend
npm install
npm run dev    # Vite on :5173, needs daemon running on :4488
npm run build  # tsc + vite build → dist/
```

## Major Subsystems

### Core CRUD Contexts
BrainDump, Tasks, Projects, Proposals, Habits, Journal, Settings, Workspace, Responsibilities, Goals, Focus, Notes, Canvas, VaultIndex, AppShortcuts

### Supervised OTP Systems

| System | Purpose |
|--------|---------|
| Proposal Engine | 9-stage pipeline: Scheduler, Preflight, Generator, Refiner, Debater, Scorer, Tagger, Combiner, KillMemory |
| Agents | DynamicSupervisor, per-agent workers with memory compression, webchat bridge |
| Second Brain | VaultWatcher, GraphBuilder, SystemBrain state projections |
| Pipes | EventBus-driven automation (22 triggers, 15 actions, 7 stock pipes) |
| Claude Sessions | SessionWatcher (JSONL import), SessionMonitor (process detection) |
| Responsibilities | Scheduler + HealthCalculator |
| Canvas | DataRefresher + live data sources |
| AI Bridge | SmartRouter (6 strategies), QualityGate, cost tracking, circuit breakers, multi-provider rotation |
| IntentionFarmer | Harvest sessions/signals, parse, clean, bootstrap, emit vault notes |
| Intent Engine | Unified semantic hierarchy (intents, intent_links, intent_events), Populator, IntentProjector |
| Intelligence | TokenTracker, TrustScorer, VmMonitor, CostForecaster, UCBRouter, VaultLearner, BudgetEnforcer, GapScanner |

### Three Truth Domains

1. **Semantic (Intent Engine)** — Filesystem `.superman/intents/<slug>/` canonical, DB runtime queryable. 6 levels L0-L5.
2. **Operational (Home Domains)** — Executions, sessions, proposals, tasks, goals in home tables. Bridged via IntentLink.
3. **Knowledge (Multi-source)** — Curated wiki > generated projections > imported mirrors. Agent-writability rules.

### Architecture Canvas
Canvas `cvs_1775522736219_05ef3ec2` in EMA project — 67 elements across 6 architectural layers with connections and sidebar annotations.

### CLI
Elixir escript, v3.0.0. 20+ command groups, 55+ subcommands including `em status`, `em phases`, `em velocity`, `em advance`, `ema intent`, `ema actor`, `ema space`, `ema tag`. Native MCP stdio server for Claude Code integration.

## Key File Paths

| What | Path |
|------|------|
| Daemon entry | `daemon/lib/ema/application.ex` |
| Router | `daemon/lib/ema_web/router.ex` |
| Intent Engine | `daemon/lib/ema/intents/` |
| IntentionFarmer | `daemon/lib/ema/intention_farmer/` |
| MCP tools | `daemon/lib/ema/mcp/tools.ex` |
| CLI | `daemon/lib/ema/cli/` |
| Tauri frontend | `app/src/main.tsx` |
| **LaunchpadHQ** | `hq-frontend/src/App.tsx` |
| **HQ API client** | `hq-frontend/src/api/hq.ts` |
| **HQ socket** | `hq-frontend/src/api/socket.ts` |
| Glass CSS | `app/src/globals.css` |
| HQ CSS | `hq-frontend/src/index.css` |
| App configs | `app/src/types/workspace.ts` |
| Vault data | `~/.local/share/ema/vault/` |
| DB | `~/.local/share/ema/ema.db` |
| Canvas seed | `daemon/priv/repo/seed_architecture_canvas.exs` |

## Related

- [[EMA Architecture Overview]]
- [[Intent System]]
- [[Intent Engine]]
- [[Execution System]]
- [[Proposal Pipeline]]
- [[Dispatch Engine]]
- [[Active Projects]]
