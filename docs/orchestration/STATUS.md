# EMA 0.0.6 Orchestration Status

Canonical live ledger for the 0.0.6 buildout (continues the 0.0.5 ledger after
the 2026-05-07 cut). One coordinator, many workers. Every session — Codex,
Claude CLI, or human — reads this file on cold start.

Coordinator: Claude (replacement orchestrator, consolidated role).
Last coordinator sweep: 2026-05-09T03:45-04:00.

## Session update 2026-05-09 - Active progress and lost-work sweep

Codex refreshed the active-progress summary for the in-flight 0.0.6 build and
checked the desktop recovery scanner plus daemon meta-progress output.

**Current active build:** `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6`
on branch `bootstrap/m2-m3-shell-port`, head `daa3d7a`.

**Daemon meta-progress snapshot:**

- vCalendar phase: `handoff and next-day queue`.
- Registry totals: 27 lanes, 16 queue items, 6 agent reports.
- Lane status: 13 idea, 7 active, 7 done.
- Queue status: 12 ready, 4 blocked.
- No active lane is currently claimed in the meta-progress projection.
- Daemon-recommended next action:
  `queue_item:01KR1XBE8G009S4RYSJMDYB5WY` - surface uncommitted
  in-flight swarm/handoff/contracts work on `bootstrap/m2-m3-shell-port`.

### Found Active Work

The local worktree contains one coherent uncommitted implementation slice, not
random dirt:

- CLI: `apps/cli/src/commands/swarm.ts` moves swarm commands from stubbed
  projection seed to daemon-backed create/list/show/start/pause/stop/report
  commands; `help.ts` and `handoff.ts` are touched; `apps/cli/dist/bin.js`
  was rebuilt.
- Daemon: `apps/daemon/src/ema_shell_ipc/ema_shell_ipc.gleam` adds swarm
  command handling and `swarm.registry` projection pushes; bus/sqlite/event
  helpers are touched.
- Contracts: `packages/contracts/events/swarm.md` is new; catalog/README/tool
  event docs and `packages/contracts/types/ids.md` include swarm/tool updates.
- Architecture: `docs/architecture/25-mobile-agent-toolkits.md` is new,
  capturing Argent/Proslync mobile-agent toolkit doctrine and queueing native
  toolkit registry support.

This matches existing queue item `queue_item:01KR1XBE8G009S4RYSJMDYB5WY`;
preserve it until it is either committed, stashed with a durable handoff, or
explicitly abandoned with rationale.

### Lost-Work Scan

`node tooling/recovery/desktop-recovery-scan.mjs --json` found:

- 250 high-confidence donor/recovery candidates.
- 1 dirty worktree: the active EMA 0.0.6 worktree above.
- Candidate classes: 241 atlas-doctrine, 6 harness-donor, 3 vApp-sketch.

Interpretation: the immediate lost-work risk is not a missing external folder;
it is the uncommitted 0.0.6 swarm/handoff/contracts slice. The large candidate
pool is useful for future recovery, but most entries are donor doctrine and
should not be bulk-ported without a lane.

### Next Up

- Finish or shelve `queue_item:01KR1XBE8G009S4RYSJMDYB5WY` first so the current
  dirty swarm/handoff/contracts slice cannot be accidentally overwritten.
- Verify the swarm slice with `pnpm --filter @ema/cli build`,
  `cd apps/daemon && gleam check`, and live `ema swarm --help` /
  `ema swarm create/list/show --json` smoke checks.
- Then pull one ready daemon-observability item: harness daemon writers,
  harness provider dispatch adapters, or handoff scoping/hygiene.
- Keep `docs/architecture/25-mobile-agent-toolkits.md` tied to the queued
  Argent/toolkit registry work instead of broadening active implementation.

### Deferred

- Bulk recovery of the 250 scanner candidates; use the scanner output as a
  lane input, not as automatic migration authority.
- Full native mobile toolkit registry implementation (`ema toolkit ...`) until
  the swarm/contracts slice is settled.
- Place-companion LX1 path A/B decision remains operator-gated by the lane plan.
- cmux/t3code cockpit work remains blocked until repo/license and integration
  choices are confirmed.

### Ignored

- Generated/build duplicate artifacts under `node_modules`, daemon build
  directories, Tauri `target`, `.bin/* 2`, and SQLite WAL/SHM copies are not
  considered recoverable product work.
- Superseded 0.0.5 scratchpad artifacts are ignored unless a lane explicitly
  asks for lineage comparison.
- Donor/client-specific project code is ignored as EMA truth; only reusable
  doctrine, contracts, and surface patterns should be promoted.

## Session update 2026-05-07 — 0.0.6 architecture audit + rearch campaign opened

Claude (Opus 4.7) ran a head-orchestrator audit pass for 0.0.6, separate from
(and superseding) the morning's `MASTER-ORCHESTRATION-2026-05-07.md` 14-lane
wave plan. Operator-confirmed scope: audit + start rearchitecture, fresh
re-evaluation, structural + module + code-level depth.

**Outputs:**
- Audit: `docs/plans/0.0.6-ARCHITECTURE-AUDIT-2026-05-07.md`
- Lane plan: `docs/plans/0.0.6-LANE-PLAN-2026-05-07.md`
- Transcript: `Projects/EMA/atlas/intent/transcripts/2026-05-07-0.0.6-architecture-audit-and-rearchitecture.md`
- Doc drift sync: README, BUILD-MANIFEST, Cargo.toml all bumped 0.0.5 → 0.0.6.
- Daemon registry: campaign lane `lane:01KR1VDN9X009DM3S8QKRJTC7B` (claimed)
  + first 5 rearch lanes opened (LR1/LR2/LR3/LD1/LX1).

**Headline finding:** packages aren't load-bearing — three parallel
implementations of the same event/IPC contract live across `apps/daemon`
(126 events hand-coded), `packages/contracts/` (144-event canonical
markdown), and `packages/contracts-ts/` (2,415 LOC of generated TS
unimported by any app). `apps/web`, `apps/cli`, and
`apps/agent-blueprint-grower` each maintain their own IPC client and
projection types. The 0.0.6 highest-leverage move is making
`packages/` actually load-bearing.

**Reconciliation with morning plan:** L0/L1/L4 close (already done);
L2/L6/L7 dissolve into rearch moves; L3 reframes as LX1; the rest
survive. See lane plan §"Reconciliation map" for detail.

**Decisions deferred to operator:** LX1 path A (implement place-companion)
vs path B (delete 5 dead Rust modules); ratification of the new lane plan
as superseder for the morning plan vs co-existence; sequencing intensity
(M1 in parallel with in-flight L5/L11, or pause to focus on M1 first).

Verified:

- `ema lane open` × 6 — daemon registry round-trips for the campaign lane
  + LR1, LR2, LR3, LD1, LX1.
- `ema lane claim --lane lane:01KR1VDN9X009DM3S8QKRJTC7B` — claim recorded.
- Audit, lane plan, transcript, README, BUILD-MANIFEST, CHANGELOG, and
  Cargo.toml writes confirmed by Edit/Write tool acknowledgements.

## Session update 2026-05-07 - Coordination authority consolidation

Codex consolidated the active build around daemon-owned coordination state:

- `ema agent orient --json` now reads daemon lane/queue registries through the
  resolved project scope and filters broad handoff projections out of the EMA
  startup view unless they match the active project.
- Agent Workspace and CLI docs now state the authority order explicitly:
  daemon command result, daemon registry projection, CLI projection summary,
  exported markdown snapshot, then project-record template.
- `Projects/EMA/atlas/workspace/` is documented as fallback snapshots/templates,
  not live ownership truth. Empty coordination templates are no longer evidence
  that the swarm is idle.
- The stale `L-agent-workspace-writer` brief is marked closed for Slice A and
  retained as historical context.
- Next-round intake is recorded at
  `docs/orchestration/NEXT-INTAKE-2026-05-07.md`.

Verified:

- `pnpm --filter @ema/cli typecheck`
- `pnpm --filter @ema/cli build`
- `node apps/cli/dist/bin.js agent orient --json`
- `node apps/cli/dist/bin.js lane list --json`
- `node apps/cli/dist/bin.js queue list --json`

## Session update 2026-05-07 - Temporary workspace for GitHub cleanup

Codex introduced a temporary workspace pattern for bounded topic/concept work:

- Temporary workspace doctrine is recorded in
  `docs/architecture/21-temporary-workspaces.md`.
- A concrete GitHub cleanup workspace was created under daemon space
  `Temporary Workspaces` (`space:01KR0C50SN013YRCCZA1875CQG`) as project
  `tmp-github-cleanup-2026-05-07`
  (`project:01KR0C598B014Z8B9TNG9PR64C`).
- The cleanup lane is `lane:01KR0C5QRW0168DJ4QGJRKJJ5K`.
- The repo inventory and approval matrix are recorded in
  `docs/orchestration/temp-workspaces/github-cleanup-2026-05-07.md`.
- No GitHub repo visibility, rename, delete, transfer, or remote mutation was
  executed in this pass. The temporary workspace is proposal-only until the
  user approves exact actions.

Current recommended first GitHub batch: make the four EMA public repos private
before any rename/delete/consolidation work:

- `TrajanWJ/EMA-CENTRAL-EVERYTHING`
- `TrajanWJ/ema`
- `TrajanWJ/ema-atlas`
- `TrajanWJ/ema-transfer-pack-20260422-095631`

Execution update:

- The approved make-private batch was executed for EMA, selected business/demo
  repos, and selected app repos.
- `TrajanWJ/t3code`, `TrajanWJ/Auto-GPT`, and `TrajanWJ/AgentGPT` were
  archived.
- `TrajanWJ/luxury-rental-website-trajan` was deleted.
- No private repo was made public from an ambiguous `keep_public` selection.
- No Wilson site rename was performed because only `make_private` was selected;
  the rename note needs a concrete repo name approval.

## Session update 2026-04-29 — Blueprint convergence pass

Codex converged the active Blueprint swarm slice:

- `ema blueprint help` now reports all daemon-backed structural writer verbs as
  available: document create/rename/archive and section add/rename/move/remove.
- The Blueprint vApp now renders projection-first from `blueprint.sections`
  with an honest staged fallback instead of owning a private static section
  model.
