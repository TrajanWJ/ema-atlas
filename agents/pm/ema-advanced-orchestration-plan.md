# Plan: EMA Advanced Orchestration and Delegation

**Generated**: 2026-04-06 UTC  
**Estimated Complexity**: High
**Planning Horizon**: 7 sprints (can compress to 5 if resourced aggressively)  
**Primary Objective**: Build a durable control plane where the host EMA remains the real system of action, Wiki Engine remains the canonical second-brain substrate, OpenClaw acts as backup + bridge + operator surface, and MCP exposes major host EMA capabilities cleanly to OpenClaw, Discord, and future clients.

---

## Assumptions

These assumptions are baked into the plan and should be explicitly confirmed before execution starts:

1. **Host EMA is authoritative for execution** of EMA actions, orchestration state, automations, and CLI-driven workflows.
2. **Wiki Engine is the canonical knowledge substrate** for durable notes, entity pages, memory artifacts, and synthesis outputs.
3. **Vault** is a filesystem-backed working substrate adjacent to Wiki Engine, used for source material, drafts, exports, attachments, and low-friction human edits.
4. **OpenClaw is not the system of record** for orchestration state. It is a bridge, runtime, operator interface, and resilience layer.
5. **dispatch.db is no longer primary** and should be treated as legacy compatibility only.
6. **Babysitter** refers to the older Discord/OpenClaw governor behavior and should be reintroduced only as a policy/control layer, not as the core orchestration store.
7. **CLI already exists** on the host and should be wrapped/exposed rather than replaced.
8. **MCP is the main interoperability contract** between OpenClaw and host EMA.

---

## Target Architecture

```text
Discord / chat / other clients
            |
            v
        OpenClaw
  (bridge, UX, backup runtime,
   policy surface, notifications)
            |
            v
            MCP
 (stable tool/API contract layer)
            |
            v
         Host EMA
 (real orchestration engine, CLI,
  job execution, adapters, schedulers)
         /          \
        v            v
 Wiki Engine      Vault/filesystem
(canonical         (drafts, assets,
 knowledge)         imports/exports)
```

### Design Principles

- **Execution local to host EMA**; remote systems invoke capabilities, not private internals.
- **Knowledge lands in Wiki Engine**; transient runtime state does not masquerade as memory.
- **OpenClaw remains replaceable**; MCP contract prevents tight coupling to Discord-isms or current runtime quirks.
- **Policy separated from execution**; babysitter/governor logic should gate or supervise actions, not own workflow state.
- **Observable by default**; every cross-boundary action should have trace IDs, audit logs, and reversible writes where possible.

---

## Workstreams

These run in parallel once Sprint 1 foundations are done.

1. **WS-A: Capability mapping & contracts**
   - Inventory CLI + host EMA functions
   - Define MCP tools/resources/events
   - Specify idempotency and error semantics

2. **WS-B: Host adapter layer**
   - Build MCP server / adapter around host EMA CLI and internal services
   - Normalize requests, auth, traces, streaming, long-running jobs

3. **WS-C: Knowledge substrate integration**
   - Define Wiki Engine write/read patterns
   - Map vault documents, assets, exports, and backlinks
   - Separate durable notes from transient runtime artifacts

4. **WS-D: OpenClaw bridge & operator UX**
   - Replace direct/legacy glue with MCP-backed flows
   - Add Discord-safe command surfaces, summaries, approvals, notifications
   - Reframe babysitter as policy/governor module

5. **WS-E: Reliability, security, and migration**
   - Authn/authz, audit, retries, dead-lettering, fallback modes
   - Legacy migration from dispatch.db-era assumptions
   - Rollback and cutover procedures

---

## Critical Path

The tasks below determine earliest end-to-end delivery:

1. **Capability inventory and domain model freeze**
2. **MCP contract v1 definition**
3. **Host EMA adapter / MCP server skeleton**
4. **One end-to-end slice**: OpenClaw → MCP → host EMA → Wiki Engine/vault → response back to OpenClaw
5. **Babysitter/governor policy layer reintroduced on top of MCP actions**
6. **Migration off dispatch.db-primary behaviors**
7. **Production hardening + staged cutover**

