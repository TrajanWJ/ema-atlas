---
title: "Second Brain"
intent_level: 3
intent_kind: task
intent_status: active
intent_priority: 3
project: ema
parent: "[[EMA-OS]]"
tags: ["feature", "vault", "knowledge", "second-brain"]
---

# Second Brain

Vault watcher, graph builder, system brain projections, FTS5 indexing.

## What
VaultWatcher polls filesystem for changes, GraphBuilder extracts wikilinks into a graph, SystemBrain projects state files, Indexer provides full-text search.

## Status
Operational. VaultWatcher being enhanced to parse intent frontmatter for wiki intent schematic.

## Related
- [[related::Intent-Wiki-Schematic]] -- VaultWatcher is the sync infrastructure for wiki intents
