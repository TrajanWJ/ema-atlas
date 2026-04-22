---
date: 2026-03-11T00:00:00.000Z
tags:
  - project
  - active
  - ai
  - nil
  - sports-tech
  - marketplace
type: project
wiki_id: projects/Proslync
imported_from: vault/Projects/Proslync.md
imported_at: '2026-04-04T00:23:56.888Z'
summary: ''
---

# Proslync

> AI-powered NIL & athlete brand-collaboration platform. Athlete-first marketplace with verified identity, deal matching AI, and embedded compliance.
> Status: Phase 1 Complete — Showcase App Running | Started: 2026-03-11

---

## Quick Info

| | |
|---|---|
| **Status** | Phase 1 Complete — Showcase App Running |
| **App Location** | `/home/trajan/Desktop/Coding/Projects/proslync` |
| **Docs Location** | `/home/trajan/Desktop/Proslync documentation/` |
| **Stack** | Next.js 16 + TypeScript 5 + Tailwind 4 + shadcn/ui + Zustand 5 |
| **Future Stack** | FastAPI (Python) + PostgreSQL + Redis + Pinecone |
| **Dev Server** | `pnpm dev` → localhost:3010 |
| **Phase** | 1 — Showcase Complete → Phase 2: Real Backend |

---

## What This Is

A four-sided marketplace connecting:
- **Athletes** — college/pre-pro seeking NIL deals and brand income
- **Brands** — local/regional companies seeking verified athlete partners
- **Agents** — managing multiple athletes, needing bulk workflows
- **Fans** — premium memberships, drops, engagement rails

Core differentiators: verified identity (KYC/IDV), AI deal matching, embedded compliance per school/state/league, and full deal management (briefs → contracts → escrow → payouts) in one platform.

---

## Architecture Overview

```
Frontend (Next.js / TypeScript)
       │ REST + WebSocket
Backend (FastAPI / Python)
  ├── AI Engine (Deal Matching + Compliance Filter)
  └── Compliance Rules Engine (human-in-the-loop)
       │
Integrations: Stripe Connect │ Clerk │ S3 │ Resend
       │
Data: PostgreSQL │ Redis │ Pinecone (vectors)
```

See [[Proslync Architecture Design]] for full technical spec.

---

## AI Engine

Three components — deal matching is MVP priority:

| Component | MVP? | Description |
|---|---|---|
| **Deal Matching** | YES | Semantic vector matching between athlete profiles and brand briefs, filtered through compliance rules |
| **Contract Intelligence** | Phase 2 | Clause extraction, risk flagging, fair-market suggestions |
| **AI Coach** | Phase 2 | Rate card guidance, negotiation coaching, profile setup |

### Compliance Rules Engine

- Rules sourced per school + state + league
- AI extracts rules from policy documents (NCAA guidelines, state laws, school handbooks)
- Human reviewer approves before rules go live
- Every deal match passes through compliance filter before surfacing to athlete
- Rules stored as structured JSON in PostgreSQL with versioning

---

## Business Model

| Revenue Stream | Pricing |
|---|---|
| Marketplace take rate | 10–18% of GMV |
| Brand SaaS | $299–$999/mo |
| Agency SaaS | $49–$149/seat/mo |
| Athlete Premium | $9–$19/mo |
| Creative/Media Services | Fixed-fee or rev-share |

---

## Key Milestones

| Milestone | Target | KPIs |
|---|---|---|
| MVP | Q4 2025 | Verified profiles, AI deal suggestions, brand/agent portals, payments |
| Launch | Jan 2026 | 150 athletes, 100 brands, 25 agencies |
| D90 post-launch | Mar 2026 | 1k athletes, 200 brands, $1.2M GMV run-rate |
| Scale | End 2026 | 10k athletes, $25-40M GMV |

---

## Source Documents

- `Business Plan 8_19_2025.docx` — full business + marketing plan
- `📈 Proslync Marketing Plan.docx` — phased marketing strategy
- `Vision 9_15_2025a.docx` — vision, mission, differentiators, 12-month goals
- `Blank Rental Agreement - Wilson Premier - PDF.pdf` — Wilson Premier contract (possible contract intelligence training material)

---

## Related Projects

- [[Wilson Premier Agent Platform]] — related client, same vacation rental agreement appears in Proslync docs

---

## Showcase App Routes (Phase 1 — Built 2026-03-12)

| Route | Purpose |
|---|---|
| `/` | Landing page — hero, stats, role portal cards |
| `/dev-login` | Role card grid — click to log in as any seeded user |
| `/athlete` | Athlete dashboard (deals, AI matches, compliance tab) |
| `/brand` | Brand portal (athlete discovery, AI matches, campaigns) |
| `/agent` | Agent dashboard (roster, deal pipeline kanban, compliance) |
| `/fan` | Fan view (following, discover athletes) |
| `/admin` | Admin panel (compliance rules, user verification, KPIs) |
| `/aiengine` | **AI Engine dev dashboard** — split panel (Rules Editor + Matching Demo) |

### Key Implementation Files

| File | Purpose |
|---|---|
| `features/compliance/engine.ts` | Rule evaluation logic (scope matching + evaluators) |
| `features/matching/engine.ts` | Match scoring algorithm (4 weighted factors + compliance gate) |
| `lib/seed-data.ts` | 16 seeded users + 8 compliance rules + 3 deals |
| `features/dev/components/DevToolbar.tsx` | Persistent bottom-right role switcher |

### Matching Algorithm

4 weighted factors — compliance is a binary gate (must pass to get a score):
- Audience fit (30%): brand category vs athlete content tags
- Budget fit (25%): brand quarterly budget vs athlete rate card
- Engagement (25%): followers × engagement rate, normalized
- Sport relevance (20%): sport-category affinity map

