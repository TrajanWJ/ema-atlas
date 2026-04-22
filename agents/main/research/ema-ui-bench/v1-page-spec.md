# EMA UI v1.1 Page Spec Pack

## Product thesis
EMA is an operator workbench combining:
- control plane
- work management
- catalog
- investigation/reality reconciliation

---

## Top-level navigation
- Home
- My Work
- Triage
- Workstreams
- Changes
- Executions
- Catalog
- Schedule
- Lineage
- Explore
- Incidents

---

## 1. Home
Purpose: orient operator quickly.

Sections:
- Health strip
- Attention queue
- Active workstreams
- Pending approvals
- Recent major executions
- Drift/orphan summary
- Upcoming schedule windows
- Recent incidents

Rules:
- every card drills to underlying objects
- no vanity metrics without evidence

Primary actions:
- open triage
- approve change
- inspect failed execution
- continue workstream

---

## 2. My Work
Purpose: personal operator cockpit.

Sections:
- Needs my approval
- Assigned to me
- Overdue
- Due today / this week
- Waiting on others
- Blocked by me
- Recurring checks due
- Scheduled this week
- Active workstreams I own

Views:
- list
- board
- calendar agenda

Primary actions:
- acknowledge
- assign/reassign
- snooze
- schedule
- complete
- escalate

---

## 3. Triage
Purpose: operational inbox.

Item types:
- incoming requests
- failed executions
- orphaned objects
- stale claims
- drift detections
- incidents
- proposals awaiting routing
- missing verification

Default groups:
- New
- Needs owner
- Needs decision
- Blocked
- Stale
- Duplicate
- Scheduled later

Actions:
- assign
- merge
- snooze
- reject
- convert to proposal
- convert to action item
- escalate
- schedule review

Preferred layout:
- board or grouped list + inspector pane

---

## 4. Workstreams
Purpose: one authoritative lane for meaningful work.

Workstream tabs:
- Overview
- Items
- Changes
- Executions
- Timeline
- Calendar
- Docs
- Risks
- Activity

Overview modules:
- summary
- owners/contributors
- current status
- goals contributed to
- open blockers
- next milestones
- linked entities
- health snapshot

Views on Items tab:
- table
- board
- timeline

---

## 5. Changes
Purpose: proposal/change control surface.

List filters:
- status
- owner
- risk
- workstream
- target entity
- approval state
- verification state

Proposal detail tabs:
- Overview
- Scope
- Approvals
- Execution chain
- Verification
- Risks
- Artifacts
- Activity

Key side panel:
- status
- owner
- blast radius
- schedule window
- rollback plan
- trust state

Primary actions:
- approve
- reject
- request changes
- run now
- schedule
- canary
- rollback
- mark verified

---

## 6. Executions
Purpose: inspect what actually ran.

List columns:
- status
- title
- proposal/workstream
- target host/entity
- initiator
- start/end
- duration
- verification status
- artifacts count

Execution detail tabs:
- Overview
- Timeline
- Stages/Tasks
- Evidence
- Artifacts
- Relationships
- Verification
- Raw

Preferred layout:
- header summary
- timeline rail
- split-pane evidence view

---

## 7. Catalog
Purpose: browse durable things.

Catalog entity groups:
- Hosts
- Agents
- Sessions
- Repos
- Channels
- Workstreams
- Proposals
- Executions
- Artifacts
- Policies

Facet filters:
- owner
- environment
- health
- trust state
- tags
- workstream
- source system

Entity detail tabs:
- Overview
- Health
- Related work
- Related executions
- Artifacts
- Incidents
- Activity
- Notes

Special smart views:
- orphaned entities
- degraded entities
- stale entities
- high-risk entities

---

## 8. Schedule
Purpose: make time visible.

Views:
- calendar
- agenda
- timeline
- maintenance windows
- recurring obligations

Overlays:
- change windows
- deadlines
- recurring checks
- milestones
- incidents
- blocked work due dates

Actions:
- schedule change
- set reminder
- create recurring check
- drag reschedule

---

## 9. Lineage
Purpose: causality and truth graph.

Capabilities:
- graph of linked objects
- temporal overlay
- upstream/downstream traversal
- evidence-backed edges
- compare expected vs observed branch

Node types:
- request
- workstream
- proposal
- approval
- execution
- stage
- task
- artifact
- entity
- incident
- action item

Preferred layout:
- graph center
- timeline/evidence side panel

---

## 10. Explore
Purpose: query-first investigation.

Capabilities:
- universal search
- field/facet filters
- raw query mode
- saved views
- compare mode
- export/share link

Typical questions:
- failed executions on host X in last 24h
- unverified changes in workstream Y
- all orphaned artifacts
- recurring checks missed this week

---

## 11. Incidents
Purpose: structured response + learning.

List groups:
- Active
- Monitoring
- Resolved
- Learning

Incident detail tabs:
- Overview
- Timeline
- Affected entities
- Related executions
- Communications
- Follow-ups
- Learnings

Actions:
- declare
- assign owner
- link execution
- add follow-up item
- resolve

---

## Shared components
- StatusChip
- TrustBadge
- EntityPill
- OwnerAvatar/OwnerChip
- AttentionCard
- TimelineRail
- RelationshipGraph
- EvidencePanel
- VerificationCard
- ChangeRiskCard
- SchedulePill
- SavedViewBar
- FacetSidebar
- InspectorDrawer
- QuickCaptureBar

---

## Golden workflows

### Workflow A: operator starts from attention
Home -> Triage -> Proposal/Execution -> assign or approve -> schedule or execute -> verify -> close

### Workflow B: operator works a lane
My Work -> Workstream -> open items -> run/approve change -> inspect execution -> update docs -> complete

### Workflow C: operator traces reality
Alert/drift -> Execution or Catalog entity -> Lineage -> Evidence -> Reconcile -> Verification -> close
