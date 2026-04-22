---
type: project
status: active
created: 2026-03-20
updated: 2026-04-17
confidence: 0.60
confidence_updated: 2026-04-17
tags: [agent-os, frontend, web-ui, active-project]
---

# Agent OS Frontend

> Native web UI replacing Discord as the primary interface for the agent system.

## Architecture

- **Frontend:** Static HTML/JS/CSS at `/app/` — **~27K lines, 29 files** (up from 21K/12 as of 2026-03-20)
- **Bridge:** Express server at 192.168.122.10:18790
- **GitHub Pages:** https://trajanwj.github.io/agent-os-demo/
- **Life OS:** `/app/life.html`
- **Repos:** ~/Projects/agent-os-demo-pages/ (frontend), ~/Projects/agent-os-bridge/ (bridge)

## Dogfood Test Results (2026-03-20 09:35 UTC)

### Stream ⭐ — WORKS WELL
- Real Discord mirror showing traclaw1 messages from agent-feed
- Feed events (dispatch, triage) with proper badges
- Agent status bar shows Right Hand + Researcher active
- **Issue:** Uptime/Load/Memory show "—" in header metrics
- **Issue:** Filter chips (Needs Action, Completed, etc.) untested

### Inbox ⭐ — GOOD SHELL, FAKE DATA
- 10 items render, filter tabs work, click expands detail with thread
- Keyboard shortcuts j/k/Enter work
- **Issue:** ALL seed data — not connected to real proposals/agent output
- **Issue:** Action buttons (Approve/Reject) don't do anything
- **Fix needed:** Pull from /api/proposals + /api/feed + /api/tasks/active

### System ⭐⭐ — BEST PAGE
- Workflow pipeline with REAL counts (50 queued, 9 done, 1 failed)
- Agent Health table with all 6 agents
- CPU/Mem/Disk bars (real data)
- Cron jobs listed
- Cost chart (seed data though)
- **Issue:** "50 Queued" seems inflated — might be counting old proposal files
- **Issue:** No action buttons (restart service, clear cache, etc.)

### Talk 🔴 — BROKEN
- Channels load in sidebar
- Messages don't load on channel click
- Multiple layered switchChannel hooks from different coders
- **Coder dispatched** — awaiting fix

### Proposals 🔴 — BROKEN
- Section headers render but no cards populate
- API returns data (15 total, 0 pending)
- Rendering logic broken
- **Coder dispatched** — awaiting fix

### Mind 🔴 — REBUILDING
- Cards show "undefined" (field name mismatch)
- Graph tab doesn't switch
- **Full rebuild dispatched** — 5 tabs (Search/Browse/Graph/Reader/Insights)

### Rooms 🟡 — SHELL
- 4 rooms with agent emojis
- Messages are fake, agent responses are simulated delays
- **Needs:** Real agent dispatch integration

### Missions 🟡 — SHELL  
- Hill chart + detail view look great
- All seed data
- **Needs:** goals.sh integration, real dispatch task counts

### Pipelines 🟡 — SHELL
- Kanban columns render
- All seed data
- **Needs:** Real dispatch queue/active/done/failed data

### Roles ✅ — WORKS (LOCAL)
- Capability editor, autonomy slider, domain tags
- Persists to localStorage
- **Needs:** Agent config file integration

### Records 🟡 — SHELL
- Universal browser with 6 tabs
- All seed data

### Briefing 🟡 — PARTIAL
- Auto-shows on login
- Mix of live + seed data

## Active Coders

| Label | Task | Status |
|-------|------|--------|
| coder-talk-proposals-fix | Fix Talk + Proposals | 🔄 Running |
| coder-mind-rebuild | 5-tab Mind page | 🔄 Running |
| coder-life-os-enhance | Life OS improvements | 🔄 Running |

## Priority Queue

1. **Talk + Proposals fix** (in progress)
2. **Mind rebuild** (in progress)
3. **Nav restructure** — group 15 items into 5 sections
4. **"Make it real" sprint** — wire Inbox/Rooms/Missions/Pipelines to real data
5. **Life OS ↔ Agent OS** cross-links (in progress)
6. **Design research** — deliver 10am UTC 2026-03-21

## Trajan's Requests Log

| # | Request | Status |
|---|---------|--------|
| 1 | Demo link | ✅ Done |
| 2 | Old home page | ✅ Done |
| 3 | Life OS rebuild | ✅ Done |
| 4 | Stream + Agent Presence + Omnibus | ✅ Done |
| 5 | Contextual panels + Briefing | ✅ Done |
| 6 | Records + Pipelines + Roles | ✅ Done |
| 7 | Task lifecycle visibility | ✅ Done |
| 8 | Talk fix | 🔄 In Progress |
| 9 | Proposals repair | 🔄 In Progress |
| 10 | Mind page rebuild | 🔄 In Progress |
| 11 | Nav restructure | 📋 Proposed |
| 12 | Connect everything | 🔄 Planning |
| 13 | Design references | ⏳ Deliver 10am tomorrow |
| 14 | Life OS enhance | 🔄 In Progress |
| 15 | Iterate continuously | 🔄 Active |
| 16 | Vault tracking note | ✅ Done (this file) |

## Nav Restructure (Proposed)

⚡ OPERATE: Stream, Inbox, Briefing
💬 COMMUNICATE: Talk, Rooms
🎯 DIRECT: Missions, Pipelines, Proposals
🧠 KNOW: Mind
⚙️ CONFIGURE: Roles, Records, System

## Status Update (2026-04-17 staleness review)

Frontend has grown significantly since the 2026-03-20 dogfood test. Now at **v136** (was ~v114 at time of test). Major additions since:
- **Mobile layout overhaul** (v130) — sidebar hidden, bottom nav, touch targets
- **Missions wired to real data** (v130) — API fetch, progress calc, hill chart
- **Talk page fixed** (v131) — demo fallback, channel switching, mobile drawer
- **Stream + Proposals mobile fixes** (v132-v136)
- **Bridge:** Agent Workbench API, SOUL.md CRUD, test runner, deep vault endpoints

> **⚠️ Confidence lowered to 0.60** — The dogfood test results above are a month old. Many "BROKEN" and "SHELL" items may have been addressed in v115-v136. A fresh dogfood test is needed to re-baseline status.

---
*Dogfood results from: 2026-03-20 09:35 UTC. Staleness review: 2026-04-17.*
