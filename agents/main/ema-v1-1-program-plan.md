# Plan: EMA v1.1 Program Buildout

**Generated**: 2026-04-13
**Estimated Complexity**: Very High
**Planning Mode**: Full-program, multi-track, end-to-end

## Overview

EMA v1.1 is planned as a **major program buildout**, not a thin feature pass.

The goal is to take EMA from a partially converged concept/rebuild state into a **usable end-to-end human↔agent work platform** with:

- a coherent **shell** (`Launchpad`, `HQ`, workspace/layout system)
- a real **control plane** (`intent -> proposal -> approval -> execution -> harvest`)
- real **chronicle/review/recall/trace** systems
- real **agent work surfaces** usable by humans and agents
- real **host-reality / machine / terminal / notifications** surfaces
- real **knowledge / research / blueprint / intentions / graph** surfaces
- real **productivity vApps** for daily human work
- CLI + GUI parity where practical, with both mapped to the same underlying entities
- cross-pollination imported aggressively from the strongest discovered sources

This plan assumes EMA v1.1 should be:

- **canon-first**
- **TypeScript/Electron/services/workers-first**
- **end-to-end usable by both agents and humans**
- **shared across CLI, GUI, host surfaces, and mirrored chat surfaces**
- **large in scope by design**, with completion pressure on everything already in the works

---

## Assumptions

### Canon / runtime assumptions
- Canonical runtime for v1.1 is **TypeScript/Electron/services/workers**.
- Old Elixir/Tauri/daemon work is treated as:
  - concept archive
  - parity reference
  - salvage source
  - not the primary runtime target

### Product assumptions
EMA v1.1 is a:
- human↔agent work platform
- executive management assistant
- operator cockpit
- personal control plane
- mission-control shell

### Delivery assumptions
- Major domains proceed in parallel.
- Canon catalog wins over accidental renderer drift.
- Current renderer/legacy surfaces may remain as temporary migration scaffolding only.
- Cross-pollination is a first-class design input for every surface, not just a research exercise.

### Completion assumption
v1.1 is considered successful when:
- the shell is coherent,
- core vApps are usable end-to-end,
- chronicle/review/recall exist as real system backbones,
- agent work and host work can be executed and supervised through EMA,
- human productivity surfaces are no longer fake/stale placeholders,
- CLI and GUI both operate against shared truth.

---

## Program Structure

The program is split into **six parallel tracks**:

1. **Track A — Shell / Launchpad / HQ / Multi-window UX**
2. **Track B — Control Plane / Chronicle / Review / Recall / Trace**
3. **Track C — Agent Hub / Live View / Comms / Shared work surfaces**
4. **Track D — Host Reality / Terminal / Machines / Services / Notifications**
5. **Track E — Knowledge / Blueprint / Intentions / Graph / Research / Feeds**
6. **Track F — Human Productivity / Tiny Utility vApps**

Each track produces demoable increments, but the overall success criterion is integrated end-to-end usability.

---

## Tiering

### Tier 0 — Must become real in v1.1
- Launchpad
- HQ
- Blueprint / Schematic Planner
- Intentions
- Feeds
- Agent Hub
- Agent Live View
- Agent Plans / Status
- Agent Comms / Comms
- Chronicle
- Review
- Search / Recall / Trace
- Terminal
- Machine Manager
- Notifications Hub
- shared CLI/GUI entity model

### Tier 1 — Must be strong enough to use, but can be thinner
- Wiki Viewer
- Graph Visualizer
- Research Viewer
- Tasks
- Brain Dumps
- Notes
- Journal / Log
- Schedule / Calendar
- Services Manager
- Network / Peer Manager
- Permissions

### Tier 2 — Can be partial or staged later in v1.1
- Responsibilities
- Focus / Pomodoro
- Time Blocking
- Analytics
- Settings refinement
- Whiteboard / Canvas deepening
- Team Manager
- Space Manager
- Goals / Habits / smaller micro-vApps promoted from reconciliation

---

## Sprint 0: Canon, Inventory, and Program Bootstrap
**Goal**: Establish a single source of planning truth, reconcile vApp inventory, and define the shared runtime/data shape for the whole program.

**Demo/Validation**:
- Master v1.1 program doc exists and is linked from repo planning areas.
- vApp catalog reconciliation status is explicit.
- shared entity map exists for CLI + GUI + chronicle + agent + host surfaces.
- cross-pollination registry is in place and seeded.

