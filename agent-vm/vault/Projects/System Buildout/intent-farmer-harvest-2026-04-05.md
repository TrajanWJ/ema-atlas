---
title: "Intent Farmer Harvest — Historical Actions"
created: 2026-04-05
updated: 2026-04-05
status: active
source: synthesis
summary: "Historical actions from March 16 through April 5 clustered into actionable seed candidates for backlog execution"
tags: [desk, ema, intent-farming, backlog]
---
# Intent Farmer Harvest — Historical Actions

> Purpose: turn the already-completed action trail into **seed-ready clusters** so backlog work starts from real accumulated momentum, not vague planning.

## Source set used

### Memory / session logs
- `memory/2026-03-16.md`
- `memory/2026-04-03.md`
- `memory/2026-04-05.md`
- `vault/Trajan/Intent Analysis - March 2026.md`

### Backlog state
- `vault/Projects/System Buildout/backlog.md`

### Host EMA action trail
- `git log --since=2026-04-03` from `~/Projects/ema`
- Major landed commits around dispatch, babysitter, second brain, harvesters, prompt/content, HQ, and reliability

---

## Readiness rubric

These are not formal EMA scores, but a practical stand-in until the real farmer loop is wired.

- **0.90–1.00** → ready now; enough evidence + repeated pressure + concrete next step
- **0.75–0.89** → forming strongly; should become a seed once one more concrete decision lands
- **<0.75** → keep as context, not active seed material yet

---

## Ready clusters

## 1) Dispatch / Execution Reliability Closure
**Readiness:** 0.97  
**Why this is real:** the action trail keeps converging on the same pain: the system can generate work, but dispatch/runtime failures break usefulness outright.

### Historical signals
- Apr 3-5 host EMA commits landed dispatch board, proposal→execution loop, bridge fixes, direct API key adapter, fail-fast startup token checks, safer backend behavior, and harvester schedule fixes.
- Apr 5 recovery confirmed a real starvation pattern: seeds created with `schedule: nil`, scheduler ignored them until manually repaired.
- Apr 5 blocker sweep found unresolved live drift indicators around sessions, campaigns, proposal counters, health status, superman types, router stats, prompt variants, and Claude CLI stream support.
- Backlog already ranks **EMA Dispatch / Execution Flow Unblockers** as Tier 0.

### What this cluster is actually about
Close the gap between “EMA has many surfaces” and “EMA can reliably move work end-to-end under real runtime conditions.”

### Candidate seed
**Seed:** `Close EMA dispatch/runtime reliability gap`  
**Concrete first scope:**
1. enumerate all current runtime drift warnings / missing refs
2. separate hard blockers from warning-only noise
3. patch the smallest set needed for clean proposal → dispatch → execution → outcome flow
4. verify with one real end-to-end path

### Why it should start now
Because this cluster already has:
- repeated failures
- repeated fixes
- repeated re-discovery of the same class of bug
- concrete code already landed nearby

---

## 2) Session Boundary + Context Hygiene Redesign
**Readiness:** 0.95

### Historical signals
- Mar 16: session count ballooned to 96; reset policy was effectively 7 days; context pollution explicitly identified.
- Mar 16: session architecture research completed; proposal v2 drafted; write-only feeds + file-based cross-session state identified as the real fix direction.
- Apr 4 backlog moved **Session Architecture Redesign** to the top spot for behavioral damage.
- Apr 5 memory again frames session boundaries as the biggest routing/context pollution problem.

### What this cluster is actually about
Stop channel/session sprawl from poisoning relevance and wasting tokens.

### Candidate seed
**Seed:** `Prototype write-only feed session architecture`  
**Concrete first scope:**
1. define channel classes: persistent / work / feed / ephemeral
2. decide which Discord channels must never accumulate conversational context
3. apply summarization + archival rules to long-running threads/forums
4. document the enforcement rule in one canonical operational file

### Why it should start now
This is upstream of intent quality. Even good routing loses if the session substrate is dirty.

---

## 3) Intent Farming + Session Harvest Feedback Loop
**Readiness:** 0.93

### Historical signals
- Apr 3 meta-development explicitly assigned **Intention Harvester Designer** work.
- Apr 4 design doc fully specified intent farming, clustering, readiness scoring, and promotion to seeds.
- Multiple architecture docs call for SessionHarvester → tasks/decisions/open questions → EMA insertion.
- Brain dump / cluster / proposal noise has already been identified as a real problem if related items are not grouped.

