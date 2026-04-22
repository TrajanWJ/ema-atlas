---
title: "Auto-Classification for New Knowledge — Implementation"
type: system
status: active
date: 2026-03-18
tags: [automation, vault-health, classification, auto-knowledge]
created: 2026-03-18
updated: 2026-03-18
source: unknown
---

# Auto-Classification for New Knowledge

Implemented 2026-03-18 to close the auto-classification gap in Aspirational Vault Architecture.

## What Was Built

### 1. Category-Based Classification in vault-classify.sh

`vault-classify.sh` now reads the `category` frontmatter field set by the auto-knowledge pipeline.

**Category → Directory mapping:**
| Category | Vault Directory | Rationale |
|----------|----------------|-----------|
| `decision` | `Architecture/` | Design/architectural decisions |
| `pattern` | `Skills/` | Reusable patterns and approaches |
| `extraction` | `Reference/` | Extracted facts and information |
| `fix` | `Operations/` | Fixes, solutions, workarounds |

This runs before tag/keyword classification, so auto-captured notes with a known category are routed with high confidence.

### 2. Hourly Classification Cron

Changed cron schedule from `30 4 * * *` (once at 4:30 AM) to `0 * * * *` (every hour).

- Before: up to 23.5 hours lag between capture and classification
- After: ≤1 hour lag

### 3. Immediate Classification Trigger in capture.sh

`capture.sh` now triggers `vault-classify.sh` in the background immediately after writing a new note to the Inbox. This means newly captured knowledge is typically classified within seconds.

## Files Modified

- `/home/trajan/bin/vault-classify.sh` — Added category-based routing (lines 110-115)
- `/home/trajan/skills/auto-knowledge/scripts/capture.sh` — Added immediate classification trigger
- `crontab` — Changed vault-classify.sh schedule from daily to hourly

## Testing

Verified with test files containing `category: decision` and `category: pattern` that the `get_fm_field` function correctly extracts the value and routes to the right directory.
