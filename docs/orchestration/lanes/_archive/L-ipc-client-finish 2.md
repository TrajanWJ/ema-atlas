# L-ipc-client-finish — IPC Client Comes Alive

**Status:** closed 2026-04-29 (7/7 minimum-behaviors verified; see STATUS.md session close 2026-04-29)
**Owner:** Runtime Vertical Slice Orchestrator
**Wave:** W1
**Corresponds to:** Target Slice A in `doctrine/planning/orchestrator-prompts/RUNTIME-VERTICAL-SLICE-ORCHESTRATOR-PROMPT.md`.

## Read first

1. `runtime/EMA-0.0.5--4-24/docs/orchestration/STATUS.md`
2. `doctrine/planning/orchestrator-prompts/RUNTIME-VERTICAL-SLICE-ORCHESTRATOR-PROMPT.md` (Target Slice A)
3. `runtime/EMA-0.0.5--4-24/packages/contracts/ipc/shell-protocol.md`
4. `runtime/EMA-0.0.5--4-24/docs/architecture/02-daemon-supervision.md`
5. `runtime/EMA-0.0.5--4-24/docs/architecture/05-writer-topology.md`
6. Current state of `packages/surface-core/src/ipc-client/index.ts` (217-line real client — do not stub over it).

## Scope

Writable paths:

- `packages/surface-core/src/ipc-client/**`
- `packages/contracts/ipc/**`
- `apps/web/src/lib/ipc/**`
- `tooling/m1-round-trip.mjs`

Out of scope for this lane:

- `apps/web/src/shell/topbar.tsx` (consumer — belongs to `L-projections-topbar`).
- Daemon writer code (`apps/daemon/src/ema_*/` — belongs to Canon Writers lanes).
- Visual/UX styling.

## Dependencies

- Blocks: `L-projections-topbar` (topbar cannot swap off mocks until the client is verified complete).
- Depends on: none — wire is alive today.

## Exit criteria

All 7 minimum-behaviors from Runtime Slice Target Slice A must be demonstrably met, not just compiled:

1. Opens `ws://127.0.0.1:49555`.
2. Sends `hello`; requires `hello_ack`.
3. Supports `ping` and `debug.ping`.
4. Supports `subscribe` and event fan-out.
5. Maintains pending command requests by id.
6. Reconnects with backoff.
7. Surfaces clear offline/error state to hooks.

Plus:

- `node tooling/m1-round-trip.mjs` still returns `m1-round-trip: OK` against the live daemon on 49555.
- No UI code constructs raw daemon frames (grep `apps/web/src/**` for direct WS usage — must be zero hits).
- A browser page can subscribe to a projection without directly knowing the wire format.

## Reporting template

On close, append to `STATUS.md`:

```text
Lane: L-ipc-client-finish
Status: closed <YYYY-MM-DD>
Files changed:
  - packages/surface-core/src/ipc-client/...
  - apps/web/src/lib/ipc/...
7/7 minimum-behaviors verified:
  1. hello/hello_ack: <note>
  2. ping: <note>
  ...
m1-round-trip.mjs: <pass | updated to new contract>
Mock/stub remaining in scope: <none | list>
Risks: <none | list>
Unblocks: L-projections-topbar
```

## Ledger anchor

Report lane closure to `runtime/EMA-0.0.5--4-24/docs/orchestration/STATUS.md`.
