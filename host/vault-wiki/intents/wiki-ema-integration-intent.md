---
title: "Wiki ↔ EMA Integration Intent"
type: intent
status: active
priority: high
project: Wiki
created: 2026-04-04
updated: 2026-04-04
summary: "Embed wiki as EMA app #14, wire Projects/Agents/Dashboard to wiki API, prompt interface in command palette."
tags: [wiki, ema, integration, intent]
intent_type: integration
---

# Wiki ↔ EMA Integration Intent

## Goal
Wiki lives inside EMA as app #14. Every EMA app that touches knowledge reads/writes wiki. Command palette searches wiki. Agents get wiki context pre-dispatch.

## Interfaces to Build
1. **Wiki App in sidebar** — full wiki browsing (search, navigate, edit) without leaving EMA
2. **Projects ↔ Wiki** — project detail shows linked wiki pages; execution results append to project wiki page
3. **Agents app** — pre-dispatch injects `wiki_context(project_id)` automatically
4. **Dashboard widgets** — recently updated wiki pages, stale pages needing attention
5. **Command palette** — `wiki: search X`, `wiki: create page`, `wiki: open [project] page`
6. **BrainDump** — "Promote to wiki" one-tap action creates intent/knowledge page

## API Contract
All integrations hit wiki API at localhost:8093. Phoenix backend proxies requests.

## Status
- [x] Wiki API live
- [ ] Phoenix proxy routes added
- [ ] Wiki app React component
- [ ] Projects integration
- [ ] Command palette extension
