# Vault stale-note detection reported 114 stale notes but actual count is 21 — detection query/script is inflating counts by ~5x, likely counting non-note files or using wrong date field

- **Category:** best-practice
- **Source:** task-728c726c.txt
- **Applied:** 2026-04-12T15:03:54Z
- **Impact:** 2/5
- **Project:** general

## Details

Audit the stale-note detection query (likely in proposal-engine-v2.sh or vault hygiene cron) — check whether it filters by file type (.md only), excludes templates/conventions, and uses frontmatter 'updated' field rather than filesystem mtime

## Source Context

Extracted from agent result: `task-728c726c.txt`

---
Tags: #intelligence #best-practice #auto-applied
