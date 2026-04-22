---
title: Aspirational Knowledge Loop
created: '2026-03-18'
updated: '2026-03-18'
type: knowledge
status: active
confidence: 0.4
confidence_updated: 2026-03-18T00:00:00.000Z
source: auto-capture
tags:
  - desk
summary: 'A continuous research-ingest-implement cycle that:'
wiki_id: system/user/Aspirational_Knowledge_Loop
imported_from: vault/Trajan/Aspirational Knowledge Loop.md
imported_at: '2026-04-04T00:23:57.289Z'
---
# Aspirational Knowledge Loop

> **Status:** 🔨 IN PROGRESS  
> **Current State Doc:** [[Auto-Knowledge Architecture]]
> **Last Revised:** 2026-03-18

## The Vision

A continuous research-ingest-implement cycle that:
1. **Identifies gaps** — Scans vault for thin content, stale facts, missing coverage
2. **Researches solutions** — Web search, community scraping, best practices
3. **Proposes changes** — Posts structured proposals to #desk forum
4. **Implements approved changes** — Agents execute proposals and update vault
5. **Feeds itself** — Our own plans and content become research material too

## The Loop

```
┌─────────────────────────────────────────────┐
│              ASSESS (vault-research-loop)     │
│  What's weak? Stale? Missing? Inconsistent?  │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│              RESEARCH (Researcher agent)      │
│  Best practices, community patterns, tools   │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│              SYNTHESIZE (Right Hand)          │
│  Combine research + internal context         │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│              PROPOSE (→ #desk forum post)     │
│  Structured proposal with rationale          │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│              IMPLEMENT (Coder/Vault Keeper)   │
│  Execute changes, update vault               │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│              SELF-FEED                        │
│  New content → next cycle's input            │
│  Plans → aspirational docs                   │
│  Results → current-state docs                │
└──────────────────────────────────────────────┘
```

## Focus Areas (Rotating)

1. **vault_structure** — Directory organization, file placement
2. **agent_architecture** — Agent configs, protocols, dispatch
3. **knowledge_quality** — Content depth, accuracy, sources
4. **self_learning** — Evolution, [[auto-knowledge]], feedback loops
5. **vault_formatting** — Consistency, frontmatter, wikilinks
6. **performance_optimization** — Speed, resource usage, efficiency
7. **content_gaps** — Missing coverage, undocumented features
8. **aspirational_alignment** — Are we moving toward our goals?

## Self-Feeding Protocol

When the loop produces output (proposals, implementations):
1. **Plans go to `Aspirational/`** — Updated goals, revised targets
2. **Implementations update current-state docs** — Architecture/, System/, etc.
3. **Research goes to `Research/`** — External findings, comparisons
4. **Decisions go to `Architecture/Design Decisions.md`** — Why we chose X over Y
5. **The proposal itself is archived** — `Projects/System Buildout/proposals/`

This means each cycle enriches the vault, which gives the next cycle better input.

## Current Reality

- `vault-research-loop.sh` built and queues tasks to dispatch engine
- Runs every 4h via cron
- Rotates through 8 focus areas
- Posts proposals to dispatch queue → researcher agent
- Self-feeding into aspirational docs: **just started today**

## Success Metrics

| Metric | Current | Target |
|---|---|---|
| Proposals generated/week | 0 | 10-15 |
| Proposals implemented/week | 0 | 5-8 |
| Vault quality score | unmeasured | >80% |
| Stale file count | ~50-100 | <20 |
| Research sources/proposal | 0 | 3-5 |

## Related

- [[Aspirational Knowledge Loop]]
- [[Aspirational Vault Architecture]]
- [[Auto Delegator Layer]]
- [[Auto Delegator Layer]]
- [[README]]
