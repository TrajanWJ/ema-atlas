# Code Review Prompt

Sources: [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code), [ChrisWiles/claude-code-showcase](https://github.com/ChrisWiles/claude-code-showcase), [trailofbits/claude-code-config](https://github.com/trailofbits/claude-code-config), [baz-scm/awesome-reviewers](https://github.com/baz-scm/awesome-reviewers)

**When to use**: After writing or modifying any code. Mandatory before commits.

---

## Prompt

Review the following code changes systematically. Only flag issues where confidence exceeds 80%. Skip unchanged code unless it has critical security issues.

**Changes**: `[git diff, PR diff, or code to review]`

### Review Process

1. **Gather context** — Read the full diff, identify scope and file relationships
2. **Read surrounding code** — Understand the context around changed lines
3. **Apply checklist** — Systematic evaluation across all categories
4. **Report findings** — Severity-classified with concrete fixes

### Severity Tiers

#### CRITICAL — Must Block Merge
Security vulnerabilities and data integrity risks. These are non-negotiable.
- Hardcoded credentials or secrets (API keys, passwords, tokens in source)
- SQL/NoSQL injection patterns (string concatenation in queries)
- XSS vulnerabilities (unsanitized output, `dangerouslySetInnerHTML` without DOMPurify)
- Path traversal risks (user input in file paths)
- Authentication/authorization bypasses
- Sensitive data in logs, error messages, or client-side state
- Unvalidated Server Action inputs
- Missing auth checks on API routes or Server Actions

#### HIGH — Strong Request for Changes
Code quality issues that cause bugs, technical debt, or maintenance burden.
- Functions exceeding 50 lines
- Files exceeding 800 lines
- Nesting deeper than 4 levels
- Unhandled errors or swallowed exceptions (`catch {}` with no handling)
- State mutation (use immutable patterns)
- Debug/console logging left in production code
- Missing tests for new behavior
- Dead code (unreachable branches, unused exports)
- Race conditions in async code (missing `await`, parallel mutations)
- Type assertions (`as any`, `as unknown as X`) that bypass type safety

#### MEDIUM — Request Changes or Accept with Comment
Performance and correctness concerns that affect user experience.
- N+1 query patterns
- Unbounded queries (missing LIMIT/pagination)
- Missing pagination on list endpoints
- Unnecessary re-renders (missing memo, unstable references in deps)
- Missing caching for expensive operations
- Algorithmic inefficiency (O(n^2) where O(n) is possible)
- Missing loading/error/empty states in UI
- Unhandled Promise rejections

#### LOW — Suggestions (Non-Blocking)
Style, documentation, and best-practice improvements.
- Naming clarity (vague variable names, abbreviations)
- Documentation gaps on public APIs or exported functions
- Inconsistency with existing patterns in the codebase
- Import organization
- Magic numbers without named constants
- Overly clever code that sacrifices readability

### TypeScript-Specific Patterns to Flag

| Pattern | Issue | Fix |
|---------|-------|-----|
| `any` type | Disables type checking | Use specific type or `unknown` |
| `as` type assertion | Bypasses compiler | Use type guards or narrowing |
| `!` non-null assertion | Hides null risks | Use optional chaining or guards |
| `// @ts-ignore` | Suppresses real errors | Fix the underlying type issue |
| Missing return types on exports | Breaks API contracts | Add explicit return types |
| `enum` (numeric) | Runtime cost, bundle bloat | Use `as const` objects or union types |

### React/Next.js-Specific Checks

| Area | What to Check |
|------|---------------|
| Dependency arrays | Missing deps in `useEffect`/`useMemo`/`useCallback` |
| Render-time side effects | State updates during render, direct DOM manipulation |
| List rendering | Missing or non-unique `key` props |
| Prop drilling | Props passing through 3+ levels (use context or composition) |
| Client/Server boundary | `"use client"` only where needed, no server-only imports in client |
| Loading states | Every async operation has loading, error, and empty states |
| Server Actions | Input validation, auth checks, error handling |
| Image optimization | Using `next/image` instead of `<img>`, proper sizing |

### Node.js/Backend Checks

| Area | What to Check |
|------|---------------|
| Input validation | All user input validated with Zod/Valibot before use |
| Rate limiting | Public endpoints have rate limits |
| Timeouts | External calls have explicit timeouts |
| Error leakage | No stack traces or internal details in API responses |
| CORS | Explicit origin allowlist, not `*` |
| Environment | No `process.env` access outside config files |

### AI-Generated Code Addendum
When reviewing machine-generated changes, additionally check:
- Behavioral regression (does it still do what the old code did?)
- Security assumptions (does it trust input it shouldn't?)
- Architectural coupling (does it introduce unnecessary dependencies?)
- Unnecessary complexity (gold-plating that increases maintenance cost)
- Hallucinated APIs (calling functions/methods that don't exist)
- Over-abstraction (premature generic patterns for a single use case)

### Output Format

| File:Line | Severity | Issue | Fix |
|-----------|----------|-------|-----|
| ... | CRITICAL | ... | ... |

**Verdict**: Approve / Request Changes / Block

Summary: X critical, Y high, Z medium, W low

If blocking: list specific items that must be resolved before re-review.
