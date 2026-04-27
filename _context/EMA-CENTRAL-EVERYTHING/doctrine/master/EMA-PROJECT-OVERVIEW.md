# EMA 0.0.5 — Project Overview

**Document kind:** Product Requirements / scope doctrine
**Version:** 0.0.5
**Status:** canonical doctrine, inherits from `doctrine/master/EMA-DESIGN-DOC.md`
**Date:** 2026-04-24
**Founding operators:** Adil, Trajan
**Implementation root:** `runtime/EMA-0.0.5--4-24/`

---

## 0. Document scope

This document refines the Master Design Doc into a PRD-shaped operating brief. Where the Master Doc explains *what EMA is and why it must exist*, this doc answers the next layer of questions product work needs:

- Who is this for, in what order, and with what evidence of need.
- What the first shippable product actually contains — and just as importantly, what it does not.
- How we'll know 0.0.5 has landed.
- What workflow a real human walking in on day one can complete end-to-end.
- Which waves gate which other waves.
- What evidence counts as validation.

**Authority order:** Master Design Doc > this Overview > the Technical Design > surface-level specs. If this doc contradicts the Master Doc, the Master Doc wins. If a surface spec contradicts this doc, this doc wins.

**Companion docs:**
- `doctrine/master/EMA-DESIGN-DOC.md` — the master doctrine
- `doctrine/master/EMA-TECHNICAL-DESIGN.md` — event catalog, writer topology, IPC shape, supervision tree, donor-translation map
- `doctrine/master/EMA-STYLING-UX-MENTALITY.md` — aesthetic + interaction mentality
- `doctrine/design/place-org-ux-manifesto.md` — the aesthetic fence
- `doctrine/planning/EMA-0.0.5-LANGUAGE-LOCK.md` — vocabulary lock
- `runtime/EMA-0.0.5--4-24/docs/orchestration/STATUS.md` — live buildout ledger

---

## 1. One-sentence product

> EMA is the **Executive Management Assistant**: a shared human-agent executive workspace where project management, executive management, source material, coordination, context, and durable execution all live inside one legible environment.

