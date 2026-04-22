---
title: "Auto-Knowledge Architecture"
created: 2026-03-14
updated: 2026-03-16
type: architecture
status: active
confidence: 0.40
confidence_updated: 2026-03-18
source: auto-capture
tags: [github, knowledge, openclaw, ops, research, skills]
summary: "```"
---
# Auto-Knowledge Architecture

**Date:** 2026-03-14 (updated: production push)
**Status:** Production

## Pipeline

```
Session Activity
    ↓
transcript-scanner.py (cron every 3h, gated by usage)
    ↓ extracts structured suggestions → /tmp/auto-knowledge-queue.json
capture.sh (cron every 3h, gated by usage)
    ↓ processes top suggestion → writes vault note
    ↓ notifies via openclaw system event
Ontology-Sync (cron every 3h)
    ↓ extracts entities from new vault notes
QMD Re-index (cron every 30min)
    ↓ makes new content searchable
pattern-detector.py (cron every 6h)
    ↓ tracks task patterns → proposals to vault/Agents/Skill Proposals.md
agent-roster-review.py (cron weekly Sunday midnight)
    ↓ roster health report
```

## Components

| Script | Location | Cron | Purpose |
|---|---|---|---|
| capture.sh | skills/[[auto-knowledge]]/scripts/ | 0 */3 (gated) | Process top suggestion → vault note |
| transcript-scanner.py | skills/[[auto-knowledge]]/scripts/ | 0 */3 (gated) | Extract content from session transcripts |
| pattern-detector.py | skills/[[auto-knowledge]]/scripts/ | 30 */6 | Detect repeated task patterns |
| agent-roster-review.py | skills/[[auto-knowledge]]/scripts/ | 0 0 * * 0 | Weekly [[agent roster]] review |
| [[auto-knowledge]]-gated.sh | ~/bin/ | Wraps capture | Skip if weekly usage > 55% |

## Principles

1. Scripts report AND act (not just suggest)
2. One vault note per capture run (cost control)
3. Pattern threshold: 5+ across 2+ days (prevent premature agent creation)
4. Don't auto-create agents — Right Hand reviews proposals
5. All scripts are self-contained (no pip, no LLM calls)
6. Usage-gated: skip when weekly remaining < 45%

## References

- [[System/System Overview]] — agent management design
- [[Operations/Usage Optimization Review]] — token cost analysis

## Related

- [[Aspirational Knowledge Loop]]
- [[Hermes Agent]]
- [[-]]
- [[NousResearch]]
- [[Overnight]]
- [[Summary]]
- [[2026-03-14]]
- [[README]]
- [[research]]
- Round
- [[1]]
- [[-]]
- [[Self-Organizing]]
- [[Systems]]
- [[Analysis]]
