# Dispatch: Lane F3 — Shared UI primitives

--- DISPATCH PROMPT BEGIN ---

You are dispatched as session `<your-harness>-s<n>`. Your lane is **Lane F3 — Shared UI primitives**.

## Read first

1. `autharis/components/ui/**` and `autharis/components/chrome/**` (READ-ONLY — owned by A1)
2. `autharis/components/Icons.tsx` (READ-ONLY — protected)
3. `packages/ui/README.md`

## Claim the lane

Flip Lane F3 to `held`.

## File scope

- `packages/ui/**`

## Mission

Extract and republish shared React primitives as `@autharis/ui`:

- `Wordmark`, `Icon`, `Button`, `Badge`, `Pill`, `SegmentedControl`, `Dialog`, `Tabs`
- Each component's styling reads tokens from `@autharis/tokens` CSS vars — no hardcoded colors
- Peer-deps on React 19, no dependency on Next.js
- Build tsup dual ESM/CJS; types co-located

## Forbidden

- editing any autharis/ files
- removing or breaking anything in A1's scope

## Depends on

- F2 optional but strongly encouraged (token CSS vars)

## Done when

- `@autharis/ui` builds; storybook (F5) can consume it
- autharis web keeps working unchanged (no imports rewired yet — C1 reconciles later)
- decision logged

--- DISPATCH PROMPT END ---
