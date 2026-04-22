---
title: "Agent OS: Business Software Paradigms Research"
type: research
created: 2026-03-20
confidence: 0.85
tags: [agent-os, ux, enterprise-software, erp, crm, architecture]
summary: "UX/architecture patterns from enterprise software (ERP, CRM, ATC, dispatch) applicable to a web UI managing 5-8 AI agents."
---

# Agent OS: Business Software Paradigms Research

> **Purpose:** Identify UX/architecture patterns from enterprise software that apply to building a web UI where 1 human manages 5-8 AI agents doing real work.
> **Date:** 2026-03-20
> **Status:** 🔬 Research Complete

---

## 1. MRP / ERP Systems

### SAP (Fiori Launchpad)

**What it is:** Enterprise resource planning suite with Fiori as its modern UX layer — a role-based launchpad that organizes thousands of business objects into task-oriented "apps."

**Key pattern: The Role-Based Launchpad.** Fiori doesn't show you everything. It shows you *your* everything. Each user gets a personalized launchpad of tile-based apps organized by business role. Tiles are live — showing counts, status indicators, KPIs — not just links. The architecture separates *business objects* (universal data model) from *apps* (role-specific views into those objects). One purchase order is one object; the buyer sees it differently than the accountant.

**Agent OS application:**
- **Agent Launchpad:** Each agent gets a "role page" showing only what matters to them — active tasks, pending reviews, resource usage. The human gets a *manager launchpad* that aggregates across all agents.
- **Live Tiles:** Each agent represented as a tile showing: current task, status (idle/working/blocked/waiting), token usage, last activity. Click to drill into the agent's full context.
- **Semantic Zoom:** Launchpad → Agent Detail → Task Detail → Execution Log. Same data, different granularity based on what you need.
- **The "Transaction Code" concept:** SAP power users navigate by typing `t-code` commands (like `/n MM01`). Agent OS equivalent: a command palette that lets you jump to any agent, task, or view instantly. Chat commands become first-class navigation, not the *only* interface.

### Oracle NetSuite

**What it is:** Cloud ERP with role-based dashboards, real-time financials, and configurable KPI portlets.

**Key pattern: The Dashboard-of-Dashboards.** NetSuite's home page is a grid of "portlets" — small, independent widgets (KPI scorecards, saved searches, shortcuts, trend graphs, reminders). Each role gets a different default layout, but users can customize. The key insight: dashboards aren't just read-only views — they contain *action shortcuts*. A "late invoices" portlet has a "send reminder" button right there.

**Agent OS application:**
- **Actionable Widgets:** Don't just show "Agent Coder is blocked." Show the block reason and a "Review & Unblock" button inline. Every status display should have an action attached.
- **Saved Searches as Views:** NetSuite's saved searches are essentially "programmable queries" users create and pin. Agent OS equivalent: let the human save filtered views like "all tasks blocked >30min" or "all outputs pending review" and pin them to their dashboard.
- **Role-based defaults:** When Trajan opens Agent OS as "manager," he sees the fleet overview. If he drills into Coder's perspective, he sees Coder's working context. Same system, different lens.

### Odoo

**What it is:** Modular open-source ERP where you compose your business suite by installing apps (50+ official, 50K+ community) that share a unified data model.

**Key pattern: Modular App Composition.** Odoo's genius is that each "app" (Invoicing, CRM, Inventory, etc.) is a self-contained module with its own views, but they all operate on a shared ORM and database. Install Sales → you get pipeline views. Install Inventory → Sales orders now show stock levels automatically. The modules *discover each other* and extend the UI. Views are defined declaratively (XML) and can be inherited/extended by other modules.

**Agent OS application:**
- **Plugin-Based Agent Capabilities:** Each agent "module" registers its own views, dashboards, and actions. Install the "Code Agent" module → you get code review views, diff viewers, test result panels. Install "Research Agent" → you get source evaluation panels, citation trackers. The UI *grows* with the agent roster.
- **View Inheritance:** Base "task view" is universal. Each agent type extends it. Coder's task view adds a "Files Changed" panel. Researcher's adds a "Sources" panel. Same underlying task record, agent-specific presentation.
- **The Shared ORM Insight:** All agents operate on the same data layer (tasks, files, vault notes, logs). Each just has different views into it. This is critical — don't build separate UIs per agent. Build one data model with composable views.

### ERPNext

**What it is:** Open-source ERP built on the Frappe framework, using a "DocType" system where every business entity is a document with defined fields, workflows, and permissions.

**Key pattern: Everything is a DocType.** In ERPNext, a Sales Order, an Employee, an Asset — they're all "DocTypes" with the same underlying architecture: fields, child tables, workflows, permissions, print formats, and API endpoints. Creating a new business entity means defining a new DocType (which can be done through the UI, no code required). Workspaces are configurable landing pages that group related DocTypes with shortcuts and charts.

**Agent OS application:**
- **Universal Record Architecture:** Every entity in Agent OS is a "record" — agents, tasks, missions, vault notes, execution logs, proposals. Each record type has: metadata fields, status workflow, permissions, related records, activity timeline, and API access. This is the **single most important architectural decision.**
- **No-Code Record Types:** Let the human define new record types without touching code. Need to track "Research Sources" as a first-class entity? Define it as a new record type with fields: URL, credibility score, last accessed, related tasks.
- **Workspace = Dashboard:** ERPNext workspaces are curated landing pages grouping related DocTypes. Agent OS equivalent: "Code Workspace" shows Coder agent, active code tasks, recent PRs, test results. "Research Workspace" shows Researcher, active research tasks, vault notes being written.

### MRP Patterns Applied to Agent Work

**Bill of Materials (BOM) for Agent Work:**

In manufacturing, a BOM defines: to make Product X, you need 3 of Part A, 2 of Part B, assembled in this order, with these tools. The agent equivalent:

```
Mission: "Build feature X"
├── Task: Design API (Agent: Coder)
│   ├── Resource: vault/specs/feature-x.md (input)
│   ├── Resource: 50K tokens (estimated)
│   └── Output: api-design.md
├── Task: Implement (Agent: Coder)
│   ├── Dependency: Design API ✓
│   ├── Resource: api-design.md (input from prior task)
│   ├── Resource: 200K tokens (estimated)
│   └── Output: PR #147
├── Task: Review (Agent: Devil's Advocate)
│   ├── Dependency: Implement ✓
│   ├── Resource: PR #147 (input)
│   └── Output: review-notes.md
└── Task: Research alternatives (Agent: Researcher) [parallel]
    ├── Resource: web access
    └── Output: vault/Research/alternatives.md
```

