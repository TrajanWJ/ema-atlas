# EMA-CENTRAL-EVERYTHING

This folder is the central EMA workspace on this machine.

It should now be treated as the main human home for:

- doctrine
- planning
- donor research
- source snapshots
- the real `0.0.5` codebase

The main rule is simple:

- write EMA doctrine in `doctrine/`
- build EMA code in `runtime/EMA-0.0.5--4-24/`
- read atlas through `atlas/`
- read donor material through `donors/`
- treat `sources/snapshots/` as preserved history, not the new build home

## EMA Workspace Map

- `doctrine/`
  - canonical EMA design, planning, and research docs
- `runtime/`
  - actual implementation home
- `atlas/`
  - curated access to `ema-atlas`
- `donors/`
  - curated donor repos and extracts
- `data-model/`
  - how EMA treats truth, memory, collaboration, and runtime state
- `sources/snapshots/`
  - preserved imported workspaces and historical roots
- `archive/`
  - snapshot entrypoints and older source shelves
- `inventory/`
  - filesystem classification and inventory
- `plans/`
  - reconstruction/migration planning
- `links/`
  - quick aliases into important internal locations

## Where To Work

- EMA design docs:
  - [doctrine/](./doctrine)
- EMA 0.0.5 codebase:
  - [runtime/EMA-0.0.5--4-24/](./runtime/EMA-0.0.5--4-24)
- EMA data/source-of-truth model:
  - [data-model/EMA-DATA-TREATMENT-AND-SOURCE-OF-TRUTH.md](./data-model/EMA-DATA-TREATMENT-AND-SOURCE-OF-TRUTH.md)

## Read first

1. [Live 0.0.5 Orchestration Status](./runtime/EMA-0.0.5--4-24/docs/orchestration/STATUS.md)
2. [Doctrine README](./doctrine/README.md)
3. [0.0.5 Language Lock](./doctrine/planning/EMA-0.0.5-LANGUAGE-LOCK.md)
4. [0.0.5 Buildout Master Plan](./doctrine/planning/EMA-0.0.5-BUILDOUT-MASTER-PLAN.md)
5. [0.0.5 Runtime README](./runtime/EMA-0.0.5--4-24/README.md)
6. [Vanilla Workspace Architecture](./runtime/EMA-0.0.5--4-24/docs/architecture/08-vanilla-workspace.md)
7. [Data Treatment And Source Of Truth](./data-model/EMA-DATA-TREATMENT-AND-SOURCE-OF-TRUTH.md)
8. [Workspace Inventory](inventory/WORKSPACE-INVENTORY.md)
9. [Reconstruction Plan](plans/EMA-CENTRAL-RECONSTRUCTION-PLAN.md)

## Migration status

As of `2026-04-24`, the main EMA-related folders have been copied into
`sources/snapshots/`:

- `ema 0.0.3`
- `Kor - Autharis`
- `code/ema`

This copy preserved hidden folders and repo metadata such as:

- `.git`
- `.claude`
- nested donor/shared folders

The original Desktop folders were intentionally left untouched as safety
snapshots.

After central verification, the old scattered Desktop roots were moved out of
the active workspace into:

- `/Users/tawj/.Trash/EMA-old-roots-2026-04-24`

That includes:

- `ema 0.0.3`
- `Kor - Autharis`
- `code/ema`

## Curated source entrypoints

- [atlas/ema-atlas](./atlas/ema-atlas)
- [donors/autharis](./donors/autharis)
- [archive/ema-0.0.3-snapshot](./archive/ema-0.0.3-snapshot)
- [links/ema-0.0.5-prep](./links/ema-0.0.5-prep)

## Immediate rule

Do not build EMA inside old imported roots anymore.

Use `runtime/EMA-0.0.5--4-24/` as the code home and `doctrine/` as the document
home.
