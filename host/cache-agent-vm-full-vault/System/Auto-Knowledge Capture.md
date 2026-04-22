---
type: reference
domain: knowledge-management
confidence: 0.80
source: agent:vault-keeper
summary: "Automated knowledge extraction from transcripts, messages, and sessions — gated by API usage to avoid waste"
created: 2026-03-18
updated: 2026-03-18
aliases: [auto-knowledge, knowledge capture, transcript scanner]
title: "Auto-Knowledge Capture"
status: active
---

# Auto-Knowledge Capture System

## Purpose

Automatically extracts knowledge from agent session transcripts, Discord messages, and other sources, then writes structured notes to the vault. Gated by API usage to avoid running during high-consumption periods.

## Components

| Component | Path | Role |
|---|---|---|
| `auto-knowledge-gated.sh` | `~/bin/` | Usage gate — skips if API usage >55% |
| `transcript-scanner.py` | `~/skills/auto-knowledge/scripts/` | Scans session transcripts for extractable knowledge |
| `capture.sh` | `~/skills/auto-knowledge/scripts/` | Writes extracted knowledge as vault notes |
| `pattern-detector.py` | `~/skills/auto-knowledge/scripts/` | Detects recurring patterns across sessions |
| `agent-roster-review.py` | `~/skills/auto-knowledge/scripts/` | Weekly agent roster audit |

## Flow

```
Cron (every 3h)
  → auto-knowledge-gated.sh
    → Check ~/.claude-pace.json (skip if >55% usage AND file <6h old)
    → transcript-scanner.py (extract facts, preferences, decisions)
    → capture.sh (write to vault with proper frontmatter)
```

## Usage Gate

The gate prevents knowledge extraction from consuming API budget during heavy-use periods:
- Reads `~/.claude-pace.json` for current usage percentage
- Skips if usage >55% AND pace file is fresh (<6 hours old)
- Proceeds if pace file is stale (>6h) regardless of percentage

## Companion Systems

- **Message Harvester** (`~/bin/message-harvester.sh`, every 2h) — harvests Discord messages as knowledge source
- **Ontology Sync** (`obsidian-ontology-sync`, every 3h) — extracts entities for the knowledge graph
- **QMD** (every 30min) — indexes vault for semantic search
- **Memory Promote** (`~/bin/memory-promote.sh`, daily 4am) — promotes recurring themes from daily notes to vault

## Schedule

| Interval | Script | Purpose |
|---|---|---|
| Every 3h | `auto-knowledge-gated.sh` | Main extraction pipeline |
| Every 2h | `message-harvester.sh` | Discord message harvesting |
| Every 3h | `ontology-sync extract` | Entity extraction |
| Weekly Sun | `agent-roster-review.py` | Agent roster audit |

## Related

- [[Memory Architecture]] — where captured knowledge lives in the memory tiers
- [[Cron Jobs Ecosystem]] — scheduling context
- [[Intelligence Extractions]] — extracted intelligence output