**Capacity Planning:**

MRP systems track machine capacity (hours available vs. hours needed). For agents:
- **Token budget** = raw material inventory
- **Context window** = machine capacity (how much an agent can hold at once)
- **Concurrent task limit** = production line slots
- **Cool-down / rate limits** = machine maintenance windows

A capacity planning view would show: Agent Coder has 80% context window used, 2/3 concurrent slots filled, 150K tokens remaining in daily budget. Don't assign more until a slot frees up.

---

## 2. CRM Systems

### Salesforce

**What it is:** The dominant CRM platform, built around a universal "record" model where every entity (contact, account, opportunity, case) is a record page with related lists, activity timeline, and action buttons.

**Key pattern: The Record Page.** Everything in Salesforce is a record. Every record has the same anatomy:
1. **Header:** Name, status badge, owner, key fields
2. **Highlights Panel:** The 4-6 most important fields at a glance
3. **Related Lists:** Tables of linked records (an Account shows its Contacts, Opportunities, Cases)
4. **Activity Timeline:** Every interaction, update, and event in chronological order
5. **Action Buttons:** Stage-appropriate actions ("Convert Lead," "Close Won," "Escalate")

The power is in *related lists* — you never view a record in isolation. You see everything connected to it.

**Agent OS application:**
- **The Agent Record Page:**
  - Header: Agent name, emoji, current status, uptime
  - Highlights: Current task, token usage today, success rate, last completion
  - Related Lists: Active tasks, completed tasks (last 7d), vault notes written, files modified, pending reviews
  - Timeline: Every action the agent took, with expandable detail
  - Actions: "Assign Task," "Pause," "Review Output," "Change Role"
- **The Task Record Page:**
  - Header: Task name, priority, assigned agent, status
  - Highlights: Time elapsed, tokens used, blocking issues
  - Related Lists: Subtasks, input files, output files, related vault notes
  - Timeline: Execution log — every tool call, decision point, error
  - Actions: "Approve," "Reject," "Reassign," "Escalate"
- **Cross-Linking Everything:** Clicking on a vault note shows which agent wrote it, which task produced it, which mission it belongs to. The relationship graph IS the interface.

### HubSpot

**What it is:** CRM + marketing/sales platform built around a timeline-centric view where every contact's history is a single scrollable feed.

**Key pattern: The Timeline.** HubSpot's contact record is dominated by a timeline showing every email, call, meeting, form submission, page view, and deal stage change — all in one chronological stream. You can filter by type, but the default is "everything." The timeline is bidirectional: you can *act* from it (log a call, send an email, create a task) not just read it.

**Agent OS application:**
- **The Agent Activity Feed:** A single, filterable timeline per agent showing: task assignments, tool calls, file writes, web searches, completions, errors, human interventions. This replaces scrolling through Discord messages.
- **The Mission Timeline:** All agent activity related to a mission, interleaved. See Coder's commits alongside Researcher's findings alongside Devil's Advocate's critiques — in temporal order. This is how you understand what actually happened.
- **Actionable Timeline:** Each entry has contextual actions. A "task blocked" entry has an "Unblock" button. A "PR created" entry has "Review" and "Merge" buttons.

### Pipedrive

**What it is:** CRM built entirely around the visual pipeline — a Kanban board where deals move through stages by dragging.

**Key pattern: The Visual Pipeline.** Pipedrive's entire UX is a left-to-right pipeline where cards (deals) move through defined stages. Each stage has: count, total value, average time in stage, and conversion rate. You drag to advance. Rotting deals (stuck too long) get visual warnings. The pipeline *is* the primary interface, not a secondary view.

**Agent OS application:**
- **Task Lifecycle Pipeline:**
  `Inbox → Assigned → In Progress → Review → Approved → Done`
  Each task is a card. Drag to advance (or automate advancement). Cards that are "rotting" (stuck in a stage too long) turn red. Each stage shows count and aggregate stats.
- **Proposal Pipeline:**
  `Draft → Proposed → Under Review → Approved → Executing → Completed`
  For when agents propose work proactively — track proposals through approval stages.
- **Pipeline Analytics:** Time-in-stage metrics reveal bottlenecks. If tasks pile up at "Review," the human is the bottleneck. If they pile at "In Progress," agents are overloaded.

### Attio

**What it is:** Modern CRM with a flexible object model where users define their own record types and relationship graphs, with data automatically enriched from communication channels.

**Key pattern: The Relationship Graph + Flexible Object Model.** Attio lets you define custom objects (not just contacts/deals) and define typed relationships between them. A "Company" can relate to "People" (employees), "Deals" (opportunities), and custom objects like "Projects" or "Integrations." The system automatically enriches records by analyzing email and calendar data. The UI shows records as nodes in a graph with traversable relationships.

**Agent OS application:**
- **Dynamic Entity Relationships:** Define relationships like:
  - Agent ↔ Task (assigned, completed, failed)
  - Task ↔ Mission (belongs to)
  - Task ↔ VaultNote (produced, consumed)
  - Agent ↔ Agent (reviewed by, depends on)
  - Mission ↔ VaultNote (documented in)
- **Auto-Enrichment:** When an agent creates a file, the system automatically creates relationships: file ↔ task, file ↔ agent, file ↔ mission. No manual linking needed.
- **Graph Navigation:** Click on a vault note → see which agent wrote it → see what task it was for → see related tasks in the same mission → see what other agents contributed. The graph is the navigation.
- **Flexible Object Model:** Let the human define new entity types as the system evolves. Started with just agents and tasks? Add "Experiments," "Deployments," "Research Threads" as first-class objects with their own views and relationships.

### CRM Relationship Modeling Applied

The CRM insight is that **relationships between entities are more valuable than the entities themselves.** A contact record is useful. A contact record showing all their deals, emails, meetings, and support tickets is *powerful.*

For Agent OS, the equivalent is:
- An agent record alone is meh
- An agent record showing all their tasks, outputs, reviews, capacity, and inter-agent interactions is a *command center*

The "deal pipeline" metaphor works perfectly for task lifecycle because both model a journey through stages with gates, stakeholders, and measurable progression.

---

## 3. Project Management

### Monday.com

**What it is:** Work OS with board-based views, an automations builder, and composable dashboards spanning multiple boards.

