# Safe harvest slices — 2026-04-14

Curated from the active repo audits plus the improvement log. These are intentionally small, low-drama slices that preserve the best ideas found during the parallel-build harvest.

## Slice 1 — Identity truth bootstrap
**Goal**: stop treating session user id as athlete/brand/agent profile id.

**Why**
- called out as the top integration mismatch in `docs/API_CONTRACT_AUDIT_2026-04-14.md`
- blocks any real “my profile / my campaigns / my roster” flow

**Acceptance criteria**
- client state distinguishes `sessionUserId` from role-specific profile ids
- authenticated screens stop relying on hardcoded demo ids for self-scoped data
- one bootstrap/me or profile-resolution path exists and is documented

## Slice 2 — One real brand vertical
**Goal**: make brand campaigns fully real before polishing more demo surfaces.

**Suggested scope**
- campaign list
- campaign detail
- candidate list / matches
- workroom entry point

**Acceptance criteria**
- uses real query hooks and adapters instead of mock `platformApi`
- no `DEMO_BRAND_ID` in authenticated brand flows
- empty/error/loading states are explicit

## Slice 3 — Messaging truth over fake inboxes
**Goal**: replace hardcoded thread/inbox storytelling with backend-backed threads/messages.

**Acceptance criteria**
- inbox list comes from real thread data
- thread view reads and posts real messages
- campaign/deal context is shown in the thread header when available

## Slice 4 — Promote durable findings out of logs
**Goal**: keep reusable findings in docs, not only in runtime logs.

**Acceptance criteria**
- durable findings live under `docs/`
- `logs/` only contains ephemeral operational output and clearly-labeled working logs

## Slice 5 — Brand discipline pass
**Goal**: preserve canonical orange/gray/black without overheating the UI.

**Acceptance criteria**
- orange is mainly used for CTA/highlight moments
- neutral surfaces lean gray/black
- legacy cyan naming does not imply canonical color truth
- hotspot screens receive visual QA: AthleteHome, Discover, DealCard, GlassCard, Header

## Slice 6 — Accessibility cleanup pack
**Goal**: remove obvious a11y misses that make the demo feel less trustworthy.

**High-confidence targets**
- icon-only buttons need labels/roles
- filter chips need checked state
- search inputs need labels/hints
- loading states need announcements
- image components need alt text/accessibility labels

## Slice 7 — Decompose the god modules
**Goal**: reduce drift by splitting mixed concerns.

**Suggested first target**
- keep `src/data/mock.ts` from owning types + arrays + formatters + matching logic + queries all at once

**Acceptance criteria**
- domain types, mock datasets, queries, and scoring helpers live in separate modules
- screens import via repository/hooks where practical, not direct giant data blobs

## Slice 8 — Validation boundary cleanup
**Goal**: make active-surface validation meaningful again.

**Acceptance criteria**
- archived/reference trees do not dominate typecheck output for active work
- active Expo app can run a focused validation command without reference noise

## Priority opinion
If only three slices happen next, make them:
1. Identity truth bootstrap
2. One real brand vertical
3. Messaging truth over fake inboxes

Those three convert Proslync from “impressive demo” toward “credible operating product.”
