---
title: "Second Brain"
intent_level: 3
intent_kind: feature
intent_status: active
intent_priority: 3
project: ema
parent: "[[EMA-OS]]"
tags: ["feature", "vault", "knowledge", "second-brain"]
---

# Second Brain

## What

Vault watcher, knowledge graph, FTS5 indexing, and system state projections. The knowledge layer that indexes, links, and surfaces vault content so EMA can reason over its own state.

## Why

EMA needs a knowledge layer that indexes, links, and surfaces vault content. Without it, vault files are inert markdown — Second Brain makes them queryable, graph-connected, and automatically synchronized with daemon state.

## Status

**Operational.** All components running. VaultWatcher enhancement for intent frontmatter parsing in progress (supports the [[Intent-Wiki-Schematic]]).

## Components

| Module | Source | Purpose |
|--------|--------|---------|
| VaultWatcher | `daemon/lib/ema/vault/watcher.ex` | 5s filesystem poll, detects changes, triggers rebuilds |
| GraphBuilder | `daemon/lib/ema/vault/graph_builder.ex` | Wikilink parser, builds in-memory knowledge graph |
| SystemBrain | `daemon/lib/ema/vault/system_brain.ex` | Projects daemon state to 9 markdown files, 5s debounce |
| Indexer | `daemon/lib/ema/vault/indexer.ex` | FTS5 full-text search with porter unicode61 tokenizer |
| Ingester | `daemon/lib/ema/vault/ingester.ex` | Parses frontmatter and body, feeds Indexer and GraphBuilder |

## SystemBrain State Files

SystemBrain auto-generates 9 state projection files at `vault/system/state/`:

| File | Content |
|------|---------|
| `projects.md` | All projects with status and metadata |
| `notes.md` | Vault notes index |
| `proposals.md` | Active and recent proposals |
| `intents.md` | Intent tree snapshot |
| `executions.md` | Recent execution history |
| `agents.md` | Agent registry and sessions |
| `goals.md` | Goals with progress |
| `habits.md` | Habit tracking state |
| `responsibilities.md` | Recurring responsibilities |

These files are rebuilt on a 5s debounce cycle whenever underlying data changes.

## Related

- [[Second-Brain-Architecture]] — Full architecture documentation
- [[Vault-Structure]] — Directory layout and conventions
- [[Knowledge-Topology]] — Graph structure and link semantics
- [[related::Intent-Wiki-Schematic]] — VaultWatcher is the sync infrastructure for wiki intents
