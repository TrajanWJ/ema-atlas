---
title: Hermes Agent
created: '2026-03-14'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: agent-research
tags:
  - mcp
  - openclaw
  - ops
  - prompts
  - research
  - skills
summary: >-
  Self-improving AI agent built by Nous Research. Key differentiator: it has a
  built-in learning loop — creates skills from experience, improves them 
wiki_id: research/Tools/Hermes_Agent
imported_from: vault/Research/Tools/Hermes Agent.md
imported_at: '2026-04-04T00:23:57.132Z'
---
# Hermes Agent

**Source:** https://github.com/NousResearch/hermes-agent
**Category:** Self-hosted AI Agent Framework
**Date:** 2026-03-14
**Status:** Evaluated
**Stars:** ~7k (exploding growth, +4.8k/week)

## What It Does

Self-improving AI agent built by Nous Research. Key differentiator: it has a built-in learning loop — creates skills from experience, improves them during use, nudges itself to persist knowledge, searches past conversations, and builds a user model across sessions.

### Core Features
- **Closed learning loop** — agent-curated memory with periodic nudges, autonomous skill creation after complex tasks, skills self-improve during use
- **Multi-platform messaging** — Telegram, Discord, Slack, WhatsApp, Signal, and CLI from a single gateway process
- **FTS5 session search** with LLM summarization for cross-session recall
- **Honcho dialectic user modeling** for deepening understanding of the user
- **Scheduled automations** — built-in cron scheduler with delivery to any platform
- **6 terminal backends** — local, systemd, SSH, Daytona, Singularity, and Modal (serverless persistence)
- **Multi-model support** — Nous Portal, OpenRouter (200+ models), z.ai/GLM, Kimi/Moonshot, MiniMax, OpenAI
- **AgentSkills.io standard compatible** — uses the open skill format
- **MCP integration** — connect any MCP server
- **Research-ready** — batch trajectory generation, Atropos RL environments

### OpenClaw Migration
Has a built-in `hermes claw migrate` command that imports:
- SOUL.md, MEMORY.md, USER.md
- User-created skills
- Command allowlist, messaging settings
- API keys (Telegram, OpenRouter, OpenAI, Anthropic, ElevenLabs)
- TTS assets, workspace instructions

## Relevance

**HIGH — Direct competitor/alternative to [[OpenClaw]].** The self-improving skill system and learning loop are ahead of what we currently have. Their approach to memory (nudge-based capture + FTS5 search + dialectic user modeling) is more sophisticated than our BM25 memory-core.

### Key Patterns to Study
1. **Skill self-improvement** — skills that get better during use (we don't have this)
2. **Dialectic user modeling** via Honcho — deeper than our static USER.md
3. **FTS5 + LLM summarization** for session search — could enhance our session-logs skill
4. **Nudge-based memory capture** — vs our manual memory approach
5. **Migration tooling** — the fact they built an [[OpenClaw]] importer shows they see [[OpenClaw]] as the incumbent to steal users from

### Competitive Analysis
| Feature | Hermes | [[OpenClaw]] |
|---|---|---|
| Skill self-improvement | ✅ Built-in | ❌ Manual |
| Multi-platform messaging | ✅ 6 platforms | ✅ Discord + Telegram |
| Memory approach | FTS5 + nudges + user modeling | BM25 + vault + daily notes |
| Serverless deployment | ✅ Modal/Daytona | ❌ Always-on VM |
| MCP support | ✅ | ✅ |
| Skill standard | AgentSkills.io | AgentSkills.io |
| Community size | Growing fast | Established |

## Notes

- Built by Nous Research (well-known in open-source AI community)
- The migration tool specifically targeting [[OpenClaw]] users is notable competitive positioning
- Their "run on a $5 VPS" pitch vs our dedicated VM approach is interesting
- Worth monitoring as a potential migration target if they mature faster than [[OpenClaw]]

## Related

- [[GitHub]]
- [[Intel]]
- [[-]]
- [[Hermes Agent Architecture Study]]
- [[Hermes Agent Evaluation]]
- Favorites
- Architecture
- Study
- [[2026-03-14]]
- [[briefing-2026-03-16]]
