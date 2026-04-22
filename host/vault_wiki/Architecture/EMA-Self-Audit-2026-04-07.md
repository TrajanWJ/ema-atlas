---
id: "d81f835c-e9d5-4570-8e46-475520a5ca88"
title: ""
space: wiki
tags: []
source: manual
---

---
title: EMA Self-Audit 2026-04-07
tags: [audit, self-audit, gaps, vision-dilution, critical]
source: session-2026-04-07
---

# EMA Self-Audit — The Lost Vision

## TL;DR: A Ferrari Engine on Blocks

EMA isn't broken. It's **80% assembled but 30% wired.** The chassis is built, most subsystems are installed, but the harness connecting them is incomplete.

**The original vision:** Personal AI OS where intent cascades to execution, agents collaborate, knowledge flows across machines, autonomous loops self-improve.

**The reality:** 65 supervised processes running, 555 modules compiled, 1504 vault notes, 53 intents, 17 agents — but they don't talk to each other.

## The Dilution Pattern

Every subsystem got built 80% of the way. The last 20% (the integration layer) was deferred:
- Execution dispatcher works → ExecutionsApp frontend never landed
- Proposal pipeline works → outcome feedback loop never wired
- Actors bootstrapped → phase cadence doesn't drive execution
- Memory layer just shipped → nothing auto-populates it
- Loop tracker just shipped → nothing creates loops automatically
- Sycophancy harness just shipped → execution.origin never set
- AutoDecomposer just shipped → broadcasts to 0 subscribers

**Root cause:** Kept building new subsystems instead of completing integration for previous ones. Every PR adds a feature; none remove an incompleteness.

## The Three Bottlenecks

### 1. Missing ANTHROPIC_API_KEY (5 min fix)
Single highest-leverage fix. Unblocks proposal generation, agent context, token tracking, bridge routing.

### 2. Intention-Execution Gap (4h fix)
Intents exist. Tasks exist. But no parent_id linkage. No cascade from vision → goals → tasks → executions.

### 3. Missing Outcome Feedback Loop (6h fix)
Executions complete but don't feed back into Memory, KillMemory, evolution rules, or seed quality.

## 10 Mega-Opportunities (Compound 10x)

| # | Wire | Compound Multiplier |
|---|------|---------------------|
| 1 | Execution outcome → Memory error_pattern | 10x |
| 2 | Sycophancy alert → Memory guideline → next seed | 5x |
| 3 | AutoDecomposer → Loop.open_loop → Memory decision | 8x |
| 4 | Cross-pollinate facts auto-trigger across projects | 4x |
| 5 | Cost tier 75% → throttle agent domains | 2x |
| 6 | Loop escalation → auto-follow-up task | 3x |
| 7 | Set execution.origin on proposal approve | unblocks sycophancy |
| 8 | Memory.recall in Dispatcher context injection | reduces repeat errors |
| 9 | Decomposition strategy stored as Memory decision | smarter future decompositions |
| 10 | Cost attribution per outcome → ROI analysis | optimization data |

## 5 Forgotten Threads

1. **Autonomous Reasoning Loop (Phase 3)** — designed, never started
2. **Design Pattern Crystallizer** — depends on Workflow Observatory, not built
3. **3 Missing Harvester Modules** — declared in enum, not implemented
4. **MCP create_task param mapping bug** — 1-line fix sitting since April 6
5. **7 Dead WebSocket channel topics** — silent failures

## Quick Wins (Implement Before Sleeping)

1. Set ANTHROPIC_API_KEY in daemon env (5 min)
2. Wire Sugar Memory auto-population in Dispatcher (1h)
3. Set execution.origin in on_proposal_approved (15 min)
4. Subscribe to governance:sycophancy → Memory guideline (30 min)
5. Wire AutoDecomposer → Loop.open_loop (15 min)
6. Wire ContextInjector into Pipes (15 min)

Total: ~3 hours for 6 fixes that close the biggest gaps.
