# cwt Absorbed by EMA — 2026-05-07

> Status: **accepted, supersedes
> [2026-05-07-cwt-central-tracker.md](./2026-05-07-cwt-central-tracker.md)**.
> Superseding-same-day: the central-tracker decision was iterated on the
> same operator session as the buildout request. The earlier ADR is
> preserved as historical record.

`current-work-tracker-trajan` (cwt; project id
`project:01KR0AAG8D004J8015N9P8A0VY`) is no longer a sibling project. Its
record families, contracts, and UI ideas are absorbed into EMA. EMA's
daemon is canonical for everything below the org/space layer. cwt's
standalone web and CLI deprecate; their good ideas migrate into a new
EMA web vApp called `cockpit`.

## Context

The earlier-same-day decision (`2026-05-07-cwt-central-tracker.md`) split
writer-of-truth across two sibling projects: cwt owned project-and-below,
EMA owned org-and-above. Hours later the operator surfaced concrete
friction with that split:

1. **Two stores, one operator.** Every action that crossed both layers
   (e.g. `ema queue add --project <cwt_project_id>`) implied a sync,
   mirror, or projection contract that did not yet exist. Records that
   should be one record were two.
2. **vApp pace pressure points the same way.** The operator wants a
   single place to "create new projects, add clients, brain-dump by day,
   manage executive functioning." Holding two writers behind that single
   surface multiplies coordination cost without buying anything the
   single-store path doesn't already give.
3. **Schema duplication is the failure mode.** cwt's TypeScript Zod
   records and EMA's markdown event-family specs were diverging from day
   one. Any sustained two-writer model lands there.

The operator's verbatim resolution: **"daemon is canonical, everything
should live in the EMA BEAM daemon/Elixir codebase and whatnot, the new
cwt ideas should be brought over"** + **"cwt is part of EMA"**. Slice
scope: full buildout.

## Decision

### 1. EMA daemon is canonical for every record family below org/space.

After migration, `apps/daemon/canonical.db` is the only store for:

- `client` (first-class; new family)
- `project` (extended with `client_id`, `kind`, `client_label`,
  `client_color`)
- `queue_item`, `lane`, `mission`, `campaign`
- `responsibility` (new family; cadence-based standing intents)
- `vcalendar`, `checkup`, `handoff`
- `problem`, `solution`
- `execution`, `dependency`

EMA continues to own `org`, `space`, agent identity, daemon process,
shell-state, and the daemon transport itself. The cwt-side "writer of
project-and-below" role from the superseded ADR is dissolved.

### 2. cwt's UI patterns and contracts migrate into EMA.

cwt's TypeScript Zod records are ported to EMA's markdown event-family
spec format under `packages/contracts/types/` and
`packages/contracts/events/`. A TS-codegen step emits a generated
`@ema/contracts` type package that EMA web consumes. cwt's
`packages/contracts/`, `packages/store/`, and `packages/surface-core/`
retire after migration. cwt's UI primitives (sidebar grammar, capture
form, bench views, design tokens) port into EMA web.

### 3. New EMA web vApp: `cockpit`. URL alias: `?vapp=cwt`.

The existing `cwt` stub registration in
`apps/web/src/shell/vapp-registry.tsx` is renamed to `cockpit` and
re-pointed at the full implementation. Routes:

- `/?vapp=cockpit#/` — NOW (active lane + ready queue + handoff summary)
- `/?vapp=cockpit#/today` — day-bucketed captures + today's vcalendar
- `/?vapp=cockpit#/standing` — responsibilities by cadence
- `/?vapp=cockpit#/capture` — structured capture (queue_item or
  responsibility)
- `/?vapp=cockpit#/clients`, `/clients/:id`, `/clients/new`
- `/?vapp=cockpit#/personal/:id`, `/workshop/:id`
- `/?vapp=cockpit#/projects/new`

`?vapp=cwt` is preserved as a URL alias for muscle memory and for any
deep links already captured in queue items, notes, or operator memory.

### 4. `~/.local/bin/cwt` becomes a thin alias to `ema cockpit`.

Post-Slice-7, the `cwt` wrapper execs `ema cockpit "$@"`. There is no
separate cwt CLI surface. Verbs like `cwt next`, `cwt client list`, and
`cwt capture` resolve to the equivalent `ema cockpit …` paths. This
preserves typed muscle memory while keeping a single source of truth
underneath.

### 5. Buildout has 8 slices.

Migration is end-to-end usable at each step (no half-cocked transition
state). Plan lives at
`/Users/trajanm4air/.claude/plans/needs-even-more-conceptual-fluttering-dolphin.md`.

- **0** — close cwt `/` handoff-envelope head before pivoting.
- **1** — contract migration; single `@ema/contracts` schema.
- **2** — daemon contexts for missing record families (Elixir + Gleam,
  see below).
- **3** — one-shot SQLite-to-canonical.db importer.
- **4** — `cockpit` vApp scaffold (port cwt UI to EMA web).
- **5** — `cockpit` new features (`/today`, `/standing`, registry forms,
  count pills).
- **6** — quick-capture footer bar.
- **7** — doctrine update + CLI alias + legacy freeze (this slice).

### Daemon language: mix. Existing Gleam stays; new contexts in Elixir.

