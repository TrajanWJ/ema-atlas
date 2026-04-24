# Lane L-web-generated-source-twins — Remove Tracked JavaScript Twins From Web Source

Status: candidate, coordinator review required
Opened: 2026-04-24
Owning orchestrator: Code Quality & Language Idiom, with Codebase Architecture review
Ledger entry: `docs/orchestration/STATUS.md`

## Problem

`apps/web/src/` contains 38 tracked `.js` files beside matching `.ts` or
`.tsx` source files. The TypeScript config includes `src`, Vite consumes the
TypeScript sources, and `.gitignore` already excludes build outputs. A cold
reader sees two implementations for each surface module.

## Proposed Move

Remove the generated JavaScript twins from source control after confirming they
are not imported directly.

## Scope

- `apps/web/src/**/*.js`
- any stale references that point at `.js` twins
- `.gitignore` only if a missing rule caused the twins to regenerate

## Blast Radius

Coordinator review required because this removes 38 tracked files. The importer
blast radius appears to be zero from a grep scan, but the file count is outside
the direct-move threshold.

## Exit Criteria

- `git ls-files 'apps/web/src/**/*.js'` returns zero.
- `rg '\.js' apps/web/src packages/surface-core docs` has no stale source-path
  references to removed twins.
- `pnpm --filter @ema/web build` passes.
- `pnpm -r typecheck` passes.
