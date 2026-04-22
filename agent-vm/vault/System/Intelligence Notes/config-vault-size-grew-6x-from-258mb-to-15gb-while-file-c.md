---
title: "Vault Size Grew 6x (258MB→1.5GB) While File Count Only Grew 6%"
type: reference
created: 2026-04-16
updated: 2026-04-17
confidence: high
source: vault-improve-20260416-000008-1.txt, direct vault analysis
tags: [intelligence, config-change, diREDACTED_TOKEN, vault-ops]
summary: "Vault grew 6x in size with only 6% more files — root cause is git object bloat from large file churn, not content files."
---

# Vault Size Grew 6x (258MB→1.5GB) While File Count Only Grew 6%

## Observation

The Obsidian vault grew from 258MB to 1.5GB (a ~6x increase) while file count only moved from 2,922 to 3,090 (a ~6% increase). This disproportionate size-to-file-count ratio signals that the growth is not from adding markdown notes — it's from large objects accumulating somewhere in the vault directory tree.

## Root Cause Analysis

Direct investigation on 2026-04-17 reveals the breakdown:

| Component | Size | Notes |
|-----------|------|-------|
| Vault content (excl. .git) | 215MB | Markdown, configs, media |
| .git directory | ~1.5GB | Object store bloat |
| **Total** | **1.7GB** | Current measured size |

The largest non-git directories are:
- `ontology/` — 114MB (knowledge graph data, expected to be large)
- `wiki/` — 23MB (reference content)
- `LCM Summaries/` — 8.6MB (session summaries)
- Everything else — under 4MB each

The actual content is only 215MB — well within normal range for a ~5,000-file vault. The remaining ~1.5GB is entirely in `.git/objects/`, where large files that were committed then removed (or frequently modified binary files) leave permanent pack objects.

## Why This Matters

1. **Git clone/pull performance** — A 1.5GB git repo is slow to clone and consumes bandwidth on every fresh checkout. This becomes a bottleneck for any CI/CD, backup, or multi-machine sync workflows.
2. **Disk budget** — This vault exists on a host that [[config-host-disk-grew-124gb-in-3-weeks-165gb289gb-2035-us|grew 124GB in 3 weeks]] and where [[disk-cleanup-recovered-4gb-8985-but-14gb-free-rema|disk cleanup only bought days of headroom]]. Every GB matters.
3. **Obsidian performance** — While Obsidian itself doesn't index `.git/`, tools that operate on the full directory (search, backup scripts, `du` checks) are affected.

## Common Causes of Git Object Bloat in Vaults

- **Committed binary files** (PDFs, images, database files) that were later deleted — git retains them in history forever.
- **Large generated files** (JSON exports, embeddings, index files) being tracked and frequently updated — each version creates a new object.
- **Obsidian plugin data** — Some plugins (e.g., local graph cache, search index) write large JSON or SQLite files that get committed accidentally.
- **QMD/ontology index files** — The `ontology/` directory at 114MB contains knowledge graph data that may be regenerated frequently.

## Remediation Options

### Immediate (Low Risk)
- Add large generated directories to `.gitignore` (ontology indexes, plugin caches)
- Run `git gc --aggressive` to repack objects and reduce loose object overhead
- Audit `.gitignore` for missing patterns: `*.sqlite`, `*.db`, `data.json`, embeddings files

### Medium-Term (Moderate Risk)
- Use `git filter-repo` or BFG Repo Cleaner to purge large blobs from history
- Move binary assets to Git LFS for any media files that must stay versioned
- Set up a pre-commit hook that rejects files over a size threshold (e.g., 5MB)

### Preventive
- Add a periodic check in [[disk-cleanup-recovered-4gb-8985-but-14gb-free-rema|the disk cleanup cron job]] that reports `.git` size relative to working tree size
- Monitor `git count-objects -vH` output — the `size-pack` field shows total pack file size

## Diagnostic Commands

```bash
# Current breakdown
du -sh ~/vault/.git ~/vault --exclude=.git

# Largest objects in git history
git -C ~/vault rev-list --objects --all | \
  git -C ~/vault cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  sort -k3 -n -r | head -20

# Find what's in .git/objects eating space
git -C ~/vault count-objects -vH

# Check .gitignore coverage
git -C ~/vault status --porcelain | grep '??' | head -20
```

## Connection to Broader Disk Issues

This vault bloat is one component of a larger disk growth pattern on this host. The 124GB growth over 3 weeks (documented in [[config-host-disk-grew-124gb-in-3-weeks-165gb289gb-2035-us]]) was primarily driven by Docker images and build artifacts, but git repo bloat across multiple projects (including this vault) contributes to the compounding pressure. The [[disk-cleanup-recovered-4gb-8985-but-14gb-free-rema|disk cleanup effort]] recovered 4GB but noted the growth trajectory means that's only days of headroom — fixing the vault's git bloat would recover ~1.3GB permanently.

## Status

- **Impact:** 2/5 — Not urgent but contributes to ongoing disk pressure
- **Action:** Flag for next maintenance window. Run `git gc --aggressive` as a quick win, then audit `.gitignore` coverage.