**Key pattern: The Automations Builder.** Monday.com's automation engine uses a sentence-like grammar: "When [trigger], [condition], then [action]." Example: "When status changes to Done, notify the manager." Users build these visually without code. The triggers, conditions, and actions are extensible. Combined with cross-board dashboards that aggregate data from multiple boards into unified views.

**Agent OS application:**
- **Agent Automation Rules:** "When Coder completes a task, automatically assign to Devil's Advocate for review." "When any agent is blocked for >10 minutes, notify Trajan." "When Research task completes, link output to relevant vault section."
- **Cross-Agent Dashboards:** A single dashboard pulling from all agents: total tasks completed today, aggregate token usage, success/failure rates, time-to-completion distributions.
- **Sentence-Based Rule Builder:** Natural language automation definition that maps directly to how you'd describe agent orchestration rules. Lower barrier than editing AGENTS.md directly.

### Basecamp (Hill Charts + Shape Up)

**What it is:** Project management tool known for Hill Charts — a visualization of work progress showing the phase of problem-solving, not just completion percentage — and the "Shape Up" methodology of fixed-time, variable-scope cycles.

**Key pattern: The Hill Chart.** A hill chart has two phases: **uphill** (figuring it out — unknowns, exploration, approach design) and **downhill** (making it happen — execution, known work). Each scope is a dot on the hill. Dots on the left-uphill mean "still figuring out the approach." Dots at the top mean "approach figured out, about to execute." Dots on the right-downhill mean "cranking through known work." This is radically better than percent-complete because it captures *uncertainty* — the thing that actually matters for status.

Traditional progress bars lie. 80% of tasks complete could mean 80% done, or it could mean the last 20% is the hard part nobody understands yet. Hill charts don't lie because they track *understanding* not *completion.*

**Agent OS application:**
- **Agent Task Hill Charts:** Each agent's task shown as a dot on a hill. Position indicates: is the agent still exploring the problem space (uphill) or executing a known plan (downhill)? This maps perfectly to AI agent work where "figuring out the approach" and "executing the approach" are genuinely different phases.
- **Mission Hill Chart:** A mission with 5 scopes — each scope is a dot. At a glance: 2 scopes are still being figured out, 1 is at the top (about to execute), 2 are being cranked out. Way more useful than "60% complete."
- **The Shape Up Cycle:** Fixed 6-week cycles with shaped work (well-defined problems with rough solutions). For Agent OS: define "cycles" — time-boxed periods where agents work on shaped missions. At cycle end, evaluate what shipped, what got cut, what needs reshaping.
- **Appetite vs. Estimate:** Shape Up says "we have 2 weeks of appetite for this" not "this will take 2 weeks." For agents: "this task gets 100K tokens of budget" (appetite) not "this task will cost 100K tokens" (estimate). If the agent can't solve it within appetite, it escalates rather than burning unlimited resources.

### Shortcut (ex-Clubhouse)

**What it is:** Project management tool with a clean stories/epics/milestones hierarchy and iteration planning focused on developer workflows.

**Key pattern: The Three-Level Hierarchy.** Stories (individual work items) → Epics (groups of related stories) → Milestones (organizational goals that epics contribute to). Each level has its own view: stories in a Kanban, epics in a progress bar view, milestones in a timeline. Iterations (time-boxed sprints) pull stories from epics. The hierarchy provides both top-down (what's the goal?) and bottom-up (what's happening now?) visibility.

**Agent OS application:**
- **Task → Mission → Objective hierarchy:**
  - Tasks = individual agent work items (like Stories)
  - Missions = groups of related tasks, possibly multi-agent (like Epics)
  - Objectives = high-level goals that missions serve (like Milestones)
- **Each level gets its own view:** Tasks in Kanban/pipeline, Missions in progress overview (hill charts?), Objectives in timeline/roadmap.
- **Iteration Planning:** Define weekly "sprints" where specific missions are in scope. Review velocity (tasks completed, tokens used, success rate) at sprint end.

### Plane

**What it is:** Open-source, AI-native project management tool with cycles, modules, built-in docs, and agent-assignable tasks.

**Key pattern: AI as First-Class Participant.** Plane is notable because it's one of the first PM tools built *around* AI rather than bolting it on. AI agents can be assigned tasks, read project context, and do real work within the tool. It combines multiple views (Board, Spreadsheet, List, Gantt), time-boxed cycles with velocity tracking, and built-in documentation — all sharing context so AI can traverse the full workspace.

**Agent OS application:**
- **Direct inspiration.** Plane's architecture validates the approach: PM tool where AI agents are first-class participants, not just copilots. Study their agent integration patterns.
- **Unified Workspace:** Projects, docs, and workflows in one place so agents have full context. No context-switching between tools.
- **Automatic Dashboards:** Real-time dashboards that populate automatically from agent activity. No manual status reports.

### Height

**What it is:** AI-native project management tool where the AI autonomously manages tasks — triaging, labeling, deduplicating, and organizing without human intervention.

**Key pattern: Autonomous Task Management.** Height's AI doesn't just help you write tasks — it *manages* them. It auto-triages incoming issues, detects duplicates, suggests labels, identifies blocked tasks, and reorganizes priorities. The human sets policies; the AI executes them continuously. This is "management as policy" rather than "management as action."

**Agent OS application:**
- **Meta-Agent for Task Management:** An orchestrator agent that continuously triages, prioritizes, and routes tasks across the agent fleet. The human defines policies ("code tasks go to Coder unless blocked, then to utility," "all outputs need review before merge"); the system enforces them autonomously.
- **Policy-Based Routing vs. Manual Assignment:** Instead of assigning each task manually, define routing rules. Tasks auto-assign based on type, priority, agent availability, and past performance.
- **Automatic Housekeeping:** Detect duplicate tasks, stale tasks, orphaned outputs, and contradictory assignments without human intervention.

### Huly

**What it is:** Open-source "everything app" combining project management, team chat, HR, and knowledge management with real-time collaboration and GitHub sync.

**Key pattern: The Unified Platform.** Huly's insight is that PM, chat, docs, and HR are artificially separated. Combining them means: a task has a discussion thread, links to relevant docs, and shows who's working on it — all in one place. Their "MetaBrain" concept connects every element of the workflow into a dynamic knowledge base. Two-way GitHub sync means the tool isn't a silo.

**Agent OS application:**
- **Everything-In-One:** Don't build separate tools for task management, agent communication, knowledge base, and dashboards. Build one integrated platform where:
  - Tasks have embedded discussions (replacing Discord threads)
  - Knowledge docs link bidirectionally to tasks
  - Agent profiles show activity, not just configuration
  - All data is searchable from one place
