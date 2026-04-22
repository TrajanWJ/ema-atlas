# EMA v1.1 Component Tree + Route Tree + File Scaffold Plan

## Goal
Translate the benchmark-derived patterns into a concrete implementation shape that can be scaffolded immediately.

---

## 1. Proposed app structure

Assumption: modern React/TypeScript app with route-based pages and co-located feature modules.

```text
ema-ui/
  package.json
  src/
    app/
      router/
      providers/
      shell/
    pages/
      home/
      my-work/
      triage/
      workstreams/
      changes/
      executions/
      catalog/
      schedule/
      lineage/
      explore/
      incidents/
    features/
      saved-views/
      filters/
      view-state/
      operator-rail/
      status-panel/
      timeline/
      relations/
      evidence/
      schedule-windows/
      quick-capture/
    layouts/
      WorkbenchLayout/
      DetailRailLayout/
      BoardWorkspaceLayout/
      EntityConsoleLayout/
    components/
      primitives/
      badges/
      cards/
      navigation/
      tables/
      drawers/
      graph/
      calendar/
    domain/
      models/
      mappers/
      routes/
      views/
    mocks/
      fixtures/
      adapters/
```

---

## 2. Route tree

```text
/
  /                  -> HomePage
  /my-work           -> MyWorkPage
  /triage            -> TriagePage
  /workstreams       -> WorkstreamsListPage
  /workstreams/:id   -> redirect -> /workstreams/:id/overview
  /workstreams/:id/overview
  /workstreams/:id/items
  /workstreams/:id/timeline
  /workstreams/:id/calendar
  /workstreams/:id/docs
  /workstreams/:id/activity
  /changes           -> ChangesListPage
  /changes/:id       -> redirect -> /changes/:id/overview
  /changes/:id/overview
  /changes/:id/executions
  /changes/:id/verification
  /changes/:id/activity
  /executions        -> ExecutionsListPage
  /executions/:id    -> redirect -> /executions/:id/timeline
  /executions/:id/timeline
  /executions/:id/stages
  /executions/:id/evidence
  /executions/:id/artifacts
  /executions/:id/verification
  /catalog           -> CatalogPage
  /catalog/:kind/:id -> redirect -> /catalog/:kind/:id/overview
  /catalog/:kind/:id/overview
  /catalog/:kind/:id/activity
  /catalog/:kind/:id/executions
  /catalog/:kind/:id/artifacts
  /schedule          -> SchedulePage
  /lineage/:subjectType/:subjectId -> LineagePage
  /explore           -> ExplorePage
  /incidents         -> IncidentsListPage
  /incidents/:id     -> redirect -> /incidents/:id/timeline
  /incidents/:id/overview
  /incidents/:id/timeline
  /incidents/:id/follow-ups
```

---

## 3. Layout assignment by route

### `WorkbenchLayout`
Use on:
- `/executions/*`
- `/lineage/*`
- `/explore`
- optionally `/workstreams/:id/timeline`

Shape:
- top toolbar
- main canvas left
- inspector right
- collapsible rail

Inspired by:
- Airflow detail workbench

### `DetailRailLayout`
Use on:
- `/changes/:id/*`
- `/workstreams/:id/overview`
- `/incidents/:id/*`

Shape:
- rich content body left
- persistent metadata rail right

Inspired by:
- Plane full-screen peek

### `BoardWorkspaceLayout`
Use on:
- `/my-work`
- `/triage`
- `/workstreams/:id/items`

Shape:
- saved view bar
- layout switcher
- board/list/table/timeline area
- optional inspector drawer

Inspired by:
- Plane + WeKan

### `EntityConsoleLayout`
Use on:
- `/catalog/:kind/:id/*`

Shape:
- summary header
- status panel
- tabbed detail sections
- related objects and events

Inspired by:
- Argo + Spinnaker + Backstage

---

## 4. First-class features and file boundaries

## A. view-state

Files:
```text
src/features/view-state/
  useViewUrlState.ts
  useTableUrlState.ts
  searchParams.ts
  localStorageKeys.ts
  types.ts
```

Responsibilities:
- URL sync for filters, sorting, pagination, time range, active tab, view mode, selected inspector object
- route-keyed local persistence

Primary benchmark sources:
- Airflow `useTableUrlState.ts`
- Plane layout selection URL sync
- Temporal saved query behavior

---

## B. saved-views

Files:
```text
src/features/saved-views/
  SavedViewBar.tsx
  SavedViewChip.tsx
  SavedViewModal.tsx
  useSavedViews.ts
  savedViews.types.ts
  savedViews.fixtures.ts
```

Responsibilities:
- system views
- personal views
- create/edit/copy/delete
- activate current query state

Primary benchmark sources:
- Temporal saved-query tests
- Linear/GitHub Projects behavioral model

---

## C. operator-rail

Files:
```text
src/features/operator-rail/
  OperatorRail.tsx
  OperatorRailContext.tsx
  OperatorRailToggle.tsx
  views/
    FiltersRailView.tsx
    SavedViewsRailView.tsx
    OwnershipRailView.tsx
    RelatedObjectsRailView.tsx
    EvidenceRailView.tsx
    ScheduleRailView.tsx
    NotesRailView.tsx
    ViewOptionsRailView.tsx
```

Responsibilities:
- stateful utility sidebar
- page-specific rail modes
- keyboard-friendly open/close/view switching

Primary benchmark source:
- WeKan `sidebar.js`

---

## D. status-panel

