---
type: agent-learning
wiki_id: >-
  agents/researcher/2026-03-18-research-loop-investigate-best-practices-for-self_learning-i
imported_from: >-
  vault/Agent
  Knowledge/researcher/2026-03-18-research-loop-investigate-best-practices-for-self_learning-i.md
imported_at: '2026-04-04T00:23:56.586Z'
tags: []
summary: ''
---
# Research loop: Investigate best practices for \'self_learning\' in AI agent systems. Find 3-5 concrete, implementable impr

> Source: dispatch task `pipeline-research-20260318-224802` completed 2026-03-18 by **researcher**

## Key Findings

**Root cause discovered via code analysis:**
- `research-implement-pipeline.sh` reads `.outcomes` and `.patterns` from the tracker files
- `outcome-tracker.json` actually uses `.tasks` key — contains **6 real entries**
- `workflow-patterns.json` is a flat array — contains **5 real patterns** (including "Parallel Research Sweep" at 100% success)
- `dispatch-reflect.sh` already correctly reads `.tasks` — only the assessment script is wrong

**5 improvements (priority order):**
1. **Fix assessment field names** (5 min) — stops false-zero reporting, prevents future cascade runs
2. **Normalize outcome schema** (30 min) — `dispatch-outcome-capture.sh` writes flat array, `log-outcome.sh` writes `.tasks`, need alignment
3. **Add success outcomes to dispatch-engine.sh** (20 min) — currently only timeouts are captured automatically
4. **Inject workflow patterns at task start** (45 min) — 5 patterns exist but aren't surfaced to agents
5. **Schedule evolution-cycle.sh in cron** (15 min) — built since 04:18 today, never triggered

## Task Context

- **Agent:** researcher
- **Task ID:** `pipeline-research-20260318-224802`
- **Completed:** 2026-03-18T22:54:01Z
- **Result file:** `/home/trajan/dispatch/results/pipeline-research-20260318-224802.txt`

## Related

- [[Agent Knowledge]] — cross-agent knowledge index
- [[researcher]] — agent profile