If any of those slip, the whole program slips.

---

## Dependency Graph (High Level)

- Sprint 1 → unlocks all later work
- Sprint 2A contract work depends on Sprint 1 domain decisions
- Sprint 2B Wiki/vault write model depends on Sprint 1 entity/event taxonomy
- Sprint 3 end-to-end slice depends on Sprint 2A + 2B
- Sprint 4 babysitter/policy depends on Sprint 3 action routing
- Sprint 5 migration depends on Sprint 3 + 4 compatibility shims
- Sprint 6 hardening depends on real traffic through Sprint 3/4 paths
- Sprint 7 cutover depends on successful rollback drills + shadow mode confidence

---

## Sprint 1: Architecture Baseline and Capability Inventory

**Goal**: Freeze the system boundaries, major nouns/verbs, and transition strategy away from dispatch.db-primary thinking.  
**Demoable Increment**: A reviewed architecture decision pack plus an inventory of all major host EMA functions and their intended MCP exposure shape.

**Demo / Validation**:
- Review architecture diagram and system boundaries with stakeholders
- Walk through 10–20 representative host EMA functions and show how each maps to MCP + Wiki Engine + OpenClaw
- Confirm which data is authoritative in host EMA vs Wiki Engine vs vault vs OpenClaw

### Task 1.1: Produce domain model and source-of-truth matrix
- **Location**: `docs/architecture/domain-model.md`
- **Description**: Define entities such as task, workflow, run, job, delegation, artifact, memory page, operator action, notification, approval, and policy decision. Add a matrix showing where each is created, updated, and persisted.
- **Dependencies**: None
- **Acceptance Criteria**:
  - Each core entity has owner system and lifecycle
  - No entity still implicitly depends on dispatch.db as primary store
  - Durable knowledge vs transient runtime state is explicit
- **Validation**:
  - Review for gaps/duplicates
  - Check every current CLI action against one entity or event

### Task 1.2: Inventory host EMA CLI commands and internal capabilities
- **Location**: `docs/architecture/host-capability-inventory.md`
- **Description**: Enumerate all major host EMA capabilities, classify each as read/write/control/admin, and label exposure priority: Day 1 MCP, Phase 2 MCP, internal only, deprecated.
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - All high-value host EMA functions are listed
  - Exposure priority agreed
  - Long-running vs immediate functions labeled
- **Validation**:
  - Spot-check against CLI help and operational usage logs

### Task 1.3: Define system boundaries and non-goals
- **Location**: `docs/architecture/boundaries-and-nongoals.md`
- **Description**: Explicitly document what OpenClaw will not own, what Wiki Engine will not do, and what babysitter will not re-centralize.
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - Clear boundaries prevent reintroducing accidental coupling
  - dispatch.db replacement expectations removed
- **Validation**:
  - Review against architecture assumptions

### Task 1.4: Define migration strategy from legacy babysitter/dispatch model
- **Location**: `docs/migration/legacy-model-transition.md`
- **Description**: Document legacy behaviors, compatibility requirements, and how they map into policy + audit + notification layers in the new design.
- **Dependencies**: Task 1.2, Task 1.3
- **Acceptance Criteria**:
  - Legacy functionality is mapped, retired, or explicitly deferred
  - No ambiguous “we’ll figure it out later” categories remain for critical flows
- **Validation**:
  - Tabletop exercise using 3–5 representative legacy babysitter scenarios

**Rollback Point**:
- If architectural ownership is still unclear by end of Sprint 1, do not start implementation. Extend architecture work instead of coding against ambiguity.

---

## Sprint 2: MCP Contract and Knowledge Write Model

**Goal**: Create the stable protocol contract and durable knowledge-write model before deep implementation.  
**Demoable Increment**: MCP v1 spec, event model, auth approach, and Wiki Engine/vault artifact strategy.

