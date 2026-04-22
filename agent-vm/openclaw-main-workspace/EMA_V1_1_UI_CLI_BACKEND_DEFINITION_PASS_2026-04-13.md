# EMA v1.1 — UI + CLI + Backend Definition Pass

Generated: 2026-04-13
Context basis:
- latest EMA planning docs in workspace
- current `ema-ui` scaffold
- recent Track A shell canon work
- no destructive edits to other agent outputs

## Boundary / source-of-truth note

I attempted to inspect the host machine desktop directly first, but host-command execution is currently blocked before dispatch by a gateway runtime/config snapshot error. So this pass is grounded in the most recent EMA project artifacts visible in the workspace and is written to prepare the next real coding run without overwriting or deleting existing agent work.

---

# 1. Executive summary

EMA v1.1 should be treated as a shared-truth platform with three tightly aligned layers:

1. **UI shell and vApps**
2. **CLI operator surface**
3. **backend control-plane / chronicle / host-reality services**

The primary implementation objective for the next coding run is not “build random screens.” It is:

- lock the shell canon
- lock the shared object model
- lock route/workspace/layout/snapshot behavior
- lock CLI-to-entity mappings
- lock backend lifecycle/event/attention/session contracts
- scaffold enough runnable code to start building without architectural drift

The most important principle is:

**GUI and CLI must operate on the same entities, lifecycle, and event spine.**

No split-brain.
No fake shell.
No CLI-only truth and GUI-only truth.

---

# 2. What exists now from recent workspace artifacts

## 2.1 Current `ema-ui` state

From `ema-ui/README.md`:
- feature layout exists
- route/component naming is stabilized
- placeholder TSX modules exist for shell primitives and first pages
- actual runtime/router/state wiring is not yet real

From `ema-ui/package.json`:
- still scaffold-only
- `dev`, `build`, `typecheck` do not run a real app yet

## 2.2 Current planning truth already present

The strongest recent planning anchors in workspace are:
- `ema-v1-1-program-plan.md`
- `research/ema-ui-bench/ema-component-route-file-plan.md`
- shell canon work already drafted in Track A chat
- older EMA host/CLI/integration docs from 2026-04-06

## 2.3 Consequence

The next run should not restart planning from zero.
It should convert the existing planning into:
- concrete repo files
- executable scaffold
- typed shared schema
- first working shell slices
- CLI/backend contracts that do not drift from the UI

---

# 3. Product purpose for v1.1

EMA v1.1 is a:
- personal control plane
- operator cockpit
- human↔agent work platform
- execution supervision shell
- knowledge/recall/review system
- host-reality bridge

That means the product must support all of these simultaneously:
- start or resume work
- supervise live work
- execute and replay work
- move between CLI and GUI without identity drift
- observe machines/sessions/services honestly
- preserve artifacts, reviews, and memory

This immediately implies three architectural centers:
- **Workspace** for UI continuity
- **Execution/Timeline/Attention** for operational truth
- **shared entity + lifecycle model** for CLI and backend parity

---

# 4. Canonical architecture

## 4.1 Top-level split

### UI
Responsible for:
- shell
- HQ
- Launchpad
- workspaces/layouts/snapshots
- vApp surfaces
- command palette
- operator interaction and inspection

### CLI
Responsible for:
- operator-friendly access to the same objects and actions
- scripting/automation entrypoints
- parity for core workflows
- machine/session/execution/chronicle inspection and mutation

### Backend
Responsible for:
- object lifecycle
- event chronology
- attention derivation
- session/host/machine truth
- artifact/review/memory linkage
- API/event streaming for UI + CLI

## 4.2 Shared truth rule

All three layers must share:
- entity IDs
- lifecycle states
- event families
- attention semantics
- session identity
- machine identity
- artifact lineage

---

# 5. UI definition

## 5.1 Tier 0 shell primitives

These are the only shell primitives that should exist initially:

1. Launchpad
2. HQ
3. Workspace canvas
4. Command palette
5. Inspector
6. Session transport strip

Everything else is either:
- a pane type
- a layout template
- a vApp/page
- migration-only scaffolding

## 5.2 UI shell model

### Launchpad
Purpose:
- start
- resume
- route
- surface suggestions grounded in real attention/execution/session state

### HQ
Purpose:
- supervise live operational truth
- show timeline, attention, execution states, lineage, impact
- allow intervention

### Workspace canvas
Purpose:
- pane-composed operational workspaces
- save/restore concrete task state

### Inspector
Purpose:
- shared detail projection
- follow selection or pin entity/event

### Session strip
Purpose:
- global live/degraded/disconnected session and background job truth

### Command palette
Purpose:
- universal navigation and action surface

