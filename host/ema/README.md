# EMA

EMA is now a TypeScript-first Electron monorepo.

## Read First

Before using or extending EMA, read:

- `docs/OPERATING-REALITY.md`
- `docs/CANON-PLANNING-BOUNDARY.md`
- `docs/INTENTION-BUILDING-SYSTEM.md`
- `docs/GAP-LEDGER-SYSTEM.md`
- `docs/INTENTION-AND-GAP-TOPOLOGY.md`
- `docs/GRAPH-INTEGRATION-SPEC.md`
- `docs/PROMOTION-FLOW-SPEC.md`
- `docs/EMA-KNOWLEDGE-AND-ORCHESTRATION-ARCHITECTURE.md`
- `docs/REVIEW-PROMOTION-PROVENANCE-ARCHITECTURE.md`
- `docs/BLUEPRINT-PLANNER-CONVERGENCE.md`
- `docs/BLUEPRINT-PLANNER-DEEPER-CONVERGENCE.md`
- `docs/BLUEPRINT-PLANNER-READ-MODELS.md`
- `docs/DECISIONS-AS-FIRST-CLASS-OBJECTS.md`
- `docs/BLUEPRINT-REVIEW-DECISION-CONVERGENCE.md`
- `docs/DECISION-LOG-READ-MODELS.md`
- `docs/DECISION-OBJECT-MODEL-DRAFT.md`
- `docs/REVIEW-PROMOTION-DECISION-TARGET-EXPANSION.md`
- `docs/BLUEPRINT-DECISION-WORKFLOW-SPEC.md`
- `docs/DECISION-OUTCOME-PRECEDENT-SYSTEM.md`
- `docs/HARNESS-DESIGN-OVERHAUL.md`
- `docs/HUMAN-OPS-INTEGRATION.md`
- `docs/HUMAN-OPS-DEEPER-INTEGRATION.md`
- `docs/PLANNING-AND-GAP-TEMPLATES.md`
- `docs/MEMORY-SYNC.md`
- `docs/backend/README.md`
- `docs/backend/SOURCE-OF-TRUTH.md`
- `docs/GROUND-TRUTH.md`

## Primary Workspace

- `apps/electron` — Electron desktop host
- `apps/renderer` — React renderer
- `services` — local HTTP + WebSocket compatibility backend
- `workers` — background watchers and job runtime
- `cli` — TypeScript CLI
- `shared` — shared contracts, schemas, and types
- `tools` — contract extraction and parity tooling

## Legacy Archive

The previous Tauri + Elixir build has been moved under:

- `IGNORE_OLD_TAURI_BUILD/app`
- `IGNORE_OLD_TAURI_BUILD/daemon`
- `IGNORE_OLD_TAURI_BUILD/src-tauri`
- `IGNORE_OLD_TAURI_BUILD/src`

The legacy tree is retained for contract extraction and parity work, not as the active build target.

## Development

```bash
pnpm install
pnpm dev
```

That starts:

- Vite renderer on `:1420`
- local services on `:4488`
- workers
- Electron desktop shell

## Build

```bash
pnpm build
pnpm package:desktop
```


## Durable Linux Host Runtime

For the real host runtime (outside `pnpm dev`), EMA now ships repo-owned systemd user units plus an installer:

```bash
cd ~/Projects/ema
./scripts/install-runtime.sh
```

This explicitly pins runtime execution to Node 22, rebuilds the repo, installs `ema-services` + `ema-workers`, and validates `http://127.0.0.1:4488/api/health`. See `runtime/README.md`.

## Contract Work

```bash
pnpm extract:contracts
pnpm parity
```

## Current Direction

EMA should still be thought of as a daemon-centered local system in the architectural sense, but the active implementation is now the TypeScript services/workers runtime rather than the archived Elixir daemon.

The current backend truth is documented in:

- `docs/backend/README.md`
- `docs/backend/SOURCE-OF-TRUTH.md`
- `docs/backend/DEDUPLICATION-DECISIONS.md`
- `docs/backend/ENTITY-CONTRACTS.md`
- `docs/backend/FUTURE-AGENT-HANDOFF-2026-04-12.md`

Broader architecture planning remains in:

- `docs/planning/ELECTRON_FOUNDATION_2026-04-10.md`
- `docs/GROUND-TRUTH.md`
- `docs/BLUEPRINT.md`

## Current Verified State

As of `2026-04-12`:

- `pnpm build` is green across the Electron/TypeScript monorepo
- `pnpm test` is green (`@ema/services` reports `132` passing tests)
- the active backend spine is:
  - filesystem canon in `ema-genesis/`
  - pluralized services in `services/core/{intents,blueprint,executions,spaces,user-state}/`
  - SQLite runtime persistence in `~/.local/share/ema/ema.db`
- backend truth is inspectable at:
  - `docs/backend/*`
  - `GET /api/backend/manifest`