**Parallel Workstreams**: WS-A and WS-C can run in parallel after Sprint 1.

**Demo / Validation**:
- Review example MCP tool definitions for 5 read tools and 5 write/control tools
- Show request/response/error examples
- Show how a host EMA action results in structured outputs for Wiki Engine and vault

### Task 2.1: Define MCP tool taxonomy
- **Location**: `docs/mcp/mcp-tool-taxonomy.md`
- **Description**: Group tools into read/query, act/execute, delegate, observe, memory/wiki, vault/artifact, policy/admin.
- **Dependencies**: Sprint 1 complete
- **Acceptance Criteria**:
  - Every Day 1 capability is placed into a category
  - Dangerous/admin tools clearly separated from routine tools
- **Validation**:
  - Walk through operator personas and confirm least-privilege alignment

### Task 2.2: Define MCP v1 schemas and semantics
- **Location**: `docs/mcp/mcp-v1-spec.md`
- **Description**: Specify tool names, inputs, outputs, error codes, streaming patterns, pagination, async job handles, idempotency keys, trace IDs, and cancellation semantics.
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - Spec covers sync and async host EMA operations
  - Retry-safe behavior defined for all mutating calls
  - Errors distinguish operator error, policy block, host execution error, and integration failure
- **Validation**:
  - Run design review on at least 8 representative tools

### Task 2.3: Define event and webhook/notification model
- **Location**: `docs/mcp/event-model.md`
- **Description**: Specify emitted events for run-started, run-completed, artifact-created, wiki-updated, approval-required, policy-blocked, retrying, degraded-mode.
- **Dependencies**: Task 2.2
- **Acceptance Criteria**:
  - Events support Discord/OpenClaw notifications without inventing hidden state
  - Correlation between command, host run, wiki artifact, and final summary is preserved
- **Validation**:
  - Trace a sample execution with correlation IDs end-to-end

### Task 2.4: Define Wiki Engine durable write model
- **Location**: `docs/wiki/wiki-write-model.md`
- **Description**: Specify what gets written to Wiki Engine: final summaries, run journals, decision records, task pages, delegation outcomes, backlinks to vault artifacts. Define naming, page templates, metadata, tags, and update/append rules.
- **Dependencies**: Sprint 1 complete
- **Acceptance Criteria**:
  - Durable memory is separated from chat noise and transient logs
  - Write patterns are deterministic and auditable
- **Validation**:
  - Use 3 sample workflows and show resulting Wiki pages

### Task 2.5: Define vault artifact lifecycle
- **Location**: `docs/wiki/vault-artifact-model.md`
- **Description**: Specify where attachments, exports, raw transcripts, temp files, generated reports, and imported source material live in vault/filesystem; define retention and backlinking into Wiki Engine.
- **Dependencies**: Task 2.4
- **Acceptance Criteria**:
  - Every artifact type has canonical location and retention policy
  - Vault/Wiki relationship is explicit
- **Validation**:
  - Simulate two workflows with attachments and exports

### Task 2.6: Define authn/authz and trust boundaries
- **Location**: `docs/security/mcp-authz-model.md`
- **Description**: Define which callers can invoke which tools, approval requirements for dangerous actions, and whether OpenClaw is a trusted front-end, delegated caller, or semi-trusted client.
- **Dependencies**: Task 2.2
- **Acceptance Criteria**:
  - Risk tiers defined for all tool groups
  - Human approval checkpoints defined for sensitive mutations
- **Validation**:
  - Threat-model review

**Rollback Point**:
- If MCP v1 cannot cleanly represent async jobs, approvals, and Wiki/vault writebacks, pause implementation and revise the contract before building adapters.

---

## Sprint 3: Thin Vertical Slice (End-to-End)

**Goal**: Prove the architecture with one complete working slice before broad API coverage.  
**Demoable Increment**: One or two high-value flows working end-to-end across OpenClaw ↔ MCP ↔ host EMA ↔ Wiki Engine ↔ vault.

