---
title: dashboard-concepts
created: '2026-03-17'
updated: '2026-03-17'
type: project
status: active
confidence: 0.6
confidence_updated: 2026-03-18T00:00:00.000Z
source: project
tags:
  - agent-logs
  - agents
  - general
  - morning
  - projects
  - vault
summary: '```'
wiki_id: projects/System_Buildout/dashboard-concepts
imported_from: vault/Projects/System Buildout/dashboard-concepts.md
imported_at: '2026-04-04T00:23:56.894Z'
---
# Dashboard Concepts — Agent Ecosystem UI
*Designed for Trajan's 12-agent system on agent-vm (192.168.122.10)*
*Generated: 2026-03-16*

---

## Concept 1: "Mission Control" — Real-time Operations Dashboard

> *Think NASA flight director console, but for AI agents. Every metric in view, nothing hidden.*

### Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ◉ MISSION CONTROL          agent-vm · 192.168.122.10 · ▲ 14d 6h uptime   22:47 │
├──────────────┬──────────────┬──────────────┬──────────────┬────────────────────┤
│  AGENTS (12) │  SYS METRICS │  USAGE PACE  │  SESSIONS    │  DISCORD PULSE     │
│              │              │              │              │                    │
│  ● right-han │  CPU  ████▌  │  ████████░░  │  active: 3   │  #general    ████  │
│  ● architect │  12.4%       │  3.2h / 5h   │  idle:   8   │  #projects   ██    │
│  ● dev-lead  │              │  window      │  error:  1   │  #agents     ███   │
│  ● archivist │  RAM  ███░░  │  ───────────  │              │  #morning    █     │
│  ● researcher│  6.1 / 16GB  │  WEEKLY      │  ⚠ dev-lead  │  #vault      ██    │
│  ● prompt-en │              │  ██████████  │  last seen   │                    │
│  ● executor  │  DISK ██░░░  │  41h / 70h   │  4m ago      │  last 15min: 23msg │
│  ● strategis │  234 / 500GB │              │              │  peak: #general    │
│  ● analyst   │              │  pace: 🟡 ok │  spawn new → │                    │
│  ● curator   │  LOAD        │              │              │                    │
│  ● ops-agent │  0.42 0.38   │              │              │                    │
│  ● watcher   │  0.51        │              │              │                    │
├──────────────┴──────────────┴──────────────┴──────────────┴────────────────────┤
│  CRON TIMELINE                                                         [24h ▼]  │
│                                                                                 │
│  morning-briefing  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  next: 06:00 │
│  vault-sync        ░░░░░░░░░░██░░░░░░░░░░░░░░░░░░██░░░░░░░░░░░░░░  next: 02:00 │
│  agent-health      ██░░░░░██░░░░░██░░░░░██░░░░░██░░░░░██░░░░░██░░  next: 23:30 │
│  discord-digest    ░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░████  next: 08:00 │
│  project-scan      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  next: 03:00 │
│  ...17 more                                                          [expand ↓] │
├─────────────────────────────────────────────────────────────────────────────────┤
│  LIVE LOG TAIL                                        [right-hand ▼]  [pause ⏸] │
│  23:47:01  [right-hand]  received task from discord #projects                   │
│  23:47:02  [right-hand]  spawning subagent: architect for repo analysis         │
│  23:47:04  [architect]   reading /home/trajan/projects/execudeck/...            │
│  23:47:08  [architect]   analysis complete, writing to vault                    │
│  23:47:09  [right-hand]  posting response to discord                            │
│  ▌                                                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Key Features

**What makes it unique:** Everything is above the fold. No scrolling to find a critical metric. This is a "glance dashboard" — you open it, you know everything in 3 seconds.

- **Agent Status Ring**: Each of the 12 agents shown as a pill — green/yellow/red, last activity, click to drill into session log
- **Usage Pace Gauge**: Visual fuel gauge for your 5-hour daily window and weekly allocation. Color shifts yellow at 80%, red at 95%. Prevents surprise throttling.
- **Cron Timeline**: Gantt-style 24h view. Bars show last execution (solid = success, striped = fail). Click any cron to see last 5 run outputs inline.
- **Discord Pulse Heatmap**: Mini bar chart per channel, updates every 30s. Shows message velocity, not count — so a dead channel that just got 3 rapid messages pops.
- **Live Log Tail**: WebSocket-streamed, filterable by agent. Auto-pauses on user scroll, resumes when you scroll back to bottom. Regex filter built in.
- **Zero-click drill-down**: Hover any agent pill to get a mini popup — current task, last 3 actions, spawned subagents. Click to expand full session view.

