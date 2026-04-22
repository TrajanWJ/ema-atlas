---
title: Lightpanda Browser
created: '2026-03-14'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: external-research
tags:
  - claude
  - github
  - knowledge
  - mcp
  - research
  - skills
summary: >-
  Purpose-built headless browser designed specifically for AI agents and
  automation. Optimized for speed and low resource usage compared to headless
  Chr
wiki_id: research/Tools/Lightpanda_Browser
imported_from: vault/Research/Tools/Lightpanda Browser.md
imported_at: '2026-04-04T00:23:57.133Z'
---
# Lightpanda Browser

**Source:** https://github.com/lightpanda-io/browser
**Category:** Headless Browser for AI Agents
**Date:** 2026-03-14
**Status:** Installed & Active

## What It Does
Purpose-built headless browser designed specifically for AI agents and automation. Optimized for speed and low resource usage compared to headless Chrome/Playwright.

## Relevance
- Could replace or supplement our Chrome-based browser automation
- Potentially lower resource footprint on the VM
- Designed for the exact use case we have (AI agent web interaction)

## Installation
- Binary at `/usr/local/bin/lightpanda` (nightly build)
- MCP server added to Claude Code (`~/.claude/mcp.json`)
- Has built-in `mcp` command — native MCP server support
- CDP compatible (Playwright/Puppeteer)
- 9x less memory, 11x faster than Chrome headless

## See Also
- [[Chrome DevTools MCP]] — full Chrome debugging via MCP (heavier, more features)
- [[agent-browser]] — Rust-based headless browser CLI in workspace skills

## Notes
- Written in Zig with V8 for JS execution
- Supports `fetch` (single page), `serve` (CDP server), `mcp` (MCP server) modes
- Has `--dump markdown` for clean text extraction
- Respects robots.txt with `--obey_robots`
- Complements Chrome for lightweight/fast headless tasks

## Related

- [[Lightpanda Installation]]
- [[reddit-deep-dive-agent-ecosystem]]
- [[2026-03-16]]