**Recommended first slices**:
1. “Run a host EMA command that produces a durable synthesis page in Wiki Engine”
2. “Delegate a task/job from OpenClaw, observe progress, and receive completion summary with linked artifacts”

**Demo / Validation**:
- Trigger flow from OpenClaw or Discord
- Observe routed request in MCP and host EMA
- Show resulting Wiki page + vault artifact(s)
- Show trace IDs and operator-visible summary

### Task 3.1: Build MCP server skeleton around host EMA
- **Location**: `services/mcp-server/`
- **Description**: Stand up MCP server, transport, auth middleware, logging, request validation, health checks, and basic tool registration.
- **Dependencies**: Sprint 2 complete
- **Acceptance Criteria**:
  - MCP server boots reliably and exposes at least stub tools
  - Structured logs and trace IDs included
- **Validation**:
  - Health check + contract test suite

### Task 3.2: Build host EMA adapter wrapper
- **Location**: `services/mcp-server/adapters/host-ema/`
- **Description**: Wrap existing host-oriented CLI and/or internal APIs with normalized invocation, timeouts, stdout/stderr parsing, exit status handling, and async job tracking.
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - Wrapper supports sync and long-running commands
  - Command normalization prevents brittle caller assumptions
- **Validation**:
  - Adapter tests over representative commands

### Task 3.3: Implement Wiki Engine writer module
- **Location**: `services/mcp-server/adapters/wiki-engine/`
- **Description**: Create deterministic page creation/update logic according to Sprint 2 write model.
- **Dependencies**: Sprint 2 tasks 2.4 and 2.5, Task 3.1
- **Acceptance Criteria**:
  - Writes create expected page shape and metadata
  - Idempotent replays do not duplicate durable records unnecessarily
- **Validation**:
  - Snapshot tests on generated Wiki content

### Task 3.4: Implement vault artifact writer/linker
- **Location**: `services/mcp-server/adapters/vault/`
- **Description**: Persist artifacts to canonical vault locations and generate links/metadata for Wiki Engine references.
- **Dependencies**: Task 3.3
- **Acceptance Criteria**:
  - Artifact paths deterministic
  - Metadata preserves trace/correlation IDs
- **Validation**:
  - File lifecycle tests and Wiki backlinks tests

### Task 3.5: Expose first two MCP tools end-to-end
- **Location**: `services/mcp-server/tools/`
- **Description**: Implement one read/query tool and one act/delegate tool to prove the pattern fully.
- **Dependencies**: Task 3.2, 3.3, 3.4
- **Acceptance Criteria**:
  - Tool can be called from OpenClaw and return meaningful structured response
  - At least one tool creates durable Wiki/vault artifacts
- **Validation**:
  - End-to-end integration test

### Task 3.6: Add OpenClaw bridge for MCP-backed invocation
- **Location**: `openclaw/bridge/ema-mcp/`
- **Description**: Replace any prototype/direct host hooks for the slice with proper MCP calls; return Discord-safe summaries and links.
- **Dependencies**: Task 3.5
- **Acceptance Criteria**:
  - OpenClaw can call MCP tools instead of bespoke glue
  - User-visible output contains summary + artifact links + status
- **Validation**:
  - Live demo from Discord/OpenClaw surface

**Rollback Point**:
- If the thin slice requires too much per-tool custom logic, stop and refactor the adapter/contract pattern before scaling out.

---

## Sprint 4: Broad Capability Exposure and Governor/Babysitter Reframe

**Goal**: Expand coverage of major host EMA functions and reintroduce babysitter as policy, approval, and supervision—not primary orchestration.  
**Demoable Increment**: Most high-value host EMA functions available via MCP, with policy gating and notification workflows.

**Parallel Workstreams**: WS-B and WS-D run in parallel; WS-E starts for policy controls.

**Demo / Validation**:
- Show 8–15 host EMA functions callable via MCP/OpenClaw
- Trigger an approval-required action and show babysitter/governor behavior
- Show blocked, approved, and escalated flows

