---
id: "e60f37ef-1827-419e-b254-3a105edde748"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Production Readiness — Full Checklist
tags: [operations, production, checklist, critical]
source: session-2026-04-07
---

# Production Readiness Checklist

## CRITICAL (Must Fix Before Daily Use)

### Backend (13 issues)
- [ ] Enable SQLite foreign keys (PRAGMA — 5 min)
- [ ] Fix String.to_integer crash (temporal_controller — 10 min)
- [ ] Add proposal pipeline optimistic locking (prevent race condition)
- [ ] Add missing DB indexes (executions.task_id + compound indexes)
- [ ] Cap unbounded MapSet growth (babysitter seen_message_ids)
- [ ] Add PubSub unsubscribe to 35+ channel terminate/2 callbacks
- [ ] Add input validation to REST controllers (length limits, type checks)

### Frontend (3 P0 issues)
- [ ] Wrap App + each vApp in ErrorBoundary (2h)
- [ ] Add list virtualization to ProposalQueue/TaskList (4h)
- [ ] Fix WebSocket channel reconnection handlers (2h)

### Infrastructure
- [ ] Implement SQLite backup (3-tier: auto/on-demand/recovery)
- [ ] Wire global hotkeys (CmdOrCtrl+Shift+Space capture)
- [ ] Add desktop notifications (tauri-plugin-notification)

## HIGH (Fix This Sprint)
- [ ] CLI autocomplete (bash/zsh/fish)
- [ ] Structured logging with rotation
- [ ] Offline mode detection + Ollama fallback
- [ ] API documentation (OpenAPI for top 30 endpoints)
- [ ] Connection status indicator in frontend

## Architecture Gaps (Designed, Not Built)
- [ ] Undo/History system (Ema.Chronicle)
- [ ] Context budget allocation (Ema.ContextBudget)
- [ ] Agent coordination via worktrees (Ema.Agents.Coordinator)
- [ ] Cost governor with tier auto-degradation (Ema.CostGovernor)
- [ ] Session continuity with checkpointing (Ema.Sessions.Continuum)
- [ ] Data lifecycle with archival (Ema.Lifecycle)
- [ ] Feedback loop completion (Ema.Feedback.SeedEvolver)

## Resilience Patterns to Add
- [ ] Exponential backoff + jitter on API calls (ElixirRetry)
- [ ] Circuit breaker on Claude Bridge (external_service lib)
- [ ] Error classification (transient vs permanent vs escalate)
- [ ] GenServer state persistence for crash recovery
- [ ] Rate limiting per agent (ExRated token bucket)
- [ ] Telemetry spans on all critical paths
- [ ] Two-level health checks (liveness + progress)
- [ ] State checkpointing for long-running tasks
