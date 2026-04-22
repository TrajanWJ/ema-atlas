# Meta-Prompt Generator

Sources: [abilzerian/LLM-Prompt-Library](https://github.com/abilzerian/LLM-Prompt-Library), [sdi2200262/agentic-project-management](https://github.com/sdi2200262/agentic-project-management), [CO-STAR Framework (GovTech Singapore)](https://portkey.ai/blog/what-is-costar-prompt-engineering/)

**When to use**: When you need a high-quality, specialized prompt for a new domain or task type. When existing prompts don't fit the need.

---

## Prompt

You are a prompt engineering specialist. Your task is to create a well-structured, effective prompt for the following purpose.

**Desired Purpose**: `[describe what the prompt should accomplish]`
**Target Agent**: `[Claude Code / sub-agent / specific role]`
**Context**: `[what system/project/domain this will operate in]`

### Generation Process

#### Step 1: Analyze the Task
- What is the core action the prompt must drive?
- What inputs will be available?
- What outputs are expected?
- What quality standards apply?
- What failure modes need prevention?

#### Step 2: Apply the CO-STAR Framework

Structure the prompt using these six elements:

| Element | Question | Purpose |
|---------|----------|---------|
| **C** — Context | What background does the agent need? | Grounds the response in relevant information |
| **O** — Objective | What is the specific task? | Defines the primary goal |
| **S** — Style | What writing style or approach? | Sets the communication mode |
| **T** — Tone | What is the appropriate tone? | Shapes the response character |
| **A** — Audience | Who will consume the output? | Adjusts complexity and detail level |
| **R** — Response Format | What structure should the output have? | Ensures actionable, consistent deliverables |

#### Step 3: Draft the Prompt

Structure it with:

1. **Role definition**: Who is the agent? What expertise do they have?
2. **Context**: What system/project are they operating in?
3. **Task specification**: What exactly must they do? (unambiguous, single interpretation)
4. **Constraints**: What are the boundaries and rules?
5. **Input format**: What information will they receive?
6. **Output format**: What should the deliverable look like?
7. **Quality criteria**: How will success be measured? (measurable thresholds)
8. **Error handling**: What to do when things go wrong?

#### Step 4: Refine
- Remove ambiguity (every instruction should have one interpretation)
- Add specificity (concrete examples, exact formats, measurable thresholds)
- Check for conflicts (no contradictory instructions)
- Test for completeness (can the agent succeed with only this prompt?)
- Trim to essentials (remove words that don't change behavior)

### Meta-Prompt Patterns

**Pattern 1: Structured Expert**
Best for: analysis, review, evaluation tasks.
```
You are a [domain] expert. Analyze [subject] using [framework/methodology].

### Input
[what the user provides]

### Process
[step-by-step methodology]

### Output Format
[exact structure with example]

### Quality Gates
[measurable criteria for good output]
```

**Pattern 2: Constrained Creator**
Best for: code generation, content creation, design tasks.
```
Create [deliverable] that satisfies these requirements:
- [requirement 1 with measurable threshold]
- [requirement 2]

Follow these constraints:
- [constraint with boundary]
- [pattern to follow with example]

Output: [exact format]
Validation: [how to verify correctness]
```

**Pattern 3: Investigative Reasoner**
Best for: debugging, root cause analysis, decision-making.
```
Investigate [problem]. Do NOT propose solutions until analysis is complete.

### Phase 1: Evidence Gathering
[what to examine]

### Phase 2: Hypothesis Formation
[structured reasoning approach]

### Phase 3: Recommendation
[decision format with confidence level]
```

### Example: Generated Prompt

Here is an example of a prompt generated using this template:

```markdown
# Database Migration Review Prompt

You are a database migration specialist reviewing schema changes
for safety and correctness.

### Input
The migration files and current schema.

### Process
1. Check backward compatibility (can the old code still work?)
2. Check data preservation (is any data lost or corrupted?)
3. Check performance (will this lock tables? For how long?)
4. Check rollback safety (can this migration be reversed?)

### Output Format
| Migration | Safe? | Blocking? | Lock Duration | Rollback? | Issues |
|-----------|-------|-----------|---------------|-----------|--------|

### Quality Gates
- Every destructive operation (DROP, DELETE, ALTER TYPE) flagged
- Lock duration estimated for tables > 1M rows
- Rollback script provided for every migration
```

### Prompt Quality Checklist
- [ ] Clear role and expertise level defined
- [ ] Specific, measurable success criteria
- [ ] Concrete output format specified
- [ ] Edge cases addressed
- [ ] No ambiguous instructions
- [ ] Appropriate length (detailed enough to guide, concise enough to fit context)
- [ ] Follows existing vault conventions (see [[Coding Standards]], [[Architecture Principles]])
- [ ] Includes at least one concrete example of expected output

### Anti-Patterns to Avoid
- Vague instructions ("do your best", "be thorough")
- Conflicting requirements
- Missing output format
- No success criteria
- Over-constraining (preventing good judgment)
- Under-constraining (leaving too much to interpretation)
- No error handling guidance
- Assuming context the agent won't have

### Iterative Refinement
After generating the initial prompt:
1. Present the draft with rationale for key choices
2. Identify 3 questions that would improve it
3. Revise based on answers
4. Test with a concrete example to verify output quality
5. Repeat until prompt produces consistent, high-quality results