### Technical Stack

```
Frontend:  SvelteKit (not Next.js — faster cold starts, no React overhead for monitoring)
Charts:    chart.js for metrics, custom SVG for cron timeline
Realtime:  WebSocket server (ws package, Node.js 22)
Backend:   Single Express server on port 3100
           - Polls agent-vm system metrics via /proc and df
           - Tails OpenClaw session logs via inotify
           - Proxies to OpenClaw Gateway API at :18789
           - Reads Discord webhook events for pulse heatmap
Cron data: Parses ~/.openclaw/agents/*/workspace/ + existing agent-status.sh
Hosting:   localhost on agent-vm, accessible via SSH tunnel or direct on LAN
```

**Why SvelteKit over Next.js:** No hydration penalty. Dashboard is pure reactive state — Svelte's compiled output is ~4x smaller and faster than equivalent React. For a monitoring tool that's always-on, boot time and memory matter.

### Build Time

| Phase | MVP | Polished |
|-------|-----|---------|
| Backend data layer + WebSocket | 4h | 8h |
| Agent status grid + log tail | 3h | 6h |
| System metrics panel | 2h | 4h |
| Cron timeline | 3h | 8h |
| Discord pulse | 2h | 4h |
| Usage gauge | 1h | 3h |
| **Total** | **~15h** | **~33h** |

MVP: one focused weekend. Polished (animations, drill-downs, mobile): 2–3 weekends.

### Why Trajan Would Love It

You built morning-briefing-v2.sh and executive-dashboard-v2.sh because you want *system truth at a glance*. This is that, but alive. No refreshing. No SSH-ing in to check. The cron timeline alone replaces the mental overhead of "wait, when does vault-sync run again?" — it's just *there*. The usage pace gauge is the thing you actually need: a fuel gauge for your AI budget so you never hit a wall mid-session. And because it's SvelteKit with no framework bloat, it loads in under 200ms on your LAN.

---

## Concept 2: "Executive Deck" — Strategic Command Surface

> *Your own ExecuDeck, but for commanding agents. Left hand types, right hand watches the world respond.*

### Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ⬡ EXECUTIVE DECK                              [morning brief] [vault] [⚙] [⛶] │
├────────────────────────────────┬────────────────────────────────────────────────┤
│  COMMAND                       │  CANVAS                              [+ card ▼]│
│                                │                                                │
│  ┌──────────────────────────┐  │  ┌──────────────┐  ┌──────────────────────┐   │
│  │ → send to: [right-hand▼] │  │  │ VAULT HEALTH │  │  PROJECT PORTFOLIO   │   │
│  │                          │  │  │              │  │                      │   │
│  │ /research the latest     │  │  │ 435 files    │  │  execudeck    ██ 73% │   │
│  │  developments in         │  │  │ 12 orphaned  │  │  agent-vm     ██ 61% │   │
│  │  multi-agent reasoning   │  │  │ 3 stale      │  │  clawd-v2     █  31% │   │
│  │  frameworks              │  │  │ last sync 2m │  │  openverse    ░   8% │   │
│  │                          │  │  │              │  │  + 6 more...         │   │
│  │                    [send]│  │  │ [run audit →]│  │  [open on host →]    │   │
│  └──────────────────────────┘  │  └──────────────┘  └──────────────────────┘   │
│                                │                                                │
│  RECENT                        │  ┌──────────────────────────────────────────┐  │
│  ─────────────────────────     │  │  MORNING BRIEF                  Mon 03/16 │  │
│  [you → right-hand] 2m ago     │  │                                           │  │
│  /analyze vault for stale      │  │  ✓ 3 agents ran overnight                 │  │
│  research on agent memory      │  │  ✓ vault-sync: 12 new files               │  │
│                                │  │  ↻ dev-lead: 1 PR open (review needed)    │  │
│  [right-hand → you] 1m ago     │  │  ⚠ usage: 2.1h of 5h used (Mon)          │  │
│  Found 7 relevant files in     │  │  → suggested focus: ExecuDeck PR review   │  │
│  vault/Research/. Oldest is    │  │                                           │  │
│  18 months (flagged stale).    │  │  [expand full brief →]                    │  │
│  Top pick: ...                 │  └──────────────────────────────────────────┘  │
│  [expand] [copy] [archive]     │                                                │
│                                │  ┌──────────────┐  ┌──────────────────────┐   │
│  [you → executor] 14m ago      │  │  ACTIVE TASKS│  │  DESK PITCHES        │   │
│  /run morning-briefing-v2.sh   │  │              │  │                      │   │
│                                │  │  architect   │  │  2 pending review    │   │
│  [executor → you] 13m ago      │  │  └ analyzing │  │  1 approved → build  │   │
│  ✓ Complete. Output posted     │  │    codebase  │  │  0 rejected          │   │
│  to #morning channel           │  │              │  │                      │   │
│                                │  │  researcher  │  │  [open pitches →]    │   │
│  ─────────────────────────     │  │  └ 3 sources │  └──────────────────────┘   │
│  [history] [clear] [export]    │  │    found     │                              │
│                                │  └──────────────┘                              │
└────────────────────────────────┴────────────────────────────────────────────────┘
```

**Morning Brief View** (triggered via top nav):
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ◧ MORNING BRIEF — Monday, March 16                              [close ✕] [⎙]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  OVERNIGHT ACTIVITY                    TODAY'S RECOMMENDED FOCUS               │
│  ─────────────────────────────         ─────────────────────────────────────   │
│  03:14  vault-sync ran (✓)             1. Review dev-lead PR (15 min)          │
│  04:00  agent-health ran (✓)           2. ExecuDeck canvas layout (2h)         │
│  06:00  morning-briefing ran (✓)       3. Vault audit — 12 orphans flagged     │
│  07:30  researcher: 3 items queued     4. Check openverse (8% stale)           │
│                                                                                 │
│  MESSAGES SINCE YESTERDAY                                                       │
│  ─────────────────────────────                                                  │
│  #general: 7 messages (2 need reply)                                            │
│  #projects: 3 messages (0 need reply)                                           │
│  #agent-logs: 42 auto-messages                                                  │
│                                                                                 │
│  VAULT DELTA                                                                    │
│  ─────────────────────────────                                                  │
│  +12 files added   |  ~3 files modified  |  0 deleted                          │
│  New: Research/multi-agent-2026-03-15.md, Agent-Learnings/patterns-update.md   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Key Features

**What makes it unique:** It's a *command surface*, not a monitoring surface. You don't just watch — you direct. The dual-pane design separates *action* (left) from *consequence* (right). You type a command, you see the world change.

- **Smart Command Terminal**: Slash-command aware. `/research`, `/analyze`, `/run`, `/brief` autocomplete with agent routing suggestions. Hit Tab to complete, Enter to fire. No friction between thought and action.
- **Agent Routing**: Dropdown to target a specific agent or let right-hand route intelligently. Commands are queued if agent is busy, with ETA shown.
- **Drag-and-Drop Canvas**: Cards on the right can be rearranged, resized, pinned. Add from a library of card types: vault query, project status, cron schedule, agent chat, custom metric.
- **Morning Brief Card**: Pulls output from your existing morning-briefing-v2.sh, renders it structured. Saves re-running it manually.
- **Project Portfolio**: SSH into host machine, runs `git status` / `git log` per project, surfaces uncommitted work and stale branches. The "open on host →" launches VS Code remotely via `code --remote`.
- **Desk Pitches Integration**: If ExecuDeck has a pitches format, this card renders them inline with approve/reject/defer actions that fire back to the relevant agent.
- **Persistent Layout**: Canvas arrangement saved to localStorage (or a flat JSON file on disk). Your layout survives refreshes.

### Technical Stack

```
Frontend:  React 19 + shadcn/ui (matches Trajan's existing ExecuDeck stack)
State:     Zustand (light, no boilerplate, works great with shadcn)
Terminal:  xterm.js for the command area (real terminal feel, resize handles)
Canvas:    react-grid-layout for drag/drop card arrangement
Backend:   Express + REST API (simpler than WebSocket for command/response flow)
           - /api/agents — list, status, send task
           - /api/vault — file count, orphans, recent changes
           - /api/projects — SSH to host, git status per project
           - /api/crons — parse and return schedule
           - /api/brief — run or return cached morning brief output
           SSE (Server-Sent Events) for streaming agent responses back to terminal
SSH:       node-ssh package for host machine project queries
Hosting:   port 3200 on agent-vm
```

**Why React + shadcn:** You already use this stack in ExecuDeck. No context switching, no new component patterns to learn. shadcn's card primitives map perfectly to the canvas concept. You'll recognize the patterns.

### Build Time

| Phase | MVP | Polished |
|-------|-----|---------|
| Command terminal + agent routing | 4h | 10h |
| Canvas + drag-drop cards | 3h | 8h |
| Vault health card | 2h | 4h |
| Project portfolio (SSH) | 3h | 6h |
| Morning brief card | 2h | 3h |
| Active tasks + desk pitches | 2h | 5h |
| **Total** | **~16h** | **~36h** |

MVP skips drag-drop (fixed layout instead) and SSH project queries (just hardcoded paths). Still fully useful.

### Why Trajan Would Love It

You built ExecuDeck. This is ExecuDeck for your own infrastructure. The dual-pane split matches how you already think — intention on the left, outcome on the right. The slash commands mean you never have to SSH into agent-vm to trigger something; you just type `/run vault-sync` and watch it happen. The morning brief card means your existing scripts aren't manual anymore — they're surfaced. And because it's React + shadcn, the code will *feel* like code you wrote. You can extend it without fighting an unfamiliar framework.

---

## Concept 3: "Nerve Center" — Dense Terminal Intelligence

> *htop if htop had opinions about your AI agents. Every pixel earns its place.*

### Wireframe

```
NERVE CENTER v1.0 | agent-vm | 192.168.122.10 | Mon 2026-03-16 23:47:22 UTC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1:AGENTS] [2:CRONS] [3:VAULT] [4:PROJECTS] [5:DISCORD] [6:LOGS]   q:quit ?:help
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ AGENTS ──────────────────────────────────────────────────────┐ ┌─ SYSTEM ────┐
│ NAME            STATUS   TASK                       LAST ACT  │ │ CPU   12.4% │
│ ─────────────── ──────── ────────────────────────── ───────── │ │ ▓▓▒░░░░░░░  │
│ right-hand      ● ACTIVE  routing discord task       0:00:03  │ │ RAM   38.1% │
│ architect       ● ACTIVE  analyzing execudeck repo   0:00:07  │ │ ▓▓▓▓░░░░░░  │
│ archivist       ◎ IDLE    —                           0:04:12  │ │ DSK   46.8% │
│ dev-lead        ◎ IDLE    —                           0:11:30  │ │ ▓▓▓▓▓░░░░░  │
│ researcher      ◎ IDLE    —                           0:22:05  │ │ LOAD 0.4    │
│ prompt-eng      ◎ IDLE    —                           0:45:17  │ │             │
│ executor        ◎ IDLE    —                           1:02:44  │ │ PACE 3.2/5h │
│ strategist      ◎ IDLE    —                           1:15:00  │ │ ▓▓▓▓▓▓▒░░░  │
│ analyst         ◎ IDLE    —                           2:03:11  │ │ WK  41/70h  │
│ curator         ◎ IDLE    —                           3:44:22  │ │ ▓▓▓▓▓▓░░░░  │
│ ops-agent       ◎ IDLE    —                           4:01:09  │ └─────────────┘
│ watcher         ◎ IDLE    —                           6:18:55  │ ┌─ TOPOLOGY ──┐
│ ─────────────── ──────── ────────────────────────── ───────── │ │  [discord]  │
│ 12 agents: 2 active · 10 idle · 0 error                       │ │      │      │
│ [enter:detail] [s:spawn] [k:kill] [f:filter]                  │ │ [right-hand]│
└───────────────────────────────────────────────────────────────┘ │  ╱   │   ╲  │
┌─ CRON NEXT RUNS ──────────────────────────────────────────────┐ │[arch][res][e]│
│ JOB                   NEXT RUN    LAST     RESULT  STREAK     │ │      │      │
│ ────────────────────  ──────────  ───────  ──────  ─────────  │ │ [gateway]   │
│ agent-health          in 12m      23:35    ✓ ok    ✓✓✓✓✓✓    │ │  :18789     │
│ vault-sync            in 1h 42m   22:00    ✓ ok    ✓✓✓✓✓✓    │ └─────────────┘
│ morning-briefing      in 6h 13m   06:00    ✓ ok    ✓✓✓✓✓✓    │
│ discord-digest        in 8h 01m   08:00    ✓ ok    ✓✓✓✓✓✓    │
│ project-scan          in 3h 12m   03:00    ✓ ok    ✓✓✓✓✓✓    │
│ exec-report           in 22h      01:00    ✓ ok    ✓✓✓✓✓✓    │
│ [+14 more — press 2 for full view]                            │
└───────────────────────────────────────────────────────────────┘
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[23:47:22] right-hand: received task · spawning architect · posting to #projects
[23:47:19] vault-sync: complete · 12 files updated · 0 conflicts
[23:47:15] agent-health: ping ok · all 12 agents reachable
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Tab 2 — CRONS view:**
```
NERVE CENTER | CRON JOBS (20)                                   [1-6] tabs | q:quit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JOB                  SCHEDULE     NEXT       LAST DURATION  LAST EXIT  RUNS
──────────────────── ──────────── ─────────  ────────────── ─────────  ────
morning-briefing     0 6 * * *    06:00      8.4s           0          847
vault-sync           0 */2 * * *  02:00      1.2s           0          4231
agent-health         */30 * * * * 23:30      0.3s           0          21098
discord-digest       0 8 * * *    08:00      3.1s           0          312
project-scan         0 3 * * *    03:00      12.7s          0          156
exec-report          0 1 * * *    01:00      45.2s          0          421
... (14 more)

[r:run now] [e:edit schedule] [d:disable] [h:history] [enter:last output]
```

