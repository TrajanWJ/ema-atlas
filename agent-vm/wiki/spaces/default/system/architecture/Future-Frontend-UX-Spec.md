---
title: Future Frontend UX Spec
type: knowledge
status: draft
created: '2026-03-19'
tags:
  - frontend
  - ux
  - design
  - architecture
updated: '2026-03-19'
source: unknown
wiki_id: system/architecture/Future-Frontend-UX-Spec
imported_from: vault/Architecture/Future-Frontend-UX-Spec.md
imported_at: '2026-04-04T00:23:56.751Z'
summary: ''
---

# Future Frontend UX Spec
## Native Surface for Trajan's AI Agent OS

> **Purpose:** Replace Discord as the primary interface for Trajan's OpenClaw agent OS. Five purpose-built views replace scattered Discord channels with a coherent, real-time, agent-native UI.

---

## Overview

| View | Replaces | Primary Purpose |
|------|----------|-----------------|
| Bridge | #concierge + #dispatch | Live conversation + agent command center |
| Task Workspace | #desk forum | Task tracking, streaming progress, queue management |
| Knowledge Graph | Obsidian vault browser | Visual vault navigation + semantic linking |
| Agent Gallery | (new — no Discord equiv) | Per-agent status, history, and direct interaction |
| System Panel | #heartbeat + #ops-log | Ops health, cron, tokens, errors, dispatch queue |

**Tech assumptions:**
- Frontend: React + TypeScript (or SvelteKit for smaller bundle)
- Real-time: WebSocket to OpenClaw Gateway at `ws://127.0.0.1:18789`
- Graph: D3.js force-directed or Cytoscape.js
- Charts: Recharts or Chart.js
- Mobile: Responsive (CSS grid + bottom nav) or React Native shell
- State: Zustand or Jotai for ephemeral; localStorage for persisted prefs

---

## View 1: Bridge (Home)

> The nerve center. You talk to Concierge here, watch agents work, and route outputs to the right place.

### Components

```
┌─────────────────────────────────────────────────────────────┐
│  🛎️ Bridge                              [⚙] [🔔] [👤]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ AGENT ACTIVITY FEED                                 │   │
│  │                                                     │   │
│  │  [🔬 Researcher] — "Found 3 papers on LLM routing" │   │
│  │  ↳ [expand thread ▼]                               │   │
│  │                                                     │   │
│  │  [💻 Coder] — "PR opened: vault-sync refactor"     │   │
│  │  ↳ [expand thread ▼]                               │   │
│  │                                                     │   │
│  │  [🛎️ Concierge] — Streaming response here...▌     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [🔬] [💻] [💾] [📋] [😈]   Quick-Route Bar        │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ > _                                      [Send ↵]   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Component List:**
- **Top Nav Bar** — View title, notification bell, settings icon, user avatar
- **Activity Feed** — Scrollable list of agent output cards; auto-scrolls to bottom on new message
- **Agent Output Card** — Avatar emoji + agent name + one-liner summary; chevron to expand full thread
- **Expanded Thread Panel** — Full streaming output, code blocks, links, timestamps; collapsible
- **Streaming Cursor** — Animated blinking cursor (▌) during active generation; text renders word-by-word via SSE/WS chunks
- **Quick-Route Bar** — Five emoji buttons (🔬💻💾📋😈); toggles route target; selected target glows with agent accent color
- **Persistent Input Bar** — Full-width text input always docked at bottom; supports multi-line (shift+enter); emoji, attach, voice icons on right
- **Route Indicator** — Small label above input: "→ Concierge" or "→ Researcher" depending on selection

**Data Sources:**
- `ws://127.0.0.1:18789` — `agent.output` events (streaming chunks), `agent.status` events
- `~/dispatch/inter-agent/` — Watch for new dispatch files (inotify or WS subscription)
- `~/memory/YYYY-MM-DD.md` — Recent session history for feed backfill on load
- Discord API (fallback during transition) — Read #concierge, #dispatch history

**Key Interactions:**

