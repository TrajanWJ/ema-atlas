---
title: "Autoresearching Apple's 'LLM in a Flash' to run Qwen 397B locally"
url: "https://simonwillison.net/2026/Mar/18/llm-in-a-flash/#atom-everything"
author: "Unknown"
date: 2026-03-18
score: 100
tags:
  - LLM
  - ai
  - claude
  - embedding
  - llm
  - memory
  - rag
  - research
type: research
confidence: 0.60
source: "url:https://simonwillison.net/2026/Mar/18/llm-in-a-flash/#atom-everything"
summary: "Autoresearching Apple's 'LLM in a Flash' to run Qwen 397B locally Here's a fascinating piece of research by Dan Woods, who managed to get a custom ver"
summary: "Autoresearching Apple's 'LLM in a Flash' to run Qwen 397B locally Here's a fascinating piece of research by Dan Woods, who managed to get a custom ver"
domain: research
aliases:
  - "autoresearching-apples-llm-in-a-flash-to-run-qwen-397b-local"
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
