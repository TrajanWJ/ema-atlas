---
id: PLAN-DAEMON-EXTRACTION-IMPL
type: implementation-notes
layer: planning
title: "Daemon extraction from Electron — tactical implementation notes"
status: draft
created: 2026-04-13
scope: "apps/electron/main.ts, runtime.ts, runtime/systemd/, cli daemon command"
companion_to: "[[01-PLANS/2026-04-13-SUBPROJECT-A-DAEMON-BACKBONE-SPEC-DRAFT]]"
related:
  - "[[01-PLANS/2026-04-13-SUBPROJECT-A-DAEMON-BACKBONE-SPEC-DRAFT]]"
  - "[[11-GAPS/2026-04-13-FORENSIC-AUDIT-GAP-LEDGER]]"
  - "[[10-DECISIONS/2026-04-13-META-BOOTSTRAP-T3CODE-AS-EMA-BACKBONE]]"
  - "[[05-WIKI/TOP-BAR-SPACES-ORGS-SPEC]]"
  - "[[12-RUNTIME/TS-RUNTIME-REALITY-SUMMARY]]"
tags: [plan, implementation, daemon, electron, extraction, sub-project-a]
---

# Daemon Extraction — Implementation Notes

> Companion to [[01-PLANS/2026-04-13-SUBPROJECT-A-DAEMON-BACKBONE-SPEC-DRAFT]].
> The spec locks architecture and acceptance. This doc captures the
> **concrete, audited coupling points** and the minimum surgery to
> decouple Electron from the daemon without waiting for the full
> Effect/event-spine migration.
>
> Written against the 2026-04-13 pm forensic audit findings.

## The coupling today (audited)

Only two files couple Electron to the daemon process:

### `apps/electron/main.ts`

```ts
// line 440-452 (per audit)
app.whenReady().then(async () => {
  await startManagedRuntime();   // ← UNTRY-CAUGHT — throws kill Electron pre-window
  setupIPC();
  createLaunchpad();
});
```

**Problems (audit evidence):**

- `await startManagedRuntime()` is not try-caught. Missing `services/dist/startup.js` → Electron fatal before any window. No user-facing error.
- `setupIPC()` and `createLaunchpad()` will never run if runtime start fails.
- Bypass env exists (`EMA_MANAGED_RUNTIME=external`) but no `attach` mode — either spawn or skip.

### `apps/electron/runtime.ts`

```ts
// line 32-43 — spawns
const services = spawnNodeProcess('services/dist/startup.js');
const workers  = spawnNodeProcess('workers/dist/startup.js');

// line 73-93 — health poll
async function waitForHealth() {
  const start = Date.now();
  while (Date.now() - start < 15_000) {
    const res = await fetch('http://127.0.0.1:4488/api/health').catch(() => null);
    if (res?.ok) return;
    await sleep(300);
  }
  throw new Error('services health timeout');
}
```

**Problems:**

- `spawnNodeProcess` relies on dist files relative to CWD. If Electron is packaged and the tree moves, paths break.
- Health poll is the only signal — no readiness protocol from child process.
- No supervision — if services crashes mid-session, Electron has no reaction path.

## Target topology (post-extraction)

Three daemon modes, explicit in settings + CLI:

| Mode | Who starts services | Who owns lifecycle | Dev / Prod |
|---|---|---|---|
| `managed` | Electron spawns on app launch | Electron process tree | Dev convenience; current behavior |
| `attach` | systemd (user unit) or `ema daemon start` | OS | **Target for v1.1 ship** |
| `external` | Developer (`pnpm dev`) | Developer | Dev-only; current `EMA_MANAGED_RUNTIME=external` |

Post-extraction, `attach` is the default. `managed` stays as a fallback
for users who don't want systemd. Electron never spawns if it detects a
running daemon.

## Minimum decoupling surgery (pre-sub-project-A)

This ships BEFORE the full Effect/RPC/event-spine rewrite. Goal:
Electron is "just a client" even if the daemon is still Fastify+SQLite.

### Step D0 — Try-catch and fallback UI

`apps/electron/main.ts:444`:

```ts
app.whenReady().then(async () => {
  setupIPC();                          // ALWAYS register IPC first
  const window = createLaunchpad();    // ALWAYS open a window first
  
  try {
    await startRuntime(mode);
  } catch (err) {
    window.webContents.send('daemon:error', {
      stage: 'startup',
      mode,
      message: err.message,
      actions: ['retry', 'open-logs', 'switch-mode'],
    });
  }
});
```

Renderer handles `daemon:error` IPC by showing a daemon status modal
(reuses `<DaemonStatus />` panel from
[[05-WIKI/TOP-BAR-SPACES-ORGS-SPEC]] §Region 4).

### Step D1 — Introduce `attach` mode

`apps/electron/runtime.ts` gains a mode dispatcher:

```ts
export async function startRuntime(mode: 'managed' | 'attach' | 'external') {
  if (mode === 'external') return;  // developer runs pnpm dev
  
  if (mode === 'attach') {
    // 1. Probe /api/health — if ok, done
    // 2. If not ok, try `systemctl --user start ema-services` (if unit installed)
    // 3. Wait for health with longer timeout (30s for systemd startup)
    // 4. If still not ok, throw with actionable error
    return attachToExisting();
  }
  
  // managed — current behavior
  return spawnChildren();
}
```