### Task 0.1: Create v1.1 planning spine
- **Location**: `docs/planning/`, `ema-genesis/`, workspace planning docs
- **Description**: Create the canonical planning artifacts for v1.1 and link them together.
- **Dependencies**: none
- **Acceptance Criteria**:
  - master plan exists
  - track plans exist or stubs are created
  - v1.1 objectives are explicitly stated
- **Validation**:
  - docs readable and cross-linked

### Task 0.2: Finalize vApp reconciliation for planning use
- **Location**: `ema-genesis/vapps/CATALOG.md`, `ema-genesis/_meta/VAPP-RECONCILIATION-TABLE.md`
- **Description**: Produce a planning-grade surface list with Tier 0/1/2 assignments and shell-vs-vApp distinction.
- **Dependencies**: Task 0.1
- **Acceptance Criteria**:
  - no ambiguity about which surfaces are top-level vApps vs shell/system concepts
  - migration scaffolding is identified
- **Validation**:
  - planning table reviewed against current renderer and canon catalog

### Task 0.3: Define shared object model
- **Location**: `shared/schemas/`, `docs/backend/`, `docs/planning/`
- **Description**: Define the shared first-class entity model used by CLI, GUI, chronicle, review, graph, and agent surfaces.
- **Dependencies**: Task 0.1
- **Acceptance Criteria**:
  - entities include at least: `intention`, `proposal`, `approval`, `execution`, `artifact`, `trace`, `session`, `review`, `memory`, `machine`, `service`, `peer`, `notification`
  - IDs and link rules are explicit
- **Validation**:
  - schema review and doc examples

### Task 0.4: Establish cross-pollination operating system
- **Location**: `research/cross-pollination/`
- **Description**: Continue the new registry/watchlist/per-vApp inspiration system and link it into planning.
- **Dependencies**: Task 0.1
- **Acceptance Criteria**:
  - registry, builder watchlist, process notes, and vApp notes exist
  - top-tier sources are captured with ratings and import candidates
- **Validation**:
  - directory and docs present

---

## Sprint 1: Build the shared execution spine
**Goal**: Create the control-plane backbone that makes every other surface truthful instead of decorative.

**Demo/Validation**:
- An intention can become a proposal, wait for approval, dispatch an execution, produce chronicle events, and surface in CLI + GUI.
- Chronicle and review are attached to real execution objects.

### Task 1.1: Implement shared lifecycle model
- **Location**: `shared/schemas/`, `services/core/`
- **Description**: Formalize `intent -> proposal -> approval -> execution -> harvest/result` lifecycle with explicit statuses and transitions.
- **Dependencies**: Sprint 0
- **Acceptance Criteria**:
  - status transitions are explicit
  - invalid transitions are rejected
  - lifecycle events are emitted
- **Validation**:
  - lifecycle tests and fixture flows

### Task 1.2: Add trace/session/observation schema
- **Location**: `shared/schemas/`, `services/core/chronicle/` or equivalent
- **Description**: Implement Langfuse/Phoenix-style trace/session/observation model for executions.
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - execution has trace tree / step history / session linkage
  - tool/model/action metadata captured
- **Validation**:
  - execution replay test data visible through API

### Task 1.3: Add approval wait-state model
- **Location**: `services/core/proposal/`, `services/core/execution/`, `shared/schemas/review.ts`
- **Description**: Make approval a durable wait-state rather than a boolean.
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - pending approval blocks execution correctly
  - approval/reject/escalate/override transitions are recorded
- **Validation**:
  - API and UI simulation tests

### Task 1.4: Implement harvest/artifact/memory linking
- **Location**: `services/core/chronicle/`, `services/core/memory/`, `shared/schemas/`
- **Description**: Ensure outputs become artifacts, candidate memories, and reviewable results.
- **Dependencies**: Tasks 1.2-1.3
- **Acceptance Criteria**:
  - execution outputs are linkable and replayable
  - curated memory differs from raw trace
- **Validation**:
  - artifact lineage tests

---

## Sprint 2: Shell foundation — Launchpad and HQ become real
**Goal**: Turn EMA shell from concept drift into a coherent operator environment.

**Demo/Validation**:
- Launchpad opens a real shell with workspace layouts.
- HQ shows live execution state, lineage, and operator actions.
- shell can launch core vApps and preserve layout/session state.

### Task 2.1: Define shell architecture
- **Location**: `apps/electron/`, `apps/renderer/`, `docs/planning/`
- **Description**: Specify Launchpad/HQ/shell/window-hub model, including BrowserWindow strategy and layout persistence.
- **Dependencies**: Sprint 0
- **Acceptance Criteria**:
  - shell concepts separated from vApps
  - BrowserWindow / pane / layout rules documented
