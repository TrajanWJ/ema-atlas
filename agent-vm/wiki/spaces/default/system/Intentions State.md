---
title: "Intentions State"
type: system-state
status: active
created: 2026-04-04
updated: 2026-04-04
tags: [intent, state, backfill, wiki, superman, openclaw, claude, codex]
summary: "Backfilled working intentions state aggregated from wiki intents, legacy registry, OpenClaw sessions, Claude history, and Codex history."
---

# Intentions State

_Generated 2026-04-04T18:06:16.589248+00:00_

This is the current recovered intent layer. It seeds [[Superman-Runtime-Architecture]] and the wiki intent graph with backfilled evidence from old wiki/vault material plus local message/session histories.

## Snapshot

- Total recovered records: **1100**
- Current wiki intent pages: **4**
- Unique source kinds: **7**
- Dominant domains: **general (750), code (157), vault (94), prompt (61), ops (25)**
- Dominant routed agents: **coder (644), vault-keeper (229), prompt-engineer (78), ops (63), concierge (29)**

## Current Canonical Wiki Intents

- [[Wiki as Agent Memory Layer Intent]] — status: **active**, priority: **medium**, project: **Wiki**
- [[Wiki ↔ EMA Integration Intent]] — status: **active**, priority: **high**, project: **Wiki**
- [[Wiki ↔ Superman Integration Intent]] — status: **active**, priority: **high**, project: **Wiki**
- [[Wiki — Core System Intent]] — status: **active**, priority: **high**, project: **Wiki**

## Recovered High-Signal Intent Records

