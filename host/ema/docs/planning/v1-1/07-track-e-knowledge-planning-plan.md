# Track E — Knowledge / Blueprint / Intentions / Graph / Research / Feeds

Date: 2026-04-13
Plane: planning
Owning canon: `canon/specs/BLUEPRINT-PLANNER`, `canon/decisions/DEC-007-unified-intents-schema`, `INT-INTENTIONS-SCHEMATIC-ENGINE`, `docs/INTENTION-BUILDING-SYSTEM`, `docs/GAP-LEDGER-SYSTEM`

## Scope

Typed object graph across knowledge, planning, research, intents. Blueprint queue (GAC cards + planning nodes). Graph visualizer. Research library. Wiki reader. Feeds with "why am I seeing this?".

## Entity implications

- **New**: `planning-node` (promotes `PLAN-*` and candidate intent docs to first-class rows), `research-item`, `wiki-page` (thin read model over markdown)
- **Extend**: `gac-card` schema (already exists) to link `planning_node_id`
- **Reuse**: `intent` (plural), `feed-item` schemas

## Current reality

- `services/core/blueprint/` — GAC queue service + MCP tools, `/api/blueprint` wired
- `services/core/intents/` — filesystem-backed mirror, `/api/intents` wired
- `apps/renderer/src/components/blueprint-planner/BlueprintPlannerApp.tsx` — 462 LOC, wired
- `apps/renderer/src/components/intents/IntentSchematicApp.tsx` — 505 LOC, wired, tree view
- `apps/renderer/src/components/feeds/FeedsApp.tsx` — 1327 LOC, wired
- `apps/renderer/src/components/wiki/WikiApp.tsx` — 6-LOC stub
- No Graph Visualizer, no Research Viewer vApp
- `ema-genesis/planning/schematic/PLAN-001-*` exists on disk; not surfaced in any vApp
- `ema-genesis/research/` populated; not surfaced in any vApp

## Implementation sequence

1. **`planning-node` + `research-item` schemas** — parallel files. `planning-node` mirrors the planning-building doctrine (aspiration / gac / candidate_intent / planning_node / promotion_candidate subtypes).
2. **`services/core/planning/` service** — filesystem-backed, walks `ema-genesis/planning/**`:
   - Routes: `GET /api/planning/nodes`, `GET /api/planning/nodes/:id`, `POST /api/planning/nodes/:id/promote`
   - Caches by mtime; invalidates on file watcher events
3. **`services/core/research/` service** — filesystem-backed, walks `ema-genesis/research/**`:
   - Routes: `GET /api/research/items`, `GET /api/research/items/:id`, `GET /api/research/by-tag`
   - Already partially covered by `cli/src/commands/research/*` loaders — reuse or port
4. **`services/core/wiki-read/` service** — thin markdown renderer over `~/.local/share/ema/vault/wiki/`:
   - Routes: `GET /api/wiki/pages`, `GET /api/wiki/page/:path` (path-escaped), `POST /api/wiki/search`
   - Resolves `[[wikilinks]]` against the same tree
5. **WikiApp renderer** — replace 6-LOC stub in `apps/renderer/src/components/wiki/WikiApp.tsx` with a real markdown viewer + left-nav tree + `[[wikilink]]` navigation
6. **ResearchViewerApp** — new `apps/renderer/src/components/research/ResearchViewerApp.tsx` — source/tag filter + detail
7. **GraphVisualizerApp** — new `apps/renderer/src/components/graph/GraphVisualizerApp.tsx` using React Flow; reads cross-entity links from `/api/intents/tree`, `/api/planning/nodes`, `/api/research/items`; read-only
8. **BlueprintPlannerApp extension** — add planning-node panel + PLAN-001 promotion receipts view
9. **FeedsApp "why am I seeing this?"** — confirm existing hover reveals scoring rationale; if not, add hover card reading from feed-item.reason field
10. **Chronicle ingestion → Research** — pipe that converts cross-pollination chronicle entries tagged `source:research` into `research-item` rows (later wave if time-boxed)

## Dependencies

- Track B workstream schema — for linking planning nodes to active work
- Graphify experiment — can inform Graph Visualizer layout (see 08 + stale-session recovery intent)

## Steal-now imports

- Tana supertags → typed `planning-node` subtypes + `research-item` taxonomy
- Capacities object-type surfaces → WikiApp viewer affordances
- Graphiti bi-temporal graph → FalkorDB adapter under `services/core/memory/graph.ts`
- React Flow → GraphVisualizerApp rendering
- tldraw → Canvas/Blueprint hybrid (extend `CanvasApp.tsx`)
- Neo4j Bloom → reference only for node-focus UX
- ResearchRabbit → ResearchViewerApp layout

## Risk areas

- **Graph rendering cost**: 1k+ node graphs collapse without virtualization. Start capped at 200 nodes; require user expansion beyond.
- **Wiki path traversal**: `GET /api/wiki/page/:path` must reject `..` and absolute paths; sanitize aggressively.
- **Filesystem cache invalidation**: planning + research services must handle file add/remove via watcher, not poll.

## Minimum real MVP

- WikiApp renders a real markdown page from the vault with `[[wikilinks]]` resolving
- GraphVisualizer shows at least the intents tree + linked planning nodes
- ResearchViewerApp lists at least the existing `ema-genesis/research/` entries with filters
- BlueprintPlannerApp shows `PLAN-001` planning node and its blocking gaps (`GAP-X-001..004`) as attached cards
- `ema planning list` CLI command exists and returns planning nodes
