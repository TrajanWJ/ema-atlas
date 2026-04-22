---
title: "NotebookLM-py"
created: 2026-03-16
updated: 2026-03-16
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: external-research
tags: [auth, claude, code, github, research, skills]
summary: "Unofficial Python API and CLI for Google NotebookLM. Full programmatic access including features the web UI doesn't expose: batch downloads, quiz/flas"
---
# NotebookLM-py

**Source:** https://github.com/teng-lin/notebooklm-py
**Category:** Google NotebookLM API Wrapper
**Date:** 2026-03-14
**Status:** Installed (needs Google auth)

## What It Does
Unofficial Python API and CLI for Google NotebookLM. Full programmatic access including features the web UI doesn't expose: batch downloads, quiz/flashcard export, mind map extraction, slide revision, PPTX export. Supports audio/video overview generation, research automation, and Claude Code integration.

## Relevance
- CLI installed at `~/.local/bin/notebooklm` (v0.3.4)
- Has Claude Code skill for natural language automation
- Uses Google's internal APIs (NOT Claude/OpenAI) — powered by Gemini on Google's end
- Useful for research automation, podcast generation from sources, content creation

## Notes
- Requires `notebooklm login` for browser-based Google auth
- NOT compatible with Claude Max subscription (uses Google APIs exclusively)
- Unofficial — APIs may break without notice

## Related
- [[Khoj]] — self-hostable RAG alternative for vault search
- [[GitHub Intel - Favorites]] — curated GitHub tools including research automation
- [[Agent Memory Architectures]] — patterns for knowledge extraction and storage