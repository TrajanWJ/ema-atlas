# Phased Execution Memo: EMA Host CLI Integration

**Generated:** 2026-04-06
**Status:** Active
**Complexity:** High
**Scope:** EMA, Wiki Engine, Claude, Codex, OpenClaw, MCP baseline, intents bootstrap

---

## Overview

This memo turns the current recovery/consolidation work into a phased execution path.

The working thesis is now stable:
- **EMA** should become the canonical host control plane, session registry, and context assembler.
- **Wiki Engine** should become the canonical semantic memory substrate.
- **Intent state** should become explicit, queryable, and bootstrappable through EMA + MCP.
- **Claude/Codex** should be treated as host-native session providers.
- **OpenClaw/ClaudeForge** should act as surfaces over shared truth.
- **Vault** should be demoted from primary operational memory to import/archive/mirror.

Execution should proceed by stabilizing EMA’s read/bootstrap surfaces, building durable semantic mirrors, normalizing MCP/plugin behavior, and then expanding write paths and session linkage.

---

## Prerequisites

- EMA daemon repo available at `/home/trajan/Projects/ema/daemon`
- Workspace docs available at `/home/trajan/.openclaw/agents/main/workspace`
- Existing bootstrap artifacts already written:
  - `CANONICAL_ARCHITECTURE.md`
  - `INTENT_SCHEMA.md`
  - `CONTEXT_PACKAGE_SPEC.md`
  - `EMA_INTENT_BOOTSTRAP_API_SPEC.md`
  - `CLI_FEATURE_MAP.md`
- Existing EMA code scaffolding already added:
  - migration for intent/project-state tables
  - persistence helpers
  - context injector
  - read-first routes
  - seeds
  - focused test coverage

---

## Phase 1: Stabilize EMA Read-First Bootstrap Surface

**Goal:** Make EMA’s new read/bootstrap scaffolding a trustworthy first-run operator entrypoint.

**Demo/Validation:**
- `mix ecto.migrate`
- `mix run priv/repo/seeds.exs`
- start app
- verify read routes return seeded EMA project state and intents
- focused tests pass

### Task 1.1: Validate migration + seeds path
- **Location:** `daemon/priv/repo/migrations/20260406211500_create_intent_and_project_state_tables.exs`, `daemon/priv/repo/seeds.exs`
- **Description:** Verify migration + seeds work cleanly from a cold start.
- **Acceptance Criteria:**
  - intent/project-state tables exist
  - `ema` project state row exists after seed run
  - root intents exist after seed run
- **Validation:**
  - run `mix ecto.migrate`
  - run `mix run priv/repo/seeds.exs`
  - inspect via read routes or repo console

### Task 1.2: Verify read-first routes end-to-end
- **Location:** `daemon/lib/ema_web/router.ex`, `daemon/lib/ema_web/controllers/control_plane_controller.ex`
- **Description:** Exercise and verify:
  - `/api/control-plane/projects/:project/state`
  - `/api/control-plane/projects/:project/intents`
  - `/api/control-plane/projects/:project/intent-snapshot`
  - `/api/context/project/:project/package`
  - `/api/context/operator/package`
  - `/api/context/project/:project/session-evidence`
- **Dependencies:** Task 1.1
- **Acceptance Criteria:**
  - routes return valid JSON
  - seeded `ema` data appears consistently
- **Validation:** curl/manual browser/API checks

### Task 1.3: Clean up non-blocking warnings/regressions in this lane
- **Location:** touched EMA files only
- **Description:** Resolve warnings or async-sync issues directly related to intent/project-state/context work.
- **Dependencies:** Task 1.2
- **Acceptance Criteria:**
  - no new blocking warnings from the feature lane
  - focused tests still pass
- **Validation:** `mix compile`, focused `mix test`

---

## Phase 2: Add Minimal Write/Bootstrap APIs

**Goal:** Enable live initialization and safe mutation of project state and intent state.

**Demo/Validation:**
- bootstrap `ema` through HTTP/API path
- update one intent through canonical API
- reread state and confirm change

### Task 2.1: Add project bootstrap endpoint
- **Location:** `daemon/lib/ema_web/controllers/control_plane_controller.ex`, `daemon/lib/ema_web/router.ex`, `daemon/lib/ema/control_plane/store.ex`
- **Description:** Implement `POST /api/control-plane/projects/:project/bootstrap` as an idempotent bootstrap path.
- **Dependencies:** Phase 1 complete
- **Acceptance Criteria:**
  - idempotent on repeated calls
  - creates project state and missing root intents
- **Validation:** repeated POST calls return stable state

### Task 2.2: Add intent update endpoint
- **Location:** same controller/router/store path
- **Description:** Implement `POST /api/control-plane/intents/:id/update` with constrained patch semantics.
- **Dependencies:** Task 2.1
- **Acceptance Criteria:**
  - supports status/focus/objectives/blockers/next-actions updates
  - rejects malformed patches
- **Validation:** endpoint tests + manual curl

### Task 2.3: Add read/write route tests for bootstrap APIs
- **Location:** `daemon/test/ema_web/controllers/control_plane_controller_test.exs`
- **Description:** Cover idempotency, valid updates, invalid patch handling.
- **Dependencies:** Tasks 2.1–2.2
- **Acceptance Criteria:**
  - tests prove safe bootstrap + patch semantics
- **Validation:** focused tests pass

---

## Phase 3: Build Canonical Wiki Spine and Intent Mirrors

**Goal:** Promote wiki from a draft mirror to durable semantic operating memory.

**Demo/Validation:**
- a human can understand the lane from wiki pages alone
- intent pages mirror live coordination themes

