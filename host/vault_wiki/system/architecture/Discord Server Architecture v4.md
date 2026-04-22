---
title: Discord Server Architecture v4
created: '2026-03-18'
updated: '2026-03-18'
type: knowledge
status: active
confidence: 0.6
confidence_updated: 2026-03-18T00:00:00.000Z
source: architecture-doc
tags:
  - agent-feed
  - auto-delegator
  - chat
  - concierge
  - desk
  - evolution-log
  - general
  - github-interesting
  - ops
  - reddit-intel
  - trajans-office
  - vault-feed
  - worklog
summary: '1. **File-based dispatch is the engine, Discord is the dashboard**'
wiki_id: system/architecture/Discord_Server_Architecture_v4
imported_from: vault/Architecture/Discord Server Architecture v4.md
imported_at: '2026-04-04T00:23:56.740Z'
---
# Discord Server Architecture v4

**Updated:** 2026-03-18
**Status:** Live — post-consolidation (22 → 9 active channels)

---

## Design Philosophy

1. **File-based dispatch is the engine, Discord is the dashboard**
2. **Fewer channels, more focus** — dead channels archived, feeds merged
3. **Vault is truth** — Discord is working state, vault is what persists
4. **Right Hand is the voice** — all agent output flows through Right Hand

---

## Active Channels (9)

### Category: 💬 Active Conversations

| Channel | Type | ID | Purpose |
|---|---|---|---|
| **#general** | Forum | 1482948094869114931 | Active work threads |

### Category: 🎯 Trajan's Office

| Channel | Type | ID | Purpose | Session |
|---|---|---|---|---|
| **#desk** | Forum | 1482996866428964904 | Executive inbox | Persistent |
| **#chat** | Text | 1482230801859875020 | Live conversation | Persistent |
| **#trajans-office** | Text | 1482913511444320337 | Private 1-on-1 | Persistent |
| **#concierge** | Text | 1482997518362214422 | Personal requests | Persistent |

### Category: 🔧 System Buildout

| Channel | Type | ID | Purpose | Session |
|---|---|---|---|---|
| **#agent-feed** | Text | 1483010758408274027 | ALL agent activity, merged feeds | Write-only |
| **#auto-delegator** | Text | 1483643763346772099 | Dispatch visibility + orchestration | Write-only |

### Category: 🏛️ Command Center

| Channel | Type | ID | Purpose | Session |
|---|---|---|---|---|
| **#ops** | Forum | 1482899211811815536 | System ops, alerts, incidents | On-demand |

---

## Merged Into #agent-feed

These channels are archived. Their crons/feeds now post to #agent-feed:

| Former Channel | Was | Now |
|---|---|---|
| #worklog | Daily ops log | → #agent-feed |
| #vault-feed | Vault change notifications | → #agent-feed |
| #evolution-log | [[Self-learning]] events | → #agent-feed |
| #reddit-intel | Reddit research digest | → #agent-feed |
| #github-interesting | GitHub repo discoveries | → #agent-feed |

## Archived (Inactive)

All remaining channels from the legacy setup. Crons killed before archiving.

---

## Agent Routing

Right Hand is the only agent that posts. All specialist output flows through Right Hand's identity bar.

## Vault Integration

Discord is the working surface. Everything that matters flows into the vault:
- Decisions → `vault/Trajan/Decisions.md`
- Research → `vault/Research/`
- Project progress → `vault/Projects/`
- Preferences → `vault/Trajan/Preferences.md`

## Related

- [[Discord Server Architecture v4]]
- [[OpenClaw]]
- [[reddit-intel-deep-sweep-2026-03-18]]
