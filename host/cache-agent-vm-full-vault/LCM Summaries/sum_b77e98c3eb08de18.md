# LCM Summary sum_b77e98c3eb08de18

Created: 2026-03-18 06:29:55
Kind: leaf
Depth: 0
Conversation: 363
Tokens: 1215
Descendants: 0
Earliest: 2026-03-18T06:28:59.000Z
Latest: 2026-03-18T06:28:59.000Z

## Content

[2026-03-18 06:28 UTC]
---
title: "Superpowers Architecture - Stolen Patterns"
created: 2026-03-16
updated: 2026-03-16
type: research
status: active
confidence: 0.50
confidence_updated: 2026-03-18
source: unknown
tags: []
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
- "Neve
[LCM fallback summary; truncated for context management]
