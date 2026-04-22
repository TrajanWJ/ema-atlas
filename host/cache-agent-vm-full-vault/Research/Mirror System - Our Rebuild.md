---
title: "Mirror System — Our Rebuild"
type: research
created: "2026-03-18"
tags: [memory-architecture, context-drift, knowledge-management, implementation]
project: openclaw
status: active
confidence: 0.80
confidence_updated: 2026-03-18
summary: "Implementation of 4 features inspired by the Three-Tier Memory Architecture analysis: token-optimized retrieval, auto-classification, structured session capture, and weekly synthesis."
key_topics: [token-optimization, auto-classification, session-capture, weekly-synthesis, context-drift-prevention]
source: research
updated: 2026-03-18
---

# Mirror System — Our Rebuild

Based on the analysis in [[Three-Tier Memory Architecture]], we implemented 4 features that address the key gaps identified:

## What Was Built

### 1. Token-Optimized Retrieval — `qmd-context.sh`
**Location:** `/home/trajan/bin/qmd-context.sh`
**Usage:** `qmd-context.sh <query> [--limit N]`

The #1 anti-context-drift measure. Instead of dumping full vault notes into agent context, this script:
- Runs `qmd search` to find matching notes
- For each result, extracts ONLY: title, tags, key_topics, summary, and path
- Outputs a compact metadata list (not full content)
- Agent reviews the list, then does `qmd get <path>` only for notes that are actually relevant

**Token savings:** ~90%+ on knowledge retrieval. Agents see 5-10 lines per note instead of hundreds.

**How it works:** Uses `qmd get <path> -l 30` to fetch just the header of each note, then parses YAML frontmatter for structured metadata. Falls back to extracting the first paragraph as an auto-summary when no `summary` field exists.

### 2. Auto-Classification Hook — `vault-classify.sh`
**Location:** `/home/trajan/bin/vault-classify.sh`
**Usage:** `vault-classify.sh [--limit N] [--dry-run] [--dir path]`

Makes `qmd-context.sh` useful by ensuring notes have machine-generated summaries. Finds vault notes that lack a `summary` field in frontmatter, then uses Claude to generate:
- `summary` — 1-2 sentence description (max 200 chars)
- `key_topics` — 3-5 key concepts covered

Writes the generated metadata back into each note's YAML frontmatter. Can be:
- Run standalone for batch processing
- Hooked into the ontology-sync cron for continuous classification
- Run with `--dry-run` to preview what would be classified

**Design:** Skips Templates, Daily Notes, .obsidian, and .trash directories. Processes files with existing YAML frontmatter only. Truncates content to 3000 chars for classification to save tokens.

### 3. Structured Session Capture
**Template:** `/home/trajan/vault/Templates/Session Capture.md`
**Output dir:** `/home/trajan/vault/Sessions/`

After any significant debugging or troubleshooting task, agents write a structured capture note with:
- Date, Agent, Task Description, Goal
- Commands/Steps That Worked
- Commands/Steps That Failed
- Root Cause (if debugging)
- Fix Applied
- Lessons Learned
- Related Notes (wikilinks)

**Dispatch protocol updated:** AGENTS.md step 11 now requires [[session capture]] after debugging tasks. This makes past problem-solving sessions searchable and prevents re-solving the same issues.

### 4. Weekly Synthesis — `weekly-synthesis.sh`
**Location:** `/home/trajan/bin/weekly-synthesis.sh`
**Usage:** `weekly-synthesis.sh [--dry-run]`
**Output:** `/home/trajan/vault/Trajan/weekly-synthesis/YYYY-WW.md`

Enhanced version of the existing weekly synthesis. Now reads:
- Last 7 days of daily memory notes
- New/modified vault notes from the past week (metadata only — token-optimized)
- [[Session capture]] notes from `vault/Sessions/`
- Message harvests, corrections, preferences, decisions, design philosophy

Produces a synthesis with sections for:
- Recurring Themes
- Key Learnings
- Contradictions & Tensions
- Opportunities
- [[Session Capture]] Highlights
- Preference Evolution
- Recommendations
- Pattern Connections

Also updates `vault/Trajan/Preferences.md` with new signals from the week.

## Files Changed

| File | Action |
|---|---|
| `/home/trajan/bin/qmd-context.sh` | **Created** — Token-optimized vault search |
| `/home/trajan/bin/vault-classify.sh` | **Created** — Auto-classification hook |
| `/home/trajan/vault/Templates/Session Capture.md` | **Created** — Structured capture template |
| `/home/trajan/vault/Sessions/` | **Created** — Directory for session notes |
| `/home/trajan/bin/weekly-synthesis.sh` | **Updated** — Enhanced with vault notes, sessions, richer output |
| `AGENTS.md` | **Updated** — Added step 11 ([[session capture]]) to dispatch protocol |
| `/home/trajan/vault/Trajan/weekly-synthesis/` | **Ensured exists** — Output directory for synthesis |

## What We Didn't Build (and Why)

- **Promotion pipeline** — Automated raw→structured knowledge promotion. Deferred because Vault Keeper + manual curation is sufficient at our vault size. Revisit if vault grows past 1000 notes.
- **Custom MCP server** — QMD MCP already handles search. Adding another MCP would create integration complexity without clear benefit.
- **Rate limit failover** — Useful but lower priority. Can be added to dispatch protocol retry logic later.

## Connection to Mirror Analysis

This implements Priorities 1-4 from [[Three-Tier Memory Architecture#6. What We Should Adopt]]:
- Priority 1 (Token-Optimized Retrieval) → `qmd-context.sh`
- Priority 2 (Auto-Classification) → `vault-classify.sh`
- Priority 3 (Structured [[Session Capture]]) → Template + Sessions/ + AGENTS.md
- Priority 4 (Weekly Synthesis) → Enhanced `weekly-synthesis.sh`

---

*Built 2026-03-18. All scripts tested and executable.*

## Related

- [[Mirror]]
- [[System]]
- [[-]]
- [[Comparison]]
- [[Review]]
