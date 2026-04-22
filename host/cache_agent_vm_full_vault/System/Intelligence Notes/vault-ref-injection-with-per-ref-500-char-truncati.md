---
title: "Vault Ref Injection with Budget Caps"
type: technique
created: 2026-03-24
updated: 2026-04-10
confidence: 0.85
confidence_updated: 2026-04-10
source: peer-pr-20260324-210438-556357.txt
tags: [intelligence, technique, prompt-engineering, context-management, auto-applied]
summary: "Per-ref 500-char truncation and 3KB total budget cap for vault reference injection in prompt compilation — prevents runaway context while grounding prompts in vault content."
---

# Vault Ref Injection with Per-Ref 500-Char Truncation and 3KB Total Budget Cap

## Problem

When agents are spawned, the [[prompt-compiler]] injects vault references into their context to ground responses in project knowledge. Without limits, this injection can consume an unbounded portion of the agent's context window. A single long vault note (e.g., a 10KB research document) injected verbatim can crowd out the actual task prompt, conversation history, and other critical context. Multiply this by 3-5 references and you easily burn 30-50KB of context on background material the agent may not even need.

This is a specific instance of the broader [[prompt-compression]] challenge: how to include enough context for grounded responses without degrading agent performance through context saturation.

## Technique

Apply two complementary budget caps to vault reference injection:

### Per-Reference Cap: 500 Characters

Each individual vault reference is truncated to 500 characters. This is enough to capture:

- The note's frontmatter (title, tags, summary)
- The opening paragraph or key definition
- Enough signal for the agent to know the note exists and what it covers

500 characters is roughly 125 tokens — small enough to be negligible in a 200K context window, but sufficient to provide semantic grounding. If the agent needs the full content, it can fetch it explicitly via tool use.

**Truncation strategy:** Prefer preserving frontmatter and the first substantive paragraph. Strip markdown formatting overhead (headers, horizontal rules, excessive whitespace). If the note has a `summary` field in frontmatter, use that as the primary content rather than truncating the body.

### Total Budget Cap: 3KB

All injected vault references combined must not exceed 3KB (~750 tokens). This means:

- With 500-char per-ref caps, you can inject up to ~6 references before hitting the total budget
- If fewer references are needed, each can use slightly more of the budget
- The total budget acts as a hard ceiling regardless of how many references match

3KB represents roughly 0.4% of a 200K context window — negligible overhead while still providing meaningful grounding.

## Where to Apply

This technique applies at two injection points in the system:

1. **SOUL.md prompt assembly** — When the [[prompt-compiler]] builds an agent's system prompt, any `vault_refs` or `related_notes` sections should respect these caps. The compiler already manages token budgets per module; vault refs should be treated as another budget-constrained module.

2. **Proposal engine context loader** — When the dispatch system loads context for task proposals, vault references injected as background should follow the same caps. This prevents proposal context from ballooning when many vault notes match a query.

## Implementation Considerations

**Reference selection matters more than reference length.** With only 3KB total, choosing the *right* 5-6 references is more valuable than including 20 truncated ones. Semantic similarity scoring (as used by [[prompt-compression]]) should rank candidates before truncation applies.

**Frontmatter-first truncation.** A note's YAML frontmatter often contains the highest-density signal: title, summary, tags, confidence. When truncating to 500 chars, preserve frontmatter fields before body content. A note's summary field alone may suffice.

**Escape hatch.** Some agents (e.g., researchers, vault-keepers) genuinely need full vault content. These should be configured with `vault_ref_budget: unlimited` or a higher cap in their roster entry, similar to how [[prompt-compression]] allows `compress_context: false`.

## Relationship to Context Budgeting

This technique is one layer in a multi-level context budgeting strategy:

| Layer | Scope | Budget |
|---|---|---|
| Vault ref injection | Background knowledge | 3KB total, 500 chars/ref |
| [[prompt-compression]] | Conversation history | 2000 tokens default |
| [[context-budgeting]] | Full session context | Partitioned by phase |
| Agent context window | Total available | 200K tokens |

Each layer independently caps its contribution, preventing any single source from dominating the context window.

## Origin

Extracted from peer review session `peer-pr-20260324-210438-556357.txt` during work on the [[Auto Delegator Layer]]. Impact assessed at 3/5 — moderate improvement to context efficiency with low implementation cost.

## Related

- [[prompt-compiler]] — The system that assembles agent prompts from modular blocks
- [[prompt-compression]] — Broader conversation history compression before agent invocation
- [[context-budgeting]] — Session-level context partitioning and checkpointing
- [[Auto Delegator Layer]] — The project where this technique was identified
