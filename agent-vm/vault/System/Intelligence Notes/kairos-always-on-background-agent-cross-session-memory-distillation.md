---
title: KAIROS — Always-On Background Agent with Cross-Session Memory Distillation
type: intelligence-note
status: proposed
created: 2026-04-02
updated: 2026-04-06
source: claude-code-source-analysis + vault cross-reference
confidence: 0.83
tags: [intelligence, design-pattern, memory, agent-architecture, kairos, distillation]
summary: Design pattern for a persistent background agent that continuously distills session outcomes into structured memory, reducing transcript bloat and improving cross-session continuity. Most relevant to Auto Delegator Layer / OpenClaw Agent Setup as an evolution of existing transcript capture and auto-knowledge pipelines.
related:
  - [[KAIROS Pattern — Cross-Session Memory Distillation]]
  - [[Auto-Knowledge Capture]]
  - [[Evolution Loop Pipeline]]
  - [[System Claude Code]]
  - [[Two-Agent Harness for Long-Running Claude Code]]
  - [[SSGM Memory Governance]]
---

# KAIROS — Always-On Background Agent with Cross-Session Memory Distillation

## Executive Summary

KAIROS is a design pattern extracted from Claude Code source analysis and worth tracking because it addresses a real systems problem already visible in this stack:

> **Sessions produce more raw context than humans or agents can reliably reuse, so a background layer must compress them into durable, queryable memory.**

The key idea is not merely “have memory.” Plenty of systems already log transcripts, sync notes, or persist chat history. KAIROS is more specific:

1. A **persistent background agent** runs outside any single task.
2. After sessions end, it **distills** what happened into structured, high-signal artifacts.
3. Those artifacts become the substrate for **future routing, recall, and self-improvement**.

In Trajan’s current stack, parts of this already exist in fragments:
- Claude Code stop hooks capture session outputs
- Letta subconscious syncs transcripts
- auto-knowledge capture scans transcripts/messages on a schedule
- the vault acts as durable memory
- QMD / graph-memory / ontology layers provide retrieval

So KAIROS is not a greenfield fantasy. It is a **missing integration pattern** that would connect these parts into a cleaner memory loop.

---

## What Makes KAIROS Distinct

### Not just transcript storage

A transcript archive preserves everything, but that is not the same as preserving what matters.

Raw logs are good for:
- forensics
- debugging exact phrasing
- replaying what happened

Raw logs are bad for:
- fast future recall
- keeping prompts small
- routing future work
- extracting reusable patterns

KAIROS solves that by **compressing episodes into knowledge units**.

### Not just manual note-taking

Manual summaries work, but they are inconsistent. They depend on:
- the agent remembering to write them
- the summary happening before context decays
- the writer knowing what future sessions will care about

KAIROS treats summarization as a **system responsibility**, not an optional courtesy.

### Not the same as self-improvement

This matters.

KAIROS should first be understood as a **memory distillation layer**, not a mutation layer. It captures and structures knowledge. Self-improvement may consume its outputs later, but that should be a separate control loop.

That separation is important because the vault already shows concern about over-eager evolution loops. Distillation is lower-risk than automatic prompt mutation.

---

## Core Pattern

### Canonical flow

```text
Session runs
  → session ends / checkpoint reached
  → background memory agent reviews artifacts
  → extracts decisions, facts, failures, patterns, and open loops
  → writes structured memory objects
  → retrieval systems index them
  → future sessions query distilled memory instead of raw transcript blobs
```

### What gets distilled

The distilled outputs should not be generic summaries. They should be typed and purpose-specific.

Examples:
- **decisions** — what was chosen and why
- **preferences** — recurring user or system preferences
- **failures** — what broke, root cause, fix, prevention
- **patterns** — repeatable workflow or prompt patterns
- **open loops** — unfinished work requiring future re-entry
- **performance signals** — evidence useful for routing/evaluation

