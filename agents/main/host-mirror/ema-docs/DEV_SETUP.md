# EMA — Dev Setup Guide

This guide reflects the **current** EMA runtime: the TypeScript-first Electron monorepo.

If you are looking for the old Elixir/Phoenix/Tauri setup, that is archived under `IGNORE_OLD_TAURI_BUILD/` and is not the active development path.

## Read First

- `docs/OPERATING-REALITY.md`
- `docs/MEMORY-SYNC.md`
- `README.md`
- `docs/backend/README.md`
- `docs/GROUND-TRUTH.md`

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 22.x | `asdf install nodejs 22.x` or `nvm install 22 && nvm use 22` |
| pnpm | >= 9 | `npm i -g pnpm` |

## 1. Clone & Enter

```bash
git clone <repo> ema
cd ema
```

## 2. Install Dependencies

```bash
pnpm install
```

## 3. Run the Current Dev Stack

```bash
pnpm dev
```

That starts:

- Vite renderer on `:1420`
- local services on `:4488`
- workers
- Electron desktop shell

## 4. Build

```bash
pnpm build
pnpm package:desktop
```

## 5. Test

```bash
pnpm test
```

## Common Dev Tasks

| Task | Command |
|---|---|
| Start full dev stack | `pnpm dev` |
| Build all packages | `pnpm build` |
| Run tests | `pnpm test` |
| Run lint | `pnpm lint` |
| Package desktop app | `pnpm package:desktop` |
| Extract contracts | `pnpm extract:contracts` |
| Run parity check | `pnpm parity` |

## Runtime Notes

- Current local service port: `4488`
- Current desktop shell: Electron
- Current backend/services stack: TypeScript/Node
- Archived old stack: `IGNORE_OLD_TAURI_BUILD/`

## Troubleshooting

### Port 4488 already in use
```bash
lsof -i :4488 | grep LISTEN
kill -9 <PID>
```

### Fresh install issues
```bash
rm -rf node_modules
pnpm install
```

### Build drift / stale docs
If a doc tells you to run `mix`, `phx.server`, or Tauri as the main path, treat it as stale unless it is clearly marked archival.


## Durable host runtime

For host recovery and reboot-safe operation on Linux, install the repo-owned systemd user runtime:

```bash
cd ~/Projects/ema
./scripts/install-runtime.sh
```

That pins the runtime to Node 22, installs `ema-services` / `ema-workers` user units, and validates `/api/health`.
