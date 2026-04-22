# EMA Virtual Apps — Make It Immediately Useful

## Context: What Already Exists

You have **52 virtual apps** already defined in `app/src/types/workspace.ts`, a Launchpad, Shell, Dock, CommandBar, and window manager. The app infrastructure is built. What's missing is **wiring these apps to real workflows** so EMA replaces Discord + scattered AI clients immediately.

### Current App Inventory (from workspace.ts)

**Core Workflow (Must Wire First):**
- `claude-bridge` — Interactive Claude sessions (F2, ✅ backend done)
- `proposals` — Proposal engine (F4, ✅ backend done)
- `tasks` — Task tracking (✅ components exist)
- `projects` — Project management (✅ components exist)
- `executions` — HQ execution timeline (✅ components exist)
- `agents` — Agent management (✅ components exist)
- `agent-fleet` — Fleet dashboard (✅ components exist)
- `vault` — Second Brain / knowledge (✅ components exist)
- `openclaw` — Gateway bridge (✅ components exist)

**Intelligence Layer (Phase 2 Priority):**
- `pipeline` — AI pipeline orchestration
- `prompt-workshop` — Prompt editing/testing
- `intent-map` — Intent classification visualization
- `memory` — Session context management
- `gaps` — System gap inbox
- `decision-log` — Decision tracking
- `evolution` — Evolution dashboard
- `metamind` — Meta-intelligence
- `ingestor` — Content ingestion

**Life/Personal:**
- `brain-dump`, `habits`, `journal`, `goals`, `focus`, `responsibilities`
- `life-dashboard`, `routine-builder`, `finance-tracker`, `contacts-crm`, `goal-planner`

**Infrastructure:**
- `token-monitor`, `vm-health`, `security`, `cli-manager`, `git-sync`
- `service-dashboard`, `tunnel-manager`, `file-vault`, `shared-clipboard`

**Business/Org:**
- `team-pulse`, `meeting-room`, `project-portfolio`, `invoice-billing`, `audit-trail`, `org`

**Communication:**
- `channels`, `message-hub`, `voice`, `jarvis`

### What the Backend Already Has (PAP.md)
- ✅ F1 — Dashboard (security + ops widgets)
- ✅ F2 — Claude Bridge (persistent sessions, streaming, multi-model, cost)
- ✅ F3 — Context Store (vault + goals + tasks enrichment via MCP)
- ✅ F4 — Quality Pipeline (4-stage proposal orchestration, quality gates)
- ✅ F5 — CLI Mirror (46 endpoints, 118 tests)
- ✅ Daemon running at `localhost:4488`
- ✅ REST API: /proposals/generate, /proposals/pipelines, /proposals/budget, etc.

### What Discord Currently Does (Must Replace)

| Discord Channel | What Happens There | EMA App Replacement |
|---|---|---|
| `#dispatch` | Post task → Right Hand routes → agent spawns → result returns | **Bridge** (claude-bridge) + **Tasks** + **Agents** |
| `#concierge` | Casual questions, quick lookups | **Jarvis** or **Bridge** |
| `#desk` (forum) | Task tracking, kanban via forum tags | **Tasks** (TaskBoard.tsx exists!) |
| `#agent-feed` | Agent status updates, dispatch notifications | **Agent Fleet** (AgentFleetApp.tsx) |
| `#worklog` | Daily summaries, cron results | **Executions** (HQ) |
| `#evolution-log` | Prompt changes, skill updates | **Evolution** dashboard |
| `#vault-feed` | Vault writes by agents | **Vault** app |
| `#heartbeat` | System health checks | **VM Health** + **Service Dashboard** |
| `#ops-log` | Infrastructure events | **Service Dashboard** |
| Voice channels | Ambient status text | **Orb** / ambient strip |

### What the Metaprompting Workflow Looks Like Today

