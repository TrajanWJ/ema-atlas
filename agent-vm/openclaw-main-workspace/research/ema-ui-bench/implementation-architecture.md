# EMA UI v1.1 Implementation Architecture

## Frontend architecture goals
- one object model, many views
- drill from summaries to evidence
- stateful URLs for shareable operator context
- fast local navigation via split panes and inspectors
- graph/timeline/list/calendar all over same underlying data

---

## Suggested route architecture

- `/`
- `/my-work`
- `/triage`
- `/workstreams`
- `/workstreams/:id`
- `/changes`
- `/changes/:id`
- `/executions`
- `/executions/:id`
- `/catalog`
- `/catalog/:kind/:id`
- `/schedule`
- `/lineage/:subjectType/:subjectId`
- `/explore`
- `/incidents`
- `/incidents/:id`

Use URL params for:
- filters
- saved view id
- selected object in inspector
- time range
- layout mode

---

## Suggested feature modules

### app-shell
- nav
- global search
- command palette
- quick capture
- saved views

### entities
- generic entity list/detail hooks
- entity registry
- related object fetchers

### workstreams
- overview page
- item board/table/timeline views
- docs/activity/risk panels

### proposals
- list/detail
- approval actions
- execution-chain linkage

### executions
- list/detail
- stage/task tree
- evidence stream
- verification views

### triage
- queue ingestion model
- disposition actions
- grouped lists/boards

### schedule
- calendar/timeline/agenda
- recurrence support
- deadline overlays

### lineage
- graph query adapter
- time overlay
- evidence side panel

### explore
- universal search
- filters
- saved searches

### incidents
- list/detail
- follow-up action items

---

## Data/API shape

Prefer normalized APIs with shared query primitives.

### Common list endpoint shape
- items[]
- facets
- pageInfo
- savedViewMeta?

### Common detail endpoint shape
- object
- related
- timeline
- evidenceSummary
- permissions/actions

### Graph endpoint shape
- nodes[]
- edges[]
- timeline[]

### Calendar endpoint shape
- entries[]
- overlays[]

---

## State management

Use separate layers:
- server state/query cache
- UI state (layout, inspector, selected tabs)
- URL state (filters/time range/view)

Recommended mental split:
- remote data via query library
- local UI state via component/store
- command actions via mutation layer

---

## View primitives

### Generic list view
Configurable columns, facets, row actions, grouped sections.

### Board view
Shared card model for ActionItems, Proposals, Incidents.

### Table view
Dense operational details.

### Timeline view
Workstreams, executions, incidents, deadlines.

### Calendar view
ScheduleEntry + due work overlays.

### Graph view
Lineage and relationship exploration.

### Inspector view
Right-side drawer/detail pane for quick navigation.

---

## Shared component architecture

### Core primitives
- `StatusChip`
- `TrustBadge`
- `RiskBadge`
- `OwnerChip`
- `EntityLink`
- `Timestamp`
- `Duration`
- `TagList`

### Composite cards
- `AttentionCard`
- `ActionItemCard`
- `ProposalCard`
- `ExecutionCard`
- `IncidentCard`
- `WorkstreamCard`
- `VerificationCard`

### Structural widgets
- `FacetSidebar`
- `SavedViewBar`
- `TimelineRail`
- `EvidencePanel`
- `GraphCanvas`
- `InspectorDrawer`
- `QuickCaptureBar`
- `ScheduleAgenda`

---

## Suggested build order

### Milestone 1: shell + model foundation
- app shell
- object types
- generic list/detail scaffolding
- saved views infrastructure

### Milestone 2: high-value operator surfaces
- My Work
- Triage
- Workstream overview
- Change detail

### Milestone 3: execution truth surfaces
- Executions list/detail
- Evidence panel
- Verification cards
- Lineage graph v1

### Milestone 4: scheduling + catalog maturity
- Schedule page
- Calendar overlays
- Catalog entity detail
- Orphan/drift smart views

### Milestone 5: incident + explore expansion
- Incidents
- Explore query mode
- compare views

---

## Design-system rules

1. Any summary metric must open evidence.
2. Ownership must be visible on every actionable object.
3. Time must be present for due/running/completed states.
4. Trust state must be separate from lifecycle state.
5. Use same card object across list/board/inspector when possible.
6. Avoid page-specific one-off data structures.

---

## Local benchmark integration plan
Use cloned repos as reference material for:
- route patterns
- screen layouts
- component naming ideas
- board/table/calendar/graph implementations
- screenshots and README screenshots for visual comparison

Recommended local benchmark folder:
- `research/ema-ui-bench/repos/`
- `research/ema-ui-bench/notes/`
- `research/ema-ui-bench/screen-captures/` (optional later)
