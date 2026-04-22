EMA + HQ — MASTER SYNTHESIS & BUILD DOCUMENT
Full system state, ground truth, and complete action plan
2026-04-03 — End of session

# Ground Truth: What Is Actually Real

Before anything else, this is what exists versus what is designed. Every decision in this document is made against this reality, not the ideal state.

## Actually running:

- EMA daemon on localhost:4488 — Elixir/Phoenix, compiles, 3 warnings
- Tauri 2 shell wrapping React 19 frontend — broken on auto-start
- 52 virtual apps configured in workspace.ts
- 290 TypeScript files across 62 component folders
- Execution loop end-to-end — proposal approval → execution creation → Claude CLI dispatch → result write-back
- WebSocket channel executions:all broadcasting
- Vault watcher + GraphBuilder running
- Port orphan fix — committed
- Frontend build — fixed (TypeScript errors cleared)

## Designed but not running:

- Honcho — stubbed, returns dummy data
- Superman semantic indexing — not running, vault not indexed
- Proposal auto-dispatch — still manual
- OpenClaw integration — incomplete, manual dispatch only
- MCP servers (EMA Core, Wiki/Vault, OpenClaw Bridge) — designed, not wired
- 0 of 7 integrations connected (GitHub, Drive, Discord, Slack, APIs, servers)
- 9 of 14 apps — shells only, no backend wiring
- P2P Trajan-network — design only
- Campaign flow topology — schema designed, struct not written

## Broken and blocking:

- Tauri daemon auto-start — fails on app launch, "Connection failed"
- Proposal dispatch not automated — can approve but doesn't route to agents
- oauth-guardian and gateway on OpenClaw VPS — reported down this session, never confirmed restarted

---

# The Complete System Map

Everything that has been designed, specified, and decided across this entire session, in one place.

## Layer 1 — The Three Peers (Trajan-Network)

The first space is called Trajan-network. It has three nodes:

**EMA Daemon (localhost:4488)**
- Role: Hub — orchestration, proposals, tasks, executions, knowledge index
- Stack: Elixir/Phoenix + SQLite + React 19 + Tauri 2
- Status: Running (auto-start broken)

**OpenClaw Gateway (localhost:18789)**
- Role: Agent dispatch, message routing, CLI execution
- Stack: Node.js, self-hosted on Hetzner VPS
- Status: Running (oauth-guardian + gateway down — needs restart)

**Host Desktop (future Phase B)**
- Role: Local development, Claude Code integration
- Status: Design only

**Phase A (now):** REST + WebSocket between EMA and OpenClaw. Manual peer registration. Hub-and-spoke.
**Phase B (Week 9+):** P2P Pier mesh, CRDT sync, automatic conflict resolution, Host peer joins.

---

## Layer 2 — The Execution Loop

This is the core of the system. Everything else serves this loop.

```
Capture (BrainDump)
  ↓
Cluster (EMA intent threading — background)
  ↓
Surface (Dashboard intent thread widget — when readiness > threshold)
  ↓
Propose (Proposals app — human reviews)
  ↓
Approve (one tap)
  ↓
Dispatch (Agents app — Ema.Loop.Orchestrator)
  ↓ [Reflexion injection from Honcho]
  ↓ [Scope check from Scope Advisor]
  ↓
Execute (OpenClaw VPS or inline Claude)
  ↓
Harvest (SessionHarvester — result written to Execution record)
  ↓
Feedback (Outcome Tracker → Honcho → Evolution)
  ↓
Learn (next dispatch is smarter)
```

Every app in the system either feeds this loop or manages the infrastructure it runs on.

---

## Layer 3 — The 14 Apps

Full specification exists for all 14 apps in the EMA-Unified-Spec-With-Integrations.md (31KB).

**Week 7a — Core loop (build these first):**
- Dashboard — System state at a glance. Needs /api/projects/:id/context endpoint. Shell exists, needs real data.
- BrainDump — Frictionless capture. Backend exists. Needs intent thread view.
- Tasks — Work tracking. Backend exists. TaskBoard.tsx exists.
- Proposals — Deliberation layer. Proposal engine live. Needs dispatch wiring.
- Agents — Dispatch board. Dispatcher live. Needs Campaign.Flow topology.

**Week 7b — Context and knowledge:**
- Projects — Living context objects. Needs /context assembler.
- Wiki (was Vault) — Permanent knowledge + Superman. VaultWatcher live, semantic indexing not running. Wiki API live at :8093 (1288 pages indexed).
- Canvas — Visual thinking. Shell only.

