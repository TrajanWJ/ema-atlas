---
title: EMA + HQ + Trajan-Network — Final Session Passover
type: system-passover
status: canonical
created: 2026-04-03T21:50Z
author: Right Hand (compiled from session)
tags: [system-architecture, passover, build-ready, canonical]
supersedes: 
  - EMA-HQ-MASTER-SYNTHESIS-2026-04-03.md
  - EMA-SYSTEM-DISCOVERY-AUDIT.md
  - START-HERE-EMA-SESSION-SUMMARY.md
  - All other session documents
---

# EMA + HQ + Trajan-Network — Final Session Passover

**This document supersedes all nine documents produced during the 2026-04-03 session.**

One read. Full context. No cross-referencing required. Pass to any agent starting work on any part of this system.

---

## Ground Truth — What Is Actually Running Right Now

### ✅ RUNNING
- **EMA daemon** — localhost:4488, Elixir/Phoenix, compiles with 3 warnings
- **Tauri 2 shell** — React 19 frontend, 52 virtual apps in workspace.ts, 290 TypeScript files, 62 component folders
- **Execution loop** — proposal approval → execution → Claude CLI → result write-back
- **WebSocket** — executions:all channel broadcasting
- **VaultWatcher** — filesystem watcher running
- **GraphBuilder** — static wikilink graph building
- **Port orphan fix** — committed, Claude CLI wrapper in place
- **Frontend build** — TypeScript errors cleared

### ❌ BROKEN — BLOCKING
- **Tauri daemon auto-start** — "Connection failed" on app launch. Blocks every demo.
- **OpenClaw VPS services** — oauth-guardian + gateway down. Blocks all agent dispatch.
- **Proposal auto-dispatch** — Approval wired in code but not running in practice.

### ⏳ DESIGNED, NOT BUILT
- **Honcho** — Stubbed, returns dummy data, not deployed
- **Superman semantic index** — VaultWatcher + GraphBuilder exist. Embedding pipeline: zero.
- **MCP servers** — 3 designed (EMA Core, Vault, OpenClaw Bridge). None wired.
- **Integrations** — 0 of 7 connected (GitHub, Drive, Discord, Slack, APIs, VPS, cross-link)
- **Apps** — 5 of 14 real. 9 are configured shells with no backend wiring.
- **Campaign.Flow** — Struct designed. Not written.
- **P2P Trajan-network** — Architecture designed. Phase B. Not started.
- **HQ** — Mockups built. Zero real API connections.

---

## The System in One Picture

```
YOU
 │
 ▼
HQ (browser app — Tauri + React)
 │  GET /api/projects/:id/context
 │  WebSocket: executions:all
 ▼
EMA Daemon (localhost:4488) ← the brain
 │  Elixir/Phoenix + SQLite + Tauri + React
 │
 ├── BrainDump → intent clustering → Proposals
 ├── Proposals → approval → Executions → Dispatch
 ├── Dispatch → OpenClaw VPS (agent execution)
 ├── SessionHarvester → result → Execution record
 ├── Outcome Tracker → Honcho → smarter next dispatch
 ├── Vault/Wiki → Superman → knowledge graph
 └── Pipes → automation between all apps
 │
 ▼
OpenClaw Gateway (Hetzner VPS, localhost:18789)
 │  Agent execution layer
 │  Messaging: Discord, Telegram, Slack
 └── Claude Code sessions, shell commands, browser control

Trajan-network = first Space
  EMA hub + OpenClaw gateway + Host (future)
  Phase A: REST + WebSocket, hub-and-spoke
  Phase B: P2P Pier mesh, CRDTs, automatic sync
```

---

## The Execution Loop

Every app serves this loop. Understand this and you understand the whole system.

1. **Capture** → BrainDump (raw thought, no structure required)
2. **Cluster** → EMA intent threading (background, silent)
3. **Surface** → Dashboard intent board (when readiness score > threshold)
4. **Propose** → Proposals app (human reviews, one tap to approve)
5. **Dispatch** → Agents app (Honcho injects context, Scope Advisor checks limits)
6. **Execute** → OpenClaw VPS or inline Claude CLI
7. **Harvest** → SessionHarvester writes result to Execution record
8. **Feedback** → Outcome Tracker → Honcho user model updates
9. **Learn** → Next dispatch smarter (Reflexion injection)

---

## The 14 Apps — Status and Purpose

