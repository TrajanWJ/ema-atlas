---
title: "dashboard-designs-v2"
created: 2026-03-17
updated: 2026-03-17
type: project
status: active
confidence: 0.50
confidence_updated: 2026-03-18
source: project
tags: [E8E8F0, F0EDE6, F5A623, F5F5F7, FB7185, FCD34D, FF5A5F, FF6B8A, FFB347]
summary: "Glass is built on a single conviction: **the interface should feel like it belongs to the future you're already living in.** Not a tool you open. A sp"
---
# Dashboard Designs v2 — Right Hand Command Center
*Designed by UI Psychology × Product Design*
*March 2026 — Three Distinct Visions*

---

> **Design Brief:** 12 agents. 20+ cron jobs. 10 coding projects. A vault knowledge base. One human who wants to feel in control without feeling overwhelmed. These three designs answer the same problem from completely different emotional premises.

---

# ✦ APPROACH 1: GLASS
## *Spatial Computing / Apple visionOS Aesthetic*
### *"The world is running itself. You're just watching."*

---

## 1. Design Philosophy

Glass is built on a single conviction: **the interface should feel like it belongs to the future you're already living in.** Not a tool you open. A space you enter.

The theory comes from Apple's Human Interface Guidelines for visionOS — specifically the idea that UI elements should feel like physical objects with depth, material, and weight. A glass card isn't a rectangle with a border. It's a pane floating in space, catching light differently depending on what's behind it.

**Progressive Disclosure** is the structural backbone. At rest, Glass shows you four large, calm cards: Agents, Projects, Vault, System. Nothing more. No tables, no lists, no nested navigation. Just the shape of your system at a glance. When you lean in — hover, click, approach — the card blooms open. Detail appears. The rest of the world steps back slightly, going more frosted, more distant.

This mirrors how we actually pay attention. We don't read dashboards like documents. We **scan for anomalies**, then zoom in on what's wrong or interesting. Glass is designed around that exact attention pattern.

**Color temperature** replaces status icons. Warm amber means running. Cool blue means idle. Soft rose means something wants your attention. No flashing reds. No alert badges. The dashboard has a *temperature*, and you feel it before you read it.

Every animation exists for a reason. The pulse on an active agent card isn't decoration — it's a heartbeat. The gentle gradient drift across the background isn't a screensaver — it's the system breathing. You should feel, viscerally, that this system is **alive and healthy**, or **alive and struggling**.

---

## 2. Color Palette

| Swatch | Name | Hex | Usage Rule |
|--------|------|-----|------------|
| ⬜ | **Glass White** | `#F5F5F7` | Card surface base — always with 60% opacity |
| 🌌 | **Deep Space** | `#0A0A1A` | Background gradient anchor — never used flat |
| 🌊 | **Aurora Teal** | `#2EC4B6` | Idle/healthy state accent, inactive agent rings |
| 🌅 | **Warm Amber** | `#FFB347` | Active/running state — agents processing, crons firing |
| 🌸 | **Soft Rose** | `#FF6B8A` | Attention needed — never paired with urgency copy |
| 🔮 | **Iris Purple** | `#7B61FF` | Vault/knowledge elements, AI activity indicators |

**Background:** Radial gradient from `#0D1B2A` (center) → `#0A0A1A` (edges), with a subtle animated aurora overlay at 8% opacity shifting between Aurora Teal and Iris Purple on a 20-second loop.

**Glass surface formula:** `background: rgba(245, 245, 247, 0.08); backdrop-filter: blur(24px) saturate(180%); border: 1px solid rgba(255,255,255,0.12);`

---

## 3. Typography

**Primary Typeface:** SF Pro Display (Apple system) / **Inter** (web fallback)
**Secondary:** SF Mono / **JetBrains Mono** for numbers, statuses, IDs only

| Role | Size | Weight | Letter Spacing | Usage |
|------|------|--------|----------------|-------|
| Hero Number | 56px | 200 (Thin) | -0.02em | Active agent count, big KPI |
| Card Title | 22px | 500 (Medium) | -0.01em | "Agents", "Projects", "Vault" |
| Card Subtitle | 14px | 400 (Regular) | 0.02em | "8 of 12 active · 2 needs attention" |
| Stat Label | 11px | 500 (Medium) | 0.08em | ALL CAPS labels — "TASKS TODAY" |
| Body | 15px | 400 (Regular) | 0em | Expanded card details, descriptions |
| Mono Data | 13px | 400 (Regular) | 0.01em | Token counts, job IDs, timestamps |
| Command Input | 17px | 300 (Light) | 0em | "Ask Right Hand anything..." placeholder |