**Category name EMA occupies:** *environment for agentic work.* Not a chat app, not a planner, not a pipeline runner, not an agent framework. The adjacent category is "IDE" (Karpathy's framing), but the analogy holds only structurally — EMA's content is organizational work, not code.

**One-sentence thesis (from the Master Doc):** *Agents perform at the level of the environment they inhabit; a shared human-agent workspace with durable truth, explicit execution, coherent collaboration objects, and scoped identity is the environment that makes real agentic work possible, auditable, and compounding over time.*

---

## 2. Target operators

### 2.1 Primary — Adil (wholesaling real estate)

- Runs a wholesaling real estate operation with employees and agents.
- Core needs: executive assistance, employee coordination, outreach orchestration, leadflow capture, scraper orchestration, business-ops record-keeping.
- Day-one EMA experience: a single workspace where Adil can say "scrape these leads, score them, draft outreach for the top twenty, hand me the queue," watch the workflow route from intent → proposal → plan → spec → execution → canon, and approve the right gates without chasing threads across four tools.
- **Why Adil first:** real business, real revenue pressure, willingness to run EMA as the primary operations surface. His workflow exposes every primitive (intent capture, proposal path, dispatch, review, audit trail, canon).

### 2.2 Primary — the founding team itself (EMA-builds-EMA)

- Trajan + any human or agent collaborator working on EMA 0.0.5.
- Core needs: coordinate a swarm of Codex / Claude CLI / human-founder sessions across lanes, hand off between lanes without losing context, see what every agent is working on at a glance, make proposals and review them, attach donor research to Blueprint sections, keep provenance clean.
- **Why EMA-builds-EMA:** the fastest feedback loop for a workspace product is to run it against its own construction. Every drift surface in EMA will be felt first by us.

### 2.3 Next-wave — small teams running real operations

- 2–10 humans + a swarm of agents, running real work: a research lab, a small investment team, a creative studio, a growth-stage startup ops team.
- Not a wave-1 target; proves the product after Adil + EMA-builds-EMA validate the primitives.

### 2.4 Explicit non-targets for 0.0.5

- Enterprise IT buyers. (The product surface is not an admin panel and will not look like one.)
- Individual consumers looking for a journaling / note-taking tool. (The center of gravity is collaborative work; personal note-taking is downstream of that.)
- Developers evaluating a generic agent framework. (Hermes is the harness; EMA is the environment on top.)
- Anyone whose core need is a chat UX. (Chat is a surface inside EMA, not the product.)

---

## 3. Problem statement

The current agentic-human stack is **transient, dispersed, and contextless**. A knowledge worker operating with modern AI tools has brilliant one-shot reasoning in a chat box, no durable memory across sessions, no explicit proposal path, no audit trail, no shared object vocabulary with the agent, and no way for two or more agents to collaborate inside the same project state. The adjacent categories (Notion/Miro planners, chat-first agent frameworks, automation platforms like Zapier/n8n/Make) each solve one slice and are structurally incapable of being the environment.

EMA closes the gap by making the *environment* first-class: a daemon-owned canonical record, intent preservation at every entrypoint, a six-stage workflow from intent to canon, shared first-class objects (lanes, handoffs, missions, campaigns, proposals, plans, specs, souls), multi-surface rendering of one underlying truth, and actor primitives that span humans, agents, personal AIs, devices, and services with explicit scopes of authority.

Short form: **bright agents need dim environments to stop being fast, expensive interns**. EMA is the environment.

---

## 4. Product positioning

### 4.1 What EMA is (for Adil)

- The control panel for the business.
- Where outreach campaigns are proposed, reviewed, dispatched, and audited.
- Where employees and agents see the same mission rail, the same lane board, the same handoff queue.
- Where the leadflow scraper's run ledger lives permanently.
- Where the founder asks a question and gets a reviewable proposal back instead of an unreviewable action.

### 4.2 What EMA is (for the founding team)

- The shared swarm environment for building EMA with EMA.
- The place where Codex / Claude CLI / human-founder lanes coordinate through explicit handoffs instead of scrollback.
- The source of truth for who owns which lane, which mission it belongs to, which campaign contains the mission, and which weekly phase the campaign is in.
- A mission control room (See Agent Work) that renders the swarm state honestly, with visible labels on every mocked control.

### 4.3 What EMA is not

Per Master Doc §7.5:
- Not a chat app. Chat is a surface.
- Not an IDE. The IDE framing is structural analogy only.
- Not an operating system. EMA runs on the OS; it is not the OS.
- Not a generic agent framework. Hermes is the harness.
- Not a SaaS dashboard. The posture is calm-technology, not admin-panel.
- Not a note-taking app.
- Not a replacement for code editors, design tools, or spreadsheets.

### 4.4 Posture

Dense, honest, operator-grade. Calm-technology. Dark-only. Bioluminescent, not neon. See `doctrine/design/place-org-ux-manifesto.md` for the aesthetic fence and `doctrine/master/EMA-STYLING-UX-MENTALITY.md` for the interaction mentality.

---

## 5. Four-stack product model

Per Master Doc §7.

1. **Shared workspace** — the durable operating layer: organizations, spaces, projects, actors, Blueprint, git-ema, lanes, handoffs, missions, campaigns, vCalendar, checkups, proposals, plans, specs, executions, canon, souls. Accessed through many surfaces; lives in one place (the daemon).
2. **Control plane** — the Gleam/BEAM daemon. Sole canonical writer. Event-sourced SQLite append-only log. Ordered supervision tree descending from the `lineage-original-elixir-ema` doctrine.
3. **Harness** — the boundary to runtime execution. EMA's first-class harness is Hermes. EMA creates the execution record *first*, dispatches to Hermes, persists the ledger, binds run to workstream and thread. Hermes is never the only place where a run exists.
4. **Multi-app shell** — surfaces. Virtual-desktop metaphor (wallpaper + dock + topbar + windowed vApps + presence). Every surface reads projections and dispatches commands; none own durable canonical state.

Note the ordering: workspace (what exists) → control plane (who owns truth) → harness (who runs) → shell (how it's seen). If any layer above is corrupted or confused, no polish at a lower layer recovers the product.

---

## 6. Core product surfaces

Ten surfaces in the 0.0.5 doctrine (Master Doc §8 plus Brain Dump as the first intent-capture vApp). In priority-of-first-ship order for 0.0.5:

| # | Surface | Primary reader | What it renders | Writes via |
|---|---|---|---|---|
| 1 | **Virtual Desktop (shell)** | everyone | wallpaper, dock, topbar, windowed vApps, presence | — (hosts other surfaces) |
| 2 | **Launchpad** | everyone | vApp tiles, recent projects/lanes, CLI command palette | dispatches commands |
| 3 | **Topbar** | everyone | org / space / project / connectors / presence | selector dispatches |
| 4 | **Brain Dump** | humans primarily; agents may write | single capture input + chronological queue of unprocessed entries; per-entry Task / Journal / Archive tags; CLI parity | writes `intent` (local-only in wave 1; `ema_intents` writer lands post-W1 and promotes entries through the pipeline) |
| 5 | **See Agent Work** | steering humans; agents | 8 regions: swarm pulse, mission rail, lane board, vCalendar strip, agent roster, command panel, agent instruction panel, chronicle strip | mocked wave 1; real commands as writers land |
| 6 | **HQ** | humans primarily | customizable dashboard: swarm pulse, missions, lane sparklines, checkups, weekly phase, queue pressure, handoffs, sync health | buttons dispatch commands |
| 7 | **Blueprint Builder** | humans + agents | project Blueprint docs, sections, attachments, proposal extraction points | writes intent; promotes via proposal path |
| 8 | **Wiki** | humans + agents | semantic knowledge layer, cross-links, intent plane, agent provenance | writes intent; promotes via proposal path |
| 9 | **Threads / Server** | everyone | ordered thread event log, messages, handoff creation, queue promotion | canonical communication events |
| 10 | **Agent vEnv + Chat** | agents primarily; humans observing | agent roster, soul inspector, peripheral lane view, focus pane, active grants, tool events; focused dialogue | proposals, messages, handoff requests |

Surfaces 1–6 are the wave-1 ship target. 7–8 are partially seeded (Blueprint is a stub vApp with mocked sections; Wiki not yet surfaced). 9–10 are planned, post-wave-1.

**Brain Dump specifically:** first intent-capture vApp per Master Doc §6.1. Entries land in `localStorage` under `ema:braindump:<project_id>` with a visible `local only` tag and `pending daemon writer` on every processing control. When the intent writer (provisionally `ema_intents`) lands post-W1, entries promote through the canonical intent→canon pipeline. Vocabulary-mapped from the place.org Brain Dump donor — see `doctrine/design/place-org-ux-manifesto.md` §16 donor vocabulary map and the RIP marker at the top of `apps/web/src/vapps/braindump/index.tsx`.

**Universal rules applying to every surface:**
- Reads come from daemon projections via the IPC client (`packages/surface-core/src/ipc-client/`) and the React hooks layer (`apps/web/src/lib/ipc/`).
- Every mocked control carries a visible tag (`mocked | draft | local only | pending daemon writer`) and a CLI equivalent.
- No surface holds canonical state. Layout artifact is disposable client-side-only state.
- Every surface obeys the place.org-ux-manifesto posture.

---

## 7. Canonical workflow

Per Master Doc §6:

```text
intent -> proposal -> plan -> spec -> execution -> canon
```

This is the most load-bearing artifact in the product. The PRD commitment:

1. **Intent is preserved, never paraphrased.** Every human or agent entrypoint writes intent to the intent plane in the wiki with the original phrasing, author, surface-of-origin, and context.
2. **Proposals are first-class objects.** Every proposal has an author, scope, rationale, linked intents, linked sources, and a review state. Proposals live in the daemon, not in thread scrollback.
3. **Plans decompose with reviewer signatures.** A plan is an approved proposal broken into steps + resources + dependencies + invariants. Plans are reviewed before they become specs.
4. **Specs lock.** Once locked, specs do not change mid-flight. Mid-flight changes mean the execution is canceled and a new spec with lineage is drafted.
5. **Executions are canonical.** The daemon writes dispatch, tool events, and outcome. Hermes runs the work, but the run exists in EMA first.
6. **Canon is append-only.** Bad canon is corrected by new canon (a correction event), not by overwriting.

This workflow is what turns agent capability into organizational competence. It's also the bad-canon-recovery mechanism: every stage has attributable authors and reviewers, so accountability is legible and correction is targeted.

---

## 8. Agents and humans as peers

- Both resolve through the same **actor** primitive (`actor:<ulid>`). Humans are `user:` actors; agents are `agent:` actors; personal AIs are `pai:` actors; devices are `device:` actors.
- Both operate inside the same shared objects with the same vocabulary. A lane owned by an agent and a lane owned by a human render identically in See Agent Work; only the owner metadata differs.
- Both write intent, author proposals, approve (at appropriate scope), and dispatch.
- Both are visible in the peripheral view (Master Doc §4.6). Agents are not tourists; humans are not audience.
- **Asymmetry:** humans retain final authority on proposals that touch real external systems (sending messages, moving money, writing public files). Internal reversible proposals may be agent-sign-off-only. This asymmetry is explicit policy, not product default — a trust-zone bump is a governance event.

The product commitment: *teams, not solo pilots.* One human plus one AI is a party trick; many humans plus many agents inside shared canon is the product.

---

## 9. MVP definition

What "winning" looks like for 0.0.5, from Master Doc §1:

1. **A workspace that boots into a real organization, space, and project.** First-boot seed emits the 13 canonical events: device.registered, actor.created × 3, org.created, space.created, project.created, membership.role_granted × 3, identity.user_upserted × 3. The seeded state is `Founding-Fathers-EMA` organization, `Founding-Fathers-EMA` default space, `EMA 0.0.5` project. Reboot against the same DB is idempotent.
2. **A daemon that owns canonical truth.** The Gleam/BEAM daemon serves as the single writer. SQLite `events` table is append-only. Every surface writes through the daemon's bus; no surface writes canon directly.
3. **Agents operating against the same environment as humans.** Codex / Claude CLI sessions appearing as `agent:` actors in the roster, with lane ownership, handoff participation, and visible status.
4. **`See Agent Work` dense enough to feel like mission control.** Eight regions rendered honestly with `pending daemon writer` labels on mocked controls. Real projections drive TopSwarmPulse, MissionRail, LaneBoard, ChronicleStrip once writers land.
5. **Design posture unmistakably not SaaS.** Place.org donor aesthetic: wallpaper breathing, bioluminescent accents, glass tiers, Apple system fonts, spring easing, honest mocks.

### 9.1 Must-include (0.0.5 cannot ship without)

- Gleam/BEAM daemon compiled green, booting clean, WS listening on `ws://127.0.0.1:49555`.
- M1 round-trip proven (`tooling/m1-round-trip.mjs` green): hello → hello_ack → subscribe → command → streamed event envelope.
- First-boot seed emitting canonical events; idempotent on reboot.
- `shell_ipc v0` protocol per `packages/contracts/ipc/shell-protocol.md`: hello, subscribe, command, projection, event, error classes, reconnect, backpressure.
- Event catalog `packages/contracts/events/catalog.v0.md` covering 19 families (org, actor, identity, space, project, membership, invite, access_session, device, peer, lease, replication, lane, handoff, proposal, incident, dispatch, execution, tool, blueprint, collab, attachment, connector).
- Writer actors (Gleam modules under `apps/daemon/src/ema_orgs/`, `ema_spaces/`, `ema_projects/`, `ema_identity/`, etc.) validating and appending events. Wave-1 minimum: `org.create`, `space.create`, `project.create`, `identity.google_upsert`.
- Topbar projection (`topbar`) driven by a daemon projection actor.
- Virtual-desktop shell: wallpaper with time-of-day breathing, dock, window manager, topbar, presence layer (UI-only stub).
- Desktop bundle (Tauri v2): real Mach-O arm64 on macOS, embeds the web surface, CSP locked to `self` + `ws://127.0.0.1:49555`.
- `See Agent Work` vApp with the eight regions; every mocked control tagged and CLI-documented.
- `Brain Dump` vApp: capture input, chronological queue, per-entry Task / Journal / Archive tags, local-only persistence, CLI parity. Every processing control tagged `pending daemon writer`.
- Donor-rip provenance markers (`/* RIP: place.org */` etc.) preserved in CSS and component headers.
- Language-lock clean: `Organization -> Space -> Project`; `canon` never `cannon`; no generic-SaaS language.
- At least one complete intent → canon pipeline walkthrough (see §10) executable end-to-end.

### 9.2 Explicit excludes (0.0.5 does not ship)

- **Sync between peers.** Replication scaffolding exists (event kinds, lease model) but multi-device sync is not implemented. Single-device demo only.
- **Auth ceremony.** Device key pairing is deferred to wave 3; 0.0.5 accepts any `hello` and assigns a dev device id on the fly.
- **Hermes harness integration.** The `dispatch`, `execution`, `tool` event families are defined in the catalog, but Hermes dispatch is not wired end-to-end in 0.0.5.
- **Multi-user collaboration.** One user's workspace on one device. Multi-actor appears via seeded agents in projections, not via real multi-user sessions.
- **Full Blueprint writer stack.** Blueprint sections are surfaced as a stubbed vApp; section-create command and projection are deferred to Runtime Vertical Slice B.
- **Wiki surface.** Wiki vApp UI is deferred post-0.0.5. The intent plane is implicit (via `blueprint.section.added` events); wiki graph navigation is not shipped.
- **Real debate / simulation / stress-testing.** The objects exist in doctrine (Master Doc §15) but 0.0.5 does not ship the surfaces.
- **Personal AI surface.** `pai:` prefix is reserved; no PAI surface or writer in 0.0.5.
- **Sound.** The place.org donor had ambient sound; 0.0.5 ships silent. Future manifesto amendment gates any sound addition.
- **Light mode.** Dark-only per manifesto §4.
- **Native mobile.** Desktop + web only. PWA considered, not committed.
- **Plugin / extension system.** vApps are built-in; no third-party surface extensibility.

### 9.3 MVP first-proof workflow

The ten-step end-to-end walkthrough that 0.0.5 must be able to execute. This is the PRD acceptance test: if a fresh installation can do this cleanly, 0.0.5 has landed.

1. **Install & launch.** User opens `/Users/tawj/Desktop/EMA 0.0.5.app` (Tauri Mach-O bundle). The bundle embeds the Next.js vDesktop web surface. Desktop fades in with wallpaper breathing.
2. **Daemon liveness.** Tauri checks port 49555; daemon is already running (installed separately via `scripts/install-daemon-launchd.sh` when that lands, or started via `scripts/start-ema-dev.sh` pre-wave-3). If daemon is down, the first-launch "Start EMA daemon?" affordance appears.
3. **First-boot seed verifies on DB.** If SQLite is empty, `first_boot.seed_if_needed/1` emits 13 canonical events. If SQLite already contains `org.created` for `Founding-Fathers-EMA`, seed is skipped (idempotency).
4. **Topbar populates.** The topbar projection delivers `Founding-Fathers-EMA / Founding-Fathers-EMA / EMA 0.0.5`. The connectors indicator renders neutral (no connectors connected).
5. **User opens Launchpad.** Dock → Launchpad tile. Launchpad shows vApp catalog and recent items.
6. **User opens See Agent Work.** Launchpad → `See Agent Work`. The 8 regions render. Mock projection serves TopSwarmPulse, MissionRail, LaneBoard, VcalendarStrip, AgentRoster, CommandPanel, AgentInstructionPanel, ChronicleStrip. Every mocked control carries a visible tag and a CLI equivalent. The `MOCK_PROJECTION_LABEL` badge is prominent.
7. **User attempts a command.** User clicks "Start swarm" (mocked). Tooltip: "pending daemon writer — click has no side effect". User copies the CLI equivalent (`ema swarm start …`) from the panel.
8. **User opens Blueprint.** Launchpad → Blueprint. The stub vApp renders; sections are visible as mocked placeholders.
9. **User opens HQ.** HQ renders lane status panel, swarm pulse, due checkups, weekly phase focus. Every panel carries an honest label. `agentWorkLaneSummary` derivation populates the lane panel from the See Agent Work mock.
10. **User closes EMA and reopens.** Window positions persist via the disposable `layout-artifact` localStorage write. Daemon state persists via SQLite. Reboot shows the same topbar, same seeded project, same handful of missions/lanes in See Agent Work.

This walkthrough is what `scripts/m1-smoke.sh` (or its successor) should automate. Pre-commit hook for 0.0.5 release: walkthrough must pass.

---

## 10. 0.0.5 waves and gates

From STATUS.md §"Wave-by-wave reality":

| Wave | Area | State | Gate to next wave |
|---|---|---|---|
| W0 | Doctrine + contracts | landed | Event catalog, 44 ID prefixes, 12 architecture docs, 3 vApp specs |
| W1 | Workspace skeleton + M1 | **active** | M1 round-trip green; first-boot seed idempotent; topbar projection live; See Agent Work 8-region shell rendered |
| W2 | Blueprint + git-ema writers | not started | Blueprint section projection + create command; git-ema connector picker list → create attachment |
| W3 | See Agent Work real writers | UI only, no writers | `swarm.start`, `lane.open`, `lane.item_added` writers end-to-end; chronicle strip driven by real events |
| W4 | Actors + Soul + proposals | design only | Soul profile object, proposal draft/submit/accept, actor assignment flows |
| W5 | Runtime + Hermes integration | design only | `dispatch.started`, `tool.invoked`, `execution.ended` flowing from Hermes |
| W6 | Collab + threads + vCalendar writers | design only | Thread events canonical, vCalendar block create/update, checkup flow |
| W7 | Multi-device + replication + auth | design only | Device key pairing, replication batch apply, lease reconciliation |

**Current wave:** W1. **Exit gate for W1:** M1 round-trip passes (already true), first-boot seed runs idempotent on clean SQLite, topbar renders from real daemon projection (not mock), See Agent Work 8-region UI rendered honestly.

**Wave coupling rules:**
- A wave does not close until its exit gate is demonstrably green (tests pass + an operator-signed checklist entry in STATUS.md).
- Later waves may begin preparatory doctrine / scaffolding, but no writer actor ships in wave N+1 until wave N's exit gate is green.
- Gates are small and concrete, not aspirational.

---

## 11. Success criteria

Measurable. If 0.0.5 can do each of these reliably, it has shipped.

### 11.1 Functional

- Fresh clone → `pnpm install` → `scripts/start-ema-dev.sh` → daemon boots + web on 5173 + desktop bundle launches, all within 60 seconds on an M1-class Mac.
- `node tooling/m1-round-trip.mjs` returns `m1-round-trip: OK` against the live daemon.
- First-boot seed emits 13 events on a clean SQLite; second boot emits 0 events (idempotency).
- `pnpm --filter @ema/web build` is clean (no TypeScript errors, no lint failures).
- `cd apps/daemon && gleam build && gleam test` is clean.
- `bash scripts/contract-check.sh` is green (every referenced event kind + ID prefix is registered).
- Tauri bundle `file Contents/MacOS/ema-desktop` returns Mach-O arm64.
- Topbar renders the seeded `Founding-Fathers-EMA / Founding-Fathers-EMA / EMA 0.0.5` via real daemon projection.

### 11.2 Product quality

- Every mocked surface control has a visible label (one of four: `mocked | draft | local only | pending daemon writer`) and a documented CLI equivalent.
- Every CSS rule derived from a donor carries a `/* RIP: <donor> */` marker.
- Language-lock is clean: no `Project -> Space`, no `cannon`, no `workflow`/`pipeline` as synonym for `lane`.
- Reduced-motion mode disables ambient motion and preserves functional transitions.
- Accessibility: AA contrast on all text; keyboard path to every primary action; `aria-live` announces surface-level state changes.

### 11.3 Operator experience

- A new operator can complete the §9.3 ten-step first-proof workflow on a fresh machine from the published install guide, without support, within 15 minutes.
- An external agent session (Codex, Claude CLI) opening EMA for the first time can read STATUS.md + one architecture doc and contribute to a lane within the first hour.
- No surface ever performs authority it does not have. Every operator surprise in testing is treated as a product bug, not user error.

### 11.4 Honest-mocks discipline

- Zero `active agents: N` numbers on any surface without a corresponding daemon projection.
- Zero buttons that animate but have no side effect without an explicit `pending daemon writer` tag + tooltip.
- Zero surfaces that treat localStorage or component state as canon.

### 11.5 Provenance

- Four correction commits visible in `runtime/EMA-0.0.5--4-24/.git/` from the 2026-04-24 drift correction.
- Every doctrine decision logged in STATUS.md with date.
- Every canon update attributable to an authored commit or STATUS entry.

---

## 12. Validation plan

From Master Doc §19.

### 12.1 Internal — EMA-builds-EMA

- Run the 0.0.5 buildout *inside* 0.0.5 as it matures. STATUS.md already functions as the live ledger; next step is promoting STATUS entries to first-class `canon` events so the buildout is canonical, not ledger-only.
- Validation question: *can the founding team operate a multi-orchestrator swarm inside EMA with less friction than outside it?* Measurable by lane-completion cycle time, handoff count, uncommitted-work incidents.
- Target: by W3 exit, the founding team's internal coordination happens *in* EMA (See Agent Work + HQ + Blueprint), not in Notion or scrollback.

### 12.2 External — Adil wholesaling REI

- Adil runs the wholesaling operation through EMA as primary ops surface by end of W5.
- Validation question: *does EMA reduce the amount of executive management Adil does by hand?* Measurable by hours/week spent on repetitive cognitive labor before vs. after.
- Target: 50% reduction in Adil's hand-done executive management within 90 days of first deploy.

### 12.3 Measurable signals

- **Daemon uptime.** `ws://127.0.0.1:49555` live for ≥95% of a normal 12-hour work day, W3+.
- **M1 round-trip success rate.** `tooling/m1-round-trip.mjs` passes on every lane-close commit (CI gate).
- **Intent → canon completion rate.** Of proposals submitted, % that land in canon. Target by W5: ≥60%.
- **Lane completion cycle time.** Median time from lane `opened` to `closed` event. Baseline measured at W3 exit.
- **Unlabeled mock count.** Number of surface controls or panels that render without an honest-mock tag. Target: 0 in any shipped wave.
- **Cross-lane contamination incidents.** Uncommitted files crossing lane boundaries. Target: ≤1/week by W3; 0 post-W5.

### 12.4 Long-term validation

- Next-wave operators (small teams) using EMA voluntarily after seeing the Adil deployment.
- Agent performance inside EMA measurably higher than the same agents outside EMA on comparable work (proposal quality, audit trail completeness, handoff-acceptance rate).
- Canon-correction events outnumber canon-overwrite attempts (never happens because canon is append-only, but the *desire* to overwrite vs. correct is an operator-maturity signal).

---

## 13. Risks and failure modes

Brutal-honesty posture (Master Doc §18).

### 13.1 Conceptual risks

- **Thesis turns out to be wrong.** "Environments beat prompts" is the core bet. If model capabilities improve faster than environment scaffolding pays off, agents may outgrow the need for EMA-style structure. *Mitigation:* EMA's structure is useful to *humans* regardless of model capability; the environment is the product, not the agent amplifier.
- **The six-stage pipeline is too formal for real use.** If operators find intent → proposal → plan → spec → execution → canon slower than chat-and-commit, they'll route around it. *Mitigation:* 0.0.5 allows elided stages at operator-signed scope; the pipeline is how canon is *constructed*, not how every idea must travel.

### 13.2 Product risks

- **Surface density overwhelms new users.** See Agent Work packs 8 regions; HQ packs many more. *Mitigation:* the Launchpad is the soft-entry surface; See Agent Work is the power-user mission control. Progressive disclosure is an interaction-design problem, not a scope problem.
- **Canon grows faster than projection performance.** Append-only SQLite with unbounded events. *Mitigation:* per-channel subscription backpressure (500-msg cap in IPC spec); bounded projection recompute; eventual snapshot-compaction path in W6+.
- **Operator trust in mocked controls erodes.** If an operator clicks "Start swarm" enough times without effect, they learn to ignore the system. *Mitigation:* honest-mocks discipline is non-negotiable; `pending daemon writer` is always visible; post-W3 writers turn mocks into real actions on a published schedule.

### 13.3 Technical risks

- **Gleam/BEAM operator pool is small.** Finding contributors fluent in Gleam is harder than finding TypeScript contributors. *Mitigation:* canonical writer topology is small and well-documented; donor doctrine from `lineage-original-elixir-ema` is reference material; BEAM expertise transfers from Elixir / Erlang.
- **Tauri v2 + macOS private APIs fragility.** The companion-bridge port uses `objc2` unsafe for NSWindow transparency. *Mitigation:* donor code from `codebase-place-companion` is production-ready (issue #13415 workaround proven); Linux `xprop _NET_WM_CM_S0` check is a documented compositor probe.
- **WebSocket + localhost port collision.** Daemon on 49555 is a fixed port; collisions happen on crowded dev machines. *Mitigation:* port configurable via env; `lsof` idempotency check in `start-ema-dev.sh`; first-launch affordance explains the conflict.
- **SQLite OPFS lock contention if we ever go multi-tab web.** Inherited from place.org donor. *Mitigation:* 0.0.5 web surface runs inside Tauri or as single-tab Next.js; multi-tab OPFS is deferred to the browser-first sync wave.

### 13.4 Trust risks

- **Unlabeled mock slips into production.** Operator thinks a swarm started when it didn't. *Mitigation:* honest-mocks rule is a rule, not a guideline; CI check proposed: grep surface code for `navigator.clipboard` / `onClick` without an accompanying label import.
- **Surface writes canon by mistake.** Some developer, somewhere, one day, writes a SQLite query from a React component. *Mitigation:* `packages/surface-core/` is the only approved data seam; surface code that imports SQLite directly fails the review. No direct sqlite imports from `apps/web/**`.
- **Cross-lane cross-edit.** Multiple orchestrators editing the same file. *Mitigation:* lane ownership discipline; STATUS.md `## Lanes` table is authoritative; drift-correction protocol landed 2026-04-24 as a dispatch-able template.

### 13.5 Organizational risks

- **Founding team splits attention.** EMA 0.0.5 + Adil deployment + next-wave product bets simultaneously. *Mitigation:* STATUS.md coordinator role is load-bearing; weekly check-ins on wave exit gates.
- **Donor doctrine contradicts itself.** 34 atlas branches + 16 TrajanWJ repos + place.org + place-companion + agent-os-demo. *Mitigation:* `EMA-0.0.5-FULL-DONOR-INVENTORY.md` is the single donor source of truth; `donor-translation.md` enforces copy/adapt/inspire/reject verdicts; `SOURCE:` header format and forbidden `copy` targets are rule-coded.

### 13.6 Over-complexity risks

- **The ontology is too big.** 44 ID prefixes. 22 event families. Seven layers of the memory model. *Mitigation:* the ontology is the shape of the work; pruning will happen as wave exits reveal unused primitives. Naming is cheaper than renaming; the current names are locked.
- **Too many surfaces in flight.** 9 surfaces × 2 aesthetic polish layers × 4 wave gates. *Mitigation:* ship 1–5 end-to-end before 6–9 even start; the shell + Launchpad + topbar + See Agent Work + HQ is the wave-1 minimum.

### 13.7 Context-quality risks

- **Doctrine rot.** Master Doc, this Overview, and the Technical Design doc drift apart. *Mitigation:* the three are linked by explicit authority order; STATUS.md records every doctrine edit with date; `scripts/ledger-check.sh` asserts orchestrator prompts cite STATUS.
- **Agent-generated doctrine masquerading as human-authored.** *Mitigation:* every canonical doctrine edit carries an authored commit or STATUS entry. Agent-only drafts are marked as such until an operator signs off.

---

## 14. Open questions

### 14.1 Must-answer before 0.0.5 ships

1. **Does the daemon run as a launchd service or a Tauri-embedded child?** Current state: stand-alone process. Long-term: installable service. Wave-3 decision.
2. **What is the default weekly-phase cadence?** (Mon research / Tue build / Wed review / …) Adil and founding team may diverge. Wave-4 decision, parameterized by project settings.
3. **How are soul profiles seeded for first-run agents?** A new Codex session joining EMA needs a soul. Wave-4 decision; likely `soul.create` with a default profile + operator edit.
4. **What precisely gets logged to canon on every agent action vs. Hermes-local state?** The dispatch / execution / tool event families are defined; the fidelity level needs operator sign-off before W5. (Too granular = noise; too coarse = ambiguity.)

### 14.2 Can-defer

1. Full multi-device sync (W7).
2. Wiki surface UI (post-0.1).
3. Debate / simulation / stress-test surfaces (post-0.1).
4. Personal AI surface (post-0.1).
5. Native mobile (post-0.1).
6. Sound engine (explicit manifesto amendment required).

### 14.3 Long-term strategic (10 entries from Master Doc §20)

1. **What is the plugin-and-extensibility story?** Third-party vApps vs. canonical vApps-only.
2. **What happens when Hermes is replaced or forked?** Driver boundary resilience.
3. **When does EMA become multi-tenant?** Organization-as-tenant vs. instance-as-tenant.
4. **Does EMA host its own Hermes, or always federate?** Power vs. simplicity.
5. **What's the monetization surface?** SaaS, license, hosted-for-you, consulting-led.
6. **How does EMA relate to existing ecosystems (Obsidian, LangChain, SmolAgents)?** Bridge, ignore, absorb.
7. **What's the right answer for audio / video in collab?** Screen share, voice notes, recording.
8. **How do we handle a genuinely adversarial agent inside EMA?** Quarantine vs. revoke vs. learn.
9. **What's the cross-surface animation contract when vApps become popout-able?** See place-org-openclaw donor for primitive.
10. **When does EMA add its own language for scripting?** (CLI is Unix-shaped; a DSL for compound agent flows may emerge.)

---

## 15. Roadmap to 0.1.0

0.0.5 is the **environment skeleton**. 0.1.0 is when the environment ships real work.

- **0.0.5** — Wave 1 landed: workspace skeleton, daemon, M1 round-trip, See Agent Work shell, HQ honest-mocks, topbar real projection, Tauri bundle. (Current target.)
- **0.0.6** — Wave 2: Blueprint writers end-to-end, git-ema connectors real, `see_agent_work.project_pulse` projection live, chronicle strip driven by real events.
- **0.0.7** — Wave 3: See Agent Work real writers (swarm, lane, mission, handoff), agent roster real, desktop launchd / systemd install path, first external operator (not Trajan) contributing.
- **0.0.8** — Wave 4: Soul profiles, proposal flow, actor assignment, debate surface stub.
- **0.0.9** — Wave 5: Hermes harness integrated, dispatch/execution/tool events flowing, run ledger canonical, first real agent work attributable.
- **0.1.0** — Wave 6: Collab + threads + vCalendar writers. First real external team (Adil) running operations through EMA. "EMA runs a business" proved.
- **Post-0.1** — Wave 7 (replication, auth ceremony, multi-device) + second-wave surfaces (Wiki, debate, simulation, PAI).

Wave gates hold. A wave does not get skipped to ship faster; doing so is the drift pattern the 2026-04-24 correction was designed to prevent.

---

## 16. Closing frame

Without EMA, you have no consistent logic and system and framework for the AI to operate within. You have bright agents and dim environments. You have momentum but no memory. You have action but no canon.

EMA is the environment. 0.0.5 is the skeleton of that environment standing up, breathing, and showing the operator what it is going to become.

Without it, we are unprepared for the leap agents are about to take. With it, we can begin.
