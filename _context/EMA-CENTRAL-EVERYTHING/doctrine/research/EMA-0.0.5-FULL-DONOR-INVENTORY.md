# EMA 0.0.5 — Full Donor Inventory (cross-lane)

Status: active doctrine
Owner: Cross-lane — referenced by Surface / Runtime / Desktop Launcher / Codebase Architecture orchestrators
Date: 2026-04-24

Companion to [`EMA-0.0.5-SURFACE-DONOR-MATRIX.md`](EMA-0.0.5-SURFACE-DONOR-MATRIX.md) which remains authoritative for the Surface lane. This inventory covers what the Surface matrix was explicitly scoped not to cover: **Runtime Vertical Slice**, **Desktop Launcher Correction**, and **cross-lane doctrine** donors across all 34 ema-atlas branches, the 12 `docs-*` research branches, and the TrajanWJ GitHub repo ring.

Doctrine floor (unchanged from Surface matrix):

- Topology `Organization -> Space -> Project`.
- Daemon owns canon; Hermes/runtime owns execution; surfaces render + send commands.
- Donor code is translated, not copied blindly. Follow [`ema-donor-rip` skill](../../EMA-CENTRAL-EVERYTHING/../.claude/skills/ema-donor-rip/SKILL.md): every rip gets a `/* RIP: <donor> <path> */` provenance marker.
- Local durable state only in `apps/web/src/shell/layout-artifact.ts` (workspace plane). No other `localStorage`, OPFS, or Tauri-sidecar-as-truth.
- Stale `Organization -> Project -> Space` language quarantined as lineage.

## Crown jewel — Elixir daemon + Tauri transparency integration

The user identified this as the #1 extractable asset. It is NOT one repo but **two halves + an integration design spec**. EMA 0.0.5 inherits both halves by design — the daemon lane gets the OTP/Phoenix doctrine, the desktop lane gets the transparent webview pattern.

### Half 1 — Elixir daemon (`codebase-ema` + `lineage-original-elixir-ema`)

```text
Donor: ema-atlas origin/codebase-ema
Path: code/ema/daemon/
What's there:
- control_plane/          — event_log, store, replay, execution_supervisor, incidents/*
- babysitter/             — supervision tree, named-role watchdog
- sessions/               — ephemeral session identity
- workspace/shared        — durable shared workspace contract
- surfaces/hermes_client.ex  — typed seam proving EMA-truth / Hermes-execution split
- second_brain/indexer.ex — memory as first-class durable asset
Stack: Elixir + Phoenix + OTP supervision
Lane: Runtime Vertical Slice
Action: copy (core doctrine)
EMA target: apps/daemon/ Gleam modules — carry the control-plane/babysitter/session doctrine
  forward; the substrate is Gleam/BEAM now, but the patterns copy verbatim.
Related branch: lineage-original-elixir-ema (precursor doctrine; already cited in Surface matrix)
```

### Half 2 — Tauri transparent companion (`codebase-place-companion`)

```text
Donor: ema-atlas origin/codebase-place-companion
Path: code/place-companion/src-tauri/
What's there:
- src/main.rs          — system-tray daemon; ActivationPolicy::Accessory; "windows": []
- src/window_mgr.rs    — transparent webview creation (see excerpt below)
- src/ws_server.rs     — localhost WS on ports 27182–27189 with origin allowlist
- src/commands.rs      — Tauri command handlers
- src/protocol.rs      — frame types (req/res/event) + handshake
- src/origin_check.rs  — allowlist validation
- tauri.conf.json      — macos-private-api feature flag; autostart + updater plugins
Stack: Rust + Tauri v2 + objc2 + tokio-tungstenite
Lane: Desktop Launcher Correction
Action: copy (production-ready; port directly into apps/desktop/src-tauri/)
EMA target: apps/desktop/src-tauri/src/{main.rs,window_mgr.rs,ws_server.rs,origin_check.rs,protocol.rs}
  — adjust origin allowlist to EMA daemon URL, keep port range, keep transparency code verbatim.
```

Transparency excerpt from `window_mgr.rs` (production code; reproduces in EMA 0.0.5 desktop lane):

