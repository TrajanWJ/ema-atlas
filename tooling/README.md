# tooling

Project-wide developer tooling choices.

## Languages + toolchains

| Component          | Language | Toolchain             |
| ------------------ | -------- | --------------------- |
| `apps/daemon`      | Gleam    | `gleam` (≥ 1.0)       |
| `apps/daemon` deps | Erlang   | OTP 26+ (via rebar3)  |
| `apps/desktop`     | Rust     | stable toolchain via `rustup` |
| `apps/web`         | TS+React | Node 20+ + pnpm 9+    |
| `packages/*`       | TS       | Node 20+ + pnpm 9+    |

## Package manager

**pnpm** with workspaces for TS packages. `pnpm-workspace.yaml` at repo
root lists `apps/web`, `apps/desktop`, and all of `packages/*`.

## Install

```
# Gleam
brew install gleam        # or see https://gleam.run

# Node + pnpm
brew install node pnpm    # or corepack enable && corepack prepare pnpm@9 --activate

# Rust (for Tauri desktop)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## Contract check

`scripts/contract-check.sh` verifies that every event-kind string in
source code is listed in `packages/contracts/events/catalog.v0.md`.

## P2P dev updates

`tooling/p2p-dev-update.mjs` lets one EMA dev workspace publish a manifest and
archive over LAN HTTP, and lets another dev workspace verify, back up, and apply
that archive. See `docs/dev/p2p-dev-updates.md`.

## Formatting

- Gleam: `gleam format`
- Rust: `cargo fmt`
- TS: (opinionated later) Prettier w/ defaults

## Not here yet

- CI pipeline definitions
- Release / packaging scripts
- Hooks for `contract-check` (add once repo init is real)
