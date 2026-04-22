# Stream-of-Thought Channel System Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build an independent multi-chain stream-of-thought orchestrator inside this new environment first, where multiple concurrent chains run in bounded cadence ranges, remain aware of each other, render visible work into the current `#babysitter-live` surface, and expose explicit `START` / `STOP` controls for autonomous chain elements.

**Architecture:** Treat the first version as a self-contained orchestrator/runtime inside the current babysitter environment rather than as a hard EMA control-plane dependency. Reuse the existing babysitter governor primitives (`StreamChannels`, `StreamTicker`, `TickRouter`, `ChannelPolicy`) but introduce a chain scheduler and control contract that can stand alone now and later bridge upward into wider orchestrator awareness of machines, models, harnesses, agents, and future EMA control-plane state. `#babysitter-live` remains the operator rollup and control lane, while lower lanes carry raw intent/thought/pipeline/execution signals and autonomous chains self-schedule within bounded ranges.

**Tech Stack:** Elixir/Phoenix runtime in the current babysitter environment, existing PubSub/socket stack, Discord rendering bridge, additive HTTP/control endpoints, existing stream manager and session monitor.

---

## Current grounding

**Current live location:**
- Discord channel: `#babysitter-live`
- Expected category per current docs: `🧵 STREAM`
- Current thread: `can we research all previous stream of thought, babysitter and orchestrator c...`

**Existing EMA primitives already on disk:**
- `daemon/lib/ema/babysitter/stream_channels.ex`
- `daemon/lib/ema/babysitter/stream_ticker.ex`
- `daemon/lib/ema/babysitter/tick_router.ex`
- `daemon/lib/ema/babysitter/channel_policy.ex`
- `daemon/lib/ema/babysitter/takeover_manager.ex`
- `daemon/lib/ema/sessions/monitor.ex`
- `daemon/lib/ema/stream/manager.ex`
- `daemon/lib/ema_web/controllers/babysitter_controller.ex`
- `daemon/lib/ema_web/channels/babysitter_channel.ex`
- `docs/REALTIME_SURFACE.md`
- `wiki/.../Babysitter Surface Governor Execution Plan.md`
- `wiki/.../Discord-Channel-Directory.md`

**Key design decisions from prior work to preserve:**
- Semantic lanes define meaning.
- Cadence buckets define speed bounds.
- Emission policy is not semantic identity.
- `#babysitter-live` is operator rollup only, not raw rambling.
- Adaptive cadence must remain bounded and pressure-aware.
- The first version should be independent in this environment, with a clean later bridge into broader EMA/multi-machine orchestration.

**New ideas from this request to incorporate:**
- multiple chain elements active at once
- per-chain self-set next wake time
- chain awareness of other active chains
- visible work in current channel
- explicit autonomous `START` / `STOP` controls
- orchestration behavior exposed in operator-facing form

---

## Scope and non-goals

### In scope
- Independent-first runtime in this environment
- Multi-range cadence model (`5-30s`, `5-30m`, `30-90m`, etc.)
- Multiple concurrent autonomous chains
- Cross-chain awareness and suppression/escalation rules
- Explicit operator controls to start/stop chains
- `#babysitter-live` as visible operator surface and control lane
- Honest realtime docs and API contracts for what is actually implemented
- A future bridge path toward broader orchestrator awareness of machines, models, harnesses, agents, and EMA

### Out of scope for first pass
- Hard dependency on full EMA control-plane authority
- Full multi-machine orchestration implementation
- Full model/harness inventory for every connected future system
- Full new Discord category/channel creation automation
- Rebuilding all non-babysitter Phoenix topic families
- Replacing the existing Discord bridge stack
- Freeform always-on raw self-talk lane

---

## Target model

### Semantic lanes
Keep and formalize these lanes:
- `operator_rollup` → `#babysitter-live`
- `intent` → `#intent-stream`
- `pipeline` → `#pipeline-flow`
- `thoughts` → `#agent-thoughts`
- `execution` → `#execution-log`
- `memory` → `#memory-writes`
- `intelligence` → `#intelligence-layer`
- `alerts` → `#alerts`

### Cadence buckets
Replace the current narrow cadence vocabulary with longer-lived buckets:
- `ultrafast` → `5s-30s`
- `fast` → `30s-5m`
- `medium` → `5m-30m`
- `slow` → `30m-90m`
- `trend` → `90m-6h`
- `archive` → `6h+`

