# Current Dirty State - 2026-05-10

Purpose: Sprint 0 intake for the Proslync-first head-orchestrator reset.

Rule: preserve all existing dirty work. Do not reset, clean, stash, checkout, or revert unrelated files. Use this file to decide what to keep, rework, quarantine, or regenerate.

## Git Status Snapshot

```text
 M README.md
 M apps/cli/dist/bin.js
 M apps/cli/src/bin.ts
 M apps/cli/src/commands/checkup.ts
 M apps/cli/src/commands/harness.ts
 M apps/cli/src/commands/help.ts
 M apps/cli/src/commands/hermes.ts
 M apps/cli/src/commands/org.ts
 M apps/cli/src/commands/project.ts
 M apps/cli/src/commands/vcalendar.ts
 M apps/cli/src/workspace-scope.ts
 M apps/cli/src/workspace-state.ts
 M apps/cli/tsconfig.tsbuildinfo
 M apps/daemon/gleam.toml
 M apps/daemon/lib/ema_daemon_elixir.ex
 M apps/daemon/mix.exs
 M apps/daemon/src/ema_attachments/README.md
 M apps/daemon/src/ema_attachments/attachments.gleam
 M apps/daemon/src/ema_attachments/connectors.gleam
 M apps/daemon/src/ema_daemon.gleam
 M apps/daemon/src/ema_shell_ipc/ema_shell_ipc.gleam
 M apps/daemon/src/ema_swarm_coordination/first_boot.gleam
 M apps/web/app/canvas/page.tsx
 M apps/web/app/globals.css
 M apps/web/app/mock-projections.ts
 M apps/web/app/popout/[appId]/page.tsx
 M apps/web/app/tauri-frame.css
 M apps/web/next-env.d.ts
 M apps/web/src/app/mock-projections.ts
 M apps/web/src/components/apps/PanelAppFrame.tsx
 M apps/web/src/components/apps/agent-work/index.tsx
 M apps/web/src/components/apps/agent-work/panels/agent-instruction-panel.tsx
 M apps/web/src/components/apps/agent-work/panels/command-panel.tsx
 M apps/web/src/components/apps/blueprint/index.tsx
 M apps/web/src/components/apps/clients/ClientsApp.tsx
 M apps/web/src/components/apps/focus/FocusApp.tsx
 M apps/web/src/components/apps/launchpad/index.tsx
 M apps/web/src/components/apps/settings/pages/DaemonPage.tsx
 M apps/web/src/components/apps/terminal/TerminalApp.tsx
 M apps/web/src/components/apps/terminal/commands.ts
 M apps/web/src/components/boot/EmaIdentityPanel.tsx
 M apps/web/src/components/desktop/AmbientBar.tsx
 M apps/web/src/components/desktop/DesktopShortcuts.tsx
 M apps/web/src/components/popout/PopoutTitleBar.tsx
 M apps/web/src/components/window-manager/Window.tsx
 M apps/web/src/lib/app-registrations.ts
 M apps/web/src/lib/constants.ts
 M apps/web/src/lib/ipc.ts
 D apps/web/src/lib/ipc/ipc/index.ts
 D apps/web/src/lib/ipc/ipc/provider.tsx
 D apps/web/src/lib/ipc/ipc/use-channel.ts
 D apps/web/src/lib/ipc/ipc/use-command.ts
 D apps/web/src/lib/ipc/ipc/use-ipc-connection.ts
 D apps/web/src/lib/ipc/ipc/use-projection.ts
 M apps/web/src/lib/popout-launcher.ts
 M apps/web/src/projections/use-topbar.ts
 M apps/web/src/vapps/cockpit/cockpit.css
 M apps/web/src/vapps/cockpit/components/agent-chat.tsx
 M apps/web/src/vapps/cockpit/components/bench.tsx
 M apps/web/src/vapps/cockpit/components/capture-form.tsx
 M apps/web/src/vapps/cockpit/components/client-work-section.tsx
 M apps/web/src/vapps/cockpit/components/project-bench-view.tsx
 M apps/web/src/vapps/cockpit/components/sidebar.tsx
 M apps/web/src/vapps/cockpit/data/projections.ts
 M apps/web/src/vapps/cockpit/data/types.ts
 M apps/web/src/vapps/cockpit/index.tsx
 M apps/web/src/vapps/cockpit/pages/project-bench.tsx
 M apps/web/src/vapps/cockpit/router.ts
 M apps/web/tests/screenshots/_runs/.last-run.json
 M apps/web/tsconfig.tsbuildinfo
 M docs/WORKSPACE-ENTRYPOINT.md
 D docs/architecture/_archive/FOLDER-AUDIT-2026-04-24.md
 M docs/cli/agent-workspace.md
 M docs/cli/see-agent-work.md
 M docs/orchestration/STATUS.md
 D docs/orchestration/lanes/_archive/L-honest-mocks.md
 D docs/orchestration/lanes/_archive/L-ipc-client-finish.md
 D docs/plans/_archive/ORCHESTRATION-MAP-2026-04-29.md
 D docs/plans/_archive/PLACE-DONOR-RECOVERY.md
 D docs/plans/_archive/RUNTIME-RECOVERY-HANDOFF.md
 D docs/plans/_archive/SURFACE-SLICE-A.md
 M package.json
 M scripts/build-web-static-out.sh
 M scripts/start-ema-dev.sh
 M scripts/stop-ema-dev.sh
?? AGENTS.md
?? apps/cli/src/commands/cockpit.ts
?? apps/cli/src/commands/intention.ts
?? apps/daemon/lib/ema_intention_farmer.ex
?? apps/daemon/lib/ema_intention_farmer/
?? apps/daemon/test/ema_intention_farmer_test.exs
?? apps/web/app/api/cockpit/
?? apps/web/app/api/runtime/
?? apps/web/app/popout/[appId]/popout-page-client.tsx
?? apps/web/tests/e2e/all-usable-vapps.spec.ts
?? apps/web/tests/e2e/cockpit-proslync.spec.ts
?? apps/web/tests/e2e/launchpad-cockpit.spec.ts
?? apps/web/tests/e2e/popout-titlebar.spec.ts
?? apps/web/tests/e2e/proslync-first-vapps.spec.ts
?? apps/web/tests/e2e/settings-runtime.spec.ts
?? apps/web/tests/e2e/static-install-parity.spec.ts
?? apps/web/tests/e2e/tauri-frame-drag.spec.ts
?? apps/web/tests/screenshots/_runs/cockpit-proslync-Proslync--1304b-lds-surfaces-and-intentions-chromium/
?? "docs/architecture/_archive/FOLDER-AUDIT-2026-04-24 2.md"
?? docs/orchestration/functional-0.0.6-release-report.md
?? docs/orchestration/head-orchestrator/
?? "docs/orchestration/lanes/_archive/L-honest-mocks 2.md"
?? "docs/orchestration/lanes/_archive/L-ipc-client-finish 2.md"
?? "docs/plans/_archive/ORCHESTRATION-MAP-2026-04-29 2.md"
?? "docs/plans/_archive/PLACE-DONOR-RECOVERY 2.md"
?? "docs/plans/_archive/RUNTIME-RECOVERY-HANDOFF 2.md"
?? "docs/plans/_archive/SURFACE-SLICE-A 2.md"
?? docs/research/
?? docs/superpowers/
?? tooling/agent-workspace-round-trip.mjs
?? tooling/ema-functional-e2e.mjs
?? tooling/intention-source-smoke.mjs
?? tooling/reinstall-ema-0.0.6.mjs
?? tooling/runtime-process-report.mjs
```