- **Validation**:
  - architecture doc + shell mock data

### Task 2.2: Implement layout/workspace persistence
- **Location**: `apps/renderer/src/`, `shared/schemas/`
- **Description**: Add saved workspace layouts, resurrected sessions, pinned/floating surfaces, and role-based cockpit templates.
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - layouts can be saved/restored
  - persistent surfaces survive restarts
- **Validation**:
  - manual shell demo

### Task 2.3: Build HQ timeline spine
- **Location**: `apps/renderer/src/components/`, `services/core/executions/`
- **Description**: Build a stateful execution timeline with wait states, retries, outcomes, impact, and replay entrypoints.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - HQ is not a mock or generic dashboard
  - live status and historical replay are visible
- **Validation**:
  - demo with multiple execution states

### Task 2.4: Add shell-wide command palette and open-from-context
- **Location**: `apps/renderer/src/`
- **Description**: Implement omnibox/command palette for opening hosts, sessions, missions, views, and actions.
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - keyboard-driven shell navigation works
  - graph/feed/search items can open relevant surfaces
- **Validation**:
  - command palette demo

---

## Sprint 3: Chronicle / Review / Recall / Search become first-class
**Goal**: Make EMA able to remember, replay, review, search, and curate work history.

**Demo/Validation**:
- execution history is searchable
- review queue exists
- replay works
- curated memory extraction works

### Task 3.1: Build Chronicle service and UI
- **Location**: `services/core/chronicle/`, `apps/renderer/src/components/`
- **Description**: Implement chronicle index, event timeline, and execution/session history surface.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - chronicle stores execution-linked events and artifacts
  - UI can filter by session/execution/entity
- **Validation**:
  - seeded data walkthrough

### Task 3.2: Build Review queue
- **Location**: `services/core/review/`, `shared/schemas/review.ts`, renderer review components
- **Description**: Implement human review queues, annotations, approvals, and pairwise comparison support.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - review objects exist
  - flagged outputs can be reviewed and scored
- **Validation**:
  - review workflow demo

### Task 3.3: Build Recall/Search/Trace surface
- **Location**: `shared/schemas/`, `services/core/search/`, renderer search UI
- **Description**: Implement cross-entity search across sessions, traces, artifacts, intentions, and memories.
- **Dependencies**: Tasks 3.1-3.2
- **Acceptance Criteria**:
  - search results are typed and context-rich
  - trace drilldown works from results
- **Validation**:
  - query tests and manual trace search demo

### Task 3.4: Build replay and “why am I seeing this?” explanations
- **Location**: Chronicle/Feeds/Review surfaces
- **Description**: Add replay UI and per-item explanation metadata.
- **Dependencies**: Tasks 3.1-3.3
- **Acceptance Criteria**:
  - feed/search/review items explain source path and relevance
- **Validation**:
  - manual demo

---

## Sprint 4: Agent work surfaces become shared and steerable
**Goal**: Make agent work visible, steerable, collaborative, and persistent across surfaces.

**Demo/Validation**:
- agent sessions have durable identity
- live view, plans/status, scratchpads, and comms are all tied together
- humans can steer active work

### Task 4.1: Implement durable thread/workstream identity
- **Location**: `shared/schemas/`, `services/core/agent*`, `sessions` integration
- **Description**: Create thread/session/workstream IDs reused across chat, traces, scratchpads, logs, reviews, and child agents.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - one workstream is the same entity across EMA surfaces
- **Validation**:
  - cross-surface continuity demo

### Task 4.2: Build Agent Hub
- **Location**: renderer agent components, services/agent runtime
- **Description**: Implement central dispatch/management surface for agents, roles, capabilities, and operating modes.
- **Dependencies**: Task 4.1
- **Acceptance Criteria**:
  - hub lists active/inactive agents and workstreams
  - actions can dispatch and steer
- **Validation**:
  - agent dispatch demo

### Task 4.3: Build Agent Live View + replay
- **Location**: renderer terminal/live components, session integration
- **Description**: Build live session view with terminal/log/timeline tri-view and replay.
- **Dependencies**: Task 4.1
- **Acceptance Criteria**:
  - live sessions render and replay works
- **Validation**:
  - active session demo