**Agent detail (enter key on agent row):**
```
┌─ AGENT: right-hand ────────────────────────────────────────────────────────────┐
│ Status: ACTIVE · PID: 47291 · Session: agent:main:discord:channel:148295...    │
│ Model: anthropic/claude-sonnet-4-6 · Uptime: 14d 6h                            │
│ Skills: discord(38) · reasoning: adaptive · channel: discord                   │
│                                                                                 │
│ CURRENT TASK                                                                    │
│ Received discord message from channel #projects at 23:47:01                    │
│ → spawned architect subagent (session: ...1fc0)                                 │
│ → waiting for response, will post to #projects                                  │
│                                                                                 │
│ RECENT ACTIONS (last 10)                                                        │
│  23:47:01  recv discord #projects                                               │
│  23:46:33  sent response to #general                                            │
│  23:44:11  spawned researcher (vault query)                                     │
│  23:43:55  recv discord #general                                                │
│  ...                                                                            │
│                                                                                 │
│ [l:full log] [k:send signal] [esc:back]                                         │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Key Features

**What makes it unique:** Zero decoration. Every character on screen is information. It respects your intelligence — no tooltips explaining obvious things, no empty states with illustrations, no loading spinners. It's always on, always dense, always true.

- **Tab Navigation**: 6 tabs, number keys to switch instantly. No mouse required. Every action has a keyboard shortcut shown at the bottom of the relevant pane.
- **Streak Column**: The `✓✓✓✓✓✓` column in cron view shows last 6 runs at a glance. Pattern recognition beats reading numbers.
- **Topology Diagram**: ASCII box-and-line diagram showing agent hierarchy. Not decorative — updates live as agents spawn subagents. You see the call graph.
- **Compact Metrics**: No charts, just bars made of block characters (▓▒░). Renders perfectly in any terminal or monospace browser font. Updates every 5 seconds.
- **Usage Pace Inline**: `PACE 3.2/5h` — one line, all context. The bar underneath shows where you are in the window. Weekly pace below it.
- **Log Strip**: Bottom 3 lines are the most recent significant events (not every debug log — filtered to agent actions, cron completions, errors). Always visible regardless of which tab you're on.
- **Filter Mode**: Press `f` in agents view to enter filter — type a substring, table narrows. Press Esc to clear. Useful when you have 12+ agents.
- **Run Now**: In cron view, `r` fires the selected job immediately. Output streams to a popup overlay (like `less`). Press `q` to dismiss.

### Technical Stack

**Option A (Recommended) — Pure HTML/CSS/JS, no framework:**
```
Single index.html file (~800 lines)
CSS:  CSS variables for theming, CSS Grid for layout, monospace everywhere
JS:   Vanilla JS, setInterval polling, EventSource for SSE log stream
Backend: Minimal Express server (150 lines)
         - GET /api/state — full state snapshot (agents, crons, metrics)
         - GET /api/logs  — SSE stream of recent events
         - POST /api/cron/:job/run — trigger a cron job
         - GET /api/agent/:name — detail view data
