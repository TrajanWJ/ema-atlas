---
title: "Wilson Premier Platform"
created: 2026-04-01
type: codebase
status: planned
stack: [openai-agents-sdk, n8n, postgresql, python]
host: TBD
category: client-work
client: Craig Wilson
tags: [codebase, client, real-estate, hospitality, multi-agent, STR, smith-mountain-lake]
summary: "Multi-agent platform for Craig Wilson's real estate/hospitality business at Smith Mountain Lake. 14 planned agents across real estate, hospitality, finance, and platform domains."
related: [EMA, STR Web Design, Intelligence Layer]
---

# Wilson Premier Platform

Multi-agent system for Craig Wilson's real estate and hospitality business (Smith Mountain Lake). Lead discovery, guest automation, CRM, financial monitoring, daily briefings.

## Agent Architecture (14 planned)

### Real Estate Domain
- **Lead Scout** — Proactive lead discovery from MLS, FSBO, auction sites
- **Market Analyzer** — Comp analysis, pricing recommendations, market trends
- **Deal Evaluator** — ROI modeling, risk assessment, cash flow projections
- **Listing Manager** — Auto-generate listings, photo optimization, syndication

### Hospitality Domain  
- **Guest Concierge** — Pre-arrival comms, local recommendations, issue resolution
- **Booking Optimizer** — Dynamic pricing, channel management (Airbnb/VRBO/direct)
- **Property Ops** — Maintenance scheduling, vendor coordination, inventory tracking
- **Review Manager** — Response generation, sentiment analysis, reputation monitoring

### Finance Domain
- **Financial Monitor** — P&L tracking, expense categorization, tax prep
- **Revenue Forecaster** — Seasonal projections, occupancy optimization

### Platform Domain
- **Daily Briefer** — Morning report aggregating all agent outputs
- **CRM Coordinator** — Contact management, relationship tracking, follow-ups
- **Integration Hub** — n8n workflows connecting external platforms
- **Supervisor** — Agent-to-agent routing, escalation, quality gates

## Stack

| Component | Technology |
|---|---|
| Agent runtime | OpenAI Agents SDK |
| Workflow automation | n8n |
| Database | PostgreSQL |
| Language | Python |

## Key Design Decisions

1. **Supervisor pattern** — One agent routes, specialists execute
2. **n8n as trigger layer** — External events (new booking, price change) fire n8n → agent
3. **Shared PostgreSQL state** — All agents read/write to same DB, not isolated memory
4. **Intelligence layer** — Same pattern as [[Intelligence Layer]] but domain-specific

## Competitive Landscape (from [[Research/EMA-Wilson-Deep-Research-2026-03-31|research]])

- Hospitable and Guesty are reactive copilots, not multi-agent systems
- Wilson Premier's architecture is genuinely novel in the STR/RE space
- Positioning: intelligence layer on top of existing platforms, not a replacement

## Related

- [[STR Web Design]] — Craig's existing web properties
- [[EMA]] — Personal executive OS (shared architecture patterns)
- [[Research/EMA-Wilson-Deep-Research-2026-03-31|Deep Research Report]]

## Status

💡 Planned — architecture design phase