| Trigger | Action |
|---------|--------|
| Type + Enter | Send to current route target (default: Concierge) |
| Click 🔬 button | Switch route to Researcher; input label updates |
| Click output card | Expand inline thread; subsequent clicks collapse |
| Long-press card (mobile) | Show context menu: copy, pin, route to agent |
| Scroll up in feed | Load older history; pause auto-scroll |
| Scroll to bottom | Resume auto-scroll |
| Click expand ▼ | Full thread slides open below card; scrollable |
| Streaming in progress | Text renders char-by-char; cursor blinks; feed auto-scrolls |

**Mobile vs Desktop:**
- **Desktop:** Feed takes full height; input fixed at bottom; quick-route bar above input
- **Mobile:** Feed rendered as card stack; input launches bottom-sheet on tap; quick-route bar is horizontal scroll strip; expand thread opens full-screen sheet; swipe left on card to dismiss

**State:**
- **Persisted:** Last selected route target, feed scroll position (per session), pinned cards
- **Ephemeral:** Streaming buffer, current input text, expanded/collapsed state of threads, notification badge count

---

## View 2: Task Workspace

> Where work gets done. See everything in flight, track progress in real time, reprioritize on the fly.

### Components

```
┌──────────────────────────────────────────────────────────────────┐
│  📋 Task Workspace                              [+ New Task]      │
├─────────────┬────────────────────────────────┬───────────────────┤
│ QUEUE       │ ACTIVE TASK                    │ COMPLETED         │
│             │                                │                   │
│ 🔬 Research │ ┌──────────────────────────┐  │ [✓] vault-sync    │
│  ▓▓▓░░ 3   │ │ 🔬 Trajan/Research #14   │  │     Researcher    │
│             │ │ Analyzing LLM routing    │  │     2h ago        │
│ 💻 Coder    │ │ ████████████░░░░ 65%     │  │                   │
│  ▓▓░░░ 2   │ │ ⏱ 4m 32s elapsed        │  │ [✓] PR #42 opened │
│             │ │                          │  │     Coder         │
│ 💾 Vault    │ │ > Fetching paper list... │  │     45m ago       │
│  ▓░░░░ 1   │ │ > Scoring relevance...▌  │  │                   │
│             │ └──────────────────────────┘  │ VAULT OUTPUTS     │
│ 😈 Devil's  │                                │                   │
│  ░░░░░ 0   │ QUEUED TASKS                   │ [📄] Research-    │
│             │                                │  Summary-v2.md    │
│ PRIORITY    │ ┌──────────┐ ┌──────────┐     │                   │
│ LANES       │ │🔬 Task15 │ │💻 Task8  │     │ [📄] Arch-Notes   │
│ [🔴🟡🟢]  │ └──────────┘ └──────────┘     │  .md              │
└─────────────┴────────────────────────────────┴───────────────────┘
```

**Component List:**
- **Left Sidebar — Queue Depth Panel**
  - Agent rows: avatar, name, queue bar (filled segments per queued task)
  - Priority lane filter: 🔴 Critical / 🟡 High / 🟢 Normal (clickable toggles)
  - Queue count badge per agent
- **Main Area — Active Task Card**
  - Task header: task ID, agent avatar, title
  - Progress bar: 0–100% (derived from agent reporting or heuristic)
  - Elapsed timer: live-updating HH:MM:SS
  - Streaming output window: monospace, word-by-word render, auto-scroll
  - Action toolbar: [Cancel ✕] [Reprioritize ⬆] [Reassign →] [Expand ⤢]
- **Queued Tasks Strip** — Horizontal scroll of pending task cards below active
- **Task Card (queued)** — Agent avatar, task title truncated, priority dot, drag handle
- **Right Sidebar — Completed + Vault Outputs**
  - Completed task list: checkmark, title, agent, timestamp
  - Vault Outputs section: file links written by agents this session
- **New Task Button** — Top right; opens task creation modal

**Task Creation Modal:**
- Target agent selector (dropdown with avatars)
- Priority selector (🔴🟡🟢)
- Task description textarea
- Attach vault file (optional)
- [Dispatch] button

