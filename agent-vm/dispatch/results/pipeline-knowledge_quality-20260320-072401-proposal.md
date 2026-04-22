# Proposal: Knowledge Quality Improvements
Date: 2026-03-20T07:26:00Z
Task ID: pipeline-research-20260320-072403

---

## 1. Current State

Assessment of the knowledge pipeline revealed the following quality signals:

| Signal | Count | Severity |
|--------|-------|----------|
| Thin files (<10 lines) | 2 | Medium — pollute retrieval slots |
| Files with TODO/TBD markers | 31 | High — largest existing debt |
| Research files without sources | 2 | High — hallucination propagation risk |

The core problem: knowledge artifacts are written without enforced quality gates. Thin files, unsourced claims, and incomplete stubs accumulate silently and degrade the reliability of agent retrieval. Without systematic enforcement, these numbers will grow over time.

---

## 2. Improvements

### Improvement 1: TODO/TBD Resolution Workflow with SLAs

**Priority: HIGH** — 31 files is the largest current debt.

**What:** Treat TODO/TBD markers as knowledge debt with defined service-level agreements. Implement automated detection, aging, and resolution workflows.

**Rationale:** Incomplete records degrade retrieval precision more than missing records — a half-written note is worse than no note because it consumes a retrieval slot without delivering value (Dong et al., KDD 2014). 31 files with TODO/TBD means 31 pieces of incomplete knowledge that could be served to agents as authoritative.

**Implementation Steps:**

1. Create `scripts/scan-knowledge-debt.sh`:
```bash
#!/usr/bin/env bash
# Scans for TODO/TBD/FIXME markers and reports age
echo "=== Knowledge Debt Report ==="
echo "Generated: $(date -I)"

for f in $(grep -rlE 'TODO|TBD|FIXME|PLACEHOLDER' "${1:-.}" --include='*.md'); do
  MOD_DATE=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f" 2>/dev/null)
  NOW=$(date +%s)
  AGE_DAYS=$(( (NOW - MOD_DATE) / 86400 ))
  COUNT=$(grep -cE 'TODO|TBD|FIXME|PLACEHOLDER' "$f")
  if [ "$AGE_DAYS" -gt 7 ]; then STATUS="STALE"; elif [ "$AGE_DAYS" -gt 3 ]; then STATUS="AGING"; else STATUS="FRESH"; fi
  echo "[$STATUS] $f -- $COUNT markers, $AGE_DAYS days old"
done | sort -t'[' -k2
```

2. Add SLA policy to AGENTS.md:
```
TODO/TBD SLA Policy:
- CRITICAL (in notes/ or actively retrieved files): Resolve within 48 hours
- NORMAL (in memory/ or scratch/): Resolve within 7 days
- LOW (archival): Resolve within 30 days or convert to explicit "unknown" with confidence: low

Resolution = one of: fill in content, delete if valueless, or replace with "unknown -- [reason]" + confidence: low
```

3. Require dated TODOs going forward:
```
# In AGENTS.md write rules:
Bare TODO/TBD without deadline and owner is prohibited.
Use: TODO(2026-03-27)(@agent-name): description
```

4. Run the scanner against existing vault and create resolution task queue. Target: eliminate all 31 TODO/TBD files within 7 days.

---

### Improvement 2: Unified Quality Gate at Write-Time

**Priority: HIGH** — Prevents all quality dimensions from growing while debt is being repaid.

**What:** A single validation script that checks all quality dimensions before any knowledge artifact is committed to the vault.

**Rationale:** Individual checks are useful but become powerful when composed. "Shift left" — catch quality issues at write-time rather than during retrieval. Follows enterprise knowledge management patterns (Guru, Confluence, Notion all added pre-write validation between 2023-2025).

**Implementation Steps:**

1. Create `scripts/validate-knowledge-quality.sh`:
```bash
#!/usr/bin/env bash
# Unified knowledge quality gate
TARGET="${1:-.}"
TOTAL_CHECKS=0; PASSED_CHECKS=0; FAILURES=""

check() {
  local name="$1" result="$2" detail="$3"
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  if [ "$result" -eq 0 ]; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    echo "  PASS: $name"
  else
    echo "  FAIL: $name -- $detail"
    FAILURES="${FAILURES}\n  - $name: $detail"
  fi
}

FILES=$([ -f "$TARGET" ] && echo "$TARGET" || find "$TARGET" -name '*.md' -type f)

for f in $FILES; do
  echo "Checking: $f"
  grep -qiE '^source:|^sources:' "$f"; check "Source citation" $? "No source field"
  [ "$(wc -l < "$f")" -ge 10 ]; check "Minimum length" $? "Under 10 lines"
  ! grep -qE 'TODO[^(]|TBD[^(]' "$f"; check "No bare TODOs" $? "Undated TODO/TBD found"
  grep -qiE '^confidence:' "$f"; check "Confidence rating" $? "No confidence field"
  grep -qiE '^created:' "$f"; check "Created date" $? "No created field"
  echo ""
done

SCORE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
echo "Score: $SCORE% ($PASSED_CHECKS/$TOTAL_CHECKS)"
[ -n "$FAILURES" ] && echo -e "Failures:$FAILURES"
exit $([ "$SCORE" -eq 100 ] && echo 0 || echo 1)
```

