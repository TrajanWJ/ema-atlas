---
title: Wiki — Unified Knowledge System
type: project
status: active
created: 2026-04-04
updated: 2026-04-04
summary: "Replacing vault with unified wiki: API layer (:8093) + Quartz web mirror (:8090) + agent MCP tools + EMA app. 1288 pages indexed."
tags: [wiki, knowledge, vault-migration, ema, superman]
project: Wiki
---

# Wiki — Unified Knowledge System

## What It Is
Unified knowledge system for the entire Trajan network. Replaces scattered vault files with a queryable, agent-accessible, EMA-integrated wiki.

## Architecture
- **API Engine:** Node.js + SQLite FTS5 at localhost:8093 (`/home/trajan/wiki/`)
- **Web Mirror:** Quartz static site at localhost:8090 (`/home/trajan/quartz/`)
- **Page Storage:** Markdown + YAML at `/home/trajan/wiki/spaces/default/`
- **MCP Server:** `/home/trajan/wiki/mcp/server.py` (agent knowledge tools)
- **Prompt Interface:** `POST /api/wiki/prompt` (natural language page updates)

## Status
- [x] Engine MVP built (Node.js + Express + SQLite FTS5)
- [x] 1288 vault pages migrated and indexed
- [x] API live at :8093 (health, CRUD, search, graph, intents)
- [x] Systemd service registered (wiki-api.service)
- [ ] MCP server wired into OpenClaw
- [ ] EMA Wiki App widget
- [ ] Quartz pointing at wiki/spaces/ (currently reads vault/)
- [ ] Semantic search (Ollama embeddings)
- [ ] Prompt interface tested end-to-end

## Key API Endpoints
- `GET /api/pages?type=project` — list all project pages
- `GET /api/search?q=EMA` — full-text search
- `GET /api/projects/:id/intents` — Superman context for agents
- `POST /api/wiki/prompt` — natural language update

## Related
- [[EMA]] — wiki embedded as app within EMA
- [[Superman-Runtime-Architecture]] — intent layer integration
- [[EMA-Unified-Spec-With-Integrations]] — EMA spec with wiki as app 14