### Task 4.1: Implement Day 1 MCP tool set
- **Location**: `services/mcp-server/tools/`
- **Description**: Add all priority Day 1 tools from the inventory, following shared wrapper patterns rather than one-off implementations.
- **Dependencies**: Sprint 3 complete
- **Acceptance Criteria**:
  - All priority tools implemented or explicitly deferred with rationale
  - Tool naming and semantics remain consistent
- **Validation**:
  - Contract tests + smoke tests for each tool group

### Task 4.2: Add async run registry and cancellation/progress model
- **Location**: `services/mcp-server/runtime/`
- **Description**: Implement durable tracking for long-running jobs/runs, including cancellation, progress updates, finalization, and resume semantics.
- **Dependencies**: Task 4.1
- **Acceptance Criteria**:
  - Long-running jobs can be observed without hidden coupling to chat state
  - Failed/retried runs are inspectable
- **Validation**:
  - Fault injection tests on long-running operations

### Task 4.3: Reintroduce babysitter as policy/governor module
- **Location**: `openclaw/governor/` or `services/policy/`
- **Description**: Implement risk-based rules, approvals, guardrails, throttling, and human escalation on top of MCP actions. Keep execution in host EMA.
- **Dependencies**: Task 4.1, Task 2.6
- **Acceptance Criteria**:
  - Policy decisions are auditable and do not own workflow state
  - Dangerous actions require explicit approvals where configured
- **Validation**:
  - Policy tests across low/medium/high-risk tool calls

### Task 4.4: Add OpenClaw notification and operator UX patterns
- **Location**: `openclaw/bridge/ema-mcp/notifications/`
- **Description**: Standardize how progress, approvals, failures, and completions are surfaced in Discord/OpenClaw.
- **Dependencies**: Task 4.2, Task 4.3
- **Acceptance Criteria**:
  - Messages concise, correlated, and actionable
  - Notification storms avoided via summarization/batching
- **Validation**:
  - Simulated multi-run operator walkthrough

### Task 4.5: Add audit trail and operator-visible trace drill-down
- **Location**: `services/observability/` or shared infra
- **Description**: Link caller, tool invocation, host EMA run, Wiki update, and artifact writes through shared trace IDs.
- **Dependencies**: Task 4.2
- **Acceptance Criteria**:
  - Every write/control action is traceable end-to-end
- **Validation**:
  - Audit replay using a single trace ID

**Rollback Point**:
- If babysitter logic starts accumulating orchestration state, split it back out immediately and enforce policy-only boundaries.

---

## Sprint 5: Migration Off Legacy Paths and Shadow Mode

**Goal**: Move real usage from legacy direct/dispatch-era flows onto MCP-backed flows with safety nets.  
**Demoable Increment**: Shadow mode where new pipeline observes or mirrors production-like behavior without being sole control plane yet.

**Demo / Validation**:
- Run selected workflows through legacy and MCP paths in parallel
- Compare outputs, timing, artifact writes, and policy decisions
- Show cutover checklist and discrepancy logs

### Task 5.1: Build compatibility shims for legacy callers
- **Location**: `compat/legacy-dispatch/` or `openclaw/legacy/`
- **Description**: Route old integration points into MCP-backed handlers where possible, with feature flags for fallback.
- **Dependencies**: Sprint 4 complete
- **Acceptance Criteria**:
  - Legacy callers can be redirected without breaking interfaces abruptly
- **Validation**:
  - Regression tests on legacy entrypoints

### Task 5.2: Implement shadow mode comparison harness
- **Location**: `tools/shadow-mode/`
- **Description**: Run selected flows through both old and new paths, capturing diffs in outputs, artifacts, latency, and failure modes.
- **Dependencies**: Task 5.1
- **Acceptance Criteria**:
  - Measurable parity data exists for priority workflows
- **Validation**:
  - Comparison reports over at least 10 representative runs

### Task 5.3: Decommission dispatch.db-primary assumptions
- **Location**: `docs/migration/dispatch-db-retirement.md`
- **Description**: Remove or quarantine code paths that still assume dispatch.db is authoritative.
- **Dependencies**: Task 5.2
- **Acceptance Criteria**:
  - Remaining dispatch.db references are legacy-read-only or removed
  - New writes do not depend on dispatch.db