### Chain instance model
Introduce a first-class autonomous chain record:
- `chain_id`
- `stream`
- `lane`
- `cadence_bucket`
- `status` (`running`, `paused`, `stopped`, `error`)
- `autonomous_enabled`
- `requested_next_tick_at`
- `next_tick_at`
- `last_tick_at`
- `last_event_at`
- `parent_chain_id`
- `related_chain_ids`
- `activity_score`
- `token_pressure`
- `priority`
- `visibility_mode`
- `last_summary`
- `last_control_command`

### Control contract
Introduce operator-visible control actions:
- `START <chain-or-profile>`
- `STOP <chain-or-profile>`
- `PAUSE <chain-or-profile>`
- `RESUME <chain-or-profile>`
- `STATUS`
- `LIST CHAINS`
- `SET RANGE <chain> <bucket-or-ms-range>`

For v1, `START` and `STOP` are mandatory; others are nice-to-have if nearly free.

---

## Sprint 1: Lock the independent orchestrator contract
**Goal:** Freeze the data model and control semantics for a self-contained orchestrator in this environment before touching runtime behavior.

**Demo/Validation:**
- A spec exists describing chain records, bucket ranges, and control commands.
- Existing babysitter semantics are preserved in writing.
- A reviewer can answer: what is a stream, what is a lane, what is a chain, what does `START` do, what does `STOP` do?

### Task 1.1: Write stream/chain vocabulary spec
- **Location:** Create `docs/STREAM_OF_THOUGHT_CONTROL_SPEC.md`
- **Description:** Define stream vs lane vs chain vs emission tier vs cadence bucket.
- **Dependencies:** none
- **Acceptance Criteria:**
  - Distinguishes meaning, timing, and delivery.
  - States clearly that `#babysitter-live` is operator rollup only.
  - Includes the new cadence buckets and status lifecycle.
- **Validation:** Manual read-through against `docs/REALTIME_SURFACE.md` and existing babysitter docs.

### Task 1.2: Define chain state schema
- **Location:** `docs/STREAM_OF_THOUGHT_CONTROL_SPEC.md`, later mirrored into code structs/types
- **Description:** Specify the chain instance fields and state transitions.
- **Dependencies:** Task 1.1
- **Acceptance Criteria:**
  - Includes `running/paused/stopped/error`.
  - Includes per-chain requested next tick.
  - Includes related-chain awareness fields.
- **Validation:** Schema review with example records.

### Task 1.3: Define START / STOP command semantics
- **Location:** `docs/STREAM_OF_THOUGHT_CONTROL_SPEC.md`
- **Description:** Specify what `START` and `STOP` do at orchestrator, scheduler, and surface layers in this environment.
- **Dependencies:** Task 1.2
- **Acceptance Criteria:**
  - `START` can target a chain profile or explicit chain.
  - `STOP` is idempotent.
  - Commands specify visible acknowledgement rules in `#babysitter-live`.
- **Validation:** Write example command/result transcripts.

### Task 1.4: Define safety guardrails for autonomy
- **Location:** `docs/STREAM_OF_THOUGHT_CONTROL_SPEC.md`
- **Description:** Specify quieting, anti-spam, escalation, and pressure rules.
- **Dependencies:** Tasks 1.1-1.3
- **Acceptance Criteria:**
  - No raw chatter floods `#babysitter-live`.
  - Low-value chains quiet under pressure.
  - Urgent items can escalate into alerts/operator rollup.
- **Validation:** Review against current `ChannelPolicy` / `TickRouter` behavior.

---

## Sprint 2: Add first-class chain scheduler state
**Goal:** Introduce persistent runtime state for autonomous chain instances without breaking existing babysitter streams.

**Demo/Validation:**
- EMA can report a list of chain instances with statuses and next tick times.
- No Discord/UI changes are required to inspect raw state.
- Existing babysitter snapshots still work.

### Task 2.1: Add chain scheduler module skeleton
- **Location:** Create `daemon/lib/ema/babysitter/chain_scheduler.ex`
- **Description:** Add a GenServer owning autonomous chain registry, state transitions, and next-tick bookkeeping.
- **Dependencies:** Sprint 1 complete
- **Acceptance Criteria:**
  - Starts cleanly under supervision.
  - Holds chain state in memory.
  - Exposes `snapshot/0`, `start_chain/1`, `stop_chain/1`.
- **Validation:** Add unit tests for empty snapshot and start/stop lifecycle.

### Task 2.2: Supervise the scheduler
- **Location:** `daemon/lib/ema/application.ex` and/or babysitter supervisor tree
- **Description:** Register the new scheduler under the existing babysitter/runtime supervision graph.
- **Dependencies:** Task 2.1
- **Acceptance Criteria:**
  - Scheduler starts before control endpoints use it.
  - Restart behavior is defined.