**Data Sources:**
- `ws://127.0.0.1:18789` — `task.created`, `task.progress`, `task.completed`, `task.streaming` events
- `~/dispatch/queue/` — JSON files per queued task; watch for additions/removals
- `~/dispatch/inter-agent/` — Inter-agent delegation events
- `~/vault/` — Vault output file links (from agent write events)
- Task metadata: `~/dispatch/tasks/*.json` (id, agent, priority, status, timestamps)

**Key Interactions:**

| Trigger | Action |
|---------|--------|
| Click [Cancel] | Sends `task.cancel` command via WS; task card shows "Cancelling…" then moves to completed as "Cancelled" |
| Click [Reprioritize] | Opens inline priority picker (🔴🟡🟢); sends `task.reprioritize` command |
| Click [Reassign] | Opens agent selector dropdown; sends `task.reassign` with new agent id |
| Click [Expand] | Active task card goes full-screen modal with larger streaming window |
| Drag queued task | Reorder queue; sends reorder command on drop |
| Click completed task | Opens read-only task detail panel (right side) |
| Click vault output link | Opens Knowledge Graph with that node highlighted, or opens note in slide panel |
| Click + New Task | Opens task creation modal |

**Mobile vs Desktop:**
- **Desktop:** 3-column layout (sidebar / main / sidebar); all panels visible simultaneously
- **Mobile:** Bottom tab: Queue / Active / Completed; active task full-width; swipe left on task card = cancel confirmation; long-press = reprioritize; priority slider replaces lane toggles; queued tasks are vertical list (not horizontal strip)

**State:**
- **Persisted:** Priority lane filter selection, sidebar collapse state, completed tasks list (session)
- **Ephemeral:** Streaming buffer, expanded task modal, drag state, animation progress on cancel

---

## View 3: Knowledge Graph

> The vault, made visual. Every note is a node. Every link is an edge. The map grows as agents work.

### Components

```
┌─────────────────────────────────────────────────────────────────┐
│  🗺️ Knowledge Graph        [🔍 Search...]        [+ New Note]  │
├────────────────────────────────────┬────────────────────────────┤
│                                    │ SLIDE PANEL (node detail) │
│          FORCE-DIRECTED GRAPH      │                           │
│                                    │  📄 Research-Summary-v2   │
│    ●━━━━●          ●               │  Type: research           │
│   / \    \        /|\              │  Project: LLM-Routing     │
│  ●   ●    ●──────● | ●             │  Modified: 2026-03-19     │
│       \  /        \|/              │                           │
│        ●    ●━━━━━━●               │  ─────────────────────    │
│             |                      │  # Research Summary v2    │
│    [🔬] [💻][📁][🏷]              │  ...content renders here  │
│    Legend: type color key          │  with full markdown...    │
│                                    │                           │
│                                    │  [Edit] [Link] [Delete]   │
└────────────────────────────────────┴────────────────────────────┘
```

**Component List:**
- **Graph Canvas** — Full-height WebGL/SVG force-directed graph; nodes repel, edges attract; zoom + pan with mouse/pinch
- **Node** — Circle; color-coded by type (research=blue, architecture=purple, ops=orange, personal=green); size proportional to link count; label on hover
- **Edge** — Line between nodes; solid = wikilink; dashed = semantic similarity; thickness = similarity score
- **Node Glow** — Animated pulse (CSS animation) when node is auto-surfaced from Bridge conversation context
- **Legend Panel** — Small floating panel: node type → color mapping
- **Search Bar** — Full-text search; on query, matching nodes enlarge and highlight, shortest path between results glows, non-matching nodes dim to 20% opacity
- **Slide Panel** — Right side panel (desktop) or bottom sheet (mobile); shows note content when node clicked; markdown rendered; supports editing inline
- **Slide Panel Actions** — [Edit] opens full markdown editor, [Link] opens node linker modal, [Delete] with confirm
- **Filter Toolbar** — Below graph: filter by project, tag, date range, agent author
- **Mini-Map** — Bottom-right corner; thumbnail of full graph with viewport indicator; click to jump
- **New Note Button** — Opens note creation form; auto-places node in graph