| Title | Domain | Agent | Confidence | Source | Timestamp |
|---|---|---|---:|---|---|
| SEED STARVATION HARDENING 2026 04 04 # Seed Starvation Hardening — 2026-04-04 ## What failed - active: true - schedule: null - run_count: 0… | code | concierge | 0.625 | local_markdown_resource | 2026-04-04T17:43:20.033739+00:00 |
| EMA REPO REALITY CHECK 2026 04 04 # EMA Repo Reality Check — 2026-04-04 ## Bottom line The live repo at /home/trajan/Projects/ema is **much… | code | coder | 0.75 | local_markdown_resource | 2026-04-04T17:33:33.007942+00:00 |
| Explore the OpenClaw project at /home/trajan. | ops | ops | 0.667 | claude_project | 2026-04-04T06:37:54.653Z |
| Start openclaw now, test it with cli, make sure he is responding and alive in discord | code | coder | 1.0 | claude_project | 2026-04-04T06:27:42.472Z |
| learnings ### 2026-04-04 / ema-brain-backend-sessions-20260404 / ❌ FAILED - **Lesson:** Task failed with exit code 0. | code | coder | 1.0 | local_markdown_resource | 2026-04-04T03:37:01.804424+00:00 |
| PROPOSAL USER INPUT AND DESK SPEC # Proposal User Input + Desk Surface Spec **Status:** READY FOR IMPLEMENTATION ## What This Solves 1. | code | coder | 0.647 | local_markdown_resource | 2026-04-04T03:26:38.907735+00:00 |
| CODER EMA FIXES RESULT # EMA Critical Fixes — Result Report ## FIX 1: Bridge Activation — ai_backend: :bridge **Status:** ✅ ALREADY DONE — … | code | coder | 0.7 | local_markdown_resource | 2026-04-04T03:15:45.524730+00:00 |
| W7 B3 BRIDGE ASYNC RESULT # W7-B3 Bridge Async Dispatch — Result **Status: DONE_WITH_CONCERNS** ## Summary ## What Was Done ### 1. | code | coder | 0.615 | local_markdown_resource | 2026-04-04T02:48:58.520611+00:00 |
| EMA INTENT FARMING AND FRONTEND DESIGN # EMA Intent Farming + Enhanced Frontend Design **Status:** Build-ready spec **Scope:** Intent farmi… | code | coder | 0.611 | local_markdown_resource | 2026-04-04T01:48:39.653108+00:00 |
| reapir openclaw discord setup so we can contniue work on EMA, revive all olst sessiosn and nudege all dsicord channels | code | coder | 1.0 | codex_history | 2026-04-04T01:37:20+00:00 |
| Add a Wiki app view to agent-os-v8 frontend (Lit Web Components). | code | coder | 0.978 | openclaw_session | 2026-04-04T01:19:12.070Z |
| Fix Campaign schema state mismatch and build Superman.context_for/2 fallback for EMA on the host machine. | code | coder | 1.0 | openclaw_session | 2026-04-04T01:16:16.322Z |
| Add semantic search to the wiki engine using Ollama (already installed). | code | coder | 0.867 | openclaw_session | 2026-04-04T01:13:13.224Z |
| Create the wiki's own intention notes and key system pages. | code | vault-keeper | 0.7 | openclaw_session | 2026-04-04T01:12:13.579Z |
| PHASE 1 CONTINUE — Two tasks, scoped tight. | code | coder | 0.889 | openclaw_session | 2026-04-04T01:11:22.734Z |
| Build the /api/projects/:id/context endpoint for EMA on the host machine. | code | coder | 0.892 | openclaw_session | 2026-04-04T01:06:06.425Z |
| Build Week 7 Day 1 EMA features on the host machine (FerrissesWheel). | code | coder | 0.884 | openclaw_session | 2026-04-04T01:05:44.938Z |
| PHASE 1 RESUME — Pick up where previous coder left off. | code | coder | 0.667 | openclaw_session | 2026-04-04T01:05:23.801Z |
| Fix confirmed bugs in the EMA Elixir/Phoenix daemon on the host machine (FerrissesWheel). | code | coder | 0.765 | openclaw_session | 2026-04-04T01:04:37.548Z |
| **Continue EMA CLI build — fix slug lookup + finish remaining commands** Previous run made progress but timed out. | code | coder | 0.625 | openclaw_session | 2026-04-04T00:23:54.112Z |
| **Continue EMA CLI build — fix slug lookup + finish remaining commands** Previous run made progress but timed out. | code | coder | 0.625 | codex_session | 2026-04-04T00:23:54.112Z |
| put in both anthrpic accounts in order, and check if either has no rate limit right now, and get the whole syystem back up and runn8ing nud… | security | security | 1.0 | codex_history | 2026-04-04T00:07:11+00:00 |
| Coder agent back online. | code | coder | 1.0 | openclaw_session | 2026-04-04T00:05:32.460Z |
| test openclaw tui for verfication and make sure wehn rate limits stop claude is made the primary one again | code | coder | 0.7 | codex_history | 2026-04-03T23:58:02+00:00 |
| yes make it fallback, and once either of my claude accounts get un ratelimited have it seamlessly go back to that | security | security | 1.0 | codex_history | 2026-04-03T23:53:27+00:00 |

## Source Coverage

| Source | Count |
|---|---:|
| claude_project | 484 |
| codex_history | 8 |
| codex_session | 13 |
| local_markdown_resource | 285 |
| openclaw_session | 305 |
| vault_registry | 1 |
| wiki_intent | 4 |

## Local Resource Documents Pulled In

- Total matched local markdown resources: **285**