- Direct vApp panel routes (`/[vapp]`) are wrapped in Suspense at the App Router
  boundary, and URL debug scope params (`org`, `space`, `project`) can drive
  panel render context without becoming canon.
- Stale blocker note: daemon IPC handlers for Blueprint rename/archive/move/remove
  exist; remaining work is focused tests/contract audit, not missing handlers.

Verified:

- `pnpm --filter @ema/cli build`
- `pnpm --filter @ema/web exec tsc --noEmit`
- `cd apps/daemon && gleam check`
- `pnpm --filter @ema/web build` — passes; existing auth NFT trace warning
  remains non-blocking.
- `node apps/cli/dist/bin.js blueprint help --json`
- `node apps/cli/dist/bin.js blueprint status --json`
- `node apps/cli/dist/bin.js blueprint list --json`
- `pnpm exec playwright test apps/web/tests/e2e/blueprint-screenshot.spec.ts --config apps/web/playwright.config.ts`

## Session update 2026-04-29 — Recovery backlog consolidated

Codex consolidated the loose EMA 0.0.5 recovery threads into
`docs/plans/ORCHESTRATION-MAP-2026-04-29.md`.

New queue records cover:

- web popouts should use the daemon companion broker before direct localhost
  fallback;
- `place-companion` native window manager still needs to be ported into
  `apps/desktop/src-tauri`;
- the `lane` vocabulary conflict must be resolved before broad workspace
  writer expansion;
- donor design tokens need promotion into `packages/design-system`;
- the recovery workbench must be replaced with real donor-informed vApp shell
  surfaces;
- pending runtime projections and command writers must ship before honest-mock
  entries can retire;
- parallel `pnpm cli ...` calls currently race the CLI build output;
  `ema <command>` (global wrapper) never rebuilds and is the safe form.

Use the orchestration map as the next-session intake packet before opening new
lanes.

## Session update 2026-04-29 — Lane/queue projections implemented

Codex implemented the first orchestration-map lane:

- `lane.*` now means agent-workspace ownership lanes. The old
  `lane.item_added` / `lane.item_moved` container model was removed from the
  active event catalog and `packages/contracts/events/lane.md`.
- Daemon now exposes `lane.registry` and `queue.registry` projections derived
  from canonical events.
- `ema lane list` reads `lane.registry`.
- `ema queue list` reads `queue.registry`.
- `packages/surface-core` now has typed `LaneRegistryProjection` and
  `QueueRegistryProjection` entries in `ProjectionMap`.
- The command palette no longer advertises the retired `lane.item_add` op.

Verified:

- `cd apps/daemon && gleam check`
- `cd apps/daemon && gleam test` — 25 passed
- `pnpm --filter @ema/cli build`
- `pnpm --filter @ema/web exec tsc --noEmit`
- `node tooling/m1-round-trip.mjs` while the daemon was held foreground
- `node apps/cli/dist/bin.js lane list --json` returned `source:
  "lane.registry"`
- `node apps/cli/dist/bin.js queue list --json` returned `source:
  "queue.registry"`

Detached daemon process check: after relaunch, `beam.smp` is listening on
`127.0.0.1:49555`; `node tooling/m1-round-trip.mjs` is green.

## Session update 2026-04-29 — Orientation drift reduced

Codex kept this pass non-surface and tightened CLI orchestration state:

- `ema tl about --json` now overlays `lane.registry` and `queue.registry`
  onto the workspace summary.
- `ema agent orient --json` now reports `status: "daemon_workspace_registry"`
  and nonzero daemon-backed lane/queue counts.
- File-backed project records remain fallback context for handoffs, executions,
  responsibilities, weekly notes, and checkups.

Verified:

- `pnpm --filter @ema/cli build`
- `node apps/cli/dist/bin.js tl about --json` returned `workspace.source:
  "daemon_workspace_registry"` with daemon-backed lane/queue counts.
- `node apps/cli/dist/bin.js agent orient --json` returned `status:
  "daemon_workspace_registry"`.

## Session close 2026-04-29 — Worktree triage, doctrine drift, agent-workspace writer blocker

### Worktree triage

The worktree had ~30 modified files + ~15 untracked. Reviewed and classified:

- **Coherent in-flight work, not garbage.** Modified daemon code (`bus.gleam`, `sqlite_ffi.gleam`, `ema_shell_ipc.gleam`, `first_boot.gleam`), modified web shell (refactor introducing `shell-scope.ts` / `vapp-registry.tsx` / `vapp-renderer.tsx`), modified See Agent Work components, modified scripts. **Preserved per AGENTS.md "preserve dirty git worktrees."**
- **Untracked CLI grammar buildout:** `apps/cli/src/commands/{agent,campaign,handoff,lane,mission,problem,queue,stub-contract,vcalendar,checkup,events,ping,status,swarm,tl}.ts` (~1300 lines total) — agent workspace grammar layer is fully scaffolded as stub-contract calls returning `pending_daemon_writer`. Untracked because it's WIP across many parallel sessions.
- **Junk:** `tmp-screenshots/`, `skills/` — flagged for `.gitignore` later.
- **Earlier "Module not found: settings-page" log error:** stale; the file was created later in the session. Web serves 200 now. Pre-existing hydration warning in `virtual-desktop-shell.tsx` is unrelated to this session's edits.

### EMA-DESIGN-DOC.md not on this filesystem

The 2026-04-24 session log references `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/doctrine/master/EMA-DESIGN-DOC.md`. This machine's user is `trajanm4air`; the path doesn't exist anywhere on this Desktop. **The 2333-line master design doc is not currently version-controlled here and the source isn't on this disk.** Pull-into-VC blocked until the user supplies the file.

### First-boot seed doctrine reconciliation

`first_boot.gleam` actually emits TWO orgs:
- `Trajan's Organization` (personal, current by default; default space `Personal Workspace`)
- `Founding-Fathers-EMA` (project org; same-name default space; project `EMA 0.0.5`)

