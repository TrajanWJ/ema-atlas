---
name: place-companion-bridge
description: Use when rebuilding EMA 0.0.6 desktop/native popout behavior, transparent frameless windows, localhost companion bridge, Tauri shell integration, or macOS app packaging from place-companion.
---

# Place Companion Bridge

Use this skill for native shell and companion behavior. place-companion is the donor for transparent popout windows and local bridge protocol; EMA's desktop app still connects to the EMA daemon and must not embed daemon truth.

## Donor Sources

- `../../Projects/EMA/atlas/incubating/place/place-companion/src-tauri/src/main.rs`
- `../../Projects/EMA/atlas/incubating/place/place-companion/src-tauri/src/ws_server.rs`
- `../../Projects/EMA/atlas/incubating/place/place-companion/src-tauri/src/protocol.rs`
- `../../Projects/EMA/atlas/incubating/place/place-companion/src-tauri/src/window_mgr.rs`
- `../../Projects/EMA/atlas/incubating/place/place-companion/src-tauri/src/origin_check.rs`
- `../../Projects/EMA/atlas/incubating/place/place.org/src/lib/companion-bridge.ts`
- `../../Projects/EMA/atlas/incubating/place/place.org/src/lib/popout-launcher.ts`

## EMA Targets

- `apps/desktop/src-tauri/`
- `apps/web/src/place-reflection/`
- `apps/web/src/shell/`
- `packages/contracts/ipc/`
- `scripts/install-macos-tauri-app.sh`

## Rules

1. Keep localhost-only networking and origin checks.
2. Preserve transparent, frameless native-window behavior where the platform supports it.
3. Keep desktop packaging disposable. The built mac app is an artifact and can be regenerated.
4. Do not move EMA daemon ownership into the Tauri shell. The desktop app is a surface connected to `ws://127.0.0.1:49555`.
5. Make all bridge messages typed in `packages/contracts` before multiple callers depend on them.
6. Preserve browser fallback behavior when the companion/native bridge is absent.

## Validation

- Remove stale app bundles before visual review: `rm -rf apps/desktop/src-tauri/target/release/bundle/macos/EMA.app`.
- Rebuild from source before checking progress.
- Verify no installed Desktop app exists at `~/Desktop/EMA 0.0.6.app` unless intentionally installed by `scripts/install-macos-tauri-app.sh`.
