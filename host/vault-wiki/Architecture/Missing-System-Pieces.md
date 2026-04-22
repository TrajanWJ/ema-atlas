---
id: "34cba5b3-a4bf-4213-b291-a450a7ae49bb"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Missing System Pieces for Production
tags: [architecture, production, gaps, critical]
source: session-2026-04-07
---

# 8 Missing System Pieces

## 1. Undo/History (Ema.Chronicle)
Append-only event log + soft deletes. Every mutation records prev_state_json.
Reverter can replay previous state. Cap at 90 days.

## 2. Context Budget (Ema.ContextBudget)
Token allocation: 30% system, 20% entities, 20% history, 15% wiki, 15% buffer.
Relevance scoring: recency decay × frequency × semantic similarity × graph distance.
Compression cache in ETS, invalidated via PubSub.

## 3. Agent Coordination (Ema.Agents.Coordinator)
Git worktrees per agent per project. Never touch main directory.
Coordinator tracks active worktrees. MergeResolver handles conflicts.

## 4. Cost Governor (Ema.CostGovernor)
Tiered auto-degradation: 50% → pause engine, 75% → downgrade models, 90% → agent-only, 100% → stop.
Per-domain budgets with retroactive cost attribution.

## 5. Session Continuity (Ema.Sessions.Continuum)
Periodic checkpointing (60s): intent, files, conversation, git diff.
DeathHandler: assess completion → complete/interrupted/failed.
Context-rich resumption prompts from checkpoint data.

## 6. Data Lifecycle (Ema.Lifecycle)
Retention policies per entity type (30-365 days). Daily archiver at 3 AM.
Weekly SQLite VACUUM + FTS rebuild. Table size monitoring.

## 7. Multi-Project Coordination (Ema.ProjectGraph)
Cross-project intent DAG. Critical path computation.
Propagator: completing a dependency auto-unblocks downstream.
Cross-project context in agent prompts.

## 8. Feedback Loop Completion (Ema.Feedback.SeedEvolver)
Seeds that produce approved proposals fire more often.
Seeds that produce killed proposals auto-deactivate.
KillMemory needs temporal decay (old kills lose suppressive power).
Evolution engine becomes policy layer for proposal self-improvement.

## The Real Gap
Not features — WIRING. 40+ supervised processes, many not connected.
Need: end-to-end integration test proving full loop closes.
Need: daily OTP health digest (restarts, pauses, failures).
