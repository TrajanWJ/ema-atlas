---
title: Recursive Research System — Project Specification v2.0
created: '2026-04-03'
updated: '2026-04-03'
type: research
status: active
confidence: 0.9
tags:
  - multi-agent
  - research
  - orchestration
  - verification
  - deep-research
  - implementation-ready
summary: >-
  v2 addresses all 4 v1 gaps: token budget, Gap Identifier timing, per-agent
  timeouts, Orchestrator context compression. Architecture adds Perspective
  Generator (from STORM). Build-ready.
author: Trajan
wiki_id: research/Recursive-Research-System-Spec-v2
imported_from: vault/Research/Recursive-Research-System-Spec-v2.md
imported_at: '2026-04-04T00:23:57.101Z'
---

# Recursive Research System — v2.0

> v1 → v2 changes: Token budget management, Gap Identifier runs *after* round (not concurrent), per-agent timeouts added, Orchestrator compressed state document added. Perspective Generator added (STORM-inspired, 25% coverage improvement).

## What's New in v2

| Gap (v1) | Fix (v2) |
|---|---|
| Token budget unmanaged | `total_token_budget`, `per_agent_output_cap`, `orchestrator_compression_trigger` parameters |
| Gap Identifier timing ambiguous | Now explicitly runs AFTER all round agents complete |
| No per-agent timeout | `per_agent_timeout_seconds: 120`, `round_timeout_seconds: 600` |
| Orchestrator context window | Compressed state document — only current round raw + state doc in each Orchestrator prompt |
| Missing STORM's perspective trick | Perspective Generator added as pre-Round 1 step |

## Agent Roster

| Agent | Model | Count | When |
|---|---|---|---|
| **Orchestrator** | Opus-class | 1 | All rounds, persistent |
| **Perspective Generator** | Sonnet | 1 | Pre-Round 1 |
| **Scout** | Sonnet | 1 | Round 1 |
| **Deep Diver** | Sonnet | 3-5 per round | Per-round, parallel |
| **Gap Identifier** | Sonnet | 1 per round | After all round agents complete |
| **Verification Agent** | Sonnet | 2-3 | Rounds 2-3, parallel |
| **Contradiction Resolver** | Sonnet | 1 per conflict | Round 3 |
| **Synthesis** | Opus-class | 1 | Final |

Model split is capability-based: Orchestrator + Synthesis make meta-decisions. Sub-agents execute specific tasks.

## Orchestrator State Document (key v2 addition)

After each round, Orchestrator compresses all raw outputs into this running state doc. Never re-reads prior raw outputs.

```
STATE DOCUMENT — updated after each round

TOPIC: [topic]
ROUNDS COMPLETED: [n]
TOKEN BUDGET REMAINING: [n] of [total]

CONFIRMED FINDINGS:
[finding] | source | confidence | round confirmed

WEAKENED FINDINGS:
[finding] | caveat | original confidence → revised confidence

CONTRADICTED CLAIMS:
[claim] | contradicted by | resolution status

OPEN GAPS:
[gap] | severity | assigned to Round [n] | status

UNRESOLVED CONTRADICTIONS:
[contradiction] | Contradiction Resolver verdict | residual uncertainty

WHAT WE KNOW WE DON'T KNOW:
[honest gap list]

DECISION LOG:
Round 1: [gaps identified, R2 targets, reasoning]
Round 2: [gaps closed, verdicts, R3 decision]
Round 3: [if run]
```

## Budget Parameters

```
BUDGET:
  total_token_budget: 200000
  per_agent_output_cap: 15000
  orchestrator_compression_trigger: 50000
  orchestrator_prompt_cap: 30000
  per_agent_timeout_seconds: 120
  max_retries_per_agent: 1
  round_timeout_seconds: 600
```

## OpenClaw Implementation

```
Orchestrator (persistent session, Opus-class)
 │
 ├── sessions_spawn(perspective_generator, mode:"run", runTimeoutSeconds:60)
 │
 ├── Round 1 (parallel):
 │   ├── sessions_spawn(scout, mode:"run", runTimeoutSeconds:120)
 │   ├── sessions_spawn(deep_diver_1, mode:"run", runTimeoutSeconds:120)
 │   ├── sessions_spawn(deep_diver_2, mode:"run", runTimeoutSeconds:120)
 │   └── sessions_spawn(deep_diver_3, mode:"run", runTimeoutSeconds:120)
 │   [wait for all via sessions_yield]
 │   └── sessions_spawn(gap_identifier, mode:"run", runTimeoutSeconds:120)
 │   [Orchestrator compresses → updates state doc]
 │
 ├── Round 2 (parallel):
 │   ├── sessions_spawn(deep_diver_gap_1, mode:"run", runTimeoutSeconds:120)
 │   ├── sessions_spawn(deep_diver_gap_2, mode:"run", runTimeoutSeconds:120)
 │   ├── sessions_spawn(verification_1, mode:"run", runTimeoutSeconds:120)
 │   └── sessions_spawn(verification_2, mode:"run", runTimeoutSeconds:120)
 │   [wait for all]
 │   └── sessions_spawn(gap_identifier, mode:"run", runTimeoutSeconds:120)
 │   [Orchestrator: Round 3 needed?]
 │
 └── Synthesis:
     └── sessions_spawn(synthesis, mode:"run", runTimeoutSeconds:180)
```

## Quality Gates

1. **Coverage gate** — did agent cover its assignment? Partial = gap stays open
2. **Source gate** — no source = unverified pile, never reaches Synthesis as fact
3. **Recency gate** — topic-aware (LLM: 6-month threshold; networking protocols: older is fine)
4. **Contradiction gate** — cross-round contradiction without explanation → Contradiction Resolver
5. **Confidence floor** — below 40% → "what we still don't know"

## Verdict Taxonomy (Verification Agent)

- **CONFIRMED** — holds under scrutiny, source solid, counter-evidence weak
- **WEAKENED** — directionally right but overstated/context-dependent/partially outdated
- **CONTRADICTED** — meaningful counter-evidence found (cite specifically)
- **UNVERIFIABLE** — cannot confirm or deny with available sources (explain why)

## Contradiction Resolution Taxonomy

- **True conflict** — same claim, same context, same period, sources disagree
- **Scope mismatch** — claims apply to different scopes
- **Recency mismatch** — one source outdated
- **Domain mismatch** — valid in different domains
- **Source quality** — one source demonstrably weaker

## Prior Art Context

Benchmarked against:
- [[STORM Stanford]] (NAACL 2024) — this spec adds adversarial verification, gap identification, contradiction resolution
- [[OmniThink]] (EMNLP 2025) — iterative expansion but self-reflection only, not adversarial challenge
- [[GPT Researcher]] — planner+execution, no verification round
- [[AI Scientist v2]] — review after writing, not during research rounds

**Key differentiator retained from v1:** Verification Agent as adversary, running between research rounds. No published system does this.

## Related

- [[Recursive-Research-System-Spec-v1]] — prior version with gaps
- [[Recursive Knowledge Mining - 3-Layer Architecture]] — separate but complementary knowledge extraction pattern
