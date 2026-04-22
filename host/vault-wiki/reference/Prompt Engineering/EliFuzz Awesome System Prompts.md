---
tags:
  - system-prompts
  - coding-agents
  - leaked-prompts
  - reverse-engineering
summary: ⭐ 128 — Extracted system prompts AND tool definitions from coding agents.
source: 'https://github.com/EliFuzz/awesome-system-prompts'
category: Agent System Prompts (Leaked)
date: 2026-03-14T00:00:00.000Z
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
type: knowledge
updated: '2026-03-16'
created: '2026-03-14'
title: EliFuzz Awesome System Prompts
wiki_id: reference/Prompt_Engineering/EliFuzz_Awesome_System_Prompts
imported_from: vault/Reference/Prompt Engineering/EliFuzz Awesome System Prompts.md
imported_at: '2026-04-04T00:23:56.928Z'
---

# EliFuzz Awesome System Prompts

⭐ 128 — Extracted system prompts AND tool definitions from coding agents.

## What Makes This Special

Unlike other collections, this repo includes the **tool schemas** alongside prompts — showing exactly how agents define their capabilities.

## Agents Covered

- **Aider** — Architect mode, Ask mode, File mode, Patch mode, Udiff mode
- **Augment Code** — GPT-5 agent prompt
- **Claude Code** — system prompt + tool definitions (ClearTool, MemoryTool, EditTool)
- **Cursor** — full agent system prompt
- **Devin AI** — autonomous coding agent
- **Kiro** — Amazon's coding agent
- **Codex** — OpenAI's agent
- **VSCode Agent** — GitHub Copilot agent mode
- **Gemini** — Google's coding assistant
- **AMP** — Claude 4 Sonnet + GPT-5 prompts
- **Replit** — IDE agent prompts

## Key Files

- `leaks/anthropic/archived/2025-11-01_prompt_sonnet45_claude-code.md` — Claude Code full prompt
- `leaks/anthropic/archived/2025-07-21_tools_claude-code.js` — Claude Code tool definitions
- `leaks/anthropic/archived/2026-02-06_prompt_claude-opus46.md` — Claude Opus 4.6 prompt

## Relevance to Our Stack

- **System DNA** — actual production agent prompts to study and adapt
- **Tool design** — how real agents define tool schemas
- **Claude Code internals** — understand what our primary coding tool does under the hood
- **Aider patterns** — multiple editing modes (architect, patch, udiff) = inspiration for System specializations

## Local Path

`/tmp/prompt-repos/awesome-system-prompts/leaks/`

## Related

- [[EliFuzz Coding Agent System Prompts]]
- [[research-round-2-metaprompting-deep-dive]]
- [[claude-code-2026-march-sonnet46-system-prompt]]
- [[README]]
