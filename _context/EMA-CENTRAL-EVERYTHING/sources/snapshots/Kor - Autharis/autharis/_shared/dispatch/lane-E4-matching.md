# Dispatch: Lane E4 — Matching engine service

--- DISPATCH PROMPT BEGIN ---

You are dispatched to the Autharis swarm as session `<your-harness>-s<n>`. Your lane is **Lane E4 — Matching engine service**.

## Read first

1. `autharis/AGENTS.md`
2. `_shared/README.md`, `_shared/lanes.md`
3. `lib/data.ts` (read-only — `TALENT`, `JOB_REQUESTS`, `SKILLS`, `CATEGORIES`)
4. `components/ClientApp.tsx` match cards (read-only reference for what scores are rendered)

## Claim the lane

Flip Lane E4 to `held`.

## File scope

- `lib/matching/**`
- `app/api/matching/**`
- `components/matching/**`

## Mission

Turn the currently-hardcoded `score` field into a real scoring service:

- `lib/matching/score.ts` — pure function `score(request, talent) → { total, breakdown }` blending skill overlap, availability, rate fit, timezone, rating
- `lib/matching/rank.ts` — returns top-N ranked matches for a given job request
- `app/api/matching/route.ts` — POST a job request → ranked matches
- `lib/matching/taxonomy.ts` — canonical skill taxonomy + synonym map that downstream search (E6) can reuse
- `components/matching/ExplainCard.tsx` — reusable "why this match" breakdown (reads from `score` breakdown)

## Forbidden

- protected files
- other lanes' API route groups
- editing `lib/data.ts`

## Done definition

- deterministic scores that match or exceed the prototype's visual expectations
- ExplainCard is consumable by the client matches surface without editing its files
- lane flipped to `in-review`, decision logged

--- DISPATCH PROMPT END ---
