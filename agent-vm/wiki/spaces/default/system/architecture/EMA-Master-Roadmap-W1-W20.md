---
title: EMA Master Roadmap — W7 through W20
created: '2026-04-03'
updated: '2026-04-03'
type: knowledge
status: active
confidence: 0.88
tags:
  - ema
  - openclaw
  - roadmap
  - master
  - w7-w20
  - phases
  - spaces
  - mobile
  - federation
  - autonomous
summary: >-
  Full 20-week roadmap from current state (W7) to autonomous multi-user EMA with
  mobile, voice, Org Spaces, P2P mesh, and agent marketplace. Synthesized from
  EMA Full Integration Roadmap + ROADMAP_SYNTHESIS +
  OPENCLAW-EMA-SYSTEM-MARRIAGE-DESIGN + OpenClaw node integration spec.
related:
  - '[[Architecture/EMA Full Integration Roadmap]]'
  - '[[Research/EMA-OpenClaw-Node-Integration-Spec-2026-04-03]]'
  - '[[Research/EMA-Deep-Context-Synthesis-2026-04-03]]'
wiki_id: system/architecture/EMA-Master-Roadmap-W1-W20
imported_from: vault/Architecture/EMA-Master-Roadmap-W1-W20.md
imported_at: '2026-04-04T00:23:56.749Z'
---

# EMA Master Roadmap — W7 through W20

*2026-04-03 23:00Z | Synthesized from all vault architecture docs + research*

---

## The Compounding Loop (North Star)

Every phase adds to the same compounding loop:

```
Agent does work
→ Reflection Loop captures lessons  
→ Outcome tracker updates fitness scores
→ Next dispatch is smarter (Scope Advisor + Reflexion Injection)
→ Agents specialize (Campaign system crystallizes patterns)
→ System extends to new surfaces (CLI, Mobile, Voice)
→ Multiple users on one EMA (Org Spaces)
→ EMA instances federate (network intelligence compounds)
→ Autonomous loops run without human input (daily planning, research monitoring)
```

The roadmap is ordered: **data first → visibility → intelligence → surfaces → network → autonomy.**

---

## Current State (W7, April 3 2026)

**Built:**
- EMA daemon: 16 domain modules, 2,457 source files
- Claude Bridge: Port subprocess + streaming + circuit breaker + cost tracker
- Proposals pipeline: generate → evaluate → refine
- HQ frontend: skeleton UI, mock data
- Campaign struct: designed, no code
- Superman: architecture complete, nothing implemented
- OpenClaw: 29 agents, `POST /tools/invoke` live, chat completions disabled

**Not built:**
- `Campaign.Flow` state machine
- `/api/projects/:id/context` (HQ shows mocks)
- Bridge async dispatch (currently blocking System.cmd)
- Superman embedding pipeline
- OpenClaw chat completions enabled
- `Ema.OpenClaw.Client` module
- Deliberation Gate
- Reflexion Injection

---

## PHASE 2 — Foundation (W7) — Make HQ Real

**Goal:** Real data in HQ. Non-blocking dispatch. OpenClaw wired as EMA node.

### W7 Deliverables

| # | Feature | Effort | Priority |
|---|---|---|---|
| A | `POST /api/projects/:id/context` (Phase 1: SQLite only) | 3h | P0 |
| B | `Campaign.Flow` state machine (states + transitions) | 2h | P0 |
| C | Enable OpenClaw `/v1/chat/completions` endpoint | 5min | P0 |
| D | Build `Ema.OpenClaw.Client` (dispatch + streaming + vault_search) | 3h | P0 |
| E | Wire OpenClaw into EMA `Application.ex` | 30min | P0 |
| F | Dispatch Board (live task table with status + elapsed) | 1d | P1 |
| G | Bridge Dispatch → Async Callback (no more blocking System.cmd) | 1d | P1 |
| H | Deliberation Gate (structural complexity detector → proposal required) | 1d | P1 |
| I | Reflexion Injection (past lesson summaries in agent prompts) | 4h | P1 |
| J | Honcho Docker up (self-hosted, 4-service stack) | 30min | P2 |
| K | Prompts table + hot-reload | 4h | P2 |

