# place.org — Design Specification

> Personal operating system as a website. Desktop workspace + immersive page breakouts. Local-first, no login required, public from day one.

---

## 1. Product Summary

place.org is a hybrid personal website and productivity tool. It presents as a desktop operating system in the browser — draggable windows, a dock, ambient context — where each "app" is both a functional tool and a showcase of what modern browsers can do. Immersive full-page breakouts handle portfolio, about, and community pages with experimental scroll choreography and 3D accents.

The site is public and instantly usable by anyone. No login required. Data lives in SQLite WASM on the user's device. Optional Google OAuth enables cross-device sync.

### Core Identity

- **What it is:** A browser OS that doubles as a personal site and portfolio
- **Who it's for:** Trajan first, public visitors second, other users eventually
- **Aesthetic:** Deep space cockpit that breathes — cool blue, frosted glass, living backgrounds that shift with time of day
- **Philosophy:** The site IS the tool. The tool IS the experience.

---

## 2. Site Architecture

### Route Structure

```
place.org/
├── / (desktop)              Desktop workspace (window manager, dock, ambient bar)
├── /portfolio               Immersive breakout — shipped work, case studies
├── /cool-stuff              Immersive breakout — curated links and experiments
├── /about                   Immersive breakout — personal narrative
├── /community               Immersive breakout — people, orgs, heritage
├── /services                Portal — links to Searx, Commafeed, Hubzilla
├── /oldplace/*              Legacy archive — current site preserved as-is
└── PWA + Service Worker
```

### Two Layout Modes

**Desktop mode** (`/(desktop)` route group): Window manager with dock at bottom, ambient context bar at top. Draggable, resizable, minimizable windows. Dark immersive background with living color mesh.

**Immersive mode** (`/(immersive)` route group): Full-page experiences with scroll choreography, 3D accents, View Transitions. Minimal floating nav overlay. Persistent "back to desktop" affordance (floating pill + Esc key).

### Mode Transition

View Transitions API animates between desktop and immersive. The desktop blurs and slides back while the page content morphs in from the dock icon position. Reverse animation returns to desktop with windows in their previous positions.

### Mobile Adaptation

Desktop becomes a vertical launcher (stacked app cards, tap to expand full screen, swipe back). Immersive pages work natively as scroll experiences. Bottom nav for primary apps. No draggable windows on mobile.

---

## 3. Visual Design Language

### Aesthetic: Deep Space + Living Organism + Clean Cockpit

NOT LetMeScale (cinematic agency, dark reds, Bloomberg). place.org is a calm living space floating in deep blue-black. Clean, minimal, alive.

### Color System

| Token | Value | Usage |
|---|---|---|
| `--bg-deep` | `#060610` | Base background (deep blue-black) |
| `--bg-surface` | `#0a0e1a` | Window/card backgrounds |
| `--bg-glass` | `rgba(80,130,220,0.06)` | Frosted glass overlay |
| `--text-primary` | `#e8eaf0` | Primary text (soft white) |
| `--text-secondary` | `#8088a0` | Secondary/muted text |
| `--accent-blue` | `#5b9cf5` | Primary accent (living — shifts) |
| `--accent-success` | `#38c97a` | Success, growth, streaks |
| `--accent-warm` | `#e8a84c` | Warning, warmth, focus mode |
| `--accent-urgent` | `#ef6b6b` | Urgent only (rare) |
| `--border` | `rgba(100,160,255,0.08)` | Default border |
| `--border-hover` | `rgba(100,160,255,0.18)` | Hover state border |
| `--glow` | `rgba(91,156,245,0.15)` | Focus/hover glow |

### Time-of-Day Color Breathing

Background gradient shifts through the day via CSS `@property` animation keyed to `Date.now()`:
- **Night (12am-5am):** Deepest blue-purple
- **Dawn (5am-7am):** Warm rose hint in gradient
- **Morning (7am-12pm):** Clean cool blue
- **Midday (12pm-2pm):** Clearest, most neutral
- **Afternoon (2pm-5pm):** Slightly warmer blue
- **Sunset (5pm-7pm):** Purple-violet hint
- **Evening (7pm-12am):** Deepening blue-black

All shifts are slow (minutes, not seconds). You don't notice them changing — you feel the time of day.

### Typography

