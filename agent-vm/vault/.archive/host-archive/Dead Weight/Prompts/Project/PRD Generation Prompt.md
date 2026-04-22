# PRD Generation Prompt

Sources: [Wirasm/PRPs-agentic-eng](https://github.com/Wirasm/PRPs-agentic-eng), [sdi2200262/agentic-project-management](https://github.com/sdi2200262/agentic-project-management)

**When to use**: Starting a new feature or project. Creating a formal specification before implementation.

---

## Prompt

Generate a Product Requirements Document (PRD) with implementation phases for agent consumption. This is a PRP (Production Ready Packet) — it must contain everything an AI agent needs to ship production-ready code.

**Feature**: `[describe the feature]`
**User Problem**: `[what problem does this solve?]`

### PRD Structure

#### 1. Overview
- **Problem Statement**: What user need does this address?
- **Proposed Solution**: High-level description
- **Success Metrics**: How we'll measure success (quantified where possible)
- **Scope**: What's in, what's explicitly out
- **Non-Goals**: Things this feature intentionally does NOT do (prevents scope creep)

#### 2. User Stories

Write user stories with testable acceptance criteria using Given/When/Then:

```
US-001: [Short Title]
As a [role], I want to [action], so that [benefit].

Acceptance Criteria:
- [ ] Given [context/precondition],
      when [user action],
      then [expected result]
- [ ] Given [edge case context],
      when [user action],
      then [error handling behavior]
- [ ] Given [auth context],
      when [unauthorized user attempts action],
      then [access denied with appropriate message]
```

**User story quality checklist:**
- Each story is independently valuable (not just a subtask)
- Acceptance criteria are testable (can write an automated test for each)
- Error cases and edge cases are included as acceptance criteria
- Auth/permission scenarios are covered
- Stories are ordered by priority (must-have, should-have, nice-to-have)

#### 3. Technical Requirements

**Architecture Changes:**
- Components to create or modify (exact file paths)
- Data model changes (schema additions, migrations)
- API contracts with request/response shapes:

```typescript
// Example API contract
POST /api/[resource]
Request: { field: string; optional?: number }
Response: { id: string; created_at: string }
Errors: 400 (validation), 401 (unauthorized), 409 (conflict)
```

**External Integrations:**
- Third-party services with API versions
- Authentication requirements
- Rate limits and fallback behavior

**Performance Requirements:**
- Response time targets (p50, p95, p99)
- Throughput requirements
- Bundle size budget (if frontend)

**Technical Constraints:**
- Must use existing patterns (specify which)
- Framework version constraints
- Browser/environment support requirements

#### 4. Implementation Phases

| Phase | Description | Status | Parallel? | Dependencies | Est. Points |
|-------|-------------|--------|-----------|--------------|-------------|
| 1 | Foundation setup | pending | no | none | 3 |
| 2 | Core logic | pending | yes | Phase 1 | 5 |
| 3 | Integration | pending | no | Phase 2 | 5 |
| 4 | Polish and docs | pending | yes | Phase 3 | 2 |

#### 5. Agent-Critical Context (PRP Additions)
- **Precise file paths** for all files to create/modify
- **Library versions** to use (pinned, not ranges)
- **Code examples** from the existing codebase showing patterns to follow
- **Executable validation commands**: lint, typecheck, test commands
- **Bounded scope**: Each phase must complete in one agent loop
- **Reference implementations**: "Follow the pattern in `src/app/api/auth/route.ts`"

#### 6. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation | Contingency |
|------|-----------|--------|------------|-------------|
| Technical risk | H/M/L | H/M/L | Prevention strategy | If it happens, do X |
| Scope risk | H/M/L | H/M/L | Containment plan | Defer to phase N+1 |
| Timeline risk | H/M/L | H/M/L | Buffer allocation | Scope reduction options |

#### 7. Open Questions
Items needing stakeholder input before implementation can begin. For each:
- **Question**: What needs to be decided?
- **Impact**: What is blocked by this question?
- **Default**: What will we assume if no answer by [date]?

### Output
Store as `.claude/PRPs/prds/[feature-name]-prd.md` with implementation phases tracked inline. Link from the project note in `Trajan's Projects/`.
