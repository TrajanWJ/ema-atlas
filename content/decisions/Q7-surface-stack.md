# Decision matrix — Q7 (Surface stack for Launchpad/HQ)

Per-question decision matrix for resolving Q7 in
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md). Follows the shape laid
out in [`content/decision-matrix-template.md`](../decision-matrix-template.md)
verbatim.

> Q7 is **partly answered** already — the atlas itself is Next.js.
> This matrix makes the partial answer explicit and decides whether
> the user surface stack for the daemon (Launchpad/HQ/Virtual Desktop
> running *over* EMA in production) inherits the atlas's choice or
> picks its own.

## Question

`Q7` — `Surface stack for Launchpad/HQ`

(Restated verbatim from [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) Q7.)

The question's stated **blast radius** is "native vs web parity story,
deployment story (Vercel?), shared component library." It surfaces in
[`05-fresh-context-project-app-model.md`](../../05-fresh-context-project-app-model.md)
("native desktop app" and "website like place.org" mentioned without
committing),
[`docs-host-system-launchpad-hq`](../../graph/nodes/docs-host-system-launchpad-hq.qmd)
(the Launchpad/HQ spec lineage), and
[`docs-frontend-interface-inspirations`](../../graph/nodes/docs-frontend-interface-inspirations.qmd).

The atlas (this repo, `app/`) is Next.js 15 + React 19. That's a real
commitment — the user has authored 30+ routes in this stack. The
question below asks: does the **production** user surface
(the Launchpad / HQ / Virtual Desktop users operate EMA through) use
the same stack, a native-first stack, or both.

## Options being weighed

| Option | Short name | One-line description |
|---|---|---|
| Option A | `nextjs-web-only` | Production user surface is Next.js, deployed to Vercel. Same stack as the atlas. No native app. Users get EMA through a browser. |
| Option B | `tauri-native-first` | Production user surface is a Tauri desktop app (inheriting from `codebase-place-companion`). The Next.js code runs inside Tauri, so web parity is near-free. A hosted web deployment is optional. |
| Option C | `nextjs-web-plus-tauri-wrapper` | Next.js web is the primary surface (same as the atlas, same deployment). A Tauri shell optionally wraps it for users who want a native app. The atlas and the production surface share a monorepo. |
| Option D | `phoenix-liveview` | Production user surface is Phoenix LiveView on the Elixir side. Ties the daemon to a Phoenix runtime; breaks the "Gleam/BEAM" framing unless LiveView's Gleam equivalent (Lustre server components per `research/GLEAM_BEAM_FIT.md`) is mature enough. |

## Criteria

