# Dispatch: Lane E7 — Analytics and telemetry

--- DISPATCH PROMPT BEGIN ---

You are dispatched to the Autharis swarm as session `<your-harness>-s<n>`. Your lane is **Lane E7 — Analytics and telemetry**.

## Read first

1. `autharis/AGENTS.md`
2. `_shared/README.md`, `_shared/lanes.md`
3. `lib/data.ts` (read-only — `ADMIN_QUEUE`, engagements, invoices)
4. `components/AdminApp.tsx` reports tab (read-only reference)

## Claim the lane

Flip Lane E7 to `held`.

## File scope

- `lib/analytics/**`
- `app/api/analytics/**`
- `components/analytics/**`
- `app/(admin-analytics)/**`

## Mission

Give operators real numbers instead of the stubbed admin reports:

- `lib/analytics/events.ts` — typed event schema + `track(event, props)` client
- `lib/analytics/aggregates.ts` — funnel, retention, GMV, payout throughput, time-to-match
- `app/api/analytics/track/route.ts` — accept events, persist via E2 data layer
- `components/analytics/` — reusable `KpiCard`, `TimeseriesChart`, `FunnelChart` (SVG or recharts — pick one, log the choice)
- `app/(admin-analytics)/dashboard/page.tsx` — standalone admin analytics dashboard outside the protected admin surface

## Forbidden

- protected files, including `components/AdminApp.tsx`
- `app/api/**` outside `app/api/analytics/**`

## Done definition

- analytics dashboard renders real aggregates from seed + live events
- no collisions with existing admin tree
- lane flipped to `in-review`, decision logged

--- DISPATCH PROMPT END ---