- **The MetaBrain Concept:** All agent activity, vault notes, task outcomes, and discussions form a unified knowledge graph that can be queried. "What do we know about X?" searches across everything, not just one silo.

### Basecamp Hill Charts — Deep Dive

The hill chart deserves special emphasis because it solves a problem unique to knowledge work (and especially AI agent work): **you can't measure progress by counting completed items when you don't know all the items yet.**

Traditional task tracking assumes all work is known upfront and progress = (done / total). But agent work is exploratory:
1. Agent starts a research task — doesn't know what it'll find
2. Agent designs an API — discovers edge cases mid-design
3. Agent reviews code — scope of issues unknown until review happens

The hill chart's two phases map to agent work:
- **Uphill (figuring it out):** Agent is exploring, reading code, searching the web, trying approaches. Token usage is high relative to output. Progress is hard to measure.
- **Downhill (making it happen):** Agent has a plan and is executing. Token usage maps predictably to output. Progress is measurable.

**Implementation for Agent OS:**
- Track each task's hill position based on signals:
  - Uphill signals: many web searches, lots of file reading, few file writes, exploratory tool calls
  - Peak signals: agent produces a plan or outline, switches from reading to writing
  - Downhill signals: steady file writes, test runs, declining search activity, predictable token usage
- This could be **automated** — analyze agent tool call patterns to infer hill position without manual updates.

---

## 4. Business Intelligence / Analytics

### Metabase

**What it is:** Open-source BI tool where analytics are expressed as "questions" — including natural language queries — rather than SQL or chart-builder interfaces.

**Key pattern: Question-Based Analytics.** Instead of "build a chart," Metabase says "ask a question." Questions like "How many tasks did Coder complete last week?" are translated into queries automatically. Questions can be saved, shared, and composed into dashboards. The abstraction of "question" is more intuitive than "report" or "chart" because it maps to how humans actually think about data.

**Agent OS application:**
- **Natural Language Agent Analytics:** "Which agent has the highest success rate this week?" "What's the average time-to-completion for research tasks?" "Show me all tasks that took more than 100K tokens." The UI translates these into queries against the agent activity database.
- **Saved Questions as Widgets:** Pin frequently-asked questions to the dashboard. They auto-update. "How many tasks are blocked right now?" is always visible.
- **Exploratory Analytics:** Let the human explore agent performance data without predefined reports. Metabase's "click to drill down" pattern: see aggregate → click to filter → click to see individual records.

### Grafana

**What it is:** Composable observability platform with dashboards, alerting, and a panel system that can visualize any time-series or log data.

**Key pattern: Composable Dashboard Panels + Alerting.** Grafana dashboards are grids of independent panels, each querying a different data source with a different visualization. Panels can be: time-series graphs, stat counters, tables, logs, heatmaps, bar gauges. The alerting system watches metrics and fires notifications based on rules. Variables let you template dashboards (select an agent from a dropdown, all panels update).

**Agent OS application:**
- **Agent Observability Dashboard:**
  - Token usage over time (time-series per agent)
  - Task completion rate (bar gauge per agent)
  - Current status (stat panels: 3 active, 1 blocked, 2 idle)
  - Error log stream (live log panel)
  - Context window utilization (gauge per agent)
  - Cost tracking (accumulated spend per agent per day)
- **Alerting Rules:**
  - "Alert if any agent blocked >15 min"
  - "Alert if token spend exceeds daily budget"
  - "Alert if error rate >20% in last hour"
  - "Alert if no agent activity for >30 min during work hours"
- **Template Variables:** Dropdown to select agent → all panels filter to that agent. Dropdown to select time range → all panels adjust. This is how you build one dashboard that serves as both fleet overview and individual agent view.

### Retool

**What it is:** Low-code platform for building internal tools from pre-built components (tables, forms, charts) connected to any data source.

**Key pattern: Component-Based Internal Tool Builder.** Retool provides drag-and-drop components (Table, Chart, Form, Button, Modal, Text Input) that connect to data sources (databases, APIs, etc.) through queries. You wire components together: a table selection triggers a detail panel update. Custom logic is JavaScript snippets, not full apps. The insight: internal tools don't need to be "apps" — they need to be *assembled.*

**Agent OS application:**
- **Build Custom Agent Views:** Instead of a fixed UI, provide components that can be assembled:
  - Agent Status Table (sortable, filterable)
  - Task Pipeline Board (drag-and-drop)
  - Token Usage Chart (configurable time range)
  - Quick Action Buttons (assign, pause, review)
  - Log Viewer (filterable, searchable)
- **The human customizes their workspace** by arranging these components. Power users build their own dashboards; casual users use defaults.
- **Event Wiring:** "When I click an agent in the table, show their tasks in the panel below, their token usage in the chart, and their logs in the viewer." Components react to each other.

---

## 5. Workflow / Automation Platforms

### n8n

**What it is:** Open-source visual workflow builder using a node-based canvas where data flows between connected nodes (triggers, transformations, actions, AI agents).

**Key pattern: Visual Node-Based Workflow.** n8n represents workflows as directed graphs of nodes on a canvas. Each node is a step: trigger, HTTP request, data transformation, conditional branch, loop, AI agent call. You see the data flowing through the graph — click any node to inspect its input/output at that step. The visual representation makes complex multi-step logic comprehensible. Crucially, you can *execute step by step* — run just one node and inspect the output before proceeding.

**Agent OS application:**
- **Visual Multi-Agent Orchestration:** Define agent workflows as node graphs:
  ```
  [Trigger: New Mission] → [Agent: Researcher] → [Branch: Needs Code?]
     ├─ Yes → [Agent: Coder] → [Agent: Devil's Advocate] → [Gate: Human Review]
     └─ No → [Agent: Utility] → [Gate: Human Review]
  → [Merge] → [Complete Mission]
  ```
- **Step-by-Step Execution:** Run one agent step, inspect the output, decide whether to continue. This is perfect for debugging multi-agent workflows.
- **Data Flow Visibility:** See exactly what data passes between agents. What did Researcher output? What did Coder receive as input? The connections are visible, not hidden in prompt engineering.
- **Reusable Workflow Templates:** Define standard patterns (research → implement → review) as templates. Clone and customize for new missions.

### Zapier

**What it is:** Automation platform based on trigger → action chains ("Zaps") connecting 5000+ apps with conditional logic and multi-step workflows.

