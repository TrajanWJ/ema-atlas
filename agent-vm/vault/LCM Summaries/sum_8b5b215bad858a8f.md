---
title: "AgentOS Frontend Dogfooding Session - Browse Tab & Vault UI"
type: note
created: 2026-03-20
tags: [agent-os, frontend, dogfooding, ui-testing, vault-browser]
summary: "Dogfooding session testing AgentOS frontend tabs (Dashboard, Search, Browse, Graph, Insights) with real vault data"
confidence: high
source: LCM conversation 659
---

# AgentOS Frontend Dogfooding Session — Browse Tab & Vault UI

**Date:** 2026-03-20
**Session:** Conversation 659 (LCM leaf node, originally sum_8b5b215bad858a8f)
**Context:** Self-hosted dogfooding of the AgentOS web frontend at `http://192.168.122.10:18790/app/`

## Overview

This session captured a systematic dogfooding pass through the AgentOS frontend application. The goal was to test each major UI tab with real vault data — verifying that the system "tells its own story" using actual metrics and notes rather than placeholder content.

## Tabs Tested

### Dashboard
- Displayed **real system metrics**: 2d 10h uptime, 1.0 load average, 5.9/13.6G memory usage
- Stream page showed Discord mirror and feed events correctly
- Dashboard metrics were fixed during this session

### Omnibus Input
- Routing detection worked: typing "search vault" correctly showed the route preview "Search Vault"
- Good UX confirmation that intent detection was functional
- Some browser timeout errors encountered during click interactions (TimeoutError on `locator.click`)

### Search
- Returned real data: "Found 20 notes in 579ms" for query "agent os"
- Results included expected notes: "rhino os product quality loop", "claudeforge", "agent os speculative ui deep dive", "agent os business software paradigms", "v5 1 red team report"
- Notes correctly tagged by type (research, projects, architecture)
- Recent searches stored and displayed

### Browse Tab
- **Left panel:** Folder tree with note counts — Research: 81, Ingested: 63, Architecture: 7, Projects: 2, plus other categories
- **Right panel:** Notes in selected folder, sorted by modified date with relative timestamps
- Real data confirmed: "GitHub Intel Favorites" showing as just modified, "Agent OS Business Software Paradigms" 44 minutes prior
- The vault structure visualization was functional and populated

### Graph
- Described as "BEAUTIFUL" — hundreds of nodes rendered from the real vault
- Color-coded by folder for visual categorization
- Stable layout achieved (no bouncing) thanks to a damping fix applied earlier
- Lock button functional for freezing the graph layout
- Filter/search nodes input at top of graph view

### Insights
- Browser port conflict encountered: Port 18800 was in use by a non-openclaw process
- Required `action=reset-profile profile=openclaw` to resolve
- Partial testing only due to the port conflict

## Issues Found

1. **Browser timeout errors** — `locator.click` timeouts during automated interaction with the Omnibus
2. **Port conflicts** — Port 18800 collision prevented full Insights tab testing
3. **Search submit event** — Initial search didn't trigger; required clicking the Search button explicitly rather than submitting via keyboard

## Subagent Tasks Running Concurrently

During this dogfooding session, several coding subagents were in flight:
- `coder-talk-proposals-fix` — awaiting completion
- `coder-mind-rebuild` — timed out after 10 minutes
- `coder-life-os-enhance` — awaiting completion

The session yielded after dogfooding to wait for these subagent completions.

## Outcome

The frontend was largely functional with real data. Key wins: Search, Browse, and Graph all worked with actual vault content. The system was self-hosting its own development loop — using AgentOS to test and iterate on AgentOS.

## Related

- [[Agent-OS-Live-Bridge]] — architecture for the live data bridge
- [[Agent-Queue-System]] — subagent queue system used during this session
- [[Agent-OS-UX-Competitive-Deep-Dive]] — UX research informing the frontend design