### Desired outcome

The result is a memory system where future sessions retrieve:
- “what matters”
- “what changed”
- “what to do differently next time”

instead of trawling entire logs.

---

## Why This Matters in Trajan's Stack

The vault already documents several adjacent systems:

### 1. Claude Code hooks already capture session-adjacent state
From [[System Claude Code]]:
- `ori/capture.mjs` runs at Stop
- `letta-subconscious/sync-transcript.mjs` syncs transcript data

That means the system already has **session-end interception points**.

### 2. Auto-Knowledge Capture already performs delayed extraction
From [[Auto-Knowledge Capture]]:
- transcript scanning runs on a cron
- extracted facts/preferences/decisions become vault notes
- message harvesting and ontology sync extend the loop

That means the stack already has **knowledge extraction machinery**, but it is periodic and broad rather than session-scoped and memory-native.

### 3. The evolution loop already wants better signals
From [[Evolution Loop Pipeline]]:
- the system wants signal collection → analysis → proposals → application → verification

A KAIROS layer would improve the **signal quality** available to that pipeline by converting noisy session history into structured observations.

### Conclusion

KAIROS fits this environment because the building blocks already exist. The gap is orchestration:

> **there is no first-class, continuously running memory distiller that owns cross-session compression as its main job.**

---

## Mapping to Current Components

| KAIROS Function | Current Analog | Current Gap |
|---|---|---|
| Persistent background presence | Right Hand / heartbeat / long-running agents | No dedicated memory-distillation owner |
| Session-end capture | Claude stop hooks, transcript sync | Capture exists, but distillation is not first-class |
| Knowledge extraction | Auto-Knowledge Capture | Batch/cron-oriented, not tightly bound to session closure |
| Durable store | Vault, engram, graph-memory | Data is split across layers without a clear canonical distillate type system |
| Retrieval | QMD, ontology, graph-memory | Retrieval exists, but depends on good artifacts being produced |
| Improvement signal feed | Evolution loop data sources | Signal quality limited by inconsistent compression |

This is why KAIROS is strategically useful: it does not replace the current system; it **tightens the seams between existing pieces**.

---

## Minimum Viable KAIROS for This Environment

A practical version for this stack does **not** need a mysterious all-powerful daemon. It can start as a disciplined pipeline.

### Inputs
- Claude / OpenClaw session summaries
- transcript sync outputs
- dispatch task outcomes
- `CONTINUE.md` or equivalent continuity artifacts
- message-harvester extracts
- evolution signals and outcome trackers

### Distillation step
A distiller should produce a small number of structured outputs per session:

1. **Session summary** — brief narrative of what was accomplished
2. **Decision log entries** — stable decisions and rationale
3. **Learnings/gotchas** — reusable tactical insights
4. **Open loops** — unresolved follow-ups and resumption handles
5. **Performance metadata** — task type, cost, duration, success/failure, blockers

### Outputs
Likely destinations:
- vault notes for human-readable durable memory
- engram / graph-memory for machine retrieval
- outcome-tracker / performance ledgers for routing and evolution

### Retrieval consumers
- future agent sessions
- routing logic
- proposal engines
- evolution/self-improvement analysis
- human briefings/digests

---

## Recommended Output Schema

KAIROS gets much more useful if it writes **typed** memory, not just prose blobs.

### Suggested memory object kinds

#### Decision
- decision
- date/time
- scope (project/system/general)
- rationale
- evidence source
- supersedes / superseded_by

#### Learning
- pattern title
- context
- trigger / failure mode
- successful response
- confidence
- recurrence count

#### Open loop
- issue
- current state
- blocking factor
- next recommended action
- owner / candidate owner
- expiry/review date

#### Session fact pack
- tools used
- files changed
- tasks completed
- unresolved errors
- follow-up artifacts created

This matters because later systems can reason over structured objects much better than over freeform prose.

---

## Implementation Options

