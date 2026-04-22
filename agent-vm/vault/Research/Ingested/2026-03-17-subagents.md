---
title: "Subagents"
url: "https://simonwillison.net/guides/agentic-engineering-patterns/subagents/#atom-everything"
author: "Unknown"
date: 2026-03-17
score: 100
tags:
  - LLM
  - agent
  - agents
  - llm
  - memory
  - prompting
  - rag
  - research
type: research
confidence: 0.60
source: "url:https://simonwillison.net/guides/agentic-engineering-patterns/subagents/#atom-everything"
summary: "Agentic Engineering Patterns > LLMs are restricted by their context limit - how many tokens they can fit in their working memory at any given time. Th"
summary: "Agentic Engineering Patterns > LLMs are restricted by their context limit - how many tokens they can fit in their working memory at any given time. Th"
domain: research
aliases:
  - "subagents"
---

# Subagents

## Summary

Agentic Engineering Patterns > LLMs are restricted by their context limit - how many tokens they can fit in their working memory at any given time. These values have not increased much over the past two years even as the LLMs themselves have seen dramatic improvements in their abilities - they generally top out at around 1,000,000, and benchmarks frequently report better quality results below 200,000. Carefully managing the context such that it fits within those limits is critical to getting great results out of a model.

## Key Takeaways

- When a coding agent uses a subagent it effectively dispatches a fresh copy of itself to achieve a specified goal, with a new context window that starts with a fresh prompt.
- Any time you start a new task against an existing repo Claude Code first needs to explore that repo to figure out its general shape and find relevant information needed to achieve that task.
- When a coding agent uses a subagent it effectively dispatches a fresh copy of itself to achieve a specified goal, with a new context window that starts with a fresh prompt.
- Any time you start a new task against an existing repo Claude Code first needs to explore that repo to figure out its general shape and find relevant information needed to achieve that task.

## Source

- [Original Article](https://simonwillison.net/guides/agentic-engineering-patterns/subagents/#atom-everything)
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
