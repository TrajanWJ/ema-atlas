---
date: 2026-03-12
tags:
  - project
  - architecture
  - proslync
  - adr
---

# Proslync — Architecture Design

> Technical architecture for the Proslync NIL athlete-brand marketplace platform.
> Created from Phase 1 showcase implementation. Last updated: 2026-03-12.

See also: [[Proslync]]

---

## System Overview

Proslync is a **four-sided marketplace** with embedded AI and compliance.

```
┌─────────────────────────────────────────────┐
│            Next.js 16 Frontend               │
│  Athletes │ Brands │ Agents │ Fans │ Admins  │
└────────────────────┬────────────────────────┘
                     │ REST + WebSocket
┌────────────────────▼────────────────────────┐
│              FastAPI Backend                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Deal API │  │ AI Engine │  │Compliance│  │
│  └──────────┘  └──────────┘  │  Engine  │  │
│                               └──────────┘  │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│                 Data Layer                   │
│  PostgreSQL │ Redis │ Pinecone (vectors)     │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│              Integrations                    │
│  Stripe Connect │ Clerk │ S3 │ Resend        │
└─────────────────────────────────────────────┘
```

---

## Frontend Architecture (Phase 1 — Complete)

**Stack:** Next.js 16 + TypeScript 5 + Tailwind CSS 4 + shadcn/ui + Zustand 5

### Route Structure

| Route | Role | Purpose |
|---|---|---|
| `/` | Public | Landing page, product showcase |
| `/dev-login` | Dev only | Log in as any seeded user |
| `/athlete` | Athlete | Deal pipeline, AI matches, compliance view |
| `/brand` | Brand | Athlete discovery, AI ranks, campaign pipeline |
| `/agent` | Agent | Client roster, deal kanban |
| `/fan` | Fan | Following feed, athlete discovery |
| `/admin` | Admin | KPIs, compliance rules review, user verification |
| `/aiengine` | Dev | Split panel: compliance editor + matching demo |

### State Management

| Store | Persistence | Purpose |
|---|---|---|
| `features/auth/store.ts` | `localStorage` | Current logged-in user |
| `features/compliance/store.ts` | `localStorage` | Compliance rules (CRUD) |
| `features/deals/store.ts` | `localStorage` | Deals (create, advance stage, milestones) |

### Feature Modules

```
features/
├── auth/           # User auth store + types
├── compliance/     # Rules engine + store + RulesEditor component
├── deals/          # Deal store (mutable, persisted)
├── matching/       # Scoring engine + MatchingDemo component
└── dev/            # DevToolbar (floating role switcher) + UserCard
```

---

## AI Engine Architecture

### Component 1: Deal Matching (MVP — Implemented)

**Location:** `features/matching/engine.ts`

The matching engine scores athlete-brand pairs using 4 weighted factors:

| Factor | Default Weight | Source |
|---|---|---|
| Audience Fit | 30% | Content tag overlap between athlete and brand category |
| Budget Fit | 25% | Brand's quarterly budget vs athlete's estimated deal cost |
| Engagement | 25% | Normalized followers × engagement rate vs benchmark |
| Sport Relevance | 20% | Sport-to-category affinity map (hardcoded per sport) |

**Compliance gate:** Runs before scoring. If ANY approved rule fails, score = null and match is blocked.

**Tuning:** The `/aiengine` sandbox exposes weight sliders to adjust scoring in real-time. Weights are normalized (sum to 1.0) automatically.

### Scoring Algorithm

```typescript
score = audienceFit × w1 + budgetFit × w2 + engagement × w3 + sportRelevance × w4

audienceFit  = overlap(athlete.contentTags, brand.categoryTags) / max possible × 100
budgetFit    = step function on (brand.quarterlyBudget / athlete.ratePerPost × 3)
engagement   = min(100, (followers × engRate) / benchmark × 100)
sportRelevance = SPORT_AFFINITY[sport][category] (lookup table)
```

### Component 2: Compliance Rules Engine (MVP — Implemented)

**Location:** `features/compliance/engine.ts`

- Rules stored as structured JSON with `evaluatorKey` → dispatches to named evaluator function
- `ruleApplies(rule, athlete)` — scope matching by school / state / league
- Only **approved** rules gate deals (pending/draft rules are inactive)
- Human-in-the-loop: AI extracts rules from docs → human reviews → admin approves → rules go live

**Evaluator keys implemented:**
- `blockAlcoholUnder21` — blocks alcohol brands for athletes under 21
- `blockGambling` — blocks gambling brands (UVA-scoped)
- `capAgentCommission` — warns if commission > 10%
- `requireDisclosureVA` / `requireDisclosureNC` — disclosure flags
- `blockBoosters` — Big Ten booster restriction
- `requireParentalConsent` — NCAA minors rule
- `require1099DC` — DC tax reporting flag
- `custom` — fallback for user-created rules (no hard block)

