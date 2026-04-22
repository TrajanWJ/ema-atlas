# Config Change: ~/archive/openclaw/ consuming 3.8GB — archived project data could be compressed or moved to external storage to reclaim largest single directory

- **Source:** task-49ee5872.txt
- **Suggested:** 2026-04-16T03:04:13Z
- **Impact:** 3/5

## Change Details

Compress with `tar czf ~/archive/openclaw.tar.gz ~/archive/openclaw/ && trash ~/archive/openclaw/` to reclaim ~3GB+ after compression

## Status

Auto-flagged for application. Verify before applying to production configs.

---
Tags: #intelligence #config-change #auto-applied
