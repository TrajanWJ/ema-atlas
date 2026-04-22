---
id: "9da48fcd-1820-4e92-9322-a2bf6250ab3a"
title: "EMA Feature Priority Matrix"
space: projects
tags: ["ema"]
source: manual
---

# FEATURE_PRIORITY_MATRIX.md — EMA Phase 3+ Priority Rankings

> **Generated:** 2026-04-03  
> **Methodology:** Sorted by (Impact / Effort), with hard dependency ordering applied.  
> **Key:** Phase 2 = W7-W8 (current). Phase 2.5 = W8 parallel tracks. Phase 3 = W9-W10. Phase 4 = W11+.

---

## Priority Matrix

```
Rank | Feature                          | Impact | Effort | I/E   | Dependencies              | Owner          | Phase | Week
-----|----------------------------------|--------|--------|-------|---------------------------|----------------|-------|-----
1    | Outcome Learning Dashboard       | 9      | 2d     | 4.5   | Outcome tracker populated | Coder          | 2.5   | W8
2    | Proposal Visualization Explorer  | 8      | 2d     | 4.0   | Deliberation Gate (W7)    | Coder          | 2.5   | W8
3    | Vault Auto-Sync                  | 7      | 2d     | 3.5   | EMA event streams (exist) | Ops/Coder      | 2.5   | W8
4    | Agent Reflection Loop            | 9      | 3d     | 3.0   | Bridge async (Phase 2)    | Coder          | 3     | W9
5    | EMA CLI                          | 8      | 3d     | 2.7   | EMA daemon running        | Coder          | 2.5   | W8
6    | Execution Audit Trail + Diffs    | 8      | 3d     | 2.7   | Bridge async + Reflection | Coder          | 3     | W9
7    | SOUL.md Editor + Testing         | 7      | 3d     | 2.3   | Prompts table (Phase 2)   | Coder + PE     | 3     | W10
8    | Session Capture + Active Memory  | 8      | 4d     | 2.0   | Reflection Loop (F4)      | Coder + VK     | 3     | W10
9    | Knowledge Graph Browser          | 7      | 4d     | 1.75  | Superman runtime (Phase 2)| Coder          | 4     | W11
10   | Multi-Space UI                   | 6      | 5d     | 1.2   | HQ wiring (W8)            | Coder          | 4     | W11+
```

---

## Expanded Detail

### Rank 1: Outcome Learning Dashboard

| Field | Value |
|---|---|
| **Impact** | 9/10 |
| **Effort** | 2 days |
| **I/E Ratio** | 4.5 ← highest |
| **Dependencies** | Phase 2 outcome tracker needs data (2-3 weeks of real tasks) |
| **Owner** | Coder |
| **Phase** | 2.5 |
| **Launch** | W8 |
| **Why first** | Data already exists. Frontend surface only. Makes every other learning loop visible and debuggable. Zero-risk to existing system. |
| **Risk** | Low. No schema changes. Read-only dashboard. |

---

### Rank 2: Proposal Visualization Explorer

| Field | Value |
|---|---|
| **Impact** | 8/10 |
| **Effort** | 2 days |
| **I/E Ratio** | 4.0 |
| **Dependencies** | Deliberation Gate ships W7 (populates richer proposal data) |
| **Owner** | Coder |
| **Phase** | 2.5 |
| **Launch** | W8 |
| **Why now** | Versioning schema is a small add-on. Visual payoff is immediate. Proposals already exist — timeline view works on day one. |
| **Risk** | Medium (schema migration for proposal_versions). Run as parallel track with Dashboard. |

---

### Rank 3: Vault Auto-Sync

| Field | Value |
|---|---|
| **Impact** | 7/10 |
| **Effort** | 2 days |
| **I/E Ratio** | 3.5 |
| **Dependencies** | EMA event streams (already exist via Phoenix Channels). VaultKeeper agent. |
| **Owner** | Ops |
| **Phase** | 2.5 |
| **Launch** | W8 |
| **Why now** | All infrastructure exists. Staleness is a silent tax on every agent dispatch. Fixing it early means better agent quality from W9 onward. |
| **Risk** | Low-medium. Vault writes need to be scoped (no full vault scans — just triggered updates). |

---

### Rank 4: Agent Reflection Loop

| Field | Value |
|---|---|
| **Impact** | 9/10 |
| **Effort** | 3 days |
| **I/E Ratio** | 3.0 |
| **Dependencies** | Bridge async dispatch (Phase 2 Track D, W7) |
| **Owner** | Coder |
| **Phase** | 3 |
| **Launch** | W9 |
| **Why this ranking** | Highest long-term value but needs Phase 2 bridge. Can't ship until W8 bridge is stable. The *engine* of the self-improvement loop — everything downstream (Session Capture, PromptOptimizer) needs this running. |
| **Risk** | Medium. Reflection prompt quality is critical — bad prompts produce noisy outcomes that degrade Scope Advisor. Prompt Engineer review required. |

---

### Rank 5: EMA CLI

| Field | Value |
|---|---|
| **Impact** | 8/10 |
| **Effort** | 3 days |
| **I/E Ratio** | 2.7 |
| **Dependencies** | EMA daemon running (already does). 2-3 new API endpoints needed. |
| **Owner** | Coder |
| **Phase** | 2.5 |
| **Launch** | W8 |
| **Why now** | No Phase 2 dependency. Unblocks agent-native EMA interaction immediately. Every future agent benefits the moment CLI exists. Can be built in parallel with Reflection Loop. |
| **Risk** | Low. CLI is a thin client. The 2-3 missing API endpoints are small adds. |
| **Note** | Start with Mix task implementation (fastest), upgrade to escript binary in Phase 4. |