## Diff Stat Snapshot

```text
85 files changed, 3561 insertions(+), 1253 deletions(-)
Largest tracked deltas:
- apps/cli/dist/bin.js: +1248 / generated build artifact
- apps/web/app/globals.css: +490
- apps/web/src/vapps/cockpit/data/projections.ts: +481 / -? 
- apps/web/src/vapps/cockpit/components/project-bench-view.tsx: +414
- apps/web/src/vapps/cockpit/data/types.ts: +141
- apps/web/src/components/apps/settings/pages/DaemonPage.tsx: +145
- archive files appear deleted and duplicated as `* 2.md`; preserve until owner is known
```

## Keep

- `docs/superpowers/plans/2026-05-10-ema-proslync-first-head-orchestrator-master-plan.md`: new controlling plan.
- Runtime reporting and reinstall rails in `tooling/runtime-process-report.mjs`, `tooling/reinstall-ema-0.0.6.mjs`, `scripts/stop-ema-dev.sh`, and `scripts/build-web-static-out.sh`, subject to Sprint 10 review.
- `apps/web/app/api/runtime/report/route.ts` and Settings runtime work, subject to Sprint 10 truth review.
- Stale active identity cleanup in `AGENTS.md`, daemon first boot, active mock projections, terminal prompt, and Blueprint visible title, subject to Sprint 1 doctrine review.
- Honest harness adapter status in `apps/cli/src/commands/harness.ts`, subject to Sprint 6 projection work.
- IPC consolidation deletion of nested duplicate `apps/web/src/lib/ipc/ipc/*`, subject to Sprint 7 route/frame review.

