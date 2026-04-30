# EMA 0.0.5 — Implementation Roadmap

This is the implementation schedule for turning the 0.0.5 docs + scaffold
into a running codebase.

It is subordinate to:

- `../../../Projects/EMA/PROJECT-MAP.md`
- `../../../Projects/EMA/atlas/canon/current/ema-0-0-5-current-canon.md`
- `../architecture/08-vanilla-workspace.md`
- `../architecture/09-see-agent-work.md`
- `../agents/see-agent-work-agent-usage.md`

If this file conflicts with the master plan, update this file.

## Star state (what "done" looks like for 0.0.5)

A user can, on a single machine:

1. Install EMA (desktop or web).
2. Boot the daemon; first-boot seeds two orgs:
   - `Trajan's Organization` (personal, with default space `Personal Workspace`) — the **current** org by default,
   - `Founding-Fathers-EMA` (project org, with same-name default space and the `EMA 0.0.5` project) — switched to via the topbar org selector when working on EMA itself.
   The topbar shows the current org/space/project and a switcher.
3. Create a new org; switch between orgs in the topbar.
4. Create spaces and projects inside an org. Every new org auto-creates
   one same-name default space.
5. Open git-ema, click **Connect Google Drive** and **Connect GitHub**,
   see both flip to `connected` with demo labels.
6. Open the fake picker, import a handful of items; they appear in the
   attachments list for the current project.
7. Open Blueprint for a project, see a fake section tree, click
   **Attach…** on a section, pick an attachment, and confirm the link
   appears on the section.
8. Open See Agent Work, see swarms, missions, campaigns, lanes,
   handoffs, vCalendar, agents, mocked start/pause/stop controls, CLI
   equivalents, and copyable agent prompts.
9. Close the app; reopen; everything is still there (persisted to
   canonical SQLite, replayed on boot).
10. Run `pnpm check:contracts` — passes.
11. On the desktop build, all of the above works with zero network
    traffic beyond the localhost WebSocket.

No real OAuth. No Yjs. No replication between devices. No real autonomous
execution. See Agent Work may include mocked lane, handoff, mission,
campaign, and vCalendar surfaces. That's on purpose.

## Milestones

Each milestone is **shippable**: at the end of it the codebase runs,
all tests pass, `contract-check` passes, and a user flow is
demonstrable.

### M1 — Daemon boots, log works, one event round-trips

Goal: `scripts/dev-daemon.sh` starts the daemon, it opens the WS port,
accepts a connection, receives a `command`, appends an event to SQLite,
and streams the event back to the client.

Scope:

- `apps/daemon/src/ema_daemon/bus.gleam` — real actor, real SQLite
  append (WAL mode, single writer), assigns `txid`, fans out to
  subscribers.
- `apps/daemon/src/ema_daemon/registry.gleam` — real actor.
- `apps/daemon/src/ema_daemon/supervisor.gleam` — wires bus + registry
  + shell_ipc under top-level supervisor; `one_for_one`.
- `apps/daemon/src/ema_shell_ipc/` — real WS server (mist or
  gleam_http + gleam_ws). Implements `hello`, `ping`/`pong`,
  `command`, `command_result`, `subscribe`, `event`.
- SQLite schema: one table, `events(txid INTEGER PRIMARY KEY,
  event_id TEXT, kind TEXT, ts TEXT, actor TEXT, org_id TEXT,
  space_id TEXT, project_id TEXT, dispatch_id TEXT, execution_id
  TEXT, payload_json TEXT)`. No object tables yet.
- A single dev command: `debug.ping` that appends a `dispatch.started`
  / `dispatch.ended` pair for end-to-end round-trip testing. (Do not
  add a new kind; reuse existing ones.)

Exit criteria:

- Daemon starts clean, logs `daemon up`.
- `wscat ws://127.0.0.1:49555` can `hello` + issue a command + see the
  event streamed back.
- Kill daemon, restart — events survive in SQLite.
- `pnpm check:contracts` passes.

