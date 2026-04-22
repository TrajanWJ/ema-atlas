# LCM Summary sum_b9ba4ab6d87df892

Created: 2026-03-25 19:18:01
Kind: leaf
Depth: 0
Conversation: 1139
Tokens: 1215
Descendants: 0
Earliest: 2026-03-25T18:26:09.000Z
Latest: 2026-03-25T19:14:23.000Z

## Content

[2026-03-25 18:26 UTC]
=== Wilson Premier vault note ===
---
date: 2026-03-11
tags:
  - project
  - active
  - ai
  - real-estate
  - hospitality
  - client-work
---

# Wilson Premier Agent Platform

## Quick Info

| | |
|---|---|
| **Client** | [[Craig Wilson]] |
| **Status** | Feasibility / Pre-build |
| **Location** | `/home/trajan/Desktop/wilson ai bs/` |
| **Stack** | Python, OpenAI Agents SDK, n8n, PostgreSQL, pgvector, Redis, Docker Compose, React/Next.js |
| **Phase** | 0 — Requirements Review |

---

## What This Is

A self-hosted multi-agent AI platform for Craig Wilson's two businesses:

- **Wilson Premier Properties** — real estate, Smith Mountain Lake
- **Wilson Premier Hospitality** — luxury STR properties (Suite Retreat, Suite View)

The platform acts as a digital operations team: lead discovery, guest automation, CRM hygiene, financial monitoring, and daily executive briefings — all with human-in-the-loop approval gates.

---

## Architecture Overview

```
Agent Orchestration  →  OpenAI Agents SDK (Python)
Workflow Triggers    →  n8n
CRM                  →  BoldTrail
Hospitality          →  Hostaway → Airbnb / VRBO
Accounting           →  QuickBooks Online (read-only)
Database             →  PostgreSQL + pgvector
Admin Dashboard      →  React / Next.js
Deployment           →  Docker Compose (local mini PC, Ubuntu LTS)
Remote Access        →  Tailscale
```

---

## Agent Roster

| Agent | Domain | Status |
|---|---|---|
| Lake Buyer Discovery | Real Estate | Planned |
| Seller Signal | Real Estate | Planned |
| Development Opportunity | Real Estate | Planned |
| Builder & Capital Match | Real Estate | Planned |
| Hospitality Group Lead | Hospitality | Planned |
| Guest Concierge | Hospitality | Planned |
| Guest Social Promotion & Review | Hospitality | Planned |
| CRM Follow-Up | Real Estate | Planned |
| Property Operations | Hospitality | Planned |
| Market Intelligence | Real Estate | Planned |
| Platform Optimization | Hospitality | Planned |
| Financial & Backoffice | Finance | Planned |
| Daily Briefing | Executive | Planned |
| Self-Optimization | Platform | Planned |

---

## Deployment Roadmap

| Phase | Focus | Status |
|---|---|---|
| 1 | Infrastructure setup | Not started |
| 2 | System integrations | Not started |
| 3 | Core agents | Not started |
| 4 | Optimization agents | Not started |

---

## Feasibility Notes (2026-03-11)

- Stack is solid and proven — nothing novel required
- **Highest ROI agents first:** Guest Concierge, CRM Follow-Up, Daily Briefing (most buildable, most impact)
- **Main risk:** Social media lead scraping (Facebook/LinkedIn prohibit it) — needs paid data provider strategy (Apollo, Clay, etc.) or manual feed
- **Airbnb/VRBO messaging:** Agents can only draft, never send — already reflected in spec's governance section
- Brand voice documentation already exists for both properties (video scripts, AI training docs)
- Craig's governance requirements are conservative and appropriate (zero auto-spend, draft-only messaging)

---

## Key Files

- `wilson-premier-agent-platform/System Requirements.md` — full spec in markdown
- `property sample info and writing style brand/` — property docs, video scripts, inventory for AI training

---

## Credentials Needed from Craig

- [ ] BoldTrail
- [ ] Hostaway
- [ ] QuickBooks
- [ ] Property manuals (partial — brand docs exist)
- [ ] Outreach guidelines
- [ ] Concierge vendor list

---

## Related Notes

- [[Craig Wilson]] — client
- [[Proslync]] — related project (same client connection)

---

## Current Phase

> **Phase 0 — Requirements Review & Feasibility**
> Spec received, feasibility assessed as HIGH. Awaiting next steps from Craig.

#project #active #ai #client-work #real-estate #hospitality

=== Craig Wilson contact ===
---
date: 2026-03-11
tags:
  - people
  - client
  - real-estate
  - hospitality
---

# Craig Wilson

**Role:** Client — Owner of Wilson Premier Properties and Wilson Premier Hospitality
**Relationship:** He sent the agent platform spec; you are building (or evaluating/advising on) the Wilson Premier Agent Platform for him.

---

## Quick Info

| | |
|---|---|
| **Company** | Wilson Premier Properties / Wilson Premier Hospitality |
| **Location** | Smith Mountain Lake, Virginia area |
| **Properties** | Suite Retreat (400 Backcove), Suite View (399 Backcove) |
| **Project** | [[Wilson Premier Agent Platform]] |

---

## Business Context

Craig runs two primary business units:

**Wilson Premier Properties** — Real estate brokerage focused on Smith Mountain Lake. Uses BoldTrail as CRM. Interested in off-market deals, buyer lead discovery, and development opportunities.

**Wilson Premier Hospitality** — Luxury short-term rental operation. Two flagship properties (Suite Retreat ~14,000 sq ft, Suite View ~1
[LCM fallback summary; truncated for context management]