## Replace

- Any cockpit readiness implementation that shells through multiple CLI/git/intention operations during first render.
- Any `health.proslync_ready` logic that can be true without daemon/runtime/build evidence.
- Any hardcoded Proslync constants scattered across cockpit route/API/web layers; replace with project registry.
- Any route list duplicated independently between tests, static popout generation, app ids, and registrations.

## Rework

- `apps/web/tests/e2e/cockpit-proslync.spec.ts`: currently uses `networkidle` and can time out even when the cockpit shell mounted. Replace with deterministic readiness attributes after Sprint 7.
- `apps/web/tests/e2e/launchpad-cockpit.spec.ts`: timeout increase is not accepted as the final fix. Replace with route/frame readiness and fast workpack projection.
- `apps/web/tests/e2e/proslync-first-vapps.spec.ts`: priority list is useful, but per-vApp waits must use `data-vapp-ready` and fast cockpit workpack.
- `tooling/ema-functional-e2e.mjs`: currently serializes slow full UI checks without per-lane timing/reporting. Split into core/projection/ui/static/release lanes.
- `apps/web/src/vapps/cockpit/data/projections.ts`: useful bridge work exists, but load boundaries must split workpack/runtime/intentions and use bounded fetches.
- `apps/web/src/components/apps/agent-work/panels/command-panel.tsx`: list refresh is useful, but primary actions must execute supported daemon-backed commands, not only copy or refresh.

## Generated / Artifact

- `apps/cli/dist/bin.js`
- `apps/cli/tsconfig.tsbuildinfo`
- `apps/web/tsconfig.tsbuildinfo`
- `apps/web/next-env.d.ts`
- `apps/web/tests/screenshots/_runs/.last-run.json`
- `apps/web/tests/screenshots/_runs/cockpit-proslync-Proslync--1304b-lds-surfaces-and-intentions-chromium/`

These should not be staged with source changes unless a release task explicitly requires generated artifacts.

## Unknown Owner

- Deleted archive files paired with untracked `"* 2.md"` files:
  - `docs/architecture/_archive/FOLDER-AUDIT-2026-04-24.md`
  - `docs/orchestration/lanes/_archive/L-honest-mocks.md`
  - `docs/orchestration/lanes/_archive/L-ipc-client-finish.md`
  - `docs/plans/_archive/ORCHESTRATION-MAP-2026-04-29.md`
  - `docs/plans/_archive/PLACE-DONOR-RECOVERY.md`
  - `docs/plans/_archive/RUNTIME-RECOVERY-HANDOFF.md`
  - `docs/plans/_archive/SURFACE-SLICE-A.md`

Do not delete or normalize these until artifact hygiene identifies whether they are Finder duplicate copies, generated outputs, or user-preserved provenance.

## Immediate Next Implementation Move

Start Sprint 2 before broad UI polishing:

1. Create a fast cockpit projection performance smoke.
2. Split cockpit first render away from full intention harvesting.
3. Add deterministic readiness markers.
4. Then remove `networkidle` and long timeouts from the cockpit tests.