No bundler, no build step. Just node server.js.
```

**Option B — Python Textual TUI:**
```
textual>=0.50.0
Layout: DataTable for agents/crons, Static widgets for metrics
Live:   textual's built-in reactive updates via Workers
Access: Run in terminal on agent-vm (ssh + textual app)
Benefit: No browser needed, works over any SSH session
Cost: Can't embed in web workflow, less shareable
```

**Recommendation: Option A.** Browser-based means you can access it from your host machine without SSHing first. The no-build-step approach means it starts as a single file and you can hack on it while it's running.

### Build Time

| Phase | MVP | Polished |
|-------|-----|---------|
| HTML/CSS layout + tab switching | 2h | 4h |
| Backend API (agents, crons, metrics) | 3h | 5h |
| Agents table + detail overlay | 2h | 4h |
| Cron table + run-now | 2h | 4h |
| System metrics bars | 1h | 2h |
| Topology ASCII diagram | 2h | 5h |
| Log strip + SSE | 2h | 3h |
| Keyboard shortcuts + filter mode | 1h | 3h |
| **Total** | **~15h** | **~30h** |

MVP skips: topology diagram, filter mode, detail overlays. Still shows everything in the main table views.

### Why Trajan Would Love It

You built `htop`-style scripts (agent-dashboard.sh, agent-status.sh) because you want raw truth, not pretty lies. This is that, but in a browser. The keyboard-first design matches how you actually work — you're not reaching for a mouse to click "refresh." The streak column gives you cron reliability at a glance in a way no chart can. And the no-build-step philosophy means it's always hackable: you see a gap, you open the file, you add a line. No `npm run build`, no webpack config, no fighting a framework. It runs with `node server.js`. That's it.

---

## Comparison Matrix

| | Mission Control | Executive Deck | Nerve Center |
|---|---|---|---|
| **Primary use** | Monitoring | Commanding | Quick-check |
| **Best for** | "Is everything OK?" | "Do a thing, see result" | "What's the number?" |
| **Tech complexity** | Medium-High | High | Low |
| **Build time (MVP)** | ~15h | ~16h | ~15h |
| **Framework** | SvelteKit | React/shadcn | Vanilla JS |
| **Mouse required?** | Yes | Yes | No |
| **Always-on value?** | High | Medium | Very High |
| **Extensibility** | Medium | High | Very High |
| **Wow factor** | High | Very High | Medium |

## Recommendation

**If you want one dashboard:** Build **Nerve Center** first (fastest, most information-dense, no framework lock-in), then layer in Mission Control's live WebSocket data feed. The two concepts compose naturally — Nerve Center's backend API is a subset of what Mission Control needs.

**If you want to impress:** Build **Executive Deck**. It's the one that would make someone say "what is that?" It's also the most aligned with your existing ExecuDeck work — you might be able to share components.

**Fastest path to value:** Nerve Center's MVP is 15h and replaces your manual agent-status.sh + agent-dashboard.sh workflow entirely on day one.

---
*Written by prompt-engineer subagent · 2026-03-16*

## Related

- [[harvest-2026-03-17-0000]]

## Related
- [[dashboard-design-critique-v2]] — Devil's Advocate critique
- [[Active Projects Summary]] — project tracking
