# Hermes ↔ EMA AI Engine Interface Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build an interface layer that lets EMA use Hermes as its AI engine backbone while preserving EMA as the control-plane authority for lineage, routing policy, sessions, and peer distribution.

**Architecture:** EMA remains the source of truth for execution records, routing intent, and operator state. Hermes becomes the execution substrate that runs providers, sessions, tools, and surfaces. A new interface layer normalizes provider capabilities, session continuity, event streaming, worktree management, and peer dispatch between them.

**Tech Stack:** Hermes Python runtime + gateway/API server, EMA backend contract(s), provider CLIs/APIs (Codex, Claude, direct API backends), optional peer/gateway messaging, structured JSON event envelopes.

---

## 0. Design constraints

1. **EMA owns truth, Hermes owns execution.**
2. **Surfaces do not own state.** Discord/web/CLI only mirror and control.
3. **Additive integration only.** Prefer adapter modules over invasive rewrites.
4. **One engine contract, many drivers.** Codex, Claude, API, simulated, CLI, and peer execution all implement the same interface.
5. **Session continuity is explicit.** Every run must be traceable to an EMA execution ID and optionally to a Hermes session/response ID.
6. **Peer dispatch is first-class.** The interface must support remote-capable execution, not bolt it on later.

---

## 1. Target architecture

```text
EMA Control Plane
  ├─ intents / proposals / executions / outcomes
  ├─ session bindings / peer topology / policy
  └─ engine requests
          │
          ▼
Hermes-EMA Interface Layer
  ├─ engine contract
  ├─ provider driver registry
  ├─ session orchestrator
  ├─ event normalizer
  ├─ worktree / host-placement policy
  ├─ peer dispatch adapter
  └─ EMA lineage bridge
          │
          ▼
Hermes Backbone
  ├─ native provider execution
  ├─ gateway/API server
  ├─ session continuity
  ├─ tool execution
  ├─ delegation/subagents
  └─ messaging surfaces
          │
          ▼
Provider/Runtime Drivers
  ├─ codex-oauth
  ├─ codex-cli
  ├─ anthropic-api
  ├─ claude-cli
  ├─ claude-code / ACP
  ├─ direct-openai-compatible
  ├─ simulated
  └─ peer-remote
```

---

## 2. Core data model to introduce

The interface layer needs stable records independent of any one provider.

### 2.1 EngineTarget
Represents how work should run.

Fields:
- `kind`: `local` | `peer` | `api` | `cli` | `simulated`
- `driver_id`: string (`codex-oauth`, `claude-cli`, `hermes-native`, etc.)
- `host_affinity`: `vm` | `host` | `any` | `peer:<id>`
- `worktree_mode`: `none` | `reuse` | `fork` | `fresh`
- `tool_policy`: `inherit` | `restricted` | `none`
- `auth_profile`: named credential/auth source
- `model_hint`: optional model selection hint

### 2.2 EngineRunRequest
Canonical unit sent from EMA into Hermes.

Fields:
- `execution_id`
- `intent_id` / `proposal_id` when present
- `session_binding_id`
- `target: EngineTarget`
- `prompt`
- `context_refs` (vault/docs/session refs, not giant blobs when possible)
- `cwd`
- `surface_origin`
- `continuation` (`new`, `resume`, `previous_response_id`, `session_id`)
- `metadata` (tags, priority, deadlines, operator labels)

### 2.3 EngineRunHandle
Returned immediately so EMA can track the run.

Fields:
- `engine_run_id`
- `driver_id`
- `hermes_session_id` optional
- `hermes_response_id` optional
- `peer_id` optional
- `status`
- `stream_channel`

### 2.4 EngineEvent
Provider-neutral lifecycle stream.

Required event types:
- `run.accepted`
- `run.started`
- `session.bound`
- `provider.selected`
- `tool.started`
- `tool.finished`
- `output.delta`
- `output.message`
- `approval.required`
- `run.blocked`
- `run.failed`
- `run.completed`
- `run.cancelled`
- `run.delegated`
- `peer.dispatched`
- `peer.result`

This should borrow ClaudeForge’s normalized event style rather than leaking provider-native events upward.

---

## 3. Driver model

Each backend should implement the same contract.

### Contract
Every driver must expose something equivalent to:
- `probe()` → installation/auth/health/capabilities
- `start_session(request)`
- `resume_session(binding)`
- `run(request)`
- `stream(handle)`
- `stop(handle)`
- `list_sessions()`
- `bind_worktree(request)`
- `serialize_binding()`

### First driver set
1. **`hermes-native`**
   - Uses Hermes provider config directly
   - Best for API-key or OAuth-backed direct model execution inside Hermes

2. **`codex-oauth`**
   - Uses Hermes/OpenAI Codex auth-backed route
   - Good default for current VM-visible Hermes setup

3. **`codex-cli`**
   - Uses local Codex CLI when session-style or CLI-native behavior is required
   - Suitable for host/TTY/worktree-heavy tasks

