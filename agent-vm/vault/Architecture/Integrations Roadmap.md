---
title: "Integrations Roadmap"
created: 2026-03-16
updated: 2026-04-16
type: architecture
status: stale
confidence: 0.35
confidence_updated: 2026-04-16
source: architecture-doc
summary: "March 2026 integration plan — partially obsolete. OpenClaw-era channels no longer apply. EMA is now the integration target."
tags: [email-calendar, integrations-overview, providers-models, vm-access, web-services, ema]
---
# Integrations Roadmap

> **Staleness review 2026-04-16:** This roadmap was written for the OpenClaw-era architecture. Discord channels referenced below are from that era. The integration target has shifted to [[Codebases/EMA|EMA]] (Pipes module) and host-based Claude Code workflows. Activepieces on agent-vm now handles some workflow automation. Many Phase 1/2 items may have been superseded.

**Date:** 2026-03-16 (original) | **Reviewed:** 2026-04-16
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

## Current Integration Status (2026-04-16)

| Integration | Original Plan | Current Status |
|---|---|---|
| Brave Search | Phase 1 | Superseded by SearXNG on agent-vm |
| Email/Calendar/Drive (Google) | Phase 2 | Unknown — check if Activepieces handles this |
| Host bridge | Phase 2 | SSH works, Claude Code sessions active on host |
| VNC/noVNC | Phase 3 | Port 6080 open per [[Hardening]] UFW rules |
| Discord/Telegram channels | All phases | **Archived** — OpenClaw messaging disabled |

**TODO:** Create a fresh integrations roadmap aligned with EMA Pipes module and Activepieces capabilities.

## Related

- [[Codebases/EMA|EMA]] — current integration target (Pipes module)
- [[Hardening]] — current active services
- [[Aspirational Integrations]]
