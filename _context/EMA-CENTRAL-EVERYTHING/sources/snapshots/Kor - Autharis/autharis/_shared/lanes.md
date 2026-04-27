# Lanes — live lock sheet

Coordination primitive for the Autharis swarm. One lane, one holder, one non-overlapping write scope.

## Legend

- **Status:** `open` · `held` · `in-review` · `landed` · `blocked`
- **Holder:** session id like `codex-s1`, `claude-s2`, or `open`
- **Depends on:** prerequisite lanes or user decisions
- **File scope:** the only files that lane may write

---

## Wave 0 — bootstrap and protection

### Lane CT — Control tower / shared workspace bootstrap
- **Status:** landed
- **Holder:** codex-swarm-setup-2026-04-22
- **Depends on:** none
- **File scope:** `_shared/**`
- **Done when:**
  - `_shared/README.md`, `lanes.md`, `decisions.md`, `handoffs/README.md`, and `dispatch/**` exist
  - Protected-file rules are documented
  - The first Autharis lane map is ready for dispatch

### Lane U0 — Protected foundation reconciliation
- **Status:** blocked
- **Holder:** user-owned
- **Depends on:** user direction or explicit reassignment
- **File scope:** `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `components/Marketing.tsx`, `components/ClientApp.tsx`, `components/AppContext.tsx`, `components/TweaksPanel.tsx`, `components/Icons.tsx`, `styles/**`, `lib/tweaks.ts`, `lib/data.ts`
- **Done when:**
  - The current in-flight foundation edits are reconciled into a stable base
  - Ownership of the protected files is explicit
  - Follow-on integration work can proceed without clobbering local edits

---

## Wave 1 — safe parallel build lanes

### Lane A1 — Shell primitives and shared app chrome
- **Status:** landed
- **Holder:** codex-a1
- **Depends on:** none
- **File scope:** `components/chrome/**`, `components/ui/**`, `components/icons/**`, `lib/tweaks.ts`, `lib/surfaces.ts`, `lib/storage.ts`
- **Done when:**
  - Shared shell primitives exist for surface tabs, shell chrome, tweaks plumbing, and reusable UI atoms
  - No writes land in protected files
  - Result is integration-ready for C1

### Lane B1 — Marketing surface
- **Status:** landed
- **Holder:** codex-b1
- **Depends on:** A1 optional
- **File scope:** `components/marketing/**`, `app/(marketing)/**`, `lib/marketing/**`, `public/marketing/**`
- **Done when:**
  - The editorial marketing homepage is rebuilt in isolated Next route-group files
  - It reads design intent from the root prototype export but does not edit that export
  - No writes land in protected files

### Lane B2 — Client product surface
- **Status:** landed
- **Holder:** codex-b2
- **Depends on:** A1 optional
- **File scope:** `components/client/**`, `app/(client)/**`, `lib/client/**`, `styles/client.css`
- **Done when:**
  - The client dashboard/request/matches/timesheets/invoices surface exists in isolated files
  - Match-card variants are implemented locally in the client surface tree
  - No writes land in protected files

### Lane B3 — Talent product surface
- **Status:** landed
- **Holder:** codex-b3
- **Depends on:** A1 optional
- **File scope:** `components/talent/**`, `app/(talent)/**`, `lib/talent/**`, `styles/talent.css`
- **Done when:**
  - The talent profile/opportunities/engagements/timesheets/earnings surface exists in isolated files
  - No writes land in protected files

### Lane B4 — Admin product surface
- **Status:** landed
- **Holder:** codex-b4
- **Depends on:** A1 optional
- **File scope:** `components/admin/**`, `app/(admin)/**`, `lib/admin/**`, `styles/admin.css`
- **Done when:**
  - The admin queue/roster/matching/disputes/reports surface exists in isolated files
  - No writes land in protected files

---

## Wave 1.5 — derivative expansion lanes

### Lane D1 — Marketing case studies rail
- **Status:** landed
- **Holder:** codex-d1
- **Depends on:** B1
- **File scope:** `components/marketing/case-studies/**`, `app/(marketing)/case-studies/**`, `lib/marketing/case-studies.ts`, `public/marketing/case-studies/**`
- **Done when:**
  - Autharis has an editorial case-studies surface derived from the new marketing language
  - No protected files changed

### Lane D2 — Marketing brief intake demo
- **Status:** landed
- **Holder:** codex-d2
- **Depends on:** B1
- **File scope:** `components/marketing/brief/**`, `app/(marketing)/brief/**`, `lib/marketing/brief.ts`
- **Done when:**
  - Autharis has a high-fidelity “start a brief” intake demo route
  - No protected files changed

### Lane D3 — Client request lab
- **Status:** landed
- **Holder:** codex-d3
- **Depends on:** B2
- **File scope:** `components/client-request/**`, `app/(labs)/client-request/**`, `lib/client-request/**`, `styles/client-request.css`
- **Done when:**
  - A client-adjacent request-composer lab route exists without touching B2-owned files
  - No protected files changed

### Lane D4 — Client match lab
- **Status:** landed
- **Holder:** codex-d4
- **Depends on:** B2
- **File scope:** `components/client-match/**`, `app/(labs)/client-match/**`, `lib/client-match/**`, `styles/client-match.css`
- **Done when:**
  - A client-adjacent match-review lab route exists without touching B2-owned files
  - No protected files changed

### Lane D5 — Talent opportunity dossier
- **Status:** landed
- **Holder:** codex-d5
- **Depends on:** B3
- **File scope:** `components/talent/opportunity-detail/**`, `app/(talent)/talent/opportunities/[opportunityId]/**`, `lib/talent/opportunity-detail.ts`
- **Done when:**
  - Talent has a detailed opportunity dossier route derived from the new talent surface
  - No protected files changed

### Lane D6 — Talent payout packet
- **Status:** landed
- **Holder:** codex-d6
- **Depends on:** B3
- **File scope:** `components/talent/ledger/**`, `app/(talent)/talent/earnings/ledger/**`, `lib/talent/ledger.ts`
- **Done when:**
  - Talent has a payout-packet / ledger detail route derived from the new earnings surface
  - No protected files changed

### Lane D7 — Admin dispute drilldown
- **Status:** landed
- **Holder:** codex-d7
- **Depends on:** B4
- **File scope:** `components/admin/disputes/**`, `app/(admin)/admin/disputes/[caseId]/**`, `lib/admin/disputes.ts`
- **Done when:**
  - Admin has a case-detail dispute drilldown route
  - No protected files changed

### Lane D8 — Admin reporting workbook
- **Status:** landed
- **Holder:** codex-d8
- **Depends on:** B4
- **File scope:** `components/admin/reports/**`, `app/(admin)/admin/reports/weekly/**`, `lib/admin/reports.ts`
- **Done when:**
  - Admin has a richer weekly reporting workbook route
  - No protected files changed

### Lane D9 — Marketing FAQ and objections rail
- **Status:** landed
- **Holder:** codex-d9
- **Depends on:** B1
- **File scope:** `components/marketing/faq/**`, `app/(marketing)/faq/**`, `lib/marketing/faq.ts`
- **Done when:**
  - Marketing has a buyer-trust FAQ / objections route aligned to the editorial system
  - No protected files changed

### Lane D10 — Marketing talent-join narrative
- **Status:** landed
- **Holder:** codex-d10
- **Depends on:** B1
- **File scope:** `components/marketing/talent-join/**`, `app/(marketing)/join/**`, `lib/marketing/talent-join.ts`
- **Done when:**
  - Marketing has a talent-facing join narrative route that extends the brand language
  - No protected files changed

### Lane D11 — Client finance packet lab
- **Status:** landed
- **Holder:** codex-d11
- **Depends on:** B2
- **File scope:** `components/client-finance/**`, `app/(labs)/client-finance/**`, `lib/client-finance/**`, `styles/client-finance.css`
- **Done when:**
  - A client-adjacent finance and invoice packet lab route exists without touching B2-owned files
  - No protected files changed

### Lane D12 — Talent public-profile lab
- **Status:** landed
- **Holder:** codex-d12
- **Depends on:** B3
- **File scope:** `components/talent/public-profile/**`, `app/(labs)/talent-profile/**`, `lib/talent-profile/**`, `styles/talent-profile.css`
- **Done when:**
  - A public-profile / shareable talent dossier lab exists without touching B3-owned files
  - No protected files changed

### Lane D13 — Admin activation queue drilldown
- **Status:** landed
- **Holder:** codex-d13
- **Depends on:** B4
- **File scope:** `components/admin/queue/**`, `app/(admin)/admin/queue/[queueId]/**`, `lib/admin/queue.ts`
- **Done when:**
  - Admin has an activation-queue detail route derived from the new admin console
  - No protected files changed

### Lane D14 — Admin matching dossier
- **Status:** landed
- **Holder:** codex-d14
- **Depends on:** B4
- **File scope:** `components/admin/matching-detail/**`, `app/(admin)/admin/matching/[runId]/**`, `lib/admin/matching.ts`
- **Done when:**
  - Admin has a matching-run dossier route derived from the new admin console
  - No protected files changed

---

## Wave 2 — integration and verification

### Lane C1 — App integration and route handoff
- **Status:** blocked
- **Holder:** open
- **Depends on:** U0, A1, B1, B2, B3, B4
- **File scope:** `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `styles/**`, `lib/data.ts`, `components/app-shell/**`
- **Done when:**
  - The isolated surfaces are wired into the real app entrypoints
  - Shared styles and data are reconciled into the protected foundation files
  - Surface navigation, persistence, and responsive behavior work from the actual app shell

### Lane V1 — Verification and smoke checks
- **Status:** open
- **Holder:** open
- **Depends on:** C1
- **File scope:** `tests/**`, `README.md`
- **Done when:**
  - A minimal smoke-check path exists for the integrated app
  - Verification notes and known gaps are documented

---

## Wave 3 — ecosystem build-out (orchestrator-initialized 2026-04-22)

Eight new lanes extending the prototype toward a full ecosystem. Scopes are non-overlapping with each other, with Wave 1 surfaces, with Wave 1.5 D-lanes, and with every protected file. Safe to fire in parallel. Each D-lane's lab route (Wave 1.5) is independent of the matching E-lane engine work below.

### Lane E1 — Auth and identity
- **Status:** landed
- **Holder:** codex-e1
- **Depends on:** none (E2 later integrates persistence)
- **File scope:** `components/auth/**`, `app/(auth)/**`, `lib/auth/**`, `middleware.ts`
- **Done when:**
  - Role-gated routes work for client/talent/admin with a dev impersonator
  - Cookie-based session helpers published from `lib/auth/`
  - No protected files changed

### Lane E2 — Server data layer and API routes
- **Status:** landed
- **Holder:** codex-e2
- **Depends on:** none
- **File scope:** `app/api/**` EXCEPT `app/api/auth/**`, `app/api/payments/**`, `app/api/matching/**`, `app/api/notifications/**`, `app/api/search/**`, `app/api/analytics/**`; `lib/server/**`; `lib/db/**`; `prisma/**`
- **Done when:**
  - Typed server client exposes domain reads/writes with shapes matching `lib/data.ts`
  - Store choice (sqlite+prisma vs. typed JSON) logged in `decisions.md`
  - `lib/data.ts` is not edited

### Lane E3 — Payments and invoicing engine
- **Status:** landed
- **Holder:** codex-e3
- **Depends on:** E2 optional
- **File scope:** `components/payments/**`, `app/(payments)/**`, `lib/payments/**`, `app/api/payments/**`
- **Done when:**
  - Timesheet → invoice → paid simulates end-to-end with matching client + talent payouts
  - Stripe-style webhook stub wired at `app/api/payments/webhook/`
  - No protected files changed

### Lane E4 — Matching engine service
- **Status:** landed
- **Holder:** codex-e4
- **Depends on:** none
- **File scope:** `lib/matching/**`, `app/api/matching/**`, `components/matching/**`
- **Done when:**
  - Deterministic `score(request, talent)` with breakdown
  - Ranked matches API returns top-N for a job request
  - `components/matching/ExplainCard.tsx` consumable without editing client surface files

### Lane E5 — Notifications and messaging
- **Status:** open
- **Holder:** open
- **Depends on:** E2 optional
- **File scope:** `lib/notifications/**`, `app/api/notifications/**`, `components/notifications/**`, `components/messaging/**`
- **Done when:**
  - Typed event bus fires on match-found, timesheet-submitted, invoice-paid, dispute-opened, message-received
  - In-app inbox + per-engagement thread components are drop-in
  - SSE or long-poll stream chosen and logged

### Lane E6 — Search and discovery
- **Status:** open
- **Holder:** open
- **Depends on:** E4 optional (taxonomy)
- **File scope:** `lib/search/**`, `app/api/search/**`, `components/search/**`
- **Done when:**
  - Typeahead + facets behave deterministically over seed talent and jobs
  - `SearchBar` and `FacetPanel` are consumable from any non-protected surface

### Lane E7 — Analytics and telemetry
- **Status:** open
- **Holder:** open
- **Depends on:** E2 optional
- **File scope:** `lib/analytics/**`, `app/api/analytics/**`, `components/analytics/**`, `app/(admin-analytics)/**`
- **Done when:**
  - Standalone analytics dashboard renders funnel, retention, GMV, payout throughput, time-to-match
  - Lives outside `components/AdminApp.tsx` entirely

### Lane E8 — Testing, CI, and deployment
- **Status:** open
- **Holder:** open
- **Depends on:** none
- **File scope:** `tests/**` (shared with V1 — coordinate via handoff if scopes collide), `.github/**`, `playwright.config.ts`, `vitest.config.ts`, `vercel.json`, `scripts/**`
- **Done when:**
  - Unit (vitest) and e2e (playwright) suites run green locally and in GH Actions
  - Vercel preview config in place
  - `scripts/swarm-status.ts` prints lane state from `_shared/lanes.md`
  - If `package.json` needs deps, a handoff is filed for U0 — E8 does not edit it directly

---

## Wave 4 — monorepo ecosystem (orchestrator-initialized 2026-04-22)

The workspace is now a **pnpm monorepo** rooted at `/Users/tawj/Desktop/Kor - Autharis/`. `autharis/` remains in place as one workspace member; new deliverables live in sibling trees. Wave 4 lanes write exclusively in those new trees and never touch `autharis/**` protected files.

Monorepo root artifacts (all authored by this orchestrator pass — do NOT edit without a handoff):
- `pnpm-workspace.yaml`, `package.json`, `turbo.json`, `README.md`

### Lane F1 — Monorepo hub navigator (Astro, static)
- **Status:** in-review
- **Holder:** claude-f1-sprint
- **Depends on:** F2 optional (deliverable registry)
- **File scope:** `apps/hub/**`
- **Done when:** static site at `apps/hub` lists and links every deliverable with lane status chips parsed from this file.

### Lane F2 — Shared design tokens package
- **Status:** in-review
- **Holder:** claude-f2-sprint
- **Depends on:** none
- **File scope:** `packages/tokens/**`
- **Done when:** `@autharis/tokens` publishes CSS re-export + typed mirror + deliverable registry; does not edit `autharis/styles/**`.

### Lane F3 — Shared UI primitives package
- **Status:** in-review
- **Holder:** claude-f3-sprint
- **Depends on:** F2 recommended
- **File scope:** `packages/ui/**`
- **Done when:** `@autharis/ui` exposes Wordmark, Icon, Button, Badge, Pill, SegmentedControl, Dialog, Tabs built against token CSS vars; autharis web untouched.

### Lane F4 — Public docs site
- **Status:** in-review
- **Holder:** claude-f4-sprint
- **Depends on:** none (F6 for API reference page, later)
- **File scope:** `apps/docs/**`
- **Done when:** docs site (Starlight or Nextra — choose + log) serves platform overview, roles, payments, matching, API ref, FAQs, swarm process page.

### Lane F5 — Storybook catalog
- **Status:** in-review
- **Holder:** claude-f5-sprint
- **Depends on:** F3 preferred (can stub)
- **File scope:** `apps/storybook/**`
- **Done when:** Storybook 8 catalog with ≥8 primitives, theme toggle, accent cycle decorator, a11y addon.

### Lane F6 — Fastify API service
- **Status:** in-review
- **Holder:** claude-f6-sprint
- **Depends on:** none
- **File scope:** `services/api/**`
- **Done when:** standalone Fastify server with `/talent`, `/jobs`, `/engagements`, `/timesheets`, `/invoices`, `/admin/queue`, emitting OpenAPI 3.1 at `/openapi.json`. Distinct from E2 (which lives inside Next.js).

### Lane F7 — Python matching microservice
- **Status:** in-review
- **Holder:** claude-f7-sprint
- **Depends on:** E4 coordination (score contract)
- **File scope:** `services/matching/**`
- **Done when:** FastAPI service exposes `POST /score` and `POST /rank` matching E4's contract; pytest smokes pass; Dockerfile present.

### Lane F8 — Bun WebSocket gateway
- **Status:** in-review
- **Holder:** claude-f8-sprint
- **Depends on:** F6 optional (publish source)
- **File scope:** `services/events/**`
- **Done when:** `bun run` starts a WS gateway with per-channel fan-out, HMAC-signed `/publish`, short ring buffer, and a thin ESM client consumable from Next.js (E5).

---

## Wave 5 — deliverable breadth (orchestrator-initialized 2026-04-22)

Expands the monorepo into more deliverable *types* and platforms. Every G-lane writes exclusively in a brand-new workspace directory — zero collision surface with Waves 0–4. Single consolidated dispatch file: `_shared/dispatch/lane-G-wave-5-index.md`.

### Lane G1 — Expo / React Native mobile companion
- **Status:** in-review · **Holder:** claude-g1-sprint · **File scope:** `apps/mobile/**`
- Done: Expo talent app with Opportunities / Timesheet / Earnings tabs running on iOS + Android simulators.

### Lane G2 — Autharis CLI (oclif)
- **Status:** in-review · **Holder:** claude-g2-sprint · **File scope:** `apps/cli/**`
- Done: `autharis swarm status` + `talent list` + `invoice export` + `job create`.

### Lane G3 — Browser extension (Plasmo / WXT, MV3)
- **Status:** in-review · **Holder:** claude-g3-sprint · **File scope:** `apps/extension/**`
- Done: right-click-a-job-post → normalized payload → deep-link into Autharis draft flow.

### Lane G4 — Transactional email templates (react-email)
- **Status:** in-review · **Holder:** claude-g4-sprint · **File scope:** `apps/email/**`
- Done: 8 templates (match-found, timesheets, invoices, payout, dispute, magic-link) rendered + preview screenshots checked in.

### Lane G5 — Status / uptime dashboard
- **Status:** in-review · **Holder:** claude-g5-sprint · **File scope:** `apps/status/**`
- Done: 90-day uptime grid + incident list across all services.

### Lane G6 — Tauri admin desktop
- **Status:** in-review · **Holder:** claude-g6-sprint · **File scope:** `apps/desktop/**`
- Done: native macOS + Windows window with review queue, roster, disputes, treasury panels.

### Lane G7 — dbt + DuckDB data warehouse
- **Status:** in-review · **Holder:** claude-g7-sprint · **File scope:** `services/warehouse/**` (not a pnpm member)
- Done: `dbt build` produces staged + marted analytics, consumed by G5 and E7.

### Lane G8 — @autharis/sdk (typed TS SDK)
- **Status:** in-review · **Holder:** claude-g8-sprint · **File scope:** `packages/sdk/**`
- Done: dual ESM/CJS SDK consumable by web, CLI, mobile, and desktop.

---

## Coordination notes

- The root prototype export under `/Users/tawj/Desktop/Kor - Autharis/index.html` and `/Users/tawj/Desktop/Kor - Autharis/src/**` is read-only reference material.
- The current prototype lane already occupies `components/Marketing.tsx`, `components/ClientApp.tsx`, `components/AppContext.tsx`, `components/TweaksPanel.tsx`, `components/Icons.tsx`, `lib/tweaks.ts`, `lib/data.ts`, and all `styles/**`.
- If a lane needs new shared component directories, it creates them inside its own file scope.
- If a lane discovers that `U0` must be unblocked, it should stop and create a handoff instead of touching the protected files.
