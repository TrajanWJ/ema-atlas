---
title: "Codex Planning Prompt — Pre-execution Template"
created: 2026-04-04
type: prompt-template
tags: [codex, planning, templates]
---

# Codex Planning Prompt

Use this as a prefix when dispatching complex tasks to Codex. Paste before the task description.

---

Before writing any code, complete these steps in order:

**PREP:** Read all relevant files. Map what touches what.

**PLAN:** Write a brief plan:
- What files change?
- What's the order of operations?
- What could break in callers/dependents?

**CRITIQUE:** Self-review your plan. Flag any risks:
- [ ] Correctness (does this actually solve the problem?)
- [ ] Security (any injection, auth, validation gaps?)
- [ ] Completeness (any edge cases missed?)

**GATE:** Answer honestly: is this plan solid enough to execute? If not, revise before continuing.

**EXECUTE:** Implement from the plan summary only. Branch: `codex/<slug>`. Atomic commits.

---

**Task:**
[PASTE TASK HERE]
