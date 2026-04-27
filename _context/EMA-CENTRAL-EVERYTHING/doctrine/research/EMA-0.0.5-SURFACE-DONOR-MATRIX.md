# EMA 0.0.5 — Product Surface Donor Matrix

Status: active doctrine (surface lane)
Owner: EMA 0.0.5 Product Surface Donor Orchestrator
Date: 2026-04-24

This is the compact, surface-only cross-pollination matrix. Rows are scoped to
what this lane may touch: `apps/web/src/{app,vapps,shell}`, the web
`styles.css`, `docs/{vapps,cli,agents}`, and donor/synthesis docs. Daemon,
IPC-client, and desktop launcher donor work is out of scope here and belongs
to the Runtime Vertical Slice Orchestrator and Desktop Launcher Correction
Orchestrator.

Doctrine floor:

- Topology is `Organization -> Space -> Project`.
- Daemon owns canonical truth; Hermes/runtime owns execution; surfaces render
  projections and send commands.
- Donor code is translated, not copied blindly.
- UI, Discord, `localStorage`, OPFS, a browser desktop store, or a Tauri
  sidecar must never become product truth.
- Every mock control carries a visible `mocked | draft | local only |
  pending daemon writer` tag.
- Stale `Organization -> Project -> Space` language must be translated or
  quarantined as lineage.

Donor doctrine sources: `sources/snapshots/ema 0.0.3/ema-atlas/graph/nodes/*.qmd`
(pre-extracted "carries forward / leaves behind" per donor branch).

---

## Matrix

### 1 — place.org (design system, virtual desktop metaphor, desktop UX)

