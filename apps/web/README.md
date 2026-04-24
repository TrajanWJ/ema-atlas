# apps/web

Browser-hosted EMA shell. Also embedded by `apps/desktop` via Tauri v2
webview, so a single UI codebase runs in both.

## Run (dev)

```
cd apps/web
pnpm install      # or npm / yarn
pnpm dev
```

The shell connects to the daemon over `ws://127.0.0.1:49555` (see
`packages/contracts/ipc/shell-protocol.md`). If the daemon is not running,
the shell renders in "offline" mode (topbar shows "daemon unreachable").

## Routes (wave 1)

| Path                                                    | Renders                              |
| ------------------------------------------------------- | ------------------------------------ |
| `/`                                                     | redirect to last-used project        |
| `/orgs/:orgId/spaces/:spaceId/projects/:projectId`      | project home (blueprint vApp)        |
| `/orgs/:orgId/spaces/:spaceId/projects/:projectId/git-ema` | git-ema vApp for this project     |
| `/settings`                                             | settings surface                     |
| `/git-ema`                                              | standalone git-ema page (user scope) |

## Structure

```
src/
  app/                  Route definitions
  shell/                Topbar + org/space/project selectors
  vapps/
    blueprint/          Blueprint vApp (stub)
    git-ema/            git-ema vApp (connectors + attachments)
  lib/ipc/              Thin wrapper over @ema/surface-core ipc client
```

## Anti-drift rule

Surfaces never write truth. Any mutation flows as a `command` to the
daemon. Surface-local state is UI-only (modal open/closed, focus,
scroll).
