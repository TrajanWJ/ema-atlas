---
title: "Proposal Pipeline"
space: wiki
tags: ["architecture", "proposals", "engine", "verified-2026-04-06"]
source: manual
---

# Proposal Pipeline

**Status:** Operational. All 9 pipeline stages implemented as GenServers. Proposal engine enabled in config. Requires Claude CLI access for Generator/Refiner/Debater/Tagger stages. Vector-based scoring and duplicate detection operational when Vectors supervisor is running.
**Last verified:** 2026-04-06

EMA's autonomous thinking system. Seeds trigger scheduled generation, proposals flow through a multi-stage pipeline, and user actions (approve/redirect/kill) drive outcomes.

## Supervision

Source: `daemon/lib/ema/proposal_engine/supervisor.ex`

`Ema.ProposalEngine.Supervisor` uses `strategy: :rest_for_one`. Conditionally started when `config :ema, proposal_engine: [enabled: true]` (currently **enabled**).

Children in start order:

1. `Task.Supervisor` (named `Ema.ProposalEngine.TaskSupervisor`) — all Claude calls run as async tasks here
2. `Ema.ProposalEngine.KillMemory`
3. `Ema.ProposalEngine.Scorer`
4. `Ema.ProposalEngine.Tagger`
5. `Ema.ProposalEngine.Debater`
6. `Ema.ProposalEngine.Refiner`
7. `Ema.ProposalEngine.Generator`
8. `Ema.ProposalEngine.Combiner`
9. `Ema.ProposalEngine.Scheduler`
10. `Ema.Proposals.Orchestrator` — 4-stage pipeline GenServer (Batch 3)
11. `Ema.Proposals.CostAggregator` — Per-proposal cost tracking (Batch 3)

## Pipeline Architecture

```
Seed → Scheduler → [Preflight] → Generator → Refiner → Debater → Scorer → Tagger → Combiner → Queue
```

PubSub topic: `"proposals:pipeline"` with `{:proposals, stage_atom, proposal}`.

### Stage Details

#### 1. Scheduler

Source: `daemon/lib/ema/proposal_engine/scheduler.ex`

- Ticks every 60 seconds
- Queries active seeds via `Ema.Proposals.list_seeds(active: true)`
- Parses schedule strings (e.g. `"every_1h"`, `"every_30m"`)
- Dispatches seeds to Generator when schedule fires (compares `last_run_at` to interval)
- Increments seed run count after dispatch
- Records tick to `Diagnostics`
- Supports `pause/0`, `resume/0`, `status/0`, and `run_seed/1` (manual trigger)

#### 2. Preflight (inline in Generator)

Source: `daemon/lib/ema/proposals/seed_preflight.ex`

Not a separate GenServer — called synchronously by Generator before Claude invocation.

- Returns `{:pass, seed, diagnostics}`, `{:rewrite, seed, diagnostics}`, `{:duplicate, nil, diagnostics}`, or `{:reject, nil, diagnostics}`
- Mode configured via `config :ema, seed_preflight: [mode: :enrich_only, minimum_score: 15, duplicate_similarity_threshold: 0.6]`

#### 3. Generator

Source: `daemon/lib/ema/proposal_engine/generator.ex`

- Receives seeds from Scheduler
- Runs preflight check — blocks duplicates and low-quality seeds
- Builds gap context via vector embeddings (finds code areas with least proposal coverage)
- Builds relevant code context via `Intelligence.ContextFetcher`
- Constructs prompt via `Claude.ContextManager.build_prompt/2` with project, gap, and code context
- Calls `Ema.Claude.AI.run/2` (stage: `:generator`)
- Creates proposal record from result (title, summary, body, estimated_scope, risks, benefits)
- Records `generation_log` with full generator output and preflight diagnostics
- Links brain dump item to proposal if applicable
- Publishes `{:proposals, :generated, proposal}`
- On failure: records error in Diagnostics, classifies via `Claude.Failure`

#### 4. Refiner

Source: `daemon/lib/ema/proposal_engine/refiner.ex`

- Subscribes to `{:proposals, :generated, proposal}`
- Builds a critique prompt asking Claude to strengthen the proposal
- Updates proposal body, summary, risks, benefits from Claude response
- Records `"refiner"` key in `generation_log`
- Publishes `{:proposals, :refined, proposal}`
- On Claude failure: passes proposal through unchanged (graceful degradation)

#### 5. Debater

Source: `daemon/lib/ema/proposal_engine/debater.ex`

- Subscribes to `{:proposals, :refined, proposal}`
- Runs steelman/red-team/synthesis debate via Claude
- Sets `steelman`, `red_team`, `synthesis` fields on proposal
- Sets `confidence` score (float 0-1) from Claude's assessment
- Updates risks and benefits from debate output
- Records `"debater"` key in `generation_log`
- Publishes `{:proposals, :debated, proposal}`
- On Claude failure: passes through unchanged

