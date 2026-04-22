---
title: EMA Master Knowledge Base
created: '2026-04-03'
updated: '2026-04-03'
type: project
status: active
confidence: 0.95
tags:
  - ema
  - executive-os
  - phase-1-complete
  - phase-2-active
  - architecture
  - implementation
  - roadmap
summary: >-
  Complete, consolidated knowledge base of EMA project — what's built, what's
  working, what's next, architecture decisions, and integration patterns. Master
  index for all EMA documentation.
related:
  - '[[Codebases/EMA]]'
  - '[[Architecture/EMA Full Integration Roadmap]]'
  - '[[Projects/EMA Sprint Status]]'
wiki_id: projects/EMA_Master_Knowledge_Base
imported_from: vault/Projects/EMA Master Knowledge Base.md
imported_at: '2026-04-04T00:23:56.873Z'
---

# EMA Master Knowledge Base

> **Last consolidated:** 2026-04-03 20:30 UTC
> **Status:** Phase 1 ✅ Complete | Phase 2 🔨 Active
> **Repo:** `~/Projects/ema` (host: FerrissesWheel)

---

## Quick Facts

| Aspect | Status |
|--------|--------|
| **Stack** | Elixir/Phoenix 1.8 daemon + Tauri 2 + React 19 + Zustand + Tailwind v4 + SQLite |
| **Source Files** | 2,457 across daemon + frontend |
| **Domain Modules** | 16 contexts + supervised systems |
| **Daemon Port** | localhost:4488 (Phoenix API + WebSocket) |
| **Frontend Dev** | localhost:1420 (Vite HMR) |
| **Build Status** | All Phase 1 features ✅ shipped (commit 5c577f0) |
| **Active Issue** | Daemon auto-start on Tauri launch — still needs investigation |
| **Next Sprint** | Phase 2: Persistent intelligence (multi-turn sessions, campaigns, CampaignManager) |

---

## Phase 1: Foundation ✅ COMPLETE (as of 2026-04-03)

### What's Shipped

| Ticket | Feature | Complexity | Status | Impact |
|--------|---------|------------|--------|--------|
| **EMA-001** | Claude Bridge — interactive session management via Port subprocess | Medium | ✅ Merged | Replaces crude Runner.run() with proper streaming |
| **EMA-002** | Vector embedding + scoring for proposal engine | High | ✅ Merged | Semantic ranking of proposals |
| **EMA-003** | "The Ralph Loop" — self-improvement proposal engine | Medium | ✅ Merged | Proposal generator → refiner → risk analyzer → formatter |
| **EMA-004** | MetaMind — prompt interception, peer review, prompt library | Medium | ✅ Merged | Quality gates + history-based refinement |
| **EMA-005** | Self-evolution engine with signal scanning + versioned rules | High | ✅ Merged | System learns from outcomes + updates rules |
| **EMA-006** | Channels God Mode — unified inbox, Discord-style UI, real integrations | High | ✅ Merged | Brain Dump + event routing to Discord/Telegram |
| **EMA-007** | VoiceCore — Jarvis voice interface | Medium | ✅ Merged | Voice input → Claude → tasks/notes |
| **Sprint 1** | OpenClaw agent chat integration | Medium | ✅ Merged | EMA ↔ OpenClaw session bridging |

**Delivered state:** Full Elixir/Phoenix daemon with React frontend, 16 domain modules, SQLite persistence, WebSocket real-time sync, all core features buildable in production.

### The Build Stack (Technical Details)

**Daemon (`daemon/`)**
```
daemon/
├── config/
│   ├── config.exs          # Phoenix config, Ecto, Logger
│   ├── dev.exs
│   ├── prod.exs
│   ├── runtime.exs
│   └── test.exs
├── lib/ema/                # Application entry, supervision tree
├── lib/ema/schemas/        # Ecto schemas (16 contexts)
├── lib/ema/claude/         # Runner, ContextManager, Sessions watcher
├── lib/ema/pipes/          # Event-driven automation
├── lib/ema_web/            # Phoenix API + WebSocket channels
│   ├── controllers/        # REST endpoints
│   ├── channels/           # Phoenix.Channel subscriptions
│   └── live/               # (minimal; most UI in React)
├── priv/repo/              # Ecto migrations
└── mix.exs                 # Dependencies, tasks
```

