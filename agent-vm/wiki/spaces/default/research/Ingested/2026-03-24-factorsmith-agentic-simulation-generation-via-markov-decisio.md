---
type: research
wiki_id: >-
  research/Ingested/2026-03-24-factorsmith-agentic-simulation-generation-via-markov-decisio
imported_from: >-
  vault/Research/Ingested/2026-03-24-factorsmith-agentic-simulation-generation-via-markov-decisio.md
imported_at: '2026-04-04T00:23:57.086Z'
tags: []
summary: ''
---
# FactorSmith: Agentic Simulation Generation via Markov Decision Process Decomposition with Planner-Designer-Critic Refinement

## Summary

arXiv:2603.20270v1 Announce Type: new Abstract: Generating executable simulations from natural language specifications remains a challenging problem due to the limited reasoning capacity of large language models (LLMs) when confronted with large, interconnected codebases. This paper presents FactorSmith, a framework that synthesizes playable game simulations in code from textual descriptions by combining two complementary ideas: factored POMDP decomposition for principled context reduction and a hierarchical planner-designer-critic agentic workflow for iterative quality refinement at every generation step. Drawing on the factored partially observable Markov decision process (POMDP) representation introduced by FactorSim [Sun et al., 2024], the proposed method decomposes a simulation specification into modular steps where each step operates only on a minimal subset of relevant state variables, limiting the context window that any single LLM call must process.

## Key Takeaways

- This paper formalizes the combined approach, presents the mathematical framework underpinning context selection and agentic refinement, and describes the open-source implementation.

## Source

- [Original Article](https://arxiv.org/abs/2603.20270)
- Author: Ali Shamsaddinlou, Morteza NourelahiAlamdari
- Relevance Score: 100/100

## Related Notes

- [[Serena MCP]]
- [[Code Review Skills Landscape]]
- [[karpathy-digest-2026-03-19]]
- [[AI Landscape 2026-03-16]]
- [[Reddit Intel - OpenClaw Focus]]

---
*Auto-ingested on 2026-03-24 22:30 UTC*
