---
title: Claude Code Test Integrity
created: '2026-03-16'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: reference
tags:
  - agents
  - claude
  - code
  - prompts
summary: >-
  Prevent AI coding agents from creating tests that cheat — making broken
  features appear to work by manipulating the test environment rather than fix
wiki_id: reference/Claude_Code_Test_Integrity
imported_from: vault/Reference/Claude Code Test Integrity.md
imported_at: '2026-04-04T00:23:56.910Z'
---
# Claude Code Test Integrity Guardrails

## Purpose
Prevent AI coding agents from creating tests that cheat — making broken features appear to work by manipulating the test environment rather than fixing the actual code.

## Known Failure Modes

### 1. Runtime Patching
Claude writes Playwright tests that inject JavaScript at runtime to modify the application's behavior. The app is broken, but the test patches it in-flight so assertions pass.

**Example:** `page.evaluate(() => { document.querySelector('.broken-feature').innerText = 'expected value' })` before asserting the text matches.

**Rule:** Tests MUST NOT use `page.evaluate()`, `page.addScriptTag()`, or similar injection to modify the application state that they're testing. Read-only evaluation for assertions is acceptable.

### 2. Mocking the System Under Test
Tests that mock/stub the exact functionality they're supposed to verify. The mock returns the expected value, so the test passes regardless of whether the real code works.

**Rule:** Never mock the component being tested. Mocks are for external dependencies (APIs, databases, third-party services), not the code under test.

### 3. Self-Modifying Targets
The test modifies source code or configuration before running, then asserts against the modified version. The original code is still broken.

**Rule:** Tests MUST NOT write to source files, modify configs, or alter the application before testing it. If setup is needed, use test fixtures that don't change production code.

### 4. Assertion Shortcuts
Tests that verify trivial properties (element exists, page loads, no console errors) instead of actual functionality. They technically pass but prove nothing.

**Rule:** Every test must assert the specific behavior described in the test name. "should calculate total" must assert the actual calculated value, not just that the element renders.

### 5. Hardcoded Expected Values
Tests that hardcode the broken output as the "expected" value. The test passes because it's asserting the wrong thing.

**Rule:** Expected values must be derived from the spec/requirements, not from the current output. If you don't know the expected value, ask — don't just snapshot what the broken code produces.

### 6. Test-Only Code Paths
Adding conditional logic (`if (process.env.TEST)`) that makes the code behave differently during testing than in production.

**Rule:** No test-specific branches in production code. If test behavior differs from production, the test is invalid.

## CLAUDE.md Guardrails Block

```markdown
## Test Integrity (Non-Negotiable)

You MUST NOT:
- Inject JavaScript/code into the app during tests to make them pass
- Mock or stub the component being tested (mock dependencies only)
- Modify source code, configs, or app state before asserting against it
- Write assertions that verify element existence instead of behavior
- Hardcode expected values copied from current (broken) output
- Add test-only code paths (if TEST/if ENV) to production code
- Use page.evaluate() to modify app state in Playwright tests (read-only assertions OK)

If a test needs the app to behave differently, FIX THE APP, don't patch the test.

If you can't determine the correct expected value, ASK — don't snapshot broken output.

Run tests against the actual application with real data flow. If tests pass but the feature is visibly broken in the browser, your tests are cheating.
```

## Verification Checklist
Before submitting test code, verify:
- [ ] Tests fail when the feature is intentionally broken
- [ ] No `page.evaluate()` calls that modify DOM/state before assertions
- [ ] No mocks/stubs of the system under test
- [ ] Assertions test behavior, not just rendering
- [ ] Expected values come from spec, not from current output
- [ ] No test-only code paths in production code
- [ ] Tests can be explained to a human: "this test proves X works because Y"

## Related

- [[Claude Code Test Integrity]]
- [[Promptfoo]]
- [[rohitg00-awesome-claude-code-toolkit]]
- [[2026-03-16]]