### M2 — Identity + orgs + topbar populates from daemon

Goal: the shell renders the user's actual org list. First real user
action: create an org, see it show up in the selector.

Scope:

- `apps/daemon/src/ema_identity/` — writer actor, handles
  `device.registered` on first boot (genesis device: hardcoded dev
  device key, no ceremony yet), emits the canonical event.
- `apps/daemon/src/ema_orgs/` — writer for `org.create`, emits
  `org.created`. On daemon first-boot, seed `Founding-Fathers-EMA`
  tied to the genesis device.
- `apps/daemon/src/ema_spaces/` — enough writer support to auto-create
  a same-name default space whenever an org is created.
- Projections: `topbar` projection actor — listens to `org.*`,
  `membership.*`, emits full snapshots on subscribe.
- `packages/surface-core/src/ipc-client/` — real WS client. Implements
  connect, hello, ping/pong, command promise-resolution, subscribe,
  projection snapshot replacement, backoff reconnect, subscription
  re-registration on reconnect.
- `apps/web/src/shell/` — already renders from the projection; just
  flip the `TODO(select org)` onclick handlers into real dispatch.

Exit criteria:

- Fresh install → topbar shows `Founding-Fathers-EMA`.
- Click **New org** (add minimal UI), enter a name → it appears and
  becomes current with a same-name default space.
- Reboot daemon → org persists.
- Unit test: replay the log on a fresh SQLite → same topbar projection.

### M3 — Spaces + projects + routing

Goal: user creates a space inside an org, a project inside a space,
navigates to `/orgs/:o/spaces/:s/projects/:p`, the project-home page
renders.

Scope:

- `apps/daemon/src/ema_spaces/` + `apps/daemon/src/ema_projects/` —
  writer actors for `space.create`, `project.create` (+ lineage rules
  from `events/project.md`).
- Projections update: `topbar` now includes spaces for current_org and
  projects for current_space.
- `apps/web/src/app/main.tsx` — route already exists; flesh the
  project-home page under `blueprint` vApp or a neutral project-home
  that links into git-ema and blueprint.

Exit criteria:

- User can create org → space → project, navigate into it.
- URL reflects the three levels.
- Restart daemon → selector state, including "current", is the last
  seen on this device (via a trivial per-device "last selected"
  projection; allowed because it's derivable from `project.*` and
  device-local navigation events, to be introduced).

### M4 — git-ema end-to-end (demo-stubbed)

Goal: the entire star-state flow (5)–(7) works.

Scope:

- `apps/daemon/src/ema_attachments/connectors.gleam` — real writer.
  Handles `connector.connect`, `connector.disconnect`,
  `connector.list_picker_items` (query — returns
  `demo_picker_items` inline), `connector.import_resource` (generates
  attachment, emits `attachment.created` +
  `connector.linked_resource_imported`, honouring the dedup rule from
  `docs/architecture/07-git-ema.md`).
- `apps/daemon/src/ema_attachments/attachments.gleam` — real writer.
  Handles `attachment.rename`, `attachment.delete`, `attachment.link`,
  `attachment.unlink`.
- Projections: `git_ema.user_connectors`,
  `git_ema.user_attachments`, `git_ema.project_attachments`.
- `apps/web/src/vapps/git-ema/` — already built. The picker dialog
  will need one adjustment: the `CommandResult` shape for query
  commands returns `picker_items` inline (already assumed by the
  dialog, just confirm).
- `apps/web/src/vapps/blueprint/` — already renders the AttachDialog.
  Confirm it emits `attachment.link` with
  `object_kind: "blueprint_section"`.
- Mirror event: emit `blueprint.attachment.linked` after
  `attachment.linked` when `object_kind == "blueprint_section"`.

Exit criteria:

- Click both connector buttons → flip to connected.
- Browse + import 3 items → appear in attachment list.
- Attach one to a blueprint section → both `attachment.linked` and
  `blueprint.attachment.linked` are in the log in that order.
