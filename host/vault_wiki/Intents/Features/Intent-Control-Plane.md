---
title: "Intent Control Plane"
intent_level: 3
intent_kind: feature
intent_status: planned
intent_priority: 1
project: ema
parent: "[[Knowledge-System]]"
capabilities: [intent, plan]
tags: ["feature", "intents", "control-plane", "schematic"]
---

# Intent Control Plane

The intent schematic as EMA's steering wheel. When the human edits intent pages, EMA reacts:

## Control Flow
```
Edit intent status → Plans/specs update instantly
Add child intent → New execution target created  
Mark intent blocked → Agents stop working on it
Change priority → Agent dispatch order shifts
```

## Read-Only Boundaries
```
Knowledge pages — only change when real work produces results
Code pages — only change when code is actually written
Session logs — only change when sessions complete
```

## What This Replaces
- Manual task creation (intents auto-spawn tasks)
- Disconnected spec management (plans are downstream of intents)
- Agent dispatch guesswork (schematic shows what matters)

## Implementation
- Populator watches intent wiki page edits
- Edit propagation: intent change → DB update → PubSub → downstream systems react
- Plans tagged with parent intent auto-update status
- Tasks linked to intents get reprioritized on intent priority change
