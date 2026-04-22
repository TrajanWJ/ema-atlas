# Architecture Overview

## Route Groups
- `(desktop)` — Virtual desktop with windowed apps, dock, top bar
- `(immersive)` — Full-page sections: portfolio, about, community, cool-stuff, services
- `popout/[appId]` — Detached window popout (titlebar + app content only)

## State Management
- **Zustand** — Client state (window positions, active timers, UI toggles)
- **wa-sqlite via OPFS** — Persistent app data (notes, tasks, habits, etc.)
- **localStorage** — Ephemeral UI state (window persistence, workspace layouts)
- **BroadcastChannel** — Cross-window sync (`place_sync` channel)

## Data Flow
Apps own their SQLite tables. Cross-app communication via event bus (wraps BroadcastChannel + in-memory pub/sub). Apps never directly import each other's stores.

## Window System (Modules A-F)
All 6 modules built. See `plans/windowing-system.md` for details.

## Key Files
| Concern | File |
|---------|------|
| Window orchestration | `src/components/window-manager/WindowManager.tsx` |
| Window state | `src/stores/window-store.ts` |
| Window persistence | `src/stores/window-persistence.ts` |
| DB client | `src/db/client.ts` |
| DB schema/migrations | `src/db/schema.ts` |
| Cross-window sync | `src/lib/sync-channel.ts` |
| App content mapping | `src/components/window-manager/AppContent.tsx` |