- **Validation**:
  - Search-based and runtime verification

### Task 5.4: Add feature flags and rollback toggles
- **Location**: `config/feature-flags.*`
- **Description**: Define toggles for MCP path, Wiki writes, policy enforcement strictness, notifications, and compatibility shims.
- **Dependencies**: Task 5.1
- **Acceptance Criteria**:
  - Each major capability can be disabled independently during cutover
- **Validation**:
  - Toggle matrix test run

**Rollback Point**:
- If parity is weak or operator trust is low, remain in shadow mode and do not cut traffic over fully.

---

## Sprint 6: Hardening, Security, and Failure Recovery

**Goal**: Make the system boring in production: safe, observable, debuggable, and resilient.  
**Demoable Increment**: Failure drills, permission model, retries/dead-lettering, backup-mode behavior, and operational runbooks.

**Demo / Validation**:
- Simulate host EMA timeout, Wiki Engine unavailable, vault write failure, and OpenClaw disconnect
- Show expected degraded-mode and recovery behavior

### Task 6.1: Add retry, dead-letter, and compensating action patterns
- **Location**: `services/mcp-server/runtime/reliability/`
- **Description**: Implement bounded retries, dead-letter queues/logs, and compensating behavior for partial cross-system failures.
- **Dependencies**: Sprint 5 complete
- **Acceptance Criteria**:
  - Partial failures do not silently corrupt durable state
  - Operators can inspect and replay failed actions safely
- **Validation**:
  - Failure injection suite

### Task 6.2: Finalize backup/bridge degraded-mode behavior for OpenClaw
- **Location**: `openclaw/bridge/ema-mcp/degraded-mode/`
- **Description**: Define what OpenClaw can still do when host EMA or Wiki Engine is partially unavailable, and how it queues or defers actions.
- **Dependencies**: Task 6.1
- **Acceptance Criteria**:
  - OpenClaw remains a bridge/backup without becoming a shadow source of truth
- **Validation**:
  - Chaos drill with one backend offline

### Task 6.3: Security review and secrets flow hardening
- **Location**: `docs/security/production-hardening.md`
- **Description**: Review credential boundaries, vault paths, token issuance, caller identity, and Discord/OpenClaw trust assumptions.
- **Dependencies**: Sprint 4+ behavior stable
- **Acceptance Criteria**:
  - No high-risk mutation path lacks auth and audit
- **Validation**:
  - Threat model and manual review

### Task 6.4: Operational runbooks and on-call/debug docs
- **Location**: `docs/ops/`
- **Description**: Document restart, replay, rollback, trace lookup, dead-letter handling, and cutover reversal steps.
- **Dependencies**: Task 6.1, 6.2, 6.3
- **Acceptance Criteria**:
  - Another operator can recover common incidents from docs alone
- **Validation**:
  - Tabletop incident exercise

**Rollback Point**:
- If degraded-mode behavior starts accumulating un-reconciled local state in OpenClaw, reduce it to queue/notification mode only.

---

## Sprint 7: Production Cutover and Cleanup

**Goal**: Make MCP-backed host EMA the normal path, retire obsolete glue, and leave behind clear ops boundaries.  
**Demoable Increment**: Full production path live for priority workflows, with rollback tested.

**Demo / Validation**:
- Run production workflows on new path
- Verify audit, Wiki outputs, artifact writes, approvals, and notifications
- Perform rollback drill and restore new path again

### Task 7.1: Progressive cutover by workflow class
- **Location**: `docs/cutover/progressive-cutover.md`
- **Description**: Migrate low-risk reads first, then routine writes, then delegation/control, then admin operations.
- **Dependencies**: Sprint 6 complete
- **Acceptance Criteria**:
  - Traffic shifted in ordered risk tiers
- **Validation**:
  - Metrics and operator signoff after each tier