| Role | Font | Weight | Notes |
|---|---|---|---|
| Display | Satoshi (preferred) or General Sans (fallback option) | 300-500 | Light for large text. Weightless feeling. Decision made during implementation. |
| Body | `Inter, system-ui, sans-serif` | 400-500 | Crisp at small sizes. Inter loaded, system-ui fallback. |
| Mono | `'JetBrains Mono', 'Geist Mono', monospace` | 400 | Terminal, data, code. JetBrains preferred, Geist fallback. |

Fluid scaling via `clamp()` across 320px to 1920px+ viewports. Tight letter-spacing on headlines (-0.02em).

### Surface Treatment

- **Windows:** `backdrop-filter: blur(16px)` + 1px border at `--border`. Glass effect.
- **Cards:** Nearly invisible at rest. Borders materialize on hover.
- **Active elements:** Soft blue glow (bioluminescence, not neon).
- **Background:** Slow-moving gradient mesh (3-4 blobs, 60-120 second CSS animation cycles).
- **Noise:** Very subtle film grain overlay via SVG filter.
- **Cursor light:** Radial gradient follows pointer at very low opacity.

### Motion

- **Easing:** `cubic-bezier(0.65, 0.05, 0, 1)` — fast start, smooth land
- **Duration:** 150ms micro-interactions, 300ms transitions, 600ms page changes
- **Spring physics:** Motion library for dock hover, window open/close
- **Ambient motion:** Background mesh + cursor light always present (the site is alive)
- **Idle screensaver:** After 5 min idle, subtle particle drift or aurora effect
- **Reduced motion:** Respects `prefers-reduced-motion`. Ambient effects disabled, functional transitions preserved.

---

## 4. Desktop System Layer

### 4a. Boot Sequence

Server-rendered HTML frame (no JS required for initial paint). Boot text appears character by character in monospace. SQLite WASM initializes in Web Worker. Ambient sound fades in after user gesture. Desktop fades in with data populating.

Returning users: restores last window positions from SQLite. First-time visitors: shorter boot, tour window opens, Brain Dump opens by default. Press any key to skip.

### 4b. Ambient Context Bar (top)

```
☼ place.org  │  Fri Mar 20, 6:42 PM  Denver 48°F  │  🧠 3 inbox  │  ◉ 1h23m  │  🔥 5-day  │  ⚡ 7/10  │  🎯 Ship Focus Timer
```

- Left: place.org branding
- Center: Date, time, weather (Geolocation API + open weather API)
- Right: Live metrics — inbox count, focus time today, habit streak, energy level, THE ONE THING
- Context-aware: Morning greeting + plan, evening summary, Monday shows review reminder
- Clickable: Each metric opens its relevant app window

### 4c. Window Manager

| Feature | Implementation |
|---|---|
| Drag + resize | `react-rnd` (title bar as drag handle) |
| Z-index / focus | Zustand global counter (click → increment → z-index) |
| Minimize | FLIP animation to dock icon position |
| Maximize | Fill viewport minus ambient bar + dock |
| Close | Remove from process state (data persists in SQLite) |
| Snap zones | Drag to edge → highlight half/quarter zone |
| Render isolation | `contain: strict` per window |
| Lazy loading | `next/dynamic` — app code loads on first open |
| State persistence | SQLite `window_state` table |
| Multi-instance | Can open multiple windows of same app (e.g., two journal dates) |

### 4d. Dock (bottom)

Left section: App launchers (open as windows). Right section: Page links (View Transition breakouts). Far right: System tray (settings, sound, notifications, PWA install).

macOS-style magnification on hover (Motion spring physics). Dot indicators under open apps. Pulsing dot for active processes (focus timer running). Badge counts on Brain Dump (inbox) and Tasks (overdue). Right-click context menu via Popover API. Position configurable (bottom/left/right).

### 4e. Desktop Surface

- Animated gradient wallpaper with time-of-day shifts (CSS `@property`)
- Draggable shortcut icons with snap-to-grid
- Cursor radial light effect (low opacity)
- Right-click context menu: "New Brain Dump", "Open Journal", "Change Wallpaper", "Toggle Sound"
- Click + drag selection rectangle on empty space

### 4f. Command Palette (Cmd+K)

