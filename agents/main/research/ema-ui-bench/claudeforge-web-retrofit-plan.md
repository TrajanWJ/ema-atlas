# ClaudeForge Web Retrofit Plan for EMA Operator Surface

Target repo:
- `/home/trajan/Projects/ema/claudeforge/packages/web`

Current stack observed:
- Next 15 app router
- React 19
- Zustand stores
- Tailwind 4
- shared types/events from `@claudeforge/shared`

---

## 1. Current surface shape

### Routes present
- `/` → sessions/chat view
- `/tasks` → kanban-like task board
- `/agents` → agent cards
- `/system` → system health dashboard

### Core shared shell
- `src/components/layout/Layout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/TopNav.tsx`

### State model present
- `src/stores/session-store.ts`
- `src/stores/system-store.ts`

### Session/chat primitives present
- `ChatView.tsx`
- `SessionHeader.tsx`
- `MessageBubble.tsx`
- `ToolCallCard.tsx`

---

## 2. What the current app already does well

### A. Event-driven updates are already in place
`Layout.tsx` already binds WebSocket server events into Zustand stores.

This is strong because the future operator surface can be fed from the same stream.

### B. Sidebar already models a project/session tree
This is a real foothold for the future catalog/workstream nav.

### C. Tasks page already proves board-style rendering is acceptable
There is already a lightweight kanban idiom in the app.

### D. SessionHeader + ToolCallCard are early versions of status/evidence patterns
These are primitive, but structurally useful.

---

## 3. Structural gaps vs target EMA operator surface

The current app is mostly a:
- session console
- task board
- agent list
- system health page

It is not yet a:
- workbench
- catalog
- change control plane
- lineage/execution surface
- saved-view driven operator console

The biggest missing layers are:
1. route depth
2. URL state and saved views
3. decomposed status panels
4. inspector/detail rails
5. catalog/workstream/change/execution concepts in UI

---

## 4. Retrofit strategy: evolve, don’t restart

Do **not** replace the current app shell wholesale.
Instead, evolve it in phases.

### Phase A — preserve existing shell, add operator primitives
Keep:
- `Layout.tsx`
- `TopNav.tsx`
- `Sidebar.tsx`
- current stores

Add:
- `OperatorRail`
- `ViewModeSwitcher`
- `SavedViewBar`
- `StatusPanel`
- `NeedsAttentionBadge`
- URL state hooks

### Phase B — deepen route tree
Keep current top-level routes, but add richer subroutes:
- `/sessions/:id`
- `/tasks` with view modes + saved views
- new `/workstreams`
- new `/changes`
- new `/executions`
- new `/catalog`
- new `/explore`

### Phase C — reinterpret existing pages as seeds of future modules
- current `/` becomes session/execution console seed
- current `/tasks` becomes My Work / Triage seed
- current `/system` becomes Home/System status seed
- current `/agents` becomes Catalog → Agents seed

---

## 5. Concrete component mapping into current repo

## Existing file → future role

### `src/components/layout/Layout.tsx`
Future role:
- retain as global app shell wrapper
- add provider wrappers for view state and operator rail
- optionally support route-specific content chrome

Recommended change:
- keep the websocket/data-loading responsibilities
- avoid stuffing page-specific logic here

---

### `src/components/layout/Sidebar.tsx`
Current role:
- projects/sessions tree + two static bottom buttons

Future role:
- left catalog/workstream navigation spine
- support section switching:
  - Locations
  - Workstreams
  - Catalog
  - Saved Views (optional shortcut)

Recommended change:
- preserve project/session tree
- add mode tabs or sections rather than replacing the tree outright
- turn bottom action buttons into real route links

---

### `src/components/layout/TopNav.tsx`
Current role:
- top-level primary nav

Future role:
- Home / My Work / Triage / Workstreams / Changes / Executions / Catalog / Explore / System

Recommended change:
- expand nav carefully
- keep connected state indicator
- add global quick capture / search later

---

### `src/components/sessions/SessionHeader.tsx`
Current role:
- session status summary

