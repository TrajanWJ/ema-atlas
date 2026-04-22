---
date: 2026-03-29T00:00:00.000Z
tags:
  - ai
  - spec-driven-development
  - claude-code
  - cursor
  - aider
  - planning
  - research
type: research
wiki_id: research/AI-Knowledge/Research_-_AI_Spec-Driven_Development_Patterns_2026
imported_from: >-
  vault/Research/AI-Knowledge/Research - AI Spec-Driven Development Patterns
  2026.md
imported_at: '2026-04-04T00:23:56.979Z'
summary: ''
---

# Research: AI Spec-Driven Development Patterns 2026

> Practical patterns for writing specs that AI coding agents can execute — multi-session builds, frontend components, backend APIs, interactive behavior.

---

## Question

How do you write specifications that AI coding agents (Claude Code, Cursor, aider) can execute reliably across multi-session builds? What are the concrete structural patterns, templates, and techniques?

---

## Key Frameworks Surveyed

| Framework | Source | Model |
|---|---|---|
| Kiro (AWS) | kiro.dev | requirements.md → design.md → tasks.md |
| BMAD Method | github.com/bmad-code-org | Analyst → PM → Architect → SM → Dev agents |
| cc-sdd | github.com/gotalab | Kiro-style commands for Claude Code, Cursor, etc. |
| GitHub Spec Kit | github.blog | specify → plan → tasks → implement |
| Addy Osmani's guide | addyosmani.com | Three-tier boundary system + six-section CLAUDE.md |
| SoftwareSeni template | softwareseni.com | Component + API + error feedback loop templates |

---

## 1. Core Document Architecture

### The Three-File Spec Structure (Kiro / cc-sdd)

Every feature lives in `.kiro/specs/<feature-name>/`:

**`requirements.md`** — What and why, not how.
- User stories in EARS format (Easy Approach to Requirements Syntax)
- Acceptance criteria as testable statements
- Non-goals explicitly called out ("This is not a production platform")
- Example EARS patterns:
  - *While [precondition], the system shall [action]*
  - *When [trigger], the system shall [response]*
  - *The [feature] shall [capability]*

**`design.md`** — Technical architecture before any code.
- Mermaid sequence diagrams for data flow
- Component/module breakdown
- Data models and interfaces
- Integration contracts (what calls what)
- Key decisions and rationale

**`tasks.md`** — Atomic, dependency-tracked work items.
- Numbered checklist format
- Each task maps to a specific requirement
- Dependencies explicit (`blocked by: task 3`)
- Required vs optional flagged
- Acceptance criteria per task (not just per feature)

### Why This Works for Multi-Session Builds

The spec files persist across sessions. If Claude derails or context compacts, pinning the spec in a new chat lets it self-correct. The three-file structure creates natural checkpoints: approve requirements before design, approve design before tasks, approve tasks before implementation.

---

## 2. Making Sections Self-Contained and Independently Implementable

### Task Granularity Rule

The right grain: "implement UserRepository class with findById and save methods" — not "write a function" (too granular) and not "implement the data layer" (too broad). Each task should be completable in a single agent session and independently testable.

### Context Bundling Pattern

Each task must include all context needed to execute without referencing the overall spec:
```
Task 4: Implement POST /api/sessions endpoint
Depends on: Task 2 (User model), Task 3 (JWT utility)
Context: Users authenticate via email/password. Returns access token (15min) + refresh token (7 days) as HTTP-only cookies.
Acceptance: Unit tests for happy path, wrong password, nonexistent user, and rate limit exceeded (>5 attempts/15min).
Files to create: src/api/sessions.ts, src/api/sessions.test.ts
Files to modify: src/api/routes.ts (register route)
```

### Module Separation Pattern

Separate spec files per domain: `auth-spec/`, `payments-spec/`, `dashboard-spec/`. Feed only the relevant spec to the agent for each task. This prevents distraction and context overload — research confirms performance drops when models must satisfy many requirements simultaneously.

### Non-Goal Encoding

State what NOT to build explicitly. "Non-Goals: No email verification in v1, no OAuth, no remember-me" constrains scope and prevents agents from gold-plating.

---

## 3. Frontend Component Specs for AI Agents