Fuzzy search across apps, journal entries, brain dumps, tasks, commands. Recent items when query is empty. Keyboard-first navigation. Actions: open app, create entry, navigate page, run command.

### 4g. Keyboard Shortcuts

**Apps:** Cmd+B (Brain Dump), Cmd+J (Journal), Cmd+F (Focus), Cmd+T (Terminal), Cmd+D (Dashboard)

**Windows:** Esc (minimize active), Cmd+W (close), Cmd+M (maximize), Cmd+` (cycle), Cmd+arrows (snap)

**Navigation:** Cmd+1-9 (nth dock item), Cmd+Enter (quick brain dump), Cmd+. (sound), Cmd+, (settings)

### 4h. Sound Engine

Web Audio API. Ambient pad on boot (after user gesture, shifts with time of day). Subtle click sounds on interactions. Focus mode soundscapes (rain, lo-fi, white noise) with AnalyserNode visualization. Notification chimes. Fully mutable. Per-category controls in Settings.

---

## 5. Desktop App Windows

### 5a. Brain Dump (GTD Inbox)

Fast capture, process later. Single text input + voice mic (Web Speech API). Enter saves to queue with timestamp. Queue is chronological list of unprocessed items. Each item has action buttons: Task, Journal, Archive. Process Mode: full-screen card-by-card presentation for GTD "clarify" step. Number keys for quick-sort. Voice Mode: continuous hands-free capture. Global shortcut Cmd+Enter opens floating mini-capture without full window. 2-minute rule indicator.

### 5b. Journal

Daily template digitized. Section sidebar: Focus, Time Blocks, Notes, Ideas, Gratitude, Reflection, Metrics. Calendar strip navigation. Markdown editor with live preview. Mood/energy tracker (Physical/Mental/Emotional, 1-10 scale). Brain dump items sorted to "Journal" appear in Ideas section. Daily metrics auto-populated from Focus Timer and Tasks. Full-text search via SQLite FTS5. Export as .md files (File System Access API).

### 5c. Focus Timer (FlexiFocus Evolution)

Soft-boundary timer. Notifies at target, never stops. User decides when to transition. Single Transition button ends current block and starts next. Circular SVG progress ring (changes color on overrun). Optional labels (add during or after). Picture-in-Picture API for floating timer. Screen Wake Lock during sessions. Notification API for background alerts. Built-in ambient soundscapes. Analytics panel (daily/weekly charts). Journal integration: "What did you focus on?" prompt at session end.

### 5d. Tasks

Must/Should/Could priority matrix. Categories: Work, Personal, Learning/Growth, Health/Wellness. Quick add with keyboard priority assignment. Optional due dates (overdue surfaces in ambient bar). Goal linking ("This advances: [goal]"). Drag to reorder and between priority groups. Drag to calendar for time-blocking. Incomplete processing: "Why didn't this get done?" prompt at end of day/week. Views: List, Kanban, Calendar.

### 5e. Dashboard

THE ONE THING front and center (largest element). Goal cascade tree: 3-Year Vision → Yearly → Monthly → Weekly, each with progress %. Energy gauge: Physical/Mental/Emotional (1-10). Daily metrics panel. Weekly trend sparklines. Active projects list with status.

### 5f. Review

GTD weekly review: Collect → Reflect → Plan. Phase 1 (Collect): surface unprocessed dumps, incomplete tasks, unreviewed entries. Phase 2 (Reflect): wins, challenges, lessons, incomplete task processing. Phase 3 (Plan): set next week's ONE Thing, priority matrix, day-by-day time blocks. Monthly mode for zoomed-out review. Guided wizard (step-by-step cards, not blank page). Export as markdown compatible with Obsidian vault.

### 5g. Calendar

Day view (time blocks), Week view, Month view. Time blocks from journal's schedule section. Focus sessions auto-populated. Manual event creation with reminders (Notification API). Drag tasks to time slots. Live current-time marker.

### 5h. Habits

5-7 active habits max (must archive to add). Daily habits (checkbox per day). Weekly habits with target and actual (e.g., "Exercise 3x"). GitHub-style streak/contribution grid. Heat map (day-of-week patterns). Auto-tracking for some habits (deep work from Focus Timer). Gentle reminders via Notification API.

### 5i. Terminal

jquery.terminal (no jQuery dependency). Unix filesystem metaphor: ~/inbox/, ~/journal/, ~/focus/, ~/tasks/. Commands: /dump, /focus 25, /journal, /review, /search, /export. Data queries: ls, cat, grep on app data. Navigation: open portfolio, goto /about. Easter eggs: cowsay, fortune, matrix, uptime. Future AI: /ask, /summarize.

### 5j. Settings

Theme controls (accent color, wallpaper, dock position). Sound controls (per-category toggles). Data management (export all as JSON/markdown, import, clear). Account (Google OAuth for sync). PWA install prompt. About (version, credits, /oldplace link).

---

## 6. Immersive Page Breakouts

### Transition Mechanic

View Transitions API. Desktop blurs and slides back. Page morphs in from dock icon position. Floating "back to desktop" pill (bottom-right) + Esc key. Mini-dock appears on bottom edge hover. Reverse animation to return.

### 6a. /portfolio

3D hero accent scene (React Three Fiber + Drei) — one impactful moment. Horizontal scroll project gallery (Lenis + GSAP ScrollTrigger). Clip-path hover reveals on project cards. Individual case study pages with scroll-driven animations, split-text headings. Context-aware nav (transparent → solid on scroll). Projects: LetMeScale, ExecuDeck, Proslync, DispoHub, Truks, XpressDrop, FlexiFocus, JarvisAI, QuickNotes.

### 6b. /cool-stuff

Bento grid with variable card sizes by content type. Categories: tools, sites, articles, experiments, music, resources. Micro-preview per card (thumbnail, animation, embed). Animated filter/sort with Motion layoutId. Submit form for authenticated users.

### 6c. /about

Scroll-driven narrative. Ambient details: live location, weather, current project. Values and philosophy. Tech stack showcase. Social links, contact form. Scroll-driven CSS animations for section transitions.

### 6d. /community

People grid with hover cards (Allen, Paul, Elizabeth, Kusco, Zachary). Organizations (Texas Juggling Society, Multiplexing.org, Siteswap.org, KoFightClub). Heritage narrative. Service links (Searx, Commafeed, Hubzilla). "Time Machine" button to /oldplace/ with retro transition.

---

## 7. Legacy Preservation

### /oldplace/*

Current place.org homepage and all subpages served as static HTML at /oldplace/*. No modifications. 301 redirects from old paths. Individual homepages at /oldplace/~{user}/. User resources at /oldplace/user/.

### Existing Services

Searx, Commafeed, and Hubzilla keep their current URLs via reverse proxy. Not moved, not modified, not part of the new site's build.

---

## 8. Browser Platform Features

| Feature | API | Where | Fallback |
|---|---|---|---|
| Float timer | Document PiP | Focus Timer | Regular window |
| Screen stays on | Screen Wake Lock | Focus sessions | Note to keep tab active |
| Page transitions | View Transitions | Desktop ↔ pages | CSS fade |
| Voice capture | Web Speech Recognition | Brain Dump | Type instead |
| Native popovers | Popover API | Menus, tooltips | Custom modal |
| Scroll animations | Scroll-Driven CSS | Immersive pages | IntersectionObserver |
| App icon badge | Badging API | Inbox count | Canvas favicon |
| No browser chrome | Window Controls Overlay | Installed PWA | Normal PWA |
| File export | File System Access | Journal export | Download blob |
| File import | File Handling | Open .md → Journal | Drag and drop |
| Background alerts | Notification API | Timer, reminders | In-app toast |
| Ambient sound | Web Audio + AnalyserNode | Sound engine | HTML Audio |
| Local database | SQLite WASM + OPFS | Everything | IndexedDB |
| Offline | Service Worker + Cache | Full app | — |
| Geolocation | Geolocation API | Weather, ambient bar | Manual location |
| PWA install | Web App Manifest | System tray | Bookmark |
| App shortcuts | Shortcuts (manifest) | Right-click PWA icon | — |
| Command palette | Custom (Cmd+K) | Global | — |
| Keyboard capture | Keyboard Lock | Terminal fullscreen | Standard shortcuts |

Progressive enhancement: every feature works without these APIs. They just work better with them.

---

## 9. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 (App Router) | SSR boot frame, route groups, existing stack |
| Language | TypeScript (strict mode) | Convention: no `any`, no untyped `as` |
| Styling | Tailwind v4 + CSS @scope/@layer | Utility-first + cascade isolation per window |
| Animation (React) | Motion v12 | 32KB, hardware-accelerated, best React DX |
| Animation (scroll) | GSAP + Lenis | Scroll choreography, split-text, timeline |
| 3D | React Three Fiber + Drei | Portfolio hero only |
| Window manager | react-rnd | Drag + resize, proven in browser OS projects |
| State | Zustand 5 | Window state, app state, cross-component |
| Database | wa-sqlite + OPFS (Web Worker) | Full SQL, persistent, fast, non-blocking |
| Auth | NextAuth.js + Google OAuth | Optional, for sync only |
| Terminal | jquery.terminal | Tab completion, history, no jQuery dep |
| Markdown | MDXEditor or TipTap | Rich editing for journal |
| Charts | Recharts or Chart.js | Focus analytics, habit heatmaps |
| PWA | Serwist | Service worker, caching, offline |
| Lint/Format | Biome | Convention |
| Package manager | pnpm | Convention |
| Pre-commit | Husky + lint-staged | Convention |
| Testing | Vitest + React Testing Library | 70/20/10 pyramid |

---

## 10. Data Model

SQLite WASM database running in a Web Worker via wa-sqlite + OPFS.

### Tables

**_meta** — Schema versioning. Fields: key, value.

**inbox** — Brain dump items. Fields: id, content, source (text/voice), processed, action (task/journal/archive), created_at, processed_at, updated_at.

**journal_entries** — One per day. Fields: id, date (YYYY-MM-DD, unique), content (markdown), one_thing, mood (1-10), energy_p/energy_m/energy_e (1-10 each), gratitude (JSON array of 3), tags (JSON array), created_at, updated_at. FTS5 virtual table for full-text search.

**focus_sessions** — Container for blocks. Fields: id, started_at, ended_at, status (active/completed/abandoned), updated_at.

**focus_blocks** — Individual work/break blocks. Fields: id, session_id (FK), type (work/short_break/long_break), target_ms, actual_ms, overrun_ms (generated), label, tags (JSON), started_at, ended_at, updated_at.

**tasks** — Priority-based task list. Fields: id, title, description, priority (must/should/could), category (work/personal/learning/health), status (pending/in_progress/done/archived), due_date, goal_id (FK), sort_order, created_at, completed_at, incomplete_reason, updated_at.

**goals** — Hierarchical goal cascade. Fields: id, title, level (three_year/yearly/monthly/weekly), parent_id (self-FK), progress (0-100), status, target_date, created_at, updated_at.

**habits** — Active habit definitions. Fields: id, name, frequency (daily/weekly), target, active, sort_order, created_at.

**habit_logs** — Daily check-ins. Fields: id, habit_id (FK), date, completed (0/1 or count), notes, updated_at.

**events** — Calendar events. Fields: id, title, date, start_time, end_time, description, reminder_ms, created_at, updated_at.

**time_blocks** — Daily schedule blocks. Fields: id, date, start_time, end_time, label, category (deep_work/meetings/personal/admin), task_id (FK), created_at, updated_at.

**reviews** — Weekly/monthly review snapshots. Fields: id, type (weekly/monthly), date, wins (JSON), challenges (JSON), lessons (JSON), next_one_thing, content (markdown), created_at, updated_at.

**cool_stuff** — Curated links. Fields: id, title, url, description, category, thumbnail, created_at, updated_at.

**window_state** — Desktop window persistence. Fields: id, app_id, x, y, width, height, z_index, minimized, maximized, updated_at.

**settings** — Key-value store. Fields: key, value (JSON).

**desktop_icons** — Draggable desktop shortcuts. Fields: id, label, icon, action, x, y, sort_order, updated_at.

---

## 11. Data Flow

### Local-First (Default)

All data stored in SQLite WASM via OPFS. Zero network requests for data operations. Full offline support via Service Worker. Export/import as JSON or markdown.

### Sync Layer (Deferred — NOT v1)

Sync is architecturally planned but NOT implemented in v1. Google OAuth is wired up for identity only. The full sync protocol (unit of sync, conflict resolution, deletion propagation, server-side schema) will be specified separately when sync becomes a priority. All tables include `updated_at` fields to enable future last-write-wins sync.

---

## 12. Multi-Tab Behavior

OPFS has exclusive locking semantics. Only one tab can hold the SQLite WASM database connection at a time.

**Strategy:** SharedWorker as the single database connection point. All tabs communicate with the SharedWorker via MessagePort. If SharedWorker is not supported (Safari < 16), fall back to BroadcastChannel leader election — first tab becomes the "database tab," subsequent tabs route queries through it. Tab closure triggers leader re-election.

This is critical infrastructure and must be implemented before any app features.

---

## 13. Schema Versioning

A `_meta` table tracks schema version:

```sql
CREATE TABLE _meta (key TEXT PRIMARY KEY, value TEXT);
INSERT INTO _meta VALUES ('schema_version', '1');
```

On boot (before desktop loads), the migration runner:
1. Reads current `schema_version`
2. Applies any pending migrations sequentially
3. Updates `schema_version`
4. Proceeds to desktop initialization

Migrations are JS functions in a version-ordered array. Each migration receives the database connection and runs DDL/DML. Failed migrations abort boot and show an error screen with export option (so users can recover their data).

---

## 14. Failure Modes and Recovery

| Failure | Detection | Recovery |
|---|---|---|
| OPFS not supported | Feature detection on boot | Fall back to IndexedDB via idb wrapper (reduced performance, same API surface) |
| SQLite WASM fails to load | Web Worker error handler | Show error screen with "Try refreshing" + "Export data" option |
| Storage quota exceeded | `navigator.storage.estimate()` check | Warning in ambient bar at 80%. At 95%, disable new entries and prompt export. |
| Weather API fails | Fetch timeout (3s) | Show date/time only, hide weather. Retry on next focus event. |
| Multi-tab conflict | SharedWorker/BroadcastChannel | Route to existing tab or show "already open" message |
| Service Worker update | `controllerchange` event | Prompt user to refresh for new version. Never auto-refresh. |
| Corrupt database | SQLite integrity_check on boot | Offer export of recoverable data + fresh start option |

---

## 15. Keyboard Shortcuts

Browser shortcuts (`Cmd+W`, `Cmd+T`, `Cmd+F`, `Cmd+D`) cannot be intercepted in a regular browser tab. place.org uses prefixed shortcuts that don't collide:

**Apps:** `Ctrl+Shift+B` (Brain Dump), `Ctrl+Shift+J` (Journal), `Ctrl+Shift+F` (Focus), `Ctrl+Shift+T` (Terminal), `Ctrl+Shift+D` (Dashboard)

**Windows:** `Esc` (minimize active), `Ctrl+Shift+W` (close window), `Ctrl+Shift+M` (maximize), `` Ctrl+` `` (cycle windows)