**W7 Exit Criteria:**
- HQ shows real project data (tasks, proposals, executions — not mocks)
- Dispatch Board lists in-flight OpenClaw agent tasks with live status
- EMA can dispatch to any of 29 OpenClaw agents and stream output back
- Structural tasks route through Deliberation Gate → proposal pipeline
- Bridge sends async — no blocking calls in dispatch path

---

## PHASE 2.5 — Visibility Layer (W8, parallel tracks)

**Goal:** Surface what the system knows. Close the data/visibility gap.

### W8 Tracks (Parallel)

**Track 1: Outcome Learning Dashboard (2 days)**
- Agent fitness leaderboard (ranked by success rate, model, task type)
- Crystallization candidate tracker (patterns → 5 successes → workflow template)
- Failure heatmap by agent × task type
- Discord alert on crystallization threshold hit

**Track 2: Proposal Visualization Explorer (2 days)**
- `proposal_versions` schema migration
- Timeline view per project (all proposals, chronological)
- Version diff viewer (side-by-side, syntax highlighted)
- Filter by agent, status, date range

**Track 3: Vault Auto-Sync (2 days)**
- `VaultSync` GenServer subscribing to EMA change events
- Staleness detection (notes referencing archived/changed EMA entities)
- Backlink repair queue
- Weekly Discord sync summary

**Track 4: EMA CLI (3 days)**
- `ema task list/create/update/view`
- `ema agent ps / kill`
- `ema proposal list/view`
- `ema outcome log`
- `ema project context <id>`
- Table output + `--json` flag

**W8 Also: OpenClaw ↔ EMA Real-time Sync**
- Session Watcher: capture Claude Code sessions → EMA execution history
- Execution Visualizer: live streaming output in HQ Dispatch Board
- Discord ↔ EMA Bridge: sync task updates to Discord channels
- Vault sync daemon: bidirectional (OpenClaw vault ↔ EMA Second Brain), 30min cadence

**W8 Exit Criteria:**
- Outcome Dashboard live in HQ navigation
- Proposal timeline accessible for any project
- VaultSync running and sending weekly reports
- `ema` CLI installed and working from terminal
- HQ shows streaming Claude output while agents work

---

## PHASE 3 — Intelligence Layer (W9-W10) — Close the Loop

**Goal:** Agents learn from their own work. System gets measurably smarter each week.

### W9: Learning Foundation

| Feature | Effort | Deliverable |
|---|---|---|
| Agent Reflection Loop | 3d | Auto-reflection on task complete → structured outcome entry |
| Execution Audit Trail + Diffs | 3d | Full audit log with file diffs + one-click rollback |
| Superman Embedding Pipeline | 2d | nomic-embed-text via Ollama + sqlite-vss, 1K items/50s |
| `.superman` File Runtime Reader | 1d | VaultWatcher extension + IntentParser + KnowledgeGraph inject |
| Honcho Integration in EMA backend | 1d | `Ema.Honcho` client + session storage per project |

**W9 Exit Criteria:**
- Every completed/failed task triggers structured reflection
- Outcomes auto-written to tracker (no manual logging required)
- Audit log shows complete task history with file diffs
- Superman parsing `.superman` files and injecting into agent spawns
- Honcho reasoning layer active for project session memory

### W10: Intelligence Surfaces

| Feature | Effort | Deliverable |
|---|---|---|
| SOUL.md Editor + Testing | 3d | In-app editor with test suite, version history, deploy gate (min score 7.0/10) |
| Session Capture + Active Memory | 4d | Auto-vault notes every session + injection into new tasks |
| Loomkin Decision Graph (7 node types) | 2d | Ecto schemas persisted to Postgres (upgrade from SQLite) |
| Loomkin Context Mesh (Keeper GenServer) | 2d | Lossless tiered context replacing truncation in Superman |
| PromptOptimizer GenServer | 4h | Weekly A/B testing of underperforming prompts |

**W10 Exit Criteria:**
- Every significant session auto-captured as vault note
- Active memory search injects past sessions into new agent prompts
- PromptOptimizer running weekly, surfacing A/B results in Dashboard
- SOUL.md changes tested before deployment, no change ships below 7.0
- Decision graph persisting to Postgres with 7 node types and typed edges

---

## PHASE 3 (Continued) — Slack Mirror (W9)