### Task 4.4: Build Agent Plans / Status and Scratchpads
- **Location**: renderer plans/scratchpads, services/core/agent*
- **Description**: Create editable plans, statuses, and shared scratchpads with human+agent collaboration semantics.
- **Dependencies**: Task 4.1
- **Acceptance Criteria**:
  - plans are not inferred only from transcripts
  - scratchpads support annotations/comments/state
- **Validation**:
  - human edits affect visible workstream context

### Task 4.5: Build Agent Comms / Comms
- **Location**: renderer comms, services/core/comms/
- **Description**: Implement threaded communication between humans and agents and between agents, with linked workstream context.
- **Dependencies**: Task 4.1
- **Acceptance Criteria**:
  - comms threads exist and are tied to workstreams
  - messages can be injected from multiple surfaces
- **Validation**:
  - multi-thread comms demo

---

## Sprint 5: Host reality / terminal / machine / notifications
**Goal**: Make EMA grounded in actual machine and execution reality, not just high-level abstractions.

**Demo/Validation**:
- host truth visible
- terminals contextual and recorded
- machine manager works
- notifications drive action

### Task 5.1: Build contextual terminal surface
- **Location**: renderer terminal components, session/host services
- **Description**: Implement terminal as a contextual action pane with identity banner, privilege ladder, and recording hooks.
- **Dependencies**: Sprint 2, Sprint 4
- **Acceptance Criteria**:
  - terminal tied to machine/service/execution/incident context
- **Validation**:
  - host command demo with context

### Task 5.2: Build Machine Manager
- **Location**: services/core/machines/, renderer machine views
- **Description**: Implement live fleet inventory, last-seen truth, host facts, remote actions, and health state.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - machines are first-class entities
  - machine-specific actions exist
- **Validation**:
  - host status/SSH/run command demo

### Task 5.3: Build Notifications Hub
- **Location**: services/core/notifications/, renderer notifications
- **Description**: Implement stateful operator inbox for alerts, approvals, mentions, system notices, and action routing.
- **Dependencies**: Sprint 1, Sprint 3
- **Acceptance Criteria**:
  - ack/snooze/escalate/resolve flows work
  - notifications link into real surfaces
- **Validation**:
  - notification lifecycle demo

### Task 5.4: Build Services / Network / Permissions thin slice
- **Location**: services/core/services/, peers/, permissions/
- **Description**: Create usable but thinner slices of service state, peer topology, and permission/elevation logic.
- **Dependencies**: Task 5.2
- **Acceptance Criteria**:
  - service truth, peer truth, and approval gating exist at MVP level
- **Validation**:
  - restart/service action and permission gating demo

---

## Sprint 6: Knowledge / Blueprint / Intentions / Graph / Research / Feeds
**Goal**: Make EMA’s planning/knowledge surfaces live, typed, and connected to operations.

**Demo/Validation**:
- blueprint is editable and linked to graph/intention entities
- feed items can become plans/proposals
- research is importable into operations

### Task 6.1: Build typed wiki/object layer
- **Location**: wiki/graph services, renderer wiki views
- **Description**: Turn wiki entities into typed objects with summary/evidence/timeline/open-questions structure.
- **Dependencies**: Sprint 0, Sprint 1
- **Acceptance Criteria**:
  - pages can display live linked operational context
- **Validation**:
  - object page demo

### Task 6.2: Build Graph Visualizer perspectives
- **Location**: renderer graph views, graph backend
- **Description**: Implement saved graph perspectives for dependency, intent, execution lineage, research, and topology.
- **Dependencies**: Task 6.1
- **Acceptance Criteria**:
  - graph views are opinionated, not generic hairballs
- **Validation**:
  - saved graph mode demo

### Task 6.3: Upgrade Blueprint / Schematic Planner
- **Location**: `blueprint/`, renderer blueprint surface
- **Description**: Evolve blueprint into writable planning surface with live linked objects and drag-in from feeds/research/intents.
- **Dependencies**: Tasks 6.1-6.2
- **Acceptance Criteria**:
  - blueprint can generate/modify real planning entities
- **Validation**:
  - blueprint-to-proposal demo

### Task 6.4: Build Intentions vApp
- **Location**: renderer intention views, services/core/intents/
- **Description**: Make intentions explicit temporal evidence-backed objects with graph links and health states.
- **Dependencies**: Task 6.1
- **Acceptance Criteria**:
  - intentions have status, evidence, blockers, links to executions
- **Validation**:
  - intention lifecycle demo