The daemon is BEAM-native today via Gleam (`apps/daemon/src/*.gleam`,
`gleam.toml`, `ema_env_ffi.erl`). The operator chose **mix** as the
posture for Slice 2 onward:

- Existing Gleam contexts (`ema_orgs`, `ema_spaces`, `ema_projects`,
  `ema_blueprint`, `ema_swarm_coordination`, etc.) stay Gleam. Extending
  `ema_projects` with cwt's blueprint-06 fields is an in-place Gleam
  edit, not a port.
- New contexts written in **Elixir** under `apps/daemon/lib/`:
  `ema_clients/`, `ema_responsibilities/`, plus any further greenfield
  contexts.
- Build pipeline runs `gleam build` then `mix compile` into one combined
  OTP release. `apps/daemon/mix.exs` lives alongside `gleam.toml`.
- Cross-language interop is plain BEAM: Gleam supervisors start Elixir
  GenServers via OTP child specs; Elixir modules call Gleam functions by
  Erlang-encoded module names (`:'Elixir.EmaClients.Server'.call/2`
  going one way, plain Gleam imports the other).
- Tests: `gleam test` for Gleam, `mix test` for Elixir; both must pass
  per slice.

## Consequences

### Easier

- **One writer, one store.** No mirror, no fan-out, no two-projection
  reconciliation. The four queue items the operator created on
  2026-05-07 already live in `apps/daemon/canonical.db`; nothing has
  to move.
- **One schema.** `@ema/contracts` is the single source of truth. No TS
  Zod / markdown-spec drift.
- **One CLI muscle memory.** `cwt …` and `ema cockpit …` produce
  identical output.
- **One UI surface.** The operator's "create projects, add clients,
  brain-dump, manage executive functioning" all happen at
  `:5173/?vapp=cockpit`.
- **vApp registry stays clean.** `cockpit` replaces a stub; no new
  top-level surface.

### Harder

- **Daemon now spans two languages on BEAM.** Gleam + Elixir both
  compiling into one OTP release is supported but adds a real cognitive
  cost to onboarding and tooling. New contributors must understand both
  dep managers (rebar3-via-Gleam, Mix-via-Elixir) and both module-naming
  conventions.
- **Migration is a one-way door for operator data.** The Slice 3
  importer must be idempotent and dependency-ordered. A botched
  migration loses real records. Verification is `ema status --json`
  counts matching pre-migration cwt SQLite counts.
- **cwt's standalone web at `:3015` deprecates.** Anyone who still has
  it bookmarked needs to retrain to `:5173/?vapp=cockpit`.
- **The earlier-same-day ADR is now historical.** New agents reading
  `docs/decisions/` see two same-day ADRs and must follow the supersede
  pointer to land on the live one.

### At risk

- **Mix + Gleam interop is the largest single risk.** This is the first
  EMA build to mix BEAM languages in one OTP release. Risks include:
  build-pipeline ordering bugs (Gleam's generated Erlang must land
  before `mix compile` runs); dependency conflicts (`gleam_otp` vs
  Elixir's pinned OTP); module-naming collisions across the two
  conventions; cross-language stack traces being harder to read in
  production. Mitigation: smoke test in Slice 2 before any new feature
  work depends on it; pin OTP across both managers; document the
  build-order invariant explicitly.
- **Slice 3 importer correctness.** Dependency order (clients →
  projects → campaigns → missions → lanes → queue_items →
  responsibilities → problems → solutions → handoffs → vcalendar_blocks
  → checkups → executions → dependencies) must hold. ULIDs make
  re-runs idempotent; CRDT envelope (`updated_at`, `tombstone`) carries
  through. Verification gates the rest of the migration.
- **vApp routing convention drift.** EMA web uses `?vapp=…&windows=…`
  across vApps; cockpit uses hash routes (`#/today`, `#/standing`)
  inside. The split is consistent with existing vApp registry
  conventions but agents must not bleed hash routes across vApp
  boundaries.

## Migration plan

Full sliced plan with verification per slice:
`/Users/trajanm4air/.claude/plans/needs-even-more-conceptual-fluttering-dolphin.md`.

This ADR is Slice 7's doctrine artifact, written ahead of the code
slices because doctrine is independent of the daemon/web work and
agents reading the build mid-migration must see one coherent story.

## References

- Superseded ADR (preserved): `2026-05-07-cwt-central-tracker.md`.
- cwt blueprints (now donor material):
  - `Projects/current-work-tracker-trajan/blueprint/08-recovery-and-scaffold-plan.md`
  - `Projects/current-work-tracker-trajan/blueprint/09-ema-central-tracker-promotion.md`
    (the role flip this ADR reverses)
  - `Projects/current-work-tracker-trajan/blueprint/10-design-psychology.md`
    (anti-pattern fence the cockpit vApp inherits)
- WebSocket protocol the cockpit speaks:
  `packages/contracts/ipc/shell-protocol.md`.
- Topology lock (unchanged):
  `docs/plans/RUNTIME-RECOVERY-HANDOFF.md`.
- vApp registry: `apps/web/src/shell/vapp-registry.tsx`.

## Status

Decided 2026-05-07. Active. Supersedes
`2026-05-07-cwt-central-tracker.md` immediately. Code work proceeds per
the 8-slice plan; this Slice-7 doctrine artifact lands first.