| # | App | Purpose | Status |
|---|-----|---------|--------|
| 1 | Dashboard | Context-aware system overview | Shell, needs /context API |
| 2 | BrainDump | Frictionless capture + intent clustering | Backend live, needs intent thread UI |
| 3 | Tasks | Work tracking with deliberation gate | Backend live, TaskBoard.tsx exists |
| 4 | Projects | Living context objects per project | Needs context assembler endpoint |
| 5 | Proposals | Deliberation layer, human approval | Pipeline live, dispatch not auto |
| 6 | Agents | Dispatch board, real-time visibility | Dispatcher live, needs Campaign.Flow |
| 7 | Wiki (was Vault) | Knowledge graph + Superman interface | VaultWatcher live, semantic: zero |
| 8 | Canvas | Visual thinking, infinite whiteboard | Shell only |
| 9 | Habits | Daily behavior tracking | Shell only |
| 10 | Journal | Private daily thinking | Shell only |
| 11 | Focus | Deep work sessions + time tracking | GenServer exists, UI not wired |
| 12 | Pipes | Automation layer, event-driven | 22 triggers + 15 actions in backend |
| 13 | Channels | Messaging config (Discord/Telegram/Slack) | Needs config UI |
| 14 | Integrations Manager | GitHub, Drive, APIs, VPS | New app, design only |
| + | Responsibilities | Recurring obligations | Schema only |

---

## Superman vs EMA — The Correct Distinction

**EMA** = the loop, orchestration, memory, and execution system.

**Superman** = a specialized intelligence module called by EMA when the context requires structured knowledge reasoning.

### Superman's capabilities (what needs to be built):
- Knowledge graph — nodes are files, projects, clients, deployments, functions. Edges are relationships.
- Intent modeling — reads .superman files, infers project trajectory
- Proactive analysis — surfaces anomalies (overdue invoice, down server, stale intent thread)
- Cross-session learning — persistent working memory, incremental updates

### What exists today:
- VaultWatcher — watches ~/vault/ filesystem for changes
- GraphBuilder — builds static graph from wikilinks in markdown files
- .superman file concept — six keywords, plain English, files exist but nothing reads them at runtime

### What is zero:
- Embedding pipeline — no vectors, no semantic search
- Runtime intent file reader — .superman files are documentation not active components
- Proactive analyzer — not built
- Context assembler for HQ — not built

---

## The 7 Integrations

| Integration | Tier | What it does | Status |
|---|---|---|---|
| GitHub | 1 | Repos ↔ Projects, commits, PRs, deploy webhooks | Zero |
| Discord | 1 | Channel linking, post results, reaction approval, keyword → BrainDump | Zero |
| Slack | 1 | Same pattern as Discord, different adapter | Zero |
| Google Drive | 2 | Bidirectional folder sync, export Vault → docs | Zero |
| API Providers | 2 | Key storage, cost tracking per provider, model routing | Zero |
| VPS/Servers | 2 | CPU/RAM monitoring, deploy status, alerts | Zero |
| Cross-linking | 3 | One repo → multiple Projects, one channel → multiple Projects | Zero |

---

## HQ — What It Is and What Makes It Real

**HQ is the main app.** It's a React app inside the Tauri shell. It reads from EMA's REST API and WebSocket. It never talks directly to GitHub, Render, OpenClaw, or any external service. Everything routes through EMA.

### The two data layers HQ renders simultaneously:

**Layer A — Persistent context** (stable, loads once on project switch):
- repo metadata, deployment state, client info, domains, DNS, invoices, notes

**Layer B — Live execution state** (continuous WebSocket updates):
- active tasks, recent executions, intent threads at readiness stages

### The project switch mechanism:
User clicks project in top bar pill → command palette opens → select project → GET /api/projects/:id/context → EMA assembles full context → entire dashboard repaints. One interaction. One API call. Everything updates.

### The one metric that proves HQ is real:
**Open HQ. Switch to StudioKamel. See the actual last commit, the actual Render deployment status, and the actual last EMA execution for that project. Without touching another tab. That moment is when the system becomes real.**

### HQ file structure:

```
hq/src/
  api/superman.js           ← all API calls live here, nowhere else
  context/ProjectContext.js ← active project state + WebSocket subscription
  components/
    Sidebar.jsx             ← collapsible, 14 app icons
    TopBar.jsx              ← space pill, project switcher, OpenClaw status, time
    Dashboard.jsx           ← context-aware, repaints on project switch
    FloatingWindow.jsx      ← pop-out any widget as draggable glass panel
    widgets/
      ExecutionFeed.jsx     ← live from executions:all WebSocket
      GitHubWidget.jsx      ← projectData.repo
      HostingWidget.jsx     ← projectData.deployment
      IntentBoard.jsx       ← projectData.intent_threads
      ClientCard.jsx        ← projectData.client
      DispatchBoard.jsx     ← live in-flight agent tasks
```