### Task 6.5: Build Feeds and Research Viewer
- **Location**: services/core/feeds/, research/, renderer feeds/research
- **Description**: Create operator feeds and research-to-operations bridge with surfacing rationale and import actions.
- **Dependencies**: Tasks 6.1-6.4
- **Acceptance Criteria**:
  - feed items explain why surfaced
  - research can be attached to blueprint/intention/proposal
- **Validation**:
  - external source → feed → plan demo

---

## Sprint 7: Human productivity and tiny utility vApps
**Goal**: Make EMA useful for actual daily human executive work, not just large orchestrations.

**Demo/Validation**:
- human can use EMA daily for capture, planning, notes, tasks, journal, and scheduling
- tiny surfaces feel fast and real

### Task 7.1: Build Today surface
- **Location**: renderer productivity surfaces
- **Description**: Create unified Today surface combining tasks, notes, schedule, focus, and current work.
- **Dependencies**: Sprint 6, Sprint 1
- **Acceptance Criteria**:
  - one coherent landing zone for personal work exists
- **Validation**:
  - daily workflow demo

### Task 7.2: Build universal capture / Brain Dumps
- **Location**: renderer capture surface, services/core/brain-dump/
- **Description**: Implement low-friction text/voice/quick-capture into normalized intake queue.
- **Dependencies**: Task 7.1
- **Acceptance Criteria**:
  - capture from multiple entrypoints works
  - items route into inbox and extraction pipeline
- **Validation**:
  - quick-capture demo

