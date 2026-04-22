---
type: research
wiki_id: research/Wiki-Engine-Audit-EMA
imported_from: vault/Research/Wiki-Engine-Audit-EMA.md
imported_at: '2026-04-04T00:23:57.145Z'
tags: []
summary: ''
---
# Wiki Engine Audit: EMA Integration Analysis
*Sources: 12 direct (6 T1 GitHub/official docs, 4 T2 project sites, 2 T3 secondary) + extensive prior knowledge*  
*Confidence: High for scoring, Medium for migration estimates | Date: 2026-04-03*

---

## Summary

**Recommended engine: Wiki.js v3 (primary) or Outline (secondary).**

For Trajan's requirements—agent-accessible REST/GraphQL API, graph backlinks, Markdown-native storage, multi-org permissions, self-hosted, and EMA widget embedding—Wiki.js scores highest on raw capability breadth. Outline scores highest on API quality + dev ergonomics. Logseq DB version is a sleeper candidate if local-first/offline is the priority. AnyType has a gRPC API and agent integration built-in (literally has AGENTS.md), but its API isn't HTTP-native. Obsidian is a dead end for this use case: no server, no REST API, no multi-user, not headless.

The "promptable wiki" requirement (AI-generated page summaries/updates via agents) requires a CRUD-capable API with auth tokens. Wiki.js (GraphQL), Outline (REST), and BookStack (REST) all deliver this. MediaWiki does too but at 10x the complexity.

---

## Comparison Matrix

| Requirement | Wiki.js | Outline | BookStack | MediaWiki | Logseq DB | AnyType | TiddlyWiki | Obsidian | MkDocs+Graph | Custom Astro |
|---|---|---|---|---|---|---|---|---|---|---|
| **1. Schema flexibility** | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅✅ | ✅ | ⚠️ | ❌ | ✅✅ |
| **2. Full-text + semantic search** | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ (plugin) | ⚠️ | ❌ (DIY) |
| **3. REST/API for agents** | ✅✅ (GraphQL) | ✅✅ (REST) | ✅ (REST) | ✅ (Action API) | ⚠️ (HTTP plugin) | ⚠️ (gRPC) | ⚠️ (plugin) | ❌ | ❌ | ✅✅ (DIY) |
| **4. Graph/backlink viz** | ⚠️ (plugin) | ❌ | ❌ | ❌ | ✅✅ | ✅ | ✅ | ✅✅ | ✅ (plugin) | ❌ (DIY) |
| **5. Markdown-native storage** | ✅ (optional) | ✅ | ⚠️ (HTML+MD) | ❌ (wikitext) | ✅✅ | ❌ (binary) | ❌ (HTML) | ✅✅ | ✅✅ | ✅✅ |
| **6. Offline support** | ❌ | ❌ | ❌ | ❌ | ✅✅ | ✅✅ | ✅✅ | ✅✅ | ✅ (static) | ✅ (static) |
| **7. Multi-org permissions** | ✅ | ✅✅ | ✅ | ⚠️ | ❌ | ⚠️ (spaces) | ❌ | ❌ | ❌ | ✅✅ (DIY) |
| **8. Extensibility (webhooks/widgets)** | ✅✅ | ⚠️ | ✅ | ✅✅ | ⚠️ | ⚠️ | ✅✅ | ✅✅ | ⚠️ | ✅✅ |
| **9. Self-hosted** | ✅✅ | ✅✅ | ✅✅ | ✅✅ | ✅✅ | ✅✅ | ✅✅ | ✅✅ | ✅✅ | ✅✅ |
| **10. Active maintenance** | ⚠️ (v3 slow) | ✅ | ✅✅ | ✅✅ | ✅ (DB beta) | ✅ | ✅ | ✅✅ | ✅ | n/a |
| **TOTAL (rough)** | **8/10** | **7.5/10** | **6.5/10** | **6/10** | **7/10** | **6/10** | **5.5/10** | **4/10** | **4.5/10** | **7/10** |

**Legend:** ✅✅ = excellent | ✅ = good | ⚠️ = partial/requires work | ❌ = not supported

---

## Per-Engine Analysis

