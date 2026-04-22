---
title: The Wiki
created: '2026-04-01'
type: knowledge
status: active
tags:
  - wiki
  - knowledge-graph
  - meta
  - navigation
summary: >-
  Root page for Trajan's Wiki — a knowledge graph of everything. Structured like
  a wiki with namespaces, typed entities, dense wikilinks, and a query layer.
wiki_id: knowledge/Wiki
imported_from: vault/Wiki.md
imported_at: '2026-04-04T00:23:57.339Z'
---

# The Wiki

Everything Trajan knows, builds, decides, and learns — organized as a navigable knowledge graph.

Not a note-taking app. Not a file dump. A **wiki** — a living graph of typed entities connected by wikilinks, searchable by semantic query and structured frontmatter, maintained by both human and agent contributors.

## Namespaces

| Namespace | What Lives Here | Entries |
|---|---|---|
| [[Codebases/README\|Codebases]] | Every codebase, stack, status, architecture | 17 |
| [[Projects/README\|Projects]] | Active initiatives, buildouts, client work | 30 |
| [[Research/README\|Research]] | Deep dives, competitive analysis, papers | 302 |
| [[Architecture]] | System design decisions, ADRs | 59 |
| [[Agents]] | Agent configs, performance, learnings | 123 |
| [[System]] | Operational docs, runbooks, configs | 167 |
| [[Trajan]] | Preferences, decisions, personal context | 54 |
| [[Skills]] | Installed and custom agent skills | 50 |
| [[Operations]] | Runbooks, incident logs, SOPs | 31 |
| [[Security]] | Audits, hardening, threat models | 7 |
| [[Reference]] | External resources, bookmarks, sources | 57 |
| [[Daily Notes]] | Daily logs (auto-generated) | 23 |
| [[Templates]] | Reusable templates for new entities | 14 |

## Entity Types

Every wiki page has a `type:` in frontmatter. Types enable the [[Query Layer]].

| Type | Count | Description |
|---|---|---|
| `research` | 299 | Research notes, findings, analyses |
| `reference` | 102 | External resources, docs, links |
| `agent` | 85 | Agent configurations, profiles |
| `system` | 53 | System docs, operational |
| `skill` | 48 | Agent skill documentation |
| `personal` | 48 | Personal knowledge, preferences |
| `codebase` | 17 | Codebase documentation |
| `project` | 35 | Project tracking |
| `architecture` | 28 | Architecture decisions |
| `operations` | 17 | Operational procedures |

## How to Use

### Navigate
Follow `[[wikilinks]]` between pages. Every page links to related entities.

### Search
- **Semantic:** `qmd search "query"` — finds by meaning
- **Structured:** Query Layer (see below) — finds by frontmatter fields
- **Full-text:** `grep -r "term" ~/vault/`

### Contribute
- Agents auto-create pages via capture.sh, ontology-sync
- Manual pages: use templates from [[Templates/]]
- Always add frontmatter with `type:`, `tags:`, `related:`
- Link generously — isolated pages are dead pages

## Query Layer

The wiki exposes a structured query interface. Agents and humans can ask:

- "What codebases use Next.js?" → filter by `stack` field
- "What's active and in dev-tools category?" → filter by `status` + `category`  
- "What research relates to multi-agent?" → filter by `tags`
- "What changed this week?" → filter by `updated` date

Implementation: `~/bin/wiki-query.sh` — queries frontmatter across all wiki pages.

## Maintenance

- **QMD:** Re-indexes every 30min (cron)
- **Auto-knowledge:** Captures new topics from sessions
- **Vault freshness:** Identifies stale high-importance pages
- **Bridge sync:** Host vault synced every 60s
- **Wiki rebuild:** `~/bin/wiki-rebuild.sh` → Quartz static site at http://192.168.122.10:8090/
