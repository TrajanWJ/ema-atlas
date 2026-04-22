---
title: "README"
created: 2026-03-16
updated: 2026-03-16
type: system
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: system
tags: [name]
summary: "Each file stores context for a specific channel/surface. Agents read these to understand what a channel is for, who works there, and what's been happe"
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
