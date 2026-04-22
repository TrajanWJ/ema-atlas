---
type: agent-learning
wiki_id: agents/Host-Context/Conventions/Coding_Standards
imported_from: vault/Agents/Host-Context/Conventions/Coding Standards.md
imported_at: '2026-04-04T00:23:56.624Z'
tags: []
summary: ''
---
# Coding Standards

Sources: [trailofbits/claude-code-config](https://github.com/trailofbits/claude-code-config), [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html), [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript), [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## Core Philosophy

- **No speculative features** — Do not add flags, configuration, or abstractions without an active user need
- **No premature abstraction** — Wait until code repeats three times before abstracting
- **Clarity over cleverness** — Prioritize readable, explicit code over elegant but opaque solutions
- **Justify dependencies** — Each adds attack surface and maintenance burden
- **Replace, don't deprecate** — Remove old implementations entirely when superseded; no backward-compatible shims
- **Finish the job** — Handle visible edge cases, clean up touched areas, flag adjacent issues
- **Bias toward action** — Decide quickly on reversible choices; ask before committing to interfaces or destructive operations

## Hard Limits

| Metric | Limit |
|--------|-------|
| Function length | 50 lines max |
| Cyclomatic complexity | 8 max |
| Parameters | 5 positional max (use options object beyond 3) |
| Line width | 100 characters (except URLs and template strings) |
| File length | 800 lines max (target 200-400) |
| Nesting depth | 4 levels max |
| Imports | Absolute only (no relative `..` paths beyond one level) |
| React component props | 8 max (split component if exceeded) |

## Zero Warnings Policy

Address every warning from linters, type checkers, compilers, and tests. Use inline ignores with justification comments only when truly unfixable. Never leave warnings unaddressed.

---

## TypeScript Rules

### Strict Mode — Non-Negotiable
Enable all strict compiler options. Every `tsconfig.json` must include:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Type Safety
- **No `any`** — Use `unknown` for truly opaque values, then narrow with type guards
- **No type assertions (`as`)** unless accompanied by a justification comment — they bypass compiler checks with no runtime validation
- **No non-null assertions (`!`)** — Use optional chaining (`?.`) or explicit null checks
- **Discriminated unions over type assertions** — Model state variants explicitly:
  ```typescript
  // GOOD: discriminated union
  type Result = { status: 'success'; data: User } | { status: 'error'; message: string };

  // BAD: type assertion
  const user = response as User;
  ```
- **Use `readonly`** on properties not reassigned after construction
- **Use `satisfies`** for type checking without widening: `const config = { ... } satisfies Config`
- **No enums** — Use `as const` objects or string literal unions instead

### Null Handling
- Prefer optional fields (`field?: Type`) over union types (`field: Type | undefined`)
- Never include `| null` or `| undefined` in type aliases — add at usage sites only
- Use nullish coalescing (`??`) over logical OR (`||`) for defaults

---

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files (components) | `PascalCase.tsx` | `UserProfile.tsx` |
| Files (utilities) | `camelCase.ts` | `formatDate.ts` |
| Files (types) | `camelCase.ts` or `types.ts` | `user.types.ts` |
| Files (tests) | `*.test.ts(x)` | `UserProfile.test.tsx` |
| Files (hooks) | `use*.ts` | `useAuth.ts` |
| Components | `PascalCase` | `UserProfile` |
| Hooks | `useCamelCase` | `useAuthStatus` |
| Types / Interfaces | `PascalCase` | `UserProfile`, `ApiResponse` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Variables / Functions | `camelCase` | `getUserById` |
| CSS classes (custom) | `kebab-case` | `card-header` |
| Route segments | `kebab-case` | `/user-settings` |

- No `I` prefix on interfaces (`User`, not `IUser`)
- No `T` prefix on types (`Props`, not `TProps`)
- Boolean variables/props: prefix with `is`, `has`, `should`, `can` (`isLoading`, `hasError`)

## Import Ordering

Enforce consistent ordering with blank lines between groups:

```typescript
// 1. React / framework
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. External libraries
import { z } from 'zod';
import clsx from 'clsx';

// 3. Internal aliases (@/)
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

// 4. Relative imports (same feature only)
import { validateForm } from './utils';
import type { FormProps } from './types';

// 5. Type-only imports (use `import type` always)
import type { User } from '@/types/user';

// 6. Styles / assets
import './styles.css';
```

- Always use `import type` for type-only imports
- No default exports (except Next.js pages/layouts which require them)
- Prefer named exports for discoverability and refactor safety

---

## React Patterns

### Component Structure
Order elements within a component file consistently:
1. Type definitions (Props, local types)
2. Component function
3. Hooks (all hooks at the top of the function body)
4. Derived state / computations
5. Event handlers
6. Effects
7. Return (JSX)

### Hooks Rules
- Never call hooks conditionally or inside loops
- Extract custom hooks when logic is reused or complex (>10 lines of hook logic)
- Name custom hooks `useXxx` — this enables the linter rules
- `useEffect` must have a cleanup function when subscribing to anything
- Prefer `useMemo` / `useCallback` only when there is a measured performance issue — not by default

### Component Patterns
- **Composition over props drilling** — Use children and render props
- **Keep components pure** — Same props must produce same output
- **Single responsibility** — A component does one thing. If it has "and" in its description, split it
- **Controlled components** for forms — Lift state to the form level
- **Use `key` prop correctly** — Never use array index as key for dynamic lists

### State Management Decision
1. **Local state** (`useState`) — UI-only state within one component
2. **Lifted state** — Shared between siblings, lift to nearest common parent
3. **Context** — Truly global, rarely-changing state (theme, auth, locale)
4. **Zustand / external store** — Complex client state with many consumers
5. **Server state** (TanStack Query / SWR) — Data from APIs, with caching

Context is not a state manager. Do not put frequently-changing values in Context — it re-renders every consumer.

---

## Next.js Conventions

### Server vs Client Components
- **Default to Server Components** — They run on the server, reduce bundle size, and access data directly
- **Use `'use client'` only when needed** — Interactivity, browser APIs, hooks like `useState`/`useEffect`
- **Keep `'use client'` as low in the tree as possible** — Wrap only the interactive leaf, not the parent
- **Never import server-only code into client components**

### App Router Patterns
- Use `page.tsx` for route UI, `layout.tsx` for persistent wrappers, `loading.tsx` for Suspense fallbacks
- Co-locate route-specific components in the route folder
- Use Route Groups `(groupName)` for organization without affecting URLs
- Data fetching: use `async` Server Components with direct `fetch()` or database access
- Revalidation: prefer `revalidate` export or `revalidateTag()` over client-side refetching
- Validate all inputs with Zod in Server Actions

### Data Fetching Strategy
| Method | When |
|--------|------|
| Server Component `fetch` | Default for server-rendered data |
| Server Actions | Form submissions, mutations |
| Route Handlers (`route.ts`) | Webhooks, external API endpoints |
| Client-side (TanStack Query) | Real-time data, optimistic UI |

---

## Tailwind CSS Conventions

- **Utility-first always** — Write utilities in JSX, extract to components (not `@apply`)
- **Use design tokens** — Never use arbitrary values (`bg-[#1a2b3c]`) when a design token exists (`bg-primary`)
- **Consistent utility ordering** — Follow box model: layout → spacing → sizing → typography → colors → effects
  ```
  className="flex items-center gap-4 p-4 w-full text-sm text-gray-700 bg-white rounded-lg shadow-sm"
  ```
- **Use `cn()` or `clsx()`** for conditional classes — Never string concatenation
- **Responsive: mobile-first** — Base styles for mobile, `sm:` / `md:` / `lg:` for larger
- **Dark mode** — Use `dark:` variant consistently, define both modes for all custom colors
- **No `@apply` in CSS files** — Extract to React components instead

---

## Code Comments and Structure

- Code must be self-documenting
- Delete commented-out code entirely
- Comments explain WHY, not WHAT — refactor if you need to explain what code does
- Public APIs get Google-style docstrings on non-trivial functions

## Error Handling

- Fail fast with clear, actionable messages
- Never silently swallow exceptions
- Include context: what operation, what input, suggested fix
- UI-facing code requires user-friendly messaging
- Server-side code needs detailed logging with context

## Immutability

- ALWAYS create new objects, NEVER mutate existing ones
- Prevents hidden side effects, simplifies debugging, supports safe concurrent operations
- Use spread operators and immutable patterns consistently

## Input Validation

- ALWAYS validate at system boundaries before processing
- Use Zod for schema-based validation in TypeScript projects
- Reject invalid data immediately with transparent error messages
- Treat all external sources (APIs, user input, files) as untrusted

## File Organization

- Favor many focused files over few monolithic ones
- Organize code by feature or domain, not by type
- Keep related code close together

---

## Quality Checklist

Before completing any work, verify:
- [ ] Readable code with clear naming
- [ ] Functions under 50 lines
- [ ] Files under 800 lines
- [ ] Nesting depth under 4 levels
- [ ] Comprehensive error handling
- [ ] No hardcoded values (use constants/config)
- [ ] Immutable patterns applied consistently
- [ ] All linter/type-checker warnings resolved
- [ ] No `any` types without justification comment
- [ ] `import type` used for all type-only imports
- [ ] Component props under 8
- [ ] Tailwind utilities use design tokens, not arbitrary values
