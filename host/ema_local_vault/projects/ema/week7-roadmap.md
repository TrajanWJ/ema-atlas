---
id: "60f8d744-279b-485c-8bc1-39bf086bad42"
title: "EMA Week 7 Execution Roadmap"
space: projects
tags: ["ema"]
source: manual
---

# WEEK 7 EXECUTION ROADMAP — EMA Phase 2

> **Generated:** 2026-04-03 22:36 UTC  
> **Horizon:** W7 (Fri 2026-04-04 → Thu 2026-04-10)  
> **North Star:** Ship HQ as a real interface. Clear all 5 blockers before W8 parallel tracks begin.  
> **Confidence:** 0.92 — synthesized from RISK-FALLBACK-MATRIX, ROADMAP_SYNTHESIS, SESSION_CONTRADICTIONS, discord-slack-integration, honcho-scope-advisor  

---

## PART 1 — MASTER BLOCKER ROADMAP

### The 5 Blockers at a Glance

| ID | Blocker | Domain | W7 Must Ship? | Has Fallback? | Critical Path? |
|----|---------|--------|:---:|:---:|:---:|
| **B1** | Honcho decision | Architecture | ❌ Decision only | ✅ LocalFallback | No |
| **B2** | Campaign.Flow state machine | Elixir/Backend | ✅ YES | ✅ Null stub | **YES** |
| **B3** | Bridge async dispatch | Elixir/Backend | ✅ YES | ✅ Timeout stopgap | **YES** |
| **B4** | Superman.context_for | Elixir/Backend | ❌ W9 work | ✅ Flat vector | No |
| **B5** | Vault indexing | Infrastructure | ❌ W9 setup | ✅ pgvector | No |

> **Note on reported scope:** VPS health (confirmed healthy — no action needed). Tauri auto-start (dropped from W7 — works in dev, awaiting Tauri testing). These are monitoring items, not active blockers.

---

### Dependency Map

```
DECISIONS (pre-code)
  └── B1: Honcho decision ──────────────────► W8 Task H (Honcho Integration)
                                              W9 Reflexion Injection
                                              W9 User Modeling

W7 CRITICAL PATH
  B2: Campaign.Flow ──────────────────────► Task A: /api/projects/:id/context ──► Dispatch Board ──► HQ Live
        (2h)                                   (3-4h)                                 (1-2d)

  B3: Bridge Async ───────────────────────► OpenClaw → EMA dispatch ──► System Marriage (Phase 4)
        (3h + tests)                           All 6 callsites migrated

W9 SETUP (design now, build W9)
  B5: Vault Indexing ─────────────────────► B4: Superman.context_for ──► Agent context injection ──► KG Browser (W11)
        (4-8h, W9)                              (8h, W9)
```

### Critical Path vs. Nice-to-Have

**Must Ship W7 (blocks everything downstream):**
1. `Campaign.Flow` struct + state machine (B2) — blocks Task A, Dispatch Board, HQ
2. Bridge async dispatch (B3) — blocks all OpenClaw→EMA work, system marriage
3. `/api/projects/:id/context` endpoint — the single endpoint making HQ real
4. Prompts table + hot-reload setup — unlocks SOUL.md Editor in W10

**Decision Required This Week (not code):**
- B1 Honcho decision (recommended: skip W7, LocalFallback in W8)
- B5 vector store choice (recommended: pgvector on existing Postgres)
- Tauri auto-start option (recommended: Option A — daemon-first)

**Deferred to W9 (design now, build then):**
- B4: Superman.context_for engine
- B5: Vault indexing infrastructure
- Reflection Loop, Execution Audit Trail

**Nice-to-Have in W7 (if time allows):**
- Scope Advisor (outcome-aware warnings) — can slip to W8 Day 1
- Deliberation Gate — W8 Day 1-2 is fine

---

## PART 2 — WEEK 7 EXECUTION PLAN

### Priority Order (non-negotiable)
```
1. Campaign.Flow (B2)         ← FIRST, 2h, unlocks critical path
2. Context endpoint (Task A)  ← SECOND, 3-4h, makes HQ real
3. Dispatch Board             ← THIRD, depends on A+B2
4. Bridge Async (B3)          ← FOURTH, can run in parallel with Dispatch Board
5. Prompts table + hot-reload ← FIFTH, W7 setup for W10 SOUL.md Editor
6. Scope Advisor              ← SIXTH, if W7 has space, else W8 Day 1
7. Deliberation Gate          ← W8 Day 1-2 (intentionally deferred)
```

