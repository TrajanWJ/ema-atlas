---
created: '2026-03-18'
tags:
  - architecture
  - error-recovery
  - dispatch
  - pipeline
  - reliability
status: implemented
source: pipeline-error_recovery-20260318-150001-proposal
title: Error Recovery Improvements - 2026-03-18
updated: '2026-03-19'
type: knowledge
wiki_id: system/architecture/Error_Recovery_Improvements_-_2026-03-18
imported_from: vault/Architecture/Error Recovery Improvements - 2026-03-18.md
imported_at: '2026-04-04T00:23:56.750Z'
summary: ''
---

# Error Recovery Improvements (15:00 Proposal — Implemented)

Implemented 5 reliability improvements to the dispatch pipeline, building on the 09:00 UTC proposal (retry/backoff, structured errors, reflexion, checkpointing, human escalation).

## Implemented Files

All utilities live in `/home/trajan/dispatch/utils/`:

| File | Improvement | Purpose |
|---|---|---|
| `utils/pipeline_state.py` | #4 Partial Completion Tracking | Skip completed stages on retry |
| `utils/dlq.py` | #2 Dead-Letter Queue | Auto-replay failed tasks |
| `scripts/dlq_worker.py` | #2 DLQ Worker | Cron worker to process DLQ |
| `utils/idempotency.py` | #3 Idempotent Tool Design | Deduplicate tool calls on retry |
| `utils/rate_budget.py` | #5 Rate-Limit Budget Manager | Adaptive throttling from response headers |
| `utils/circuit_breaker.py` | #1 Circuit Breaker | Block calls to degraded services |

---

## 1. Partial Completion Tracking (`pipeline_state.py`)

**Problem:** Pipeline crashes during `verify` → restarts from `assess`, wasting all prior work.

**Solution:** Stage outputs are persisted to pipeline JSON. On retry, each stage checks if it already completed and returns cached output.

```python
from dispatch.utils.pipeline_state import (
    get_stage_output, mark_stage_complete, mark_stage_failed
)

# At the start of each stage:
prior = get_stage_output(pipeline_id, "research")
if prior:
    return prior  # skip — already done

# After completion:
mark_stage_complete(pipeline_id, "research", {"output_file": "/path/to/result.md"})
```

Pipeline JSON schema gains `output` field per stage:
```json
"research": { "status": "complete", "output": {"output_file": "..."}, "completed": "..." }
```

---

## 2. Dead-Letter Queue (`dlq.py` + `scripts/dlq_worker.py`)

**Problem:** Failed tasks accumulate in `failed/` indefinitely, requiring manual replay.

**Solution:** Failed tasks enter a DLQ with exponential retry schedule. A cron worker runs every 5 minutes to replay ready tasks.

Retry schedule: 5min → 10min → 20min → 40min → permanent failure (alert sent to mailbox).

```python
from dispatch.utils.dlq import enqueue_dlq

# Replace write-to-failed/ with:
enqueue_dlq(task_id, payload, failure_reason="LLM timeout after 30s")
```

**Cron entry added:**
```
*/5 * * * * /usr/bin/python3 /home/trajan/dispatch/scripts/dlq_worker.py >> /tmp/dlq-worker.log 2>&1
```

---

## 3. Idempotent Tool Design (`idempotency.py`)

**Problem:** Retried tasks may double-write, duplicate API calls, or corrupt state.

**Solution:** SHA-256 op IDs keyed on tool name + args. Cache checked before execution. Atomic file writes via temp-then-rename.

```python
from dispatch.utils.idempotency import idempotent, atomic_write

@idempotent(ttl_seconds=3600)
def call_search_api(query: str, max_results: int = 10):
    ...  # only executed once per unique (query, max_results) combination

# Safe file write:
atomic_write("/path/to/output.md", content)
```

Cache lives at `/tmp/idempotency-cache.json`. The DLQ worker evicts expired entries on each run.

---

## 4. Rate-Limit Budget Manager (`rate_budget.py`)

**Problem:** Concurrent tasks burst the API simultaneously, causing rate-limit cascades.

**Solution:** Parse `x-ratelimit-remaining-*` headers from every response. Adaptive throttle: 1s delay at <20%, 5s at <10%, block at <5%.

```python
from dispatch.utils.rate_budget import get_budget, update_budget_from_response, BudgetExhausted

# After every API call:
update_budget_from_response("claude-sonnet-4-6", response.headers)

# Before next call:
try:
    get_budget("claude-sonnet-4-6").wait_if_needed()
except BudgetExhausted as e:
    # park task until e.retry_after
    ...
```

Status written to `/tmp/budget-status.json` for operator monitoring.

---

## 5. Circuit Breaker (`circuit_breaker.py`)

**Problem:** When a service degrades, naive retries flood it with requests, extending the outage.

**Solution:** 3-state machine (closed/open/half-open). After 5 consecutive failures, blocks calls for 30s (doubling per successive trip, max 5min). Probes with one call after cooldown.

```python
from dispatch.utils.circuit_breaker import get_breaker, CircuitOpenError

try:
    result = get_breaker("anthropic_api").call(make_api_call, prompt)
except CircuitOpenError as e:
    # Park task: retry after e.retry_after
    ...
```

State persisted to `/tmp/circuit-breakers.json` so restarts don't reset a legitimately open breaker. Each service type gets its own independent breaker.

---

## Integration Notes

- All modules have smoke tests that pass.
- The DLQ worker cron (`*/5 * * * *`) has been added to crontab.
- All file writes use atomic temp-then-rename pattern.
- `dispatch/utils/` and `dispatch/scripts/` now have `__init__.py` for import as packages.
- New directories: `dispatch/dlq/`, `dispatch/failed-permanent/`, `dispatch/utils/`, `dispatch/scripts/`.

## Prior Work Reference

- 09:00 UTC proposal: `pipeline-error_recovery-20260318-090001-proposal.md`
- 15:00 UTC proposal: `pipeline-error_recovery-20260318-150001-proposal.md`
- Recommended combined order: structured errors + retry-backoff → partial completion tracking → DLQ + idempotency → reflexion + checkpointing → circuit breaker + budget manager → human escalation.
