---
title: backlog
created: '2026-03-16'
updated: '2026-03-16'
type: project
status: active
confidence: 0.6
confidence_updated: 2026-03-18T00:00:00.000Z
source: project
summary: System buildout task backlog with priorities and status tracking
tags:
  - desk
wiki_id: projects/System_Buildout/backlog
imported_from: vault/Projects/System Buildout/backlog.md
imported_at: '2026-04-04T00:23:56.892Z'
---
# System Buildout — Backlog

> Prioritized by ROI. Updated 2026-03-16 09:40 UTC.

## Tier 1: High ROI, Do Next

### Session Architecture Redesign (HIGH)
- 96 sessions, context pollution across channels, feed channels wasting tokens
- Proposal drafted: `vault/Architecture/Session Architecture Proposal.md`
- Trajan flagged HIGH priority, wants more nuance
- **Status:** Research needed. Prototype write-only feeds first.

### Desk Pitch 3: Executive Dashboard (HIGH)
- Trajan's #1 stated need: executive functioning help
- Synthesize tasks from Discord forums + vault + loose-ends into daily digest
- Post to #desk every morning at 9AM EST
- **Status:** Concept in desk pitches. Not built yet.

### Cron Persistence (MEDIUM-HIGH)
- `openclaw doctor --fix` wipes runtime crons
- Need auto-restore mechanism or persist to config
- Backup exists in vault/Configuration/ but manual
- **Status:** Workaround only. Needs proper fix.

### Desk Pitch Iteration (MEDIUM)
- v1 pitches done, need research backing and updated priorities
- Pitch 1 (usage optimization) partially done
- Pitch 4 (email/calendar) needs Trajan's creds
- **Status:** Need iteration pass.

## Tier 2: Medium ROI

### Overnight Worker Automation (Pitch 8)
- Auto-activates at midnight EST, pulls from task backlog
- Self-assigns work based on priority and usage budget
- **Status:** Concept only. Currently manual.

### Host Integration Expansion (Pitch 7)
- Auto-index host projects daily
- Project health monitoring
- **Status:** host-claude works, host-project-index.sh exists. Needs automation.

### Skill Consolidation (Pitch 6)
- Merge duplicates: [[claude-usage-check]] vs claude-usage-checker
- Clarify [[evolution-loop]] vs feedback-loop boundaries
- Run Devil's Advocate on all skills
- **Status:** Not started.

### Transcript Scanner Upgrade
- Current capture.sh is basic — needs LLM-powered extraction
- Auto-captures knowledge agents forgot to log
- **Status:** Basic version works. Full version not built.

## Tier 3: Nice to Have

### Vault Self-Documentation Pass
- Every section needs a README explaining purpose
- Some sections have them, some don't
- **Status:** Partially done.

### Context Pruning Strategy
- Long-running forum threads accumulate massive context
- Need summarization/archiving protocol
- **Status:** LCM handles some of this. Need to evaluate.

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
