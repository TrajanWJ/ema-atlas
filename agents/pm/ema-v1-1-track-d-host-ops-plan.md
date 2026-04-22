# Plan: EMA v1.1 Track D Host-Ops

**Generated**: 2026-04-13 UTC  
**Estimated Complexity**: High
**Program Intent**: Deliver a visibly better operator experience in OpenClaw/Discord quickly, while keeping host EMA as the execution authority and preventing the governor/babysitter layer from regaining hidden orchestration state.

## Overview

Track D is the operator-facing bridge between OpenClaw and host EMA. Its job is not to own orchestration; its job is to make host EMA capabilities callable, understandable, governable, and resilient from chat/runtime surfaces.

The fastest safe path is:
1. Ship one thin, excellent end-to-end operator flow
2. Add policy/governor behavior without re-centralizing state
3. Standardize operator UX for progress, approvals, and failures
4. Preserve legacy entry points through compatibility shims
5. Add degraded-mode behavior that queues intent without becoming a shadow source of truth

This plan separates:
- **MVP / must-have**: enough to make operators prefer the new path for real work
- **Follow-on**: scale-out, richer UX, automation, and ambitious enhancements
- **Stretch**: differentiated operator experiences that are valuable but not required for cutover

## Product Principles

- **Host EMA executes; OpenClaw presents.**
- **Operator trust comes from clarity, not cleverness.** Every action should show status, ownership, and linked artifacts.
- **No hidden state in governor.** Policy may decide, approve, block, escalate, and annotate — never become workflow brain.
- **Degraded mode means queue/reconcile, not alternate truth.**
- **Chat UX stays concise; drill-down carries depth.**
- **Ship visible value by workflow, not by plumbing completeness.**

## Scope

### In Scope
- MCP-backed invocation from OpenClaw into host EMA
- Operator-safe summaries, progress, approval, failure, and completion patterns
- Governor/policy layer for risk-tiering and approvals
- Legacy compatibility shims
- Degraded-mode bridge behavior
- Observability hooks needed for operator trust

### Out of Scope
- Rebuilding orchestration state in OpenClaw
- Full parity for every host EMA capability before first production use
- Rich client-specific custom behavior baked into MCP contract
- Long-lived offline OpenClaw execution autonomy

## Program Outcomes

By Track D completion, operators should be able to:
- Trigger approved host EMA workflows from OpenClaw/Discord
- Understand what is happening during execution without log-diving
- Approve, deny, or escalate risky actions with clear context
- See linked artifacts and durable outputs when runs complete
- Continue operating in a constrained, explicit degraded mode when backend components are unavailable
- Trust that legacy entry points route safely through the new path during migration

## MVP vs Follow-On vs Stretch

### MVP / Must-Have
1. Thin-slice MCP-backed invocation for 2–3 high-value workflows
2. Standard response envelope: summary, status, trace/run id, artifact links, next action
3. Governor with low/medium/high risk tiers and explicit approval flow for dangerous actions
4. Notification model for queued, running, waiting-approval, failed, and completed states
5. Compatibility shim for the top legacy entry points
6. Degraded mode that supports explicit queue/defer/read-only behaviors without durable shadow state
7. Trace correlation from operator request to host EMA run to artifacts

### Follow-On
1. Broader workflow coverage across 8–15 host EMA operations
2. Batching/summarization to reduce notification storms
3. Replay/retry ergonomics for failed runs
4. Better diff/parity reporting in shadow mode
5. Policy simulation and approval previews
6. Operator drill-down pages/views for traces and artifacts

### Stretch / Ambitious Enhancements
1. Operator command palette / guided action composer for approved workflows
2. Smart preflight checks and dry-run previews before approval-required operations
3. SLA-aware escalation routing and on-call aware approvals
4. Multi-run rollup summaries for orchestrating many tasks at once
5. Contextual policy explanations (“blocked because …, approvable by …, safer alternative …”)
6. Rich degraded-mode reconciliation assistant after backend recovery
7. Cross-client UX kit so Discord/OpenClaw/web surfaces share the same event language

## Dependency Ordering

### Hard Dependencies
1. MCP contract and event model frozen enough for invocation and status
2. Host adapter returns structured run state, errors, and artifact references
3. Trace ids and correlation fields available end-to-end
4. Authz/risk model defined for policy layer

