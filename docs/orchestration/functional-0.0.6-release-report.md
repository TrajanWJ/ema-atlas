# EMA Functional 0.0.6 Release Report

Controlling plan:
[`docs/superpowers/plans/2026-05-10-ema-proslync-first-head-orchestrator-master-plan.md`](../superpowers/plans/2026-05-10-ema-proslync-first-head-orchestrator-master-plan.md)
— Sprint 10 ("Runtime, Static, Tauri, And Install Readiness") is the
controlling slice for the rows in this report.

## Runtime Report (Sprint 10 truth surface)

`pnpm runtime:report` (alias for
`node tooling/runtime-process-report.mjs`) emits a single JSON object whose
top-level keys are the operator's check-list. As of Sprint 10 the keys are:

| Key | Meaning |
|---|---|
| `daemon_listener` | `lsof` rows for port `49555` |
| `web_listener` | `lsof` rows for port `5173` |
| `companion_listener` | `lsof` rows for port `27182` (Tauri companion) |
| `installed_app_path` | `{ path, exists }` for `~/Desktop/EMA 0.0.6.app` (or `EMA_TAURI_DESKTOP_APP_PATH`) |
| `static_bundle_path` | `{ path, exists, file_count, size_bytes }` for `apps/web/out/`, or `{ path, exists: false }` |
| `pidfiles` | `{ daemon, web }` PIDs read from `.ema-dev/pids/*.pid` |
| `stale_pidfiles` | `{ daemon, web }` booleans — pidfile present but no live listener |
| `active_build_git_state` | `{ root, head, branch, status_lines_total, status (≤40 lines), truncated }` |
| `proslync_workpack_health` | `{ ok, health, build_count, surface_count }` from `cockpit workpack --project proslync-app-ios-final --json` (5s timeout) |

The legacy `app`, `listeners`, and `root` keys are retained for backward
compatibility with earlier reporter consumers but the canonical surface is
the explicit per-listener keys above.

## Reinstall Gate

The reinstall gate is the only sanctioned path for replacing the installed
Tauri app. Run in this order:

```bash
pnpm release:reinstall:dry          # node tooling/reinstall-ema-0.0.6.mjs --dry-run
node tooling/reinstall-ema-0.0.6.mjs --preflight-only
pnpm release:reinstall              # node tooling/reinstall-ema-0.0.6.mjs --delete-target
open "/Users/trajanm4air/Desktop/EMA 0.0.6.app"
pnpm runtime:report
```

Flags:

- `--dry-run` — print every step (`pnpm typecheck`, `build:cli`, web build,
  static bundle, Tauri build, stop-ema-dev, install) without executing or
  mutating anything on disk. Use first.
- `--preflight-only` — describe the plan and run `pnpm runtime:report`
  against the live workspace, then exit. No build, no install, no stop.
- `--delete-target` — the only way the gate will overwrite the existing
  installed app. The previous app is moved to `…app.backup-<iso>.app`
  before `ditto` copies the new one in.
- `--json` — emit a structured `{ ok, target_app, backup_app, dry_run,
  preflight_only, steps }` payload for orchestrator consumption.

Both `scripts/stop-ema-dev.sh` and `scripts/install-macos-tauri-app.sh`
emit a final `stop-result:` / `install-result:` line so the reinstall gate
can diagnose stop-and-replace failures without scraping per-step output.

## Static / Tauri Parity

`scripts/build-web-static-out.sh` no longer maintains a hand-edited bash
array of popout app ids. It parses `STATIC_POPOUT_APPS` directly from
`apps/web/app/popout/[appId]/page.tsx` (the same list `generateStaticParams`
uses at build time) and then calls
`node tooling/verify-static-popout-parity.mjs`, which fails the build
(exit 1) if any expected popout `index.html` is missing from
`apps/web/out/popout/<appId>/`. This closes the drift window between the
runtime popout route and the bundled static fallback.

Run the verifier independently with
`node tooling/verify-static-popout-parity.mjs --json` — useful from CI or
the orchestrator without re-running the full Next.js build.

## Most Recent Install

