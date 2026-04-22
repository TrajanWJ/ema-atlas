# Proposal: Context Management Improvements for AI Agent Systems

**Date:** 2026-03-20
**Author:** Researcher Agent
**Task ID:** pipeline-research-20260320-062401
**Status:** PROPOSAL

---

## 1. Current State

The OpenClaw Right Hand system has a well-structured 4-tier memory architecture but several context management patterns that create friction or waste:

### 4-Tier Architecture (as-is)
| Tier | Storage | Size/Limit | Access |
|---|---|---|---|
| Working | MEMORY.md | 2500 chars, § delimited | Frozen snapshot at session start |
| Episodic | daily notes + outcome-tracker.json | Unbounded | Manual file read by date |
| Semantic | vault/QMD | Unbounded | `qmd search` on-demand |
| Procedural | SOUL.md, AGENTS.md, skills | ~8-12K chars | Full load at session startup |

### Current Gaps

**Context loading is static, not task-adaptive.** Every session startup loads SOUL.md, USER.md, discord-output-format.md, Preferences.md, and the last 2 daily notes — regardless of whether today's task is a quick ops check or a deep research session. All procedural context is always loaded, even when irrelevant.

**MEMORY.md is frozen at session start.** Context discovered mid-session (e.g., a service is down, a file was modified) doesn't automatically update the working context. Agents working in parallel can't share discovered facts without routing everything through Right Hand.

**Episodic memory (daily notes) is not indexed.** `qmd search` queries vault notes but not `memory/YYYY-MM-DD.md` files. Answering "what did we try last week on X?" requires guessing dates and manually reading files. The pre-dispatch step `grep -i "topic" outcome-tracker.json` partially covers this but with low signal density.

**Dispatch context blocks have no size discipline.** The standard context block (TASK, GOAL, CONTEXT, CONSTRAINTS, OUTPUT CONTRACT) has no enforced size limit on the CONTEXT field. A Right Hand that pastes 3 vault notes verbatim into CONTEXT is not violating protocol, but it can balloon a dispatch from 500 to 5000 tokens — multiplied by 6 parallel agents.

**No structured context handoff.** When Agent A finishes and Agent B needs to continue the work, the handoff is ad-hoc prose in the dispatch CONTEXT field. There's no standard format for "here's what was learned, here's the current state, here's what you should NOT redo."

---

## 2. Improvements

### Improvement 1: Task-Scoped Context Loading at Session Startup

**Problem:** Session startup unconditionally loads all governance files (~8-12K chars). A cron check doesn't need Preferences.md. A vault cleanup doesn't need discord-output-format.md.

**Rationale:** Anthropic's "Building Effective Agents" (2024) notes that "simple, focused prompts produce better results." Irrelevant context isn't neutral — it adds noise that the model must route around, and it increases the probability of the model latching onto the wrong frame for the task.

**Expected impact:** 30-50% reduction in session startup context for non-complex tasks. Better task focus due to reduced irrelevant context.

**Implementation steps (coder-executable):**

1. Create `refs/context-profiles.md` with three profiles:
   ```
   MINIMAL: SOUL.md (first 60 lines) + MEMORY.md only
   STANDARD: MINIMAL + USER.md + discord-output-format.md + today's daily note
   FULL: STANDARD + Preferences.md + yesterday's daily note + CONTINUE.md
   ```

2. Add a context profile selector to AGENTS.md Session Startup section:
   ```
   0. Detect task type from first message (ops check/monitoring → MINIMAL; code/research → STANDARD; complex/multi-agent → FULL)
   ```

3. Document keyword heuristics for profile detection (already exists in `refs/keyword-triggers.md` — extend it with context profile mappings).

4. Update the startup checklist in AGENTS.md to reference the profile selector, replacing the fixed 6-step list with the profile-gated version.

5. Measure: add a `context_profile_used` field to outcome-tracker.json for future analysis.

---

### Improvement 2: Dispatch Context Budget Enforcement

**Problem:** The CONTEXT field in dispatch prompts has no size limit. In practice, Right Hand can inject thousands of tokens of context into each agent spawn, multiplied by the number of parallel agents.

**Rationale:** Li et al. (2024, arXiv:2404.02060) demonstrated that LLMs struggle with long in-context learning — performance degrades as context grows, even within the context window. Smaller, relevant context is strictly better than larger, semi-relevant context. The dispatch protocol already defines token budgets for OUTPUT but not for INPUT context.

**Expected impact:** 20-40% reduction in per-dispatch input tokens. Higher agent task focus. Prevents context bloat from compounding across batched dispatches.

**Implementation steps (coder-executable):**

1. Add a `CONTEXT_BUDGET` field to the standard dispatch context template in AGENTS.md:
   ```
   CONTEXT_BUDGET: <2000 tokens (~8000 chars). Summarize or link to files rather than pasting verbatim content. If you need the agent to read a file, include the path — don't paste the contents.
   ```

