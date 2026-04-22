---
type: research
wiki_id: >-
  research/Ingested/2026-03-20-sqlite-tags-benchmark-comparing-5-tagging-strategies
imported_from: >-
  vault/Research/Ingested/2026-03-20-sqlite-tags-benchmark-comparing-5-tagging-strategies.md
imported_at: '2026-04-04T00:23:57.079Z'
tags: []
summary: ''
---
# SQLite Tags Benchmark: Comparing 5 Tagging Strategies

## Summary

Research: SQLite Tags Benchmark: Comparing 5 Tagging Strategies I had Claude Code run a micro-benchmark comparing different approaches to implementing tagging in SQLite. Traditional many-to-many tables won, but FTS5 came a close second. Full table scans with LIKE queries performed better than I expected, but full table scans with JSON arrays and json_each() were much slower.

## Key Takeaways

- Research: SQLite Tags Benchmark: Comparing 5 Tagging Strategies I had Claude Code run a micro-benchmark comparing different approaches to implementing tagging in SQLite.
- Traditional many-to-many tables won, but FTS5 came a close second.
- Full table scans with LIKE queries performed better than I expected, but full table scans with JSON arrays and json_each() were much slower.

## Source

- [Original Article](https://simonwillison.net/2026/Mar/20/sqlite-tags-benchmark/#atom-everything)
- Author: Unknown
- Relevance Score: 100/100

## Related Notes

- [[Serena MCP]]
- [[Code Review Skills Landscape]]
- [[karpathy-digest-2026-03-19]]
- [[AI Landscape 2026-03-16]]
- [[Reddit Intel - OpenClaw Focus]]

---
*Auto-ingested on 2026-03-24 22:29 UTC*