**Key pattern: Trigger → Action Chains with Natural Language.** Zapier's genius is simplicity: "When X happens in App A, do Y in App B." The trigger-action pattern is universally understandable. Multi-step Zaps add branches and filters but maintain the linear mental model. The recent AI integration lets users describe automations in natural language.

**Agent OS application:**
- **Simple Automation Rules:** "When a PR is created by Coder, send to Devil's Advocate for review." "When Researcher saves a vault note, notify on Discord." "When any agent errors 3 times on the same task, escalate to Trajan."
- **Natural Language Rule Definition:** "Every morning, have Researcher check for new commits in tracked repos and summarize them." The system translates this into a trigger-action chain.
- **The "Zap" as Agent Workflow Unit:** Each reusable automation pattern is a named "flow" that can be enabled/disabled, versioned, and monitored.

### Temporal

**What it is:** Durable execution platform where workflows are written as code, with built-in retry policies, timeouts, and full visibility into running workflow state.

**Key pattern: Durable Execution with Full Workflow Visibility.** Temporal separates Workflows (orchestration logic) from Activities (side-effect-bearing actions like API calls, file writes). Workflows are deterministic and durable — if the process crashes, execution resumes from exactly where it left off by replaying the event history. The Temporal Web UI shows: every running workflow, its current state, its complete event history, pending activities, and retry status.

**Agent OS application:**
- **Durable Agent Workflows:** If an agent crashes or the system restarts, task execution resumes from the last checkpoint — not from scratch. Every agent action is logged as an event; state is reconstructable.
- **Workflow Visibility Dashboard:** See every running agent workflow: which step it's on, how long it's been running, what's pending, retry count, timeout status. This is the "mission control" view.
- **Retry Policies per Task Type:** "Research tasks retry 3 times with exponential backoff. Code tasks retry once then escalate. Review tasks never retry — always escalate."
- **The Event History Pattern:** Temporal's complete event log for each workflow execution is exactly what agent task execution needs. Every tool call, every decision, every retry — recorded and inspectable.
- **Activities as Agent Actions:** Temporal's "Activity" concept (a unit of work that can fail and be retried independently) maps directly to individual agent tool calls. The workflow orchestrates; activities do the work.

---

## 6. Communication Beyond Chat

### Twist (by Doist)

**What it is:** Async-first team messaging app organized around threads rather than channels, designed to eliminate the "always-on" pressure of Slack-style chat.

**Key pattern: Thread-First Communication.** Twist's core insight: chat is terrible for async work because conversations scroll away and mix together. Instead, every conversation is a titled thread in a channel. Threads are searchable, linkable, and complete — they don't get buried. There's no presence indicator (no green dots). The structure is: Channels → Threads → Comments. This is fundamentally different from Channels → Messages (chat model).

**Agent OS application:**
- **Agent Communication as Threads, Not Chat:** Each agent task gets a thread. All communication about that task (human instructions, agent updates, agent questions, review comments) lives in that thread. Threads are searchable and complete records.
- **No Real-Time Pressure:** Agent updates don't need to be real-time chat messages that demand attention. They're posts in a thread you can check when ready. Notifications only for: blocked (needs human), completed (needs review), error (needs intervention).
- **Structured Updates, Not Chat Messages:** Instead of Discord messages like "I finished the task," agents post structured updates: status, output summary, files changed, next steps. The thread is a *record*, not a *conversation.*

### Front

**What it is:** Shared inbox platform where team messages are assigned, tracked with SLAs, and collaboratively managed with internal comments and routing rules.

**Key pattern: The Shared Inbox with Assignment + SLA.** Front treats every incoming message as a work item. Messages are assigned to team members, have due dates (SLAs), can be snoozed, and have internal comments (visible to team, not to sender). Rules auto-route messages based on content, sender, or keywords. Analytics show response times, assignment distribution, and SLA compliance.

**Agent OS application:**
- **Agent Output as Inbox:** Every agent completion is an "incoming message" in the human's inbox. Each needs: acknowledgment, review, or action. Track SLAs: "outputs should be reviewed within 30 min."
- **Assignment and Routing:** Incoming tasks auto-route to the right agent. Agent outputs route to the human's review queue. The inbox metaphor makes the human's job clear: "you have 3 items to review."
- **Internal Comments on Agent Work:** Add notes to an agent's output without the agent seeing them (human-only context). "This approach was wrong last time — watch for X."
- **Snooze:** "I'll review this later" — snooze the agent's output and it reappears at the scheduled time.

### Intercom

**What it is:** Customer messaging platform with conversation routing, bot-to-human handoff, and resolution tracking.

**Key pattern: Bot Handoff + Resolution Tracking.** Intercom's bot handles initial triage, attempts resolution, and seamlessly hands off to a human when needed — with full context carried over. Conversations have resolution states (open, snoozed, closed) and are tracked for time-to-resolution. The handoff moment is explicitly modeled: bot says "I need to escalate this," human sees the bot's work so far.

**Agent OS application:**
- **Agent Escalation UX:** When an agent hits a blocker, it doesn't just post a message — it creates an *escalation* with: what was attempted, why it failed, what context the human needs, and suggested actions. The human sees the agent's full work before deciding.
- **Resolution Tracking:** Every agent interaction has a resolution state. Not just "done" / "not done" — "resolved by agent," "resolved after human intervention," "unresolvable," "deferred." Track these for agent performance analytics.
- **Handoff Context:** The critical pattern: when an agent hands off to a human (or to another agent), ALL context travels with the handoff. No "let me look into what happened." The handoff IS the context.

### Missive

**What it is:** Team inbox with collaborative drafting — multiple people can edit a message before it's sent.

**Key pattern: Collaborative Drafting.** Before a message is sent, multiple team members can edit it, add comments, suggest changes. The draft is a shared workspace. This is "review before publish" built into the communication tool.

**Agent OS application:**
- **Agent Output Review Before Publish:** Agent writes a vault note, PR description, or report. Before it's finalized, the human can preview, edit, and annotate. Only then does it get "published" (committed, posted, saved). This is the review gate as a collaboration interface rather than a binary approve/reject.
- **Multi-Agent Drafting:** Researcher produces a draft → Coder adds technical details → Devil's Advocate adds caveats → Human finalizes. Each stage is visible as edits to the same document.

### Google Wave (Historical)

**What it is:** (Defunct, 2009-2012) A real-time collaboration platform where conversations and documents were blended — you could edit any part of a conversation, nest replies, and add participants at any point.

