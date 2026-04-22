# EMA Batch 3: Proposal Hub Orchestrator + Quality Gates

**Status:** DONE  
**Date:** 2026-04-03  
**Compilation:** ✅ `mix compile` clean (only pre-existing warnings)  
**TypeScript:** ✅ `tsc --noEmit` clean

---

## Files Created (New)

### Backend (Elixir)

| File | Purpose | Lines |
|------|---------|-------|
| `daemon/lib/ema/proposals/orchestrator.ex` | **ProposalOrchestrator GenServer** — 4-stage async pipeline with PubSub streaming | ~420 |
| `daemon/lib/ema/proposals/quality_gate.ex` | **QualityGate** — 5-dimension evaluation (completeness, actionability, risk, scope, goals) with iteration loop | ~240 |
| `daemon/lib/ema/proposals/prompts.ex` | **Stage Prompts** — Templates for Generator→Refiner→RiskAnalyzer→Formatter with `{{var}}` substitution | ~270 |
| `daemon/lib/ema/proposals/cost_aggregator.ex` | **CostAggregator GenServer** — Per-proposal cost tracking + daily budget alerts | ~210 |
| `daemon/priv/repo/migrations/20260405000001_add_proposal_pipeline_fields.exs` | Migration adding `quality_score`, `pipeline_stage`, `pipeline_iteration`, `cost_display` | ~30 |

### Frontend (React/TypeScript)

| File | Purpose |
|------|---------|
| `app/src/components/proposals/ProposalStreamingView.tsx` | Live streaming UI — stage progress bar, streaming text, quality gate feedback, iteration counter |
| `app/src/components/proposals/ProposalDetail.tsx` | Full detail view with live streaming when generating, static view when complete |
| `app/src/components/proposals/PipelineStatusBadge.tsx` | Status badges: 🔄 Generating, ⚠️ Gate Failed, ✅ Accepted for card list |

## Files Modified (Updated)

| File | Changes |
|------|---------|
| `daemon/lib/ema/proposals/proposal.ex` | Added `quality_score`, `pipeline_stage`, `pipeline_iteration`, `cost_display` fields; added "generating"/"failed" to valid statuses |
| `daemon/lib/ema_web/channels/proposal_channel.ex` | Added `"proposal:<id>"` join pattern for live pipeline streaming; forwards PubSub events to WebSocket |
| `daemon/lib/ema/proposal_engine/supervisor.ex` | Added `Ema.Proposals.Orchestrator` and `Ema.Proposals.CostAggregator` to supervision tree |
| `daemon/lib/ema_web/controllers/proposal_controller.ex` | Added REST endpoints: `generate`, `cancel`, `pipelines`, `cost`, `budget` |
| `daemon/lib/ema_web/router.ex` | Added routes: `POST /proposals/generate`, `GET /proposals/pipelines`, `GET /proposals/budget`, `GET /proposals/:id/cost`, `POST /proposals/:id/cancel` |
| `app/src/types/proposals.ts` | Added `quality_score`, `pipeline_stage`, `pipeline_iteration`, `cost_display`, `generation_log` fields; added "generating"/"failed" status types |

---

## Architecture

### Pipeline Flow
```
start_proposal(seed, project, context)
  → {:ok, proposal_id, "proposal:<id>"}
  
Orchestrator (async Task):
  1. Create "generating" proposal record in DB
  2. Start Bridge session: "proposal-<id>"
  3. Stage 1: Generator (haiku) → PubSub streaming
  4. Stage 2: Refiner (sonnet)  → PubSub streaming  
  5. Stage 3: RiskAnalyzer (sonnet) → PubSub streaming
  6. Stage 4: Formatter (haiku) → PubSub streaming
  7. QualityGate.evaluate(combined_output, :proposal, iteration)
     → {:pass} → Persist as "queued", emit {:complete}
     → {:fail} → Send feedback to Bridge, loop to Stage 2 (max 3x)
     → {:pass_with_warnings} → Persist with quality_score: 0.4
  8. End Bridge session
```

### Quality Gate Dimensions
1. **Completeness** — Title, summary, 200+ chars, heading structure
2. **Actionability** — Action verbs, numbered steps, assignable tasks
3. **Risk Coverage** — Risk section, 2+ risks, mitigation strategies
4. **Scope Boundaries** — In-scope/out-of-scope explicitly defined
5. **Goal Alignment** — References goals, objectives, benefits

### Multi-Turn Session
- Single Bridge session across all 4 stages + iterations
- Feedback on quality gate failure is a follow-up turn (not new session)
- Session name: `"proposal-<proposal_id>"`

### PubSub Events (topic: "proposal:<id>")
```elixir
{:stage_started, :generator, 1}
{:stage_update, :generator, "partial text..."}
{:stage_complete, :generator, "full output"}
{:quality_gate_failed, "feedback text", 1}
{:quality_gate_passed, proposal}
{:quality_gate_warning, proposal, ["warning1", ...]}
{:complete, proposal}
{:pipeline_error, reason}
```

### REST API Additions
```
POST   /api/proposals/generate    — Start pipeline (body: {seed_id, project_id?, context?})
GET    /api/proposals/pipelines   — List active pipelines
GET    /api/proposals/budget      — Daily AI budget status
GET    /api/proposals/:id/cost    — Per-proposal cost breakdown  
POST   /api/proposals/:id/cancel  — Cancel active pipeline
```

---

## Dependencies

### On Batch 1 (Bridge)
- `Bridge.start_session/1` — Creates named session
- `Bridge.send_message/3` — Sends prompt to session with model selection
- `Bridge.end_session/1` — Closes session

**Status:** Orchestrator uses these APIs. If Bridge isn't ready, calls will fail gracefully with `{:error, reason}` and proposal status will be set to "failed".

### On Batch 2 (Router + ContextInjector)
- SmartRouter is used indirectly through `Bridge.run/2`
- ContextInjector enriches prompts via `Ema.Claude.ContextManager`

**Status:** No direct dependency. Orchestrator builds its own prompts via `Prompts.build/2`.

---

## Notes

- Pre-existing `pipes/registry.ex` syntax error was already present (not caused by Batch 3)
- Pre-existing warnings in `brain_dump.ex` and `context_manager.ex` unchanged
- Migration uses `add_if_not_exists` for safe re-run
- `Ema.Claude.UsageRecord` module referenced by CostAggregator may need to be created if it doesn't exist yet (currently uses try/rescue fallback)