**Data Sources:**
- `~/vault/**/*.md` — All markdown files; parsed for YAML frontmatter (type, project, tags) and wikilinks `[[...]]`
- `ws://127.0.0.1:18789` — `vault.write` events (new/modified notes trigger graph update); `bridge.context` events (project mentions trigger node glow)
- Semantic similarity: pre-computed embeddings stored in `~/vault/.index/embeddings.json` (generated by Researcher agent); cosine similarity > 0.7 = dashed edge
- Frontmatter index: `~/vault/.index/frontmatter.json` (cached, rebuilt on vault.write events)

**Key Interactions:**

| Trigger | Action |
|---------|--------|
| Click node | Slide panel opens with note content; node gets selection ring |
| Double-click node | Full-screen note editor modal |
| Click empty canvas | Deselects node; closes slide panel |
| Drag node | Repositions node; force simulation adjusts neighbors |
| Scroll / pinch | Zoom in/out; min/max zoom bounds enforced |
| Type in search | Nodes filter in real-time; matching nodes pulse; paths illuminate |
| Clear search | Graph returns to full view, all nodes at full opacity |
| Bridge mentions project | Backend emits `bridge.context` event with project name; matching nodes glow amber for 10s |
| Click edge | Shows edge metadata: link type, similarity score, linked section |
| Filter by type | Non-matching nodes collapse (opacity 0, radius 0 animation) |
| Click [Edit] in panel | Switches panel to edit mode; markdown textarea; [Save] writes via WS |
| Click [Link] in panel | Opens node search to create new wikilink; inserts `[[target]]` into note |

**Mobile vs Desktop:**
- **Desktop:** Graph takes ~65% width; slide panel takes ~35%; mini-map visible; full filter toolbar
- **Mobile:** Default view = hierarchical list (folder tree by project/type); [Show Graph] button opens graph in full-screen modal; tap node = bottom sheet for note; search bar always visible at top; no mini-map; filter as bottom sheet

**State:**
- **Persisted:** Graph layout positions (localStorage, per-session), active filter state, zoom level, last-opened note
- **Ephemeral:** Search query, highlighted paths, node glow animations, slide panel open/closed, edit mode unsaved content

---

## View 4: Agent Gallery

> Your team, at a glance. Live status, today's output, drill into any agent's world.

### Components

```
┌─────────────────────────────────────────────────────────────────┐
│  👥 Agent Gallery                        [All ▼] [Today ▼]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │ 🔬            │  │ 💻            │  │ 😈            │      │
│  │ Researcher    │  │ Coder         │  │ Devil's       │      │
│  │               │  │               │  │ Advocate      │      │
│  │ ● WORKING     │  │ ○ IDLE        │  │ ● THINKING    │      │
│  │               │  │               │  │               │      │
│  │ "Scoring 3    │  │ "Last: PR     │  │ "Reviewing    │      │
│  │  papers..."   │  │  #42 opened"  │  │  arch spec"   │      │
│  │               │  │               │  │               │      │
│  │ 📊 7 tasks    │  │ 📊 4 tasks    │  │ 📊 2 tasks    │      │
│  │ today         │  │ today         │  │ today         │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │ 💾            │  │ 📋            │  │ 🔒            │      │
│  │ Vault-Keeper  │  │ Ops           │  │ Security      │      │
│  │ ○ IDLE        │  │ ● WORKING     │  │ ○ IDLE        │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Component List:**
- **Gallery Grid** — Responsive CSS grid; 3 columns desktop, 2 tablet, 1 mobile list
- **Agent Card** — Rounded card with:
  - Large emoji avatar (centered, 48px)
  - Agent name (bold)
  - Status indicator: colored dot + label (● WORKING=green pulse, ● THINKING=amber pulse, ○ IDLE=grey static)
  - Last output snippet: 2-line truncated text; italic; updates live
  - Task count badge: "📊 N tasks today"
  - Subtle glow border when status = WORKING (CSS box-shadow animation)
- **Filter Bar** — Top: "All" dropdown (filter by status), "Today" dropdown (date range)
- **Agent Detail Panel** — Opens on card click; full-height overlay or right panel:
  - Agent header: emoji, name, description, current status
  - Task History tab: chronological list of tasks with status, duration, output links
  - Recent Outputs tab: expanded text of last N outputs with timestamps
  - Queue tab: pending tasks for this agent (links to Task Workspace)
  - Stats bar: tasks today / this week / total; avg task duration
  - [Dispatch Task to Agent] button → opens new task modal pre-filled with this agent

**Data Sources:**
- `ws://127.0.0.1:18789` — `agent.status` events (idle/thinking/working + agent_id); `agent.output` events (last output text); `task.completed` events (for task count)
- `~/dispatch/tasks/*.json` — Task records filtered by agent_id; count tasks in today's date range
- `~/memory/YYYY-MM-DD.md` — Session history per agent (for Recent Outputs tab)
- Agent roster: `~/workspace/roster.md` — Agent names, emojis, descriptions, channel ids