```rust
// RIP: place-companion src-tauri/src/window_mgr.rs
let use_transparency = transparent && can_use_transparency();
let builder = WebviewWindowBuilder::new(&self.app_handle, &label, WebviewUrl::External(parsed_url))
    .transparent(use_transparency)
    .shadow(false)
    .decorations(false)
    .title_bar_style(TitleBarStyle::Overlay);

// macOS belt-and-suspenders fix for Tauri issue #13415:
#[cfg(target_os = "macos")]
if use_transparency {
    if let Ok(ns_window_ptr) = win.ns_window() {
        unsafe {
            use objc2::msg_send;
            let _: () = msg_send![ns_window_ptr, setOpaque: false];
            let clear_color: *mut _ = msg_send![class!(NSColor), clearColor];
            let _: () = msg_send![ns_window_ptr, setBackgroundColor: clear_color];
        }
    }
}

// Linux compositor check (xprop _NET_WM_CM_S0) — disables transparency on X11 without compositor.
```

### Integration design spec (the "glue")

```text
Donor: ema-atlas origin/codebase-place-org-openclaw
Path: code/place.org-openclaw/docs/superpowers/specs/2026-03-24-companion-app-design.md
What it specifies:
- Browser → companion handshake (try ports 27182–27189 in parallel, cache working port)
- Origin validation (place.org allowlist → in EMA replace with http://127.0.0.1:5173 + tauri://)
- open-window command schema: { framework: "tauri", action: "open", payload: {url, transparent, ...} }
- Reattach flow (broadcast channel → WS → browser → Tauri::invoke)
- Graceful degradation: if companion absent, surface operates browser-only
Also includes: popout-launcher.ts (surface side) + companion-bridge.ts (surface side)
Lane: spans Surface + Desktop Launcher
Action: copy the protocol; adapt the client code to EMA vocabulary
EMA target: docs/architecture/14-companion-bridge.md (new) + packages/surface-core/src/companion-bridge/ (new, Runtime lane scope)
```

### Naming correction

The user referenced "full Elixir Tauri build". The two halves live in separate branches and were **never integrated into a single repo**. The "Elixir" is in `codebase-ema` (daemon); the "Tauri" is in `codebase-place-companion` (Rust). They are **mated at the WebSocket seam**, not compiled together. Future orchestrators chasing "the Elixir Tauri build" should know: there are two halves and a spec; copy all three.

---

## Runtime Vertical Slice lane — donor matrix

Lane scope: `apps/daemon/**`, `packages/surface-core/src/ipc-client/**`, `packages/contracts/**`, daemon IPC/projection files. Per [`ORCHESTRATOR-INDEX.md`](../planning/orchestrator-prompts/ORCHESTRATOR-INDEX.md).

### R1 — codebase-ema (canonical runtime doctrine)

```text
Donor: origin/codebase-ema
Useful pattern: Control-plane authority split (event_log → store → replay → execution_supervisor → incidents).
  Babysitter owns supervision. sessions/ is ephemeral; workspace/shared is durable.
  surfaces/hermes_client.ex proves the EMA-truth / Hermes-execution boundary in code.
EMA target: apps/daemon/src/ema_daemon/{bus,event_envelope,supervisor,registry,sqlite_ffi}.gleam
  already encode most of this. Remaining work (Codex/Runtime lane): port hermes_client.ex
  shape into a Gleam ema_exec_control module; port incidents/* event families into contracts.
Action: copy (shape), adapt (substrate)
Why: This IS the daemon doctrine. The Elixir substrate is superseded by Gleam/BEAM but the
  control-plane primitives and boundary lines are locked.
Truth risk: if the Gleam port drops the control-plane split, EMA loses its authority story.
Files likely touched: apps/daemon/src/ema_exec_control/*.gleam (new), contracts/events/catalog.v0.md
```

### R2 — codebase-claudeforge (Hermes provider seam)

```text
Donor: origin/codebase-claudeforge
Useful pattern: hermes-provider.ts + session-manager-hermes.test.ts. The TypeScript seam between
  surface and runtime with X-Hermes-Session-Id continuity. Session state ephemeral, runtime state
  durable — invariant explicitly tested.
EMA target: packages/surface-core/src/ipc-client/ already implements the WS client side.
  The provider-side contract (what EMA's daemon returns to a command_result) inherits from
  here. Compare `packages/contracts/ipc/shell-protocol.md` to the donor's session-manager tests;
  port any missing invariants.
Action: copy (invariants), inspire (transport — donor uses HTTP+SSE, EMA uses WS)
Why: Prior art for the exact seam shape. Validates that EMA's command_result field order lock
  matches a known-working pattern.
Truth risk: low — this is a test-driven copy.
Files likely touched: packages/contracts/ipc/shell-protocol.md (invariant notes),
  packages/surface-core/src/ipc-client/index.ts (minor hardening if missing behaviors surface)
```

