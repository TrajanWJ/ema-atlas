# EMA v1.1 Steal Matrix — File-Level Extraction Brief

Purpose: convert repo mining into build-facing adaptation guidance.

Legend:
- Priority: P0 = immediate shell/core, P1 = strong v1.1, P2 = later
- Action: Steal Directly / Adapt / Reference Only / Ignore

---

## 1. Plane

### Source
`repos/plane/apps/space/components/issues/peek-overview/full-screen-peek-view.tsx`

Pattern observed
- full-screen detail surface split into 70/30 layout
- left side = narrative details + activity
- right side = properties rail
- skeletons/loaders maintain structure while data loads

EMA adaptation
- Create `DetailRailLayout`
- left column: body, timeline, notes, activity, evidence summaries
- right column: status, owner, risk, trust, schedule, affected entities, actions

Use for
- ProposalDetail
- ActionItemDetail
- IncidentDetail
- WorkstreamDetail

Priority
- P0

Action
- Steal Directly

Implementation note
- Keep rail persistent across tabs; avoid burying metadata in tab panes.

---

### Source
`repos/plane/apps/space/components/issues/navbar/layout-selection.tsx`

Pattern observed
- tiny, explicit layout selector
- URL + local filter state updated together
- preserves existing query params like labels/state/priority/peekId

EMA adaptation
- Create `ViewModeSwitcher`
- shared modes: board, list, table, timeline, calendar, graph
- update URL state without dropping active filters or selected inspector object

Use for
- My Work
- Triage
- Workstreams
- Schedule

Priority
- P0

Action
- Steal Directly

Implementation note
- View mode must be part of the URL and saved per surface.

---

### Source
`repos/plane/apps/space/components/issues/issue-layouts/kanban/*`
`repos/plane/apps/space/components/issues/issue-layouts/list/*`

Pattern observed
- same underlying object rendered through multiple layout roots
- board/list group abstractions

EMA adaptation
- define view adapters over same `ActionItem/Proposal` objects
- avoid separate backend contracts for board vs list

Use for
- Triage
- My Work
- Workstream items

Priority
- P1

Action
- Adapt

---

## 2. Airflow

### Source
`repos/airflow/airflow-core/src/airflow/ui/src/layouts/Details/DetailsLayout.tsx`

Pattern observed
- horizontal split workbench
- left pane swaps graph/grid/gantt
- right pane is collapsible detail rail with tabs and nested outlet
- persistent control bar
- local storage for view/filter preferences
- warning affordances attached to detail rail

EMA adaptation
- Create `WorkbenchLayout`
- left = main analytical surface (graph/board/table/timeline/calendar)
- right = inspector/detail rail with tabs
- collapse/expand behavior standard across workbench pages
- store pane widths, active visualization, filter state

Use for
- Executions
- Lineage
- Explore
- deep Workstream view

Priority
- P0

Action
- Steal Directly

Implementation note
- This should become the primary EMA shell for analytical pages.

---

### Source
`repos/airflow/airflow-core/src/airflow/ui/src/components/DataTable/useTableUrlState.ts`

Pattern observed
- table state encoded in URL search params
- sorting also persisted to local storage keyed by path
- default table state derived from config

EMA adaptation
- Create `useViewUrlState` and `useTableUrlState`
- persist: sorting, pagination, groupings, visible columns, filters, time range
- route-specific keys so My Work and Triage can remember different configurations

Use for
- any dense list/table page

Priority
- P0

Action
- Steal Directly

Implementation note
- URL state is mandatory if saved views are going to feel real.

---

### Source
`repos/airflow/airflow-core/src/airflow/ui/src/components/NeedsReviewBadge.tsx`

Pattern observed
- lightweight badge with count
- links directly to filtered review queue
- uses iconography to encode human intervention requirement

EMA adaptation
- Create `NeedsAttentionBadge`, `NeedsApprovalBadge`, `NeedsVerificationBadge`
- clicking badge should open filtered queue, not just show a tooltip

Use for
- Home
- My Work
- Workstream headers
- entity headers

Priority
- P1

Action
- Steal Directly

Implementation note
- Human review must become navigable, not just visible.

---

### Source cluster
`repos/airflow/airflow-core/src/airflow/ui/src/pages/Dag/Calendar/*`
`repos/airflow/airflow-core/src/airflow/ui/src/layouts/Details/Gantt/Gantt.tsx`
`repos/airflow/airflow-core/src/airflow/ui/src/layouts/Details/Graph/Graph.tsx`

Pattern observed
- alternate temporal and structural lenses over same DAG/run data

EMA adaptation
- same workstream/execution data should support graph, timeline, calendar, gantt-ish schedule overlays

Use for
- Schedule
- Executions
- Workstreams

Priority
- P1

Action
- Adapt

---

## 3. Temporal UI

### Source
`repos/ui/src/routes/(app)/namespaces/[namespace]/workflows/[workflow]/[run]/+page.ts`

