---
type: research
wiki_id: research/Ingested/2026-03-19-form-follows-function-recursive-stem-model
imported_from: >-
  vault/Research/Ingested/2026-03-19-form-follows-function-recursive-stem-model.md
imported_at: '2026-04-04T00:23:57.073Z'
tags: []
summary: ''
---
# Form Follows Function: Recursive Stem Model

## Summary

arXiv:2603.15641v1 Announce Type: new Abstract: Recursive reasoning models such as Hierarchical Reasoning Model (HRM) and Tiny Recursive Model (TRM) show that small, weight-shared networks can solve compute-heavy and NP puzzles by iteratively refining latent states, but their training typically relies on deep supervision and/or long unrolls that increase wall-clock cost and can bias the model toward greedy intermediate behavior. We introduce Recursive Stem Model (RSM), a recursive reasoning approach that keeps the TRM-style backbone while changing the training contract so the network learns a stable, depth-agnostic transition operator. RSM fully detaches the hidden-state history during training, treats early iterations as detached "warm-up" steps, and applies loss only at the final step.

## Key Takeaways

- arXiv:2603.15641v1 Announce Type: new Abstract: Recursive reasoning models such as Hierarchical Reasoning Model (HRM) and Tiny Recursive Model (TRM) show that small, weight-shared networks can solve compute-heavy and NP puzzles by iteratively refining latent states, but their training typically relies on deep supervision and/or long unrolls that increase wall-clock cost and can bias the model toward greedy intermediate behavior.
- We introduce Recursive Stem Model (RSM), a recursive reasoning approach that keeps the TRM-style backbone while changing the training contract so the network learns a stable, depth-agnostic transition operator.
- RSM fully detaches the hidden-state history during training, treats early iterations as detached "warm-up" steps, and applies loss only at the final step.

## Source

- [Original Article](https://arxiv.org/abs/2603.15641)
- Author: Navid Hakimi
- Relevance Score: 60/100

## Related Notes

- [[Serena MCP]]
- [[Code Review Skills Landscape]]
- [[karpathy-digest-2026-03-19]]
- [[AI Landscape 2026-03-16]]
- [[Reddit Intel - OpenClaw Focus]]

---
*Auto-ingested on 2026-03-19 23:52 UTC*
