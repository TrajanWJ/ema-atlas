# Companion App Integration

> How the place.org virtual desktop extends to native transparent windows via the companion app.

## Overview

The **place-companion** is a lightweight Tauri v2 desktop app that runs as a system tray icon. When installed, it enables place.org virtual desktop windows to pop out as truly transparent, frameless native windows on the user's real desktop. When not installed, everything falls back to standard browser popups.

**Repos:**
- Companion: [github.com/TrajanWJ/place-companion](https://github.com/TrajanWJ/place-companion)
- Web integration: `src/lib/companion-bridge.ts`, `src/components/popout/`

## Architecture

```
Browser (any)                          Companion (Tauri v2)
┌────────────────────────┐             ┌──────────────────┐
│ place.org web app      │             │ System tray icon  │
│ ┌────────────────────┐ │  WebSocket  │ ┌──────────────┐ │
│ │ CompanionBridge    │◄├────────────►│ │ WS Server    │ │
│ │ (auto-detect)      │ │ :27182-89  │ │ (tokio)      │ │
│ └────────────────────┘ │             │ └──────────────┘ │
│ ┌────────────────────┐ │             │ ┌──────────────┐ │
│ │ PopoutLauncher     │ │             │ │ WindowManager│ │
│ │ (detach gate)      │ │             │ │ (webviews)   │ │
│ └────────────────────┘ │             │ └──────────────┘ │
└────────────────────────┘             └──────────────────┘
                                              │
                                              ▼ spawns
                                       Native windows
                                       (transparent, frameless)
```

## Connection Flow

1. Desktop page mounts → `useCompanionBridge()` hook fires
2. `companionBridge.connect()` tries cached port from localStorage, then scans 27182-27189 in parallel
3. First successful WebSocket gets `hello` message → bridge is `available`
4. Port cached in localStorage for instant reconnect on next load
5. If all ports fail → silent exponential backoff (1s → 2s → 4s → max 30s)

**Timeout:** 500ms per port (localhost connections are instant when listening)

## Detach Flow (Drag-to-Pop-Out)

```
User drags window past viewport edge
  ↓
Window.tsx handleDragStop() detects outside viewport
  ↓
getPopoutLauncher().detach(windowId, appId, position)
  ↓
companionBridge.isAvailable()?
  ├── YES → companion.openWindow() → WS → companion creates transparent webview
  │         return "companion" (truthy) → closeWindow() removes from desktop
  │
  └── NO  → window.open() → browser popup with URL bar
            return Window ref (truthy) → closeWindow() removes from desktop
```

The gate is `companionBridge.isAvailable()` — a single boolean check. Everything below is either companion path or browser path, never both.

## Reattach Flow (Back to Desktop)

**Companion path:**
1. User clicks "Desktop" button in companion window titlebar
2. `__PLACE_COMPANION_REATTACH__(windowId, appId)` → Tauri IPC `reattach` command
3. Companion forwards `window-reattach` over WebSocket to browser
4. Browser's `useCompanionBridge()` listener opens the window inline
5. Browser sends `reattach-ack` → companion closes the native window
6. 3-second timeout: companion closes window anyway if no ack

**Browser popup path:**
1. User clicks "Desktop" button in browser popup titlebar
2. `window.opener.postMessage({ type: 'place_reattach', appId })`
3. Desktop page `useReattachListener()` opens the window inline
4. `window.close()` closes the popup

## PopoutShell Modes

The `/popout/[appId]` route renders differently based on context:

| Mode | Detection | Background | Titlebar | Drag |
|------|-----------|------------|----------|------|
| Companion | `?companion=true` in URL | Transparent (glass) | Traffic lights always colored, `data-tauri-drag-region` | Tauri native |
| Browser popup | `window.name` starts with `place_tool_` | Opaque dark (#060610) | Traffic lights on hover | `-webkit-app-region: drag` |
| In tab | `window.menubar.visible === true` | Opaque dark | Hidden | N/A |

## WebSocket Protocol

**Port:** First available in 27182-27189

**Auth:** Origin header checked server-side. Allowlist: `place.org`, `www.place.org`, `localhost:3000-3009`

**Messages (Browser → Companion):**
- `open-window` — create transparent webview
- `close-window` — destroy webview
- `move-window` — reposition
- `resize-window` — resize
- `focus-window` — bring to front
- `reattach-ack` — confirm reattach received
- `ping` — keepalive (every 15s)

**Messages (Companion → Browser):**
- `hello` — handshake + current window list
- `window-opened` — confirm creation
- `window-closed` — user closed natively
- `window-moved` — user dragged natively
- `window-resized` — user resized natively
- `window-reattach` — user clicked "Desktop"
- `window-error` — creation failed
- `pong` — keepalive response

## Default Window Sizes for Popouts

Sizes from `src/lib/constants.ts DEFAULT_WINDOW_SIZES`. These are used as `bounds` when the companion creates native windows. Minimum practical sizes for standalone use:

| App | Desktop Size | Good for Popout? | Notes |
|-----|-------------|-------------------|-------|
| Clock | 240×260 | Small but fine | Widget-like |
| Music | 280×160 | Fine | Mini player |
| Calculator | 240×320 | Fine | Standard calc |
| Brain Dump | 340×380 | Good | |
| Focus | 320×360 | Good | Timer + controls |
| Tasks | 380×380 | Good | |
| Habits | 340×370 | Good | |
| Journal | 400×400 | Good | |
| Notes | 420×400 | Good | |
| Settings | 380×380 | Good | |
| Terminal | 380×280 | Could be taller | |
| System Monitor | 420×360 | Good | |
| Finder | 440×380 | Good | |
| Calendar | 440×380 | Good | |

## Platform Status

| Platform | Transparency | Dragging | Tray | Autostart |
|----------|-------------|----------|------|-----------|
| **Windows 10/11** | Works (WebView2) | Works | Works | Works (re-enabled on boot) |
| **macOS** | wry 0.54.4 + objc2 NSWindow fix | Works | Works (no dock icon) | Works (LaunchAgent) |
| **Linux X11 + compositor** | Works | Works | Works (needs AppIndicator on GNOME) | Works (.desktop file) |
| **Linux Wayland** | Works | `start_dragging` via IPC | Works | Works |
| **Linux X11 no compositor** | Falls back to opaque | Works | Works | Works |

## Key Files

### Companion App (`place-companion/`)
| File | Purpose |
|------|---------|
| `src-tauri/src/main.rs` | Entry, tray, platform fixes (macOS dock hide, Windows autostart) |
| `src-tauri/src/ws_server.rs` | WebSocket server, message routing, keepalive |
| `src-tauri/src/window_mgr.rs` | Create/track/destroy transparent webviews |
| `src-tauri/src/commands.rs` | Tauri IPC (reattach from webview) |
| `src-tauri/src/protocol.rs` | Message types (serde) |
| `src-tauri/src/origin_check.rs` | WebSocket origin validation |
| `src-tauri/capabilities/default.json` | ACL: remote.urls + window permissions |

### Web App (`place.org/`)
| File | Purpose |
|------|---------|
| `src/lib/companion-bridge.ts` | WebSocket client, port discovery, auto-reconnect |
| `src/lib/popout-launcher.ts` | `detach()` gate: companion-first, browser fallback |
| `src/components/popout/PopoutShell.tsx` | Companion mode: transparent body, glass effect |
| `src/components/popout/PopoutTitleBar.tsx` | Traffic lights, drag, reattach (both paths) |
| `src/components/window-manager/Window.tsx` | Drag-to-detach, context-aware overlay |
| `app/(desktop)/page.tsx` | `useCompanionBridge()` hook, reattach listeners |
| `src/components/companion/CompanionDownload.tsx` | Download page at `/companion` |

## Spec & Plans
- Design spec: `docs/superpowers/specs/2026-03-24-companion-app-design.md`
- Implementation plan: `docs/superpowers/plans/2026-03-24-companion-app.md`
