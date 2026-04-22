---
title: Wiki Engine
space: wiki
tags:
  - architecture
  - wiki
  - second-brain
  - vault
source: manual
---

# Wiki Engine

## Status

Operational. Backend fully implemented. Frontend wiki renderer in research/design phase.

## Architecture Overview

The wiki is built on top of SecondBrain infrastructure. Vault markdown files are canonical; the DB is a queryable runtime view. Bidirectional sync keeps them in sync.

## Data Flow

```
Vault files (.md) → VaultWatcher (inotify/poll) → vault_notes DB + PubSub
  → GraphBuilder parses [[wikilinks]] → vault_links DB
  → Populator detects intent pages → intents DB
  → IntentProjector reverse-syncs non-wiki intents → wiki pages
  → SystemBrain generates state files → vault/system/state/
  → WikiSync analyzes git events → suggests wiki updates
  → VaultBridge writes execution/decision audit trail → vault
```

## Components

| Component | Source | Purpose |
|-----------|--------|---------|
| VaultWatcher | `daemon/lib/ema/second_brain/vault_watcher.ex` | File monitoring via inotify (Linux) or 60s polling fallback. Detects .md and .superman files. Debounces at 500ms. Parses YAML frontmatter. Syncs to vault_notes table. Broadcasts on vault:changes PubSub topic. |
| GraphBuilder | `daemon/lib/ema/second_brain/graph_builder.ex` | Parses [[wikilinks]] including typed links ([[depends-on::X]]). Creates vault_links entries. Rebuilds on startup, incremental on changes. |
| Populator | `daemon/lib/ema/intents/populator.ex` | Subscribes to vault:changes. Detects wiki/Intents/ pages with intent_level frontmatter. Creates/updates DB intents with source_fingerprint "wiki:{path}". Also handles brain_dump→intent and execution→phase advance. Periodic backfeed from HarvestedIntent every 10 min. |
| IntentProjector | `daemon/lib/ema/intents/intent_projector.ex` | Subscribes to intents PubSub. On intent created (non-wiki source), writes wiki page to wiki/Intents/{Level}/{slug}.md. On status_changed, updates frontmatter. Prevents loops via source_type check. |
| VaultBridge | `daemon/lib/ema/vault/vault_bridge.ex` | Writes audit trail: on_proposal_dispatched → Decisions/{date}-{slug}.md, on_execution_completed → Sessions/{date}-exec-{id}.md with git diff. |
| WikiSync | `daemon/lib/ema/intelligence/wiki_sync.ex` | GenServer analyzing git events. Finds wiki pages referencing changed files. Suggests flag_outdated or create_stub actions. Stored in wiki_sync_actions table. |
| SystemBrain | `daemon/lib/ema/second_brain/system_brain.ex` | Generates 9 state files at vault/system/state/ with 30s debounce: projects, notes, proposals, intents, executions, agents, goals, habits, responsibilities. |

## REST API

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/vault/tree | Directory tree of vault |
| GET | /api/vault/note?path=... | Fetch note by path + content |
| POST | /api/vault/note | Create/upsert note |
| DELETE | /api/vault/note?path=... | Delete note |
| PUT | /api/vault/note/move | Move note |
| GET | /api/vault/search?q=... | FTS5 search across notes |
| GET | /api/vault/graph | Full wikilink graph |
| GET | /api/vault/neighbors?id=... | Direct neighbors |
| GET | /api/vault/typed-neighbors?id=... | Neighbors by edge type |
| GET | /api/vault/orphans | Notes with no links |

## WebSocket Channel

Topic `vault:files` — join returns all notes, broadcasts create/update/delete/move events.
Topic `vault:graph` — join returns full graph, broadcasts changes.

## Knowledge Schemas (Structured Indexing)

Two schemas for section-level wiki indexing (not yet fully wired):

**WikiSource** (`daemon/lib/ema/knowledge/wiki_source.ex`, table: wiki_sources) — path, title, source_type, space_key, project_key, checksum, metadata. Has many WikiSections.

**WikiSection** (`daemon/lib/ema/knowledge/wiki_section.ex`, table: wiki_sections) — heading, section_key, ordinal, content. Belongs to WikiSource.

## Frontmatter Fields Parsed

| Field | Type | Purpose |
|-------|------|---------|
| title | string | Page title |
| intent_level | 0-5 | Activates Intent capability |
| intent_kind | string | task, feature, goal, vision |
| intent_status | string | planned, active, implementing, complete |
| intent_priority | 1-5 | Priority ranking |
| project | string | Project slug |
| tags | array | Classification tags |
| space | string | wiki, projects, system, etc. |
| source | string | manual, auto-projected, etc. |

## Sync Loop Prevention

Fingerprints prevent infinite wiki<->DB sync:

1. VaultWatcher detects wiki page → Populator creates intent with source_fingerprint "wiki:{path}" and source_type "wiki"
2. IntentProjector sees new intent → checks source_type. If "wiki", skips (already has a wiki page)
3. IntentProjector creates wiki page for non-wiki intents → VaultWatcher picks it up → Populator checks fingerprint → finds existing intent → updates, doesn't duplicate

## Wikilink Syntax

| Syntax | Edge Type | Example |
|--------|-----------|---------|
| `[[Page]]` | references (default) | `[[EMA-Overview]]` |
| `[[type::Page]]` | typed edge | `[[depends-on::Infrastructure-Upgrade]]` |
| `[[Page\|display text]]` | references + display alias | `[[EMA-Overview\|overview]]` |

Supported typed edges: depends-on, implements, contradicts, blocks, enables, supersedes, part-of, related-to.

## Frontend Design (Phase 2 — Not Yet Implemented)

Spec at `docs/superpowers/specs/2026-04-07-unified-wiki-engine-design.md` and `2026-04-07-wiki-engine-final-vision.md`.

Target: Wikipedia Vector 2022 layout adapted with EMA glass morphism. Tiptap (ProseMirror) for editing. 4 page capabilities (Knowledge, Intent, Code, Plan) activated by frontmatter. 5 rendering instances (EMA App, Browser, Agent JSON, CLI, Export).

## Related

- [[Second-Brain-Architecture]] — underlying storage and indexing
- [[Intent-System]] — intent sync pipeline
- [[Knowledge-Topology]] — three core truths model
- [[Vault-Structure]] — directory layout and agent-writability rules
