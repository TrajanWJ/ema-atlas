---
type: research
title: Rune - Discipline Engineering for Claude Code
created: '2026-03-18'
updated: '2026-03-18'
domain: agent-architecture
confidence: 0.95
source: 'url:https://github.com/vinhnxv/rune'
summary: >-
  Deep walkthrough of Rune's proof-based multi-agent orchestration — discipline
  engineering, anti-rationalization, spec continuity, and extractable concepts
  for our dispatch system.
tags:
  - rune
  - multi-agent
  - discipline-engineering
  - agent-architecture
  - claude-code
  - spec-compliance
aliases:
  - Rune
  - Discipline Engineering
  - rune-plugin
status: active
wiki_id: research/Rune_Discipline_Engineering_Study
imported_from: vault/Research/Rune Discipline Engineering Study.md
imported_at: '2026-04-04T00:23:57.108Z'
---

# Rune — Discipline Engineering Study

> **Repo:** https://github.com/vinhnxv/rune
> **Author:** vinhnxv (Vietnamese dev, all docs bilingual EN/VI)
> **Type:** Claude Code plugin using Agent Teams experimental API
> **Scale:** ~500 files, 109 agents, 50+ skills, ~40 hooks, 3 MCP servers

## Core Thesis

**Spec compliance, not code quality, is the primary metric.** Multi-agent pipelines achieve 40-60% specification compliance because agents optimize for completion signals, not requirement satisfaction. The entire architecture exists to close this gap through structural enforcement — not prompting.

## The Five Discipline Layers

Rune's architecture is built on five layers, each addressing different compliance failure modes:

### Layer 1: DECOMPOSITION — "Break It Until It's Boring"
Specs → atomic tasks, each with YAML acceptance criteria and declared proof types. "Partially complete" is not a valid state. If it can't be binary pass/fail, decompose further.

### Layer 2: COMPREHENSION — "Prove You Read It"
**Echo Protocol:** Before coding, agents restate criteria in their own words. System verifies echo matches all criteria. Catches misunderstanding at zero cost (~50-100 tokens) vs. rework (2000-5000 tokens).

Anti-parroting guard: if echo is >90% verbatim copy of criteria, it's flagged.

### Layer 3: VERIFICATION — "Show Your Work"
Machine-verifiable proofs replace self-reported completion. The **agent does NOT verify itself** — the orchestration system executes proofs independently.

8 proof types ranked by reliability:
- `file_exists`, `builds_clean`, `test_passes` (absolute/very high)
- `pattern_matches`, `no_pattern_exists`, `git_diff_contains` (high)
- `line_count_delta` (medium)
- `semantic_match` (judge model — last resort only)

**Fresh evidence rule:** Prior runs don't count. Evidence must be from current iteration.

### Layer 4: ENFORCEMENT — "You Cannot Skip This"
Hard gates on ALL transitions — infrastructure-level, not prompt-level. The agent literally cannot call "task complete" without passing proofs. Escalation chain: retry → decompose → reassign → human (max 4 attempts).

### Layer 5: ACCOUNTABILITY — "The System Learns"
Failure patterns recorded environmentally. Agents don't learn (fresh every session). The *system* accumulates signals: which task types fail, which rationalizations appear, which agents underperform.

## Anti-Rationalization Engineering

Seven categories of agent rationalization with structural (not instructional) countermeasures:

| Category | Agent's Logic | Structural Counter |
|---|---|---|
| Scope Minimization | "Basic version covers important cases" | Criteria atomic + enumerated, can't partially satisfy |
| Implicit Deferral | "I'll handle this in a follow-up" | No "deferred" state exists. IN_PROGRESS or COMPLETE. |
| Confidence Substitution | "I'm confident this works" | Proofs are machine-executed. Agent confidence irrelevant. |
| Selective Attention | "I'll focus on core criteria" | ALL criteria must pass. No agent prioritization. |
| Complexity Avoidance | "Error handling can be added later" | Error cases are explicit criteria with proofs. |
| Process Skepticism | "Too simple for full process" | Gates are infrastructure. Cannot opt out. |
| Precedent Appeal | "Didn't need this last time" | No exception history. Every task, every gate. |

