---
title: "Chrome DevTools MCP"
created: 2026-03-14
updated: 2026-03-14
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: external-research
tags: [claude, code, github, knowledge, mcp, research]
summary: "Google's official MCP server exposing full Chrome DevTools access to coding agents. Not just browser automation — actual debugging and performance p"
---
# Chrome DevTools MCP

**Source:** https://github.com/ChromeDevTools/chrome-devtools-mcp (~28.9k stars)
**Category:** Browser Debugging / MCP Server
**Date:** 2026-03-14
**Status:** Installed & Active

## What It Does
Google's official MCP server exposing full Chrome DevTools access to coding agents. Not just browser automation — actual debugging and performance profiling: record performance traces, analyze network waterfalls, inspect console errors with source-mapped stack traces, screenshots.

## Relevance
- Added to Claude Code MCP config with `--headless` mode
- Gives Claude Code ability to debug web apps like a developer would
- Works alongside Lightpanda (fast fetching) and Chrome (full browser)
- Supports performance profiling, network analysis, DOM inspection

## Installation
```bash
npx chrome-devtools-mcp@latest --headless
```
Added to `~/.claude/mcp.json` as `chrome-devtools` server.

## See Also
- [[Lightpanda Browser]] — lightweight headless alternative (9x less memory)
- [[MarkItDown]] — document-to-markdown conversion MCP

## Notes
- Has `--slim --headless` mode for basic automation
- Works with Claude Code, Gemini CLI, Cursor, Codex, VS Code Copilot
- Apache-2.0 license, TypeScript

## Related

- [[tool-verification-2026-03-16]]
- [[mcp-tool-search-installation]]
- [[Lightpanda Installation]]
- [[GitHub]]
- [[Intel]]
- [[-]]
- [[Favorites]]