**Frontend (`app/`)**
```
app/
├── public/                 # Static assets
├── src/
│   ├── App.tsx             # Route-based app switcher
│   ├── stores/             # 15 Zustand stores (REST + WS sync)
│   ├── components/         # Glass UI components
│   ├── pages/              # App pages (Projects, Tasks, Proposals, etc.)
│   └── styles/
│       ├── globals.css     # Glass morphism design system
│       └── App.css
├── tauri/                  # Tauri config, Rust entry
├── package.json            # React 19, Zustand, Tailwind v4
└── vite.config.ts          # Vite bundler
```

**Key Build Artifacts**
- **Daemon binary:** `mix escript.build` → `./ema` (self-contained)
- **Frontend build:** `npm run build` → `dist/` (static, embedded in Tauri)
- **Tauri desktop:** `npx tauri build` → platform-specific installers

---

## Architecture: The Blueprint

### Overall Topology

```
┌──────────────────────────────────────────────────────────────┐
│                   Tauri Desktop Shell (Rust)                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Launchpad Window (always visible + tray icon)           │ │
│  │  Per-app WebView windows (on demand)                     │ │
│  │  App switcher via route-based navigation                │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  React Frontend (app/src/)                               │ │
│  │  ├─ 15 Zustand stores (load via REST, sync via WS)      │ │
│  │  ├─ Glass morphism component library                    │ │
│  │  ├─ Real-time channel subscriptions                     │ │
│  │  └─ App pages: Projects, Tasks, Proposals, Brain Dump,  │ │
│  │     Agents, Goals, Habits, Journal, Canvas, etc.        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                      ↕ WebSocket / REST                      │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  EMA Daemon (Elixir/Phoenix on localhost:4488)           │ │
│  │                                                          │ │
│  │  ┌─ REST API (/api/*, CRUD + domain actions)            │ │
│  │  ├─ Phoenix Channels (real-time sync)                   │ │
│  │  ├─ OTP Supervision Trees                               │ │
│  │  │  ├─ ClaudeSessions.Supervisor (SessionWatcher, etc.) │ │
│  │  │  └─ Pipes.Supervisor (event routing)                 │ │
│  │  ├─ 16 Ecto Contexts (business logic)                   │ │
│  │  │  ├─ BrainDump, Tasks, Projects, Proposals           │ │
│  │  │  ├─ Habits, Journal, Goals, Focus, Canvas           │ │
│  │  │  ├─ Responsibilities, Notes, VaultIndex             │ │
│  │  │  └─ AppShortcuts, Settings, Workspace               │ │
│  │  └─ SQLite via Ecto (ecto_sqlite3)                      │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
              ↕ (filesystem + process watchers)
     Host machine (macOS/Linux/Windows)
     ├─ ~/.claude/projects/ (Claude sessions)
     ├─ ~/vault/ (Obsidian vault)
     ├─ Git repositories
     └─ Project files
```

### Communication Pattern

**Initial Load Flow**
```
React Component Mounts
  ↓
useEffect: call loadViaRest() → GET /api/tasks
  ↓
Zustand store updates with initial data
  ↓
useEffect: call connect() → join "tasks:live" channel
  ↓
Phoenix channel subscribed
  ↓
Real-time updates push to socket.on("task:updated", ...)
  ↓
Zustand store broadcasts change, React re-renders
```

**Mutation Flow**
```
User clicks "Create Task"
  ↓
React component calls store.createTask(data)
  ↓
Zustand handler: POST /api/tasks, then wait for WS broadcast
  ↓
Phoenix controller creates task, broadcasts to channel
  ↓
All connected clients receive "task:created" event
  ↓
All stores update, all React components re-render
```

### The 16 Domain Modules (Contexts)