**Principle:** Numbers are thin and large. Labels are small and tracked out. Never bold anything unless it's an alert. Restraint is the point.

---

## 4. Component Inventory

### Status Bar (top, 44px tall)
- **System Time** — right-aligned, 13px, subtle. Updates live.
- **Usage Orb** — 28px pill: animated fill bar (tokens used / limit). Glows amber at 75%.
- **Health Dot** — 8px circle. Aurora Teal = healthy. Amber pulse = degraded. Rose = issue.
- **Model Badge** — "claude-sonnet-4" in a frosted pill. Clickable → model selector drawer.

### Floating Cards (4 primary, grid layout)
Each card: 320×240px at rest, smooth expand to full detail. `border-radius: 24px`. Depth shadow: `box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)`.

**Agent Card**
- Hero: `"8"` (active count, thin 56px)
- Subtitle: `"of 12 agents · 2 idle · 1 needs review"`
- Mini agent ring: 12 dots in a circle, colored by status
- Hover → card expands, shows agent list with individual status, last activity, task queue depth

**Projects Card**
- Hero: `"10"` (project count)
- Progress rings: 10 tiny circular progress bars, warm amber fill
- Hover → shows each project, last commit time, open issues count, CI status dot

**Vault Card**
- Hero: `"4.2k"` (documents/notes)
- Animated particle cluster: 20 small dots moving slowly (represents knowledge activity)
- Subtitle: `"Last indexed 2m ago · 99.1% healthy"`
- Hover → recent additions, search activity, cross-reference stats

**Crons Card**
- Hero: `"23"` (scheduled jobs)
- Mini timeline: horizontal bar showing upcoming jobs in next 60 mins
- Last fired / next fire relative times
- Hover → full job list with schedules, success rate rings, last error if any

**Usage Card** (smaller, 160×160px)
- Donut chart: token usage this period
- Cost tracker: `$12.40 this month`
- Trend arrow: compared to last period

**Recent Activity Feed** (rightmost, tall)
- Minimal list: avatar dot (agent color) + one-line event + relative time
- Auto-scroll (pauses on hover)
- Soft fade at top and bottom edges

### Expanded Detail View
- The hovered card scales to 600×480px
- Surrounding cards shrink and increase blur (depth metaphor)
- Inside: sortable table, status pills, quick action buttons
- `ESC` or click-away collapses back with spring animation

### Command Drawer (bottom, slides up)
- `⌘K` or click on input bar → frosted glass drawer rises from bottom
- `"Ask Right Hand anything..."` — natural language queries
- Recent commands shown as pills above input
- No visual chrome — just the input and glow focus ring

### Notification Toast
- Slides in from top-right, frosted glass, 4-second auto-dismiss
- Never stacks more than 2 at once — queue and throttle
- Rose color only for actual errors, not informational

---

## 5. Interaction Model

**Default state:** Four cards floating in a 2×2 grid. Background gradient drifts slowly. Active agent cards pulse once every 3 seconds. No clicks required.

**Hover:** Card raises (translate Y -4px), shadow deepens, content reveals secondary info. Takes 200ms with ease-out cubic-bezier.

**Click:** Card expands to detail view. Spring physics (stiffness: 300, damping: 25). Other cards retreat: scale to 0.92, blur increases to 32px.

**Drag:** Cards can be rearranged. They snap to grid with magnet feel.

**Keyboard:** `1-4` jump to card focus. `↵` expands. `ESC` collapses. `⌘K` opens command drawer.

**Mobile:** Cards stack vertically. Swipe left/right between them. Tap to expand.

**Transitions:** Nothing snaps. Everything eases. Active agents have a living pulse (scale 1.0 → 1.02 → 1.0 on 3s loop). Background aurora shifts every 20s.

---

## 6. Emotional Response

Opening Glass should feel like putting on a pair of very expensive headphones. **Immediate calm.** The system is complex — you know this — but looking at Glass, it doesn't feel complex. It feels *managed*. 

You feel **ownership without anxiety.** The warm amber of running agents is satisfying, not urgent. The soft pulse is reassuring, not alarming. The thin typography gives the impression of lightness — this system isn't heavy, it's precise.

The first emotion should be: *"Oh, this is beautiful."*
The second should be: *"And I understand everything at a glance."*
The third, after a few weeks: *"I actually look forward to opening this."*

That third emotion is the hardest to design for. Glass earns it through restraint. By never demanding your attention, it earns it.

---

## 7. Reference Products

