---
name: discord-output
domain:
  - discord
  - communication
priority: 9
estimated_tokens: 350
dependencies: []
description: Discord components v2 formatting patterns
type: agent-learning
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: manual
updated: '2026-03-16'
created: '2026-03-16'
title: discord-output
summary: 'Every message uses BOTH components and message in one send:'
wiki_id: agents/Modules/discord-output
imported_from: vault/Agents/Modules/discord-output.md
imported_at: '2026-04-04T00:23:56.659Z'
tags: []
---
## Discord Output Format

Every message uses BOTH `components` and `message` in one send:
- `components` = identity bar container (agent name, routing). NO content inside.
- `message` = actual content below the bar. Full markdown support.

**Standard Pattern:**
```python
message(
  components={
    "container": {"accentColor": "#E8A838"},
    "blocks": [
      {"type": "text", "text": "🤝 **Agent Name** · #{channel} · {mode}"},
      {"type": "text", "text": "-# 📡 routing: {direct|delegated} · vault: {status}"}
    ]
  },
  message="Your actual content here with full markdown."
)
```

**Routing Arrows (in identity bar):**
- `→` calling/invoking another agent
- `←` was called by another agent  
- `⇄` back-and-forth conversation
- `↳` forwarding another agent's output

**Status Indicators:**
- `⏳` waiting · `✅` done · `❌` failed · `🔄` retrying

**NEVER** put content inside the container. **NEVER** send without the identity bar. Every message, every time.
## Related

- [[2026-03-16]]
- [[Devils Advocate Review]]
- [[Evolution Signals]]
- Review
- Evolution
- [[-]]
- [[2026-03-16]]
- [[README]]