## Option A — Stop-hook distillation

**Flow:** run a distillation step immediately at session end.

```text
Stop hook
  → gather transcript/session metadata
  → distill key artifacts
  → write vault note + structured JSON
```

### Pros
- freshest possible signal
- tightly tied to specific session
- less chance of later context drift

### Cons
- increases session-close latency
- can create expensive API usage spikes
- risky if stop hook becomes brittle or blocking

### Best use
Small, cheap first-pass distillation only. Heavy enrichment can happen later.

---

## Option B — Heartbeat / cron distillation

**Flow:** every N hours, process sessions completed since last checkpoint.

### Pros
- cheaper and easier to throttle
- simpler operationally
- good fit with current auto-knowledge patterns

### Cons
- not truly immediate
- harder to preserve exact session boundaries
- may mix unrelated sessions if bookkeeping is weak

### Best use
Safest starting point for this environment.

---

## Option C — Hybrid two-stage KAIROS

**Stage 1:** cheap session-end capture  
**Stage 2:** scheduled deeper distillation / consolidation

```text
Session end
  → quick extract (decisions, open loops, metadata)
Later cron
  → merge, dedupe, promote, connect to graph/index layers
```

### Why this is strongest
It matches the current architecture best:
- session-end hooks already exist
- auto-knowledge cron already exists
- the vault already supports later promotion/organization

This avoids forcing one tool to do everything at once.

**Recommendation:** this is the best default path.

---

## Relationship to Existing Systems

### Auto-Knowledge Capture
KAIROS is **not** a replacement. It is a specialization.

- Auto-Knowledge Capture = broad extraction pipeline over transcripts/messages
- KAIROS = focused cross-session memory distillation layer with stronger session semantics

### Letta subconscious
Letta appears closer to **persistent context injection / memory whispering**.
KAIROS is closer to **memory compression and promotion**.

Those are complementary roles.

### Evolution Loop
KAIROS should feed the evolution loop, not merge with it.

Good separation:
- KAIROS asks: *what should be remembered?*
- evolution loop asks: *what should be changed?*

### Vault note writing
KAIROS should produce memory artifacts that stay friendly to vault workflows rather than hiding everything in opaque databases.

---

## Failure Modes

This pattern is valuable, but memory systems fail in subtle ways.

### 1. Over-compression
If KAIROS summarizes too aggressively, it removes the detail needed for future interpretation.

**Failure sign:** future sessions get vague slogans instead of actionable context.

### 2. Hallucinated memory
A distiller can invent causal explanations or infer preferences too confidently.

**Failure sign:** the system starts acting on “facts” nobody actually established.

### 3. Duplicate memory inflation
If every session creates overlapping memory notes without dedupe/merging, the system accumulates clutter rather than clarity.

**Failure sign:** many near-duplicate notes, retrieval becomes noisy.

### 4. Confusing memory with policy
A session-specific observation can accidentally become treated as a standing rule.

**Failure sign:** one-off behavior mutates long-term defaults.

### 5. Distillation without provenance
If a memory object does not point back to source session/transcript/artifact, trust collapses.

**Failure sign:** no way to inspect where a “learned” fact came from.

### 6. Downstream mutation risk
If memory distillation feeds directly into prompt mutation without review, the system can drift based on low-quality summaries.

**Failure sign:** bad summaries turn into bad behavior changes.

---

## Safeguards

### Provenance on every artifact
Each memory unit should include:
- source session id / transcript reference
- distillation timestamp
- confidence
- artifact type
- whether it is human-reviewed or machine-only

### Confidence tiers
Not all outputs should be treated equally.

Suggested tiers:
- **high confidence** — direct factual extraction
- **medium confidence** — recurring pattern inferred from multiple sessions
- **low confidence** — hypothesis or optimization idea

### Dedupe / merge rules
A distiller needs logic to:
- update recurring learnings rather than duplicating them
- supersede stale decisions
- merge repeated open loops