| Module | Schema | Purpose | Lifecycle |
|--------|--------|---------|-----------|
| **BrainDump** | Item | Inbox capture — quick thoughts, links, ideas | capture → classify → route |
| **Tasks** | Task, Comment | Actionable work items with status transitions | new → assigned → done |
| **Projects** | Project | Workspaces with linked paths, context docs | created → archived |
| **Proposals** | Proposal, Seed, ProposalTag | AI-generated ideas queued for review | generated → accepted → implemented |
| **Habits** | Habit, HabitLog | Daily habits with streak tracking | enabled → completed daily |
| **Journal** | Entry | Daily journal with mood/energy, full-text search | captured → enriched |
| **Goals** | Goal | Goal tracking (scaffolded) | created → completed |
| **Focus** | Session, Block | Focus timer sessions with analytics | started → ended |
| **Responsibilities** | Responsibility, CheckIn | Recurring obligations with health scores | assigned → checked in |
| **Canvas** | Canvas, Element, DataSource | Visual workspaces with live data | designed → saved |
| **VaultIndex** | VaultEntry | Vault file index (host Obsidian sync) | indexed → searched |
| **Notes** | Note | Simple notes (scaffolded, separate from SecondBrain) | created → organized |
| **SecondBrain** | (multi-schema) | Graph-connected markdown vault with links, spaces, tags | ingested → linked |
| **Agents** | Agent, Memory, Conversation | Per-agent GenServers with conversations, memory summarization | deployed → talking |
| **AppShortcuts** | AppShortcut | Keyboard shortcut bindings | bound → triggered |
| **Settings** | Setting | Key-value app configuration | set → read |

**Key design:** Each context has its own schema, migrations, and change functions. All contexts expose a minimal public API (CRUD + domain-specific actions). All state lives in SQLite — no in-memory-only state.

---

## Claude Integration: The Bridge

### Current State (Phase 1)

**Two supervised subsystems:**

1. **`Ema.Claude.Runner`** — Synchronous wrapper around `claude` CLI
   - `Runner.run(prompt, opts)` → fires `System.cmd("claude", ...)` with 120s timeout
   - Uses `--output-format json` for structured parsing
   - No streaming, no sessions, no hooks
   - **6 callsites** throughout codebase (proposal generation, task suggestions, etc.)

2. **`Ema.Claude.ContextManager`** — Builds enriched prompts for proposal pipeline
   - Pulls project context, recent proposals, active tasks
   - Injects relevant history before each stage (generator/refiner/debater/tagger)
   - Feeds into the "Ralph Loop" (EMA-003)

3. **`Ema.Claude.Sessions`** (Supervised by ClaudeSessions.Supervisor)
   - **SessionWatcher** GenServer — polls `~/.claude/projects/**/*.jsonl` every 30s, parses sessions, imports to DB
   - **SessionMonitor** GenServer — detects active `claude` processes via `pgrep` every 5s, broadcasts presence
   - **SessionParser** — parses JSONL files, extracts tool_calls, files_touched, tokens, timestamps
   - **SessionLinker** — matches sessions to EMA projects by path
   - Ecto schema: `ClaudeSession` (session_id, project_path, status, token_count, files_touched)

**Goal:** Read-only passive watch of host Claude Code sessions. No control yet.

### Phase 2: The Bridge Migration (Next)

The Claude Bridge (EMA-001 already merged, just needs integration) replaces Runner with:

```elixir
# Port-based, bidirectional streaming
{:ok, session} = Ema.Claude.Bridge.start_session(project: project, model: "opus")
Ema.Claude.Bridge.send(session, "Generate proposal for: X")
# → StreamParser parses JSONL events in real-time
# → CircuitBreaker tracks failures, escalates if needed
# → CostTracker tallies tokens from JSONL result events
# → Governance logs every tool call to audit table
Ema.Claude.Bridge.end_session(session)
```

**Key modules (ready to wire in):**
- `Ema.Claude.Bridge` — GenServer managing Port subprocess
- `Ema.Claude.StreamParser` — JSONL event decoder
- `Ema.Claude.CircuitBreaker` — failure detection + escalation
- `Ema.Claude.CostTracker` — token accounting
- `Ema.Claude.Governance` — audit logging
- `Ema.Claude.SessionManager` — lifecycle management
- `Ema.Claude.QualityGate` — post-completion verification
- `Ema.Claude.MCPServer` — HTTP/stdio MCP exposing EMA tools to Claude

