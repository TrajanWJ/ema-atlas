---
title: Context Management Best Practices
type: reference
status: active
created: 2026-03-20
updated: 2026-04-06
source: internal research synthesis + vault cross-reference + observed system patterns
confidence: 0.88
tags: [agent-architecture, context-management, memory, prompts, orchestration]
summary: Practical guidance for managing context in agent systems: how to decide what belongs in prompt context vs durable memory, how to structure prompts to avoid lost-in-the-middle failures, and how to use retrieval, summaries, and artifacts so sessions stay sharp instead of bloated.
related:
  - [[System Data Flow]]
  - [[System Claude Code]]
  - [[Research - Claude Code Ecosystem March 2026]]
  - [[Auto-Knowledge Capture]]
---

# Context Management — Best Practices for AI Agent Systems

> Context management is not mainly about stuffing more text into the model. It is about controlling what the model sees, when it sees it, and in what form.

The systems that feel “smart” are usually not the ones with the largest prompts. They are the ones that:
- keep the right facts close,
- move stale material out of the hot path,
- reintroduce knowledge only when relevant,
- and preserve durable memory outside the live context window.

---

## Executive Summary

Good context management follows a simple rule:

> **Prompt context should contain what is needed now; durable memory should contain what may matter later.**

In practice, this means:

1. **Keep hot context narrow** — task, constraints, success criteria, immediate evidence.
2. **Push durable knowledge out of the prompt** — notes, logs, prior decisions, project memory, retrieval indexes.
3. **Bring things back in on demand** — via retrieval, summaries, or explicit artifact references.
4. **Structure prompt order intentionally** — important instructions belong at the top or the end, not buried in the middle.
5. **Use typed artifacts instead of narrative sludge** — manifests, decision logs, open-loop lists, structured summaries.
6. **Treat context as a budget** — every token spent on irrelevant material competes with reasoning.

---

## 1. The Core Problem

Agent systems usually fail from one of four context mistakes:

### A. Overstuffing
Too much context is included “just in case.”

Result:
- slower reasoning
- worse attention allocation
- higher token cost
- more chances of lost-in-the-middle failures

### B. Under-provisioning
The agent is missing one or two crucial pieces of context.

Result:
- repeated rediscovery
- dumb mistakes that look avoidable in hindsight
- needless follow-up turns

### C. Wrong-shape context
The right information exists, but it is presented badly.

Examples:
- giant transcripts instead of distilled decisions
- prose blobs instead of task specs
- stale system docs mixed with current task state

### D. No durable memory boundary
Important information lives only in the current prompt/session.

Result:
- every session restarts from near-zero
- mistakes repeat
- knowledge compounds poorly

This is why context management is inseparable from memory architecture.

---

## 2. Hot Context vs Durable Memory

A healthy system clearly separates **live working context** from **long-term stored knowledge**.

## Hot context
What belongs in the prompt/session right now:
- immediate task goal
- constraints
- success criteria
- current file paths / relevant artifact refs
- the most recent local state needed for execution
- only the smallest amount of background required to avoid obvious mistakes

## Durable memory
What belongs outside the live prompt:
- old transcripts
- detailed research notes
- recurring preferences
- long-lived design decisions
- runbooks / operating docs
- project history
- past failures and lessons learned

### Rule of thumb
If something is:
- **stable across many sessions** → put it in durable memory
- **specific to the current task** → keep it in hot context
- **possibly relevant but not certainly needed** → retrieve it on demand instead of preloading it

This is one of the most important context-management distinctions.

---

## 3. Prompt Order Matters More Than People Think

The system already has evidence of this in the intelligence note on lost-in-the-middle behavior:

> critical instructions placed in the middle of long prompts are systematically ignored.

So the first best practice is structural, not semantic.

## Recommended prompt shape

### Top: goal and framing
Put these first:
- what the task is
- what success looks like
- what role or mode the agent should operate in

### Middle: supporting context
Put here:
- relevant background
- retrieved notes
- environment details
- non-critical supporting evidence

### End: hard constraints and output contract
Put near the end:
- non-negotiable constraints
- explicit failure conditions
- exact output format
- must-check items / verification requirements

### Why this structure works
It gives the agent:
- an initial objective anchor
- a background body to reason over
- a final recency-weighted reminder of constraints and deliverable shape

**Bad structure:** everything as one giant wall of prose.  
**Better structure:** explicit sections with clear priority.

---

## 4. Context Is a Budget, Not a Dumping Ground

