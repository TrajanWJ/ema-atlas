---
title: EMA Full Integration Roadmap
created: '2026-04-01'
updated: '2026-04-01'
type: knowledge
status: active
confidence: 0.85
tags:
  - ema
  - claude-code
  - openclaw
  - roadmap
  - vision
  - architecture
summary: >-
  Multi-month roadmap for EMA's deep Claude Code integration — from crude
  subprocess wrapper to native AI-powered executive management system.
wiki_id: system/architecture/EMA_Full_Integration_Roadmap
imported_from: vault/Architecture/EMA Full Integration Roadmap.md
imported_at: '2026-04-04T00:23:56.746Z'
---

# EMA Full Integration Roadmap

## Where We Are (April 2026)

EMA is an Elixir/Phoenix daemon + Tauri/React desktop app with:
- **2,457 source files** across daemon and frontend
- **16 domain modules** (proposals, agents, pipes, goals, habits, journal, canvas, brain dump, second brain, focus, vault index, projects, tasks, responsibilities, workspace, settings)
- **6 crude `Runner.run()` callsites** — fire-and-forget `System.cmd("claude", ...)`, no streaming, no sessions, no hooks
- **6-file ClaudeSessions module** — watches host Claude sessions (read-only), doesn't control them
- **Pipes workflow engine** — event-driven automation, trigger-pattern matching
- **Second Brain** — graph-connected markdown vault with links, spaces, tags
- **Agent system** — per-agent GenServers with conversations, memory summarization, tool execution

The Bridge module set (just built) replaces Runner with proper Port management, streaming, circuit breaker, cost tracking, governance audit, and dual Claude CLI / OpenClaw backends.

## Where We're Going (Next 6 Months)

EMA becomes a **sovereign AI executive system** — Claude isn't a tool EMA calls; Claude is the cognitive engine that EMA orchestrates. Every domain module gets an AI layer. The system compounds intelligence across sessions, projects, and goals.

---

## Phase 1: Foundation (April 2026) — 2 weeks

### 1.1 Bridge Migration
- Swap all 6 `Runner.run()` → `Bridge.run()` callsites
- Wire `Ema.Claude.Supervisor` into `Application.ex`
- Add `maybe_start_claude_bridge/0` to children list
- Run the 2 Ecto migrations (usage_records, audit_logs)
- Verify backward compatibility (same inputs → same outputs)

### 1.2 Streaming Pipeline
- Add `on_event` callbacks to all proposal pipeline stages
- Wire to Phoenix.PubSub → LiveView/WebSocket → Tauri frontend
- Frontend shows real-time token generation per pipeline stage
- "Thinking" indicators for each stage (generator thinking... refiner strengthening...)

### 1.3 Frontend Backend Switcher
- Settings page toggle: Claude CLI ↔ OpenClaw
- Show current backend capabilities
- Status indicator: which backend is active, is it healthy
- `Backend.capabilities()` drives UI feature flags

**Deliverables:** Streaming proposals, dual backend, zero regression.

---

## Phase 2: Persistent Intelligence (May 2026) — 3 weeks

### 2.1 Multi-Turn Agent Sessions
Replace the current fire-and-forget agent pattern with persistent sessions:

```
Current:  User msg → build prompt (inject history) → Runner.run() → parse → reply
Future:   User msg → Bridge.send_message(session_id, msg) → stream → reply
```

- Claude Code maintains its own conversation memory within a session
- `AgentMemory` becomes a session lifecycle manager, not a summarizer
- Session persistence: `--session-id` survives daemon restarts
- Session forking: explore branches without losing the trunk

### 2.2 Campaign System
Long-running projects get **campaigns** — named, persistent Claude sessions that compound knowledge:

```elixir
defmodule Ema.Campaigns do
  # A campaign is a named, multi-session Claude engagement
  # tied to a project, with accumulated context
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

Inspired by Citadel's campaign YAML — but stored in Ecto with full lifecycle:
- `campaign start "refactor auth" --project myapp`
- Multiple sessions within a campaign share discoveries
- Campaign-level cost tracking and audit trail
- Campaign artifacts persist in Second Brain

### 2.3 Session Watcher Integration
The existing `ClaudeSessions` module watches host Claude Code sessions passively. Integration point:

- When EMA detects a new host session in a project it manages → auto-link to the project
- When a host session creates files in a watched directory → trigger Pipes
- Session parse results → feed into Second Brain as knowledge nodes
- Bidirectional: EMA can spawn sessions that show up in `claude --continue`

**Deliverables:** Agents with real memory, campaigns, session bidirectionality.

---

## Phase 3: Autonomous Pipes (June 2026) — 3 weeks

### 3.1 AI-Powered Pipe Actions
Currently Pipes have triggers + transforms + actions. Add a new action type: `claude_action`:

```elixir
defmodule Ema.Pipes.ClaudeAction do
  # A pipe action that runs a Claude session
  schema "pipe_actions" do
    field :action_type, :string  # "claude"
    field :prompt_template, :string
    field :model, :string
    field :quality_gate, :string  # :proposal, :code_review, :general
    field :output_target, :string  # :second_brain, :task, :proposal, :notification
  end
