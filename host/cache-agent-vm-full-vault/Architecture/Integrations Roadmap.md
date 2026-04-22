---
title: "Integrations Roadmap"
created: 2026-03-16
updated: 2026-03-16
type: architecture
status: active
confidence: 0.60
confidence_updated: 2026-03-18
source: architecture-doc
summary: "Phased plan to expand from AI infra assistant to full-life integration"
tags: [email-calendar, integrations-overview, providers-models, vm-access, web-services]
---
# Integrations Roadmap

**Date:** 2026-03-16
**Goal:** Expand from "AI assistant for AI infrastructure" to "AI assistant for everything"

## Phase 1 — Quick Wins (hours)

| Integration | Status | Blocker | Channel |
|---|---|---|---|
| Brave Search API | ❌ Missing | Trajan needs free key from brave.com/search/api/ | #web-services |
| Codex as provider | ❌ Not started | Need Codex plan credentials | #providers-models |
| Dashboard v2 → morning cron | ✅ Built | Just wire to cron | #integrations-overview |

## Phase 2 — Service Connections (days)

| Integration | Status | Research | Channel |
|---|---|---|---|
| Email (Gmail MCP) | ⏳ Installed, needs OAuth | `@gongrzhe/server-gmail-autoauth-mcp` + `gws` CLI | #email-calendar |
| Google Calendar | ⏳ Installed, needs OAuth | `gws` covers Calendar API | #email-calendar |
| Google Drive | ⏳ Installed, needs OAuth | `gws` covers Drive API | #web-services |
| Host bridge expansion | ✅ SSH works | Auto-index, health checks | #vm-access |

## Phase 3 — Power Features (weeks)

| Integration | Status | Research | Channel |
|---|---|---|---|
| VM browser UI (VNC/noVNC) | ❌ Not started | noVNC web UI for remote browser | #vm-access |
| Project CI/CD | ❌ Not started | Vercel deploys, GitHub Actions | per-project channels |

## Research Assets

| Finding | Source | Relevance |
|---|---|---|
| Gmail MCP on host Claude Code | Host machine scan | Email integration is closer than thought |
| [[OpenViking]] context DB | GitHub Intel | Could replace/supplement QMD |
| codemem MCP server | GitHub Intel | Rust-based code memory, 26 MCP tools |
| hindsight memory system | GitHub Intel | Biomimetic memory, SOTA on LongMemEval |
| MCP integration skill installed | ClawHub | Framework for adding new MCP servers |

## Discord Channels

**🚀 Active Projects:** execudeck, letmescale, truks, wilson-premier, xpressdrop, dispohub
**🔌 Integrations:** integrations-overview, email-calendar, providers-models, web-services, vm-access

## Related

- [[Integrations Roadmap]]
- [[Aspirational Integrations]]
- [[goals-aspirations]]
- [[Aspirational Integrations]]
