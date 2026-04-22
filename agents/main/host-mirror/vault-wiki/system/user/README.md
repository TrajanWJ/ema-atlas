---
title: README
created: '2026-03-18'
updated: '2026-03-18'
type: knowledge
status: active
confidence: 0.4
confidence_updated: 2026-03-18T00:00:00.000Z
source: personal
tags:
  - agents
  - architecture
  - knowledge
  - research
summary: 'Each goal gets a status:'
wiki_id: system/user/README
imported_from: vault/Trajan/README.md
imported_at: '2026-04-04T00:23:57.297Z'
---
# Aspirational — The Target State

> This folder describes **where we're going**, not where we are. Every doc here is a goal, not a claim. This separation exists to reduce hallucination — agents should never confuse aspirational docs with current-state docs.

## How This Works

- **Current state** lives everywhere else in the vault (Architecture/, System/, Operations/, etc.)
- **Aspirational state** lives here — what we want the system to become
- Agents can reference aspirational docs when planning, but must **never cite them as current reality**
- Each aspirational doc has a `## Current Reality` section that links to the actual current-state doc

## Status Tags

Each goal gets a status:
- 🎯 **TARGETED** — We want this, haven't started
- 🔨 **IN PROGRESS** — Actively working toward it
- ✅ **ACHIEVED** — Done, move content to current-state docs and archive here
- ❌ **ABANDONED** — Decided against it (with reason)

## Active Goals

- [[Aspirational Vault Architecture]] — What the vault should look like when mature
- [[Aspirational Agent System]] — Full autonomous agent orchestration target
- [[Aspirational Knowledge Loop]] — Self-improving research-ingest-implement cycle
- [[Aspirational Integrations]] — All services connected, full digital life management

## Rules for Agents

1. **Read aspirational docs for direction**, not as truth
2. **Always verify current state** in the actual system docs before claiming something works
3. **Update aspirational docs** when goals change or are achieved
4. **Link back** — every aspirational doc points to its current-state counterpart
