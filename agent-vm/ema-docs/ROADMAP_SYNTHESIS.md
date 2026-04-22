---
title: "EMA Master Roadmap — 8 Week Plan"
date: 2026-04-03
author: Right Hand
tags: [ema, roadmap, phase2, phase3, phase4]
status: active
---

# EMA Master Roadmap — 8 Weeks

Generated: 2026-04-03 22:10 UTC

---

## Phase 2 (Week 7 — April 7-11)

### In Parallel
- ✅ **Dispatch Board** — Live graph of running agents (Coder, 3d)
- ✅ **Deliberation Gate** — Structural task intercept + proposal requirement (Coder, 1d)
- ⏸ **Honcho Integration** — Blocked: Docker setup needed (Coder, unblock first)
- ⏸ **Scope Advisor** — Blocked: Honcho must run first (follows Honcho)

### Pre-W7 Blockers to Resolve (Monday morning)
1. `docker pull gethoncho/honcho && docker run -d -p 8000:8000 honcho` (2h)
2. Write `claude-wrapper.sh` — Port orphan fix (1h)
3. Set up git worktrees in build flow (4h)
4. Wire `outcome-tracker.json` write on execution complete (2h)

### W7 Success Criteria
- Dispatch Board deployed, showing live topology
- Deliberation Gate intercepting structural tasks
- Honcho running + Reflexion Injection active
- outcome-tracker.json has W7 data
- All 4 commits merged, tests pass

---

## Phase 2.5 (Week 8 — April 14-18)

### In Parallel — All independent
- **Outcome Dashboard** (Ops, 2d) — W7 data required
- **Execution Live Stream** (Coder, 2d) — requires claude-wrapper.sh
- **EMA CLI** (Coder, 3d) — no dependencies, can start Mon

### Also This Week
- **HQ Frontend WebSocket wiring** (Coder, parallel with above)
- **Elixir Port orphan fix** if not done in W7 (must happen before Live Stream)

### W8 Success Criteria
- Can create + monitor tasks from CLI
- Live execution output visible in HQ
- Outcome Dashboard showing W7 metrics
- Learning loop visible (token costs, success rates, fitness scores)

---

## Phase 3 (Weeks 9-10 — April 21 - May 1)

### Week 9
- **Proposal Comparison Viewer** (Coder, 2d) — requires W7 proposals
- **Agent Workbench** (Prompt Engineer + Coder, 3d) — requires W8 quality scores

### Week 10
- **Execution Diff Viewer** (Coder, 2d) — requires git worktrees
- **Campaign Manager** (Coder, 5d — largest feature this phase) — requires Dispatch Board

### Phase 3 Success Criteria
- Can compare proposals before dispatch
- Can tune agent SOUL.md + test in-app
- Every execution shows exact git diff
- Can run multi-step agent campaigns (Research → Build → Review)

---

## Phase 4 (Weeks 11-12 — May 4-15)

### Week 11
- **Knowledge Graph Browser** (Researcher + Coder, 5d) — vault critical mass needed

### Week 12
- **Multi-Space UI** (Coder, 3d) — Space selector, cross-space view
- **Vault Auto-Sync** (Vault Keeper + Coder, 2d) — backlinks, staleness, auto-TOC

### Phase 4 Success Criteria
- Can navigate vault + codebase as connected graph
- Multiple spaces (Personal, Proslync, etc) visible in HQ
- Vault backlinks always bidirectional

---

## Quick Reference

```
W7  (Apr 7-11)   Dispatch Board + Deliberation Gate + Honcho + Scope Advisor
W8  (Apr 14-18)  Outcome Dashboard + Live Stream + CLI + HQ Frontend
W9  (Apr 21-25)  Proposal Comparison + Agent Workbench
W10 (Apr 28-May 1) Execution Diff + Campaign Manager
W11 (May 4-8)   Knowledge Graph
W12 (May 11-15) Multi-Space UI + Vault Auto-Sync
```

---

## Self-Building Loop Timeline

```
W7: EMA builds Phase 2 features → first real outcomes generated
W8: Outcomes visible (Dashboard) → learning loop fires
W9: Agent workbench + proposal comparison → quality improves
W10: Campaigns + diffs → multi-step workflows now possible
W11: Graph browser → system understands its own architecture
W12: Multi-space → EMA manages multiple projects simultaneously
```

By W12: EMA is dispatching agents for complex multi-space campaigns, learning from outcomes, suggesting workflow improvements, and managing its own development pipeline.

---

## Gotchas & Warnings

1. **Honcho must run before W7 ships** — 27.8% recall gain waiting. Don't ship Week 7 without it.
2. **outcome-tracker.json write must work** — All learning features depend on this. Verify in W6/W7 smoke test.
3. **Campaign Manager is large (5d)** — Parallelize with Execution Diff, don't block on it.
4. **Knowledge Graph could balloon** — Ship minimal version first (list + filter), add D3 visualization in Phase 5.
5. **CLI scope creep** — Constrain to 6 commands max in W8. No feature parity chase.
6. **Agent Workbench** — Time-box A/B tests. Don't let it become a tuning rabbit hole.
