# Wiki Engine

Custom knowledge management system for Trajan. Replaces vault with a unified wiki engine featuring full-text search, graph visualization, REST API, and real-time WebSocket updates.

## Architecture

```
┌─────────────────────────────┐
│   Web Mirror (port 8091)    │  ← Browser UI
│   Vanilla JS SPA            │
└──────────────┬──────────────┘
               │
     ┌─────────┴─────────┐
     │                   │
┌────▼──────────────┐   └──────────┐
│  API Server       │              │
│  (port 4488)      │         WebSocket
│  Hono + SQLite    │         (live sync)
│  with FTS5        │
└────┬──────────────┘
     │
     ▼
┌──────────────────────┐
│   wiki.db (SQLite)   │
│   ├─ pages           │  ← Vault indexed
│   ├─ edges (graph)   │
│   ├─ projects        │
│   └─ versions        │
└──────────────────────┘
```

## Setup

### 1. Install dependencies

```bash
cd /home/trajan/Projects/wiki-engine
npm install
```

### 2. Index the vault

```bash
# Dry run (preview what will be indexed)
npm run index-vault:dry

# Full indexing
npm run index-vault
```

### 3. Start servers

**Both servers together:**
```bash
npm run start:all
```

**Or individually:**
```bash
# Terminal 1: API server
npm start

# Terminal 2: Web server
npm run web
```

### 4. Access the wiki

- **Web UI:** http://localhost:8091
- **API:** http://localhost:4488/api/wiki
- **WebSocket:** ws://localhost:4488

## API Endpoints

### Pages
- `GET /api/wiki/pages` — list pages (with filters)
- `GET /api/wiki/pages/:id` — get page by ID
- `GET /api/wiki/pages/by-path/:path` — get page by wiki path
- `POST /api/wiki/pages` — create page
- `PUT /api/wiki/pages/:id` — update page
- `DELETE /api/wiki/pages/:id` — soft-delete (archive) page
- `GET /api/wiki/pages/:id/versions` — version history
- `POST /api/wiki/pages/:id/relations` — add wikilink

### Search
- `GET /api/wiki/search?q=&mode=fts&limit=20` — full-text search

### Graph
- `GET /api/wiki/pages/:id/graph?depth=2` — knowledge graph around page
- `GET /api/wiki/graph/full?space=&node_limit=200` — full graph snapshot

### Spaces & Projects
- `GET /api/wiki/spaces` — list spaces
- `POST /api/wiki/spaces` — create a space
- `GET /api/wiki/spaces/:space` — fetch a space summary by id or slug
- `GET /api/wiki/spaces/:space/projects` — list projects in space
- `POST /api/wiki/spaces/:space/projects` — create a project inside a space
- `GET /api/wiki/spaces/:space/tree` — hierarchical view

### Superman/Intent
- `GET /api/wiki/context/:project_id` — assembled context for agent dispatch
- `GET /api/wiki/projects/:id/intents` — intent pages for project
- `POST /api/wiki/prompt` — agent instruction → page update

### Admin
- `GET /api/wiki/health` — server health
- `GET /api/wiki/stats` — index statistics
- `GET /api/wiki/types` — page type schema

## Page Types

Each page has a `type` field. Supported types:

- **knowledge** — Notes, learnings, research findings
- **project** — Projects with status tracking, github repo links
- **intent** — Superman intent pages (objectives, constraints, context)
- **task** — Actionable tasks with priority, status, due date
- **research** — Research findings, analysis, depth/status
- **decision** — Architecture/strategy decisions with rationale
- **codebase** — Code repositories, tech stack, deployment info
- **meeting** — Meeting notes, daily logs, action items
- **sprint** — Weekly sprints, goals, completed, blockers
- **config** — System and project configuration

Each type has optional `fields` JSON storing type-specific metadata.

## Vault Structure

The indexer maps vault folders → page types:

