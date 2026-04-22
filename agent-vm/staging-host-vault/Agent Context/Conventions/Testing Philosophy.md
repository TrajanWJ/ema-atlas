# Testing Philosophy

Sources: [trailofbits/claude-code-config](https://github.com/trailofbits/claude-code-config), [React Testing Library Docs](https://testing-library.com/docs/queries/about/), [Vitest Guide](https://vitest.dev/guide/)

---

## Core Principles

### Test Behavior, Not Implementation
Tests verify what code does, not how. A refactor that breaks tests but not functionality means the tests were wrong, not the code.

### Test Edges and Errors
Cover empty inputs, boundaries, malformed data, missing files, network failures. Every error path handled by code needs a test triggering it.

### Verify Tests Catch Failures
Break the code, confirm the test fails, then fix. Use mutation testing (`cargo-mutants`, `mutmut`) and property-based testing (`proptest`, `hypothesis`) when appropriate.

---

## Testing Pyramid

Distribute effort following the pyramid — more unit tests, fewer E2E:

```
        /  E2E  \          ~10% — Critical user journeys only
       /----------\
      / Integration \       ~20% — API routes, DB operations, component integration
     /----------------\
    /      Unit         \   ~70% — Pure logic, utilities, hooks, components
```

| Layer | Speed | Confidence | Cost to maintain |
|-------|-------|------------|------------------|
| Unit | Fast (ms) | Isolated logic | Low |
| Integration | Medium (s) | Cross-boundary | Medium |
| E2E | Slow (s-min) | Full user flow | High |

**Rule**: If you can test it at a lower level, do. Push tests down the pyramid.

---

## What to Test vs What Not to Test

### Always Test
- Business logic and data transformations
- User-facing component behavior (renders, interactions, state changes)
- Error handling paths and edge cases
- Custom hooks
- API request/response handling
- Form validation logic
- Access control / authorization checks

### Do Not Test
- Third-party library internals (they have their own tests)
- Implementation details (internal state, private methods, class names)
- Trivial code (simple passthrough, getters with no logic)
- Framework behavior (React rendering, Next.js routing)
- Exact CSS/styling (unless visual regression testing is set up)

---

## React Testing Library Patterns

### Query Priority
Use the most accessible query available. This order reflects how users find elements:

| Priority | Query | When to Use |
|----------|-------|-------------|
| 1 | `getByRole` | Almost everything — buttons, headings, links, inputs |
| 2 | `getByLabelText` | Form fields with associated labels |
| 3 | `getByPlaceholderText` | Only when no label exists |
| 4 | `getByText` | Non-interactive elements (paragraphs, spans) |
| 5 | `getByDisplayValue` | Inputs with current filled-in values |
| 6 | `getByAltText` | Images, areas |
| 7 | `getByTitle` | Rarely — title has limited accessibility support |
| 8 | `getByTestId` | **Last resort only** — users cannot see or hear test IDs |

### User-Event Over fireEvent
Always use `@testing-library/user-event` — it simulates real browser behavior including focus, blur, and keyboard events:

```typescript
import userEvent from '@testing-library/user-event';

it('submits the form', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.click(screen.getByRole('button', { name: 'Sign In' }));

  expect(screen.getByText('Welcome')).toBeInTheDocument();
});
```

### Testing Patterns
- Use `screen` for all queries — never destructure from `render()`
- Prefer `findBy*` (async) over `waitFor` + `getBy*`
- Use `within()` to scope queries to a container
- Test accessibility: if `getByRole` cannot find your element, your component has an accessibility problem

---

## Vitest Patterns

### Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',        // For React components
    globals: true,                // No need to import describe/it/expect
    setupFiles: './test/setup.ts',
    coverage: {
      provider: 'v8',
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
});
```

### Test Structure
```typescript
describe('UserService', () => {
  // Group by behavior, not by method
  describe('when creating a user', () => {
    it('saves the user with hashed password', async () => { ... });
    it('rejects duplicate emails with a clear error', async () => { ... });
    it('validates required fields before saving', async () => { ... });
  });
});
```

### Vitest-Specific Features
- `vi.fn()` for mock functions, `vi.spyOn()` for spying
- `vi.mock()` for module mocking — place at top of file (it hoists automatically)
- `vi.useFakeTimers()` for time-dependent code
- Use `test.each` for parameterized tests instead of loops:
  ```typescript
  test.each([
    { input: '', expected: false },
    { input: 'valid@email.com', expected: true },
    { input: 'no-at-sign', expected: false },
  ])('validates "$input" as $expected', ({ input, expected }) => {
    expect(isValidEmail(input)).toBe(expected);
  });
  ```

---

## Mock Boundaries

### What to Mock
- Network requests (use MSW — Mock Service Worker)
- File system operations
- Time and dates (`vi.useFakeTimers()`)
- External service SDKs
- Environment variables

### What NOT to Mock
- The module under test
- Pure utility functions
- Data transformations
- State management stores (test with real store)
- Database in integration tests (use test database)

### MSW Over Manual Mocks
Use [MSW](https://mswjs.io/) for API mocking — it intercepts at the network level so your fetch/axios code runs unchanged:
```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/users', () => HttpResponse.json([{ id: 1, name: 'Test' }])),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## Snapshot Testing Policy

- **Do not use snapshots for component output** — They break on every UI change and teach nothing
- **Acceptable uses**: Serialized data structures, API response schemas, error message formats
- **Always review snapshot changes** — Never blindly update with `--update`
- If a snapshot test fails, ask: "Would a specific assertion catch this better?" If yes, replace the snapshot

---

## Coverage Targets

| Metric | Minimum | What It Means |
|--------|---------|---------------|
| Statements | 80% | Lines of code executed |
| Branches | 80% | if/else/ternary paths taken |
| Functions | 80% | Functions called at least once |
| Lines | 80% | Physical lines executed |

Coverage tells you what code ran, not whether tests are good. 100% coverage with bad assertions is worse than 80% coverage with thoughtful tests.

**Focus coverage on**:
- Business logic modules (aim for 90%+)
- Utility functions (aim for 95%+)
- API route handlers (aim for 85%+)

**Accept lower coverage on**:
- UI layout components (visual testing is better)
- Generated code
- Configuration files

---

## TDD Workflow

```
1. Write test first (RED)
2. Run test — it should FAIL
3. Write minimal implementation (GREEN)
4. Run test — it should PASS
5. Refactor (IMPROVE)
6. Verify coverage (80%+)
```

Never write production code without a failing test.

## Factory Pattern for Test Data

Create `getMockX(overrides?: Partial<X>)` functions with sensible defaults and override capability:

```typescript
function getMockUser(overrides?: Partial<User>): User {
  return {
    id: 'test-id',
    name: 'Test User',
    email: 'test@example.com',
    ...overrides,
  };
}
```

## Test Organization

- Use `describe` blocks for grouping: Rendering, User interactions, Edge cases
- `beforeEach` should clear mocks between tests
- Descriptive test names reflecting actual behavior
- One assertion concept per test

## Anti-Patterns to Avoid

- Testing mock behavior instead of real behavior
- Duplicating test data (use factories instead)
- Testing implementation details (private methods, internal state)
- Overly broad assertions (`toBeTruthy()` when specific value expected)
- Tests that pass when code is broken
- Snapshot tests for component HTML output
- Mocking everything — if you mock more than you test, the test is worthless

## Troubleshooting Test Failures

1. Check test isolation — can it run independently?
2. Verify mocks are correct and reset between tests
3. Fix implementation, not tests (unless tests are wrong)
4. If 3+ fixes fail consecutively, STOP — this signals an architectural problem