1. **Apple visionOS Home Screen** — floating panels, depth layering, glass material, progressive reveal
2. **Linear Issue Tracker** — the way complexity hides until you need it; keyboard-first but not keyboard-only
3. **Stripe Dashboard** — calm metrics, no alarms, trust that the data is real and the system is working

---

## 8. Honest Weakness

Glass lives and dies by **implementation quality**. Glassmorphism that isn't done perfectly looks like a 2021 Dribbble shot. The blur effects are GPU-intensive and can feel sluggish on lower-end hardware. The progressive disclosure model means information is *hidden* — if you have many agents needing attention simultaneously, the calm aesthetic actively works against urgency. You can miss things. 

Also: **dark backgrounds + light glass cards = readability challenges** for users with vision sensitivities. Needs careful contrast testing. Not screen-reader friendly out of the box without significant ARIA work.

**Best for:** Someone who primarily glances, rarely needs to drill deep, and values aesthetics alongside function.

---

## 9. Build Recommendation

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | **Next.js 14** (App Router) | SSR for real-time data + React ecosystem |
| Animation | **Framer Motion** | Spring physics, layout animations, gesture handling |
| Glassmorphism | Custom CSS + **Tailwind** | CSS backdrop-filter, custom utility classes |
| Charts | **Recharts** or **Visx** | Lightweight, composable, animatable |
| State | **Zustand** | Simple global state for card open/close, agent data |
| Real-time | **WebSocket** or **Server-Sent Events** | Live agent status without polling |
| Icons | **Lucide React** | Clean, consistent, MIT licensed |

**Estimated time:** 3–4 weeks for a polished v1 (assumes full-time dev, or 6–8 weeks part-time)

**Start with:** The card grid and glassmorphism CSS. Get one card perfect. Clone it four times. Data layer is secondary to *feeling* right.

---
---

# ✦ APPROACH 2: CODEX
## *Anthropic Console / Professional SaaS Aesthetic*
### *"Your agents, accountable."*

---

## 1. Design Philosophy

Codex is built on the premise that **a dashboard is a document of truth**. When you open it, everything you need to make a decision is visible, organized, and verifiable. Nothing is hidden behind a hover. Nothing requires discovery.

The theoretical backbone is **Information Architecture** (IA) — the discipline of organizing content so that users always know where they are, where they've been, and where they can go. Combined with **Gestalt Principles** (proximity, similarity, continuity), Codex groups related information so tightly that the groupings themselves communicate meaning.

This is the dashboard you'd open before a client call. It's the dashboard your future co-founder could read without a tour. **Legibility is a design value**, not a compromise.

The F-pattern scanning principle guides layout: humans read screens like an F — horizontal scan at the top, another horizontal scan lower, then a vertical scan down the left side. Codex puts your most important information (agent health, active tasks) in the top-left. Navigation is on the left. Actions are on the right. Your eye does what it naturally wants to do.

Dark mode isn't aesthetic here — it's **cognitive.** Light screens cause fatigue during long work sessions. The deep charcoal background reduces eye strain and makes colored status elements pop without needing to compete with white backgrounds.

**Consistency is the single most important principle.** Every section has the same visual weight. Every card uses the same spacing. Every status uses the same color system. Once you learn one part of Codex, you've learned all of it. That's the promise.

---

## 2. Color Palette

| Swatch | Name | Hex | Usage Rule |
|--------|------|-----|------------|
| 🌑 | **Void** | `#0F0F14` | Page background — the ground everything sits on |
| 🌫️ | **Surface** | `#1A1A2E` | Card/panel backgrounds — one step up from void |
| 🔲 | **Border** | `#2E2E4A` | All dividers, card edges, input borders |
| 🟢 | **Emerald** | `#00C896` | Healthy / active / success — never overuse |
| 🟡 | **Marigold** | `#F5A623` | Warning / needs attention / degraded |
| 🔴 | **Coral** | `#FF5A5F` | Error / failed / critical — use sparingly |
| ⚪ | **Frost** | `#E8E8F0` | Primary text — warm-tinted white, not pure white |
| 🔵 | **Cobalt** | `#4F8EF7` | Interactive elements, links, selected states |

*(Yes, 8 colors — a professional SaaS needs a complete system)*

**Sidebar:** `#13131F` — slightly lighter than Void, creates depth without a border
**Hover states:** `rgba(79, 142, 247, 0.08)` — Cobalt at 8% opacity as hover background

---

## 3. Typography

**Primary Typeface:** **Inter** (variable font — use variable weight axis)
**Secondary:** **JetBrains Mono** — all numerical data, agent IDs, timestamps, code

