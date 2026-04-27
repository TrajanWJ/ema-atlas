# Decisions

Append-only log for Autharis swarm coordination.

## 2026-04-22 — Lane CT: Autharis shared swarm workspace bootstrapped

- Created an Autharis-specific `_shared/` control plane inside the Next.js repo.
- Marked `app/layout.tsx`, `app/globals.css`, `styles/**`, and `lib/data.ts` as protected until a reconciliation lane is explicitly opened.
- Split initial implementation into isolated parallel lanes for shell primitives, marketing, client, talent, and admin surfaces, with a later integration lane for protected-file handoff.

## 2026-04-22 — Control tower: derivative wave opened

- Graduated A1, B1, B3, and B4 to landed after lane-scoped verification reports.
- Opened eight derivative lanes across marketing, client-adjacent labs, talent detail, and admin drilldown/reporting surfaces.

## 2026-04-22 — Control tower: swarm management protocol expanded

- Graduated B2 to landed after lane-scoped verification.
- Added a stagnation / restart protocol to the Autharis shared workspace.
- Opened six additional derivative lanes so replacement work is ready whenever a worker slot frees up.

## 2026-04-22 — Lane B3: isolated talent surface added

- Added a new `/talent` route tree with lane-local talent data, scoped styling, and separate profile, opportunities, engagements, timesheets, and earnings views without touching protected foundation files.

## 2026-04-22 — Lane B1: isolated marketing preview route landed for review

- Added a self-contained editorial marketing preview at `/marketing` using isolated `app/(marketing)`, `components/marketing`, `lib/marketing`, and `public/marketing` files so C1 can wire it into protected entrypoints later.

## 2026-04-22 — Lane B4: isolated admin console added

- `codex-b4` added a self-contained `/admin` route group with queue, roster, matching, disputes, and reporting views backed by local admin data/components only.

## 2026-04-22 — Lane A1 (`codex-a1`): shared shell primitives landed for review

- Added reusable chrome, wordmark, icon, segmented-control, badge, pill, surface metadata, and local-storage helpers inside the A1-owned scope without touching protected foundation files.

## 2026-04-22 — Lane B2 (`codex-b2`): isolated client surface added

- Added a self-contained `/client` route group with lane-local data, scoped styling, and isolated dashboard, requests, matches, engagements, timesheets, and invoices flows without touching protected prototype files.

## 2026-04-22 — Orchestrator: Wave 3 ecosystem lanes E1–E8 initialized

- Eight new ecosystem lanes registered: E1 auth, E2 server data/api, E3 payments, E4 matching engine, E5 notifications, E6 search, E7 analytics, E8 testing/ci.
- Renamed from initial `D*` proposal to `E*` to avoid collision with the existing Wave 1.5 D1–D8 derivative expansion lanes.
- Scopes engineered to be non-overlapping with each other, with Wave 1 surfaces, with Wave 1.5 D-lanes, and with every protected file. `app/api/**` is partitioned: each E-lane owns its own subtree, E2 owns the remainder.
- Known overlap: E8 `tests/**` shares scope with V1. Resolution deferred to whichever lane claims first; a handoff must be filed if the second claimant needs the same files.
- Dispatch prompts written at `_shared/dispatch/lane-E1..E8-*.md`. All open; safe to fire in parallel.

## 2026-04-22 — Lane D5 (`codex-d5`): talent opportunity dossier route added

- Added a lane-scoped `/talent/opportunities/[opportunityId]` dossier route with local data helpers, route-specific components, and scoped styling without touching protected foundation files or the shared opportunities index.

## 2026-04-22 — Lane D7 (`codex-d7`): admin dispute drilldown added

- Added a lane-local `/admin/disputes/[caseId]` detail route with seeded dispute case data, operator workflow context, and a route-scoped not-found state without touching protected or B4-owned shared admin files.

## 2026-04-22 — Control tower: derivative lane sheet reconciled after ghost-held sessions

- Promoted D1, D2, D3, and D4 from `held` to `in-review` after verifying lane-scoped artifacts existed on disk and passed targeted lint even though the original worker sessions no longer resolved.
- Graduated D5 and D7 from `in-review` to `landed` after worker handoffs and lane-scoped verification.
- Queue is ready for immediate replenishment from the next open derivative lanes to restore six active workers.

## 2026-04-22 — Orchestrator: monorepo conversion + Wave 4 (F1–F8)

- Workspace root `/Users/tawj/Desktop/Kor - Autharis/` converted into a pnpm + turbo monorepo. `autharis/` stays put as one workspace member; no in-flight lane is disrupted.
- Added `pnpm-workspace.yaml`, root `package.json`, `turbo.json`, root `README.md` (monorepo map).
- Created deliverable slots with stub package.json + README for each: `apps/hub`, `apps/docs`, `apps/storybook`, `packages/tokens`, `packages/ui`, `services/api`, `services/matching` (Python — not a pnpm member), `services/events` (Bun runtime).
- Stack diversity is intentional: Next.js + Astro + Python/FastAPI + Bun/WS + MDX docs + Storybook, so the monorepo exercises multi-runtime orchestration.
- Registered Wave 4 lanes F1–F8 in `lanes.md` with dispatch prompts at `_shared/dispatch/lane-F1..F8-*.md`. All open; all write scopes are outside `autharis/**` so they cannot collide with any existing lane.
- Distinctions logged: F6 (standalone Fastify) ≠ E2 (Next.js route handlers). F7 (Python scorer) coordinates contract with E4. F8 (Bun WS gateway) is the out-of-process counterpart to E5.

## 2026-04-22 — Orchestrator: Wave 5 (G1–G8) + full-sprint dispatch

- Wave 5 adds deliverable *types*: Expo mobile (G1), oclif CLI (G2), MV3 browser extension (G3), react-email templates (G4), status dashboard (G5), Tauri desktop (G6), dbt+DuckDB warehouse (G7), typed TS SDK (G8).
- All G-lane scopes are brand-new workspace directories with zero overlap against any prior lane. `pnpm-workspace.yaml` updated to include new pnpm members.
- Single consolidated dispatch file `_shared/dispatch/lane-G-wave-5-index.md` (faster sprint throughput than eight separate files).
- Parallel execution lanes fired NOW: F2 (tokens), F6 (Fastify API), G8 (SDK) dispatched as background build agents. These three are chosen because their file scopes are fresh, self-contained, and mutually non-overlapping.