### The 16-Field Component Framework (Romina Kavcic / Design System Guide)

Minimum viable component spec includes all of these:

| Field | Example |
|---|---|
| Design reference | Figma URL to exact frame |
| Visual inspiration | Links to 2-3 reference implementations |
| Visual properties | `color: var(--color-primary-600, #2563EB); hover: var(--color-primary-700)` |
| Token system | Where tokens live, how to reference, light/dark/high-contrast |
| Component identity | Type, name, application context, related components |
| State variations | All size × style × state combinations |
| Technical stack | `React 18.2+ functional components + hooks, Tailwind, CVA` |
| Structural details | Standalone or part of a system, dependencies |
| External requirements | Libraries to import vs recreate |
| Usage context | Where it appears, real-world examples, edge cases |
| Interactive behavior | State transitions, animation timing, user flows |
| Responsive strategy | Breakpoints, min touch targets (44×44px), layout changes |
| Accessibility requirements | ARIA attributes, keyboard nav, focus indicators |
| Deliverables | component file + test suite + Storybook stories |
| Documentation standards | Props table (type, default, description), do/don't |
| Reusable guidelines | Store in `.ai/` so all tools auto-follow |

### State Matrix Pattern

Document all states explicitly rather than assuming defaults:

```
Button states:
- default: bg-primary-600, text-white, cursor-pointer
- hover: bg-primary-700, shadow-md, transition-150ms ease-in-out
- active: bg-primary-800, scale-[0.98]
- focus-visible: outline-2 outline-offset-2 outline-primary-600
- disabled: bg-neutral-300, text-neutral-500, cursor-not-allowed
- loading: bg-primary-600 (same), spinner replacing label, pointer-events-none

Variants: primary | secondary | ghost | destructive
Sizes: sm (32px, 14px text) | md (40px, 16px text) | lg (48px, 18px text)
```

### Color Token Precision

Vague: "use the brand blue on hover"
Precise: "`color: var(--color-primary-600, #2563EB)`, applies to background in default state, changes to `var(--color-primary-700)` on hover, changes to `var(--color-primary-800)` on active"

The fallback hex value matters — agents can't always resolve CSS variables during generation.

---

## 4. Specifying Interactive Behavior, Animations, and State Transitions

### Timing as Data

Never describe animations in prose. Specify as machine-readable values:
```
Transition: opacity 0ms → 100% over 150ms ease-in-out on mount
Exit: opacity 100% → 0% over 100ms ease-out, translateY(0) → translateY(-4px)
Delay: 50ms before animating if trigger is user interaction; 0ms if programmatic
Reduced motion: respect prefers-reduced-motion — replace all transitions with instant show/hide
```

### State Machine Pattern

For complex interactive behavior, use an explicit state machine format:
```
States: idle | loading | success | error | disabled

Transitions:
  idle --[user submits form]--> loading
  loading --[API 200]--> success
  loading --[API 4xx/5xx]--> error
  loading --[timeout >10s]--> error
  error --[user retries]--> loading
  success --[3s timer]--> idle

Side effects:
  idle → loading: disable all inputs, show spinner, announce "Submitting..." to screen readers
  loading → success: show checkmark, announce "Saved successfully"
  loading → error: show error message, re-enable inputs, focus first error field
```

### Animation Vocabulary for AI Agents

Useful patterns to call by name (agents recognize these):
- `spring(stiffness: 300, damping: 30)` — physics spring
- `ease-in-out` / `cubic-bezier(0.4, 0, 0.2, 1)` — Material standard
- `fade-in` / `slide-up` / `scale-in` — name the pattern, then spec the values
- `layout animation` — when element dimensions/position change
- `shared element transition` — same element between views

### Playwright Validation Spec

For interactions where pixel-perfect matters, include a test expectation:
```
Verify: hovering the card lifts it by 4px (translateY(-4px)) with box-shadow expanding from 0px to 8px over 200ms.
Playwright: await expect(card).toHaveCSS('transform', 'translateY(-4px)') after hover
```

---

## 5. Backend API Specs for AI Implementation

### Endpoint Template (300-500 words per endpoint)

