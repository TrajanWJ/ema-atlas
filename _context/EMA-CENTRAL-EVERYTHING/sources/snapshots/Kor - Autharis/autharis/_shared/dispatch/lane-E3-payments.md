# Dispatch: Lane E3 — Payments and invoicing engine

--- DISPATCH PROMPT BEGIN ---

You are dispatched to the Autharis swarm as session `<your-harness>-s<n>`. Your lane is **Lane E3 — Payments and invoicing engine**.

## Read first

1. `autharis/AGENTS.md`
2. `_shared/README.md`, `_shared/lanes.md`
3. `lib/data.ts` (read-only reference — `INVOICES`, `TIMESHEETS`, `ENGAGEMENTS` shapes)
4. `components/ClientApp.tsx` invoice modal usage (read-only)

## Claim the lane

Flip Lane E3 to `held`.

## File scope

- `components/payments/**`
- `app/(payments)/**`
- `lib/payments/**`
- `app/api/payments/**`

## Mission

Build the payments / invoicing engine as a self-contained module:

- timesheet-to-invoice generator (hours × rate + fees + tax hook)
- invoice state machine: `draft → issued → paid → overdue → voided`
- payout calculator for the talent side (platform fee, net payout, ETA)
- Stripe-style webhook stub under `app/api/payments/webhook/` that simulates `invoice.paid` events
- PDF-ish printable invoice view at `app/(payments)/invoice/[id]/page.tsx`
- no real Stripe integration — stubbed client in `lib/payments/provider.ts` with a clear swap seam

## Forbidden

- protected files
- writing inside `app/api/**` outside `app/api/payments/**`
- editing existing client/talent surface files — consume them via the shell only

## Done definition

- invoice lifecycle simulates end-to-end from timesheet approval → invoice → paid
- payout numbers match across client and talent-side views
- lane flipped to `in-review`, decision logged

--- DISPATCH PROMPT END ---
