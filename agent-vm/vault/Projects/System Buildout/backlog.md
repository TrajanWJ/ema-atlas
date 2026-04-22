---
title: "backlog"
created: 2026-03-16
updated: 2026-04-04
type: project
status: active
confidence: 0.74
confidence_updated: 2026-04-04
source: project
summary: "System buildout task backlog reprioritized by behavioral impact: routing, context relevance, execution flow, and EMA unblockers first"
tags: [desk]
---
# System Buildout — Backlog

> Re-triaged 2026-04-04 by **behavioral impact first**: prioritize misses that break routing, context relevance, execution flow, or stall EMA. Cosmetic misses wait.

## Tier 0: Blocking Core Behavior / EMA Usability

### Session Architecture Redesign (CRITICAL)
- 96 sessions, context pollution across channels, feed channels wasting tokens
- Directly degrades routing quality and context relevance
- Proposal drafted: `vault/Architecture/Session Architecture Proposal.md`
- **Why it moved up:** Bad session boundaries cause the system to pick the wrong context even when intent detection is fine.
- **Status:** Research needed. Prototype write-only feeds first.

### EMA Dispatch / Execution Flow Unblockers (CRITICAL)
- Dispatch path still has known freeze/stall risks in the current EMA workstream
- Includes bridge async contract, Campaign.Flow gap, and other blockers that prevent work from entering/exiting EMA cleanly
- **Why it moved up:** If execution flow stalls, intent quality is irrelevant — the system can’t act.
- **Status:** Active investigation across current EMA discovery work.

### Context Pruning Strategy (HIGH)
- Long-running forum threads accumulate massive context
- LCM helps, but the operating rule for summarization/archiving is still weak
- **Why it moved up:** Context overload creates relevance misses and cross-thread contamination.
- **Status:** Need explicit summarization + archival protocol.

## Tier 1: High Behavioral Impact, Not Full Blockers

### Desk Pitch 3: Executive Dashboard (HIGH)
- Trajan's #1 stated need: executive functioning help
- Synthesize tasks from Discord forums + vault + loose ends into daily digest
- Post to #desk every morning at 9AM EST
- **Why it stays high:** Improves context selection and prioritization at the human/system boundary.
- **Status:** Concept in desk pitches. Not built yet.

### Cron Persistence (HIGH)
- `openclaw doctor --fix` wipes runtime crons
- Need auto-restore mechanism or persist to config
- Backup exists in `vault/Configuration/` but still manual
- **Why it moved up:** Silent automation loss breaks execution flow and creates invisible failures.
- **Status:** Workaround only. Needs proper fix.

### Transcript Scanner Upgrade (MEDIUM-HIGH)
- Current `capture.sh` is basic — needs LLM-powered extraction
- Auto-captures knowledge agents forgot to log
- **Why it moved up:** Missing extracted state weakens context relevance and continuity.
- **Status:** Basic version works. Full version not built.

## Tier 2: Throughput / Coverage Improvements

### Overnight Worker Automation (MEDIUM)
- Auto-activates at midnight EST, pulls from task backlog
- Self-assigns work based on priority and usage budget
- **Why it stays mid-tier:** Useful throughput multiplier, but not a prerequisite for correct routing/execution.
- **Status:** Concept only. Currently manual.

### Host Integration Expansion (MEDIUM)
- Auto-index host projects daily
- Project health monitoring
- **Why it stays mid-tier:** Valuable context expansion, but current host-claude path already works.
- **Status:** `host-claude` works, `host-project-index.sh` exists. Needs automation.

### Desk Pitch Iteration (MEDIUM)
- v1 pitches done, need research backing and updated priorities
- Pitch 1 (usage optimization) partially done
- Pitch 4 (email/calendar) needs Trajan's creds
- **Why it moved down:** Better framing matters less than fixing routing/execution breakage.
- **Status:** Need iteration pass.

### Skill Consolidation (MEDIUM-LOW)
- Merge duplicates: [[claude-usage-check]] vs claude-usage-checker
- Clarify [[evolution-loop]] vs feedback-loop boundaries
- Run Devil's Advocate on all skills
- **Why it moved down:** Mostly cleanup unless a duplicate is causing actual misrouting.
- **Status:** Not started.

## Tier 3: Cosmetic / Nice to Have

### Vault Self-Documentation Pass (LOW)
- Every section needs a README explaining purpose
- Some sections have them, some don't
- **Why it moved down:** Helpful, but doesn’t materially change behavior right now.
- **Status:** Partially done.

## Current top action stack
1. Session Architecture Redesign
2. EMA Dispatch / Execution Flow Unblockers
3. Context Pruning Strategy
4. Cron Persistence
5. Desk Pitch 3: Executive Dashboard

## Intent farmer harvest from past actions (2026-04-05)
Historical action trail was clustered into seed-ready work in `[[intent-farmer-harvest-2026-04-05]]`.

**Promote now:**
- Dispatch / Execution Reliability Closure
- Session Boundary + Context Hygiene Redesign
- Intent Farming + Session Harvest Feedback Loop
- Executive Dashboard / HQ Reality Layer

**Hold just below ready:**
- Cron Persistence + Post-Restart Self-Healing
- Transcript / Knowledge Extraction Upgrade
- SecondBrain / Context Assembly Tightening

## Deferred until they change behavior
- Cosmetic false positives / negatives in intent review
- Cleanup-only skill consolidation work
- Documentation polishing

## Completed ✅
- Anti-staleness system (vault-refresh.sh, vault-freshness.sh)
- Protocol rebuild (4 files restored)
- Discord Architecture v3 rewritten from reality
- [[Evolution signals]] processed (6 signals)
- [[skill-self-evolution-enhancer]] installed
- Workspace trimmed to ~25KB
- Agent consolidation (20 → 10)
- Morning briefing cron configured
- Tasks forum with lifecycle tags
- Channel restructure (Archive nuked, feeds organized)
- Host machine explored and profiled
- Desk pitches v1 written (8 pitches)
- Overnight agent dispatch (5 agents)
- Vault git-tracked, skills git-tracked
- QMD flock fix (no more duplicate embeds)
- [[auto-knowledge]]-gated.sh fixed

## Related

- [[Host Machine Profile]]
- [[desk]]