2. Add to AGENTS.md write protocol:
```
Knowledge Write Protocol:
1. Draft the note/artifact
2. Run scripts/validate-knowledge-quality.sh on the draft
3. If score < 100%: fix all failures before writing
4. If score = 100%: proceed with write
```

3. Add to the periodic work cycle: run validator across entire knowledge base, generate audit report, create hygiene tasks if score drops below 80%.

---

### Improvement 3: Source Citation Enforcement

**Priority: MEDIUM** — Low current debt (2 files) but high future risk without a gate.

**What:** Require every knowledge artifact to carry at least one source citation. Reject or quarantine artifacts lacking provenance.

**Rationale:** Unsourced claims are the primary vector for hallucination propagation in agent pipelines. When Agent A writes an unsourced note and Agent B retrieves it, B has no way to assess reliability (Lewis et al., NeurIPS 2020; Gao et al., arXiv:2312.10997, 2024). The Zettelkasten principle "no note without a source" is well-established (Ahrens, 2022).

**Implementation Steps:**

1. Create `scripts/validate-note-sources.sh`:
```bash
#!/usr/bin/env bash
VIOLATIONS=0
for f in $(find "${1:-notes}" -name '*.md' -type f); do
  if ! grep -qiE '^source:|^sources:' "$f"; then
    echo "MISSING SOURCE: $f"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done
echo "Found $VIOLATIONS files without source citations."
exit $([ "$VIOLATIONS" -eq 0 ] && echo 0 || echo 1)
```

2. Define acceptable source formats in AGENTS.md:
```
Acceptable sources:
- URL: https://...
- DOI: doi:10.xxxx/...
- Book: "Author, Title, Year, page N"
- Inference: "inference from [[note-id]]"
- Observation: "direct observation by [agent-name] on YYYY-MM-DD"
- Speculative: set confidence: speculative + TODO to find real source within 48h
```

3. Backfill the 2 existing unsourced research files: read each, identify origin, add source field, or add `confidence: speculative` with a dated TODO.

4. Add `confidence:` field to frontmatter standard (high | medium | low | speculative).

---

### Improvement 4: Freshness Scoring and Staleness Detection

**Priority: MEDIUM** — Prevents stale knowledge from being served with unwarranted confidence.

**What:** Assign a freshness score to every knowledge artifact based on topic volatility and last-verified date. Deprioritize stale content in retrieval.

**Rationale:** Knowledge decays at different rates. A note about "current Claude capabilities" is stale after 30 days; a note about "Zettelkasten principles" is evergreen. Without freshness scoring, agents treat year-old claims with the same confidence as yesterday's findings. Time-weighted retrieval is now a documented best practice in LangChain and LlamaIndex (2024-2025 docs). Enterprise platforms (Confluence, Guru, Notion) added staleness indicators between 2023-2025.

**Implementation Steps:**

1. Create `scripts/freshness-scan.sh`:
```bash
#!/usr/bin/env bash
NOW=$(date +%s)
echo "=== Freshness Report === $(date -I)"
for f in $(find "${1:-notes}" -name '*.md' -type f); do
  MOD_DATE=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f" 2>/dev/null)
  AGE_DAYS=$(( (NOW - MOD_DATE) / 86400 ))
  VERIFIED=$(grep -oP 'last_verified:\s*\K\S+' "$f" 2>/dev/null)
  [ -n "$VERIFIED" ] && V_EPOCH=$(date -d "$VERIFIED" +%s 2>/dev/null) && [ -n "$V_EPOCH" ] && AGE_DAYS=$(( (NOW - V_EPOCH) / 86400 ))
  if echo "$f" | grep -qiE 'ai|llm|model|claude|gpt'; then MAX_AGE=30; VOL="fast"
  elif echo "$f" | grep -qiE 'tool|library|framework'; then MAX_AGE=90; VOL="moderate"
  elif echo "$f" | grep -qiE 'principle|method|concept'; then MAX_AGE=365; VOL="evergreen"
  else MAX_AGE=180; VOL="default"; fi
  PCT=$(( AGE_DAYS * 100 / MAX_AGE ))
  if [ "$PCT" -lt 25 ]; then STATUS="FRESH"; elif [ "$PCT" -lt 75 ]; then STATUS="AGING"; elif [ "$PCT" -lt 100 ]; then STATUS="STALE"; else STATUS="EXPIRED"; fi
  echo "[$STATUS] $f -- ${AGE_DAYS}d old, ${VOL} (max ${MAX_AGE}d)"
done | sort -t'[' -k2
```

