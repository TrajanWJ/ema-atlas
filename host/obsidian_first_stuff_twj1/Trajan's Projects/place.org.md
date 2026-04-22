---
date: 2026-03-20
tags:
  - project
  - active
  - web
status: active
---

# place.org

> Browser-based desktop OS and personal workspace. Portfolio + productivity tools in one experimental site.

## Quick Info

| Field | Value |
|---|---|
| **Location** | `~/Desktop/place.org/` |
| **Stack** | Next.js 16, TypeScript strict, Tailwind v4, Zustand 5, wa-sqlite (OPFS), react-rnd, Motion v12, GSAP, Biome |
| **Storage** | SQLite WASM (local-first, browser-only) |
| **Auth** | Google OAuth (planned, for sync) |
| **Status** | v0.2 on main, v0.3+ in worktrees being merged |

## Architecture

Two layout modes:
- **Desktop** (`/(desktop)`) — OS shell with window manager, dock, ambient bar, apps
- **Immersive** (`/(immersive)`) — Full-page breakouts for portfolio, about, cool-stuff, community

Desktop apps: Brain Dump (GTD inbox), Journal, Focus Timer, Tasks, Dashboard, Habits, Review, Terminal, Calculator, Music Player, Clock, Settings

Immersive pages: /portfolio, /about, /cool-stuff, /community, /services, /oldplace/*

## Design Language

- **Aesthetic:** Deep space cockpit that breathes
- **Colors:** Blue-black base (#060610), cool blue accent (#5b9cf5), living time-of-day shifts
- **Surfaces:** Frosted glass (backdrop-filter), borders materialize on hover
- **Motion:** Spring physics, cursor bioluminescence, idle aurora screensaver
- **Sound:** Synthesized Web Audio API clicks/tones, ambient soundscapes

## Key Decisions

- Local-first with SQLite WASM + OPFS (no server for data in v1)
- Sync deferred — REST LWW recommended when ready ([[Research - Local-First Sync for SQLite Browser Apps 2025-2026]])
- Window management via react-rnd (consider @maomaolabs/core upgrade per [[Research - Browser OS Implementations 2026]])
- NOT a LetMeScale clone — place.org has its own visual identity

## Phased Delivery

- **v0.1** DONE — Desktop shell + Brain Dump
- **v0.2** DONE — Journal, Focus Timer, Terminal, Dashboard
- **v0.3** Built (merging) — Tasks, Habits, Review, Goals
- **v0.4** Built (merging) — Immersive pages (portfolio, about, cool-stuff, community)
- **v0.5** Partially built — Legacy /oldplace/*, PWA enhancements, mobile launcher

## Research Notes

- [[Creative Web Design Patterns - Executive App Inspiration]]
- [[Research - Modern Browser Capabilities 2025-2026]]
- [[Research - place.org Experimental UI Inspiration Deep Dive]]
- [[Research - Web Animation Techniques 2025-2026 place.org]]
- [[Research - Browser OS Implementations 2026]]
- [[Research - Local-First Sync for SQLite Browser Apps 2025-2026]]
- [[Poolsuite Research]]
- [[Research - landonorris.com Technical Deep Dive]]
- [[Research - Transparent Native Windows for place.org Popouts 2025-2026]]

## Related

- [[Pomodoro (FlexiFocus)]] — Focus timer mechanics adapted from this project
- [[ExecuDeck]] — Dual-surface command environment, similar architectural thinking

#project #web #active #place-org