## 5.3 UI route canon

Top-level routes should converge to:
- `/launchpad`
- `/hq`
- `/w/:workspaceId`
- `/mission/:missionId`
- `/execution/:executionId`
- `/session/:sessionId`
- `/artifact/:artifactId`
- `/node/:nodeId`
- `/thread/:threadId`
- `/search`
- `/settings/*`

Rule:
Entity routes should resolve into workspaces, not bespoke detached screens.

## 5.4 UI page/vApp classes

The shell and vApps should be separated explicitly.

### Shell/system surfaces
- Launchpad
- HQ
- command palette
- workspace manager
- layout manager
- inspector
- notifications/attention

### Tier 0 vApp families
- Chronicle / Review / Recall / Trace
- Agent Hub / Agent Live View / Agent Comms / Plans
- Terminal / Machines / Notifications
- Blueprint / Intentions / Feeds / Graph / Research
- Today / Tasks / Notes / Journal / Schedule / Capture

## 5.5 Pane registry

First pane set to make real first:
- launchpad
- timeline
- session
- execution
- mission
- attention
- inspector
- artifact
- comms
- node
- environment
- graph

## 5.6 UI persistence model

Two separate persistence constructs are mandatory:

### LayoutTemplate
Reusable geometry/shape

### WorkspaceSnapshot
Concrete restorable state

Rules:
- templates store structure, not brittle concrete IDs
- snapshots store bindings, focus, filters, selections, and pinned state
- restore must mark stale bindings honestly

## 5.7 UI implementation choice

For next coding run, choose one stack and stop drifting.

Recommended:
- **Vite + React + TypeScript + React Router + Zustand + TanStack Query**

Reason:
- fastest path from current scaffold to working shell
- low ceremony
- easy fixture-first iteration
- fine for Electron host later

If Electron desktop shell is already the intended runtime, still keep the renderer as the same React app structure and layer Electron around it.

## 5.8 UI first implementation target

P0 visual target:
- app boots
- router works
- Launchpad renders
- HQ renders
- default layouts exist
- workspace opening works
- snapshot save/restore works with fixtures
- seed data shows running/waiting/approval/disconnected cases

---

# 6. CLI definition

## 6.1 CLI purpose

The CLI is not a side project. It is the scriptable/operator-facing expression of the same shared model.

CLI goals:
- inspect entities
- create/update core objects
- drive executions and approvals
- inspect chronicle/timeline/attention/session/machine state
- provide parity for high-value GUI operations

## 6.2 CLI design rule

Every CLI command should map to:
- a canonical entity or collection
- a backend action
- a corresponding GUI surface or state

## 6.3 CLI top-level groups

Recommended top-level command groups:

- `ema launchpad`
- `ema hq`
- `ema workspace`
- `ema layout`
- `ema snapshot`
- `ema mission`
- `ema execution`
- `ema approval`
- `ema session`
- `ema machine`
- `ema service`
- `ema chronicle`
- `ema review`
- `ema recall`
- `ema trace`
- `ema artifact`
- `ema thread`
- `ema notify`
- `ema intention`
- `ema blueprint`
- `ema feed`
- `ema graph`

## 6.4 CLI command intent examples

### Shell-aligned commands
- `ema launchpad open`
- `ema hq status`
- `ema workspace list`
- `ema workspace open execution ex_77`
- `ema layout list`
- `ema snapshot save --workspace ws_1`
- `ema snapshot restore snap_1`

### Execution/control-plane commands
- `ema mission list`
- `ema mission show m_42`
- `ema execution list --status running`
- `ema execution show ex_77`
- `ema execution retry ex_77`
- `ema approval list`
- `ema approval approve att_9`

### Chronicle/trace commands
- `ema chronicle timeline --scope execution:ex_77`
- `ema trace show ex_77`
- `ema review queue`
- `ema recall search "approval required"`

### Session/host commands
- `ema session list`
- `ema session show sess_12`
- `ema session attach sess_12`
- `ema machine list`
- `ema machine show macbook-main`
- `ema service list --machine macbook-main`

### Knowledge/planning commands
- `ema intention list`
- `ema blueprint show bp_1`
- `ema feed list`
- `ema graph view execution ex_77`

## 6.5 CLI output modes

Support at least:
- table/human default
- json
- jsonl for event streams where appropriate

## 6.6 CLI parity rules

The CLI must be able to perform or inspect, at minimum:
- workspace open/save/restore references
- execution lifecycle transitions
- approval queue and approval actions
- session/machine/service truth
- chronicle timeline and trace lookup
- artifact and review lookup

If a capability is GUI-only, that should be a deliberate exception, not an accident.

---

# 7. Backend definition