Settings key: `daemon.daemon_mode` (per
[[05-WIKI/SETTINGS-OBJECT-SPEC]] Category 2).

### Step D2 — CLI surface: `ema daemon`

New command group in CLI (see
[[11-GAPS/2026-04-13-MISSING-FEATURES-LEDGER]] #30):

```
ema daemon start       → systemctl --user start ema-services ema-workers  (or spawn if not installed)
ema daemon stop        → systemctl --user stop  ema-services ema-workers  (or kill spawned)
ema daemon restart     → stop + start
ema daemon status      → systemctl status + /api/health + process tree
ema daemon install     → copies runtime/systemd/*.service → ~/.config/systemd/user/, systemctl daemon-reload, systemctl enable
ema daemon uninstall   → inverse
ema daemon logs [-f]   → journalctl --user -u ema-services -u ema-workers [-f]
```

Extract logic into `cli/src/commands/daemon.ts` (part of the CLI
decomposition in [[01-PLANS/2026-04-13-FRONTEND-BUILDOUT-PLAN]] Phase F6).

### Step D3 — `runtime/systemd/` install script already exists

`scripts/install-runtime.sh` already does most of this for the TS stack
(audit confirmed). Wrap it in `ema daemon install`. Drop the dead
Elixir-era `scripts/install.sh` and `scripts/node-setup.sh` (see
[[11-GAPS/2026-04-13-MISSING-FEATURES-LEDGER]] #60).

### Step D4 — Daemon announces readiness

Rather than rely on health polling, child process writes a ready-marker:

```ts
// services/startup.ts, after all boot
process.send?.({ type: 'ready', port: 4488 });
// if launched with stdio:'ipc', Electron gets the message immediately
```

Electron listens:

```ts
services.on('message', (m) => {
  if (m.type === 'ready') resolve();
});
```

This cuts the 300ms poll loop and detects crashes synchronously.

### Step D5 — Crash supervision (minimal)

Electron watches for child exit:

```ts
services.on('exit', (code) => {
  if (code !== 0 && !shuttingDown) {
    window.webContents.send('daemon:crashed', { code, mode });
    // user chooses: restart | switch-mode | quit
  }
});
```

No auto-restart in D5 — surface the crash, let the user decide. Real
supervision waits for sub-project A / systemd.

## What does NOT ship pre-sub-project-A

Holding for the full sub-project A phase boundary:

- Effect-native RPC server (replaces Fastify)
- Event log + projection tables
- Bootstrap token auth (non-optional)
- Loop domain reshape onto t3code spine
- Retirement of `loop_*` tables

The minimum decoupling above lets the renderer, CLI, and Electron all
coexist cleanly with the *current* Fastify daemon. Sub-project A swaps
the engine underneath later without the extraction being a prerequisite.

## File-level reshape pointers

| Change | File | Current state |
|---|---|---|
| Try-catch + fallback UI | `apps/electron/main.ts:440-452` | untry-caught `await startManagedRuntime()` |
| Mode dispatcher | `apps/electron/runtime.ts:32-43` | binary spawn vs external |
| Ready handshake | `services/startup.ts` (end) | no readiness signal |
| Crash handler | `apps/electron/runtime.ts:95-109` | no exit listener |
| CLI daemon command | `cli/src/commands/daemon.ts` (new) | doesn't exist |
| Settings schema | `shared/schemas/settings.ts` (new) | doesn't exist |
| Settings service | `services/core/settings/` (new) | doesn't exist |

## Acceptance

- `ema daemon install` writes systemd units and they `systemctl --user status` cleanly.
- `ema daemon start` / `stop` / `restart` work, and `ema daemon status` reports accurate state.
- Launching Electron with `daemon.daemon_mode=attach` and no daemon running → Electron opens, shows daemon-error modal, offers "start it" button that calls into `ema daemon start`.
- Launching Electron with daemon already running → Electron connects, no spawn attempt.
- Killing services mid-session → renderer shows `daemon_status=offline`, user can restart via panel.
- `pnpm dev` still works (external mode unchanged).

## Coordination with other workstreams

- Frontend buildout Phase F2 (shell redesign) depends on D0 + D1 for the
  daemon status indicator to be real.
- Frontend buildout Phase F3 (settings) depends on D1 for `daemon_mode`
  setting to actually do something.
- CLI decomposition depends on D2 (new `daemon.ts` command file).
- Sub-project A can proceed independently — this extraction is NOT a
  prerequisite, but A's phase A3 (auth layer) becomes cleaner if
  extraction has already happened.

## Risk register

- **SystemD is Linux-only.** On macOS, use `launchd`; on Windows, use a
  Windows Service. Ship Linux first; macOS in v1.2. Add a
  `daemon.install_method` detection in `ema daemon install`.
- **User's shell may not have `systemctl --user`** enabled (rootless
  containers, some minimal distros). `ema daemon install` must detect
  this and fall back to `managed` mode with a warning.
- **Electron packaged app paths differ from dev.** `spawnNodeProcess`
  currently resolves relative to CWD. Packaged builds need to resolve
  relative to `app.getAppPath()`. Already a latent bug; fix in D1.
- **Port conflicts.** If `:4488` is taken by a stale process, new daemon
  fails silently. `ema daemon status` must detect this and offer to
  kill the stale process.
