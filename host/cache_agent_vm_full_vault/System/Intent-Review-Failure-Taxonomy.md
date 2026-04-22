---
title: "Intent-Review Failure-Layer Taxonomy"
type: reference
created: 2026-04-05
tags: [intent, backlog, triage, taxonomy, dispatch, routing, sessions]
summary: "Five-layer failure taxonomy for intent-review backlog triage with ranking logic, examples, and cross-contamination prevention rules"
---

# Intent-Review Failure-Layer Taxonomy

> Purpose: give backlog triage a consistent vocabulary so each issue lands in exactly one bucket, gets ranked by the right formula, and doesn't bleed between layers.

---

## Layer Map

```
Input signal
     │
     ▼
[L1 SEMANTIC] — did the system understand what was meant?
     │ (if yes)
     ▼
[L2 ROUTING]  — did the right agent / channel get the work?
     │ (if yes)
     ▼
[L3 SESSION/CONTEXT] — did the agent have the right context to act?
     │ (if yes)
     ▼
[L4 RUNTIME/TOOLING] — did the execution actually complete?
     │ (if yes)
     ▼
[L5 DELIVERY/SURFACING] — did the result reach the right place correctly?
```

Each layer is a precondition for the next. An L4 runtime fix is wasted if the work was routed to the wrong agent (L2). Triage top-down.

---

## Layer Definitions

---

### L1 — Semantic
**Failure type:** The system misunderstood the input. The intent was either not extracted, wrongly classified, or clustered with unrelated work.

**What belongs here:**
- Intent not detected when it should have been (false negative — Trajan said something actionable, nothing happened)
- Intent detected when it shouldn't have been (false positive — ambient chatter triggered a dispatch)
- Clustering error — a brain dump item was grouped with wrong intents or not grouped at all
- Readiness score wrong — cluster promoted to seed before it was solid, or held back when it was ready
- Ambiguous intent accepted without clarification ask

**What does NOT belong here:** If the intent was correctly identified but sent to the wrong place → L2. If intent was right, routing was right, but context was wrong → L3.

**Real examples from current backlog:**
- "Cosmetic false positives / negatives in intent review" (explicitly deferred in backlog — belongs here)
- Brain dump items that create duplicate seeds (`bridge-async-1775360160` + `ema-basync-1775360196` are symptom of this: same intent emitted twice)
- Malformed null/empty task descriptions (2 failures in dispatch batch) — intent was so poorly formed it had no description at all

**Priority modifier:** L1 failures are high-leverage but often low-urgency unless they produce cascade duplicates. Score: `(Urgency × Impact) / ETA_hours`. If false positives are generating invalid dispatch load, escalate to Tier 0.

---

### L2 — Routing
**Failure type:** Intent was correctly understood, but the work was sent to the wrong agent, channel, or queue.

**What belongs here:**
- Wrong agent dispatched (researcher doing work that belonged to coder, or vice versa)
- Duplicate dispatch — same intent routed to two agents simultaneously
- Channel mismatch — progress event posted to `#intent-stream` instead of `#pipeline-flow`, or chain-of-thought posted to wrong lane
- Task queue confusion — work placed in wrong priority tier

**What does NOT belong here:** If the routing was correct but the receiving agent had bad context → L3. If routing was correct but the agent couldn't authenticate → L4.

**Real examples:**
- `bridge-async-1775360160` and `ema-basync-1775360196` are the same feature dispatched twice — likely L1 (duplicate intent emission) causing an L2 symptom (double-dispatch). Classify at the root layer (L1).
- `#agent-thoughts` being used for freeform journaling (Decision 2026-04-05) — delivery pollution that started as a channel routing rule violation (L2)
- researcher agent receiving 29/42 failures while being sent tasks it couldn't authenticate for — root cause is L4 (auth), but the dispatch volume targeting researcher specifically may indicate routing logic sent too much to one agent

**Priority modifier:** Routing failures are high-impact because they multiply downstream damage. A single mis-route can waste an entire session. Score same formula; bump Impact to 5 if the mis-route creates L4 failures (wasted compute).

---

### L3 — Session/Context
**Failure type:** The agent was the right one and the task was valid, but the context it operated in was stale, contaminated, or overloaded.

**What belongs here:**
- Context pollution — a session carrying irrelevant history from other channels/threads
- Session overload — context at 91%+ capacity; agent effectively lobotomized
- Cross-thread contamination — a response shaped by a different thread's context leaking in
- Stale context — agent operating on decisions or data that have since been superseded
- Context assembly miss — SecondBrain / FTS5 returned the wrong vault nodes for the task

**What does NOT belong here:** If context was good but the execution environment failed (auth, crash, stale PID) → L4. If context was good and execution succeeded but the output went to the wrong channel → L5.

**Real examples:**
- "96 sessions, context pollution across channels" (backlog Tier 0: Session Architecture Redesign) — pure L3
- "feed channels wasting tokens" — L3 (context budget erosion from non-semantic signal)
- Long-running forum threads accumulating massive context (Context Pruning Strategy, backlog Tier 0)
- Mar 16 session count reset issue: context hit capacity because session boundaries weren't enforced

