# Donor Translation Pipeline

**Owner:** Workspace Hygiene & Swarm Meta Orchestrator (policy). Execution belongs to Canon Writers, Runtime Slice, or Product Surface Donor in their own lanes.

This document is the **single source of truth** for how donor code (from `sources/snapshots/` and `atlas/ema-atlas/`) moves into the EMA 0.0.5 runtime. It exists because "just copy it in" was the failure mode of the 2026-04-24 drift. Every adopted donor asset must answer the four questions below before it lands.

Companion: the `ema-donor-rip` skill automates the provenance-header + verdict-tag mechanics for common asset types (CSS, React components, animation helpers). The canonical surface-from-donor plan lives at `doctrine/research/EMA-0.0.5-SURFACE-DONOR-MATRIX.md`. Pre-extracted doctrine per donor branch lives at `sources/snapshots/ema 0.0.3/ema-atlas/graph/nodes/*.qmd` — read the `.qmd` before grepping the branch.

## The four verdicts

Every donor file adopted into `runtime/EMA-0.0.5--4-24/` declares exactly one verdict. The verdict is written into the `SOURCE:` header of the translated file (see below) and, for `copy` or `adapt`, into the lane ticket in STATUS.md.

### `copy`

The donor file lands as-is (modulo mechanical renames of paths/imports). No structural change. Used for genuinely portable assets: pure utility functions, standalone CSS, asset files, algorithm implementations without EMA-specific coupling.

**Forbidden for:** topology (`Organization → Space → Project`), event shapes, daemon authority, canonical writer logic, IPC wire protocol, ID prefix handling. Those must be `adapt` or rewritten. Silent topology-level `copy` is the drift pattern this pipeline exists to prevent.

### `adapt`

The donor file lands reshaped for EMA 0.0.5: renamed exports, restructured control flow, swapped dependencies, contract fields renamed to match `packages/contracts/`. The donor is a starting point, not the endpoint. The adapted file looks meaningfully different from its source but the intent is traceable.

### `inspire`

The donor file is read and a **new** EMA 0.0.5 file is written from scratch based on the donor's ideas. The new file does not contain donor code, only donor-informed design. The `SOURCE:` header notes the donor as an inspiration, not a provenance chain.

### `reject`

The donor file is read and not adopted. The decision is documented in a short note (the `.qmd` node in `sources/snapshots/ema 0.0.3/ema-atlas/graph/nodes/` or a decision under `docs/decisions/`) so future sessions do not re-propose it.

## The `SOURCE:` header

Every file adopted under `copy`, `adapt`, or `inspire` gets a comment header at the top. Format:

```text
SOURCE: donor=<branch-name> commit=<40-char-sha> verdict=<copy|adapt|inspire> reviewer=<name-or-session-id> date=<YYYY-MM-DD>
```

Examples (language-appropriate comment syntax):

```typescript
// SOURCE: donor=codebase-frontend-layer commit=3a7f1e2b9c8d4f5e6a1b2c3d4e5f6a7b8c9d0e1f verdict=adapt reviewer=runtime-slice-2026-04-25 date=2026-04-25
```

```gleam
// SOURCE: donor=lineage-original-elixir-ema commit=9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d verdict=inspire reviewer=canon-writers-2026-04-27 date=2026-04-27
```

```css
/* SOURCE: donor=codebase-place-org commit=1f2e3d4c5b6a7988776655443322110099aabbcc verdict=copy reviewer=product-surface-2026-05-02 date=2026-05-02 */
```

`reject` outcomes do not produce a header because no file lands; they produce a decision note instead.

## Lane ticket requirement

`copy` and `adapt` translations require an open lane in `docs/orchestration/STATUS.md` before the translation commits. The lane ticket names:

- The donor branch(es) being drawn from.
- The target path(s) in the runtime tree.
- The verdict per file.
- The reviewer responsible for signing off.

`inspire` does not require a lane ticket if it produces a single file; larger inspire-driven work still opens a lane. `reject` is lane-free.

## Forbidden `copy` targets

The following touch topology, event shape, or daemon authority and therefore **must not** be `copy` — use `adapt` or rewrite:

- Any file under `apps/daemon/src/ema_daemon/` (bus, registry, supervisor, event envelope, sqlite_ffi).
- Any writer actor under `apps/daemon/src/ema_*/` (orgs, spaces, projects, identity, memberships, invites, blueprint, projections, etc.).
- Any file under `packages/contracts/` (events, types, ipc).
- Any file under `packages/surface-core/src/ipc-client/` or `apps/web/src/lib/ipc/`.
- Any routing or topology-aware shell code under `apps/web/src/shell/`.

If a donor asset in one of these directories looks like a clean `copy` candidate, stop and open a coordinator discussion. The usual answer is that the donor shape encoded topology assumptions from a prior EMA version that no longer hold.

## Translator checklist

Before a `copy` or `adapt` translation commits, the translator runs this checklist and notes results in the lane ticket:

1. **`bash scripts/contract-check.sh` passes** on the translated tree — no missing-from-catalog, no misspelled-kind, no unknown-id-prefix.
2. **Topology matches.** Any reference to org/space/project uses the canonical `Organization → Space → Project` order. Legacy `Organization → Project → Space` (from 0.0.3) is reshaped, not carried forward.
3. **No embedded secrets.** No device keys, OAuth tokens, `.env` content, or hardcoded credentials in the translated file. If the donor contained one, flag it and stop — the donor branch needs its own secret-rotation pass before translation continues.
4. **No dead imports.** Every import in the translated file resolves to something that exists in the 0.0.5 tree. Ghost imports from removed modules are deleted.
5. **MOCK-label discipline preserved.** If the donor file rendered a surface that did not flow through a daemon writer, the translated file carries the `MOCK_PROJECTION_LABEL` (or the `ema-honest-mocks` skill equivalent) and a `TODO(event-family: …)` comment.
6. **No new language dependency.** Translating does not introduce a language, runtime, or framework that isn't already in the 0.0.5 stack (Gleam/BEAM daemon, TypeScript/React web, Rust/Tauri desktop, bash scripts).
7. **Provenance header present.** The `SOURCE:` header is on the first non-shebang line of the file.

## Reject documentation

When a donor file is rejected, add one paragraph to the relevant `.qmd` node under `sources/snapshots/ema 0.0.3/ema-atlas/graph/nodes/` in the "Doctrine extracted" → "Leaves behind" section, naming the file and the reason. This prevents re-proposal.

If no `.qmd` node exists for the donor branch, write a short decision under `runtime/EMA-0.0.5--4-24/docs/decisions/<YYYY-MM-DD>-donor-reject-<branch>.md`.

## Quick reference

| Verdict     | Requires lane ticket | Requires `SOURCE:` header | Allowed on topology / event / daemon authority |
|-------------|---------------------|---------------------------|------------------------------------------------|
| `copy`      | yes                 | yes                       | **no** — use `adapt` or rewrite                |
| `adapt`     | yes                 | yes                       | yes (with reshape and checklist)               |
| `inspire`   | large work only     | yes                       | yes                                            |
| `reject`    | no                  | n/a (no file lands)       | n/a                                            |

## Ledger anchor

Report lane closures and translation outcomes to `runtime/EMA-0.0.5--4-24/docs/orchestration/STATUS.md`.
