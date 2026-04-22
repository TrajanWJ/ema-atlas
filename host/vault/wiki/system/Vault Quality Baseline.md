---
title: Vault Quality Baseline
created: '2026-03-18'
updated: '2026-03-18'
type: knowledge
status: active
confidence: 0.6
confidence_updated: 2026-03-18T00:00:00.000Z
source: 'agent:overnight'
tags:
  - quality
  - scoring
  - baseline
  - automated
summary: >-
  Baseline vault quality scores established 2026-03-18 using
  vault-quality-score.sh. Composite: 88/100.
wiki_id: system/Vault_Quality_Baseline
imported_from: vault/System/Vault Quality Baseline.md
imported_at: '2026-04-04T00:23:57.270Z'
---

# Vault Quality Baseline

**Established:** 2026-03-18T06:45:36Z
**Script:** `~/bin/vault-quality-score.sh`
**Files scanned:** 510

## Composite Score: 88 / 100

## Per-Metric Breakdown

| # | Metric | Score | Count | / Total | Weight |
|---|--------|-------|-------|---------|--------|
| 1 | Complete frontmatter (8 fields) | 82% | 422 | 510 | 20% |
| 2 | Wikilinks (2+ outgoing) | 85% | 436 | 510 | 15% |
| 3 | Confidence (present, not 0.90) | 94% | 481 | 510 | 15% |
| 4 | Summary field (non-empty) | 83% | 428 | 510 | 20% |
| 5 | Source != unknown | 94% | 483 | 510 | 15% |
| 6 | Length >= 5 lines (not stub) | 99% | 509 | 510 | 15% |

## Scoring Formula

```
composite = (frontmatter×20 + wikilinks×15 + confidence×15 +
             summary×20 + source×15 + length×15) / 100
```

## Improvement Opportunities

| Metric | Gap | Files to fix |
|--------|-----|-------------|
| Frontmatter completeness | 18% | 88 files missing ≥1 required field |
| Wikilinks (2+) | 15% | 74 files with 0–1 outgoing links |
| Summary field | 17% | 82 files missing/empty summary |
| Confidence validity | 6% | 29 files with placeholder 0.90 |
| Source validity | 6% | 27 files with unknown/empty source |

**Required frontmatter fields checked:** title, type, status, source, tags, summary, created, updated

## Trend

| Date | Composite | FM | WL | Conf | Summary | Source | Length |
|------|-----------|----|----|------|---------|--------|--------|
| 2026-03-18 | **88** | 82% | 85% | 94% | 83% | 94% | 99% |

_Re-run `vault-quality-score.sh` and append a row to the Trend table weekly._

## Related
- [[Quality Report]] — ongoing vault quality tracking
- [[Vault Health Log]] — historical health metrics log
- [[System Overview]] — full agent system overview

## Raw JSON

```json
{
  "generated": "2026-03-18T06:45:36Z",
  "vault": "/home/trajan/vault",
  "total_files": 510,
  "composite_score": 88,
  "metrics": {
    "frontmatter": { "score": 82, "count": 422, "total": 510, "weight": 20 },
    "wikilinks":   { "score": 85, "count": 436, "total": 510, "weight": 15 },
    "confidence":  { "score": 94, "count": 481, "total": 510, "weight": 15 },
    "summary":     { "score": 83, "count": 428, "total": 510, "weight": 20 },
    "source":      { "score": 94, "count": 483, "total": 510, "weight": 15 },
    "length":      { "score": 99, "count": 509, "total": 510, "weight": 15 }
  }
}
```