**Week 8a — Lifestyle and automation:**
- Habits — Shell only.
- Journal — Shell only.
- Focus — GenServer exists, UI needs wiring.
- Pipes — 22 triggers, 15 actions exist in backend.

**Week 8b — Connections:**
- Channels — Needs channel config UI.
- Integrations Manager — Design only — new app, not yet built.
- Responsibilities — Schema exists, no UI.

---

## Layer 4 — The Integrations

Seven integrations specified. Priority order based on immediate workflow impact.

**Tier 1 — Build in Week 8b:**

**GitHub** — bidirectional. Repos link to Projects. Commits update project last activity. PR opened → suggest Proposal. Deploy failed → create urgent Task + notify channel. Create branch from Task, create PR from Proposal. Auth: GitHub OAuth or personal access token stored in Integrations Manager.

**Discord** — linking existing server channels to EMA. Post Execution results to channel. Post Proposal approvals to channel. Keyword detection in Discord → create BrainDump item (via OpenClaw). React with ✅ on a card → approve Proposal. React with 🚀 → pin. Channel routing rules configurable per project.

**Slack** — same pattern as Discord. One codebase, two channel type adapters.

**Tier 2 — Build in Week 9:**

**Google Drive** — bidirectional folder sync. Vault files export to Drive docs. Project notes sync to shared folder. Execution results append to project doc. One Drive folder can link to multiple Projects.

**API Providers (Anthropic, OpenAI, etc.)** — secure key storage in Integrations Manager. Agents read keys at dispatch time. Cost tracking per provider per execution. Evolution can suggest cheaper models based on task type.

**VPS / Servers** — monitor CPU, RAM, disk via lightweight reporter installed once per server. Render/Vercel/Netlify deploy status via their APIs. High CPU → alert Pipe. Deploy failed → urgent Task. Links to Projects via Resources tab.

**Tier 3 — Post Week 9:**

**Cross-integration linking** — one GitHub repo links to multiple Projects, one Drive folder shared across Projects, one Discord channel receives alerts from multiple Projects. This is the graph layer on top of individual integrations.

---

## Layer 5 — Superman + Wiki

Superman is not EMA. Superman is a specialized intelligence module called by EMA when the context requires it. EMA owns the loop. Superman owns deep understanding.

**What Superman does:**
- Knowledge graph — nodes are files, projects, clients, deployments, functions, routes. Edges are relationships between them.
- Intent modeling — reads .superman files, infers what a project is trying to become
- Proactive analysis — surfaces things wrong or incomplete (overdue invoice, down deployment, decaying intent thread)
- Cross-session learning — persistent working memory that updates incrementally

**What the Wiki app is (formerly Vault):**
- Left panel: folder tree mirroring ~/vault/ filesystem (+ wiki/spaces/default/ for new pages)
- Right panel: file viewer with wikilink rendering
- Graph view toggle: nodes = files, edges = wikilinks, size = incoming links, color = folder
- .superman file editor: structured fields for six intent keywords
- Semantic search (when Superman indexing is running): conceptually related files surface even without keyword match

**Current Superman status:**
- VaultWatcher: running (watches filesystem for changes)
- GraphBuilder: running (builds static graph from wikilinks)
- Semantic indexing: NOT running (vault not indexed, no embeddings)
- Intent file reader: NOT running at runtime (files exist as documentation only)

**What needs to be built to make Superman real:**
- Embedding pipeline — on file save, generate embedding, store in SQLite vector extension or external store
- Runtime intent file reader — on project switch or agent spawn, read .superman file, inject into context
- Proactive analyzer — background job that surfaces anomalies (overdue, down, stale)
- HQ context assembler — GET /api/projects/:id/context assembles Superman's knowledge into one response

---

## Layer 6 — HQ

HQ is the browser-based projection layer over EMA. It is not a separate system. It reads from EMA's API and renders what EMA knows.

**Architecture:**
```
hq/src/
  api/
    superman.js ← all API calls, never talk to GitHub/Render/OpenClaw directly
  context/
    ProjectContext.js ← active project state, WebSocket subscription
  components/
    Sidebar.jsx ← collapsible, all 14 app icons
    TopBar.jsx ← space indicator, project switcher, time, OpenClaw status
    Dashboard.jsx ← context-aware, changes per active project
    FloatingWindow.jsx ← pop-out any widget
  widgets/
    ExecutionFeed.jsx ← live from executions:all WebSocket
    GitHubWidget.jsx
    HostingWidget.jsx
    IntentBoard.jsx
    ClientCard.jsx
    DispatchBoard.jsx
```

**The project switch mechanism:**
User selects project in top bar pill → GET /api/projects/:id/context → EMA assembles full context → entire dashboard repaints. One API call. One repaint. No manual reconstruction.

