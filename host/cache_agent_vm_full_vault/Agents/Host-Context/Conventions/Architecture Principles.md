# Architecture Principles

> **Last reviewed:** 2026-04-12 — No changes needed. Principles remain current.

Sources: [trailofbits/claude-code-config](https://github.com/trailofbits/claude-code-config), [Next.js Docs](https://nextjs.org/docs), [React Docs](https://react.dev)

---

## Five Pillars

1. **Modularity** — Single responsibility, clear interfaces between components
2. **Scalability** — Horizontal design, efficient queries, stateless where possible
3. **Maintainability** — Organized code, self-documenting, minimal cognitive load
4. **Security** — Defense in depth at every layer
5. **Performance** — Correct algorithms and data structures by default; profile before micro-optimizing

---

## Feature-Based Directory Structure

Organize by feature, not by file type. Each feature is a self-contained module:

```
src/
├── app/                    # Next.js App Router (routes only)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── _components/    # Route-specific components
│   └── layout.tsx
├── features/               # Feature modules
│   ├── auth/
│   │   ├── components/     # Feature components
│   │   ├── hooks/          # Feature hooks
│   │   ├── utils/          # Feature utilities
│   │   ├── types.ts        # Feature types
│   │   └── index.ts        # Public API (barrel export)
│   └── users/
│       ├── components/
│       ├── hooks/
│       ├── api/            # API calls for this feature
│       ├── types.ts
│       └── index.ts
├── components/             # Shared UI components only
│   └── ui/                 # Design system primitives
├── hooks/                  # Shared hooks only
├── lib/                    # Shared utilities, config
├── types/                  # Global type definitions
└── test/                   # Test setup, global fixtures
```

### Rules
- Features export through `index.ts` — other features import from the barrel, never from internal paths
- Cross-feature imports must go through the public API
- If a component/hook is used by only one feature, it lives in that feature
- Shared code (`components/`, `hooks/`, `lib/`) is for genuinely reused code only

## Colocation Principle

Keep related files together. Tests, styles, and stories live next to their source:

```
features/auth/components/
├── LoginForm.tsx
├── LoginForm.test.tsx       # Test right next to source
├── LoginForm.stories.tsx    # Storybook story (if used)
└── loginForm.utils.ts       # Helper specific to this component
```

**Why**: Reduces cognitive overhead finding related files, makes feature extraction trivial, and deletion is clean (delete the folder, done).

---

## Dependency Inversion for Testability

Business logic should depend on abstractions, not concrete implementations:

```typescript
// Define the contract
interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

// Business logic depends on the interface
class UserService {
  constructor(private readonly users: UserRepository) {}

  async getUser(id: string): Promise<User> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundError(`User ${id} not found`);
    return user;
  }
}

// Test with a fake implementation — no mocking library needed
const fakeRepo: UserRepository = {
  findById: async (id) => id === '1' ? getMockUser() : null,
  save: async (user) => user,
};
```

Apply this pattern at every external boundary: databases, APIs, file systems, email services.

---

## Error Boundary Patterns (React)

### Component Error Boundaries
Wrap independent UI sections so one failure does not crash the whole page:

```typescript
// Granular boundaries — each section fails independently
<Layout>
  <ErrorBoundary fallback={<SidebarError />}>
    <Sidebar />
  </ErrorBoundary>
  <ErrorBoundary fallback={<MainContentError />}>
    <MainContent />
  </ErrorBoundary>
</Layout>
```

### Error Boundary Rules
- Place boundaries around **feature sections**, not individual components
- Never wrap the entire app in a single boundary (except as a last-resort catch-all)
- Provide **actionable fallback UI** — "Something went wrong" with a retry button, not a blank screen
- Log errors to a monitoring service in the `onError` callback
- Combine with Suspense boundaries: `<Suspense>` for loading, `<ErrorBoundary>` for errors

### Next.js Error Handling
- Use `error.tsx` files in route segments — they act as error boundaries for that route
- Use `global-error.tsx` for root layout errors only
- Use `not-found.tsx` for 404 states
- Server Action errors: return `{ error: string }` instead of throwing — let the client decide how to display

---

## State Management Decision Tree

Choose the simplest solution that fits. Escalate only when needed:

```
Is the state used by only one component?
  YES → useState / useReducer
  NO  ↓

Is it shared between a parent and a few children?
  YES → Lift state to common parent, pass via props
  NO  ↓

Does it change rarely? (theme, auth, locale)
  YES → React Context
  NO  ↓

Is it server data? (API responses, database records)
  YES → TanStack Query / SWR (server state manager)
  NO  ↓

Is it complex client state with many consumers?
  YES → Zustand (lightweight) or Redux (if already in project)
```

### Rules
- **Never put frequently-changing values in Context** — It re-renders every consumer on every change
- **Server state is not client state** — Use TanStack Query or SWR, not Redux, for API data
- **URL is state too** — Use search params for filter/sort/pagination state (shareable, bookmarkable)
- **Form state stays in the form** — Use controlled components or React Hook Form, not global state

---

## API Design Principles

### REST Conventions

| Method | Purpose | Idempotent | Body |
|--------|---------|------------|------|
| GET | Read resource(s) | Yes | No |
| POST | Create resource | No | Yes |
| PUT | Replace resource entirely | Yes | Yes |
| PATCH | Update resource partially | Yes | Yes |
| DELETE | Remove resource | Yes | No |

### URL Structure
- Nouns, not verbs: `/api/users`, not `/api/getUsers`
- Plural resources: `/api/users`, not `/api/user`
- Nested for relationships: `/api/users/:id/posts`
- Query params for filtering: `/api/users?role=admin&active=true`

### Consistent Response Format
```typescript
// Success
{ "data": { ... }, "meta": { "total": 42, "page": 1, "limit": 20 } }

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "Email is required", "details": [...] } }
```

- Always return appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 422, 500)
- Error responses include a machine-readable `code` and a human-readable `message`
- Paginated responses include `meta` with total count, current page, and limit
- Never return raw database errors to clients