**Navigation:** `Ctrl+K` (command palette — this one is safe), `Ctrl+Shift+Enter` (quick brain dump), `Ctrl+Shift+.` (sound toggle)

**PWA installed mode:** When running as an installed PWA with Window Controls Overlay, standard `Cmd+` shortcuts are available since the browser chrome is gone. The app detects `display-mode: window-controls-overlay` and upgrades shortcut bindings.

---

## 16. Performance Budget

| Metric | Target | Notes |
|---|---|---|
| Initial JS bundle (compressed) | < 150KB | Desktop shell + one app. Others lazy-loaded. |
| SQLite WASM binary | ~400KB (one-time, cached) | Loaded in Web Worker, non-blocking |
| LCP (desktop route) | < 2.0s | SSR boot frame + JS hydration |
| LCP (portfolio) | < 1.5s | SSR page content |
| INP | < 200ms | All interactions |
| CLS | < 0.05 | No layout shifts after boot |
| Memory ceiling | < 300MB | With 5 windows open + backdrop-filter |
| 60fps threshold | 5 concurrent windows | With `contain: strict` isolation |
| Total loaded (all apps open) | < 2MB compressed | Aggressive code splitting |

R3F (React Three Fiber) is the heaviest dependency (~150KB). Only loaded on /portfolio route via `next/dynamic`. GSAP + Lenis only loaded on immersive pages.