### Task 7.2: Retire obsolete direct integration paths
- **Location**: relevant bridge and legacy modules
- **Description**: Remove or quarantine direct OpenClaw→host glue that bypasses MCP unless intentionally kept as emergency-only maintenance path.
- **Dependencies**: Task 7.1
- **Acceptance Criteria**:
  - MCP is the default and documented integration path
- **Validation**:
  - Code search and runtime tests confirm no unintended bypasses

### Task 7.3: Post-cutover cleanup of docs and architecture records
- **Location**: `docs/architecture/`, `docs/migration/`, `docs/ops/`
- **Description**: Update diagrams, ADRs, onboarding docs, and runbooks to reflect the final state.
- **Dependencies**: Task 7.2
- **Acceptance Criteria**:
  - Docs match reality; no stale dispatch-era guidance remains
- **Validation**:
  - Fresh operator onboarding pass

### Task 7.4: Freeze v1 and open v2 backlog
- **Location**: `docs/roadmap/mcp-v2-backlog.md`
- **Description**: Capture deferred items such as richer streaming, broader multi-client support, advanced delegation UIs, or semantic Wiki enrichments.
- **Dependencies**: Task 7.3
- **Acceptance Criteria**:
  - Future work separated from critical path
- **Validation**:
  - Stakeholder review

**Rollback Point**:
- Full rollback is still possible via feature flags, compatibility shims, and legacy emergency path until two stable release cycles complete.

---

## Recommended Sequencing by Team / Parallelization

### Track A: Architecture + contracts (starts first)
1. Sprint 1 tasks 1.1–1.4
2. Sprint 2 tasks 2.1–2.3, 2.6
3. Support Sprint 3 tool pattern reviews

### Track B: Knowledge substrate integration
1. Sprint 2 tasks 2.4–2.5
2. Sprint 3 tasks 3.3–3.4
3. Sprint 4 onwards support for audit + artifact consistency

### Track C: Host adapter + MCP runtime
1. Sprint 3 tasks 3.1–3.2
2. Sprint 3 task 3.5
3. Sprint 4 tasks 4.1–4.2
4. Sprint 6 reliability hardening

### Track D: OpenClaw bridge + governor UX
1. Sprint 3 task 3.6
2. Sprint 4 tasks 4.3–4.4
3. Sprint 5 compatibility shims
4. Sprint 6 degraded-mode behavior

### Track E: Migration + operations
1. Late Sprint 4 observability foundation
2. Sprint 5 shadow mode + compatibility + flagging
3. Sprint 6 runbooks + drills
4. Sprint 7 cutover + cleanup

### Minimum staffing shape
- 1 architecture/contract owner
- 1 host EMA + MCP backend owner
- 1 Wiki/vault integration owner
- 1 OpenClaw/Discord/operator UX owner
- 1 ops/reliability/security owner (can be fractional early, full later)

---

## Demoable Milestones

### Milestone A: Architecture Freeze
- Sprint 1 exit
- Deliverables: domain model, capability inventory, source-of-truth matrix, migration framing

### Milestone B: Contract Freeze
- Sprint 2 exit
- Deliverables: MCP v1 spec, event model, authz model, Wiki/vault write model

### Milestone C: First End-to-End Slice
- Sprint 3 exit
- Deliverables: working vertical slice from OpenClaw to host EMA to Wiki/vault and back

### Milestone D: Operational Babysitter 2.0
- Sprint 4 exit
- Deliverables: policy/governor/approval layer on top of MCP-driven actions

### Milestone E: Shadow Mode Confidence
- Sprint 5 exit
- Deliverables: parity reports, feature flags, dispatch-era de-primarying

### Milestone F: Production Readiness
- Sprint 6 exit
- Deliverables: retries, dead-lettering, degraded mode, security review, runbooks

### Milestone G: Cutover
- Sprint 7 exit
- Deliverables: MCP path is normal production path with rollback proven

---

## Testing Strategy

### Contract Tests
- Validate MCP schemas, error semantics, idempotency behavior, and async job handles.

