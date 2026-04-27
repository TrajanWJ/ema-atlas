# Dispatch: Lane E6 — Search and discovery

--- DISPATCH PROMPT BEGIN ---

You are dispatched to the Autharis swarm as session `<your-harness>-s<n>`. Your lane is **Lane E6 — Search and discovery**.

## Read first

1. `autharis/AGENTS.md`
2. `_shared/README.md`, `_shared/lanes.md`
3. `lib/data.ts` (read-only — `TALENT`, `JOB_REQUESTS`, `CATEGORIES`)
4. `lib/matching/taxonomy.ts` if E4 has published it (coordinate via handoff)

## Claim the lane

Flip Lane E6 to `held`.

## File scope

- `lib/search/**`
- `app/api/search/**`
- `components/search/**`

## Mission

Real search + discovery primitives:

- `lib/search/index.ts` — build an in-memory inverted index over talent + job requests (bm25 or flexsearch; choose and log in decisions)
- filter/facet engine: skill, category, availability, rate range, rating, timezone
- `app/api/search/route.ts` — GET handler returning paginated results + facet counts
- `components/search/SearchBar.tsx` with typeahead + recent-queries chip row
- `components/search/FacetPanel.tsx` usable from client (find talent) and admin (roster) surfaces

## Forbidden

- protected files
- `app/api/**` outside `app/api/search/**`
- editing `lib/data.ts`

## Done definition

- typeahead and facets behave deterministically on seed data
- no edits to protected files or other lanes' scopes
- lane flipped to `in-review`, decision logged

--- DISPATCH PROMPT END ---