### Promotion boundaries
Not every distilled object deserves full vault-note status.

Suggested layers:
- raw distillate cache
- promoted vault knowledge
- routing/performance signal store

### Separation from mutation systems
KAIROS outputs should **inform** self-improvement, not directly rewrite prompts/behavior without another review layer.

---

## What “Good” Looks Like

A successful KAIROS-style implementation would create these observable improvements:

### Better session continuity
Future sessions resume with:
- the real open loops
- the actual last decisions
- the right warnings
- less need to re-read giant transcripts

### Lower prompt bloat
Instead of carrying huge context windows forward, the system can inject compact, relevant memory.

### Better routing and evaluation
Patterns like:
- task type → successful agent
- repeated failure mode
- useful workaround

become machine-usable rather than trapped in narrative logs.

### Better human trust
Humans can inspect concise memory artifacts and see what the system thinks it learned.

---

## Recommended Next Step for This Stack

### Best immediate path: Hybrid KAIROS

1. **Add a lightweight session-end extract**
   - decisions
   - open loops
   - touched artifacts
   - confidence/provenance

2. **Extend auto-knowledge capture** to consume these extract objects in scheduled consolidation passes.

3. **Write two output targets**
   - human-readable vault note / note section
   - machine-readable structured record for routing/evolution

4. **Keep mutation separate**
   - do not let this directly rewrite prompt files or operating docs without another gate

### Concrete implementation sketch

#### Phase 1 — Session artifact schema
Create a small JSON schema for session-distillate records, e.g.:
- `session_id`
- `project`
- `decisions[]`
- `learnings[]`
- `open_loops[]`
- `signals[]`
- `confidence`
- `source_refs[]`

#### Phase 2 — Hook producer
Use existing Stop hooks to emit those records cheaply.

#### Phase 3 — Cron consolidator
Have a scheduled job merge/dedupe/promote them into:
- vault notes
- performance ledgers
- graph/ontology references if useful

#### Phase 4 — Retrieval integration
Teach future sessions/routing to query these distillates first before grabbing bulky raw transcripts.

---

## Strategic Take

KAIROS is one of the more important patterns in this cluster of source-derived ideas because it addresses a fundamental bottleneck:

> **agent systems do not just need more memory — they need better compression between episodes.**

Trajan’s environment already has:
- capture hooks
- transcript sync
- vault persistence
- semantic retrieval
- periodic knowledge extraction
- an evolution loop hungry for better signals

That means the core opportunity is not invention. It is **convergence**.

If implemented carefully, KAIROS would become the bridge between:
- raw agent work
- durable memory
- reusable intelligence
- safer future self-improvement

If implemented sloppily, it becomes just another pile of summaries nobody trusts.

So the right framing is:
- **high strategic value**
- **medium implementation difficulty**
- **high need for provenance, dedupe, and separation from mutation**

---

## Bottom Line

KAIROS is not “an always-on assistant” in the vague marketing sense. It is a **memory architecture pattern**:

- keep a persistent background memory process
- distill sessions into structured knowledge
- promote only the useful parts
- feed retrieval and evaluation with compressed, high-signal memory

For this stack, the biggest insight is that **most prerequisites already exist**. The missing piece is a first-class distillation owner and schema.

That makes KAIROS less of a moonshot and more of a plausible next-generation refinement of the current vault + hook + extraction architecture.

---

## Sources

### Primary local evidence
- `System/Intelligence Extractions.md` — KAIROS extraction from `1c922b73.txt`
- [[KAIROS Pattern — Cross-Session Memory Distillation]]
- [[Auto-Knowledge Capture]]
- [[Evolution Loop Pipeline]]
- [[System Claude Code]]

### Original note lineage
- Source tagged in prior note as: `1c922b73.txt (Claude Code source leak)`

#intelligence #design-pattern #memory #agent-architecture #kairos
