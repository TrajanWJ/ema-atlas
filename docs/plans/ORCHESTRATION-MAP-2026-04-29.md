# EMA 0.0.5 Orchestration Map

Date: 2026-04-29

This map consolidates the loose threads from the current EMA 0.0.5 recovery
work: donor recovery from `place.org` / `place-companion`, frontend polish,
daemon companion work, workspace CLI grammar, and runtime projection debt.

## Current Build Reality

- Active code root: `Active builds/EMA-0.0.5/`.
- Current web dev surface: `http://localhost:5173`.
- Current daemon IPC: `ws://127.0.0.1:49555`.
- Current org/space from `pnpm cli status --json`: `Trajan's Organization`
  / `Personal Workspace`, no current project selected.
- Current CLI workspace projection split: `lane` / `queue` writes append
  daemon events, but `tl about` still reads the file-backed projection and
  shows zero lanes/queue records.
- Current desktop install policy: do not rebuild/reinstall `EMA.app` until the
  web shell visibly passes review.

## Shipped In This Recovery Thread

- Removed stale/generated `EMA.app` artifacts from the build output and
  `/Applications`.
- Added donor recovery skills:
  - `skills/place-donor-design/`
  - `skills/place-donor-surface/`
  - `skills/place-companion-bridge/`
- Added `docs/plans/PLACE-DONOR-RECOVERY.md`.
- Fixed Next client rendering for `apps/web/app/page.tsx` through
  `apps/web/app/client-page.tsx`.
- Added dedicated vApp panel mode:
  `/?mode=panel&vapp=<hq|blueprint|git-ema|agent-work|wiki|threads|settings>`.
- Added `apps/web/src/shell/vapp-registry.tsx` and panel rendering in
  `apps/web/src/shell/virtual-desktop-shell.tsx`.
- Replaced the no-op web companion bridge with a localhost
  `place-companion` bridge in
  `apps/web/src/place-reflection/lib/companion-bridge.ts`.
- Replaced popout fallback logic in
  `apps/web/src/place-reflection/lib/popout-launcher.ts`.
- Added daemon companion broker state and IPC handlers:
  - `apps/daemon/src/ema_companion/ema_companion.gleam`
  - `companion.discover`
  - `companion.window.open`
  - `companion.window.close`
  - `companion.window.focus`
  - `companion.window.reattach_ack`
  - `companion.status`
  - `companion.windows`
- Updated `packages/contracts/ipc/shell-protocol.md` for companion commands
  and projections.

## Queue Records

Existing daemon queue items now capture the recovered follow-ups:

| Queue item | Title | Dependency / blocker |
| --- | --- | --- |
| `queue_item:01KQC3G9W0001NBSE5NE17J3QD` | Add dedicated lane and queue projections | Depends on `lane.open` and `queue.add` writers |
| `queue_item:01KQC44VKX0038W96VTYAMAQ00` | Broker place-companion through EMA daemon | Partially advanced by daemon broker; still needs web-first broker usage |
| `queue_item:01KQC4X2JY0064KMHHRP7AQQKP` | Make workspace records visible in `tl about` after daemon lane/queue writes | Workspace projection must read daemon events or mirror records |
| `queue_item:01KQC4YMEC008346W41M9QP6XD` | Wire web popouts through daemon companion broker first | Depends on daemon companion broker |
| `queue_item:01KQC4YTM40098QWXN0SRZ7TGH` | Port place-companion native window manager into EMA desktop | Depends on daemon broker and donor audit |
| `queue_item:01KQC4Z0RT00A9PVQGA4YB68B7` | Resolve lane vocabulary conflict before expanding workspace writers | Blocked by contract vocabulary conflict |
| `queue_item:01KQC4Z93D00BAH1SZDKNQDMWT` | Promote place.org design tokens into shared design-system | Depends on donor design audit |
| `queue_item:01KQC4ZH9M00CESGGWX40GYFC2` | Replace recovery workbench placeholders with real vApp shell surfaces | Depends on donor surface audit and vApp registry stabilization |
| `queue_item:01KQC4ZQ7T00DBFPWXC5JSMMYN` | Ship runtime projections still blocking honest-mock retirement | Depends on projection and command writer lanes |
| `queue_item:01KQC4ZW6X00E9FXNKG01FZ1RJ` | Stop CLI rebuild races for orchestration commands | Depends on CLI packaging hygiene |

## Open Blockers

### Lane Vocabulary Conflict

Resolved in implementation: `lane.*` now means active ownership/workstream.
The older `lane.item_added` / `lane.item_moved` container model was removed
from the active catalog and contract. Backlog work discovered during execution
belongs in `queue_item.*`.

### Workspace Projection Split

Resolved for CLI orientation: daemon now serves `lane.registry` and
`queue.registry`; `ema lane list`, `ema queue list`, `ema tl about`, and
`ema agent orient` consume those dedicated projections for lane/queue records.

Remaining: See Agent Work still needs to consume the same daemon-backed
workspace records when surface work resumes.

### Native Companion Gap

The daemon can track requested companion windows, but every opened window is
still `pending_native_attach`. The actual macOS/Tauri native window manager
from `place-companion` is not connected yet.

### Frontend Staging Content

The default shell has better styling and panel mode, but it still contains a
recovery/progress workbench. That must be replaced with a mature donor-style
desktop: real windows, launcher, command palette, titlebars, vApps, and no fake
progress cards.

## Recommended Lane Order

1. **See Agent Work projection consumer lane:** make the vApp consume
   `lane.registry` / `queue.registry` when surface work resumes.
2. **Companion web broker lane:** make web popouts call EMA daemon
   `companion.window.open` before direct localhost/browser fallback.
3. **Native companion lane:** port `place-companion` Tauri native window
   manager into `apps/desktop/src-tauri` behind the daemon broker.
4. **Design-token lane:** move donor tokens/glass tiers into
   `packages/design-system` and import them into web/desktop.
5. **Surface shell lane:** replace the temporary recovery workbench with real
   donor-informed vApp windows and launcher/command palette flows.
6. **Runtime projection lane:** ship `hq.pulse`, `desktop.wallpaper`,
   `desktop.presence`, `see_agent_work.project_pulse`, and retire honest mocks.
7. **Desktop rebuild lane:** only after web screenshot review passes, rebuild
   and install the mac app.

## Verification Baseline

- `cd apps/daemon && gleam check`
- `cd apps/daemon && gleam test`
- `pnpm --filter @ema/web exec tsc --noEmit`
- `node tooling/m1-round-trip.mjs`
- Browser screenshots for:
  - `/`
  - `/?mode=panel&vapp=hq`
  - `/?mode=panel&vapp=agent-work`
  - `/?mode=panel&vapp=settings`

Avoid running multiple `pnpm cli ...` commands in parallel until
`queue_item:01KQC4ZW6X00E9FXNKG01FZ1RJ` is closed; the wrapper rebuilds
`apps/cli/dist/bin.js` and can race itself.