### Recommended Build Order
1. **Thin slice bridge**
2. **Operator response contract**
3. **Governor approvals and risk tiers**
4. **Notification patterns and correlation**
5. **Legacy compatibility shims**
6. **Shadow mode and parity checks**
7. **Degraded mode and reconciliation**
8. **Expanded workflow coverage**

Reason: this gets visible operator value early while forcing good interface discipline before migration and edge-case hardening.

## Epics

### Epic D1: MCP Bridge Foundation
**Goal**: Replace prototype/direct host glue with a clean OpenClaw → MCP → host EMA invocation path.

**Why it matters**: Without this, everything else risks ossifying around one-off integrations.

**Core deliverables**:
- Bridge module for MCP-backed calls
- Standard request/response envelope for operator surfaces
- Correlation/trace plumbing
- Initial high-value workflow adapters

**Acceptance criteria**:
- OpenClaw can invoke selected host EMA workflows only through MCP
- Response contains concise summary, state, run id/trace id, and artifact links
- Error semantics are operator-readable and machine-actionable
- No direct bespoke host hook remains in the thin-slice path

### Epic D2: Governor / Policy Control Plane
**Goal**: Reintroduce babysitter as a policy/governor module, not execution state owner.

**Why it matters**: This is where safety lives, but also where architecture can rot if it starts owning workflow state.

**Core deliverables**:
- Risk classification model
- Approval/deny/escalate flow
- Rate limiting and guardrails
- Audit log of policy decisions

**Acceptance criteria**:
- Policy decisions are traceable and auditable
- High-risk actions cannot execute without required approval
- Governor does not store or derive authoritative workflow state beyond policy metadata
- Architecture tests/ownership checks enforce policy-only boundaries

### Epic D3: Operator Experience & Notification Design
**Goal**: Make runs understandable in chat without drowning operators in noise.

**Why it matters**: Even technically successful systems fail if operators experience them as confusing or spammy.

**Core deliverables**:
- Event-to-message mapping for all operator-visible states
- Approval request UX
- Failure triage UX
- Completion summaries with artifact links
- Batching/summarization rules

**Acceptance criteria**:
- Operators can distinguish queued/running/waiting/failing/completed immediately
- Messages are concise, correlated, and actionable
- Notification storms are bounded under multi-run load
- At least one multi-run walkthrough is judged usable without transcript spelunking

### Epic D4: Migration Compatibility & Shadow Confidence
**Goal**: Preserve old callers while proving the new path is trustworthy.

**Why it matters**: Migration risk kills momentum; compatibility and parity data keep rollout reversible.

**Core deliverables**:
- Legacy entry-point shims
- Feature flags by workflow class
- Shadow-mode harness and discrepancy reports
- Cutover readiness criteria

**Acceptance criteria**:
- Priority legacy callers can route through the MCP path without interface breakage
- Shadow runs produce comparable outputs for selected workflows
- Operators can identify discrepancies by workflow, not by guesswork
- Traffic can be rolled back by feature flag

### Epic D5: Degraded Mode & Recovery Behavior
**Goal**: Define what OpenClaw does when host EMA or Wiki/vault is unavailable, without becoming a parallel system of record.

**Why it matters**: Failures are guaranteed; hidden fallback state is optional and dangerous.

**Core deliverables**:
- Read-only vs queue/defer modes
- Explicit operator messaging for backend impairment
- Recovery/reconciliation workflow
- Chaos drill scenarios

**Acceptance criteria**:
- Degraded mode never mutates authoritative state locally in OpenClaw
- Queued intents are explicit, bounded, replayable, and trace-linked
- Operators can tell what ran, what was deferred, and what needs re-issue
- Recovery drills prove no hidden split-brain emerges

### Epic D6: Operational Excellence & Stretch UX
**Goal**: Turn a functional bridge into a durable, high-leverage operator product.

**Core deliverables**:
- Operator drill-down views
- Smart preflight/dry-run previews
- Multi-run rollups
- Approval recommendations and escalation routing

**Acceptance criteria**:
- Advanced UX features reduce operator error and time-to-understand
- Enhancements remain optional layers on top of the core bridge/policy architecture

## Milestones

### Milestone 1: Thin Slice Live
**Target**: Early Sprint 3 equivalent

**Definition of done**:
- 2–3 high-value workflows callable from OpenClaw through MCP
- Clean response envelope with links and trace ids
- Live demo from Discord/OpenClaw surface

**Operator value**:
- First moment where new path is obviously better than bespoke glue

