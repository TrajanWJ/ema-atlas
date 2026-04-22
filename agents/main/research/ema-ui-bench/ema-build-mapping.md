# EMA v1.1 Build Mapping — Benchmark File → EMA Component/Route

## Goal
Turn the repo-mined steal matrix into a concrete first build map.

---

## A. Shells and layouts

### 1. `WorkbenchLayout`
Primary inspiration:
- `airflow/.../layouts/Details/DetailsLayout.tsx`

EMA responsibilities:
- left analytical canvas
- right collapsible inspector rail
- top controls for filters/view modes/date range
- persistent nested detail area
- pane size memory

Use on routes:
- `/executions`
- `/executions/:id/*`
- `/lineage/:subjectType/:subjectId`
- `/explore`
- advanced `/workstreams/:id/*`

---

### 2. `DetailRailLayout`
Primary inspiration:
- `plane/.../peek-overview/full-screen-peek-view.tsx`

EMA responsibilities:
- left content/activity/evidence summary
- right persistent metadata/actions/properties rail
- loading skeletons preserving page shape

Use on routes:
- `/changes/:id/*`
- `/workstreams/:id/*`
- `/incidents/:id/*`
- `/action-items/:id/*` (if explicit route exists)

---

### 3. `BoardWorkspaceLayout`
Primary inspiration:
- Plane issue layouts
- WeKan board/sidebar patterns

EMA responsibilities:
- board/list/table/timeline switcher
- grouped columns or rows
- optional right inspector drawer
- saved view bar and filters

Use on routes:
- `/triage`
- `/my-work`
- `/workstreams/:id/items`

---

### 4. `EntityConsoleLayout`
Primary inspiration:
- Argo status/detail/events
- Spinnaker detail sections
- Backstage entity page conventions

EMA responsibilities:
- summary header
- sectioned detail surface
- related objects and activity tabs
- status panel and reconcile actions

Use on routes:
- `/catalog/:kind/:id/*`

---

## B. Route blueprint

### Top-level
- `/`
- `/my-work`
- `/triage`
- `/workstreams`
- `/changes`
- `/executions`
- `/catalog`
- `/schedule`
- `/lineage/:subjectType/:subjectId`
- `/explore`
- `/incidents`

### Detail default redirects
Inspired by Temporal route redirect
- `/workstreams/:id` -> `/workstreams/:id/overview`
- `/changes/:id` -> `/changes/:id/overview`
- `/executions/:id` -> `/executions/:id/timeline`
- `/catalog/:kind/:id` -> `/catalog/:kind/:id/overview`
- `/incidents/:id` -> `/incidents/:id/timeline`

---

## C. Core components to implement first

### P0 components

#### `ViewModeSwitcher`
Inspired by:
- Plane `layout-selection.tsx`

Supports:
- board
- list
- table
- timeline
- calendar
- graph

Responsibilities:
- update URL state
- preserve existing filters/selected object
- show active mode clearly

---

#### `OperatorRail`
Inspired by:
- WeKan `sidebar.js`

Modes:
- Filters
- Saved Views
- Ownership
- Related Objects
- Evidence
- Schedule
- Notes
- View Options

Responsibilities:
- page-specific content modules
- open/close/toggle/setView semantics
- keyboard access

---

#### `StatusPanel`
Inspired by:
- Argo `application-status-panel.tsx`

Sections:
- health
- trust
- last execution
- verification
- conditions
- schedule window
- reconcile state

Responsibilities:
- semantic section titles
- help text/tooltips
- click-through into deeper detail

---

#### `SavedViewBar`
Inspired by:
- Temporal saved-query views tests

Responsibilities:
- system views
- user views
- save current state
- copy/edit/delete
- activate via URL-bound query state

---

#### `NeedsAttentionBadge`
Inspired by:
- Airflow `NeedsReviewBadge.tsx`

Variants:
- needs approval
- needs verification
- needs owner
- blocked

Responsibilities:
- compact badge with count
- route to filtered queue

---

#### `useViewUrlState`
Inspired by:
- Airflow `useTableUrlState.ts`
- Plane layout selector query syncing
- Temporal saved query URL model

Responsibilities:
- persist filters, sorting, pagination, time range, active tab, view mode, selected inspector item

---

## D. Second-wave components

### `TimelineRail`
Inspired by:
- Temporal history/timeline view ideas
- Airflow detail panel temporal orientation

Use for:
- executions
- incidents
- workstreams
- changes

---

### `EventsList`
Inspired by:
- Argo `events-list.tsx`

Use for:
- execution evidence
- entity activity
- incident timeline details

---

### `RelationsPanel`
Inspired by:
- catalog/lineage/resource detail patterns across Argo/Backstage/Dagster

Use for:
- related entities
- proposal/execution links
- artifact lineage

---

### `VerificationCard`
Inspired by:
- Airflow review affordances
- EMA truth/reality model

Use for:
- changes
- executions
- entities
- workstreams

---

### `ScheduleWindowPanel`
Inspired by:
- Argo sync windows
- Leantime/Vikunja schedule thinking

Use for:
- changes
- workstreams
- entities with maintenance windows

---

## E. Route-to-layout mapping

### `/my-work`
Layout:
- `BoardWorkspaceLayout`
Components:
- `SavedViewBar`
- `ViewModeSwitcher`
- `NeedsAttentionBadge`
- `OperatorRail`

### `/triage`
Layout:
- `BoardWorkspaceLayout`
Components:
- `SavedViewBar`
- `OperatorRail`
- inspector drawer

### `/workstreams/:id/overview`
Layout:
- `DetailRailLayout`
Components:
- `StatusPanel`
- `TimelineRail`
- `NeedsAttentionBadge`

### `/changes/:id/overview`
Layout:
- `DetailRailLayout`
Components:
- `StatusPanel`
- `VerificationCard`
- `ScheduleWindowPanel`
- `RelationsPanel`

### `/executions/:id/timeline`
Layout:
- `WorkbenchLayout`
Components:
- `TimelineRail`
- `EventsList`
- right inspector rail

### `/catalog/:kind/:id/overview`
Layout:
- `EntityConsoleLayout`
Components:
- `StatusPanel`
- `RelationsPanel`
- `EventsList`
- `ScheduleWindowPanel`

### `/explore`
Layout:
- `WorkbenchLayout`
Components:
- `SavedViewBar`
- `OperatorRail`
- query/filter pane
- result table/list/graph switcher

---

## F. Data contract features required early

Must exist before shell feels real:
- saved views API/model
- URL-syncable filter schema
- list + detail + related objects queries
- timeline/events query
- status panel summary query
- ownership/responsibility fields on all actionable objects

---

## G. Recommended implementation order

### Step 1
- `useViewUrlState`
- route default redirects
- `ViewModeSwitcher`
- `SavedViewBar`

### Step 2
- `DetailRailLayout`
- `WorkbenchLayout`
- `OperatorRail`

### Step 3
- `StatusPanel`
- `NeedsAttentionBadge`
- `RelationsPanel`
- `TimelineRail`

### Step 4
- wire `My Work`, `Triage`, `Change Detail`, `Execution Detail`

### Step 5
- add `Catalog`, `Schedule`, `Explore`, `Incidents`
