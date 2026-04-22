---
title: Discord Channel Architecture Review
created: '2026-03-19'
updated: '2026-03-19'
type: knowledge
status: active
confidence: 0.9
source: multi-agent-debate
tags:
  - discord
  - architecture
  - channels
  - restructure
  - concierge
summary: >-
  Final recommendation for Discord server restructure. 52 channels → 22 channels
  across 6 categories. Based on multi-agent debate (devil's advocate, architect,
  systems-thinker) in #concierge 2026-03-19.
wiki_id: system/Discord_Channel_Architecture_Review
imported_from: vault/System/Discord Channel Architecture Review.md
imported_at: '2026-04-04T00:23:57.223Z'
---
# Discord Channel Architecture Review

> Produced: 2026-03-19 02:19 UTC
> Method: Multi-agent debate (#concierge) — devil's advocate ✓, architect ✓ (retry), systems-thinker ✓ (retry)
> Spec file: `/home/trajan/projects/discord-restructure/SPEC.md`
> Status: **APPROVED — Implement pending**

---

## Summary

**Current state:** 52 channels across 10 categories — heavy fragmentation, dead channels, overlapping purposes.
**Target state:** 22 channels across 6 categories — consolidated, role-separated, webhook-driven.

---

## Current Server (52 channels, 10 categories) — What's Dead

### Active categories/channels
| Category | Active Channels |
|---|---|
| 🎯 Trajan's Office | #desk, #chat, #concierge, #decisions, #links-and-reads |
| 🏛️ Command Center | #projects, #research (forum) |
| 📡 Activity Feeds | #agent-feed, #alerts, #agent-logs, #error-log, #vault-feed |
| 🔧 System Buildout | #worklog, #tasks |

### Dead / Superseded
- `#general-forum` — unused since #desk exists
- `#chat` / `#trajans-office` — both superseded by #concierge
- `#next-steps` — never used as intended (superseded by #desk)
- `#meetings` — no meeting content; superseded by #desk threads
- `#field-reports` — superseded by #agent-feed
- `#evolution-log` — superseded by #agent-feed
- `#active`, `#output`, `#agent-log` (Agent Work category) — superseded
- `#priorities` — superseded by #desk tags
- `#auto-delegator` — superseded by #dispatch (new)
- 6× project-specific channels (#wilson-premier, #execudeck, etc.) — move to #projects forum
- 5× integrations channels (#email-calendar, #web-services, etc.) — move to #desk

---

## Recommended Structure (22 channels, 6 categories)

### 🛎️ BRIDGE — Your daily interface
| Channel | Type | Purpose |
|---|---|---|
| #concierge | Text | Command interface — talk to any agent, get results here |
| #📋-dispatch | Text | Issue commands; agents acknowledge with result links |
| #📢-daily-brief | Announcement | 07:00 UTC daily digest; subscribable |

### 🧠 COMMAND — Decisions and task tracking
| Channel | Type | Tags | Purpose |
|---|---|---|---|
| #🗂️-desk | Forum | 🔴 Critical, 🟡 Active, 🟢 Done, ⚫ Archived + per-agent | One thread per task |
| #⚖️-decisions | Forum | pending, decided, reversed | Decision log |
| #🧠-prompt-lab | Forum | draft, tested, deployed, soul, eval | Prompt engineering / SOUL.md edits |

### 📡 SIGNALS — Read-only intel feeds
| Channel | Type | Purpose |
|---|---|---|
| #📡-ingestor-feed | Announcement | Hourly Reddit/GitHub/HN intel; subscribable |
| #📦-vault-feed | Text | Vault writes and knowledge updates |
| #🔗-links | Text | Drop links for analysis |

### 🤖 AGENT WORK — Agent output streams (webhook-driven)
| Channel | Type | Webhook | Purpose |
|---|---|---|---|
| #🔬-research-feed | Text | "Researcher 🔬" | Researcher agent output |
| #💻-code-output | Text | "Coder 💻" | Coder builds, commits, results |
| #😈-devils-corner | Text | "Devil's Advocate 😈" | DA outputs, critiques, red-teaming |
| #🤖-agent-feed | Text | All agents | Live activity stream |

### 🔧 SYSTEM — Infrastructure and health
| Channel | Type | Purpose |
|---|---|---|
| #🫀-heartbeat | Announcement | Single pinned embed edited every 15min by ops; subscribable |
| #🚨-alerts | Text | CRITICAL ONLY. Muting = blind. |
| #🔒-security | Text | Security agent output via named webhook |
| #⚙️-ops-log | Text | Cron runs, dispatch cycles — mute it |
| #📜-raw-logs | Text | Black box — everything unfiltered, never cut |
| #💬-agent-status | Voice | Status: N tasks running, last agent, next cron |

### 🚀 PROJECTS — All project work in threads
| Channel | Type | Tags | Purpose |
|---|---|---|---|
| #🚀-projects | Forum | per-project + phase-0/1/2, build, review, blocked | One thread per project |

---

## What Gets Deleted (30 channels)

```
#general-forum, #chat, #trajans-office, #tasks, #archived-tasks,
#overview, #worklog, #agent-logs, #field-reports, #evolution-log,
#active, #output, #agent-log, #next-steps, #meetings, #ops-forum,
#research-forum, #priorities, #auto-delegator, #wilson-premier,
#execudeck, #xpressdrop, #truks, #letmescale, #dispohub,
#email-calendar, #integrations-overview, #web-services,
#providers-models, #vm-access
```

Categories deleted: 💬 Active Conversations, 🔧 System Buildout, 🔌 Integrations & Services, 🤖 Agent Work (old), 🚀 Active Projects, 🏛️ Command Center, 🎯 Trajan's Office, 📡 Activity Feeds

---

## What the Devil's Advocate Preserved

The DA input pushed back against pure minimalism. Specifically:

- **`#📜-raw-logs` stays** — looks redundant next to #ops-log, but it's the black box recorder. Critical for debugging issues that ops-log doesn't capture.
- **`#😈-devils-corner` is new** — having a dedicated channel for DA output means critiques aren't lost in #agent-feed noise.
- **Forum tags over separate channels** — DA argued for consolidating 6 project channels + 5 integration channels into #desk tags instead of keeping them as channels, reducing visual clutter while preserving organization.
- **Heartbeat as Announcement** — subscribable; people outside the server can track system health.

---

## Implementation Plan

Spec: `/home/trajan/projects/discord-restructure/SPEC.md`
Trajan approved: 2026-03-19 02:19 UTC ("Implement")

**Order of operations:**
1. Create 6 new categories
2. Create new channels in new categories
3. Rename/move existing channels
4. Set topics, create forum tags
5. Delete old channels (empty first)
6. Delete old empty categories
7. Create agent webhooks → save to `~/dispatch/webhooks.json`
8. Create voice channel
9. Write `~/bin/ops-heartbeat.sh` + add to cron (`*/15 * * * *`)
10. Write `~/bin/discord-dispatch-watcher.sh` + add to cron (60s poll)
11. Update `ingestor.py` to post to #📡-ingestor-feed via webhook
12. Post "restructure complete" to #concierge

---

## Webhooks to Create

| Agent | Channel | Webhook Name |
|---|---|---|
| researcher | #🔬-research-feed | "Researcher 🔬" |
| coder | #💻-code-output | "Coder 💻" |
| devil's-advocate | #😈-devils-corner | "Devil's Advocate 😈" |
| vault-keeper | #📦-vault-feed | "Vault Keeper 📦" |
| security | #🔒-security | "Security 🔒" |
| ingestor | #📡-ingestor-feed | "Ingestor 📡" |

---

## Related

- [[Discord Server Map]]
- [[Dispatch Architecture Review]]
- `/home/trajan/projects/discord-restructure/SPEC.md`
