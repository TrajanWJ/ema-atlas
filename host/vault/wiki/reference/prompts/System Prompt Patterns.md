---
title: System Prompt Patterns
created: '2026-03-14'
updated: '2026-03-14'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: reference
tags:
  - patterns
  - prompt-engineering
  - prompts
  - system-prompts
summary: '```'
wiki_id: reference/prompts/System_Prompt_Patterns
imported_from: vault/Reference/prompts/System Prompt Patterns.md
imported_at: '2026-04-04T00:23:56.965Z'
---
# System Prompt Patterns

> High-quality system prompt patterns and building blocks for AI agents.

## Foundation Patterns

### Identity Block
```
You are [NAME], a [ROLE] running on [PLATFORM].
Your personality is [TRAITS].
You communicate via [CHANNELS].
```

### Capability Declaration
```
## What You Can Do
- [CAPABILITY 1]: [HOW]
- [CAPABILITY 2]: [HOW]
- [CAPABILITY 3]: [HOW]

## What You Cannot Do
- [LIMITATION 1]: [WHY]
- [LIMITATION 2]: [WHY]
```

### Behavioral Rules (Priority-Ordered)
```
## Rules (in priority order)
1. NEVER [most critical constraint]
2. ALWAYS [most important behavior]
3. PREFER [default approach] UNLESS [exception]
4. WHEN [condition] THEN [action]
```

### Context Loading
```
## On Wake
1. Read SOUL.md (identity)
2. Read USER.md (who you serve)
3. Read TOOLS.md (what you have)
4. Read today's memory file
5. Check HEARTBEAT.md for pending tasks
```

## Advanced Patterns

### Chain of Verification
```
Before answering any factual question:
1. Check vault for existing knowledge
2. Search web if vault insufficient
3. Cross-reference minimum 2 sources
4. State confidence level
5. Cite sources
```

### Graduated Response
```
For simple questions: Answer in 1-2 sentences
For technical questions: Include code/commands
For complex questions: Break into sections with headers
For ambiguous questions: Clarify before answering
```

### Proactive Intelligence
```
During idle time (heartbeats with nothing to do):
- Scan for interesting news in your domain
- Check for new tools/skills relevant to current projects
- Review and consolidate memory files
- Propose improvements to workflows
```

### Error Recovery
```
When a command fails:
1. Read the error message carefully
2. Check if it's a known issue (search vault)
3. Try the most likely fix
4. If fix fails, explain what happened and ask for guidance
5. Never retry the same failing command more than twice
```

### Tool Selection Heuristic
```
For information retrieval:
  Local file → vault search → web search → ask human

For code tasks:
  Simple edit → do it yourself
  Complex feature → delegate to Claude Code
  Multi-file refactor → spawn coding agent in background

For communication:
  Quick update → message directly
  Detailed report → write to file, share link
  Sensitive topic → ask before sending
```

## Prompt Composition Rules

1. **Front-load critical rules** — models attend more to early instructions
2. **Use concrete examples** over abstract descriptions
3. **Specify output format** when you care about structure
4. **Include failure modes** — tell the model what bad output looks like
5. **Version your prompts** — track changes to SOUL.md in memory

## Anti-Patterns to Avoid

| Anti-Pattern | Why It Fails | Better Approach |
|---|---|---|
| "Be helpful" | Too vague, means nothing | "Answer questions concisely, run commands proactively" |
| "Don't make mistakes" | Causes hedging and over-qualifying | "Verify before acting, correct quickly when wrong" |
| "Always ask permission" | Slows everything down | "Ask for destructive/external actions, act freely on internal" |
| "Be creative" | Unpredictable outputs | "Suggest 3 options with tradeoffs, let user pick" |
| Walls of rules | Gets ignored past ~500 tokens | Prioritize top 5 rules, put rest in reference section |

#prompts #patterns #system-prompts #prompt-engineering

## Related

- [[System Prompt Patterns]]
- [[EliFuzz Coding Agent System Prompts]]
- [[Prompt Library Sources]]
- [[Metaprompting]]
- [[and]]
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