**Key Interactions:**

| Trigger | Action |
|---------|--------|
| WebSocket `agent.status` event | Card status dot + label updates instantly; WORKING triggers border glow animation |
| WebSocket `agent.output` event | Last output snippet updates in card; brief fade-in animation |
| Click card | Opens Agent Detail Panel; URL updates to `/gallery/{agent-id}` |
| Click [Task History] tab | Loads task list from dispatch records; lazy-loads older records on scroll |
| Click task in history | Deep-links to that task in Task Workspace (if active) or opens archived task detail |
| Click [Dispatch Task] | Opens new task modal pre-addressed to this agent |
| Filter "WORKING" | Gallery filters to show only active agents; cards re-sort to top |
| Close detail panel | Returns to gallery grid; card briefly highlights |

**Mobile vs Desktop:**
- **Desktop:** 3-column grid; Agent Detail opens as right-side panel overlay (60% width); grid remains visible behind panel
- **Mobile:** Single-column list; each agent is a list row with avatar, name, status dot, task count; tap = full-screen detail view; status dots replace border glow; swipe down to dismiss detail

**State:**
- **Persisted:** Last-selected filter, detail panel last-active tab
- **Ephemeral:** Card glow animations, streaming output updates, detail panel open state, WS connection status per agent

---

## View 5: System Panel

> Eyes on the machine. Cron health, webhooks, token burn, live errors, dispatch depth — all in one ops console.

