# @ema/surface-core

Framework-agnostic shell logic. Imported by `@ema/web` (and anything
else that talks to the EMA daemon over WS).

## What lives here

- `ipc-client/` — WebSocket client that speaks
  `packages/contracts/ipc/shell-protocol.md`. Owns reconnection,
  projection cache, subscription fan-out.
- `selectors/` — org / space / project selector state machines. Pure
  logic, no UI.
- `projections/` — typed projection shapes + convenience readers.

## What does NOT live here

- React / DOM / UI framework code (lives in `@ema/web` or `@ema/design-system`)
- Business logic (lives in the daemon)

## Status (0.0.5 wave 1)

The IPC client is a thin skeleton with the correct public API (so
`@ema/web` can compile against it) but the WS wiring is stubbed. A
real wave-1 goal is to make the skeleton fire-and-receive well enough
to demo the git-ema flow end-to-end against the real daemon.