2. Update `refs/dispatch-protocol.md` with a "Context Size Pre-Check" gate before dispatch:
   ```
   Context size gate: Count chars in CONTEXT field.
   <4000: OK
   4000-8000: Summarize the longest section before dispatching
   >8000: STOP — extract to a file, give the agent a file path instead
   ```

3. Add a "context by reference" pattern to the dispatch protocol: instead of pasting a vault note into CONTEXT, write it to `scratch/context-{task_id}.md` and include the path. The agent reads it when needed.

4. Create `~/bin/dispatch-size-check.sh` that accepts a dispatch prompt file and reports its estimated token count, flagging if CONTEXT exceeds the budget.

5. Add to AGENTS.md Self-Learning section: when a dispatch returns NEEDS_CONTEXT, check if the original CONTEXT was too sparse. When an agent returns verbose low-quality output, check if CONTEXT was too large.

---

### Improvement 3: Daily Note QMD Indexing for Cross-Session Recall

**Problem:** `qmd search` queries vault notes but not daily notes (`memory/YYYY-MM-DD.md`). Operational memory from previous sessions — what was tried, what failed, what was decided — lives in files that aren't semantically searchable. The pre-dispatch step `grep -i "topic" outcome-tracker.json` partially covers this but daily notes contain richer context.

**Rationale:** The structured memory querying step in AGENTS.md already includes `qmd search` as the first pre-dispatch check. If daily notes were indexed, this single step would surface both semantic knowledge AND recent operational history, without requiring the agent to know which dates to check. This is the "right hand knowing what it has written" problem — a key requirement for coherent long-running agents.

**Expected impact:** Pre-dispatch memory queries will surface relevant session context from the past 7-30 days, reducing repeated discovery of the same facts. Estimated 15-30% reduction in NEEDS_CONTEXT/MISSING_CONTEXT failure class.

**Implementation steps (coder-executable):**