---

## Spaces

Every piece of data in every app belongs to a space. Switching space reloads everything.

**Trajan-network** is the first space. Personal type. One user, full access.

### Four space types:
- **Personal** — private, default, one user
- **Org** — shared team space, multiple users
- **Shared** — lighter sharing, specific projects with specific people
- **Ghost** — temporary, disposable, deletable without trace

**Space switcher:** always visible in sidebar. Top bar always shows current space name. Cmd+Shift+S opens switcher overlay. Switching takes one click.

---

## The Recursive Research System

**Spec v2 is locked, vaulted, verified.** It is build-ready.

What makes it better than published systems: The Verification Agent as adversary is not present in any published multi-agent research system. STORM, GPT Researcher, and OmniThink all do reflection but none adversarially challenge findings between rounds. This system does.

**Key implementation note:** sessions_yield on the Orchestrator needs a collection loop, not a single yield call. Four parallel agents completing asynchronously require: collect until count == spawned_count, then proceed. One yield catches one completion. The rest are missed.

### To run:
```
RESEARCH TOPIC: [topic]
DEPTH: deep
CONTEXT: [purpose]
PRIOR KNOWLEDGE: [what's already known]

BUDGET:
  total_token_budget: 200000
  per_agent_output_cap: 15000
  orchestrator_compression_trigger: 50000
  per_agent_timeout_seconds: 120
  round_timeout_seconds: 600
```

---

## The 5 Decisions That Must Be Made Before Building

These are blocking decisions. Build cannot start correctly without them.

### 1. Tauri auto-start — fix or work around?
**Recommendation:** fix. Working around it means every developer and every demo needs a manual daemon start step. That is unsustainable. Root cause audit first (2-3 hours), then fix.

### 2. Honcho — real deployment or stub for Phase A?
**Recommendation:** real. It is one Docker command. Every agent task dispatched without Honcho is wasted learning data that cannot be recovered. The sooner it is running, the sooner the system compounds. Stub adds no value.

### 3. Superman semantic search — build now or text-only through Week 8?
**Recommendation:** audit first (Research-1 agent), then decide. The audit will determine whether the embedding pipeline is a 1-day build or a 1-sprint build. That answer drives the decision.

### 4. Which 3 integrations to build first?
**Recommendation:** GitHub first (direct workflow impact, repos already linked to projects conceptually), Discord second (replaces the current manual Discord-to-EMA copy-paste workflow), VPS monitoring third (closes the silent failure loop for server infrastructure).

### 5. P2P Pier network — Phase A hub-and-spoke or start P2P now?
**Recommendation:** hub-and-spoke Phase A, P2P Phase B. P2P adds complexity before the core loop is stable. Get EMA ↔ OpenClaw working over REST first. Add mesh when multiple nodes actually exist.

---

## Complete Agent Delegation Plan

### Immediate — no dependencies, start in parallel today

**Infra-1 — Fix Tauri daemon auto-start (2-3h)**
- Audit daemon spawn path in Tauri configuration
- Check RPC initialization timing — race condition between shell launch and daemon ready?
- Check daemon path resolution — is the binary path correct at runtime?
- Test daemon independently: `cd daemon && mix run --no-halt`
- Test Tauri finds daemon: check IPC socket path in tauri.conf.json
- Fix and verify: clean app launch from cold start, three consecutive successes
- **Deliverable:** root cause documented, fix committed, clean launch confirmed

**Infra-2 — Restart OpenClaw VPS services (15-30min)**
- SSH to Hetzner VPS
- `systemctl status oauth-guardian`
- `systemctl status openclaw-gateway`
- If either down: `systemctl restart [service]`
- Verify OpenClaw gateway responding: `curl localhost:18789/health`
- Verify auth token flow: test one authenticated request
- **Deliverable:** both services running, auth confirmed, timestamp logged