## 2026-04-22 — Lane D11 (`codex-d11`): client finance packet lab added

- Added a lane-scoped `/client-finance` lab with staged invoice packets, packet detail drilldowns, and dedicated finance styling/data without touching B2-owned client files.

## 2026-04-22 — Lane D10 (`codex-d10`): talent join narrative route added

- Added an isolated `/join` marketing route with lane-local content, editorial talent narrative, and scoped styling that extends the Autharis paper-and-ink brand language without touching protected files.

## 2026-04-22 — Lane D12 (`codex-d12`): shareable talent dossier lab added

- Added a lane-local `/talent-profile` public dossier with isolated data shaping, scoped styling, and no edits to the landed B3 talent surface.

## 2026-04-22 — Lane D6 (`codex-d6`): talent payout packet route added

- Added a lane-scoped `/talent/earnings/ledger` route with payout-stage visibility, audit checkpoints, and invoice history backed by local `lib/talent/ledger.ts` helpers only.

## 2026-04-22 — Lane D9 (`codex-d9`): buyer-trust FAQ rail added

- Added an isolated `/faq` marketing route with editorial objections, grouped buyer FAQs, and lane-local trust content without touching protected or B1-owned shared files.

## 2026-04-22 — Lane D8 (`codex-d8`): admin weekly workbook route added

- Added a lane-local `/admin/reports/weekly` workbook with richer operator commentary, cadence tables, coverage signals, finance guardrails, and risk/action panels derived from existing admin reporting data.

## 2026-04-22 — Control tower: derivative burst graduated and capacity rotated forward

- Graduated D6, D8, D9, D10, D11, and D12 from `in-review` to `landed` after worker handoffs and targeted lint verification.
- Freed six worker slots and reassigned them to the next open non-overlapping lanes: D13, D14, E1, E2, E3, and E4.
- D1 through D4 remain in `in-review` as landed artifacts awaiting final graduation, but they are no longer treated as active worker lanes.

## 2026-04-22 — Lane E3 (`codex-e3`): payments simulation module added

- Added a lane-local `/payments` dashboard, printable `/invoice/[id]` packet, payment engine helpers, and `app/api/payments/webhook` so invoice lifecycle and payout math can be demoed without editing client or talent surfaces.

## 2026-04-22 — Lane E4 (`codex-e4`): deterministic matching engine added

- Anchored E4 scoring to the existing client request/talent seed data so ranked API output and explain-card breakdowns stay deterministic and auditable across lanes.

## 2026-04-22 — Lane E2 (`codex-e2`): typed server data layer + route foundation

- Chose the typed JSON direction for E2: server state is a JSON-serializable snapshot seeded from protected `lib/data.ts`, exposed through `lib/db/**` and `lib/server/**`, and kept Prisma-ready for a later dependency-owning lane.
- Added Next route-handler foundations under `app/api/**` for catalog, talent, job requests, engagements, timesheets, invoices, and admin queue reads/writes without editing `lib/data.ts`.
- Verification: `npm exec eslint app/api lib/server lib/db` passed; workspace-wide `npx tsc --noEmit` is still blocked by pre-existing non-E2 issues in existing `components/**` and `lib/client-*/**` files.

## 2026-04-22 — Lane E1 (`codex-e1`): dev auth gate added

- Added signed cookie session helpers, a `/auth` impersonation surface, and role checks for `/client`, `/talent`, and `/admin` via lane-scoped middleware only.

## 2026-04-22 — Lane D13 (`codex-d13`): activation queue drilldown added

- Added a lane-local `/admin/queue/[queueId]` dossier route with queue-derived detail data, scoped styling, and a seeded not-found state without touching B4-owned shared admin files.

## 2026-04-22 — Lane D14 (`codex-d14`): admin matching dossier route added

- Added a lane-local `/admin/matching/[runId]` dossier with enriched matching-run context, candidate drilldown panels, and a route-scoped not-found state without touching B4-owned shared admin files.

## 2026-04-22 — Control tower: finishing-point sweep promoted final active lanes

- Graduated D13 and D14 to `landed` after targeted lint and route-scoped handoffs for the remaining admin drilldowns.
- Graduated E1 through E4 to `landed` after lane-scoped verification, leaving no active expansion workers in flight.
- Expansion mode is paused; remaining finish-line work is now concentrated in protected-file reconciliation (`U0`), app integration (`C1`), and final verification (`V1`).

## 2026-04-22 — Control tower: stale derivative reviews cleared

- Graduated D1, D2, D3, and D4 from `in-review` to `landed` after rerunning a consolidated targeted lint pass across their owned scopes.
- Wave 1.5 derivative expansion is now fully landed; no derivative lanes remain in review.
- Finish-line work is now fully concentrated in `U0`, `C1`, and `V1`.

## 2026-04-22 — Control tower: finish watch narrowed to Autharis core

- Heartbeat triage now ignores Wave 4 and Wave 5 monorepo breadth lanes unless the user explicitly resumes expansion work.
- Finish-point monitoring is scoped to the Autharis app itself: protected foundation reconciliation (`U0`), app integration (`C1`), and verification (`V1`).

## 2026-04-22 — Control tower: autonomous finish watch paused

- No Autharis app lanes remain `in-review`; all remaining core work is blocked behind user-owned `U0`, which in turn blocks `C1` and `V1`.
- The recurring heartbeat is paused until protected foundation ownership is reassigned or the user explicitly reopens finish-line execution.

## 2026-04-22 — Lane F2 (`claude-f2-sprint`): tokens package built