Every token in the prompt competes for attention.

That means context should be evaluated for:
- **relevance** — does this directly improve this task?
- **recency** — is it current enough to trust?
- **specificity** — is it concrete enough to be useful?
- **replaceability** — could this be fetched later instead?

### Questions to ask before injecting context
1. What specific mistake does this context prevent?
2. Is this still true/current?
3. Could this be summarized more tightly?
4. Could a file path / note reference replace full text?
5. Does the agent need this now, or only if it gets stuck?

If there is no clear answer, the context is probably not worth preloading.

---

## 5. Prefer References and Artifacts Over Raw Dumps

One of the most common context failures is pasting large bodies of text that should really be artifacts with structure.

### Better than raw narrative
Use:
- task specs
- checklists
- manifests
- decision logs
- open-loop lists
- structured summaries
- file refs and note refs

### Why artifacts win
They are:
- easier to scan
- easier to diff
- easier to reuse programmatically
- lower entropy than raw transcripts

### Examples
Instead of:
- 3,000 words of “what happened last session”

prefer:
- task status
- decisions made
- blockers
- artifacts created
- next recommended action

This lets future sessions rehydrate the essentials without dragging everything forward.

---

## 6. Hierarchical Summarization Beats Binary Keep/Drop

The original note had a good instinct here: not all memory should be kept at the same fidelity.

### Better model: layered compression

#### Tier 1 — recent / hot
Keep verbatim or near-verbatim:
- the last few turns
- current commands/results
- current file diffs
- unresolved blockers

#### Tier 2 — medium horizon
Keep as concise summaries:
- today's key decisions
- active project direction
- current open loops
- notable mistakes/fixes

#### Tier 3 — long horizon
Keep as durable one-liners or structured facts:
- stable preferences
- canonical architecture decisions
- recurring patterns
- lasting lessons

### Why this works
It avoids the false choice between:
- keep everything, or
- drop everything

Instead, information gradually changes shape as it ages.

That is much closer to how a robust agent memory system should work.

---

## 7. Retrieval Should Replace Preloading

A lot of bad context management comes from trying to solve uncertainty by preloading everything.

The better pattern is:

```text
Store broadly → retrieve narrowly → inject minimally
```

### Good retrieval candidates
- prior decisions for this project
- relevant architecture note
- recent failure note for the same task type
- user preference that changes output style
- a note explicitly referenced by the current task

### Bad preload candidates
- entire old sessions
- giant knowledge-base dumps
- every related research note “just in case”
- stale system snapshots

### Implication for this stack
This is exactly why layers like QMD, vault notes, transcript capture, and structured system docs matter. They allow recall without prompt bloat.

---

## 8. Scoped Context Injection for Subagents

Subagents and delegated runs fail when they get either:
- too much irrelevant background, or
- not enough precise grounding

### Best practice
Pass:
- exact task goal
- explicit success criteria
- specific refs to consult
- any hard constraints
- only the minimal local state they need

### Avoid
- parent-session ramble
- entire chat history
- speculative context that the subagent may not need

### Strong pattern
Use **context refs** rather than giant pasted bodies:
- note paths
- file paths
- query handles
- short extracted snippets with provenance

This makes delegated work more reliable and easier to debug.

---

## 9. Use Context Fingerprinting to Detect Repeat Failure Loops

The original note suggested dispatch context fingerprinting. That is a strong idea.

### What it means
When a subagent or task repeatedly fails, compute a fingerprint/hash of the context package used.

### Why this helps
It distinguishes between:
- “same task, different approach”
- and “same bad context sent again”

### Practical value
Without this, systems often keep retrying the same failure with minor prompt phrasing changes.

With it, you can detect:
- stale or contradictory context packages
- duplicated failed attempts
- repeated routing mistakes caused by identical task framing

This is especially useful in dispatch/orchestration systems.

---

## 10. Track What Gets Accessed Together

The original note also suggested proactive context prefetch based on co-access patterns. That is a useful higher-level tactic.

### Pattern
If the same sets of notes/files are repeatedly opened together for a class of tasks, that cluster is meaningful.

### Example
For a given workflow, sessions may repeatedly use:
- system architecture note
- current roadmap
- recent failure log
- one project-specific operating doc

That cluster can then become:
- a retrieval bundle
- a workflow starter pack
- a candidate compact summary

### Caution
Prefetch should be conservative. Otherwise it becomes another form of overstuffing.

