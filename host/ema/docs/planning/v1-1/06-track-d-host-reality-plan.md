# Track D — Host Reality / Terminal / Machines / Services / Notifications

Date: 2026-04-13
Plane: planning
Owning canon: `canon/specs/AGENT-RUNTIME`, `canon/specs/BABYSITTER-SYSTEM`

## Scope

Machine awareness. Service supervision. Host-truth integration. EMA must know what is running where and be able to surface it. The VM vs host boundary matters: `agent-vm` was the old self side; `host-machine` is now the bridge target.

## Entity implications

- **New**: `machine`, `service` (EMA service descriptor), `notification`, `host-probe` (observation record)
- **Extend**: `chronicle.entry` has `source.machine_id` already; promote to FK once `machine` entity exists
- **Extend**: `runtime-session` with `machine_id`

## Current reality

- `runtime/systemd/` — checked-in user systemd units (from OPERATING-REALITY.md 2026-04-13 pass)
- `scripts/install-runtime.sh` — supported host repair path
- `services/core/runtime-fabric/` — tmux control for local sessions
- No `machine` entity, no `service` entity, no notification surface
- `docs/OPERATING-REALITY.md` documents the host recovery path but it is not queryable from the shell

## Implementation sequence

1. **`machine` + `service` + `notification` + `host-probe` schemas** (parallel files in `shared/schemas/`).
2. **`services/core/machines/` service** — thin:
   - Tables: `machines` (id, label, host, kind, last_seen, capabilities), `machine_probes` (append-only health/observation rows)
   - Routes: `GET /api/machines`, `POST /api/machines`, `GET /api/machines/:id/probes`, `POST /api/machines/:id/probe`
   - Local machine auto-registered on daemon start
3. **`services/core/services-mgmt/` service** — lists EMA's own user systemd units (`ema-services`, `ema-workers`, optionally a `ema-host-bridge`):
   - Tables: `services_registry` (id, name, unit_name, expected_state, machine_id)
   - Routes: `GET /api/services`, `POST /api/services/:id/start`, `POST /api/services/:id/stop`, `GET /api/services/:id/status`
   - Start/stop shells out via `systemctl --user`; daemon process must run under the right user
4. **`services/core/notifications/`** — per Track A; single SQLite table; routes `GET /api/notifications`, `POST /api/notifications/:id/ack`, `POST /api/notifications/:id/dismiss`; WS channel `notifications:new`
5. **MachineManager vApp** — new `apps/renderer/src/components/machines/MachinesApp.tsx` — table of machines + probe timeline
6. **ServicesManager vApp** — new `apps/renderer/src/components/services-mgmt/ServicesManagerApp.tsx` — unit list + start/stop buttons + last-probe status
7. **TerminalApp context strip** — extend `apps/renderer/src/components/terminal/TerminalApp.tsx` to show the current session's `machine_id` label and quick-switcher
8. **Host-probe worker** — `workers/src/watchers/host-probe.ts` — pings each known machine on an interval, writes `machine_probes`, emits notifications on failure

## Dependencies

- Notifications schema + service needed by Tracks A, B, C, D — high-leverage, ship early
- Machine schema needed by Terminal context strip, Agent Hub host column, ChronicleApp machine filter
- Requires `runtime/systemd/` units already checked in — they are

## Steal-now imports

- sshx embedded SSH sessions → optional future bridge; v1.1 registers local machine only
- ntfy push protocol → notification data shape + future remote push
- ShellHub device catalog → machine registry shape
- Cockpit multi-host grid → MachinesApp table layout
- Zellij pane model → Terminal pane management (defer to wave 2)

## Risk areas

- **Permissions**: `systemctl --user` from daemon requires daemon run as the user. Document clearly in `install-runtime.sh`.
- **Probe cost**: ping/health per minute is fine; full service-status at 1hz is not. Back off appropriately.
- **VM boundary confusion**: when EMA runs inside a VM, `machine.kind` must distinguish `host` / `vm` / `remote`. Don't hide this.

## Minimum real MVP

- At least the local machine is registered and visible in MachinesApp
- ServicesManager shows `ema-services`, `ema-workers` (+ any third EMA unit) with live status
- Restarting a service from ServicesManager actually restarts the unit
- Any failed probe produces a notification visible in the shell tray
- Terminal context strip shows "local" label and machine label resolves from `runtime-session.machine_id`
