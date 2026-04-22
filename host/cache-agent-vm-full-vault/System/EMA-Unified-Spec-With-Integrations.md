---
title: EMA Complete Specification v2 — Unified with Integrations
type: design
status: active
created: 2026-04-03
updated: 2026-04-03T21:30Z
author: Right Hand
tags: [ui, design, spec, complete, integrations]
---

# EMA Complete Specification v2

**Building toward:** Local operating system. Every workflow, every app, seamlessly connected. No data islands.

---

## SYNTHESIS: Two Specs → One Truth

### What the Specs Agree On
- 13 core apps (Dashboard, BrainDump, Tasks, Projects, Proposals, Responsibilities, Habits, Journal, Wiki, Canvas, Pipes, Focus, Agents, Channels)
- One Shell, one Command Palette, one Space system
- Narrative-first execution model (append-only execution-log.md)
- Proposal-as-deliberation-gate
- Everything connects through shared primitives (Execution, Proposal, Task, Project, BrainDumpItem, etc.)

### Where They Diverge (Resolved)
| Aspect | Spec 1 | Spec 2 | Resolution |
|---|---|---|---|
| **Metrics/Learning UI** | Standalone app | Cross-cutting layer | Cross-cutting for now, dashboard widgets surface learnings |
| **App order in sidebar** | Listed with Channels last | Channels mid-sidebar | Put Channels at bottom with Settings (communication stack) |
| **Executions visibility** | Via Agents + Proposals | Cross-cutting primitive | Primary surfaces: Dashboard (feed) + Projects (timeline) + Agents (detail) |
| **Superman/Intent** | Detailed per-project | Semantic memory layer | Per-project with Editor in Wiki + Project detail |
| **Honcho/Reflexion** | Future/roadmap | Spec assumes deployed | Phase 2 priority, build UI hooks now |

### What's Missing from Both (Adding Now)

**Integrations Layer** — Google Drive, GitHub, API account linking, channel linking
**Advanced Filters** — Saved filters, smart filters (AI-powered query builder)
**Sync Status** — Which apps are synced, sync errors, conflict resolution
**Undo/History** — System-level undo for destructive operations
**Offline Support** — What apps work offline, sync when reconnected

---

## ARCHITECTURE: 13 Apps + Integrations + Intelligence Layer

```
┌─────────────────────────────────────────────────────────────┐
│                         EMA SHELL                           │
│  Top Bar: Space | App Title | Focus | Status | Time         │
│  Sidebar: Dashboard, BrainDump, Tasks, Projects, ...        │
│           Space Switcher | Settings | Profile              │
│  Command Palette (Cmd+K): search + quick actions           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    13 VIRTUAL APPS                          │
│  Each app: full CRUD, connections, real-time sync          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              INTEGRATIONS & CONNECTORS                      │
│  GitHub | Google Drive | Discord/Slack | API Accounts      │
│  OAuth2 flows | Bidirectional sync | Event webhooks        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│         INTELLIGENCE & LEARNING LAYERS                      │
│  Superman (context indexing)                                │
│  Honcho (user modeling, scope advisor, fitness tracking)   │
│  Router (intent classification)                             │
│  ContextInjector (enrichment)                               │
│  Evolution (learning feedback)                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│          EMA DAEMON + WIKI + OPENCLAW                       │
│  Backend: Elixir/Phoenix (localhost:4488)                   │
│  Wiki: API (localhost:8093) + Quartz mirror (localhost:8090)│
│  Gateway: OpenClaw bridge for agent dispatch               │
└─────────────────────────────────────────────────────────────┘
```

---

## THE 13 APPS (Detailed Specifications)

### APP 1: Dashboard

**Purpose:** System state at a glance. What matters now.