**Priority modifier:** L3 failures are upstream of everything. Even perfect routing fails if the context substrate is dirty. The backlog correctly puts Session Architecture at Tier 0. In the taxonomy, L3 failures that affect >3 downstream agents get priority score boosted by 1.5×.

---

### L4 — Runtime/Tooling
**Failure type:** The right agent had the right context, but the execution environment failed.

**What belongs here:**
- Authentication failure (API key invalid, token expired, OAuth revoked)
- Sync/blocking dispatch that freezes the caller
- Zombie task — PID dead, no result file
- Exit code 0 with empty result (silent success masking failure)
- Cron state lost on restart (openclaw doctor --fix wipes runtime crons)
- `schedule: nil` seeds ignored by scheduler (seeds created but never picked up)
- Bridge dispatch returning before agent completes (fire-forget broken)
- Tool unavailable / path wrong inside the VM

**What does NOT belong here:** If the tool ran fine but produced output that went to the wrong channel → L5. If the agent was dispatched but had wrong context → L3.

**Real examples:**
- 35/42 dispatch failures from Invalid API key (Anthropic OAuth ban 2026-04-04) — textbook L4
- `bridge.send_message()` sync/blocking (BLOCKERS doc #1) — L4
- Zombie task: PID dead, no result (1 of 42 failures) — L4
- Exit code 0 with empty result (4 failures in vault-improve series) — L4
- `schedule: nil` causing seeds to be ignored by the EMA scheduler until manual repair — L4
- Cron persistence loss (openclaw doctor --fix) — L4

**Priority modifier:** L4 failures are systemic multipliers. One auth failure can cascade to N agent failures. Use actual failure count, not just 1 issue, when calculating Impact. For auth failures: Impact = number of affected dispatch attempts, not 1.

---

### L5 — Delivery/Surfacing
**Failure type:** Work completed correctly but the output reached the wrong channel, the wrong person, in the wrong format, or with missing required metadata.

**What belongs here:**
- Output posted to wrong Discord channel (wrong lane per channel rules)
- Missing required source ID prefix in #research-feed post
- Dedup check skipped — topic already posted, repeat published anyway
- Result not visible to Trajan because it went to an archived/low-visibility channel
- Silent hang — agent finished but no status surfaced to operator
- Discord rich formatting broken (wrong embed structure, missing identity bar)
- Notification not triggered when it should have been

**What does NOT belong here:** If the work never completed → L4. If the wrong agent did the work → L2. If the content is wrong because context was wrong → L3.

**Real examples:**
- "Anti-pattern banned: freeform journaling / raw chain-of-thought in semantic stream lanes" (Decisions 2026-04-05) — L5 violation (right work, wrong surface)
- Posts to #research-feed without source ID prefix (SOUL.md standing rule) — L5
- Silent failures (agent hangs with no Discord notification) — hybrid L4 + L5 (execution never completed AND nothing surfaced)
- #research-feed dedup skipped — L5

**Priority modifier:** L5 failures are often low-damage individually but erode operator trust fast. Repeated L5 failures in high-visibility channels (desk, research-feed) should be treated as Tier 1 regardless of individual score.

---

## Ranking Logic

### Formula
```
Priority Score = (Urgency × Impact × Cascade_Multiplier) / ETA_hours
```

| Variable | Range | Notes |
|----------|-------|-------|
| Urgency | 1–5 | How soon does this cause visible damage? |
| Impact | 1–5 | How many agents/channels/users affected? |
| Cascade_Multiplier | 1.0–2.0 | 1.5× if failure replicates to >3 downstream; 2× if it blocks a full layer |
| ETA_hours | actual hours | Don't estimate low to inflate score |

### Tier assignments

| Score | Tier | Action |
|-------|------|--------|
| >15 | **Tier 0** | Fix before anything else ships |
| 8–15 | **Tier 1** | Fix this sprint |
| 4–7 | **Tier 2** | Queue for next sprint |
| <4 | **Tier 3** | Deferred, cosmetic, or waiting on upstream decision |

### Layer-based tier floor

These are minimum tiers regardless of formula output:

| Condition | Minimum Tier |
|-----------|-------------|
| L4 failure causing >10 dispatch failures | Tier 0 |
| L3 failure affecting >3 agents / sessions | Tier 0 |
| L2 failure generating duplicate dispatches | Tier 1 |
| L1 false positive causing active dispatch load | Tier 1 |
| L5 failure in Tier-0 visibility channel | Tier 1 |
| Anything classified as cosmetic-only | Tier 3 floor |

---

## Backlog Split (current items re-triaged)

### Tier 0 (fix now)
| Issue | Layer | Score | Justification |
|-------|-------|-------|---------------|
| API key auth cascade (35/42 failures) | L4 | (5×5×2.0)/2 = 25 | No dispatch works until fixed |
| Bridge dispatch sync/blocking | L4 | (5×5×2.0)/3 = 16.7 | Blocks ALL Phase 2 dispatch |
| Session Architecture Redesign | L3 | (5×5×1.5)/3 = 12.5 | Upstream of routing quality |
| Context Pruning Strategy | L3 | (4×5×1.5)/4 = 7.5 → floor Tier 0 | >3 agents affected |

### Tier 1 (this sprint)
| Issue | Layer | Score | Justification |
|-------|-------|-------|---------------|
| Duplicate dispatch (double-seed emission) | L1→L2 | (4×4×1.5)/3 = 8 | Wastes compute, confuses queue |
| Campaign.Flow state machine not written | L4 | (4×4×1.0)/4 = 4 → Tier 1 floor | Blocks execution path |
| Cron persistence loss on doctor --fix | L4 | (4×4×1.0)/4 = 4 → Tier 1 | Silent automation loss |
| schedule: nil seeds ignored | L4 | (3×4×1.0)/2 = 6 | Seeds starved silently |
| Channel routing rule violations | L2/L5 | (3×3×1.0)/2 = 4.5 | Trust erosion, visible to Trajan |

### Tier 2 (next sprint)
| Issue | Layer | Score | Justification |
|-------|-------|-------|---------------|
| Transcript Scanner Upgrade | L3 | (3×3×1.0)/8 = 1.1 | Improves context quality over time |
| SecondBrain context assembly tightening | L3 | (3×3×1.0)/8 = 1.1 | Semantic relevance, not blocking |
| Dedup / source-ID prefix enforcement | L5 | (2×3×1.0)/2 = 3 | Policy compliance, not breakage |
| Malformed null task descriptions | L1 | (2×2×1.0)/1 = 4 | Low recurrence after auth fix |

### Tier 3 (deferred)
| Issue | Layer | Notes |
|-------|-------|-------|
| Cosmetic false positive/negative in intent review | L1 | Deferred per backlog unless they cause dispatch load |
| Documentation polish | L5 | No behavioral impact |
| Skill consolidation (no routing mistakes proven) | L2 | Cleanup only |

---

## Cross-Contamination Prevention

The main cause of taxonomy drift is assigning an issue to the layer where the symptom surfaces rather than where the root cause lives.

### The test: root-cause layer, not symptom layer

Ask: **"If I fixed only this layer and nothing else, would this failure stop?"**

- "Agent had wrong context" → Don't assign to L4 because the agent crashed. The crash may be downstream of bad context. Check L3 first.
- "Dispatch failed" → Don't assign to L2 because the wrong agent was called. The wrong agent may be a routing rule, but if the right agent was called and auth failed, that's L4.
- "Wrong channel" → Don't assign to L5 if the content was wrong too. Wrong content + wrong channel = L1 or L3 root, L5 symptom.

### Hard rules

1. **One issue, one layer.** If a failure spans layers (e.g., silent hang = L4 + L5), assign it to the **lowest** (most upstream) layer. The L5 symptom is only present because L4 failed — fixing L4 eliminates both.

2. **Cascades stay with root.** The 35 API key failures are all one L4 issue, not 35 separate issues. Count = Impact multiplier, not issue count.

3. **Policy violations are L5 by default.** A human rule that was broken (wrong channel, missing prefix) is L5 unless the system was structurally incapable of following the rule (then it's L2/L4).

4. **Dedup check failures are always L5.** The system didn't check before it should have. This is a surfacing discipline failure, not a semantic or routing error.

5. **L1 false negatives that cause nothing are Tier 3.** An intent missed is only high-priority if missing it caused a downstream effect. Silence is not damage unless something depended on the signal.

### Contamination detection checklist (run before filing any issue)
- [ ] Could this have happened even if the prior layer worked correctly? If no → it belongs one layer up.
- [ ] Is there a deeper system failure that caused this surface symptom? If yes → assign to the deeper layer.
- [ ] Does fixing this layer eliminate the symptom entirely? If not → the symptom has its own issue in its own layer.

---

## Discord-Ready Summary

```
**Intent-Review Failure Taxonomy — Backlog Triage**

Five layers. Assign each issue to root cause, not symptom.

**L1 Semantic** — intent misread (false positive/negative, clustering error)
**L2 Routing** — right intent, wrong agent/channel/queue
**L3 Session/Context** — right route, dirty or overloaded context
**L4 Runtime/Tooling** — right context, execution environment failed
**L5 Delivery/Surfacing** — good work, wrong destination or format

**Ranking formula:** (Urgency × Impact × Cascade) / ETA_hours

**Tier 0 now:**
• API key cascade — L4, blocks all dispatch (score 25)
• Bridge sync/blocking — L4, blocks Phase 2 (score 16.7)
• Session Architecture — L3, upstream of routing quality (score 12.5)

**Key rule:** assign to lowest affected layer, not the visible symptom.
One cascade = one issue with high Impact, not N issues.
```

---

## Related
- [[System/Dispatch-Failure-Analysis-20260405]]
- [[Projects/System Buildout/backlog]]
- [[Projects/System Buildout/intent-farmer-harvest-2026-04-05]]
- [[Architecture/Dispatch Architecture Review]]
