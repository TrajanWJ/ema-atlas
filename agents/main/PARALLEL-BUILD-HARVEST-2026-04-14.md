# Proslync parallel-build harvest — 2026-04-14

Host checked: `host-machine`
Canonical active repo: `~/proslync-app`

## Why this exists
This note consolidates useful ideas found across nearby parallel build traces (current repo docs, archived reference repos, logs, and host-side agent artifacts) so the active repo can benefit without re-importing old mess.

## Most useful sources

### 1) Current repo docs and audits in `~/proslync-app/docs/`
Highest signal because they are recent, explicit, and already grounded in the active codebase.

Most useful files:
- `docs/repo-state/REPO-CONSOLIDATION-2026-04-14.md`
- `docs/API_CONTRACT_AUDIT_2026-04-14.md`
- `docs/status/frontend-reality-2026-04-14.md`
- `docs/brand/BRAND-AUDIT.md`
- `docs/dispatch/dispatch-system.md`
- `docs/proslync-system/*`
- `docs/flows/*`

What they contributed:
- the repo is expanding from one tracked Expo surface into a multi-surface platform (Expo + backend + web + docs)
- the most dangerous current drift is fake integration: screens that look real while still running on mock IDs, mock services, or hardcoded KPIs
- the strongest durable architectural idea is to organize work by one real vertical at a time rather than broad cosmetic rewrites
- orange / gray / black is now canonical brand truth; old cool-blue styling should not be treated as authoritative
- dispatch should optimize for compliance clarity and release control, not just speed

### 2) `logs/improvement-findings.md`
Useful because it contains concrete, low-risk UX/perf/a11y/code-quality findings tied to exact files.

Gold inside it:
- many fixes are small, real, and safe to execute incrementally
- several findings repeat the same theme as the API audit: remove demo ambiguity, improve accessibility, centralize duplicated utilities, and isolate mock-vs-real seams

Caution:
- keep it as a source, not a canonical doc; it is a running log and mixes durable insight with transient notes

### 3) `reference_deprecated/desktop-proslync-app-rn`
Useful as a salvage/reference source, not as a code source of truth.

Gold still visible there:
- richer seeded datasets and scoring concepts
- explicit PMS-style match-score breakdown ideas
- broader chat/deal card interaction patterns
- some utility/data decomposition patterns not fully carried into the active tree yet

What to salvage conceptually, not by blind copy:
- explanatory match breakdowns instead of opaque single-number ranking
- separate data modules (`brands`, `campaigns`, `transactions`, scoring helpers) instead of giant god files
- clearer cross-role messaging context around deals

### 4) `reference_deprecated/coding-projects-proslync-next`
Moderate signal. Mostly useful as evidence of prior web direction and docs structure, not as a code import candidate.

Useful parts:
- docs naming/structure around plans, autonomous loops, under-UI layer mapping, and asset recovery
- confirms the web surface had prior momentum and should be treated as a real lane, not a random leftover

Why not import code directly:
- README is mostly boilerplate
- dependency surface and implementation assumptions are old enough to create merge noise
- the active repo already has a newer `web/` subtree in flight

### 5) Host Claude/agent traces (`~/.cache/claude-cli-nodejs/*proslync*`, `~/.claude/projects/*proslync*`)
Low-to-moderate signal.

Useful takeaway:
- confirms concentrated recent work around Proslync on Apr 13-14 and validates that docs/brand/API/backend/web activity is current, not abandoned

Not useful for direct harvest:
- MCP log files themselves are mostly operational exhaust
- they tell us where work happened, not the durable product decisions

## Sources that should mostly be ignored

### Hermes cutover scripts
Path: `~/Desktop/hermes-agent-cutover/*.sh`

Reason:
- operational launcher wrappers only
- unrelated to product/design/flow decisions for Proslync

### Raw Claude cache/MCP logs
Paths under:
- `~/.cache/claude-cli-nodejs/*proslync*`
- `~/.claude/projects/*proslync*`

Reason:
- useful as breadcrumbs, not as canonical product input
- high noise, low durable decision density

### Placeholder scaffolds in `next phase/`
Current contents are mostly empty headings / skeleton docs.

Reason:
- good future container, weak present signal
- should not outweigh the filled audits and status docs

## Current gold vs stale noise

### Current gold
1. Make one end-to-end vertical actually real
   - best current candidate: brand campaigns / campaign detail / candidate list / workroom
   - aligns across `API_CONTRACT_AUDIT`, `frontend-reality`, and dispatch docs

2. Stop conflating session user id with profile id
   - this is the core identity bug behind many fake-working flows
   - fix with profile bootstrap / resolution layer

3. Preserve the new brand truth
   - orange / gray / black is canonical
   - old cyan-heavy visual language is now drift unless deliberately retained for specific interaction semantics

4. Separate durable docs from runtime exhaust
   - logs belong in `logs/`
   - reusable findings belong in `docs/`

5. Treat `reference_deprecated` as salvage only
   - useful to mine concepts and assets
   - dangerous as a source for copy-paste resurrection

### Stale or noisy
- raw Desktop-era repos as direct implementation sources
- raw MCP logs/cache directories
- boilerplate README content from archived web repos
- empty planning scaffolds that have not yet been filled

## Strongest harvested ideas

### Product / flow ideas worth keeping
- move from a flashy demo to a trustworthy ops platform where messaging, compliance, campaigns, and escrow visibly use real state
- make match ranking explainable with domain breakdowns instead of a magic score
- visually label simulated behavior until real services replace it
- prioritize buyer/operator truth: campaign status, candidate state, compliance gates, and thread history should be factual before they are pretty

### Architecture ideas worth keeping
- use a repository / adapter boundary so screens stop importing mock data directly
- centralize profile resolution and environment config (`mock` vs `real`)
- split giant mixed files into domain/data/service layers
- keep archived references quarantined from typecheck and validation gates

### Delivery/operating ideas worth keeping
- dispatch by bounded, reviewable slices
- no release-like flow should ship without rollback, provenance, and compliance review
- fix the product illusion problem first: a connected-looking UI with demo internals is worse than an honestly incomplete one

## Safe artifact promoted in this pass
A curated execution doc was promoted into `docs/dispatch/SAFE-HARVEST-SLICES-2026-04-14.md`.

Why this was safe:
- no code-path changes
- no destructive moves
- converts high-value but ephemeral findings into a durable queue
- keeps future execution focused on current gold rather than stale parallel noise

## Recommended ignore list for future cycles
- `reference_deprecated/**/node_modules`
- `reference_deprecated/**/.next`
- raw cache/log folders under `~/.cache/claude-cli-nodejs/`
- operational launcher scripts unrelated to product behavior
- placeholder plans until filled with evidence-backed content

## Bottom line
The best parallel-build value was already near the active repo, not hidden in obscure host debris.

What is real and worth preserving:
- the API/reality/brand/repo-state docs
- the curated improvement findings
- selected conceptual patterns from `reference_deprecated/desktop-proslync-app-rn`

What should be resisted:
- reviving old code wholesale
- treating cache logs as product truth
- letting empty planning scaffolds outrank filled factual docs
