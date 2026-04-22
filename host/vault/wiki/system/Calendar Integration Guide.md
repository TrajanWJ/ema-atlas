---
title: Calendar Integration Guide
created: '2026-03-18'
updated: '2026-03-18'
type: integration
status: active
confidence: 0.6
source: 'agent:main'
summary: >-
  Setup guide for Google Calendar integration — event reading, creation,
  reminders, conflict detection
tags:
  - integrations
  - calendar
  - google
  - oauth
  - executive-functioning
wiki_id: system/Calendar_Integration_Guide
imported_from: vault/System/Calendar Integration Guide.md
imported_at: '2026-04-04T00:23:57.218Z'
---
# Calendar Integration Guide

## Current State
- No calendar integration on agent-vm
- Daily briefing exists but has no schedule awareness
- Executive functioning dashboard needs calendar context

## Setup
Shares OAuth credentials with Gmail — same Google Cloud project, same MCP server.
If Gmail is configured first, Calendar comes free.

### Additional Calendar API Capabilities
- **Read events** — Today's agenda, upcoming week, specific date ranges
- **Create events** — Schedule meetings, block focus time, set reminders
- **Conflict detection** — Check availability before scheduling
- **Recurring events** — Set up routines (weekly reviews, daily standups)
- **Reminders** — Push reminders via Discord before events

## Agent Use Cases

### Morning Briefing Enhancement
Current briefing has no schedule context. With Calendar:
```
Good morning Trajan. Today you have:
- 10:00 AM — Call with Wilson Premier (prep notes in vault)
- 2:00 PM — Free block (suggested: work on LetMeScale)
- No conflicts. 6 hours of deep work available.
```

### Auto-Scheduling
- "Schedule a call with Wilson next week" → agent finds open slots, creates event
- Conflict detection prevents double-booking
- Timezone-aware for digital nomad lifestyle

### Routine Tracking
- Weekly review sessions
- Daily planning blocks
- Client check-in cadence

### Proactive Alerts
- 15-min Discord reminder before events
- "You have a call in 30 min — here's the prep notes from vault"
- End-of-day summary: "You completed 3/5 scheduled items"

## Priority
Tier 1 — same as Gmail. Shares OAuth setup, minimal incremental effort once Google Cloud project exists.

## Related
- [[Gmail Integration Guide]]
- [[Aspirational Integrations]]
- [[Schedule & Routines]]
- [[Goals & Aspirations]]