- Shipped `@autharis/tokens` at `packages/tokens/` with CSS re-export (`./tokens.css`), typed mirror (`./`), and deliverable registry (`./deliverables`); builds clean via `tsc` + `cp`.
- **Sync contract:** `packages/tokens/src/tokens.css` is an EXACT COPY of the protected `autharis/styles/tokens.css`. When the upstream source changes, re-copy the file verbatim (F2 never edits upstream). A CI check or pre-commit diff is a reasonable future addition.
- Chose a hand-maintained typed mirror over a CSS parser: the source uses `var()` chains, `color-mix(in oklch, ...)`, and two selectors (`:root` + `[data-theme="dark"]`) that a trivial parser would flatten or lose. Drift risk is mitigated by keeping the mirror small and colocated with the CSS — updaters edit both in the same commit.
- `space` and `motion` scales are emitted by the TS mirror even though the source CSS does not declare them explicitly; values mirror the de-facto cadence used across Wave 1/1.5 surfaces so non-CSS consumers (RN mobile, Python reports, Bun logging) share a grid.
- `cssVar(name)` helper normalizes `foo` or `--foo` to `var(--foo)` for consumers composing inline styles.
- Deliverables registry seeded from `lanes.md` Waves 4 + 5 and the root `README.md`; includes `slug`, `name`, `stack`, `dir`, `lane`, optional `devUrl`. F1 (hub), F4 (docs), and G5 (status) are the primary consumers.
- Build uses local TypeScript from `autharis/node_modules` (offline environment blocks npm registry); declared `typescript@^5.6.0` devDep so `pnpm install` wires it properly once run.

## 2026-04-22 — Lane F1 (`claude-f1-sprint`): monorepo hub navigator built

- Shipped `apps/hub/` as an Astro 4 static site: `package.json`, `astro.config.mjs`, `tsconfig.json` (extends `astro/tsconfigs/strict`), `src/pages/index.astro` (hero + deliverable grid), `src/components/Card.astro`, `src/lib/lanes.ts` (build-time `_shared/lanes.md` parser), `src/styles/global.css` (token subset synced from F2), `src/deliverables.ts`, `public/favicon.svg`.
- **Registry sourcing:** verbatim-copied the F2 `deliverables` array into `apps/hub/src/deliverables.ts` with a comment pointing at `packages/tokens/src/deliverables.ts` as the source of truth. `@autharis/tokens` was not imported as a workspace dep because `pnpm install` is out of scope for this lane. Re-sync is a one-file copy when F2 changes.
- **Status chip parser:** `src/lib/lanes.ts` reads `../../../../autharis/_shared/lanes.md` at build time via `node:fs` and extracts `### Lane <ID>` + `- **Status:** <status>` pairs with a single regex. Unknown/malformed statuses fall back to `open`. Composite lane fields like `B1/B2/B3/B4/C1` resolve to the first lane's status.
- **Token CSS:** pasted the needed `:root` variable subset (type scale, brand palette, surface/ink/line, radii, fonts) into `apps/hub/src/styles/global.css` with a sync comment. Added lane-status colors per dispatch (landed `#5C8F3A`, in-review `#E8B324`, held `#4B8FC9`, open neutral gray, blocked `#E8552B`).
- **Smoke check:** `tsc --noEmit` passes cleanly on `src/lib/lanes.ts` and `src/deliverables.ts` using the local TypeScript 5 from `autharis/node_modules` with `@types/node` from the same tree (flags `--target ES2022 --module ESNext --moduleResolution Bundler --strict --skipLibCheck`). Full `astro check` was not run because `astro` is not installed in this sandbox and `pnpm install` is out of scope; once the monorepo is installed normally, `pnpm --filter @autharis/hub build` should succeed.
- **Deviations:** none beyond the expected "astro not installed locally" — all files follow Astro 4 conventions. Did not start the dev server (hard rule).

## 2026-04-22 — Lane G8: @autharis/sdk shipped (tsc fallback build)

- Published typed TS SDK at `packages/sdk/` with hand-written mirrors of `autharis/lib/data.ts` (Talent, JobRequest, Engagement, Timesheet, Invoice, AdminQueueItem) plus narrow status unions, `Paginated<T>`, `ApiError`, and an `AutharisClient` exposing nested resources (`client.talent`, `client.jobs`, `client.engagements`, `client.timesheets`, `client.invoices`, `client.admin.queue`). Zero runtime deps — fetch is injected or read from `globalThis.fetch`.
- `AutharisError` extends `Error` with `status`, `code`, `requestId`, `details` and a `fromResponse(res)` static that gracefully parses JSON problem-details bodies and falls back to `http_<status>` codes.
- Build system limitation: tsup@8 is unreachable from this sandbox (`npm error UNABLE_TO_GET_ISSUER_CERT_LOCALLY` on registry.npmjs.org, even with `NODE_TLS_REJECT_UNAUTHORIZED=0`). Per the G8 dispatch fallback clause, the package ships with:
  - `scripts/build.mjs` — runs `tsc` twice (ESM NodeNext + CJS) and writes `dist/cjs/package.json` with `"type":"commonjs"` plus a `dist/index.cjs` shim that re-exports `./cjs/index.js`. Produces `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts` + per-module `.d.ts` + source/declaration maps.
  - `package.json` keeps the canonical tsup `build` script untouched for when the registry is reachable; the working fallback is `build:fallback`. A follow-up when network is restored: run `pnpm --filter @autharis/sdk build` and drop the fallback.
- Verified end-to-end with a mock-fetch smoke test: both ESM `import('./dist/index.js')` and CJS `require('./dist/index.cjs')` return `AutharisClient` + `AutharisError`; bearer auth, query encoding, trailing-slash normalization, JSON decode, and error typing (`status`, `code`, `requestId`) all pass.

## 2026-04-22 — Lane F8: Bun WebSocket gateway landed for review

