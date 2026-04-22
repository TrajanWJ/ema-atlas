---
type: research
wiki_id: >-
  research/Ingested/2026-03-13-shopifyliquid-performance-53-faster-parserender-61-fewer-all
imported_from: >-
  vault/Research/Ingested/2026-03-13-shopifyliquid-performance-53-faster-parserender-61-fewer-all.md
imported_at: '2026-04-04T00:23:57.062Z'
tags: []
summary: ''
---
# Shopify/liquid: Performance: 53% faster parse+render, 61% fewer allocations

## Summary

Shopify/liquid: Performance: 53% faster parse+render, 61% fewer allocations PR from Shopify CEO Tobias Lütke against Liquid, Shopify's open source Ruby template engine that was somewhat inspired by Django when Tobi first created it back in 2005. Tobi found dozens of new performance micro-optimizations using a variant of autoresearch, Andrej Karpathy's new system for having a coding agent run hundreds of semi-autonomous experiments to find new effective techniques for training nanochat. Tobi's implementation started two days ago with this autoresearch.md prompt file and an autoresearch.sh script for the agent to run to execute the test suite and report on benchmark scores.

## Key Takeaways

- This all added up to a 53% improvement on benchmarks - truly impressive for a codebase that's been tweaked by hundreds of contributors over 20 years.
- The autoresearch pattern - where an agent brainstorms a multitude of potential improvements and then experiments with them one at a time - is really effective.
- Here's Tobi's GitHub contribution graph for the past year, showing a significant uptick following that November 2025 inflection point when coding agents got really good.
- This all added up to a 53% improvement on benchmarks - truly impressive for a codebase that's been tweaked by hundreds of contributors over 20 years.

## Source

- [Original Article](https://simonwillison.net/2026/Mar/13/liquid/#atom-everything)
- Author: Unknown
- Relevance Score: 100/100

## Related Notes

- [[Serena MCP]]
- [[Code Review Skills Landscape]]
- [[karpathy-digest-2026-03-19]]
- [[AI Landscape 2026-03-16]]
- [[Reddit Intel - OpenClaw Focus]]

---
*Auto-ingested on 2026-03-19 23:52 UTC*
