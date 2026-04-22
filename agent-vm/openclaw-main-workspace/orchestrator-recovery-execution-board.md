# Orchestrator Recovery Execution Board

**Generated**: 2026-04-06 UTC
**Status**: Active recovery
**Intent**: Convert recovered work + rehydrated priorities into an executable, parallelized delivery program.

## North Star

Restore trustworthy orchestration by fixing the dependency chain in order:

1. incident truth
2. host truth
3. execution truth
4. delegation truth
5. memory truth
6. integration truth

## Program Rules

- Prefer real substrate over UI theater.
- Parallelize only where merge cost stays low.
- Every workstream must produce artifacts, not just opinions.
- Use explicit stop/go gates before widening scope.
- Favor thin vertical slices that become demoable and testable quickly.

---

## Phase 0 — Incident Stabilization

**Goal**: Stop flying blind on EMA proxy / Anthropic timeout degradation.

### Deliverables
- Incident status doc with architecture sketch, symptoms, mitigations, owners, checkpoint times.
- Timeout taxonomy:
  - queue timeout
  - connect timeout
  - upstream read timeout
  - total deadline exceeded
  - client cancel
- Raw and segmented dashboards:
  - 1m and 5m windows
  - model
  - streaming vs non-streaming
  - route / tenant / priority class
  - proxy instance / host / region
- Capacity visibility:
  - in-flight
  - queued
  - queue wait
  - connection pool pressure
  - retry rate
- Stabilization runbook and stop/go criteria.

### Stop / Go Gates
**Do not declare stabilized if:**
- timeout rate >2x baseline for 15m+
- p99 still climbing/oscillating
- queue wait >20–25% of total time
- retries still elevated
- recovery only appears in EMA-smoothed views

**Can move out of mitigation when for 30m:**
- raw 1m and 5m timeout rates near baseline
- p95/p99 stable or improving
- queue depth stable
- retry rate near baseline
- segmented views healthy
- improvement is explainable

### Atomic Tasks
- [ ] P0.1 Create `incident-ema-timeout-status.md`
- [ ] P0.2 Define timeout/error taxonomy schema
- [ ] P0.3 Define dashboard metric contract
- [ ] P0.4 Define queue/concurrency instrumentation contract
- [ ] P0.5 Write stabilization stop/go checklist

---

## Phase 1 — Control-Plane Hardening

**Goal**: Make host-truth trustworthy for operators and automation.

### Architecture
Shared normalized truth core with two separate consumers:
- **D1** operator-facing status projection
- **D2** transition eventing / automation stream

### Core Types
- `RawProbeSample`
- `NormalizedHostTruth`
- `HealthTransitionEvent`

### Required Semantics
- States: `healthy | degraded | unhealthy | unknown`
- `maintenance` and `silenced` are overlays, not truth states
- EMA smoothing for display and event qualification
- Hysteresis for entry/exit thresholds
- Confidence and staleness surfaced explicitly
- No data must never look healthy

### Deliverables
- Normalized health reducer
- Explicit state machine
- D1 endpoint: `/api/operator/host-status`
- D2 transition evaluator + outbox publisher
- Reason codes + anomaly model
- Staleness handling and TTL rules

### Atomic Tasks
- [ ] P1.1 Draft normalized host-truth domain model
- [ ] P1.2 Define reducer inputs, weights, and reason codes
- [ ] P1.3 Define state machine + hysteresis thresholds
- [ ] P1.4 Define D1 response schema
- [ ] P1.5 Define D2 event schema + dedup rules
- [ ] P1.6 Define stale-data semantics
- [ ] P1.7 Define minimum test matrix

---

## Phase 2 — Execution Substrate / HQ Reality

**Goal**: Make execution observability real instead of theatrical.

### Deliverables
- Reliable execution record/status contract
- Outcome tracking reliability
- Completion callback semantics
- Worktree/result-path contract
- Pubsub/websocket event flow
- HQ websocket wiring
- Live execution stream
- Dispatch board backed by real execution events

### Critical Dependency
Without this phase, orchestrator UX is mostly decorative.

### Atomic Tasks
- [ ] P2.1 Define canonical execution state model
- [ ] P2.2 Define execution event contract
- [ ] P2.3 Define completion callback contract
- [ ] P2.4 Define worktree/result artifact contract
- [ ] P2.5 Define HQ truth-source / canonical store
- [ ] P2.6 Define live stream message schema
- [ ] P2.7 Define outcome-tracker durability expectations

---

## Phase 3 — Productive Multi-Agent Orchestration

**Goal**: Use many agents effectively without chaos.

### Orchestration Stack
1. Planner
2. Dispatcher
3. Specialists
4. Arbiter

### Core Primitives
- `plan`
- `spawn`
- `fanout`
- `map`
- `reduce`
- `verify`
- `arbitrate`
- `checkpoint`

### Budget Model
- Global task budget
- Phase budgets
- Per-agent caps
- Adaptive reallocation
- Reserved merge/verification budget

### Atomic Tasks
- [ ] P3.1 Define planner output schema
- [ ] P3.2 Define dispatcher routing policy
- [ ] P3.3 Define specialist output contract
- [ ] P3.4 Define arbiter merge modes
- [ ] P3.5 Define budget controls and kill/boost heuristics
- [ ] P3.6 Define checkpoint persistence format
- [ ] P3.7 Define verification and tie-break flow

---

## Phase 4 — Worker Contracts and Context Discipline

**Goal**: Make proposal → worker → result deterministic.

