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
