# Track B — Control Plane / Chronicle / Review / Recall / Trace

Date: 2026-04-13
Plane: planning
Owning canon: `canon/specs/EXECUTION-SYSTEM`, `canon/specs/PROPOSAL-QUALITY-GATE`, `canon/specs/PROPOSAL-TEMPLATES`, `INT-PROPOSAL-PIPELINE`, `INT-CHRONICLE-LANDING-ZONE`

## Scope

The durable spine: `intention → proposal → approval → execution → harvest → review → canon`. Chronicle as raw history. Trace as navigable execution lineage. Recall as cross-entity search. Workstream as identity across surfaces.

## Entity implications

- **New**: `workstream`, `trace`, `step`, `observation`, `approval` (promoted from proposal status enum to first-class row)
- **Extend**: `chronicle.entry` gains optional `trace_id`, `workstream_id`
- **Port**: 5-stage proposal pipeline (Generator → Refiner → Debater → Scorer → Tagger) per `INT-PROPOSAL-PIPELINE`

## Current reality

- `services/core/intents/` — filesystem-backed mirror + SQLite index, `/api/intents` wired
- `services/core/proposal/` — `intention-farmer.ts` + `vault-seeder.ts` + thin router at `/api/proposals`; no 5-stage pipeline
- `services/core/executions/` — execution ledger with progress, result, completion
- `services/core/chronicle/` — session + entry + artifact with routes
- `services/core/review/` — extraction + promotion receipt with routes (1011 LOC service.ts already — substantial)
- `services/core/loop/orchestrator.ts` — `LoopOrchestrator.runIntent()` exists programmatically, **no HTTP**
- Renderer: Chronicle, Review, Search/Recall/Trace vApps absent

## Implementation sequence

1. **`workstream` + `trace` + `step` schemas** — ship in parallel (disjoint files). Wire in `shared/schemas/index.ts`. [schema-first]
2. **`/api/workstreams` service** (`services/core/workstreams/`) — CRUD + `attach` verb to link intent/chronicle/execution IDs. Single SQLite table with JSONB link bag.
3. **`/api/traces` service** (`services/core/traces/`) — create trace from workstream + intent, append step, list by workstream, list by entity. Table: `traces` + `trace_steps`.
4. **Extend `services/core/chronicle/service.ts`** to emit `trace_step` rows on entry ingestion when `trace_id` is provided.
5. **Port proposal pipeline Tier 1 under `services/core/proposals/pipeline/`** per `INT-PROPOSAL-PIPELINE` ordering:
   - `generator.ts` (seed → proposal) — can start as pass-through
   - `refiner.ts` (rewrite for scope + clarity)
   - `scorer.ts` (4-dim rubric: coverage 30, coherence 25, impact 30, specificity 15)
   - Event bus wiring: `proposals:generated → refined → scored`
   - Integration test: one seed, three stages, queued exit
6. **Expose orchestrator HTTP** — `services/core/orchestrator/routes.ts` wraps the existing `LoopOrchestrator`:
   - `POST /api/orchestrator/sessions` — spawn
   - `GET  /api/orchestrator/sessions` — list
   - `GET  /api/orchestrator/sessions/:id` — detail
   - `POST /api/orchestrator/sessions/:id/resume`
   - `DELETE /api/orchestrator/sessions/:id`
   - `GET  /api/orchestrator/context?project_slug=<slug>` — context bundle
   - Back MCP `ema_list_sessions` / `ema_session_context` / `ema_spawn_session` onto these routes. [Unblocks Claude/Codex session protocol.]
7. **ChronicleApp renderer** — new `apps/renderer/src/components/chronicle/ChronicleApp.tsx` — unified timeline with source/machine/workstream filters. Reads `/api/chronicle/entries`.
8. **ReviewApp renderer** — new `apps/renderer/src/components/review/ReviewApp.tsx` — queue of pending extractions with accept/reject/defer. Reads `/api/review/items`, writes `promotion-receipts`.
9. **Recall/Trace search** — new `apps/renderer/src/components/trace/TraceApp.tsx` — search across intents/executions/chronicle by keyword and entity id. Backed by a new `/api/search/recall` endpoint that joins the three domains.

## Dependencies

- `workstream` schema (step 1) blocks steps 2, 7, 8.
- Orchestrator HTTP (step 6) is P0 because the session brief requires session-tracked work.
- Proposal pipeline Tier 1 (step 5) can proceed fully in parallel with 1-4, 6-9 because it owns a greenfield subdirectory.

## Steal-now imports

- Langfuse trace tree → `TraceApp` span view
- HoneyHive review queue → `ReviewApp` list layout
- Temporal workflow lifecycle → orchestrator HTTP shape
- Mem0 memory promotion → review → canon promotion path

## Risk areas

- **`LoopOrchestrator` coupling**: the class has internal state. Wrapping in HTTP requires session-store externalization. Keep wrapper minimal; don't refactor internals in this wave.
- **Proposal pipeline LLM budget**: Debater stage in full will burn budget. Ship Tier 1 (Gen+Ref+Score) only this wave; Debater + KillMemory + Combiner in wave 2.
- **Chronicle volume**: entries can explode. Ensure indices on `(source, timestamp)` and `(workstream_id)` before UI ships.

## Minimum real MVP

- `ema workstream create` in CLI (new) and a corresponding GET in UI
- One intent → one proposal (generated + refined + scored) → one execution, all visible in ChronicleApp timeline and reachable via TraceApp search
- Orchestrator HTTP reachable, MCP session tools stop 404-ing
- Review queue surfaces at least one chronicle extraction and promotes it through