**Two data layers rendered simultaneously:**
- Persistent context (repo, deployment, client, domains) — loads once on switch, stable
- Live execution state (active tasks, recent executions, intent threads) — continuous WebSocket updates

**The one metric that proves HQ is real:**
Open HQ. Switch to StudioKamel. See the actual last commit to the StudioKamel repo, the actual Render deployment status, and the actual last execution EMA ran for that project. All without touching another tab.

---

## The Four Most Critical Unresolved Questions

Before building anything new, these need answers. They are blocking questions, not design questions.

**Question 1 — Tauri daemon auto-start**
What is the exact failure? Race condition? Wrong RPC path? This blocks every demo and every test. Fix estimate: 2-3 hours once root cause is identified. Action: code audit of daemon spawn path and RPC initialization sequence.

**Question 2 — Proposal dispatch automation status**
The loop shows proposal approval → execution creation → dispatch is wired in code. But the discovery audit says dispatch is still manual in practice. Which is true? If it's wired, why isn't it running? If it's not wired, what exactly is missing? Action: trace one real proposal approval through the codebase end to end.

**Question 3 — OpenClaw VPS status**
oauth-guardian and gateway were reported down this session. Were they restarted? This blocks all agent dispatch through OpenClaw. Action: SSH to VPS, check process status, restart if needed, confirm.

**Question 4 — Superman indexing**
Is the embedding pipeline running at all? Wiki API at :8093 has 1288 pages indexed via FTS5. Full semantic search (embeddings) still needs building. Action: check Superman module for running processes; wiki API search is available now as fallback.

---

# The Complete Agent Delegation Plan

Organized by what can run immediately versus what has dependencies.

## IMMEDIATE — no dependencies, start now:

### Agent Infra-1 — Fix Tauri auto-start
- Audit daemon spawn path in Tauri config
- Check RPC initialization timing — is there a race condition?
- Check daemon path resolution on startup
- Test daemon starts independently: mix run --no-halt
- Test Tauri shell finds daemon: check IPC path
- Fix and verify with clean app launch
- Report: exact cause, exact fix, confirmed working

### Agent Infra-2 — Restart OpenClaw VPS services
- SSH to Hetzner VPS
- Check: systemctl status oauth-guardian
- Check: systemctl status openclaw-gateway
- If down: systemctl restart oauth-guardian && systemctl restart openclaw-gateway
- Verify: openclaw gateway responding on port 18789
- Verify: auth token flow working
- Report: service status confirmed, timestamp

### Agent Research-1 — Superman indexing status audit
- Check Superman module for embedding pipeline
- Check for vector storage (SQLite extension? External?)
- Check when vault was last indexed (look for index files)
- Check VaultWatcher → GraphBuilder → semantic indexing chain
- Report: what is running, what is stubbed, what doesn't exist yet
- Recommend: minimum viable embedding pipeline for Week 8 Wiki semantic search

---

## WEEK 7 — after Infra-1 and Infra-2 complete, run in parallel:

### Agent Backend-1 — Project context API endpoint
Add to router.ex:
- GET /api/projects — list all projects with status
- GET /api/projects/:id/context — full context assembler

Context assembler returns:
- project: {id, name, status, description}
- repo: {url, last_commit, branch, open_prs} (from stored resource links)
- deployment: {platform, url, last_deploy, status}
- executions: [last 10, with status and result summary]
- proposals: [open proposals, pending review]
- client: {name, email, invoice_status} if linked
- intent_threads: [active clusters from BrainDump tagged to project]
- notes: [recent project notes]

Write the JSON response shape to a file before building HQ against it
Report: both endpoints working, confirmed JSON shape documented

### Agent Backend-2 — Honcho Docker setup and integration
- docker run -d -p 8000:8000 plasticlabs/honcho:latest
- Verify running at localhost:8000

Create lib/ema/honcho.ex with:
- store_session(session_id, messages)
- query_user(question)
- session_context(session_id, tokens: 10_000)

Wire store_session into SessionHarvester on completion
Wire query_user into Dispatcher pre-spawn prompt:
- "What are preferences for #{task_type} tasks?"
Wire scope check on task creation:
- "What scope limits for #{agent_id} on #{scope_description}?"

Run one real dispatch with Honcho active
Verify context appears in spawn prompt in execution log
Report: Honcho running, three integration points wired, one verified test

### Agent Backend-3 — Deliberation Gate
Create lib/ema/tasks/structural_detector.ex:
- @structural_keywords ~w[restructure migrate delete rename globally refactor replace all move vault redesign]
- structural?/1
- route/1 → {:require_proposal, task} | {:direct_dispatch, task}

