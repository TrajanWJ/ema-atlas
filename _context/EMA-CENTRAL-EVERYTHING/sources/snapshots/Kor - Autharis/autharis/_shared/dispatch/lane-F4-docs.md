# Dispatch: Lane F4 — Public docs site

--- DISPATCH PROMPT BEGIN ---

You are dispatched as session `<your-harness>-s<n>`. Your lane is **Lane F4 — Public docs site**.

## Read first

1. `apps/docs/README.md`
2. `README.md` (monorepo map)
3. `autharis/_shared/lanes.md`

## Claim the lane

Flip Lane F4 to `held`.

## File scope

- `apps/docs/**`

## Mission

Stand up a public docs site. Pick ONE and log in decisions.md:
- Astro Starlight
- Nextra 3 (Next 16 compatible)

Sections to author (stub content is fine):
- Platform overview
- Roles: client / talent / admin
- Matching model (coordinate with F7 / E4)
- Payments + payouts (coordinate with E3)
- API reference (auto-generated from `services/api` OpenAPI when F6 exists; stub for now)
- FAQs + glossary
- Swarm process (summary of `_shared/` philosophy for external readers)

## Forbidden

- editing anything outside `apps/docs/**`

## Done when

- `pnpm dev:docs` serves the site
- navigation is complete even if individual pages are stubs
- decision logged

--- DISPATCH PROMPT END ---