Doctrine (IMPLEMENTATION-ROADMAP M1/M2, 08-vanilla-workspace, RUNTIME-RECOVERY-HANDOFF) assumed a single org `Founding-Fathers-EMA` was the default-current. **Doctrine updated to match the dual-seed reality** in three files:
- `docs/plans/IMPLEMENTATION-ROADMAP.md` (Star state #2)
- `docs/architecture/08-vanilla-workspace.md` (Definition)
- `docs/plans/RUNTIME-RECOVERY-HANDOFF.md` (Next Lane acceptance)

Other doctrine references to `Founding-Fathers-EMA` (`docs/cli/see-agent-work.md`, `docs/agents/see-agent-work-agent-usage.md`, decision docs) were left intact — those use FF-EMA as a project context in example commands, which is still valid since FF-EMA exists.

### `L-agent-workspace-writer` Slice A — BLOCKED on doctrine conflict

The lane / queue writer slice cannot land cleanly until the user resolves a doctrine conflict on the meaning of "lane":

- **Existing contract** at `packages/contracts/events/lane.md`: lane = a *container* holding `{proposal | incident | blueprint_section | attachment}` items, with events `lane.opened` / `lane.closed` / `lane.item_added` / `lane.item_moved`. Owner field reads `(future) ema_swarm_coordination`.
- **Existing CLI grammar** at `apps/cli/src/commands/lane.ts` (and the user-loved CLAUDE.md doctrine of "lane / queue / problem / solution / vcalendar / checkup / handoff language"): lane = an *ownership track* for a workstream, with verbs `open / claim / release / block / move / close / show / list` and a `idea/ready/active/review/blocked/done` status workflow.

These are two different objects sharing one name. Writing a Slice A daemon writer for either model would either contradict the contract file or contradict the CLI grammar. **User decision required.** Three reconciliation paths:
1. **Rename the contract object** — call the container "track" or "kanban_lane" or fold into a richer "blueprint section" model. Free up `lane.*` for the ownership-track meaning. Match the user's CLAUDE.md vocabulary.
2. **Rename the CLI verb** — call ownership tracks "workstream" or "ownership". Keep `lane.*` events for the container model. Conflicts with user-stated CLAUDE.md vocabulary.
3. **Two namespaces** — `lane.*` for the contract container, `ownership_lane.*` (or `track.*`) for the CLI grammar. Twice the writer surface; doubles the model count.

Recommendation: path 1 (rename the contract object). The CLAUDE.md "lane" vocabulary is load-bearing across user instructions and the agent workspace loop; the contract's container-of-items model has no implementation yet, so renaming it now is cheap.

## Session close 2026-04-29 — L-ipc-client-finish

Slice: L-ipc-client-finish Slice A — IPC Client Comes Alive.

Files changed:
- `packages/surface-core/src/ipc-client/index.ts` (substantial rewrite; additive-only interface — existing `connect` / `disconnect` / `sendCommand` / `subscribeProjection` signatures preserved).
- `apps/web/src/lib/ipc/index.ts` (re-exports).
- `apps/web/src/lib/ipc/use-channel.ts` (new).
- `apps/web/src/lib/ipc/use-ipc-connection.ts` (new).

7/7 minimum-behaviors verified:
1. **Opens `ws://127.0.0.1:49555`** — pass. M1 round-trip green.
2. **hello / hello_ack** — pass. Client now tracks `helloAcked`; subscribes are queued (`queuedSubscribes` set) until the server's `type:"hello"` reply arrives, then flushed in `flushQueuedSubscribes`. `sendCommand` rejects with `unavailable / "ipc not ready (handshake pending)"` until ack.
3. **ping / debug.ping** — pass. Server `ping` → client `pong` already worked. Added client-originated keepalive `ping` every 10s (`PING_INTERVAL_MS`) plus a 15s `pong` timeout (`PONG_TIMEOUT_MS`); silence closes the socket, which triggers reconnect.
4. **subscribe + event fan-out** — pass. New `subscribeChannel(channel, listener)` API on `IpcClient`. `type:"event"` messages now route to channel listeners by `msg.channel`. `subscription_dropped` (backpressure path per protocol §Backpressure) re-issues subscribe automatically.
5. **Pending command map** — pass. Existing behavior preserved; map keyed by message id, 10s timeout, `in_reply_to` lookup, error normalization.
6. **Reconnect with backoff** — pass. New `scheduleReconnect()` uses `[1000, 2000, 4000, 8000, 15000]` ms (matches protocol §Reconnect). `manuallyClosed` flag suppresses reconnect after explicit `disconnect()`. `reconnectAttempts` resets to 0 on hello-ack. All active subscriptions re-issued on every successful (re)connect via `flushQueuedSubscribes`.
7. **Offline state to hooks** — pass. New `ConnectionState` enum (`idle | connecting | open | offline | reconnecting`); `subscribeConnection(listener)` and `getConnectionState()` on the client; `useIpcConnection()` hook exposes it to surfaces. Surfaces no longer have to infer offline from a `null` projection.

Plus checks:
- `node tooling/m1-round-trip.mjs` — `m1-round-trip: OK` (protocol shape unchanged).
- `cd apps/web && tsc --noEmit` — exit 0.
- `bash scripts/contract-check.sh` — OK.
- `grep -rn "new WebSocket\b" apps/web/src/` — zero hits. Only owner of raw WS construction is `packages/surface-core/src/ipc-client/index.ts:168`, which is the canonical IPC client per shell-protocol.

Verification gaps (declared, not blockers):
- Reconnect timing, keepalive interval, and pong-timeout paths are verified by code review against shell-protocol §Keepalive and §Reconnect, not yet exercised by an automated runtime script. The next consumer lane (`L-projections-topbar`) will exercise them implicitly via long-lived projection subscriptions; a dedicated `tooling/ipc-client-lifecycle.mjs` would harden this further. **Logged as queue follow-up under `L-projections-topbar` rather than reopening this lane.**
- `subscribeChannel` is available in surface-core but not yet consumed by any web surface. `L-see-agent-work-8-region` carry-over is the natural first consumer (chronicle event stream).

Risks: none blocking. Additive-only interface change means no existing surface code needs to migrate.

Unblocks: **`L-projections-topbar`** (topbar can swap `mockTopbar` for `useProjection("topbar")` and use `useIpcConnection()` to render an explicit offline state).

## Session open 2026-04-29T07:06Z — Environment refresh + bootstrap

Sweep purpose: clear 5-day staleness, restart daemon + web, re-verify M1, capture live workspace state, and stage the next active lane.

Meta-checks (all green):
- `bash scripts/swarm-sweep.sh` → OK, no drift. Notes: 1 unmerged branch (informational); 1 placeholder writer module (`apps/daemon/src/ema_blueprint/ema_blueprint.gleam`, 7 lines — expected pre-writer state).
- `bash scripts/contract-check.sh` → OK; every referenced event kind and id prefix is registered.
- `bash scripts/ledger-check.sh` → OK but checked 0 prompts. Path is pointing at `Projects/EMA/atlas/content/swarm/orchestrator-prompts` while canonical prompts live at `doctrine/planning/orchestrator-prompts/` — `ledger-check.sh` config drifted from the canonical layout. **Flagged as a hygiene follow-up; not blocking.**

Bootstrap evidence:
- `bash scripts/start-ema-dev.sh --no-tail` → daemon (BEAM, pid 67280) up on `127.0.0.1:49555`; web (Next, pid 67245) up on `*:5173`. Pid files written.
- `node tooling/m1-round-trip.mjs` → `m1-round-trip: OK`.
- `ema status --json` → `{"ok":true,"org":{"id":"org:01J00000000000000000000012","name":"Trajan's Organization"},"space":{"id":"space:01J00000000000000000000013","name":"Personal Workspace","is_default":true},"project":null,"node_state":"home_current"}`.
- `ema agent orient --json` → `pending_daemon_writer` (grammar registered, writes not yet wired).

Live state vs doctrine drift:
- First-boot seed currently produces `Trajan's Organization` / `Personal Workspace` (no project). The Implementation Roadmap M2 exit text still describes `Founding-Fathers-EMA` / same-name default space / `EMA 0.0.5` project. `apps/daemon/src/ema_swarm_coordination/first_boot.gleam` is in the dirty worktree; the seed values were changed but the doctrine reference text was not. **Treat the runtime seed as the new canon and update doctrine on the next Canon Writers slice; do not revert the seed.**
- `agent` / `lane` / `queue` / `mission` / `campaign` / `vcalendar` / `checkup` / `handoff` grammar is registered in CLI but every subcommand reports `pending daemon writer`. The next high-leverage writer slice is wiring at least `lane open` / `lane claim` / `queue add` through to the daemon so coordinator state stops living in markdown.



## Session close 2026-04-24T20:10Z — Canon Writers Slice B (Master Design Doc)

Slice: Canon Writers B — Master Design Doc Bootstrap.

Branch: `lane/canon-writers-master-design-doc` (pre-existing; per
orchestrator prompt).

Commits: STATUS.md only in this sweep. The master design doc lives under
`/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/doctrine/` which is NOT a git
repository (`git -C /Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING status`
returned `fatal: not a git repository`), so no commit was created there —
the doc was written directly to disk. Per orchestrator prompt per-slice
hygiene rule, `git add docs/orchestration/STATUS.md` only; no `git add -A`.

File written: `doctrine/master/EMA-DESIGN-DOC.md` — rewritten from the
61-line shell into the full 21-section master design doc per the user's
blueprint. 2333 lines, 35 `## ` headings (21 required sections + nested
sub-blocks), language-lock clean (no `Project -> Space` containment
text, no `cannon` misspellings).

21 sections authored, in order: Executive Summary (rewritten from "ADIL
WISPR SLOP" into tight executive prose; preserves the north-star
sentence; names Adil's wholesaling REI + founding operators); Core
Thesis (Karpathy "IDEs need to get bigger" + one-sentence lock + five
commitments); Problem EMA Solves (Notion/Miro/chat-first/automation
critique + six-property counter); Design Principles (Gleam/BEAM; intent
vs canon; agents-need-environments; daemon/surfaces; honest mocks;
peripheral view with Ready Player One framing preserved; user-voice
preservation; no generic SaaS; collaboration as force multiplier); EMA
Ontology (full glossary with ID prefixes; alley/bolero marked as
product vocabulary per language-lock §9); Canonical Workflow (intent →
proposal → plan → spec → execution → canon with per-stage who-creates /
who-approves / what-can-change / what-must-remain-preserved); Product
Model (four-stack: shared workspace + control plane + harness + multi-
app shell; "EMA is not an OS" explicit); Core Product Surfaces (9
surfaces each with what/who/renders/doesn't-own/truth-relationship);
Agent Model (identity/soul/membership/capability + spawn-to-action path
+ agent days/weeks + peripheral view); Soul Model (DEEPEST section per
user instruction; what-it-is, how-provided, how-it-shapes-behavior,
what-makes-it-powerful, how-bounded-safely, how-evolves, souls-as-moat;
Andrew Tate demonstration vector preserved verbatim with third-party-
modeled-soul safety bounds labeled); Memory and Context Model (seven
layers + drowning-vs-starving + forefront-of-mind construction);
Temporal System (vCalendar / agent days/weeks / weekly phases /
checkups / cadence / real-world time); Project / Org / Space Structure
(locked topology + scoping + hard-vs-soft boundaries); Debate,
Simulation, and Stress Testing (structured format + simulated
stakeholders + stress-test + output structure; "debate does not
directly mutate canon" preserved); Harness / Control Plane / Runtime
(EMA/daemon/control plane/Hermes/harness/driver/provider/runtime/
surfaces distinction + ownership table + execution path + donor-
grounded patterns from lineage-original-elixir-ema, codebase-ema,
codebase-place-companion); Governance and Trust (approval gates +
autonomy boundaries + bad-canon correction + authority logging +
trust zones Zone 0/1/2 from codebase-execudeck); MVP Definition (must-
include + excludes + 10-step first-proof-workflow); Risks and Failure
Modes (brutal-honesty posture across conceptual/product/technical/
trust/organizational/over-complexity/context-quality); Validation Plan
(internal EMA-builds-EMA + external Adil wholesaling REI + measurable
signals + long-term validation); Open Questions (must-answer / can-
defer / long-term strategic with 10 strategic entries); Closing Frame
("Without EMA, you have no consistent logic and system and framework
for the AI to operate within" preserved verbatim; "Without it, we are
unprepared. With it, we can begin." close).

Gold thoughts preserved verbatim or near-verbatim: Ready Player One
environment metaphor (§4.6, §9.6); Andrew Tate soul-depth demonstration
(§10.2 with safety bounds §10.6); humanity-leveled-up-via-collaboration
framing (§21); Karpathy living-wiki-as-moat (§10.8, §11.4); intent →
canon pipeline as CANONICAL (§4.2, §6); agents-need-environments (§4.3
with instruction to write on the wall); "Without EMA…" closing (§21).

Language-lock compliance: `Organization -> Space -> Project` topology
used throughout (§13); `canon` spelled correctly (no `cannon`); `intent
/ canon / lane / handoff / mission / campaign / soul / workstream`
vocabulary locked and consistent; `task` used only as a distinct object
from `lane` per 0.0.3 shared-agent-swarm-workspace doctrine (`queue_item
-> lane -> task -> execution -> outcome`), never as a synonym for lane;
alley and bolero explicitly marked as product vocabulary with lockdown
pending; no generic SaaS admin-panel language; HQ explicitly
distinguished from admin-panel posture.

Verification:
- `wc -l doctrine/master/EMA-DESIGN-DOC.md` → 2333 lines (target 1500+).
- `grep -c "^## " doctrine/master/EMA-DESIGN-DOC.md` → 35 (target ≥21).
- `grep -E "Project -> Space|cannon" doctrine/master/EMA-DESIGN-DOC.md`
  → no matches.

Scope discipline: no runtime code touched; no orchestrator-prompts
touched; no doctrine/research files touched; no STATUS.md sections
beyond this new session-close entry; no `apps/desktop/src-tauri/**`
touched (parallel orchestrator active on that tree).

Recommended next lane: Slice C — Project Overview Document + Technical
Document + Styling/UX Mentality Document. These three refine the master
doc into implementation-ready specs. Suggested order: (1) `doctrine/
master/EMA-PROJECT-OVERVIEW.md` (PRD-shaped); (2) `doctrine/master/EMA-
TECHNICAL-DESIGN.md` (event catalog + writer topology + IPC shape +
supervision tree + donor-translation map); (3) `doctrine/master/EMA-
STYLING-UX-MENTALITY.md` (aesthetic + interaction manifesto, absorbing
the place.org-ux-manifesto referenced in DOC1 of the Full Donor
Inventory).

Risks / next blockers:
- Master doc references `doctrine/design/place-org-ux-manifesto.md`
  which does not yet exist (top-priority in `EMA-0.0.5-FULL-DONOR-
  INVENTORY.md` DOC1). Next Canon Writers slice should create it or
  add a redirect pointer.
- `task`-vocabulary usage is load-bearing (distinct from lane per 0.0.3
  doctrine). If the runtime ever subsumes task into lane, this doc
  needs the same consolidation.
- Master doc lacks a "Doctrine revision history" block; future slices
  should add one or standardize doc-header versioning.


## Canon update 2026-04-24 — Web vDesktop stack locked

Decision: `@ema/web` is now canonically the **Next.js + React + Motion +
Zustand** browser vDesktop. This is not an experiment and not a temporary
detour. The purpose is to reflect the original `place.org` desktop system with
least resistance: place.org's donor code, icons, SVGs, window manager concepts,
launcher, dock, Motion patterns, and Zustand state shape should be copied or
adapted forward rather than re-created as Vite lookalikes.

Canonical runtime files:
- `apps/web/app/` — runnable Next app surface.
- `apps/web/app/page.tsx` — current place.org-style vDesktop shell with
  Launchpad as the first window.
- `apps/web/app/globals.css` — current desktop visual system.
- `apps/web/src/place-donor/place-org/` — copied place.org donor payload
  (intentionally excluded from the Next build until pieces are adapted).
- `apps/web/src/place-reflection/` — adaptation/shim area for donor-derived
  components.

Canonical commands:
- `pnpm --filter @ema/web dev` starts Next on `http://localhost:5173`.
- `pnpm --filter @ema/web build` runs `next build`.

Routing / ownership:
- Web vDesktop Surface owns browser desktop posture: Launchpad-as-vApp,
  dock, wallpaper, window chrome, place.org visual fidelity, and the
  Next/Motion/Zustand surface.
- Desktop Launcher Correction owns the Tauri/native shell only. It embeds
  the web surface but does not own the browser vDesktop design or stack.
- Runtime Vertical Slice owns daemon-backed IPC/projection reality. It should
  integrate with the Next web surface rather than reintroducing a Vite runtime.

Verification already run in this slice:
- `pnpm --filter @ema/web build` — clean.
- Playwright smoke of `http://localhost:5173/` — `.place-desktop`, 1 window,
  9 dock icons, no console errors, no horizontal overflow.

## Session close 2026-04-24T15:45 — Cross-lane Donor Inventory

Worker: Cross-lane research session acting under Codebase Architecture & Extensibility.

Context: prior session landed Slice A (See Agent Work first screen) citing 6 donors from
`EMA-0.0.5-SURFACE-DONOR-MATRIX.md`. User observed there are **far more** extractable
assets in ema-atlas's 34 branches and in the TrajanWJ GitHub ring — "so many valuable
assets and documentation in atlas. it deserves more." Specifically called out the "full
Elixir Tauri build with working transparency" as underdone.

Mined 18 atlas codebase/lineage branches + 12 docs-* branches + 16 TrajanWJ repos via
three parallel Explore agents. Findings landed on branch
`lane/cross-lane-donor-inventory` (commit `8db658d`).

Files written:
- `doctrine/research/EMA-0.0.5-FULL-DONOR-INVENTORY.md` (new, ~500 lines). Cross-lane
  donor inventory: Runtime (5 donors) + Desktop Launcher (3) + Doctrine pulls (12) + GH
  ring inventory. Priority intake lists per lane + handoff-trigger template.
- `doctrine/research/EMA-0.0.5-SURFACE-DONOR-MATRIX.md` (extended). Two new rows:
  §7.5 `codebase-place-org-openclaw` (glass morphism, popout-launcher, companion-bridge,
  additive-only fork seam, graceful degradation) and §7.75 `codebase-execudeck`
  (trust zones Zone 0/1/2, schema-driven mutations).

Crown-jewel locator (direct answer to the user's "full Elixir Tauri transparency build"):

- **Half 1 — Elixir daemon** lives in `ema-atlas origin/codebase-ema:code/ema/daemon/`.
  Contains `control_plane/`, `babysitter/`, `sessions/`, `workspace/shared`,
  `surfaces/hermes_client.ex` (typed EMA-truth / Hermes-execution seam),
  `second_brain/indexer.ex`. Substrate is Elixir/Phoenix/OTP; EMA 0.0.5 carries the
  shape forward in Gleam/BEAM.
- **Half 2 — Tauri transparent companion** lives in
  `ema-atlas origin/codebase-place-companion:code/place-companion/src-tauri/`. Rust + Tauri
  v2 + objc2. `.transparent(true)` + macOS `NSWindow.setOpaque:false` via objc2 unsafe
  (Tauri issue #13415 workaround) + Linux `xprop _NET_WM_CM_S0` compositor check +
  localhost WebSocket on ports 27182–27189 with origin allowlist +
  `ActivationPolicy::Accessory` tray daemon + `macos-private-api` feature flag.
  **Production-ready; port wholesale to `apps/desktop/src-tauri/src/`.**
- **Integration spec (the glue)** lives in `ema-atlas origin/codebase-place-org-openclaw:
  code/place.org-openclaw/docs/superpowers/specs/2026-03-24-companion-app-design.md`
  plus `popout-launcher.ts` and `companion-bridge.ts` on the browser side. Absorb into
  new `docs/architecture/14-companion-bridge.md`.

Naming correction recorded in the inventory: the two halves were **never** compiled into
one repo. The "Elixir Tauri" integration is a WebSocket seam, not a shared build. Future
agents chasing a single "Elixir Tauri" repo should read the inventory's Crown Jewel section
first.

Also captured: the `docs-place-org-era-research` branch contains the aesthetic manifesto
(time-of-day color breathing, bioluminescent glow NOT neon, 5-min idle screensaver, spring
easing, calm-tech posture) that the user's "looks horrible" feedback was pointing at.
Flagged as top-priority doctrine pull: `doctrine/design/place-org-ux-manifesto.md`.

Priority intake (top 3 per lane; full list in the inventory):

- Runtime Vertical Slice: port `hermes_client.ex` shape into Gleam `ema_exec_control`;
  extract claudeforge session-manager invariants into contract tests; define
  `packages/surface-core/src/companion-bridge/` client contract.
- Desktop Launcher Correction: copy place-companion `src-tauri/src/*.rs` verbatim into
  EMA; absorb companion-app-design spec into `docs/architecture/14-companion-bridge.md`;
  add `check_status` daemon probe per superman pattern.
- Product Surface Donor (post Slice A): write `doctrine/design/place-org-ux-manifesto.md`;
  write `docs/vapps/catalog-reconciliation.md` for the 35-vApp donor vs current renderer
  discrepancy; consider opt-in "pop out vApp" affordance when the companion-bridge lands.

Lane discipline: this research sits in `doctrine/research/` which is shared across
orchestrators. No code touched; no runtime files modified. All findings are read-only
snapshots ready for each lane owner to act on.

Branch: `lane/cross-lane-donor-inventory`. Commit: `8db658d`.

## Session close 2026-04-24 — Canon Writers Slice A

Slice: A — First-Boot Seed Actually Emits.

Files changed:
- `apps/daemon/test/ema_daemon_test.gleam`
- `apps/daemon/test/ema_test_helpers.erl`

Audit result:
- `apps/daemon/src/ema_swarm_coordination/first_boot.gleam` already constructs
  13 event envelopes and sends them through `bus.append` via
  `seed_if_needed/1`.
- `apps/daemon/src/ema_daemon/supervisor.gleam` already wires the seed path
  immediately after `bus.start` and before IPC starts.
- Idempotency guard is `bus.event_exists(bus_subject, "org.created",
  first_boot.org_id)`, so relaunch against the same canonical DB skips seed.
- All emitted kinds are present in `packages/contracts/events/catalog.v0.md`;
  no catalog or id-prefix additions were needed.

Test coverage added:
- `first_boot_appends_ordered_seed_events_to_sqlite_test` reads the real
  SQLite `events` table and asserts ordered first-boot rows, including the
  founding `org.created` -> `space.created` -> `project.created` chain.
- `ema_test_helpers:event_kind_org_rows/1` is a test-only SQLite reader.

Boot evidence:
```
first_count=13
second_count=13
device.registered|org:01J00000000000000000000001
actor.created|org:01J00000000000000000000001
actor.created|org:01J00000000000000000000001
actor.created|org:01J00000000000000000000001
org.created|org:01J00000000000000000000001
space.created|org:01J00000000000000000000001
project.created|org:01J00000000000000000000001
...
```

Verification:
- `cd apps/daemon && gleam build && gleam test` — green, 4 tests passed.
- `bash scripts/contract-check.sh` — OK.
- `node tooling/m1-round-trip.mjs` — `m1-round-trip: OK`.

Remaining in this lane:
- Slice B should make `ema_orgs` a fully validated command writer beyond the
  current early `org.create` path: slug/language-lock validation, typed errors,
  stronger replay/projection assertions, and IPC result shape confirmation.

## Session close 2026-04-24 — Desktop Launcher Correction Slice A

Slice: Desktop Launcher Correction A — Bundle Audit.

Files changed:
- `apps/desktop/src-tauri/tauri.conf.json`

Audit results:
- `/Users/tawj/Desktop/EMA 0.0.5.app/Contents/MacOS/ema-desktop` still reports
  `Mach-O 64-bit executable arm64`; no AppleScript `applet` regression.
- Installed bundle `Info.plist` still has `CFBundleExecutable=ema-desktop`,
  `CFBundleIdentifier=org.ema.desktop`, package type `APPL`, version `0.0.5`.
- Daemon is live on `127.0.0.1:49555` (pid 47943), and
  `node tooling/m1-round-trip.mjs` returned `m1-round-trip: OK`.
- Tauri dev initially failed because raw Vite exited on the already-live
  port 5173. Patched `beforeDevCommand` to no-op when that port is already
  listening, preserving the web dev server as the primary dev surface.
- Tauri `devUrl` now uses canonical `http://localhost:5173`.
- CSP remains narrow:
  `default-src 'self'; connect-src 'self' ws://127.0.0.1:49555; style-src 'self' 'unsafe-inline'`.

Verification:
- `file "/Users/tawj/Desktop/EMA 0.0.5.app/Contents/MacOS/ema-desktop"` —
  Mach-O arm64.
- `pnpm --filter @ema/desktop tauri dev` — clean after the port-idempotency
  patch; compiled and launched `target/debug/ema-desktop`.
- `open -n "/Users/tawj/Desktop/EMA 0.0.5.app"` — launched installed bundle
  as `ema-desktop`; test instance was quit after smoke check.
- Direct devtools CSP-console inspection was not available from this terminal
  run; no launch-time CSP errors surfaced in the Tauri foreground process.

Next slice: B — first-launch daemon detect + labelled "Start EMA daemon?"
affordance.

## Session close 2026-04-24 — Codebase Architecture Slice A Folder Audit

Slice: Codebase Architecture & Extensibility A — Folder Audit.

Audit report:
- `docs/architecture/FOLDER-AUDIT-2026-04-24.md`

Safe move executed:
- `docs/architecture/13-peer-computer-access.md` →
  `docs/operations/peer-computer-access.md` (2 importers rewired:
  `docs/WORKSPACE-ENTRYPOINT.md`,
  `docs/architecture/11-transport-and-auth-survey.md`).

Coordinator-review lanes opened:
- `docs/orchestration/lanes/L-vapp-path-reconciliation.md`
- `docs/orchestration/lanes/L-web-generated-source-twins.md`
- `docs/orchestration/lanes/L-surface-core-adapter-reconciliation.md`
- `docs/orchestration/lanes/L-surface-slice-plan-archive.md`

Inventory/context updates:
- Root `README.md`, runtime `README.md`, `docs/WORKSPACE-ENTRYPOINT.md`, and
  `inventory/WORKSPACE-INVENTORY.md` now point cold readers at this live
  ledger.

Verification:
- `bash scripts/lint.sh` could not run because `scripts/lint.sh` does not
  exist yet.
- `bash scripts/contract-check.sh` green.
- `cd apps/daemon && gleam build && gleam test` green.
- `pnpm -r typecheck` green (currently only workspace packages with a
  `typecheck` script run it).
- `pnpm --filter @ema/web build` green.
- `node tooling/m1-round-trip.mjs` green against the live daemon.

## Session close 2026-04-24T15:20 (Product Surface Donor worker, meta-drift recovery + Slice A)

A prior master-orchestrator session drifted hard: invented three rogue
orchestrator prompts (CLAUDE-V2, CODEX-V2, CODEX-CORRECTION-2026-04-24),
crossed three ownership lanes (Surface + Runtime Vertical Slice + Desktop
Launcher) in one pass, shipped a generic glass VirtualDesktopShell block
styled with legacy `--ema-*` hex colors before checking that the place.org
palette was already in place, and skipped the `docs/plans/SURFACE-SLICE-A.md`
plan that the approved Product Surface Donor lane had queued. User feedback:
"looks horrible. not the vision or similar to other codesbases."

This session diagnosed the meta-drift, reverted the lane violations, and
landed the canonical Slice A as the Product Surface Donor worker.

Reverts:
- `packages/surface-core/src/adapter/` deleted (Runtime Vertical Slice lane
  territory; was out of scope for any Surface work).
- `doctrine/planning/orchestrator-prompts/{CLAUDE,CODEX}-ORCHESTRATOR-PROMPT-V2`
  and `CODEX-CORRECTION-PROMPT-2026-04-24` moved to
  `orchestrator-prompts/archive/` with `HANDOFF-2026-04-24.md` preserved
  as the canonical dissolution memo.

Landed (commit `40ba1ea` on branch `lane/surface-slice-a-see-agent-work`):
- `apps/web/src/app/see-agent-work/` — 8 region components + barrel.
  Regions: TopSwarmPulse, MissionRail, LaneBoard (idea/ready/active/review/
  blocked/done columns), VcalendarStrip, AgentRoster, CommandPanel,
  AgentInstructionPanel, ChronicleStrip.
- `apps/web/src/app/agent-work-page.tsx` — composes the 8 regions.
- `apps/web/src/app/mock-projections.ts` — adds `recent_events[]`,
  exports `CHRONICLE_MAX = 200`, derives `agentWorkLaneSummary`.
- `apps/web/src/app/hq-page.tsx` — Lane status panel rewired to read
  `agentWorkLaneSummary` (not the one-line `agentWork` stub).
- `apps/web/src/app/styles.css` — adds `.ema-saw-*` classes with RIP
  provenance markers (place.org glass tiers, codebase-frontend-layer
  density, agent-os-bridge state vocabulary, lineage-original-elixir-ema
  bounded buffer, mission-control-claude role display).

Verifications:
- `pnpm --filter @ema/web build` (tsc + vite) green — 71 modules, 44.8 KB CSS,
  256 KB JS.
- `pnpm check:contracts` — OK — every referenced event kind and id prefix
  is registered.
- Reject ledger clean in `apps/web/src/`: localStorage confined to
  `layout-artifact.ts` (per `ema-virtual-desktop` skill); no Tailwind, no
  shadcn, no zustand, no framer-motion, no electron.
- 21+ `RIP:` provenance markers across `styles.css` + components +
  `mock-projections.ts`.

Language-lock check: every UI string uses `org / space / project / lane /
mission / campaign / handoff / actor / agent / canon / intent / vcalendar /
checkup / weekly phase / focus block`. No `task`-as-synonym-for-lane, no
`workflow`, no `pipeline`. Every mocked control carries one of
`mocked | draft | local only | pending daemon writer`.

Surface lane carry-over (still queued):
- **Slice B** — HQ lane-status deepening: sparkline per lane, hover CLI preview.
- **Slice C** — Global command palette (inspired by place.org, strictly
  IPC-dispatched; no UI-local canon).
- **Slice D** — Chronicle strip frame-type visual language + bounded-buffer
  instrumentation (already partially landed via Slice A's `data-frame`
  attribute; polish lane to come).
- **Slice E** — Vocabulary notes in `docs/cli/see-agent-work.md` (agent-os
  verbs, mission-control adapter-protocol note) and
  `docs/vapps/see-agent-work.md` (takeover state labels).

Adjacent lanes untouched (hand off, don't cross-edit):
- Runtime Vertical Slice Orchestrator: topbar daemon-projection actor
  (`L-projections-topbar` Slice B below); `apps/daemon/**` and
  `packages/surface-core/**` edits.
- Desktop Launcher Correction Orchestrator: Tauri tray / first-launch
  "Start EMA daemon?" affordance; Tauri CSP review.

Decisions logged this sweep:
- 2026-04-24: meta-drift discipline — any orchestrator prompt added beyond
  the canonical 8 listed in `ORCHESTRATOR-INDEX.md` requires a named
  superseding memo (like `HANDOFF-2026-04-24.md`) and a new entry in the
  index before workers treat it as authoritative.
- 2026-04-24: lane-branch policy enforced — Slice A landed on
  `lane/surface-slice-a-see-agent-work`, not on `main`. Next lane starts a
  new branch per `docs/operations/git-policy.md`.

## Session close 2026-04-24T14:48

Coordinator handoff landed. Specifically:
- Ledger file (this file) created.
- `doctrine/planning/orchestrator-prompts/HANDOFF-2026-04-24.md` written — explains consolidation + why Codex was demoted.
- `doctrine/planning/orchestrator-prompts/CODEX-ORCHESTRATOR-PROMPT.md` reframed as a worker brief (header + read-first order changed; a parallel session had already added Stub Discipline + Vertical-Slice Rule, both kept). The "First Codex Lane" is now framed as "Recommended first slice (coordinator assigns the lane)."
- `apps/web/src/app/mock-projections.ts` `agentWork` export no longer carries "Codex: active" self-reports; it carries one entry that points callers at this ledger, plus a `TODO(event-family: …)` comment.
- MOCK badges confirmed already rendered on every mock-backed surface (topbar, hq-page, agent-work-page, blueprint, git-ema connectors + attachment list, placeholder-page) — no new wiring needed.
- `.ema-dev/pids/daemon.pid` and `.ema-dev/pids/web.pid` now reflect the live pids (47943 / 40269) instead of the dead 41762.

Outcome: daemon compiles green (fix landed via a parallel session while coordinator was planning); daemon alive; web alive; W1 M1 round-trip is the next exit gate.

## Session close 2026-04-24 — Workspace Hygiene Slice A

Slice: Workspace Hygiene A — Orchestrator Prompt Reconciliation.

Files changed in `doctrine/planning/orchestrator-prompts/`:
- Created `archive/2026-04-24/` and moved three superseded prompts into it: `CODEX-ORCHESTRATOR-PROMPT.md` (V1), `CLAUDE-ORCHESTRATOR-PROMPT.md` (V1), `CODEX-CORRECTION-PROMPT-2026-04-24.md` (one-shot recovery).
- Wrote one-line redirect stubs at the three original paths pointing at the canonical successor.
- Rewrote `ORCHESTRATOR-INDEX.md` with `## Ledger anchor`, `## Active Prompts` (9 rows), `## Archived Prompts` (3 rows), and expanded `## Collision Rules`.
- Added `## Ledger anchor` section to all 9 canonical prompts: Runtime Vertical Slice, Product Surface Donor, Canon Writers, Provenance & Version Control, Workspace Hygiene & Swarm Meta, Code Quality & Language Idiom, Codebase Architecture & Extensibility, Codex V2, Claude V2. No body edits on any of them.

Prompts reconciled (old → new):
- `CODEX-ORCHESTRATOR-PROMPT.md` → `archive/2026-04-24/CODEX-ORCHESTRATOR-PROMPT.md` (superseded by `CODEX-ORCHESTRATOR-PROMPT-V2.md`).
- `CLAUDE-ORCHESTRATOR-PROMPT.md` → `archive/2026-04-24/CLAUDE-ORCHESTRATOR-PROMPT.md` (superseded by `CLAUDE-ORCHESTRATOR-PROMPT-V2.md`).
- `CODEX-CORRECTION-PROMPT-2026-04-24.md` → `archive/2026-04-24/CODEX-CORRECTION-PROMPT-2026-04-24.md` (guardrails absorbed into V2 preamble).

Lane files written: 0 — Slice B.
Scripts added/upgraded: 0 — Slices C / D / F / G.
Sweeps enabled: no — Slice F.
Ledger gate enforced: no — Slice G (`scripts/ledger-check.sh` lands then).

Risks and notes:
- Two canonical prompts (`CODE-QUALITY-AND-LANGUAGE-IDIOM-ORCHESTRATOR-PROMPT.md`, `CODEBASE-ARCHITECTURE-AND-EXTENSIBILITY-ORCHESTRATOR-PROMPT.md`) were present in the folder but absent from the Workspace Hygiene prompt's original "Current state to reconcile" list. They were absorbed into Active Prompts during reconciliation. Coordinator should confirm long-term status.
- Codex V2, Claude V2, and Provenance still contain body references to `CODEX-CORRECTION-PROMPT-2026-04-24.md`. Those links now resolve to a redirect stub; the archived file at `archive/2026-04-24/` remains authoritative if correction-specific detail is needed. Out of scope for Slice A per the hygiene orchestrator's ownership boundary (no body edits on other orchestrators' prompts).

Next slice: B — populate `docs/orchestration/lanes/L-<id>.md` for every lane in this STATUS.md.

## Session close 2026-04-24 — Workspace Hygiene Slices B–G

Slice: Workspace Hygiene B–G landed in a single continuous sweep after Slice A.

**Slice B — Populate `docs/orchestration/lanes/`**
- Created `docs/orchestration/lanes/` and wrote five lane files:
  `L-ipc-client-finish.md`, `L-projections-topbar.md`, `L-writers-org-space.md`,
  `L-see-agent-work-docs.md`, `L-honest-mocks.md` (retrospective for the
  closed lane).
- Each file contains: status, owner, read-first, scope (exact paths),
  dependencies, exit criteria, reporting template, ledger anchor.
- STATUS.md lane-table rows now link to the matching lane file.

**Slice C — `scripts/stop-ema-dev.sh`**
- New clean-shutdown companion to `start-ema-dev.sh`. Reads pid files,
  SIGTERM → grace → SIGKILL, removes stale pid files, leaves logs alone.
  `--force-port-kill` flag (off by default) gates the cross-PID port-safety-net
  step per the "don't kill unrelated user sessions" non-negotiable.
- Help output verified; not executed against the live daemon (pid 47943) to
  preserve the running user session.

**Slice D — `scripts/contract-check.sh` upgrade**
- Three error classes: `missing-from-catalog`, `misspelled-kind` (Levenshtein
  ≤ 2, suggests closest known kind), `unknown-id-prefix`.
- `--json` output for CI.
- `--test-fixture` subcommand runs against `test/fixtures/bad-kinds/` and
  asserts exit 1 with all three classes raised. Fixture file ships under
  `test/fixtures/bad-kinds/bad_source.gleam` with deliberately wrong kind
  (`org.greated`), unknown kind (`dispatch.teleported`), and unregistered
  prefix (`orgx:`).
- Verified: real tree → OK exit 0; JSON → parseable; fixture → all three
  errors classified, suggestion is `org.created`.

**Slice E — Donor Translation Pipeline**
- Created `docs/operations/donor-translation.md` defining the four verdicts
  (`copy` / `adapt` / `inspire` / `reject`), the `SOURCE:` header format
  with donor branch + commit sha + reviewer, lane-ticket requirement for any
  `copy`/`adapt`, forbidden `copy` targets (topology, event shape, daemon
  authority, contracts, IPC plumbing, routing shell), and a 7-item translator
  checklist.
- Linked from STATUS.md under `## Operational docs`.
- Not linked from `doctrine/planning/EMA-0.0.5-BUILDOUT-MASTER-PLAN.md` —
  that file is outside this orchestrator's ownership boundary. Flagged as a
  coordinator follow-up.

**Slice F — `scripts/swarm-sweep.sh`**
- Read-only six-check sweep: pids vs processes, port listeners, git branches
  (merged / unmerged / stale > 7d), placeholder writer modules (≤10 lines),
  ORCHESTRATOR-INDEX.md file references resolve on disk, ledger-check passes.
- Human + `--json` output modes. Cron-compatible.
- Surfaced real meta-drift on first run: INDEX still listed V2 briefs as
  Active while a parallel session had archived them. Fixed by moving the V2
  rows from Active to Archived (now 8 canonical specialists + 5 archived
  entries), and repointing the two redirect stubs at
  `CODEX-ORCHESTRATOR-PROMPT.md` and `CLAUDE-ORCHESTRATOR-PROMPT.md` at
  `HANDOFF-2026-04-24.md` (the dissolution memo).

**Slice G — `scripts/ledger-check.sh`**
- Grep-based assertion that every canonical orchestrator prompt references
  `docs/orchestration/STATUS.md`. Excludes redirect stubs (first-line "has
  been superseded"), the index, and handoff notes.
- Referenced by `swarm-sweep.sh` check #6.
- Current tree: 8/8 canonical prompts cite STATUS.md.

**Post-landing verification (all rc=0):**
```
contract-check.sh                 → OK
contract-check.sh --json          → parseable JSON
contract-check.sh --test-fixture  → fixture fails correctly (rc=1 from child)
ledger-check.sh                   → 8/8 canonical prompts cite STATUS.md
swarm-sweep.sh                    → OK, no drift
stop-ema-dev.sh --help            → parses (not run against live daemon)
```

**Files changed this sweep:**
- Created: `docs/orchestration/lanes/L-*.md` (5 files),
  `docs/operations/donor-translation.md`, `scripts/stop-ema-dev.sh`,
  `scripts/swarm-sweep.sh`, `scripts/ledger-check.sh`,
  `test/fixtures/bad-kinds/bad_source.gleam`.
- Upgraded: `scripts/contract-check.sh`.
- Edited (this STATUS.md): added `## Operational docs` section; lane-table
  rows now link to lane files.
- Edited (orchestrator-prompts): `ORCHESTRATOR-INDEX.md` Active/Archived
  reconciliation (10 → 8 canonical, 3 → 5 archived);
  `CODEX-ORCHESTRATOR-PROMPT.md` and `CLAUDE-ORCHESTRATOR-PROMPT.md` redirect
  stubs repointed at `HANDOFF-2026-04-24.md`.

**Coordinator follow-ups flagged:**
1. `doctrine/planning/EMA-0.0.5-BUILDOUT-MASTER-PLAN.md` should gain a
   reference to `docs/operations/donor-translation.md` (outside hygiene
   ownership boundary).
2. One unmerged git branch `lane/surface-slice-a-see-agent-work` is present —
   informational only, not stale yet.
3. Five placeholder writer modules remain at ≤10 lines (identity, invites,
   memberships, replication, blueprint) — expected pre-writer state; flagged
   for the Canon Writers lane sweep.

Next: outside this orchestrator's scope — Provenance lane (git init,
CHANGELOG), Canon Writers lanes (first-boot seed, org/space writers),
Runtime Vertical Slice lanes (IPC client audit close-out, topbar projection).

## Read-first order for any new session

1. This file (`docs/orchestration/STATUS.md`)
2. `doctrine/planning/EMA-0.0.5-BUILDOUT-MASTER-PLAN.md`
3. `doctrine/planning/EMA-0.0.5-LANGUAGE-LOCK.md`
4. `doctrine/planning/EMA-0.0.5-PASSOVER-AND-PREP.md` (topology rationale, older 0.0.3 trap-doors to avoid)
5. `runtime/EMA-0.0.5--4-24/docs/architecture/08-vanilla-workspace.md`
6. `runtime/EMA-0.0.5--4-24/docs/architecture/09-see-agent-work.md`
7. `runtime/EMA-0.0.5--4-24/docs/architecture/10-first-boot.md`
8. `runtime/EMA-0.0.5--4-24/docs/plans/IMPLEMENTATION-ROADMAP.md`
9. `doctrine/planning/orchestrator-prompts/HANDOFF-2026-04-24.md` (why we consolidated)

Doctrine may update. Code that contradicts doctrine loses.

## Current wave

**W1 — Workspace skeleton, unblock phase.**
M1 milestone (daemon ↔ WS round-trip) is the exit gate for W1.

## Live processes (as of 2026-04-29T07:06Z)

| Service | Pid | Port | Source | Status |
|---|---|---|---|---|
| EMA daemon (Gleam/BEAM) | 67280 | `ws://127.0.0.1:49555` | `apps/daemon`, started via `start-ema-dev.sh --no-tail` | **alive** |
| EMA web dev (Next) | 67245 | `http://127.0.0.1:5173` | `apps/web`, `pnpm --filter @ema/web dev` | **alive** |

`.ema-dev/pids/daemon.pid` reflects 67280. `.ema-dev/pids/web.pid` reflects 67245.

The wrapper's idempotency check is port-based (`lsof -iTCP:49555 -sTCP:LISTEN`), so re-running `start-ema-dev.sh` will correctly skip a second daemon launch.

## Wave-by-wave reality

| Wave | Area | State | Notes |
|---|---|---|---|
| W0 | Doctrine + contracts | landed | Architecture docs (12), vApp specs (3), ID registry (44 prefixes), event catalog. |
| W1 | Daemon scaffold | **compiles green, M1 not proven** | `gleam build` clean. Bus/registry/supervisor/event_envelope present. WS listener on 49555. End-to-end append+subscribe round-trip not yet demonstrated. |
| W1 | Web shell | Next vDesktop canon | `apps/web/app/` is the runnable surface; Launchpad opens first inside a place.org-style desktop. Runtime data is still mocked/projection-labeled until IPC integration catches up. |
| W2 | Blueprint + git-ema writers | not started | Empty dirs at `apps/daemon/src/ema_blueprint/`, `ema_attachments/`. UI shows a mock Blueprint tree and git-ema attachment list. |
| W3 | See Agent Work | UI only, no writers | `agent-work-page.tsx` renders mock swarms/missions/lanes; no `swarm.start` or `lane.open` handler in the daemon. |
| W4–W7 | Actors/Soul/Proposals/Runtime/Collab | not started | Design only. |

## Orchestration specializations

Three product lane specialists (canonical 3-lane split per memory
`ema-lane-orchestration-split.md`). Each scopes lanes inside its ownership
boundary and reports back to the coordinator.

- **Product Surface Donor Orchestrator** — owns web surface, vApps, shell
  chrome, donor UX translation. Files: `apps/web/src/app/`, `apps/web/src/vapps/`,
  `apps/web/src/shell/` (chrome only; runtime slice owns data wiring).
  Prompt at `doctrine/planning/orchestrator-prompts/PRODUCT-SURFACE-DONOR-ORCHESTRATOR-PROMPT.md`.
  **Slice A (See Agent Work 8-region first screen) landed in commit `40ba1ea` on lane branch `lane/surface-slice-a-see-agent-work`.**
  Carry-over slices queued: B (HQ lane deepening + sparklines + CLI preview), C (global command palette), D (chronicle frame-type polish), E (CLI/vApp vocabulary notes).
- **Runtime Vertical Slice Orchestrator** — owns the daemon ↔ surface data
  path. Files: `packages/surface-core/`, `packages/contracts/ipc/`,
  `apps/web/src/lib/ipc/`, daemon IPC/projection code under `apps/daemon/src/`.
  Prompt at `doctrine/planning/orchestrator-prompts/RUNTIME-VERTICAL-SLICE-ORCHESTRATOR-PROMPT.md`.
  Active slices: **L-ipc-client-finish** and **L-projections-topbar**.
- **Desktop Launcher Correction Orchestrator** — owns native Tauri bundle,
  CSP, first-launch daemon-detect, tray icon, launchd autostart. Files:
  `apps/desktop/`, `scripts/install-daemon-launchd.sh`, `docs/operations/desktop-install.md`.
  Prompt at `doctrine/planning/orchestrator-prompts/DESKTOP-LAUNCHER-CORRECTION-ORCHESTRATOR-PROMPT.md`.
  Active slices: **L-launcher-bundle-audit**, **L-launcher-daemon-detect**, **L-launcher-tray**.

Meta orchestrators (non-product, support the three above): Canon Writers
(inside Runtime Slice scope per canonical split — treat as a sub-role),
Provenance & Version Control, Workspace Hygiene & Swarm Meta, Code Quality
& Language Idiom, Codebase Architecture & Extensibility. All have canonical
prompts in `doctrine/planning/orchestrator-prompts/`. Three now carry
**Vision Anchors** (Shipping Shape / Donor Preservation / Extensibility
Anchors); Provenance and Code Quality stay silent where vision grounding
would add noise.

## Lanes

Lane scope is disjoint. One owner per lane. Lane prompts live under `docs/orchestration/lanes/` once scoped (none written yet — next coordinator move).

Reality check against what is actually on disk (not what old plan docs claimed):

- **M1 round-trip passes today.** `node tooling/m1-round-trip.mjs` against the live daemon on 49555 returns `m1-round-trip: OK`. The wire protocol (hello → hello_ack → subscribe → command → event stream) is working against `debug.ping` and synthetic `dispatch.started/ended` events.
- **IPC client exists** — `packages/surface-core/src/ipc-client/index.ts` is a real 217-line WS client with pending-request map and projection subscriptions, not the stub my earlier diagnosis claimed. React hooks in `apps/web/src/lib/ipc/` are thin wrappers that correctly read from an `IpcContext` provider.
- **What's missing for Slice B:** a daemon-side projection actor emitting `topbar.projection`, and swapping the topbar's `mockTopbar` import for `useProjection("topbar.projection")`.

| Lane | Status | Owner | Files | Exit criteria |
|---|---|---|---|---|
| [`L-ipc-client-finish`](lanes/L-ipc-client-finish.md) (Slice A) | **closed 2026-04-29** | Coordinator (Claude) | `packages/surface-core/src/ipc-client/`, `apps/web/src/lib/ipc/` | 7/7 minimum-behaviors verified — see session close 2026-04-29. Unblocks L-projections-topbar. |
| [`L-agent-workspace-writer`](lanes/L-agent-workspace-writer.md) (Slice A) | queued — opened 2026-04-29 | unassigned | `apps/daemon/src/ema_lanes/`, `apps/daemon/src/ema_queue/`, `packages/contracts/events/{lane,queue}.md`, `apps/cli/src/commands/{lane,queue}.ts`, `tooling/agent-workspace-round-trip.mjs` | `pnpm cli lane open` / `lane list` / `queue add` / `queue list` return real ids and projections (no `pending_daemon_writer`); events persisted to SQLite; replay across restart is identical; contract-check + gleam test + m1 round-trip stay green. Honors CLAUDE.md "log to queue not chat" rule. |
| [`L-projections-topbar`](lanes/L-projections-topbar.md) (Slice B) | queued | Runtime Slice Orch | daemon-side `apps/daemon/src/ema_projections/topbar.gleam` (new), `apps/web/src/shell/topbar.tsx`, `apps/web/src/shell/*-selector.tsx` | Topbar renders "Founding-Fathers-EMA / Founding-Fathers-EMA / EMA 0.0.5" from `useProjection("topbar.projection")`, not `mockTopbar`. Event trail contains seed or command events backing the projection. |
| [`L-writers-org-space`](lanes/L-writers-org-space.md) | queued | (none — specialist TBD; Codex worker brief lists this as recommended first slice) | `apps/daemon/src/ema_orgs/`, `ema_spaces/`, catalog entries in `packages/contracts/events/` | `org.created` + `space.created` (default-same-name) accepted as real commands, persisted, projected. |
| [`L-see-agent-work-docs`](lanes/L-see-agent-work-docs.md) | queued | unassigned | `docs/cli/see-agent-work.md`, `docs/agents/see-agent-work-agent-usage.md` | Operational runbook: every CLI command has a worked example; an external session can follow the runbook cold. |
| [`L-honest-mocks`](lanes/L-honest-mocks.md) | closed 2026-04-24 | coordinator | `apps/web/src/app/mock-projections.ts` | Self-reported "Codex: active" agentWork entries removed; `MOCK_PROJECTION_LABEL` confirmed rendered on topbar, hq-page, agent-work-page, blueprint, git-ema panels, placeholder-page. |
| [`L-see-agent-work-8-region`](lanes/L-see-agent-work-8-region.md) | **landed 2026-04-24** (commit `40ba1ea`, lane branch) | Product Surface Donor Orch | `apps/web/src/app/see-agent-work/` (8 region components), `apps/web/src/app/agent-work-page.tsx`, `apps/web/src/app/mock-projections.ts`, `apps/web/src/app/hq-page.tsx`, `apps/web/src/app/styles.css` | 8 regions rendered; `CHRONICLE_MAX = 200` exported; 21+ `RIP:` provenance markers; language-lock clean; `pnpm --filter @ema/web build` green. |
| `L-launcher-bundle-audit` | queued | Desktop Launcher Correction Orch | `apps/desktop/src-tauri/tauri.conf.json`, `/Users/tawj/Desktop/EMA 0.0.5.app` | `file Contents/MacOS/ema-desktop` returns Mach-O arm64; bundle launches and loads web; CSP allows `ws://127.0.0.1:49555`; no regressions vs commit `42fb50f`. |
| `L-launcher-daemon-detect` | queued | Desktop Launcher Correction Orch | `apps/desktop/` + shell plugin wiring | First-launch shows labeled "EMA daemon not running" panel if port 49555 isn't listening; Start button (mocked initially) dismisses on hello_ack. |
| `L-launcher-tray` | queued | Desktop Launcher Correction Orch | `apps/desktop/src-tauri/src/`, tray assets | macOS tray icon reflects daemon state (active/paused/down) within 5 s of change; uses ema-design-system palette. |

## Blockers

- None blocking W1 exit. M1 round-trip is a lane to pick up, not a blocker.
- Open watch: 3 other live `claude` CLI sessions (pids 23004, 26117, 45575) are finishing in place and were not part of this consolidation. Their future edits should start reading this file.

## Rules of engagement (anti-Codex-drift)

1. **No worker ships mock data as if it were real.** Any `mock-projections.*` entry must carry a `TODO(event-family: …)` comment.
2. **No worker edits another worker's lane files.** Lane scope is in the lane prompt and enforced at review.
3. **No refactor without green build at start and green build at end.** The Gleam import bugs that broke the daemon earlier today were a half-finished refactor.
4. **Writer actors only write via the daemon.** Surface code caught writing canon gets reverted.
5. **Every new event kind requires same-change updates to `packages/contracts/events/catalog.v0.md` and the family file.** Every new ID prefix requires updating `packages/contracts/types/ids.md`.
6. **Worker status lives here, not in product UI.** The See Agent Work panel reads projections; self-status never ships to surface.
7. **Coordinator diffs actual files vs claimed summary before a lane closes.**

## Operational docs

- [`docs/operations/donor-translation.md`](../operations/donor-translation.md) — donor verdict rules (`copy` / `adapt` / `inspire` / `reject`), `SOURCE:` header format, forbidden `copy` targets, translator checklist. Required reading for any Canon Writers / Runtime Slice / Product Surface Donor lane that pulls from `sources/snapshots/` or `atlas/ema-atlas/`.

## Decisions logged

- 2026-04-24: consolidate orchestrator role to a single coordinator; Codex demoted to worker (still active). Claude CLI session replaces the co-orchestrator setup. See `doctrine/planning/orchestrator-prompts/HANDOFF-2026-04-24.md`.
- 2026-04-24: the 3 in-flight Claude CLI sessions finish in place; new rules apply only to sessions started after the handoff.

## Next coordinator actions

1. Scope `L-m1-roundtrip` lane prompt under `docs/orchestration/lanes/L-m1-roundtrip.md` (when a worker is assigned).
2. Audit the other two web shells (topbar, agent-work-page) for any other UI-as-truth patterns.
3. Confirm `tooling/m1-round-trip.mjs` shape matches the current daemon WS protocol.

## Session update 2026-05-10 - Functional 0.0.6 Proslync cockpit rails

- `ema cockpit workpack --project proslync-app-ios-final --json` now emits a shared agent-work packet: Proslync client context, 4 active builds, 6 surfaces, readiness health, dirty/no-git hazards, kickoff commands, verification commands, and handoff contract.
- Client Cockpit is discoverable from Launchpad/sidebar and the Proslync bench exposes Builds, Surfaces, Queue, Lanes, Intentions, and runtime health through web and CLI projections.
- Intention backfeed moved from read-only harvest into review workflow: accept/defer/reject/list via CLI and cockpit POST bridge.
- Native shell repair landed for 0.0.6: Tauri top chrome has drag regions, interactive controls are no-drag, and vApp popout titlebars use the Tauri v2 window API instead of private internals.
- Functional E2E now verifies runtime report, CLI typecheck/build, web typecheck, Proslync projection, workpack, intentions, cockpit UI, launchpad entry, Tauri drag, and popout titlebar.
- Fresh `/Users/trajanm4air/Desktop/EMA 0.0.6.app` installed after gated dry-run; previous app backed up at `/Users/trajanm4air/Desktop/EMA 0.0.6.app.backup-2026-05-10T02-01-55-784Z`.

## Session update 2026-05-10 - Proslync-first head-orchestrator reset

- Timeout inflation is not accepted as a fix for cockpit readiness.
- Cockpit must gain compact projections and deterministic readiness markers.
- Proslync swarms remain blocked until workpack, agent workspace, intention backfeed, and vApp route/frame parity pass.
- Dirty-state intake is recorded at `docs/orchestration/head-orchestrator/current-dirty-state-2026-05-10.md`.
- Current controlling plan is `docs/superpowers/plans/2026-05-10-ema-proslync-first-head-orchestrator-master-plan.md`.

## Session update 2026-05-10 - Sprint 2 cockpit fast path

- Added cockpit performance smoke: `pnpm cockpit:perf`.
- `ema cockpit projection` and `ema cockpit workpack` no longer load the full intention projection on their fast path; explicit `ema cockpit intentions` remains the full reviewed intention queue path.
- CLI cockpit projection now reads lane/queue/topbar through one batched daemon subscription instead of separate WebSocket subscriptions.
- Current measured gate: workpack cold `1343ms`, warm `1134ms`; projection cold `1447ms`, warm `858ms`.
- Web cockpit projection now uses cheap intention artifact availability instead of shelling out to `ema cockpit intentions` on every page load.

## Session update 2026-05-10 - Sprint 2 close: budget gate + honest health

- Tightened cockpit perf smoke budgets to the master plan target (cold ≤ 2500 ms, warm ≤ 750 ms for both workpack and projection). Current measured: workpack cold `272ms` / warm `227ms`; projection cold `223ms` / warm `226ms`.
- Removed the hardcoded `web: "up"` and `stale_records: []` from cockpit health. Both `ema cockpit ...` (CLI) and `/api/cockpit/projection` (web) now read `.ema-dev/pids/{daemon,web}.pid` and check liveness with `process.kill(pid, 0)`.
- `health.web` now reflects pidfile-backed liveness in the CLI; the web route reports `web: "up"` only because it is itself the responding process. Stale pidfiles surface in `health.stale_records`.
- `proslync_ready` now requires `runtime.webUp` in addition to the existing daemon/intentions/git/desktop/surface gates. With web currently down, `proslync_ready` is correctly `false` (was previously `true` while web was unreachable).
- Sprint 2 step 3 ("optimistic readiness") closed; performance budget step closed; remaining Sprint 2 deltas are now implementation-style tweaks rather than budget/truth gates.

Verified:

- `pnpm --filter @ema/cli typecheck`: clean.
- `pnpm build:cli`: clean.
- `pnpm --dir apps/web exec tsc --noEmit`: clean.
- `pnpm cockpit:perf`: passes both workpack and projection at the new tighter budget.
- `node apps/cli/dist/bin.js cockpit workpack --project proslync-app-ios-final --json`: returns `health.web=down`, two `stale_records`, `proslync_ready=false`.

## Session update 2026-05-10 - CLI subcommand --help across stub-contract groups

- Closed the harness queue item (`queue_item:01KR1XB6CT0076XEX8XZBMJD81`): `ema harness <sub> --help` now shows that subcommand's flags and required fields instead of repeating the top-level command list.
- Same fix landed for lane, queue, intent, canon, proposal, actor: `ema lane open --help`, `ema queue add --help`, etc., used to run the action and fail with a missing-required-flag error; they now print verb-specific help (text and JSON modes).
- Mechanism: `apps/cli/src/commands/stub-contract.ts` gains `maybeRunVerbHelp(args, opts)`. Each command group hoists its `StubOptions` verb table to module scope and calls the helper before dispatch. Harness's hand-rolled help renderer was replaced with a `runStubContract` delegate, and its commands gained the same flag/required metadata.
- Codex `--ask-for-approval` adapter drift was already fixed in code; only `tooling/cli-readiness-smoke.mjs` still references the flag as a regression guard.

## Session update 2026-05-10 - EMA contents network repair

Repaired the doctrine and plan-hierarchy network so the live spine resolves cleanly for the next agent.

- **Master design doc**: created a redirect stub at `Projects/EMA/MASTER-EMA-DESIGN-DOC.md` explaining the 2026-05-07 retirement and pointing to the live spine. Updated `Projects/EMA/PROJECT-MAP.md` and `Projects/EMA/README.md` so the broken-link claim ("the master EMA doctrine, ontology, workflow…") is replaced with redirect-stub language. The two `atlas-live.ts` files now resolve `MASTER-EMA-DESIGN-DOC.md` to the redirect stub instead of a missing file. The 1533-line archived snapshot at `Projects/EMA/atlas/archive/master-doc/MASTER-EMA-DESIGN-DOC-2026-04-29.md` remains untouched as historical product-vision reading.
- **Plan-hierarchy clarity**: created `docs/plans/README.md` and `docs/superpowers/plans/README.md` listing controlling vs superseded plans. Added `> SUPERSEDED BY:` banners at the top of `docs/plans/MASTER-ORCHESTRATION-2026-05-07.md` and `docs/superpowers/plans/2026-05-10-ema-proslync-first-active-development-sprints.md`. `docs/WORKSPACE-ENTRYPOINT.md` "Before coding" list now points at the controlling master plan and the plan-hierarchy README.
- **Bootstrap halt resolved**: appended a 2026-05-10 continuation note to `docs/bootstrap/ORCHESTRATOR-LOG.md` explaining that Sprint 2.5 closed the pipeline-floor gap (intent/proposal/canon/actor are live) so the bootstrap halt is retired; continuation work belongs under the head-orchestrator master plan, not as a separate bootstrap rerun.
- **Stale CLI inventory**: `docs/bootstrap/CLI-VERB-INVENTORY.md` now carries a STATUS banner marking it historical; runtime is `ema help` and `ema <command> --help`.
- **0.0.5-era recovery handoff**: `docs/plans/RUNTIME-RECOVERY-HANDOFF.md` carries a `Status: historical (0.0.5 lineage)` banner.
- **Atlas spine**: `Projects/EMA/atlas/PROJECT-ATLAS.md` now lists the live doctrine spine (canon current, redirect stub, build README, workspace entry, master plan, STATUS, durable transcripts). `Projects/EMA/atlas/canon/current/ema-0-0-6-current-canon.md` adds Controlling Plan and Master Design Doc Note sections.

Verified by inspection of all modified files; no source code changes in this pass, only docs and project records. EMA repo working tree is clean except for the modified docs and the two new plan READMEs.

## Proslync pilot — current state (2026-05-10)

EMA's first cross-program pilot is Proslync. This section is the live ledger
pointer; the canonical agent entrypoint and sprint sequencing live in the
Proslync repo, not here.

**Product posture (Mrs. Wilson directive 2026-04-06):**

- Brand-first → AD/school → athlete sequence. Brand HQ + NIL deal evidence
  ships before athlete-side work.
- Wedge: revenue share with the athletic department (not SaaS, per-deal, or
  retainer). Named competitors: Opendorse, INFLCR, Athliance, MOGL.
- Disclosure exemplar: NIL Go (College Sports Commission).
- Authoritative requirements:
  `Active builds/proslync-presentation-assets-final/docs/research/prep-capture-2026-05-09/mrs-wilson-asks-extracted.md`
  (W1–W39 + P1–P9 + S1–S7).

**Active EMA lanes for Proslync** (verified via
`ema lane list --project proslync-app-ios-final --json` 2026-05-10):

| Lane | Title | Status |
|---|---|---|
| `lane:01KR7K0ZGA009YGND4AHPRJ9BN` | Sprint 2 — Brand back-office MVP | active |
| `lane:01KR7K1ARD00B24MDAZFQVCEFN` | Sprint 3 — AD revenue-share + compliance | idea |
| `lane:01KR7K1B4Q00CNGW965NX52J5A` | Demolition tail cleanup | idea |
| `lane:01KR7KN7XV0185XD90VVV2YPBJ` | Proslync EMA modeling refinement | active |
| `lane:01KR8G817Q00HWB0G3D206H2N8` | Cross-repo salvage 2026-05-10 | idea |
| `lane:01KR7HPFFV000QCZ4XCQY718VB` | Real backend + iOS vertical slice | active |
| `lane:01KR5H1JJK00KN3TR7QDWDKE8C` | iOS sim QA — extensive route sweep | active |

**Proslync surfaces (per `ema cockpit projection`):** master-plan, brand-hq,
nil-deal-detail, nil-manager, ad-cockpit, backend-api, hero-website (queued).
Cockpit projection reports 4 active builds, 6 surfaces, 18 lanes (6 active),
56 queue items (30 ready).

**Source of truth — Proslync agent entry:**
`Active builds/proslync-app-ios-final/ORCHESTRATOR.md` (read first), then
`Active builds/proslync-app-ios-final/PLAN.md` (canonical sprint sequencing).
Prompt-form briefing for an agent acting AS the orchestrator:
`Active builds/proslync-app-ios-final/docs/orchestration/prompts/master-orchestrator.md`.

**Swarm gate:** Proslync swarm dispatch (parallel multi-agent through Duct
Tape/Harness) is blocked behind EMA Sprints 1–4 in
`docs/superpowers/plans/2026-05-10-ema-proslync-first-head-orchestrator-master-plan.md`.
Single-agent claimed-lane work via the existing `ema lane claim → … → ema agent
report` loop is allowed now.

**Cross-repo salvage 2026-05-10 (`lane:01KR8G817Q00HWB0G3D206H2N8`):** doc-side
items closed by this STATUS section, the Desktop AGENTS.md update, the
presentation-assets README pointer, and the prompt-form
`master-orchestrator.md`. Remaining lane scope is non-doc dirty-tree
reconciliation across nine Proslync-ecosystem repos.
