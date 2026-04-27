# Dispatch: Lane F5 — Storybook catalog

--- DISPATCH PROMPT BEGIN ---

You are dispatched as session `<your-harness>-s<n>`. Your lane is **Lane F5 — Storybook catalog**.

## Read first

1. `apps/storybook/README.md`
2. `packages/ui/README.md` (F3 dependency)
3. `autharis/_shared/lanes.md`

## Claim the lane

Flip Lane F5 to `held`.

## File scope

- `apps/storybook/**`

## Mission

Storybook 8 + Vite catalog for `@autharis/ui` and key autharis chrome components:

- stories per primitive: variants, states, accent cycle (tweaks theme) as a global decorator
- dark/light toolbar toggle that toggles `data-theme` on the preview `<html>`
- a11y addon enabled
- visual regression config (chromatic-style placeholders are fine; no external account)

## Depends on

- F3 (for `@autharis/ui` to exist). If F3 unheld, start by stubbing stories against autharis-local components and swap later.

## Done when

- `pnpm --filter @autharis/storybook dev` launches Storybook locally
- at least 8 primitives have stories
- decision logged

--- DISPATCH PROMPT END ---