### Adapter Tests
- Validate CLI wrapping, stdout/stderr normalization, timeouts, cancellations, and trace propagation.

### Integration Tests
- Exercise end-to-end flows from OpenClaw caller through MCP into host EMA and back through Wiki/vault outputs.

### Policy Tests
- Verify approval gating, policy blocks, escalation, and audit entries.

### Migration/Parity Tests
- Compare legacy vs new path outputs in shadow mode.

### Chaos/Failure Tests
- Host unavailable
- Wiki Engine unavailable
- Vault write fails after host action succeeded
- OpenClaw disconnects mid-run
- Duplicate request/retry with same idempotency key

---

## Potential Risks and Gotchas

1. **MCP contract too thin or too chat-centric**
   - Risk: Bakes Discord/OpenClaw assumptions into the interface.
   - Mitigation: Define client-neutral contract first; keep OpenClaw formatting at the edge.

2. **Wiki Engine polluted with transient runtime noise**
   - Risk: Canonical second-brain becomes unreadable.
   - Mitigation: Strict durable-write rules; route verbose logs to vault or operational stores.

3. **Babysitter quietly becomes orchestration brain again**
   - Risk: Recreates old governor coupling and state sprawl.
   - Mitigation: Policy-only boundaries, explicit architecture tests, and code ownership separation.

4. **dispatch.db assumptions survive in hidden corners**
   - Risk: Partial migrations create split-brain behavior.
   - Mitigation: Search-based audits, runtime telemetry, and shadow-mode discrepancy reports.

5. **CLI wrapping is brittle**
   - Risk: Human-oriented output formats break adapters.
   - Mitigation: Prefer machine-readable CLI modes if available; add normalization layer; eventually expose internal APIs if needed.

6. **Cross-system write ordering issues**
   - Risk: Host action succeeds but Wiki/vault write fails, leaving partial truth.
   - Mitigation: Trace IDs, compensating updates, dead-letter + replay tooling, clear status markers.

7. **OpenClaw backup mode becomes a hidden source of truth**
   - Risk: Offline/degraded-mode state diverges permanently.
   - Mitigation: Queue intent only, reconcile explicitly, avoid independent durable orchestration state.

8. **Overexposing powerful host EMA operations via MCP**
   - Risk: Security and safety problems.
   - Mitigation: risk tiers, authz model, approval gates, and audit by default.

---

## Rollback Plan

### Code/Release Rollback
- Use feature flags to disable MCP-backed write/control paths independently from read/query paths.
- Preserve legacy compatibility shims until two stable release cycles complete.
- Keep direct emergency host admin path out-of-band and operator-restricted.

### Data/State Rollback
- Do not rely on dispatch.db as fallback primary.
- Ensure Wiki writes are append-only or revisioned where possible.
- Mark partial or failed runs explicitly rather than deleting evidence.
- Use vault artifact retention and trace IDs to reconstruct/replay failed workflows.

### Operational Rollback
- Revert traffic by workflow class: admin/control first, then delegation, then routine writes, then reads if necessary.
- Maintain shadow mode tooling through early production to assess regressions.

---

## Suggested First Three Weeks (if starting immediately)

### Week 1
- Finish Sprint 1 architecture baseline
- Decide canonical entity model and source-of-truth matrix
- Inventory top 20 host EMA capabilities

### Week 2
- Finish MCP v1 draft + event model + authz model
- Finish Wiki/vault write model
- Pick two thin-slice workflows

### Week 3
- Stand up MCP skeleton + host adapter + Wiki/vault writers
- Demo first thin slice from OpenClaw into host EMA and back with durable outputs

---

## Recommendation

Do **not** try to expose all host EMA functionality through MCP before proving the thin slice. The safest order is:

1. Freeze nouns and ownership
2. Freeze contract and write model
3. Ship one complete slice
4. Reintroduce babysitter as policy only
5. Expand coverage
6. Migrate and harden
7. Cut over progressively

That sequencing is the shortest path that avoids recreating the old “Discord/OpenClaw governor accidentally became the system” trap.