---

### Rank 6: Execution Audit Trail + Diffs

| Field | Value |
|---|---|
| **Impact** | 8/10 |
| **Effort** | 3 days |
| **I/E Ratio** | 2.7 |
| **Dependencies** | Bridge async (Phase 2) + Agent Reflection Loop (for task boundaries) |
| **Owner** | Coder |
| **Phase** | 3 |
| **Launch** | W9 |
| **Why after Reflection** | Audit trail needs task completion events from Bridge. Reflection Loop defines the task lifecycle properly first. |
| **Risk** | Medium. File diff tracking has cross-platform complexity in Tauri. Rollback needs careful scoping (file-only, no API state). |

---

### Rank 7: SOUL.md Editor + Personality Testing

| Field | Value |
|---|---|
| **Impact** | 7/10 |
| **Effort** | 3 days |
| **I/E Ratio** | 2.3 |
| **Dependencies** | Prompts-as-data table + hot-reload (Phase 2 W7 setup task) |
| **Owner** | Coder + Prompt Engineer |
| **Phase** | 3 |
| **Launch** | W10 |
| **Why W10** | Needs Prompts table from W7. PromptOptimizer (Phase 2 W9) needs to ship first to generate candidates. Editor without optimization is less useful. |
| **Risk** | Medium. Monaco editor integration. Test suite quality (bad tests → misleading scores → bad SOUL.md deployed). |

---

### Rank 8: Session Capture + Active Memory

| Field | Value |
|---|---|
| **Impact** | 8/10 |
| **Effort** | 4 days |
| **I/E Ratio** | 2.0 |
| **Dependencies** | Agent Reflection Loop (F4) — reflection output feeds capture |
| **Owner** | Coder + Vault Keeper |
| **Phase** | 3 |
| **Launch** | W10 |
| **Why W10** | Needs Reflection Loop running for 1-2 weeks to have meaningful session data to capture. Starting W9 would produce thin notes. W10 is when there's enough data for this to add value. |
| **Risk** | Medium. Template quality is everything — bad templates → noisy vault → worse active memory. Invest in template design upfront. |

---

### Rank 9: Knowledge Graph Browser

| Field | Value |
|---|---|
| **Impact** | 7/10 |
| **Effort** | 4 days |
| **I/E Ratio** | 1.75 |
| **Dependencies** | Superman Knowledge Graph runtime (Phase 2 W9, Task J) |
| **Owner** | Coder |
| **Phase** | 4 |
| **Launch** | W11 |
| **Why W11** | Superman must ship and have time to ingest data. Graph is only useful once there's meaningful graph data (~2+ weeks of Superman running). |
| **Risk** | Medium. Graph performance with large vaults. `react-flow` handles ~500 nodes before perf issues — need smart culling. |

---

### Rank 10: Multi-Space UI

| Field | Value |
|---|---|
| **Impact** | 6/10 |
| **Effort** | 5 days |
| **I/E Ratio** | 1.2 ← lowest |
| **Dependencies** | HQ real-time wiring (Phase 2 W8). Stable data model (no more schema churn). |
| **Owner** | Coder |
| **Phase** | 4 |
| **Launch** | W11+ |
| **Why last** | Highest effort, lowest I/E ratio. Schema migration touches every table. Wait until EMA has 10+ active projects before this adds real value. |
| **Risk** | High. Schema migration blast radius is large. Middleware approach (space context header) is safer than touching every query individually. |

---

## Dependency Graph (Visual)

```
Phase 2 (W7) — Must ship first
├── Bridge async dispatch (Track D)
├── Deliberation Gate (Track F)
├── Prompts table + hot-reload (Setup)
└── Outcome tracker data (W7+)
         │
Phase 2.5 (W8) — Can run in parallel
├── Outcome Dashboard ←── outcome tracker
├── Proposal Explorer ←── Deliberation Gate
├── Vault Auto-Sync ←── event streams (exist)
└── EMA CLI ←── daemon (exists)
         │
Phase 3 (W9-W10)
├── Agent Reflection Loop ←── Bridge async
├── Execution Audit Trail ←── Reflection Loop + Bridge
├── SOUL.md Editor ←── Prompts table + PromptOptimizer
└── Session Capture ←── Reflection Loop + vault fresh (Vault Auto-Sync)
         │
Phase 4 (W11+)
├── Knowledge Graph Browser ←── Superman (Phase 2 W9)
└── Multi-Space UI ←── HQ wiring + stable schema
```

---

## Quick Wins (High I/E, Low Risk)

| Feature | Why it's a quick win |
|---|---|
| Outcome Dashboard | Data exists, read-only, zero risk, immediate visibility |
| Vault Auto-Sync | Infrastructure exists, fixes silent quality problem |
| EMA CLI | Thin client, no Phase 2 dependency, immediate agent value |
| Proposal Explorer | Small schema add, visual payoff immediate |

---

## Allocation Recommendation: W8 Sprint

Run **4 parallel tracks** in W8:
1. Outcome Dashboard (Coder, 2d)
2. Proposal Explorer (Coder, 2d — start after Dashboard done, or parallel if 2 Coder agents)
3. Vault Auto-Sync (Ops, 2d)
4. EMA CLI (Coder, 3d — can start immediately, independent track)

Total W8 effort: ~9 agent-days across parallel tracks. Realistic for 1 Coder + Ops working in parallel.
