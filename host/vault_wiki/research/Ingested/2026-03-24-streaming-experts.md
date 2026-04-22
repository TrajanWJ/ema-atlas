---
type: research
wiki_id: research/Ingested/2026-03-24-streaming-experts
imported_from: vault/Research/Ingested/2026-03-24-streaming-experts.md
imported_at: '2026-04-04T00:23:57.090Z'
tags: []
summary: ''
---
# Streaming experts

## Summary

I wrote about Dan Woods' experiments with streaming experts the other day, the trick where you run larger Mixture-of-Experts models on hardware that doesn't have enough RAM to fit the entire model by instead streaming the necessary expert weights from SSD for each token that you process. Five days ago Dan was running Qwen3.5-397B-A17B in 48GB of RAM. Today @seikixtc reported running the colossal Kimi K2.5 - a 1 trillion parameter model with 32B active weights at any one time, in 96GB of RAM on an M2 Max MacBook Pro.

## Key Takeaways

- And @anemll showed that same Qwen3.5-397B-A17B model running on an iPhone, albeit at just 0.6 tokens/second - iOS repo here.
- And @anemll showed that same Qwen3.5-397B-A17B model running on an iPhone, albeit at just 0.6 tokens/second - iOS repo here.

## Source

- [Original Article](https://simonwillison.net/2026/Mar/24/streaming-experts/#atom-everything)
- Author: Unknown
- Relevance Score: 100/100

## Related Notes

- [[Serena MCP]]
- [[karpathy-digest-2026-03-19]]
- [[AI Landscape 2026-03-16]]
- [[kali-mcp]]
- [[harbor-llm-stack]]

---
*Auto-ingested on 2026-03-24 22:29 UTC*