- **Validation:** Boot daemon tests or supervisor tests.

### Task 2.3: Define chain profiles and defaults
- **Location:** `daemon/lib/ema/babysitter/stream_channels.ex` or new adjacent profile module
- **Description:** Add named chain profiles for visible surfaces and internal autonomous chains.
- **Dependencies:** Task 2.1
- **Acceptance Criteria:**
  - Profiles map to lanes and cadence buckets.
  - Current babysitter streams remain backward-compatible.
  - Profile names are operator-readable.
- **Validation:** Unit tests for profile lookup and normalization.

### Task 2.4: Expose scheduler snapshot in HTTP
- **Location:** `daemon/lib/ema_web/controllers/babysitter_controller.ex`, `daemon/lib/ema_web/router.ex`
- **Description:** Add read-only chain listing/status endpoint(s) under babysitter API.
- **Dependencies:** Tasks 2.1-2.3
- **Acceptance Criteria:**
  - Operator can inspect chain status over HTTP.
  - Response includes `status`, `lane`, `bucket`, `next_tick_at`, `autonomous_enabled`.
- **Validation:** Controller test with sample chain states.

---

## Sprint 3: Upgrade cadence model to range-based chain scheduling
**Goal:** Replace narrow per-stream interval thinking with bounded multi-range scheduling driven by both runtime signals and explicit chain hints.

**Demo/Validation:**
- A chain can run in `ultrafast`, `medium`, or `slow` buckets.
- A chain can request its own next wake time.
- Scheduler clamps requests into allowed bounds.

### Task 3.1: Expand cadence bucket registry
- **Location:** `daemon/lib/ema/babysitter/stream_channels.ex`
- **Description:** Replace or extend current bucket registry with the new multi-range cadence buckets.
- **Dependencies:** Sprint 2 complete
- **Acceptance Criteria:**
  - Buckets include `ultrafast`, `fast`, `medium`, `slow`, `trend`, `archive`.
  - Bounds are explicit and testable.
  - Existing stream mappings still normalize cleanly.
- **Validation:** Unit tests for bucket metadata and bounds.

### Task 3.2: Add chain-driven next-tick hints
- **Location:** `daemon/lib/ema/babysitter/chain_scheduler.ex`, `daemon/lib/ema/babysitter/stream_ticker.ex`
- **Description:** Support `next_tick_hint_ms` / `requested_next_tick_at` from prior chain outputs.
- **Dependencies:** Task 3.1
- **Acceptance Criteria:**
  - Hints are stored.
  - Hints are clamped to bucket bounds.
  - Invalid hints do not crash scheduling.
- **Validation:** Unit tests for hint acceptance, clamp, and fallback.

### Task 3.3: Refactor StreamTicker to consult scheduler state
- **Location:** `daemon/lib/ema/babysitter/stream_ticker.ex`
- **Description:** Make ticker interval decisions scheduler-aware instead of only stream-local.
- **Dependencies:** Task 3.2
- **Acceptance Criteria:**
  - Current activity/idleness/token-pressure logic still contributes.
  - Scheduler state can override next wake time within bounds.
  - Stream snapshots expose both computed and requested timing.
- **Validation:** Tests for interval decisions under activity-only, hint-only, and mixed cases.

### Task 3.4: Document new realtime truth
- **Location:** `docs/REALTIME_SURFACE.md`
- **Description:** Update docs to reflect the new implemented chain model honestly.
- **Dependencies:** Tasks 3.1-3.3
- **Acceptance Criteria:**
  - Distinguishes current implemented behavior from future work.
  - Explains chain scheduler + babysitter relationship.
- **Validation:** Manual doc review against code.

---

## Sprint 4: Add cross-chain awareness and anti-spam orchestration
**Goal:** Make concurrently running chains aware of one another so the system behaves like one organism instead of many independent tickers.

**Demo/Validation:**
- Two or more chains can run simultaneously.
- Duplicate or overlapping outputs are suppressed/coalesced.
- Higher-priority or more urgent outputs win visibility.

### Task 4.1: Add related-chain registry / grouping keys
- **Location:** `daemon/lib/ema/babysitter/chain_scheduler.ex`
- **Description:** Track parent/related chains and shared topics/work units.
- **Dependencies:** Sprint 3 complete
- **Acceptance Criteria:**
  - Chains can reference siblings/upstream/downstream chains.
  - State is queryable in snapshots.
- **Validation:** Unit tests for relation tracking.

