---
tags:
  - prompt-engineering
  - system-prompts
  - agents
  - reverse-engineering
summary: >-
  ⭐ 5.5k — Curated collection of extracted system prompts from production AI
  tools.
source: 'https://github.com/dontriskit/awesome-ai-system-prompts'
category: Agent System Prompts
date: 2026-03-14T00:00:00.000Z
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
type: knowledge
updated: '2026-03-16'
created: '2026-03-14'
title: Awesome AI System Prompts
wiki_id: reference/Prompt_Engineering/Awesome_AI_System_Prompts
imported_from: vault/Reference/Prompt Engineering/Awesome AI System Prompts.md
imported_at: '2026-04-04T00:23:56.928Z'
---

# Awesome AI System Prompts

⭐ 5.5k — Curated collection of extracted system prompts from production AI tools.

## What It Contains

Real system prompts from:
- **Cursor** — Agent.md (32KB) — full coding agent prompt with tool calling, search strategy, memory system
- **Devin** — system.md (34KB) — autonomous coding agent with environment awareness
- **Claude Code** — basic structure notes (ClearTool, MemoryTool, EditTool)
- **Manus** — AgentLoop + Modules — general purpose agent with explicit loop
- **v0 (Vercel)** — UI generation & component tooling
- **same.new** — agentic pair programming with strict tooling
- **Windsurf** — Wave 11 system prompt + tools
- **Loveable** — prompt + agent prompt
- **Cline** — system.ts
- **Bolt.new** — prompts.ts
- **Replit** — system prompts (multiple versions)
- **Grok** — Grok 2/3, deep search variant
- **ChatGPT** — GPT-4o, GPT-4.5, GPT-5, DALL-E, study mode
- **Claude** — Sonnet 3.7, Claude 2025-05-06
- **Clawdbot** — our own system prompt is referenced!

## 8 Core Principles of Agentic Prompts

From the README analysis:
1. **Clear Role Definition and Scope** — identity, function, domain
2. **Structured Instructions and Organization** — sections, hierarchy
3. **Explicit Tool Integration and Usage Guidelines** — when/how to use tools
4. **Step-by-Step Reasoning and Planning** — CoT, planning protocols
5. **Environment and Context Awareness** — file state, user state
6. **Domain-Specific Expertise and Constraints** — guardrails
7. **Safety, Alignment, and Refusal Protocols** — red lines
8. **Consistent Tone and Interaction Style** — persona

## Key Patterns Observed

### Cursor Agent
- Uses `<communication>`, `<tool_calling>`, `<making_code_changes>` XML sections
- `<maximize_context_understanding>` — demands THOROUGH exploration before answering
- Memory system with citations `[[memory:MEMORY_ID]]`
- Semantic search as primary exploration tool
- "Keep going until resolved" — autonomous agent loop

### Devin
- Full environment awareness (files, cursor, linter errors)
- 34KB system prompt — one of the largest
- Autonomous resolution mandate

### Manus
- Explicit agent loop pattern
- Module-based architecture

## Relevance to Our Stack

- **System DNA** — these are the templates for building specialized agents
- **Meta-prompting** — understand what patterns make agents effective
- **SOUL.md design** — borrow structures from Cursor/Devin for System agent SOULs
- **Security** — understand safety patterns used by production systems

## Local Path

`/tmp/prompt-repos/awesome-ai-system-prompts/`

## Related

- [[Awesome AI System Prompts]]
- [[README]]
- [[rohitg00-awesome-claude-code-toolkit]]
- [[README]]
- [[research]]
- Round
- [[2]]
- [[-]]
- [[Metaprompting]]
- [[Deep]]
- [[Dive]]