**Dual backend support:** Can route through Claude CLI subprocess OR OpenClaw gateway (runtime switchable).

---

## Real-Time Intelligence: Pipes & PubSub

### Event-Driven Architecture (Pipes)

EMA uses **Pipes** for event-driven automation — inspired by Citadel's hooks and event-driven workflows.

```elixir
# Example: when a task is completed
defmodule Ema.Pipes.Rules do
  def task_completed(task) do
    # 1. Update project progress
    Ema.Projects.update_project_stats(task.project_id)
    
    # 2. Broadcast to PubSub
    Phoenix.PubSub.broadcast(Ema.PubSub, "tasks:live", 
      {:task_completed, task})
    
    # 3. Trigger any subscribed pipes
    Ema.Pipes.trigger("task:completed", %{task: task})
  end
end

# A pipe triggers Claude action:
defmodule Ema.Pipes.ClaudeAction do
  schema "pipe_actions" do
    field :action_type, :string  # "claude"
    field :prompt_template, :string
    field :model, :string
    field :quality_gate, :string
    field :output_target, :string  # :second_brain, :task, :proposal, :notification
  end
end

# So you can configure:
# task:completed → run Claude → output to Second Brain as note
# proposal:accepted → run Claude → create implementation tasks
# goal:deadline_approaching → audit progress, suggest interventions
```

**Event sources:** Every domain module broadcasts on completion: task:created, proposal:generated, journal:entry_saved, note:created, habit:logged, etc.

**Current state:** Pipes scaffolded, event triggers in place, Claude action handlers stubbed. Ready for Phase 2.

---

## The Proposal Pipeline: Generator → Evaluator Loop

### "The Ralph Loop" (EMA-003)

The core quality iteration pattern for idea generation:

```
User seed (problem statement, goal, etc.)
  ↓
Generator (Opus, high temp) → raw ideas
  ↓
Refiner (Sonnet, lower temp) → structured, actionable proposals
  ↓
RiskAnalyzer (Sonnet + domain knowledge) → identify blindspots
  ↓
Formatter (Haiku, deterministic) → final presentation
  ↓
Quality Gate (post-completion verification)
  ├─ Completeness check (all sections present)
  ├─ Actionability check (is it actionable?)
  ├─ Risk coverage (were risks identified)
  └─ Scope check (is scope bounded)
  ↓
If fails → regenerate with feedback
If passes → proposal ready for human review
```

**Implementation:** 
- Each stage uses `Ema.Claude.ContextManager` to inject project context
- MetaMind (EMA-004) intercepts prompts, checks against prompt library, applies peer review
- Self-evolution engine (EMA-005) tracks which generator seeds → accepted proposals, learns pattern
- All stages stream real-time to frontend via Zustand + WebSocket

---

## Session Watcher: Passive Host Monitoring

### How It Works

EMA watches the host's Claude Code sessions passively:

1. **SessionWatcher** polls `~/.claude/projects/**/*.jsonl` every 30s
2. For each session file, parse JSONL into metadata: tool_calls, files_touched, tokens, timestamps
3. Store in `ClaudeSession` schema (session_id, project_path, status, token_count, files_touched)
4. **SessionMonitor** detects active `claude` processes via `pgrep` every 5s, broadcasts presence
5. Frontend shows "Claude session active in Project X" + progress

**What it doesn't do (yet):**
- Doesn't create sessions (EMA doesn't spawn Claude)
- Doesn't resume sessions (read-only)
- Doesn't control Claude (passive observer)

**Phase 2 will add:** Active session creation, resumption, forking.

---

## The Problem: Daemon Auto-Start Failing (Current Blocker)

**Issue:** When Tauri app launches, daemon is supposed to auto-spawn via `mix phx.server`. But "Connection error: Connection failed" persists.

**What's been claimed:** Claude Code (attempted fix) said daemon auto-spawns when Tauri starts, but error still appears.

