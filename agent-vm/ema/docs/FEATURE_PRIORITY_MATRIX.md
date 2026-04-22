---
title: "EMA Feature Priority Matrix"
date: 2026-04-03
author: Right Hand
tags: [ema, features, priority, roadmap]
status: active
---

# EMA Feature Priority Matrix

Sorted by Impact/Effort ratio, dependencies respected.
Generated: 2026-04-03 22:10 UTC

---

## Priority Matrix

| Rank | Feature | Impact | Effort (d) | Score | Dependencies | Owner | Phase | Week |
|------|---------|--------|-----------|-------|-------------|-------|-------|------|
| 1 | Deliberation Gate UI | 8 | 1 | 8.0 | None | Coder | 2 | W7 |
| 2 | Honcho Integration | 9 | 3 | 3.0 | Docker setup | Coder | 2 | W7⏸ |
| 3 | Outcome Dashboard | 10 | 2 | 5.0 | Phase 2 data | Ops | 2.5 | W8 |
| 4 | Execution Live Stream | 9 | 2 | 4.5 | claude-wrapper.sh | Coder | 2.5 | W8 |
| 5 | EMA CLI | 9 | 3 | 3.0 | None | Coder | 2.5 | W8 |
| 6 | Proposal Comparison | 8 | 2 | 4.0 | W7 proposals exist | Coder | 3 | W9 |
| 7 | Agent Workbench | 8 | 3 | 2.7 | W7 quality scores | Coder | 3 | W9 |
| 8 | Execution Diff | 7 | 2 | 3.5 | Git worktrees | Coder | 3 | W10 |
| 9 | Campaign Manager | 7 | 5 | 1.4 | Dispatch Board | Coder | 3 | W10 |
| 10 | Knowledge Graph | 7 | 5 | 1.4 | Vault mass | Researcher | 4 | W11 |

**Score = Impact / Effort**

---

## Dependency Map

```
Deliberation Gate UI → (no deps) → Ship W7
Honcho Integration   → Docker setup needed → Ship W7 once unblocked
                             ↓
Outcome Dashboard    → Phase 2 data (W7 complete) → Ship W8
Execution Live Stream → claude-wrapper.sh fix (1h) → Ship W8
EMA CLI              → (no deps) → Ship W8 in parallel
                             ↓
Proposal Comparison  → Need proposals from W7 → Ship W9
Agent Workbench      → Need quality scores from W8 → Ship W9
                             ↓
Execution Diff       → Git worktrees (from Architect plan) → Ship W10
Campaign Manager     → Dispatch Board visuals (W7) → Ship W10
                             ↓
Knowledge Graph      → Vault critical mass (W10) → Ship W11+
```

---

## Quick Win Analysis

| Feature | Time to Ship | ROI |
|---------|-------------|-----|
| Deliberation Gate UI | 1 day | Prevents all structural task rework immediately |
| Outcome Dashboard | 2 days (after W7) | Makes all learning visible |
| Execution Live Stream | 2 days | Eliminates visibility blackhole |
| Execution Diff | 2 days | Every build becomes reviewable |

**Recommendation:** These 4 quick wins alone will make EMA dramatically more useful before heavier features ship.

---

## Scope Creep Risks

| Feature | Risk | Mitigation |
|---------|------|-----------|
| Campaign Manager | Topology editor → fullscreen app | Constrain to JSON-defined campaigns, visual is read-only first |
| Knowledge Graph | D3 graph → months of polish | Ship minimal (list+filter) before visual |
| Agent Workbench | Infinite tuning loop | Time-box A/B tests to 2 tasks max |
| EMA CLI | Feature parity with HQ | CLI covers 20% of actions (create, list, status, outcome). HQ covers rest. |

---

## Technical Debt That Blocks Features

| Debt | Blocks | Effort | Urgency |
|------|--------|--------|---------|
| Claude-wrapper.sh (Port orphan fix) | Live Stream | 1h | HIGH — also prevents silent token burn |
| Honcho Docker setup | Honcho features | 2h | HIGH — 27.8% recall improvement waiting |
| Git worktrees per execution | Execution Diff, Campaign | 4h | MEDIUM — needed for W10 features |
| outcome-tracker.json flow | All learning features | 2h | HIGH — enables entire feedback loop |

**Address all 4 before W8 starts.**

---

## 8-Week Roadmap Summary

```
W7  Dispatch Board + Deliberation Gate + Honcho⏸ + Scope Advisor⏸
W8  Outcome Dashboard + Live Stream + CLI  [parallel with HQ frontend]
W9  Proposal Comparison + Agent Workbench
W10 Execution Diff + Campaign Manager
W11 Knowledge Graph browser
W12 Multi-space UI (Phase 4 preview)
```

---

## Phase Assignments

| Phase | Focus | Features |
|-------|-------|---------|
| 2 (W7) | Core dispatch | Dispatch Board, Deliberation Gate, Honcho, Scope Advisor |
| 2.5 (W8) | Visibility + dev tools | Outcome Dashboard, Live Stream, CLI |
| 3 (W9-W10) | Intelligence layer | Proposal Comparison, Agent Workbench, Exec Diff, Campaigns |
| 4 (W11+) | Graph + spaces | Knowledge Graph, Multi-space UI, Vault Auto-sync |