| Role | Size | Weight | Usage |
|------|------|--------|-------|
| Page Title | 24px | 600 | Section headers ("Agents", "Projects") |
| Card Header | 16px | 600 | Card/panel titles |
| Body | 14px | 400 | All descriptive text |
| Caption | 12px | 400 | Timestamps, helper text, secondary info |
| Label | 11px | 500 | ALL CAPS column headers, field labels |
| Data | 14px | 400 | JetBrains Mono for numbers, IDs, paths |
| KPI Hero | 36px | 700 | The big number on each KPI card |
| KPI Label | 12px | 500 | Label beneath KPI number |
| Nav Label | 13px | 500 | Sidebar navigation items |
| Button | 14px | 500 | Action buttons (medium weight, not bold) |

**Line heights:** 1.5 for body, 1.2 for headings, 1.0 for mono data

---

## 4. Component Inventory

### Top Navigation Bar (60px)
- **Logo/wordmark** left: "Right Hand" with subtle geometric mark
- **Breadcrumb** center: `Dashboard > Agents > prompt-engineer` — always know where you are
- **Global Search** (⌘K pill): "Search agents, projects, jobs..." — fuzzy search everything
- **Usage Indicator**: `"$14.20 / $50 budget"` pill with progress bar — always visible
- **Notifications Bell**: unread count badge, dropdown with recent events
- **Avatar/Settings**: bottom-right → profile, settings, logout

### Left Sidebar (240px, collapsible to 64px)
Icon + label navigation:
- 🏠 Dashboard (home/overview)
- 🤖 Agents (12)
- 📁 Projects (10)
- 📚 Vault
- ⏰ Crons (23)
- 💬 Conversations
- 📊 Analytics
- ⚙️ Settings

Active state: left border accent (Cobalt), background `rgba(79,142,247,0.08)`, text Cobalt.
Collapse: labels hide, icons remain. Tooltip on hover shows label.

### Dashboard Home — KPI Row (4 cards)
Each KPI card: Surface background, 1px Border edge, 16px padding, `border-radius: 12px`

- **Agents Active**: `8 / 12` — hero number + status breakdown (active/idle/error counts as colored dots)
- **Tasks Completed**: `142 today` — with sparkline showing hourly completions
- **Vault Health**: `99.1%` — with last-indexed timestamp and document count
- **Usage This Period**: `$14.20 / $50` — donut chart, trend arrow vs last period