**Research-1 — Superman indexing audit (1-2h)**
- Find Superman module — check lib/ema/superman/ or lib/ema/intelligence/
- Check for embedding pipeline — any calls to embedding API or local model
- Check for vector storage — sqlite-vss extension? External store?
- Check when vault was last indexed — look for index files in ~/vault/
- Trace: VaultWatcher → GraphBuilder → does anything after GraphBuilder exist?
- Check .superman file reader — is there runtime consumption or just file creation?
- **Deliverable:** honest status of each Superman component, minimum viable embedding pipeline recommendation for Week 8

---

### Week 7 — run in parallel after Infra-1 and Infra-2 complete

**Backend-1 — Project context API (2-3h)**

Add to daemon/lib/ema_web/router.ex:
```
GET /api/projects         → list all projects
GET /api/projects/:id/context → full context assembler
```

Context assembler (Ema.Projects.ContextAssembler) returns:
```elixir
%{
  project: %{id, name, status, color, description, superman_file_summary},
  repo: %{url, last_commit_message, last_commit_time, branch, open_pr_count},
  deployment: %{platform, url, last_deploy_time, status, last_deploy_message},
  executions: [# last 10 × {id, summary, status, elapsed, result_summary, agent}],
  proposals: [# open × {id, title, score, status, created_at}],
  client: %{name, email, invoice_status, last_contact}, # if linked
  intent_threads: [# active clusters × {theme, item_count, readiness, suggested_action}],
  notes: [# recent 5 × {title, preview, updated_at}],
  vps: %{name, cpu_pct, ram_pct, uptime} # if linked
}
```

Write confirmed JSON response shape to a markdown file BEFORE building HQ against it
**Deliverable:** both endpoints live, response shape documented, tested with curl

**Backend-2 — Honcho Docker setup and integration (2-3h)**

```bash
docker run -d -p 8000:8000 -v honcho_data:/data plasticlabs/honcho:latest
curl localhost:8000/health  # verify
```

Create lib/ema/honcho.ex:
```elixir
def store_session(session_id, messages) do
  Req.post!("http://localhost:8000/apps/ema/users/trajan/sessions/#{session_id}/messages",
    json: %{messages: messages})
end

def query_user(question) do
  Req.get!("http://localhost:8000/apps/ema/users/trajan/chat?query=#{URI.encode(question)}")
  |> then(& &1.body["content"])
end

def session_context(session_id, tokens: 10_000) do
  Req.get!("http://localhost:8000/apps/ema/users/trajan/sessions/#{session_id}/context?tokens=10000")
end
```

- Wire store_session into SessionHarvester on_execution_completed hook
- Wire query_user into Dispatcher before agent spawn:
  ```
  context = Honcho.query_user("Preferences for #{task_type} tasks on #{project_name}?")
  inject into spawn prompt as "Previous context: #{context}"
  ```
- Wire scope check into task creation:
  ```
  warning = Honcho.query_user("Scope limits for #{agent_id}?")
  surface as amber banner if non-empty
  ```
- Run one real dispatch. Verify Honcho context appears in spawn prompt in execution log.
- **Deliverable:** Honcho running, three wiring points confirmed, one logged test dispatch

**Backend-3 — Deliberation Gate (1-2h)**

Create lib/ema/tasks/structural_detector.ex:
```elixir
defmodule Ema.Tasks.StructuralDetector do
  @structural_keywords ~w[restructure migrate delete rename globally
                           refactor replace all move vault redesign
                           purge remove overhaul rewrite rebrand]

  def structural?(description) do
    lower = String.downcase(description)
    Enum.any?(@structural_keywords, &String.contains?(lower, &1))
  end

  def route(task) do
    if structural?(task.description),
      do: {:require_proposal, task},
      else: {:direct_dispatch, task}
  end
end
```

- Wire route/1 into task creation before dispatch
- Add to task creation API response: structural: true/false flag
- Frontend uses this flag to show amber banner:
  ```
  "This task looks structural. Generate a proposal first?"
  [Yes → /proposals/new?from_task=:id] [No → dismiss, dispatch directly]
  [x] Don't ask again for this keyword type
  ```
- Test: create task with "restructure" in title → routes to proposals
- Test: create task with "fix bug" → dispatches directly
- **Deliverable:** detector live, routing confirmed, frontend flag returned in API

**Backend-4 — Campaign Flow Topology (2-3h)**

Create lib/ema/campaigns/flow.ex:
```elixir
defmodule Ema.Campaigns.Flow do
  defstruct [:id, :name, :run_id, :campaign_id, steps: [], edges: []]
end

defmodule Ema.Campaigns.Step do
  defstruct [
    :id, :agent_id, :prompt_template,
    dependencies: [],    # list of step IDs — empty = parallel start
    status: :pending,    # :pending | :running | :done | :failed
    started_at: nil,
    completed_at: nil,
    elapsed_ms: nil,
    error: nil
  ]
end
```