- Dedup: importing the same picker item twice creates no duplicate
  attachment; `connector.linked_resource_imported` still fires.
- Disconnect → attachments persist, marked `source_unreachable`.

### M5 — Blueprint structural tree (still no prose)

Goal: Blueprint isn't a mock. The section tree comes from real
`blueprint.*` events.

Scope:

- `apps/daemon/src/ema_blueprint/` — writer for
  `blueprint.document.create`, `blueprint.section.add`,
  `blueprint.section.rename`, `blueprint.section.move`,
  `blueprint.section.remove`.
- Projection: `blueprint.sections` — tree per document per project.
- `apps/web/src/vapps/blueprint/` — add minimal controls: new
  document, add section under cursor, rename, delete, move up/down.
  No prose body yet.

Exit criteria:

- Create a doc, add sections, move them around → tree updates live.
- Attach an attachment to a section; see the link listed under the
  section.
- Replay log on fresh SQLite → identical tree.

### M6 — See Agent Work mocked control room

Goal: humans can see and steer agent/swarm work using EMA language even before
real execution exists.

Scope:

- `apps/web/src/vapps/see-agent-work/` — operational control surface.
- Projection: `see_agent_work.project_pulse` — may be mocked or derived
  from early lane/handoff/proposal events.
- Show swarms, campaigns, missions, lanes, handoffs, vCalendar, weekly
  phases, checkups, agents, blocked work, and recent events.
- Include mocked start, pause, and stop controls.
- Include a CLI equivalent panel using `docs/cli/see-agent-work.md`.
- Include copyable agent prompt blocks for external Codex/Claude CLI
  orchestration.
- Follow the external-agent runbook in
  `docs/agents/see-agent-work-agent-usage.md`.
- Link source material through git-ema ids.

Exit criteria:

- Page renders without needing real Hermes execution.
- Every visible major action has a CLI-shaped equivalent.
- Mocked controls are visibly marked as mocked/stubbed.
- A human can use the page as a command board for external agents.

### M7 — Desktop parity

Goal: everything in M1-M6 works identically in the Tauri build.

Scope:

- `apps/desktop/src-tauri/tauri.conf.json` — confirm CSP allows
  `ws://127.0.0.1:49555`.
- First-launch UX: if daemon isn't running, show a small "Start EMA
  daemon?" affordance. Initial version: just a link to
  `scripts/dev-daemon.sh`; full launchd/systemd installer is later.
