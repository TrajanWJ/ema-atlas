# EMA — Executive Management Assistant

> **Canon source of truth lives at `ema-genesis/`.** Read `ema-genesis/EMA-GENESIS-PROMPT.md` first, then `ema-genesis/SCHEMATIC-v0.md`, then `ema-genesis/_meta/CANON-STATUS.md` for the current ruling on doc precedence. Everything else flows from there.

## Read This Before Coding

1. `docs/OPERATING-REALITY.md`
2. `docs/CANON-PLANNING-BOUNDARY.md`
3. `docs/INTENTION-BUILDING-SYSTEM.md`
4. `docs/GAP-LEDGER-SYSTEM.md`
5. `docs/INTENTION-AND-GAP-TOPOLOGY.md`
6. `docs/GRAPH-INTEGRATION-SPEC.md`
7. `docs/PROMOTION-FLOW-SPEC.md`
8. `docs/EMA-KNOWLEDGE-AND-ORCHESTRATION-ARCHITECTURE.md`
9. `docs/REVIEW-PROMOTION-PROVENANCE-ARCHITECTURE.md`
10. `docs/BLUEPRINT-PLANNER-CONVERGENCE.md`
11. `docs/HUMAN-OPS-INTEGRATION.md`
12. `docs/PLANNING-AND-GAP-TEMPLATES.md`
13. `docs/MEMORY-SYNC.md`
14. `docs/backend/README.md`
15. `docs/backend/SOURCE-OF-TRUTH.md`
16. `docs/GROUND-TRUTH.md`
17. `ema-genesis/EMA-GENESIS-PROMPT.md`
18. `ema-genesis/_meta/CANON-STATUS.md`

## What EMA Is

A personal AI desktop app: an autonomous thinking companion + life OS. Open-source, self-hosted, P2P collaborative intelligence environment for humans and AI agents. The full description lives in `ema-genesis/EMA-GENESIS-PROMPT.md`.

## Current Stack

**TypeScript / Electron monorepo (in progress, bootstrap v0.1).** Workspaces:

- `apps/` — Electron desktop host + renderer
- `services/` — local HTTP + WebSocket compatibility backend
- `workers/` — background watchers and job runtime
- `cli/` — TypeScript CLI (`ema <noun> <verb>`)
- `shared/` — shared contracts, schemas, types
- `tools/` — contract extraction and parity tooling
- `hq-api/` and `hq-frontend/` — HQ subsystem (separate scope)
- `ema-genesis/` — **canon graph (Obsidian-style markdown wiki). Read first.**
- `IGNORE_OLD_TAURI_BUILD/` — archived Elixir + Tauri build, reference only

## Old Build (Reference Only)

The previous Elixir/Phoenix daemon + Tauri 2 + React frontend has been archived under `IGNORE_OLD_TAURI_BUILD/` with its own README explaining what is there and how to mine it for reimplementation. **Do not run it as the active stack.** Use it as a spec corpus for porting.

## Rules

- **Plane discipline is mandatory.** Separate canon, planning/blueprint/intention-building, implemented reality, and explicit gap analysis. Do not write planning into canon without an explicit promotion step.
- **Canon docs are authoritative.** If they conflict with old code, canon wins.
- **Old code is reference.** Extract patterns, do not treat old runtime commands as current.
- **No legacy drift.** If a doc says Elixir/Phoenix/Tauri is the active path, treat it as stale unless it is explicitly archival.
- **Durable memory belongs in shared sources.** Use `docs/MEMORY-SYNC.md`, repo docs, and EMA durable storage instead of tool-local memory alone.
- **Do not modify `ema-genesis/canon/specs/` or `ema-genesis/canon/decisions/`** without an approved GAC card + proposal in `ema-genesis/intents/`.

## Build & Dev Commands

The verified commands are:

- `pnpm install`
- `pnpm build`
- `pnpm test`
- `pnpm dev`

## Verified Entry Points

When you need the current implemented system reality, start here after the read-first docs:

1. `services/core/backend/manifest.ts`
2. `services/core/intents/service.ts`
3. `services/core/executions/executions.service.ts`
4. `apps/electron/runtime.ts`
5. `workers/src/startup.ts`