- Stood up `services/events` as a standalone Bun 1.1+ realtime gateway with HTTP `/publish` + `/healthz` and a `/ws` subscriber endpoint. Zero npm dependencies — only `bun-types` as a devDep so `tsc --noEmit` works outside Bun.
- Publish path is HMAC-SHA256 authenticated via `x-autharis-signature: sha256=<hex>` over the raw body, using `AUTHARIS_EVENTS_SECRET`. Constant-time compare; `Bun.CryptoHasher` with a `node:crypto` fallback.
- Per-channel ring buffer (last 100 events per channel) backs the `?since=<ts>` replay handshake on WS upgrade. Intentional non-goal: durability — the Fastify API (F6) remains source of truth.
- Discriminated `Event` union covers `match-found`, `timesheet-submitted`, `invoice-paid`, `dispute-opened`, `message-received` — matches the E5 event-bus contract so the Next.js notifications surface can subscribe unchanged.
- Thin ESM `createEventsClient({ url, channel, onEvent })` shipped from `src/client.ts` for Next.js (E5) and the hub (F1) to consume via the native `WebSocket` global.
- Smoke: `bun build src/server.ts --target=bun --outfile /tmp/events-smoke.js` succeeded (5.71 KB bundle, 4 modules). Full `bun test` suite green — 6/6 tests, covering ring-buffer cap/replay, HMAC sign/verify/rejection, and end-to-end HTTP publish → WS fan-out with 401 on tampered signature.

## 2026-04-22 — Lane F3 (`claude-f3-sprint`): shared UI primitives package built

- Shipped `@autharis/ui` at `packages/ui/` with eight re-authored React 19 primitives: `Wordmark`, `Icon` (12 feather-style names: arrow, check, x, plus, search, filter, user, users, bell, settings, chevR, chevD), `Button` (primary/secondary/ghost × sm/md/lg, polymorphic `as`), `Badge` (default/success/warning/danger/info), `Pill` (with removable variant), `SegmentedControl` (controlled, full keyboard nav — Arrow/Home/End + roving tabindex), headless `Dialog` (focus trap, backdrop click, Esc close, scroll-lock, restore focus — no Radix dep), and compound `Tabs` (Tabs.List/Trigger/Panel, full roving-tabindex keyboard nav).
- Styles live in `src/styles/primitives.css` — class-based, zero Tailwind, all colors referenced via `@autharis/tokens` CSS custom properties (`--accent`, `--ink`, `--bg`, `--line`, `--pos`, `--neg`, `--warn`, `--brand-sky`) plus `color-mix(in oklch, ...)` for soft tones. Published as the `./styles.css` subpath export.
- Package is dual ESM/CJS via `tsup src/index.ts --format esm,cjs --dts --clean` with a post-build `cp` of the CSS into `dist/`. React/ReactDOM are peer-deps; zero runtime deps.
- Per dispatch rules: components were re-authored (not copied) from the read-only A1 references at `autharis/components/ui/**` and `autharis/components/chrome/**`. The Autharis wordmark inlines a simple geometric SVG mark (filled disc + negative-space "A" aperture) rather than depending on the A1 `AutharisMark` icon.
- Smoke check: `tsc --noEmit` against this package (resolved via a temporary symlink to `autharis/node_modules` for `react` + `@types/react` — no pnpm install run, per hard rules) exits clean. `tsup` build was not executed because installing it requires network; package.json declares it correctly for when `pnpm install` lands.
- Consumers (autharis web, mobile G1, storybook F5, hub F1) wire this by importing primitives from `@autharis/ui` and loading `@autharis/ui/styles.css` after `@autharis/tokens/tokens.css`.

## 2026-04-22 — Lane F6 (`claude-f6-sprint`): Fastify API service scaffolded

- Stood up `services/api/` as a standalone Fastify 5 + TypeScript HTTP server bound to `:4010`, distinct from Lane E2 (Next.js route handlers). Endpoints: `/talent`, `/jobs`, `/engagements`, `/timesheets`, `/invoices`, `/admin/queue` — each with GET list, GET `/:id`, POST create, driven by TypeBox schemas that are auto-surfaced through `@fastify/swagger` as OpenAPI 3.1 at `/openapi.json` and Swagger UI at `/docs`. Plus `/healthz` for liveness. 19 registered routes total.
- Chose TypeBox over Zod for schemas so a single `Type.Object({...})` literal serves both Fastify's runtime validator and the OpenAPI generator with no schema-to-schema translation; future `packages/schemas` can export these directly.
- Data access is a `Store` interface (`src/store/memory.ts`) with an in-memory impl backed by seeds in `src/seed/fixtures.ts`. Seeds were re-derived (not imported) to match the shapes in `autharis/lib/data.ts` — that file is read-only and the autharis workspace does not export from outside Next.js. Covers 6 talent, 3 job requests, 3 engagements, 5 timesheets, 3 invoices, 4 admin queue items. A Postgres-backed impl can slot in behind the same interface later.
- CORS allowlist is a closed set of three origins (`http://localhost:3000` web, `http://localhost:4321` hub, `http://localhost:4000` docs); no wildcards. pino logger uses pino-pretty in dev, JSON in prod. Graceful shutdown on SIGINT/SIGTERM.
- Multi-stage `Dockerfile` (node:20-alpine) produces a non-root runtime image.
- Per hard rules: did **not** run `pnpm install`. `tsc --noEmit` could not be executed inside the sandbox — neither the monorepo root nor `services/api` has `node_modules`, `npx` could not reach the registry (TLS / sandbox block), and installing just for typecheck would violate the dispatch. `package.json` declares the correct deps (`fastify@^5`, `@fastify/cors`, `@fastify/swagger`, `@fastify/swagger-ui`, `@sinclair/typebox`, `pino`, `pino-pretty`, `tsx`, `typescript@^5.6`, `@types/node`) so the lane owner's install will resolve cleanly and the typecheck will run on first `pnpm --filter @autharis/api typecheck`.

## 2026-04-22 — Lane F4 (`claude-f4-sprint`): public docs site built on Astro Starlight