**Key pattern: Conversations as Living Documents.** Wave's radical idea: a conversation isn't a linear sequence of messages — it's a *document* that can be edited, branched, and evolved. Any participant could edit any part. Playback showed the evolution. Nested threads within threads. The conversation WAS the artifact, not a byproduct.

**Agent OS application:**
- **Task Context as Living Document:** Instead of a chat thread + separate task document + separate output file, unify them. The task IS a living document: starts as a brief, accumulates agent work, includes human comments, and ends as the deliverable. Everything in one place, with full history.
- **Playback:** Scrub through the evolution of a task: initial brief → agent's exploration → first draft → human feedback → revision → completion. This is more useful than a flat log.

---

## 7. Role / Permission Systems

### Salesforce Profiles + Permission Sets

**What it is:** Salesforce's permission model where a Profile defines a base set of capabilities, and Permission Sets add granular, stackable permissions on top.

**Key pattern: Base Profile + Stackable Permission Sets.** A Profile is a bundle of defaults (which objects can you see? which fields can you edit? which apps can you access?). Permission Sets are additive layers that grant specific capabilities. A user has one Profile and zero-or-more Permission Sets. This is more flexible than simple role-based access because you can compose permissions precisely.

**Agent OS application:**
- **Agent Profiles:** Base capability bundles:
  - `CodeAgent` profile: file read/write, exec, git
  - `ResearchAgent` profile: web search, web fetch, vault read
  - `ReviewAgent` profile: file read, analysis tools
- **Permission Sets (stackable):**
  - `+VaultWrite`: can write to vault (add to Researcher for specific tasks)
  - `+SystemExec`: can run system commands (add to Utility for specific ops)
  - `+ExternalComms`: can send external messages (add to any agent for specific tasks)
  - `+HighTokenBudget`: can spend up to 500K tokens per task (add for complex work)
- **Composable:** Coder has `CodeAgent` profile + `+VaultWrite` for this mission. Researcher has `ResearchAgent` profile + `+SystemExec` for this infrastructure audit. Permissions are task-scoped, not permanent.

### AWS IAM

**What it is:** Amazon's identity and access management system using JSON policy documents attached to roles, defining fine-grained allow/deny rules for every API action on every resource.

**Key pattern: Policy-Based Access with Resource Specificity.** IAM policies specify: which actions, on which resources, under which conditions. Policies are JSON documents attached to roles. Roles are assumed by entities (users, services). The power is in *conditions* — "allow exec on production servers only during business hours" or "allow file write only to paths matching /vault/Research/*."

**Agent OS application:**
- **Agent Policies as Formal Documents:**
  ```json
  {
    "agent": "researcher",
    "statements": [
      {
        "effect": "allow",
        "actions": ["web_search", "web_fetch", "file_read"],
        "resources": ["*"]
      },
      {
        "effect": "allow",
        "actions": ["file_write"],
        "resources": ["vault/*", "scratch/*"],
        "conditions": { "tokenBudget": { "lte": 50000 } }
      },
      {
        "effect": "deny",
        "actions": ["exec", "system_*"],
        "resources": ["*"]
      }
    ]
  }
  ```
- **Condition-Based Permissions:** "Coder can exec, but only in the project directory." "Researcher can write vault notes, but only under 50K tokens." "Any agent can escalate, but only after at least one retry."
- **Audit Trail:** Every permission check is logged. "Coder attempted file_write on /etc/cron.d — DENIED by policy." This is how you debug agent misbehavior.

### Kubernetes RBAC

**What it is:** Kubernetes' role-based access control using Role (namespace-scoped) → ClusterRole (cluster-wide) → RoleBinding/ClusterRoleBinding (attaching roles to subjects).

**Key pattern: Namespaced Roles with Binding.** K8s RBAC separates: what can be done (Role), who can do it (Subject), and the binding between them (RoleBinding). Roles are scoped to namespaces (a logical boundary). ClusterRoles apply across all namespaces. This separation means you define capabilities once and bind them to different agents as needed.

**Agent OS application:**
- **Domain-Scoped Roles:**
  - `code-domain` role: file CRUD on source code, exec in project dir, git operations
  - `research-domain` role: web access, vault read/write in Research/
  - `ops-domain` role: system exec, service management, monitoring
  - `review-domain` role: read-only on everything, analysis tools
- **Binding:** `Coder` is bound to `code-domain`. For a specific mission, also bind Coder to `research-domain` (temporarily). Bindings can be time-limited or task-scoped.
- **Namespace as Domain:** Each "domain" (codebase, vault, system) is a namespace. Agents are granted access to specific domains per task.

### Synthesis: Agent Role Architecture

Drawing from all three systems, agent roles in Agent OS should be:

1. **Profile** (base identity): What type of agent is this? Defines default capabilities, default UI, default dashboard. (Salesforce)
2. **Policies** (formal permissions): What specifically can this agent do, on what resources, under what conditions? Machine-readable, auditable. (IAM)
3. **Domain Bindings** (scope): Which domains/namespaces does this agent have access to for this task? Bindable and revocable per-task. (K8s RBAC)
4. **Autonomy Level** (escalation threshold): How much can this agent do before requiring human approval?
   - Level 0: Propose only (must get approval before any action)
   - Level 1: Act within strict bounds, escalate on anything ambiguous
   - Level 2: Act freely within domain, escalate on cross-domain or high-cost actions
   - Level 3: Full autonomy within domain (reserved for ops emergency response)
5. **Escalation Rules:** What triggers human intervention? Token budget exceeded, confidence below threshold, cross-domain action needed, destructive action attempted.

---

## Synthesis

### The Agent OS as Business Platform

These patterns converge on a clear architecture:

**Agent OS is an ERP for AI work.** Just as SAP manages materials, finances, and logistics through a unified platform, Agent OS manages agents, tasks, knowledge, and workflows through a unified platform. The parallels are exact:

| Business ERP | Agent OS |
|---|---|
| Business Objects (orders, invoices) | Records (tasks, missions, outputs) |
| Departments | Agent domains |
| Employees | Agents |
| Bill of Materials | Task dependency graph |
| Production planning | Agent capacity planning |
| Quality control | Output review pipeline |
| Dashboard portlets | Agent status widgets |
| Role-based access | Policy-based agent permissions |

The key architectural principles emerging from this research:

1. **Everything is a record** (ERPNext DocType + Salesforce Record Page)
2. **Records have relationships** (Attio graph + CRM related lists)
3. **Work flows through pipelines** (Pipedrive + Zapier)
4. **Dashboards are composable** (Grafana + Retool + NetSuite portlets)
5. **Roles are composable policies** (IAM + K8s RBAC + Salesforce Permission Sets)
6. **Progress tracks understanding, not completion** (Basecamp Hill Charts)
7. **Workflows are visible and debuggable** (Temporal + n8n)
8. **Communication is structured, not chatted** (Twist + Front + Google Wave)

---

### The Record Model

**Everything in Agent OS should be a "record."** Inspired by Salesforce's universal record page and ERPNext's DocType system.

**Core Record Types:**

| Record Type | Key Fields | Key Relationships |
|---|---|---|
| **Agent** | name, type, status, capabilities, autonomy level | → assigned tasks, → completed tasks, → written notes |
| **Task** | title, status, priority, token budget, deadline | → assigned agent, → parent mission, → input files, → output files |
| **Mission** | title, objective, status, deadline, cycle | → child tasks, → participating agents, → related notes |
| **Objective** | title, description, status, timeframe | → child missions |
| **Output** | type (file/PR/note/report), content ref, quality score | → producing task, → producing agent, → review record |
| **Review** | verdict, comments, reviewer (agent or human) | → reviewed output, → reviewed task |
| **VaultNote** | title, path, confidence, source type | → producing task, → producing agent, → related notes |
| **Escalation** | reason, context, resolution, response time | → source task, → source agent |
| **Automation** | trigger, conditions, actions, enabled | → affected agents, → execution log |
| **Cycle** | name, start date, end date, status | → missions in scope, → velocity metrics |

**Every record has:**
- Unique ID
- Status (with defined state machine)
- Owner (agent or human)
- Activity Timeline (all events)
- Related Records (bidirectional links)
- Metadata (created, updated, tags)
- Actions (context-appropriate buttons)

**The Record Page (universal UI pattern):**
```
┌─────────────────────────────────────────────┐
│ 🔬 Researcher                    ● Active   │ ← Header: icon, name, status badge
├─────────────────────────────────────────────┤
│ Current Task: Research OAuth patterns        │ ← Highlights: key fields at a glance
│ Tokens Today: 45K/100K  │ Success: 87%      │
│ Uptime: 4h 23m          │ Queue: 2 tasks    │
├─────────────────────────────────────────────┤
│ [Active Tasks] [Completed] [Outputs] [Notes]│ ← Related Records as tabs
│                                             │
│ ● Research OAuth patterns    ▶ In Progress  │
│ ● Compare CRM architectures  ○ Queued      │
├─────────────────────────────────────────────┤
│ Timeline                                    │ ← Activity Feed
│ 08:45  Started "Research OAuth patterns"    │
│ 08:47  Web search: "OAuth 2.1 best..."    │
│ 08:48  Fetched: rfc-editor.org/rfc/9207    │
│ 08:52  Writing vault/Research/OAuth.md     │
│ 08:53  ⚠ Blocked: Need clarification on... │
├─────────────────────────────────────────────┤
│ [Assign Task] [Pause] [Review Output] [···] │ ← Actions
└─────────────────────────────────────────────┘
```

---

### The Pipeline Model

**Every workflow in Agent OS should be visualizable as a pipeline.** Inspired by Pipedrive, Monday.com, and Temporal.

**Core Pipelines:**

**1. Task Lifecycle Pipeline**
```
Inbox → Assigned → In Progress → Review → Approved → Done
                       ↓                    ↓
                    Blocked              Rejected
                       ↓                    ↓
                   Escalated           Reassigned
```

**2. Mission Pipeline**
```
Shaped → Planned → Active → Review → Shipped
                     ↓
                  Blocked → Reshaped
```

**3. Agent Capacity Pipeline (horizontal)**
```
Agent:    [Idle ████████░░] [Working ███████░░░] [Blocked ██░░░░░░░░]
Coder:    [=======70%=====] context window
Research: [===30%===------] context window
Ops:      [idle----------] context window
```

**4. Review Pipeline**
```
Pending Review → Under Review → Approved / Rejected / Needs Changes
```

**Pipeline Characteristics:**
- Visual (Kanban-style or horizontal flow)
- Cards are draggable (human can manually advance)
- Automated advancement (agent completes → auto-moves to Review)
- Rot detection (card stuck in stage too long → visual warning)
- Stage metrics (count per stage, average time in stage, throughput)

---

### Role Architecture

**Agent roles should be composable capability sets, not job titles.** Inspired by IAM + K8s RBAC + Salesforce Permission Sets.

**Architecture:**

```
Role = Profile + Permission Sets + Domain Bindings + Autonomy Level + Escalation Rules
```

**Example — Coder Agent:**
```yaml
agent: coder
profile: code-agent                    # Base capabilities
permission_sets:                       # Stackable additions
  - file-readwrite
  - exec-sandboxed
  - git-operations
  - test-runner
domain_bindings:                       # Scoped access
  - domain: source-code
    access: full
  - domain: vault
    access: read-only
  - domain: system
    access: none
autonomy_level: 2                      # Act freely within domain
escalation_rules:
  - condition: token_usage > 200K
    action: pause_and_notify
  - condition: test_failure_rate > 50%
    action: stop_and_escalate
  - condition: cross_domain_action
    action: request_approval
  - condition: destructive_action       # rm, drop, etc.
    action: always_escalate
```

**The key insight from business software:** Roles in mature systems are never monolithic. They're always composable layers. This means you can:
- Start an agent with minimal permissions and add as trust is earned
- Grant temporary elevated permissions for specific tasks
- Audit exactly what each agent can do and why
- Define standard role "recipes" that combine profiles + sets + bindings

---

### The Chat Problem: 5 Alternatives Ranked

Chat (Discord/Slack) is the current interface. Here are 5 alternatives from this research, ranked by fit for Agent OS:

**#1: The Shared Inbox (Front / Intercom model) — BEST FIT**
Agent outputs appear as "items to process" in an inbox. Each has: summary, priority, required action, and full context on expansion. The human's job is clear: process the inbox. SLA tracking shows if reviews are falling behind.
- **Why it wins:** Maps perfectly to the actual workflow. Human receives agent work, reviews it, acts on it. Clear completion semantics. Manageable at 5-8 agents.

**#2: The Record-Centric View (Salesforce model) — STRONG FIT**
Navigate by clicking through records: Agent → Task → Output → Review. The relationship graph is the navigation. Communication is contextual (comments on records, not messages in channels).
- **Why it's strong:** Eliminates the "where did that message go?" problem. Everything is attached to the thing it's about.