The goal is not to load more. It is to reduce the chance of missing the one note that is almost always needed.

---

## 11. Context Quality Depends on Provenance

The agent should know where context came from.

### Good context objects include
- source note/file/session
- update date
- confidence if inferred
- whether it is fact, decision, preference, or hypothesis

### Why this matters
Without provenance:
- stale info looks fresh
- speculation looks authoritative
- duplicated claims reinforce each other falsely

A memory system without provenance becomes a rumor mill.

---

## 12. Keep Output Contracts Explicit

A lot of context bloat comes from trying to teach the model the desired output shape implicitly through examples and prose.

It is usually better to say clearly:
- what sections to produce
- what to include/exclude
- what counts as done
- what artifact to write
- what verification to perform

### Why this matters for context
Clear output contracts reduce the need for repeated clarification, which reduces prompt churn and token waste.

---

## 13. Compaction Is Useful, but Only if You Control What Survives

Long sessions naturally need compaction. The mistake is treating compaction as a magical black box.

### Good compaction preserves
- the current objective
- hard constraints
- decisions already made
- unresolved blockers
- next actions
- refs to important artifacts

### Bad compaction preserves
- rhetorical fluff
- every conversational detail equally
- stale speculative branches

### Rule
Compaction should preserve **operational continuity**, not conversational nostalgia.

---

## 14. Context Management for This Stack Specifically

The local system already has the ingredients for good context management:
- vault as durable memory
- QMD / indexed retrieval
- Claude Code hooks for startup and post-write actions
- transcript sync / capture
- system docs that can act as stable references

That means the most important improvements are not abstract. They are operational:

### Best local practices

#### A. Keep system notes short enough to retrieve, not preload wholesale
Important notes should remain readable and chunkable.

#### B. Promote stable truths into durable docs
Do not keep rediscovering the same project/system facts inside sessions.

#### C. Use hooks to enrich startup context lightly
SessionStart and UserPromptSubmit are ideal for small, targeted context injection — not for dumping entire memory archives.

#### D. Capture open loops explicitly at session end
Future sessions need resumable state more than they need chat transcripts.

#### E. Prefer vault refs and retrieval over giant prompt preambles
The stack already has the retrieval machinery to support this.

---

## 15. Practical Heuristics

### Include in prompt if:
- needed immediately
- likely to change the next action
- hard to recover later in the session
- directly tied to success/failure now

### Store in memory instead if:
- important across many sessions
- not needed every time
- expensive to keep hot
- better expressed as a note/artifact

### Retrieve later if:
- possibly relevant but uncertain
- useful only for some branches
- large and searchable
- already stored durably elsewhere

---

## 16. Common Anti-Patterns

### 1. The giant briefing
A huge context preamble trying to cover every possibility.

### 2. Transcript-as-memory
Treating full logs as the primary reusable knowledge object.

### 3. Hidden constraints in the middle
Important instructions buried in dense context.

### 4. Duplicate context blocks
Same facts repeated in multiple places, inflating token cost.

### 5. No session-end artifact
Nothing durable created to help the next session resume.

### 6. Context without freshness markers
Old information injected as though it were current.

### 7. “Just paste the doc”
Using entire docs where a 5-line summary plus a path would be better.

---

## 17. Recommended Patterns Worth Keeping

These ideas from the original note are still strong and worth preserving:

### Hierarchical context summarization with decay
Good idea. Keep different fidelity bands over time.

### Dispatch context fingerprinting
Strong orchestration pattern. Helps detect repeated bad-context retries.

### Scoped context injection for subagents
One of the highest-value tactics in multi-agent systems.

### Cross-session artifact manifests
Important. Replace freeform session residue with typed outputs.

### Pattern-based prefetch
Useful if implemented conservatively.

These were the right instincts — they just needed a broader framework around them.

---

## Bottom Line

Good context management is not about maximizing context. It is about **allocating attention deliberately**.

The strongest systems do three things well:
- keep the prompt small and task-relevant,
- keep durable knowledge outside the prompt in structured memory,
- and reintroduce only the right pieces at the right time.

That is how you avoid both amnesia and bloat.

---

## Sources / Basis

### Internal basis
- local system observation of Claude Code hook + memory stack
- [[System Data Flow]]
- [[System Claude Code]]
- lost-in-middle intelligence note

### Conceptual lineage
- Anthropic “Building Effective Agents”
- general agent-memory / orchestration patterns from internal research corpus

#agent-architecture #context-management #memory #prompts #orchestration