### Milestone 2: Approval-Safe Operations
**Target**: Sprint 4 early/mid

**Definition of done**:
- Risk tiers enforced
- Approval requests and decisions visible in operator surface
- Policy audit records correlated to runs

**Operator value**:
- Dangerous operations become usable without hand-wavy trust

### Milestone 3: Usable Day-to-Day UX
**Target**: Sprint 4 exit

**Definition of done**:
- Progress, failure, completion, and summarization patterns standardized
- Notification storms mitigated
- Multi-run operator walkthrough passes usability bar

**Operator value**:
- Operators can monitor work from chat without log spelunking

### Milestone 4: Migration Confidence
**Target**: Sprint 5 exit

**Definition of done**:
- Legacy shims in place for priority callers
- Shadow-mode comparison reports for representative workflows
- Feature-flag rollback proven

**Operator value**:
- Teams can adopt the new path without cliff-edge migration risk

### Milestone 5: Failure-Tolerant Bridge
**Target**: Sprint 6 exit

**Definition of done**:
- Degraded mode documented and implemented
- Recovery and replay flow tested
- Chaos drill with one backend offline succeeds

**Operator value**:
- Operators know what the system can still do under partial outages

### Milestone 6: Cutover-Ready Operator Plane
**Target**: Sprint 7 / release gate

**Definition of done**:
- New path is default for priority workflows
- Rollback retained via flags/shims
- Security and runbook sign-off complete

**Operator value**:
- New path feels production-real, not experimental

## Demo Slices

### Demo Slice A: Happy Path Thin Slice
- Invoke one high-value workflow from OpenClaw
- Show queued → running → completed state transitions
- Show summary + artifact links + trace id
- Verify host EMA is authoritative execution source

### Demo Slice B: Approval-Gated Mutation
- Trigger a high-risk action
- Show policy explanation, approval prompt, and approval decision
- Demonstrate execution only after approval
- Show auditable decision record

### Demo Slice C: Multi-Run Operational Walkthrough
- Trigger several runs in parallel
- Show summarization and anti-spam behavior
- Surface one failure and one success cleanly
- Verify operator can tell what needs action

### Demo Slice D: Legacy Caller Through Shim
- Invoke via an old entry point
- Route through compatibility shim into MCP path
- Compare output with legacy expectations
- Show rollback flag if discrepancy appears

### Demo Slice E: Degraded Mode Recovery
- Simulate host EMA or Wiki outage
- Show read-only / queue / defer behavior
- Recover backend and replay or reconcile queued intent
- Prove no shadow source of truth was created

## Phased Program Plan

## Phase 1: Thin-Slice Foundation
**Goal**: Ship the smallest operator-visible path that proves the architecture.
**Demo/Validation**:
- Live operator flow from OpenClaw to host EMA and back
- Trace id visible end-to-end

### Task 1.1: Select the thin-slice workflows
- **Description**: Choose 2–3 workflows with high operator value, moderate implementation complexity, and clear artifacts.
- **Dependencies**: MCP v1 workflow inventory
- **Acceptance Criteria**:
  - Chosen workflows cover at least one read-ish flow and one mutation/delegation flow
  - Workflows have named success outputs and artifact expectations
- **Validation**:
  - Workflow scoring matrix reviewed with owners

### Task 1.2: Define operator response envelope
- **Location**: `openclaw/bridge/ema-mcp/`
- **Description**: Standardize summary, status, trace id, run id, artifact links, and next-action fields.
- **Dependencies**: Task 1.1, MCP event semantics
- **Acceptance Criteria**:
  - Same envelope works for success, failure, and waiting-for-approval states
  - Discord-safe formatting rules documented
- **Validation**:
  - Snapshot examples for all major statuses

### Task 1.3: Implement MCP bridge thin slice
- **Location**: `openclaw/bridge/ema-mcp/`
- **Description**: Replace direct host glue in selected flows with MCP-backed calls.
- **Dependencies**: Task 1.2, host adapter readiness
- **Acceptance Criteria**:
  - Thin-slice flows invoke MCP only
  - Error paths preserve operator-readable context
- **Validation**:
  - End-to-end integration test and live demo

### Task 1.4: Add correlation and trace surfacing
- **Description**: Propagate and display trace/run ids from request through completion.
- **Dependencies**: Task 1.3
- **Acceptance Criteria**:
  - Operator-visible message includes correlation handle
  - Logs/artifacts can be found from that handle