**Investigation needed:**
- Is `mix phx.server` actually running? (check `ps aux | grep mix`)
- Is it listening on localhost:4488? (check `netstat -an | grep 4488`)
- Are there daemon logs showing startup errors? (check `daemon/logs/`)
- Is the Tauri startup script actually calling the daemon? (check `app/tauri/` config)
- Does the daemon need to be pre-built as an escript? (check for `./ema` binary)

**Fix approach:**
1. Verify daemon is actually running (ps, netstat, curl to /api/health)
2. If not running, check why (logs, permission issues, path issues)
3. If running but app can't connect, check networking (localhost resolution, port conflicts)
4. If both work locally, might be installer/release build issue

---

## Phase 2: Persistent Intelligence (Weeks 7-8)

### 2.1 Multi-Turn Agent Sessions

**Current:** Fire-and-forget `Runner.run()` calls
**Future:** Persistent sessions where Claude keeps context across turns

```
Current:  User msg → build prompt (inject history) → Runner.run() → parse → reply
Future:   User msg → Bridge.send_message(session_id, msg) → stream → reply
```

**Implementation:**
- Replace `Runner.run()` callsites with `Bridge.send_message(session_id, msg)`
- Claude Code maintains conversation memory within a session
- Session lifecycle: `start_session() → send() → send() → send() → end_session()`
- Session persistence: `--session-id` survives daemon restarts
- Session forking: explore branches without losing the trunk

---

### 2.2 Campaign System

Long-running projects get **campaigns** — named, persistent Claude sessions that compound knowledge:

```elixir
defmodule Ema.Campaigns do
  schema "campaigns" do
    field :slug, :string
    field :name, :string
    field :status, :string  # active, paused, completed
    field :goal, :string
    field :sessions, {:array, :string}  # session_ids
    field :discoveries, :map  # accumulated learnings
    belongs_to :project, Ema.Projects.Project
    timestamps()
  end
end
```

**Inspired by Citadel's campaign YAML — but stored in Ecto with full lifecycle:**
- `campaign start "refactor auth" --project myapp`
- Multiple sessions within a campaign share discoveries
- Campaign-level cost tracking and audit trail
- Campaign artifacts persist in Second Brain

**Example:**
```
Campaign: "Refactor Auth System"
├─ Session 1: Analyze current auth architecture
│  Discoveries: [3 security gaps found, legacy OAuth endpoints]
├─ Session 2: Design new auth flow
│  Discoveries: [JWT + refresh tokens, rate limiting needed]
└─ Session 3: Implementation planning
   Discoveries: [6 PRs needed, 2-week estimate]
   
All discoveries shared across sessions. Cost tracked per session and campaign-wide.
```

---

### 2.3 Session Watcher Integration

Current `ClaudeSessions` watches passively. Upgrade to bidirectionality:

- When EMA detects a new host session in a project it manages → auto-link to the project
- When a host session creates files in a watched directory → trigger Pipes
- Session parse results → feed into Second Brain as knowledge nodes
- Bidirectional: EMA can spawn sessions that show up in `claude --continue`

---

## Phase 3 & Beyond: Autonomous Pipes, Knowledge Synthesis, Specialized Agents

### Phase 3: Autonomous Pipes (June 2026)

**AI-Powered Pipe Actions**

```elixir
defmodule Ema.Pipes.ClaudeAction do
  schema "pipe_actions" do
    field :action_type, :string  # "claude"
    field :prompt_template, :string
    field :model, :string
    field :quality_gate, :string
    field :output_target, :string
  end
end
```

**Example Workflows**
- `project:commit_pushed` → Claude reviews diff, creates tasks for issues
- `proposal:accepted` → Claude generates implementation tasks, assigns to campaigns
- `goal:deadline_approaching` → Claude audits progress, suggests interventions
- `habit:streak_broken` → Claude writes journal reflection
- `brain_dump:captured` → Claude processes, categorizes, creates notes in Second Brain