Wire into task creation before dispatch check

Add UI prompt in task creation form:
- If structural: amber banner — "This task looks structural. Generate a proposal first?" [Yes → Proposals] [No → Direct dispatch]
- Checkbox: "Don't ask again for this type"

Test: one structural task (contains "restructure") → routes to Proposals
Test: one routine task → dispatches directly
Report: detector live, routing confirmed, UI prompt working

### Agent Backend-4 — Campaign Flow Topology
Create lib/ema/campaigns/flow.ex:
- defstruct [:id, :name, :run_id, steps: [], edges: []]
- step: %{id, agent_id, prompt_template, dependencies: [], status: :pending, started_at: nil, elapsed: nil}

Add run_id to Campaign — differentiates template from instance
Wire step status updates through existing execution lifecycle events:
- execution started → step status :running
- execution completed → step status :done
- execution failed → step status :failed

Create basic DispatchBoard data query:
- get_inflight_steps() → returns all running/pending steps with elapsed time

Report: Flow struct live, run_id wired, step states updating

### Agent Frontend-1 — HQ project switcher and live dashboard
(depends on Backend-1)
Create api/superman.js:
- getProjects()
- getProjectContext(id)
- connectExecutionStream() → WebSocket to executions:all

Create context/ProjectContext.js:
- activeProject state
- projectData state
- switchProject(id) — calls getProjectContext, updates all widgets
- WebSocket subscription — updates executions in real time

Build project switcher pill in TopBar:
- Shows active project name with status dot
- Click → command palette listing all projects with last-active time
- Select → calls switchProject(id)

Wire Dashboard widgets to ProjectContext:
- StatCards → project-specific counts from projectData
- ExecutionFeed → projectData.executions + WebSocket updates
- GitHubWidget → projectData.repo
- HostingWidget → projectData.deployment
- IntentBoard → projectData.intent_threads

Test: switch between two real projects, confirm full repaint
Report: switcher working, dashboard showing real data, confirmed

### Agent Frontend-2 — Dispatch Board UI
(depends on Backend-4)
Create components/widgets/DispatchBoard.jsx:
- Reads from executions:all WebSocket
- Shows each in-flight task as a node card:
  - Task title
  - Agent assigned
  - Project badge
  - Status dot (pending/running/done/failed)
  - Live elapsed timer for running tasks
  - Expand → full prompt + output
  - Failed: Retry button + Edit and retry button

Campaign flow view toggle:
- Nodes as boxes with status
- Edges as arrows (parallel = side by side, sequential = top to bottom)
- Red pulsing = failed, yellow pulsing = running, green = done, grey = pending

Header row: Running count, Completed today, Failed, Queued

Report: dispatch board live, showing real execution data

---

## WEEK 8 — after Week 7 complete:

### Agent Wiki-1 — Superman minimum viable semantic indexing
(depends on Research-1 audit)
Based on Research-1 findings, implement minimum viable embedding pipeline:
- On wiki/vault file save → generate embedding via Claude or local model
- Store in SQLite (with sqlite-vss extension or equivalent)
- Build search function: semantic_search(query, limit) → ranked files

Wire into Wiki app search:
- Toggle: keyword search / semantic search
- Semantic results show: file name, conceptual match summary, confidence

Wire into agent spawn:
- Before dispatch, query top 3 related wiki pages for task context (via :8093 API or qmd)
- Inject file summaries into spawn prompt

Report: indexing running, semantic search working in Wiki, agent injection confirmed

### Agent Integration-1 — GitHub integration
- OAuth flow for GitHub in Integrations Manager app
- Store token securely per space

Implement:
- Link GitHub repo to Project (Resources tab)
- Fetch last commit + branch on project context load
- Webhook: push event → update project last_activity
- Webhook: deploy failure → create urgent task + post to linked channel

UI in Projects Resources tab:
- GitHub card: repo name, last commit (time + message), branch, open PR count
- "Open repo" button → external link
- "View commits" → lists last 10 commits inline

Report: OAuth working, repo linked to one real project, webhook receiving events

### Agent Integration-2 — Discord server linking
- Bot token configuration in Channels app
- Link Discord channels to EMA event types

Implement:
- Post execution completed → linked channel (formatted card)
- Post proposal pending → linked channel with approve/reject buttons
- Keyword detection in Discord messages → create BrainDump item (via OpenClaw)
- React ✅ on posted card → approve proposal
- React 🚀 → pin item