2. Add `last_verified: YYYY-MM-DD` to frontmatter standard. Agents must set this when they confirm content is still accurate (distinct from file modification date).

3. Add retrieval weighting guidance to AGENTS.md:
```
When retrieving knowledge, apply freshness weight to ranking:
  FRESH    = 1.0
  AGING    = 0.85
  STALE    = 0.6
  EXPIRED  = 0.3 (surface for review, do not use as primary source)
```

4. Create `schemas/freshness-config.json` to define volatility rules per file pattern.

---

### Improvement 5: Minimum Content Standards for Thin Files

**Priority: LOW** — Only 2 thin files now; gate prevents growth.

**What:** Define minimum viable content thresholds for knowledge artifacts. Files below threshold are expanded, merged, or deleted.

**Rationale:** Thin files waste retrieval slots — a 3-line file that matches a query displaces a richer, more useful document. Research on RAG chunk quality (Wang et al., arXiv:2407.01219, 2024) shows retrieval quality correlates with document completeness. Partial documents reduce answer quality even when they contain relevant keywords.

**Implementation Steps:**

1. Create `scripts/validate-note-quality.sh`:
```bash
#!/usr/bin/env bash
MIN_LINES=10; ISSUES=0
for f in $(find "${1:-notes}" -name '*.md' -type f); do
  LINES=$(wc -l < "$f")
  CONTENT_LINES=$(grep -cvE '^\s*$|^---|^#|^source:|^created:|^confidence:|^tags:|^last_verified:' "$f")
  [ "$LINES" -lt "$MIN_LINES" ] && echo "THIN ($LINES lines): $f" && ISSUES=$((ISSUES + 1))
  [ "$CONTENT_LINES" -lt 3 ] && echo "NO SUBSTANCE ($CONTENT_LINES content lines): $f" && ISSUES=$((ISSUES + 1))
done
echo "Issues: $ISSUES"
exit $([ "$ISSUES" -eq 0 ] && echo 0 || echo 1)
```

2. Define minimum standards in AGENTS.md:
```
Minimum Content Standards for notes/:
1. Frontmatter: source, created, confidence, tags, last_verified
2. A summary sentence (first paragraph after title)
3. At least 3 lines of substantive content
4. At least one internal link or explicit "orphan: true"

Files below threshold: EXPAND, MERGE with related note, DEMOTE to scratch/, or DELETE.
```

3. Triage the 2 existing thin files: for each, search for related notes to merge with, or expand with substantive content, or move to `scratch/stubs/` with a dated TODO.

---

## 3. Priority Order

| # | Improvement | Rationale | Effort |
|---|------------|-----------|--------|
| 1 | TODO/TBD Resolution (Impr. 1) | 31 files = largest existing debt | Medium |
| 2 | Unified Quality Gate (Impr. 2) | Prevents all categories from growing | Low |
| 3 | Source Enforcement (Impr. 3) | High risk without gate despite low current debt | Low |
| 4 | Freshness Scoring (Impr. 4) | Agent trust + retrieval quality | Medium |
| 5 | Minimum Content Standards (Impr. 5) | Only 2 files; gate prevents growth | Low |

**Recommended execution order for a coder agent:**
1. Implement Improvement 2 (unified gate) first — it subsumes Improvements 1, 3, and 5 into one script.
2. Run the gate against current vault to generate the full issue list.
3. Resolve all 31 TODO/TBD files using the SLA workflow.
4. Backfill 2 unsourced files and 2 thin files.
5. Implement freshness scanning and add `last_verified` to frontmatter standard.

---

## 4. Sources

1. Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," NeurIPS 2020
2. Gao et al., "Retrieval-Augmented Generation for Large Language Models: A Survey," arXiv:2312.10997, 2024
3. Wang et al., "Searching for Best Practices in Retrieval-Augmented Generation," arXiv:2407.01219, 2024
4. Ahrens, S., "How to Take Smart Notes," 2nd edition, 2022
5. Suchanek & Weikum, "Knowledge Bases in the Age of Big Data Analytics," VLDB 2014
6. Dong et al., "Knowledge Vault: A Web-Scale Approach to Probabilistic Knowledge Fusion," KDD 2014
7. LangChain documentation on time-weighted retrieval, 2024-2025
8. LlamaIndex documentation on metadata-enriched indexing, 2024-2025
9. r/ObsidianMD and r/Zettelkasten community discussions on vault maintenance, 2024-2025