---

## 17. Accessibility

| Concern | Approach |
|---|---|
| Keyboard navigation | All windows reachable via Ctrl+` cycle. Tab navigation within windows follows standard flow. Focus trap in modals. |
| ARIA roles | Window manager: `role="application"` on desktop, `role="dialog"` on each window, `aria-label` with app name |
| Focus management | Opening window moves focus to it. Closing returns focus to previously focused window. Minimize returns focus to dock. |
| Screen reader | Window state changes announced via `aria-live="polite"` region. "Brain Dump opened", "Window minimized". |
| Color contrast | All text meets WCAG AA (4.5:1 minimum). Accent blue `#5b9cf5` on `#0a0e1a` = ~5.2:1. Secondary text `#8088a0` verified. |
| Reduced motion | `prefers-reduced-motion`: all ambient effects disabled, functional transitions simplified to opacity fades. |
| High contrast | `prefers-contrast: more`: borders become more visible, glass effects replaced with solid backgrounds. |

---

## 18. Journal Storage Model

Journal entries use a hybrid model:

- **Structured fields** (top-level columns): date, one_thing, mood, energy_p/m/e, gratitude — queryable, chart-able, auto-populated
- **Content field** (markdown): the full journal text with section headers — user-editable, searchable via FTS5
- **Section insertion**: When Brain Dump items are sorted to "Journal", they are appended to the `## Ideas & Thoughts` section of the markdown content. This is a string operation (find header, append below it). If the section doesn't exist, it's created.

