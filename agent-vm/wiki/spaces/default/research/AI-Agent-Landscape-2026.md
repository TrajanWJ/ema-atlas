---
title: "AI Agent Landscape 2026"
type: reference
created: 2026-04-06
tags: [research, ai-agents, competitive-landscape]
summary: "38 products/frameworks across 3 domains analyzed for agent orchestration"
---

# AI Agent Landscape 2026

38 products and frameworks analyzed across 3 domains.

## Multi-Agent Frameworks

| Framework | Org | Key Feature | Notes |
|---|---|---|---|
| **AutoGen** | Microsoft | Multi-agent conversations | LLM-as-router SelectorGroupChat |
| **CrewAI** | CrewAI | Role-based crews | No persistent memory |
| **LangGraph** | LangChain | Graph-based workflows | Heavy dependency chain |
| **Semantic Kernel** | Microsoft | Enterprise grade | Over-engineered for personal use |
| **OpenDevin** | Open source | Dev agent | Open-source alternative to Devin |

## Workflow / Integration

| Tool | Key Feature | Notes |
|---|---|---|
| **n8n + AI nodes** | Visual workflow builder | 400+ integrations |
| **Dust.tt** | Team AI | Data connectors for enterprise |

## IDE / Walled Garden

| Tool | Key Feature | Notes |
|---|---|---|
| **ChatGPT Projects** | OpenAI | Walled garden, limited agent control |
| **Claude.ai Projects** | Anthropic | Walled garden, limited agent control |
| **Cursor** | IDE-embedded AI | Not agent orchestration |
| **Windsurf** | IDE-embedded AI | Not agent orchestration |

## Key Takeaway

None of the existing frameworks satisfy [[EMA]]'s requirements: local-first, vault-centric, persistent memory, cognitive extension, and autonomous operation with minimal user nudging. Custom build justified.
