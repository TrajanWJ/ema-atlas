---
title: "Aspirational Integrations"
created: 2026-03-18
updated: 2026-03-18
type: aspirational
status: active
confidence: 0.40
confidence_updated: 2026-03-18
source: personal
tags: [agents, auth, discord, github, ops, skills]
summary: "Full digital life integration — email, calendar, social, finances, health, projects — all flowing through the agent system. Not just connected b"
---
# Aspirational Integrations

> **Status:** 🎯 TARGETED
> **Current State Doc:** [[Integrations Roadmap]]
> **Last Revised:** 2026-03-18

## The Vision

Full digital life integration — email, calendar, social, finances, health, projects — all flowing through the agent system. Not just "connected" but actively managed.

## Target Integrations

### Tier 1 — Core (needed for executive functioning)
- [ ] Email (Gmail) — Read, draft, send, auto-categorize
- [ ] Calendar (Google) — Schedule, remind, conflict detection
- [ ] Task management — Auto-extract from conversations, track completion
- [ ] File management — Host project indexing, auto-organization

### Tier 2 — Productivity (needed for business)
- [ ] GitHub — Full CI/CD, PR review, issue management
- [ ] Client communication — Auto-respond, follow-up tracking
- [ ] Financial tracking — Invoice generation, expense tracking
- [ ] Document generation — Proposals, contracts, reports

### Tier 3 — Intelligence (needed for growth)
- [ ] Social media monitoring — Reddit, Twitter/X, HN
- [ ] Competitive intelligence — Track industry trends
- [ ] Learning management — Track courses, books, skills
- [ ] Health/wellness — Sleep, exercise, nutrition tracking

## Current Reality

- Host-VM bridge works (SSH + shared folder)
- GitHub basics via `gh` CLI
- Reddit intel via cron scraper
- Discord as primary command center
- Email/Calendar MCP installed but OAuth not configured
- No financial or health integrations

## Gap

Most integrations blocked by:
1. OAuth configuration (Gmail, Calendar, Drive)
2. No financial infrastructure
3. Social media APIs restricted/expensive

## Related

- [[Aspirational Integrations]]
- [[README]]
- [[goals-aspirations]]
- [[README]]