- **Validation**:
  - Trace lookup exercise

## Phase 2: Governor and Safe Mutation
**Goal**: Make risky actions safe enough for real operators.
**Demo/Validation**:
- Approval-gated action performed successfully
- Audit trail visible and complete

### Task 2.1: Implement risk-tier registry
- **Location**: `openclaw/governor/` or `services/policy/`
- **Description**: Classify supported actions as low/medium/high risk with policy hooks.
- **Dependencies**: Authz model, thin-slice flows
- **Acceptance Criteria**:
  - Every exposed action has an explicit risk tier
  - Unclassified actions default to deny or manual review
- **Validation**:
  - Policy table review and test cases

### Task 2.2: Add approval decision flow
- **Description**: Build approve/deny/escalate path with timeout and cancellation handling.
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - High-risk actions cannot execute without approval
  - Approval state is distinct from workflow execution state
- **Validation**:
  - Simulated approval-required run

### Task 2.3: Add policy audit trail
- **Description**: Record policy evaluations, approver identity, rationale, and timestamps with trace linkage.
- **Dependencies**: Task 2.2
- **Acceptance Criteria**:
  - Every blocked/approved/escalated decision is auditable
- **Validation**:
  - Audit trace walkthrough

### Task 2.4: Add rate limits and guardrails
- **Description**: Prevent accidental operator spam and dangerous repeated invocations.
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - Burst thresholds and duplicate-protection rules defined for priority actions
- **Validation**:
  - Abuse/burst simulation tests

## Phase 3: Operator UX Standardization
**Goal**: Make the bridge pleasant enough for daily use.
**Demo/Validation**:
- Multi-run operator walkthrough with concise, usable notifications

### Task 3.1: Map execution states to operator messages
- **Location**: `openclaw/bridge/ema-mcp/notifications/`
- **Description**: Define canonical messages for queued, running, approval-needed, failed, degraded, and completed states.
- **Dependencies**: Phases 1–2
- **Acceptance Criteria**:
  - Every run state maps to a concise message contract
- **Validation**:
  - UX review on message examples

### Task 3.2: Implement summarization and batching
- **Description**: Collapse noisy progress into rollups while preserving drill-down links.
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - Multi-run workflows do not spam channels
  - Operators can still inspect per-run details
- **Validation**:
  - Simulated multi-run load test

### Task 3.3: Standardize failure triage UX
- **Description**: Failures should show what happened, what did not happen, retryability, and where to inspect artifacts.
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - Failure messages distinguish transient, policy, and permanent errors
- **Validation**:
  - Fault injection suite on representative workflows

### Task 3.4: Build completion summary templates
- **Description**: Show durable outputs, links, next actions, and policy outcome where relevant.
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - Completion summaries are useful without reading raw logs
- **Validation**:
  - Operator acceptance review

## Phase 4: Compatibility and Cutover Preparation
**Goal**: Make adoption reversible and measurable.
**Demo/Validation**:
- Legacy caller routed through shim with parity report

### Task 4.1: Catalog priority legacy entry points
- **Location**: `compat/legacy-dispatch/` or `openclaw/legacy/`
- **Description**: Identify the top callers that must keep working during migration.
- **Dependencies**: Phase 1 stable
- **Acceptance Criteria**:
  - Entry points ranked by volume, risk, and migration complexity
- **Validation**:
  - Migration review list approved

### Task 4.2: Implement compatibility shims
- **Description**: Route selected old entry points into MCP-backed handlers behind flags.
- **Dependencies**: Task 4.1
- **Acceptance Criteria**:
  - Priority entry points continue functioning without abrupt interface breakage
- **Validation**:
  - Regression tests on legacy entrypoints

### Task 4.3: Build shadow-mode comparison harness
- **Location**: `tools/shadow-mode/`
- **Description**: Compare old and new paths for outputs, artifacts, latency, and policy behavior.
- **Dependencies**: Task 4.2
- **Acceptance Criteria**:
  - Representative workflows produce comparison reports with actionable discrepancies
- **Validation**:
  - At least 10 comparison runs across priority workflows

### Task 4.4: Add workflow-class feature flags
- **Description**: Enable progressive rollout and fast rollback by workflow category.
- **Dependencies**: Task 4.2
- **Acceptance Criteria**:
  - Read, mutation, delegation, and admin paths can be toggled independently
- **Validation**:
  - Rollback drill

