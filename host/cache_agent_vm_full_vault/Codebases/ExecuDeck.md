---
title: "ExecuDeck"
created: 2026-04-01
type: codebase
status: active
stack: [next.js-16, react-19, typescript, zustand, zod, tailwind-4, shadcn-ui, radix, indexeddb]
host: host-machine
path: ~/Desktop/Coding/Projects/execudeck
repo_branch: master
category: executive-ai
tags: [codebase, executive, command-environment, generative-ui, multi-agent, terminal]
summary: "Executive command environment with dual surfaces (terminal + canvas), multi-agent orchestration, and generative UI artifacts with human-in-the-loop approval."
related: [EMA, ClaudeForge, Intelligence Layer]
---

# ExecuDeck

Executive command environment with dual surfaces (terminal + canvas), multi-agent orchestration, and generative UI artifacts with human-in-the-loop approval.

## Architecture

- **Framework:** Next.js 16.1.6 (App Router)
- **State:** Zustand 5 (workspace, message, manifest stores)
- **Validation:** Zod 3.22 (contracts are source of truth)
- **Storage:** IndexedDB via idb-keyval
- **Testing:** Vitest

### Conventions
- Contracts first — all data shapes in `src/contracts/` with Zod schemas
- Zustand stores in `src/state/`
- Dual surfaces: terminal (command input) + canvas (visual artifacts)

## Status

- **Git:** master, 9 dirty files (last commit: 2026-02-19)
- **Deployment:** Local dev
- **Active development:** Paused (potential merge with [[EMA]])

## Relationship to EMA

ExecuDeck is the spiritual predecessor to [[EMA]]. Many concepts (dual surfaces, agent orchestration, command environment) will carry forward into EMA's Tauri-based architecture. Key difference: EMA adds life OS features (habits, journal, brain dump) and moves to local-first Tauri + Elixir/Phoenix.

## Related

- [[EMA]] — Evolution of ExecuDeck concept
- [[ClaudeForge]] — Remote IDE, different surface
- [[Research/EMA-Wilson-Deep-Research-2026-03-31|EMA Research]]
