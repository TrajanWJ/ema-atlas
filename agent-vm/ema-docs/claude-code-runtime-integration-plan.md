# Plan: Claude Code Runtime Integration for EMA

**Generated**: 2026-04-06
**Estimated Complexity**: High

## Overview

Integrate **Claude Code as a first-class EMA runtime/provider**, while keeping **EMA as the system of record** for proposals, executions, lineage, and operator state.

The key architectural choice is:

- **Claude Code is both a provider and eventually a channel/surface**, but
- **provider/runtime integration comes first**,
- with **resumable session-backed execution** as a core feature,
- and **external/chat exposure only after the backend path is reliable**.

This plan explicitly avoids turning EMA into a clone of CodeClawed or moving authority out of EMA. Instead, it pulls in the useful Claude-runtime ideas:
- single runner abstraction
- session resume mapping
- one runtime boundary for cron/background/chat-style calls
- transport/channel separation

## Confirmed Decisions

From Trajan's direction:

- **1. Claude Code role:** both provider + channel, **provider first**
- **2. Execution model:** both resumable and one-shot, with resumable strongly preferred for operator/chat/session flows
- **3. System of record:** **EMA stays canonical**
- **4. Exposure order:** internal routing first, then external/channel + UI exposure
- **5. First patch scope:** architecture/skeleton + backend integration + end-to-end session path

---

## Goals

1. Add **Claude Code** as a valid EMA execution backend/provider.
2. Persist **Claude session IDs** in EMA so executions can resume across turns/restarts.
3. Route proposals/executions through Claude Code via the same EMA control-plane truth model used by other runtimes.
4. Support both:
   - **one-shot execution** for background/scheduled tasks
   - **resumable execution** for interactive/operator flows
5. Prepare a clean path for later **channel exposure** (chat/external surface) without redesigning the backend.

## Non-Goals (for this phase)

- Replacing EMA dispatch/OpenClaw entirely
- Building a full Claude-native frontend before backend truth exists
- Modeling every Claude Code feature in v1 (forks, branch orchestration, deep artifact sync, etc.)
- Turning current mock/planned realtime surfaces into a fully live control room in the same patch set

---

## Architectural Principles

### 1. EMA is canonical
Claude Code never becomes the system of record. EMA owns:
- proposals
- executions
- provider choice
- session lineage
- completion/failure state
- operator views

### 2. Runtime and channel are separate concerns
Distinguish:
- **runtime/provider** = who executes work (`claude-code`, `ema-dispatch`, later `codex`, etc.)
- **channel/surface** = where work comes from or is displayed (`discord`, `web`, `api`, later `claude-code-chat` if desired)

### 3. One runtime boundary
All Claude Code execution should pass through a single EMA abstraction:
- one runner module
- one argument builder
- one result normalization path
- one session mapping path

### 4. Session persistence is a feature, not an afterthought
Claude Code is most valuable when EMA can preserve and resume context.

### 5. Backend truth before UI polish
No Claude-specific UI/channel work until execution lifecycle and state reporting are solid.

---

## Proposed Target Architecture

```text
EMA Control Plane
  ├─ Proposal Engine
  ├─ Execution lifecycle
  ├─ SmartRouter
  ├─ SessionManager / execution truth
  └─ Provider adapter selection
           ↓
      ClaudeCode Adapter
           ↓
      ClaudeCode Runner
           ↓
      claude CLI subprocess
           ↓
  normalized result / stream / session_id
           ↓
  EMA execution updates + session persistence
```

### New backend path
- `SmartRouter` or execution dispatcher selects `provider = "claude-code"`
- `ClaudeCode Adapter` translates EMA execution request into runner call
- `ClaudeCode Runner` invokes `claude` with the correct mode
- returned session metadata gets persisted into EMA
- execution updates flow back into EMA APIs/models/events

---

## Proposed Modules / Touchpoints

## New modules

### 1. `Ema.Claude.Adapters.ClaudeCode`
Provider/backend adapter implementing the same behavior contract as other Claude backends/adapters.

**Responsibilities:**
- accept normalized EMA execution input
- choose one-shot vs resume mode
- call runner
- normalize result/error/session payload
- report health/capabilities

### 2. `Ema.Claude.ClaudeCodeRunner`
Single runtime boundary around the local `claude` CLI.

**Responsibilities:**
- build CLI args
- set working directory
- choose output mode (`--print`, structured output if usable)
- pass resume session ID when present
- parse stdout/stderr/result
- detect session init / updated session id
- emit normalized runner result

