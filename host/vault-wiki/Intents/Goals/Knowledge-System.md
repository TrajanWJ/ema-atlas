---
title: "Knowledge System"
intent_level: 1
intent_kind: goal
intent_status: implementing
intent_priority: 1
project: ema
parent: "[[Personal-AI-OS]]"
capabilities: [intent, plan]
tags: ["goal", "wiki", "knowledge"]
---

# Knowledge System

Unified wiki as EMA's knowledge engine. Wikipedia-grade rendering of 1,368 vault pages. Intent schematic as control plane. Dynamic context assembly through wiki pages.

## Children
- [[Wiki-Engine]] — MediaWiki-grade rendering of vault pages
- [[Intent-Control-Plane]] — Schematic that steers EMA when edited
- [[Context-Through-Wiki]] — Replace 6 context sources with wiki page traversal
- [[Code-Wiki-Pages]] — Code architecture as wiki (replaces CodeGraphContext)
- [[Plan-Wiki-Pages]] — Specs/roadmaps as wiki (replaces superpowers)

## Design Constraint
Do not build a wiki engine. Make the vault LOOK like Wikipedia.
The vault already exists. VaultWatcher indexes it. GraphBuilder parses wikilinks.
Just add: better CSS, capability queries, control plane semantics.