**Pre-built Templates**
- **Morning Briefing** — summarize overnight changes, today's priorities, goal status
- **End-of-Day Review** — what got done, what slipped, journal prompt
- **Weekly Retrospective** — progress toward goals, proposal outcomes, habit trends
- **Research Spike** — take a topic → web search → summarize → create Second Brain note
- **Code Review Pipeline** — commit → Claude review → create issues → assign campaigns

---

### Phase 4: Knowledge Synthesis (July–August 2026)

**Second Brain ↔ Claude Deep Integration**

- **Auto-linking:** When Claude generates content, identify existing notes and create `[[wikilinks]]`
- **Knowledge gaps:** Claude reads Second Brain graph, identifies disconnected clusters, suggests bridges
- **Contradiction detection:** Find statements in different notes that conflict, flag for resolution
- **Progressive summarization:** Notes auto-summarize at multiple levels
- **Semantic search → Claude follow-up:** Search returns notes → "Ask Claude about these" → synthesized answer

**Goal Intelligence**

Goals are hierarchical:
```
3-year goal: "Build a sustainable product business"
  └─ yearly: "Launch 2 profitable products"
     └─ quarterly: "Ship MVP of Proslync"
        └─ monthly: "Complete Phase 1"
           └─ weekly: "Finish auth + onboarding"
```

- Claude validates goal hierarchy coherence
- Claude infers progress from task completions, proposal outcomes, journal entries
- Claude suggests interventions when progress stalls
- Claude suggests goal mutations based on new information

---

### Phase 5: Autonomous Agency (September–October 2026)

**Specialized Agent Team**

| Agent | Role | Tools | Triggers |
|---|---|---|---|
| **Strategist** | Goal decomposition, prioritization | goals, projects, proposals | goal:created, quarterly_review |
| **Researcher** | Deep dives, web research, synthesis | web_search, second_brain, vault | research:requested, topic:unknown |
| **Executor** | Task implementation via Claude Code | bridge (CLI mode), git, filesystem | task:assigned, campaign:started |
| **Reviewer** | Quality gates, code review, proposal review | bridge, quality_gate, governance | commit:pushed, proposal:generated |
| **Archivist** | Knowledge organization, note maintenance | second_brain, vault_index, links | note:created, weekly_maintenance |
| **Coach** | Habits, journaling prompts, reflection | habits, journal, goals, focus | habit:streak_broken, focus:ended |

**Inter-Agent Communication** via message bus:
```
Strategist: "Project X needs a research spike on competitor pricing"
  → Researcher: runs web search, creates Second Brain note
    → Strategist: incorporates findings, updates proposal
      → Reviewer: quality-gates the updated proposal
        → Executor: creates campaign, starts implementation
```

**Autonomous Loops**
- Daily planning loop: Every morning, Strategist reviews goals → generates priority list → Coach writes journal prompt
- Research monitoring: Researcher watches configured topics, surfaces important developments
- Code health loop: Reviewer periodically audits projects, files issues
- Knowledge maintenance: Archivist prunes stale notes, merges duplicates, strengthens links

**Governance**
- Approval tiers: Low-risk autonomous, medium-risk notify, high-risk require approval
- Budget caps: Per-agent, per-campaign, per-day token budgets
- Kill switches: Pause any agent or campaign instantly
- Audit dashboard: See what every agent did, when, why, what it cost
- Confidence thresholds: Outputs below threshold → queue for review

---

## Trajan's Actual Multi-Agent Workflow: What EMA Needs to Support

From deep analysis of dispatch patterns (see vault/Architecture/EMA-Workflow-Analysis-2026-04-03.md):

### The Hub-and-Spoke Pattern

```
Trajan → Right Hand (intent arrives)
  ↓ decompose into parallel tracks
  ├── Researcher (web intel, feasibility)
  ├── Coder (implementation)
  ├── Ops (infra/health)
  └── Vault Keeper (knowledge persistence)
  ↓ results collected by Right Hand
  ↓ Right Hand synthesizes + posts to Discord
  ↓ Trajan reviews (optional, often async)
  ↓ If gaps: targeted re-dispatch
```

