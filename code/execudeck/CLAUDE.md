# ExecuDeck — Claude Code Context

## Project

ExecuDeck is an executive command environment with dual surfaces (terminal + canvas), multi-agent orchestration, and generative UI artifacts with human-in-the-loop approval.

## Stack

- **Framework:** Next.js 16.1.6 (App Router)
- **Language:** TypeScript 5.x, React 19.2.3
- **UI:** shadcn/ui (Radix primitives), Tailwind CSS 4
- **State:** Zustand 5 (workspace, message, manifest stores)
- **Validation:** Zod 3.22 (contracts are source of truth)
- **Storage:** IndexedDB via idb-keyval
- **Testing:** Vitest

## Conventions

- **Contracts first** — all data shapes defined in `src/contracts/` with Zod schemas before implementation
- **Zustand stores** in `src/state/` — workspace, message, manifest
- **Components** follow the layout: `src/components/{surface}/{Component}.tsx`
- **Path aliases:** `@/*` → `src/*`, `@contracts/*` → `src/contracts/*`
- **Grammar tokens:** `>` narrative, `@` delegation, `#` status, `!` hint
- **Safety zones:** Z0 (human), Z1 (renderer headless), Z2 (orchestrator)

## Current State

- Phase 0 (scaffolding): Complete
- Phase 1 (core surfaces): ~70% — tabs, split-view, grammar tokens done; terminal interactivity and page tree wiring remaining
- Phase 2 (delegation): Not started
- Phase 3 (persistence): Not started

## Key Files

- `src/contracts/` — Zod schemas (source of truth for all types)
- `src/state/workspace-store.ts` — tabs, mode, active tab
- `src/state/message-store.ts` — messages indexed by tabId
- `src/state/manifest-store.ts` — page manifests, nav tree
- `src/lib/persistence.ts` — IndexedDB save/load
- `docs/ARCHITECTURE.md` — system design
- `docs/ROADMAP.md` — phase plan

## Test Commands

```bash
npm run test           # Vitest
npm run test:contracts # Contract schema tests
npm run dev            # Dev server (Turbopack)
npm run build          # Production build
```

## Obsidian Vault

Project note: `~/Documents/obsidian_first_stuff/twj1/Trajan's Projects/ExecuDeck.md`

Update the project note when completing phases, making architecture decisions, or hitting significant milestones. See global CLAUDE.md for full vault auto-growth rules.


## Obsidian Vault (Knowledge Base)

Trajan's vault: `~/Documents/obsidian_first_stuff/twj1/`

**At session end or when wrapping up, write to the vault:**

1. **Session log** → `~/Documents/obsidian_first_stuff/twj1/Session Log/YYYY-MM-DD - Brief Title.md`
   - What was done, decisions made, next steps
2. **Gotcha** (if a bug cost >5 min) → `~/Documents/obsidian_first_stuff/twj1/Learnings & Gotchas/YYYY-MM-DD - Brief Problem.md`
   - Context, problem, root cause, fix, lesson
3. **Project note update** → `~/Documents/obsidian_first_stuff/twj1/Trajan's Projects/[Project Name].md`
   - Update current phase/status if it changed

Use `[[wikilinks]]` for internal vault references. Tags at bottom.
