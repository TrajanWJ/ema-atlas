# Dispatch: Lane F6 — Fastify API service

--- DISPATCH PROMPT BEGIN ---

You are dispatched as session `<your-harness>-s<n>`. Your lane is **Lane F6 — Fastify API service**.

## Read first

1. `services/api/README.md`
2. `autharis/lib/data.ts` (READ-ONLY — the seed shapes this service must preserve)
3. `autharis/_shared/lanes.md`

## Claim the lane

Flip Lane F6 to `held`.

## File scope

- `services/api/**`

## Mission

Standalone Fastify + TypeScript HTTP server:

- Fastify 5, TypeBox schemas, pino logging
- Routes: `/talent`, `/jobs`, `/engagements`, `/timesheets`, `/invoices`, `/admin/queue`
- OpenAPI 3.1 spec emitted at `/openapi.json` (F4 docs will consume)
- Pluggable storage: in-memory seed for dev, Postgres-ready interface stub
- CORS locked to the dev hosts of `autharis` (:3000), `apps/hub` (:4321), `apps/docs` (:4000)
- Dockerfile + a `scripts/dev.sh` for local run

## Distinction from E2

E2 builds Next.js route handlers at `autharis/app/api`. F6 is a separate process. They can coexist; eventually Next route handlers proxy to F6 once contracts stabilize.

## Forbidden

- anything outside `services/api/**`
- editing `lib/data.ts`

## Done when

- `pnpm --filter @autharis/api dev` starts server + emits OpenAPI
- all six domain routes return seed data end-to-end
- decision logged

--- DISPATCH PROMPT END ---
