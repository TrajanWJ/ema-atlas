---
title: "Recursive Research System — Project Specification v1.0"
created: 2026-04-03
updated: 2026-04-03
type: architecture
status: active
confidence: 0.85
tags: [multi-agent, research, orchestration, verification, deep-research]
summary: "Multi-round multi-agent research architecture: Scout → Deep Divers → Gap Identifier → Verification → Synthesis with Orchestrator hub"
author: Trajan
---

# Recursive Research System — Project Specification v1.0

Multi-agent architecture for deep, self-improving research. 2-3 recursive rounds of investigation. Round 1 landscapes. Round 2 targets gaps. Round 3 verifies and resolves contradictions.

## Agent Roster

| Agent | Role | Count | Persistence |
|---|---|---|---|
| **Orchestrator** | Hub — reads outputs, identifies gaps, writes next-round prompts | 1 | All rounds |
| **Scout** | Broad landscape mapping with confidence scores | 1 | Round 1 |
| **Deep Diver** | Deep investigation of specific sub-areas or gaps | 3-5 per round | Per-round |
| **Gap Identifier** | Reads all outputs, finds holes — never researches | 1 per round | Per-round |
| **Verification Agent** | Challenges claims — finds counter-evidence | 2-3 per round | Rounds 2-3 |
| **Contradiction Resolver** | Resolves conflicting findings | 1 | Round 3 only |
| **Synthesis Agent** | Final document from verified findings | 1 | Final |

## Round Structure

### Round 1 — Landscape
- 1 Scout (full topic) + 3-4 Deep Divers + 1 Gap Identifier
- All parallel
- Orchestrator reads all → selects top 5-7 gaps by severity

### Round 2 — Targeted Investigation
- 1 Deep Diver per critical gap + 2-3 Verification Agents + 1 Gap Identifier
- Orchestrator decides: Round 3 needed? (criteria: critical gaps open, contradictions unresolved, CONTRADICTED verdicts)

### Round 3 — Verification and Resolution (conditional)
- 2-3 Verification Agents + 1-2 Deep Divers + 1 Contradiction Resolver
- Only runs if Round 2 left critical issues unresolved

### Synthesis
- Single Synthesis Agent after all verification complete
- Only includes CONFIRMED/WEAKENED findings
- Must include "What we still don't know" section

## Quality Gates

1. **Coverage gate** — did agents cover what they were asked?
2. **Source gate** — claims need sources or go to unverified pile
3. **Recency gate** — context-dependent (2019 LLM = stale, 2019 TCP = fine)
4. **Contradiction gate** — cross-round contradictions flagged
5. **Confidence floor** — below 40% → "what we still don't know"

## Structured Output Format (mandatory)

```
AGENT: [type]
ROUND: [1/2/3]
TARGET: [assignment]
STATUS: [Complete/Partial/Failed]
FINDINGS: [structured]
SOURCES: [with credibility + recency]
CONFIDENCE SCORES: [per finding, 0-100]
GAPS EXPOSED: [what was expected but not found]
HANDOFF NOTES: [for next agent/Orchestrator]
```

## Failure Handling

- Partial output → proceed with what exists, flag gaps
- No output → reassign once, then mark as unresearched
- Unresolvable contradiction → present both positions with weights
- Critical gap still open after all rounds → document explicitly, recommend next action

## Prior Art Comparison

See: [[STORM Stanford Research]], [[OmniThink]], [[GPT Researcher]], [[AI Scientist v2]]

## Implementation Notes

See assessment in [[Research Feed]] — key gaps: token budget management, timeout handling per agent, Gap Identifier "real-time" assumption needs clarification, Orchestrator context window limits.
