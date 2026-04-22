# Dispatch Engine Invariants — 2026-04-06

This document defines the operational invariants that should remain true for `dispatch-engine.sh`.

---

## Why this matters

`dispatch-engine.sh` is a control plane, not a helper script.
Without explicit invariants, any future cleanup risks breaking subtle lifecycle assumptions.

---

## Core lifecycle invariants

## 1. A task should occupy one primary lifecycle bucket at a time

Expected primary buckets:
- `queue/`
- `active/`
- `partial/`
- `done/`
- `failed/`

Invariant:
- a task should not silently exist in multiple primary buckets as authoritative state

---

## 2. Lock state should agree with active work state

Invariant:
- if a task is dispatched and active, lock state should exist or be reconstructable
- when a task completes/fails/times out, lock state should be released

Why:
- stale locks create phantom contention
- missing locks enable duplicate dispatch

---

## 3. Completion must mean more than process exit

Invariant:
- success should require both:
  - acceptable process termination/result status
  - result artifact that is not merely error output

Why:
- process exit alone is not trustworthy
- the engine already partially enforces this and should keep doing so

---

## 4. Timeout handling must preserve truthfulness

Invariant:
- timeouts should not silently become `done`
- partial progress should remain explicitly partial
- ambiguous outcomes should remain ambiguous, not upgraded to success

Why:
- timeout semantics define trust in the substrate

---

## 5. Dependency checks must block execution, not disappear silently

Invariant:
- blocked tasks remain blocked/queued until deps resolve
- dependency failure should be observable in logs/state

Why:
- hidden dependency bypasses break orchestration logic

---

## 6. Malformed tasks should be quarantined, not half-processed

Invariant:
- invalid JSON or structurally invalid tasks move to explicit failure/quarantine handling
- malformed tasks should not contaminate normal lifecycle buckets invisibly

---

## 7. Feed/event emission should be secondary to lifecycle truth

Invariant:
- notifications are downstream artifacts
- queue/active/done/failed truth should not depend on feed posting success

Why:
- observability should not own core state

---

## 8. Circuit breaker state should bias toward safety

Invariant:
- repeated agent failures should reduce dispatch aggressiveness
- recovery from open circuit should be explicit and observable

---

## 9. Dashboard/shared state files are derived artifacts

Files like:
- `active-tasks.json`
- `agent-status.json`

Invariant:
- these are generated views, not canonical state
- canonical truth remains underlying task stores / DB

---

## 10. Canonical state should be named clearly

Current reality appears mixed:
- filesystem buckets
- SQLite helpers
- generated views

Invariant:
- if mixed-mode continues, canonical vs derived state must stay explicit in docs

---

## Most important invariants to protect first

1. no false success
2. no duplicate active ownership
3. no silent dependency bypass
4. no lock leaks
5. no timeout truth corruption

---

## Smells indicating invariant drift

- tasks moved to `done/` without credible result artifact
- tasks active without lock
- same task appearing authoritative in multiple buckets
- dead PID interpreted as success
- feed/log success used as proxy for task success
- dashboard files treated as source of truth

---

## Bottom line

If future cleanup preserves these invariants, the engine can evolve safely.
If it breaks them, dispatch becomes folklore-driven very quickly.