### Agent Assignments (5 Agents, Parallel Execution)

W7 runs 5 agents in parallel. Right Hand orchestrates. Max concurrent = 5 (within VM limits).

| Agent | Track | Tasks | Days |
|-------|-------|-------|------|
| **Coder-1** | Backend critical path | Campaign.Flow (B2) → Context endpoint (Task A) → HQ wiring | Fri–Tue |
| **Coder-2** | Bridge async | Bridge.spawn_async/3 → callsite migrations (all 6) → full test suite | Sat–Mon |
| **Coder-3** | Frontend / Dispatch Board | Dispatch Board UI → live task table → campaign status widgets | Sun–Mon |
| **Coder-4** | Prompts + Scope Advisor | Prompts table migration → hot-reload daemon → Scope Advisor GenServer | Tue–Wed |
| **Architect** | Design + W9 prep | `/api/projects/:id/context` schema → Superman folder spec → W9 pre-work docs | Fri + Thu |

**Parallelism rules:**
- Coder-1 and Coder-2 can run simultaneously from Day 2 (Saturday)
- Coder-3 starts only after Campaign.Flow ships (blocks Dispatch Board)
- Coder-4 is independent — can run any time from Day 4 (Tuesday)
- Architect runs Day 1 (spec work) then re-engages Day 7 (W9 prep)
- If any Coder stalls: Right Hand re-tasks from idle pool. Max 3 retry loops before escalating to Trajan.

**Dispatch pattern:** Parallel where subtasks are independent. Sequential where output feeds next stage (B2 → Task A → Dispatch Board). Coder-2 and Coder-3 run in parallel once B2 ships.

### Superman Folder Structure (D4 Decision — Canonical)

Superman indexes per-project context from `.superman/` folders, not flat `.superman` files.

```
<project_root>/
└── .superman/
    ├── identity.md          # Core project identity (who/what/why)
    ├── intents/             # Active work streams — one .md per intent
    │   ├── 001-auth-migration.md
    │   └── 002-multi-tenant.md
    ├── constraints.md       # Hard rules agents must never violate
    ├── context.md           # Background knowledge, non-obvious facts
    ├── relationships.md     # External deps, integrations, team context
    └── assets/              # Rich reference material
        ├── architecture.png
        └── db-schema.pdf
```

**Reading priority (Superman.FileReader):**
1. If `.superman/` folder exists → read folder tree
2. Else if `.superman` flat file exists → read legacy format (backwards compat)
3. Else → fall back to vault `.md` indexing for this project

