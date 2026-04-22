# EMA Dispatch-Ready Task Pack

> Atomic task pack derived from the bootstrap backlog.
> These are sized for direct execution and dependency tracking.

## Pack Goal

Get EMA to a first reliable self-building loop without introducing new subsystems.

---

## P1 — Canonical Intent Bootstrap

### TASK P1.1 — Document canonical Day 1 runtime intent schema
- **Goal:** Make `control_plane_intents` the explicit bootstrap runtime truth.
- **Inputs:**
  - `docs/DATA_MODELS.md`
  - `daemon/lib/ema/control_plane/schema.ex`
- **Outputs:**
  - doc clarification committed
- **Depends on:** none
- **Validation:**
  - grep finds explicit note naming `control_plane_intents` as Day 1 canonical runtime intent schema

### TASK P1.2 — Document Day 1 authority split
- **Goal:** Lock vault vs DB vs `.superman` boundaries.
- **Inputs:**
  - `docs/SUPERMAN-FOLDER-SYSTEM-SPEC.md`
  - bootstrap refinement doc
- **Outputs:**
  - authority section committed
- **Depends on:** P1.1
- **Validation:**
  - doc contains explicit split for semantic truth / runtime truth / scratchpad

### TASK P1.3 — Document bootstrap ingestion rules
- **Goal:** Prevent proposal/log/reflexion pollution.
- **Inputs:**
  - bootstrap refinement doc
- **Outputs:**
  - Day 1 ingestion rule section committed
- **Depends on:** P1.1, P1.2
- **Validation:**
  - docs explicitly say only `intent/README.md` and execution delta can create intents during bootstrap

---

## P2 — Intent / Proposal / Execution Wiring

### TASK P2.1 — Trace approved proposal binding path
- **Goal:** Identify where approved proposals attach to intent context now.
- **Inputs:**
  - control-plane controllers/store/tests
- **Outputs:**
  - file/function map
  - exact patch points
- **Depends on:** P1.3
- **Validation:**
  - written trace exists with proposal approval → execution start linkage

### TASK P2.2 — Implement execution completion → parent intent status update
- **Goal:** Parent intent status changes based on explicit execution result.
- **Inputs:**
  - execution completion endpoint
  - control-plane store/schema
- **Outputs:**
  - code patch
  - test covering update path
- **Depends on:** P2.1
- **Validation:**
  - execution completion updates linked intent status idempotently

### TASK P2.3 — Implement single follow-on intent creation rule
- **Goal:** Create one child intent only from explicit execution delta.
- **Inputs:**
  - execution completion payload
  - control-plane intent store
- **Outputs:**
  - code patch
  - idempotency guard
  - test coverage
- **Depends on:** P2.2
- **Validation:**
  - one child created from blocker/unmet AC/next step
  - duplicate calls do not create duplicates

### TASK P2.4 — Bootstrap loop test fixture
- **Goal:** Prove one full loop.
- **Inputs:**
  - existing control-plane controller tests
- **Outputs:**
  - end-to-end bootstrap test
- **Depends on:** P2.3
- **Validation:**
  - root intent → proposal → execution → parent update → child intent test passes

---

## P3 — Dispatch Recovery

### TASK P3.1 — Inspect dispatch degraded state and open circuit
- **Goal:** classify current dispatch failure.
- **Inputs:**
  - daemon logs
  - dispatch DB / queue state
  - runtime status endpoints
- **Outputs:**
  - short failure report
- **Depends on:** none
- **Validation:**
  - one identified root cause for degraded dispatch and open researcher circuit

### TASK P3.2 — Restore queue consumer
- **Goal:** get queued work moving again.
- **Inputs:**
  - dispatch worker / scheduler / queue consumer path
- **Outputs:**
  - restart/fix patch or runbook
- **Depends on:** P3.1
- **Validation:**
  - one queued item transitions out of queued state

### TASK P3.3 — Verify execution state propagation into control-plane
- **Goal:** ensure dispatch state flows into control-plane execution records.
- **Inputs:**
  - control-plane store
  - dispatch integration path
- **Outputs:**
  - verification notes and patch if needed
- **Depends on:** P3.2
- **Validation:**
  - claimed/running/completed visible in control-plane state

---

## P4 — Runtime Routing and Session Binding

### TASK P4.1 — Stabilize resumed provider session status after restart
- **Goal:** remove resume/status race for Codex and Claude.
- **Inputs:**
  - `surfaces_controller.ex`
  - provider session modules
  - runtime registry
- **Outputs:**
  - code patch
  - regression test or reproducible validation steps
- **Depends on:** none
- **Validation:**
  - resumed session status is available immediately after resume

### TASK P4.2 — Auto-bind thread ↔ execution ↔ host session
- **Goal:** make surface binding the default path.
- **Inputs:**
  - host-session bindings
  - runtime registry
  - surface controller routes
- **Outputs:**
  - code patch or flow glue
- **Depends on:** P4.1
- **Validation:**
  - a bound thread can resolve execution and host session IDs without manual repair

### TASK P4.3 — Define provider routing policy
- **Goal:** make Claude/Codex selection explicit.
- **Inputs:**
  - current provider routing logic
  - host session/runtime capabilities
- **Outputs:**
  - documented policy + patch points
- **Depends on:** P4.2
- **Validation:**
  - routing rules are explicit and testable

---

## P5 — MCP and Discord Activation

### TASK P5.1 — Audit current MCP/tool capability usage
- **Goal:** inventory shared vs divergent capabilities.
- **Inputs:**
  - Claude provider path
  - Codex provider path
  - current tool calls in session history/examples
- **Outputs:**
  - capability matrix
- **Depends on:** none
- **Validation:**
  - matrix lists required shared capabilities and current gaps

### TASK P5.2 — Enable Discord outbound surface
- **Goal:** make EMA broadcasts reach Discord.
- **Inputs:**
  - runtime env/config
  - broadcast path
- **Outputs:**
  - config fix
  - test evidence
- **Depends on:** none
- **Validation:**
  - no skipped emits due to missing token/config

### TASK P5.3 — Verify bound-thread result delivery
- **Goal:** ensure a thread-bound execution returns output to the same thread.
- **Inputs:**
  - binding path
  - Discord outbound path
- **Outputs:**
  - test evidence / runbook notes
- **Depends on:** P5.2, P4.2
- **Validation:**
  - execution start/result/update land in the bound thread

---

## Recommended Dispatch Order

1. P1.1
2. P1.2
3. P1.3
4. P2.1
5. P2.2
6. P2.3
7. P2.4
8. P3.1
9. P3.2
10. P3.3
11. P4.1
12. P4.2
13. P4.3
14. P5.1
15. P5.2
16. P5.3

## Definition of Success

EMA can run one clean bootstrap loop:
- root intent exists
- proposal approved
- execution runs
- execution completion updates intent
- one child intent is created only if explicitly warranted
- runtime/session/provider binding remains stable
- result can surface back to the bound thread