end
```

- `project:commit_pushed` → Claude reviews the diff, creates tasks for issues
- `proposal:accepted` → Claude generates implementation tasks, assigns to campaigns
- `goal:deadline_approaching` → Claude audits progress, suggests interventions
- `habit:streak_broken` → Claude writes a journal reflection
- `brain_dump:captured` → Claude processes, categorizes, creates notes in Second Brain

### 3.2 Event-Driven Intelligence
Every domain module becomes a PubSub event source. Claude listens:

```
task:completed          → update project progress, suggest next task
proposal:generated      → auto-run quality gate, refine if needed
journal:entry_saved     → extract entities, link to projects/goals
note:created            → auto-tag, suggest connections in knowledge graph
focus:session_ended     → summarize what was accomplished, update tasks
```

### 3.3 Pipe Templates (Pre-built Workflows)
Ship with batteries-included pipe templates:

- **Morning Briefing** — summarize overnight changes, today's priorities, goal status
- **End-of-Day Review** — what got done, what slipped, journal prompt
- **Weekly Retrospective** — progress toward goals, proposal outcomes, habit trends
- **Research Spike** — take a topic → web search → summarize → create Second Brain note
- **Code Review Pipeline** — commit → Claude review → create issues → assign campaigns

**Deliverables:** Self-running Claude workflows, event-driven intelligence, template library.

---

## Phase 4: Knowledge Synthesis (July–August 2026) — 6 weeks

### 4.1 Second Brain ← → Claude Deep Integration
Second Brain currently stores markdown notes with links. Make it Claude-native:

- **Auto-linking:** When Claude generates content, it identifies existing notes and creates `[[wikilinks]]`
- **Knowledge gaps:** Claude reads the Second Brain graph, identifies disconnected clusters, suggests bridging notes
- **Contradiction detection:** Claude finds statements in different notes that conflict, flags for resolution
- **Progressive summarization:** Notes auto-summarize at multiple levels (detail → executive → headline)
- **Semantic search → Claude follow-up:** Search returns notes → "Ask Claude about these" → synthesized answer

### 4.2 Goal Intelligence
Goals are hierarchical (weekly → monthly → quarterly → yearly → 3-year). Claude layer:

```
3-year goal: "Build a sustainable product business"
  └─ yearly: "Launch 2 profitable products"
     └─ quarterly: "Ship MVP of Proslync"
        └─ monthly: "Complete Phase 1"
           └─ weekly: "Finish auth + onboarding"
```

- **Goal coherence check:** Claude validates that lower goals actually support higher ones
- **Progress inference:** Claude reads task completions, proposal outcomes, journal entries to infer goal progress without manual updates
- **Intervention suggestions:** When progress stalls, Claude proposes specific actions
- **Goal evolution:** Claude suggests goal mutations based on new information (pivot signals)

### 4.3 Vault Index Intelligence
`VaultIndex` currently indexes the host Obsidian vault. Upgrade:

- **Cross-reference EMA ↔ Vault:** Link EMA projects/proposals/notes to host vault notes
- **Vault ingestion pipeline:** Important vault notes get parsed by Claude, entities extracted, fed into Second Brain graph
- **Bidirectional sync:** EMA generates notes that sync back to the vault (via shared folder or direct write)

**Deliverables:** Self-organizing knowledge graph, goal-aware intelligence, vault federation.

---

## Phase 5: Autonomous Agency (September–October 2026) — 6 weeks

### 5.1 Agent Specialization
The current agent system is generic — every agent uses the same AgentWorker. Specialize:

| Agent | Role | Tools | Triggers |
|---|---|---|---|
| **Strategist** | Goal decomposition, prioritization | goals, projects, proposals | goal:created, quarterly_review |
| **Researcher** | Deep dives, web research, synthesis | web_search, second_brain, vault | research:requested, topic:unknown |
| **Executor** | Task implementation via Claude Code | bridge (CLI mode), git, filesystem | task:assigned, campaign:started |
| **Reviewer** | Quality gates, code review, proposal review | bridge, quality_gate, governance | commit:pushed, proposal:generated |
| **Archivist** | Knowledge organization, note maintenance | second_brain, vault_index, links | note:created, weekly_maintenance |
| **Coach** | Habits, journaling prompts, reflection | habits, journal, goals, focus | habit:streak_broken, focus:ended |

### 5.2 Inter-Agent Communication
Agents talk to each other through a message bus:

```
Strategist: "Project X needs a research spike on competitor pricing"
  → Researcher: runs web search, creates Second Brain note
    → Strategist: incorporates findings, updates proposal
      → Reviewer: quality-gates the updated proposal
        → Executor: creates campaign, starts implementation