### R3 — codebase-t3code-fork (transport hygiene)

```text
Donor: origin/codebase-t3code-fork
Useful pattern: Single ordered push bus (welcome held until startup barriers), receipt-driven
  async (downstream waits on typed completion receipts, not polling), schema-validated boundaries
  (every IPC entrypoint parses unknown payloads).
EMA target: packages/surface-core/src/ipc-client — the reconnect + offline-transition-to-hooks
  behaviors spec'd in the Runtime Vertical Slice Orchestrator prompt. Donor confirms the shape.
Action: inspire (patterns), reject (substrate — Electron + codex-app-server not applicable)
Why: Validates EMA's push-bus + reconnect design against a proven implementation.
Files likely touched: packages/surface-core/src/ipc-client/index.ts (reconnect with backoff,
  clear offline state),  packages/contracts/ipc/shell-protocol.md (validation notes)
```

### R4 — codebase-superman (retrieval pipeline for a future memory/wiki vApp)

```text
Donor: origin/codebase-superman
Useful pattern: Staged retrieval pipeline (decompose → parallel candidates → graph expansion →
  multi-signal rerank → budgeted assembly). No silent tool failures (every error returns a
  next-step instruction). First-class status probe (check_status returns active | stale |
  initializing + auto-recovery hint).
EMA target: Not wave 1. Flagged for the future Wiki vApp + any knowledge-graph vApp
  (docs/vapps/wiki.md doesn't exist yet).
Action: inspire (deferred)
Why: When the Wiki vApp ships, the retrieval shape should match this — not be reinvented.
Truth risk: premature adoption would import OpenAI + Qdrant substrate (rejected).
Files likely touched: (future) docs/vapps/wiki.md, docs/architecture/15-retrieval-pipeline.md
```

### R5 — lineage-openclaw (doctrine only)

```text
Donor: origin/lineage-openclaw
Useful pattern: Incident model, role/handoff, watchdog supervision doctrine. The precursor
  to the codebase-ema babysitter.
EMA target: docs/architecture/02-daemon-supervision.md — confirm incident model citations.
  Add a "derived from OpenClaw" note in the supervision doc.
Action: adapt (doctrine citations)
Why: Provenance trail; why the babysitter exists.
Truth risk: none.
Files likely touched: docs/architecture/02-daemon-supervision.md (citation note)
```

### R-REJECT — codebase-agentgpt, lineage-openclaw-archive-subprojects, recovery-old-agent-vm-vault-system

Rejected for runtime code. `codebase-agentgpt` is a known-bad baseline (unbounded autonomous loop, shared-state mutation). `lineage-openclaw-archive-subprojects` is archive-status; everything extractable already absorbed into `codebase-ema`. `recovery-old-agent-vm-vault-system` is fixture data — keep as a **replay corpus for control-plane tests** but no code port.

---

## Desktop Launcher Correction lane — donor matrix

Lane scope: `apps/desktop/**`, Tauri CSP/config, first-launch "Start EMA daemon?" affordance, tray/launchd/systemd lifecycle.

### D1 — codebase-place-companion (PRIMARY; see crown jewel above)

See "Half 2" of the crown-jewel section. This is the primary donor. Copy:

- `main.rs` (tray daemon + autostart + reattach broadcast channel)
- `window_mgr.rs` (transparent webview creation + platform detection)
- `ws_server.rs` (localhost-only WS + origin check)
- `origin_check.rs` (allowlist)
- `protocol.rs` (three frame shapes)
- `tauri.conf.json` structure (keep `macos-private-api`, adjust bundle identifier)

Adjust:
- Origin allowlist → `http://127.0.0.1:5173` (vite dev) + `tauri://localhost` (prod bundle) + optional `http://localhost:49555` (daemon dev echo).
- Bundle identifier → `org.ema.desktop` (already in current `apps/desktop/src-tauri/tauri.conf.json`).
- Remove place.org branding; keep platform-transparency logic verbatim.

### D2 — codebase-place-org-openclaw (client-side companion glue)

See crown-jewel section. Port `popout-launcher.ts` + `companion-bridge.ts` shape into
`packages/surface-core/src/companion-bridge/` (Runtime lane scope). The Desktop Launcher lane
needs to coordinate with Runtime to land this contract.