**Goal:** EMA accessible from Slack as a third interface alongside HQ and Discord.

| Feature | Effort | Deliverable |
|---|---|---|
| Slack App with Bot | 2d | `/task`, `/projects`, `/exec`, `/proposal` commands |
| Real-time Slack Channels | 1d | #tasks, #projects, #proposals, #executions — live sync |
| Webhook Sync (bidirectional) | 1d | EMA events → Slack + Slack commands → EMA |
| OAuth Authentication | 4h | Slack OAuth for multi-workspace support |

**W9 Exit Criteria:**
- Slack app deployed and functional
- All 4 channels syncing in real-time
- Users can manage work from EMA HQ, Discord, or Slack

---

## PHASE 4 — Advanced Interfaces (W11-W12) — Navigation Layer

**Goal:** EMA is now smart — make it beautiful and navigable.

### W11: Knowledge Graph Browser

**What ships:**
- Force-directed graph of all EMA entities + vault notes (libgraph → rendered)
- Click navigation: node → details panel
- Query-driven subgraph highlight
- Cluster view (project-grouped)
- Semantic search → "Find everything related to StudioKamel"

**Why W11:** Superman needs 2+ weeks of data (from W9) before the graph is meaningful.

**Effort:** 4 days

### W12: Multi-Space UI (Phase 1: Personal + Agent)

**What ships:**
- Space selector in HQ: Personal / Agent / (future: Org)
- Agent Space view: live OpenClaw agent roster, active sessions, execution queue
- Space-scoped Dispatch Board + Outcome Dashboard
- Cross-space search toggle

**Why W12:** Requires stable schema (no more migrations W11+). Multi-Space before that is premature.

**Effort:** 5 days

---

## PHASE 5 — Agent Specialization + Autonomous Loops (W13-W16)

**Goal:** EMA agents specialize. Autonomous workflows run without human input.

### W13: Specialized Agent System

Replace the current generic AgentWorker with role-specific agents in EMA:

| EMA Agent | Role | Tools | Autonomous Triggers |
|---|---|---|---|
| **Strategist** | Goal decomposition, prioritization | goals, projects, proposals | goal:created, quarterly_review |
| **Researcher** | Deep dives, web research, synthesis | web_search, second_brain, vault | research:requested, topic:unknown |
| **Executor** | Task implementation via Claude Code | bridge (CLI + OpenClaw), git, filesystem | task:assigned, campaign:started |
| **Reviewer** | Quality gates, code review, proposal review | bridge, quality_gate, governance | commit:pushed, proposal:generated |
| **Archivist** | Knowledge organization, note maintenance | second_brain, vault_index, links | note:created, weekly_maintenance |
| **Coach** | Habits, journaling prompts, reflection | habits, journal, goals, focus | habit:streak_broken, focus:ended |

Note: These are EMA's **internal** specialized agents, distinct from OpenClaw's 29 agents. They route complex work to OpenClaw; they handle EMA domain reasoning locally.

**Effort:** 1 week

### W14: Inter-Agent Communication Bus

Agents talk through a signal bus (Synapse pattern):

```
Strategist: "Project X needs a research spike"
  → Researcher: runs web search (routes to OpenClaw researcher agent)
    → Strategist: incorporates findings, updates proposal
      → Reviewer: quality-gates the updated proposal
        → Executor: creates campaign, starts implementation
```

EMA Pipes layer upgraded to Synapse signal bus pattern:
- Domain-agnostic signal registry
- Runtime topic registration
- Postgres persistence for signal audit trail
- 22 triggers + 15 actions wired via signal bus (replaces per-trigger GenServer)

**Effort:** 1 week

### W15: Autonomous Workflow Loops

Pre-built pipe templates that run without human input:

| Loop | Trigger | What Happens |
|---|---|---|
| **Morning Briefing** | Daily 07:00 | Strategist reviews goals + overnight changes → priority list → Coach writes journal prompt |
| **End-of-Day Review** | Daily 18:00 | What got done, what slipped, journal prompt |
| **Weekly Retrospective** | Sunday 08:00 | Progress toward goals, proposal outcomes, habit trends |
| **Research Monitoring** | Continuous | Researcher watches configured topics, surfaces important developments to #research-feed |
| **Code Health Loop** | On commit | Reviewer audits diff, files issues, assigns campaigns |
| **Knowledge Maintenance** | Weekly | Archivist prunes stale notes, merges duplicates, strengthens links |