```

### 5.3 Autonomous Loops
Some workflows run without human input:

- **Daily planning loop:** Every morning, Strategist reviews goals + tasks → generates today's priority list → Coach writes journal prompt
- **Research monitoring:** Researcher watches configured topics, surfaces important developments
- **Code health loop:** Reviewer periodically audits projects, files issues
- **Knowledge maintenance:** Archivist prunes stale notes, merges duplicates, strengthens links

### 5.4 Human-in-the-Loop Controls
Autonomy needs governance:

- **Approval tiers:** Low-risk autonomous, medium-risk notify, high-risk require approval
- **Budget caps:** Per-agent, per-campaign, per-day token budgets
- **Kill switches:** Pause any agent or campaign instantly from frontend
- **Audit dashboard:** See what every agent did, when, why, what it cost
- **Confidence thresholds:** Agent outputs below confidence threshold → queue for review

**Deliverables:** Specialized agent team, autonomous workflows, governance framework.

---

## Phase 6: Meta-Intelligence (November 2026+)

### 6.1 Self-Improvement Loop
EMA observes its own performance and evolves:

- Track which pipe templates get used most → optimize them
- Track which agent outputs get accepted vs rejected → tune prompts
- Track which proposals succeed → learn what makes good proposals
- A/B test prompt variations automatically

### 6.2 Multi-User / Multi-Instance
EMA as a platform:

- Each user gets their own Second Brain, goals, agents
- Shared projects with per-user views
- Agent marketplace — share agent configs and pipe templates
- Federation: EMA instances can share knowledge (opt-in)

### 6.3 Voice + Mobile
- Voice input → brain dump → Claude processing → tasks/notes
- Mobile companion (React Native or Expo) for capture and review
- Push notifications from autonomous agents
- Quick approve/reject on proposals from phone

---

## Architecture at Scale

```
┌─────────────────────────────────────────────────────────────────┐
│ Tauri Desktop App (React)                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Canvas│ │Goals │ │Tasks │ │Brain │ │Agents│ │Audit │        │
│  │      │ │      │ │      │ │Dump  │ │Chat  │ │Dash  │        │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘        │
│     └────────┴────────┴────────┴────────┴────────┘              │
│                    WebSocket / Phoenix Channels                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ Phoenix Daemon (Elixir/OTP)                                      │
│                                                                  │
│  ┌─────────────────────────────────────────────────┐             │
│  │ Claude Bridge                                     │             │
│  │  Backend ──┬── Claude CLI (Port)                  │             │
│  │            └── OpenClaw (Port)                     │             │
│  │  StreamParser ← JSONL events                      │             │
│  │  CircuitBreaker · CostTracker · Governance        │             │
│  │  QualityGate · CampaignManager                    │             │
│  └──────────────────┬──────────────────────────────┘             │
│                     │ PubSub                                     │
│  ┌─────────┐ ┌─────▼─────┐ ┌──────────┐ ┌──────────┐           │
│  │Proposals│ │   Pipes   │ │  Agents  │ │ Campaigns│           │
│  │Pipeline │ │ (event→AI)│ │(special.)│ │(persist.)│           │
│  └─────────┘ └───────────┘ └──────────┘ └──────────┘           │
│  ┌─────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐           │
│  │  Goals  │ │Second Brain│ │ Journal │ │  Habits  │           │
│  │(+intel.)│ │(+AI graph)│ │(+prompts)│ │(+coach) │           │
│  └─────────┘ └───────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  SQLite (Ecto) ── sessions, campaigns, audit, costs              │
└──────────────────────────────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │  Host Machine    │
                    │  Claude Code CLI │
                    │  Obsidian Vault  │
                    │  Git Repos       │
                    └─────────────────┘
```

## What Makes This Different

Every "AI productivity app" bolts ChatGPT onto a todo list. EMA is different because:

1. **Claude Code as cognitive engine, not chatbot** — it reads files, runs code, edits repos, has tools. Not GPT-wrapper-with-extra-steps.
2. **OTP supervision** — Elixir's actor model is purpose-built for managing concurrent, fault-tolerant AI processes. Crashed agent? Auto-restart. Rate limited? Circuit breaker. Memory overflow? Supervised compaction.
3. **Event-driven, not prompt-driven** — Pipes react to domain events autonomously. You don't ask Claude to review code; it reviews code because a commit happened.
4. **Compounding intelligence** — Campaigns, Second Brain, Goal hierarchy. Every interaction makes the system smarter about your life, projects, and patterns.
5. **Dual backend** — Max plan for local power, OpenClaw for distributed orchestration. Same bridge, same code, different topology.
6. **Desktop-native** — Tauri, not web. Fast, private, local-first. Your data stays on your machine.

## Cross-References
- [[EMA Claude Bridge Design]] — Phase 1 technical spec
- [[EMA Dual Backend Architecture]] — Backend switcher design
- [[Claude Code CLI Integration Reference]] — CLI API reference
- [[Harness Engineering Discipline]] — broader ecosystem context
- [[Generator-Evaluator Loops]] — quality iteration pattern
- [[Citadel Architecture Deep Dive]] — campaign and hook patterns
- [[Claude Agent SDK vs CLI Path]] — why CLI path wins