Handoff request shape (Runtime ← Desktop):

```text
Handoff Requested:
- From lane: desktop-launcher/companion-bridge
- To actor: Runtime Vertical Slice Orchestrator
- Needed: define packages/surface-core/src/companion-bridge/ client with handshake + open-window
  command matching the companion Rust server frame schema.
- Source refs: codebase-place-org-openclaw:docs/superpowers/specs/2026-03-24-companion-app-design.md
  codebase-place-companion:src-tauri/src/protocol.rs
```

### D3 — codebase-superman (runtime status probes)

```text
Useful pattern: check_status returns { active | stale | initializing } + auto-recovery hint.
EMA target: apps/desktop/src-tauri/src/lib.rs — the first-launch "Start EMA daemon?" affordance
  depends on a daemon health probe. This donor specifies the shape.
Action: inspire
Files likely touched: apps/desktop/src-tauri/src/lib.rs (new daemon probe command)
```

### D-REJECT — codebase-executive, dispohub

Both reference Electron. Rejected; the desktop lane is Tauri-only.

---

## Doctrine-pull matrix (docs-* branches)

These branches hold pre-extracted research and wireframes. They belong in `doctrine/research/`
or `docs/vapps/` as absorbed doctrine — not in runtime code.

### DOC1 — docs-place-org-era-research (THE AESTHETIC MANIFESTO)

```text
Donor: origin/docs-place-org-era-research
Key artifact: host/place.org-openclaw/docs/superpowers/specs/2026-03-20-place-org-design.md
Extracts:
- Desktop-as-website, draggable windows, dock, immersive breakouts.
- **Time-of-day color breathing** (5 gradient phases across the day).
- Frosted glass surfaces (backdrop-filter) — maps to existing .glass-* tiers.
- Bioluminescent glow (NOT neon) — teal / slate-blue accents, not saturated.
- Slow ambient motion (mesh, cursor follow).
- Spring easing `cubic-bezier(0.65, 0.05, 0, 1)` — already adopted as --place-ease-smooth.
- 5-minute idle → screensaver; respect prefers-reduced-motion everywhere.
- Calm technology posture (ambient, glanceable, unhurried).
Action: copy (as new doctrine doc)
EMA absorption target: doctrine/design/place-org-ux-manifesto.md (NEW FILE)
Why: User feedback "looks horrible. not the vision" was pointing at this aesthetic. The
  existing styles.css HAS the tokens but no one has codified the POSTURE. This doc is the
  fence against future drift into neon/marketing-SaaS.
```

### DOC2 — docs-host-system-launchpad-hq (Launchpad + HQ + operator loop)

```text
Donor: origin/docs-host-system-launchpad-hq
Key artifacts:
- 2026-04-13-FRONTEND-BUILDOUT-PLAN.md — Phased buildout: F0 (error honesty), F1 (ghost purge),
  F2 (shell redesign with Org/Space/Workstream/Daemon/Me selectors).
- OPENCLAW-DISCORD-VAULT-LOOP.qmd — Human issue → investigation → wiki writeback loop.
- 2026-04-14-ULTIMATE-WIKI-INBOX-CAPTURE.qmd — Wiki consolidation + bootstrapping.
Action: copy (plan) + inspire (loop)
EMA absorption target:
  - doctrine/plans/FRONTEND-BUILDOUT-PHASED.md (NEW) — the F0/F1/F2 sequence.
  - docs/vapps/launchpad.md (NEW) + docs/vapps/hq.md (existing — extend with loop language).
Why: Highest surface-lane relevance of any docs branch.
```

### DOC3 — docs-host-vault-agent-modules-routing (vApp catalog + top-bar spec)

```text
Donor: origin/docs-host-vault-agent-modules-routing
Key artifacts:
- host/EMA-v1.1-Next-Steps/04-CANON/CATALOG.md — 35-entry vApp catalog.
- TS-RUNTIME-GAP-MAP-2026-04-13.md — what was lost TS→Elixir.
- 05-WIKI/TOP-BAR-SPACES-ORGS-SPEC.md — Top-bar design spec.
Action: copy (reconciliation doc)
EMA absorption target: docs/vapps/catalog-reconciliation.md (NEW).
Why: Current mock-projections.ts lists 6 vApp IDs. Donor lists 35. Discrepancy must be
  surfaced, not quietly deleted. Reconciliation doc lists each donor entry → mapped/deferred/
  rejected with reasoning.
```

