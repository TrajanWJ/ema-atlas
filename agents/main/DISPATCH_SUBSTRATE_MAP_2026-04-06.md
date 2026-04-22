# Dispatch Substrate Map — 2026-04-06

## Why this matters

`/home/trajan/dispatch` is not a side folder.
It is a substrate for orchestration, state tracking, proposals, research loops, agent handoffs, partial results, and historical outcomes.

Treat it like infrastructure.

---

## Main structure observed

### Core state
- `dispatch.db` (+ wal/shm)
- `feed.jsonl`
- `schedule.json`
- `active-tasks.json`
- `agent-status.json`
- `agent-health.json`
- `proposal-state.json`
- `research-loop-state.json`
- `knowledge-loop-state.json`
- `dispatch.lock`

### Queues / lifecycle buckets
- `queue/`
- `active/`
- `done/`
- `failed/`
- `partial/`
- `archive/`

### Outputs / artifacts
- `results/`
- `answers.jsonl`
- `causal-traces.jsonl`
- `dispatch-learnings.json`
- `metrics.json`
- `metrics-2026-03-18.json`

### Proposal / planning / pipeline layer
- `proposals/`
- `pipelines/`
- `plans/`
- `goals/`

### Collaboration / inter-agent layer
- `handoffs/`
- `inter-agent/inbox`
- `inter-agent/processed`
- `peer-review/`

### Embedded workspaces
- `main/workspace`
- `researcher/workspace`
- `vault-keeper/`

This is a big clue that dispatch is not just a queue — it has become a working environment mesh.

---

## Functional interpretation

### feed.jsonl
Likely raw ingress/event feed.
If something “entered dispatch,” this is one of the first places to inspect.

### dispatch.db
Likely canonical structured state for active orchestration.
When in doubt, assume this matters more than loose text files.

### queue / active / done / failed / partial
Classic lifecycle model:
- queued
- running
- completed
- failed
- incomplete/interrupted

### proposals / pipelines / plans
This is the strategic layer:
- proposed work
- structured pipelines
- explicit plans

### results/
This is the artifact layer:
- human-readable outputs
- assessments
- syntheses
- vault improvement outputs
- EMA-related outputs

### peer-review/
This suggests a second-order evaluation system exists inside dispatch.
That means dispatch is doing not only execution but also refinement/review.

---

## Current smell

Dispatch appears to be handling all of these at once:
- queueing
- planning
- execution
- review
- knowledge output
- partial recovery
- archiving
- agent coordination

That is impressive.
It is also exactly how a substrate becomes impossible to reason about unless its invariants are documented.

---

## Practical debugging order

### “A task disappeared”
1. `queue/`
2. `active/`
3. `partial/`
4. `failed/`
5. `done/`
6. `archive/`

### “A task ran but I want the output”
1. `results/`
2. `answers.jsonl`
3. `done/`
4. related proposal/pipeline files

### “Dispatch seems unhealthy”
1. `dispatch.db`
2. `feed.jsonl`
3. `dispatch.lock`
4. `active-tasks.json`
5. `agent-status.json`
6. cron + dispatch scripts

### “Research/vault loops are weird”
1. `research-loop-state.json`
2. `knowledge-loop-state.json`
3. `results/`
4. `proposals/`
5. related vault scripts/cron jobs

---

## Recommended future cleanup

### High-value next step
Create a registry for each dispatch artifact/folder with:
- purpose
- producer script(s)
- consumer script(s)
- retention policy
- canonical vs derived status

### Especially important
Determine which are:
- canonical state
- cache
- artifact
- queue bucket
- archive only

Because right now a lot of folders look important, but not all of them are equally authoritative.

---

## Bottom line

Dispatch is already a mini-operating-system for agent work.
If you don’t document the substrate, every future improvement risks becoming archaeology.
