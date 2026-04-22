---
type: agent-learning
wiki_id: >-
  agents/ops/2026-03-19-disk-is-at-88-reclaim-space-1-remove-old-dispatch-results-ol
imported_from: >-
  vault/Agent
  Knowledge/ops/2026-03-19-disk-is-at-88-reclaim-space-1-remove-old-dispatch-results-ol.md
imported_at: '2026-04-04T00:23:56.579Z'
tags: []
summary: ''
---
# Disk is at 88% — reclaim space. (1) Remove old dispatch results older than 3 days: find ~/dispatch/done/ -mtime +3 -de

> Source: dispatch task `wave-01-disk-reclaim` completed 2026-03-19 by **ops**

## Key Findings

Disk reclaimed: **88% → 76%** (15G free, target was <80%). 

| Step | Result |
|---|---|
| Dispatch results (>3 days) | Cleaned |
| Docker prune -af | **7.24 GB reclaimed** (containers, images, networks, build cache) |
| Claude sessions (>5 days) | Cleaned |
| Large logs (>10M truncated to 1M) | Done |
| /tmp cleanup | Done |
| npm cache | Cleaned |

## Task Context

- **Agent:** ops
- **Task ID:** `wave-01-disk-reclaim`
- **Completed:** 2026-03-19T02:18:59Z
- **Result file:** `/home/trajan/dispatch/results/wave-01-disk-reclaim.txt`

## Related

- [[Agent Knowledge]] — cross-agent knowledge index
- [[ops]] — agent profile