```markdown
## POST /api/users/authenticate

**Purpose:** JWT-based authentication for the REST API.

**Request:**
- Content-Type: application/json
- Body schema:
  - email: string, required, valid email format
  - password: string, required, min 8 chars

**Response (200):**
- Sets HTTP-only secure cookie: access_token (15min expiry)
- Sets HTTP-only secure cookie: refresh_token (7 days expiry)
- Body: { userId: string, email: string }

**Errors:**
- 400: Validation failure — { error: "VALIDATION_FAILED", fields: [...] }
- 401: Wrong credentials — { error: "INVALID_CREDENTIALS" } (same message for nonexistent user — do NOT distinguish)
- 429: Rate limited — { error: "RATE_LIMITED", retryAfter: number (seconds) }
- 500: Internal — { error: "INTERNAL_ERROR" } (no stack traces)

**Security requirements:**
- Bcrypt with 12 salt rounds minimum
- Rate limit: 5 attempts per 15 minutes per IP (use redis-based sliding window)
- No logging of passwords or tokens
- CORS: restrict to [allowed origins list]

**Test cases required:**
- Happy path: valid credentials → 200 + cookies set
- Wrong password → 401 (same error as nonexistent user)
- Nonexistent user → 401 (same error)
- Malformed email → 400 with field validation
- Rate limit hit → 429 with retryAfter
- DB down → 500 with no sensitive data
```

### Data Flow Documentation Pattern

Use Mermaid sequence diagrams in `design.md` for anything with >2 hops:
```
sequenceDiagram
  Client->>+API: POST /sessions {email, password}
  API->>+Redis: check rate limit key
  Redis-->>-API: count (< 5, proceed)
  API->>+DB: SELECT user WHERE email=?
  DB-->>-API: user record
  API->>API: bcrypt.compare(password, hash)
  API->>+Redis: increment rate limit key
  Redis-->>-API: ok
  API-->>-Client: 200 {cookies: [access, refresh]}
```

### OpenAPI-First Pattern

Write OpenAPI 3.1 YAML as the authoritative spec, then use the spec as the Claude Code prompt artifact. This gives Claude structured schema to follow and enables automated contract testing. Tools like Speakeasy have published skills specifically for this workflow.

---

## 6. Emerging Ecosystem Patterns (Claude Code / Cursor / aider)

### CLAUDE.md as Persistent Context

The single most impactful technique for multi-session Claude Code builds. Structure:
```markdown
## Commands
- build: npm run build
- test: npm test -- --run
- lint: npx biome check --write .

## Project Structure
- src/api/ — route handlers
- src/lib/ — utilities
- src/db/ — database layer

## Boundaries
- Always: run tests before marking a task complete
- Ask first: schema migrations, new dependencies
- Never: commit to main, modify .env files, touch vendor/

## Code Style
[One real code snippet showing the preferred pattern beats 3 paragraphs of prose]
```

### Parallel Subagent Pattern (for large builds)

Main orchestrator session stays lightweight. Each subagent gets a fresh context window with only the files it needs:
- Research agents (read-only, parallel)
- Implementation agents (one per feature, sequential within feature)
- One atomic commit per completed task

Session persistence: tasks stored in `.claude/tasks/{session-id}/` as JSON, enabling progress recovery across sessions.

### Pre-Implementation Interview Pattern

Before any code, use a structured clarification phase:
```
"Use the AskUserQuestion tool to surface all ambiguities in this spec before we write a single line of code.
Check: requirements completeness, technical approach assumptions, boundary cases not covered,
dependencies not yet defined. Deliver a list of blocking questions ordered by priority."
```

### Planning Mode Gate

Use Claude Code's plan mode (read-only) to force spec analysis before implementation. Exit planning mode only when the spec passes review. This prevents agents from starting to code before understanding the full system.

### Steering File Pattern (Kiro)

Persistent project context that survives across all sessions:
- `product.md` — what the product is, who uses it, core domain concepts
- `tech-stack.md` — exact versions, conventions, anti-patterns to avoid
- `structure.md` — file organization map

These are not task specs — they're ambient context that loads automatically. Equivalent to CLAUDE.md for projects that don't use Claude Code.

### Error Feedback Loop

