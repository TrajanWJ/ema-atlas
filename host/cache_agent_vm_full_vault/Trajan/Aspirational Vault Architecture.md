---
title: "Aspirational Vault Architecture"
created: 2026-03-18
updated: 2026-03-18
type: aspirational
status: active
confidence: 0.40
confidence_updated: 2026-03-18
source: auto-capture
tags: [agents, architecture, knowledge, ops, research, skills]
summary: "A vault that:"
---
# Aspirational Vault Architecture

> **Status:** 🔨 IN PROGRESS
> **Current State Doc:** [[System Overview]], [[Architecture/README]]
> **Last Revised:** 2026-03-18

## The Vision

A vault that:
1. **Self-organizes** — New knowledge automatically finds its correct home
2. **Self-verifies** — Stale facts get flagged, outdated docs get updated
3. **Self-improves** — Research loop continuously enriches content
4. **Reduces hallucination** — Clear separation between facts, plans, and aspirations
5. **Serves as the single source of truth** — Agents trust it because it earns trust

## Target Structure

```
vault/
├── Aspirational/          # WHERE WE'RE GOING (goals, not claims)
├── Architecture/          # HOW THE SYSTEM IS BUILT (current, verified)
├── Operations/            # HOW TO RUN THINGS (runbooks, procedures)
├── Research/              # WHAT WE'VE LEARNED (external knowledge)
├── Projects/              # WHAT WE'RE BUILDING (active work)
├── Knowledge/             # GENERAL KNOWLEDGE (auto-captured, curated)
├── Agents/                # AGENT DOCS (roster, learnings, performance)
├── System/                # SYSTEM STATE (crons, configs, health)
├── Trajan/                # PERSONAL (preferences, goals, decisions)
├── Skills/                # SKILL DOCS (synced from installed skills)
├── Templates/             # REUSABLE TEMPLATES
├── Daily Notes/           # DAILY LOGS (auto-generated)
├── Sessions/              # SESSION CAPTURES (debugging, decisions)
├── Reference/             # EXTERNAL REFERENCE MATERIAL
├── _deprecated/           # ARCHIVED/RETIRED CONTENT
└── ontology-sync/         # AUTO-GENERATED GRAPH DATA
```

## Quality Standards (Target)

- **Every file has a clear purpose** — No "miscellaneous" dumps
- **Every file has metadata** — At minimum: title, date, status
- **Wikilinks are bidirectional** — If A links to B, B should acknowledge A
- **Max staleness: 30 days** — Any file untouched for 30 days gets flagged
- **Formatting is consistent** — Headers, lists, tables follow the same patterns
- **Sources are cited** — External claims have URLs or references
- **No duplicates** — One canonical location for each piece of knowledge

## Current Reality

- 483 files across ~25 directories
- Some directories are well-organized (Architecture, Research)
- Others are dumping grounds (Knowledge/Auto-Captured)
- Staleness varies wildly — some files from day 1 never updated
- Formatting is inconsistent
- Wikilinks exist but aren't systematic
- No aspirational layer existed until now ← **this doc starts fixing that**

## Gap Analysis

| Area | Current | Target | Gap |
|---|---|---|---|
| Self-organization | Manual + auto-capture | Fully auto-classified | Medium |
| Self-verification | vault-janitor (daily) | Real-time staleness alerts | Small |
| Research loop | Just built | Continuous 4h cycle | Small |
| Hallucination prevention | None | Aspirational layer | **Fixed today** |
| Source citation | ~30% of claims | 90%+ of external claims | Large |
| Formatting consistency | ~50% | 95%+ | Medium |
| Wikilink coverage | ~40% | 80%+ | Medium |

## Milestones

- [x] Create Aspirational/ directory with separation protocol
- [ ] Research loop running every 4h producing proposals
- [ ] All thin files (<5 lines) either enriched or deprecated
- [ ] Consistent frontmatter across all active files
- [ ] Wikilink audit — bidirectional coverage >80%
- [ ] Source citation audit — external claims >90% sourced
- [ ] Auto-classification for new knowledge (beyond current auto-capture)

## Related

- [[Aspirational Vault Architecture]]
- [[Aspirational Knowledge Loop]]
- [[README]]
- [[Auto Delegator Layer]]
- [[README]]
