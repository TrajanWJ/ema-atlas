# Dispatch: Lane F2 — Shared design tokens package

--- DISPATCH PROMPT BEGIN ---

You are dispatched as session `<your-harness>-s<n>`. Your lane is **Lane F2 — Shared design tokens**.

## Read first

1. `autharis/styles/tokens.css` (READ-ONLY — it is protected)
2. `packages/tokens/README.md`
3. `autharis/_shared/lanes.md`

## Claim the lane

Flip Lane F2 to `held`.

## File scope

- `packages/tokens/**`

## Mission

Publish the token system as a reusable package without disturbing the protected source:

- `packages/tokens/src/tokens.css` — exact copy of `autharis/styles/tokens.css` (document the sync contract in `decisions.md`)
- `packages/tokens/src/index.ts` — typed object mirror: `colors`, `space`, `radius`, `type`, `motion`
- `packages/tokens/src/deliverables.ts` — registry of all monorepo deliverables (name, slug, stack, dev url, lane id) consumed by F1 hub
- Build with tsup or plain tsc → `dist/`

## Forbidden

- editing `autharis/styles/**`
- editing anything outside `packages/tokens/**`

## Done when

- `@autharis/tokens` builds clean
- F1 hub can import deliverable registry from here
- decision logged

--- DISPATCH PROMPT END ---