### Components

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚙️ System Panel                    [Today ▼] [🔴 Errors: 2]   │
├──────────────────────┬───────────────────────┬───────────────────┤
│ CRON JOBS            │ WEBHOOK HEALTH        │ TOKEN BUDGET      │
│                      │                       │                   │
│ vault-sync    ✓ 2m   │ discord-webhook  ✓    │ [Pie Chart]       │
│  next: 5m            │  last: 30s ago        │                   │
│                      │                       │ 🔬 32%            │
│ healthcheck   ✗ 1h   │ github-webhook   ✓    │ 💻 28%            │
│  next: 3h            │  last: 2m ago         │ 🛎️ 22%            │
│                      │                       │ other 18%         │
│ digest-gen    ✓ 6h   │ ops-webhook      ✗    │                   │
│  next: 18h           │  last: 45m ago        │ Total: 84,320     │
│                      │  [status: timeout]    │ Budget: 500k      │
├──────────────────────┴───────────────────────┴───────────────────┤
│ ERROR STREAM                                  DISPATCH QUEUE     │
│                                                                   │
│ [🔴] 03:01 vault-keeper: write failed         ▂▄▆█▆▄▂▁▁▁        │
│ [🟡] 02:58 researcher: rate limit hit         depth: 3 tasks     │
│ [🟢] 02:45 cron: vault-sync completed         peak: 8 (2h ago)  │
│ [🔴] 02:12 webhook: ops-webhook timeout                          │
│                                                                   │
│ [🔴 Only] [🟡+🔴] [All]   [Clear] [Export]                     │
└───────────────────────────────────────────────────────────────────┘
```

**Component List:**
- **Cron Jobs Table** — Columns: job name, last run time, result (✓/✗), next run countdown; rows sorted by next run time; click row = job detail modal
- **Webhook Health Table** — Columns: webhook name, last ping timestamp, status icon (✓=green, ✗=red); click row = webhook detail (URL, recent pings, retry button)
- **Token Budget Panel** — Donut/pie chart (Recharts); segments per agent; center shows total tokens used today; legend with percentages; toggle: Today / This Week
- **Error Stream** — Live log feed; color-coded severity dots (🔴=error, 🟡=warn, 🟢=info); timestamp, source, message; auto-scrolls; pauses on hover; filter buttons by severity; [Clear] clears display buffer (not file); [Export] downloads filtered log as .txt
- **Dispatch Queue Sparkline** — Recharts LineChart; last 60 minutes of queue depth; X axis = time, Y axis = task count; hover = tooltip with exact count; current depth shown as badge; peak annotated
- **System Health Summary Bar** — Top-level indicator: all-green if no errors, amber if warnings, red if critical errors; click = jumps to error stream filtered to recent errors
- **Date Range Filter** — Top right: Today / This Week / Custom range

**Data Sources:**
- `ws://127.0.0.1:18789` — `system.health` events (cron status, webhook pings, error events, queue depth)
- `~/ops/cron-status.json` — Cron job last run, next run, result per job
- `~/ops/webhook-health.json` — Webhook registry with last ping timestamps + HTTP status codes
- `~/ops/token-usage.json` — Daily token usage by agent_id (written by each agent on task completion)
- `~/ops/error.log` or `~/ops/errors.json` — Structured error log with severity, timestamp, source, message
- `~/dispatch/queue/` — Count of files = current queue depth; history sampled every 60s into `~/ops/queue-history.json`

**Key Interactions:**

| Trigger | Action |
|---------|--------|
| WebSocket error event | New row prepends to error stream with flash animation; top-bar badge increments |
| WebSocket queue event | Sparkline updates in real-time (append point); badge updates |
| Click cron job row | Opens cron detail modal: full history, cron expression, manual trigger button |
| Click webhook row | Opens webhook detail: URL (masked), last 10 pings, retry/test button |
| Click [Retry] on failed webhook | Sends `webhook.retry` command via WS; row shows "Retrying…" |
| Error severity filter | Hides/shows rows matching selected severity |
| Hover sparkline | Tooltip shows exact queue depth at that time |
| Toggle Today/Week on token chart | Pie chart re-renders with aggregated data for range |
| Click pie segment | Drills down: shows that agent's task list for the period |
| [Export] in error stream | Downloads visible filtered log entries as timestamped .txt |
| [Clear] in error stream | Clears in-memory display buffer; does not affect log files |

**Mobile vs Desktop:**
- **Desktop:** 2×2 grid of panels (cron+webhook top-left/right, token top-right, error+sparkline bottom spanning full width)
- **Mobile:** Single-column scroll with collapsible section headers; default shows summary card (green/amber/red overall status, queue depth, error count); tap section = expands to full panel; sparkline simplified to last-15-minutes bar; cron/webhook as condensed lists; token chart as horizontal bar instead of pie

**State:**
- **Persisted:** Date range filter selection, error severity filter selection, collapsed/expanded sections (mobile)
- **Ephemeral:** Error stream display buffer (not persisted across reloads), sparkline in-memory data points, animation states, retry pending status

---

## OpenClaw Gateway Integration

### Connection

```
WebSocket endpoint: ws://127.0.0.1:18789
Protocol: JSON messages with { type, payload, timestamp } envelope
Auth: Bearer token from ~/.openclaw/gateway.token (if enabled)
Reconnect: Exponential backoff (1s → 2s → 4s → max 30s)
```

### Frontend → Gateway (Outbound Commands)

