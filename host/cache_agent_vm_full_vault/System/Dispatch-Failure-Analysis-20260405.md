---
title: "Dispatch Failure Analysis 2026-04-05"
type: reference
created: 2026-04-05
tags: [dispatch, failures, ops, api-key, ema]
summary: "Analysis of 42 failed dispatch tasks. Root cause: Invalid API key. 34 archived, 8 kept for review."
---

# Dispatch Failure Analysis — 2026-04-05

**Task ID:** task-42f425a3
**Analyzed at:** 2026-04-05 ~09:15Z
**Total failures found:** 42 tasks in `/home/trajan/dispatch/failed/`

## Root Cause: Invalid API Key (83%)

**35 of 42 failures** share the same failure reason: `result file contains error output, not real work`

The actual result file contents reveal: `Invalid API key · Fix external API key`

This is a systemic authentication failure — researcher/coder agents were dispatched but couldn't authenticate with the external API (likely Anthropic's API via the researcher agent toolchain). **No actual work was done** on these tasks.

> Cross-reference: `cross-poll-auth-migration-b345273e` suggests Anthropic banned OAuth-based Claude subscriptions on 2026-04-04, which may be the root cause of this API key failure cascade.

## Failure Breakdown

| Reason | Count | Notes |
|--------|-------|-------|
| result file contains error output (Invalid API key) | 35 | Systemic auth failure |
| exit code 0 (empty result) | 4 | vault-improve 040007 series (3) + ema-brain-backend (1) |
| null or empty task description | 2 | Malformed task generation |
| zombie — PID dead, no result | 1 | Stale task |

## Agent Breakdown

| Agent | Failures |
|-------|---------|
| researcher | 29 |
| coder | 7 |
| utility | 4 |
| vault-keeper | 2 |

## Task Categories

| Category | Count | Disposition |
|----------|-------|-------------|
| vault-improve | 20 | Archived (recurring loop regenerates) |
| reddit-intel | 6 | Archived (stale daily digests, have successful runs) |
| utility-task (analyze-failures) | 4 | Archived (self-referential, resolved by task-42f425a3) |
| cross-poll | 3 | **KEPT** (unresolved research tasks) |
| ema-impl (bridge/campaign/brain) | 5 | **KEPT** (feature work still needed) |
| proactive vault-keeper | 2 | Archived (recurring, will regenerate) |
| malformed null-description | 2 | Archived (superseded) |

## Actions Taken

**34 tasks moved to `/home/trajan/dispatch/failed/archive/`:**
- 20 vault-improve tasks (all time slots: 040007–040010)
- 6 reddit-intel digest tasks (2026-04-04 and 2026-04-05 stale attempts)
- 4 prior utility analyze-failures tasks (task-09b085e1, 1f25de6c, 2559316d, 76abe008)
- 2 proactive vault-keeper tasks
- 2 malformed tasks (babysitter-resume and bridge-async with null descriptions)

## 8 Tasks Kept (Require Attention)

### Critical / Feature Work
1. **cross-poll-auth-migration-b345273e** — URGENT OAuth ban research (2026-04-04 deadline passed, may be stale but root cause of failure cascade)
2. **ema-brain-backend-sessions-1775272551** — EMA Brain Backend: sessions, TUI proxy, shadow monitor, ApiKey adapter (exit code 0, unclear if done)

### EMA Blockers (duplicate pairs — same feature, two attempts)
3. **bridge-async-1775360160** — Implement async Bridge dispatch (Blocker #1)
4. **ema-basync-1775360196** — Same as above, second attempt
5. **campaign-flow-1775360160** — Write Ema.Campaigns.Flow state machine (Blocker #3)
6. **ema-cflow-1775360196** — Same as above, second attempt

### Cross-pollination Research
7. **cross-poll-monty-8ecf9953** — pydantic/monty secure Python interpreter for EMA
8. **cross-poll-workmux-e7ac84f5** — workmux parallel agent workflow for EMA

## Key Recommendation

The API key failure cascade needs to be fixed before any of the remaining 8 tasks can succeed. The `cross-poll-auth-migration-b345273e` task was researching exactly this problem. Resolving the API authentication issue is the prerequisite for clearing the remaining failures.

## Links
- [[System/OpenClaw]] — System overview
- [[System/EMA]] — EMA daemon architecture
