---
title: Architecture Critique — Divergent Research Round
created: '2026-03-19'
updated: '2026-03-19'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-19T00:00:00.000Z
source: 'agent:main'
domain: agent-architecture
tags:
  - architecture
  - critique
  - research
  - multi-agent
  - simplification
summary: >-
  Devil's Advocate + Researcher convergence: consolidate to 5 agents, add
  observability (JSONL traces), unify memory query, kill mailbox/meta-evolution
  crons, stop overengineering.
aliases:
  - architecture review
  - system critique
  - simplification proposal
wiki_id: system/Architecture_Critique_2026-03-19
imported_from: vault/System/Architecture Critique 2026-03-19.md
imported_at: '2026-04-04T00:23:57.216Z'
---

# Architecture Critique — Divergent Research Round

Two agents ran adversarially: Researcher (gap analysis with 17 diverse sources) and Devil's Advocate (ruthless system critique).

## Convergent Findings

Both independently concluded:

1. **Consolidate to ~5 agents** — 21 defined, 2 successes. Magentic-One SOTA with 5. 80% routing skip = Right Hand correctly handling directly.
2. **Add structured observability** — JSONL logging with trace_id, timestamps, token counts. ~2h work, highest ROI.
3. **Unify memory query** — 5 stores is fine (tiered), but need single federated query interface.
4. **Kill dead meta-improvement** — 9 evolution/maintenance crons producing empty logs.
5. **Remove mailbox system** — Ephemeral agents don't check inboxes. Orchestrator pattern passes through Right Hand.

## Key Sources
- [[Anthropic]] "Building Effective Agents" — "find the simplest solution possible"
- Microsoft Magentic-One — 5 agents, SOTA
- MetaGPT — structured artifact passing, not messages
- "More Agents Is All You Need" (TMLR 2024) — sampling beats specialization sometimes
- D-MEM (arxiv 2026-03-15) — reward-gated memory storage

## Action Items
- [ ] Implement JSONL trace logging
- [ ] Consolidate agent roster to 5 active
- [ ] Build `memory-query` federated search
- [ ] Audit and prune crons (27 → ~10)
- [ ] Re-plan-on-failure for dispatch retries

Full reports: `/tmp/gap-analysis-research.md`, `/tmp/devils-advocate-critique.md`

## Related
- [[Agent Roster]]
- [[Memory Architecture]]
- [[Self-Evolution Protocol]]
