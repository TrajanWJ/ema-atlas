# apps/daemon

The EMA daemon. Gleam on BEAM. Owns canonical truth, the event log, and
the localhost WebSocket IPC endpoint.

## Run (dev)

```
cd apps/daemon
gleam run
```

The daemon listens on `127.0.0.1:<port>` (default `49_555`) and logs
`daemon up` once its supervision tree is healthy.

## P2P dev-build updates

Until daemon-to-daemon transport is live, dev builds can move runtime files
peer-to-peer with the repo-level updater:

```
cd ../..
node tooling/p2p-dev-update.mjs serve --pack --host 0.0.0.0 --port 49666
```

Another peer can then run:

```
node tooling/p2p-dev-update.mjs check --peer http://<source-peer-ip>:49666
node tooling/p2p-dev-update.mjs apply --peer http://<source-peer-ip>:49666 --yes
```

See `docs/dev/p2p-dev-updates.md`.

## Layout

```
src/
  ema_daemon.gleam               entrypoint
  ema_daemon/
    supervisor.gleam             top-level supervision tree
    registry.gleam               named-actor registry
    bus.gleam                    in-process event bus
  ema_identity/                  bounded context
  ema_orgs/
  ema_spaces/
  ema_projects/
  ema_memberships/
  ema_invites/
  ema_blueprint/
  ema_attachments/               git-ema backend (this wave's focus)
  ema_replication/
  ema_shell_ipc/                 localhost WS server
```

## Status (0.0.5 wave 1)

This is scaffolding. The Gleam modules present are skeletons with the
correct shape (supervisor wiring, actor message types, bounded-context
module names) but are not yet fully wired. They exist to establish the
code shape before behavior fills in.

## Contracts

Every event kind emitted here MUST be listed in
`../../packages/contracts/events/catalog.v0.md`.
Every command op accepted here MUST be listed in
`../../packages/contracts/ipc/shell-protocol.md`.

`../../tooling/contract-check.sh` enforces both.
