---
date: 2026-03-25T00:00:00.000Z
tags:
  - project
  - vision
  - place-org
  - openclaw
  - ai
  - os
  - future-frontend
status: concept
type: project
wiki_id: projects/place_org-openclaw-vision
imported_from: vault/Projects/place.org-openclaw-vision.md
imported_at: '2026-04-04T00:23:56.903Z'
summary: ''
---

# place.org × OpenClaw — Future Frontend Vision

> The next evolution of place.org: a browser desktop OS that extends beyond the browser tab, meshes with native systems, and treats AI agents as first-class operating system citizens.

---

## Where We Are Now

### What's Built (v0.1–v0.5)

place.org is a virtual desktop OS running in the browser. 167 source files, 92 components, 13 Zustand stores, 503 passing tests.

**Desktop shell:** Window manager (react-rnd), dock with magnification, ambient context bar (time/weather/inbox/streaks/focus), boot sequence, command palette (Cmd+K), desktop icons with snap-to-grid, right-click context menus, keyboard shortcuts.

**Apps:** Brain Dump (GTD inbox with kanban + voice capture), Journal (sectioned daily template + markdown), Focus Timer (soft-boundary FlexiFocus with PiP + Wake Lock + soundscapes), Tasks (Must/Should/Could matrix + kanban), Habits (streak grid + heat map), Review (GTD weekly Collect→Reflect→Plan wizard), Dashboard (ONE Thing + goal cascade), Calendar, Notes, Flux (activity timeline), Time Blocker (day/week views + actual vs planned), Terminal (unix filesystem metaphor), Music Player, Calculator, Clock, Settings, Finder.