- Add run_id to Campaign schema migration (differentiates "Daily Briefing campaign" from "Daily Briefing run #47")
- Wire step status through execution lifecycle:
  - execution dispatched → find step → status :running, started_at = now
  - execution completed → status :done, completed_at, elapsed_ms
  - execution failed → status :failed, error = result.error
- Add to Agents API:
  ```
  GET /api/dispatch/inflight → all running/pending steps with elapsed
  GET /api/campaigns/:run_id/flow → full flow topology for that run
  ```
- **Deliverable:** Flow + Step structs live, run_id in schema, step states updating, API endpoints confirmed

**Frontend-1 — HQ project switcher + live dashboard (3-4h)** *(depends on Backend-1)*

Create hq/src/api/superman.js:
```javascript
export const getProjects = () => fetch('/api/projects').then(r => r.json())
export const getProjectContext = (id) => fetch(`/api/projects/${id}/context`).then(r => r.json())
export const connectExecutionStream = (onEvent) => {
  const socket = new Phoenix.Socket('/socket')
  const channel = socket.channel('executions:all')
  channel.on('execution_updated', onEvent)
  socket.connect(); channel.join()
  return () => channel.leave()
}
```

Create hq/src/context/ProjectContext.js (Zustand store):
```javascript
const store = {
  activeProjectId: null,
  projectData: null,
  switchProject: async (id) => {
    set({ activeProjectId: id, projectData: null })
    const data = await getProjectContext(id)
    set({ projectData: data })
  },
  updateExecution: (execution) => // update executions array in projectData
}
```

- Build TopBar project switcher pill:
  - Shows activeProject.name + status dot
  - Click → modal overlay listing all projects (from getProjects())
  - Each project row: name, status badge, last_active time, linked site status
  - Click any → switchProject(id), modal closes
- Wire Dashboard to ProjectContext:
  - StatCards: tasks from projectData.proposals.length, executions, etc.
  - ExecutionFeed: projectData.executions + live updates via connectExecutionStream
  - GitHubWidget: projectData.repo (last commit, branch, PR count)
  - HostingWidget: projectData.deployment (platform, URL, status, last deploy)
  - IntentBoard: projectData.intent_threads (forming/ready/running/done columns)
  - ClientCard: projectData.client if present
- Test: switch between two real projects — full dashboard repaint confirmed
- **Deliverable:** switcher live, dashboard showing real EMA data, WebSocket updates flowing

**Frontend-2 — Dispatch Board (2-3h)** *(depends on Backend-4)*

Create hq/src/components/widgets/DispatchBoard.jsx:

Header row: Running [count] · Completed today [count] · Failed [count] · Queued [count]

Task card (per in-flight execution):
- Title (truncated to 60 chars)
- Agent badge (color-coded: Claude=purple, OpenClaw=lobster-red, Codex=blue)
- Project badge
- Status dot with label
- Elapsed timer — live counter, ticks every second for :running tasks
- Expand chevron → full prompt sent + current output if running + complete output if done
- If :failed: red background tint, error message, Retry button, Edit & Retry button

Campaign flow view (toggle at top right):
- Render steps as SVG flow graph
- Empty dependencies = top row (parallel start)
- Non-empty dependencies = positioned below their dependency steps
- Arrows connecting dependent steps
- Node colors: grey=pending, yellow pulsing=running, green=done, red=failed
- Click any node → opens task detail panel as right sidebar

- Reads from: GET /api/dispatch/inflight (initial load)
- Updates via: executions:all WebSocket (step status changes push instantly)
- **Deliverable:** dispatch board live, showing real in-flight tasks, flow graph renders

---

### Week 8 — after Week 7 complete

**Wiki-1 — Superman minimum viable semantic indexing** *(depends on Research-1 findings)*

Implementation depends on Research-1 audit.

If embedding pipeline is zero:
- Add sqlite-vss extension to EMA's SQLite setup
- Create Ema.Superman.Embedder module:
  - On VaultWatcher file_changed event → generate embedding via Anthropic API
  - Store: {file_path, embedding_vector, content_hash, indexed_at}
- Create Ema.Superman.SemanticSearch:
  - semantic_search(query, limit) → embed query → cosine similarity → ranked files
