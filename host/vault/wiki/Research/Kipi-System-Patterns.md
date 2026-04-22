---
id: "85340dda-0831-4442-9069-d382e060ffeb"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Kipi System Patterns
tags: [research, cross-pollination, kipi, governance, critical]
source: session-2026-04-07
---

# Kipi System — Top Steals for EMA

Kipi is a Claude Code-based entrepreneur OS encoding patterns as files and hooks. The IP is the **patterns**, not code — all translate cleanly to Elixir.

## High-Value Steals (Implement First)

### 1. Loop Tracker (gap in EMA)
Models outbound action → waiting for response → escalate on age → force decision at 14d.
Levels: 0-3d new, 3-7d warm, 7-14d hot, 14d+ FORCE.
EMA has tasks/responsibilities but nothing for 'waiting on someone.'
Implementation: Ema.Loops context + Loop schema + Escalator GenServer (hourly tick).

### 2. Sycophancy Harness (governance gap)
`pi = approved / (approved + modified + rejected)`
Stamp every Execution with origin: :user_directed | :claude_recommended_approved | :modified | :rejected | :system_inferred
Compute pi weekly. Alert when pi >= 0.7 (high rubber-stamp rate).
Wire into Ema.Governance.AuditLog.
Based on Chandra et al. 2026 (arXiv:2602.19141).

### 3. External Verification Gates for Pipeline
LLM produces output → deterministic Elixir verifier → block if fail.
Each ProposalEngine stage calls Verifier.verify(stage, payload).
Title min 10 chars, body min 50 chars, debater must have steelman+red_team, tagger must produce tags.
Failures broadcast Envelope.fail/3, KillMemory records pattern.
'AI can't bypass it.'

### 4. Schema-Versioned Bus Envelope
Replace raw PubSub structs with %Envelope{bus_version, date, stage, generated_by, payload, error}.
Makes pipeline debugging trivial.

### 5. Time-Layered Memory (SecondBrain enhancement)
Add tier field to vault_notes:
- working (48h TTL, auto-pruned)
- weekly (7d rollup)
- monthly (persistent)
- canonical (source of truth, never expires)

### 6. Token/Call Guard
Circuit breaker for runaway agents:
- Same tool+input hash 3x → :retry_loop
- 50 tool calls without user msg → :volume_ceiling
- 15 reads without write → warn
- 120s + 10 calls without progress → warn

### 7. Echo-of-Prompt
Before each pipeline stage calls Claude, re-inject stage requirements fresh.
Combats 'Lost in the Middle' (Stanford 2023).

### 8. Decision Origin Tagging
Every entry in decisions log tagged with origin.
Feeds sycophancy metric directly.

### 9. Friction-Ordered Synthesis
Quick wins first, hard stuff later. Dopamine before discipline.
Apply to ema briefing/now output ordering.

### 10. Ambiguity Markers Enforced
{{UNVALIDATED}}, {{NEEDS_PROOF}}, {{NEEDS_RESEARCH}}, {{SETUP_NEEDED}}
Linter rejects outputs that strip these markers.

## Architecture Insight
Kipi solves: ADHD founder + LLM both drop things. Every structural choice assumes both will fail.
EMA serves the same user — adopt the same defensive defaults.
