---
title: "Intent Schematic"
space: wiki
tags: ["intents", "schematic", "navigation"]
source: manual
---

# Intent Schematic

Navigable map of everything EMA is trying to do. Each intent is a wiki page. The hierarchy flows from vision down to executable tasks.

## Vision (Level 0)
- [[EMA-Life-OS]] -- Personal AI operating system and life management companion

## Goals (Level 1)
- [[Ship-Core-Loop]] -- End-to-end execution loop: brain dump to completed work
- [[Agent-Collaboration]] -- Human and agent actors collaborating through shared workspace

## Projects (Level 2)
- [[EMA-OS]] -- The EMA daemon + frontend system itself
- [[Actor-Workspace]] -- First native agent workspace with human-agent collaboration
- [[Execution-First-EMA-OS]] -- Unified execution-first runtime (Phase 2, 50%)

## Features (Level 3)
- [[Execution-Engine]] -- Execution-first runtime: dispatch, track, harvest
- [[Intent-Wiki-Schematic]] -- This system: intents as navigable wiki pages
- [[Proposal-Pipeline]] -- 9-stage AI proposal generation and review
- [[Second-Brain]] -- Vault watcher, graph builder, system brain projections

## Active Work
See [[Active]] for currently in-progress intents.

## How This Works

Every page in this directory is an intent. Frontmatter fields (`intent_level`, `intent_kind`, `intent_status`) are parsed by VaultWatcher and synced to the DB `intents` table for querying via API/MCP/CLI.

Wikilinks between intent pages define the hierarchy:
- `[[parent::X]]` -- this intent is a child of X
- `[[depends-on::X]]` -- this intent requires X
- `[[blocks::X]]` -- this intent blocks X
- `[[related::X]]` -- loose association

## Related
- [[Intent-System]] -- Architecture documentation for the Intent Engine
- [[Knowledge-Topology]] -- How intents fit in the three-truth model
