---
title: "Second Brain Architecture"
space: wiki
tags: ["architecture", "second-brain", "vault", "knowledge-graph", "fts5"]
source: manual
---

# Second Brain Architecture

EMA's built-in knowledge vault: graph-connected markdown files organized into spaces, with full-text search and auto-generated state files.

**Status:** Operational, supervised by `SecondBrain.Supervisor` (one_for_one strategy).

## Components

| Component | Source | Purpose |
|-----------|--------|---------|
| VaultWatcher | `second_brain/vault_watcher.ex` | Polls vault filesystem every 5s, detects file changes (created/modified/deleted), triggers sync to `vault_notes` DB table |
| GraphBuilder | `second_brain/graph_builder.ex` | Parses `[[wikilinks]]` from markdown, maintains `vault_links` table, supports typed links via `[[edge-type::target]]` syntax |
| SystemBrain | `second_brain/system_brain.ex` | Auto-generates 9 state files at `vault/system/state/` (projects, notes, proposals, intents, executions, agents, goals, habits, responsibilities) with 5s debounce |
| Indexer | `second_brain/indexer.ex` | FTS5 full-text search via `vault_notes_fts` virtual table, porter unicode61 tokenizer, `reindex_all` on boot (3s delay), ranked search with `snippet()` |
| Ingester | `second_brain/ingester.ex` | Handles ingest jobs for external content — reads markdown, extracts frontmatter, creates/updates Note records, schedules FTS5 indexing |
| SecondBrain | `second_brain/second_brain.ex` | Context module — CRUD for notes/links, graph queries, file operations, `search_brain/2` entry point |

## Schemas

### Note (`vault_notes` table)

| Field | Type | Notes |
|-------|------|-------|
| id | string (UUID) | Primary key |
| file_path | string | Relative to vault root, unique constraint |
| space | string | Top-level directory (wiki, projects, system, etc.) |
| title | string | Extracted from frontmatter or first `#` heading |
| content_hash | string | SHA-256 hex, used for change detection |
| word_count | integer | Computed on create/update |
| tags | array of strings | Stored as JSON array |
| source_type | string | One of: manual, proposal, session, ingestion, brain_dump |
| metadata | map | Arbitrary key-value data |
| project_id | string | Optional FK to project |

### Link (`vault_links` table)

| Field | Type | Notes |
|-------|------|-------|
| id | string (UUID) | Primary key |
| source_note_id | string | FK to vault_notes (required) |
| target_note_id | string | FK to vault_notes (nullable — unresolved links) |
| link_text | string | Raw text inside `[[brackets]]` |
| link_type | string | One of: wikilink, tag, embed, reference |
| edge_type | string | One of: references, depends-on, implements, contradicts, blocks, enables, supersedes, part-of, related-to |
| context | string | Surrounding line text (up to 200 chars) |

## Graph Operations

The `SecondBrain` context module exposes these graph queries:

- **`get_neighbors/1`** — all notes linked to/from a given note (both directions)
- **`get_typed_neighbors/1`** — neighbors with edge_type metadata, preloads note records
- **`get_backlinks/1`** — notes that link *to* a given note
- **`get_orphans/0`** — notes with no incoming or outgoing links
- **`get_hubs/1`** — top N most-connected notes by total link count
- **`get_full_graph/1`** — all nodes and edges, optionally filtered by space
- **`get_links_by_type/1`** — all links with a specific edge_type

## FTS5 Search

`search_brain(query, opts)` delegates to `Indexer.search/2`:

1. Query is sanitized — bare words get `*` suffix for prefix matching; FTS5 operators (`AND`, `OR`, `NOT`, quotes, parens) pass through unchanged
2. Executes against `vault_notes_fts` virtual table (columns: note_id, title, tags, file_path, content)
3. Results ranked by FTS5 built-in rank function (BM25)
4. Snippets extracted via `snippet(vault_notes_fts, 4, '<b>', '</b>', '...', 32)`
5. Optional `:space` filter applied post-query on joined Note records
6. Returns `{:ok, [%{note: %Note{}, rank: float, snippet: string}]}`

Index maintenance:
- Single note indexed on create/update via `Task.start`
- Full reindex on boot with 3s delay
- `index_size/0` returns current FTS entry count

## VaultWatcher Details

On init, ensures default directory structure exists: `research-ingestion/`, `projects/`, `user-preferences/`, `system/`, `system/state/`.

Polling cycle:
1. Scan all `.md` files recursively, collecting `{path, mtime}` pairs
2. Compare against previous scan — classify as created, modified, or deleted
3. Created/modified files: read content, compute SHA-256 hash, upsert `vault_notes` row
4. Deleted files: remove `vault_notes` row
5. `.superman` files routed to `IntentParser` instead of note DB
6. After processing all changes, trigger `GraphBuilder.rebuild/0`

## SystemBrain Details

Subscribes to PubSub topics: `vault:changes`, `pipe_trigger:*`, `proposals:pipeline`, `claude_sessions`, `intents`, `executions`.

Any event triggers a debounced sync (5s delay, timer reset on each new event). Sync writes 9 markdown files to `vault/system/state/`:

| File | Content |
|------|---------|
| `projects.md` | Table of project notes from projects space |
| `notes.md` | All notes grouped by space |
| `proposals.md` | Queued proposals with confidence scores |
| `intents.md` | Intent status summary + full tree export |
| `executions.md` | Recent 20 executions with status and mode |
| `agents.md` | Agent list with slug, status, model |
| `goals.md` | Goals with status and timeframe |
| `habits.md` | Active habits with frequency |
| `responsibilities.md` | Responsibilities with role and health score |

## Vault Spaces

| Space | Purpose |
|-------|---------|
| `wiki/` | Human-authored knowledge base (architecture, operations, intents, etc.) |
| `projects/` | Per-project notes and context |
| `system/` | Auto-generated state files from SystemBrain |
| `imports/` | Externally ingested content |
| `user-preferences/` | User configuration and preferences |
| `research-ingestion/` | Research material ingested from external sources |
| `intents/` | Intent-related documents |
| `archive/` | Archived/deprecated content |

## Related

- [[Vault-Structure]] — vault directory layout and space conventions
- [[Knowledge-Topology]] — graph analysis and knowledge patterns
- [[Context-Assembly]] — how vault content is assembled into AI context
- [[Cross-Pollination]] — cross-domain knowledge linking via Combiner
