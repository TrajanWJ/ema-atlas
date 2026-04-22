---
title: "Codex Agent — Improvement Patch 2026-04-04"
type: agent-patch
created: 2026-04-04
author: prompt-engineer
tags: [codex, soul-patch, planning, plan-execute]
summary: "Surgical patches to SOUL.md and CLAUDE.md adding plan/execute split, git discipline, and structured output verification."
---

# Codex Agent — Improvement Patch 2026-04-04

## Current State Assessment

### What's Working
- Strong non-negotiable execution rule (no silent model substitution)
- Failure protocol is well-defined with format and escalation limit
- Timeout/checkpoint protocol is present
- Cross-agent learning loop via `.learnings/LEARNINGS.md`
- Code quality standards are referenced from vault

### What's Missing or Weak

| Gap | Severity | Location |
|-----|----------|----------|
| No planning phase before execution | HIGH | SOUL.md, CLAUDE.md |
| No git discipline (branch isolation, commit patterns) | HIGH | CLAUDE.md |
| No structured verification before claiming DONE | MEDIUM | SOUL.md, CLAUDE.md |
| No structured output format for returned results | MEDIUM | CLAUDE.md |
| Failure to handle plan drift / over-engineering risk | MEDIUM | SOUL.md |

### Root Cause of Drift
Codex goes: `task description → codex exec → return result`. No planning step means:
- Edge cases discovered mid-execution (too late to reframe)
- Scope creep: Codex fixes X and "helpfully" refactors Y
- No upfront success criteria → subjective DONE calls
- No branch isolation → changes made directly to working tree

---

## Patch 1 — SOUL.md: Add Planning Discipline Section

**File**: `/home/trajan/.openclaw/agents/codex/workspace/SOUL.md`

**After** the `## How You Work` section (after step 5 "Log outcome"), **insert** new section:

```markdown
## Planning Discipline

For any task touching >1 file or estimated >5 minutes, enforce a plan-before-execute split:

1. **PLAN** — Before calling `codex exec`, produce in your own reasoning:
   - Files/modules affected (absolute paths)
   - Step list (T1, T2... with sense checks)
   - Success criteria: MUST / SHOULD / DONE WHEN
   - Git plan: branch name and commit strategy

2. **GATE** — Re-read the plan. Check: Is scope minimal? Any over-engineering risk? Any missing edge cases?

3. **EXECUTE** — Run `codex exec` with the plan injected into the prompt context

4. **VERIFY** — Before reporting DONE, confirm each MUST criterion is met. Run tests if applicable.

Skipping the plan phase is only permitted for trivial single-line fixes.
```

**Rationale**: Codex drifts and over-engineers because it has no pre-execution scope boundary. The plan becomes the `finalize.json` equivalent — Codex executes the task list, not the freeform description. Inspired by Megaplan's PLANNED → GATED → EXECUTED state machine.

---

## Patch 2 — CLAUDE.md: Add Git Discipline Section

**File**: `/home/trajan/.openclaw/agents/codex/workspace/CLAUDE.md`

**After** the `## Task Dispatch Protocol` section, **insert** new section:

```markdown
## Git Discipline

Before any implementation task:
- **Branch first**: `git checkout -b feat/[slug]` or `fix/[slug]` — never commit to main/master
- **Scope the branch**: one concern per branch
- **Atomic commits**: one logical change per commit; message format: `type(scope): what and why`
- **Before returning DONE**: verify branch exists and commits are clean
- **PR readiness check**: does the diff contain only what was asked? No bonus refactors.

If `codex exec` applies changes directly to the working tree:
- Review the diff before returning
- Flag any changes outside the requested scope as DONE_WITH_CONCERNS

Working tree must be clean before starting. If it's dirty, report BLOCKED with reason.
```

**Rationale**: Codex often applies changes directly without branching. This causes unrecoverable state in the repo. Enforcing git discipline at the prompt level is the only reliable prevention.

---

## Patch 3 — CLAUDE.md: Strengthen Verification Before DONE

**File**: `/home/trajan/.openclaw/agents/codex/workspace/CLAUDE.md`

**Find** the `## Task Dispatch Protocol` step 6 `**Report status** — DONE / DONE_WITH_CONCERNS / BLOCKED` and **replace** with:

```markdown
6. **Verify before reporting** — Before claiming DONE:
   - Confirm each success criterion is met
   - Run the project's test suite (or state why not applicable)
   - Review the diff: does it contain only what was asked?
   - If any MUST criteria are unmet → DONE_WITH_CONCERNS with specifics
7. **Report status** — DONE / DONE_WITH_CONCERNS / BLOCKED
```

**Rationale**: "Verify before reporting" is currently absent. Codex frequently returns DONE on partial implementations. Adding the explicit verification step and test-run expectation before status reporting closes this gap.

---

## Patch 4 — CLAUDE.md: Add Structured Output Format

**File**: `/home/trajan/.openclaw/agents/codex/workspace/CLAUDE.md`

**After** the `## Failed Task Protocol` section, **insert** new section:

```markdown
## Structured Return Format

Every completed task must return in this format (copy-paste, fill in):

```
STATUS: DONE | DONE_WITH_CONCERNS | BLOCKED
Branch: [branch name or "no branch — trivial fix"]
Files changed: [list, one per line]
Summary: [2-3 sentences: what changed, why it works]
Concerns: [deviations from plan, unexpected findings, or "none"]
Evidence: [codex exec output excerpt — first 10 lines or test result]
```

This format is what Right Hand uses to synthesize results. Missing fields → Right Hand escalates back to you.
```

**Rationale**: Currently Codex returns free-form text. Right Hand has to parse it. Structured output reduces synthesis errors and makes DONE_WITH_CONCERNS concerns machine-readable.

---

## Planning Prompt Template

Saved to: `vault/Agents/Prompts/codex-planning-prompt.md`

Summary: A 3-phase template (PLAN → EXECUTE → REPORT) Trajan prepends to non-trivial Codex tasks. Enforces:
- T1/T2/... step list with sense checks (= lightweight `finalize.json`)
- Explicit PAUSE gate between plan and execution
- Git plan (branch, commit strategy, PR title) before any code runs
- Structured REPORT format matching Patch 4 above

---

## What Was NOT Changed

- Codex invocation mechanics (`codex exec` / `codex review` rules) — already solid
- Failure protocol — already well-defined
- Learning loop — already working
- Code quality standards reference — already present

---

## Application Instructions

These are surgical patches — apply manually or via `edit` tool:

1. In `SOUL.md`: Add "Planning Discipline" section after step 6 of "How You Work"
2. In `CLAUDE.md`: Add "Git Discipline" section after "Task Dispatch Protocol"
3. In `CLAUDE.md`: Expand step 6 of "Task Dispatch Protocol" to include verification
4. In `CLAUDE.md`: Add "Structured Return Format" section after "Failed Task Protocol"
5. Planning prompt is already written to `vault/Agents/Prompts/codex-planning-prompt.md`
