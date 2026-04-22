---
name: prompt-compression
domain:
  - core
priority: 5
estimated_tokens: 200
dependencies:
  - routing-coordination
description: Compress conversation context to agent-relevant content before invocation
type: agent-learning
status: active
confidence: 0.85
confidence_updated: 2026-03-18T00:00:00.000Z
source: pipeline-research
updated: '2026-03-18'
created: '2026-03-18'
title: prompt-compression
summary: >-
  Forward only agent-relevant context. Cut 30-60% of tokens for specialist
  agents without losing signal.
wiki_id: agents/Modules/prompt-compression
imported_from: vault/Agents/Modules/prompt-compression.md
imported_at: '2026-04-04T00:23:56.663Z'
tags: []
---
## Routing-Aware Prompt Compression

After routing selects an agent, compress the conversation history to what that agent
actually needs. Specialists don't need the full session — compress to relevant content.

### When to Compress

Compress before invoking any specialist agent (non-general-purpose).
Do NOT compress for:
- Conversation summarizer agents (need full history)
- Agents explicitly configured `compress_context: false`
- First-turn (no history to compress)

### Compression Strategies

**Relevance filtering** (default):
1. Score each message by keyword overlap with agent's domain
2. Apply recency bias: last 3 turns always included regardless of score
3. Select highest-scoring messages up to token budget (default: 2000 tokens)
4. Always forward: resolved entities, routing trace, current task statement

**Extractive summarization** (for very long histories, >10k tokens):
1. Produce a 2-3 sentence summary of relevant prior context
2. Prepend summary to agent prompt instead of full history
3. Append last 3 turns verbatim after summary

### Agent Interest Domains (Examples)

| Agent | Context interests |
|---|---|
| `coder` | code, error, fix, implement, build, test, deploy |
| `finance` | payment, invoice, subscription, account, budget, revenue |
| `ops` | deploy, server, health, monitor, cron, config, restart |
| `researcher` | research, find, investigate, analyze, compare, source |
| `vault-keeper` | note, organize, vault, link, tag, memory |
| `writer` | write, draft, blog, content, copy, proposal |

### Always Forward (Never Compress Away)

- The current task statement (user's request)
- Most recent 3 conversation turns
- Any resolved entities referenced in the task (names, IDs, filenames)
- Routing trace (which agent was selected and why)

### Token Budget

Default: 2000 tokens of history per agent invocation.
Override per agent in roster:
```yaml
context_window_budget: 4000  # agents needing more history
```

### Observability

Log with each routing event:
- `context_tokens_before`: total conversation tokens before compression
- `context_tokens_after`: tokens forwarded to agent
- `compression_ratio`: after/before (target: 0.4–0.7 for specialist agents)

## Related

- [[routing-coordination]]
- [[routing-stack-architecture]]