This is simpler than a sections table and preserves the "it's just markdown" philosophy. The structured fields exist for data that needs to be queried or visualized (energy trends, mood graphs).

---

## 19. SSR Strategy

| Route | Rendering | Content |
|---|---|---|
| `/` (desktop) | SSR shell + client hydration | Server renders boot frame HTML/CSS (styled loading screen). All desktop functionality is client-only. |
| `/portfolio` | Full SSR + selective hydration | Project list, case studies server-rendered. 3D hero and animations hydrate on client. |
| `/about` | Full SSR | Content is static. Scroll animations are CSS-only or progressive enhancement. |
| `/community` | Full SSR | People grid, org links, heritage text all server-rendered. |
| `/cool-stuff` | SSR + client hydration | Grid server-rendered. Filter/sort interactions hydrate. |
| `/oldplace/*` | Static serving | No Next.js processing. Direct file serving. |

The desktop route is effectively a client-side SPA within the Next.js shell. This means the desktop JS bundle is the priority code-split target.

---

## 20. Non-Goals (v1)

- **Sync** — Deferred. Google OAuth for identity only. Full sync protocol specified separately.
- **AI integration** — Placeholder architecture only. No AI features in v1.
- **Multi-user collaboration** — Single-user tool. Others use their own instance.
- **Native mobile app** — PWA only.
- **Custom themes/skins** — Accent color configurable. Full theming deferred.
- **Plugin system** — Apps are built-in. No third-party extensibility in v1.
- **Cool stuff submissions** — The submit form requires server-side infrastructure tied to sync. Deferred with sync.

