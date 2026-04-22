# EMA Bootstrap Workload Backlog

> Ordered workload bundle for getting EMA to a first working self-building loop.
> This is a queue, not a redesign.

## Objective

Make one root intent reliably produce:
- one approved proposal
- one execution
- one parent intent update
- one valid follow-on child intent

with runtime routed through EMA and provider/session bindings preserved.

---

## Sprint 1 — Make the Loop Valid

### T0.1 Canonical Day 1 intent schema
- Pick and document the single runtime intent schema for bootstrap.
- Acceptance:
  - no ambiguity between `intent_nodes` and `control_plane_intents`
  - Day 1 runtime truth explicitly named

### T0.2 Authority split lock
- Document:
  - vault/wiki = meaning
  - intents DB = runtime state
  - `.superman` = scratchpad
- Acceptance:
  - no repo doc incorrectly implies global authority for `.superman/metadata.json`

### T0.3 Bootstrap ingestion rules
- Lock Day 1 creation sources to:
  - `intent/README.md`
  - execution completion delta only
- Acceptance:
  - proposals/reflexions/logs do not create intents during bootstrap

### T1.1 Proposal-to-intent binding
- Approved proposals bind to an existing intent.
- Acceptance:
  - draft/queued/redirected proposals do not create intent nodes

### T1.2 Execution-to-intent status update
- Completed execution updates parent intent status.
- Acceptance:
  - update path is idempotent
  - status can become complete/partial/blocked based on explicit result

### T1.3 Single follow-on intent rule
- Create one child intent only from explicit unmet work.
- Acceptance:
  - child intent requires blocker / unmet AC / next step
  - duplicate child creation prevented

### T1.4 Minimal bootstrap loop test
- Prove: root intent → approved proposal → execution → parent update → optional child intent.
- Acceptance:
  - loop runs end-to-end once without ad hoc manual repair

---

## Sprint 2 — Make the Engine Alive

### T2.1 Inspect dispatch engine state
- Determine why dispatch is degraded.
- Acceptance:
  - root cause written down
  - queue consumer status verified

### T2.2 Diagnose open researcher circuit
- Identify why the researcher lane is circuit-open.
- Acceptance:
  - failure mode classified
  - reset path identified

### T2.3 Restore queue consumption
- Get queued work moving again.
- Acceptance:
  - at least one queued item is processed
  - dispatch remains stable after restart

### T2.4 Execution-state propagation
- Ensure dispatch activity updates executions/intents/project state correctly.
- Acceptance:
  - claimed/running/completed state visible in control-plane state

---

## Sprint 3 — Make Runtime Routing Real

### T3.1 Default host-session binding path
- Imported host sessions become resumable runtime anchors.
- Acceptance:
  - Claude resumes cleanly
  - Codex resumes cleanly

### T3.2 Thread ↔ execution ↔ host-session binding
- Bind thread/channel surfaces to execution and host-session IDs.
- Acceptance:
  - thread id maps to execution id
  - execution id maps to host session id

### T3.3 Claude/Codex parity hardening
- Remove status/prompt race and provider asymmetry.
- Acceptance:
  - status works immediately after resume
  - prompt routing works for both providers

### T3.4 Provider routing policy
- Make Claude vs Codex selection and fallback explicit.
- Acceptance:
  - routing rules documented and enforced

---

## Sprint 4 — Normalize Capabilities and Surface

### T4.1 MCP capability audit
- Inventory actual MCP/tool usage across providers.
- Acceptance:
  - shared capability list produced
  - provider gaps listed

### T4.2 Shared MCP contract
- Define the minimum cross-agent capability set.
- Acceptance:
  - filesystem / code search / git / docs / memory contract defined

### T4.3 Provider gap closure
- Make all engines use the same effective MCP-backed surface.
- Acceptance:
  - missing MCP capabilities fail loudly

### T5.1 Discord outbound config
- Enable EMA broadcast back into Discord.
- Acceptance:
  - outbound token/config present
  - no skipped broadcasts due to missing token

### T5.2 Thread emission test
- Verify execution updates reach the bound thread.
- Acceptance:
  - execution start/result/update messages land

### T5.3 Bound thread operator flow
- Make the thread-backed runtime feel native.
- Acceptance:
  - prompt in thread resolves provider/session path and replies into same thread

---

## Sprint 5 — Prove Bootstrap

### T6.1 Controlled bootstrap scenario
- Run a single clean root intent through the full system.
- Acceptance:
  - one valid self-building loop completes

### T6.2 Pollution check
- Verify system is not self-spamming.
- Acceptance:
  - no intents from draft proposals/logs/reflexions/chat
  - no duplicate child intents

### T6.3 Operator runbook
- Document the 5–7 step bootstrap flow.
- Acceptance:
  - a human can trigger the loop without guessing

---

## Priority Order

1. **Sprint 1** — loop validity
2. **Sprint 2** — dispatch recovery
3. **Sprint 3** — runtime routing
4. **Sprint 4** — MCP + Discord surface
5. **Sprint 5** — proof / runbook

## Single Highest Priority

Deliver **Sprint 1 + Sprint 2** before anything else.
