---
id: CLONES-INDEX
type: meta
layer: research
title: "Clones Index — shallow clones of S-tier research repos"
status: active
created: 2026-04-12
updated: 2026-04-12
author: system
tags: [meta, clones, index, tier3-extraction]
---

# Clones Index

> **The actual cloned source trees of S-tier research repos.** Gitignored — this folder is NOT committed. The extracted findings live next door in `[[research/_extractions/]]`, which IS committed.

## Purpose

Tier 3 deep extraction per the user's "DAC" choice (2026-04-12):
- **D**: Tier 3 for all S-tier (full clone, read source, attempt install/run)
- **A**: Clones live here, alongside the research graph
- **C**: `ema research` CLI shipping as Bootstrap v0.2 (see `[[BOOTSTRAP-V0.1\|Bootstrap]]` roadmap)

## Conventions

- All clones are shallow: `git clone --depth=1`
- Folder naming: `<owner-slug>-<repo>/` (e.g., `silverbulletmd-silverbullet/`)
- Extraction docs with file:line refs live in `../\_extractions/<same-slug>.md`
- The research nodes in `research/<category>/<owner>-<repo>.md` get a `## Source Extractions` link after consolidation

## Not committed

This entire directory is `.gitignore`d. If you clone the EMA repo fresh, this folder will be empty until you run the clone pass. The **extraction docs in `_extractions/`** are the committed artifacts that reference specific files + lines in this disposable clone tree.

## How to use

1. Read `[[research/_extractions/<repo>]]` first — it cites the exact files + line numbers
2. Open `_clones/<repo>/<path>` to see the actual source
3. `grep -rn "pattern" _clones/` to search across all cloned repos
4. Or use `ema research grep "pattern"` once bootstrap v0.2 ships

## Clone rollup

(This section will be auto-populated by the parallel clone agents as they complete.)

| Repo | Category | Status | Clone size | Extract doc |
|---|---|---|---|---|
| `ysz7-Arcforge` | `vapp-plugin` | cloned + extracted | ~6 MB | `[[research/_extractions/ysz7-Arcforge]]` |

## Connections

- `[[research/_moc/RESEARCH-MOC]]` — research layer master index
- `[[BOOTSTRAP-V0.1]]` — bootstrap roadmap (includes v0.2 path)
- `[[_meta/CANON-STATUS]]`

#meta #clones #index #tier3
