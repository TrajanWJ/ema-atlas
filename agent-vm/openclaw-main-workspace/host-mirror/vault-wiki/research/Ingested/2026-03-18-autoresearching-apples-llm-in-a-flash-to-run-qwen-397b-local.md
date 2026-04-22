---
type: research
wiki_id: >-
  research/Ingested/2026-03-18-autoresearching-apples-llm-in-a-flash-to-run-qwen-397b-local
imported_from: >-
  vault/Research/Ingested/2026-03-18-autoresearching-apples-llm-in-a-flash-to-run-qwen-397b-local.md
imported_at: '2026-04-04T00:23:57.071Z'
tags: []
summary: ''
---
# Autoresearching Apple's "LLM in a Flash" to run Qwen 397B locally

## Summary

Autoresearching Apple's "LLM in a Flash" to run Qwen 397B locally Here's a fascinating piece of research by Dan Woods, who managed to get a custom version of Qwen3.5-397B-A17B running at 5.5+ tokens/second on a 48GB MacBook Pro M3 Max despite that model taking up 209GB (120GB quantized) on disk. Qwen3.5-397B-A17B is a Mixture-of-Experts (MoE) model, which means that each token only needs to run against a subset of the overall model weights. These expert weights can be streamed into memory from SSD, saving them from all needing to be held in RAM at the same time.

## Key Takeaways

- Autoresearching Apple's "LLM in a Flash" to run Qwen 397B locally Here's a fascinating piece of research by Dan Woods, who managed to get a custom version of Qwen3.5-397B-A17B running at 5.5+ tokens/second on a 48GB MacBook Pro M3 Max despite that model taking up 209GB (120GB quantized) on disk.
- Qwen3.5-397B-A17B is a Mixture-of-Experts (MoE) model, which means that each token only needs to run against a subset of the overall model weights.
- These expert weights can be streamed into memory from SSD, saving them from all needing to be held in RAM at the same time.

## Source

- [Original Article](https://simonwillison.net/2026/Mar/18/llm-in-a-flash/#atom-everything)
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
