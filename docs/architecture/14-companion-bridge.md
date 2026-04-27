# Companion Bridge

Status: draft, canonized 2026-04-24.

EMA is absorbing the place.org native companion idea into `apps/desktop/src-tauri`
instead of keeping a separate companion repo. The browser vDesktop may expose
drag-out and detach affordances immediately, but native transparent windows are
machine capabilities and must be owned by the Tauri package that sits beside the
Gleam daemon.

Current wave:

- `apps/web/app/page.tsx` exposes detach affordances and a browser popup
  fallback.
- `apps/desktop/src-tauri/src/companion_bridge.rs` exposes a Tauri command for
  capability discovery.
- `apps/web/src/app/styles.css` carries the visible place.org desktop mechanics:
  right-click menus, simulated filesystem, Finder, resizable windows, dock,
  launchpad, and glass shell.
- `docs/architecture/15-web-org-access-point.md` defines the browser as a
  QR-authenticated org access point, not a p2p machine peer.

Next native wave:

- Add a Tauri command that accepts `{ window_id, app_id, position }`.
- Spawn a native child webview/window using the existing Next route and shared
  window state.
- Mark transparent-window support as true only when the platform-specific
  Tauri window flags are actually wired and verified.
- Keep authority separate: window placement can be local/native, browser access
  can be organization-scoped, but durable files, canon, and project state still
  belong to the organization and its p2p machine network.
