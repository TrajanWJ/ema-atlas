---
title: EMA Session Summary — Start Here
type: overview
status: active
created: 2026-04-03T23:00Z
updated: 2026-04-03T23:00Z
author: Right Hand
tags: [summary, quick-reference, action-items, blockers]
---

# EMA Session Summary — Start Here

**Session:** 2026-04-03 (Evening) — From "design Phase 2" to "fix + understand EMA"
**Status:** Discovery + synthesis complete. Ready for action.

---

## What Happened This Evening

We didn't design more. We **ground-truthed EMA**, discovered what's real vs designed, identified all blockers, and created a complete system map with actionable next steps.

**9 documents created (110KB total):**
- System discovery audit (19KB)
- Master synthesis + build plan (24KB)
- Trajan-network architecture (16KB)
- Complete app specs (31KB)
- [5 others from earlier]

---

## The One Thing You Need to Know

**EMA is 70% foundation, 30% gaps.**

### What's Working
✅ Execution loop (proposal → dispatch → result)
✅ Vault integration (filesystem canonical)
✅ 52 virtual apps configured
✅ WebSocket broadcast running
✅ Honcho + Superman architecture designed

### What's Broken
🔴 Tauri app can't auto-start (connection fails)
🔴 OpenClaw VPS services down (oauth-guardian + gateway)
🔴 Proposal dispatch still manual (not automated)
🔴 Superman indexing not running (no semantic search)

### What Exists Only as Design
⏳ 9/14 apps (shells only, no backend wiring)
⏳ 0/7 integrations (GitHub, Discord, etc. not connected)
⏳ MCP servers (3 designed, none wired)
⏳ P2P Trajan-network (design phase only)

---

## 4 Critical Blockers (Fix First)

### 1. Tauri Daemon Auto-Start (BLOCKING EVERY DEMO)
**Problem:** App launches, tries to connect to daemon, fails with "Connection failed"
**Root cause:** TBD (race condition? wrong RPC path? daemon not spawning?)
**Fix time:** 2-3 hours (once root cause identified)
**Priority:** 🔴 CRITICAL
**Next action:** Code audit of daemon spawn path + RPC initialization

### 2. OpenClaw VPS Services Down (BLOCKING ALL AGENT DISPATCH)
**Problem:** oauth-guardian and gateway not responding
**Impact:** Can't dispatch agents through OpenClaw
**Fix time:** 15 minutes (restart services)
**Priority:** 🔴 CRITICAL
**Next action:** SSH to VPS → systemctl restart oauth-guardian openclaw-gateway

### 3. Proposal Dispatch Still Manual (BLOCKING AUTOMATION)
**Problem:** Approval doesn't auto-route to agents
**Design says:** It's wired. Code audit says: It's still manual.
**Fix time:** 2-4 hours (trace code, wire event, test)
**Priority:** 🟡 HIGH
**Next action:** Trace one proposal through codebase end-to-end

### 4. Superman Indexing Not Running (BLOCKING WEEK 8 SEMANTIC SEARCH)
**Problem:** Vault not indexed, no embeddings, no semantic search
**Impact:** Wiki app can't do similarity search
**Fix time:** 2-3 hours (audit pipeline) or 1 sprint (build if missing)
**Priority:** 🟡 HIGH
**Next action:** Check Superman module for embedding pipeline + index files

---

## 5 Critical Week 7 Tasks (Make System Real)

**These are the 5 things that unlock everything:**

1. **Honcho Docker setup** (1h)
   - `docker run -d -p 8000:8000 plasticlabs/honcho:latest`
   - Wire into dispatcher (context injection)
   - Test one dispatch with Honcho active

2. **GET /api/projects/:id/context endpoint** (2h)
   - Returns: project, repo, deployment, executions, proposals, intent_threads, notes
   - This is the single wire that makes HQ real

3. **HQ project switcher + live dashboard** (3h)
   - Top bar project pill → command palette
   - Select project → full dashboard repaint
   - Real data from /api/projects/:id/context
   - WebSocket updates for live execution feed

4. **Campaign Flow Topology** (Backend-4)
   - Create Ema.Campaigns.Flow struct
   - Add run_id, steps, edges
   - Wire step status updates
   - Create DispatchBoard data query

5. **Dispatch Board UI** (Frontend-2)
   - Live task cards from executions:all WebSocket
   - Campaign flow view toggle
   - Status dots, timers, expand/collapse
   - Retry + edit buttons

**After these 5:** HQ shows real data. Real agent activity visible. System is demo-ready.

---

## Complete Agent Delegation Plan

**Start immediately (no dependencies):**
- Infra-1: Fix Tauri auto-start
- Infra-2: Restart OpenClaw VPS
- Research-1: Superman indexing audit

**Week 7 (run in parallel):**
- Backend-1: Project context API
- Backend-2: Honcho Docker setup
- Backend-3: Deliberation Gate (structural task routing)
- Backend-4: Campaign Flow Topology
- Frontend-1: HQ project switcher + live dashboard
- Frontend-2: Dispatch Board UI

**Week 8 (after Week 7):**
- Wiki-1: Superman semantic indexing
- Integration-1: GitHub OAuth + webhooks
- Integration-2: Discord bot + channel routing

