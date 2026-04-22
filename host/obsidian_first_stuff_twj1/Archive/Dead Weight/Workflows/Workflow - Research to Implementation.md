# Workflow: Research to Implementation

From vault research through decision through plan through build through vault update.

---

## When to Use This Workflow

- Starting a new feature that involves unfamiliar technology
- Making a tool or framework choice for the project
- Encountering a problem where the right approach is unclear
- Building something that should be informed by best practices research

## Phase 1: Research

**Role:** [[Role - Researcher]]
**Time:** 15-60 min depending on complexity

### 1.1 Check existing knowledge first
Before any external research:
- [ ] Search vault via QMD: `qmd vsearch "your question here"`
- [ ] Check [[My Stack Decisions]] for prior decisions in this domain
- [ ] Check [[AI Knowledge Hub]] for existing notes on the topic
- [ ] Search session logs: `qmd search "keyword"`

### 1.2 Conduct new research if gaps exist
```
Use the researcher subagent to evaluate [topic/question].
Check Context7 docs for [specific libraries].
Compare [option A] vs [option B] vs [option C] considering:
- compatibility with our stack (see My Stack Decisions)
- bundle size, performance, maintenance status
- learning curve and documentation quality
```

### 1.3 Capture findings in vault
- Create or update note in `AI Knowledge/` with research results
- Follow the vault note template (Quick Info table, Features, Install)
- Cross-link with related tools and the relevant MOC
- Tag consistently: `#tool #framework #pattern` etc.

**Exit criteria:** Clear understanding of options with documented trade-offs.

## Phase 2: Decision

**Role:** [[Role - Architect]] + user approval
**Time:** 10-20 min

### 2.1 Evaluate options
```
Use the architect subagent to evaluate the research findings
and recommend an approach. Consider our existing architecture
and stack decisions.
```

### 2.2 Document the decision
- [ ] Create ADR using [[Decision Record Template]] if the decision is significant
- [ ] Update [[My Stack Decisions]] if a new tool/library was chosen
- [ ] Record rationale and rejected alternatives

### 2.3 Get user confirmation
The Architect recommends, the user decides. Never proceed to planning without explicit user approval of the approach.

**Exit criteria:** Chosen approach documented and approved.

## Phase 3: Plan

**Role:** [[Role - Planner]]
**Time:** 15-30 min

### 3.1 Create implementation plan
```
Use the planner subagent to create a phased implementation plan
for [feature] using the [chosen approach]. The plan should reference
exact file paths and include tests for each step.
```

### 3.2 Save and review
- [ ] Plan saved to `docs/superpowers/plans/[feature-name].md` in the project
- [ ] Each phase is independently mergeable
- [ ] Every step has a test strategy
- [ ] Risk levels assigned
- [ ] Plan reviewed and approved by user

**Exit criteria:** Approved phased plan with exact file paths and test strategies.

## Phase 4: Build

**Role:** [[Role - Implementer]] + [[Role - Reviewer]]
**Time:** Variable (execute per phase)

### 4.1 Execute Phase 1 (Minimum Viable)
```
Use the implementer subagent to execute Phase 1 of the plan in
docs/superpowers/plans/[feature-name].md. Follow TDD — write
failing tests first.
```

Superpowers sequence:
1. `superpowers:test-driven-development` — write failing test
2. Implement minimum code to pass
3. Refactor for quality
4. `superpowers:verification-before-completion` — verify before marking done

### 4.2 Review after each phase
```
Use the code-reviewer subagent to review all changes from Phase 1.
Check against Coding Standards and Security Standards.
```

### 4.3 Fix issues and iterate
- Reviewer produces findings table with severity
- Implementer fixes CRITICAL and HIGH issues
- Re-review if changes were significant
- Commit when review passes

### 4.4 Repeat for subsequent phases
```
Phase 1 → Review → Fix → Commit
Phase 2 → Review → Fix → Commit
Phase 3 → Review → Fix → Commit
...
```

### 4.5 Debug when stuck
If the Implementer hits a wall:
```
Use superpowers:systematic-debugging to diagnose the issue.
If 3 attempts fail, escalate — do not keep trying.
```

**Exit criteria:** All phases complete, all reviews pass, tests green.

## Phase 5: Document and Update Vault

**Role:** User + Claude
**Time:** 10-15 min

### 5.1 Update vault with what was built
- [ ] Update project note in `Trajan's Projects/` with completed features
- [ ] Check off completed phases in the project checklist
- [ ] Add Development Log entry with date and session link

### 5.2 Capture reusable patterns
- [ ] If a new pattern was established, document it in the vault
- [ ] If a new skill was discovered, consider creating it via `superpowers:writing-skills`
- [ ] Update [[AI Knowledge Hub]] Quick Reference if a new tool was adopted

### 5.3 Create session log
- [ ] Create session summary in `Session Log/` using [[Session Summary Template]]
- [ ] Include: what was researched, decided, planned, built, and learned
- [ ] Link to the ADR and plan files

### 5.4 Clean up
- [ ] Remove or archive the plan file if fully executed
- [ ] Update [[My Stack Decisions]] if a new technology was permanently adopted
- [ ] Verify QMD indexes the session: `qmd search "[feature topic]"`

**Exit criteria:** Vault reflects what was built. Next person (or future you) can find it.

## Quick Reference: Full Pipeline

```
Research (Researcher) → vault notes
    ↓
Decision (Architect) → ADR + My Stack Decisions
    ↓
Plan (Planner) → docs/superpowers/plans/
    ↓
Build (Implementer) → code + tests
    ↓
Review (Reviewer) → findings table → fix → merge
    ↓
Document → project note + session log + vault updates
```

## See Also

- [[Workflows MOC]]
- [[Workflow - Knowledge Growth]] — how research feeds the vault
- [[Workflow - Daily Development]] — this workflow embedded in daily work
- [[My Stack Decisions]] — where decisions land
- [[AI Knowledge Hub]] — where research notes live

#workflow #research #implementation
