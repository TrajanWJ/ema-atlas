# LCM Summary sum_e6d3cb80d7c41fb5

Created: 2026-03-19 21:57:03
Kind: leaf
Depth: 0
Conversation: 617
Tokens: 1215
Descendants: 0
Earliest: 2026-03-19T21:44:07.000Z
Latest: 2026-03-19T21:47:44.000Z

## Content

[2026-03-19 21:44 UTC]
{
  "meta": {
    "description": "Dynamic agent-to-Discord routing table. Topics map to channels. Agents carry identity.",
    "fallback_channel": "1483010758408274027",
    "fallback_channel_name": "agent-feed"
  },
  "topics": {
    "alerts": { "channel": "1482256931375546489", "name": "alerts" },
    "monitoring": { "channel": "1482256931375546489", "name": "alerts" },
    "errors": { "channel": "1482547280325120076", "name": "error-log" },
    "logs": { "channel": "1482256984811114688", "name": "agent-logs" },
    "agent-logs": { "channel": "1482256984811114688", "name": "agent-logs" },
    "agent-feed": { "channel": "1483010758408274027", "name": "agent-feed" },
    "evolution": { "channel": "1483010759452790845", "name": "evolution-log" },
    "worklog": { "channel": "1482955597765935258", "name": "worklog" },
    "next-steps": { "channel": "1482295329041940481", "name": "next-steps" },
    "github": { "channel": "1482258431997116531", "name": "github-interesting" },
    "reddit": { "channel": "1482295358963974187", "name": "reddit-intel" },
    "links": { "channel": "1482256987700990066", "name": "links-and-reads" },
    "dashboard": { "channel": "1482256930465513544", "name": "dashboard" },
    "chat": { "channel": "1482230801859875020", "name": "chat" },
    "overview": { "channel": "1482955596755112117", "name": "overview" },
    "concierge": { "channel": "1482997518362214422", "name": "concierge" },
    "cron": { "channel": "1482547280325120076", "name": "error-log" },
    "standards": { "channel": "1482288239225208853", "name": "agent-standards" },
    "cool-discord": { "channel": "1482267436236668968", "name": "cool-discord" },
    "hn": { "channel": "1482256987700990066", "name": "links-and-reads" }
  },
  "agents": {
    "main":       { "emoji": "🤝", "name": "Right Hand",     "color": "#E8A838" },
    "researcher": { "emoji": "🔬", "name": "Researcher",     "color": "#2BA89E" },
    "coder":      { "emoji": "💻", "name": "Coder",          "color": "#57A773" },
    "ops":        { "emoji": "⚙️", "name": "Ops",            "color": "#6C7A89" },
    "security":   { "emoji": "🛡️", "name": "Security",       "color": "#E74C3C" },
    "vault-keeper": { "emoji": "📚", "name": "Vault Keeper", "color": "#9B59B6" },
    "browser-automation": { "emoji": "🔭", "name": "Scout",  "color": "#E67E22" },
    "prompt-engineer":    { "emoji": "🎯", "name": "Prompt Engineer", "color": "#3498DB" },
    "concierge":  { "emoji": "🛎️", "name": "Concierge",      "color": "#1ABC9C" },
    "devils-advocate": { "emoji": "😈", "name": "Devil's Advocate", "color": "#95A5A6" }
  }
}
---
---
title: "Session Management Deep Dive"
created: 2026-03-16
updated: 2026-03-16
type: architecture
status: active
confidence: 0.60
confidence_updated: 2026-03-18
source: architecture-doc
tags: [knowledge, openclaw, ops, prompts, research, security]
summary: "[[OpenClaw]] implements a sophisticated session management system with:"
---
# Session Management Deep Dive

**Date:** 2026-03-16
**Status:** Complete Research Report
**Sources:** [[OpenClaw]] documentation analysis, [[session architecture proposal]], [[anti-staleness strategy]]
**Research Scope:** Session lifecycle, context limits, LCM compaction, Discord channel routing, config optimization

## Overview

[[OpenClaw]] implements a sophisticated session management system with:
- **Deterministic routing** based on channel/peer identifiers
- **Per-session context isolation** with automatic compaction
- **Lossless Context Management (LCM)** for long-term conversation history
- **Flexible reset policies** (daily, idle, per-channel, per-type)
- **Cross-session state** via workspace files (MEMORY.md, daily notes, vault)

The key insight: **Sessions are isolated by design**. Rather than fighting this, we should optimize per-session behavior and leverage cross-session state mechanisms.

## Session Keys & Lifecycle

### How Session Keys Work
Session keys determine conversation isolation. Pattern examples:
- **Direct messages**: `agent:main:main` (default, all DMs share one session)
- **Discord channels**: `agent:main:discord:channel:<id>`
- **Discord threads**: `agent:main:discord:channel:<id>:thread:<threadId>`
- **Telegram groups**: `agent:main:telegram:group:<id>`
- **Forum topics**: `agent:main:discord:channel:<forumId>:thread:<threadId>`
- **Cron jobs**: `cron:<job.id>` (always fresh)

### Session Lifecycle Events
1. **Creation**: New sessionKey creates entry in `sessions.json` + fresh `<sessionId>.jsonl`
2. **Activity**: Updates `updatedAt` timestamp in session entry
3. **Reset**: Creates new sessionId, preserves sessionKey, archives old transcript
4. **Compaction**: Summarizes old context, keeps recent messages
5. **Cleanup**: Removes old entries/transcripts based on
[LCM fallback summary; truncated for context management]
