---
title: "desk-pitches-2026-03-16"
created: 2026-03-16
updated: 2026-03-16
type: project
status: active
confidence: 0.60
confidence_updated: 2026-03-18
source: project
tags: [desk, tasks]
summary: "1. Backup crontab to vault after every change: `crontab -l > ~/vault/Configuration/crontab-backup.md`"
---
# Desk Pitches — Morning of March 16, 2026 (v2)

> Prepared overnight, iterated with research findings. Each pitch = direction + plan + research backing.
> Pick what resonates, ignore what doesn't. Everything is ready to execute.
> **v2 updates:** Session architecture added as new #1, research citations added, priorities rebalanced.

---

## 🔴 NEW — Pitch 0: Session Architecture Redesign

**Problem:** 96 active sessions, each with independent context. Feed channels waste tokens. Cross-channel context is siloed.

**Already done:**
- ✅ Session config updated: daily reset at 4AM + maintenance enforcement (14d prune, 300 max)
- ✅ Full proposal: `vault/Architecture/Session Architecture Proposal.md`
- ✅ [[OpenClaw]] docs researched — `resetByChannel`, `sendPolicy`, LCM compaction are the levers

**Next:** Feed channels become write-only. Cross-session state via MEMORY.md + vault. Evaluate LCM compaction.

**Impact:** Cleaner context, less waste, sharper conversations.
**Effort:** Behavioral changes immediate. Config tuning 1 hour.

---

## ✅ Pitch 1: Usage Optimization & Double Capacity — ALREADY WORKING

**Status:** Two OAuth API accounts are already linked and active. session_status only shows one, but actual capacity is 2x what's displayed.

**What's done:**
- Both accounts linked ✅
- LCM summarization on backup ✅
- Dual capacity available ✅

**Remaining optimization:**
- Route subagent spawns explicitly to backup account where possible
- Set up failover logic (when one hits rate limit, auto-swap)
- Add usage-aware routing to Right Hand (prefer backup for Sonnet tasks)
- Update pace tracking to reflect combined capacity

**Impact:** Already unlocked. Stop over-throttling based on single-account metrics.

**Effort:** 1 hour for failover logic. Otherwise this is done.

---

## 🔴 Pitch 2: Cron Persistence & Reliability

**Problem:** 16 cron jobs exist but they're fragile:
- `openclaw doctor --fix` wipes runtime crons (happened twice)
- 3 crons have never produced logs (morning-briefing, overnight-digest, vault-janitor)
- `auto-knowledge-gated` was broken for 14+ hours (fixed tonight)
- No monitoring of cron health — failures are silent

**Solution:**
1. Backup crontab to vault after every change: `crontab -l > ~/vault/Configuration/crontab-backup.md`
2. Create a cron health monitor script that checks last-run timestamps
3. Add cron health to the system-watchdog checks
4. Test all 16 crons manually, fix the 3 that never ran

**Impact:** No more silent failures. Crons self-heal or alert.

**Effort:** 1-2 hours.

---

## 🟡 Pitch 3: Executive Functioning Dashboard

**Problem:** Trajan's biggest need is executive functioning help. Currently:
- Tasks scattered across Discord forums, vault files, loose-ends.md
- No single view of "what needs doing"
- No prioritization framework
- Morning briefing exists but doesn't synthesize actionable next-steps