Channel routing rules UI in Channels app:
- Visual rule builder: When [event] → post to [channel] with [template]
- Per-project channel routing (StudioKamel failures → #studiokamel-alerts)

Report: bot connected, one real execution result posted to Discord, reaction handling working

---

# Spaces Architecture Implementation

Trajan-network is the first space. It is personal, not org — one user, full access to all data.

**Space switcher implementation:**
- Top bar pill shows current space name always
- Click → modal overlay listing all spaces
- Each space card: name, type badge, last active, member count
- Creating new space: generates a new SQLite schema namespace, all app data isolated
- Keyboard shortcut: Cmd+Shift+S

**Data isolation model:**
Every database query in every app includes where: space_id == ^current_space_id. Switching space changes current_space_id in the global Zustand store. All queries re-run. Nothing bleeds between spaces.

**The four space types:**
- Personal — private, one user, default
- Org — shared team space, multiple users, all apps visible
- Shared — lighter sharing, specific projects or vaults with specific people
- Ghost — temporary, disposable, deletable without trace, for experiments and client demos

---

# Multi-Agent Brainstorm Sessions — Ready to Run

Seven sessions designed. Each is 20 minutes of parallel agent work, results synthesized by Orchestrator. Sessions 2-7 are ready to spawn.

**Session 2 — Implementation Sequencing (recommended first)**
- Agents: Dependency Mapper, Critical Path Finder, Parallel Track Builder, Risk Identifier
- Output: Dependency graph of all 14 apps, parallel build tracks for Week 7-8, Master Roadmap

**Session 3 — Workflows and Discord Mapping**
- Agents: Discord → EMA mapper, Gap Analyzer, Workflow Designer, Integration Specifier
- Output: Complete Discord channel → EMA app mapping, workflow replacement plan

**Session 4 — API Contracts**
- Agents: EMA API designer, HQ API consumer, WebSocket event specifier, Auth model designer
- Output: Complete API spec with schemas, response shapes, event names, auth model

**Session 5 — Risk and Mitigation**
- Agents: Technical risk identifier, Dependency risk analyzer, Rollback planner, Monitoring designer
- Output: Risk register with severity/probability matrix, rollback procedures, monitoring plan

**Session 6 — Honcho Deep Dive**
- Agents: Memory architecture researcher, Scope advisor designer, Reflexion injection builder, Session boundary specifier
- Output: Production Honcho deployment config, session boundary decision, integration test plan

**Session 7 — Superman and Wiki**
- Agents: Semantic indexing architect, Knowledge graph designer, Intent file compiler, Wiki UI specifier
- Output: Embedding pipeline spec, graph storage recommendation, .superman runtime architecture

---

# The Recursive Research System — Ready to Deploy

Spec v2 is locked and vaulted. It is a complete operating specification for multi-round recursive research with adversarial verification. Ready to use immediately.

To run a research session:
Give the Orchestrator:

```
RESEARCH TOPIC: [what to research]
DEPTH: deep
CONTEXT: [why it matters]
PRIOR KNOWLEDGE: [what's already known]

BUDGET:
  total_token_budget: 200000
  per_agent_output_cap: 15000
  orchestrator_compression_trigger: 50000
  per_agent_timeout_seconds: 120
  round_timeout_seconds: 600
```

Implementation note on sessions_yield: collect all sub-agent completions in a loop before proceeding, not a single yield call. All 4 parallel agents must complete before Gap Identifier runs.

**Immediate research topics ready to assign:**
- Honcho production deployment patterns
- Knowledge graph implementation in Elixir for Superman
- .superman file runtime architecture
- WebSocket patterns for Phoenix Channels in React 19 + Zustand 5

---

# Priority Stack — What To Do First

Right now, before anything else:

1. **SSH to OpenClaw VPS — restart oauth-guardian and gateway.** This is infrastructure down.
2. **Fix Tauri daemon auto-start — this blocks every demo and every manual test.**

This week:

3. **Honcho Docker setup — one command, highest leverage per effort of anything in the system**
4. **GET /api/projects/:id/context endpoint — the single wire that makes HQ real**
5. **HQ project switcher + live dashboard — wire to real data**

After those five things are done:
The system is real. HQ shows real data from a real EMA backend with real agent activity. Everything after that is extension, not foundation.

---

# The Single Truth

You should never have to reconstruct context manually. You should never discover a failure because something is missing. You should never lose a good idea because the moment passed. You should never wonder what your agents are doing.

Every technical decision in this system gets measured against those four things.

---

This is the complete master synthesis document as of 2026-04-03. All specifications, agent delegations, implementation orders, and architecture decisions from the full session are captured here. Pass this to any agent starting work on any part of the system.