When a generated implementation fails, feed the failure back into the spec rather than just the prompt:
```markdown
## Spec Revision Log

### v1.2 — 2026-03-15
Error: Rate limiting silently swallowed Redis connection failures, allowing unlimited auth attempts.
Root cause: Spec said "use Redis rate limiting" but didn't specify behavior when Redis is unavailable.
Fix: Added: "If Redis is unreachable, fail-open (allow request) and log WARN. Do not fail auth silently."
```

---

## Recommendation

The Kiro three-file structure (requirements → design → tasks) is the strongest pattern for multi-session Claude Code builds. It maps cleanly to Claude Code's existing subagent and task tools, enables per-task context bundling, and creates natural human review gates.

For frontend component specs, the 16-field framework is comprehensive but heavyweight. A practical minimum: Figma URL, state matrix, color tokens with hex fallbacks, animation timing as CSS values, and a Playwright expectation for the primary interaction.

For backend APIs: write the OpenAPI 3.1 schema first. Use it as the Claude Code prompt artifact. The schema is already in the structured format agents handle best.

Confidence: high on structural patterns. Medium on pixel-perfect frontend tooling — this area is moving fast (Cursor Visual Editor, GPT-5.4 frontend tools) and the best practices are still settling.

---

## Sources

- [Using spec-driven development with Claude Code — Heeki Park](https://heeki.medium.com/using-spec-driven-development-with-claude-code-4a1ebe5d9f29)
- [Spec-Driven Development with Claude Code — Artur Less](https://levelup.gitconnected.com/spec-driven-development-with-claude-code-1b08184965e3)
- [Spec-Driven Development with Claude Code in Action — alexop.dev](https://alexop.dev/posts/spec-driven-development-claude-code-in-action/)
- [How to write a good spec for AI agents — Addy Osmani](https://addyosmani.com/blog/good-spec/)
- [How to write a good spec for AI agents — O'Reilly Radar](https://www.oreilly.com/radar/how-to-write-a-good-spec-for-ai-agents/)
- [Spec-driven development: Unpacking 2025's key new practice — Thoughtworks](https://www.thoughtworks.com/en-us/insights/blog/agile-engineering-practices/spec-driven-development-unpacking-2025-new-engineering-practices)
- [Spec-driven development with AI: GitHub Spec Kit](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- [Kiro Specs Documentation](https://kiro.dev/docs/specs/)
- [Kiro Specs Best Practices](https://kiro.dev/docs/specs/best-practices/)
- [cc-sdd: Kiro-style commands for Claude Code and others](https://github.com/gotalab/cc-sdd)
- [BMAD Method — Reclaiming Control in AI Dev — Benny Cheung](https://bennycheung.github.io/bmad-reclaiming-control-in-ai-dev)
- [BMAD-METHOD GitHub](https://github.com/bmad-code-org/BMAD-METHOD)
- [The Ultimate AI Component Generation Framework — Design System Guide](https://learn.thedesignsystem.guide/p/the-ultimate-ai-component-generation)
- [Spec-Driven Development 2025 Complete Guide — SoftwareSeni](https://www.softwareseni.com/spec-driven-development-in-2025-the-complete-guide-to-using-ai-to-write-production-code/)
- [Spec-Driven Development with Claude Code — Navin Varma](https://www.nvarma.com/blog/2026-03-01-spec-driven-development-claude-code/)
- [AI-ready frontend architecture — LogRocket](https://blog.logrocket.com/ai-ready-frontend-architecture-guide/)
- [OpenAPI Design Claude Code Skill — MCP Market](https://mcpmarket.com/tools/skills/openapi-design)
- [Comprehensive Guide: Kiro, GitHub Spec Kit, BMAD — Vishal Mysore](https://medium.com/@visrow/comprehensive-guide-to-spec-driven-development-kiro-github-spec-kit-and-bmad-method-5d28ff61b9b1)
- [Kiro vs Claude Code — Morph](https://www.morphllm.com/comparisons/kiro-vs-claude-code)
- [How spec-driven development improves AI coding quality — Red Hat](https://developers.redhat.com/articles/2025/10/22/how-spec-driven-development-improves-ai-coding-quality)

#research #spec-driven-development #ai #claude-code #planning