### DOC4 — design-review-fresh-context (CANONICAL PRODUCT MODEL)

```text
Donor: origin/design-review-fresh-context
Key artifact: 05-fresh-context-project-app-model.md
Extract: Projects → {Organizations, Personal}, Spaces, named vApps (Wiki, Chat,
  Threads/Server, Agent vEnv, Blueprint), Launchpad (start-menu style), HQ (project
  dashboard), Virtual Desktop (main interface), Hermes/Heuristics as shared backbone.
Action: copy (locks the product model)
EMA absorption target: doctrine/product/project-space-org-model.md (NEW) and cross-reference
  into EMA-0.0.5-LANGUAGE-LOCK.md (confirm Projects ⊂ Orgs/Personal; confirm Virtual Desktop
  status as shipping shape).
Why: This is the NEWEST user intent; supersedes ambiguities in older docs. Contains
  highest-level product framing.
```

### DOC5 — docs-ema-next-steps (VERTICAL SLICES + current priorities)

```text
Donor: origin/docs-ema-next-steps
Key artifacts:
- CURRENT-PRIORITIES.md (7-step: freeze truth, object model, CLI↔GUI parity, workstream
  identity, vertical slices, observability, Tier 0 surfaces).
- VERTICAL-SLICES-DRAFT.md (Slices 1–5: control spine, mirrored workstream, shell truth,
  host reality, knowledge→ops).
- 2026-04-13-FRONTEND-BUILDOUT-PLAN.md (overlap with DOC2).
Action: copy (strategy)
EMA absorption target: doctrine/plans/ROADMAP-ALIGNMENT.md (NEW) — cross-references the
  runtime Implementation Roadmap + confirms which slices are landed.
Why: Confirms the surface-lane intake order and lanes untouched.
```

### DOC6–DOC12 — lower-priority docs branches (inventory only)

- `docs-clis-mcps-integrations` — OpenClaw gateway auth patterns (adapt into `docs/harness/identity.md`, medium relevance).
- `docs-frontend-interface-inspirations` — mirror of EMA architecture docs (inspire; cross-check only).
- `docs-host-obsidian-vault` — 6,665-file raw vault (inspire; grep-only, never load whole tree).
- `docs-host-vault-context` — host-vault mirrors + Claude Code plugin notes (inspire; tooling ref).
- `docs-vault-wiki` — user vault snapshots + place.org build session (inspire; structure ref for Wiki vApp).
- `git-history-extracts` — git-history excerpts (inspire; timeline reference).
- `github-legacy-repos` — GitHub repo inventory (inspire; provenance cross-check).

---

## TrajanWJ GitHub repo ring — short inventory

Beyond the repos already mined (TrajanWJ/ema, ema-atlas, place.org, place-companion):

| Repo | Last push | Kind | Donor status | EMA use |
|---|---|---|---|---|
| `agent-os-demo` | 2026-03-20 | Vanilla-JS AI-native OS cockpit, canvas force-graph | donor | Future knowledge-graph vApp; animation lexicon |
| `execudeck` | 2026-01-13 | Zod-contract → generative UI | adjacent | `docs/cli/command-contract-patterns.md` reference |
| `dispohub` | 2026-02-26 | Electron monorepo | reject | Electron rejected; keep only as pattern reference if Tauri blocked |
| `Executive` | 2024-10-15 | Empty placeholder | skip | — |
| `Multi-agent-expirements` | 2024-09-09 | Python multi-agent experiments | skip | Legacy |
| `mentalGPT` | 2024-05-02 | Flask + Langflow chat | skip | Superseded stack |
| `blueprint-media-full-archive` | 2026-01-15 | Archive artifacts | skip | Explicit archive |
| `ema-transfer-pack-20260422-060938` | 2026-04-22 | Earlier transfer pack (pre-095631) | reference | Cross-check alternate architecture notes |
| `caspian-dashboard`, `letmescale`, `luxury-rental-*`, `truk-landing`, `hate-my-brother`, `proslync-*`, `Ebay-Link-Viewer-Nice`, `caspian_dash_render_webhook`, `dispohub` | various | Unrelated products / utilities | skip | — |

Only `agent-os-demo` and `execudeck` are worth a second deep-read. Neither is on the critical path.

---

## Priority intake list per lane

### Runtime Vertical Slice Orchestrator — top 3 to pull next