---

## Decision Points (Trajan Decides)

**Before building, answer these:**

1. **Fix Tauri or work around?**
   - A: Fix it (Recommend) → enables Windows/Mac demo
   - B: Document manual start → slower path
   - C: Build web UI only → long term

2. **Honcho: deploy or stub?**
   - A: Deploy real (Recommend) → Phase 2 priority
   - B: Stub forever → low ROI without context
   - C: Build local replacement → more work

3. **Superman: semantic or text-only?**
   - A: Semantic (Recommend) → high leverage
   - B: Text-only now → Phase 3
   - C: Skip → vault becomes dumb storage

4. **Which 3 integrations first?**
   - Tier 1: GitHub, Discord, Slack
   - Tier 2: Google Drive, API Providers, VPS
   - Recommend: GitHub + Discord + Slack (highest ROI)

5. **P2P now or later?**
   - A: Hub-and-spoke now (Recommend) → Phase A only
   - B: P2P from day one → adds complexity
   - C: Defer to Phase B → simplest path
   - Recommend: Phase A is hub-and-spoke. Phase B adds P2P.

---

## Quick Navigation

| Question | Answer | File |
|---|---|---|
| **What's the complete system map?** | 6 layers: peers, execution loop, 14 apps, 7 integrations, Superman, HQ | `EMA-HQ-MASTER-SYNTHESIS-2026-04-03.md` |
| **What are the blockers?** | 4 critical (Tauri, VPS, dispatch, Superman) | This document + Master Synthesis |
| **What are the agent delegations?** | 9 agents, 3 immediate + 6 Week 7 + 2 Week 8 | `EMA-HQ-MASTER-SYNTHESIS-2026-04-03.md` (The Complete Agent Delegation Plan section) |
| **What's the execution loop?** | Capture → Cluster → Propose → Approve → Dispatch → Execute → Harvest → Learn | `EMA-HQ-MASTER-SYNTHESIS-2026-04-03.md` (Layer 2) |
| **What are all 14 apps?** | Dashboard, BrainDump, Tasks, Projects, Proposals, Agents, Wiki, Canvas, Habits, Journal, Focus, Pipes, Channels, Integrations Manager | `EMA-Unified-Spec-With-Integrations.md` or Master Synthesis |
| **What's the 3-peer architecture?** | EMA hub (4488) + OpenClaw gateway (18789) + Host (future) | `Trajan-Network-Architecture.md` |
| **How do HQ + EMA connect?** | HQ is browser UI. Reads from EMA REST API + WebSocket. One API call per project switch. One repaint. | Master Synthesis (Layer 6 - HQ) |
| **What are the 7 integrations?** | GitHub, Discord, Slack, Google Drive, API Providers, VPS/Servers, cross-linking | Master Synthesis (Layer 4) |
| **When is P2P/Trajan-network built?** | Phase B (Week 9+). Phase A is hub-and-spoke only. | `Trajan-Network-Architecture.md` |

---

## The Timeline

**Today/Tomorrow:** Fix Tauri auto-start + restart OpenClaw VPS (2-4 hours)
**This week:** 5 critical Week 7 tasks (Honcho, API, HQ, Campaign, Dispatch Board)
**By Friday:** System is demo-ready (HQ shows real EMA data with real agent activity)
**Week 8:** Add 9 remaining apps, semantic search, integrations
**Week 9+:** P2P Trajan-network, full multi-machine support

---

## The Single Most Important Thing

After Tauri is fixed and VPS is restarted:

**Build the /api/projects/:id/context endpoint.**

This single API call assembles EMA's entire knowledge about a project. Wire HQ to use it. Switch to different projects. Watch the dashboard repaint with real data.

That's when you know the system is real.

---

## Files to Read (Priority Order)

1. **This file** (5 min) — You're reading it
2. **EMA-HQ-MASTER-SYNTHESIS-2026-04-03.md** (15 min) — Complete system map + action plan
3. **EMA-SYSTEM-DISCOVERY-AUDIT.md** (10 min) — What's real vs designed, blockers detailed
4. **EMA-Unified-Spec-With-Integrations.md** (30 min) — All 14 apps + 7 integrations
5. **Trajan-Network-Architecture.md** (15 min) — 3-peer topology + phases

Total reading time: 75 minutes to full clarity.

---

## What Happens Next (Your Call)

**Option A: Read master synthesis + fix Tauri + start Week 7 tasks**
- Timeline: 1 week to demo-ready system
- Outcome: HQ + EMA fully integrated, real data visible

**Option B: Run brainstorm sessions first (Sessions 2-7)**
- Timeline: 1 week of design, 1 week of build
- Outcome: Deeper confidence, dependency map, risk register, integration priorities

**Recommendation:** Start with blockers (Tauri + VPS) immediately. Run Session 2 (Implementation Sequencing) in parallel. Begin Week 7 tasks by Tuesday.

---

## Contact

**For blockers:** DM or `/approve` the Tauri + VPS fixes.
**For sessions:** Reply with which session to spawn first (recommend Session 2).
**For clarification:** Ask in Discord #agent-os-frontend channel.

---

**Everything is documented. The system is understood. Build can begin.** 🚀
