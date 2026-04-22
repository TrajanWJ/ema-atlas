---
title: Superpowers Architecture - Stolen Patterns
created: '2026-03-16'
updated: '2026-03-16'
type: research
status: active
confidence: 0.5
confidence_updated: 2026-03-18T00:00:00.000Z
source: external-research
tags:
  - knowledge
  - openclaw
  - prompts
  - research
  - security
  - skills
summary: >-
  Superpowers is a **skill-based workflow system** for coding agents (Claude
  Code, Codex, Gemini CLI, Cursor). Key insight: it doesn't add new capabilit
wiki_id: research/Superpowers_Architecture_-_Stolen_Patterns
imported_from: vault/Research/Superpowers Architecture - Stolen Patterns.md
imported_at: '2026-04-04T00:23:57.115Z'
---
# Superpowers Architecture — Stolen Patterns

> **Source:** [obra/superpowers](https://github.com/obra/superpowers) — studied 2026-03-16
> **Purpose:** Extract implementable patterns for our [[OpenClaw]] agent system

---

## Architecture Overview

Superpowers is a **skill-based workflow system** for coding agents (Claude Code, Codex, Gemini CLI, Cursor). Key insight: it doesn't add new capabilities — it **constrains and structures** how agents already work. The magic is in process discipline, not tooling.

### How Skills Auto-Trigger

Superpowers uses a **SessionStart hook** (`hooks/hooks.json`) that injects the `using-superpowers` skill into every conversation start. This skill acts as a **meta-skill** — a routing table that forces the agent to check for applicable skills before ANY action, including clarifying questions.

**The auto-trigger mechanism is dead simple:**
1. **SessionStart hook** → injects `using-superpowers` into context
2. `using-superpowers` contains **aggressive compliance language**: "If you think there is even a 1% chance a skill might apply, you ABSOLUTELY MUST invoke the skill"
3. A **rationalization table** pre-empts every known excuse for skipping skills
4. Skills reference each other via `superpowers:skill-name` syntax (not file paths)
5. **Description-based routing**: YAML frontmatter `description` field starts with "Use when..." — Claude reads these to decide which skills to load

**Critical CSO (Claude Search Optimization) insight:** They discovered that if a skill's description summarizes the workflow (e.g., "dispatches subagent per task with code review between tasks"), Claude will **follow the description instead of reading the full skill**. This caused it to do ONE review instead of TWO. Fix: descriptions must ONLY contain triggering conditions, never process summaries.

### Skill Composition Pattern

Skills form a **DAG (directed acyclic graph)**, not a flat list:

```
brainstorming → writing-plans → subagent-driven-development → finishing-a-development-branch
                                       ↓
                              test-driven-development
                              requesting-code-review
                              verification-before-completion
```

Each skill explicitly declares:
- **Called by:** which skills invoke it
- **Pairs with:** complementary skills
- **Required sub-skill:** mandatory downstream skills
- **Required background:** prerequisite knowledge

---

## Top 5 Patterns to Implement

### Pattern 1: Two-Stage Review (Spec Compliance → Code Quality)

**What:** After every implementation task, two separate review passes happen in sequence:
1. **Spec Compliance Review** — Did the implementer build what was requested? Nothing more, nothing less?
2. **Code Quality Review** — Is the implementation well-built? Clean, tested, maintainable?

**Why this order matters:** Quality review on wrong code is wasted work. Verify correctness first, then quality. They explicitly forbid starting code quality review before spec compliance passes.

**Key insight from their spec-reviewer-prompt:** The reviewer is told "The implementer finished suspiciously quickly. Their report may be incomplete, inaccurate, or optimistic. You MUST verify everything independently." This adversarial framing prevents rubber-stamp reviews.

#### Implementation Plan for Our System

**Step 1: Create review prompt templates**

Create two files in the workspace:

`~/workspace/prompts/spec-reviewer.md`:
- Takes: task requirements (full text), implementer's report, file paths changed
- Instructions: Read actual code, compare to requirements line by line
- Output format: ✅ Spec compliant / ❌ Issues found (with file:line references)
- Critical framing: "Do NOT trust the implementer's report. Verify independently."

`~/workspace/prompts/code-quality-reviewer.md`:
- Takes: what was implemented, the spec/plan, git diff (BASE_SHA..HEAD_SHA)
- Instructions: Check single responsibility, test coverage, naming, patterns
- Output format: Strengths, Issues (Critical/Important/Minor), Assessment

**Step 2: Integrate into dispatch protocol**

Update `AGENTS.md` dispatch cycle step 6 (Verify):
```
6a. SPEC REVIEW — Spawn reviewer subagent with spec-reviewer prompt
    → If issues: send back to implementer, re-review (max 3 loops)
6b. CODE QUALITY — Only after spec passes, spawn with quality-reviewer prompt  
    → If issues: send back to implementer, re-review (max 3 loops)
6c. Only mark task complete when BOTH pass
```

**Step 3: Enforce ordering**

Add to AGENTS.md Red Lines:
- "Never run code quality review before spec compliance passes"
- "Never skip re-review after fixes"
- "Never accept 'close enough' on spec compliance"

**Effort:** ~2 hours. Create prompt files, update AGENTS.md dispatch protocol.

---

### Pattern 2: Auto-Triggering Skills Based on Context

**What:** Skills activate automatically based on context detection, not explicit invocation. The agent checks applicable skills BEFORE responding to any message.

**How Superpowers does it:**
1. A meta-skill (`using-superpowers`) is injected at session start
2. It contains a decision flowchart: "Might any skill apply? → Invoke Skill tool"
3. Aggressive anti-rationalization: table of 12 excuses and why they're wrong
4. Skill descriptions use CSO (Claude Search Optimization) — rich trigger conditions in YAML frontmatter

**Their key discovery:** Agents will rationalize skipping skills. The skill has a table:
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "The skill is overkill" | Simple things become complex. Use it. |

#### Implementation Plan for Our System

**Step 1: Create a skill-routing layer in AGENTS.md**

Add a "Skill Check" step between RECEIVE and CLASSIFY in our Input Processing:
```
1. RECEIVE  → Message from Trajan
2. CLEAN    → Fix typos, extract intent
3. SKILL CHECK → Does any specialist skill apply? Check before responding.
4. CONTEXT  → Channel, category, topic, history
5. CLASSIFY → Handle directly or delegate
6. EXECUTE  → Handle or spawn
```

**Step 2: Add trigger conditions to each specialist's profile**

Expand the [[Agent Roster]] with trigger conditions:
```
| Researcher | Triggers: "look into", "what is", "compare", research questions, unfamiliar topics |
| Coder | Triggers: "build", "fix", "implement", code files mentioned, error messages |
| Security | Triggers: "secure", "audit", "vulnerability", config changes, exposed ports |
```

**Step 3: Create skill descriptions that follow CSO principles**

For each installed ClawHub skill, ensure the description:
- Starts with "Use when..."
- Contains only triggering conditions (never process summaries)
- Includes symptom keywords agents would search for

**Step 4: Add anti-rationalization to SOUL.md**

Add a section: "Before responding, check if any specialist or skill applies. Don't rationalize skipping — 'this is simple' doesn't mean a skill wouldn't help."

**Effort:** ~1 hour. Mostly AGENTS.md and SOUL.md edits.

---

### Pattern 3: Subagent-Per-Task with Inspection

**What:** Each implementation task gets a fresh subagent with precisely crafted context. The controller (orchestrator) never does the work — it dispatches, inspects, and coordinates.

**Key principles from Superpowers:**
1. **Fresh context per task** — subagents never inherit session history
2. **Controller curates context** — provide full task text, don't make subagent read files
3. **Status protocol** — implementers report: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
4. **Model selection by complexity** — cheap models for mechanical tasks, capable models for architecture
5. **Questions before work** — subagents can ask clarifying questions before starting
6. **Self-review before handoff** — implementer self-reviews, but this doesn't replace actual review

**Their implementer prompt is brilliant:** It explicitly tells the subagent "It is always OK to stop and say 'this is too hard for me.' Bad work is worse than no work." This prevents poor-quality output from agents in over their head.

#### Implementation Plan for Our System

**Step 1: Create an implementer prompt template**

`~/workspace/prompts/implementer.md`:
- Template variables: `{TASK_NAME}`, `{TASK_DESCRIPTION}`, `{CONTEXT}`, `{WORKING_DIR}`
- Sections: Task Description, Context, Before You Begin (ask questions), Your Job, When You're in Over Your Head, Self-Review Checklist, Report Format
- Status protocol: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT

**Step 2: Update Coder specialist spawning**

When Right Hand spawns Coder for implementation:
```python
# Instead of: "go build X"
# Do: Provide full task text + context + status protocol
sessions_spawn(
    task=render_template("implementer.md", {
        TASK_NAME: "...",
        TASK_DESCRIPTION: "full text, not 'see file X'",
        CONTEXT: "where this fits, dependencies, arch context",
    })
)
```

**Step 3: Handle status responses**

Update dispatch protocol to handle all four statuses:
- DONE → proceed to spec review
- DONE_WITH_CONCERNS → read concerns, address if needed, then review
- NEEDS_CONTEXT → provide missing info, re-dispatch
- BLOCKED → assess blocker, either provide context, use more capable model, break task smaller, or escalate

**Step 4: Add escalation chain**

```
Same agent retry (with more context)
  → More capable model
    → Break into smaller tasks
      → Escalate to Trajan
```

**Effort:** ~3 hours. Create templates, update dispatch protocol, test with a real task.

---

### Pattern 4: Plan Validation Chunks

**What:** Plans are written in chunks (≤1000 lines each), and each chunk is reviewed by a dedicated reviewer subagent before proceeding to the next. Plans also get a final review loop before execution.

**How it works:**
1. **Brainstorming** produces a spec (design doc)
2. Spec gets a **spec-document-reviewer** pass (loop until approved, max 5 iterations)
3. **Writing-plans** creates implementation plan in chunks
4. Each chunk gets a **plan-document-reviewer** pass
5. User reviews the final plan before execution begins

**Key insight:** The plan reviewer checks for:
- TODOs and placeholder text
- Steps that say "similar to X" without actual content
- Missing verification steps
- Files planned to hold multiple responsibilities
- Chunk size (each ≤1000 lines)

**The plan format is designed for zero-context execution:** Each task has exact file paths, complete code snippets, exact commands with expected output, TDD steps (write test → verify fail → implement → verify pass → commit). The plan assumes "an enthusiastic junior engineer with poor taste, no judgment, no project context."

#### Implementation Plan for Our System

**Step 1: Create a plan template**

`~/workspace/prompts/plan-template.md`:
```markdown
# [Feature] Implementation Plan

> **For agents:** Use the dispatch protocol to execute. Steps use checkbox syntax.

**Goal:** [one sentence]
**Architecture:** [2-3 sentences]
**Tech Stack:** [key technologies]

---

### Task N: [Component Name]
**Files:**
- Create: `exact/path/to/file`
- Modify: `exact/path/to/existing:line-range`
- Test: `tests/path/to/test`

- [ ] Step 1: Write failing test [complete code]
- [ ] Step 2: Verify failure [exact command + expected output]
- [ ] Step 3: Implement [complete code]
- [ ] Step 4: Verify pass [exact command + expected output]  
- [ ] Step 5: Commit [exact git commands]
```

**Step 2: Create a plan-reviewer prompt**

`~/workspace/prompts/plan-reviewer.md`:
- Checks: completeness, spec alignment, task decomposition, file structure, task syntax
- Hard checks: no TODOs, no "similar to X" without content, no missing verifications
- Output: Approved / Issues Found with specific locations

**Step 3: Integrate into the Coder workflow**

When Coder gets a complex task:
1. First produce a plan (using plan template)
2. Right Hand dispatches plan-reviewer
3. Loop until approved (max 5 iterations)
4. Present to Trajan for approval
5. Execute plan task-by-task with two-stage review

**Effort:** ~2 hours. Templates + workflow update.

---

### Pattern 5: RED-GREEN-REFACTOR Enforcement

**What:** Strict TDD discipline enforced through aggressive anti-rationalization language, explicit red flags, and verification requirements.

**Superpowers' approach is psychological warfare against rationalization:**

1. **The Iron Law:** "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST"
2. **Delete rule:** "Write code before the test? Delete it. Start over. No exceptions."
3. **Spirit clause:** "Violating the letter of the rules is violating the spirit of the rules."
4. **Rationalization table:** 12 common excuses with rebuttals
5. **Red flags list:** Mental states that signal you're about to violate TDD
6. **Verification mandate:** "If you didn't watch the test fail, you don't know if it tests the right thing."

**They also apply TDD to skill creation itself:** "Creating skills IS Test-Driven Development applied to process documentation." Skills get pressure-tested with subagents before deployment.

**Their `verification-before-completion` skill is a standalone gate:**
- "Claiming work is complete without verification is dishonesty, not efficiency"
- "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE"
- Must run verification command IN THIS MESSAGE — previous runs don't count
- Forbids: "should work now", "I'm confident", "just this once"

#### Implementation Plan for Our System

**Step 1: Add TDD enforcement to Coder's instructions**

When spawning Coder for implementation tasks, include:
```
## TDD Protocol (Non-Negotiable)
1. Write ONE failing test
2. Run it — verify it FAILS for the right reason
3. Write MINIMAL code to pass
4. Run it — verify it PASSES
5. Refactor if needed
6. Repeat

NEVER write implementation before the test.
If you already wrote code: delete it, start over.
No exceptions. No "I'll test after." No "it's too simple."
```

**Step 2: Add verification-before-completion to all agents**

Add to AGENTS.md dispatch protocol step 6:
```
Before marking ANY task complete:
1. What command proves this claim? (identify)
2. Run it NOW, in this response (execute)
3. Paste the full output (evidence)
4. Does output confirm the claim? (verify)

"Should work" / "looks correct" / "I'm confident" = NOT VERIFIED.
Only "I ran X, output shows Y, therefore Z" counts.
```

**Step 3: Create a rationalization-prevention reference**

`~/workspace/prompts/anti-rationalization.md`:
A quick-reference agents can be given that lists:
- Common excuses and why they're wrong
- Red flags (mental states that signal you're rationalizing)
- The iron law reminder

**Effort:** ~1 hour. Prompt additions to specialist spawning.

---

## Bonus Patterns Worth Noting

### Brainstorming Hard-Gate
```
<HARD-GATE>
Do NOT invoke any implementation skill, write any code, scaffold any project,
or take any implementation action until you have presented a design and the
user has approved it. This applies to EVERY project regardless of perceived simplicity.
</HARD-GATE>
```
Every feature goes through brainstorming → spec → plan → implement. No shortcuts. Even "simple" projects. "Simple projects are where unexamined assumptions cause the most wasted work."

### Model Selection by Task Complexity
- **Mechanical tasks** (1-2 files, clear spec) → cheap/fast model
- **Integration tasks** (multi-file, coordination) → standard model
- **Architecture/design/review** → most capable model

We could map this to our [[agent roster]]: simple file ops → Right Hand direct; integration → Coder; architecture → Coder + Researcher parallel.

### Adversarial Reviewer Framing
The spec reviewer prompt says: "The implementer finished suspiciously quickly. Their report may be incomplete, inaccurate, or optimistic." This adversarial framing produces genuinely critical reviews instead of rubber stamps.

### Subagent-STOP Tag
```
<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>
```
Prevents meta-skills from activating in subagent context. Smart — avoids infinite skill-check recursion.

### Writing Skills as TDD
They test skills by running "pressure scenarios" with subagents WITHOUT the skill present, documenting how agents fail, then writing the skill to address those specific failures. Then re-testing WITH the skill. This is genuinely clever — it means every rule in a skill exists because an agent actually violated it.

---

## Draft Skill: Two-Stage Review

Below is a draft skill file that could work in our [[OpenClaw]] system.

```markdown
---
name: two-stage-review
description: Use when verifying implementation quality after any agent completes a coding task — enforces spec compliance check before code quality review
---

# Two-Stage Review

Every implementation gets two review passes, in order. Spec compliance first, code quality second. Never reverse the order. Never skip either.

## Why Two Stages

Quality review on wrong code is wasted work. Verify the agent built what was asked FIRST. Only then check if they built it WELL.

## When to Use

- After any Coder agent completes an implementation task
- After Right Hand implements something directly
- Before marking any coding task as complete in TASKS.md
- Before presenting implementation results to Trajan

## The Process

### Stage 1: Spec Compliance Review

Spawn a reviewer subagent with:

**Input:**
- Full text of the original task/requirements
- Implementer's status report
- List of files changed

**Instructions to reviewer:**
> You are reviewing whether an implementation matches its specification.
> The implementer may have been optimistic in their report. Verify everything independently.
>
> Check:
> - **Missing requirements** — anything requested but not implemented?
> - **Extra work** — anything built that wasn't requested? (YAGNI violation)
> - **Misunderstandings** — right feature, wrong interpretation?
>
> Verify by reading actual code, not by trusting the report.
>
> Output: ✅ Spec compliant / ❌ Issues found [list with file:line references]

**If issues found:**
1. Send issues back to implementer (same agent or fresh subagent)
2. Implementer fixes
3. Re-run spec review
4. Repeat until ✅ (max 3 loops, then escalate to Trajan)

**Only proceed to Stage 2 after Stage 1 passes.**

### Stage 2: Code Quality Review

Spawn a reviewer subagent with:

**Input:**
- What was implemented (from Stage 1 verified report)
- The spec/requirements
- Git diff (base SHA to current HEAD)

**Instructions to reviewer:**
> Review the implementation for code quality:
> - Single responsibility per file/function?
> - Tests actually verify behavior (not mocks)?
> - Naming clear and accurate?
> - Error handling present?
> - No magic numbers, no dead code?
> - Follows existing codebase patterns?
>
> Rate issues: Critical (blocks merge) / Important (fix before next task) / Minor (note for later)
>
> Output: Strengths, Issues (rated), Assessment (approve/reject)

**If Critical or Important issues found:**
1. Send back to implementer
2. Fix
3. Re-run quality review
4. Repeat until approved (max 3 loops)

### After Both Pass

- Mark task complete in TASKS.md
- Log quality score to `memory/agent-performance.md`
- Present results to Trajan (if user-facing)

## Red Flags

**Never:**
- Start code quality review before spec compliance passes
- Skip re-review after fixes ("they probably fixed it")
- Accept "close enough" on spec compliance
- Let implementer self-review replace actual review
- Proceed with unfixed Critical or Important issues

**If reviewer and implementer disagree:**
- Reviewer's concerns get addressed (not dismissed)
- Implementer can push back WITH technical reasoning
- If deadlocked after 2 rounds, escalate to Trajan

## Integration

- Used by: Right Hand dispatch protocol (step 6: Verify)
- Feeds into: `memory/agent-performance.md` (quality tracking)
- Pairs with: Coder specialist, any implementation task
```

---

## Summary: What Makes Superpowers Work

1. **Process over power** — It doesn't add capabilities, it adds discipline
2. **Aggressive anti-rationalization** — Every skill anticipates how agents will try to skip it
3. **Adversarial review** — Reviewers are told to distrust implementers
4. **Fresh context isolation** — Subagents get curated context, never session history
5. **Verification is non-negotiable** — Claims without evidence are treated as lies
6. **Skills compose as a DAG** — brainstorm → spec → plan → implement → review → finish
7. **CSO matters** — How you describe skills determines whether agents actually use them
8. **TDD for everything** — Even skills themselves are test-driven against agent behavior

The overall philosophy: **assume agents will take shortcuts, and architect systems that make shortcuts impossible.**

## Related

- [[Agent-Architecture-Synthesis-2026-03]]
- [[Awesome-Copilot-Deep-Dive]]