## Phase 5: Degraded Mode and Recovery
**Goal**: Preserve operator utility under partial failure without architectural regression.
**Demo/Validation**:
- Backend outage drill with safe queue/defer behavior and successful recovery

### Task 5.1: Define degraded-mode operating states
- **Location**: `openclaw/bridge/ema-mcp/degraded-mode/`
- **Description**: Specify read-only, queue-for-later, defer-with-instruction, and hard-block modes by backend failure class.
- **Dependencies**: Phase 3 stable
- **Acceptance Criteria**:
  - Each backend failure mode maps to explicit operator behavior
- **Validation**:
  - Failure-mode design review

### Task 5.2: Implement explicit queue/defer intent handling
- **Description**: Support bounded deferred intents with replay handles and clear expiry/reconciliation rules.
- **Dependencies**: Task 5.1
- **Acceptance Criteria**:
  - Deferred intents are trace-linked, bounded, and never treated as authoritative execution state
- **Validation**:
  - Queue/replay simulation

### Task 5.3: Add recovery and reconciliation flow
- **Description**: After backend recovery, allow safe replay/reissue and show operator what needs action.
- **Dependencies**: Task 5.2
- **Acceptance Criteria**:
  - Operators can distinguish already-executed, replay-safe, and manual-reissue cases
- **Validation**:
  - Recovery drill

### Task 5.4: Run chaos drills
- **Description**: Exercise host EMA down, Wiki/vault write failure, and OpenClaw disconnect scenarios.
- **Dependencies**: Task 5.3
- **Acceptance Criteria**:
  - No scenario causes hidden split-brain or silent loss of operator intent
- **Validation**:
  - Chaos report with findings and fixes

## Phase 6: Scale-Out and Stretch Enhancements
**Goal**: Expand the operator plane after the architecture proves itself.
**Demo/Validation**:
- Advanced operator workflows demonstrably faster/safer than baseline

### Task 6.1: Expand workflow coverage
- **Description**: Grow from thin slice to 8–15 host EMA workflows.
- **Dependencies**: Phases 1–5 complete enough for safe rollout
- **Acceptance Criteria**:
  - Coverage includes major routine operator workflows
- **Validation**:
  - Coverage matrix and demos

### Task 6.2: Add preflight and dry-run previews
- **Description**: Show likely effects and required approvals before risky execution.
- **Dependencies**: Phase 2 policy model
- **Acceptance Criteria**:
  - Operators can inspect intended action before approval
- **Validation**:
  - Dry-run walkthrough

### Task 6.3: Add multi-run rollup and drill-down views
- **Description**: Aggregate many concurrent runs into compact summaries with drill-down links.
- **Dependencies**: Phase 3 messaging model
- **Acceptance Criteria**:
  - High concurrency remains comprehensible
- **Validation**:
  - Load walkthrough

### Task 6.4: Add contextual policy explanations and safer alternatives
- **Description**: When blocked, show why and what approved path exists.
- **Dependencies**: Phase 2 stable
- **Acceptance Criteria**:
  - Policy messages help operators recover instead of just failing closed
- **Validation**:
  - UX evaluation on blocked flows

## Acceptance Gates by Release

### Gate A: MVP Ready
- Thin slice works from operator surface
- Trace ids and artifact links visible
- Approval flow works for one risky workflow
- Notification model covers core states

### Gate B: Migration Ready
- Legacy shims in place for priority callers
- Shadow-mode discrepancy rate acceptable for chosen workflows
- Workflow-class rollback flags proven

### Gate C: Production Cutover Ready
- Degraded mode drills complete
- No high-risk mutation path lacks auth, approval, or audit
- Operator runbooks complete
- Ownership boundaries documented and enforced

## Success Metrics

### Operator Value Metrics
- Median time from request to understandable status update
- Median time for operator to identify next action on failed run
- Reduction in log-diving or manual follow-up per workflow
- Approval turnaround time for gated actions

### System Metrics
- MCP path adoption rate by workflow class
- Notification volume per run and per channel
- Shadow-mode discrepancy rate
- Replay/recovery success rate after partial outages
- Rate of policy decision/audit correlation completeness

## Testing Strategy

### Contract Tests
- Response envelope schema
- Event/status mapping
- Approval request/decision semantics
- Idempotency and correlation propagation

### Integration Tests
- OpenClaw → MCP → host EMA → artifact return
- Approval-gated mutation path
- Legacy shim → MCP path routing
- Degraded-mode queue/defer/recovery flows