**Key insights:**
- Parallel is default (4-6 agents per wave)
- Agents never hand off peer-to-peer (always through Right Hand)
- Diverge (explore problem space) vs. Parallax (stress-test solution) appear at different stages
- Three decision inflection points:
  1. **Scope gating** — how narrowly to scope the task (learned limit: Vault Keeper timeouts on >50 files)
  2. **Structural decision gate** — major changes (restructure, migrate, delete) go through deliberation first
  3. **Overnight vs. synchronous** — async dispatch if no human input needed next

### EMA Must Support (Minimal Viable Set)

1. **Dispatch Board** — Live view of what's running: status (queued/running/success/failed), elapsed time, agent, description
2. **Scope Advisor** — When task is created, check outcome history. Surface warning if similar tasks have failed at that scope
3. **Deliberation Gate** — Flag tasks as "structural", auto-route to Proposals pipeline first (quality gates, then implementation)
4. **Reflexion Injection** — Before spawning agent, inject summary of last 3 outcomes (what_worked/what_failed) into spawn prompt

**Why these four?**
- They map to EMA's existing infrastructure (Tasks, Proposals, Outcome Tracker)
- They directly address Trajan's core pain points (silent failures, scope surprises, structural changes without deliberation, agents repeating mistakes)
- They're integrations, not new domains

---

## What's Working Well (Strengths)

1. **Clean architecture:** 16 Ecto contexts with clear boundaries, each exposes minimal public API
2. **Real-time sync:** WebSocket channels + Zustand stores provide fast, responsive UI
3. **Storage is durable:** SQLite + Ecto migrations persist everything, databases can be dumped/restored
4. **Supervision trees are robust:** OTP GenServers auto-restart on failure (SessionWatcher, SessionMonitor)
5. **Glass UI is polished:** Tailwind v4 + custom design system feels cohesive and modern
6. **Domain modeling is sound:** Proposals, Goals, Habits, Journal, Canvas, Agents — all have sensible schemas and lifecycles

---

## Known Issues & Gotchas

1. **Daemon auto-start on Tauri launch** — Still broken. Needs investigation.
2. **Claude integration is one-shot** — Runner.run() calls are fire-and-forget, no streaming or session management yet
3. **Pipes are scaffolded** — Event triggers are in place but Claude action handlers are stubs
4. **Second Brain is scaffolded** — Graph structure exists but not integrated with Claude
5. **Agent system is generic** — All agents use the same AgentWorker; specialization comes in Phase 5
6. **No dispatch visibility** — When Trajan dispatches agents, EMA has no live board showing progress/failures
7. **No scope advisor** — No automatic warning when a task scope exceeds learned agent limits
8. **No deliberation gate** — Structural tasks don't automatically route through Proposals pipeline
9. **No reflexion injection** — Agents aren't fed summaries of past outcomes on dispatch
10. **VaultIndex is read-only** — Can query host Obsidian vault but not auto-sync bidirectionally

---

## Build & Deployment

### Local Dev (On Host)

```bash
# Daemon
cd ~/Projects/ema/daemon
mix setup          # deps.get + ecto.create + ecto.migrate
mix phx.server     # starts on localhost:4488

# Frontend (separate terminal)
cd ~/Projects/ema/app
npm install
npm run dev        # Vite dev server on localhost:1420

# Open http://localhost:1420 in browser
```

### Desktop Build (Tauri)

```bash
# From app/ directory
npx tauri dev      # Full desktop app with hot reload (both daemon + frontend)
npx tauri build    # Production build → installers
```

**Build outputs:**
- macOS: `.dmg` installer, `.app` bundle
- Windows: `.msi` installer, `.exe` portable
- Linux: `.AppImage`, `.deb`

### Production Daemon (Headless)

```bash
cd daemon
mix deps.get --only prod
mix compile
MIX_ENV=prod mix escript.build  # Creates ./ema binary
./ema                           # Runs daemon on localhost:4488
```

---

## Next Immediate Steps

### Before Phase 2 Starts

1. **Fix daemon auto-start** — Debug why Tauri isn't launching daemon, verify daemon runs when started manually
2. **Verify Bridge is wired** — The Bridge module (EMA-001) is built but not integrated. Check that all callsites can use it
3. **Capture current state** — Document what works, what doesn't, to avoid re-solving known issues