### Component 3: Contract Intelligence (Phase 2)

- Clause extraction from uploaded PDFs using Claude API
- Risk flagging against standard NIL contract benchmarks
- Fair-market rate suggestions per sport/school/follower tier
- Will integrate with existing compliance rules

### Component 4: AI Coach (Phase 2)

- Rate card guidance: "your rate should be $X based on comparable athletes"
- Negotiation coaching: "brand offered $Y, here's your counter"
- Profile setup: optimizing bio, content tags, rate per post
- Powered by Claude API with access to deal history and market data

---

## Backend Architecture (Phase 2 — Planned)

### FastAPI Service Structure

```
api/
├── routes/
│   ├── deals.py        # Deal CRUD, stage advancement
│   ├── matching.py     # Scoring endpoint (Python AI logic)
│   ├── compliance.py   # Rules management, document parsing
│   ├── athletes.py     # Profile management, KYC verification
│   ├── brands.py       # Brand onboarding, budget management
│   └── contracts.py    # Contract generation, signature flow
├── services/
│   ├── matching_engine.py    # Python port of scoring algorithm
│   ├── compliance_engine.py  # Rule evaluation service
│   ├── ai_coach.py           # Claude API integration
│   └── stripe.py             # Stripe Connect integration
└── models/
    ├── deal.py
    ├── athlete.py
    └── compliance_rule.py
```

### Database Schema (PostgreSQL)

**Key tables:**
- `athletes` — profile, KYC status, rate, content tags, school/state/league
- `brands` — profile, category, budget, target demographics
- `deals` — full deal lifecycle with stage enum + JSON milestones
- `compliance_rules` — scoped rules with evaluator_key, versioning, approval audit
- `match_results` — cached scores with breakdown JSON, invalidated on rule change
- `contracts` — PDF blob refs, extracted clauses, signature status
- `escrow_transactions` — Stripe Connect payment tracking
- `audit_log` — immutable event log for compliance audit trail

### Caching Strategy

| Cache | TTL | Purpose |
|---|---|---|
| Redis match scores | 24h | Expensive to recompute all pairs |
| Redis compliance rules | invalidated on write | Hot path for deal creation |
| Pinecone athlete embeddings | permanent | Semantic search for brand discovery |

---

## Integration Points

### Stripe Connect
- **Flow:** Athlete onboards → creates Express account → platform holds escrow → milestone completion → payout
- **Take rate:** 12–15% blended (included in deal value)
- **Compliance:** All payouts generate 1099 metadata for tax reporting rules

### Clerk (Auth)
- Role-based access: `athlete`, `brand`, `agent`, `fan`, `admin`
- KYC/IDV verification for athletes and brands via Clerk's built-in flows
- JWT passed to FastAPI for backend authorization

### Claude API
- Contract intelligence: clause extraction from PDF text
- AI coach: conversational guidance with athlete context
- Policy extraction: parse school/NCAA handbooks → structured compliance rules

---

## Deal Flow State Machine

```
draft → brief_sent → athlete_reviewing → negotiating → contract_signed → in_progress → completed
                                                                                    ↓
                                                                                  disputed
```

Each transition:
1. Updates `deals.status` + `updated_at`
2. Triggers notification (Resend email)
3. May release escrow milestone (Stripe Connect)
4. Writes to `audit_log`

---

## Phase Roadmap

| Phase | Scope | Status |
|---|---|---|
| 1 — Showcase | Next.js frontend, all role dashboards, AI engine simulation, compliance editor | ✅ Complete |
| 2 — Real Backend | FastAPI + PostgreSQL, real matching API, Clerk auth, Stripe Connect | Planned |
| 3 — AI Intelligence | Claude-powered contract analysis, AI coach, semantic athlete search | Planned |
| 4 — Scale | Mobile app, analytics dashboard, marketplace network effects | Future |

---

## Key Architecture Decisions

### ADR-001: Human-in-the-Loop Compliance
**Decision:** All compliance rules require human approval before gating deals.
**Rationale:** Legal-grade decisions cannot be fully automated. AI extracts, human approves, rules enforce.
**Consequence:** Slightly slower rule deployment, but avoids false positives blocking legitimate deals.

### ADR-002: Compliance as Binary Gate
**Decision:** Compliance check runs before scoring. Failed compliance = no score shown.
**Rationale:** Showing a "blocked" score could encourage workarounds. No score = no temptation.

### ADR-003: Score Weight Tuning
**Decision:** Expose weight sliders in AI engine sandbox but not in production.
**Rationale:** Production weights should be A/B tested and data-driven, not user-editable.

### ADR-004: TypeScript for Frontend, Python for AI
**Decision:** Next.js frontend with TypeScript; FastAPI backend for AI/ML work.
**Rationale:** Python ecosystem for ML/AI is stronger; TypeScript for fast UI iteration.

#architecture #proslync #adr #ai-engine #nil #marketplace
