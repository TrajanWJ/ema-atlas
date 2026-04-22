# EMA File-Level Patch Plan

**Execution order:** B -> A -> C
**Goal:** Prepare precise file touches for the first safe implementation pass of intent/project-state/context bootstrap.

---

## Phase C1 — Safe first code pass

### 1. `daemon/lib/ema/control_plane/schema.ex`
Add:
- `Intent` schema
- `ProjectState` schema

Purpose:
- create durable shadow tables for canonical intent/project-state records

---

### 2. `daemon/lib/ema/control_plane/persistence.ex`
Add:
- `upsert_intent/1`
- `get_intent/1`
- `list_intents/1`
- `upsert_project_state/1`
- `get_project_state/1`
- `sync_intent/1`
- `sync_project_state/1`

Purpose:
- durable queryable storage path matching existing proposal/execution/outcome patterns

---

### 3. `daemon/lib/ema/control_plane/store.ex`
Add:
- `IntentRecord` struct
- `ProjectStateRecord` struct
- state maps:
  - `intents`
  - `project_states`
- public functions:
  - `get_project_state/1`
  - `list_intents/2`
  - `intent_snapshot/1`
  - `bootstrap_project/2`
  - `update_intent/2`
- extend `context_snapshot/2`

Purpose:
- keep live authority inside current control-plane

---

### 4. `daemon/lib/ema/context/injector.ex`
Implement:
- `project_package/2`
- `operator_package/1`
- `session_evidence/2`

Purpose:
- promote bounded context to first-class service

---

### 5. `daemon/lib/ema_web/controllers/control_plane_controller.ex`
Add handlers:
- `project_state/2`
- `list_project_intents/2`
- `intent_snapshot/2`
- `bootstrap_project/2`
- `update_intent/2`
- `project_package/2`
- `operator_package/2`
- `session_evidence/2`

Purpose:
- expose v1 read/bootstrap APIs

---

### 6. `daemon/lib/ema_web/router.ex`
Add routes:
- `get /control-plane/projects/:project/state`
- `post /control-plane/projects/:project/bootstrap`
- `get /control-plane/projects/:project/intents`
- `get /control-plane/projects/:project/intent-snapshot`
- `post /control-plane/intents/:id/update`
- `get /context/project/:project/package`
- `get /context/operator/package`
- `get /context/project/:project/session-evidence`

Purpose:
- make API contract real

---

## Safety rule

The first implementation pass should prioritize:
1. read endpoints
2. bootstrap idempotency
3. compile-safe additions
4. zero disruption to existing proposal/execution flows

Avoid in first pass:
- deep wiki sync coupling
- major migrations of existing session logic
- breaking `context_for`
- large refactors of control-plane authority
