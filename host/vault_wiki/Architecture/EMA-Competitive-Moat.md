---
id: "97554f96-31e4-4fa0-b00c-107905a83a11"
title: ""
space: wiki
tags: []
source: manual
---

---
title: EMA Competitive Moat
tags: [architecture, moat, competitive-analysis]
source: session-2026-04-07
---

# EMA's Architectural Moat

## Why Integration > Aggregation

EMA is ONE OTP application. Competitors are separate tools bolted together.

### Quantitative Edge
- 108 GenServers in shared supervision tree
- 138 PubSub broadcast points (sub-100ms cross-domain)
- 91 PubSub subscribers (real-time reactions)
- 43 WebSocket channels (instant browser updates)
- 8 integrated subsystems sharing 1 database + 1 PubSub backbone

### The Pipeline No Competitor Can Replicate
Brain Dump → Proposal (Generator→Refiner→Debater→Tagger) → Execution → Tasks → Outcome → KillMemory → Better Proposals

Each stage sees live state from ALL other systems. Outcome scoring feeds back into seed quality. Impossible with separate tools.

### Actor Attribution
Every action across every domain is attributed to an actor (human or 17 agents). Only EMA can answer: 'What did Agent X do to proposal Y that led to execution Z?'

### Superman.Context: 8 Systems in 1 Bundle
Project context pulls from tasks + proposals + executions + intents + wiki + vault + brain dump + activity stats. One call. Real-time. Graceful degradation.

### Failure Modes Proving Integration
- Remove Vault from Proposals → Generator loses semantic scoring
- Remove Tasks from Executions → Can't create actionable artifacts
- Remove KillMemory → Duplicate proposals proliferate
- Remove PubSub → Every system becomes async; consistency breaks

The moat is architectural cohesion, not features.
