---
title: "Vault Metabolism System"
created: 2026-03-26
updated: 2026-03-26
type: research
status: active
tags: [vault, memory, actr, activation, metabolism, qmd]
---

# Vault Metabolism System

Implemented 2026-03-20 as part of the cognitive memory layer project. Brings ACT-R-style forgetting and promotion into the Obsidian vault, so frequently-used notes surface higher and stale ones gradually fade.

## What It Is

A small set of shell/Python scripts in `~/bin/` that simulate cognitive activation decay for vault notes. The core idea: notes that get retrieved often should be easier to find; notes that haven't been touched in months should be deprioritized or archived. Mirrors how human memory actually works (Anderson's ACT-R model).

## How It Works

### Activation Formula

```
B(n) = ln(Σ t_i^(-d))
```

- `t_i` = hours since each retrieval
- `d` = zone-specific decay rate
- Higher B(n) = more "active" in memory

### Zone Decay Rates

| Zone | Decay Rate | Reasoning |
|---|---|---|
| `trajan/` | 0.2 | Personal info, very stable |
| `architecture/` | 0.3 | Core design, slow decay |
| `system/` | 0.4 | Operational, moderate decay |
| `projects/`, `security/`, `tools/` | 0.4 | Active work, moderate decay |
| `agent knowledge/` | 0.6 | Fast-moving field |
| `research/`, `reference/`, `skills/` | 0.5 | Standard decay |
| `daily notes/` | 0.8 | Ephemeral, fast decay |

### Scripts

| Script | Purpose |
|---|---|
| `~/bin/vault-activation-scores.sh` | Calculates B(n) for all tracked notes, writes to `.activation-scores.json` |
| `~/bin/qmd-activated-search.sh` | Activation-weighted search (semantic × activation re-ranking) |
| `~/bin/qmd-search-instrumented.sh` | Wraps `qmd search`, logs each access to `.activations.jsonl` |
| `~/bin/qmd-context-instrumented.sh` | Wraps `qmd-context.sh`, logs activations |
| `~/bin/qmd-aliases.sh` | Shell aliases — source to enable instrumented wrappers |
| `~/bin/vault-auto-promote.sh` | Promotes Daily Notes retrieved 3+ times across different days → Research/ |
| `~/bin/vault-auto-demote.sh` | Flags stale Research/ notes (60+ days untouched) for archiving (dry-run default) |
| `~/bin/vault-metabolism-cron.sh` | Daily cycle: scores → promote check → demote check |

### Data Files (vault root)

- `.activations.jsonl` — append-only log of every retrieval (note path + timestamp)
- `.activation-scores.json` — current B(n) scores per note

## Cron

Runs daily at 04:00 UTC:
```
0 4 * * * /home/trajan/bin/vault-metabolism-cron.sh >> /tmp/vault-metabolism.log 2>&1
```

## Current State (2026-03-26)

- 15 notes scored in `.activation-scores.json`
- Top activation scores: memory-related notes (research/agent-memory-architectures, reference/agent-memory-model-hermes) at B(n) ≈ 3.09 (3 retrievals, fast decay from initial testing)
- Auto-promote/demote: no candidates yet (all activation data from one session, 2026-03-20)
- As normal vault usage accumulates, scores will differentiate meaningfully

## Known Issues / Next Steps

- Activation data only started 2026-03-20 — scores will be meaningful after a few weeks of real usage
- `qmd-aliases.sh` needs to be sourced in `.bashrc` to enable instrumentation on all searches
- Graph-search script can't match QMD paths to Neo4j nodes (path format mismatch — known issue from ontology-sync work)
- Consider: integration with QMD's own scoring once that API stabilizes

## Related Notes

- [[Agent Memory Architectures]]
- [[ori-mnemos-cognitive-memory]]
- [[Three-Tier Memory Architecture]]
- [[LCM Context Compression]]
