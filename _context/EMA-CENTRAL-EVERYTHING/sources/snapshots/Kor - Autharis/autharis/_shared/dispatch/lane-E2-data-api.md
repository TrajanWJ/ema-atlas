# Dispatch: Lane E2 — Server data layer and API routes

--- DISPATCH PROMPT BEGIN ---

You are dispatched to the Autharis swarm as session `<your-harness>-s<n>`. Your lane is **Lane E2 — Server data layer and API routes**.

## Read first

1. `autharis/AGENTS.md`
2. `_shared/README.md`, `_shared/lanes.md`
3. `node_modules/next/dist/docs/` — specifically route handlers, caching, dynamic APIs
4. `lib/data.ts` (read-only reference — the seed shapes)

## Claim the lane

Flip Lane E2 in `_shared/lanes.md` to `held` under your session id.

## File scope

- `app/api/**` EXCEPT `app/api/auth/**` (E1), `app/api/payments/**` (E3), `app/api/matching/**` (E4), `app/api/notifications/**` (E5), `app/api/search/**` (E6), `app/api/analytics/**` (E7)
- `lib/server/**`
- `lib/db/**`
- `prisma/**` if you introduce prisma, otherwise keep it file-based under `lib/db/`

## Mission

Replace localStorage-only persistence with a real server data layer the prototype can grow into:

- choose SQLite + Prisma OR a typed JSON file store under `lib/db/` — pick one and document in `decisions.md`
- migrate the seed fixtures in `lib/data.ts` into the store (read-only copy — do not edit the file)
- expose CRUD route handlers for: talent, job requests, engagements, timesheets, invoices, admin queue
- produce `lib/server/api-client.ts` that surfaces match the existing in-memory shapes so downstream lanes can swap without UI churn

## Forbidden

- editing `lib/data.ts` or any protected file
- owning auth/payments/matching/notifications/search/analytics API routes — those belong to E1/E3/E4/E5/E6/E7

## Done definition

- typed server client exposes all domain reads + writes
- handlers return the same shapes downstream surfaces expect
- lane flipped to `in-review`, decision logged

--- DISPATCH PROMPT END ---