**#3: The Thread-First Async View (Twist model) — GOOD FIT**
Each task/mission gets a thread. All related communication lives there. No real-time pressure. Review when ready. Searchable and complete.
- **Why it's good:** Better than chat because it's organized by topic. But still fundamentally a messaging paradigm.

**#4: The Dashboard + Pipeline View (Grafana + Pipedrive model) — COMPLEMENTARY**
Pure visual status: dashboards for monitoring, pipelines for workflow. Communication happens through actions on cards/records, not through messages.
- **Why it complements:** Essential for situational awareness but insufficient alone. You need this AND one of the above for actual interaction.

**#5: The Living Document (Google Wave model) — VISIONARY BUT IMPRACTICAL**
Each mission is a living document that agents and humans co-edit. Communication IS the document. Beautiful in theory.
- **Why it's ranked last:** Too abstract for practical daily use. The metaphor breaks down when you have 8 agents producing different types of work. Better as an inspiration for the task detail view than as the primary interface.

**Recommended combination:** Shared Inbox (#1) as the primary interaction pattern, Record-Centric View (#2) for navigation and context, Dashboard + Pipeline (#4) for monitoring. Use Thread-First (#3) as the communication model within records. Borrow Living Document (#5) concepts for the task detail view.

---

### New Project Management Paradigm: AI Agent PM

When your workers are AI agents, not humans, project management fundamentally changes:

**What stays the same:**
- Tasks still need definition, prioritization, and tracking
- Work still has dependencies
- Quality still needs review
- Progress still needs visibility

**What changes everything:**

**1. Workers are Interchangeable (Mostly)**
Human PM assumes specialized workers with unique skills, preferences, and availability. Agent PM can reassign tasks instantly. If Coder is stuck, spin up another Coder instance. The PM system should support: instant reassignment, cloning tasks, and parallel attempts at the same problem.

**2. Workers Don't Have Feelings**
No 1:1s. No motivation problems. No burnout (well, context window exhaustion). No PTO. This means: PM overhead can focus entirely on work quality and throughput, not people management. The "manager's job" shifts from "manage people" to "manage quality and flow."

**3. Feedback is Instant**
No waiting for next standup. Agent completes → human reviews → agent adjusts. The feedback loop is minutes, not days. PM tools should be designed for this cadence: real-time pipeline views, instant notifications on completion, immediate review interfaces.

**4. Cost is Measurable Per-Task**
Every token is tracked. You know exactly what each task cost. This enables: cost-per-feature tracking, ROI analysis per agent, budget-based task prioritization. PM includes a financial dimension that human PM rarely captures accurately.

**5. Progress is Observable**
You can watch an agent work in real-time (tool calls, file writes, searches). Traditional PM relies on self-reported status. Agent PM can *observe* status. This is where hill charts become automated: infer progress phase from behavior patterns.

**6. Parallelism is Cheap**
Assigning 5 agents to explore 5 different approaches simultaneously is normal. Traditional PM would never assign 5 developers to the same task. Agent PM should support: parallel execution, comparative evaluation, and approach selection.

**7. Quality Variance is Different**
Humans have bad days. Agents have bad prompts. Quality issues stem from: unclear instructions, insufficient context, wrong model choice, tool limitations. The PM system should track quality patterns and correlate them with dispatch parameters, not "worker performance."

**The New PM Tool Should:**
1. **Auto-assign based on policy** (not manual Kanban dragging)
2. **Track cost alongside progress** (token budgets per mission)
3. **Support parallel exploration** (multiple agents, same problem)
4. **Automate status** (infer from agent behavior, don't ask)
5. **Focus human attention on decisions** (approve/reject/redirect, not status meetings)
6. **Measure what matters:** time-to-completion, cost-per-output, quality score, escalation rate — not story points
7. **Treat the human as a bottleneck to optimize around** — the system should minimize human intervention needed while maximizing human control when intervening

**The single biggest shift:** Traditional PM is about coordinating human effort toward goals. Agent PM is about **defining goals precisely enough that agents can execute them, and reviewing outputs efficiently enough that the human doesn't become the bottleneck.** The PM tool's job is to keep the human informed without overwhelming them, and to keep agents productive without requiring constant direction.

---

## Appendix: Quick Reference Table

| System | Key Pattern | Agent OS Feature |
|---|---|---|
| SAP Fiori | Role-based launchpad with live tiles | Agent dashboard with status tiles |
| NetSuite | Actionable dashboard portlets | Widgets with inline actions |
| Odoo | Modular app composition | Plugin-based agent capability UI |
| ERPNext | Universal DocType system | Everything-is-a-record architecture |
| Salesforce | Record page with related lists | Universal record page pattern |
| HubSpot | Timeline-centric view | Agent activity feed |
| Pipedrive | Visual pipeline | Task lifecycle Kanban |
| Attio | Flexible object model + relationship graph | Dynamic entity relationships |
| Monday.com | Automation builder | Natural language agent rules |
| Basecamp | Hill Charts | Progress-as-understanding visualization |
| Shortcut | Three-level hierarchy | Task → Mission → Objective |
| Plane | AI-native PM | Direct architectural inspiration |
| Height | Autonomous task management | Policy-based auto-routing |
| Huly | Unified platform | Everything-in-one workspace |
| Metabase | Question-based analytics | Natural language agent queries |
| Grafana | Composable dashboards + alerting | Agent observability panels |
| Retool | Component-based tool builder | Customizable workspace components |
| n8n | Visual node-based workflows | Multi-agent workflow visualizer |
| Zapier | Trigger → action chains | Simple automation rules |
| Temporal | Durable execution + visibility | Workflow state dashboard |
| Twist | Thread-first async | Structured task threads |
| Front | Shared inbox with SLA | Agent output review inbox |
| Intercom | Bot handoff + resolution | Agent escalation UX |
| Missive | Collaborative drafting | Multi-agent output review |
| Google Wave | Conversations as documents | Living task documents |
| Salesforce Profiles | Base + stackable permissions | Agent profiles + permission sets |
| AWS IAM | Policy-based access | Formal agent policy documents |
| K8s RBAC | Namespaced role bindings | Domain-scoped agent access |

---

*This research should inform the Agent OS web UI architecture. The core bet: treat it as a business platform (ERP/CRM hybrid), not a chat app or a simple dashboard.*

---

## Related

- [[Agent OS]]
- [[Multi-Agent Architecture]]
- [[OpenClaw]]