| Criterion | Why it matters | A web-only | B native-first | C web+tauri | D liveview/lustre |
|---|---|---|---|---|---|
| Aligns with canonical rule (P1) | Surfaces don't own state | + | + | + | 0 (LiveView is closer-coupled to the daemon — discipline needed) |
| Aligned with atlas already-shipped | Reuses 30+ routes | + (same stack) | 0 (embeds them, but adds new platform) | + (same stack, wrapper extra) | – (full re-implementation) |
| Native desktop integration | Tray, notifications, OS APIs | – (web-only; PWA limits) | + (Tauri exposes OS APIs) | + (in wrapper mode) | – |
| Capability locality (P8) | Per-machine tools/auth | 0 (web can't reach local tools) | + (Tauri can spawn local processes) | + | – |
| Path-parity to atlas | Same lib, same components | + | 0 (can be same, but setup cost) | + | – |
| Deploy story | Vercel ready today | + | 0 (code signing, installers) | + (web side ready; Tauri is extra) | – (Phoenix/Gleam server needs bespoke host) |
| Inherits place.org lineage | UX continuity | 0 (the metaphor is inspired but not the code) | + (place-companion was Tauri; direct continuity) | + (Tauri wrap when needed) | – |
| Gleam-native | Server-side typed with the daemon | 0 (web is TS on the outside) | 0 (same) | 0 (same) | + (Lustre is Gleam) |
| Smallest provable slice | 2-week vertical | + (the atlas **is** this slice) | – (Tauri setup + packaging + signing) | 0 (the wrap is small but not zero) | – (Lustre maturity is the blocker per GLEAM_BEAM_FIT) |
| Reversible | Migrate off cleanly | + (web is portable) | 0 (Tauri is an extra layer; drop is easy) | + (drop wrapper, web continues) | – (LiveView tightly couples server and UI) |

## Costs and bets

### Option A — `nextjs-web-only`
- **Bet:** Web is enough for v0.0.3. The atlas already proves the
  stack works. Capability locality (local tools, local files, native
  notifications) is solved via the daemon's HTTP API, not the surface.
- **Cost:** No native OS integration. Users who want a desktop app
  must wait (or use PWA install, which is limited). The place.org
  "virtual desktop" metaphor is rendered in the browser only, which
  weakens its feel.

### Option B — `tauri-native-first`
- **Bet:** Native is the right home for EMA. `codebase-place-companion`
  already proved the Tauri bridge pattern. A Tauri app can spawn and
  talk to the daemon via localhost, reaching native tools, and still
  serve the same Next.js UI inside.
- **Cost:** Tauri setup (code signing, notarization on macOS, installer
  infrastructure) is non-trivial. Deploying a desktop app requires
  release infrastructure the atlas doesn't need. For v0.0.3 this is
  probably too much; could make sense for v0.1+.

### Option C — `nextjs-web-plus-tauri-wrapper`
- **Bet:** The sensible pragmatic path. Ship web first (same as atlas
  stack, same deployment). Add the Tauri wrapper as an opt-in second
  platform once the web experience is stable. Shared lib, shared
  components; the Tauri layer is just the window shell plus native-API
  bindings.
- **Cost:** We maintain two "platforms" for the same UI. Tauri
  features (e.g. tray, auto-update, local-file pickers) have to be
  stubbed in the web build. The additional complexity is modest but real.

### Option D — `phoenix-liveview` or `lustre-server-components`
- **Bet:** The surface lives on the server in the same BEAM node as
  the daemon. No TS code path; everything is typed end-to-end.
- **Cost:** The atlas is already 30+ Next.js routes. Switching to
  Lustre means rewriting them. `research/GLEAM_BEAM_FIT.md` flags
  Lustre as "v5" and "server components" as promising but not as
  mature as React + RSCs. Breaks reversibility badly if it turns out
  Lustre isn't ready. Phoenix is Elixir, which doesn't fit the
  Gleam-first v0.0.3 framing.

## Open questions this decision creates

- **If B or C**, where do the installers and signing certs live? (CI
  pipeline addition.)
- **If A**, how do users reach local capabilities (Auto-Resolve Gate
  requires local vault access)? — answer: the daemon running on
  localhost, same machine, pipe via the HTTP API.
- **Shared component library** — if C, do atlas and production surface
  share a monorepo workspace (`packages/ui` style)? Or stay separate
  repos with a published package? (Monorepo is simpler for iteration,
  separate repos are cleaner for atlas-vs-product separation.)
- **Atlas stays as "atlas"** or evolves into the production surface
  itself? The user has been blurring this — many atlas routes
  (`/launchpad`, `/hq`, `/chat`, `/wiki`) look like production
  surface previews. When does the atlas become the surface, or stay
  meta-documentation?

## Reversibility plan

- **A → B/C:** Easy. Add Tauri wrapper around existing Next.js.
- **A → D:** Hard. Full rewrite of every route.
- **B → A:** Easy. Drop Tauri layer; web is already there.
- **C → A:** Trivial. Stop shipping Tauri build.
- **C → B:** Moderate. Move Tauri to primary, hide web deploy.
- **D → anything:** Full rewrite.

## Provenance

- [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) Q7 — note explicit
  "now partly answered by atlas Next.js choice."
- [`05-fresh-context-project-app-model.md`](../../05-fresh-context-project-app-model.md)
  — native desktop app + "website like place.org" mentioned but
  uncommitted.
- [`graph/nodes/docs-host-system-launchpad-hq.qmd`](../../graph/nodes/docs-host-system-launchpad-hq.qmd)
- [`graph/nodes/codebase-place-companion.qmd`](../../graph/nodes/codebase-place-companion.qmd)
  (Tauri lineage, with doctrine extracted)
- [`graph/nodes/codebase-place-org.qmd`](../../graph/nodes/codebase-place-org.qmd)
  (Next.js lineage, with doctrine extracted)
- [`research/GLEAM_BEAM_FIT.md`](../../research/GLEAM_BEAM_FIT.md)
  "HTTP / web servers" (mist/wisp/lustre section)
- [`content/vapps/launchpad-deep.md`](../vapps/launchpad-deep.md)
- [`content/vapps/hq-deep.md`](../vapps/hq-deep.md)
- [`content/vapps/virtual-desktop-deep.md`](../vapps/virtual-desktop-deep.md)
- [`howto/deploy-atlas.md`](../../howto/deploy-atlas.md)

## Decision

> **Resolution:** _[leave blank — user fills in when decided]_
> Recorded in: _[link to commit or decision doc]_
> Affects: every `/launchpad`, `/hq`, `/vapps/*` route's long-term fate;
> whether the atlas becomes the production surface or stays meta.

Once the Decision is filled in, follow
[`howto/resolve-an-open-question.md`](../../howto/resolve-an-open-question.md).
If the answer is C, add a new howto playbook `add-a-native-wrapper.md`.

## Cross-references

- [`content/decision-matrix-template.md`](../decision-matrix-template.md)
- [`content/decisions/PRIORITY.md`](PRIORITY.md) — Q7 is Tier 4
- [`howto/deploy-atlas.md`](../../howto/deploy-atlas.md)
- [`content/vapps/virtual-desktop-deep.md`](../vapps/virtual-desktop-deep.md)
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) "What surfaces look like (P1)"
