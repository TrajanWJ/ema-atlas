---
tags: [prompt-engineering, production, strategies, enterprise]
summary: "⭐ 8k+ — Battle-tested internal guide from Brex for production LLM use."
source: https://github.com/brexhq/prompt-engineering
category: Prompt Engineering Guide
date: 2026-03-14
status: active
confidence: 0.80
confidence_updated: 2026-03-18
type: reference
updated: 2026-03-14
created: 2026-03-14
title: "Brex Prompt Engineering Guide"
---

# Brex Prompt Engineering Guide

⭐ 8k+ — Battle-tested internal guide from Brex for production LLM use.

## Key Strategies

### Embedding Data
- **Simple Lists** — bullet points for small datasets
- **Markdown Tables** — structured data presentation
- **JSON** — programmatic consumption
- **Freeform Text** — narrative context
- **Nested Data** — hierarchical information

### Prompting Patterns
- **Command Grammars** — structured command syntax for tool use
- **ReAct Pattern** — Reasoning + Acting loop
- **Chain of Thought** — step-by-step reasoning
- **Citations** — grounding responses in sources
- **Delimiters** — separating context from instructions

### Production Concerns
- **Hidden Prompts** — system prompt security
- **Prompt Hacking** — jailbreaks and leaks defense
- **Token Management** — limits and optimization
- **Fine Tuning** — when and why (with downsides)

## Relevance to Our Stack

- **Meta-Prompter** — data embedding strategies for context injection
- **Command Grammars** — useful pattern for structured agent communication
- **Production patterns** — security and reliability concerns
- **ReAct** — already used in our agent architecture

## Local Path

`/tmp/prompt-repos/prompt-engineering/README.md`

## Related

- [[QA Prompt Library]]
- [[README]]
- [[research-round-2-metaprompting-deep-dive]]
- [[Metaprompting]]
- [[and]]
- [[QA Prompt Library]]
- [[README]]
- Dynamic
- Agent
- Architecture