Pattern observed
- canonical redirect from object route to default subview (`timeline`)

EMA adaptation
- all detail pages redirect to explicit default tabs/subroutes
- examples:
  - `/executions/:id` -> `/executions/:id/timeline`
  - `/changes/:id` -> `/changes/:id/overview`
  - `/incidents/:id` -> `/incidents/:id/timeline`

Use for
- all object detail routes

Priority
- P0

Action
- Steal Directly

---

### Source cluster
`repos/ui/src/routes/(app)/namespaces/[namespace]/workflows/*`
`repos/ui/src/lib/utilities/query/list-workflow-query.ts`
`repos/ui/src/lib/stores/configurable-table-columns.ts`

Pattern observed
- route tree cleanly mirrors domain hierarchy
- workflow list state has query abstraction
- configurable table columns are treated as user settings

EMA adaptation
- route hierarchy should mirror ontology: workstreams, changes, executions, entities, incidents
- user-configurable columns for tables on My Work, Triage, Executions

Use for
- routing architecture
- saved views
- table customization

Priority
- P1

Action
- Adapt

---

### Source
`repos/ui/tests/integration/saved-query-views.spec.ts`

Pattern observed
- saved views are tested through URL query persistence
- supports system views, user views, edit/copy/delete, shared query links

EMA adaptation
- saved views are not a “nice to have”; define them as first-class entities or user prefs
- support:
  - system views
  - personal views
  - copy existing view
  - shareable URLs
  - view names that stay bound to query state

Use for
- SavedOperatorView model
- Explore
- Triage
- My Work
- Executions

Priority
- P0

Action
- Steal Directly

Implementation note
- Build automated tests for saved views early; they are a trust feature.

---

## 4. WeKan

### Source
`repos/wekan/client/components/sidebar/sidebar.js`

Pattern observed
- sidebar behaves as stateful tool surface, not static nav
- open/close/toggle/setView/getView semantics
- internal views include filters/search/custom fields/archives/settings
- keyboard/escape integration
- scroll-aware for long utility content

EMA adaptation
- Create global `OperatorRail`
- rail views:
  - Filters
  - Saved Views
  - Ownership
  - Related Objects
  - Evidence
  - Schedule
  - Notes
  - Export
  - View Options
- rail should be available across multiple pages with page-specific content modules

Use for
- Triage
- My Work
- Workstreams
- Explore
- Catalog

Priority
- P0

Action
- Adapt

Implementation note
- this is more valuable as interaction model than as visual styling source.

---

### Source cluster
`repos/wekan/client/components/gantt/*`
`repos/wekan/client/components/notifications/notificationsDrawer.js`
`repos/wekan/client/components/sidebar/sidebarFilters.js`
`repos/wekan/client/components/sidebar/sidebarSearches.js`

Pattern observed
- the board app ships supporting utilities as adjacent surfaces instead of separate pages

EMA adaptation
- operator tools should often appear in drawers/rails rather than standalone settings pages

Priority
- P1

Action
- Reference Only

---

## 5. Leantime

### Source
`repos/leantime/app/Domain/Dashboard/Js/dashboardController.js`

Pattern observed
- dashboards include progress charts, burndown, backlog trend, due-date interactions
- time and progress are tightly linked
- datepicker-based due-date editing sits close to work UI

EMA adaptation
- Home/My Work/Workstream pages should support quick scheduling, reminders, and progress views
- use progress widgets for:
  - verified vs unverified
  - completed vs blocked
  - recurring obligations done vs missed

Use for
- Home
- My Work
- Workstreams
- Schedule

Priority
- P1

Action
- Adapt

---

### Source cluster
`repos/leantime/app/Domain/Calendar/Js/calendarController.js`
`repos/leantime/app/Domain/Tickets/Js/kanbanController.js`
`repos/leantime/public/assets/js/libs/simpleGantt/frappe-gantt.js`

Pattern observed
- calendar, kanban, gantt coexist inside one product without feeling separate

EMA adaptation
- schedule must be a first-class alternate lens, not a bolt-on app

Priority
- P1

Action
- Adapt

---

## 6. Argo CD

### Source
`repos/argo-cd/ui/src/app/applications/components/application-status-panel/application-status-panel.tsx`

Pattern observed
- status panel broken into semantic mini-sections:
  - app health
  - source hydrator
  - sync status
  - last sync
  - app conditions
  - sync windows
  - progressive sync
- each section has title, help affordance, detailed values, click-through behavior
- strong distinction between current health, sync state, last operation, and windows

EMA adaptation
- Create `StatusPanel` with modular sections for:
  - health
  - trust state
  - last execution
  - verification
  - conditions/issues
  - schedule window
  - reconcile state
- each section can click into deeper detail

Use for
- ChangeDetail
- EntityDetail
- ExecutionDetail
- WorkstreamOverview sidebar