Future role:
- prototype for reusable `StatusPanelSection` / `ExecutionHeader`

Recommended change:
- split display concerns from session actions
- make reusable subcomponents:
  - status chip
  - metadata row
  - action buttons

---

### `src/components/sessions/ToolCallCard.tsx`
Current role:
- expandable evidence card

Future role:
- seed for reusable `EvidenceCard` / `EventsListRow`

Recommended change:
- abstract icon mapping and metadata rendering
- reuse for execution evidence surfaces outside chat

---

### `src/app/tasks/page.tsx`
Current role:
- simple kanban board by task status

Future role:
- either `My Work` or `Triage` seed

Recommended change:
- do not throw away
- evolve into board/list/table/timeline surface with saved views
- add grouping modes and filters

---

### `src/app/system/page.tsx`
Current role:
- resource and error dashboard

Future role:
- Home/System status seed

Recommended change:
- can grow into `Home` with:
  - attention queue
  - workstream summary
  - schedule summary
  - recent incidents
  - degraded entities

---

### `src/app/agents/page.tsx`
Current role:
- agent cards

Future role:
- Catalog → Agents seed

Recommended change:
- reframe into entity page list with health/ownership/activity

---

## 6. Immediate new routes to add in this repo

### Keep existing
- `/`
- `/tasks`
- `/agents`
- `/system`

### Add next
- `/workstreams`
- `/changes`
- `/executions`
- `/catalog`
- `/explore`

### Add detail routes after that
- `/sessions/[id]`
- `/tasks/[id]` or inspector state within `/tasks`
- `/changes/[id]`
- `/executions/[id]`
- `/catalog/[kind]/[id]`

---

## 7. Data-model pressure points in current shared types

Current shared types are useful but too narrow for full EMA UI.

### Present and useful
- `ProjectLocation`
- `SessionRecord`
- `TaskRecord`
- `ChatMessage`
- `ToolCall`
- `SystemHealth`
- `AppStatus`

### Missing for target EMA surface
Need future types for:
- Workstream
- Change/Proposal
- Execution
- EvidenceEvent (outside chat)
- SavedView
- Responsibility
- ScheduleEntry
- Incident
- Verification
- Reconciliation

### Retrofit guidance
Do not overload `TaskRecord` to mean everything.
Add new shared types instead of turning tasks into a junk drawer.

---

## 8. Highest-leverage retrofit steps in the real repo

## P0
1. add route constants and expanded nav model
2. add `useViewUrlState` hook
3. add `SavedViewBar`
4. evolve `/tasks` into multi-view work surface
5. add reusable `StatusChip`, `TrustBadge`, `NeedsAttentionBadge`

## P1
6. add `OperatorRail`
7. add `/executions` page reusing session/event/tool-call primitives
8. add `/catalog` page starting from agents/projects/sessions/entities
9. add richer `/system` as operator home summary

## P2
10. add `WorkbenchLayout`
11. add `DetailRailLayout`
12. add change/execution detail pages
13. add explore/query surfaces

---

## 9. Specific benchmark → claudeforge retrofit matches

### Plane → current tasks page
- apply view switching, inspector, better detail presentation

### Airflow → future executions page
- split-pane workbench with left canvas and right details

### Temporal → saved views and deeper route model
- URL-bound views, detail subroutes, history lenses

### Argo → system/status/catalog pages
- decomposed status panels, conditions, schedule windows, history

### WeKan → current sidebar
- transform sidebar into more capable navigation/utility surface

### Leantime → home/tasks/schedule thinking
- due work, recurring obligations, time-aware grouping, progress context

---

## 10. Recommendation on the scratch scaffold in workspace

`workspace/ema-ui/` should now be treated as:
- naming sandbox
- idea cache
- not the main implementation target

The real target for UI evolution should be:
- `/home/trajan/Projects/ema/claudeforge/packages/web`

---

## 11. Best next concrete pass

Next pass should be file-surgical on the real repo:
- propose exact files to add/edit under `packages/web/src`
- define route additions
- define store additions
- define component insertion points
- if desired, start editing the actual repo instead of only documenting
