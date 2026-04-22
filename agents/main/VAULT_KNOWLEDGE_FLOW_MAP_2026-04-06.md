# Vault & Knowledge Flow Map — 2026-04-06

## Reality check

The vault/knowledge surface is large enough that it is currently a **mesh**, not a pipeline.

Observed script families include:
- qmd context/search helpers
- ontology sync
- transcript scanning
- vault research loop
- vault janitor / lint / freshness / quality / dedup / autolink / graph / backlinks / contradictions / growth / activation / confidence / task ingestion / semantic links
- agent learning sync
- dispatch-driven vault improvement outputs

This is powerful, but it is very easy for duplicate ingestion and conflicting mutations to happen.

---

## Main observed flow types

### 1. Search / retrieval layer
Tools/scripts:
- `qmd`
- `qmd-context.sh`
- `qmd-activated-search.sh`
- `qmd-graph-search.sh`
- `qmd-search-instrumented.sh`
- `qmd-context-instrumented.sh`
- codebase-memory caches

Purpose:
- retrieve existing knowledge
- enrich prompts/context
- query vault graph-ish structures

### 2. Extraction / ingestion layer
Tools/scripts:
- `transcript-scanner.sh`
- `vault-research-ingest.sh`
- `vault-task-ingestion.sh`
- `gh-interesting-to-vault.sh`
- `antfly-ingest-vault.sh`
- ontology sync extract
- webhook/feed hooks (`webhook-vault-feed.sh`, `vault-feed.sh`)

Purpose:
- pull external/session/research content into a knowledge substrate

### 3. Structure / linking / graph layer
Tools/scripts:
- `vault-graph.sh`
- `vault-graph-query.sh`
- `vault-graph-edges.sh`
- `vault-backlink.sh`
- `vault-autolink.sh`
- `vault-dynamic-linker.sh`
- `vault-semantic-links.sh`

Purpose:
- build relationships and traversability

### 4. Quality / maintenance layer
Tools/scripts:
- `vault-janitor.sh`
- `vault-lint.sh`
- `vault-quality.sh`
- `vault-quality-score.sh`
- `vault-dedup.sh`
- `vault-freshness.sh`
- `vault-staleness-scan.sh`
- `vault-staleness-flag.sh`
- `vault-frontmatter-enforce.sh`

Purpose:
- keep notes coherent, current, and machine-usable

### 5. Research / gap analysis layer
Tools/scripts:
- `vault-research-loop.sh`
- `vault-knowledge-gaps.sh`
- `vault-aspiration-gap.sh`
- `gap-registry-sync.sh`
- research digest / implement pipeline pieces

Purpose:
- identify missing knowledge
- propose or synthesize new content

### 6. Promotion / scoring / belief layer
Tools/scripts:
- `vault-auto-promote.sh`
- `vault-auto-demote.sh`
- `vault-belief-extract.sh`
- `vault-belief-migrate.sh`
- `vault-confidence-bootstrap.sh`
- `vault-activation-scores.sh`

Purpose:
- rank, promote, and formalize knowledge significance

---

## Current problem

The likely issue is not “missing features.”
It is:
- too many mutation paths
- too many overlapping quality/linking passes
- unclear canonical path from raw signal → structured note → promoted knowledge

---

## Recommended canonical model

### Proposed canonical path
1. **raw signal arrives**
   - transcript, webhook, GH feed, research result, agent output
2. **ingest once**
   - one explicit ingestion step creates/updates raw note artifacts
3. **normalize structure**
   - frontmatter, taxonomy, IDs, source metadata
4. **link/enrich**
   - backlinks / semantic links / graph edges
5. **quality pass**
   - lint, dedup, staleness, contradiction checks
6. **promotion layer**
   - important knowledge promoted into durable/high-signal notes

Anything outside that should be documented as either:
- retrieval-only
- maintenance-only
- experimentation

---

## Recommendation for future cleanup

### High value
- inventory which scripts mutate files vs only analyze
- choose one canonical ingestion path
- choose one canonical quality stack
- mark the rest as experimental / deprecated / niche

### Very likely dedupe candidates
- multiple qmd wrapper scripts
- multiple vault quality/score/freshness variants
- multiple linker/graph scripts
- multiple feed/ingest paths

---

## Bottom line

The vault system already has the ingredients for a strong knowledge pipeline.
Right now it looks like a biotech lab after three founders kept adding enzymes.
It needs a canonical flow, not more cleverness.