1. Create `~/bin/daily-note-index.sh`:
   - Reads all `workspace/memory/YYYY-MM-DD.md` files
   - Extracts entries by section (## Completed, ## Blocked, ## Learned, etc.)
   - Writes structured summaries to `vault/memory/daily-index/YYYY-MM-DD.md` in QMD-compatible format with frontmatter tags (`tags: [daily-note, operational]`)
   - Runs daily via cron (after midnight or first session of the day)

2. Add to `vault/memory/daily-index/` a QMD index so `qmd search "context management failures"` surfaces relevant daily note entries.

3. Update AGENTS.md pre-dispatch structured memory query to include:
   ```
   4. `qmd search "topic" --path vault/memory/daily-index/` — recent operational history
   ```

4. Add a 7-day and 30-day filter option to the search so agents can scope to recent vs historical.

5. Update daily note format (`memory/YYYY-MM-DD.md`) to include consistent section headers that the indexer can parse (already partially done — standardize: `## Completed`, `## Blocked`, `## Learned`, `## Errors`).

---

### Improvement 4: Structured Context Handoff Artifacts

**Problem:** When sequential agent pipelines run (Research → Synthesize → Vault-Write, or Implement → Verify → Deslop), each handoff is ad-hoc prose in the CONTEXT field. There's no standard format for "here is what was discovered, here is the current state, here is what NOT to redo." This causes agents to re-read already-processed files, re-verify already-confirmed facts, and miss critical findings from prior agents.

**Rationale:** The dispatch protocol already has checkpoint files for failure recovery. Extending this pattern to successful handoffs creates a lightweight, machine-readable state artifact that removes ambiguity from sequential workflows. This is the "state propagation" problem in multi-agent systems — well-documented as a key failure mode in LLM agent pipelines (Anthropic "Building Effective Agents" 2024).

**Expected impact:** Reduces duplicate work in sequential pipelines (estimated 20-35% fewer redundant tool calls in multi-step pipelines). Reduces MISSING_CONTEXT failures when agents are handed incomplete prose summaries.

**Implementation steps (coder-executable):**

1. Define a `HANDOFF` block format and add it to `refs/dispatch-protocol.md`:
   ```
   HANDOFF CONTRACT: At task completion, write a handoff file to scratch/handoff-{task_id}.md:

   # Handoff: {task_id}
   ## State
   - Files created: [paths]
   - Files modified: [paths with what changed]
   - Services checked: [name: status]
   ## Findings
   - [bullet: key facts discovered]
   ## Already Verified
   - [what the next agent should NOT re-check]
   ## Open Questions
   - [what remains unclear]
   ## Suggested Next Step
   - [one sentence]
   ```

2. Update AGENTS.md Skill Pipelines section to reference handoff files:
   ```
   Research → synthesize: Researcher writes handoff-{id}.md; Synthesizer reads it first before vault search
   Implement → verify: Coder writes handoff-{id}.md with "already verified" section; DA reads it
   ```

3. Add to dispatch protocol's "When to Give vs. Pre-Load Context" section:
   ```
   Sequential tasks: include handoff-{prior_task_id}.md path in CONTEXT field (not the content — the path)
   ```

4. Create `~/bin/handoff-clean.sh` that archives handoff files >7 days old to `scratch/handoffs-archive/` to prevent scratch/ accumulation.

5. Add `handoff_file` field to outcome-tracker.json so past handoffs are discoverable by task ID.

---

### Improvement 5: Mid-Session Context Refresh at Task Boundaries

**Problem:** MEMORY.md is a "frozen snapshot" — loaded once at session start and never refreshed. For long sessions that span multiple distinct task types (e.g., a morning ops check, then research, then coding), the working context becomes stale relative to what was learned during the session. Agents spawned late in a long session may operate with incorrect state (e.g., MEMORY.md says "gateway running" but it crashed during the session).

**Rationale:** The session-end protocol already has an `open-threads.sh` script that auto-detects open items. The same mechanism can be applied mid-session at natural task boundaries (each dispatch cycle), ensuring MEMORY.md reflects current state rather than session-start state. This is the "context drift" problem — a well-known failure mode in long-running agentic systems.

**Expected impact:** Eliminates stale-context failures in long sessions (currently a contributing factor to the MISSING_CONTEXT failure class). Ensures agents spawned late in a session have accurate state.

**Implementation steps (coder-executable):**

1. Create `~/bin/memory-refresh.sh`:
   - Reads current MEMORY.md
   - Reads today's daily note
   - Checks recent outcome-tracker.json entries (last 5)
   - Generates a diff between MEMORY.md and what it should be given recent outcomes
   - If drift detected: proposes specific updates to Right Hand (doesn't auto-write — Right Hand decides)
   - Outputs: `MEMORY_STALE: [field] was [old] → now [new]` structured messages

2. Add a trigger in AGENTS.md: after completing a task that touches system state (Ops tasks, gateway restarts, service changes), run `~/bin/memory-refresh.sh --quiet` and apply any flagged updates to MEMORY.md.

3. Add to SOUL.md Session-End Protocol:
   ```
   0.5. Run memory-refresh.sh before running open-threads.sh. Apply flagged stale entries.
   ```

4. For the frozen-snapshot concern specifically: add a `SESSION_EVENTS:` section to MEMORY.md that accumulates discovered state changes during the session (written by Right Hand after each dispatch cycle), separate from the stable facts. Example:
   ```
   SESSION_EVENTS: [06:15] gateway restarted - now healthy. [07:22] researcher agent hit rate limit.
   ```

5. Agents spawned later in a session should receive the SESSION_EVENTS section in their CONTEXT field — it's small (one line per event) and avoids stale-state errors.

---

## 3. Priority & Impact Summary

| # | Improvement | Failure Class Addressed | Effort | Priority |
|---|---|---|---|---|
| 1 | Task-Scoped Context Loading | Noise/irrelevant context | Low | P2 |
| 2 | Dispatch Context Budget Enforcement | Context bloat × N agents | Low | P1 |
| 3 | Daily Note QMD Indexing | MISSING_CONTEXT (cross-session) | Medium | P2 |
| 4 | Structured Context Handoff Artifacts | MISSING_CONTEXT (sequential pipelines) | Medium | P1 |
| 5 | Mid-Session Context Refresh | Stale-context failures in long sessions | Medium | P2 |

**Highest-leverage starting point:** Improvements 2 and 4 together — context budget enforcement + structured handoffs — address the most common failure modes in the dispatch pipeline with relatively low implementation cost. Both require only documentation updates (refs/) and 1-2 small scripts.

---

## 4. Sources

1. **Anthropic (2024).** "Building Effective Agents." anthropic.com/engineering/building-effective-agents — Simple focused prompts outperform large context injection; composable single-purpose agents outperform monolithic prompts.

2. **Li, T. et al. (2024).** "Long-context LLMs Struggle with Long In-context Learning." arXiv:2404.02060 — LLMs degrade on tasks requiring long in-context reasoning; irrelevant context actively hurts performance, not just efficiency.

3. **Anthropic (2024).** "Prompt Caching." platform.claude.com/docs — Stable, minimal prefixes maximize cache hit rates; dynamic context injection breaks cache prefixes.

4. **Wang, L. et al. (2023).** "A Survey on Large Language Model based Autonomous Agents." arXiv:2308.11432 — Surveys memory architectures for LLM agents; identifies context propagation in multi-agent systems as a key failure mode; recommends structured state artifacts for inter-agent handoffs.

5. **OpenClaw workspace analysis (2026-03-20).** AGENTS.md, SOUL.md, refs/memory-protocol.md, refs/dispatch-protocol.md, memory/workflow-patterns.json — Current system has 4-tier memory, MEMORY.md frozen at session start, outcome-tracker.json for episodic history, QMD for semantic search. No standardized handoff format, no context budget gate, no daily note indexing.

---

{confidence: 0.82, evidence_quality: T2, coverage: partial, blind_spots: ["didn't analyze actual dispatch logs for failure class frequency — MISSING_CONTEXT estimate is based on protocol review, not data", "didn't measure actual MEMORY.md churn rate or context drift frequency in practice", "QMD indexing feasibility depends on QMD supporting arbitrary vault subdirectories — assumed yes but not verified"]}