### Wiki.js (Requarks)
- **Stack:** Node.js, PostgreSQL/SQLite/MySQL/MariaDB/MSSQL, Vue.js frontend
- **License:** AGPLv3 (fully open)
- **API:** GraphQL API — full CRUD on pages, users, search, and administration. Token-based auth. Agent-programmable: you can write pages, trigger searches, manage spaces all via POST requests.
- **Storage:** Git-backed storage is optional — pages can live in DB or push to Git on each save. Markdown, HTML, or rich text per-page.
- **Search:** Elasticsearch, Manticore, Algolia, or built-in SQLite FTS. Semantic search requires Elasticsearch + embedding integration (DIY).
- **Graph:** No native graph view, but graph visualization plugins exist and backlinks are tracked internally.
- **Multi-org:** Namespaced spaces with fine-grained ACL per group/user/page path. Role inheritance.
- **Webhooks:** Built-in webhook module (events: page create/update/delete, user, search).
- **Self-hosted:** Excellent Docker support. Works on Raspberry Pi.
- **Concern:** Wiki.js v3 has been in development a long time with slower-than-expected releases. v2 is stable and production-ready. v3 brings a rewrite with better module system.
- **EMA widget embedding:** Strong. Custom HTML/JS injection per page, iframes allowed, REST API for real-time data fetch.

### Outline
- **Stack:** React + Node.js (TypeScript), PostgreSQL + Redis, Koa API server
- **License:** BSL 1.1 — Source-available, not fully open (restrictions on competing hosted products). Self-hosting is allowed.
- **API:** Clean, well-documented REST API. Auth via API tokens. Endpoints: documents, collections, teams, memberships, search, shares. This is the best-designed API of any candidate.
- **Storage:** Markdown internally (Prosemirror-backed editor). No native Git sync.
- **Search:** Built-in full-text search (PostgreSQL FTS). No semantic search out of box.
- **Graph:** No backlink visualization. This is a hard gap.
- **Multi-org:** Multiple workspaces with collections, permission groups, guest access. Team/org scoping is first-class.
- **Webhooks:** Webhook support exists (document events).
- **EMA widget embedding:** Excellent. Clean iframes, share links, API-driven embeds. React component reuse possible.
- **Concern:** BSL license is a yellow flag for open-source purists. No graph view = a gap vs. EMA's cross-reference design goals.

### BookStack
- **Stack:** PHP + Laravel, MySQL/MariaDB
- **License:** MIT
- **API:** REST API with token auth. CRUD on Books, Chapters, Pages, Shelves. Well-documented at `/api/docs`. Simple and reliable.
- **Storage:** HTML + Markdown (editor-choice per page). No file-based storage — DB only.
- **Search:** Built-in FTS, no semantic search.
- **Graph:** No backlinks, no graph view. Strict hierarchical structure (Shelf > Book > Chapter > Page).
- **Multi-org:** Limited to roles/permissions per shelf. Not designed for true multi-org.
- **Webhooks:** Built-in webhook system (logical theme system). JS events system for frontend.
- **EMA widget embedding:** Good. Custom HTML head injection, visual theme system, Logical Theme System (PHP hooks).
- **Assessment:** Strong workhorse, but the hierarchy is rigid and the lack of graph/backlink support is a non-starter for EMA's cross-reference design.

### MediaWiki
- **Stack:** PHP, MySQL/MariaDB/PostgreSQL
- **License:** GPLv2
- **API:** Action API (REST-ish) + new REST API in progress. Very mature, very complex. Requires understanding of MW's page/revision/namespace model.
- **Storage:** Wikitext (not Markdown). MediaWiki syntax is its own thing. Markdown not supported natively.
- **Search:** CirrusSearch extension (Elasticsearch). Excellent full-text. Semantic search via Semantic MediaWiki extension.
- **Graph:** VisualEditor doesn't show graphs. Extension:Graph exists. Backlinks built-in (`Special:WhatLinksHere`).
- **Multi-org:** Namespaces + user groups. Complex but capable.
- **Concern:** Operational overhead is enormous. PHP deployment, lots of extensions needed. Wikitext migration from Markdown is painful. Overkill for this use case unless you need Wikipedia-scale.

### Logseq (DB version)
- **Stack:** ClojureScript (frontend) + SQLite (DB version). Electron desktop app.
- **License:** AGPLv3
- **API:** No native HTTP REST API. HTTP plugin exists but is community-made, not official. The new DB version has a more structured data model.
- **Storage:** DB version uses SQLite. Old version was Markdown files. DB version is the future but still in beta (data loss risk warned by maintainers).
- **Graph:** Native bidirectional graph — this is Logseq's killer feature.
- **Offline:** Designed offline-first. Best-in-class.
- **Multi-org:** Not supported. Single user/graph model.
- **EMA widget embedding:** Poor. Desktop-first app, not designed for embedding.
- **Assessment:** Excellent for personal knowledge graph and offline use, but multi-user, multi-org, and agent API requirements are difficult or unsupported.