**Intent file format (intents/*.md):**
```markdown
---
id: 001-auth-migration
status: active          # active | paused | done
priority: 0.9
created: 2026-04-04
---

# Auth System Migration

Replace Devise with custom JWT. Context: API tokens were causing conflicts with Devise's session model.

## Success Criteria
- All existing tests pass
- New JWT flow works for web + API clients
- No regression in billing module (see constraints.md)
```

**Implementation note:** `superman-architecture.md` `.superman` flat file format is deprecated by this decision. Superman.FileReader will be refactored in W9 to read folder structure. The `parse/1` flat-file function stays in as `parse_legacy/1` for backwards compatibility.

### HQ as Main App — Note

HQ is the primary interface for EMA. It is not one of the 39+ routable apps — it IS the app shell. HQ wraps all other views and provides the project-switcher, navigation rail, and global state. All 39 routable apps are sections within HQ, not standalone apps.

**Implications for W7:**
- "Wire HQ to real data" means: HQ's project switcher and dashboard summary use `/api/projects/:id/context` as the data source
- The goal is NOT to wire all 39 sub-apps — just the HQ shell (switcher, summary cards, Dispatch Board preview)
- Full sub-app wiring is W8 work
- W7 success criterion: open HQ → switch projects → see real campaign status and task count (not null/mock)

---

### Day-by-Day Timeline

```
WEEK 7 CALENDAR (Fri Apr 4 → Thu Apr 10)

┌────────────────┬──────────────────────────────────────────────────────────────────────┐
│ Day            │ Work                                                                  │
├────────────────┼──────────────────────────────────────────────────────────────────────┤
│ FRI Apr 4      │ DECISION DAY + B2 START                                               │
│                │ • [Trajan] Make 3 decisions (Honcho, vector store, Tauri) — 30min     │
│                │ • [Coder] Write Campaigns.Flow struct + 4-state machine — 2h          │
│                │ • [Coder] Write Flow tests: all transitions valid — 1h                │
│                │ • [Architect] Design /api/projects/:id/context response schema — 1h  │
│                │ 🎯 End state: B2 shipped, decisions documented, Task A specced       │
├────────────────┼──────────────────────────────────────────────────────────────────────┤
│ SAT Apr 5      │ TASK A (CONTEXT ENDPOINT) + BRIDGE ASYNC START                        │
│                │ • [Coder] Build /api/projects/:id/context — 3-4h                      │
│                │   - Aggregates: task count, proposal status, campaign state (B2)      │
│                │   - Returns active_campaign (now real, not null)                      │
│                │ • [Coder] Identify + list all 6 Bridge callsites — 30min              │
│                │ • [Coder] Write Bridge.spawn_async/3 skeleton + unit test — 1h        │
│                │ 🎯 End state: Task A shipped, Bridge async in progress                │
├────────────────┼──────────────────────────────────────────────────────────────────────┤
│ SUN Apr 6      │ DISPATCH BOARD + BRIDGE ASYNC COMPLETE                                │
│                │ • [Coder] Complete Bridge.spawn_async/3 — 2h                          │
│                │   - Integration test: callback fires within expected timeframe         │
│                │   - Regression tests: 6 callsites produce same output in async mode   │
│                │ • [Coder] Migrate first 2 callsites to async — 1h                    │
│                │ • [Coder] Begin Dispatch Board (live task table) — 2h                 │
│                │ 🎯 End state: B3 core shipped, Dispatch Board started                │
├────────────────┼──────────────────────────────────────────────────────────────────────┤
│ MON Apr 7      │ DISPATCH BOARD COMPLETE + REMAINING CALLSITE MIGRATIONS               │
│                │ • [Coder] Complete Dispatch Board — 3-4h                              │
│                │   - Live task table (polling or Phoenix Channels)                     │
│                │   - Campaign status from B2                                           │
│                │   - Elapsed time per task                                             │
│                │ • [Coder] Migrate remaining 4 Bridge callsites — 1h                  │
│                │ • [Coder] Full Bridge async test suite: timeout, failure, retry — 1h  │
│                │ 🎯 End state: B3 DONE, Dispatch Board ships                          │
├────────────────┼──────────────────────────────────────────────────────────────────────┤
│ TUE Apr 8      │ HQ WIRING + PROMPTS TABLE                                             │
│                │ • [Coder] Wire HQ to real context endpoint — 2h                       │
│                │   - Replace all mock data with /api/projects/:id/context              │
│                │   - Test: open HQ, switch project, see real data                     │
│                │ • [Coder] Prompts table schema + migration — 1h                       │
│                │   - columns: id, version, kind, content, a_b_test_group, metrics     │
│                │ • [Coder] Hot-reload in daemon — 1h                                   │
│                │ 🎯 End state: HQ shows live data, prompts table ready                │
├────────────────┼──────────────────────────────────────────────────────────────────────┤
│ WED Apr 9      │ SCOPE ADVISOR + BUFFER                                                │
│                │ • [Coder] Scope Advisor — 2-3h                                        │
│                │   - Reads outcome_tracker.json                                        │
│                │   - Warns on known failure patterns before task dispatch              │
│                │   - Integrates with Dispatch Board                                   │
│                │ • [Trajan] Review: W7 exit checklist pass/fail                       │
│                │ • [Buffer] Fix any regressions from Bridge async migration            │
│                │ 🎯 End state: Scope Advisor shipped, W7 checklist review done        │
├────────────────┼──────────────────────────────────────────────────────────────────────┤
│ THU Apr 10     │ HARDENING + W8 PREP                                                   │
│                │ • [Coder] Fix any W7 regressions                                      │
│                │ • [Coder] Begin Deliberation Gate (carry into W8 Day 1) — optional    │
│                │ • [Architect] W9 pre-work: document .superman file format             │
│                │ • [Trajan] Final W7 verification: run full exit checklist             │
│                │ 🎯 End state: W7 shipped, W8 tracks ready to run in parallel         │
└────────────────┴──────────────────────────────────────────────────────────────────────┘
```

---

### Go/No-Go Criteria Per Task

| Task | Go Criteria | No-Go Trigger | Fallback |
|------|------------|---------------|---------|
| **Campaign.Flow (B2)** | `mix test test/ema/campaigns/flow_test.exs` passes | Ecto migration fails | String-based `status` field, no state machine |
| **Context endpoint (Task A)** | `curl /api/projects/:id/context` returns 200 + real fields | DB query timeout | Return stub with `active_campaign: null` + note |
| **Bridge Async (B3)** | Unit test: `spawn_async/3` returns immediately; regression: 6 callsites pass | Any callsite regression | Revert that callsite to sync, continue with others |
| **Dispatch Board** | Open EMA → tasks visible with real data, elapsed time showing | Phoenix Channel disconnects | Polling fallback (5s poll instead of WS push) |
| **Prompts table** | Migration runs clean; `mix ema.prompts.list` returns rows | Schema conflict with existing tables | Defer to W8 Day 1 |
| **Scope Advisor** | Warning fires for known bad pattern in test | False positive rate >10% | Disable warnings for that pattern type |

---

## PART 3 — RISK REGISTER

### Top 3 Risks for W7 Launch

---

**🔴 RISK 1: Bridge Async Migration Introduces Regressions**

| Field | Detail |
|-------|--------|
| **Likelihood** | Medium (6 callsites, non-trivial refactor) |
| **Impact** | High — broken dispatch pipeline = nothing works |
| **Mitigation** | TDD: write tests before touching any callsite. New `spawn_async/3` is additive — never delete `send_message/2` until all callsites pass. Migrate one callsite per commit. |
| **Fallback if realized** | Git-revert each broken callsite. Worst case: ship Bridge async as new function only, migrate callsites in W8. Add 30s timeout to all sync calls as stopgap. OpenClaw sessions won't freeze indefinitely. |
| **Early warning** | `mix test` fails on any existing test after a callsite migration commit |

---

**🟡 RISK 2: Campaign.Flow Ecto Migration Conflicts**

| Field | Detail |
|-------|--------|
| **Likelihood** | Low-Medium (campaigns table exists, adding struct layer) |
| **Impact** | High — blocks Task A, Dispatch Board, all campaign data in HQ |
| **Mitigation** | Campaign.Flow is pure Elixir struct (no migration needed). If a DB column `status` is added for persistence, it's `ALTER TABLE campaigns ADD COLUMN status VARCHAR(32) DEFAULT 'forming'` — no destructive changes. |
| **Fallback if realized** | Skip Flow struct, use plain `status` string in campaigns table. Update via `Ema.Campaigns.update_status/2`. Implement proper Flow struct in W8. Task A ships with string-based campaign status (still real data). |
| **Early warning** | `mix ecto.migrate` outputs errors on Day 1 |

---

**🟡 RISK 3: HQ Real-Time Wiring Reveals Hidden Data Model Gaps**

| Field | Detail |
|-------|--------|
| **Likelihood** | Medium (39+ apps, 60 Zustand stores — complexity is higher than expected) |
| **Impact** | Medium — HQ "real data" goal slips to W8 |
| **Mitigation** | Focus on ONE project's context first (StudioKamel). Prove the `/api/projects/:id/context` flow end-to-end before touching other stores. Don't try to wire all 39 apps at once. |
| **Fallback if realized** | HQ shows real data for ONE project by W7 end. Full HQ wiring slides to W8 Day 3-5 (already in W8 roadmap). This is a scope trim, not a failure. |
| **Early warning** | Task A endpoint returns 200 but HQ store doesn't render — indicates store mismatch, not API gap |

---

## PART 4 — DECISION POINTS

> All decisions needed **before Coder starts coding Friday April 4**.  
> Trajan: these are the only 4 things that need your input. Everything else Coder handles autonomously.

### Decision Table

| # | Decision | Options | Recommendation | Why | ETA to Decide |
|---|----------|---------|---------------|-----|--------------|
| **D1** | Honcho strategy | A) Managed v3 ($0.04/run) · B) Self-host v2 Docker · C) Skip, LocalFallback | ✅ **DECIDED: C — Skip W7, LocalFallback in W8** | Phase 2 timeline is tight. LocalFallback (Postgres-backed reflexion store) gives 80% of the value at 0% of the integration cost. Evaluate managed v3 after W9 data exists to justify the cost. | **DONE** |
| **D2** | Vault vector store | A) pgvector (existing Postgres + `CREATE EXTENSION vector`) · B) sqlite-vss (new file) | ✅ **DECIDED: A — pgvector on existing Postgres** | EMA already runs Postgres. One command: `CREATE EXTENSION vector`. No new deps, no new failure modes. sqlite-vss is faster but adds operational complexity for marginal gain. | **DONE** |
| **D3** | Tauri auto-start | A) Daemon-first (start EMA daemon before Tauri, Tauri connects on port :4488) · B) Tauri-managed (Tauri spawns daemon as sidecar process) · C) System service (launchctl/systemd, daemon always running) | ✅ **DECIDED: A — Daemon-first** | Works in dev already. No Tauri changes needed for W7. Tauri sidecar (Option B) is the long-term goal but requires Tauri-side work that's not on the W7 critical path. System service (C) is overkill for now. | **DONE** |
| **D4** | Superman folder structure | A) Flat `.superman` file (custom keyword format) · B) `.superman/` folder (asset-rich, structured) · C) Index `.md` files directly | ✅ **DECIDED: B — Asset-rich `.superman/` folder** | Flat file format too rigid for rich context. Folder structure enables versioned intents, embedded assets, and richer semantic indexing. `.md` fallback still used when no `.superman/` folder exists. | **DONE** |

### Decision Recording

✅ All decisions documented in `SESSION_CONTRADICTIONS_AND_RESOLUTIONS.md` (Section 11) and `MASTER-DECISIONS-LOG.md`.

Full rationale, alternatives considered, and downstream impacts are captured in both docs. See those files for complete audit trail.

---

## PART 5 — SLACK MIRROR WINDOW (Bonus)

### Feasibility Assessment

EMA has a complete Discord + Slack integration spec (`discord-slack-integration.md`). The architecture is designed (Nostrum bot for Discord, Elixir HTTP client for Slack, shared `EMA.Channels.Platform` behaviour). The question is purely timing.

### What Would Ship

**Minimum Slack Mirror (the core 20% that gives 80% of value):**

| Component | Effort | Depends on |
|-----------|--------|-----------|
| Slack OAuth callback + token storage | 2h | Nothing |
| `EMA.Channels.Slack.Client` (post_message, add_reaction) | 2h | OAuth token |
| 3 slash commands: `/ema status`, `/ema task create`, `/ema proposal list` | 3h | Context endpoint (Task A) |
| Webhook ingress: `POST /api/slack/events` + signature verification | 1h | Nothing |
| Block Kit formatter for execution + proposal embeds | 2h | Nothing |
| Channel routing: send execution results to #ema-executions | 1h | Slack client |

**Total:** ~11h of focused work. Could realistically ship in W7 if Days 6-7 have buffer.

### W7 vs W8 Recommendation

**Verdict: W8 "ship", not W7**

Rationale:
1. W7 must land Campaign.Flow + Bridge Async + HQ wiring. Those are non-negotiable. Slack on top of that risks pushing bridge async into "we'll do it properly later" territory — which is the worst outcome.
2. Slack doesn't unblock anything in W8 or W9. It's value-add, not infrastructure.
3. W8 has 4 parallel tracks (Dashboard, Proposal Explorer, Vault Auto-Sync, EMA CLI). Slack fits as a **5th track** — spawn a second Coder agent to run it in parallel with those 4.

**If W7 ends early (by Wed Apr 9):** Start Slack OAuth + client. Hand off to W8 Coder as warm work-in-progress. Don't try to ship it in W7.

### W8 Slack Execution Plan

```
W8 Track 5: Slack Mirror (parallel with Tracks 1-4)
  Day 1: OAuth flow + token storage + Slack client
  Day 2: Slash commands (/ema status, task, proposal)
  Day 3: Webhook ingress + Block Kit formatters
  Day 4: Channel routing (executions → #ema-executions, proposals → #ema-proposals)
  Done: Full parity with Discord core commands
```

### Slack Bot Commands (Final Design)

```
/ema status              → System state embed
/ema task create <title> → Create task, returns confirmation
/ema task list           → Table of active tasks  
/ema proposal list       → Pending proposals with ✅/❌ buttons
/ema proposal approve    → Approve with reason
/ema execute <prompt>    → Trigger Claude agent run
/ema brain <text>        → Quick BrainDump capture
```

**Webhook design:** Single endpoint `POST /api/slack/events` handles all incoming (slash commands, button clicks, reactions). Signature verified via `EMA_SLACK_SIGNING_SECRET`. Events normalized to `EMA.Event` structs and broadcast via Phoenix.PubSub — identical to Discord flow.

---

## PART 6 — W7 EXIT CHECKLIST

Run this before declaring W7 done.

```
INFRASTRUCTURE
[ ] bridge-sync healthy: cat ~/shared/.heartbeat < 120s old
[ ] EMA daemon compiles: mix compile — 0 errors
[ ] No new test failures (baseline: 10 known failures, no new ones)

BLOCKERS RESOLVED
[ ] B1 Honcho: Decision documented in SESSION_CONTRADICTIONS_AND_RESOLUTIONS.md
[ ] B2 Campaign.Flow: mix test test/ema/campaigns/flow_test.exs — passes
[ ] B3 Bridge Async: Unit test — spawn_async/3 returns immediately (no blocking)
[ ] B3 Bridge Async: Regression — all 6 callsites produce same output
[ ] B4+B5: .superman format decided, pgvector approach documented

W7 FEATURES
[ ] curl http://localhost:4488/api/projects/TEST_ID/context → 200 + real data
[ ] Open EMA → Dispatch Board → tasks visible with elapsed time
[ ] HQ project switcher shows real campaign status (not null)
[ ] Prompts table: mix ema.prompts.list returns rows
[ ] Scope Advisor: test warning fires for known bad pattern

DECISIONS
[ ] D1 Honcho choice documented
[ ] D2 Vector store choice documented
[ ] D3 Tauri auto-start approach documented
[ ] D4 Superman file format documented
```

---

## QUICK REFERENCE — THE NORTH STAR

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WEEK 7 IN ONE TABLE                               │
├────────────────────┬──────────┬──────────┬────────────┬─────────────┤
│ What               │ Day      │ Owner    │ Effort     │ Blocks      │
├────────────────────┼──────────┼──────────┼────────────┼─────────────┤
│ 4 Decisions (D1-4) │ Fri AM   │ Trajan   │ 65 min     │ Everything  │
│ Campaign.Flow (B2) │ Fri      │ Coder    │ 3h (+ test)│ Task A, HQ  │
│ Context endpoint   │ Sat      │ Coder    │ 3-4h       │ HQ, Dispatch│
│ Bridge Async (B3)  │ Sat-Mon  │ Coder    │ 3h + tests │ Dispatch,   │
│                    │          │          │            │ OpenClaw    │
│ Dispatch Board     │ Sun-Mon  │ Coder    │ 1-2d       │ HQ          │
│ HQ wiring          │ Tue      │ Coder    │ 2h         │ "HQ is real"│
│ Prompts table      │ Tue      │ Coder    │ 2h         │ W10 SOUL.md │
│ Scope Advisor      │ Wed      │ Coder    │ 2-3h       │ W8 quality  │
│ Deliberation Gate  │ Thu/W8   │ Coder    │ deferred   │ W8 Track E  │
├────────────────────┼──────────┼──────────┼────────────┼─────────────┤
│ W7 EXIT            │ Thu      │ Trajan   │ 20 min     │ W8 launch   │
└────────────────────┴──────────┴──────────┴────────────┴─────────────┘

PRIORITY ORDER: Campaign.Flow → Context Endpoint → Bridge Async → 
                Dispatch Board → HQ Wiring → Prompts Table → Scope Advisor

CRITICAL PATH: B2 → Task A → Dispatch Board → HQ Live

W7 SUCCESS = "Open HQ, switch to any project, see real live data."
```

---

*Synthesized 2026-04-03 22:36 UTC by synthesis-strategist from: RISK-FALLBACK-MATRIX-2026-04-03.md, ROADMAP_SYNTHESIS.md, FEATURE_PRIORITY_MATRIX.md, SESSION_CONTRADICTIONS_AND_RESOLUTIONS.md, honcho-scope-advisor.md, discord-slack-integration.md, CONTINUE-2026-04-03-RESUME-PLAN.md*