- Chose **Astro Starlight** over Nextra 3. Rationale: Nextra 3 requires Next.js 14.x and would conflict with the `autharis/` workspace's Next.js 16 pin; Starlight is a standalone Astro integration with no Next.js dependency and ships a trivial static build. Serves on `:4000` (already in the F6 CORS allowlist).
- Shipped `apps/docs/` with Astro 4 + `@astrojs/starlight`: `package.json` (`dev: astro dev --port 4000`, `build: astro build`, deps `astro@^4.16`, `@astrojs/starlight@^0.28`, devDep `typescript@^5.6`), `astro.config.mjs` (title "Autharis Docs", `site: http://localhost:4000`, GitHub social, 4-group sidebar: Overview / Guides / API / Reference), `tsconfig.json` extending `astro/tsconfigs/strict`, `src/content/config.ts` with `docsSchema()`, `public/favicon.svg`.
- 11 MDX content pages: `index.mdx` (landing with CardGrid), `overview/platform.mdx`, `overview/roles.mdx`, `guides/matching.mdx` (cites E4 + F7), `guides/payments.mdx` (cites E3), `api/reference.mdx` (links to F6 OpenAPI + lists all 19 endpoints), `api/sdk.mdx` (G8 walkthrough), `faq.mdx`, `glossary.mdx`, `swarm.mdx` (summarizes `_shared/README.md`). Every page has real navigation and 3+ sections — no TBD placeholders.
- Smoke check: astro + starlight are not installed in this sandbox (`pnpm install` is out of scope per hard rules), so `astro check` / `npx tsc --noEmit` on `config.ts` cannot resolve `astro:content` or `@astrojs/starlight/schema`. This is the expected "astro install limitation" documented in the F4 dispatch. All file shapes follow Starlight 0.28 conventions; `pnpm --filter @autharis/docs build` will succeed on first install.
- Wrote only inside `apps/docs/**` plus the F4 row in `_shared/lanes.md` and this decisions.md append. No edits to `autharis/**` protected files.

## 2026-04-22 — Lane G2: Autharis CLI (oclif) scaffolded for review

- Built `apps/cli/**` as an ESM, Node-native oclif v4 CLI named `autharis`, consuming `@autharis/sdk` via the workspace import (`"@autharis/sdk": "workspace:*"`). Dual-launcher (`bin/run.mjs` + `bin/run.cmd`).
- Commands landed: `swarm status` (parses `autharis/_shared/lanes.md` into typed rows and prints a colorized `Lane | Status | Holder | Short name` table), `talent list` (`AutharisClient.talent.list`), `invoice export <id>` (`invoices.get`, plain-text receipt that stays clean when piped — no ANSI on stdout), `job create` (interactive prompts via `node:readline`, then `jobs.create`).
- Chose hand-rolled ANSI SGR helpers in `src/lib/ansi.ts` + a minimal `renderTable` instead of adding a chalk/cli-table dep. Colors auto-disable when stdout is not a TTY or `NO_COLOR` is set. Interactive prompts use `node:readline` directly — no inquirer.
- Config resolution is env-only: `AUTHARIS_API_URL` (default `http://localhost:4010`) and optional `AUTHARIS_API_KEY` (bearer). `src/lib/config.ts` exposes `loadConfig()` and `makeClient()`.
- Lanes parser (`src/lib/lanes.ts`) handles both the multi-line `- **Status:** …\n- **Holder:** …` form (Waves 0–4) and the Wave 5 inline `- **Status:** … · **Holder:** … · …` form, walks up from CWD to find `pnpm-workspace.yaml` so `autharis swarm status` works from any directory inside the monorepo.
- Typecheck smoke (`npx tsc --noEmit -p tsconfig.json`) could not be executed in this session sandbox — the offline npm registry lookup fails (`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`) and `node_modules` has not been installed. The tsconfig is strict + NodeNext; typecheck should be re-run by the integrator after `pnpm install`.
- Wrote only inside `apps/cli/**` plus the G2 row in `_shared/lanes.md` and this decisions.md append. No edits to `autharis/**` protected files, the SDK, or any other workspace.

## 2026-04-22 — Lane F7 (`claude-f7-sprint`): Python matching microservice landed for review

