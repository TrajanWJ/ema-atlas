# apps/daemon

The EMA daemon. Gleam on BEAM (with Elixir contexts alongside as of
Slice 2 of the cwt-absorption migration). Owns canonical truth, the
event log, and the localhost WebSocket IPC endpoint.

## Run (dev)

```
cd apps/daemon
gleam run
```

The daemon listens on `127.0.0.1:<port>` (default `49_555`) and logs
`daemon up` once its supervision tree is healthy.

## Build (Elixir contexts)

The daemon hosts two parallel toolchains on top of the same BEAM
runtime. Build them in either order:

```
cd apps/daemon
gleam build           # Gleam contexts under src/
mix deps.get          # No deps yet, but harmless and forward-looking
mix compile           # Elixir contexts under lib/
mix test              # ExUnit suite for EmaClients + EmaResponsibilities
```

`mix.exs` declares the Elixir application as `:ema_daemon_elixir` and
keeps it independent of `gleam.toml`. Both compile to BEAM bytecode;
the Gleam supervisor can name-call into Elixir GenServers via
`:'Elixir.EmaClients.Server'.<call>` once mounted (see "Wiring
Elixir contexts into the supervisor" below). Toolchain pins:

- Elixir: `~> 1.17` (developed against 1.19.5)
- Erlang/OTP: 28 (matches Gleam 1.16.0's runtime)
- Mix: 1.19.5

## Wiring Elixir contexts into the supervisor

`EmaClients.Server` and `EmaResponsibilities.Server` are plain OTP
GenServers. They start independently via:

```elixir
Application.start(:ema_daemon_elixir)
```

…which boots `EmaDaemon.ElixirSupervisor` (defined in
`lib/ema_daemon_elixir.ex`).

To run them under the Gleam supervisor instead, mount each as a child
spec from `src/ema_daemon/supervisor.gleam`. The cleanest pattern is
to hand-construct an OTP `start_link` call to the Elixir module-as-atom:

```gleam
// Pseudocode — inside supervisor.start():
case start_elixir_genserver("Elixir.EmaClients.Server") {
  Ok(_) -> ...
  Error(reason) -> Error(ChildFailedToStart("ema_clients", reason))
}

// And the FFI:
@external(erlang, "gen_server", "start_link")
fn start_elixir_genserver(module: String) -> Result(Pid, Reason)
```

Slice 2 deliberately leaves `supervisor.gleam` untouched — the
Elixir contexts run as their own application and the Gleam tree is
unchanged. The mount is a Slice 3 deliverable.

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
src/                             Gleam contexts
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

lib/                             Elixir contexts (Slice 2 of cwt-absorption)
  ema_daemon_elixir.ex           Elixir application + supervisor
  ema_clients.ex                 client.* writer API
  ema_clients/
    event.ex                     envelope constructors
    projection.ex                ETS-backed projection
    server.ex                    GenServer
  ema_responsibilities.ex        responsibility.* writer API
  ema_responsibilities/
    event.ex
    projection.ex
    server.ex

test/                            Mixed Gleam + Elixir tests
  *_test.gleam                   gleeunit (run via `gleam test`)
  *_test.exs                     ExUnit (run via `mix test`)
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
