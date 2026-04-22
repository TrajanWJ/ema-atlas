# Track A — Shell / Launchpad / HQ / Multi-Window UX

Date: 2026-04-13
Plane: planning
Owning canon: `SCHEMATIC-v0`, `EMA-V1-SPEC` §UI, `canon/specs/BLUEPRINT-PLANNER`

## Scope

The operator cockpit: Launchpad entry, HQ home, multi-window management, layout persistence, space switching, notifications tray. Every tier-0 surface reachable from here.

## Entity implications

- **New**: `workstream` (durable thread identity), `notification`, `layout-state` (persistent per-space, per-user)
- **Extend**: `space` (mount layout-state), HQ aggregate read model to include workstream + active agent count

## Current reality

- `apps/renderer/src/components/hq/HQApp.tsx` — 862 LOC, wired to multiple services. Keep.
- `apps/renderer/src/components/layout/Shell.tsx`, `Dock.tsx`, `Launchpad.tsx`, `AppWindowChrome.tsx`, `WindowResizeFrame.tsx`, `WindowHeaderActions.tsx` — exist. Window registry at `apps/electron/windows/registry.ts` + state at `apps/electron/windows/state.ts`.
- No persistent layout model keyed to workstream or space.
- No command palette.
- No notifications tray (schema missing).

## Implementation sequence

1. **Ship `workstream` schema** (shared/schemas/workstream.ts) — depends on nothing, unblocks everything in Tracks A/B/C. [schema-first]
2. **Ship `notification` schema** + thin `services/core/notifications/` service with `list/ack/dismiss` routes. Single SQLite table.
3. **Add `/api/layout`** surface: `GET /api/layout?space=<id>` → returns layout-state JSON; `PUT /api/layout` persists. Table keyed by (user, space).
4. **Wire Electron `windows/state.ts`** to hydrate from `/api/layout` on startup, flush on window move/resize (debounced 1s).
5. **LaunchpadApp** — new component at `apps/renderer/src/components/launchpad/LaunchpadApp.tsx`. Grid of tier-0 vApps, keyboard-navigable, opens via global shortcut, honors space context.
6. **Command palette** — new `apps/renderer/src/components/layout/CommandPalette.tsx`. Fuzzy-match over vApps + workstreams + chronicle entries.
7. **Notifications tray** — new component in `Shell.tsx`; polls `/api/notifications?unread=1` every 5s, optimistic on WS event `notifications:new`.
8. **HQ extension** — add workstream strip (active workstreams + status); wire to `/api/workstreams` once that lands in Track B.

## Dependencies

- Track B must ship `workstream` routes before HQ workstream strip is real (schema alone is enough to start).
- Track D must ship `machine` schema before Launchpad machine context strip is real.

## Steal-now imports

- AGOR rail-and-dock shell — lift layout primitive into `Shell.tsx` grid
- Plane command palette — cmd+k pattern
- Dagster asset catalog — HQ extension model for "things EMA owns"
- Temporal workflow list — HQ executions card format

## Risk areas

- **Electron window state races**: resize events fire faster than debounce handles when dragging multi-monitor. Solution: debounce on trailing edge, confirm via `main.ts` IPC round-trip before PUT.
- **Multi-window layout-state shape instability**: start minimal (x, y, w, h, zoom, visible), expand with tests, not vibes.
- **Command palette scope creep**: v1.1 = vApp launch + workstream switch only. Everything else is post-v1.1.

## Minimum real MVP

Launchpad opens via global shortcut, shows 10+ vApps, clicking opens each in a BrowserWindow whose size and position survive an app restart — tied to the current space. Notifications tray shows at least chronicle-sourced warnings. HQ shows a workstream strip that is populated by at least two real workstream records.
