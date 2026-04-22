---
title: "How coding agents work"
url: "https://simonwillison.net/guides/agentic-engineering-patterns/how-coding-agents-work/#atom-everything"
author: "Unknown"
date: 2026-03-16
score: 100
tags:
  - LLM
  - RAG
  - agent
  - agents
  - llm
  - prompting
  - rag
  - tooling
type: research
confidence: 0.60
source: "url:https://simonwillison.net/guides/agentic-engineering-patterns/how-coding-agents-work/#atom-everything"
summary: "Agentic Engineering Patterns > As with any tool, understanding how coding agents work under the hood can help you make better decisions about how to a"
summary: "Agentic Engineering Patterns > As with any tool, understanding how coding agents work under the hood can help you make better decisions about how to a"
domain: research
aliases:
  - "how-coding-agents-work"
---

# How coding agents work

## Summary

Agentic Engineering Patterns > As with any tool, understanding how coding agents work under the hood can help you make better decisions about how to apply them. A coding agent is a piece of software that acts as a harness for an LLM, extending that LLM with additional capabilities that are powered by invisible prompts and implemented as callable tools. Large Language Models At the heart of any coding agent is a Large Language Model, or LLM.

## Key Takeaways

- Chat templated prompts The first LLMs worked as completion engines - users were expected to provide a prompt which could then be completed by the model, such as the two examples shown above.
- This wasn't particularly user-friendly so models mostly switched to using chat templated prompts instead, which represent communication with the model as a simulated conversation.
- Coding agents usually start every conversation with a system prompt like this, which is not shown to the user but provides instructions telling the model how it should behave.
- A simple tool loop can be achieved with a few dozen lines of code on top of an existing LLM API.

## Source

- [Original Article](https://simonwillison.net/guides/agentic-engineering-patterns/how-coding-agents-work/#atom-everything)
- Author: Unknown
- Relevance Score: 100/100

## Related Notes

- [[Serena MCP]]
- [[Code Review Skills Landscape]]
- [[karpathy-digest-2026-03-19]]
- [[Reddit Intel - OpenClaw Focus]]
- [[harbor-llm-stack]]

---
*Auto-ingested on 2026-03-19 23:52 UTC*