**Reclassified 2026-04-24:** after operator feedback ("place.org design
scheme and desktop is the source of truth! not even same colors still!"),
place.org is promoted from `doctrine-only / inspire` to **direct-rip source
of truth** for the design system (palette, glass, fonts, animations,
scrollbars, view transitions, range slider, markdown) and
**copy/adapt** for the virtual desktop metaphor (five-layer shell). Rips
in `apps/web/src/app/styles.css` now carry `/* RIP: place.org <path> */`
provenance markers and the warm-cream palette is retired.

```text
Donor: codebase-place-org
Useful pattern: Full design token system — surfaces, text-at-opacity,
  teal/slate-blue/amber color scales, semantic colors, borders,
  Apple system font stack, cubic-bezier ease, glass tier tints
  (code/place.org/app/globals.css :root, code/place.org/docs/design/tokens.md)
EMA target: apps/web/src/app/styles.css :root (--place-* tokens verbatim);
  --ema-* aliases re-pointed at --place-* values so existing classnames
  auto-retheme. Previous warm-cream palette retired.
Action: copy
Why: Operator designated place.org as canonical visual source of truth.
  Direct verbatim rip preserves hex values, opacity levels, easing
  curves, and font stacks exactly. Paraphrasing loses polish.
Truth risk: none at this layer — tokens are surface, not canon.
Files likely touched: apps/web/src/app/styles.css
```

```text
Donor: codebase-place-org
Useful pattern: Liquid-glass tiers (glass-ambient, glass-surface,
  glass-elevated, glass-accent) — blur + saturate + border layered
  per tier; Apple-style saturate(180%) on elevated+accent
  (code/place.org/app/globals.css .glass-*)
EMA target: apps/web/src/app/styles.css; .ema-topbar, .ema-dock,
  .ema-window, .ema-modal__panel all use glass-elevated inline.
Action: copy
Why: Blur radii, saturate percentages, and border opacities are the
  donor's "feel". Rip preserves them exactly. EMA windows, dock, and
  topbar all inherit via the glass tier classes.
Truth risk: none.
Files likely touched: apps/web/src/app/styles.css
```

```text
Donor: codebase-place-org
Useful pattern: Custom scrollbars (webkit + firefox), range sliders,
  skeleton shimmer, gradient-shift, mic-pulse, view transitions,
  Window Controls Overlay support, markdown preview styles
  (code/place.org/app/globals.css — all @keyframes and selectors)
EMA target: apps/web/src/app/styles.css — direct rip of every
  @keyframes block, every scrollbar rule, every range slider selector,
  vt-fade-in/vt-fade-out, .ambient-bar-wco.
Action: copy
Why: Operator requirement: "every little refined beautiful animation and
  detail of polish, preserve all of it." Donor hex values and timings
  are source of truth.
Truth risk: none.
Files likely touched: apps/web/src/app/styles.css
```

```text
Donor: codebase-place-org
Useful pattern: Virtual desktop metaphor — wallpaper + windowed vApps +
  Launchpad-style dock + topbar + presence layer (five layers bottom to
  top). Place.org DNA: the desktop is somewhere, not nowhere.
EMA target: apps/web/src/shell/{virtual-desktop-shell,wallpaper,dock,
  window-frame,presence-layer,window-store,layout-artifact}.{ts,tsx}
  (now wired as root via main.tsx catch-all route).
Action: copy/adapt
Why: Doctrine (virtual-desktop-deep.md) locked this as the product shell.
  Adaptations from donor: drop framer-motion / Zustand / Tauri-specific
  bits; keep the five-layer composition, Launchpad dock semantics,
  wallpaper scene catalog, window frame chrome (header drag, resize
  handle, glass tier), presence cursor geometry.
Truth risk: layout-artifact.ts uses localStorage — acceptable ONLY for
  workspace-plane layout, not canon. Marked in file header.
Files likely touched: apps/web/src/shell/*, apps/web/src/app/styles.css
  virtual-desktop section.
```

```text
Donor: codebase-place-org (git branch origin/codebase-place-org)
Useful pattern: Boot-before-surface gating (DesktopPage refuses to render
  until boot-desktop event fires; BootSequence owns the gate)
EMA target: apps/web/src/shell — delay vApp mount until the IPC client has
  resolved the topbar projection snapshot (or timed out into visible mock)
Action: adapt
Why: Surfaces must not render stale canon. The existing `useProjection("topbar")`
  call already supports this; the shell can hang a "connecting / mocked"
  state on its presence instead of jumping straight into mock data.
Truth risk: low — this is projection-hygiene, not a new write path.
Files likely touched: apps/web/src/shell/shell-layout.tsx,
  apps/web/src/shell/topbar.tsx (already has `offline` badge; extend)
```

```text
Donor: codebase-place-org
Useful pattern: Capability detection as a first-class init step
  (useCapabilitiesDetect, requestPersistentStorage)
EMA target: docs/agents/see-agent-work-agent-usage.md — document that
  agents should probe the daemon with `hello` + read-only projection
  subscribe before claiming a lane; no persistent-storage request in
  wave 1 (OPFS/localStorage-as-canon is rejected).
Action: adapt (docs only)
Why: The surface should expose capability gates explicitly. In 0.0.5 the
  only capability surface needs to probe is daemon presence over WS —
  storage capability detection is deferred because surfaces don't own
  durable state.
Truth risk: none — doc addition.
Files likely touched: docs/agents/see-agent-work-agent-usage.md
```

```text
Donor: codebase-place-org
Useful pattern: Command palette / launchpad over a multi-surface desktop
  (30+ hooks driving window manager, glass intensity, font weight,
  screensaver in one Desktop() body)
EMA target: apps/web/src/shell — a command-palette affordance that opens
  from anywhere and dispatches CLI-equivalent commands (currently
  documentation-only per docs/cli/see-agent-work.md)
Action: inspire
Why: The palette UX is the right operator affordance for EMA's CLI-parity
  rule. Copying place.org's window-manager complexity would violate the
  vanilla-workspace discipline — wave 1 is one main surface per vApp,
  no window manager.
Truth risk: medium if mishandled — palette must dispatch IPC commands only,
  never mutate local state as canon. Route every action through either
  `useCommand` (real) or a labeled mock tag.
Files likely touched: apps/web/src/shell/command-palette.tsx (new, out of
  Slice A; flagged for Slice B or later), apps/web/src/app/styles.css
```

```text
Donor: codebase-place-org
Useful pattern: Trust-runtime-shipped-docs agent convention (AGENTS.md
  rule: read `node_modules/next/dist/docs/` before writing code)
EMA target: docs/agents/see-agent-work-agent-usage.md already pins
  `packages/contracts/` reading; reinforce with an explicit pointer in
  the agent prompt template
Action: adapt
Why: Generated agent prompts from See Agent Work should name the contracts
  dir so external Codex/Claude sessions hit current contracts, not trained
  recall.
Truth risk: none — prompt template change.
Files likely touched: docs/cli/see-agent-work.md (agent prompt template),
  docs/agents/see-agent-work-agent-usage.md
```

```text
Donor: codebase-place-org
Useful pattern: Browser service worker, share-target registration, OPFS
  + localStorage carrying workspace state
EMA target: —
Action: reject
Why: Explicitly forbidden: surfaces do not own durable state. Canon lives
  in the daemon's SQLite; projections are disposable.
Truth risk: product-shattering if adopted.
Files likely touched: none.
```

```text
Donor: codebase-place-org
Useful pattern: One `Desktop()` component with 30+ hooks (glass intensity,
  font weight, window manager, screensaver, sticky notes, weather
  background)
EMA target: Surface functionality that is NOT in the five-layer shell
  (screensaver, weather particles, sticky notes, multi-wallpaper editors,
  sound, cursor-light hook, etc.).
Action: reject (for wave 1)
Why: Vanilla-workspace discipline caps wave 1 surface complexity at the
  five shell layers (wallpaper / windows / dock / topbar / presence).
  The longer tail (screensaver, weather, stickies) is deferred. The
  five-layer shell IS adopted — see the "copy/adapt" row above.
Truth risk: scope creep if re-admitted without doctrine update.
Files likely touched: none (wave 1).
```

---

### 2 — place-companion (native desktop affordance, tray bridge)

```text
Donor: codebase-place-companion (git branch origin/codebase-place-companion)
Useful pattern: Optional native bridge with graceful fallback
  (companionBridge.connect() is wired unconditionally; the nudge only fires
  after real activity; browser-only path still works)
EMA target: apps/desktop/** — Tauri wrapper detects daemon presence on
  launch; if absent, shows a "Start EMA daemon?" affordance
Action: inspire (for the Desktop Launcher Correction Orchestrator; OUT OF
  SCOPE for this surface lane)
Why: Fits M7 exactly. Flagged here so the product surface lane does not
  duplicate the wiring — it belongs in apps/desktop, not apps/web.
Truth risk: the desktop shell must not become truth. Tauri renders the
  same web surface; it does not own an independent store.
Files likely touched: (none in this lane)
```

```text
Donor: codebase-place-companion
Useful pattern: Tray-resident background, ActivationPolicy::Accessory,
  "windows": []
EMA target: apps/desktop/** — desktop app is foreground; the daemon is
  the background process (a different binary). The surface lane never
  owns a tray; the daemon owns its own launchd/systemd lifecycle.
Action: reject (for this lane)
Why: Explicitly excluded in the orchestrator prompt — "do not make a
  Tauri sidecar into product truth." The surface does not run a tray
  agent.
Truth risk: collapsing daemon lifecycle into the desktop surface.
Files likely touched: none.
```

---

### 3 — agent-os-bridge (route inventory, missions/handoffs/proposals)

```text
Donor: codebase-agent-os-bridge (git branch origin/codebase-agent-os-bridge)
Useful pattern: Route inventory `routes/{agents,dispatch,handoffs,missions,
  proposals,tasks,inbox,feed,wiki}` — the vocabulary an Agent OS gateway
  tends to need
EMA target: docs/cli/see-agent-work.md (already lists swarm/campaign/mission/
  lane/handoff/vcalendar/checkup/actor/agent/source/proposal) — sanity-check
  against the donor route list; adopt any missing verb (e.g., `tasks`,
  `inbox`, `feed`) into the CLI doc as vocabulary only, not as new vApps
Action: adapt
Why: Vocabulary completeness check. EMA already has lane/handoff/mission/
  proposal. "Tasks" in EMA language are lane items + queue_items; "inbox"
  maps to a future lane-review panel inside See Agent Work. Name them
  consistently.
Truth risk: low — docs only. Do not seed new writer actors or new vApps
  from this pass.
Files likely touched: docs/cli/see-agent-work.md (append vocabulary notes
  section), docs/vapps/see-agent-work.md (cross-reference)
```

```text
Donor: codebase-agent-os-bridge
Useful pattern: Mission/handoff/proposal state transitions (idea→ready→
  active→review→blocked→done) encoded as route transitions
EMA target: apps/web/src/app/agent-work-page.tsx — lane board region
  rendering (idea/ready/active/review/blocked/done columns per docs/vapps/
  see-agent-work.md §"First Screen")
Action: adapt
Why: Visible lane-board states are already locked; donor confirms the state
  set and suggests the column order. Adopt the visual lane-status discipline.
Truth risk: low if lanes read from projection; do not let lane state
  become UI-local (click doesn't move lane → lane.move command must
  eventually go through daemon).
Files likely touched: apps/web/src/app/agent-work-page.tsx,
  apps/web/src/app/styles.css
```

```text
Donor: codebase-agent-os-bridge
Useful pattern: Ad-hoc filesystem + separate SQLite at the bridge layer
  owning mission/handoff records
EMA target: —
Action: reject
Why: All canon is owned by the EMA daemon's SQLite. Surfaces never carry
  a parallel store.
Truth risk: catastrophic if adopted.
Files likely touched: none.
```

---

### 4 — agent-os-v8 (framed WS client UX, modular UI)

```text
Donor: codebase-agent-os-v8 (git branch origin/codebase-agent-os-v8)
Useful pattern: Framed WS client UX — typed envelopes, clear command/event
  separation in UI presentation
EMA target: apps/web/src/app/agent-work-page.tsx — the command panel region
  must visually separate "action I'll dispatch" from "event I've received"
  (mirrors hello/ping/pong/command/command_result/event frame types in
  packages/contracts/ipc/shell-protocol.md)
Action: inspire
Why: The IPC-client implementation is the Runtime lane's job; the surface
  only consumes it. But the visual discipline (command vs event, request
  vs projection snapshot) should show up in the UI language — e.g., a
  "chronicle strip" labeled `event trail`, a "command panel" labeled
  `pending / in flight / mocked`.
Truth risk: none at the surface layer.
Files likely touched: apps/web/src/app/agent-work-page.tsx
```

```text
Donor: codebase-agent-os-v8
Useful pattern: Gateway / storage modular split (src/{gateway,storage,views})
EMA target: packages/surface-core — already separates ipc-client (gateway)
  from projection cache (storage); validated by comparison. No action
  required in the surface lane.
Action: inspire (no-op)
Why: Confirmation, not adoption.
Truth risk: none.
Files likely touched: none.
```

---

### 5 — frontend-layer (HQ/operator dashboard, status probes, command palette)

```text
Donor: codebase-frontend-layer (git branch origin/codebase-frontend-layer)
Useful pattern: Read-only observer discipline — every documented route is
  `GET`; the frontend never mutates daemon state
EMA target: apps/web/src/** — codify in comments at the top of hq-page.tsx
  and agent-work-page.tsx; reinforce in docs/vapps/see-agent-work.md
Action: copy (as code comment + doctrine line)
Why: Already core 0.0.5 doctrine. The donor is the existence proof — a
  full Next.js HQ that never writes canon. Leaving a visible marker in
  the code prevents drift in future PRs.
Truth risk: the risk is loosening over time. The comment is the fence.
Files likely touched: apps/web/src/app/hq-page.tsx (top comment),
  apps/web/src/app/agent-work-page.tsx (top comment)
```

```text
Donor: codebase-frontend-layer
Useful pattern: Per-probe timeouts with typed fallback
  (`{ timeout: <ms> }` + catch that assigns a typed null — full-status/route.ts)
EMA target: apps/web/src/lib/ipc/use-command.ts and use-projection.ts —
  already return `null` when projection is absent; reinforce by ensuring
  every consuming page shows a visible "mocked" state rather than a
  blank panel when the probe fails
Action: adapt
Why: The pattern matches; the implementation may not show timeouts yet.
  In the surface lane, the change is purely rendering: every panel must
  have a fallback copy that names the missing projection and tags it
  `mocked | pending daemon writer`.
Truth risk: none — fallback copy is mock-labeled.
Files likely touched: apps/web/src/app/agent-work-page.tsx,
  apps/web/src/app/hq-page.tsx, apps/web/src/app/placeholder-page.tsx
```

```text
Donor: codebase-frontend-layer
Useful pattern: HQ-style operator dashboard (system status, agents,
  dispatch, executive, messages panels)
EMA target: apps/web/src/app/hq-page.tsx — already renders pulse grid +
  surface switchboard + mocked operator console + link lattice + lane
  status + event trail; confirm the information density against donor
  and tighten the "lane status" panel to read from
  `seeAgentWorkProjection.lanes` rather than the stub `agentWork` array
Action: adapt
Why: Current HQ under-reads the rich mock projection. The donor confirms
  the panel shape.
Truth risk: low — all data is mock-labeled.
Files likely touched: apps/web/src/app/hq-page.tsx,
  apps/web/src/app/mock-projections.ts (may need a derived lane summary)
```

```text
Donor: codebase-frontend-layer
Useful pattern: Command palette / agent activity panels, bounded event
  buffers (messages.slice(-500), agentEvents.slice(-200))
EMA target: apps/web/src/app/agent-work-page.tsx — chronicle strip region
  caps `recent_events` at a named constant; future palette reuses the cap
Action: adapt
Why: Prevents unbounded memory growth. Trivial to apply.
Truth risk: none.
Files likely touched: apps/web/src/app/agent-work-page.tsx (named const
  CHRONICLE_MAX = 200), apps/web/src/app/mock-projections.ts
```

```text
Donor: codebase-frontend-layer
Useful pattern: shadcn / Tailwind v4 / Zustand / Next 16 / Obsidian vault
  substrate
EMA target: —
Action: reject
Why: apps/web is Vite + plain CSS + minimal React Router. The design system
  lives in `packages/design-system/`. No substrate migration in this lane.
Truth risk: scope-creep risk.
Files likely touched: none.
```

```text
Donor: codebase-frontend-layer
Useful pattern: Shell-out probes (top, free, df, pgrep, openclaw list)
  and hardcoded user paths (/home/trajan/.claude-pace.json)
EMA target: —
Action: reject
Why: The surface does not shell out. All data comes from IPC projections
  or explicit mock data.
Truth risk: surface acquires authority it should not have.
Files likely touched: none.
```

---

### 6 — mission-control-claude (operator dashboard density, agent status, audit)

```text
Donor: codebase-mission-control-claude (git branch
  origin/codebase-mission-control-claude)
Useful pattern: CLI heartbeat contract — `register / heartbeat /
  assignments / progress` via one POST `/api/adapters` dispatching on
  {framework, action, payload}
EMA target: docs/cli/see-agent-work.md §"Agent Work Commands" —
  `ema agent list / show / assign / prompt / report` already covers this
  language; reinforce the protocol-over-routes discipline as a note in
  the CLI doc
Action: adapt (docs only)
Why: The surface lane cannot implement the adapter protocol — that's a
  daemon writer concern. But the CLI vocabulary should name the rule
  so the eventual writer inherits it.
Truth risk: none at the surface level.
Files likely touched: docs/cli/see-agent-work.md (add protocol note),
  docs/agents/see-agent-work-agent-usage.md (cross-reference)
```

```text
Donor: codebase-mission-control-claude
Useful pattern: Agent presence / audit panel density (SKILL.md dashboard
  describes ~32 panels for operator work)
EMA target: apps/web/src/app/agent-work-page.tsx — the first screen's
  eight regions (top swarm pulse, mission rail, lane board, vCalendar
  strip, agent roster, command panel, agent instruction panel,
  chronicle strip) should feel as dense as mission-control-claude's
  operator console
Action: inspire
Why: The UI-density bar is the inspiration; the visual language and
  specific panels come from docs/vapps/see-agent-work.md §"First Screen".
Truth risk: high UI density with low data density creates false
  confidence — every panel must surface honest mock labels.
Files likely touched: apps/web/src/app/agent-work-page.tsx,
  apps/web/src/app/styles.css
```

```text
Donor: codebase-mission-control-claude
Useful pattern: Hierarchical roles (`viewer < operator < admin`) + dual
  auth (session + API key) with role per call
EMA target: apps/web/src/app/agent-work-page.tsx — agent roster cards
  may display role/kind (human vs agent; founder/operator/reviewer)
  purely as projection fields; no UI enforcement until ema_memberships
  writers land
Action: inspire (display only, wave 1)
Why: Surface should display role vocabulary without implementing enforcement.
  The projection already has `actors[].role`; render it with a clear
  "display only — not yet enforced" label.
Truth risk: surface appearing to enforce roles is a safety anti-pattern
  until the daemon actually gates. Label honestly.
Files likely touched: apps/web/src/app/agent-work-page.tsx (agent roster
  region)
```

```text
Donor: codebase-mission-control-claude
Useful pattern: Task / audit panels with per-identity rate limit
  indicators (30/min per agent)
EMA target: apps/web/src/app/agent-work-page.tsx — agent roster card
  stub for "recent heartbeat" / "lane minutes today", documented as
  `pending daemon writer` until ema_swarm_coordination emits events
Action: inspire
Why: Good placeholder shape for post-M1 telemetry; don't invent the data
  in the surface.
Truth risk: inventing agent activity data in the UI is a slop trap.
  Surface must either render real projection data or show "pending
  daemon writer" — never fake activity numbers.
Files likely touched: apps/web/src/app/agent-work-page.tsx
```

```text
Donor: codebase-mission-control-claude
Useful pattern: Provisioner hardening overlay (docker-compose.hardened.yml,
  internal: true, HSTS, cookie flags)
EMA target: apps/desktop/** — Tauri CSP allowlist confined to
  ws://127.0.0.1:49555 (OUT OF SCOPE for this surface lane)
Action: inspire (for Desktop Launcher Correction Orchestrator)
Why: Noted here to prevent surface-lane duplication.
Truth risk: none at this lane.
Files likely touched: none.
```

```text
Donor: codebase-mission-control-claude
Useful pattern: Next.js 16 + SQLite-WAL + Docker substrate
EMA target: —
Action: reject
Why: apps/web stays on Vite + plain CSS. Daemon owns SQLite, not web.
Truth risk: substrate drift.
Files likely touched: none.
```

---

### 7 — lineage-original-elixir-ema (command vocabulary, replay, takeover)

```text
Donor: lineage-original-elixir-ema (git branch
  origin/lineage-original-elixir-ema)
Useful pattern: Event log as bounded PubSub projection, @max_events 200
EMA target: apps/web/src/app/agent-work-page.tsx chronicle strip region
  already-planned cap (CHRONICLE_MAX = 200)
Action: adapt
Why: The exact upper bound is a reasonable default for the operator view.
  Name the constant.
Truth risk: none.
Files likely touched: apps/web/src/app/agent-work-page.tsx
```

```text
Donor: lineage-original-elixir-ema
Useful pattern: Takeover state machine vocabulary
  (idle → armed → active → cooldown, with :suppressed escape)
EMA target: docs/vapps/see-agent-work.md §"Mocked Controls" — future
  label set for swarm start/pause/stop transitions, rendered as
  disabled/`pending daemon writer` buttons in wave 1
Action: inspire (docs only)
Why: Authority state language should be visible in the control room
  surface, not hidden. Copy the labels as future vocabulary; do not wire
  the state machine in the surface.
Truth risk: labeling surface buttons with authority states they don't
  enforce is dangerous unless clearly mocked. Keep `pending daemon writer`.
Files likely touched: docs/vapps/see-agent-work.md (label vocabulary note)
```

```text
Donor: lineage-original-elixir-ema
Useful pattern: Phoenix Endpoint, Phoenix.PubSub, Ecto.Repo, Elixir BEAM
  idioms
EMA target: —
Action: reject
Why: Runtime substrate detail. The surface is React/TS over IPC.
Truth risk: none — irrelevant to this lane.
Files likely touched: none.
```

```text
Donor: lineage-original-elixir-ema
Useful pattern: Ordered supervision tree (config → repo → pubsub →
  registries → workspace → sessions → control plane → babysitter →
  surfaces → endpoint last)
EMA target: —
Action: reject (for this lane)
Why: Daemon supervision order is the Runtime Vertical Slice Orchestrator's
  lane. Out of scope.
Truth risk: none at this lane.
Files likely touched: none.
```

---

### 7.5 — codebase-place-org-openclaw (glass morphism, popout, graceful degradation) — ADDED 2026-04-24

Missed in the original matrix; surface-lane-relevant patterns from the place.org ↔ OpenClaw fork. Cross-referenced in [`EMA-0.0.5-FULL-DONOR-INVENTORY.md`](EMA-0.0.5-FULL-DONOR-INVENTORY.md) §"Crown jewel — integration design spec".

```text
Donor: codebase-place-org-openclaw (git branch origin/codebase-place-org-openclaw)
Useful pattern: Additive-only fork seam — orchestrator features confined to a single
  namespace; surface read-only except one named call-site (src/app/layout.tsx). Graceful
  degradation — orchestrator-dependent enhancements check connection state; render nothing
  if offline. Glass morphism + popout windows via use-glass-intensity + popout-launcher.ts +
  companion-bridge.ts (WebSocket client on ports 27182–27189 with origin validation).
EMA target: apps/web/src/shell/ — when the companion bridge lands (Runtime lane), the
  VirtualDesktopShell's presence of a Tauri companion should be detected and gracefully
  degrade. The additive-seam discipline is the right pattern for introducing optional
  orchestrator-enhanced affordances (e.g., a "Pop out this vApp" control visible only when
  a companion is connected).
Action: adapt
Why: Confirms the surface must not assume companion presence; pattern maps cleanly to
  EMA's daemon-optional default posture.
Truth risk: low — the pattern strictly disallows writes from the surface side.
Files likely touched: apps/web/src/shell/virtual-desktop-shell.tsx (add companion-presence
  detection), apps/web/src/shell/window-frame.tsx (optional "pop out" control — draft +
  pending runtime-lane companion-bridge landing), apps/web/src/app/styles.css
```

```text
Donor: codebase-place-org-openclaw
Useful pattern: Typed three-frame transport (req/res/event) with monotonic seq + challenge-
  response handshake. Bounded extension points enumerated as a fixed small set (app-registry,
  layout init, etc.), not an open ABI.
EMA target: packages/contracts/ipc/ — compare against shell-protocol.md v0; confirm EMA's
  three frame types (command, command_result, event) match the donor's shape and field-order
  discipline.
Action: inspire
Why: Independent validation of EMA's IPC protocol choices.
Truth risk: none — documentation cross-check.
Files likely touched: packages/contracts/ipc/shell-protocol.md (cross-reference note)
```

---

### 7.75 — codebase-execudeck (trust zones, schema-driven mutations) — ADDED 2026-04-24

Missed in the original matrix.

```text
Donor: codebase-execudeck (git branch origin/codebase-execudeck)
Useful pattern: Three-frame trust model (Zone 0 / Zone 1 / Zone 2) — surfaces render and
  orchestrate without mutation rights. Schema-driven artifacts: JSON tree + inspector +
  transform model makes all mutations replayable. Scoped on-demand context — agents pull
  context through ID-addressed query channels, never ambient state.
EMA target: Surface-lane posture reinforcement. apps/web/src/app/agent-work-page.tsx (Slice A)
  already lands the trust-zone posture implicitly: every control is labeled
  `mocked | draft | pending daemon writer`. Explicit documentation opportunity:
  docs/vapps/see-agent-work.md §"Mocked Controls" could cite the execudeck trust-zone framing.
Action: adapt (docs) + inspire (code)
Why: Validates the labeling discipline with independent prior art.
Truth risk: low.
Files likely touched: docs/vapps/see-agent-work.md (trust-zone citation note)
```

---

### 8 — TrajanWJ/ema GitHub history (archived Tauri/Elixir, task/dispatch)

```text
Donor: TrajanWJ/ema (GitHub; archived Tauri + Elixir + task/dispatch work)
Useful pattern: Historical task/dispatch surface iterations — earlier
  attempts at rendering task state
EMA target: apps/web/src/app/agent-work-page.tsx lane board — confirmed
  against lineage; nothing new to adopt that is not already surfaced via
  agent-os-bridge + original-elixir-ema .qmd extracts
Action: inspire (no-op)
Why: The extractable doctrine is already present in the .qmd files for the
  descendent repos. Spending time doing fresh git archaeology on
  TrajanWJ/ema would duplicate that work.
Truth risk: none.
Files likely touched: none.
```

```text
Donor: TrajanWJ/ema
Useful pattern: Archived Tauri bridge experiments
EMA target: apps/desktop/** (OUT OF SCOPE for this lane)
Action: reject (for this lane)
Why: Desktop lane; see Desktop Launcher Correction Orchestrator.
Truth risk: none here.
Files likely touched: none.
```

---

## Implementation Priority (surface lane)

1. **Slice A — See Agent Work first screen upgrade.** Wire the existing
   rich `seeAgentWorkProjection` into `AgentWorkPage` so the eight regions
   from `docs/vapps/see-agent-work.md` render honestly. Plan doc:
   `runtime/EMA-0.0.5--4-24/docs/plans/SURFACE-SLICE-A.md`.

2. **Slice B — HQ lane-status rewire.** `hq-page.tsx` currently reads the
   stub `agentWork` array (pointing to an external coordinator ledger).
   Switch it to a derived summary of `seeAgentWorkProjection.lanes` with
   `mocked` labels retained.

3. **Slice C — Command palette (inspired by place.org).** Global
   `Cmd/Ctrl-K` palette that dispatches CLI-equivalent commands; each
   hit either triggers `useCommand` (real IPC) or surfaces a labeled
   mock tag.

4. **Slice D — Chronicle strip upgrade.** Cap at `CHRONICLE_MAX = 200`
   (lineage-original-elixir-ema donor). Render command vs event frame
   types visually distinct (agent-os-v8 inspiration).

5. **Slice E — Docs tightening.** Append vocabulary notes to
   `docs/cli/see-agent-work.md` (agent-os-bridge verbs + mission-control
   adapter protocol note). Add label vocabulary to
   `docs/vapps/see-agent-work.md` (original-elixir takeover labels).
   Reinforce read-only-observer rule in `docs/agents/see-agent-work-agent-usage.md`.

Slices B–E only run after Slice A lands.

---

## Rejection ledger (cross-cut)

- Never make apps/web own durable state.
- Never ship a surface that mutates SQLite directly.
- Never invent agent activity numbers in the UI.
- Never let a mocked control appear real.
- Never copy donor UI substrate (Tailwind v4, shadcn, Zustand, Next 16,
  Docker, Obsidian vault) into apps/web.
- Never duplicate git-ema's attachment store from See Agent Work.
- Never flatten lanes/missions/campaigns/handoffs into generic "tasks."
- Never import `Organization -> Project -> Space` containment language.

---

## Cross-lane coordination

Lanes this surface orchestrator does **not** assign:

- Runtime Vertical Slice Orchestrator: apps/daemon/**,
  packages/surface-core/src/ipc-client/**, scripts/dev-daemon.sh,
  tooling/m1-round-trip.mjs, packages/contracts/**.
- Desktop Launcher Correction Orchestrator: apps/desktop/**, Tauri CSP,
  first-launch "Start EMA daemon?" affordance.

If a surface change requires daemon or IPC-client support
(e.g., a new projection name), this lane raises a handoff request rather
than cross-editing.