**Key insight:** The test for any countermeasure: "Can the agent bypass this by deciding it doesn't apply?" If yes → it's a suggestion, not a countermeasure.

## Spec Continuity

**The plan file is the persistent reference for ALL phases — not consumed once and forgotten.**

Current problem: After decomposition, no phase reads the plan. Review sees code but can't detect missing features. Testing verifies what exists, not what should exist.

Rune's fix: Every phase receives and reads the plan:
- **Review:** Receives code + plan. Can say "AC-3 required error handling for timeout, but src/api.ts line 45 has no timeout handler."
- **Testing:** Derives test strategy FROM PLAN, not from changed files. Reports "12/18 criteria have tests" instead of "all tests pass."
- **Gap Analysis:** Cross-references every acceptance criterion against implementation evidence.

## The Discipline Work Loop (8 Phases)

```
Phase 1:   DECOMPOSE      Spec → task files (one per task, on disk)
Phase 1.5: REVIEW TASKS   Verify spec == sum(task files). Catch fabrication + gaps.
Phase 2:   ASSIGN         Task files → teammates (context isolation)
Phase 3:   EXECUTE         Workers implement from task files
Phase 4:   MONITOR        Track progress, collect evidence
Phase 4.5: REVIEW WORK    Verify task completion against criteria
Phase 5:   CONVERGE       Loop until 100% or max iterations (with regression detection)
Phase 6-8: QUALITY+SHIP   Standard quality gates
```

**Phase 1.5 is critical:** Cross-references plan criteria vs task file criteria. Detects MISSING (gap — criteria not in any task) and FABRICATED (hallucination — task criteria not traceable to plan). Must reach zero on both before proceeding.

**Convergence loop:** Each iteration invalidates prior evidence (fresh evidence rule), re-verifies ALL criteria (regression detection), and creates gap tasks for failures. Max 3 iterations, then human escalation.

## Inner Flame — Self-Review Protocol

3-layer self-review every agent runs before marking complete:

1. **Grounding Check** — Did I actually Read() every file I referenced? Am I inferring behavior from names? Is my confidence calibrated to evidence strength?
2. **Completeness & Correctness** — All acceptance criteria addressed? No TODOs/placeholders? Output format matches contract?
3. **Self-Adversarial** — What would a reviewer flag? What did I miss? Am I solving the right problem? Would this break anything?

Enforced by `TaskCompleted` hook with Haiku model quality gate scoring 4 criteria (weighted formula, threshold 0.7).

## Context Weaving (7 Layers)

1. **Overflow Prevention** — Glyph Budget: agents write to files, return only path + 50-word summary
2. **Inter-Agent Compression** — Pre-aggregation extracts findings from verbose agent outputs before Runebinder
3. **Context Rot** — Instruction anchoring/re-anchoring (Lost-in-Middle mitigation)
4. **Session Compression** — Anchored iterative summarization at 50+ messages
5. **Filesystem Offloading** — Tool outputs >50 lines go to files
6. **Compaction Recovery** — PreCompact checkpoint + SessionStart:compact re-injection
7. **Runtime Monitoring** — Statusline bridge + PostToolUse warnings at 35%/25% remaining

## Rune Echoes — 5-Tier Memory

| Tier | Name | Weight | Max Age | Pruning |
|---|---|---|---|---|
| Structural | Etched | 1.0 | Never | User confirmation only |
| User-Explicit | Notes | 0.9 | Never | Never auto-pruned |
| Tactical | Inscribed | 0.7 | 90 days | Multi-factor scoring |
| Agent-Observed | Observations | 0.5 | 60 days | Auto-promoted after 3 references |
| Session | Traced | 0.3 | 30 days | Utility-based compression |