**Sections:**
- **Top stat cards** (4): Active tasks | Open proposals | Focus sessions today | Running executions
- **Execution feed** (10 items): Last executions across all projects, newest first. Click → detail.
- **Intent threads** (ready to propose): Forming | Ready | Running | Done status indicators
- **Active projects** (3-5 cards): Name, status, activity, linked site status, task count, proposal count
- **Habits snapshot** (first 5): Checklist, check directly from dashboard
- **Brain dump queue** (last 5): Preview, click to process
- **Wiki recent** (5 files): Click to open
- **Upcoming** (next 72h): Tasks + Responsibilities with due dates

**Project context mode:**
- Pin project via Projects app or selector
- Dashboard repaints all widgets scoped to that project
- "Active Project" context always shown in top bar

**Interactive:**
- All stat cards clickable (navigate filtered)
- Widget expand arrows (→) open full app
- Execution feed: click card → detail panel
- Intent threads: approve/dismiss inline buttons
- Habits: checkboxes write directly
- Refresh button: re-fetch all widgets

**Data sources:**
- Tasks (active count)
- Proposals (pending count)
- Executions (feed + running count)
- Projects (active list)
- Habits (today's + streaks)
- BrainDump (unprocessed queue)
- Wiki (recent files)

---

### APP 2: BrainDump

**Purpose:** Frictionless intake. No structure required on capture.

**Main screen:**
- **Input bar** (top): Autofocused text, mic button (voice), paste support. Enter to capture.
- **Queue view**: All unprocessed items, reverse chronological.
- **Item card**: Preview, timestamp, auto-detected tags (EMA infers project/topic), process button.

**Item states:**
- Unprocessed (white)
- Clustered (amber border) — EMA grouped with related
- Processed (dimmed)
- Archived

**Processing an item:**
- Click process → inline action bar: Create task | Create proposal | Add to project | Send to vault | Tag & archive | Dismiss
- OR drag onto any sidebar app icon to route there

**Threads view:**
- Toggle: "Queue" / "Threads"
- Groups unprocessed items by EMA-detected cluster
- Each cluster: inferred theme, item count, readiness score (0-100), suggested action
- Readiness > threshold → amber banner "Ready to execute" with one-tap proposal creation

**Filters:**
- All / Unprocessed / Clustered / Processed / Archived
- Search (full-text)
- Project filter (multi-select)

**Connections:**
- Creates Proposals
- Creates Tasks
- Feeds Dashboard intent threads
- Items tagged to projects appear in project context
- Feeds Honcho for user modeling

---

### APP 3: Tasks

**Purpose:** Every piece of work that needs doing.

**Main screen:**
- **Left panel**: View + Group + Filter
- **Right panel**: Task list

**Left panel:**
- View: All | Today | Upcoming | Overdue | No date | Inbox
- Group by: Project | Status | Priority | Agent | Due date
- Filter by: Project (multi) | Status | Priority | Has agent | No agent | Structural
- Saved filters (name custom views)

**Task card:**
- Checkbox | Title | Project badge | Priority dot | Due date | Agent badge | Expand
- Click expand → inline: description, sub-tasks, linked proposals, linked executions, notes, attachments
- Drag to reorder within group
- Right-click → Edit | Duplicate | Move | Assign agent | Set priority | Set due | Delete

**New task:**
- "+" button or keyboard "T"
- Quick: type title + Enter
- Full form: title, description, project, priority, due, sub-tasks, assign agent
- **Structural detector**: If title has keywords → "This looks structural. Create proposal first?" Yes/No

**Task detail (sidebar):**
- Full edit of all fields
- Sub-tasks as checklist
- Linked proposals section
- Execution history
- Activity log (all changes)

**Connections:**
- Created from BrainDump
- Linked to Projects
- Assigned to agents → dispatch
- Completed → outcome signal
- Due dates appear in Dashboard
- Structural detection → Proposals pipeline

---

### APP 4: Projects

**Purpose:** Living context objects. Complete picture of a project.

**Main screen:**
- **Grid view**: Project cards. Name | Status badge | Last activity | Site status dot | Client | Task count | Proposal count
- Top bar: Filter by status | Sort | Search
- Card click → Detail. Right-click → Set active context | Archive | Duplicate | Delete

**Project detail (tabs):**

**Overview:**
- Description (rich text, editable)
- `.superman` file preview (edit button opens Wiki editor)
- Quick stats: open tasks, open proposals, last deploy, last commit
- Recent executions (5, with status)
- Open intent threads (BrainDump items tagged here)

**Tasks:** Pre-filtered Tasks app
**Proposals:** Pre-filtered Proposals app
**Executions:** Full history as timeline (toggle narrative view)

**Notes:**
- Project-local working notes (separate from Wiki)
- Rich text
- Promote to Wiki button

**Resources:**
- GitHub: repo link, last commit, branch, open PRs count
- Deploy: platform, URL, status, last deploy time
- VPS: CPU/RAM from server monitoring (if applicable)
- Domains: DNS status, expiry
- Client: link to client record
- Custom links: any URL with label

**Client tab:**
- Client name, email, company
- Invoice status (paid/outstanding/overdue)
- Email history (flagged by OpenClaw for this client)
- Other projects for client

**Functions:**
- Create project (generates `.superman` stub)
- Set active context (repaint Dashboard)
- Edit `.superman` file (trigger re-indexing)
- Link resources (GitHub, deploy, etc.)
- Get execution timeline (narrative view)

---

### APP 5: Proposals

**Purpose:** Deliberation layer. Bridge from "I want to do something" to "agent is doing it."

**Main screen:**
- **Kanban**: Generating | Pending Review | Approved | Running | Completed | Rejected
- Each card: Title | Project badge | Source | Score badge (0-100) | Created time
- Drag between columns (restricted — Approved→Running needs agent dispatch)
- Filter: by project, by source, by score range, by date

**Proposal detail (sidebar):**
- Title (editable)
- Full proposal text
- Source (BrainDump item, cluster, manual, system)
- Eval scores: clarity, feasibility, alignment, impact (0-100 each with explanation)
- Tags (auto-generated)
- Debate history (if structural)
- Related proposals
- Execution record (if run)

**Generation pipeline visualization:**
- Progress bar below title
- Stages: Scheduled → Generated → Refined → Debated → Tagged → Ready
- Click stage → expand to see output

**Approval:**
- Pending Review proposals: "Approve" / "Reject" buttons
- Approve → creates Execution, dispatches to agent, status → Approved
- Reject → ask reason (optional), status → Rejected, emits feedback signal
- Modify before approving → edit mode, log changes

**Manual creation:**
- New button top right
- Form: title, description, project, assign agent (optional)
- StructuralDetector → if triggered: auto-routes through deliberation
- Otherwise: Pending Review immediately

**Scoring:**
- 0-100 from: clarity, feasibility, alignment, past execution success
- Updates as moves through pipeline
- <40 → amber badge

**Connections:**
- From BrainDump (promote)
- From Tasks (deliberation gate)
- To Agents (on approval)
- Back from Agents (execution record)
- To Evolution (feedback signal)
- To Honcho (quality queries)

---

### APP 6: Responsibilities

**Purpose:** Recurring obligations. Cadence-based work that doesn't fit backlog.

**Main screen:**
- **List view**: Responsibility | Owner | Cadence | Due window | Status | Linked tasks
- **Calendar view**: Month grid, each day shows Responsibilities due that day
- **Grouped view**: By project | By due window | By cadence

**Responsibility card:**
- Title, owner, cadence (daily/weekly/monthly/quarterly/custom)
- Due logic (e.g., "every Friday", "first of month")
- Status (active/completed/overdue)
- Linked tasks (if any)
- Expand → detail

**Detail view (sidebar):**
- Full edit of all fields
- Linked project
- Linked tasks (create new, link existing)
- Channel reminders (which channel to notify, when)
- Recurring schedule editor (visual calendar picker for complex schedules)
- History: past due dates, completion status, notes

**New responsibility:**
- "+" button or from Dashboard upcoming
- Form: title, owner, project, cadence, due logic, linked channel (optional)

**Connections:**
- Appears in Dashboard upcoming widget
- Can spawn tasks
- Can trigger Pipes
- Can attach to Focus intentions
- Project context visibility
- Channel notifications on due date

---

### APP 7: Habits

**Purpose:** Behavior signal system. Not guilt — visibility.

**Main screen:**
- **Today view** (default): Each habit as row. Name | Streak | Today checkbox | Last 7 days dots
- All habits visible without scrolling (< 15)

**Habit detail:**
- Click name → expand or sidebar detail
- Calendar (month): each day colored by completion
- Stats: current streak, longest streak, 30-day rate, all-time rate
- Best time of day (if timestamped)
- Notes field

**Adding habit:**
- "+" button → form: name, frequency (daily/weekdays/specific days), reminder time (optional), color/icon
- Target: times per day (default 1)
- Streak type: simple (yes/no) or count-based (hit target number)

**Views:**
- Toggle: Today | Week | Month
- Week: habits as rows, days as columns, dots fill in
- Month: calendar grid, each day shows completion ratio as color intensity

**Connections:**
- Dashboard widget (first 5, today's status)
- Dashboard checkbox writes back
- Outcome Tracker analyzes patterns
- Focus sessions can be linked to habits

---

### APP 8: Journal

**Purpose:** Daily private thinking. Unstructured, timestamped.

**Main screen:**
- **Today's entry** (open, ready to type)
- Left sidebar: calendar of past entries (dot = has entry)
- Click past day → open that entry

**Entry editor:**
- Rich text: headings, lists, bold, italic, code, images
- Autosave (every 2s)
- Timestamp (auto, not editable)
- Word count (bottom)
- Optional mood selector (emoji picker, not required)

**Templates:**
- Daily review | Weekly reflection | Project retrospective | Free write
- Can create custom templates

**Linking:**
- Wikilinks work: `[[project name]]`, `[[task:id]]`
- Links optional — Journal can stay completely disconnected

**Search:**
- Search across all entries by date range or keyword
- Full text only (private, not indexed by Superman)

**Connections:**
- Optional wikilinks to Wiki + Projects + Tasks
- Optional journal prompt at Focus session end
- Stays private by default

---

### APP 9: Wiki / SecondBrain

**Purpose:** Permanent storage. Structured knowledge. System long-term memory.

**Main screen:**
- **Left**: Folder tree (mirrors ~/vault/)
- **Right**: File viewer/editor

**Folder tree:**
- Folders: System, Projects, Research, Daily, Clients, Archive, Inbox
- Each shows file count
- Collapse/expand (arrow keys)
- Right-click: New file, New folder, Rename, Move
- Search box filters tree

**File viewer:**
- Markdown rendered by default
- Wikilinks clickable: `[[Page]]` → navigate
- Code blocks with syntax highlighting
- Tables rendered
- Frontmatter panel (collapsed by default)
- "Edit" button → raw markdown editor
- Auto-save (500ms debounce)

**Knowledge graph view:**
- Toggle: "Files" / "Graph"
- Nodes = files, edges = wikilinks
- Node size = incoming link count
- Node color = folder type
- Click node → open file in right panel
- Drag pan, scroll zoom
- Filter by folder, tag, date

**`.superman` file editor:**
- Files matching `*.superman` show with icon
- Click → opens structured editor (six keywords)
- Changes trigger Superman re-indexing

**Search:**
- Full text search across all files
- Results: name, folder, excerpt with term highlighted
- Filter: folder, tag, date modified
- Semantic search toggle (when Superman ready): conceptual matching

**Connections:**
- Notes promoted from Projects
- Research agent outputs
- BrainDump archived → Wiki Inbox
- `.superman` files read by Superman + agents
- Graph powers Superman relationships
- Wiki API at :8093 (search, CRUD, graph, prompt interface)

---

### APP 10: Canvas

**Purpose:** Visual thinking. Infinite whiteboard.

**Main screen:**
- Infinite canvas (pan + zoom)
- Toolbar: Select | Draw | Text | Shape | Sticky | Arrow | Image | Code | Frame

**Tools:**
- **Draw**: Freehand, pen pressure support
- **Text**: Any size, font
- **Shape**: Rectangle, circle, diamond, line, arrow (configurable heads)
- **Sticky**: Colored cards, snap-to-grid
- **Arrow**: Connect objects, labeled
- **Image**: Paste/upload inline
- **Code**: Syntax-highlighted blocks
- **Frame**: Named containers (become slides if exported)

**Canvas management:**
- Multiple canvases per space
- Left sidebar: list with thumbnails
- Create, duplicate, export (PNG/SVG/PDF)

**Connections:**
- Canvas files in Wiki under `/canvases`
- Embed in Wiki files: `![[canvas:name]]`
- Projects can link in Resources

---

### APP 11: Pipes

**Purpose:** Automation. Triggers + Actions across all apps.

**Main screen:**
- List of all pipes (active + inactive)
- Card: name | trigger desc | action desc | status toggle | last run | run count
- "New pipe" button top right

**Pipe builder:**
- Two-panel: Trigger (left) + Actions (right)

**Trigger types (22):**
- **Time**: cron, time of day, day of week
- **EMA events**: new BrainDump, proposal approved, task created, habit completed, execution completed/failed
- **External**: GitHub commit, Render deploy, webhook, email
- **System**: on startup, focus start/end

**Actions (15):**
- **EMA**: create task, proposal, brain dump item, send to vault, update project status
- **Agent**: dispatch, generate proposal, run research
- **Notification**: send to Discord/Telegram/Slack, in-app
- **Data**: log to vault, update outcome tracker, call webhook

**Execution log:**
- Click pipe → detail with full history
- Each run: timestamp, trigger, actions taken, success/failure, output

**7 stock pipes:**
1. Daily digest (9am brain dumps → proposals)
2. Execution done → log to project vault
3. GitHub commit → update project activity
4. Deploy failed → urgent task + notify channel
5. Focus done → prompt journal
6. Habit streak broken → brain dump note
7. Email flagged → brain dump item

**Connections:**
- Reads from all app events
- Writes to all apps
- EventBus broadcasts system events

---

### APP 12: Focus

**Purpose:** Distraction-free deep work with time tracking.

**Main screen:**
- **Large timer** (center)
- Session type badge (Work | Short break | Long break)
- Current task label (optional, type or select from Tasks)
- Start | Pause | Stop buttons

**Timer modes:**
- **Pomodoro**: 25min work / 5min break / 15min long break every 4
- **Custom**: set any duration
- **Flow**: no timer, just track until stopped

**Session setup (optional):**
- Select project, task, set intention (free text)
- These are optional

**During session:**
- Minimal UI (just timer + task)
- "Distraction note" button → captures to BrainDump
- Sound on phase transitions (configurable)

**Session complete:**
- Summary: duration, project, task, intention
- Rating: focus quality (1-5 dots)
- Journal prompt (optional)

**History:**
- List of all sessions (project/task/duration)
- Heatmap: focus time per day (calendar)
- Stats: today, this week, this month, average length, best time of day

**Connections:**
- Sessions tagged to projects
- Sessions linked to tasks
- Distraction notes → BrainDump
- Can trigger Pipes (e.g., "focus done → journal prompt")
- Top bar shows active session

---

### APP 13: Agents

**Purpose:** Operational visibility + control over agent tasks.

**Main screen — Dispatch Board:**
- **Header counts**: Running | Completed today | Failed | Queued
- **Task cards**: Title | Agent | Project | Status | Elapsed | Expand
- Expand → prompt sent, output (partial if running), error if failed
- Failed tasks: "Retry" button, "Edit & retry" button

**Campaign flow view:**
- When campaign running, tasks show as topology graph
- Nodes = steps (status dots)
- Edges = dependencies
- Parallel side-by-side, sequential top-to-bottom
- Red = failed, pulsing yellow = running, green = done, grey = pending
- Click node → detail panel

**Agent roster tab:**
- Agent cards: name, type, status, tasks today, success rate (30 tasks), avg duration
- Click → detail: full history, fitness trend, scope limits
- Configure button: edit params, model, timeout, scope

**Scope Advisor:**
- On task creation, warning banner if similar scope failed before
- "Wiki-scope tasks timed out 3x. Recommend reducing scope."
- From Honcho query + Outcome Tracker

**Reflexion injection (Phase 2):**
- On dispatch, query Honcho for similar past outcomes
- Inject "Last 3 similar: [what worked/failed]" into prompt
- Visible in task detail under "Prompt context"

**History tab:**
- Full log of all agent tasks
- Filter: by agent, project, status, date range
- Each entry: timestamp, summary, agent, duration, status
- Click → full detail + output

**Connections:**
- From Proposals (on approval)
- From Tasks (on assign)
- Reads `.superman` files
- Writes back to Proposals (execution record)
- Feeds Outcome Tracker
- OpenClaw status in header

---

### APP 14: Channels

**Purpose:** Manage messaging integrations. Configure routing and identity.

**Main screen:**
- **Connected channels** (cards): Type | Name | Status | Last msg | Msg count today
- "Add channel" button → setup flow

**Channel detail:**
- Message history log
- Routing rules (which events → this channel)
- Agent identity (name, avatar, persona for this channel)
- Test message button

**Right Hand identity:**
- Special config for primary agent persona
- Name, description, communication style
- Read by OpenClaw on spawn

**Notification routing:**
- Visual builder: "When [event] → send to [channel] with [template]"
- Events: execution failed, completed, deploy failed, email flagged, habit broken, custom pipe

**Connections:**
- OpenClaw reads for messaging
- Pipes dispatch notifications
- Agent results reported to channels

---

## INTEGRATIONS LAYER

### What Integrations Do

Connectors between EMA and external systems. **Bidirectional** where possible. **Event-driven** where applicable.

### Integration 1: GitHub

**Setup:**
- Settings → Integrations → GitHub
- OAuth2 login
- Select repos to sync

**Reads from GitHub:**
- New commits on watched branches
- PR status changes
- Deploy status (via GitHub Actions)
- Issues/discussions flagged with label
- Releases

**Writes to GitHub:**
- Create branch from EMA Task
- Create PR from Proposal (auto-draft)
- Close issue when Task completed
- Commit message from Execution completion
- Add label to issue from Project

**UI surfacing:**
- Project Resources tab: repo link, last commit, branch, PR count
- Task detail: "Create branch" button
- Proposal detail: "Create PR" button
- Execution result: auto-commit option

**Events:**
- GitHub commit → updates Project activity
- PR opened → creates Proposal option
- Deployment status → triggers Pipe (failed → urgent task)

---

### Integration 2: Google Drive

**Setup:**
- Settings → Integrations → Google Drive
- OAuth2 login
- Select folders to sync with EMA (bidirectional)

**Reads from Drive:**
- Folder structure
- File metadata (name, modified date, size)
- File content (for indexing)
- Permissions/sharing

**Writes to Drive:**
- New Wiki files → create Drive docs (export)
- Project notes → create Drive folder
- Execution results → append to shared doc
- Share doc with team (via Pipes)

**UI surfacing:**
- Project Resources tab: linked Drive folder
- Wiki app: "Export to Drive" button per file or folder
- Proposal detail: "Attach Google Doc" button
- Pipes: "Export execution to Drive" action

**Sync:**
- Bidirectional for opt-in folders
- Conflict resolution: EMA canonical for app data, Drive canonical for shared docs

---

### Integration 3: Discord Server Link

**Setup:**
- Settings → Integrations → Discord
- OAuth2 + bot token
- Select guild(s) and channels to link

**Reads from Discord:**
- New messages in linked channels
- Reactions (e.g., react with ✅ to approve Proposal)
- Thread messages
- User reactions/activity

**Writes to Discord:**
- Execution results (auto-post)
- Proposal ready notifications
- Task assignments
- Channel-specific Pipes

**UI surfacing:**
- Channels app: list linked Discord servers/channels
- Proposal detail: "Post to Discord" button
- Task detail: "Notify in #channel" button
- Dashboard execution feed: can inline Discord thread

**Events:**
- Discord message with EMA keyword → create BrainDump item
- React with ✅ to Proposal card → approve
- React with 🚀 to Execution → pin to project

---

### Integration 4: Slack Server Link

**Setup:**
- Settings → Integrations → Slack
- OAuth2 + bot token
- Select workspace(s) and channels

**Same as Discord:**
- Reads messages, reactions
- Writes results, notifications
- Post to Slack button
- Linked Slack channels

---

### Integration 5: API Provider Accounts

**Setup:**
- Settings → Integrations → API Providers
- OpenAI, Anthropic, others
- Securely store API keys (encrypted at rest)
- Set default models per agent type

**Uses:**
- Agent dispatches use configured APIs
- CLI Manager reads keys for model switching
- Token counters use API pricing data

**UI surfacing:**
- Settings panel: list connected APIs, keys hidden, revoke option
- Agents roster: model selection per agent (uses configured API)
- Token Monitor: breakdown by API provider

**Connections:**
- Agents read from here on spawn
- Metrics track cost per API
- Evolution can suggest cheaper API switches

---

### Integration 6: Server/VPS Monitoring

**Setup:**
- Settings → Integrations → VPS
- SSH key or API credentials
- Select servers to monitor

**Reads:**
- CPU, RAM, disk usage
- Running processes
- Log tail (app logs)
- Deployment status (if Render/Railway/etc.)

**UI surfacing:**
- Project Resources tab: server status card (CPU/RAM bars, status dot)
- Dashboard: optional VM health widget
- Project Executions: can link to server logs

**Events:**
- High CPU/RAM → trigger Pipe alert
- Deployment failed → urgent task + channel notify

---

### Integration 7: Project Metadata Sync

**Integrations linking:**
- GitHub repo → Project
- Deploy target (Render, Railway, Vercel) → Project
- Domain (DNS) → Project
- Google Drive folder → Project
- Discord channel → Project
- Slack channel → Project

**Auto-detection:**
- When linking integration, suggest linked resources
- Example: "This GitHub repo links to 3 existing projects, link it?"

**Cross-project queries:**
- "Show all projects with failing deploys" → uses Render/Railway API
- "Find all Proposals affecting repos with >5 open PRs" → uses GitHub API

---

## INTEGRATION MANAGER (New App Concept)

Could be a Settings sub-panel or standalone app.

**Shows:**
- All connected integrations (status, last sync, API calls today)
- Linked resources per integration (repos, folders, channels, servers)
- Sync logs (what synced, when, any errors)
- API rate limits remaining
- Cost breakdown (per API provider)

**Actions:**
- Reconnect integration (re-auth)
- Unlink specific resource
- Manual sync button
- Test connection button
- Sync settings (frequency, direction, conflict rules)

---

## INTELLIGENT FEATURES (Cross-App)

### Smart Filters

User can build complex queries, save as filters:
- "Tasks assigned to me, no proposal yet, high priority, due this week"
- "Executions completed in last 7 days with success rate <80%"
- "BrainDump items tagged to EMA project, not yet processed"

System can learn from saved filters and suggest filters:
- "You often filter by Projects=[X] and Status=[Active]. Save this filter?"

### Undo/History

System-level undo for destructive operations:
- Undo delete (tasks, proposals, projects)
- Undo status change
- Undo agent dispatch (if not started)
- Keep undo stack per space (clear on space switch? configurable)

### Conflict Resolution

When two devices edit same object:
- Show "This was edited elsewhere" banner
- Option: Keep local | Merge | Accept remote
- Track conflict history

### Offline Support

- **Local-first apps**: BrainDump, Tasks, Journal, Canvas can work offline
- **Sync queue**: changes queue locally, sync when back online
- **Status indicator**: top bar shows sync status (synced | pending sync | error)

---

## ADVANCED FILTERS & QUERIES

### Filter Builder UI

Visual query builder for complex filters:
- **Columns**: What to show (title, project, status, due date, etc.)
- **Rows** (filters): Status = "Active" AND Project IN ["EMA", "Wilson"] AND Due < "next Monday"
- **Sort**: By due date (asc), by created (desc), by agent success rate
- **Save**: Button to save this filter with a name

### AI-Powered Query Suggestions

Based on Honcho/Superman context:
- "Tasks related to this Proposal"
- "Executions similar to the one that just failed"
- "BrainDump items that smell like they need a proposal"

---

## SYNC STATUS & HEALTH

### Sync Status Indicator (Top Bar)

Dot indicator showing:
- 🟢 All synced (everything up to date)
- 🟡 Syncing (operations in flight)
- 🔴 Sync error (something broke, show detail on hover)

Click to open detailed sync panel:
- Per-app sync status (Dashboard, BrainDump, Tasks, Projects, etc.)
- Last sync time per app
- Pending operations count
- Any errors (with retry button)
- Manual sync button

### Wiki Sync Indicator

Shows if Wiki (filesystem + :8093 API) is in sync with EMA DB:
- Files modified in vault (/home/trajan/vault/) or wiki/spaces/default/
- Files modified in EMA
- Conflicts (same file edited both places)

---

## FINAL APP LAUNCH ORDER (Recommendation)

### Week 7a — Core Loop (Essential)
1. **Dashboard** (surface execution feed, stat cards)
2. **BrainDump** (capture + queue)
3. **Tasks** (list + create)
4. **Proposals** (kanban + create + approve)
5. **Agents** (dispatch board + roster)

### Week 7b — Context & Knowledge
6. **Projects** (grid + detail tabs)
7. **Wiki** (tree + editor + search + :8093 API)
8. **Canvas** (infinite whiteboard)

### Week 8a — Lifestyle & Automation
9. **Habits** (today view + calendar)
10. **Journal** (daily editor + templates)
11. **Focus** (timer + sessions)
12. **Pipes** (trigger + actions + stock pipes)

### Week 8b — Communication & Settings
13. **Channels** (connected channels config)
14. **Integrations** (GitHub, Google Drive, Discord, Slack, API providers)
15. **Settings** (spaces, preferences, integrations config)

### Week 9 — Intelligence
16. **Responsibilities** (calendar + recurring)
17. **Honcho integration** (reflexion injection, scope advisor)
18. **Metrics dashboard** (outcomes, patterns, learning feed)

---

## BUILDER READINESS CHECKLIST

For each app to be buildable from this spec:

- [x] Clear purpose statement
- [x] Main screen layout (visual hierarchy)
- [x] Every interactive element described
- [x] Every view/tab listed
- [x] Data model (what it reads/writes)
- [x] Connections to other apps
- [x] Edge cases and empty states
- [x] Backend endpoints needed
- [x] Real-time sync requirements
- [x] Integration points

---

## NEXT STEPS

1. **Prioritize**: Which 5 apps for Week 7a MVP?
2. **API Design**: Define REST endpoints for each app
3. **State Management**: Zustand store per app + global shell store
4. **Real-time Sync**: WebSocket architecture for live updates
5. **Styling**: Design system / Tailwind tokens for 13 app cohesion

This spec is **buildable from zero**. Hand any app section to a builder, they have everything needed.

---

*Last updated: 2026-04-03 21:30 UTC*
*Status: Ready for implementation*