### 3. `Ema.Claude.ClaudeCodeSessionStore` (or extend existing SessionManager schema)
Map EMA execution/session records to Claude Code session IDs and runtime metadata.

**Responsibilities:**
- store `claude_session_id`
- store runtime working dir / project root
- record one-shot vs resumable mode
- store last-known resume viability / error state

### 4. `Ema.Channels.ClaudeCode` (later phase)
Not for v1 implementation, but reserve conceptual space for a future Claude-facing channel/surface.

---

## Existing modules likely touched

- `Ema.Claude.SessionManager`
- `Ema.Claude.SmartRouter`
- backend/provider behavior contracts
- execution dispatch pipeline
- control-plane write endpoints for execution updates
- health / observability surfaces
- possibly `ProviderRegistry` and `CircuitBreaker`

---

## Data Model Additions

Add or extend execution/session persistence with fields like:

- `provider` = `claude-code`
- `runtime_mode` = `one_shot | resumable`
- `claude_session_id`
- `working_directory`
- `resume_supported` boolean
- `resume_last_checked_at`
- `resume_failure_reason`
- `external_runtime_metadata` JSON

### Why this matters
Without explicit runtime metadata, resumable behavior becomes fragile and hard to debug.

---

## Phase Plan

## Sprint 1: Architecture + adapter skeleton
**Goal**: establish the runtime/provider boundary and make Claude Code a recognized backend in EMA without yet depending on full session resumption.

**Demo/Validation**:
- EMA recognizes `claude-code` as a valid provider
- a dry-run or mocked execution path works end-to-end through the adapter layer
- provider health reporting shows Claude Code backend status

### Task 1.1: Add provider type/constants for Claude Code
- **Location**: provider enums/config/runtime selection modules
- **Description**: Introduce `claude-code` as a recognized provider/runtime token across relevant dispatch/router layers.
- **Dependencies**: none
- **Acceptance Criteria**:
  - routing/config code accepts `claude-code`
  - provider registry or equivalent exposes it cleanly
- **Validation**:
  - tests for provider parsing/selection

### Task 1.2: Create `Ema.Claude.Adapters.ClaudeCode`
- **Location**: `daemon/lib/ema/claude/adapters/claude_code.ex`
- **Description**: Implement adapter skeleton conforming to existing backend behavior.
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - module compiles
  - returns normalized health/capabilities
  - exposes `run` entrypoint compatible with EMA backend dispatch
- **Validation**:
  - adapter unit tests

### Task 1.3: Create `Ema.Claude.ClaudeCodeRunner`
- **Location**: `daemon/lib/ema/claude/claude_code_runner.ex`
- **Description**: Centralize shell invocation, arg building, cwd handling, timeout handling, stdout/stderr parsing.
- **Dependencies**: Task 1.2
- **Acceptance Criteria**:
  - runner can perform a local health check (`claude` on PATH, version/help callable)
  - runner returns normalized success/error tuples
- **Validation**:
  - runner tests with mocked command execution

### Task 1.4: Add health reporting + diagnostics
- **Location**: control-plane/provider health modules
- **Description**: Surface whether Claude Code is installed, runnable, authenticated, and currently degraded.
- **Dependencies**: Task 1.3
- **Acceptance Criteria**:
  - operator can see if `claude-code` is healthy vs auth-broken vs missing
- **Validation**:
  - health endpoint or debug output includes Claude Code status

---

## Sprint 2: Real backend integration (one-shot path)
**Goal**: make EMA actually able to execute work through Claude Code in a one-shot mode.

**Demo/Validation**:
- submit a proposal/execution through EMA using `provider=claude-code`
- Claude Code runs locally through EMA
- EMA captures result/failure and marks execution accordingly

### Task 2.1: Wire adapter into execution dispatch path
- **Location**: execution dispatch / provider selection layer
- **Description**: Allow EMA to choose `ClaudeCode` adapter for selected executions.
- **Dependencies**: Sprint 1 complete
- **Acceptance Criteria**:
  - backend selection reaches ClaudeCode adapter from real execution path
- **Validation**:
  - integration test or manual execution using real provider selection

### Task 2.2: Normalize Claude result into EMA execution model
- **Location**: execution completion/update flow
- **Description**: Convert runner output into EMA's canonical execution update semantics.
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - success maps to execution completion
  - failure maps to execution failure with structured reason
  - stdout/summary become inspectable execution output
- **Validation**:
  - manual run + DB/API state verification