### Task 7.3: Build Tasks / Notes / Journal / Schedule thin-but-real set
- **Location**: renderer productivity components, services/core/*
- **Description**: Upgrade these surfaces from partial/misleading to honest, usable, integrated tools.
- **Dependencies**: Task 7.1
- **Acceptance Criteria**:
  - tasks/notes/journal/schedule are end-to-end real
- **Validation**:
  - integrated day-planning flow demo

### Task 7.4: Build humane prioritization and focus protection
- **Location**: tasks/schedule/focus surfaces
- **Description**: Add Must/Should/Want, capacity awareness, focus blocks, overload warnings, and shutdown ritual support.
- **Dependencies**: Task 7.3
- **Acceptance Criteria**:
  - prioritization and focus are not simplistic placeholders
- **Validation**:
  - planning + shutdown demo

### Task 7.5: Add small utility vApps and widgets
- **Location**: renderer widgets/vapps
- **Description**: Add tiny but high-leverage surfaces like responsibility tracker, meeting output, reconnect/check-in, and unlinked mention resurfacing.
- **Dependencies**: Task 7.3
- **Acceptance Criteria**:
  - at least 3–5 tiny surfaces are meaningfully real
- **Validation**:
  - micro-vApp demo set

---

## Sprint 8: CLI/GUI parity and shared operations
**Goal**: Ensure EMA is genuinely shared between agent CLI use and human GUI use.

**Demo/Validation**:
- core actions possible from both CLI and GUI
- same entities visible from both
- mirror/chat surfaces reflect same workstream identity

### Task 8.1: Map CLI mirror commands to core surfaces
- **Location**: `cli/`, renderer surfaces, service endpoints
- **Description**: Ensure Agent Hub, plans, scratchpads, comms, terminal, and machine actions have CLI parity or at least CLI reflection.
- **Dependencies**: Sprints 4–7
- **Acceptance Criteria**:
  - CLI and GUI talk to same object model
- **Validation**:
  - CLI+GUI side-by-side demo

### Task 8.2: Unify workstream identity across chat/web/CLI/terminal
- **Location**: shared schemas, session services, bridge layers
- **Description**: Remove identity drift between Discord/OpenClaw sessions, EMA sessions, and renderer views.
- **Dependencies**: Sprint 4
- **Acceptance Criteria**:
  - one workstream can be followed across all surfaces
- **Validation**:
  - continuity demo

### Task 8.3: Add migration and adoption tooling
- **Location**: scripts/docs/bootstrap tools
- **Description**: Build scripts, sample layouts, and onboarding flows to actually use EMA v1.1 daily.
- **Dependencies**: Sprint 2 onwards
- **Acceptance Criteria**:
  - bootstrap docs and scripts exist
  - sample cockpit layouts ship
- **Validation**:
  - fresh-start setup walkthrough

---

## Cross-Pollination Import Map (initial)

### Shell / HQ / Launchpad
- Mission Control / Autensa
- Dagster
- Temporal
- Zellij
- Cockpit
- TUIOS
- Plane

### Knowledge / Research / Blueprint / Intentions
- Tana
- Capacities
- Graphiti
- ResearchRabbit
- AFFiNE
- tldraw
- React Flow
- Neo4j Bloom
- Graph Commons
- Kumu

### Human productivity / micro-vApps
- Lunatask
- Sunsama
- Akiflow
- Routine
- Morgen
- Reflect
- NotePlan
- Braintoss
- Twos
- Superlist

### Agent observation / control
- AGOR
- Overstory
- MCP Agent Mail
- claude-view
- LangSmith Studio
- AutoGen Studio
- LiveKit Agents
- Liveblocks
- Warp
- OpenHands

### Host reality / infra / terminal / notifications
- OpenASE
- sshx
- ntfy
- ShellHub
- Fleet
- Portainer
- Tailscale / Headscale / NetBird
- Teleport
- Grafana IRM / Better Stack
- ttyd
- xterm.js

### Chronicle / Review / Recall
- Langfuse
- Phoenix
- HoneyHive
- Braintrust
- Weave
- Mem0
- Letta
- Temporal
- Label Studio
- Argilla

---

## Testing Strategy

### Per sprint
- every sprint must end in a demoable vertical slice
- every new surface must connect to real shared entities, not fake local mocks only
- every operator action must be traceable where relevant

### Validation modes
- schema and lifecycle tests
- renderer component/state tests
- service integration tests
- CLI parity tests
- replay/history tests
- human walkthrough demos for shell and productivity flows
- host-reality demos for terminal/machine/notification actions

### Core end-to-end validation scenarios
1. intention → proposal → approval → execution → artifact → review → memory
2. agent dispatch from GUI, monitored in HQ, visible in CLI, replayed later
3. host incident arrives in notifications, opens machine/service context, action taken in terminal, result recorded
4. research item enters feed, becomes blueprint card, becomes intention/proposal
5. human daily planning uses Today + tasks + notes + schedule + brain dump + focus

---

## Potential Risks & Gotchas

### 1. Scope explosion
This is intentionally large. Without strong track discipline, progress can become diffuse.

**Mitigation**:
- strict Tier 0/1/2 control
- demo gates every sprint
- shared object model first

### 2. Shell-first illusion
A polished shell without truthful internals would produce fake progress.

**Mitigation**:
- build execution spine and chronicle early
- no major shell surface ships without shared entity backing

### 3. Renderer/canon divergence persists
Current drift between renderer, old concepts, and canon could keep polluting implementation.

**Mitigation**:
- planning-grade reconciliation first
- explicit migration scaffolding labels

### 4. CLI/GUI split-brain
If CLI and GUI evolve separately, EMA will fracture.

**Mitigation**:
- shared schemas and service contracts
- parity checkpoints in Sprint 8

### 5. Too much inspiration, not enough convergence
Cross-pollination can become endless browsing.

**Mitigation**:
- registry + import map + steal/adapt/ignore discipline
- every source must map to a concrete EMA surface or be archived

### 6. Host-reality complexity overwhelms product work
Terminal/machine/permissions/notifications could become a whole separate product.

**Mitigation**:
- keep Tier 0 infra slice narrow but real
- deepen later after core control-plane integration

### 7. Productivity surfaces become stale shells again
Historically easy to accumulate fake life/planner surfaces.

**Mitigation**:
- only ship honest thin slices
- tie every productivity surface into Today/inbox/schedule/shared graph

---

## Rollback Plan

If the full v1.1 breadth becomes too unstable, reduce scope in this order:

1. Preserve the shared execution spine, chronicle, and shell foundation.
2. Keep Tier 0 agent-control and host-reality surfaces real.
3. Thin Tier 1 productivity and graph/research surfaces to honest MVPs.
4. Defer deepening of Analytics / Team / Space / advanced canvas / some micro-vApps.

Under no circumstances should rollback reintroduce fake shell surfaces with no truthful backend.

---

## Immediate Next Planning Outputs

After this master plan, the next planning docs should be:

1. `ema-v1-1-track-a-shell-plan.md`
2. `ema-v1-1-track-b-control-plane-plan.md`
3. `ema-v1-1-track-c-agent-operations-plan.md`
4. `ema-v1-1-track-d-host-reality-plan.md`
5. `ema-v1-1-track-e-knowledge-planning-plan.md`
6. `ema-v1-1-track-f-productivity-plan.md`
7. `ema-v1-1-import-map.md`
8. `ema-v1-1-tier0-surface-matrix.md`
