# EMA UI North Star

## Executive summary
EMA is not just a dashboard, not just a task board, and not just an agent console.

EMA should present as a **control plane workbench** where an operator can:
- see what is happening now
- understand what needs attention
- inspect what changed and why
- trace runtime evidence back to intent
- manage responsibility, schedules, and verification

The UI should reconcile:
- **catalog** — what exists
- **flow** — what is moving
- **reality** — what is actually true
- **responsibility** — who owns the next move

---

## EMA is
- an operator workbench
- a workstream-aware control plane
- a source-of-truth browser
- an execution/evidence/verification surface
- a responsibility and review system

## EMA is not
- a generic PM tool
- a metrics-only dashboard
- a chat app with side panels
- a raw logs viewer
- a ticket graveyard

---

## Core product questions the UI must answer fast
1. What needs me now?
2. What is actually happening?
3. What changed?
4. What is blocked?
5. What is the authoritative lane for this work?
6. What evidence supports the current state?
7. What should happen next?

---

## Primary user modes

### 1. Command mode
Used when the operator needs fast orientation.

Needs:
- health summary
- attention queue
- active workstreams
- degraded/blocked items
- quick pivots

### 2. Work mode
Used when the operator is driving a lane.

Needs:
- workstream focus
- tasks and review items
- changes
- executions
- schedule
- notes/context

### 3. Investigation mode
Used when something diverges from expectation.

Needs:
- evidence timeline
- runtime history
- causality / lineage
- source-of-truth conflict visibility
- verification state

### 4. Catalog mode
Used when the operator needs entity truth.

Needs:
- agents
- sessions
- projects/locations
- later hosts/channels/artifacts/policies
- ownership, health, related activity

---

## Design stance
The product should feel like:
- **Linear** in decisiveness
- **Backstage** in entity spine
- **Temporal/Airflow** in runtime inspection
- **Argo/Spinnaker** in change/status decomposition
- **Plane/Leantime** in workstream ownership and planning

But the synthesis should still feel uniquely EMA:
- darker
- calmer
- more operational
- more truth-oriented
- more responsibility-aware
