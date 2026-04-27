# `place-reflection/` — the donor adapter shim

This directory is the Surface-lane bridge between the place.org donor
components in `apps/web/src/place-donor/place-org/` and EMA's real shell
state + daemon projections.

## Why

place.org was direct-ripped as the virtual-desktop donor (per user's
`feedback-donor-direct-rip` rule). Donor components live under
`place-donor/place-org/` verbatim, with `/* RIP: place.org */` provenance
in their CSS.

Donor components import from `@/src/stores/*`, `@/src/lib/*`,
`@/src/types/*`, `@/src/components/icons`, `@/src/hooks/*`. Those paths
don't exist in EMA. Rather than edit the donor, we redirect those paths
via `apps/web/tsconfig.json` `paths` → into this layer. Donor stays
byte-for-byte; wiring lives here.

## Layers

- **`shell-state/`** — zustand bridges. All are backed by the
  workspace-plane layout artifact (localStorage). None talks to the
  daemon. Per user decision 2026-04-24, window geometry + dock pinning +
  virtual-desktop grouping stay workspace-plane forever.
- **`projections/`** — (Wave 4+) React hooks wrapping
  `apps/web/src/lib/ipc/use-projection.ts` so donor code can read real
  daemon projections.
- **`commands/`** — (Wave 5+) React hooks wrapping
  `apps/web/src/lib/ipc/use-command.ts` so donor code can mutate canon.
- **`lib/`** — `createId`, `userKey`, `DEFAULT_WINDOW_SIZES`,
  `APP_LABELS`, `getApp`, `SPRINGS`, `subscribeToPlaceEvents`,
  `companionBridge` — non-React helpers donor files expect.
- **`types/`** — redeclares `AppId` as EMA's surface-id union. When
  donor imports `@/src/types/window` it gets EMA ids (launchpad, hq,
  blueprint, ...), not place.org's brain-dump/focus/journal set.
- **`icons/`** — pass-through re-export of donor icons.
- **`honest-mock/`** — `<MockedLabel/>` component + central registry of
  surfaces not yet backed by real daemon writers. Per user's
  `ema-honest-mocks` rule.

## Wave status (2026-04-24)

Wave 1 — foundation: **landed.** Adapter types in
`packages/surface-core/src/adapter/`, bridges + lib + types here,
tsconfig path mapping wired. Donor still excluded from typecheck; no
donor component mounted yet.

Waves 2–6: pending. See `doctrine/planning/orchestrator-prompts/` or
`/Users/tawj/.claude/plans/this-project-current-state-jolly-lake.md` for
the full sequence.

## Anti-drift rules

- **Never paraphrase donor.** Donor files stay verbatim under
  `place-donor/`. All adaptation happens here via path mapping.
- **Never leak donor AppIds.** Donor's `brain-dump`/`focus`/... are not
  EMA surfaces. `types/window.ts` re-owns `AppId` as the EMA surface-id
  union; donor imports resolve here.
- **Never reach past the bridge.** Donor code imports `@/src/stores/...`;
  it must NOT import `../../shell/window-store` directly.
- **Label or delete.** If a donor surface calls a command that isn't in
  `SHIPPED_COMMAND_OPS`, add an entry to `honest-mock/registry.ts` with a
  CLI equivalent, or delete the call. No silent mocks.
