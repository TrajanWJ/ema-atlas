# apps/desktop

The native EMA shell. Tauri v2. Loads the `@ema/web` UI into its
webview and connects to the user-level daemon over
`ws://127.0.0.1:49555` — identical to what the browser build does.

## Design rule

Tauri does NOT spawn or embed the daemon. The daemon runs as a
user-level system service (`launchd`, `systemd --user`, Windows Scheduled
Task). On first launch, if the service is not installed, the desktop
app should prompt to install it. See
`docs/architecture/05-writer-topology.md`.

## Run (dev)

```
# Terminal 1 — daemon
cd apps/daemon && gleam run

# Terminal 2 — web dev server (Tauri loads this URL)
cd apps/web && pnpm dev

# Terminal 3 — desktop
cd apps/desktop && pnpm tauri dev
```

## Desktop artifacts

`EMA.app` produced by Tauri is the desktop app. The built macOS artifact
is:

```
apps/desktop/src-tauri/target/release/bundle/macos/EMA.app
```

To place that built app where a human expects the 0.0.6 desktop app:

```
scripts/install-macos-tauri-app.sh
```

Do not replace this with an AppleScript web/dev launcher. The human-facing
Desktop icon for EMA 0.0.6 is the Tauri bundle installed as
`~/Desktop/EMA 0.0.6.app`.

## Tauri capability matrix

(Placeholder — to be filled in a later wave when window partitioning
ships.)

| Window              | Shell | FS  | Net  | Stronghold |
| ------------------- | ----- | --- | ---- | ---------- |
| `main`              | —     | —   | WS   | —          |
| `device-pairing`    | —     | —   | —    | read       |
| `settings-admin`    | —     | —   | WS   | read       |
| `runtime-console`   | —     | —   | WS   | —          |

For wave 1 only `main` exists.
