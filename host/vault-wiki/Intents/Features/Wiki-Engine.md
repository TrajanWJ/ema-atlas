---
title: "Wiki Engine"
intent_level: 3
intent_kind: feature
intent_status: implementing
intent_priority: 1
project: ema
parent: "[[Knowledge-System]]"
capabilities: [intent, plan, code]
tags: ["feature", "wiki", "mediawiki", "rendering"]
---

# Wiki Engine

MediaWiki-grade rendering of the existing 1,368 vault pages. Stolen Vector 2022 CSS adapted for EMA dark theme. Wikipedia typography, layout, infoboxes, TOC, categories.

## Approach
- Steal @wikimedia/codex-design-tokens (npm, MIT) for spacing/sizing
- Steal Vector 2022 content styles for article typography
- Steal infobox, categories, TOC patterns as React components
- EMA dark override: glass morphism colors on Wikipedia layout
- Standalone light mode: actual Wikipedia look

## Modules
- `wikipedia.css` — Stolen MediaWiki styles with EMA override
- `WikiPageRenderer` — Renders vault markdown as Wikipedia article
- `WikiSidebar` — Namespace navigation (27 directories)
- `IntentSchematicApp` — Main wiki shell
- `wiki-engine-store` — Zustand state for all 1,368 pages

## Status
CSS stolen and adapted. Basic rendering working. Needs:
- Tiptap editor for edit mode (installed, not wired)
- Comment marks for inline annotations
- Capability-based dynamic context injection
