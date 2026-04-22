---
id: "0ea9128a-5b53-4715-a378-15f1232ba8d4"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Production Readiness Audit
tags: [audit, production, reliability, critical]
source: session-2026-04-07
---

# Production Readiness Audit — 13 Issues

## CRITICAL (Fix Before Heavy Usage)

### 1. String.to_integer crash on bad input
temporal_controller.ex:69 — use Integer.parse with fallback

### 2. Proposal pipeline race condition
Refiner/Debater/Scorer write same proposal concurrently. Last write wins.
Fix: optimistic locking with version field.

### 3. Missing input validation on REST API
proposal_controller.ex — no length limits, type checks, or required field validation.
Fix: changeset validation on all controllers.

## HIGH (Fix This Week)

### 4. 254 bare rescue blocks across codebase
Silent failures make debugging impossible. Replace with specific exception handling.

### 5. PubSub subscription leaks (35+ channels, only 8 unsubscribe)
Memory leak: ~1MB per 1K connections. Add unsubscribe to all terminate/2.

### 6. Unbounded ETS/MapSet growth
babysitter.ex seen_message_ids grows forever. Cap at 1000 entries.

### 7. Missing database indexes
tasks.responsibility_id, proposals.seed_id, proposals.project_id lack indexes.
SQLite single-writer — missing indexes cause write contention.

### 8. Missing timeouts on GenServer calls
agent_worker.ex 180s hardcoded. If Claude hangs, blocks entire worker.

## MEDIUM (Fix This Sprint)

### 9. Dispatch failures not escalated (silent)
### 10. Session watcher race condition (duplicate/conflicting state)
### 11. Hardcoded timeouts (not configurable)
### 12. Task supervisor errors silently dropped
### 13. Stale vault data drift (DB vs disk)

## Verdict: NOT READY for heavy usage
Timeline: 1-2 weeks focused remediation.
