---
title: Discord Server Architecture v3
created: '2026-03-16'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.6
confidence_updated: 2026-03-18T00:00:00.000Z
source: architecture-doc
tags:
  - E8A838
  - agent-feed
  - agent-logs
  - agent-standards
  - alerts
  - archived-tasks
  - chat
  - concierge
  - cool-discord
  - dashboard
  - decisions
  - desk
  - discord-meta-chat
  - error-log
  - evolution-log
  - field-reports
  - general
  - github-interesting
  - interviewer
  - links-and-reads
  - meetings
  - next-steps
  - openclaw-setup
  - ops
  - overview
  - projects
  - reddit-intel
  - research
  - tasks
  - trajans-office
  - worklog
summary: >-
  This server is a **living project management system**, not a chat server.
  Every channel exists because work flows through it. Every category maps to s
wiki_id: system/architecture/Discord_Server_Architecture_v3
imported_from: vault/Architecture/Discord Server Architecture v3.md
imported_at: '2026-04-04T00:23:56.740Z'
---
# Discord Server Architecture v3

**Updated:** 2026-03-16 08:06 UTC
**Status:** Live — this doc reflects what actually exists

---

## Design Philosophy

This server is a **living project management system**, not a chat server. Every channel exists because work flows through it. Every category maps to something real. Dead weight gets archived, not tolerated.

Core principles:
1. **Small active surface** — fewer channels, more forum threads
2. **Projects have lifecycles** — born as forum posts, promoted to categories, archived when done
3. **Vault is truth** — Discord is the working state, vault is what persists
4. **Right Hand is the voice** — all agent output flows through Right Hand
5. **No branding theater** — clean, functional, no corporate cosplay

---

## Server Structure (Actual)

### Category: 💬 Active Conversations
General-purpose work area. Forum threads for ongoing agent work.

| Channel | Type | ID | Purpose |
|---|---|---|---|
| **#general** | Forum | 1482948094869114931 | Active conversations. Agents spawn threads here. Tags: lifecycle + agent attribution |

### Category: 🎯 Trajan's Office
Trajan's personal space. Right Hand is primary responder.

| Channel | Type | ID | Purpose |
|---|---|---|---|
| **#desk** | Forum | 1482996866428964904 | Executive inbox. Agents post important/pressing items. Tags: urgency + agent |
| **#chat** | Text | 1482230801859875020 | Live conversation with Right Hand |
| **#decisions** | Forum | 1482939106223853740 | Decision log. One thread per decision → vault |
| **#trajans-office** | Text | 1482913511444320337 | Private 1-on-1 with Right Hand. Long form. |
| **#concierge** | Text | 1482997518362214422 | Personal concierge channel |
| **General** | Voice | 1482230801859875021 | Voice channel |

### Category: 🔧 System Buildout (Project)
Promoted project — the multi-agent system buildout.

| Channel | Type | ID | Purpose |
|---|---|---|---|
| **#overview** | Text | 1482955596755112117 | Project overview and direction |
| **#tasks** | Forum | 1482955597388321009 | Work items for the buildout |
| **#worklog** | Text | 1482955597765935258 | Daily auto-posts, ops log, briefings |
| **#archived-tasks** | Forum | 1482973388816384021 | Completed/abandoned tasks |
| **#agent-feed** | Text | 1483010758408274027 | Live agent activity stream |
| **#evolution-log** | Text | 1483010759452790845 | [[Self-learning]] events, evolution proposals |

### Category: 🏛️ Command Center
Forums for structured work by domain.

| Channel | Type | ID | Purpose |
|---|---|---|---|
| **#ops** | Forum | 1482899211811815536 | System ops, alerts, incidents |
| **#projects** | Forum | 1482899212889751745 | Coding projects, builds, architecture |
| **#research** | Forum | 1482899213917360171 | Research findings, evaluations |
| **#meetings** | Forum | 1482600849158045979 | Multi-agent meetings and collaboration |

### Category: 📦 Archive (Legacy)
Channels from initial setup. Most are inactive. Candidates for cleanup.

| Channel | Type | ID | Status |
|---|---|---|---|
| **#field-reports** | Forum | 1482899506457743400 | Low activity |
| **#dashboard** | Text | 1482256930465513544 | Legacy, archived |
| **#alerts** | Text | 1482256931375546489 | Inactive |
| **#next-steps** | Text | 1482295329041940481 | Occasional use |
| **#reddit-intel** | Text | 1482295358963974187 | Inactive |
| **#discord-meta-chat** | Text | 1482255830286860351 | Inactive |
| **#interviewer** | Text | 1482284691007471810 | Onboarding done |
| **#github-interesting** | Text | 1482258431997120076 | Auto-disabled by pace gate |
| **#cool-discord** | Text | 1482267436236668968 | Inactive |
| **#[[OpenClaw]]-setup** | Text | 1482257016050421810 | Inactive |
| **#agent-standards** | Text | 1482288239225208853 | Inactive |
| **#agent-logs** | Text | 1482256984811114688 | Active (bot sessions) |
| **#links-and-reads** | Text | 1482256987700990066 | Inactive |
| **#error-log** | Text | 1482547280325120076 | Occasional |

---

## Forum Tags (Shared)

All forums use lifecycle tags:
- 💡 Idea · 🔨 Active · 👀 Review · ✅ Done · ❌ Dropped · ⏸ Blocked

#desk adds urgency tags:
- 🔴 Urgent · 📋 Action Needed · 📊 Status Update · 💡 Suggestion · ⚠ Alert · ✅ Resolved

#general and #desk add agent attribution tags:
- 🤝 Right Hand · 🔬 Researcher · 💻 Coder · ⚙ Ops · 🛡 Security · 📚 Vault Keeper

---

## Agent Routing

Right Hand is the only agent that posts to Discord. All specialist output flows through Right Hand's identity bar.

| Surface | Who Posts | Format |
|---|---|---|
| Any channel | Right Hand | Components v2 with #E8A838 accent |
| Agent dispatch | Right Hand | Dispatch line: `📡 → 💻 Coder ⏳ · task` |
| Agent results | Right Hand | Source attribution: `📡 ← 🔬 Researcher ✅` |
| #agent-feed | Right Hand | Live dispatch/result stream |
| #evolution-log | Right Hand | [[Evolution signals]] and mutations |
| #worklog | Right Hand | Daily briefings, cron results |

---

## Cleanup Candidates

The Archive category has 14 channels, most inactive. Consider:
- Deleting truly dead channels (#cool-discord, #agent-standards, #discord-meta-chat)
- Merging #alerts into #ops forum
- Merging #field-reports into #worklog or #general
- Keeping #agent-logs ([[Claude Code Bot]] uses it)

## Related

- [[Design Decisions]]
- [[README]]