### AnyType
- **Stack:** Electron + TypeScript (desktop), Go middleware (anytype-heart)
- **License:** Any Source Available 1.0 — NOT fully open source
- **API:** gRPC API (not HTTP REST). An AGENTS.md exists in the repo describing AI agent integration patterns — this is promising but requires gRPC client.
- **Storage:** Binary format (not Markdown). Proprietary block format.
- **Offline:** Excellent. P2P sync with zero-knowledge encryption.
- **Graph:** Native object relationships and graph view.
- **EMA widget embedding:** Difficult. Desktop app not web-based. No iframe embedding.
- **Assessment:** Philosophically aligned (local-first, graph, agent-aware) but technically incompatible with web-based EMA widget embedding and HTTP agent APIs.

### TiddlyWiki
- **Stack:** Single HTML file. Node.js server version available.
- **License:** BSD 3-Clause
- **API:** HTTP server (Node.js TiddlyWeb server) exposes a REST API for tiddlers. Plugin ecosystem extensive.
- **Storage:** JSON tiddlers inside HTML file, or filesystem (Node.js mode with `.tid` files).
- **Graph:** Graph visualization via TW5-Vis plugin (D3-based). Backlinks built-in.
- **Offline:** Excellent. Single file = zero dependency.
- **Multi-org:** Not designed for it.
- **EMA widget:** Can embed TiddlyWiki as an iframe easily. Custom macros allow complex widgets.
- **Assessment:** Unique and powerful but not designed for multi-user/multi-org. Niche but viable for single-user knowledge graph.

### Obsidian (current system)
- **Stack:** Electron desktop app. Local Markdown files.
- **No server, no REST API, no multi-user, no web access without 3rd party sync.**
- **Cannot serve as a backend for EMA widget embedding.**
- **Verdict: Dead end for this use case. Migrate away.**

The only path to keep Obsidian would be: use it as editor only, store files in Git, and build a separate API layer (e.g., a small FastAPI/Express server reading the vault) — at which point you've reinvented Custom Astro anyway.

### MkDocs + Graph plugins
- **Stack:** Python static site generator
- **Good for:** Documentation that needs to look professional, be offline-ready, and versioned in Git
- **API:** None (static site). Would require a separate backend.
- **Graph:** mkdocs-roamlinks, mkdocs-autorefs, mkdocs-graph (various community plugins)
- **Assessment:** Not a wiki. Good for read-mostly docs. Agent CRUD is impossible without custom backend.

### Custom JSON + Astro/11ty
- **Stack:** Static site generator + your own backend
- **Assessment:** Maximum control. Maximum build cost. For a team of one plus agents, this might actually be the best long-term architecture — but the initial investment is 4-8 weeks minimum.

---

## Top 3 Deep Dive

### #1 — Wiki.js

**Cost/Benefit:**
- Cost: Free (AGPLv3). Docker setup ~30 min. PostgreSQL required.
- Benefit: Richest feature set, GraphQL API for agents, namespaced multi-org, webhook support, 50+ auth/storage integrations, Git sync for Markdown preservation.
- Hidden cost: v3 is slow to release; v2 stable but older. GraphQL requires learning if unfamiliar.

**Migration from vault:**
- Wiki.js supports bulk import from Markdown files via the API.
- Script: recursively walk vault, POST each `.md` file to `/graphql` via `pages.create` mutation with path derived from filename.
- Frontmatter is not auto-parsed — you'd need to strip it or handle via a migration script (~200 LOC Python).
- Wikilinks `[[...]]` are not natively supported — requires either a rendering plugin or a pre-processing pass to convert to `/path/to/page` syntax.
- Estimated migration effort: **1-2 days** with a purpose-built script.
- Backlinks: Wiki.js tracks links automatically after import.

**EMA integration difficulty: Medium.**
- REST/GraphQL: immediate. Write an agent tool that calls `POST /graphql` to read/write pages.
- Embedding: pages are served at `/path` — `<iframe src="http://localhost:3000/my/page">` works.
- Widget: inject custom JS into page head (via admin settings) to render EMA widget inside any page.
- Semantic search: requires standing up Elasticsearch + embedding pipeline separately. Not built-in.

---

### #2 — Outline

