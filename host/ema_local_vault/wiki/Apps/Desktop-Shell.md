---
title: "Desktop Shell"
space: wiki
tags: ["apps", "frontend", "shell", "tauri"]
source: manual
---

# Desktop Shell

The EMA desktop app runs as a Tauri 2 application with a single webview window. All 28 vApps are loaded via route-based switching within this window — no separate windows per app.

## Architecture

```
┌─────────────────────────────────────────────┐
│  Tauri Shell (Rust)                         │
│  ├─ Single "launchpad" webview (900x650)    │
│  ├─ Transparent, no native decorations      │
│  └─ Tray icon (close = minimize to tray)    │
├─────────────────────────────────────────────┤
│  React Frontend (app/src/)                  │
│  ├─ Shell.tsx — main wrapper                │
│  ├─ Route-based app switching (App.tsx)      │
│  ├─ 79 Zustand stores                       │
│  └─ Glass CSS design system (globals.css)   │
├─────────────────────────────────────────────┤
│  Phoenix Daemon (localhost:4488)            │
│  ├─ REST API for initial load               │
│  └─ WebSocket channels for real-time sync   │
└─────────────────────────────────────────────┘
```

## Shell Components

| Component | Source | Purpose |
|-----------|--------|---------|
| Shell.tsx | `app/src/components/layout/Shell.tsx` | Main wrapper. Initializes all 79 stores on mount. Establishes Phoenix WebSocket connection. |
| Launchpad.tsx | `app/src/components/layout/Launchpad.tsx` | Home screen. App tile grid (5 categories), greeting, One Thing card, system stats. |
| Dock.tsx | `app/src/components/layout/Dock.tsx` | Vertical app launcher bar (56px). Green dots for running apps. Emoji icons. |
| AmbientStrip.tsx | `app/src/components/layout/AmbientStrip.tsx` | Custom titlebar (32px). Clock, window controls. Replaces native title bar. |
| AppWindowChrome.tsx | `app/src/components/layout/AppWindowChrome.tsx` | Window frame for per-app views (title bar, controls, accent color stripe). |
| AppTile.tsx | `app/src/components/layout/AppTile.tsx` | Individual app tile with icon, name, accent color. |

## App Routing

Source: `app/src/App.tsx`

URL path is stripped of leading `/` and matched in a switch statement. Empty route falls back to Launchpad. Each route renders the corresponding `*App.tsx` component.

## Glass Design System

Source: `app/src/globals.css`

| Surface | Opacity | Blur | Use |
|---------|---------|------|-----|
| glass-ambient | 40% | 6px | Background elements |
| glass-surface | 55% | 20px | Content panels |
| glass-elevated | 65% | 28px | Modal/floating elements |

**Colors:** Void #060610 → Base #0A0C14 → Surfaces #0E1017/#141721/#1A1D2A
**Text opacity:** Primary 0.87, Secondary 0.60, Tertiary 0.40, Muted 0.25
**Fonts:** system-ui (sans), JetBrains Mono (mono)

## Connectivity

| Module | Source | Purpose |
|--------|--------|---------|
| api.ts | `app/src/lib/api.ts` | REST client via Tauri HTTP plugin, base URL localhost:4488/api |
| ws.ts | `app/src/lib/ws.ts` | Phoenix WebSocket singleton at ws://localhost:4488/socket |
| window-manager.ts | `app/src/lib/window-manager.ts` | Tauri WebviewWindow lifecycle (open/close/restore/save) |

## Tauri Config

Source: `app/src-tauri/tauri.conf.json`

Single window: "launchpad" (900x650, min 700x500, transparent, no decorations). All apps load via route switching within this window.

## Related

- [[vApp Catalog]] — all 28 active apps
- [[HQ Frontend]] — alternative web dashboard
- [[Configuration-System]] — settings and window state