### Deliverables
- Project worker contract
- Context bundle schema
- Allowed-docs bundle rules
- Result / acceptance schema
- Project bootstrap expectations
- Example project template

### Atomic Tasks
- [ ] P4.1 Define worker contract doc
- [ ] P4.2 Define context bundle schema
- [ ] P4.3 Define result / acceptance schema
- [ ] P4.4 Define project bootstrap / ingester expectations
- [ ] P4.5 Draft example project template

---

## Phase 5 — Memory / Indexer / Second-Brain Convergence

**Goal**: One coherent knowledge substrate.

### Deliverables
- Canonical retrieval authority decision
- Canonical ingest/update path
- Daily and episodic memory indexing
- Second-brain bootstrap / ingester
- Brain-dump → project/task linkage

### Atomic Tasks
- [ ] P5.1 Decide canonical index / retrieval authority
- [ ] P5.2 Define ingest/update lifecycle
- [ ] P5.3 Define daily/episodic indexing rules
- [ ] P5.4 Define brain-dump linkage model
- [ ] P5.5 Define bootstrap / ingester scope

---

## Phase 6 — Integration Substrate

**Goal**: Build integrations as a platform, not feature islands.

### Deliverables
- Pipes action library
- Action schema
- Retry/error model
- Audit trail
- Approval gates
- Auth/account mapping

### Recommended Order
1. GitHub
2. Slack
3. Drive

### Atomic Tasks
- [ ] P6.1 Define pipe action schema
- [ ] P6.2 Define action runtime lifecycle
- [ ] P6.3 Define audit/retry/error semantics
- [ ] P6.4 Define approval gate model
- [ ] P6.5 Define GitHub action set v0
- [ ] P6.6 Define Slack action set v0
- [ ] P6.7 Defer Drive deep sync until substrate is proven

---

## Phase 7 — Runtime / Superman Consolidation

**Goal**: Remove architectural ambiguity from runtime assumptions.

### Decisions Required
- Canonical runtime
- Superman role: required / optional / best-effort
- Session continuity semantics
- Background service expectations in prod
- Old gateway assumptions to remove or rename
- Prod/dev boundary cleanup

### Atomic Tasks
- [ ] P7.1 Draft runtime boundary decision doc
- [ ] P7.2 Define Superman continuity role
- [ ] P7.3 Define session continuity import semantics
- [ ] P7.4 Define prod background service expectations
- [ ] P7.5 Identify deprecated runtime assumptions to remove

---

## Recommended Parallel Workstreams

### Lane A — Incident / Observability
**Suggested owners**: ops, quality-lead
- P0.1–P0.5

### Lane B — Control-Plane Truth
**Suggested owners**: architect, tech-lead
- P1.1–P1.7

### Lane C — HQ / Execution Substrate
**Suggested owners**: coder, tech-lead
- P2.1–P2.7

### Lane D — Orchestration Engine
**Suggested owners**: strategist, architect
- P3.1–P3.7

### Lane E — Worker/Context Contract
**Suggested owners**: pm, writer, coder
- P4.1–P4.5

### Lane F — Memory/Indexing Convergence
**Suggested owners**: researcher, architect
- P5.1–P5.5

### Lane G — Integration Substrate
**Suggested owners**: coder, ops
- P6.1–P6.7

### Lane H — Runtime Consolidation
**Suggested owners**: architect, tech-lead
- P7.1–P7.5

---

## Immediate Sprint: Start Here

### Sprint 1
- [ ] P0.1 Create incident status artifact
- [ ] P0.2 Define timeout taxonomy schema
- [ ] P1.1 Draft host-truth domain model
- [ ] P1.3 Define state machine + hysteresis thresholds
- [ ] P2.1 Define execution state model
- [ ] P2.2 Define execution event contract
- [ ] P4.1 Define worker contract doc
- [ ] P5.1 Decide canonical retrieval authority

### Sprint 2
- [ ] P1.4 Define D1 operator endpoint schema
- [ ] P1.5 Define D2 event schema + dedup rules
- [ ] P2.5 Define HQ truth-source / canonical store
- [ ] P2.6 Define live stream message schema
- [ ] P3.1 Define planner output schema
- [ ] P3.2 Define dispatcher routing policy
- [ ] P4.2 Define context bundle schema
- [ ] P5.2 Define ingest/update lifecycle

### Sprint 3
- [ ] P3.4 Define arbiter merge modes
- [ ] P3.5 Define budget controls
- [ ] P3.6 Define checkpoint persistence format
- [ ] P4.3 Define result / acceptance schema
- [ ] P5.4 Define brain-dump linkage model
- [ ] P6.1 Define pipe action schema
- [ ] P7.1 Draft runtime boundary decision doc

---

## Risks
- Treating EMA-smoothed health as equivalent to raw operational truth
- Building HQ UI ahead of execution substrate reliability
- Letting many agents create merge chaos instead of throughput
- Allowing multiple memory/index stores without authority decision
- Shipping integrations before the action substrate exists
- Carrying runtime ambiguity too far into later phases

## Definition of Progress
A phase counts as real progress only if it produces:
- durable docs/specs/contracts or code
- explicit schemas/interfaces
- testable acceptance criteria
- a clear next consumer for the artifact

## Definition of Done for Recovery Kickoff
Recovery kickoff is complete when the workspace contains:
- this execution board
- an incident status artifact
- host-truth domain spec
- execution event/state spec
- worker/context contract spec
- memory authority decision doc