### Compliance Architecture

- Rules have `approved/pending/draft` status — only `approved` rules gate matches
- Human-in-the-loop: AI extracts rule from policy doc → human approves in `/aiengine`
- Rules scoped to: school + state + league (any combination)
- 8 seeded rules: ACC alcohol under-21, UVA gambling, NCAA agent commission, VA/NC disclosure, Big Ten boosters, NCAA minors, DC 1099

## Current Phase

> **Phase 1 COMPLETE** — Showcase app running at `http://localhost:3010`
> TypeScript: 0 errors. Dev server: `pnpm dev`
>
> **Phase 2** — Real FastAPI backend + PostgreSQL + Pinecone vector matching

## Gotchas

_None captured yet — agents should add entries here when debugging costs >5 min._

#project #active #ai #nil #sports-tech #marketplace

## Related Notes

- [[Proslync Architecture Design]] — full technical architecture spec
- [[Research - ExecuDeck Tech Landscape 2026]] — shared stack research (Next.js 16, React 19)
- [[Wilson Premier Agent Platform]] — related client, same vacation rental agreement appears in docs
- [[Craig Wilson]] — client connection (Wilson Premier)

---

## Phase 1 Changelog

### 2026-03-12 — Athlete Dashboard Full Rewrite (Rich Dark UI)

**What changed:**
- `app/athlete/page.tsx` completely rewritten — 1,433 lines
- Dark navy theme (`bg-[#0A1628]`), glassmorphism cards, gold earnings display (`#F5A623`)
- Four tabs: Overview | Deals | AI Matches | Compliance
- **Overview**: Earnings milestone progress bar (% of $25k yearly target), active deals pipeline mini-view with `PipelineDots`, top AI match teaser card, content tag pills, `ProfileStrengthBar` (10-field completeness meter), quick action buttons
- **Deals**: Expandable deal cards with milestone progress bars, "Advance Stage" inline buttons, click-to-open bottom-sheet modal (`DealDetailModal`) showing full value breakdown (platform fee, athlete net), pipeline progress bar, click-to-complete milestone circles
- **AI Matches**: `ScoreRing` SVG component (color-coded green/blue/amber by score), `MatchCard` with expandable "Why This Match" section, 4 mini score bars (audience/budget/engagement/sport), compliance-blocked brands shown separately in muted red section with failed rule IDs
- **Compliance**: `ComplianceRuleCard` with expandable detail (source doc, effective date, version), category color pills, scope pills, summary bar (applicable/compliant/violations counts)
- New sub-components: `ScoreRing`, `MiniScoreBar`, `PipelineDots`, `ProfileStrengthBar`, `DealDetailModal`, `MatchCard`, `ComplianceRuleCard`
- TypeScript: 0 errors

### 2026-03-12 — Interactive Deal Flow + AI Engine Sandbox

**App features shipped:**
- `features/deals/store.ts` — Zustand deal store with `createDeal`, `advanceDeal`, `completeMilestone`, `getBrandDeals`, `getAthleteDeals`; persisted to localStorage
- Athlete dashboard: "Initiate Deal" button on AI match cards → creates deal in draft stage → auto-navigates to Deals tab
- Athlete dashboard: Inline milestone completion (click circles), "Advance Stage" link per deal
- Brand dashboard: "Send Brief" button on both athlete search cards and AI match cards → creates deal at `brief_sent` stage → navigates to Deals tab
- Brand dashboard: New "Deals" tab showing outgoing campaign pipeline with stage advancement
- AI Engine (`/aiengine`): Weight sliders panel (toggle with ⚙ Weights button) — adjust 4 scoring factors, weights auto-normalize to 100%; weight contribution breakdown shown per match result
- Matching engine: accepts `MatchWeights` param; `DEFAULT_WEIGHTS` exported; `MatchWeights` type added to `types/index.ts`

**Documentation shipped:**
- [[Proslync Architecture Design]] — full technical architecture doc including scoring algorithm, compliance engine spec, Phase 2 DB schema, integrations, ADRs

### 2026-03-12 — Full Role Dashboard Overhaul (Dark Theme + Interactive)

**Design system:** Away from all-white. Every role gets its own dark accent:
- Athlete → `bg-[#0A1628]` dark navy, blue accents
- Brand → `bg-[#0F0A1E]` dark purple, purple accents
- Agent → `bg-[#0D0700]` dark orange-black, orange accents
- Fan → `bg-[#020F0A]` dark emerald-black, green accents
- Admin → `bg-slate-950`, red accents

**Each page is now 1,000–1,400 lines** with full interactivity:
- **Athlete (1,433 lines):** Overview/Deals/AI Matches/Compliance tabs; SVG ScoreRing; deal detail modal (stage pipeline, milestone completion, fee breakdown); profile strength bar; "Initiate Deal" from matches
- **Brand (1,272 lines):** Dashboard/Athletes/AI Matches/Campaigns tabs; athlete profile modal with score breakdown; campaign card with expandable milestones; search+sport filter; Send Brief flow
- **Agent (1,208 lines):** Roster/Pipeline/Earnings/Compliance tabs; kanban pipeline; athlete detail modal with AI matches; deal detail modal with commission calc; per-athlete earnings breakdown
- **Fan (1,042 lines):** Activity feed; follow/unfollow toggle; support modal ($5, Stripe-style UI); Fan Club upsell modal ($9.99/mo); athlete bottom sheet; desktop sidebar with leaderboards
- **Admin (1,239 lines):** Overview/Compliance/Users/Deals/Audit tabs; approve/reject rules live; user verification queue; deal detail + flag as disputed; 15-entry audit log; platform health indicators