### Validation
- Validate request bodies with Zod schemas
- Return 422 with field-level errors for invalid input
- Validate path parameters and query strings, not just bodies

---

## Design Patterns

### Repository Pattern
- Define standard operations: findAll, findById, create, update, delete
- Implementations manage storage specifics (DB, API, file, etc.)
- Business logic references abstract interface, not concrete storage
- Enables easy substitution and test mocking

### Frontend Patterns
- Component composition over inheritance
- Context for truly global state only
- Co-locate related logic (component + styles + tests)

### Backend Patterns
- Repository pattern for data access
- Event-driven architecture for loose coupling
- Middleware chains for cross-cutting concerns

## Implementation Order (PoC and Features)

1. Project layout and configuration
2. Framework/infrastructure layer
3. Database models and migrations
4. API endpoints and business logic
5. Testing
6. Frontend components

Always complete backend before starting frontend.

## Red Flags

- "Big Ball of Mud" — no clear boundaries between concerns
- Tight coupling — changing one module cascades to many others
- Premature optimization — solving performance problems that don't exist
- God objects — classes/modules doing too many things
- Circular dependencies — A depends on B depends on A
- Feature envy — a module reaching deep into another module's internals

## Scalability Roadmap Pattern

| Scale | Add |
|-------|-----|
| 0-10K users | Monolith, single DB, basic caching |
| 10K-100K | Redis caching, CDN, read replicas |
| 100K-1M | Service decomposition, message queues |
| 1M-10M | Microservices, event-driven, sharding |

## Code Review Priority Order

When reviewing, evaluate in this sequence:
1. **Architecture** — Does the overall design make sense?
2. **Code Quality** — Is it readable, maintainable, correct?
3. **Tests** — Are behaviors covered? Are tests meaningful?
4. **Performance** — Any obvious bottlenecks?