### Task 2.3: Add auth/error classification
- **Location**: runner + adapter + circuit breaker
- **Description**: Detect common Claude CLI failures like missing binary, expired auth, timeout, permission failure, invalid cwd.
- **Dependencies**: Task 2.2
- **Acceptance Criteria**:
  - expired OAuth/auth failures are clearly classified
  - operator gets actionable failure state instead of generic crash
- **Validation**:
  - tests against sample stderr/output patterns

### Task 2.4: Add config knobs for Claude Code runtime use
- **Location**: runtime config docs/env/config modules
- **Description**: Define flags for enabling provider, default model, timeout, allowed working roots, resume policy defaults.
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - Claude runtime is configurable without code edits
- **Validation**:
  - config load tests + documented example

---

## Sprint 3: Resumable session path
**Goal**: make Claude Code usable for persistent/multi-turn EMA flows through session ID storage and resume.

**Demo/Validation**:
- first execution creates a Claude session
- second execution on same logical thread resumes the session
- EMA stores and reuses the Claude session ID

### Task 3.1: Extend session/execution schema for Claude session metadata
- **Location**: Ecto schemas + migrations
- **Description**: Add fields for `claude_session_id`, runtime mode, working dir, resume metadata.
- **Dependencies**: Sprint 2 complete
- **Acceptance Criteria**:
  - schema supports Claude session linkage cleanly
- **Validation**:
  - migration tests + schema tests

### Task 3.2: Persist session IDs from runner results
- **Location**: adapter/session manager integration
- **Description**: Capture the Claude session ID from first successful run and store it against EMA session/execution records.
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - new execution stores usable Claude session metadata
- **Validation**:
  - integration test using real or mocked session output

### Task 3.3: Resume on subsequent compatible executions
- **Location**: adapter + session manager + router
- **Description**: For eligible flows, pass stored session ID back into Claude Code runner to continue the session.
- **Dependencies**: Task 3.2
- **Acceptance Criteria**:
  - second invocation uses `--resume` path when appropriate
  - failed resume falls back cleanly
- **Validation**:
  - manual two-step run proving continuity

### Task 3.4: Add resume failure fallback policy
- **Location**: runner/adapter/session manager
- **Description**: If resume fails due to expired/invalid session, mark it stale and create a fresh session without poisoning the execution system.
- **Dependencies**: Task 3.3
- **Acceptance Criteria**:
  - stale session does not brick future runs
- **Validation**:
  - forced invalid-session test case

---

## Sprint 4: Routing + operator control
**Goal**: make Claude Code selectable/usable intentionally inside EMA, while still keeping exposure controlled.

**Demo/Validation**:
- SmartRouter can route selected work to Claude Code
- operator can intentionally choose or override provider
- EMA live views show provider/runtime on executions

### Task 4.1: Teach SmartRouter about Claude Code fitness/eligibility
- **Location**: `Ema.Claude.SmartRouter`
- **Description**: Add routing heuristics for when Claude Code is appropriate.
- **Dependencies**: Sprint 3 complete
- **Acceptance Criteria**:
  - routing can choose `claude-code`
  - unsupported or degraded conditions steer elsewhere
- **Validation**:
  - router tests with fitness scenarios

### Task 4.2: Add provider override path in control-plane commands/APIs
- **Location**: control-plane command parsing + proposals/run endpoint
- **Description**: Allow explicit `provider=claude-code` or equivalent override.
- **Dependencies**: Task 4.1
- **Acceptance Criteria**:
  - operator can force Claude Code on a run
- **Validation**:
  - API/command test

### Task 4.3: Surface runtime/provider in execution status
- **Location**: API serializers + frontend models
- **Description**: Show which provider executed a run and whether it is resumable/session-backed.
- **Dependencies**: Task 4.2
- **Acceptance Criteria**:
  - execution payloads include provider/runtime/session fields
- **Validation**:
  - inspect API payloads and UI render if available

---

## Sprint 5: Channel/surface exposure (after backend truth)
**Goal**: expose Claude-backed work through EMA surfaces without creating a second shadow control model.

**Demo/Validation**:
- operator can initiate/view Claude-backed conversations or runs through EMA
- all messages/outcomes still land in EMA canonical execution/session records

### Task 5.1: Define channel contract for Claude-backed interactive flows
- **Location**: channel bridge design modules/docs
- **Description**: Define how EMA presents Claude interactive flows without confusing channel vs provider semantics.
- **Dependencies**: Sprint 4 complete
- **Acceptance Criteria**:
  - clear contract for chat/operator use of Claude-backed sessions
- **Validation**:
  - documented flow + minimal proof implementation