---

## 21. Phased Delivery (Recommended)

### v0.1 — Desktop Shell

Desktop environment: boot sequence, ambient bar, dock, window manager, wallpaper, cursor light, sound engine. One app: Brain Dump. Validates the core architecture (SQLite WASM, window management, OPFS, multi-tab, PWA).

### v0.2 — Core Apps

Journal, Focus Timer, Terminal. The three primary daily-use tools. Dashboard with basic metrics.

### v0.3 — Productivity Suite

Tasks, Calendar, Habits, Review. Goal cascade. Full daily template experience.

### v0.4 — Immersive Pages

/portfolio (with 3D hero), /about, /cool-stuff, /community. View Transitions between desktop and pages.

### v0.5 — Legacy + Polish

/oldplace/* migration, /services portal, PWA enhancements (Window Controls Overlay, Badging, File Handling), mobile launcher mode, accessibility audit.

### v1.0 — Launch

Performance optimization, Lighthouse 90+, cross-browser testing, domain deployment.

---

## 22. Success Criteria

1. First-time visitor can brain dump a thought within 10 seconds of boot completing
2. Desktop feels responsive at 60fps with 5+ windows open
3. Full offline functionality — airplane mode works perfectly
4. Portfolio pages score 90+ on Lighthouse performance
5. The site makes people ask "what IS this?"
6. All text meets WCAG AA contrast ratios
7. Initial bundle under 150KB compressed
8. Schema migrations run without data loss across version updates
