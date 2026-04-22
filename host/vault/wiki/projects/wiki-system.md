---
title: "Wiki System"
type: project
status: active
priority: high
project: Wiki
created: 2026-04-04
updated: 2026-04-04
summary: "Unified, API-first knowledge wiki replacing vault. Serves agents, EMA, Superman, and Quartz web mirror."
tags: [wiki, knowledge, project, system, ema, superman, quartz, vault-migration]
owner: Trajan
---

# Wiki System

## Overview
The Wiki System replaces the flat vault with a structured, queryable, API-first knowledge base. It retains Markdown-native files and Quartz web mirroring while adding a full REST API, semantic search, intent lifecycle tracking, and agent memory capabilities.

## Goals
- Replace vault as the single source of truth for the Trajan system
- Provide agents with queryable context at dispatch time
- Serve as the knowledge layer for EMA (app #14)
- Enable intent pages to drive Superman context injection
- Persist agent session summaries as searchable wiki pages

## Architecture

```
/home/trajan/wiki/
├── engine/          — TypeScript API server (port 8093)
│   ├── server.ts    — Express routes
│   ├── indexer.ts   — Markdown → SQLite indexing
│   ├── db.ts        — SQLite database layer
│   └── watcher.ts   — File watcher for live re-index
├── spaces/
│   └── default/     — All wiki pages (Markdown)
│       ├── intents/
│       ├── projects/
│       ├── knowledge/
│       ├── decisions/
│       ├── research/
│       ├── agents/
│       └── sessions/
└── wiki.db          — SQLite index (FTS5 + metadata)
```

## Key Interfaces

### REST API (localhost:8093)
- `GET /api/pages` — list all pages with filters
- `GET /api/pages/:id` — get page by id
- `POST /api/pages` — create page
- `PUT /api/pages/:id` — update page
- `GET /api/search?q=` — full-text search
- `GET /api/projects/:id/intents` — Superman context block

### File System
Pages are plain `.md` files with YAML frontmatter. Write directly or via API — watcher re-indexes automatically.

### Quartz Mirror
Symlink `/home/trajan/vault/wiki → /home/trajan/wiki/spaces/default` makes wiki pages available in Quartz at `:8090/wiki/`.

## Page Types (16-type schema)
| Type | Purpose |
|------|---------|
| `intent` | Goals, constraints, status for a project or system |
| `project` | Project overview (this file) |
| `decision` | ADR-style records of key decisions |
| `research` | Investigation results, findings |
| `knowledge` | Reference knowledge, how-tos |
| `agent-profile` | Per-agent identity, learnings, history |
| `session-summary` | Auto-created at agent session end |
| `system` | System architecture/operations docs |
| `integration` | Cross-system integration specs |
| `codebase` | Code project documentation |
| `skill` | Agent skill descriptions |
| `reference` | External references, links |
| `template` | Page templates |
| `daily-note` | Daily logs |
| `archive` | Archived/superseded content |
| `report` | Periodic reports and summaries |

## Intent Pages
- [[wiki-system-intent]] — core system intent
- [[wiki-ema-integration-intent]] — EMA integration
- [[wiki-superman-intent]] — Superman context source
- [[wiki-agent-memory-intent]] — agent memory layer

## Status

### Completed
- [x] Wiki engine built (TypeScript + SQLite + FTS5)
- [x] REST API live at :8093
- [x] 1288+ pages indexed from vault migration
- [x] File watcher for live re-index
- [x] `/api/projects/:id/intents` endpoint
- [x] Intent pages created for wiki project
- [x] Quartz symlink (`vault/wiki → wiki/spaces/default`)
- [x] Quartz rebuild wired into file watcher (30s debounce)

### In Progress
- [ ] EMA Wiki App (React component, sidebar integration)
- [ ] Phoenix proxy routes for wiki API
- [ ] OpenClaw dispatch hook for wiki context injection

### Planned
- [ ] Superman.context_for() pointing to wiki API
- [ ] Agent session end hook → session-summary pages
- [ ] Agent profile pages (type:agent-profile)
- [ ] Semantic search layer (embeddings)
- [ ] Vault full cutover (after validation)

## Constraints
- Markdown-native, no proprietary format
- Quartz mirror must remain functional at :8090
- Vault untouched until cutover validated
- Fully self-hosted, no SaaS

## Related
- [[EMA-Unified-Spec-With-Integrations]]
- [[Superman-Runtime-Architecture]]
- [[Quartz-Setup]]
