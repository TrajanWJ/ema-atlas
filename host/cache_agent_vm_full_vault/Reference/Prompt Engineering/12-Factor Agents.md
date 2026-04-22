---
tags: [agents, architecture, patterns, production]
summary: "Principles for building production-grade LLM agents. Inspired by 12 Factor Apps."
source: https://github.com/humanlayer/12-factor-agents
category: Agent Architecture
date: 2026-03-14
status: active
confidence: 0.80
confidence_updated: 2026-03-18
type: reference
updated: 2026-03-16
created: 2026-03-14
title: "12-Factor Agents"
---

# 12-Factor Agents

Principles for building production-grade LLM agents. Inspired by 12 Factor Apps.

## Core Insight

> "Good agents are mostly software with LLM steps sprinkled in at just the right points."

Most production "AI agents" are NOT the "prompt + tools + loop" pattern. They're deterministic code with strategic LLM integration.

## The 12 Factors

1. **Natural Language to Tool Calls** — LLMs translate intent to structured actions
2. **Own Your Prompts** — don't let frameworks hide/abstract your prompts
3. **Own Your Context Window** — you decide what goes in, not the framework
4. **Tools Are Structured Outputs** — tool calls = structured data extraction
5. **Unify Execution State** — single source of truth for agent state
6. **Launch, Pause, Resume** — agents need lifecycle management
7. **Contact Humans with Tools** — human-in-the-loop via tool calls
8. **Own Your Control Flow** — deterministic orchestration, not LLM decisions
9. **Compact Errors** — minimize error context to preserve window
10. **Small, Focused Agents** — single responsibility > monolith agents
11. **Trigger from Anywhere** — agents are services, not scripts
12. **Stateless Reducer** — agent as pure function of (state, event) → state

## Key Takeaways for the system

- **Factor 2** — we already own our prompts (SOUL.md, AGENTS.md)
- **Factor 3** — context window management is critical for agent quality
- **Factor 8** — [[OpenClaw]]'s heartbeat/cron = deterministic control flow
- **Factor 10** — System agents should be small + focused, not one mega-agent
- **Factor 11** — [[OpenClaw]] already does this (Discord, Telegram, cron, heartbeat)
- **Factor 12** — align with vault-as-truth philosophy

## Relevance to Our Stack

- **System Architecture** — each factor maps to a design decision
- **Agent Design** — validates our approach (small agents, owned prompts, deterministic flow)
- **Anti-patterns** — warns against framework-heavy approaches

## Local Path

`/tmp/prompt-repos/12-factor-agents/content/`

## Related

- [[Metaprompting]]
- [[and]]
- [[README]]
- [[research]]
- Dynamic
- Agent
- Architecture
- Round
- [[2]]
- [[-]]
- [[Metaprompting]]
- [[Deep]]
- [[Dive]]