```jsonc
// Dispatch a task to an agent
{
  "type": "task.dispatch",
  "payload": {
    "agent_id": "researcher",
    "task": "Summarize recent LLM routing papers",
    "priority": "high",
    "context": { "vault_file": "Architecture/LLM-Router.md" }
  }
}

// Cancel a running task
{
  "type": "task.cancel",
  "payload": { "task_id": "task_abc123" }
}

// Reprioritize a task
{
  "type": "task.reprioritize",
  "payload": { "task_id": "task_abc123", "priority": "critical" }
}

// Reassign task to different agent
{
  "type": "task.reassign",
  "payload": { "task_id": "task_abc123", "agent_id": "coder" }
}

// Write to vault
{
  "type": "vault.write",
  "payload": {
    "path": "Research/New-Note.md",
    "content": "# New Note\n...",
    "frontmatter": { "type": "research", "project": "LLM-Routing" }
  }
}

// Send agent command (direct instruction)
{
  "type": "agent.command",
  "payload": {
    "agent_id": "concierge",
    "message": "What restaurants are near the office?",
    "route": "concierge"
  }
}

// Subscribe to event streams
{
  "type": "subscribe",
  "payload": {
    "channels": ["agent.output", "agent.status", "task.*", "system.health", "vault.write"]
  }
}
```

### Gateway → Frontend (Inbound Events)

```jsonc
// Agent output chunk (streaming)
{
  "type": "agent.output",
  "payload": {
    "agent_id": "researcher",
    "task_id": "task_abc123",
    "chunk": "Found 3 relevant papers on ",
    "is_final": false
  }
}

// Agent status change
{
  "type": "agent.status",
  "payload": {
    "agent_id": "coder",
    "status": "working",  // idle | thinking | working
    "task_id": "task_xyz789"
  }
}

// Task progress update
{
  "type": "task.progress",
  "payload": {
    "task_id": "task_abc123",
    "agent_id": "researcher",
    "progress": 65,  // 0-100
    "elapsed_ms": 272000,
    "status": "running"  // queued | running | completed | cancelled | failed
  }
}

// Task completed
{
  "type": "task.completed",
  "payload": {
    "task_id": "task_abc123",
    "agent_id": "researcher",
    "result": "Summary written to vault/Research/Summary.md",
    "vault_outputs": ["Research/Summary.md"],
    "duration_ms": 310000
  }
}

// System health event
{
  "type": "system.health",
  "payload": {
    "cron": { "vault-sync": { "status": "ok", "last_run": "2026-03-19T03:00:00Z" } },
    "webhooks": { "discord-webhook": { "status": "ok", "last_ping": "2026-03-19T03:02:30Z" } },
    "queue_depth": 3,
    "errors_last_hour": 2
  }
}

// Vault file written (by agent)
{
  "type": "vault.write",
  "payload": {
    "path": "Research/Summary.md",
    "agent_id": "researcher",
    "operation": "create",  // create | update | delete
    "timestamp": "2026-03-19T03:05:00Z"
  }
}

// Bridge context event (for Knowledge Graph glow)
{
  "type": "bridge.context",
  "payload": {
    "mentioned_projects": ["LLM-Routing", "vault-sync"],
    "mentioned_files": ["Architecture/Future-Frontend-UX-Spec.md"]
  }
}

// Error event
{
  "type": "system.error",
  "payload": {
    "severity": "error",  // info | warn | error | critical
    "source": "vault-keeper",
    "message": "Write failed: permission denied",
    "timestamp": "2026-03-19T03:01:00Z"
  }
}
```

### Frontend State Machine

```
DISCONNECTED ──connect()──→ CONNECTING
CONNECTING ──ws.onopen──→ CONNECTED
CONNECTED ──subscribe──→ SUBSCRIBED (normal operating state)
SUBSCRIBED ──ws.onclose──→ RECONNECTING
RECONNECTING ──backoff──→ CONNECTING
CONNECTED ──ws.onerror──→ ERROR (show banner) ──retry──→ CONNECTING
```