### Task 5.2: Add minimal UI/runtime selector exposure
- **Location**: frontend provider selection / execution details
- **Description**: Let operators see/select Claude Code where appropriate.
- **Dependencies**: Task 5.1
- **Acceptance Criteria**:
  - provider visible and selectable in at least one execution/proposal flow
- **Validation**:
  - manual UI verification

### Task 5.3: Add external-channel bridge only if still desired
- **Location**: future bridge/channel layer
- **Description**: If needed, expose Claude-backed interactive work to external channel surfaces, but still report everything back through EMA.
- **Dependencies**: backend path proven stable
- **Acceptance Criteria**:
  - no shadow state machine outside EMA
- **Validation**:
  - end-to-end message → execution → completion visibility test

---

## Recommended Runtime Semantics

## One-shot mode
Use for:
- cron/background work
- short bounded tasks
- stateless transformations
- low-value continuity cases

## Resumable mode
Use for:
- operator chat flows
- iterative code tasks
- proposal refinement loops
- tasks where accumulated context is part of the value

### Selection rule
Default to:
- **one-shot** for autonomous/background jobs
- **resumable** for operator-facing and sessionful work

This matches Trajan's “2B & C” answer best.

---

## Testing Strategy

## Unit tests
- provider selection
- runner arg construction
- auth/error classification
- session metadata parsing
- resume fallback behavior

## Integration tests
- EMA dispatch path → Claude adapter → runner → normalized result
- session persistence across two linked invocations
- stale resume → fallback to fresh session

## Manual validations
1. trigger a simple one-shot proposal run via `provider=claude-code`
2. verify execution completion in EMA APIs/DB
3. trigger a second run on same thread with resume enabled
4. verify stored `claude_session_id` is reused
5. force an auth failure and verify error classification is operator-readable

---

## File/Module Targets (Probable)

### Backend/runtime
- `daemon/lib/ema/claude/adapters/claude_code.ex`
- `daemon/lib/ema/claude/claude_code_runner.ex`
- `daemon/lib/ema/claude/session_manager.ex`
- `daemon/lib/ema/claude/smart_router.ex`
- provider/registry modules

### Schema/API
- execution/session schema files
- migrations for Claude session metadata
- control-plane command/API handlers
- serializers/views for execution provider metadata

### Frontend (later)
- execution detail views
- provider selector UI
- runtime badges / status components

### Docs
- `docs/ARCHITECTURE.md`
- `docs/AGENT-CONTRACT.md`
- `docs/INTEGRATION_GUIDE.md`
- a new `docs/CLAUDE_CODE_INTEGRATION.md` once implemented

---

## Risks & Gotchas

### 1. Auth instability
Claude CLI on host is currently showing expired OAuth behavior in recent runs.

**Mitigation:** build health/error classification early; do not treat auth failures as generic runtime crashes.

### 2. Session ID extraction ambiguity
Depending on CLI output mode, session ID capture may be brittle.

**Mitigation:** standardize on one invocation/output mode and parse only one supported shape.

### 3. Channel/provider confusion
If interactive chat exposure is added too early, the design can blur whether Claude Code is a provider or a whole separate system.

**Mitigation:** keep provider/runtime layer canonical first.

### 4. Shadow state leakage
It is easy to accidentally store meaningful execution/session truth only in local Claude artifacts.

**Mitigation:** always write canonical state back into EMA DB/API flows.

### 5. Resume semantics mismatch
Not every execution should resume just because a prior session exists.

**Mitigation:** add explicit resume eligibility rules, not just “session exists therefore resume.”

### 6. Realtime docs exceed implementation
EMA docs describe a broader realtime surface than current daemon code actually exposes.

**Mitigation:** keep v1 backend-driven; don’t over-promise live UI features until the daemon supports them.

---

## Rollback Plan

If the Claude Code integration proves unstable:
- disable `claude-code` provider via config
- keep adapter module isolated so routing can bypass it
- retain schema additions as inert metadata if necessary
- fall back to existing `ema-dispatch` / current providers

Because EMA remains canonical, rollback is mostly about disabling provider selection, not undoing the whole execution model.

---

## Final Recommendation

Start with **backend truth and resumable execution**, not UX flair.

### Best first implementation slice
Given Trajan's priorities, the best near-term delivery is:
1. architecture + adapter skeleton
2. real backend integration
3. end-to-end Claude session persistence/resume

That gives the highest-value path with the least architectural regret.

Only after that should Claude Code become a visible selectable channel/surface inside EMA.
