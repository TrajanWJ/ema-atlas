# Context Synthesis Prompt

Sources: [sdi2200262/agentic-project-management](https://github.com/sdi2200262/agentic-project-management)

**When to use**: Starting a new project, onboarding to existing work, or building an implementation plan from discovery. Uses a structured multi-round discovery process.

---

## Prompt

Gather comprehensive context about this project through a structured four-round discovery process. Prioritize clarity and sufficiency for task breakdown, not exhaustive interrogation.

**Project**: `[project name or description]`

### Internal Tracking
Throughout discovery, track:
- Complex aspects requiring careful breakdown
- Uncertainty areas needing investigation
- Sequential workflows vs. parallel work streams
- Dependencies and skill boundaries
- External dependencies and bottlenecks
- Deliverable scale and timeline constraints
- Risk areas and quality standards
- Tool preferences and technical requirements

### Round 1: Existing Material and Vision

**Goal**: Understand the project foundation — what exists, what's planned.

- What is the deliverable? (app, library, service, documentation, etc.)
- What existing materials exist? (PRD, specs, code, templates, designs)
- What is the current vision and plan?
- What are the important files and documentation?

**Discovery commands (if codebase exists):**
```bash
# Project overview
cat README.md 2>/dev/null
cat package.json 2>/dev/null | jq '{name, description, scripts}'
ls -la .claude/ .github/ docs/ 2>/dev/null

# Existing PRDs or specs
find . -name '*prd*' -o -name '*spec*' -o -name '*requirements*' 2>/dev/null | grep -v node_modules
```

**Completion check**: Do I understand the project foundation, existing context, vision, and material structure?

### Round 2: Targeted Inquiry

**Goal**: Understand constraints, structure, and execution requirements.

Draw from:
- **Project purpose**: What problem does this solve? For whom? What does success look like?
- **Work structure**: What are the major work streams? What depends on what?
- **Environment**: What tech stack? What tools? What CI/CD?
- **Execution needs**: Solo developer or team? Agent-assisted? What roles?
- **Technical constraints**: Performance requirements? Browser support? API contracts?
- **Platform and access**: What services? What accounts? What infrastructure?
- **Timeline and risk**: Deadlines? Hard constraints? Known risks?

**Key questions to resolve:**
- What is the MVP vs. the full vision?
- What are the non-negotiable quality standards?
- What decisions have already been made (and shouldn't be revisited)?
- What decisions are still open?

**Completion check**: Do I understand work structure, technical constraints, environment, process preferences, risks, and resources?

### Round 3: Requirements and Process

**Goal**: Understand how work gets done — patterns, validation, coordination.

- Workflow patterns and validation approaches
- Quality standards and consistency requirements
- Technical constraints and coordination requirements
- Reference materials and existing patterns to follow
- Testing strategy (TDD? Integration tests? E2E? What tools?)
- Code review process (human review? Agent review? Both?)
- Deployment process (CI/CD pipeline? Manual? Feature flags?)

**Completion check**: Do I understand process requirements, implementation preferences, coordination needs, standards, and reference materials?

### Round 4: Final Validation

**Goal**: Confirm understanding and identify gaps before proceeding.

Present comprehensive summary covering:
- Work domains and complexity levels
- Critical dependencies and sequencing
- Implementation preferences
- Complex/risky aspects
- External coordination requirements

**Summary format:**
```
## Project Context Summary

### What We're Building
[1-2 sentence description]

### Work Domains
1. [Domain A] — complexity: [L/M/H], dependencies: [none / Domain B]
2. [Domain B] — complexity: [L/M/H], dependencies: [none / Domain A]

### Key Decisions Made
- [Decision 1]: [choice made and rationale]

### Open Questions
- [Question 1]: blocks [what], default assumption: [assumption]

### Risk Areas
- [Risk 1]: likelihood [H/M/L], mitigation: [approach]

### Quality Standards
- [Standard 1]: [how to verify]
```

Request explicit feedback before proceeding.

### Round Completion Protocol
After each round, state:
> "Round [X] understanding complete. Ready to proceed to Round [X+1] because: [reasoning]. No additional follow-ups needed because: [specific gaps filled]."

If gaps remain, ask targeted questions (maximum 3 per round) before advancing.

### Output
Synthesized project context document suitable for creating an [[Implementation Planning Prompt|Implementation Plan]] or [[Task Breakdown Prompt|Task Breakdown]].