| Resource | Updated |
|---|---|
| AGENT-OS-EMA-INTEGRATION | 2026-04-03T23:10:12.803379+00:00 |
| AGENT_DISPATCH_PLAYBOOK | 2026-04-04T17:34:11.187356+00:00 |
| CODER-EMA-FIXES-RESULT | 2026-04-04T03:15:45.524730+00:00 |
| CUSTOM-TOOLING-ROADMAP | 2026-04-03T22:39:50.299759+00:00 |
| EMA-AGENT-OS-CROSS-POLLINATION-2026-04-04 | 2026-04-04T00:21:14.721214+00:00 |
| EMA-BABYSITTER-SIGNAL-FIRST-NEXT-ROUND-BRIEF | 2026-04-04T18:00:50.268932+00:00 |
| EMA-BABYSITTER-SURFACE-GOVERNOR-IMPLEMENTATION-BRIEF | 2026-04-04T17:57:10.709077+00:00 |
| EMA-CLI-SPECIFICATION | 2026-04-03T22:36:40.943669+00:00 |
| EMA-CONTRADICTIONS-2026-04-04 | 2026-04-04T00:40:26.722428+00:00 |
| EMA-INTENT-FARMING-AND-FRONTEND-DESIGN | 2026-04-04T01:48:39.653108+00:00 |
| EMA-P2P-SSH-DISTRIBUTED-AI-DESIGN | 2026-04-04T01:07:00.853694+00:00 |
| EMA-REPO-REALITY-CHECK-2026-04-04 | 2026-04-04T17:33:33.007942+00:00 |
| EMA-SYSTEM-DISCOVERY-AND-CLARIFICATION | 2026-04-03T21:39:24.532340+00:00 |
| EMA_HEARTBEAT | 2026-04-03T10:37:32.637153+00:00 |
| EMA_PASSOVER_PROMPT | 2026-04-03T21:13:12.913181+00:00 |
| MEMORY | 2026-04-04T01:14:48.286187+00:00 |
| OPENCLAW-EMA-SYSTEM-MARRIAGE-DESIGN | 2026-04-03T22:21:23.978256+00:00 |
| PROPOSAL-USER-INPUT-AND-DESK-SPEC | 2026-04-04T03:26:38.907735+00:00 |
| REMOTE-DISPATCH-INTEGRATION | 2026-04-04T01:12:24.926814+00:00 |
| ROADMAP_SYNTHESIS | 2026-04-03T21:59:00.382841+00:00 |

## Current Focus Extracted for Agents

- **EMA execution** (score 5711.259) — 2026 04 04 # Daily Memory — 2026-04-04 ## EMA Sprint — Session Summary ### What shipped tonight (commits landed on main) | 693b05e | Test s…; EMA BABYSITTER SIGNAL FIRST NEXT ROUND BRIEF # EMA Babysitter Signal-First Next Round Brief ## Objective Reduce noise from the engine and i…
- **Dispatch & bridge** (score 3835.998) — 2026 04 04 # Daily Memory — 2026-04-04 ## EMA Sprint — Session Summary ### What shipped tonight (commits landed on main) | 693b05e | Test s…; EMA BABYSITTER SIGNAL FIRST NEXT ROUND BRIEF # EMA Babysitter Signal-First Next Round Brief ## Objective Reduce noise from the engine and i…
- **MCP / integrations** (score 2584.943) — 2026 04 04 # Daily Memory — 2026-04-04 ## EMA Sprint — Session Summary ### What shipped tonight (commits landed on main) | 693b05e | Test s…; Babysitter Stream Master Guide # Plan: Babysitter + Stream-of-Consciousness + Tick Spec Master Guide ## Overview This document consolidates…
- **Discord / channel ops** (score 2472.871) — 2026 04 04 # Daily Memory — 2026-04-04 ## EMA Sprint — Session Summary ### What shipped tonight (commits landed on main) | 693b05e | Test s…; EMA BABYSITTER SIGNAL FIRST NEXT ROUND BRIEF # EMA Babysitter Signal-First Next Round Brief ## Objective Reduce noise from the engine and i…
- **Wiki memory layer** (score 1856.185) — 2026 04 04 # Daily Memory — 2026-04-04 ## EMA Sprint — Session Summary ### What shipped tonight (commits landed on main) | 693b05e | Test s…; EMA BABYSITTER SURFACE GOVERNOR IMPLEMENTATION BRIEF # EMA Babysitter Surface Governor — Implementation Brief ## Goal - semantic lanes for …

## Notes

- Direct Discord API backfill is **not** yet wired into this local builder. This pass recovers Discord-originating asks through OpenClaw session mirrors plus existing intent/wiki artifacts.
- The state is now **less lossy** than the first pass: records preserve structured text and code/inline snippets instead of collapsing everything into one flat line before storage.
- The current state is intentionally conservative: it preserves canonical wiki intent pages and uses recovered session/message text as evidence, not automatic truth overwrite.
- Raw machine-readable output lives in `system/intent-state/` next to this page.

## Files

- `system/intent-state/intent-state.json` — aggregate state
- `system/intent-state/intent-records.jsonl` — raw recovered records
- `system/intent-state/source-manifest.json` — coverage + source map
- [[Intent Backfill Infrastructure]] — runbook and architecture

