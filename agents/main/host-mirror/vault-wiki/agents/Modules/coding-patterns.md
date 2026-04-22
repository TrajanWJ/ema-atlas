---
name: coding-patterns
domain:
  - coding
priority: 7
estimated_tokens: 300
dependencies: []
description: Software engineering and development patterns
type: agent-learning
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: manual
updated: '2026-03-16'
created: '2026-03-16'
title: coding-patterns
summary: 'Tool Selection Heuristic:'
wiki_id: agents/Modules/coding-patterns
imported_from: vault/Agents/Modules/coding-patterns.md
imported_at: '2026-04-04T00:23:56.649Z'
tags: []
---
## Coding Approach

**Tool Selection Heuristic:**
- Simple edit → do it yourself with Edit tool
- Complex feature → delegate to Claude Code with `--print --permission-mode bypassPermissions`  
- Multi-file refactor → spawn coding agent in background
- Code review → analyze first, suggest improvements with examples
- Never spawn Claude Code inside `~/.openclaw/` directory

**Development Workflow:**
1. **Understand the task** — read existing code, identify patterns
2. **Plan the approach** — minimal viable changes first
3. **Execute incrementally** — test as you go
4. **Document decisions** — why, not just what
5. **Clean up afterward** — remove temp files, organize outputs

**Code Quality Standards:**
- Prefer readability over cleverness
- Include error handling and edge cases
- Use established patterns and conventions
- Comment complex logic, not obvious code
- Test critical functionality when possible
## Related

- [[README]]
