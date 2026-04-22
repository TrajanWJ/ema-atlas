---
title: "place.org"
space: wiki
tags: ["projects","place-org","portfolio"]
source: migrated-from-obsidian
---

# place.org

Browser-based desktop OS and personal workspace — portfolio + productivity dual use.

## Quick Info

| Field | Value |
|-------|-------|
| Path | `~/Desktop/place.org/` |
| Stack | Next.js 16, TypeScript strict, Tailwind v4, Zustand 5, wa-sqlite (OPFS), react-rnd |
| Design | Deep space cockpit, frosted glass, spring physics, cursor bioluminescence |
| Status | v0.2 on main, v0.3-v0.5 in worktrees being merged |

## Two Layout Modes

**Desktop:** OS shell with window manager, dock, apps (Brain Dump, Journal, Focus Timer, Tasks, Dashboard, Habits, Review, Terminal, Calculator, Music, Clock, Settings)

**Immersive:** Full-page breakouts for portfolio (/portfolio, /about, /cool-stuff, /community, /services)

## Build Phases

| Phase | Status |
|-------|--------|
| v0.1 Shell + Brain Dump | Done |
| v0.2 Journal, Timer, Terminal, Dashboard | Done |
| v0.3 Tasks, Habits, Review, Goals | Built, merging |
| v0.4 Immersive pages | Built, merging |
| v0.5 Legacy, PWA, mobile | Partially built |

## Key Decisions
- Local-first with SQLite WASM + OPFS (no server, no sync yet)
- react-rnd for window management
- Design tokens: #060610 void, white-at-opacity text, #991B1B red as punctuation, 4-tier glass system

## Related
- [[Active Projects]]