Stored in `.rune/echoes/{role}/MEMORY.md` with FTS5 search via MCP server.

## Hook Infrastructure (~40 hooks)

Comprehensive event-driven enforcement:
- **Security hooks** (fail-closed): enforce-readonly, enforce-teams, validate-*-paths
- **Operational hooks** (fail-forward): everything else
- **Quality gates:** TaskCompleted → Haiku scoring, validate-discipline-proofs, Inner Flame enforcement
- **Session lifecycle:** compact checkpoint/recovery, stale team cleanup, arc resume
- **Stop hook pattern:** Arc phases driven via Stop hook loop (each phase gets own Claude Code turn)

## Torrent — TUI Dashboard

Rust-based terminal dashboard for monitoring Rune workflow progress. Includes tmux integration, checkpoint viewing, and resource monitoring.

## What's Worth Stealing

### 1. Proof-Based Task Completion
Our dispatch verification is two-stage (spec compliance → quality). Rune goes further with machine-executable proofs per acceptance criterion. We could add proof type declarations to dispatch task files.

### 2. Echo Protocol for Comprehension
Before agents start work, require them to restate the task in their own words. Catches misunderstanding at ~50 tokens vs. thousands in rework. Easy to add to our spawn prompts.

### 3. Phase 1.5 (Task Review)
Cross-reference plan criteria against task decomposition before execution. Catches both gaps (criteria nobody owns) and fabrication (hallucinated requirements). We don't have this — our decomposition is trusted.

### 4. Evidence Freshness
Invalidating prior evidence each iteration prevents false positives from stale test runs. Our outcome-tracker could adopt temporal binding.

### 5. Anti-Rationalization as Structural Engineering
Moving from instructional ("please verify") to structural ("transition blocked without evidence") anti-rationalization. Our AGENTS.md has instructional anti-patterns — Rune has hooks that enforce them.

### 6. Spec Continuity in Review
Passing the original plan to reviewers alongside code. Our two-stage verification checks spec compliance, but the reviewer doesn't see the original spec — they see the agent's output and judge against it.

### 7. Inner Flame Self-Review
Standardized 3-layer self-review protocol before completion. Our agents have ad-hoc self-checks — Rune has a formal protocol with quality gate enforcement.

### 8. Context Weaving Glyph Budget
Agents write to files, return only path + summary. Prevents context overflow in multi-agent workflows. We could adopt this for parallel dispatches.

### 9. Convergence Loop
Iterative work until 100% spec compliance with regression detection. Our dispatch does one-shot with manual follow-up. A convergence loop with bounded iterations would catch more gaps.

### 10. Rune Echoes Tiered Memory
5-tier lifecycle with auto-promotion and multi-factor pruning. More sophisticated than our flat memory files. The Observations → Inscribed auto-promotion (after 3 references) is particularly clever.

## What Won't Work For Us

- **Claude Code Agent Teams API** — We're OpenClaw, not Claude Code plugin
- **Stop hook phase loop** — Specific to Claude Code's hook system
- **talisman.yml config** — Plugin-specific config format
- **Elden Ring naming** — Fun but not our aesthetic

## Implementation Priority

1. **Echo Protocol** — Easiest win. Add to all spawn prompts. ~30 min.
2. **Proof Types in Task Files** — Add proof declarations to dispatch tasks. ~2h.
3. **Inner Flame Protocol** — Standardize self-review for all agents. ~1h.
4. **Spec Continuity** — Pass plan context to verification stage. ~2h.
5. **Convergence Loop** — Add to dispatch for critical tasks. ~4h.
6. **Glyph Budget** — Add to multi-agent spawn prompts. ~30 min.
7. **Evidence Freshness** — Temporal binding in outcome-tracker. ~1h.

## Related Notes

- [[Agent Architecture]]
- [[Dispatch Protocol]]
- [[Agent Performance]]

---
*Studied from /tmp/rune-study clone. Full repo: github.com/vinhnxv/rune*