**Immersive breakouts:** /portfolio (13-variant configurable canvas with real cascade juggling physics, Matter.js, draggable elements), /about, /cool-stuff, /community, /services, /oldplace/*.

**Design language:** Deep space cockpit that breathes. #060610 void base, cool blue accents, 4-tier frosted glass system, time-of-day color breathing via CSS `@property`, cursor bioluminescence, idle aurora screensaver, Web Audio synthesized sounds.

**Data:** SQLite WASM + OPFS (local-first, browser-only). Event bus with BroadcastChannel cross-window sync. No server dependency for core functionality.

### What's Designed But Not Built

**Companion App** (Tauri v2) — System tray daemon with WebSocket server that spawns transparent frameless native windows. Drag a virtual window past the browser edge → it becomes a real native window on your desktop. Full spec written, protocol defined (WS on ports 27182-27189), cross-platform transparency research done. macOS has an open Tauri bug (#13415) for post-bundle transparency.

**Settings Overhaul** — 27 pages, 142 settings, 17+ themes (10 community + 7 mood), dual-color system, glass controls, per-app config, wallpaper upload, live preview. Full spec and implementation plan ready.

**Virtual Filesystem** — SQLite-backed file storage, Photos/Documents apps, desktop file icons, Finder integration, clipboard, versioning, Pipes automation. 5-phase plan ready.

**Portfolio v3** — 13 variants across Light/Dark/Experimental groups, 9 zone types, every element draggable, variant nav pill, URL param persistence. Orchestration sheet done.

### Research Completed (11 Deep-Dive Documents)

| Research | Key Findings |
|----------|-------------|
| **Experimental UI Inspiration** | Poolsuite OS metaphor, DaedalOS window manager architecture, bruno-simon vehicle-controlled 3D nav, samsy.ninja WebGPU portfolio at 120fps |
| **WebGPU Visual Effects** | TSL Compute GPU Particle Nebula recommended. 750k particles proven. Auto-fallback WebGL 2. R3F integration pattern exists. |
| **Transparent Native Windows** | Tauri v2 wins (3-15MB vs Electron's 80-120MB). True transparency confirmed Windows+Linux. macOS needs wry 0.55+ fix. |
| **Web Animation Techniques** | View Transitions (baseline 2025), Scroll-Driven CSS (baseline 2026), CSS @property (baseline), Motion v12 WAAPI+Spring hybrid, GSAP now free (all plugins) |
| **PWA Capabilities** | Window Controls Overlay (highest impact — ambient bar fills title bar), App Shortcuts (right-click dock), File Handling, Badging API, Screen Wake Lock |
| **Browser OS Implementations** | DaedalOS process model, Puter cloud OS, OS.js server architecture. Windowed state pattern: `{ Component, hasWindow, icon, title, position, size, zIndex }` |
| **Local-First Sync** | REST LWW recommended when ready for cross-device. CRDT overkill for single-user. |

---

## The Vision: place.org × OpenClaw

### What Changes

place.org today is a self-contained browser app. Beautiful, functional, local-first. But it lives in a tab. It can't talk to your system. It can't run agents. It can't orchestrate work across projects.

The fork extends place.org along three axes:

1. **Beyond the browser tab** — Companion app evolves from transparent popouts to a full native mesh. The browser is one surface; the desktop is another; they're the same OS.

2. **Agent-native** — OpenClaw becomes the operating system's nervous system. Every app can dispatch agents. Every workflow can be automated. Agent status is ambient, not hidden in a terminal.

3. **Multi-surface** — Same architecture renders as browser desktop, installed PWA, native companion, or eventually spatial/visionOS. One OS, many form factors.

---

## Axis 1: The Mesh — Beyond the Browser Tab

### The Companion Evolution

The current companion spec is about transparent popouts. That's phase 1. The mesh vision is bigger:

**Phase 1: Transparent Popouts (designed)**
- Drag virtual window past browser edge → native transparent window
- WebSocket bridge (27182-27189)
- System tray daemon, auto-reconnect
- Fallback: browser `window.open()`

**Phase 2: Persistent Desktop Presence**
- Companion runs at boot (autostart configured in spec)
- Ambient bar as a **native menu bar widget** — always visible even when browser is closed
- Focus Timer persists as a native floating widget
- Clock/music player as desktop widgets
- Quick Brain Dump capture from system tray (right-click → "Capture thought")
- Notification bridge: companion forwards Web Notifications to native OS notifications with actions

**Phase 3: Native Integration**
- File drop: drag files FROM your OS desktop TO place.org windows (via companion WebSocket)
- Clipboard bridge: copy in a virtual window, paste in a native app
- Spotlight/Alfred integration: Cmd+Space → "place: brain dump" opens capture anywhere
- Calendar sync: native calendar events appear in place.org's Calendar app
- Global hotkeys: Cmd+Shift+B for Brain Dump, Cmd+Shift+F for Focus — even when browser isn't focused

**Phase 4: The Full Mesh**
- The companion IS the OS layer. Browser tab is optional.
- Open place.org without a browser — companion launches a webview desktop
- Multiple "spaces" — work space, personal space, focus space — each with different app layouts
- Cross-device: companion on laptop + companion on phone + browser on work machine = one OS session
- WebRTC for real-time state sync between surfaces

### The PWA Bridge

Before the companion even matters, PWA capabilities close half the gap:

| Capability | What It Does for place.org | Status |
|---|---|---|
| **Window Controls Overlay** | Ambient bar fills the title bar. App looks native. Highest visual impact. | Ready to implement |
| **App Shortcuts** | Right-click PWA icon → "Brain Dump" / "Focus Mode" / "Journal" | Ready |
| **File Handling** | Double-click a .md file → opens in place.org Notes | Ready |
| **Badging API** | PWA icon shows inbox count | Ready |
| **Share Target** | Share from any app → lands in Brain Dump | Ready |
| **Screen Wake Lock** | Focus sessions keep screen on | Already built |
| **Document PiP** | Focus Timer as always-on-top mini window | Already built |
| **Background Sync** | When sync lands, queue changes while offline | Future |

**The strategy:** PWA first (zero install), companion for power users (one install). Both use the same web codebase. The companion just unlocks transparency + native hooks.

---

## Axis 2: Agent-Native OS — The OpenClaw Control UI Mesh

### What Already Exists: The OpenClaw Control UI

This isn't hypothetical. We already built a production frontend for OpenClaw. It's at `~/openclaw-control-ui-source/` — **~40K lines of TypeScript + ~10K lines CSS**, 228 files, extracted from the OpenClaw gateway repo.

**Stack:** Lit (Web Components) + Vite, plain CSS with custom properties, no React.

**What it has RIGHT NOW:**
- **Chat view** (1,489 lines) — Full conversational UI with streaming, markdown rendering, tool call cards with collapsible output, grouped messages, slash commands, input history, message search, export, TTS, attachments, pinned messages
- **Overview dashboard** — Gateway health cards, uptime, auth mode, attention items, event log, log tail, cron status
- **Agent management** — Agent list, per-agent overview panels, workspace file browser, tool/skill status per agent
- **Session management** — Session list with sort/filter/pagination, session patching, reset, delete
- **Config form** — Schema-driven configuration editor + raw JSON editor (renders any config shape automatically)
- **Cron management** — CRUD cron jobs, schedule form, run history, filters
- **Channel management** — Status for Discord/Telegram/WhatsApp/Signal/Slack/iMessage/Nostr, including WhatsApp QR login flow
- **Usage analytics** — Token/cost tracking with charts, per-session breakdown
- **Skill management** — Skill grid with enable/disable toggles, API key management
- **Node management** — Node listing, device pairing (approve/reject/rotate/revoke), exec approval allowlists
- **Live logs** — Real-time log viewer tailing the gateway
- **Debug panel** — Raw RPC console, health/status endpoints, model catalog

**Gateway protocol:** JSON frames over WebSocket with challenge-response auth (ECDSA P-256), device identity caching, auto-reconnect with backoff. The protocol is `{ type: "req", id, method, params }` → `{ type: "res", id, ok, payload }` with server-push events.

**Controllers** (stateless mutation modules): chat, config, cron, agents, sessions, channels, skills, nodes, devices, exec-approvals, logs, debug, presence, usage, agent-files, agent-identity, agent-skills, assistant-identity, health, models.

### The Mesh: Control UI → place.org

The OpenClaw Control UI is the agent management layer. place.org is the desktop OS. They're two halves of the same thing. The mesh combines them:

```
┌─────────────────────────────────────────────────────────┐
│  place.org × OpenClaw (Browser Desktop OS)               │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────────────┐  │
│  │ place.org Apps   │  │ OpenClaw Control UI Apps     │  │
│  │ (productivity)   │  │ (agent management)           │  │
│  │                  │  │                              │  │
│  │ Brain Dump       │  │ Agent Chat (from chat.ts)    │  │
│  │ Journal          │  │ Agent Monitor (from agents/) │  │
│  │ Tasks            │  │ Dispatch Panel (from         │  │
│  │ Focus Timer      │  │   sessions/ + overview/)     │  │
│  │ Dashboard        │  │ Config Editor (from config/) │  │
│  │ Terminal         │  │ Cron Manager (from cron/)    │  │
│  │ Flux             │  │ Usage Analytics (from usage/)│  │
│  │ ...12+ more      │  │ Channel Status (channels/)   │  │
│  └──────────────────┘  └──────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Shared: Event Bus + OpenClaw Gateway Bridge      │    │
│  │ (gateway.ts WS client already built — port it)   │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Window Manager + Dock + Ambient Bar              │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
         │ WebSocket (gateway.ts protocol, already built)
         ▼
┌─────────────────────────────────────────────────────────┐
│  OpenClaw Gateway (agent-vm:18789)                       │
│  Sessions · Agents · Memory · Tools · Channels           │
└─────────────────────────────────────────────────────────┘
```

### What We Port vs What We Build New

The Control UI is Lit (Web Components). place.org is React/Next.js. We don't drop in the Lit components — we port the **logic layer** (controllers, gateway client, protocol types) and rebuild the render layer in React with place.org's glass-morphic design system.

| Control UI Module | What We Take | What Changes |
|---|---|---|
| `gateway.ts` (492 lines) | WS client, auth flow, event routing, reconnect | Wrap in React hook: `useGateway()` |
| `controllers/*.ts` (20 modules) | All state mutation logic | Wrap in Zustand stores |
| `chat/*.ts` (14 modules) | Message normalization, tool cards, streaming, slash commands | Re-render in React + place.org glass UI |
| `views/overview.ts` | Dashboard data shape, attention items, health cards | Re-render as place.org Dashboard widgets |
| `views/agents.ts` | Agent list, panels, file browser | Re-render as Agent Monitor app |
| `views/sessions.ts` | Session list, filters, pagination | Re-render as part of Agent Monitor |
| `views/config.ts` | Schema-driven form renderer | Re-render as Settings app extension |
| `views/cron.ts` | Cron CRUD, schedule form | Re-render as Cron Manager app or Pipe Builder input |
| `views/usage.ts` | Token/cost analytics, charts | Re-render as Dashboard widget or standalone app |
| `views/channels.ts` | Channel status, QR login | Re-render as Channels app |
| `protocol/` | Type definitions | Direct import (shared types) |

**The key insight: ~70% of the hard work is done.** The gateway protocol, auth flow, real-time event handling, state management patterns, chat streaming, tool call rendering — all of that exists. We're re-skinning it into a desktop OS, not building from scratch.

### New Agent-Native Apps (powered by Control UI logic)

**Agent Monitor** — Live dashboard of all running agent sessions. Each agent is a card: name, status (working/idle/blocked), current task summary, token usage, runtime. Cards animate in/out as sessions start/end. Click to expand full output stream. This is `sessions_list` and `sessions_history` rendered spatially.

**Agent Chat** — Conversational window to any agent. Pick from roster (Right Hand, Coder, Researcher, etc.) or spawn ad-hoc. Persistent history via OpenClaw sessions. Multiple chat windows open simultaneously — one per agent. This is what a "bigger IDE" actually looks like for agent interaction.

**Dispatch Panel** — Visual task dispatch. Write a task description, pick an agent (or let the system route), set priority, watch it execute. Task cards flow through: Queued → Running → Reviewing → Done. This is the spatial equivalent of `sessions_spawn` — you can see the work, not just send it into the void.

**Pipe Builder** — Visual workflow editor. Connect triggers (time, event, webhook) to actions (agent dispatch, file operation, notification). Drag connections between nodes. This is OpenClaw's cron/pipe system made visual and interactive.

### Agent-Enhanced Existing Apps

| App | Enhancement |
|---|---|
| **Brain Dump** | "Route to agent" action on any item. Capture a thought → one click → agent processes it (research, create task, draft response, file in vault) |
| **Tasks** | Agent-assignable. Tag a task with 🤖 → it dispatches to Coder/Researcher/Ops. Progress updates flow back to the task card. |
| **Terminal** | `agent spawn coder "fix the build"` command. Agent output streams into the terminal in real-time. `agent list`, `agent status`, `agent kill`. |
| **Dashboard** | Agent status widgets. Active sessions count, daily completions, system health. THE ONE THING can be agent-assisted: "What should I focus on?" analyzes tasks/calendar/energy. |
| **Journal** | Auto-populated "Agent Activity" section — what agents did today, pulled from OpenClaw daily logs. |
| **Focus Timer** | "Agent mode" — when a focus session starts, dispatch queued background tasks to agents. When the session ends, present a summary of what they accomplished while you were focused. |
| **Ambient Bar** | Shows: 🤖 3 agents running · ⚡ 12 tasks completed today · 🧠 Right Hand listening |
| **Flux** | Agent events appear in the activity timeline alongside human events. Full audit trail of what happened when. |

### The Key Insight: We Already Built Both Halves

Theo's video asks: "What does it mean to have multiple projects at the same time and a UI that makes it easy to hop between them?" He points out that no current tool handles the actual shape of how we work: multiple projects, agents running, browser research, terminal sessions, status monitoring — all at once.

**We have the desktop OS** (place.org) — windows, dock, ambient bar, spatial arrangement, 20+ apps.
**We have the agent management layer** (OpenClaw Control UI) — chat, sessions, agents, config, crons, usage, channels, logs, debug.
**We have the agent backend** (OpenClaw gateway) — multi-agent orchestration, memory, tools, real-time WebSocket protocol.

These are three pieces that nobody else has together. Cursor has an editor + one agent. T3 Code has a rethought editor + terminal. Claude Code has a CLI + powerful agent. Nobody has **an OS + a full management UI + a multi-agent backend** that were all designed to work together.

The gap Theo identifies — agents work great in isolation but the tools don't compose — is exactly what the OS metaphor solves. An OS composes everything. Agents run as processes. Their output appears in windows. Their status shows in the system bar. You arrange them spatially. You alt-tab between them. The metaphor is native.

### What Theo's "Bigger IDE" Actually Looks Like (We Built It)

| What Theo Wants | What We Have |
|---|---|
| "Multiple projects at the same time" | place.org windowed desktop — each project is a window group |
| "Better relationship with terminals" | Terminal app (built) + agent spawning from terminal |
| "Better relationship with agents" | Agent Chat + Agent Monitor + Dispatch Panel (Control UI logic exists) |
| "Better relationship with browsers" | Browser Pane app (planned) + agent browser control (OpenClaw tool exists) |
| "A UI that makes it easy to hop between them" | Window manager with Cmd+Tab, dock, command palette |
| "Everything in one app" | That's literally what a desktop OS is |
| "Not just the CLI" | Control UI is the spatial layer on top of the CLI agent backend |

The reason nobody has built this yet: you need three things that don't usually exist together — a desktop environment, an agent orchestration layer, and the glue between them. We have all three.

---

## Axis 3: Multi-Surface Architecture

### The Rendering Abstraction

place.org's architecture already separates concerns cleanly:

```
Data Layer:     SQLite WASM + OPFS (stores) ──→ Future: SQLite + REST sync
Logic Layer:    Zustand stores + Event Bus   ──→ Same everywhere
App Layer:      React components (apps/)     ──→ Same everywhere  
Shell Layer:    Window Manager + Dock + Bar  ──→ DIFFERENT PER SURFACE
Render Layer:   Next.js + CSS                ──→ DIFFERENT PER SURFACE
```

The shell and render layers are the only things that change between surfaces:

| Surface | Shell | Render | Status |
|---|---|---|---|
| **Browser Desktop** | Window manager + dock + ambient bar | Next.js SSR + CSS glass | ✅ Built |
| **Installed PWA** | Same + Window Controls Overlay | Same + native title bar | 🔧 Ready to implement |
| **Mobile** | Vertical launcher (stacked cards, swipe) | Same components, responsive | 📋 Designed in spec |
| **Companion Native** | Transparent popout windows | Same components, transparent CSS | 📋 Designed, protocol ready |
| **Full Native** | Companion IS the desktop (no browser) | Webview + native hooks | 🔮 Phase 4 vision |
| **Spatial / visionOS** | Floating panels in 3D space | WebXR or native Swift shell | 🔮 Future |

The investment in the data/logic/app layers carries forward to every surface. Build once, render anywhere.

### visionOS / Spatial Computing Path

The deep space cockpit aesthetic was chosen deliberately — it already feels like a spatial environment. The time-of-day breathing, the glass surfaces, the floating windows — it's a 2D spatial interface waiting to become 3D.

The spatial version:
- Agent windows as floating panels you can walk around
- Terminal as a spatial command surface (think: minority report but actually functional)
- Multiple workspaces as rooms you physically move between
- Voice-first interaction (OpenClaw already has TTS + voice channels)
- Hand gesture dispatch (grab a task, flick it to an agent)
- The WebGPU particle nebula becomes the literal environment you work inside

The architecture is ready. The 3D render layer is the only new piece — and Three.js/R3F (already researched for the portfolio) is the bridge.

---

## The Product Spectrum

One codebase. Multiple products. Each is the same OS with different defaults:

| Product | Target | Default Apps | Agent Backend |
|---|---|---|---|
| **place.org** | Trajan | All productivity + portfolio | OpenClaw (personal) |
| **place.org Pro** | Developers/builders | + Agent Monitor, Dispatch, Code Editor, Project Explorer | OpenClaw (self-hosted) |
| **place.org for Business** | Clients (Craig, etc.) | CRM Dashboard, Guest Concierge, Lead Pipeline, Financials, Daily Briefing | OpenClaw (managed) |
| **place.org Lite** | Public visitors | Portfolio + cool-stuff + about (read-only, no apps) | None |

Craig's Wilson Premier platform becomes: place.org for Business where his 14 agents are apps on HIS desktop. Guest Concierge is a chat window. Lead Pipeline is a kanban. Daily Briefing is a dashboard widget. The morning briefing agent populates HIS ambient bar.

---

## Implementation Phases

### Phase 0: Fork & Foundation
- Create `place-openclaw` repo (fork of place.org)
- Add OpenClaw WebSocket client bridge (`src/lib/openclaw-bridge.ts`)
- Gateway handshake: authenticate, subscribe to events
- Bridge event bus: OpenClaw agent events ↔ place.org event bus
- Agent status in ambient bar (count of active sessions)

### Phase 1: Agent Awareness
- Agent Monitor app (session list → cards → expand to full output)
- Agent Chat app (conversational window, agent picker, persistent history)
- Terminal agent commands (`agent spawn/list/status/kill`)
- Brain Dump "route to agent" action
- Dashboard agent widgets

### Phase 2: Native Mesh (Companion v1)
- Build companion app (Tauri v2, system tray, WS server)
- Transparent popouts working on Windows + Linux
- Focus Timer as native floating widget
- Quick capture from system tray
- Notification bridge

### Phase 3: Deep Integration
- Dispatch Panel (visual task dispatch)
- Task agent assignment
- Focus Timer agent mode
- Flux agent events
- Journal auto-populated agent activity
- Pipe Builder (visual workflow editor)

### Phase 4: Multi-Surface
- PWA enhancements (WCO, shortcuts, file handling, badging)
- Mobile launcher mode
- Companion Phase 2 (persistent desktop presence, global hotkeys)
- Cross-device sync (REST LWW or WebRTC)

### Phase 5: Spatial
- WebGPU particle nebula background (research done)
- 3D portfolio variant (samsy.ninja-style, R3F + WebGPU)
- WebXR prototype of windowed workspace
- Voice-first interaction layer

---

## Why This Matters

Everyone building "the next IDE" is adding a chat sidebar to a text editor. That's thinking inside the box the box came in.

place.org is already the answer to the question Karpathy and Theo are asking. It's a desktop OS. It has windows, a dock, a terminal, a file system, ambient context, spatial arrangement. It already handles the "multiple things at once" problem that every IDE struggles with — because that's what operating systems DO.

The fork just connects it to the brain (OpenClaw) and extends it past the browser boundary (companion mesh). The architecture is built. The research is done. The specs are written. What remains is connecting the pieces.

---

## Source Documents

### OpenClaw Control UI Source (~/openclaw-control-ui-source/)
- `ARCHITECTURE.md` — Full architecture map (this file documents everything)
- `src/ui/gateway.ts` — WebSocket client (492 lines, auth, reconnect, event routing)
- `src/ui/controllers/` — 20 stateless controller modules (chat, config, agents, sessions, etc.)
- `src/ui/views/` — 60+ view modules (chat 1,489 lines, config 1,118 lines, etc.)
- `src/ui/chat/` — 14-module chat subsystem (tool cards, streaming, slash commands, etc.)
- `src/styles/` — 10K lines CSS (components, layout, mobile, chat, config)
- `gateway-backend/` — Full gateway server source (~50K lines, for protocol reference)

### On Host Machine (~/Desktop/place.org/)
- `docs/superpowers/specs/2026-03-20-place-org-design.md` — Full 22-section design specification
- `docs/superpowers/specs/2026-03-24-companion-app-design.md` — Companion app protocol & architecture
- `docs/superpowers/specs/2026-03-23-portfolio-scroll-design.md` — Portfolio scroll creative spec
- `docs/superpowers/specs/2026-03-25-settings-overhaul-design.md` — 142-setting overhaul
- `docs/superpowers/plans/2026-03-25-virtual-filesystem.md` — Virtual FS implementation plan
- `docs/architecture/companion-integration.md` — Companion integration architecture
- `docs/architecture/overview.md` — Core architecture overview

### In Obsidian Vault (~/Documents/obsidian_first_stuff/twj1/)
- `AI Knowledge/Research - place.org Experimental UI Inspiration Deep Dive.md`
- `AI Knowledge/WebGPU Visual Effects for place.org.md`
- `AI Knowledge/Research - Transparent Native Windows for place.org Popouts 2025-2026.md`
- `AI Knowledge/Research - Web Animation Techniques 2025-2026 place.org.md`
- `AI Knowledge/Research - PWA Capabilities Deep Dive place.org.md`
- `Trajan's Projects/place.org.md` — Master project note
- `Session Log/2026-03-20 - place.org v0.1 through v0.5 Build Session.md`

### In Claude Code Memory
- `~/.claude/projects/-home-trajan/memory/project_place_org.md`

### External Reference
- [Theo: "Everything needs to change"](https://youtu.be/QwShVo0zfuk) — The IDE gap that place.org fills
- Karpathy — "We need a bigger IDE"

---

## The Agent OS & Life OS — What We Already Built

### What This Was

Before place.org, we built a complete Agent OS + Life OS as separate web applications. These are the direct ancestors — the prototyping ground where the ideas were proven. Everything in the vision above has precedent in what already shipped.

### Agent OS (~/Projects/agent-os-demo-pages/index.html + ~/Projects/agent-os-bridge/)

A full web UI for managing the AI agent system, with a Bridge Server (Express.js, port 18790) connecting to OpenClaw Gateway, Discord, Obsidian Vault, and the Dispatch system.

**Stack:** Vanilla JavaScript, Catppuccin Mocha theme, zero framework dependencies, WebSocket for live updates, file-based state (JSON/JSONL).

**Pages built:**

| Page | What It Does |
|---|---|
| **Feed/Stream** | Real-time agent activity feed merging Discord messages, dispatch events, proposals, and system alerts into a unified chronological view |
| **Workbench** | Live terminal-style agent activity viewer — monitor what agents are doing in real-time via WebSocket streaming |
| **Command** | Dispatch work directly from the web UI — task creation, agent assignment, priority setting |
| **Inbox** | Actionable items requiring human decisions — pending proposals, agent questions, approval requests |
| **Queue/Tasks** | Dispatch queue management with full lifecycle — create, assign, approve, cancel, retry. Views: queue, active, done, failed |
| **Missions** | Hill chart tracking of long-term goals — each mission has steps, related tasks, velocity metrics, timeline |
| **Mind** | Vault interface — full-text search via QMD, folder browsing, tag cloud, note editing, force-directed graph visualization |
| **Pulse/System** | Infrastructure health dashboard — uptime, CPU/memory/disk, service statuses, cron jobs, systemd timers, logs |
| **Roles** | Agent configuration — 38 agents across 12 departments with capabilities, success rates, routing rules, autonomy sliders |

**Bridge API (90+ endpoints):** Discord channels/messages/threads, vault search/read/write/graph, dispatch queue lifecycle, proposals with approve/reject/dispatch flow, feed/stream events, timeline, agent status, health checks, WebSocket broadcast.

**What it proved:**
- The unified activity feed (Stream) works — seeing all agent activity in one place is transformational vs. scattered Discord channels
- The proposal-to-task pipeline works — agents generate proposals, human approves, system dispatches, tasks flow through stages
- Hill charts work for missions — uncertainty visualization beats percent-complete
- The Bridge pattern works — web UI never talks to OpenClaw directly, bridge normalizes everything
- Keyboard-first navigation works — j/k/Enter for inbox triage

### Life OS (~/Projects/agent-os-demo-pages/life.html)

A complete personal productivity system sharing the same Catppuccin design language, linked from Agent OS via the sidebar.

**Pages built (13 pages, ~4,000 lines):**

| Page | What It Does |
|---|---|
| **Dashboard** | The ONE Thing + daily focus + energy tracker + streaks + quick captures |
| **Tasks** | Eisenhower matrix (Must/Should/Could/Won't) with drag priority |
| **Goals** | OKR-style goal cascade — objectives with measurable key results and progress tracking |
| **Focus** | Pomodoro/FlexiFocus timer with session tracking, ambient sounds, break reminders |
| **Habits** | Streak-based habit tracking with heat maps and identity framing ("You're becoming someone who...") |
| **Journal** | Structured daily journal — gratitude, wins, lessons, intentions, evening reflection |
| **Calendar** | Week view with time blocks, deep work protection, event management |
| **Review** | GTD weekly review wizard — Collect → Reflect → Plan with guided prompts |
| **Daily Briefing** | Morning brief — today's priorities, yesterday's unfinished items, weather, calendar, focus suggestions |
| **Brain Dump** | Zero-friction capture — type and hit enter, system classifies later |
| **Notes** | Quick notes with markdown, linked to vault |
| **Interview** | Full-page embedded interview/chat interface |
| **Rules** | Personal principles and decision frameworks |

### How Agent OS + Life OS Map to place.org

place.org rebuilt BOTH of these as a single desktop OS. The mapping is direct:

| Agent OS / Life OS Page | place.org Equivalent | Status |
|---|---|---|
| Life OS Dashboard | Dashboard app | ✅ Built |
| Life OS Tasks | Tasks app (Must/Should/Could matrix) | ✅ Built |
| Life OS Goals | Dashboard goal cascade + Review app | ✅ Built |
| Life OS Focus | Focus Timer app (FlexiFocus with PiP) | ✅ Built |
| Life OS Habits | Habits app (streak grid + heat map) | ✅ Built |
| Life OS Journal | Journal app (sectioned template) | ✅ Built |
| Life OS Calendar | Calendar app | ✅ Built |
| Life OS Review | Review app (Collect→Reflect→Plan wizard) | ✅ Built |
| Life OS Daily Briefing | Dashboard + Ambient Bar | ✅ Partially built |
| Life OS Brain Dump | Brain Dump app (GTD inbox with kanban) | ✅ Built |
| Life OS Notes | Notes app | ✅ Built |
| Agent OS Feed/Stream | **Flux app** (activity timeline) | ✅ Built (needs OpenClaw integration) |
| Agent OS Workbench | **Terminal app** | ✅ Built (needs agent streaming) |
| Agent OS Command | **Dispatch Panel** (new app) | 📋 Designed in this doc |
| Agent OS Inbox | Brain Dump + notification system | 🔧 Partial |
| Agent OS Queue/Tasks | Tasks app + agent assignment | 📋 Designed in this doc |
| Agent OS Missions | **Missions app** (new — hill chart) | 📋 Needs building |
| Agent OS Mind | **Finder app** + vault integration | ✅ Finder built, vault bridge needed |
| Agent OS Pulse/System | **System Monitor app** | ✅ Built (needs real data) |
| Agent OS Roles | **Agent Monitor** (new app) | 📋 Designed in this doc |

**Key insight:** place.org already has 80% of the Life OS features rebuilt. The Agent OS features are what need porting — and the OpenClaw Control UI provides the gateway protocol and logic layer to do it.

### The Research That Informed Everything

Three deep research documents were produced during the Agent OS build. These should directly inform the place.org × OpenClaw implementation:

**1. Agent OS Speculative UI Deep Dive** (`vault/Research/Agent-OS-Speculative-UI-Deep-Dive.md`)
Three domains analyzed:
- **AI Agent Frameworks** — CrewAI crew metaphor, AutoGen conversation-as-workflow, LangGraph time-travel debugging, Rivet remote debugging, OpenDevin workspace mirroring, Dust agent-as-OS-primitive, Claude Artifacts persistent output, ChatGPT Canvas co-editing, Cursor autonomy slider
- **Speculative UI** — Dynamicland spatial computing, Bret Victor direct manipulation, Ink & Switch local-first/malleable software, Andy Matuschak active knowledge surfacing, Maggie Appleton home-cooked software, Linus Lee composable thunks, Geoffrey Litt malleable software with LLMs, May-Li Khoe spatial interfaces, Amelia Wattenberger confidence visualization, tldraw infinite canvas as OS, Replit prompt-to-product
- **Life OS Philosophy** — GTD universal inbox, PARA actionability gradient, Eisenhower delegate-to-agent quadrant, Bullet Journal migration ritual, Cal Newport deep work protection, OKR goal cascade, Pomodoro agent-aware timer, Atomic Habits identity framing, Stoic daily reflection

**Key patterns to carry forward into place.org:**
- **Autonomy slider** (Karpathy/Cursor): every interaction on a spectrum from "suggest" to "just do it"
- **Conversation-as-workflow** (AutoGen): show agent collaboration as readable threads, not abstract graphs
- **Hill charts** (Basecamp): track understanding, not completion percentage
- **Confidence visualization** (Wattenberger): agent outputs encode certainty visually — bold = high confidence, faded = tentative
- **Active knowledge surfacing** (Matuschak): don't wait for search — ambient display of relevant past context
- **Home-cooked agents** (Appleton): natural language agent creation for personal needs
- **The Record Page** (Salesforce): every entity has header + highlights + related lists + timeline + actions

**2. Agent OS UX Competitive Deep Dive** (`vault/Research/Agent-OS-UX-Competitive-Deep-Dive.md`)
Analyzed Linear, Height, Shortcut, Notion, Plane, Graphite, Raycast, Arc, Obsidian, Retool across 7 questions. Key conclusions:
- **Proposals ≠ Tasks** — separate object types (Plane's model), AI pre-sorts them (Height's model)
- **Pipeline visualization** — horizontal stages, not kanban columns. Like GitHub Actions meets Linear triage.
- **"Your Turn" indicator** (Graphite) — clearly show whose turn it is: human's or agent's
- **Height's "AI as teammate"** — agent actions appear as feed items with avatar, not system events
- **Keyboard-first** (Linear) — every action has a shortcut, Cmd+K opens universal search
- **The briefing metaphor** — system generates proposals, presents as daily brief, human approves

**3. Agent OS Business Software Paradigms** (`vault/Research/Agent-OS-Business-Software-Paradigms.md`)
Applied patterns from SAP, Oracle NetSuite, Odoo, ERPNext, Salesforce, HubSpot, Pipedrive, Attio, Monday.com, Basecamp to agent management:
- **SAP Live Tiles** → Agent tiles showing status, current task, usage at a glance
- **Salesforce Record Page** → Every entity (agent, task, mission) has the same anatomy: header, highlights, related lists, timeline, actions
- **HubSpot Timeline** → Single scrollable activity feed per agent showing everything
- **Odoo Plugin Architecture** → Agent "modules" register their own views. Install Code Agent → get diff viewers. Install Research Agent → get source evaluation panels.
- **ERPNext Universal Record** → Every entity is a "record" with metadata, status workflow, permissions, related records, activity timeline, API access
- **MRP Bill of Materials** → Task decomposition with resource estimates (tokens = raw materials, context window = machine capacity)
- **CRM Relationship Graph** → The links between entities ARE the interface. Click a vault note → see which agent wrote it → see what task → see what mission.

### The Three-Layer Stack

```
┌─────────────────────────────────────────────────────────┐
│  place.org Desktop OS (React/Next.js)                    │
│  Window manager, dock, ambient bar, 20+ apps             │
│  Glass-morphic design, spatial arrangement               │
│  = Life OS + Agent OS unified in one OS metaphor         │
├─────────────────────────────────────────────────────────┤
│  OpenClaw Control UI Logic Layer (ported from Lit)        │
│  Gateway client, 20 controllers, chat subsystem          │
│  Protocol types, auth, real-time events                  │
│  = The bridge between OS and backend                     │
├─────────────────────────────────────────────────────────┤
│  OpenClaw Gateway (Node.js, port 18789)                  │
│  Sessions, agents, memory, tools, channels               │
│  Multi-agent orchestration, dispatch, lifecycle          │
│  = The agent brain                                       │
└─────────────────────────────────────────────────────────┘
```

Agent OS proved the concept. Life OS proved the personal layer. OpenClaw Control UI built the protocol. place.org built the desktop. Now we combine them all.

---

*place.org is already the bigger IDE. The fork makes it the bigger OS.*
