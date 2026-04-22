---
title: "Khoj"
created: 2026-03-14
updated: 2026-03-16
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: external-research
tags: [github, knowledge, mcp, obsidian, ops, research]
summary: "Self-hostable personal AI that provides conversational RAG over documents (PDF, Markdown, Notion, Word), web search, custom agents, and scheduled auto"
---
# Khoj

**Source:** https://github.com/khoj-ai/khoj
**Category:** Personal AI / Vault RAG
**Date:** 2026-03-14
**Status:** systemd compose ready (not started)

## What It Does
Self-hostable personal AI that provides conversational RAG over documents (PDF, Markdown, Notion, Word), web search, custom agents, and scheduled automations. Supports any LLM backend (GPT, Claude, Gemini, Llama, etc.). Has Obsidian plugin for direct vault integration.

## Relevance
- systemd compose at `~/.khoj/systemctl.yml`
- Will index Obsidian vault at `/home/trajan/vault/` for conversational search
- Supplements QMD — QMD does BM25/embedding search, Khoj does full conversational RAG
- Needs Gemini API key to start (Trajan has Google account)

## Notes
- Web UI at localhost:42110
- Includes SearXNG for web search, sandbox for code execution
- Obsidian plugin available for direct connection
- Admin panel at localhost:42110/server/admin

## Related
- [[Agent Memory Architectures]] — memory and RAG architecture patterns
- [[MCP Toolbox for Databases]] — another MCP server integration option
- [[Vault Structure Assessment]] — vault structure Khoj will index