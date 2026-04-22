---
title: Engram
created: '2026-03-14'
updated: '2026-03-14'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: external-research
tags:
  - code
  - github
  - knowledge
  - mcp
  - openclaw
  - research
summary: >-
  Go binary providing persistent memory across AI coding sessions.
  Agent-agnostic — works with Claude Code, Codex, Gemini CLI, VS Code, Cursor,
  etc. S
wiki_id: research/Tools/Engram
imported_from: vault/Research/Tools/Engram.md
imported_at: '2026-04-04T00:23:57.128Z'
---
# Engram

**Source:** https://github.com/Gentleman-Programming/engram (1.3k stars)
**Category:** Persistent Memory for AI Coding Agents
**Date:** 2026-03-14
**Status:** Installed & Active

## What It Does
Go binary providing persistent memory across AI coding sessions. Agent-agnostic — works with Claude Code, Codex, Gemini CLI, VS Code, Cursor, etc. SQLite + FTS5 full-text search, exposed via CLI, HTTP API, MCP server, and TUI.

Key tools: `mem_save`, `mem_search`, `mem_context`, `mem_session_summary`, `mem_timeline`

## Relevance
- **Go binary** installed at `/usr/local/bin/engram` v1.10.0
- **[[OpenClaw]] plugin** (`openclaw-engram` v9.0.80) — replaced memory-core as memory slot
- **Claude Code MCP** — added to `~/.claude/mcp.json`
- Gives Claude Code persistent memory across sessions — decisions, bugfixes, patterns survive session boundaries
- Also has [[OpenClaw]] plugin variant (joshuaswarren/[[OpenClaw]]-engram) for agent memory

## Notes
- Zero dependencies — single Go binary + SQLite file at `~/.engram/engram.db`
- [[OpenClaw]] plugin needs OpenAI key or local LLM for full extraction (currently basic mode)
- Topic-key upserts prevent duplicate memories

## See Also
- [[ByteRover]] — alternative [[OpenClaw]] memory plugin (structured context tree vs SQLite)

## Related

- [[Claude Code Mastery]]
- [[Claude Usage Gated Cron]]
- Mastery
- Claude
- [[-]]
- [[OpenClaw Agent Setup]]
- Favorites
- Agent
- Setup
- [[2026-03-14]]
