# Dispatch: Lane F1 — Monorepo hub navigator

--- DISPATCH PROMPT BEGIN ---

You are dispatched to the Autharis swarm as session `<your-harness>-s<n>`. Your lane is **Lane F1 — Monorepo hub navigator**.

## Read first

1. `/Users/tawj/Desktop/Kor - Autharis/README.md` (monorepo map)
2. `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/README.md`, `lanes.md`
3. `/Users/tawj/Desktop/Kor - Autharis/apps/hub/README.md`

## Claim the lane

Flip Lane F1 in `_shared/lanes.md` to `held` under your session id. If already held, stop.

## File scope

- `apps/hub/**`

## Mission

Build a static Astro 4 site at `apps/hub` that acts as the human-facing map of the monorepo:

- Hero + wordmark
- Deliverable grid card per workspace (Web app, Docs, Storybook, API, Matching, Events, Prototype reference)
- Each card: name, one-liner, stack badge, lane id + status, entry URL (dev + prod)
- Parse `autharis/_shared/lanes.md` at build time for status chips
- Zero runtime JS unless strictly necessary

## Forbidden

- editing anything outside `apps/hub/**`
- editing `autharis/_shared/lanes.md` except to flip your own lane row

## Done when

- `pnpm dev:hub` serves the navigator
- all eight current deliverables link correctly
- lane flipped to `in-review`, decision logged

--- DISPATCH PROMPT END ---