## 7.1 Backend purpose

The backend should act as the durable control-plane and truth spine for EMA v1.1.

It must provide:
- canonical entities
- lifecycle transitions
- event emission
- attention derivation
- session identity and liveness
- machine/service truth
- artifact/review/memory linking
- query APIs for GUI and CLI
- event streams/subscriptions for live UI

## 7.2 Backend service domains

Recommended service boundaries:

### Core lifecycle / control plane
- intentions
- proposals
- approvals
- executions
- results/harvest

### Chronicle / trace
- event store
- trace tree
- replay
- search/recall
- review queue

### Session / host reality
- sessions
- machines
- services
- notifications
- permissions/elevation gates

### Knowledge / planning
- blueprint
- graph links
- feeds
- research imports
- memory/notes/artifacts

## 7.3 Shared entity model

Tier 0 shared entities should include at least:
- workspace
- layout-template
- workspace-snapshot
- mission
- task
- intention
n- proposal
- approval
- execution
- session
- trace
- timeline-event
- attention-item
- artifact
- review
- memory
- machine
- service
- notification
- thread
- node/environment/peer as needed

## 7.4 Lifecycle canon

Core control-plane lifecycle:

`intention -> proposal -> approval wait-state -> execution -> artifact/result -> review -> memory`

With explicit, durable states.

### Execution states
- proposed
- queued
- running
- waiting
- blocked
- completed
- failed
- cancelled

### Approval states
- pending
- approved
- rejected
- escalated
- overridden

### Session states
- connecting
- active
- idle
- waiting
- disconnected
- terminated
- errored

## 7.5 Event canon

Event families:
- intent
- execution
- delegation
- attention
- impact
- recovery
- comms
- host
- review

Every meaningful state transition should emit canonical events.

## 7.6 Attention derivation

Attention should be derived from events and durable object state, not UI heuristics.

Tier 0 attention kinds:
- approval
- blocker
- failure
- timeout-risk
- mention
- policy
- anomaly

## 7.7 Backend API surfaces

The next coding run should define one stable API shape for both CLI and GUI.

Recommended initial API classes:

### Read/query
- get entity
- list entities by type/filter
- query timeline by scope/filter
- query attention by scope/filter
- query sessions/machines/services
- query review queue
- search/recall

### Mutate/action
- create/update mission/intention/proposal
- approve/reject/escalate
- start/retry/cancel execution
- ack/resolve/suppress attention
- save/restore workspace snapshot references
- reconnect/terminate session
- machine/service actions

### Stream
- timeline event stream
- session output/liveness stream
- notification/attention stream

## 7.8 Backend storage model

Need at least:
- normalized entity storage
- append-friendly event storage
- indexed search/recall layer
- artifact metadata and lineage storage
- snapshot/layout persistence

Keep implementation flexible, but the contracts should assume durable queryable storage, not transient in-memory-only state.

---

# 8. Shared object model recommendation for next coding run

## 8.1 Put these files in one shared location

Recommended location:
- `shared/schemas/` or `packages/shared/src/`

Files:
- `shell-canon.ts`
- `entities.ts`
- `workspace.ts`
- `layout.ts`
- `timeline.ts`
- `attention.ts`
- `approval.ts`
- `execution.ts`
- `session.ts`
- `machine.ts`
- `artifact.ts`
- `review.ts`
- `trace.ts`
- `filters.ts`
- `action-system.ts`

## 8.2 Non-negotiable shared concepts

These must be shared across UI, CLI, and backend:
- `EntityRef`
- `Workspace`
- `LayoutTemplate`
- `WorkspaceSnapshot`
- `Execution`
- `TimelineEvent`
- `AttentionItem`
- `Session`
- `Artifact`
- `Machine`
- `Approval`

---

# 9. Working-shape repo plan for next run

## 9.1 Recommended top-level structure

```text
ema-ui/
  src/
    shell/
    pages/
    features/
    layouts/
    components/
    mocks/

packages/
  shared/
    src/
      schemas/
      actions/
      filters/
  cli/
    src/
      commands/
      formatters/
      api/
  backend/
    src/
      lifecycle/
      chronicle/
      approvals/
      executions/
      sessions/
      machines/
      notifications/
      review/
      search/
      graph/
```

## 9.2 If not using monorepo immediately

At minimum create logical directories that preserve the separation:
- shared schemas
- cli adapters/commands
- backend services
- ui shell

---

# 10. Concrete first-pass deliverables

## 10.1 UI deliverables

Create and wire:
- real router
- shell frame
- Launchpad page
- HQ page
- workspace host
- pane tree renderer
- default layouts
- seed data
- snapshot save/restore
- inspector
- session strip

