# EMA Mockup Prompt Pack

Use these prompts with whichever UI/image/mockup generator we use next.

---

## Global art direction prompt
Design a high-fidelity dark-mode desktop operator interface for **EMA**, an AI-native control plane and operator workbench. The product combines runtime execution monitoring, workstream management, source-of-truth entity cataloging, change control, and evidence-backed investigation. The interface should feel like a fusion of Linear, Backstage, Temporal, Argo CD, and Plane — premium, sharp, operational, and calm. Use realistic dense data, compact chips, trust badges, status panels, rich left navigation, and layered dark surfaces. Avoid generic startup-dashboard filler. The UI should look plausibly shippable in a modern Electron/TypeScript app.

---

## Prompt 1 — Home / command center
Create a high-fidelity desktop mockup for the **EMA Home** screen. Include:
- top nav with Sessions, Tasks, Agents, Workstreams, Changes, Executions, Catalog, System
- left operator sidebar with locations and operator-surface sections
- main area showing: attention queue, active workstreams, executions needing review, degraded entities, recent errors, and quick pivots
- compact dark cards with status chips and trust badges
- subtle primary purple accent, success/warning/error/info semantics
- realistic operator data and labels
Goal: clearly communicate that EMA is a command center, not a generic BI dashboard.

---

## Prompt 2 — My Work / Tasks
Create a high-fidelity desktop mockup for **EMA My Work / Tasks**. Include:
- saved view chips like All Work, Needs Review, Assigned Agents, Done Recently
- board/list switcher
- review badges and backlog attention counts
- task cards with title, priority chip, trust badge, assigned agent, age
- a denser operator-oriented layout than a normal kanban app
- dark mode, premium spacing, realistic operational task titles
Goal: show how EMA handles responsibility and triage.

---

## Prompt 3 — Workstreams
Create a high-fidelity desktop mockup for **EMA Workstreams**. Layout should have:
- left column of workstream cards
- right detail area for selected workstream
- detail includes sessions, tasks, latest activity, and a structured status panel
- saved view chips: All Workstreams, Active, Needs Review
- board/list view mode control
- realistic lane names, statuses, trust states, and operational metadata
Goal: make EMA’s “authoritative work lane” concept immediately legible.

---

## Prompt 4 — Executions
Create a high-fidelity desktop mockup for **EMA Executions**, a runtime truth workbench. Include:
- left-side execution/session list
- right-side detail panel
- status panel with state, observed truth, last activity, project
- evidence feed showing messages, tool calls, runtime events
- summary metrics like messages, tool activity, runtime cost
- dense but readable dark-mode layout with strong hierarchy
Goal: feel like Temporal/Airflow meets AI agent runtime inspection.

---

## Prompt 5 — Catalog
Create a high-fidelity desktop mockup for **EMA Catalog**. Include:
- entity summary cards across top
- project locations list
- sessions/providers list
- status chips and trust badges
- future-facing feeling of a Backstage-like source-of-truth browser
- dark premium UI, compact but breathable
Goal: make EMA feel like an entity spine, not just a list view.

---

## Prompt 6 — Changes
Create a high-fidelity desktop mockup for **EMA Changes**. Include:
- change/proposal list
- approval state, risk chips, verification state, linked executions
- side panel or detail pane with blast radius, review requirements, and recent activity
- dark, operational, premium styling
Goal: show EMA as a real change-control plane.

---

## Revision prompt
Take the previous EMA UI mockup and revise it with these goals:
- make the interface feel more like a control plane workbench and less like a normal SaaS dashboard
- improve hierarchy between current status, trust state, and attention state
- increase realism of operator data
- make workstreams and executions feel more central than generic analytics
- preserve dark premium styling and implementation realism