### Activity Feed (right panel, 320px)
- Chronological event list: agent name + event + relative time
- Color-coded left border per agent (each agent has a consistent assigned color)
- Filter chips above: All / Agents / Crons / Errors
- "Load more" at bottom — not infinite scroll (preserves position)
- Pause button (for when you're reading)

### Agents Table View (main Agents section)
Columns: Status Dot | Agent Name | Current Task | Last Active | Tasks Today | Health
- Sortable columns, click header to sort
- Row hover: subtle background tint + action buttons appear (View, Pause, Message)
- Status dot: Emerald (active), Marigold (idle), Coral (error), Border color (sleeping)
- Click row → side panel slides in with agent detail (logs, task queue, configuration)

### Agent Detail Side Panel (480px, slides from right)
- Agent name + status badge at top
- Tabs: Overview | Tasks | Logs | Config
- Overview: current task, task queue (ordered list), recent outputs
- Tasks: table of all tasks — completed/pending/failed with expandable details
- Logs: terminal-style log viewer, JetBrains Mono, filterable by level
- Config: read-only view of SOUL.md, AGENTS.md links

### Projects Panel
- Card grid (3 columns): project name, description, status badge, last commit time
- Each card: progress ring (open issues / total), CI status, tech stack badges
- Click → detail panel: README excerpt, recent commits, open PRs, linked agents

### Cron Jobs Panel
- Table: Job Name | Schedule | Last Run | Next Run | Success Rate | Last Duration
- Success rate as a small bar (green fill)
- Status: "✓ 2m ago" or "✗ Failed 5m ago" with Coral accent
- Upcoming jobs section: next 6 jobs in a timeline view
- Click job → run history, logs, edit schedule (if permitted)

### Vault Panel
- Document browser: folder tree on left, document preview on right
- Stats banner: total docs, last indexed, search queries today, most-referenced docs
- Recent activity: last 5 accessed/modified documents
- Search bar: semantic search across vault (powered by your agents)

### Command Palette (⌘K overlay)
- Full-screen dimmed overlay
- Centered search box: 600px wide, frosted background
- Results: grouped by type (Agents, Projects, Crons, Documents, Actions)
- Keyboard navigation: ↑↓ to move, ↵ to select, ⌘ for quick actions

---

## 5. Interaction Model

**Navigation:** Sidebar-driven. Click section → view changes. URL updates (shareable/bookmarkable links). Browser back/forward works.

**Primary actions:** Always in consistent positions. Create (+ button, top right). Edit (pencil icon, appears on hover). Delete (in action menus, never exposed by default).

**Data density toggle:** Top-right gear icon → "Comfortable" / "Compact" / "Dense" view. Compact reduces padding by 40%, shows more rows. Dense is keyboard-user mode.

**Keyboard shortcuts:**
- `G + A` → Agents
- `G + P` → Projects
- `G + V` → Vault
- `G + C` → Crons
- `⌘K` → Command palette
- `⌘/` → Keyboard shortcut reference

**Animations:** Minimal and purposeful. Panel slides: 250ms ease-out. Row hovers: 100ms. No springiness, no bounce. Professionalism means predictability.

**Real-time:** Status dots and activity feed update live. A subtle fade-in (300ms) when new items appear. No jarring refreshes.

---

## 6. Emotional Response

Opening Codex feels like sitting down to a desk that's perfectly organized. **Clarity.** Control. The kind of focused readiness you feel before starting a productive work session.

You feel **competent**. Like you have real visibility into a real system. The data density says: *I trust you to handle information.* The dark background says: *We're here to work.* The emerald status dots say: *Everything is running. You can relax.*

It's the dashboard you imagine other people see when they imagine you have your life together. And unlike Glass, it doesn't hide anything — it's all there, organized, waiting.

The emotional arc: *"This looks serious" → "I can navigate this without help" → "I actually understand my whole system from one screen."*

---

## 7. Reference Products

1. **Anthropic Console** — the exact aesthetic. Deep dark backgrounds, clean typography, colored status indicators, tabs and panels.
2. **Vercel Dashboard** — professional SaaS density done right. KPI row, activity feed, clean project cards.
3. **Linear** — the gold standard of information-dense dark UIs that don't feel oppressive.

---

## 8. Honest Weakness

Codex is **high-floor, low-ceiling**. It's very good at presenting a lot of information clearly. It's not good at *delighting* you. There's no moment of "oh wow" — just reliable clarity. 

The sidebar model also means **navigation overhead**. To see agents + crons together, you switch between sections. There's no unified "everything at once" view (unless you build a custom home dashboard). For someone who wants to see the whole system simultaneously, Codex requires more clicks than Glass.

Also: **it looks like every other SaaS dashboard.** If Trajan ever shows this to someone, they might not be impressed — it's familiar because it's correct. There's no brand identity. 

**Best for:** Power users who live in the dashboard for hours at a time and need to find specific information quickly.

---

## 9. Build Recommendation

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | **Next.js 14** | App Router, server components for data fetching |
| UI Base | **shadcn/ui** | Pre-built accessible components, fully customizable |
| Styling | **Tailwind CSS** | Rapid iteration, consistent spacing scale |
| Tables | **TanStack Table** | Sorting, filtering, virtualization for large lists |
| Charts | **Recharts** | Composable, lightweight, great sparklines |
| Animation | **Framer Motion** (minimal) | Only for panel slides and toasts |
| Icons | **Lucide React** | Consistent, 1000+ icons, MIT |
| State | **Zustand** + **React Query** | Local UI state + server data with caching |
| Real-time | **Server-Sent Events** | Simpler than WebSocket for one-way status updates |

**Estimated time:** 2–3 weeks for v1 (fastest to build — established patterns, reusable components)

**Start with:** The sidebar layout and KPI row. Use shadcn/ui card components. Get the navigation working first — everything else slots in.

---
---

# ✦ APPROACH 3: BLOOM
## *Calm Technology / Ambient Dashboard*
### *"You don't check it. You just know."*

---

## 1. Design Philosophy

Bloom is built on **Mark Weiser's Calm Technology** thesis (1995): *"The most profound technologies are those that disappear. They weave themselves into the fabric of everyday life until they are indistinguishable from it."*

The insight is radical: **a great dashboard should be almost invisible.** It should live in peripheral vision. You don't open it to find information — you glance at it and *already know* the information, the way you know the weather by glancing at the sky.

This requires solving a hard design problem: how do you communicate the state of 12 agents, 20+ crons, and 10 projects *without requiring any reading*? The answer is **abstract representation through color and form.** The central orb's color tells you system mood. The ring animations tell you activity level. The outer ring's completeness tells you project health. No reading required.

Bloom also takes **time-awareness** seriously — a principle borrowed from ambient display research. At 7am, you want a briefing: what happened overnight, what's scheduled today. At 2pm, you want focus: what's actively running right now. At midnight, you want surveillance: is everything still alive? The layout adapts.

The **emotional design** theory (Don Norman) says users respond to aesthetics first, then usability. Bloom's beauty is its core feature. A calming palette, generous whitespace, and fluid motion create a **felt sense of system health** before a single number is read.

This is designed to sit on a second monitor, always visible, always ambient. Like a beautiful clock that also happens to be a system monitor.

---

## 2. Color Palette

| Swatch | Name | Hex | Usage Rule |
|--------|------|-----|------------|
| 🌿 | **Sage Background** | `#0E1512` | Very dark green-tinted background — earthy, calm |
| 🌑 | **Deep Ground** | `#080D0B` | Outer edge of background gradient |
| 💚 | **Vitality** | `#4ADE80` | Core orb color: all systems healthy |
| 🌅 | **Attention Amber** | `#FCD34D` | Orb color: one or more items need attention |
| 🌸 | **Alert Rose** | `#FB7185` | Orb color: something is failing |
| 🌊 | **Flow Blue** | `#38BDF8` | Active task indicators, running cron rings |
| ✨ | **Cream** | `#F0EDE6` | All typography — warm off-white |
| 🫧 | **Ghost** | `rgba(240,237,230,0.15)` | Ring tracks, inactive dots, background elements |

**The orb gradient formula:**
- Healthy: radial gradient from `#4ADE80` (center) → `#16A34A` (edge), soft glow `box-shadow: 0 0 80px rgba(74, 222, 128, 0.4)`
- Attention: center shifts to `#FCD34D`, glow shifts warm
- Alert: center shifts to `#FB7185`, glow becomes rose
- Transition: 3-second ease-in-out between states. You *feel* the mood shift before you register it cognitively.

---

## 3. Typography

**Primary Typeface:** **DM Sans** — geometric, warm, readable at large sizes
**Secondary:** **DM Mono** — sibling monospace, consistent feel, used only for data
**Optional upgrade:** **Canela** (display) for the hero number — feels like a magazine, not a terminal

| Role | Size | Weight | Notes |
|------|------|--------|-------|
| System Mood Text | 18px | 300 (Light) | "All systems healthy" — beneath orb |
| Time Display | 72px | 200 (Thin) | Center of screen in glance mode |
| Hero Stats | 48px | 300 (Light) | Primary numbers in briefing drawer |
| Section Label | 11px | 600 (SemiBold) | ALL CAPS + 0.15em spacing — "AGENTS" "CRONS" |
| Ring Label | 13px | 400 (Regular) | Agent names, project names around rings |
| Data Value | 16px | 500 (Medium) | DM Mono — counts, times, percentages |
| Body | 15px | 400 (Regular) | Drawer content, descriptions |
| Timestamp | 12px | 300 (Light) | All relative times — "2m ago", "next: 14m" |

**Principle:** Bloom uses fewer, larger typographic elements than the others. If it needs a label, the label is probably too visible — blur it down to 60% opacity. Information should *be there* without *asserting itself.*

---

## 4. Component Inventory

### Full-Screen Canvas
No nav bar. No sidebar. No chrome. Just the canvas with a subtle gradient background.
Optional: a single small "⋯" menu (top right, 24px, 40% opacity) → settings, data density toggle, time-zone change, link to detailed Codex view.

### The Central Orb
- **Size:** 280px diameter
- **Material:** Glowing sphere — radial gradient with rim lighting, animated inner motion (fluid sim CSS or canvas-based)
- **Color:** Reflects system health (as above — Vitality/Amber/Rose)
- **Animation:** Gentle breathe (scale 1.0 → 1.04 → 1.0, 4s loop). Active tasks: orb pulses slightly faster.
- **Tap/click:** Opens the detail drawer
- **Hover:** Shows tooltip: "8 agents active · 23 crons healthy · 2 projects need attention"

### Agent Ring (innermost, 360px diameter)
- 12 evenly-spaced dots around a circle (one per agent)
- **Active agent:** Full Flow Blue dot, softly glowing, small orbit animation (dot travels slightly around its position)
- **Idle agent:** Ghost color dot, no animation
- **Error state:** Rose dot, gentle pulse
- **Hover dot:** Agent name appears in a floating label. Click → detail drawer opens to that agent.

### Cron Ring (middle, 480px diameter)
- Arc segments, not dots. Each arc = one cron job grouping (by frequency: hourly, daily, weekly)
- **Healthy arcs:** Ghost fill with Vitality accent at the "leading edge"
- **Recently fired:** Arc brightens and flows (animated gradient moves along arc)
- **Failed:** Arc turns Rose, static
- **Hover arc:** Shows group name + next fire time

### Project Ring (outermost, 620px diameter)
- 10 arc segments (one per project), separated by small gaps
- **Fill level** = project health / completeness (issues closed / total, CI passing rate)
- **Full arc = healthy.** Partial arc = open work. Empty arc = needs attention.
- Colors: project arcs use a consistent assigned palette (10 distinct, accessible colors)
- **Hover:** Project name + brief status floats near the segment

### Time Display (sits above orb in glance mode)
- Current time, large, thin typography
- In morning briefing mode: replaced by "Good morning, Trajan." + today's schedule preview

### Status Phrase (sits below orb)
- One line. Generated from system state:
  - `"All systems running smoothly"` — Vitality mode
  - `"2 agents active on urgent tasks"` — mixed mode
  - `"1 cron failed · 14 minutes ago"` — attention mode
  - `"Everything quiet"` — night/idle mode

### Detail Drawer (slides up from bottom)
- Triggered by: tap orb, tap any ring element, swipe up, or `Space` key
- **Full-width, 60% screen height**, frosted dark surface
- Tabbed: Agents | Crons | Projects | Recent Activity
- Each tab shows a clean list with status and one-line summaries
- A "View Full Dashboard" link at top-right → opens Codex in a new tab (Bloom + Codex are companions)
- Swipe down or `Space` to dismiss

### Time-Aware Mode Switcher (automatic)
- **06:00–11:00 (Morning Briefing):** Briefing card appears center instead of time display. "3 agents ran overnight. 2 cron jobs failed. 1 project had a PR merged." Digest format.
- **11:00–19:00 (Productivity Mode):** Standard orb + rings. Active tasks shown more prominently.
- **19:00–23:00 (Review Mode):** Day summary shows below orb. "Today: 142 tasks · 0 errors · $4.80 used."
- **23:00–06:00 (Night Watch):** Ultra-minimal. Just the orb glow and time. Dim overall to 70% brightness.

---

## 5. Interaction Model

**Default:** No interaction required. Bloom is a passive display. It just exists.

**Periphery:** Everything communicates in peripheral vision. You don't look *at* Bloom — you look *near* it. The orb color registers before you consciously look.

**Approach:** Moving your cursor toward the screen (via proximity sensor / mouse-move detection) brightens the display slightly and shows ring labels.

**Hover:** Any ring element shows a floating label with key info. The ring element brightens. Everything else dims very slightly.

**Click/Tap:** Opens the detail drawer. Focused on whatever you tapped (agent, project, cron group, or general if you tapped the orb).

**Drawer navigation:** Tap between tabs. Swipe or click outside to close. "View Full Dashboard" opens Codex companion app.

**Keyboard:**
- `Space` → open/close drawer
- `A`, `C`, `P` → jump to Agents/Crons/Projects tab
- `T` → toggle time-aware mode override
- `D` → toggle day/night display brightness

**Gestures (touch display or tablet):**
- Swipe up → open drawer
- Pinch in → zoom out rings (see all)
- Pinch out → zoom in (see detail of one ring)

---

## 6. Emotional Response

Opening Bloom should feel like the first ten seconds of your favorite ambient music playlist. **Immediate decompression.** 

The first emotion: *"This is beautiful."* — but differently than Glass. Glass is beautiful like a luxury product. Bloom is beautiful like a forest. It has a **living quality**. The orb breathes. The rings turn. Something is always gently moving.

The second emotion: *"Everything is fine"* — or if it's not, the amber shift tells you *before* you've consciously decided to check.

The third emotion, after regular use: **trust**. You stop opening browser tabs to check if your agents are running. You just glance at the orb. The system and you have developed a shared language. Green means good. You carry that knowledge through your day.

This is the rarest feeling a dashboard can create: **ambient confidence**. Not "I understand my system" (that's Codex). Not "my system looks beautiful" (that's Glass). But: **"my system is present with me"**.

---

## 7. Reference Products

1. **Dark Sky (RIP)** — ambient weather visualization that communicated forecast through visual texture before you read a single number. Bloom is Dark Sky for agents.
2. **Raycast for macOS** — the way it blends into your workflow and appears only when needed, then disappears again. The *presence without intrusion* quality.
3. **Monument Valley / Alto's Odyssey** — not dashboards, but games that prove: ambient beauty + simple information + calm animation = something you return to daily.

---

## 8. Honest Weakness

Bloom is **terrible for power users**. If you have 12 agents and need to find out *which specific cron job failed and why*, Bloom will take you 3–4 interactions to get there (drawer → tab → item → detail). Codex takes 1.

The **abstract representation breaks down at scale**. If all 12 agents are having issues simultaneously, the orb turns rose and the ring is full of rose dots and you have no idea where to start. You've traded information density for ambiance — and when things go wrong, you pay the price.

The **time-aware features require tuning** to your actual patterns. Until Bloom "knows" your day, the mode shifts can feel jarring or mismatched.

Also: **animated dashboards with WebGL orbs are expensive to build well.** A cheap implementation looks like a bad screensaver. The difference between "ambient art" and "screensaver" is in the details — and the details are expensive.

**Best for:** A second monitor that's always visible. Someone who has Codex open when working deep but wants ambient awareness when in other apps.

---

## 9. Build Recommendation

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | **Next.js 14** or **Vite + React** | Bloom is frontend-heavy, SSR less important |
| Orb rendering | **React Three Fiber (R3F)** or **Canvas API** | Fluid orb animation needs GPU. R3F for 3D, canvas for 2D fluid sim |
| Ring system | **D3.js** (just the math) + **SVG** | D3 for arc calculations, SVG for rendering with CSS animations |
| Animation | **Framer Motion** + **CSS custom properties** | Layout transitions in Framer, orb glow via CSS vars driven by JS |
| Ambient orb color | Custom CSS `@property` + `@keyframes` | Smooth color transitions using registered custom properties |
| State | **Zustand** | Simple — primarily UI state (drawer open, active tab, display mode) |
| Time logic | **date-fns** | Lightweight, tree-shakeable, handles time-aware mode switching |
| Icons | None needed | Bloom avoids icons by design |

**Estimated time:** 4–6 weeks (the orb is the hard part — do it last after you have the ring data working)

**Start with:** The ring system and data pipeline. Get the three rings drawing real data. Then build the orb as a status summarizer of the ring data. The ambient beauty is a layer you add last, once the information architecture is solid.

**Companion app:** Bloom + Codex work best as a pair. Bloom is always-visible ambient. Codex is the power user mode. Link between them. Many users will want both.

---
---

# ✦ COMPARISON MATRIX

| Dimension | Glass | Codex | Bloom |
|-----------|-------|-------|-------|
| **Learning curve** | Low | Medium | Very Low |
| **Information density** | Medium | High | Low |
| **Ideal use case** | Regular check-ins | Deep work sessions | Ambient monitoring |
| **"Wow factor"** | ★★★★★ | ★★★ | ★★★★★ (different wow) |
| **Power user ceiling** | Medium | High | Low |
| **Build complexity** | Medium | Low | High |
| **Build time** | 3–4 weeks | 2–3 weeks | 4–6 weeks |
| **Mobile experience** | Good | Excellent | Excellent |
| **Accessibility** | Needs work | Good | Needs work |
| **When things break** | Calm might miss urgency | Clear and actionable | Abstract — hard to triage |
| **Pairs well with** | Codex (drill-down) | Bloom (ambient) | Codex (power mode) |

---

# ✦ MY RECOMMENDATION

**Build Codex first. Add Glass polish. Keep Bloom as a dream.**

Codex gives you real utility in 2–3 weeks. It's the dashboard that will make you more effective, not just more delighted. 

Then, steal Glass's visual language for Codex's cards. The glassmorphism aesthetic, the progressive disclosure, the color temperature system — all of these can be layered onto Codex's information architecture. The best dashboard is **Codex with Glass aesthetics**: structured and navigable, but beautiful and calm.

Bloom is a Q3 project, built on top of the data infrastructure you'll have established by then. When it's done, run it on a second monitor and let it change how you relate to your agent system.

The dream: open your laptop, Bloom glows green on your second monitor (all clear), you click into Codex to start the day's work. At the bottom of Codex there's a "Bloom view" button. Everything is beautiful, functional, and uniquely yours.

---

*Designs by UI Psychology × Product Design*
*For Trajan's Right Hand system — March 2026*
*"The interface should feel like the future you're already living."*

## Related

- [[harvest-2026-03-17-0000]]

## Related
- [[dashboard-design-critique-v2]] — critique of these designs
- [[dashboard-concepts]] — original design concepts