### Task 4.2: Extend routing with chain-level coordination
- **Location:** `daemon/lib/ema/babysitter/tick_router.ex`
- **Description:** Incorporate chain metadata into dedupe, route escalation, and coalescing rules.
- **Dependencies:** Task 4.1
- **Acceptance Criteria:**
  - Duplicate summaries across sibling chains can be suppressed.
  - Related events can coalesce into one operator-facing delta.
  - Urgent chain output can still bypass suppression.
- **Validation:** Tests for duplicate sibling events, coalesced rollups, urgent bypass.

### Task 4.3: Add global pressure and fairness rules
- **Location:** `daemon/lib/ema/babysitter/channel_policy.ex`, `daemon/lib/ema/babysitter/chain_scheduler.ex`
- **Description:** Prevent synchronized spam and starvation by adding global emission pressure and fairness logic.
- **Dependencies:** Task 4.2
- **Acceptance Criteria:**
  - Under pressure, low-value chains quiet first.
  - One noisy chain cannot starve all others forever.
  - Operator rollup remains legible.
- **Validation:** Simulation tests or deterministic scheduler tests.

### Task 4.4: Expose cross-chain debug state
- **Location:** `daemon/lib/ema/babysitter/stream_ticker.ex`, babysitter snapshot endpoints
- **Description:** Add visibility into why a chain was promoted, suppressed, delayed, or coalesced.
- **Dependencies:** Tasks 4.1-4.3
- **Acceptance Criteria:**
  - Snapshots include suppression reason and related-chain context.
  - Operator can inspect why a visible update did or did not happen.
- **Validation:** Snapshot tests.

---

## Sprint 5: Make `#babysitter-live` the visible operator lane with START/STOP controls
**Goal:** The current channel becomes the real visible work/orchestrator surface for autonomous stream-of-thought elements.

**Demo/Validation:**
- Operator can start and stop autonomous chain elements from the babysitter control surface.
- Visible acknowledgements post into `#babysitter-live`.
- Work remains visible without turning the lane into noise.

### Task 5.1: Add control endpoints for START / STOP
- **Location:** `daemon/lib/ema_web/controllers/babysitter_controller.ex`, `daemon/lib/ema_web/router.ex`
- **Description:** Add concrete HTTP control actions to start and stop chain instances.
- **Dependencies:** Sprint 4 complete
- **Acceptance Criteria:**
  - `POST /api/babysitter/chains/:id/start`
  - `POST /api/babysitter/chains/:id/stop`
  - or equivalent routes with profile-aware creation
  - Routes return updated chain state.
- **Validation:** Controller tests for start/stop lifecycle.

### Task 5.2: Add visible control acknowledgements
- **Location:** `daemon/lib/ema/stream/manager.ex` and/or Discord bridge rendering path
- **Description:** Emit explicit operator-facing messages when autonomous chains are started/stopped.
- **Dependencies:** Task 5.1
- **Acceptance Criteria:**
  - Starting a chain posts a concise ack.
  - Stopping a chain posts a concise ack.
  - Acks include chain name, lane, range, and next state.
- **Validation:** Rendering tests or bridge-level verification.

### Task 5.3: Route visible work into operator rollup without leaking raw chatter
- **Location:** `daemon/lib/ema/stream/manager.ex`
- **Description:** Update producer alignment so visible work in `#babysitter-live` is synthesized progress, not raw thought spam.
- **Dependencies:** Task 5.2
- **Acceptance Criteria:**
  - `#babysitter-live` shows started/stopped/running/blocked/high-signal deltas.
  - Raw chain artifacts stay in semantic source lanes.
- **Validation:** Compare sample output against `Discord-Channel-Directory.md` rules.

### Task 5.4: Add current-channel status summary command/path
- **Location:** babysitter control API plus Discord render path
- **Description:** Provide a concise summary of all currently running autonomous chains for the current operator lane.
- **Dependencies:** Tasks 5.1-5.3
- **Acceptance Criteria:**
  - Summary includes active chains, next wake windows, paused/stopped counts, and notable pressure.
  - Output is short enough for Discord.
- **Validation:** Manual smoke test with multiple running chains.

---

## Sprint 6: End-to-end verification in the current channel model
**Goal:** Prove the system works in the actual `#babysitter-live` workflow, not just in structs and docs.

**Demo/Validation:**
- A chain is started.
- It emits visible progress over time.
- It self-requests a later wake time.
- Another chain runs concurrently.
- Operator can stop one or all chains cleanly.

### Task 6.1: Add scheduler and controller tests
- **Location:**
  - Create `daemon/test/ema/babysitter/chain_scheduler_test.exs`
  - Extend existing babysitter controller/ticker tests
