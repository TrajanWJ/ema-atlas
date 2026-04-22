---
title: "Malicious litellm_init.pth in litellm 1.82.8 — credential stealer"
url: "https://simonwillison.net/2026/Mar/24/malicious-litellm/#atom-everything"
author: "Unknown"
date: 2026-03-24
score: 95
tags:
  - LLM
  - ai
  - llm
  - rag
type: research
confidence: 0.60
source: "url:https://simonwillison.net/2026/Mar/24/malicious-litellm/#atom-everything"
summary: "Malicious litellm_init.pth in litellm 1.82.8 — credential stealer The LiteLLM v1.82.8 package published to PyPI was compromised with a particularly na"
summary: "Malicious litellm_init.pth in litellm 1.82.8 — credential stealer The LiteLLM v1.82.8 package published to PyPI was compromised with a particularly na"
domain: research
aliases:
  - "malicious-litellminitpth-in-litellm-1828-credential-stealer"
---

# Malicious litellm_init.pth in litellm 1.82.8 — credential stealer

## Summary

Malicious litellm_init.pth in litellm 1.82.8 — credential stealer The LiteLLM v1.82.8 package published to PyPI was compromised with a particularly nasty credential stealer hidden in base64 in a litellm_init.pth file, which means installing the package is enough to trigger it even without running import litellm. (1.82.7 had the exploit as well but it was in the proxy/proxy_server.py file so the package had to be imported for it to take effect.) This issue has a very detailed description of what the credential stealer does. There's more information about the timeline of the exploit over here.

## Key Takeaways

- Malicious litellm_init.pth in litellm 1.82.8 — credential stealer The LiteLLM v1.82.8 package published to PyPI was compromised with a particularly nasty credential stealer hidden in base64 in a litellm_init.pth file, which means installing the package is enough to trigger it even without running import litellm.
- (1.82.7 had the exploit as well but it was in the proxy/proxy_server.py file so the package had to be imported for it to take effect.) This issue has a very detailed description of what the credential stealer does.
- There's more information about the timeline of the exploit over here.

## Source

- [Original Article](https://simonwillison.net/2026/Mar/24/malicious-litellm/#atom-everything)
- Author: Unknown
- Relevance Score: 95/100

## Related Notes

- [[Serena MCP]]
- [[karpathy-digest-2026-03-19]]
- [[AI Landscape 2026-03-16]]
- [[kali-mcp]]
- [[harbor-llm-stack]]

---
*Auto-ingested on 2026-03-24 22:29 UTC*
