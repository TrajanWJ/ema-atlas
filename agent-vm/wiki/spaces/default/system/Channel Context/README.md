---
title: README
created: '2026-03-16'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: system
tags:
  - name
summary: >-
  Each file stores context for a specific channel/surface. Agents read these to
  understand what a channel is for, who works there, and what's been happe
wiki_id: system/Channel_Context/README
imported_from: vault/System/Channel Context/README.md
imported_at: '2026-04-04T00:23:57.219Z'
---
# Channel Context — Per-Channel Metaprompt Data

Each file stores context for a specific channel/surface. Agents read these to understand what a channel is for, who works there, and what's been happening.

## Format
```yaml
channel: #name
id: discord_id
category: parent_category
purpose: what this channel is for
primary_agent: who handles this channel
recent_topics: what's been discussed lately
active_projects: linked projects
metaprompt: special instructions for this channel
```

## Auto-Updated
Right Hand updates these after significant conversations. Heartbeats refresh stale entries.

## Related

- [[README]]

## Related
- [[Discord Architecture]] — channel structure design
- [[Standing Instructions]] — Trajan's preferences for channels
