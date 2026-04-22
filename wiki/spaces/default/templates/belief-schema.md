---
title: Belief Frontmatter Schema
created: '2026-03-20'
type: knowledge
tags:
  - template
  - beliefs
  - epistemics
  - vault-standards
summary: Standard schema for encoding beliefs in vault note frontmatter
wiki_id: templates/belief-schema
imported_from: vault/Templates/belief-schema.md
imported_at: '2026-04-04T00:23:57.280Z'
---
# Belief Frontmatter Schema

## Purpose

Beliefs are structured factual claims embedded in vault notes. They enable:
- **Contradiction detection** — automated comparison of claims across notes
- **Confidence tracking** — how sure are we, and when did we last check?
- **Source attribution** — where did this claim come from?
- **Staleness detection** — when was this last verified?

## Schema

Add to any note's YAML frontmatter:

```yaml
beliefs:
  - claim: "Specific factual claim"
    confidence: 0.85
    source: "T1 — URL or reference"
    first_asserted: 2026-03-20
    last_verified: 2026-03-20
  - claim: "Another claim"
    confidence: 0.60
    source: "T2 — Blog post analysis"
    first_asserted: 2026-03-18
    last_verified: 2026-03-20
```

## Field Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `claim` | string | yes | A specific, falsifiable factual statement |
| `confidence` | float | yes | 0.0–1.0, see confidence scale below |
| `source` | string | yes | Source tier + reference (T1–T4) |
| `first_asserted` | date | yes | When this belief was first recorded |
| `last_verified` | date | yes | When this was last checked/confirmed |

## Confidence Scale

| Score | Meaning | Example |
|---|---|---|
| 0.95+ | Verified fact, primary source | Official API docs, direct testing |
| 0.80–0.94 | High confidence, reliable source | Reputable analysis, multiple T2 sources agree |
| 0.60–0.79 | Moderate confidence | Single source, reasonable but unverified |
| 0.40–0.59 | Low confidence, speculative | Inferred from indirect evidence |
| 0.20–0.39 | Hypothesis | Early-stage guess, needs research |
| <0.20 | Wild speculation | Placeholder for future investigation |

## Source Tiers

- **T1** — Primary/official: documentation, papers, direct testing
- **T2** — Expert analysis: reputable blogs, conference talks, deep reviews
- **T3** — Community: forums, Reddit, tweets, HN comments
- **T4** — AI-generated or unverified

## Examples

### Good Belief Entry
```yaml
beliefs:
  - claim: "Neo4j Community Edition supports up to 34 billion nodes"
    confidence: 0.90
    source: "T1 — Neo4j official docs"
    first_asserted: 2026-03-15
    last_verified: 2026-03-20
```

### Bad Belief Entry
```yaml
beliefs:
  - claim: "Neo4j is good"        # Too vague, not falsifiable
    confidence: 0.90               # Default 0.90 — pick the right level
    source: "I think so"           # No tier, no reference
```

## Automated Extraction

`vault-belief-extract.sh` scans existing notes for implicit beliefs:
- Notes with `confidence:` in frontmatter → extracted as beliefs
- Notes with `## Key Takeaways` → items extracted as candidates
- Output: `vault/System/belief-candidates.jsonl`
