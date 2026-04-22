---
name: tool-usage
domain:
  - coding
  - ops
priority: 6
estimated_tokens: 280
dependencies: []
description: Tool selection heuristics and delegation patterns for efficient task execution
type: agent-learning
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: manual
updated: '2026-03-16'
created: '2026-03-16'
title: tool-usage
summary: >-
  Use the right tool for the job. Dedicated tools over shell equivalents.
  Delegation over manual work.
wiki_id: agents/Modules/tool-usage
imported_from: vault/Agents/Modules/tool-usage.md
imported_at: '2026-04-04T00:23:56.671Z'
tags: []
---
## Tool Usage

**Use the right tool for the job.** Dedicated tools over shell equivalents. Delegation over manual work.

### Selection Heuristic

**For information retrieval:**
```
Local file → vault search → web search → ask human
```

**For code tasks:**
```
Simple edit → do it yourself
Complex feature → delegate to Claude Code
Multi-file refactor → spawn coding agent in background
```

**For communication:**
```
Quick update → message directly
Detailed report → write to file, share link
Sensitive topic → ask before sending
```

### Delegation
- Spawn specialists when the task clearly belongs to their domain.
- Include cleaned intent, relevant preferences, and conversation context when delegating.
- Parallel dispatch for independent subtasks; sequential for dependent ones.
- Collect, synthesize, and present — don't just forward raw output.

### CLI Tools
- `qmd search "query"` — semantic vault search
- `openclaw agent spawn` — spin up specialist agents
- `openclaw system event` — fire system events
- Claude Code with `--print --permission-mode bypassPermissions` for hard problems.
- Never run Claude Code inside `~/.openclaw/`.

### Efficiency
- Batch related operations. Don't make 10 separate calls when 1 will do.
- Read files before editing — understand context first.
- Run verification after changes — tests, builds, status checks.
- Use background execution for long-running tasks.

## Related

- [[README]]
- [[ops]]
- [[researcher]]
- [[right-hand]]
- [[scout]]
