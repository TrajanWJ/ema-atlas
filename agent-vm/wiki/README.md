---
title: "Wiki Engine"
type: knowledge
created: 2026-04-04
---

# Wiki Engine MVP

Personal wiki engine — Markdown + YAML frontmatter files on disk + SQLite FTS5 index + REST API.

## Quick Start

```bash
# Install and start
cd /home/trajan/wiki
./start.sh

# API is now running at http://localhost:8091
```

## Manual Setup

```bash
cd /home/trajan/wiki
npm install
npm run build        # compile TypeScript
npm start            # start server (indexes pages on boot)
```

## Development (no compile step)

```bash
npm install
npx ts-node engine/server.ts
```

## Vault Migration

```bash
# Preview what would be migrated (no writes)
npm run migrate:dry-run

# Run full migration
npm run migrate:run

# Spot-check 20 random migrated pages
npm run migrate:verify
```

Migration skips: `LCM Summaries/` (noise), `Claude-Code-Memory/`, `_deprecated/`, `Inbox/`

Report written to: `wiki/migrate/report.json`

## API Reference

All endpoints return JSON.

### List pages
```
GET /api/pages
  ?type=research
  ?project=EMA
  ?agent=researcher
  ?tags=tag1,tag2
  ?status=active
  ?created_after=2026-01-01
  ?updated_before=2026-03-01
  ?sort=created_desc|updated_desc|title_asc|impact_score_desc
  ?limit=100
  ?offset=0
```

### Get page
```
GET /api/pages/:id
```

### Create page
```
POST /api/pages
Content-Type: application/json

{
  "frontmatter": {
    "title": "My Research",
    "type": "research",
    "tags": ["ai", "agents"],
    "project": "EMA"
  },
  "content": "# My Research\n\nContent here."
}
```

### Update page
```
PUT /api/pages/:id
Content-Type: application/json

{
  "frontmatter": { "status": "archived" },
  "content": "Updated content..."
}
```

### Delete (soft archive)
```
DELETE /api/pages/:id
```

### Search
```
GET /api/search?q=superman+runtime&limit=20
```

### Graph (backlinks + forward links)
```
GET /api/graph/:id
```

### Types / Spaces
```
GET /api/types
GET /api/spaces
```

### Project intents (Superman)
```
GET /api/projects/EMA/intents
```

## Directory Structure

```
wiki/
├── engine/           # TypeScript source
│   ├── server.ts     # Express API server
│   ├── store.ts      # Page CRUD operations
│   ├── indexer.ts    # File scanner / SQLite indexer
│   ├── parser.ts     # Markdown + frontmatter parser
│   ├── watcher.ts    # File change watcher (auto-reindex)
│   ├── db.ts         # SQLite schema + queries
│   └── types.ts      # TypeScript types
├── migrate/
│   └── migrate.ts    # Vault migration tool
├── spaces/
│   └── default/      # All wiki pages live here
│       ├── projects/
│       ├── research/
│       ├── knowledge/
│       ├── decisions/
│       ├── sessions/
│       ├── daily-notes/
│       ├── agents/
│       ├── operations/
│       ├── codebases/
│       └── system/
├── wiki.db           # SQLite index (auto-generated)
├── package.json
├── tsconfig.json
└── start.sh
```

## Page Types (16 canonical types)

| Type | Folder | Purpose |
|---|---|---|
| `project` | projects/ | Active initiatives |
| `research` | research/ | Deep-dive findings |
| `intent` | projects/{p}/.superman/intents/ | Superman goals/constraints |
| `intent-bundle` | projects/{p}/.superman/ | Aggregated intent context |
| `task` | projects/{p}/tasks/ | Discrete work items |
| `decision` | decisions/ | Decision records (ADRs) |
| `codebase` | codebases/ | Codebase documentation |
| `config` | system/configs/ | Configuration docs |
| `agent-profile` | agents/{name}/ | Agent definitions |
| `agent-learning` | agents/{name}/learnings/ | Agent learnings |
| `session-summary` | sessions/ | Session outputs |
| `daily-note` | daily-notes/ | Daily logs |
| `playbook` | operations/ | SOPs / runbooks |
| `integration` | system/integrations/ | System integrations |
| `synthesis` | research/synthesis/ | Cross-topic synthesis |
| `knowledge` | knowledge/ | General reference |

## Environment Variables

```bash
WIKI_PORT=8091    # API port (default: 8091)
```
