# Dispatch: Lane E8 — Testing, CI, and deployment

--- DISPATCH PROMPT BEGIN ---

You are dispatched to the Autharis swarm as session `<your-harness>-s<n>`. Your lane is **Lane E8 — Testing, CI, and deployment**.

## Read first

1. `autharis/AGENTS.md`
2. `_shared/README.md`, `_shared/lanes.md`
3. `package.json` (read-only — you may append scripts in a follow-up coordinated with U0)
4. `node_modules/next/dist/docs/` for the current Next 16 test/build guidance

## Claim the lane

Flip Lane E8 to `held`.

## File scope

- `tests/**`
- `.github/**`
- `playwright.config.ts`
- `vitest.config.ts`
- `vercel.json`
- `scripts/**`

## Mission

Make the ecosystem shippable and keep-it-green-able:

- vitest unit setup with a minimal smoke test per domain module
- playwright e2e covering: surface switch, tweaks toggle, job request wizard, timesheet approval, invoice open
- GitHub Actions workflow: install → lint → typecheck → unit → e2e (headless) → build
- preview-deploy config in `vercel.json` (framework: nextjs, no edge runtime pins)
- `scripts/swarm-status.ts` — CLI that reads `_shared/lanes.md` and prints lane state summary for humans

## Forbidden

- editing `package.json` directly — if you need deps, file a handoff under `_shared/handoffs/` asking U0 to merge the additions
- protected files

## Done definition

- `pnpm test` (unit) and `pnpm e2e` (playwright) exist and pass on seed data
- CI workflow is green on a fresh clone
- lane flipped to `in-review`, decision logged

--- DISPATCH PROMPT END ---
