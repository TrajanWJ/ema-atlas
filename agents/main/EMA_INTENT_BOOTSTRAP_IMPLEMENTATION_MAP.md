# EMA Intent Bootstrap Implementation Map

**Status:** Active working map
**Goal:** Identify the exact EMA modules and API touchpoints to extend for live intent/project-state/context bootstrap via MCP.

---

## 1. Strongest current finding

EMA already has the right control-plane spine for a minimal v1.

The shortest path is to **extend the existing control-plane** rather than create a parallel intent engine.

Existing strengths:
- `Ema.ControlPlane.Store` already models:
  - `Proposal`
  - `Execution`
  - `Outcome`
- `Proposal.intent` and `Execution.intent` are already first-class fields
- `Store.context_for(project)` already produces a bounded project snapshot
- `Ema.ControlPlane.Persistence` already provides durable Ecto-backed storage for:
  - proposals
  - executions
  - outcomes
  - host sessions
  - surface bindings
- `EmaWeb.ControlPlaneController` and `router.ex` already expose control-plane read/write APIs
- `Ema.Context.Injector` exists as a natural place to promote context assembly into a first-class service

---

## 2. Best insertion points

### A. Runtime/control-plane state

#### `daemon/lib/ema/control_plane/store.ex`
**Why it matters**
- already the live authority
- already owns proposal -> execution -> outcome lineage
- already builds project snapshots via `context_for(project)`
- already indexes by project and persists state

**Recommended additions**
- add `IntentRecord` struct
- add `ProjectStateRecord` struct
- add state maps:
  - `intents: %{}`
  - `project_states: %{}`
- add API functions:
  - `bootstrap_project/2`
  - `get_project_state/1`
  - `list_intents/2`
  - `update_intent/2`
  - `intent_snapshot/1`
- extend `context_snapshot/2` to include:
  - active intents
  - blockers
  - next actions
  - linked wiki refs

---

#### `daemon/lib/ema/control_plane/schema.ex`
**Why it matters**
- durable Ecto shadow already exists here
- natural place for intent/project-state tables

**Recommended additions**
- add `Intent` schema
- add `ProjectState` schema

**Suggested fields for `Intent`**
- `id`
- `project`
- `slug`
- `title`
- `kind`
- `status`
- `priority`
- `current_focus`
- `summary`
- `objectives` (map/array)
- `blockers` (map/array)
- `next_actions` (map/array)
- `linked_refs` (map)
- `metadata` (map)

**Suggested fields for `ProjectState`**
- `id`
- `project`
- `title`
- `status`
- `current_focus_intent_id`
- `primary_goal`
- `active_intent_ids`
- `blockers`
- `recent_decisions`
- `next_actions`
- `linked_refs`
- `metadata`

---

#### `daemon/lib/ema/control_plane/persistence.ex`
**Why it matters**
- already provides the durable shadow path and query helpers

**Recommended additions**
- `upsert_intent/1`
- `get_intent/1`
- `list_intents/1`
- `upsert_project_state/1`
- `get_project_state/1`
- `sync_intent/1`
- `sync_project_state/1`

---

### B. Context assembly

#### `daemon/lib/ema/context/injector.ex`
**Current state**
- exists but is effectively empty

**Why it matters**
- best place to promote context assembly out of ad hoc control-plane snapshotting

**Recommended additions**
- implement canonical bounded context package builder
- initial public functions:
  - `project_package(project, opts \\ [])`
  - `operator_package(opts \\ [])`
  - `session_evidence(project, opts \\ [])`

**v1 package composition**
- host/runtime truth from Store + surfaces
- project state from control-plane project state record
- active intents from intent storage
- executions/proposals/outcomes from Persistence/Store
- wiki placeholders/refs for now if full wiki adapter is not yet live
- session evidence from host session persistence

---

### C. API layer

#### `daemon/lib/ema_web/controllers/control_plane_controller.ex`
**Why it matters**
- already exposes canonical control-plane endpoints
- easiest place for v1 read/write APIs before splitting controllers further

**Recommended additions**

##### Read endpoints
- `project_state/2`
- `list_intents/2`
- `intent_snapshot/2`
- `project_package/2`
- `operator_package/2`
- `session_evidence/2`

##### Write/bootstrap endpoints
- `bootstrap_project/2`
- `create_or_update_intent/2`
- `link_intent_ref/2` (optional early)

---

#### `daemon/lib/ema_web/router.ex`
**Why it matters**
- existing control-plane routes already cluster naturally around these concerns

**Recommended new routes**

##### Intent/project routes
- `get /control-plane/projects/:project/state`
- `post /control-plane/projects/:project/bootstrap`
- `get /control-plane/projects/:project/intents`
- `post /control-plane/intents/:id/update`
- `get /control-plane/projects/:project/intent-snapshot`

##### Context package routes
- `get /context/project/:project/package`
- `get /context/operator/package`
- `get /context/project/:project/session-evidence`

These should coexist with current `/control-plane/context_for` initially, then eventually supersede it.

---

## 3. Recommended v1 runtime behavior

### Phase 1 — Read-first
Build these first:
- `get_project_state`
- `list_intents`
- `intent_snapshot`
- `project_package`

This gives immediate recovery value without needing full mutation flows first.

### Phase 2 — Bootstrap/write
Then add:
- `bootstrap_project`
- `update_intent`
- `upsert_project_state`

This makes live intent initialization possible.

### Phase 3 — Wiki sync bridge
After the above is stable, add a small sync layer so project state/intents can refresh canonical wiki pages.

---

## 4. Concrete v1 data to seed

### Suggested project
- `project = "ema"`

### Suggested initial intents
- `ema-root`
- `host-cli-integration`
- `session-normalization`
- `mcp-baseline`
- `wiki-buildout`
- `vault-deprecation`
- `openclaw-surface-alignment`
- `codex-parity`

### Suggested project-state initial fields
- primary goal: EMA as canonical context/session/control spine
- blockers:
  - split session truth
  - duplicated context assembly
  - vault dependence
- next actions:
  - add intent records
  - expose context package endpoints
  - seed wiki pages
  - align clients to EMA packages

---

## 5. MCP projection path

Once the above routes exist, the MCP layer should project them as:
- `intent.bootstrap_project`
- `intent.get_project`
- `intent.list`
- `intent.update`
- `intent.snapshot`
- `context.project_package`
- `context.operator_package`
- `context.session_evidence`

The MCP layer should not invent separate truth.
It should be a thin projection of these EMA contracts.

---

## 6. Best first code change sequence

1. add `Intent` + `ProjectState` schemas in `schema.ex`
2. add persistence helpers in `persistence.ex`
3. extend `Store` state with intents/project_states
4. extend `Store.context_snapshot` to include them
5. implement `Ema.Context.Injector.project_package/2`
6. add controller actions for read endpoints
7. add router entries
8. add bootstrap/update endpoints
9. only then project through MCP

---

## 7. Important cautions

- Do not create a second parallel intent store outside control-plane.
- Do not make wiki the live runtime authority for intent mutation.
- Do not ship Claude-only semantics; Codex must remain in scope.
- Do not keep `context_for` and new context package endpoints semantically divergent.
- Do not let OpenClaw/ClaudeForge become alternate durable writers of intent truth.

---

## 8. Definition of ready for live bootstrap

EMA is ready for the first live intent bootstrap when:
- `Store` can return project state + active intents
- `Context.Injector` can assemble a project package
- controller/router expose project + context endpoints
- initial EMA intents are seedable idempotently
- MCP can project those endpoints without inventing new state