### Task 3.1: Maintain canonical top-level pages
- **Location:** `workspace/wiki/projects`, `workspace/wiki/architecture`, `workspace/wiki/operations`, `workspace/wiki/decisions`
- **Description:** Keep these pages current:
  - `projects/EMA`
  - `architecture/Canonical Architecture`
  - `architecture/Intent Model`
  - `architecture/Context Package`
  - `operations/Vault Deprecation`
- **Dependencies:** none; can progress in parallel
- **Acceptance Criteria:**
  - pages match current runtime truth and migration stance
- **Validation:** manual review

### Task 3.2: Complete initial intent mirror set
- **Location:** `workspace/wiki/intents`
- **Description:** Ensure mirrors exist and are consistent for all 8 seed intents.
- **Dependencies:** Task 3.1
- **Acceptance Criteria:**
  - each mirror includes runtime authority note
  - each mirror cross-links project/architecture/ops pages
- **Validation:** manual link walk

### Task 3.3: Remap daemon-wiki docs into canonical architecture pages
- **Location:** `workspace/wiki/architecture`
- **Description:** Continue translating daemon-wiki source material into:
  - dispatch substrate
  - routing engine
  - governance and safety
  - handoff and pipeline
  - session model
- **Dependencies:** Task 3.1
- **Acceptance Criteria:**
  - canonical wiki no longer depends on daemon-wiki index as top-level navigation
- **Validation:** manual navigation test

---

## Phase 4: Normalize MCP and Plugin Surface

**Goal:** Make the MCP baseline authoritative and expose hidden drift mechanically.

**Demo/Validation:**
- one layered manifest exists
- Claude/Codex parity reports exist
- OpenClaw parity report exists
- known broken extras are either fixed, classified, or removed

### Task 4.1: Define layered MCP manifest v1
- **Location:** workspace bootstrap/spec docs and baseline files
- **Description:** Introduce layers such as:
  - core
  - optional
  - transitional
  - client-specific
- **Dependencies:** none
- **Acceptance Criteria:**
  - manifest fields cover command/args/env/layer/owner/targets
- **Validation:** manifest review + generator dry run

### Task 4.2: Generate effective-surface diffs
- **Location:** generator scripts + workspace reports
- **Description:** Produce:
  - effective Claude surface diff
  - effective Codex surface diff
- **Dependencies:** Task 4.1
- **Acceptance Criteria:**
  - hidden extras become visible
  - stale/unknown entries can be identified
- **Validation:** compare against live config files

### Task 4.3: Generate OpenClaw parity report
- **Location:** workspace parity artifacts
- **Description:** Classify each baseline capability as:
  - via-mcp
  - native-openclaw
  - ema-backed
  - missing
  - intentional-difference
- **Dependencies:** Task 4.1
- **Acceptance Criteria:**
  - parity decisions are explicit rather than narrative only
- **Validation:** manual review against actual OpenClaw tool surface

### Task 4.4: Classify Claude extras
- **Location:** Claude config + workspace report
- **Description:** Decide for each extra whether to:
  - promote
  - keep client-specific
  - deprecate
- **Dependencies:** Task 4.2
- **Acceptance Criteria:**
  - no unknown/haunted MCP entries remain
- **Validation:** effective-surface report updated

---

## Phase 5: Session Normalization Bridge

**Goal:** Make session evidence a first-class bridge between runtime state, semantic memory, and future UI/workbench surfaces.

**Demo/Validation:**
- a recent Claude/Codex session is imported, linked, and visible through EMA project context

### Task 5.1: Verify Claude and Codex importer paths
- **Location:** EMA surfaces/session import modules
- **Description:** confirm actual importer parity and identify missing binding behavior.
- **Dependencies:** Phase 1 complete
- **Acceptance Criteria:**
  - both providers have a clear importer/status story
- **Validation:** importer dry runs / route checks

### Task 5.2: Link sessions to project/intents/executions
- **Location:** control-plane/session binding code
- **Description:** define canonical binding rules for session evidence.
- **Dependencies:** Task 5.1
- **Acceptance Criteria:**
  - session evidence appears in context packages with clear lineage
- **Validation:** project package inspection

### Task 5.3: Backfill session evidence into wiki summaries
- **Location:** wiki sync / semantic mirror workflow
- **Description:** add one minimal path from session evidence to durable summary.
- **Dependencies:** Tasks 5.1–5.2, Phase 3 mature enough
- **Acceptance Criteria:**
  - one session can update project/wiki truth without transcript dumping
- **Validation:** manual summary review

---

## Testing Strategy

- Focused `mix test` for persistence/context/controller paths after each runtime change
- Use idempotent seed runs as bootstrap validation
- Use manual route checks for read/bootstrap endpoints
- Use report generation as validation for MCP/plugin normalization
- Use manual link-walk review for wiki semantic coherence

---

## Risks & Gotchas

- Write APIs can accidentally overreach; keep patches narrow and idempotent.
- Wiki mirrors can drift from runtime truth if treated as live authority.
- MCP normalization can sprawl if extras are not classified aggressively.
- Session normalization can recreate split-brain if surfaces retain semi-authoritative local state.
- Vault can quietly remain a dependency unless continuation flows are actively tested without it.

---

## Rollback Plan

- Runtime changes are isolated to intent/project-state/context bootstrap paths and can be reverted by file.
- Seed content is idempotent and can be adjusted without changing schema.
- Wiki mirror pages are additive and can be revised without affecting runtime authority.
- MCP/plugin normalization should be rolled out through generated diffs before destructive cleanup.