4. **`anthropic-api`**
   - Direct Anthropic API / Claude model route
   - Good for non-CLI API sessions

5. **`claude-cli`**
   - Uses local `claude` CLI session model
   - Needs session discovery/continuation bindings

6. **`claude-code-acp`**
   - Runs Claude Code as an ACP-capable coding runtime
   - Best for code-focused session orchestration and deeper host coding tasks

7. **`openai-compatible`**
   - Generic adapter for custom endpoints and optional API-key providers
   - Covers “direct integration” and future providers cleanly

8. **`simulated`**
   - Deterministic mock backend for interface testing
   - Critical for testing EMA orchestration without consuming real provider quota

9. **`peer-remote`**
   - Wraps another driver reachable through EMA peer dispatch
   - Used when execution should land on another peer/device

---

## 4. Session orchestration model

This is where most systems get messy, so keep it explicit.

### Session identity layers
Maintain separate IDs for:
- `ema_execution_id` — lineage/truth
- `ema_session_binding_id` — EMA’s canonical mapping
- `engine_run_id` — interface-layer transient run
- `hermes_session_id` or `response_id` — Hermes continuity
- `provider_native_session_id` — Claude/Codex/etc when available
- `surface_thread_id` / `channel_id` — Discord/UI references

### Rules
1. Never assume provider-native session IDs are enough for EMA truth.
2. Every provider session must be wrapped by an EMA session binding record.
3. Resume paths must support:
   - new run
   - resume by EMA binding
   - resume by Hermes response/session ID
   - resume by provider-native session ID if imported
4. Session binding must include:
   - provider/driver
   - cwd/worktree
   - machine/peer placement
   - auth mode
   - last-seen timestamps
   - surface bindings

### T3-style / code-fork behavior
For coding work, support worktree policies:
- `reuse current repo`
- `create branch in place`
- `create git worktree`
- `fork on host machine`
- `remote peer worktree`

The worktree decision should happen **before** the driver starts its session.

---

## 5. EMA ↔ Hermes boundary contract

The interface layer should be narrow.

### EMA → Hermes requests
EMA sends:
- desired target/driver constraints
- execution metadata
- prompt/context refs
- continuation policy
- worktree policy
- peer eligibility policy

### Hermes → EMA callbacks/events
Hermes returns:
- acceptance/rejection
- selected driver/provider
- session binding updates
- normalized lifecycle events
- final output summary
- structured tool/execution metadata
- failure classification

### Failure classes to preserve
Do not collapse all failures into one bucket.
At minimum preserve:
- `auth_failure`
- `provider_unavailable`
- `rate_limited`
- `tool_failure`
- `approval_blocked`
- `peer_unreachable`
- `session_corrupt`
- `worktree_setup_failed`
- `operator_cancelled`
- `unknown`

---

## 6. Peer-distributed execution

The EMA org network requirement means peer dispatch is not optional.

### Peer capabilities schema
A peer advertisement should include:
- available drivers
- available models/providers
- auth status per driver
- host capabilities (cpu/memory/gpu/network)
- supported toolsets
- local CLIs installed
- worktree/storage affordances
- policy scopes
- observed load / queue depth

### Dispatch policy
The interface layer should support:
- explicit peer targeting
- capability-based selection
- preferred-local fallback-remote ordering
- remote-only tasks
- fan-out / race between peers later, but not in v1

### Peer protocol
Minimum operations:
- `peer.probe`
- `peer.list_drivers`
- `peer.create_run`
- `peer.stream_run`
- `peer.cancel_run`
- `peer.list_sessions`
- `peer.resume_session`

Remote runs should still emit the same `EngineEvent` schema locally.

---

## 7. Implementation phases

### Phase 1: Context + contract stabilization
**Objective:** create the abstraction surfaces before touching provider code.

**Files:**
- Create: `docs/HERMES-EMA-CONTEXT-INTEGRATION-2026-04-20.md`
- Create: `docs/HERMES-EMA-AI-ENGINE-INTERFACE-PLAN.md`
- Create later in implementation repo: `shared/engine-contract.*` or equivalent contract module

**Step 1: Freeze the contract vocabulary**
Write the canonical terms: `EngineTarget`, `EngineRunRequest`, `EngineRunHandle`, `EngineEvent`, `SessionBinding`.

**Step 2: Decide implementation home**
Pick one of:
- EMA-side adapter calling Hermes APIs
- Hermes plugin/toolset exposing EMA-facing runtime APIs
- separate shared bridge package

**Recommendation:** start with an **EMA-side adapter that talks to Hermes via explicit API/CLI/session contracts**, because it keeps Hermes additive.

**Step 3: Define test fixtures**
Create JSON fixtures for:
- local Claude CLI run
- Codex OAuth run
- simulated run
- peer-remote run
- worktree/forked run

---

### Phase 2: Driver contract + simulated backend
**Objective:** build the abstraction before real providers.