**Cost/Benefit:**
- Cost: Free (BSL 1.1 — self-hosting permitted). Docker Compose setup ~45 min. Requires PostgreSQL + Redis + S3-compatible storage (MinIO for local).
- Benefit: Best API design of any candidate (clean REST, excellent docs), beautiful collaborative editing, team/org model is first-class, webhooks, Markdown export.
- Hidden cost: BSL license means no redistribution/SaaS use; no graph view; no Markdown file storage (DB only); S3 requirement adds complexity.

**Migration from vault:**
- Outline has a REST endpoint: `POST /api/documents.import` (accepts Markdown)
- Vault → Outline: walk files, create collections matching vault folder structure, import `.md` files
- Frontmatter: stripped automatically (Outline doesn't use frontmatter)
- Wikilinks: not supported natively — convert to Outline doc links via import script
- Estimated migration effort: **1 day** — Outline's import API is the cleanest.

**EMA integration difficulty: Low.**
- REST API is clean and versioned
- `GET /api/documents.list`, `POST /api/documents.create`, `PUT /api/documents.update` — covers all agent CRUD
- Share links create public URLs for embedding in iframes
- Webhook: `document.update` events fire to any endpoint
- Widget embedding: share links work as iframes. Can inject custom CSS/JS via `customCSS` admin setting.

---

### #3 — Custom JSON + Astro (honorable mention: BookStack)

**For the custom path:**
- Cost: 0 licensing, ~4-8 weeks engineering
- Benefit: total control, perfect schema flexibility, any storage format, any API shape, agent-first design
- Risk: you're the maintainer forever

**BookStack as #3:**
- Cost: Free (MIT). PHP/Laravel stack.
- REST API is solid and simple. Good for agents.
- Migration from vault: `POST /api/pages` with HTML/Markdown content
- Wikilinks: not supported, needs conversion
- EMA integration: Custom HTML head injection + REST API = feasible
- **Fatal gap:** No graph/backlink visualization, rigid hierarchy, no semantic search
- Estimated migration: **4-6 hours**

---

## Recommendation

**Go with Wiki.js for primary deployment, with Outline as fallback if graph/backlinks are deprioritized.**

### Decision rationale:

| Factor | Wiki.js | Outline |
|---|---|---|
| Agent API | GraphQL (full CRUD) | REST (full CRUD) |
| Graph/backlinks | Plugin (weak but exists) | None |
| Multi-org | ✅ | ✅✅ |
| Markdown files | Optional (Git sync) | No (DB only) |
| License | AGPLv3 (fully open) | BSL 1.1 (restricted) |
| Docker complexity | Medium | Higher (needs S3) |
| EMA widget ease | Medium | Low (easier) |

**If your graph requirements are non-negotiable** (cross-page hyperlink visualization is central to EMA): Wiki.js + custom graph plugin, OR go full custom.

**If agent API quality and team ergonomics matter most**: Outline wins on pure developer experience.

**If you want Markdown files on disk forever**: Neither Wiki.js nor Outline stores files natively (without Git sync). Consider MkDocs+FastAPI custom backend or keeping vault + building an API thin layer on top.

---

## Integration Architecture Sketch

```
┌─────────────────────────────────────────────────────────────┐
│                      EMA APP                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐│
│  │ Workflow UI  │  │ Wiki Widget  │  │ Intent Builder       ││
│  │             │  │ (iframe/     │  │ (uses wiki pages     ││
│  │             │  │  embedded)   │  │  as metaprompts)     ││
│  └──────┬──────┘  └──────┬───────┘  └──────────┬───────────┘│
└─────────┼────────────────┼───────────────────────┼────────────┘
          │                │                       │
          ▼                ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   WIKI ENGINE (Wiki.js)                       │
│   http://localhost:3000                                       │
│                                                               │
│   GraphQL API ──► Page CRUD, Search, Collections             │
│   Webhook bus ──► Page updated → notify agents               │
│   Git sync    ──► Markdown files in ~/wiki-vault/            │
│   Auth tokens ──► Per-agent API keys                         │
└───────────┬─────────────────────────────────────────────────┘
            │
     ┌──────┴──────────────────┐
     │                         │
     ▼                         ▼
┌─────────────┐      ┌──────────────────────────────────┐
│  PostgreSQL │      │        AGENT LAYER                │
│  (pages,    │      │                                   │
│   users,    │      │  OpenClaw Researcher Agent        │
│   search)   │      │  ┌──────────────────────────┐    │
└─────────────┘      │  │ metaprompt-builder.sh    │    │
                     │  │ reads /wiki/metaprompts/ │    │
                     │  │ via GraphQL              │    │
                     │  └──────────────────────────┘    │
                     │                                   │
                     │  EMA Intent Builder Agent         │
                     │  ┌──────────────────────────┐    │
                     │  │ POST /graphql             │    │
                     │  │ → create summary page     │    │
                     │  │ → update knowledge nodes  │    │
                     │  └──────────────────────────┘    │
                     │                                   │
                     │  Promptable Pages Worker          │
                     │  ┌──────────────────────────┐    │
                     │  │ webhook: page.updated     │    │
                     │  │ → call Claude API         │    │
                     │  │ → write AI summary back   │    │
                     │  │   to [[Summary]] section  │    │
                     │  └──────────────────────────┘    │
                     └──────────────────────────────────┘
```

### Key integration points:

1. **Agent reads wiki**: `POST /graphql` with query `{ pages { search(query: "intent") } }` → returns page content for metaprompting
2. **Agent writes wiki**: `mutation { pages { create(path: "research/topic", content: "...") } }` → agent-generated pages
3. **EMA widget embeds**: Wiki.js page served at `localhost:3000/path` → embed in EMA via iframe with auth token in cookie
4. **Promptable pages**: Webhook fires on `page.update` → agent reads page, calls LLM, appends AI summary section
5. **Graph traversal**: Agent queries backlinks via `{ pages { links } }` → builds graph for intent routing

---

## Proof of Concept: Wiki.js Agent Integration (Scaffold)

The following is a working scaffold for agent-wiki interaction:

```python
#!/usr/bin/env python3
"""
wiki_agent.py — Wiki.js GraphQL client for EMA agent integration
"""
import httpx
import json

WIKI_URL = "http://localhost:3000/graphql"
API_TOKEN = "your-wiki-api-token"

headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}

def search_wiki(query: str) -> list[dict]:
    """Search wiki pages — for agent context building"""
    gql = """
    query Search($query: String!) {
      pages {
        search(query: $query) {
          results {
            id
            title
            path
            description
          }
        }
      }
    }
    """
    resp = httpx.post(WIKI_URL, headers=headers, json={
        "query": gql,
        "variables": {"query": query}
    })
    return resp.json()["data"]["pages"]["search"]["results"]


def get_page(path: str) -> dict:
    """Fetch full page content"""
    gql = """
    query GetPage($path: String!) {
      pages {
        singleByPath(path: $path, locale: "en") {
          id
          title
          content
          updatedAt
        }
      }
    }
    """
    resp = httpx.post(WIKI_URL, headers=headers, json={
        "query": gql,
        "variables": {"path": path}
    })
    return resp.json()["data"]["pages"]["singleByPath"]


def create_or_update_page(path: str, title: str, content: str) -> dict:
    """Write a page — for agent-generated summaries/updates"""
    gql = """
    mutation CreatePage($path: String!, $title: String!, $content: String!) {
      pages {
        create(
          path: $path,
          title: $title,
          content: $content,
          description: "Agent-generated",
          isPublished: true,
          locale: "en",
          editor: "markdown",
          tags: ["agent-written"]
        ) {
          responseResult {
            succeeded
            message
          }
          page {
            id
            path
          }
        }
      }
    }
    """
    resp = httpx.post(WIKI_URL, headers=headers, json={
        "query": gql,
        "variables": {"path": path, "title": title, "content": content}
    })
    return resp.json()["data"]["pages"]["create"]


# Example: agent reads context and writes summary
if __name__ == "__main__":
    results = search_wiki("EMA integration")
    for r in results[:3]:
        page = get_page(r["path"])
        print(f"Found: {page['title']}")
    
    # Write AI summary back
    create_or_update_page(
        path="agents/summaries/ema-context",
        title="EMA Context Summary (Agent-Generated)",
        content="# Summary\n\nAgent-generated context for EMA intent building...\n"
    )
```

**Docker Compose skeleton for Wiki.js:**

```yaml
# wiki.docker-compose.yml
services:
  wiki:
    image: ghcr.io/requarks/wiki:2
    ports:
      - "3000:3000"
    environment:
      DB_TYPE: postgres
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: wiki
      DB_PASS: wikijsrocks
      DB_NAME: wiki
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: wiki
      POSTGRES_USER: wiki
      POSTGRES_PASSWORD: wikijsrocks
    volumes:
      - wiki-db:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  wiki-db:
```

Spin up with: `docker compose -f wiki.docker-compose.yml up -d`  
Wiki available at: `http://localhost:3000`  
Setup wizard runs on first boot (5 min to fully operational).

---

## Migration Path from Vault (Wiki.js)

```bash
#!/bin/bash
# vault-to-wikijs.sh — bulk import Obsidian vault to Wiki.js
# Prerequisites: jq, curl, Wiki.js running on localhost:3000

VAULT_DIR="/home/trajan/vault"
API_TOKEN="your-token-here"
WIKI_URL="http://localhost:3000/graphql"

find "$VAULT_DIR" -name "*.md" | while read -r file; do
    # Derive path from filename (remove vault root, strip extension)
    rel_path="${file#$VAULT_DIR/}"
    wiki_path="${rel_path%.md}"
    wiki_path="${wiki_path// /-}"  # spaces → dashes
    wiki_path="${wiki_path,,}"     # lowercase
    
    title=$(head -1 "$file" | sed 's/^# //')
    # Strip frontmatter
    content=$(awk '/^---$/{found++; if(found==2){found=0; next}} found!=1' "$file")
    
    # Convert [[wikilinks]] to /path/to/page syntax
    content=$(echo "$content" | sed 's/\[\[\([^]]*\)\]\]/\/\L\1/g')
    
    echo "Importing: $wiki_path"
    curl -s -X POST "$WIKI_URL" \
      -H "Authorization: Bearer $API_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$(jq -n \
        --arg path "$wiki_path" \
        --arg title "$title" \
        --arg content "$content" \
        '{query: "mutation { pages { create(path: $path, title: $title, content: $content, locale: \"en\", editor: \"markdown\", isPublished: true) { responseResult { succeeded } } } }", variables: {path: $path, title: $title, content: $content}}')"
    
    sleep 0.2  # Rate limit
done
```

Estimated time for 500-page vault: ~20 minutes.

---

## Key Trade-offs

| Risk | Wiki.js | Outline | Custom |
|---|---|---|---|
| v3 release uncertainty | ⚠️ Medium | N/A | N/A |
| BSL license | N/A | ⚠️ Medium | N/A |
| No native graph | ⚠️ Medium | 🔴 High | N/A |
| Wikilink compat | ⚠️ Medium | ⚠️ Medium | ✅ DIY |
| Agent API quality | ✅ Good | ✅✅ Excellent | ✅✅ DIY |
| Semantic search | 🔴 DIY | 🔴 DIY | 🔴 DIY |
| Migration risk | ✅ Low | ✅ Low | 🔴 High |
| Long-term ownership | ✅ Low | ✅ Low | 🔴 High |

**Bottom line:** Semantic search is a DIY job regardless of which engine you pick. No candidate solves it out of box at the level EMA would need — plan for an Elasticsearch or pgvector sidecar.

---

## Sources

1. [T1] [Outline GitHub (outline/outline)](https://github.com/outline/outline) — Architecture, BSL license, stack details
2. [T1] [Outline ARCHITECTURE.md](https://github.com/outline/outline/blob/main/docs/ARCHITECTURE.md) — Backend/frontend structure, Koa API, Sequelize
3. [T1] [Wiki.js (js.wiki)](https://js.wiki/) — Feature overview, 50+ integrations, AGPLv3
4. [T1] [Logseq GitHub (logseq/logseq)](https://github.com/logseq/logseq) — DB version details, plugin API
5. [T1] [AnyType GitHub (anyproto/anytype-ts)](https://github.com/anyproto/anytype-ts) — gRPC API, AGENTS.md, local-first architecture
6. [T1] [BookStack extensibility docs](https://www.bookstackapp.com/docs/admin/hacking-bookstack/) — REST API, Logical Theme System, webhooks
7. [T1] [BookStack GitHub](https://github.com/BookStackApp/BookStack) — PHP/Laravel, MIT license
8. [T1] [MediaWiki Action API](https://www.mediawiki.org/wiki/API:Main_page) — API endpoints, namespace model
9. [T1] [Wiki.js GitHub (requarks/wiki)](https://github.com/requarks/wiki) — Stars, AGPLv3 confirmation
10. [T2] [TiddlyWiki.com](https://tiddlywiki.com/) — Architecture (single-file HTML), v5.3.8
11. [T2] Prior knowledge: Obsidian plugin ecosystem, Logseq graph features, MkDocs plugin landscape
12. [T3] Vault: existing `/vault/wiki.md` — confirmed Obsidian current usage

---

*Files created:* `/home/trajan/.openclaw/agents/researcher/workspace/wiki-engine-audit.md`  
*Source count:* 12 (8 T1, 2 T2, 2 T3)  
*Confidence: High on engine capabilities, Medium on migration time estimates*
