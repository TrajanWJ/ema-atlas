# Debugging Prompt

Sources: [ChrisWiles/claude-code-showcase](https://github.com/ChrisWiles/claude-code-showcase), [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)

**When to use**: Investigating bugs, test failures, runtime errors, regressions, intermittent failures.

---

## Core Rule

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.**

Never apply superficial patches that mask underlying issues. Never fix problems solely where errors appear — always trace to the original trigger.

## Prompt

Investigate and resolve the following issue using a systematic four-phase approach.

**Issue**: `[describe the bug, error message, or unexpected behavior]`

### Phase 1: Root Cause Investigation
1. Read the full error message carefully
2. Reproduce the issue consistently
3. Examine recent changes (git log, git diff)
4. Gather diagnostic evidence (logs, stack traces, state)
5. Trace the data flow:
   - Observe symptoms
   - Identify immediate cause
   - Map the call chain upward
   - Locate where the problem actually originated

**Diagnostic Tools by Context:**

| Context | Tool | Command/Usage |
|---------|------|---------------|
| Node.js runtime | Node inspector | `node --inspect src/index.ts` then chrome://inspect |
| Next.js server | Debug mode | `NODE_OPTIONS='--inspect' next dev` |
| React components | React DevTools | Components tab: props, state, hooks inspection |
| React re-renders | React DevTools Profiler | Record interaction, identify unnecessary renders |
| Network issues | Browser DevTools Network tab | Filter by XHR, check request/response payloads |
| Client-side state | Browser DevTools Console | `console.table()`, breakpoints, watch expressions |
| Database queries | Query logging | Enable query logging in ORM (Prisma: `log: ['query']`) |
| API endpoints | cURL/httpie | `curl -v http://localhost:3000/api/endpoint` |
| Build issues | Build output | `next build 2>&1 | tee build.log` |
| Memory leaks | Heap snapshots | Chrome DevTools Memory tab, compare snapshots |
| Performance | Lighthouse / Web Vitals | `npx lighthouse http://localhost:3000 --view` |

### Phase 2: Pattern Analysis
1. Find a working example of similar functionality
2. Compare implementations side-by-side
3. Identify differences between working and broken code
4. Map dependencies and their states

**Useful comparison commands:**
```bash
# Find when the bug was introduced
git bisect start
git bisect bad HEAD
git bisect good <last-known-good-commit>

# Compare file between commits
git diff <good-commit>..<bad-commit> -- path/to/file

# Search for similar patterns in codebase
grep -rn 'patternFromWorkingCode' --include='*.ts' --include='*.tsx'

# Check if the issue exists on main
git stash && git checkout main && # test && git checkout - && git stash pop
```

### Phase 3: Hypothesis and Testing
Apply scientific method:
1. Formulate ONE clear hypothesis
2. Design a minimal test (change single variable)
3. Predict the outcome
4. Run the test
5. Verify: does result match prediction?
6. If no: revise hypothesis and repeat

**Isolation techniques:**
- Comment out suspect code and replace with hardcoded known-good values
- Add strategic `console.log` with timestamps at each step of the flow
- Use React DevTools to force re-render specific components
- Test with minimal reproduction (strip away unrelated code)
- Check if issue is environment-specific (dev vs. prod, browser vs. Node)

### Phase 4: Implementation
1. Write a failing test that reproduces the bug
2. Implement a single fix addressing root cause
3. Verify the test passes
4. Run full test suite for regressions
5. Verify the fix in the actual application (not just tests)

## Critical Rules

- **Three-strike rule**: If 3+ fixes fail consecutively, STOP. This signals an architectural problem requiring a different approach, not more patching.
- Never rationalize "quick fix for now, investigate later"
- Never "just try things" without hypothesis-driven testing
- Always write a regression test before closing the bug
- If the fix is in a different file than the symptom, document the connection

## Common Scenarios

| Scenario | First Action | Key Tool |
|----------|-------------|----------|
| Test failure | Check test isolation, verify mocks match real behavior | Test runner with `--verbose` |
| Runtime error | Read full stack trace, check recent changes | `git log --oneline -20` |
| Regression | `git bisect` to find introducing commit | `git bisect` |
| Intermittent | Check race conditions, shared state, timing | Add logging with timestamps |
| Performance | Profile first, measure before/after | React Profiler, Lighthouse |
| Hydration mismatch | Check server vs. client render differences | Browser console, `suppressHydrationWarning` to confirm |
| Build failure | Read error from bottom up, check TypeScript strict mode | `tsc --noEmit` |
| Stale data | Check caching layers (Next.js cache, SWR, React Query) | `revalidatePath`/`revalidateTag` |
| CORS error | Check server CORS config, verify Origin header | Browser Network tab |
| 500 on deployed | Check server logs, env vars, DB connectivity | `vercel logs` or hosting provider logs |