```
1. Trajan has an idea
2. Types in Discord #dispatch (or Claude Code on host)
3. Right Hand (OpenClaw) reads it
4. Right Hand classifies intent, picks agent
5. Agent spawns (Claude Code CLI on VM)
6. Agent works, streams output to Discord thread
7. Result posted to Discord
8. Trajan reads result, decides next step
9. Vault maybe updated (manual or agent)
10. Outcome maybe tracked (manual)
11. Repeat
```

**What's lost:** No traceability. No metrics. No prompt versioning. No automated learning. Context dies between sessions.

---

## YOUR TASK: Make EMA Immediately Useful

### Goal 1: Wire the Core Loop

The #1 priority is making this flow work inside EMA:

```
Trajan types in Bridge → EMA classifies intent → Agent dispatches → 
Streaming progress visible → Result in Tasks → Vault updated → 
Outcome tracked → Metrics updated → Next request smarter
```

**What needs to happen:**
1. `claude-bridge` app needs to POST to `/api/tasks/dispatch` (not just `/api/claude/sessions`)
2. `tasks` app needs WebSocket for real-time status
3. `agent-fleet` needs live agent status
4. `executions` (HQ) needs to show the timeline
5. `vault` needs to reflect writes in real-time

**Question:** Should Bridge be the "home" view (where you land), or should Launchpad remain home with Bridge as one-click away?

### Goal 2: Bootstrap Current Config

EMA needs to know about the current system:
- Agent roster (from AGENTS.md) → `agents` table
- Routing rules (from AGENTS.md) → `routing_rules` table  
- Prompts (SOUL.md, agent CLAUDE.md files) → `prompts` table
- Preferences → `preferences` table

**Question:** Should there be an `ema system bootstrap` command that imports all config on first run? Or should the UI have an "Import from OpenClaw" wizard?

### Goal 3: Prompt Workshop Becomes the Metaprompting Hub

`prompt-workshop` already exists as a component. It should become:
- View all prompts (system, agent, router, per-project)
- Edit prompts with live preview
- Version history (diff view)
- A/B test setup (split traffic between variants)
- Metrics dashboard (success rate by prompt version)
- Import from vault / Export to vault

This is where "metaprompting across various AI chat clients" consolidates into ONE place.

### Goal 4: Spaces Integration

The `org` app exists. Spaces should work like:
- **Personal space** — All your apps, all your data (default)
- **Project space** — Scoped view (only EMA project tasks/proposals/vault)
- **Shared space** — Collaborative (future: P2P mesh)

**Question:** Should spaces be a top-level switcher (like Slack workspaces), or a filter within each app?

### Goal 5: Wiki as a Virtual App

Wiki server runs at `localhost:8090` (Quartz, 2168 pages). Add a `wiki` virtual app that:
- Embeds wiki in an iframe or fetches content via API
- Search bar that queries the wiki
- Rebuild button
- Status indicator (running/stopped, page count, last build)
- Deep link: click vault node in graph → opens wiki page

---

## Specific Implementation Questions

### Architecture
1. **State management:** You're using Zustand stores per app. Should there be a global `useSystemStore` that holds cross-app state (active space, current user, daemon status)?
2. **Real-time:** WebSocket to daemon for live updates? Or REST polling? PubSub via Phoenix channels?
3. **App communication:** When Bridge dispatches a task, how does Tasks app know? (shared store? event bus? WebSocket?)

### Bridge App (Highest Priority)
4. **Input model:** Single text input (like Discord) or structured form (intent + description + priority + agent)?
5. **Output model:** Stream tokens as they arrive, or wait for complete response?
6. **History:** Show last N dispatches in Bridge, or separate "History" tab?
7. **Quick actions:** Should Bridge have one-click buttons for common intents (Research, Build, Review, Organize)?

### Tasks App
8. **Board vs. List:** TaskBoard.tsx exists. Should it be kanban (columns by status) or timeline (Gantt-like)?
9. **Real-time progress:** How granular? Per-token? Per-tool-call? Per-mode (research→implement→review)?
10. **Quality gate UI:** How to show the 5-dimension quality score inline?

