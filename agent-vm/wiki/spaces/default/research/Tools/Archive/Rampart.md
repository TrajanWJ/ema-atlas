---
title: Rampart
created: '2026-03-16'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: external-research
tags:
  - github
  - mcp
  - openclaw
  - prompts
  - research
  - security
summary: >-
  Open-source firewall for AI agents. Policy engine controlling what
  [[OpenClaw]], Claude Code, Cursor, Codex, and other AI tools can do on your
  machine
wiki_id: research/Tools/Archive/Rampart
imported_from: vault/Research/Tools/Archive/Rampart.md
imported_at: '2026-04-04T00:23:57.125Z'
---
# Rampart

**Source:** https://github.com/peg/rampart (51 stars)
**Category:** AI Agent Firewall / Security
**Date:** 2026-03-14
**Status:** Discovered

## What It Does
Open-source firewall for AI agents. Policy engine controlling what [[OpenClaw]], Claude Code, Cursor, Codex, and other AI tools can do on your machine. YAML-based policies evaluate every exec, file read, and network call before execution. Response scanning blocks credentials from tool responses before they enter the LLM context window.

## Relevance
- Has native `rampart setup openclaw` and `rampart setup claude-code` one-liners
- Proxies MCP servers with deny-by-default policies
- Mapped to OWASP Top 10 for Agentic Applications
- Written in Go, sub-millisecond overhead
- Relevant given our full `security: full` + `bypassPermissions` setup

## See Also
- [[Capsule]] — WASM sandbox for isolating agent code execution
- [[Promptfoo]] — LLM red-teaming and vulnerability scanning

## Notes
- Worth evaluating for production [[Hardening]]
- Could complement [[ClawDefender]] (which does prompt injection detection)

## Related

- [[Overnight]]
- [[Summary]]
- [[2026-03-14]]