**Connection UI:**
- Green dot in top-right nav = SUBSCRIBED
- Amber pulsing dot = CONNECTING/RECONNECTING
- Red dot = ERROR; click = shows error detail + manual retry button
- Toast notification on disconnect/reconnect

---

## Navigation Structure

```
Bottom Nav (mobile) / Left Nav (desktop):

[🏠 Bridge] [📋 Tasks] [🗺️ Graph] [👥 Gallery] [⚙️ System]
```

**URL Routing:**
```
/              → Bridge (home)
/tasks         → Task Workspace
/tasks/:id     → Task Workspace with task expanded
/graph         → Knowledge Graph
/graph/:slug   → Knowledge Graph with node selected
/gallery       → Agent Gallery
/gallery/:id   → Agent Gallery with agent detail open
/system        → System Panel
```

**Global Elements (persistent across views):**
- Top navigation bar: view title, WS connection indicator, notification bell (error/completion count), settings
- Keyboard shortcuts:
  - `Cmd/Ctrl+1-5` → switch views
  - `Cmd/Ctrl+K` → global command palette (search tasks, notes, agents)
  - `Escape` → close any open panel/modal
  - `/` → focus Bridge input from anywhere

---

## Design Tokens

```css
/* Colors */
--color-bridge: #4A90E2;         /* Blue — conversation */
--color-tasks: #E2844A;          /* Orange — work */
--color-graph: #9B59B6;          /* Purple — knowledge */
--color-gallery: #2ECC71;        /* Green — agents */
--color-system: #95A5A6;         /* Grey — ops */

/* Agent Accent Colors */
--agent-researcher: #3498DB;     /* Blue */
--agent-coder: #27AE60;          /* Green */
--agent-devils-advocate: #E74C3C; /* Red */
--agent-vault-keeper: #8E44AD;   /* Purple */
--agent-ops: #E67E22;            /* Orange */
--agent-security: #2C3E50;       /* Dark navy */
--agent-concierge: #D4A574;      /* Warm bronze */

/* Status */
--status-working: #2ECC71;       /* Pulsing green */
--status-thinking: #F39C12;      /* Amber */
--status-idle: #7F8C8D;          /* Grey */

/* Priority */
--priority-critical: #E74C3C;
--priority-high: #F39C12;
--priority-normal: #2ECC71;

/* Dark theme (default) */
--bg-base: #0F1117;
--bg-elevated: #1A1D26;
--bg-card: #22263A;
--text-primary: #E8EAF0;
--text-secondary: #8892A4;
--border: #2D3348;
```

---

## Implementation Phases

### Phase 1 — Bridge + Gateway Connection
- WS client, subscription model, reconnect logic
- Bridge view: input bar, activity feed, streaming output
- Quick-route bar functional

### Phase 2 — Task Workspace
- Task cards, queue depth sidebar
- Cancel/reprioritize/reassign actions
- Completed task list + vault output links

### Phase 3 — Agent Gallery
- Agent cards with live status
- Agent detail panel
- Direct dispatch from gallery

### Phase 4 — System Panel
- Cron table + webhook health
- Error stream
- Token budget chart
- Dispatch queue sparkline

### Phase 5 — Knowledge Graph
- Vault file parsing + graph construction
- Force-directed visualization
- Search + filter
- Note editor in slide panel
- Bridge context → node glow integration

---

## Open Questions

1. **Auth model** — Is the gateway exposed only on localhost, or do we need auth tokens for the frontend? (Relevant for mobile access over Tailscale)
2. **Mobile app vs responsive web** — React Native for native feel, or PWA for simplicity? PWA first is lower cost.
3. **Semantic embeddings** — Who generates them and when? Researcher agent on vault.write events? Or a dedicated indexer cron job?
4. **Graph layout persistence** — Store node positions in vault or localStorage? Vault is more durable but adds noise.
5. **Multi-user?** — If Trajan adds collaborators, does the gateway need user namespacing? Assume single-user for now.
6. **Offline mode** — Should Bridge allow composing messages while disconnected and queue them for when WS reconnects?

---

*Spec authored by Researcher agent for Trajan's AI Agent OS — 2026-03-19*