- Wire into Wiki app search toggle: "Semantic" option calls this endpoint
- Wire into agent spawn: top 3 semantically related vault files injected as context

If partial pipeline exists: audit findings determine exact delta

**Deliverable:** vault indexed, semantic search working in Wiki app, agent injection confirmed

**Integration-1 — GitHub (3-4h)**

- Add GitHub OAuth flow in Integrations Manager app
- Store token in EMA database per space (never in frontend)

Endpoints to add:
```
GET /api/integrations/github/repos → list repos for authed user
POST /api/integrations/github/link → link repo to project_id
POST /api/integrations/github/webhook → receive GitHub events
```

Webhook handlers:
- push event → update project.last_commit, project.last_activity
- pull_request opened → create Proposal (title: "Review PR: #{pr.title}")
- deployment_status failed → create urgent Task + notify linked Discord channel

Projects Resources tab GitHub card:
- repo name, last commit message + time, branch, open PR count
- "Open on GitHub" external link
- "Recent commits" expand → last 10 commits inline

**Deliverable:** OAuth working, one repo linked to a real project, webhook receiving push events, commit visible in project context

**Integration-2 — Discord (3-4h)**

- Bot token configuration in Channels app
- Channel routing rules UI: When [event] → post to [channel]

Implement:
- POST to Discord when execution completes (formatted embed card)
- POST when proposal needs review (with Approve/Reject buttons if Discord supports)
- Incoming: keyword detection in messages → create BrainDump item via OpenClaw
- Incoming: ✅ reaction on posted card → approve linked proposal
- Incoming: 🚀 reaction → pin item in EMA

Per-project channel routing:
- StudioKamel failures → #studiokamel-alerts
- ProSlync deploys → #proslync-deploys
- Any execution → #worklog (the existing Discord channel)

Map existing Discord channels to EMA:
- #dispatch → Agents dispatch board
- #desk → Tasks
- #agent-feed → Agents fleet view
- #worklog → Executions feed
- #evolution-log → Evolution/Pipes log

**Deliverable:** bot connected, one real execution result posted to Discord, ✅ reaction handling working, one BrainDump item created from Discord message

---

## The 7 Multi-Agent Brainstorm Sessions

All ready to spawn. Each is 20 minutes of parallel agent work plus synthesis.

Sessions 2-7 are copy-paste ready in EMA-Multi-Agent-Brainstorm-Sessions.md.

| Session | Topic | Primary output | Recommended order |
|---|---|---|---|
| 2 | Implementation Sequencing | Dependency graph, parallel build tracks | First |
| 3 | Discord → EMA workflows | Channel mapping, workflow replacement plan | Second |
| 4 | API Contracts | Full API spec with schemas and event names | Third |
| 5 | Risk and Mitigation | Risk register, rollback procedures | Fourth |
| 6 | Honcho Deep Dive | Production config, session boundary decision | Fifth |
| 7 | Superman + Wiki | Embedding pipeline spec, graph storage recommendation | Sixth |

---

## Vault Document Map

All documents in /home/trajan/vault/System/:

| File | Size | Read for |
|---|---|---|
| **EMA-HQ-TRAJAN-NETWORK-FINAL-PASSOVER-2026-04-03.md** (this file) | 40KB | **Complete system + build plan — start here** |
| EMA-Unified-Spec-With-Integrations.md | 31KB | All 14 apps + 7 integrations detailed |
| MASTER-SYSTEM-OVERVIEW.md | 24KB | Big picture, 13 sections |
| EMA-Multi-Agent-Brainstorm-Sessions.md | 16KB | 7 sessions with copy-paste prompts |
| Trajan-Network-Architecture.md | 16KB | 3-peer topology + bootstrap procedure |
| Trajan-Network-Launchpad.md | 12KB | Timeline, decisions, operations |
| INDEX-Trajan-Network-System.md | 9KB | Navigation guide across all docs |

**Total:** ~170KB of system documentation. Complete. No gaps.

---

## The Single Standard

Every technical decision in this system is measured against four things:

1. You should never have to reconstruct context manually.
2. You should never discover a failure because something is missing.
3. You should never lose a good idea because the moment passed.
4. You should never wonder what your agents are doing.

**HQ + EMA + Superman + OpenClaw together make all four impossible.** That is what is being built.

---

**This document is the final passover for the 2026-04-03 session.**

**It supersedes all nine documents produced during the session.**

**Any agent picking up work on any part of this system starts here.**