### UX/Operator Tests
- Single-run comprehension test
- Multi-run anti-spam test
- Failure triage usability walkthrough
- Approval clarity review

### Reliability Tests
- Duplicate request/retry behavior
- Timeout/cancellation handling
- Partial backend outage behavior
- Replay/reconciliation safety

## Risk Register

1. **Governor regains hidden orchestration state**  
   - **Impact**: Architectural regression, split ownership, future migration pain  
   - **Likelihood**: High  
   - **Mitigation**: Policy-only boundaries, code ownership, architecture tests, explicit ban on durable workflow state in governor

2. **OpenClaw bridge becomes chat-shaped instead of client-neutral**  
   - **Impact**: MCP contract polluted by Discord/OpenClaw quirks  
   - **Likelihood**: Medium  
   - **Mitigation**: Keep client formatting at edge; preserve structured response contract underneath

3. **Thin slice overfits custom logic**  
   - **Impact**: Scaling to more workflows becomes expensive and inconsistent  
   - **Likelihood**: Medium  
   - **Mitigation**: Pause after thin slice if per-tool customization grows; refactor adapter/contract before expanding

4. **Approval UX too slow or noisy for operators**  
   - **Impact**: Operators bypass or resent safe path  
   - **Likelihood**: Medium  
   - **Mitigation**: Risk tiers, batching, escalation rules, concise approval payloads, dry-run previews later

5. **Notification storms degrade trust**  
   - **Impact**: Channel spam, missed critical alerts  
   - **Likelihood**: High  
   - **Mitigation**: Summarization, state suppression rules, per-run correlation, multi-run rollups

6. **Compatibility shims preserve too much legacy weirdness**  
   - **Impact**: Migration slows and architecture stays muddy  
   - **Likelihood**: Medium  
   - **Mitigation**: Shim only priority entry points, flag aggressively, expire shims after stable cycles

7. **Degraded mode becomes hidden fallback system of record**  
   - **Impact**: Split-brain and reconciliation nightmares  
   - **Likelihood**: High  
   - **Mitigation**: Queue intent only, bounded deferred state, explicit replay/reissue semantics, recovery drills

8. **Cross-system correlation is incomplete**  
   - **Impact**: Operators cannot trust status or audit  
   - **Likelihood**: Medium  
   - **Mitigation**: Treat trace propagation as release blocker, not observability nice-to-have

9. **High-risk actions exposed before authz/audit are mature**  
   - **Impact**: Security/safety incident  
   - **Likelihood**: Medium  
   - **Mitigation**: Start with safer workflows, deny-by-default for unclassified actions, gate cutover on security review

10. **Shadow mode shows persistent parity gaps late**  
   - **Impact**: Cutover delay and confidence erosion  
   - **Likelihood**: Medium  
   - **Mitigation**: Start parity checks early on a small workflow set; classify acceptable vs blocking discrepancies

## Rollback Plan

### Product Rollback
- Disable MCP-backed mutation workflows first, then delegation, then reads if necessary
- Preserve legacy paths behind compatibility shims during early release window

### Data/State Rollback
- Never treat OpenClaw deferred intents as completed execution state
- Mark partial runs and failed artifact writes explicitly rather than hiding them

### Operational Rollback
- Roll back by workflow class using feature flags
- Keep emergency operator-restricted host path out-of-band
- Retain shadow mode until two stable cycles after cutover

## Recommended Sequence if Starting Now

### First 2 Weeks
- Pick thin-slice workflows
- Lock operator response envelope
- Ship bridge for one happy-path workflow
- Add visible trace ids and artifact links

### Weeks 3–4
- Add risk tiers and approval flow
- Standardize progress/failure/completion messaging
- Demonstrate one approval-gated mutation flow

### Weeks 5–6
- Add legacy shims for top callers
- Run shadow comparisons
- Add workflow-class flags and rollback drills

### Weeks 7–8
- Implement degraded mode and reconciliation
- Run outage drills
- Expand to broader workflow coverage only after core behavior holds

## Opinionated Recommendation

The must-win for Track D is **not** “support every host EMA action from chat.” It is:
- one excellent thin slice,
- one trustworthy approval story,
- one low-noise operator UX,
- and one honest degraded-mode model.

If those land, expansion is straightforward. If those do not land, broader exposure just scales confusion.