#### 6. Scorer

Source: `daemon/lib/ema/proposal_engine/scorer.ex`

- Subscribes to `{:proposals, :debated, proposal}`
- Embeds proposal text via `Ema.Vectors.Embedder.embed_proposal/1`
- **Duplicate detection:** cosine similarity > 0.85 against existing proposals → kills as duplicate
- **Four-dimensional scoring:**
  - **Codebase coverage** (30% weight) — lower similarity to existing code = higher novelty score
  - **Architectural coherence** (25% weight) — higher similarity to existing code = better fit
  - **Impact** (30% weight) — scope weight + benefits bonus - risk penalty + confidence factor
  - **Prompt specificity** (15% weight) — body length, code references, structure, specifics
- Produces `idea_score` (1-10) and `prompt_quality_score` (1-10)
- Stores embedding in vector index for future comparisons
- Publishes `{:proposals, :scored, proposal}`

#### 7. Tagger

Source: `daemon/lib/ema/proposal_engine/tagger.ex`

- Subscribes to `{:proposals, :debated, proposal}` (note: subscribes to `:debated`, not `:scored` — runs in parallel with Scorer)
- Calls Claude with `model: "haiku"` for speed
- Assigns 2-5 tags with categories: `domain`, `type`, `custom`
- Creates `ProposalTag` records via `Ema.Proposals.add_tag/2`
- Sets proposal status to `"queued"` — this is the terminal pipeline stage
- Publishes `{:proposals, :queued, proposal}`

#### 8. Combiner

Source: `daemon/lib/ema/proposal_engine/combiner.ex`

- Runs hourly (1-hour timer interval)
- Scans queued proposals and builds tag → proposals index
- Finds clusters where 2+ proposals share a tag
- Creates cross-pollination seeds that ask Claude to synthesize related proposals
- Seed type: `"cross"`
- Also supports manual `scan_now/0`

#### 9. KillMemory

Source: `daemon/lib/ema/proposal_engine/kill_memory.ex`

- Subscribes to `"proposals:events"` for `"proposal_killed"` events
- Loads all killed proposals on init
- Maintains in-memory pattern index of killed titles and tags
- `check_similarity/1` — returns `{:similar, killed_ids}` if new proposal matches killed patterns
- Title overlap: Jaccard similarity > 0.5 on word sets
- Tag overlap: 2+ shared tags

## Supporting Modules

Source: `daemon/lib/ema/proposals/`

| Module | Purpose |
|--------|---------|
| `Ema.Proposals` | Context module — CRUD for proposals, seeds, tags |
| `Ema.Proposals.Proposal` | Schema (title, summary, body, confidence, steelman, red_team, synthesis, risks, benefits, estimated_scope, idea_score, prompt_quality_score, score_breakdown, generation_log, embedding) |
| `Ema.Proposals.Seed` | Schema (name, prompt_template, seed_type, schedule, last_run_at, run_count, project_id) |
| `Ema.Proposals.ProposalTag` | Schema (proposal_id, category, label) |
| `Ema.Proposals.Orchestrator` | 4-stage pipeline GenServer (Batch 3 addition) |
| `Ema.Proposals.CostAggregator` | Per-proposal cost tracking and budget alerts |
| `Ema.Proposals.SeedPreflight` | Quality gate for seeds before generation |
| `Ema.Proposals.QualityGate` | Post-generation quality checking |
| `Ema.Proposals.Genealogy` | Parent/child proposal tree |
| `Ema.Proposals.VaultSeeder` | Seeds proposals from vault content |
| `Ema.Proposals.Prompts` | Prompt templates for pipeline stages |
| `Ema.ProposalEngine.Diagnostics` | Persistent-term backed diagnostics (scheduler ticks, dispatch/generation stats) |

## User Actions

| Action | Effect |
|--------|--------|
| **Approve** | `Ema.Executions.on_proposal_approved/1` — creates an Execution record (or uses existing), transitions to approved, dispatches via PubSub |
| **Redirect** | Creates 3 new refined seeds |
| **Kill** | Records pattern in KillMemory, sets status `"killed"` |

## Diagnostics

Source: `daemon/lib/ema/proposal_engine/diagnostics.ex`

Uses `:persistent_term` for zero-allocation reads. Tracks:
- `last_scheduler_tick_at`, `scheduler_tick_count`
- `last_dispatch_at`, `last_seed_id`, `last_seed_name`
- `last_generation` status, class, timing, errors

## Configuration

From `daemon/config/config.exs`:

```elixir
config :ema,
  proposal_engine: [enabled: true],
  seed_preflight: [
    mode: :enrich_only,
    minimum_score: 15,
    duplicate_similarity_threshold: 0.6
  ]
```

## Related

- [[EMA-Overview]]
- [[Execution-System]]
- [[Intent-System]]
- [[MCP-Topology]]