1. **`codebase-ema`** — port `hermes_client.ex` shape into a Gleam `ema_exec_control` module (the daemon half of the crown-jewel pairing). Adds the execution-vs-canon boundary in code.
2. **`codebase-claudeforge`** — extract `session-manager-hermes.test.ts` invariants into contract tests on `packages/surface-core/src/ipc-client/`.
3. **Define `packages/surface-core/src/companion-bridge/` contract** (per Desktop Launcher handoff request above) — daemon-side of the companion WS protocol.

### Desktop Launcher Correction Orchestrator — top 3 to pull next

1. **`codebase-place-companion`** — copy the four `src-tauri/src/*.rs` files into `apps/desktop/src-tauri/src/` wholesale; adjust origin allowlist and bundle identifier; run `pnpm tauri build` to verify transparency on macOS (watch Tauri issue #13415 workaround stays intact).
2. **`codebase-place-org-openclaw:companion-app-design.md`** — absorb into `docs/architecture/14-companion-bridge.md` (new).
3. **`codebase-superman` `check_status` pattern** — define `apps/desktop/src-tauri/src/daemon_probe.rs` for the first-launch "Start EMA daemon?" affordance.

### Product Surface Donor Orchestrator — top 3 to pull next (beyond Slice A already landed)

1. **Write `doctrine/design/place-org-ux-manifesto.md`** from `docs-place-org-era-research` — the aesthetic fence. This prevents future Surface drift into marketing-SaaS glass.
2. **Extend `EMA-0.0.5-SURFACE-DONOR-MATRIX.md` with 2 rows**: `codebase-place-org-openclaw` (popout/graceful-degradation patterns) and `codebase-execudeck` (trust zones + schema-driven UI). These were missed in the original matrix.
3. **Write `docs/vapps/catalog-reconciliation.md`** from `docs-host-vault-agent-modules-routing` — surfaces the 35-vs-current-vApp-count discrepancy honestly.

### Canon Writers + Codebase Architecture Orchestrators — top doctrine docs to create

1. `doctrine/product/project-space-org-model.md` (from DOC4).
2. `doctrine/plans/FRONTEND-BUILDOUT-PHASED.md` (from DOC2).
3. `doctrine/plans/ROADMAP-ALIGNMENT.md` (from DOC5).
4. `docs/architecture/14-companion-bridge.md` (from crown jewel).

### Workspace Hygiene Orchestrator — organizational follow-ups

1. Add `EMA-0.0.5-RUNTIME-DONOR-MATRIX.md` as an alias pointer to this file's Runtime section, OR fold this file into three separate lane matrices — coordinator call.
2. Cross-link this inventory from `ORCHESTRATOR-INDEX.md` `## Collision Rules` section so every lane lands on it.

---

## Handoff triggers

When a lane needs a donor that crosses its boundary, raise a handoff request using this shape:

```text
Handoff Requested:
- From lane: <lane>/<slice>
- To actor: <other orchestrator>
- Needed: <specific donor or contract>
- Source refs: <path in this inventory>
- Stop condition: <what unblocks from lane>
```

Rather than cross-edit. The ledger at `docs/orchestration/STATUS.md` is the canonical record.

---

## Rejection ledger (cross-cut, inherited from Surface matrix)

- Never make apps/web own durable state (except `layout-artifact.ts` workspace plane).
- Never ship a surface that mutates SQLite directly.
- Never invent agent activity numbers in the UI.
- Never let a mocked control appear real.
- Never copy donor UI substrate (Tailwind v4, shadcn, Zustand, framer-motion, Next 16, Docker, Obsidian vault) into apps/web.
- Never duplicate git-ema's attachment store from See Agent Work.
- Never flatten lanes/missions/campaigns/handoffs into generic "tasks".
- Never import `Organization -> Project -> Space` containment language.
- Never embed the daemon in the Tauri process (Tauri is a client of an independently-running daemon).
- Never resurrect Electron, old Elixir runtime as substrate, or surface-owned canonical state.

---

## How to extend this inventory

When a new donor surfaces:

1. If it's an ema-atlas branch, read `graph/nodes/<branch>.qmd` first.
2. If it's a new TrajanWJ repo, `gh repo view` + sample the README.
3. Classify per donor-rip: copy | adapt | inspire | reject.
4. Identify the owning lane.
5. Add a row to the appropriate section above.
6. If the donor affects more than one lane, add a handoff-trigger note.
7. Update STATUS.md with a one-line mention of the donor addition.
