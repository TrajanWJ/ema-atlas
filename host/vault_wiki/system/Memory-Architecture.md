---
title: Memory Architecture
type: knowledge
created: '2026-03-24'
tags:
  - memory
  - architecture
  - tiered
  - salience
summary: >-
  Three-tier memory architecture with salience scoring — hot/warm/cold tiers,
  auto-promotion/demotion
wiki_id: system/Memory-Architecture
imported_from: vault/System/Memory-Architecture.md
imported_at: '2026-04-04T00:23:57.256Z'
---

# Memory Architecture

Three-tier memory system inspired by the Memori paper (arXiv, March 2026). Persistent memory for OpenClaw agents with automatic lifecycle management.

## Tier System

### Hot Tier — Working Memory
- **Location:** `vault/System/memory/hot/`
- **Max:** 50 entries, pruned to warm on overflow
- **TTL:** Session lifetime
- **Access:** Direct file scan, no embedding lookup
- All `mem.sh store` calls write to hot tier first

### Warm Tier — Episodic Memory
- **Location:** `vault/System/memory/{facts,events,decisions,statuses}/`
- **Retention:** Entries < 7 days old
- **Auto-promoted** from cold if accessed 2+ times in 7 days
- **Auto-demoted** to cold if >7 days no access AND salience < 0.3

### Cold Tier — Semantic Memory
- **Location:** `vault/` (qmd-indexed)
- **Retention:** Permanent until explicitly deleted
- **Access:** `qmd search` semantic retrieval

## Salience Scoring

Formula: `salience = (recency × 0.3) + (access_freq × 0.3) + (importance × 0.4)`

| Factor | Weight | Calculation |
|--------|--------|-------------|
| Recency | 0.3 | 1.0 (<1h), 0.8 (<24h), 0.5 (<7d), 0.2 (older) |
| Access Frequency | 0.3 | Normalized 0-1 against max in same tier |
| Importance | 0.4 | Explicit field in JSON (0.0-1.0, default 0.5) |

## Access Tracking

Every memory JSON includes:
```json
{
  "access_count": 0,
  "last_accessed": "2026-03-24T21:00:00+00:00",
  "tier": "warm",
  "salience": 0.5,
  "importance": 0.5
}
```

All searches update `access_count` and `last_accessed` automatically.

## Commands

### mem.sh (v4) — Primary Interface
```bash
mem.sh store fact "key" "content" [agent]   # writes to hot + warm
mem.sh store event "content" [agent]
mem.sh search "query"                        # searches hot + warm, tracks access
mem.sh briefing                              # delegates to mem-retrieve.sh
mem.sh gc                                    # garbage collect expired entries
```

### mem-salience.sh — Scoring
```bash
mem-salience.sh score <file>                 # compute and update salience
mem-salience.sh rank [--tier hot|warm] [--limit N]  # list by salience
mem-salience.sh promote <file>               # move up a tier
mem-salience.sh demote <file>                # move down a tier
```

### mem-tier.sh — Auto-Lifecycle
```bash
mem-tier.sh check          # auto-promote/demote based on access patterns
mem-tier.sh promote-check  # find cold entries worth promoting
mem-tier.sh report         # tier distribution and avg salience
mem-tier.sh gc             # clean up hot tier overflow (>50 → warm)
```

### mem-retrieve.sh — Multi-Tier Retrieval
```bash
mem-retrieve.sh query "text" [--tier all] [--limit 10] [--min-salience 0.3]
mem-retrieve.sh context [session_id]   # build context injection block
mem-retrieve.sh briefing               # enhanced morning briefing
```

## Cron Jobs

| Schedule | Command | Purpose |
|----------|---------|---------|
| `7 * * * *` | `mem-tier.sh check` | Hourly auto-promote/demote scan |

## Data Flow

```
store → hot tier + warm tier
       ↓ (hourly cron)
  mem-tier.sh check
       ↓
  demote (>7d, low salience) → cold/archive
  promote (2+ accesses, high salience) → hot
       ↓
  mem-tier.sh gc → overflow hot → warm
```

## Links

- [[mem.sh]] — Primary memory CLI
- [[Session Management]] — Session lifecycle
- [[OpenClaw Agent System]] — Agent coordination
