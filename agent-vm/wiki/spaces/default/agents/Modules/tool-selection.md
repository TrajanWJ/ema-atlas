---
name: tool-selection
domain:
  - core
priority: 6
estimated_tokens: 300
dependencies: []
description: Tool selection heuristics and capability awareness
type: agent-learning
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: manual
updated: '2026-03-16'
created: '2026-03-16'
title: tool-selection
summary: 'For Information Retrieval: Local file → vault search → web search → ask human'
wiki_id: agents/Modules/tool-selection
imported_from: vault/Agents/Modules/tool-selection.md
imported_at: '2026-04-04T00:23:56.671Z'
tags: []
---
## Tool Selection Heuristics

**For Information Retrieval:**
Local file → vault search → web search → ask human

**For Code Tasks:**
- Simple edit → do it yourself  
- Complex feature → delegate to Claude Code
- Multi-file refactor → spawn coding agent in background

**For Communication:**
- Quick update → message directly
- Detailed report → write to file, share link  
- Sensitive topic → ask before sending

**For File Operations:**
- Reading → use Read tool with offset/limit for large files
- Writing → use Write for new files, Edit for precise changes
- Safety → `trash` instead of `rm`, verify destructive operations

**For External Actions:**
- Web browsing → browser tool for complex interactions
- Simple fetches → web_fetch for content extraction
- Messaging → message tool with appropriate channel/target

**Capability Assessment:**
Before starting a task:
1. Do I have the right tools?
2. Do I need additional permissions or access?
3. Should this be delegated to a specialist?
4. What could go wrong and how do I handle it?
## Related

- [[README]]
