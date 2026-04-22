---
title: "Agent Improvements 2026-03-20"
created: 2026-03-20
type: research
status: proposed
tags: [agents, soul, prompts, improvements]
summary: "3 specific SOUL.md patches derived from pattern analysis of corrections.md, mistakes.md, and task checkpoints."
---

# Agent Improvements — 2026-03-20

Derived from: `workspace/memory/corrections.md`, `vault/Agents/mistakes.md`, `vault/Agents/patterns.md`, and task checkpoint analysis (2026-03-20 batch).

---

## Change 1: Consolidate Duplicate Startup Reads + Session-End Sections

**Problem:** `SOUL.md` currently has two separate "Startup Reads" blocks and two "Session-End" protocol references. This creates ambiguity — agents may read one and miss the other, or treat them as conflicting authorities.

**Evidence:** Lines 104–112 list `vault/Agent-Learnings/` paths. Lines 135–138 list `roster.md` and `Preferences.md`. Both are labeled `## Startup Reads`. Same duplication for Session-End (lines 115–123 vs 141–144).

**Proposed patch — replace both Startup Reads blocks with one canonical section:**

```diff
-## Startup Reads
-
-On initialization, read the following files from the shared cross-agent memory to benefit from collective learnings:
-
-1. `vault/Agent-Learnings/patterns.md` — Reusable patterns discovered by other agents
-2. `vault/Agent-Learnings/mistakes.md` — Things that failed, so you don't repeat them
-3. `vault/Agent-Learnings/tools.md` — Tool usage tips from the fleet
-
-After completing tasks, append any new discoveries to the appropriate file above.
-
-
-## Session-End Reporting Protocol
-[...first block...]
-
-## Startup Reads
-
-1. `roster.md` — who is on the team and how to reach them
-2. `vault/Trajan/Preferences.md` — what Trajan wants
-
-## Session-End Protocol
-
-Report status: DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT
-List files created or modified. Note follow-up work needed.
+## Startup Reads (Canonical)
+
+On initialization, read in order:
+1. `roster.md` — team roster and contact
+2. `vault/Trajan/Preferences.md` — what Trajan wants
+3. `vault/Agent-Learnings/patterns.md` — reusable patterns from the fleet
+4. `vault/Agent-Learnings/mistakes.md` — failures to avoid
+5. `vault/Agent-Learnings/tools.md` — tool tips
+
+After completing tasks, append discoveries to the appropriate Agent-Learnings file.
+
+## Session-End Protocol (Canonical)
+
+**Final report structure:** See Session-End Reporting Protocol above.
+Status: DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT
+List files created or modified. Note follow-up work needed.
```

**Why this matters:** Two conflicting authoritative sections cause agents to cherry-pick whichever they see first, silently skipping the other. One canonical section eliminates the ambiguity.

---

## Change 2: Add Explicit "Failed Task" Handling Protocol

**Problem:** The current SOUL.md contains this unresolved stub at the bottom:

```
## Auto-Learned Protocol (promoted from .learnings)
<!-- AUTO-LEARNED: coder.failed | promoted: 2026-03-19T07:38:04Z | recurrence: 3 -->

When status is **failed**: This has occurred 3 times for agent coder. Review ERRORS.md and add explicit handling protocol above.
```

The protocol was never added. `recurrence: 3` means this failure mode has hit three times without a documented recovery path.

**Proposed patch — replace the stub with actual protocol:**

```diff
-## Auto-Learned Protocol (promoted from .learnings)
-<!-- AUTO-LEARNED: coder.failed | promoted: 2026-03-19T07:38:04Z | recurrence: 3 -->
-
-When status is **failed**: This has occurred 3 times for agent coder. Review ERRORS.md and add explicit handling protocol above.
+## Failed Task Protocol
+
+When a task fails or you return status BLOCKED/FAILED:
+
+1. **State what you tried** — at least 2 distinct approaches attempted
+2. **State what failed** — exact error, command, or ambiguity that blocked you
+3. **State what would unblock you** — specific information, file, or clarification needed
+4. **Write partial findings to file** — never silently discard work done before the failure
+5. **Do NOT retry the same approach a third time** — re-plan or escalate
+
+Format for failed task report:
+```
+STATUS: FAILED
+Tried: [approach 1], [approach 2]
+Blocked by: [specific reason]
+Partial output: [file path or summary]
+Would unblock: [what you need]
+```
+
+Append the failure to `vault/Agent-Learnings/mistakes.md` so the fleet learns.
```

**Why this matters:** Three recurrences with no documented recovery = agents repeatedly hitting the same wall and producing inconsistent failure reports. The escalation protocol exists but doesn't cover the output format for failures specifically.

---

## Change 3: Add Concrete Complexity Gate for Claude Code Delegation

**Problem:** `corrections.md` shows two consecutive corrections on routing decisions:
- 2026-03-18: "Routing: Don't spawn for trivial tasks"
- 2026-03-19: "Routing: Check complexity gate before spawning"

SOUL.md mentions "Claude Code for complex implementation" but never defines what "complex" means. This leaves the threshold undefined, producing the recurring correction pattern.

**Proposed patch — add to the Tools section:**

```diff
 ## Tools

 - Claude Code for complex implementation (`--print --permission-mode bypassPermissions`)
+
+**Complexity Gate — spawn Claude Code only when ALL of the following are true:**
+- Task requires modifying 3+ files, OR writing 100+ lines of new code
+- Task requires build/test verification after changes
+- Task cannot be completed with 1-2 targeted Edit/Write calls
+
+If the task fails the gate, handle it directly without spawning. Spawning for trivial tasks adds latency and obscures errors.
+
 - exec for running commands, tests, builds
 - Read/write/edit for direct file work
 - Vault for documenting patterns and decisions
```

**Why this matters:** Vague guidance ("use for complex implementation") produces inconsistent behavior. A concrete 3-part threshold gives the agent a decision rule it can apply without judgment calls, ending the recurring correction.

---

## Priority

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 1 | Consolidate duplicate sections | Medium — removes silent ambiguity | 5 min |
| 2 | Failed task protocol | High — 3 recurrences, unresolved debt | 10 min |
| 3 | Complexity gate for delegation | Medium — stops recurring correction | 5 min |

Apply in order: 2 → 3 → 1 (highest impact first, structural cleanup last).

---

## Source Analysis Summary

| Source | Pattern | Category |
|--------|---------|----------|
| `corrections.md` 2026-03-18/19 | Don't spawn trivial tasks; check complexity gate | Routing |
| `mistakes.md` | Thin SOUL = weak agent; needs explicit frameworks | Prompt quality |
| `SOUL.md` lines 104–138 | Duplicate Startup Reads sections | Structural debt |
| `SOUL.md` Auto-Learned stub | Failed protocol unresolved after 3 hits | Unresolved debt |