**Governance controls:**
- Approval tiers: low-risk autonomous, medium-risk notify, high-risk require approval
- Per-agent token budget caps (day/week)
- Kill switches: pause any agent or loop from HQ
- Audit dashboard: what every agent did, when, why, what it cost
- Confidence thresholds: below threshold → queue for human review

**Effort:** 1 week

### W16: Human-in-the-Loop Governance Dashboard

Full audit and control surface:

- Live agent activity feed (what's running right now, cost, progress)
- Approval queue (medium-risk actions waiting for sign-off)
- Budget tracker (per-agent, per-campaign, per-day)
- Kill switches accessible from HQ navigation
- Confidence threshold configuration per agent type

**Effort:** 1 week

---

## PHASE 6 — Org Spaces + P2P (W17-W18)

**Goal:** EMA extends beyond single-user. Multiple people, multiple devices. Trajan-Network architecture realized.

### W17: Org Spaces Architecture

**Data model:**
```
Personal Space (Trajan's EMA, local SQLite)
├─ Projects/ Tasks/ Vault/ Executions/
Agent Space (OpenClaw agents, live sessions)
Org Space (shared with collaborators — NEW)
├─ Shared Projects/
├─ Shared Channels/ (like Colanode)
├─ Shared Databases/ (structured data)
└─ Per-user views (filter by owner, etc.)
```

**Org Space requires:**
- User auth system (not needed for Personal Space)
- Server-side persistence (Postgres, not SQLite — migration from W10)
- Workspace isolation (different trust levels = different servers)
- Permission model (who can see/edit what)

**Reference implementation:** Study Colanode's multi-server connection model + workspace isolation before designing.

**Effort:** 2 weeks

### W18: Local-Write-First + Loro Sync

**Vault hierarchy sync:**
- Loro Moveable Tree CRDT for directory structure (handles rename/move conflicts Yjs can't)
- Background sync daemon: local write → Loro CRDT → peer sync

**Document content sync:**
- Yjs for Second Brain note content (battle-tested, Colanode uses it)
- Multiple people editing same note → real-time CRDT merge

**Pier daemon (v1):**
- Unified node abstraction running on every device
- EMA daemon = Pier for FerrissesWheel
- OpenClaw gateway = Pier for agent-vm
- Pier routing table: knows other Piers, their capabilities, trust levels

**Transport:**
- Local LAN: already works (gateway bind=lan)
- Remote: Tailscale mesh (already configured on agent-vm)
- Phase B: any-sync protocol for encrypted P2P (no central server)

**Effort:** 2 weeks

---

## PHASE 7 — Mobile + Voice (W19-W20)

**Goal:** EMA extends to mobile. Capture anywhere, approve anywhere. Voice input to brain dump.

### W19: Mobile Companion App

**Stack:** React Native (shared components with HQ React frontend) or Expo

**Feature set (v1):**
- Brain Dump capture (text, voice → Claude processing → tasks/notes)
- Task review: see today's priorities, mark complete
- Proposal approval: review and approve/reject proposals from phone
- Agent status: see what's running, costs, completion alerts
- Push notifications from autonomous agents

**Key architecture decision:** Mobile reads from the same Org Space server (W17). Local SQLite on mobile syncs to Pier. Offline-first — capture works without network.

**Effort:** 2 weeks

### W20: Voice Input + Natural Language Anywhere

**Voice input pipeline:**
```
Voice → Whisper (local transcription, via Ollama) → Claude → structured intent
→ BrainDump item / Task / Project / Note (depending on intent classification)
```

**Integration points:**
- EMA desktop: voice capture widget in HQ
- Mobile: voice-first capture (talk instead of type)
- Autonomous: Coach speaks journal prompts, user responds by voice

**Natural language everywhere:**
- `ema` CLI with natural language: `ema "what are the most important things to do today?"` → Strategist agent response
- HQ search: semantic natural language search across all entities
- Proposal review: "make the auth approach less risky" → Claude refines the proposal in-place

**Effort:** 2 weeks

---

## W7-W20 Calendar

```
W7   Phase 2      OpenClaw node wired, HQ real data, Campaign.Flow, async Bridge
W8   Phase 2.5    Outcome Dashboard, Proposal Explorer, Vault Sync, EMA CLI
W9   Phase 3a     Reflection Loop, Audit Trail, Superman embedding, Slack Mirror
W10  Phase 3b     SOUL.md Editor, Session Capture, Decision Graph, Honcho
W11  Phase 4a     Knowledge Graph Browser (force-directed, searchable)
W12  Phase 4b     Multi-Space UI (Personal + Agent spaces)
W13  Phase 5a     Specialized Agent System (6 role agents in EMA)
W14  Phase 5b     Inter-Agent Signal Bus (Synapse pattern for Pipes)
W15  Phase 5c     Autonomous Loops (Morning Briefing, Code Health, Research Monitor)
W16  Phase 5d     Governance Dashboard (approval queue, budgets, kill switches)
W17  Phase 6a     Org Spaces Architecture (multi-user, auth, permission model)
W18  Phase 6b     Loro+Yjs Sync + Pier Daemon v1 (P2P foundation)
W19  Phase 7a     Mobile Companion (React Native/Expo, brain dump, approvals)
W20  Phase 7b     Voice Input + Natural Language Everywhere
```

---

## W15-W20 Research Needs

These phases need research before building:

| Phase | Research Question | Priority |
|---|---|---|
| W17 Org Spaces | Colanode sync engine deep study (how their background process works) | P0 before W17 |
| W18 Loro sync | Loro Elixir/WASM bindings — is there a NIF or do we need a sidecar? | P0 before W18 |
| W18 any-sync | any-sync protocol spec — compatible with Loro CRDTs or different transport? | P1 before W18 |
| W19 Mobile | React Native vs Expo for Tauri-adjacent mobile — code sharing strategy | P0 before W19 |
| W20 Voice | Whisper via Ollama — latency on agent-vm, model size vs accuracy | P0 before W20 |
| W14 Signal Bus | Synapse signal bus production readiness (Postgres persistence, failure modes) | P1 before W14 |
| W15 Autonomous | Any-sync node discovery — how do Piers find each other without central server? | P2 |

---

## Cumulative Effort Summary

| Phase | Weeks | Features | Complexity |
|---|---|---|---|
| 2 | W7 | 11 tasks (A-K) | Medium |
| 2.5 | W8 | 4 parallel tracks + OpenClaw sync | Medium |
| 3 | W9-W10 | 10 features + Slack mirror | High |
| 4 | W11-W12 | 2 features (KG + Multi-Space) | Medium |
| 5 | W13-W16 | 4 phases (agents + bus + loops + governance) | High |
| 6 | W17-W18 | 2 phases (Org Spaces + P2P sync) | Very High |
| 7 | W19-W20 | 2 phases (Mobile + Voice) | High |

---

## The "Done" Milestones

### End of W7
> Enable OpenClaw chat completions endpoint. Build `Ema.OpenClaw.Client`. Open HQ → switch to a real project → see real tasks, proposals, executions. Dispatch a task to OpenClaw researcher → watch it stream back in HQ.

### End of W8
> Open terminal → `ema task list --status running` → see live agents. Open HQ Outcome Dashboard → see agent fitness scores. Vault syncs automatically.

### End of W10
> Every task auto-reflects when done. Every session is searchable. Every agent walks into a task knowing the last 3 times someone tried something similar. SOUL.md changes tested before deployment. Decision graph has 7 node types and is persisting to Postgres.

### End of W12
> Open Knowledge Graph Browser → click around the vault visually. Switch to "Agent Space" → see the 29 OpenClaw agents as a live roster with their active sessions.

### End of W16
> EMA agents specialize and route work to each other automatically. Morning briefing runs itself at 07:00. Code health loop reviews every commit. Governance dashboard shows everything that's happening, with approval queue for risky actions.

### End of W18
> Connect a second device. Open EMA on it. Projects, tasks, proposals sync automatically via Loro CRDTs. Vault hierarchy syncs without conflicts. Pier daemon runs on both devices and on agent-vm.

### End of W20
> Pick up phone. Say "add a research task about competitor pricing for StudioKamel." Watch it appear in HQ. Approve proposals by voice. EMA runs without requiring a keyboard.