### Agent Fleet
11. **Live status:** How does the frontend know an agent is active? WebSocket heartbeat? Polling `/api/agents/status`?
12. **Performance:** Show per-agent metrics inline, or drill-down?
13. **Cost:** Real-time cost counter as agent works, or post-hoc?

### Prompt Workshop (Metaprompting Hub)
14. **Editor:** Monaco (VS Code editor) or simple textarea?
15. **Preview:** Can we show "if this prompt were used, here's what the agent would see"?
16. **A/B test:** How to split traffic? Random? Round-robin? Manual assignment?

### Vault/Wiki Integration
17. **Vault app vs. Wiki app:** Merge into one "Knowledge" app, or keep separate?
18. **Graph:** VaultGraph.tsx exists. What graph library? D3? Cytoscape? Sigma.js?
19. **Real-time:** When an agent writes to vault, does the graph update immediately?

---

## Suggested Implementation Order

### Week 7a: Core Loop (3 days)
1. Wire Bridge → dispatch API → Tasks board updates
2. WebSocket for real-time task status
3. Agent Fleet shows live agent state
4. One end-to-end dispatch: type in Bridge → see in Tasks → see agent working → see result

### Week 7b: Config Bootstrap (2 days)
5. `ema system bootstrap` imports AGENTS.md → agents table
6. `ema system bootstrap` imports SOUL.md → prompts table
7. Prompt Workshop reads from prompts table
8. Agent dispatch reads prompts from DB (not disk)

### Week 8a: Intelligence (3 days)
9. Intent classifier (Router) connected to Bridge input
10. Context injector enriches prompts with vault data
11. Outcome tracking (every dispatch → outcome logged)
12. Metrics visible in Agent Fleet

### Week 8b: Knowledge (2 days)
13. Wiki virtual app (embed + search + rebuild)
14. Vault graph wired to real data
15. Cross-link: click vault node → wiki page → related tasks

### Week 9: Self-Improvement
16. Prompt metrics dashboard
17. A/B test framework
18. Weekly optimizer (generate variants, test, activate best)

---

## Output Format

Create a single document with:

1. **Revised App Architecture** — Which of the 52 apps are core? Which are Phase 2? Which are nice-to-have?
2. **Core Loop Wiring** — Exact API calls, WebSocket events, store updates for Bridge → Tasks → Agents → Vault
3. **Config Bootstrap** — What tables, what import logic, what CLI commands
4. **Prompt Workshop Spec** — How metaprompting consolidates here
5. **Spaces Design** — How spaces work as top-level context
6. **Wiki Integration** — How wiki becomes a virtual app
7. **Week 7-8 Sprint Plan** — Concrete tasks, dependencies, parallel tracks

---

## Key Files to Read

```
app/src/App.tsx                          — Main router (all 52+ apps)
app/src/types/workspace.ts               — App configs (title, size, accent, icon)
app/src/components/layout/Shell.tsx       — Main shell (Dock, CommandBar, AmbientStrip)
app/src/components/layout/Launchpad.tsx   — Home screen (app tiles)
app/src/components/layout/Dock.tsx        — Bottom dock
app/src/components/claude-bridge/         — Claude Bridge app (F2)
app/src/components/tasks/                 — Tasks app (TaskBoard, TaskCard, etc.)
app/src/components/agents/               — Agents app
app/src/components/agent-fleet/          — Agent Fleet dashboard
app/src/components/vault/                — Vault app (VaultGraph, VaultSearch, etc.)
app/src/components/proposals/            — Proposals app (F4)
app/src/components/executions/           — HQ execution timeline
app/src/components/prompt-workshop/      — Prompt Workshop
app/src/components/evolution/            — Evolution dashboard
app/src/components/openclaw/             — OpenClaw gateway bridge
app/src/stores/                          — All Zustand stores
docs/PAP.md                              — Project Architecture & Planning
```

**Daemon API:** `localhost:4488`
**Wiki:** `localhost:8090`

Go. Make this thing immediately useful. 🚀
