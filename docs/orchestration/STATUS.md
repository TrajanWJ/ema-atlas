# EMA 0.0.5 Orchestration Status

Canonical live ledger for the 0.0.5 buildout. One coordinator, many workers.
Every session — Codex, Claude CLI, or human — reads this file on cold start.

Coordinator: Claude (replacement orchestrator, consolidated role).
Last coordinator sweep: 2026-04-24T15:45-04:00.

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

## Live processes (as of 2026-04-24T14:35)

| Service | Pid | Port | Source | Status |
|---|---|---|---|---|
| EMA daemon (Gleam/BEAM) | 47943 | `ws://127.0.0.1:49555` | `apps/daemon`, started via `gleam run` at 14:32 | **alive** |
| EMA web dev (Next) | 40269 | `http://127.0.0.1:5173` | `apps/web`, `pnpm --filter @ema/web dev` | **superseded by canon Next stack; pid may be stale** |
| `start-ema-dev.sh` wrapper | 41730 | — | idle; the wrapper's original daemon (pid 41762) died from earlier compile errors before the files were fixed | **idle** |

`.ema-dev/pids/daemon.pid` now reflects 47943 (live). `.ema-dev/pids/web.pid` now reflects 40269 (live).

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
| [`L-ipc-client-finish`](lanes/L-ipc-client-finish.md) (Slice A) | in-progress (wire alive, hooks need audit) | Runtime Slice Orch | `packages/surface-core/src/ipc-client/`, `apps/web/src/lib/ipc/`, `tooling/m1-round-trip.mjs` | All 7 minimum-behaviors in Runtime-Slice-Orchestrator prompt met: reconnect w/ backoff, clear offline state to hooks, UI never writes raw frames. `m1-round-trip.mjs` still green. |
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