Per `docs/orchestration/STATUS.md` (2026-05-10 — "Functional 0.0.6
Proslync cockpit rails"), the last reinstall completed successfully:

- Installed: `/Users/trajanm4air/Desktop/EMA 0.0.6.app`
- Backup of prior app: `/Users/trajanm4air/Desktop/EMA 0.0.6.app.backup-2026-05-10T02-01-55-784Z`
- Verified by `pnpm runtime:report`: companion listener `ema-deskt` on
  `127.0.0.1:27182`, daemon `49555`, web `5173`, no stale pidfiles.

Sprint 10 has not yet replaced this installed app; the orchestrator should
wait for an explicit operator go-ahead before running
`pnpm release:reinstall` (which deletes-by-rename the current installed
app). The dry-run and preflight-only paths are safe to run unattended.

## Static Surface History

| Check | Result | Evidence |
|---|---|---|
| Runtime reporter | pass | `pnpm runtime:report` reports installed app, daemon `49555`, web `5173`, companion `27182`, no stale pidfiles, plus the Sprint 10 truth surface (static bundle, git state, Proslync workpack health) |
| Stop script | pass | `bash scripts/stop-ema-dev.sh --force-port-kill` stopped daemon/web and removed stale pidfiles; emits `stop-result:` line |
| Daemon version drift | pass | `bash scripts/dev-daemon.sh` now logs `ema_daemon: starting 0.0.6` |
| Static popout parity | pass | `tooling/verify-static-popout-parity.mjs` ratifies every `STATIC_POPOUT_APPS` id has a generated `apps/web/out/popout/<id>/index.html` |

## Proslync Cockpit

| Check | Result | Evidence |
|---|---|---|
| CLI projection | pass | `node apps/cli/dist/bin.js cockpit projection --project proslync-app-ios-final --json` returns 4 builds, 6 surfaces, `proslync_ready: true` |
| Web projection | pass | `curl http://localhost:5173/api/cockpit/projection` returns 4 builds, 6 surfaces, no bridge errors |
| Agent workpack | pass | `node apps/cli/dist/bin.js cockpit workpack --project proslync-app-ios-final --json` returns `proslync_ready: true`, 4 builds, 6 surfaces, and explicit dirty/no-git hazards |
| UI visibility | pass | Playwright `tests/e2e/cockpit-proslync.spec.ts` and `tests/e2e/launchpad-cockpit.spec.ts` passed |

## Intention Recovery

| Check | Result | Evidence |
|---|---|---|
| Review ledger | pass | `.ema-dev/intention-backfeed/reviews.json` persists accepted/deferred/rejected state |
| CLI review verbs | pass | `ema intention accept/list/backfeed --dry-run` smoke passed against harvested intent IDs |
| Cockpit POST bridge | pass | `POST /api/cockpit/intentions` deferred `intent:9d3f284ce2bfac56` successfully |

## Installed App

| Check | Result | Evidence |
|---|---|---|
| Reinstall dry-run | pass | `pnpm release:reinstall:dry` prints stop/build/install and backup move without mutating; supports `--json` for structured orchestrator output |
| Reinstall preflight | pass | `node tooling/reinstall-ema-0.0.6.mjs --preflight-only` describes the gate and runs `pnpm runtime:report` against live workspace |
| Reinstall (last run) | pass | `pnpm release:reinstall` (2026-05-10T02:01:55-784Z) moved prior app to `.backup-…app`, installed fresh app, opened it |
| Installed smoke | pass | `/Users/trajanm4air/Desktop/EMA 0.0.6.app` exists; companion listener `ema-deskt` on `127.0.0.1:27182`; daemon `49555` and web `5173` restarted |
| Tauri drag region | pass | Playwright `tests/e2e/tauri-frame-drag.spec.ts` confirms app chrome exposes drag and no-drag regions |
| Popout titlebar | pass | Playwright `tests/e2e/popout-titlebar.spec.ts` confirms companion popouts expose draggable titlebar and desktop return control |

## Open Risks

| Risk | Owner | Next Command |
|---|---|---|
| Historical 0.0.5 docs remain in archive/plans/doctrine | docs lane | Open a narrow doc deprecation lane; do not bulk-edit historical provenance docs |
| Installed Tauri app exposes companion/static shell; live cockpit APIs still require daemon/web services | runtime lane | Keep `pnpm runtime:report` and `scripts/dev-*` as the local client-work start contract |
| Dirty worktree includes pre-existing swarm/handoff/contracts changes | coordinator | Review `git status --short` and commit only the head-orchestrator slice by explicit pathspec |
| `STATIC_POPOUT_APPS` is still authored in `apps/web/app/popout/[appId]/page.tsx`; long-term it should move into `apps/web/src/lib/app-registrations.ts` so the runtime app registry and static bundle share one source | runtime lane | When app-registrations.ts gains a `staticPopout: true` flag, replace the awk parser in `scripts/build-web-static-out.sh` with a direct registry import |
