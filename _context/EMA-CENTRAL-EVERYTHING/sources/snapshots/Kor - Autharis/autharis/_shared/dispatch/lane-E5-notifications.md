# Dispatch: Lane E5 — Notifications and messaging

--- DISPATCH PROMPT BEGIN ---

You are dispatched to the Autharis swarm as session `<your-harness>-s<n>`. Your lane is **Lane E5 — Notifications and messaging**.

## Read first

1. `autharis/AGENTS.md`
2. `_shared/README.md`, `_shared/lanes.md`
3. `lib/data.ts` (read-only — user/engagement shapes)

## Claim the lane

Flip Lane E5 to `held`.

## File scope

- `lib/notifications/**`
- `app/api/notifications/**`
- `components/notifications/**`
- `components/messaging/**`

## Mission

Ship in-app notifications + lightweight messaging between client ↔ talent:

- `lib/notifications/bus.ts` — typed event bus (match-found, timesheet-submitted, invoice-paid, dispute-opened, message-received)
- `components/notifications/Inbox.tsx` — bell + dropdown, mark-as-read, group by day
- `components/messaging/Thread.tsx` — per-engagement thread, optimistic send, typing indicator stub
- `app/api/notifications/stream/route.ts` — SSE stream endpoint (or long-poll fallback documented in `decisions.md`)
- email digest stub: `lib/notifications/email.ts` that renders a react-email-style template but logs to console

## Forbidden

- protected files
- other lanes' API route groups
- editing `lib/data.ts`

## Done definition

- events fire end-to-end on the key state changes listed above
- Inbox + Thread components are drop-in for any surface
- lane flipped to `in-review`, decision logged

--- DISPATCH PROMPT END ---