| Folder | Type | 
|--------|------|
| Projects/ | project |
| Research/ | research |
| Daily Notes/ | meeting |
| Decisions/ | decision |
| System/ | config |
| Codebases/ | codebase |
| Skills/ | knowledge |
| Agent Knowledge/ | knowledge |
| (default) | knowledge |

## Features

### Full-Text Search
Uses SQLite FTS5 with BM25 ranking. Queries support:
- Simple text: `foo bar` → pages with both words
- Prefix: `arch*` → architecture, archives, etc
- Fallback to LIKE search on FTS query failure

### Knowledge Graph
- Automatically extract wikilinks (`[[page name]]`) from content
- Build edges between pages
- Query neighbors up to depth N
- Full graph visualization snapshot

### Filesystem Sync
- All pages stored as Markdown + YAML frontmatter in vault
- API writes sync back to filesystem
- Can edit vault files directly; index-vault picks up changes

### WebSocket Broadcasts
- `wiki:connected` — client connected
- `wiki:page_created` — new page indexed
- `wiki:page_updated` — page modified
- `wiki:page_deleted` — page archived
- `wiki:edge_added` — new wikilink created

### Versioning
- Every update creates a version snapshot
- Retrieve page history: `GET /api/wiki/pages/:id/versions`

## Superman Integration

Intent pages store agent context:

```yaml
---
title: Project X Intent
type: intent
---

**Objective:** Build X
**Constraints:** Must work offline
**Current State:** In design phase
**Next Milestone:** Prototype by Friday
```

Query context for dispatch:
```bash
GET /api/wiki/context/project-x-id
```

Returns:
- Intent page with parsed fields
- Recent activity in project
- Active tasks
- Graph neighbors
- Formatted text context block for agent prompts

## Development

### Project layout
```
wiki-engine/
├── server/
│   ├── index.js              ← HTTP + WebSocket server
│   ├── db.js                 ← SQLite schema, migrations
│   ├── ws.js                 ← WebSocket broadcaster
│   ├── routes/
│   │   ├── pages.js          ← CRUD operations
│   │   ├── search.js         ← FTS queries
│   │   ├── graph.js          ← Graph traversal
│   │   ├── spaces.js         ← Spaces/projects
│   │   ├── types.js          ← Type schemas
│   │   ├── intent.js         ← Superman integration
│   │   └── ...
│   └── utils/
│       ├── markdown.js       ← Wikilink parsing
│       └── frontmatter.js    ← YAML handling
├── web/
│   ├── server.js             ← Static file server + API proxy
│   ├── index.html            ← SPA shell
│   ├── app.js                ← Router, views
│   └── style.css
├── scripts/
│   ├── index-vault.js        ← Vault indexer
│   └── start-all.js
├── wiki.db                   ← SQLite (created at runtime)
├── package.json
└── README.md
```

### Adding a new route

1. Create `server/routes/foo.js`:
```js
const { Hono } = require('hono');
const router = new Hono();

router.get('/', (c) => c.json({ foo: 'bar' }));

module.exports = router;
```

2. Mount in `server/index.js`:
```js
app.route('/api/wiki/foo', require('./routes/foo'));
```

### Modifying the database schema

Edit `server/db.js` → `initSchema()`. Changes apply on next server start (DB is created if missing, schema added if tables don't exist).

## Performance Notes

- SQLite FTS5 queries: <50ms on 2500+ page indexes
- WebSocket broadcasts: ~1ms per connected client
- Page load (with content): <100ms from DB
- Full graph query (200 nodes): <200ms

## Future Improvements

- [ ] Graph visualization (Cytoscape.js)
- [ ] Markdown editor (ProseMirror/Milkdown) in web UI
- [ ] Collaborative editing (CRDTs, yjs)
- [ ] OPML export/import
- [ ] Embedding-based semantic search
- [ ] Multi-user auth + permissions
- [ ] Published pages → static site export
- [ ] Mobile app

## License

Personal project. All vault content remains confidential.
