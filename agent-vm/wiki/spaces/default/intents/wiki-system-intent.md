---
title: "Wiki — Core System Intent"
type: intent
status: active
priority: high
project: Wiki
created: 2026-04-04
updated: 2026-04-04
summary: "Unified knowledge system replacing vault. API-first, agent-accessible, EMA-integrated. Wikipedia-style web mirror + prompt interface."
tags: [wiki, knowledge, intent, system, ema, superman, vault-migration]
intent_type: system
---

# Wiki — Core System Intent

## Goal
Replace scattered vault files with a unified, queryable, agent-accessible wiki that serves as single source of truth for the entire Trajan system.

## Context
The vault was a flat collection of Markdown files browsed via Obsidian and Quartz. It worked for human browsing but was limited for:
- Agent context retrieval (no API, no semantic search)
- Intent building (no lifecycle, no state machine)
- Cross-project discovery (no graph queries)
- Prompt-based updates (no modification interface)

The wiki fixes all of this while preserving what works (Markdown, backlinks, Quartz web mirror).

## Constraints
- Must remain Markdown-native (no proprietary format)
- Quartz web mirror must continue working at :8090
- Vault files remain intact until full cutover validated
- Agent MCP tools must be a drop-in replacement for vault MCP
- No SaaS dependencies — fully self-hosted

## Relationships
- [[EMA]] — wiki is app #14 (replaces Vault app)
- [[Superman-Runtime-Architecture]] — intent pages are Superman's context source
- [[EMA-Unified-Spec-With-Integrations]] — wiki layer in EMA architecture

## Priority
HIGH — blocks EMA Wiki App, Superman context injection, agent memory quality

## Notes
- Quartz already running at :8090 reading from /home/trajan/vault/
- Wiki API live at :8093, 1288 pages indexed
- Next: point Quartz at wiki/spaces/default/ instead of vault/