### Phase 2 Priorities (Weeks 7-8)

1. **Wire Bridge into proposal pipeline** — Replace Runner.run() with Bridge.send() for multi-turn sessions
2. **Build CampaignManager** — Schema + lifecycle for persistent campaign sessions
3. **Integrate SessionWatcher bidirectionality** — EMA can spawn sessions that appear in `claude --continue`
4. **Implement 4 MVP Trajan affordances:**
   - Dispatch Board (live task state)
   - Scope Advisor (outcome-history warnings)
   - Deliberation Gate (structural decision routing)
   - Reflexion Injection (past outcome summaries)

---

## Key Files & References

### Vault Documentation
- **[[Architecture/EMA Full Integration Roadmap]]** — Complete 6-month roadmap, all phases detailed
- **[[Architecture/EMA Claude Bridge Design]]** — Bridge technical architecture
- **[[Architecture/EMA Dual Backend Architecture]]** — Claude CLI vs. OpenClaw routing
- **[[Architecture/EMA-Workflow-Analysis-2026-04-03]]** — Trajan's actual workflow patterns + EMA affordances
- **[[Architecture/EMA Mesh Architecture]]** — Federation, multi-user, P2P concepts
- **[[Projects/EMA Sprint Status]]** — Running status of Phase 1 + 2
- **[[Codebases/EMA]]** — High-level overview (now should be updated to "active")
- **[[Research/EMA-Wilson-Deep-Research-2026-03-31]]** — Competitive research + design decisions

### Host Repository
- **Daemon:** `~/Projects/ema/daemon/` (Elixir/Phoenix)
- **Frontend:** `~/Projects/ema/app/` (React/Tauri)
- **Docs:** `~/Projects/ema/docs/` (architecture, API, design)
- **CLAUDE.md:** `~/Projects/ema/CLAUDE.md` (project context for Claude Code)
- **Git history:** `~/Projects/ema/.git/` (commit `5c577f0` = Phase 1 complete)

### Key Commands

```bash
# Start daemon locally
cd ~/Projects/ema/daemon && mix phx.server

# Start frontend dev
cd ~/Projects/ema/app && npm run dev

# Run tests
cd ~/Projects/ema/daemon && mix test

# Format + lint check
cd ~/Projects/ema/daemon && mix format && mix credo

# Hot reload desktop app
cd ~/Projects/ema/app && npx tauri dev
```

---

## Terminology & Glossary

| Term | Meaning |
|------|---------|
| **Bridge** | Elixir module managing Claude Code subprocess (Port) with streaming, sessions, circuit breaker |
| **Ralph Loop** | Proposal pipeline: Generator → Refiner → RiskAnalyzer → Formatter (EMA-003) |
| **MetaMind** | Prompt interception + peer review + prompt library (EMA-004) |
| **Pipes** | Event-driven automation — triggers (task:completed) → Claude actions → outputs |
| **Second Brain** | Graph-connected markdown vault with semantic links, tags, spaces |
| **Campaigns** | Named, persistent Claude sessions tied to projects with accumulated context |
| **VaultIndex** | Ecto schema + supervisor for querying host Obsidian vault |
| **Proposals** | AI-generated ideas queued for human review + quality gates |
| **Brain Dump** | Quick-capture inbox (thoughts, links, ideas) → auto-classify → route |
| **Glass morphism** | UI aesthetic: dark void backgrounds, frosted blur surfaces, teal/blue/amber accents |
| **Deliberation gate** | Check that routes structural (irreversible) decisions through Proposals pipeline first |
| **Reflexion** | Pattern: inject past outcome summaries into agent prompts before dispatch |
| **Scope advisor** | Mechanism that warns when task scope exceeds learned agent limits |
| **Dispatch board** | Live UI showing all in-flight agent dispatches (status, elapsed, agent, description) |

---

## Last Updated

**2026-04-03 20:30 UTC** — Right Hand consolidated from vault research, sprint logs, architecture docs, and CLAUDE.md.

**Next update:** After Phase 2 completion or when significant new context emerges.