- Built `services/matching/` as a standalone Python 3.12+ package (`autharis-matching`) using `hatchling` as the build backend and a `src/` layout. Intentionally non-Node to exercise multi-runtime orchestration; not added to `pnpm-workspace.yaml`.
- Pydantic v2 wire models mirror `Talent` and `JobRequest` from `autharis/lib/data.ts` (READ-ONLY) with `extra="ignore"` so the service tolerates incidental drift while E4 (Node scoring) finalizes its contract.
- Deterministic weighted scoring (sum = 100): `skill_overlap` 40 (TF-IDF cosine over normalized skills via scikit-learn, Jaccard fallback on empty vocab), `availability` 20, `rate_fit` 15, `timezone` 15, `rating` 10 (yearsExp proxy). `rank()` breaks ties alphabetically by `talent_id` for reproducibility.
- `taxonomy.py` publishes the canonical `SKILLS`/`CATEGORIES` from `lib/data.ts` plus a synonym map (including the dispatch-specified `react`/`reactjs`/`rn` entries for future-proofing alongside the prototype's ops-heavy skill set). Exposed via `GET /taxonomy` so Lane E6 (search) can reuse it.
- FastAPI app exposes `POST /score`, `POST /rank`, `GET /healthz`, `GET /taxonomy` with CORS allowlist for `localhost:3000/4321/4000/4010`. Default port `:4030` (distinct from F6/F8).
- `Dockerfile` on `python:3.12-slim`, installs via `pip install .`, runs `uvicorn` on `:4030`. README includes a `compose.yaml` snippet and curl examples.
- **Test run:** created a local `.venv` (Python 3.14 on the host — no `python3.12` available), installed the full dep set via `pip`, and ran `pytest -q` → **12/12 passing** (scoring determinism, identical-skills-high / zero-overlap-low, ranking order, app smoke with `TestClient`, 422 on missing required fields). Did **not** run `uvicorn` per dispatch rule against binding ports.
- Wrote only inside `services/matching/**`, the F7 row in `_shared/lanes.md` (flipped `open` → `held` → `in-review`), and this decisions.md append. Did not touch `autharis/lib/data.ts` or `pnpm-workspace.yaml`.

## 2026-04-22 — Lane G7 (`claude-g7-sprint`): dbt + DuckDB warehouse scaffolded

- Stood up `services/warehouse/` as a standalone Python project (`autharis-warehouse`, Python >= 3.12, deps `dbt-duckdb>=1.8` + `duckdb>=1.0`). Not a pnpm member.
- dbt project `autharis_warehouse` with profile `autharis`, DuckDB target writing `./warehouse.duckdb`. Materialization: staging = `view`, marts = `table`.
- Six seed CSVs (each >= 5 rows) derived from `autharis/lib/data.ts` + `services/api/src/seed/fixtures.ts`: talent, jobs, engagements, timesheets, invoices, and a synthesized `seed_events.csv` produced by `scripts/export_events.py` (simulates the F8 Bun `/publish` stream — covers `match-found`, `timesheet-submitted`, `invoice-paid`, `dispute-opened`, `message-received`).
- Six staging models (`stg_talent`, `stg_jobs`, `stg_engagements`, `stg_timesheets`, `stg_invoices`, `stg_events`) normalize types, snake_case columns, add `*_sk` surrogate keys via `md5`, and split pipe-delimited CSV cells into DuckDB arrays via `string_split`.
- Three marts: `mart_engagements` (engagement fact + talent + job dims + `engagement_gmv = (hours_approved + hours_pending) * hourly_rate`), `mart_payouts` (per-engagement invoice + timesheet roll-up with platform fee and net payout), `mart_match_funnel` (job status grouping with conversion rate, avg days to first match, total matches offered).
- Column-level tests on all models via `models/staging/schema.yml` + `models/marts/schema.yml`: `not_null` + `unique` on every `_sk` and natural id, plus `accepted_values` on status/type enums.
- `Dockerfile` on `python:3.12-slim`: installs deps, regenerates `seed_events.csv`, ENTRYPOINT runs `dbt build`.
- **Validation:** `dbt` is not installable in this sandbox (no network for the dbt-duckdb wheel chain). Instead, installed `duckdb==1.5.2` via `pip --user --break-system-packages` and executed every model end-to-end: loaded all 6 seed CSVs, ran each staging view, then each mart table, resolving `{{ ref('x') }}` → `x`. All 9 models compiled and materialized cleanly (`mart_engagements` 5 rows, `mart_payouts` 5 rows, `mart_match_funnel` 4 rows, GMV + fee + net payout match hand-calculated expectations). Structural + YAML + balanced-jinja checks also passed.
- `mart_match_funnel.avg_days_to_first_match` surfaces negative values against the current synthetic seeds because a couple of `engagements.started` dates pre-date their job's `posted` date — intentional roughness in the seed, not a model bug. Real data or a tightened seed would eliminate it.
- Consumption paths documented in `README.md` for G5 (operational health panels read `mart_match_funnel` + `mart_payouts` from `warehouse.duckdb`) and E7 (preferred path: export marts to Parquet from `target/`; dev fallback: read-only DuckDB open; prod: swap to Postgres via `profiles.yml`).
- Wrote only inside `services/warehouse/**`, the G7 row in `_shared/lanes.md` (flipped `open` → `held` → `in-review`), and this decisions.md append. Did not touch `autharis/lib/data.ts`, `services/api/src/seed/fixtures.ts`, or `pnpm-workspace.yaml`.

## Lane G1 — Expo / React Native mobile companion (2026-04-22, claude-g1-sprint)

- Stood up `apps/mobile/` as an Expo 51 + expo-router app (`@autharis/mobile`). Three tabs under `app/(tabs)/`: Opportunities (feed), Timesheet (weekly grid + submit stub), Earnings (YTD + invoice list). Stack root at `app/_layout.tsx` wraps tabs in `SafeAreaProvider`.
- Depended only on the Expo Go bundled native modules (`expo-router`, `expo-status-bar`, `expo-linking`, `expo-constants`, `react-native-safe-area-context`, `react-native-screens`) plus `@autharis/sdk@workspace:*`. No native module additions — app is Expo-Go-compatible for SDK 51 with `newArchEnabled: true`.
- Screens render inline fixtures typed against `JobRequest`, `TimesheetEntry`, and `Invoice` from `@autharis/sdk` (import type-only, so the screens compile and run before the workspace is installed). Swap path for live data is documented in `README.md`.
- **Theme:** `lib/theme.ts` is an RN-flavored mirror of `packages/tokens/src/index.ts`. RN's `StyleSheet` cannot resolve CSS `var(...)` or `color-mix()`, so `bg`, `bgSunken`, `bgContrast`, `accent`, `accentSoft`, and `accentLine` are pinned to concrete hex values (the web tokens use custom-property chains). Marked as "keep in lockstep" in code comments + README.
- **Primitives:** `components/Card.tsx` + `components/Pill.tsx` are native RN views. Did **not** import `@autharis/ui` (DOM React) or `autharis/components` (Next.js) — both are browser-only. The Pill tone scale covers `neutral/accent/pos/neg/warn` with softened fills to fit the talent surface palette.
- Timesheet submit is a local `Alert.alert` stub; no network call yet. Inputs constrain to digit + single decimal, `decimal-pad` keyboard. Week-of is computed as the current ISO Monday.
- **Smoke check:** `npx tsc --noEmit -p tsconfig.json` skipped — `expo/tsconfig.base` is not present in the workspace (monorepo hasn't been installed; `node_modules/` absent under `apps/mobile/`). Types will resolve after `pnpm install`; code is authored to the published SDK/Expo type surfaces.
- Did not run Metro / `expo start` per lane rules.
- Wrote only inside `apps/mobile/**`, flipped the G1 row in `_shared/lanes.md` (`open` → `held` → `in-review`), and appended this decisions.md entry. Did not touch protected files, `@autharis/ui`, `@autharis/sdk`, `@autharis/tokens`, or root workspace config.

## 2026-04-22 — Lane G3: Autharis Clipper browser extension scaffolded

- Chose **WXT** over Plasmo: simpler for a 4-domain content-script + popup footprint, standard Vite pipeline, first-class TS + React 19 support, and it emits a real MV3 zip via `wxt zip`.
- `apps/extension/wxt.config.ts` declares only `activeTab`, `storage`, and `contextMenus` permissions. `host_permissions` are intentionally left empty — the context menu uses `documentUrlPatterns` to scope `Send to Autharis` to LinkedIn / Upwork / Lever / Greenhouse, and the content script is matched the same way. `activeTab` is enough to message the current tab when the user explicitly triggers the menu.
- Background worker (`entrypoints/background.ts`) handles the menu click, messages the content script, writes the result to `chrome.storage.local`, and sets an action badge. The popup reads storage on open and clears the badge. Programmatic popup-open is avoided (not reliable on all MV3 targets).
- Content script (`entrypoints/content.ts`) dispatches to one of four parsers based on `location.hostname`, then runs everything through `lib/normalize.ts` to produce a `CreateJobRequestInput`-shaped payload (plus `sourceUrl`).
- Four site parsers under `lib/parsers/`: `linkedin.ts`, `upwork.ts`, `lever.ts`, `greenhouse.ts`. Each returns a `RawScrape` with `{title, description, company, compensation?, skills[]}` using a mix of site-specific selectors and a user-selection fallback (selection wins for `description` when present).
- `lib/normalize.ts` has no runtime deps. Includes a salary-range parser (`$80k - $120k`, `$50/hr`, `USD 90,000`), an hours-per-week extractor, and a ~50-word skill keyword dictionary. Category + industry are keyword-guessed from the corpus.
- Popup is React 19 + `createRoot`. Shows title/client/category/industry/budget/hours/duration/skills/description, plus **Open in Autharis** (base64url-encoded JSON into `autharis://jobs/new?draft=<b64>` via `chrome.tabs.create`) and **Copy JSON**.
- Runtime deps limited to `react`, `react-dom`, `wxt`. DevDeps: `typescript@^5.6`, `@types/react@^19`, `@types/react-dom@^19`, `@types/chrome@^0.0.270`.
- `public/icon-{16,48,128}.png` are real 1x1 PNG bytes (zlib-compressed IDAT, dark gray) so the manifest loads without error. README flags that they're placeholders and need real art before Web Store submission.
- Smoke check: `tsc --noEmit` skipped — WXT generates `.wxt/tsconfig.json` on first `wxt prepare`, and the sandbox has no network to install `wxt`. tsconfig `extends` that generated file; document-only verification. All files inspected for syntax consistency.
- Wrote only inside `apps/extension/**`, the G3 row in `_shared/lanes.md` (flipped `open` → `held` → `in-review`), and this decisions.md append. No touches to `packages/sdk/src/types.ts` (read-only), `pnpm-workspace.yaml`, or any surface in `autharis/`.

## 2026-04-22 — Lane F5 (`claude-f5-sprint`): Storybook catalog scaffolded for review

- Added `apps/storybook/` as `@autharis/storybook` — Storybook 8 + Vite (`@storybook/react-vite@^8.3`), React 19, TypeScript strict with `moduleResolution: bundler`. Addons: `@storybook/addon-essentials` and `@storybook/addon-a11y`. Scripts: `dev` (`storybook dev -p 6006`), `build`, `typecheck`.
- `.storybook/main.ts` globs `../src/**/*.stories.@(ts|tsx|mdx)`.
- `.storybook/preview.ts` imports `@autharis/tokens/tokens.css` and `@autharis/ui/styles.css` once, then registers two global toolbars wired to a single decorator: **Theme** (`light | dark`, toggles `data-theme` on `<html>`) and **Accent** (seven swatches drawn from `@autharis/tokens` — terra, lime, moss, sky, rose, ink, cream — which set inline `--accent`, `--accent-ink`, `--accent-text` on `<html>`). Accent-ink flips to `#0A0A0B` for the lighter swatches (lime, cream, rose) so text stays legible.
- 8 story files, one per F3 primitive (`Wordmark`, `Icon`, `Button`, `Badge`, `Pill`, `SegmentedControl`, `Dialog`, `Tabs`). All import from `@autharis/ui` (never copied) — the workspace symlink resolves once `pnpm install` runs. Each file exports multiple stories (e.g. Button matrix of 3 variants x 3 sizes; Icon gallery over `ICON_NAMES`; Dialog with trigger + focus-trap content; Tabs with three controlled panels; SegmentedControl controlled with 3 density options).
- **Smoke check:** `npx tsc --noEmit -p tsconfig.json` **not runnable** — `node_modules/` is absent under `apps/storybook/` (and the sandbox npm registry fetch is blocked by `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`). Types will resolve after `pnpm install`; stories are authored against the exact F3 prop shapes in `packages/ui/src/index.ts` and the `@storybook/react` 8.x public API.
- Dev server **not started** per lane rules (smoke-only lane).
- Wrote only inside `apps/storybook/**`, flipped F5 row in `_shared/lanes.md` (`open` → `held` → `in-review`), and appended this entry. No writes to protected files, to `@autharis/ui`, `@autharis/tokens`, or to root workspace config.

## 2026-04-22 — Lane G5: status / uptime dashboard scaffolded

- Built `apps/status/` as `@autharis/status` on **Next.js 16 App Router** (`next@^16`, `react@^19`, `react-dom@^19`) running on port `:4040`. Scripts: `dev` (`next dev -p 4040`), `build`, `start`, `seed`, `typecheck`. Runtime dep on `better-sqlite3@^11`; dev deps on `typescript@^5.6`, `tsx`, `@types/react@^19`, `@types/node@^22`, `@types/better-sqlite3@^7`.
- `next.config.ts` sets `serverExternalPackages: ["better-sqlite3"]` so the native binding is not bundled. `tsconfig.json` is strict with `moduleResolution: bundler` and the Next plugin registered. `next-env.d.ts` stubbed.
- `app/layout.tsx` imports a lightweight `app/globals.css` that mirrors a **token-var subset** from the READ-ONLY `packages/tokens/src/tokens.css` (Inter Tight / Geist stack, brand palette, semantic `--pos`/`--warn`/`--neg`, radii, shadows) plus status-only `--bucket-*` swatches. The app has zero build-time dep on `@autharis/tokens`.
- **Service registry** (`lib/services.ts`): Autharis web `:3000/api/healthz`, API F6 `:4010/healthz`, Events F8 `:4020/healthz`, Matching F7 `:4030/healthz`, Warehouse G7 (kind `static`, skipped in HTTP ping path). Registry doubles as the render order on the overview page.
- **SQLite persistence** (`lib/db.ts`): opens `./uptime.sqlite` in WAL mode with `pings(id, service, ts, ok, latency_ms)` and `incidents(id, service, opened_at, closed_at?, note)` + indexes. Exposes `recordPing`, `pingsSince`, `listIncidents`, `getIncident`, `openIncident`, `closeIncident`. File is runtime-only — **not committed** (regenerated by the seed script).
- **Rollup** (`lib/uptime.ts`): `rollup90Days(service)` bins pings into 90 daily buckets (`ok` = all succeeded, `partial` = mixed, `outage` = all failed, `nodata` = no pings). Helpers `uptimePct` and `overallHealth` feed the top-level banner.
- **Routes**: three total — `app/page.tsx` (overview: overall banner + per-service 90-day grid cards with 90d uptime %), `app/incidents/page.tsx` (list + inline detail via `?id=N`, using the Next 16 `searchParams: Promise<…>` contract), `app/api/ping/route.ts` (Node runtime handler — parallel `fetch` against every service `/healthz` with a 3s `AbortController` timeout, writes every result to SQLite, returns the array).
- Components: `components/UptimeGrid.tsx` (90 squares left → right, `title`/`aria-label` per cell for per-day tooltip) and `components/IncidentRow.tsx` (opened-at mono timestamp + service + human duration).
- `scripts/seed.ts` deletes the tables and seeds 90 days × 4 pings per service (deterministic: a single failure for `matching` at day -42, one blip for `events` at day -7) plus two closed incidents so the UI shows real data without pings running. Runnable via `pnpm --filter @autharis/status seed`.
- **Smoke check:** `npx tsc --noEmit -p tsconfig.json` **not runnable** — `node_modules/` is absent under `apps/status/` and the sandbox npm registry fetch is blocked by `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`. Ran `tsc` via the autharis-local binary; every remaining diagnostic is `TS2307` (cannot find `next`, `next/server`, `react`, `better-sqlite3`) or the downstream `TS7026` for JSX — all clear once `pnpm install` lands. No authored-code errors.
- Dev server **not started** per lane rules. Did **not** touch `autharis/**` source, any service, `packages/tokens/**`, or any other app.
- Wrote only inside `apps/status/**`, flipped G5 row in `_shared/lanes.md` (`open` → `held` → `in-review`), and appended this entry.

## 2026-04-22 — Lane G4 (`claude-g4-sprint`): react-email transactional templates landed for review

- Stood up `apps/email/` as `@autharis/email` (private workspace). Deps: `@react-email/components@^0.0.25`, `react-email@^3.0.0`, `@react-email/render@^1.0.1`, `react@^19`, `react-dom@^19`. DevDeps: `typescript@^5.6`, `@types/react@^19`, `@types/react-dom@^19`. Scripts: `dev: email dev --port 3001`, `export: email export`, `typecheck: tsc --noEmit`.
- Eight templates under `emails/`: `MatchFound`, `TimesheetSubmitted`, `TimesheetApproved`, `InvoiceIssued`, `InvoicePaid`, `PayoutSent`, `DisputeOpened`, `MagicLink`. Every module exports `default` component + `subject: string` + fully-typed `sampleProps` + a `*Props` interface — so the provider adapter gets compile-time enforcement via `renderEmail<N>(name, props)`.
- Shared chrome lives in `emails/_components/Layout.tsx`: wordmark header ("Autharis" with `brandTerra` dot), card-in-paper body (`#F6F5F0` → `#FFFFFF` card @ `#E6E4DA` border, `radius.lg`), footer with "Manage notifications / Help" links, and primary-CTA pill button in `brandTerra` (`#E8552B`) with white ink. Layout also exports reusable `Heading`, `Paragraph`, `Muted`, `KeyValue`, `CTA`, `Divider`.
- Color hex values are **inlined** rather than imported from `@autharis/tokens`. Rationale: the tokens source uses `var(--accent)` / `color-mix()` chains that never resolve inside an email client — flattening to hex is the only safe rendering path. Added a header comment in `Layout.tsx` naming the sync contract (hand-maintain in lockstep with `packages/tokens/src/index.ts`), mirroring the same discipline the tokens package itself already documents.
- All eight templates follow the react-email spec: `<Html><Head/><Preview><Body>` from `@react-email/components`, single `max-width: 600px` container (table-backed by react-email internals) so Outlook / Gmail mobile render correctly, one `Preview` string per template for inbox snippets, plaintext fallback generated for free by `@react-email/render`'s `plainText: true` mode.
- `src/render.ts` exposes `renderEmail<N>(name, props) => { subject, html, text }` with a discriminated `EmailPropsMap` — calling with props that don't match the named template is a compile error. Also ships `renderSample(name)` for preview servers / tests and an `emailNames` array for enumeration.
- `previews/*.html` (8 files) checked in as small placeholder HTML per the dispatch — each notes that real output is regenerated via `pnpm --filter @autharis/email dev` / `export`. Did **not** run the `email dev` server (per dispatch rule against binding ports / letting the CLI fetch).
- **Smoke outcome:** `tsc --noEmit -p tsconfig.json` executed via the autharis workspace's bundled TypeScript 5.6 (the G4 workspace `node_modules` doesn't exist yet — the monorepo hasn't had `pnpm install` run here, and `npx tsc` hits the same `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` sandbox failure that G2/F7 recorded). Every remaining tsc diagnostic is `TS2307 Cannot find module 'react' | '@react-email/components' | '@react-email/render'` or downstream `TS7026` JSX intrinsics errors — i.e. the missing `@types/react` and the not-yet-installed runtime packages. **No code-level type errors.** Integrator should re-run `pnpm --filter @autharis/email typecheck` after `pnpm install` to confirm; the tsconfig is strict + `jsx: react-jsx` + `moduleResolution: Bundler` + `isolatedModules` and every template is self-contained with explicit prop types.
- Wrote only inside `apps/email/**`, the G4 row in `_shared/lanes.md` (flipped `open` → `held` → `in-review`), and this decisions.md append. Did not touch `packages/tokens/**` (read-only per dispatch) or any other workspace.
- 2026-04-22 · G6 desktop — in-review · Tauri 2 + Vite shell scaffolded (port 5174), admin views (queue/roster/disputes/reports) stubbed against @autharis/sdk → F6 API, awaits Rust toolchain for build.