Priority
- P0

Action
- Steal Directly

Implementation note
- Distinguish current state, last operation, and allowed window. Do not collapse these into one status chip.

---

### Source cluster
`repos/argo-cd/ui/src/app/applications/components/application-deployment-history/*`
`repos/argo-cd/ui/src/app/applications/components/resource-details/*`
`repos/argo-cd/ui/src/app/shared/components/events-list/events-list.tsx`
`repos/argo-cd/ui/src/app/settings/components/project-sync-windows-edit-panel/*`

Pattern observed
- resource details, deployment history, event lists, and sync windows are adjacent concepts

EMA adaptation
- every actionable object should expose:
  - history
  - related resources/entities
  - event stream
  - allowed windows / schedule windows

Priority
- P1

Action
- Adapt

---

## 7. Spinnaker

### Source cluster
`repos/spinnaker/deck-kayenta/src/kayenta/layout/listDetail.tsx`
`repos/spinnaker/deck-kayenta/src/kayenta/layout/table/*`
`repos/spinnaker/deck-kayenta/src/kayenta/report/detail/*`
`repos/spinnaker/deck/packages/*/details/sections/*`

Pattern observed
- detail sections are strongly modularized
- list-detail patterns exist alongside tables and graphs
- sections like health/logs/scheduled actions/tags are explicit reusable chunks

EMA adaptation
- implement reusable detail sections:
  - OverviewSection
  - HealthSection
  - TrustSection
  - LogsSection
  - ScheduleSection
  - TagsSection
  - ArtifactsSection
  - RelationsSection

Use for
- EntityDetail
- ChangeDetail
- ExecutionDetail

Priority
- P1

Action
- Adapt

---

## 8. Backstage

### Source cluster
`repos/backstage/docs-ui/src/app/components/page.mdx`
`repos/backstage/docs-ui/src/app/components/plugin-header/page.mdx`
`repos/backstage/docs-ui/src/app/components/tag-group/page.mdx`
`repos/backstage/docs-ui/src/app/components/table/page.mdx`
`repos/backstage/.changeset/catalog-entity-page-no-header.md`
`repos/backstage/.changeset/catalog-graph-*.md`

Pattern observed
- mature design-system thinking around pages, plugin headers, tag groups, tables
- catalog entity pages treated as a stable core product surface

EMA adaptation
- design system should define:
  - page header anatomy
  - plugin/module header style for embedded tools
  - tag/trust/owner group presentation
  - entity page conventions

Use for
- Catalog
- Workstream pages
- shared design system

Priority
- P1

Action
- Reference Only / Adapt

---

## 9. Cross-source synthesis → build directives

### Directive A: EMA needs 4 shell primitives
1. `WorkbenchLayout` — Airflow
2. `DetailRailLayout` — Plane
3. `BoardWorkspace` — Plane + WeKan
4. `EntityConsoleLayout` — Argo + Spinnaker + Backstage

### Directive B: URL state is non-negotiable
Steal from:
- Airflow `useTableURLState`
- Temporal saved query mechanics
- Plane layout selector URL updates

Implement:
- filters
- sorting
- pagination
- view mode
- selected inspector item
- active time range
- saved view ID

### Directive C: Saved views must be first-class
Steal from:
- Temporal saved-query tests

Implement:
- system and user views
- copy/edit/delete
- shared deep links
- tests before polish

### Directive D: Status must be decomposed
Steal from:
- Argo status panel

Always separate:
- current health
- trust state
- last execution
- verification state
- conditions
- allowed window
- reconcile state

### Directive E: Human review must be navigable
Steal from:
- Airflow `NeedsReviewBadge`

Implement badges that link to filtered review queues.

---

## 10. Immediate v1.1 implementation mapping

### Build now (P0)
- `WorkbenchLayout`
- `DetailRailLayout`
- `OperatorRail`
- `ViewModeSwitcher`
- `useViewUrlState`
- `SavedViewBar`
- `StatusPanel`
- `NeedsAttentionBadge`

### Build next (P1)
- `BoardWorkspace`
- `CalendarAgenda`
- `TimelineRail`
- `VerificationCard`
- `RelationsPanel`
- `EventsList`
- `ScheduleWindowPanel`

### Leave later (P2)
- richer charting/burndown widgets
- very advanced canary/progressive sync metaphors
- heavy graph customization controls

---

## 11. What not to steal blindly

- WeKan’s legacy implementation style: steal interaction model, not code style
- Grafana’s panel sprawl: avoid turning EMA Home into dashboard soup
- Kibana’s complexity density: use investigation power without making primary flows query-hostile
- Airflow’s DAG-specific terminology: steal structure, not vocabulary

---

## 12. Recommended next pass after this brief

1. map these patterns into concrete EMA components/files/routes
2. build low-fi shell scaffolds
3. wire URL state + saved views first
4. add detail/status/inspector patterns before visual polish