## 10.2 CLI deliverables

Create and wire:
- command parser/scaffold
- shared API client or direct service calls
- `workspace`, `execution`, `approval`, `session`, `machine`, `chronicle` groups
- human and json output modes

## 10.3 Backend deliverables

Create and wire:
- shared lifecycle transitions
- event normalization pipeline
- event store/query layer
- attention derivation
- session registry
- machine/service registry
- approval store
- execution store
- artifact linkage

---

# 11. Recommended coding order

## Phase 1 — shared contracts
1. shared schema pack
2. lifecycle states
3. event/attention model
4. action descriptors

## Phase 2 — UI shell foundation
1. router
2. shell frame
3. workspace store
4. pane registry
5. Launchpad/HQ stub pages
6. seed data

## Phase 3 — backend spine
1. execution lifecycle service
2. approval wait-state service
3. timeline event store
4. attention derivation
5. session registry
6. machine/service registry

## Phase 4 — CLI parity thin slice
1. execution list/show/retry
2. approval list/approve/reject
3. session list/show
4. chronicle timeline
5. workspace snapshot list/save/restore

## Phase 5 — live UI wiring
1. HQ timeline
2. attention queue
3. session strip
4. inspector drilldown
5. Launchpad suggestions

---

# 12. Specific “don’t drift” rules for next run

1. Do not build new standalone pages that bypass workspaces unless clearly shell-external.
2. Do not invent separate CLI-only entity names.
3. Do not let backend event types be ad hoc strings with no shared typing.
4. Do not render fake terminal panes.
5. Do not merge layout templates and snapshots.
6. Do not silently replace stale bindings during restore.
7. Do not let HQ become a dashboard card graveyard.
8. Do not delete or overwrite other agents’ scaffolds unless explicitly reviewed and chosen.

---

# 13. Practical next-run checklist

## Before coding
- inspect current `ema-ui/src` tree and preserve existing scaffolds
- choose runtime stack definitively
- create shared schema package/location
- create CLI scaffold location
- create backend service package/location

## First coding session targets
- wire router and shell frame
- land shared schema files
- land store slices and default layouts
- land seed data
- land backend event/lifecycle stubs
- land CLI root + first command groups

## First demo target
- `ema-ui` launches
- `/launchpad` and `/hq` render from real route wiring
- fixture-backed events show in HQ
- one execution can be listed in CLI and opened in UI by the same ID
- one approval item can be seen in CLI and HQ by the same ID

---

# 14. Specific files I recommend adding next

## Shared
- `packages/shared/src/schemas/shell-canon.ts`
- `packages/shared/src/schemas/entities.ts`
- `packages/shared/src/schemas/layout.ts`
- `packages/shared/src/schemas/workspace.ts`
- `packages/shared/src/schemas/timeline.ts`
- `packages/shared/src/schemas/attention.ts`
- `packages/shared/src/schemas/execution.ts`
- `packages/shared/src/schemas/approval.ts`
- `packages/shared/src/schemas/session.ts`
- `packages/shared/src/schemas/machine.ts`

## UI
- `ema-ui/src/shell/AppShell.tsx`
- `ema-ui/src/shell/routes.tsx`
- `ema-ui/src/shell/layouts/default-layouts.ts`
- `ema-ui/src/shell/panes/pane-registry.ts`
- `ema-ui/src/shell/stores/*.ts`
- `ema-ui/src/pages/launchpad/LaunchpadPage.tsx`
- `ema-ui/src/pages/hq/HQPage.tsx`

## CLI
- `packages/cli/src/index.ts`
- `packages/cli/src/commands/execution.ts`
- `packages/cli/src/commands/approval.ts`
- `packages/cli/src/commands/session.ts`
- `packages/cli/src/commands/chronicle.ts`
- `packages/cli/src/commands/workspace.ts`

## Backend
- `packages/backend/src/executions/service.ts`
- `packages/backend/src/approvals/service.ts`
- `packages/backend/src/chronicle/service.ts`
- `packages/backend/src/attention/service.ts`
- `packages/backend/src/sessions/service.ts`
- `packages/backend/src/machines/service.ts`

---

# 15. Final recommendation

For the next actual coding run, the target should be:

**make EMA v1.1 structurally real before making it visually impressive.**

That means the next coding pass should prioritize:
- shared types
- route/workspace/layout/snapshot mechanics
- lifecycle/event/attention/session truth
- CLI parity thin slice
- HQ + Launchpad as real working surfaces

If host desktop inspection becomes available again, use it only to reconcile this plan against the latest repo/worktree actually sitting there. But even without that access, this document should put the project in a strong enough defined state to start implementing without more major ambiguity.