- **Description:** Cover lifecycle, hinting, suppression, and control commands.
- **Dependencies:** Sprint 5 complete
- **Acceptance Criteria:**
  - Tests cover start/stop, self-scheduling, bucket clamp, duplicate suppression.
- **Validation:** Run targeted Elixir test suite.

### Task 6.2: Add deterministic simulation fixtures
- **Location:** create fixtures/helpers under `daemon/test/support/`
- **Description:** Build repeatable chain-event scenarios for multi-chain cadence verification.
- **Dependencies:** Task 6.1
- **Acceptance Criteria:**
  - Simulates two or more chains with overlapping topics and different urgency.
  - Reproduces coalescing/suppression behavior.
- **Validation:** Test outputs stay stable across runs.

### Task 6.3: Write operator runbook
- **Location:** Create `docs/STREAM_OF_THOUGHT_OPERATOR_RUNBOOK.md`
- **Description:** Document how to start/stop chains, inspect status, and interpret visible outputs.
- **Dependencies:** Task 6.2
- **Acceptance Criteria:**
  - Includes `START` / `STOP` usage.
  - Includes “what should appear in `#babysitter-live`” examples.
  - Includes failure modes and recovery steps.
- **Validation:** Manual read-through by someone not involved in implementation.

### Task 6.4: Honest post-implementation docs sync
- **Location:**
  - `docs/REALTIME_SURFACE.md`
  - relevant wiki docs if desired in a follow-up pass
- **Description:** Bring docs in line with actual implementation, not aspirations.
- **Dependencies:** Task 6.3
- **Acceptance Criteria:**
  - No unreleased topic families are claimed.
  - Implemented control surface is accurately described.
- **Validation:** Code/doc cross-check.

---

## Testing strategy

### Unit tests
- bucket metadata and clamp behavior
- chain scheduler lifecycle
- start/stop idempotency
- next-tick hint normalization
- cross-chain dedupe/coalesce rules

### Integration tests
- babysitter controller endpoints
- scheduler + ticker interaction
- PubSub emission behavior
- visible operator acknowledgement generation

### Manual verification
1. Start EMA daemon.
2. Inspect `/api/babysitter` and new chain endpoints.
3. Start one medium-range chain.
4. Confirm visible acknowledgement in `#babysitter-live`.
5. Start a second overlapping chain.
6. Confirm coalescing/suppression logic keeps operator lane readable.
7. Stop one chain.
8. Stop all remaining chains.

### Suggested commands
- `cd /home/trajan/Projects/ema/daemon && mix test test/ema/babysitter`
- `cd /home/trajan/Projects/ema/daemon && mix test test/ema_web/controllers/babysitter_controller_test.exs`
- `cd /home/trajan/Projects/ema/daemon && mix phx.server`

---

## Potential risks & gotchas

- **Biggest architectural risk:** confusing semantic lanes with cadence buckets again.
  - **Mitigation:** keep lane, bucket, tier, and chain as separate concepts in both docs and structs.

- **Surface risk:** `#babysitter-live` becomes noisy and unreadable.
  - **Mitigation:** operator rollup only; raw artifacts stay in source lanes.

- **Runtime risk:** many chains create synchronized wake storms.
  - **Mitigation:** scheduler fairness and global pressure rules.

- **Compatibility risk:** existing stream snapshot/API consumers break.
  - **Mitigation:** additive endpoints first; preserve current babysitter routes and fields where possible.

- **Reality risk:** docs drift ahead of implementation again.
  - **Mitigation:** update `docs/REALTIME_SURFACE.md` in the same sprint as feature completion.

- **Legacy interface risk:** Discord/OpenClaw surface config may not support richer per-channel streaming flags.
  - **Mitigation:** store autonomy/cadence semantics in EMA control-plane state, not surface config enums.

---

## Rollback plan

1. Keep current babysitter routes and base stream snapshots intact.
2. Gate new chain scheduler behavior behind additive APIs and profile flags.
3. If chain scheduler destabilizes runtime, disable autonomous chain startup while preserving read-only snapshots.
4. Revert scheduler supervision and control routes without removing baseline ticker behavior.

---

## Recommended implementation order summary

1. Lock the independent orchestrator spec and command semantics.
2. Add `ChainScheduler` as additive runtime state in this environment.
3. Expand cadence buckets and chain-driven next tick hints.
4. Add cross-chain awareness and global suppression.
5. Expose `START` / `STOP` controls and operator-facing acknowledgements in `#babysitter-live`.
6. Verify end-to-end and update truth docs.
7. Only after the independent system is stable, design the bridge toward wider machine/model/harness/EMA awareness.
