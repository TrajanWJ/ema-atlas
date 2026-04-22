# Execution Spec: EMA Host CLI Integration

**Status:** Active execution spec
**Purpose:** Translate the phased memo into actionable work packets with acceptance criteria and run order.

---

## Work Packet A — EMA Read-First Bootstrap Verification

### Objective
Prove the new intent/project-state/context bootstrap path works from a clean runtime.

### Inputs
- migration: `20260406211500_create_intent_and_project_state_tables.exs`
- seeds: `daemon/priv/repo/seeds.exs`
- read routes + tests already present

### Steps
1. run `mix ecto.migrate`
2. run `mix run priv/repo/seeds.exs`
3. start daemon
4. verify:
   - `/api/control-plane/projects/ema/state`
   - `/api/control-plane/projects/ema/intents`
   - `/api/control-plane/projects/ema/intent-snapshot`
   - `/api/context/project/ema/package`
5. capture any mismatches or warnings

### Acceptance Criteria
- all read routes return coherent seeded data
- no bootstrap-specific runtime error blocks the path
- focused tests remain green

---

## Work Packet B — Minimal Write/Bootstrap API

### Objective
Add the smallest useful write surface for project/bootstrap state.

### Steps
1. implement `POST /api/control-plane/projects/:project/bootstrap`
2. implement `POST /api/control-plane/intents/:id/update`
3. add route/controller tests
4. verify idempotency and error handling

### Acceptance Criteria
- project bootstrap is idempotent
- intent update is constrained and deterministic
- read routes reflect changes after write

---

## Work Packet C — Canonical Wiki Spine Completion

### Objective
Complete the first semantic-memory skeleton so active work can be understood from wiki.

### Required pages
- `projects/EMA`
- `architecture/Canonical Architecture`
- `architecture/Intent Model`
- `architecture/Context Package`
- `operations/Vault Deprecation`
- `architecture/Session Model`
- `architecture/Dispatch Substrate`
- `architecture/Routing Engine`
- `architecture/Governance and Safety`
- `architecture/Handoff and Pipeline`
- `decisions/Memory Authority`
- `operations/Migration Order`

### Acceptance Criteria
- cross-links exist
- current/canonical/transitional sections exist
- pages reflect current lane truth

---

## Work Packet D — Intent Mirror Completion

### Objective
Complete the first canonical mirror set for active work.

### Required mirrors
- `ema-root`
- `wiki-buildout`
- `host-cli-integration`
- `session-normalization`
- `mcp-baseline`
- `vault-deprecation`
- `openclaw-surface-alignment`
- `codex-parity`

### Acceptance Criteria
- all mirrors exist
- runtime authority note present on each
- links to project/architecture/ops pages present

---

## Work Packet E — MCP/Plugin Normalization

### Objective
Make the MCP baseline authoritative and make hidden drift visible.

### Steps
1. define layered manifest
2. generate effective Claude diff
3. generate effective Codex diff
4. generate OpenClaw parity report
5. classify Claude extras

### Acceptance Criteria
- baseline/core vs extras is explicit
- known broken extras are fixed or classified
- OpenClaw parity is mechanical, not just narrative

---

## Work Packet F — Session Normalization Bridge

### Objective
Use canonical session evidence to connect runtime truth and semantic memory.

### Steps
1. verify Claude importer path
2. verify Codex importer path/parity gaps
3. define canonical bindings: project, intent, execution, surface
4. ensure session evidence appears in context packages
5. define one backfill path into wiki summaries

### Acceptance Criteria
- one recent session can be linked into EMA project state
- session evidence can influence wiki summary without transcript dumping

---

## Dependency Graph

- A unlocks B and informs E/F
- C and D can progress alongside A/B but depend on canonical docs already written
- E should start after A is stable enough to avoid moving config targets mid-flight
- F should follow after A and preferably after B so write paths exist

---

## Recommended Immediate Order
1. A
2. B
3. C
4. D
5. E
6. F

---

## Success Condition
The lane is successful when:
- EMA can bootstrap/read/update canonical project + intent state
- wiki reflects durable semantic truth through canonical pages and intent mirrors
- Claude/Codex/OpenClaw can consume the same shared truth
- MCP/plugin behavior is explainable and aligned
- vault is no longer required for active continuation
