# EMA UI Pattern Board

## Goal
Map external/open-source UI patterns into EMA v1.1 design language.

---

## 1. Plane
Source type: OSS project management

Steal:
- Work items as central object
- Cycles for bounded operational cadences
- Modules as workstream slices
- Saved views as core navigation aid
- Pages/docs attached to work context
- Lightweight analytics over live work

EMA translation:
- `ActionItem`
- `CadenceWindow`
- `Workstream`
- `SavedOperatorView`
- attached docs/spec/context pages

Use on pages:
- My Work
- Workstreams
- Triage
- Changes

---

## 2. Vikunja
Source type: OSS tasks / planning

Steal:
- One dataset, multiple views: list/table/kanban/gantt
- Subtasks and task relations
- Recurring tasks and reminders
- Saved filters
- Quick-add parsing patterns

EMA translation:
- same objects rendered as board/table/timeline/calendar/graph
- recurring verification/reconciliation tasks
- dependency links: blocked-by, verifies, derived-from, supersedes
- quick capture into structured work items

Use on pages:
- My Work
- Schedule
- Workstreams
- Triage

---

## 3. Leantime
Source type: OSS strategy+planning+execution suite

Steal:
- Strategy/planning/execution in one UI
- My Work dashboard
- Calendar + gantt + kanban + table coexistence
- Goals/metrics attached to work
- Risk and milestone framing

EMA translation:
- proposal -> execution -> verification -> learning in one product
- personal operator cockpit
- goal contribution chips on work items
- milestone and maintenance-window awareness
- risk panel on changes/workstreams

Use on pages:
- Home
- My Work
- Workstreams
- Schedule
- Changes

---

## 4. WeKan
Source type: OSS kanban

Steal:
- board clarity
- minimal cognitive load around state progression

EMA translation:
- state boards for triage, incidents, changes, responsibilities

Use on pages:
- Triage
- Changes
- Incidents

---

## 5. Backstage
Source type: OSS developer portal / catalog

Steal:
- catalog as spine
- ownership and discoverability
- entity-centric plugin layout

EMA translation:
- Catalog is primary, not afterthought
- host/agent/repo/channel/proposal/execution/artifact/workstream all become first-class entities
- each entity page hosts related tools, evidence, work, status

Use on pages:
- Catalog
- Entity detail
- Workstreams

---

## 6. Temporal
Source type: workflow orchestration UI

Steal:
- strong execution detail pages
- saved views and visibility filters
- relationships and pending work
- history as first-class evidence

EMA translation:
- execution details with tabs: overview, timeline, evidence, artifacts, relationships, verification
- saved operator views for common slices

Use on pages:
- Executions
- Changes
- Lineage

---

## 7. Airflow
Source type: orchestration UI

Steal:
- home with health + recent activity
- grid/timeline-like inspection for repeated runs
- graph view for dependencies
- detail tabs with code/runs/tasks/events

EMA translation:
- work family / recurring workflow grid
- dependency graph and run timeline
- detail drilldowns from summary cards

Use on pages:
- Home
- Executions
- Lineage

---

## 8. Dagster
Source type: asset catalog / lineage

Steal:
- catalog facets (owner, group, location, tags)
- global lineage

EMA translation:
- entity facets: owner, environment, host, workstream, trust state, tags
- global lineage over proposals/executions/artifacts/entities

Use on pages:
- Catalog
- Lineage
- Explore

---

## 9. Grafana
Source type: observability dashboards

Steal:
- composable panels
- at-a-glance summaries with drilldown

EMA translation:
- Home as operator launchpad with panel-to-evidence drilldowns
- workstream overview panels

Use on pages:
- Home
- Workstreams

---

## 10. Kibana Discover
Source type: investigation/query UI

Steal:
- search/filter/share workflow
- field-aware analysis
- saved searches

EMA translation:
- Explore mode over all events/entities
- shareable investigative views
- compare failures/anomalies

Use on pages:
- Explore
- Lineage

---

## 11. Linear
Source type: product/issue tracking

Steal:
- triage inbox ergonomics
- decisive actions: accept/decline/snooze/duplicate
- crisp ownership and status flow

EMA translation:
- Triage inbox as first-class operational surface
- queue actions: assign, merge, snooze, escalate, convert, reject

Use on pages:
- Triage
- My Work

---

## 12. GitHub Projects
Source type: planning/tracking

Steal:
- same items, many saved layouts
- custom fields and charts

EMA translation:
- single EMA object model, many saved perspectives
- custom fields for confidence, source-of-truth, verification, risk

Use on pages:
- Workstreams
- My Work
- Schedule

---

## 13. Spinnaker
Source type: deployment/change control

Steal:
- explicit hierarchy: application -> pipeline -> stage -> task
- manual judgment as a first-class step
- delivery strategies

EMA translation:
- workstream -> proposal -> execution -> stage -> task -> artifact -> verification
- human judgment nodes are visible and auditable
- canary/scheduled/rollback strategies on changes

Use on pages:
- Changes
- Executions
- Lineage

---

## 14. Argo CD
Source type: GitOps/control-plane UI

Steal:
- health / reconcile / resource actions / orphaned resources

EMA translation:
- observed vs desired state is explicit
- reconcile action is core
- orphaned objects have dedicated views

Use on pages:
- Catalog
- Changes
- Explore

---

## 15. Cross-cutting cool patterns to keep

### Personal operator cockpit
- My approvals
- My due work
- My recurring obligations
- What is blocked by me
- What I delegated

### Responsibility overlays
- owner
- current responsible operator
- escalation owner
- next due touch
- orphaned if missing

### Calendar-aware ops
- change windows
- recurring checks
- scheduled maintenance
- milestone dates
- future commitments

### Truth/reality overlays
- observed
- inferred
- stale
- verified
- disputed
- reconcile available

### Orphan/stale/drift smart views
- proposals without execution
- executions without verification
- artifacts without owner
- stale claims
- missed recurring tasks
- blocked workstreams

### Quick capture
Natural text -> structured work item/proposal/schedule entry

---

## Shortlist of most important steals for v1.1
1. Plane work items/views
2. Leantime my-work + calendar/gantt + goals
3. Backstage catalog spine
4. Temporal/Airflow execution detail + history
5. Linear triage
6. Argo reconcile/orphan/drift ideas