- Ensure design-system tokens load in both web and desktop builds
  (they're plain CSS, so this should be free).

Exit criteria:

- `pnpm tauri dev` opens a native window showing the same UI as
  `pnpm dev`, talking to the same daemon.

### M8 — Polish pass + anti-regression

Goal: the codebase is demo-able without flinches.

Scope:

- `tooling/` CI: on PR, run `gleam test`, `gleam build`, `pnpm
  -r typecheck`, `pnpm check:contracts`.
- Fill out remaining placeholder `Placeholder` types in stub bounded-contexts
  so they compile clean and clearly show "not yet used."
- Design-system tokens applied across shell + vApps.
- Empty-state copy across shell, git-ema, blueprint.
- Error classes: every failing command returns a typed `error.class`
  from the shell-protocol set — no leaks of internal error strings.
- Minimum test coverage: each writer has replay tests (command →
  events → projection) and each projection has a snapshot test.

Exit criteria:

- Fresh clone → `pnpm install && pnpm check:contracts && gleam test
  && pnpm -r typecheck && pnpm dev` — gets to a working demo with no
  manual steps.
- Demo script (under `docs/plans/DEMO-SCRIPT.md`) walks through the
  star state in under five minutes.

## Cross-cutting rules

1. **No milestone ships with an unreferenced event kind.** If you add
   one to a family file, you add it to `catalog.v0.md` in the same
   change.
2. **No projection that isn't derivable from the log.** If a UI needs
   something that isn't an event, add an event.
3. **No surface writes.** If it feels like the surface needs to cache
   or mutate, it means the projection is wrong. Push the fix into the
   daemon.
4. **One writer per context.** Don't grow parallel writers inside a
   context without an explicit reason documented in the context's
   README.
5. **No TODOs older than one milestone.** Either delete the TODO or
   file an issue and link it.

## Parallelization plan

M1 is strictly sequential. After M1 lands:

- **Track A (contracts-first data path):** M2 → M3 → M5 — identity,
  orgs, spaces, projects, blueprint structure.
- **Track B (git-ema):** M4 can start in parallel with M3 once the
  WS client + projections infrastructure from M2 is in. `ema_attachments`
  doesn't depend on spaces/projects for its writers — it just needs the
  current project's id to scope its projections, which is fine even if
  the UI is still a mock.

M6 and M7 run after A+B converge.

## What is deliberately out of scope

These belong to 0.0.6 or later. Do not let scope creep sneak them in.

- Real OAuth (Google Drive, GitHub).
- Real file byte transfer or local blob storage.
- Multi-machine BEAM collab replication for Blueprint prose.
- Device pairing ceremony (QR + BLE).
- Recovery packet generation.
- Replication transport between daemons.
- Lane / handoff / proposal / incident vApps.
- Multi-window Tauri capability partitioning.
- Real LiteFS lease election + renewal (the family exists; no bytes
  fly).
- Divergence UX (branch lineage + user-driven merge).

## Risk register

| Risk                                           | Likelihood | Mitigation                                                                  |
| ---------------------------------------------- | ---------- | --------------------------------------------------------------------------- |
| Gleam WS libraries are immature                | Medium     | Fall back to plain TCP + JSON framing if mist/gleam_http can't carry WS reliably; keep the framing in `shell_ipc` isolated. |
| Tauri v2 + pnpm workspace integration rough    | Medium     | Keep `apps/desktop` a thin wrapper; all UI logic stays in `apps/web` so regressions show up in both builds simultaneously.   |
| Scope creep on git-ema (real OAuth sneaking in)| High       | Cross-cutting rule #5 + PR checklist: any change touching `ema_attachments/connectors.gleam` that adds network code is out-of-scope for 0.0.5. |
| Projection complexity explodes                 | Medium     | Cap wave-1 projections at the five named in `surface-core/src/projections/`. Add new ones only when a surface needs one, not speculatively. |
| Contract drift between docs and code           | Low        | `pnpm check:contracts` in CI.                                               |

## Working style

- Build vertically, one milestone at a time, end-to-end. Don't fan out
  into half-finished writers across contexts.
- Keep PRs tight: one milestone = many PRs, but each PR leaves the
  tree green.
- Commits reference the milestone in the message prefix:
  `M3: add space writer`.
- When doctrine changes (you find something in `architecture/*` that's
  wrong), update doctrine first, then code. Never the other way.

## Index

- Topology: [`../architecture/01-topology.md`](../architecture/01-topology.md)
- Supervision: [`../architecture/02-daemon-supervision.md`](../architecture/02-daemon-supervision.md)
- Events: [`../architecture/03-event-catalog-v0.md`](../architecture/03-event-catalog-v0.md)
- Lease: [`../architecture/04-lease-authority.md`](../architecture/04-lease-authority.md)
- Writer topology: [`../architecture/05-writer-topology.md`](../architecture/05-writer-topology.md)
- Blueprint boundaries: [`../architecture/06-blueprint-boundaries.md`](../architecture/06-blueprint-boundaries.md)
- git-ema: [`../architecture/07-git-ema.md`](../architecture/07-git-ema.md)
- Vanilla workspace: [`../architecture/08-vanilla-workspace.md`](../architecture/08-vanilla-workspace.md)
- Event catalog: [`../../packages/contracts/events/catalog.v0.md`](../../packages/contracts/events/catalog.v0.md)
- IPC: [`../../packages/contracts/ipc/shell-protocol.md`](../../packages/contracts/ipc/shell-protocol.md)
