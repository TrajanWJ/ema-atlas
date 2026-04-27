# Dispatch index: Wave 5 lanes G1–G8

Wave 5 extends the ecosystem with more deliverable *types* (platforms, form factors, languages). All scopes live outside `autharis/**` so collision with existing lanes is structurally impossible.

Each entry below is a full dispatch prompt. Use the `DISPATCH PROMPT BEGIN/END` markers per lane.

---

## Lane G1 — Expo / React Native mobile companion

--- DISPATCH PROMPT BEGIN ---
You are Lane G1. Read `apps/mobile/README.md` (stub — write it), claim G1 in `_shared/lanes.md`.
File scope: `apps/mobile/**`.
Mission: Expo 51 + React Native app with three tabs (Opportunities, Timesheet, Earnings) mirroring the talent surface. Pull data from `@autharis/sdk` once G8 lands; stub fixtures inline until then. Use `@autharis/tokens` for shared colors. No push notifications yet — log the decision.
Done: `pnpm --filter @autharis/mobile start` launches Metro; Expo Go renders all three tabs.
--- DISPATCH PROMPT END ---

---

## Lane G2 — Autharis CLI (oclif)

--- DISPATCH PROMPT BEGIN ---
You are Lane G2. Claim G2.
File scope: `apps/cli/**`.
Mission: oclif v4 CLI binary `autharis` with commands: `swarm status` (prints lane state from `_shared/lanes.md`), `talent list`, `invoice export <id>`, `job create` (interactive). Uses `@autharis/sdk` (G8) once published; inline fixtures otherwise. Ship a `scripts/install-local.sh` that pnpm-links it globally for dev.
Done: `autharis swarm status` prints a colorized lane table.
--- DISPATCH PROMPT END ---

---

## Lane G3 — Browser extension (Plasmo)

--- DISPATCH PROMPT BEGIN ---
You are Lane G3. Claim G3.
File scope: `apps/extension/**`.
Mission: Plasmo or WXT browser extension (MV3) that scrapes a highlighted job post (LinkedIn, Upwork, Lever, Greenhouse), normalizes it, and opens `autharis://jobs/new?draft=…` deep link (or clipboard-copies the payload). Content script + popup UI built with `@autharis/ui` (F3).
Done: loading the unpacked extension in Chrome lets you right-click a page and launch the Autharis draft flow.
--- DISPATCH PROMPT END ---

---

## Lane G4 — Transactional email templates (react-email)

--- DISPATCH PROMPT BEGIN ---
You are Lane G4. Claim G4.
File scope: `apps/email/**`.
Mission: react-email 3 templates for: match-found, timesheet-submitted, timesheet-approved, invoice-issued, invoice-paid, payout-sent, dispute-opened, magic-link. Expose `renderEmail(name, props)` and an HTML preview route for each.
Done: each template renders on mobile + desktop clients (litmus-style screenshots checked into `apps/email/previews/`).
--- DISPATCH PROMPT END ---

---

## Lane G5 — Status / uptime dashboard

--- DISPATCH PROMPT BEGIN ---
You are Lane G5. Claim G5.
File scope: `apps/status/**`.
Mission: Next.js 16 dashboard that pings health endpoints for `services/api` (F6), `services/matching` (F7), `services/events` (F8), `autharis` web, and renders a 90-day uptime grid (Cachet-style squares) with incident list. Persistence is a local SQLite file — OK to bundle the db file for dev.
Done: `/` renders the grid; a synthetic incident is seeded.
--- DISPATCH PROMPT END ---

---

## Lane G6 — Tauri admin desktop

--- DISPATCH PROMPT BEGIN ---
You are Lane G6. Claim G6.
File scope: `apps/desktop/**`.
Mission: Tauri 2 + React desktop app for operators. Panels: review queue (KYC), roster, disputes, treasury. Consumes `@autharis/sdk` (G8). Ship `cargo tauri dev` workflow + signed build scripts for macOS + Windows (signing placeholder — do not ship real certs).
Done: `cargo tauri dev` opens the window and renders a populated review queue.
--- DISPATCH PROMPT END ---

---

## Lane G7 — Data warehouse (dbt + DuckDB)

--- DISPATCH PROMPT BEGIN ---
You are Lane G7. Claim G7.
File scope: `services/warehouse/**`. Not a pnpm workspace.
Mission: dbt-duckdb project with staging + marts for engagements, payouts, match funnel. Seed from `autharis/lib/data.ts` JSON export (read-only). `dbt build` produces `warehouse.duckdb` consumed by G5 status dashboard and E7 analytics.
Done: `uv run dbt build` succeeds and renders docs.
--- DISPATCH PROMPT END ---

---

## Lane G8 — @autharis/sdk (typed TS SDK)

--- DISPATCH PROMPT BEGIN ---
You are Lane G8. Claim G8.
File scope: `packages/sdk/**`.
Mission: typed SDK for third-party integrators consuming `services/api` (F6). Generated from F6's OpenAPI (fall back to hand-written types if F6 unheld). Exports a typed `AutharisClient` with per-resource methods (`talent.list`, `jobs.create`, `invoices.get`). Dual ESM/CJS via tsup. Zero runtime deps other than undici or native fetch.
Done: `@autharis/sdk` builds; autharis web, CLI, mobile, and desktop can all import it.
--- DISPATCH PROMPT END ---
