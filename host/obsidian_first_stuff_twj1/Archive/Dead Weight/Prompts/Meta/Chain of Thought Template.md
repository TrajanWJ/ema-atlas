# Chain of Thought Template

Sources: [abilzerian/LLM-Prompt-Library](https://github.com/abilzerian/LLM-Prompt-Library), [mitsuhiko/agent-prompts](https://github.com/mitsuhiko/agent-prompts), [trailofbits/claude-code-config](https://github.com/trailofbits/claude-code-config)

**When to use**: Complex decisions, multi-step analysis, architectural choices, debugging hard problems, any situation where jumping to a conclusion risks being wrong.

---

## Template

When facing a complex problem, use this structured reasoning approach before acting.

### Step 1: Problem Definition
- What exactly is the problem? (symptoms vs. root cause)
- What is the desired outcome?
- What constraints exist?
- What information do I have? What's missing?

### Step 2: Decomposition
Break the problem into sub-problems:
1. [Sub-problem A] — can be solved independently
2. [Sub-problem B] — depends on A
3. [Sub-problem C] — can be solved in parallel with B

### Step 3: Analysis Per Sub-Problem
For each:
- **Options**: What are the possible approaches?
- **Evidence**: What data supports each option?
- **Trade-offs**: What do we gain/lose with each?
- **Reversibility**: How hard is it to change this decision later?

### Step 4: Synthesis
- How do the sub-problem solutions combine?
- Are there conflicts between solutions?
- Does the combined solution satisfy all constraints?
- Are there emergent risks from the combination?

### Step 5: Decision
- **Decision**: [clear statement]
- **Rationale**: [why this over alternatives]
- **Confidence**: High / Medium / Low
- **Conditions for revisiting**: [what would make us reconsider]

### Step 6: Verification Plan
- How will we know this decision was correct?
- What metrics to watch?
- When to re-evaluate?

## Structured Reasoning Patterns

Choose the pattern that best fits the problem type:

### Pattern 1: Hypothesis-Test (for debugging and investigation)
```
Observation: [what I see]
Hypothesis: [what I think is happening and why]
Test: [what I'll do to confirm/refute — changing ONE variable]
Prediction: [what I expect to happen if hypothesis is correct]
Result: [what actually happened]
Conclusion: [hypothesis confirmed/refuted, next step]
```
Use when: debugging, root cause analysis, performance investigation.

### Pattern 2: Pros-Cons-Recommendation (for decisions with clear options)
```
Option A: [description]
  Pros: [benefits, with evidence]
  Cons: [costs, with evidence]
  Risk: [what could go wrong]

Option B: [description]
  Pros: [benefits, with evidence]
  Cons: [costs, with evidence]
  Risk: [what could go wrong]

Recommendation: [which option]
Rationale: [why — must address the cons of the chosen option]
Reversibility: [how hard to change later]
```
Use when: architecture decisions, library selection, design choices.

### Pattern 3: Constraint Satisfaction (for design problems)
```
Hard Constraints (must satisfy):
1. [constraint — e.g., "must work offline"]
2. [constraint — e.g., "response time < 200ms"]

Soft Constraints (prefer to satisfy):
1. [preference — e.g., "minimize code changes"]
2. [preference — e.g., "use existing patterns"]

Candidate Solutions:
A. [solution] — satisfies: [1,2], violates: [none], soft: [1]
B. [solution] — satisfies: [1,2], violates: [none], soft: [1,2]

Selection: [solution with best constraint satisfaction]
```
Use when: system design, API design, choosing between competing requirements.

### Pattern 4: Risk-First (for high-stakes decisions)
```
Decision: [what we're considering]

What's the worst that can happen?
  - Scenario 1: [worst case] — likelihood: [H/M/L], mitigation: [how]
  - Scenario 2: [bad case] — likelihood: [H/M/L], mitigation: [how]

What's the cost of being wrong?
  - Reversible? [yes/no, and how hard]
  - Data loss risk? [yes/no]
  - User impact? [scope]

What's the cost of NOT deciding?
  - [opportunity cost or deterioration]

Decision: [proceed / defer / reject]
```
Use when: production changes, data migrations, breaking changes, security decisions.

## Decision Heuristics

### Reversible vs. Irreversible
- **Reversible decisions**: Bias toward action. Decide quickly, iterate.
- **Irreversible decisions**: Bias toward caution. Gather more data. Ask before proceeding.

### When to Ask vs. When to Act
**Ask** when: changing interfaces, deleting data, modifying shared resources, unsure about requirements, making irreversible changes
**Act** when: implementing well-defined tasks, fixing obvious bugs, refactoring within boundaries, adding tests

### Avoid These Reasoning Traps
- **Anchoring**: Don't fixate on the first solution found — generate at least 2 alternatives
- **Confirmation bias**: Actively seek evidence against your hypothesis
- **Sunk cost**: Don't continue a bad approach just because you've invested time
- **Premature optimization**: Solve the right problem before solving it fast
- **Analysis paralysis**: For reversible decisions, set a time limit then decide
- **Availability bias**: Don't over-weight recent experiences — check if this situation is actually similar