**Solution:** Build a daily executive dashboard that:
1. Pulls from all task sources (Discord #tasks, vault/Projects/, loose-ends.md)
2. Auto-prioritizes by urgency + impact
3. Shows: Today's top 3, This week's goals, Blocked items, New opportunities
4. Posts to #desk every morning at 9AM EST
5. Interactive — Trajan can react to accept/defer/kill items

**Impact:** This is THE feature for Trajan's stated #1 need. Everything else is plumbing.

**Effort:** 3-4 hours to build properly. Uses existing cron infrastructure.

---

## 🟡 Pitch 4: Account & Service Integrations (Email + Calendar)

**Problem:** System Goal #1 from Trajan's roadmap. Zero progress so far.
- No email access (can't read inbox, send emails, manage client comms)
- No calendar integration (can't schedule, remind, track meetings)
- [[Wilson Premier Properties]] client exists but no tools to manage relationship

**Solution — Phase 1 (Email):**
1. Set up IMAP reader for Trajan's email (read-only first)
2. Daily email digest — surface important emails, summarize, suggest actions
3. Draft responses for review
4. MCP server for email access (check if one exists on ClawHub)

**Solution — Phase 2 (Calendar):**
1. Google Calendar API or CalDAV integration
2. Daily schedule briefing in morning dashboard
3. Meeting prep agent — before meetings, compile relevant context from vault

**Impact:** Transforms the system from "AI assistant for AI infrastructure" to "AI assistant for life." This is what makes it practical for the digital nomad goal.

**Effort:** 4-6 hours for Phase 1. Needs Trajan's email credentials.

---

## 🟡 Pitch 5: Revenue & Client Management System

**Problem:** Trajan has one client ([[Wilson Premier Properties]]), failed cold outreach, no structure for revenue generation. The agent system is powerful but not pointed at making money yet.

**Solution:**
1. Create vault section: `vault/Business/` — client profiles, pipeline, outreach templates
2. Build outreach agent — researches leads, drafts personalized emails, tracks responses
3. Client management — track deliverables, deadlines, communications for WPP
4. Revenue tracking — simple dashboard of income, hours, pipeline value
5. Research: what services can Trajan offer with his AI stack? (AI consulting, automation setup, agent development)

**Impact:** Directly addresses "has no money right now" + "digital nomad lifestyle" goals.

**Effort:** 2-3 hours for vault structure + templates. Ongoing for outreach automation.

---

## 🔵 Pitch 6: Agent Skill Consolidation

**Problem:** 38 skills installed but several overlap:
- `agent-factory` + `agent-forge` (if it exists) — both create agents
- `evolution-loop` + `feedback-loop` — parallel pipelines doing similar things
- `claude-usage-check` + `claude-usage-checker` — literally duplicates
- Devil's Advocate review graded system B- overall

**Solution:**
1. Merge duplicate skills (factory/forge, usage-check/checker)
2. Clarify boundaries between [[evolution-loop]] and feedback-loop
3. Run Devil's Advocate review on all 38 skills
4. Archive skills with <3.0 quality score
5. Document the cleaned skill library in vault

**Impact:** Cleaner system, less confusion for agents, faster skill loading.

**Effort:** 2 hours.

---

## 🔵 Pitch 7: Host Machine Integration Expansion

**Problem:** Bridge is working (SSH + shared folder + host-claude). But potential is untapped.
- Can't access Trajan's projects proactively
- No automated project health checks on host
- Host vault (Obsidian) and VM vault are separate — no cross-pollination

**Solution:**
1. Auto-index host projects: `host-project-index.sh` runs daily, results in vault
2. Host health dashboard — disk, running services, project git status
3. Vault bridge — when VM vault learns something relevant to host vault, sync it
4. Project watcher — notify when host projects have uncommitted changes, failing builds

**Impact:** VM becomes aware of Trajan's full environment, not just its own bubble.

**Effort:** 2-3 hours.

---

## 🔵 Pitch 8: Overnight Worker Automation

**Problem:** Tonight proved the concept — Trajan goes to sleep, system keeps working. But it's manual:
- Had to explicitly request "night mode"
- Had to tell agents what to do
- No automatic task queue

**Solution:**
1. Create overnight-worker mode: auto-activates at midnight EST
2. Pulls tasks from a backlog queue (Discord #tasks + vault/Projects/)
3. Self-assigns work based on priority and usage budget
4. Morning report summarizes everything completed
5. Desk pitches generated automatically
6. Usage-aware — throttles when approaching limits

**Impact:** System works 24/7 without prompting. The ultimate "asynchronous progression."

**Effort:** 3-4 hours. Builds on existing cron + agent infrastructure.

---

*Pitches sorted by color: 🔴 Do first (quick wins) → 🟡 High impact (need input) → 🔵 Nice to have (can wait)*
*Each pitch is ready to execute. Just say "do pitch 3" and I'll start.*

## Related

- [[2026-03-16_0827_🌅]]
- [[Morning]]
- [[Pitches]]
- [[—]]
- [[desk]]
