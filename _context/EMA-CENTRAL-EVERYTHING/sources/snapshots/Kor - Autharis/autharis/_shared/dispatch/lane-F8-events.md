# Dispatch: Lane F8 — Bun WebSocket gateway

--- DISPATCH PROMPT BEGIN ---

You are dispatched as session `<your-harness>-s<n>`. Your lane is **Lane F8 — Bun WebSocket gateway**.

## Read first

1. `services/events/README.md`
2. Lane E5 dispatch (in-app notifications inside Next.js) — E5 may consume this gateway over WS
3. `autharis/_shared/lanes.md`

## Claim the lane

Flip Lane F8 to `held`.

## File scope

- `services/events/**`

## Mission

Bun-native WebSocket server that fans out realtime events to connected clients:

- `src/server.ts` — `Bun.serve({ fetch, websocket })` with channels per engagement and per user
- HTTP POST `/publish` accepts events from `services/api` (F6) with an HMAC-signed shared secret
- Short-term ring buffer (last 100 events per channel) so clients can reconnect and catch up
- `src/client.ts` — thin ESM client that Next.js (E5) can import
- minimal test harness using `bun test`
- `Dockerfile` based on `oven/bun:1`

## Stack diversity purpose

Runs on Bun, not Node. The monorepo CI must orchestrate a mixed Node+Python+Bun matrix — coordinate with E8/V1 on workflow shape.

## Forbidden

- anything outside `services/events/**`

## Done when

- `bun run services/events/src/server.ts` starts the gateway
- demo client can connect, publish via HTTP, and receive the echo over WS
- decision logged

--- DISPATCH PROMPT END ---