**Files:**
- Create: `engine/drivers/base.*`
- Create: `engine/drivers/simulated.*`
- Create: `engine/events/normalize.*`
- Create: `tests/engine/simulated_*`

**Step 1: Write failing tests for driver contract**
Test that every driver supports:
- probe
- run
- stream events
- cancel
- resume metadata

**Step 2: Implement simulated driver**
Use deterministic event sequences to prove the orchestration model works without real providers.

**Step 3: Implement event normalizer**
Normalize all raw backend/provider events into `EngineEvent`.

**Step 4: Verify**
Run test suite proving the interface can execute end-to-end with no real provider installed.

---

### Phase 3: Hermes-native bridge
**Objective:** make Hermes the first real execution substrate.

**Files:**
- Create: `engine/drivers/hermes_native.*`
- Create: `engine/hermes/client.*`
- Create: `engine/hermes/session_binding.*`
- Test: `tests/engine/hermes_native_*`

**Step 1: Start with Hermes API server compatibility**
Exploit existing Hermes surfaces:
- `/v1/chat/completions`
- `/v1/responses`
- `X-Hermes-Session-Id`
- stored response continuity

**Step 2: Add binding translation**
Map EMA binding records to Hermes session/response continuity.

**Step 3: Add event bridge**
Translate Hermes streaming / run lifecycle into `EngineEvent`.

**Step 4: Add failure classification**
Map Hermes/provider failures into stable EMA-visible error types.

---

### Phase 4: CLI/session drivers
**Objective:** support host-native coding sessions and T3-style code forks.

**Files:**
- Create: `engine/drivers/claude_cli.*`
- Create: `engine/drivers/codex_cli.*`
- Create: `engine/drivers/claude_code_acp.*`
- Create: `engine/worktrees/*`
- Test: `tests/engine/cli_*`

**Step 1: Driver probes**
Each driver reports:
- binary presence
- auth state
- session-store availability
- supported continuation modes
- worktree support

**Step 2: Worktree manager**
Implement explicit policies:
- current repo reuse
- branch-in-place
- git worktree
- host fork
- peer fork

**Step 3: Session import/resume**
Support importing pre-existing Claude/Codex sessions into EMA bindings when possible.

**Step 4: Verify**
Run end-to-end on a disposable repo/worktree.

---

### Phase 5: Peer-dispatch driver
**Objective:** distribute execution across EMA peers.

**Files:**
- Create: `engine/peers/*`
- Create: `engine/drivers/peer_remote.*`
- Test: `tests/engine/peer_*`

**Step 1: Define peer capability document**
Machine-readable capability advertisement.

**Step 2: Implement peer routing rules**
Support local-first, remote-required, and explicit peer targeting.

**Step 3: Stream remote results locally**
Remote outputs should appear as standard local `EngineEvent`s.

**Step 4: Failure handling**
Handle peer disconnects, stale capabilities, and fallback rules.

---

### Phase 6: Surface bindings
**Objective:** bind Discord/web/CLI/place.org-like surfaces without giving them truth ownership.

**Files:**
- Create: `surface_bindings/*`
- Test: `tests/surfaces/*`

**Step 1: Session-to-surface mapping**
Map EMA session bindings to channels/threads/views.

**Step 2: Read/write mediation**
Messages become engine requests; engine events become mirrored surface output.

**Step 3: Ensure surfaces stay stateless**
If a surface disappears, session truth must still live in EMA bindings + Hermes continuity.

---

## 8. Suggested file ownership

If implementing in EMA first:
- EMA owns the interface contract, lineage bridge, worktree policy, and peer policy
- Hermes is consumed through its API/session/runtime surfaces

If implementing in Hermes first:
- Hermes should expose a narrow EMA plugin or API extension
- avoid baking EMA-specific orchestration assumptions into Hermes core prompt/runtime code

**My recommendation:** start in EMA with a thin Hermes client/adapter, because it preserves the additive-only integration rule and avoids turning Hermes into an EMA-specific fork too early.

---

## 9. Verification checklist

A build is only “real” when these work:

1. Start a simulated run and receive normalized lifecycle events.
2. Start a Hermes-native run and preserve continuation across at least two turns.
3. Start a Codex-backed run using current local auth.
4. Start a Claude-backed session when local auth exists.
5. Launch a coding task with worktree/fork policy applied.
6. Resume the same session from a different surface without losing continuity.
7. Dispatch a run to a peer and receive mirrored results back into the same event schema.
8. Record the whole run against an EMA execution record without surfaces becoming the source of truth.

---

## 10. Immediate next implementation slice

Do this first, in order:
1. Freeze the engine contract types.
2. Build the simulated driver.
3. Build the Hermes-native driver using `/v1/responses` + `X-Hermes-Session-Id` semantics.
4. Add EMA session-binding persistence.
5. Add one CLI driver (`codex-cli` or `claude-cli`) to validate worktree/session orchestration.
6. Only then add peer-remote dispatch.

That path gets you a working backbone fast without locking the architecture too early.