### What this cluster is actually about
Convert accumulated work traces into structured next-work candidates instead of relying on manual recollection.

### Candidate seed
**Seed:** `Implement minimal historical-action → intent-farm loop`  
**Concrete first scope:**
1. define the minimum ingest shape for harvested actions
2. route session outputs + brain dump items into a common clustering surface
3. support manual run + status inspection first
4. defer fancy embeddings/UI until the loop is producing usable seeds

### Why it should start now
The design is already stronger than the implementation. This is exactly the kind of gap that should become a seed.

---

## 4) Executive Dashboard / HQ Reality Layer
**Readiness:** 0.90

### Historical signals
- Mar 16 intent analysis put executive functioning help in Tier 1 of what Trajan actually wants.
- Desk pitches exist; executive dashboard script exists; daily desk/status surfaces exist.
- Apr 3-5 commits landed HQ tab, dispatch board, outcome dashboard, project store updates, stream manager, prompts content, and multiple monitoring/intelligence surfaces.
- Backlog ranks **Desk Pitch 3: Executive Dashboard** high because it improves prioritization at the human/system boundary.

### What this cluster is actually about
Turn scattered visibility surfaces into one operational “what matters now” control plane.

### Candidate seed
**Seed:** `Build Desk/HQ executive dashboard from live sources`  
**Concrete first scope:**
1. pick 5 real widgets only: top blockers, ready proposals, running executions, ready intent clusters, morning digest
2. define source-of-truth endpoints/files for each
3. ship a thin useful version before richer synthesis

### Why it should start now
Enough substrate exists now that this is no longer a pure concept pitch.

---

## Strongly forming clusters

## 5) Cron Persistence + Post-Restart Self-Healing
**Readiness:** 0.88

### Historical signals
- Mar 16 and backlog both call out cron loss as a recurring reliability failure.
- Post-restart fixup and cron definition backup already exist.
- Backlog still says workaround only; durable fix not done.

### Candidate seed
**Seed:** `Make OpenClaw runtime cron state durable and self-restoring`  
**Missing confidence bump:** one canonical persistence mechanism decision.

---

## 6) Transcript / Knowledge Extraction Upgrade
**Readiness:** 0.84

### Historical signals
- auto-knowledge capture exists but is basic
- transcript scanner upgrade is already on backlog
- session harvest docs repeatedly point at extraction of tasks/decisions/open questions

### Candidate seed
**Seed:** `Upgrade transcript/session extraction from regex/basic capture to structured learning ingest`

### Missing confidence bump
Need one agreed target schema for extracted artifacts.

---

## 7) SecondBrain / Context Assembly Tightening
**Readiness:** 0.81

### Historical signals
- large amount of work landed around SecondBrain, FTS5, context assembler, project context, and vault linkage
- but semantic context and relevance discipline are still not fully closed

### Candidate seed
**Seed:** `Tighten context assembly rules for dispatch and HQ`

### Missing confidence bump
Needs a decision on what stays keyword/FTS and what moves to embeddings later.

---

## Not worth promoting yet

### Skill consolidation cleanup
Real but low behavioral impact unless it causes proven routing mistakes.

### Documentation polish
Useful, but should stay behind runtime, routing, context, and execution-flow work.

### Cosmetic intent review misses
Explicitly deferred by backlog unless they connect to real execution damage.

---

## Best next starting stack

If we want the farmer output to be useful immediately, start here:

1. **Close EMA dispatch/runtime reliability gap**
2. **Prototype write-only feed session architecture**
3. **Implement minimal historical-action → intent-farm loop**
4. **Build Desk/HQ executive dashboard from live sources**

That order matches both the backlog and the actual action density from March 16 → April 5.

---

## Proposed promotion set

### Promote now
- Dispatch / Execution Reliability Closure
- Session Boundary + Context Hygiene Redesign
- Intent Farming + Session Harvest Feedback Loop
- Executive Dashboard / HQ Reality Layer

### Hold one step below ready
- Cron Persistence + Post-Restart Self-Healing
- Transcript / Knowledge Extraction Upgrade
- SecondBrain / Context Assembly Tightening

---

## Short operator read

The historical action trail says the system is not short on ideas. It is short on **closure loops**.

The same four gravity wells keep pulling work back in:
- runtime/dispatch reliability
- session/context boundaries
- harvesting completed work into next-work candidates
- one executive surface that makes the whole thing legible

That is the real intent-farm output from the past actions.