Files:
```text
src/features/status-panel/
  StatusPanel.tsx
  StatusPanelSection.tsx
  panels/
    HealthSection.tsx
    TrustSection.tsx
    LastExecutionSection.tsx
    VerificationSection.tsx
    ConditionsSection.tsx
    ScheduleWindowSection.tsx
    ReconcileSection.tsx
```

Responsibilities:
- decomposed operational truth
- section-level help / drilldown
- shared across change/entity/execution/workstream detail

Primary benchmark source:
- Argo application status panel

---

## E. timeline / evidence

Files:
```text
src/features/timeline/
  TimelineRail.tsx
  TimelineGroup.tsx
  TimelineEventRow.tsx
src/features/evidence/
  EventsList.tsx
  EvidencePanel.tsx
  RawPayloadPanel.tsx
```

Responsibilities:
- event chronology
- evidence drilldown
- raw payload access

Primary benchmark sources:
- Temporal timeline/history
- Argo events list
- Airflow detail timeline instincts

---

## F. relations

Files:
```text
src/features/relations/
  RelationsPanel.tsx
  EntityPill.tsx
  RelatedObjectsList.tsx
  RelationshipGraph.tsx
```

Responsibilities:
- linked entities/proposals/executions/artifacts
- quick pivot navigation
- graph hook for lineage pages

Primary benchmark sources:
- Backstage catalog
- Dagster lineage
- Argo resource details

---

## G. badges and attention

Files:
```text
src/components/badges/
  NeedsAttentionBadge.tsx
  NeedsApprovalBadge.tsx
  NeedsVerificationBadge.tsx
  TrustBadge.tsx
  StatusChip.tsx
```

Responsibilities:
- compact, count-bearing, navigable badges

Primary benchmark source:
- Airflow `NeedsReviewBadge.tsx`

---

## H. view switching

Files:
```text
src/components/navigation/
  ViewModeSwitcher.tsx
  ViewModeIcon.tsx
```

Responsibilities:
- switch board/list/table/timeline/calendar/graph
- preserve current filters and selection

Primary benchmark source:
- Plane `layout-selection.tsx`

---

## 5. Page-level file scaffold

```text
src/pages/home/
  HomePage.tsx
  HomeHealthStrip.tsx
  HomeAttentionQueue.tsx
  HomeUpcomingSchedule.tsx

src/pages/my-work/
  MyWorkPage.tsx
  MyWorkListView.tsx
  MyWorkBoardView.tsx
  MyWorkAgendaView.tsx

src/pages/triage/
  TriagePage.tsx
  TriageBoardView.tsx
  TriageTableView.tsx
  TriageInspector.tsx

src/pages/workstreams/
  WorkstreamsListPage.tsx
  WorkstreamOverviewPage.tsx
  WorkstreamItemsPage.tsx
  WorkstreamTimelinePage.tsx
  WorkstreamCalendarPage.tsx

src/pages/changes/
  ChangesListPage.tsx
  ChangeOverviewPage.tsx
  ChangeExecutionsPage.tsx
  ChangeVerificationPage.tsx

src/pages/executions/
  ExecutionsListPage.tsx
  ExecutionTimelinePage.tsx
  ExecutionStagesPage.tsx
  ExecutionEvidencePage.tsx
  ExecutionVerificationPage.tsx

src/pages/catalog/
  CatalogPage.tsx
  CatalogEntityOverviewPage.tsx
  CatalogEntityActivityPage.tsx
  CatalogEntityExecutionsPage.tsx

src/pages/schedule/
  SchedulePage.tsx
  ScheduleCalendarView.tsx
  ScheduleAgendaView.tsx

src/pages/lineage/
  LineagePage.tsx
  LineageInspector.tsx

src/pages/explore/
  ExplorePage.tsx
  ExploreResultsTable.tsx
  ExploreFilterBuilder.tsx

src/pages/incidents/
  IncidentsListPage.tsx
  IncidentOverviewPage.tsx
  IncidentTimelinePage.tsx
  IncidentFollowUpsPage.tsx
```

---

## 6. P0 build sequence

### Step 1: shell primitives
- `WorkbenchLayout`
- `DetailRailLayout`
- `BoardWorkspaceLayout`
- `EntityConsoleLayout`

### Step 2: state primitives
- `useViewUrlState`
- `SavedViewBar`
- `ViewModeSwitcher`

### Step 3: operator primitives
- `OperatorRail`
- `StatusPanel`
- `NeedsAttentionBadge`

### Step 4: first real pages
- `MyWorkPage`
- `TriagePage`
- `ChangeOverviewPage`
- `ExecutionTimelinePage`

### Step 5: expand outward
- `CatalogEntityOverviewPage`
- `SchedulePage`
- `ExplorePage`
- `IncidentOverviewPage`

---

## 7. Minimal fixture-first approach

Before real backend wiring, create typed fixtures for:
- workstream
- proposal/change
- execution
- action item
- entity
- incident
- schedule entry
- evidence event
- saved view

This allows shell building without waiting on all APIs.

---

## 8. Naming decisions to keep stable

Use these names early and avoid churn:
- `WorkbenchLayout`
- `DetailRailLayout`
- `BoardWorkspaceLayout`
- `EntityConsoleLayout`
- `OperatorRail`
- `SavedViewBar`
- `ViewModeSwitcher`
- `StatusPanel`
- `TimelineRail`
- `RelationsPanel`
- `NeedsAttentionBadge`
- `TrustBadge`
- `VerificationCard`
