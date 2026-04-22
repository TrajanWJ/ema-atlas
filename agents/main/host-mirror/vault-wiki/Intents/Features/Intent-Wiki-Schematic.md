---
title: "Intent Wiki Schematic"
intent_level: 3
intent_kind: feature
intent_status: implementing
intent_priority: 1
project: ema
parent: "[[Agent-Collaboration]]"
tags: ["feature", "intents", "wiki", "schematic"]
---

# Intent Wiki Schematic

Intents as navigable wiki pages. The wiki IS the intent schematic.

## What
Every intent is a markdown page in vault/wiki/Intents/ with frontmatter fields (intent_level, intent_kind, intent_status). VaultWatcher parses these and syncs to DB intents. Agents and human navigate the same wiki surface.

## Why
Current intent system has three disconnected representations (DB, .superman, vault projection). No collaborative surface exists. Making intents wiki pages unifies them into one navigable, annotatable, agent-writable surface.

## Design
See `docs/superpowers/specs/2026-04-06-wiki-intent-schematic-design.md`

## Status
- Wiki directory structure: created
- Seed pages: created
- VaultWatcher enhancement: in progress
- Populator enhancement: in progress
- Frontend wiki browser: not started

## Related
- [[depends-on::Actor-Workspace]] -- agents need workspace identity to write wiki pages
- [[related::Second-Brain]] -- VaultWatcher and GraphBuilder are the sync infrastructure
