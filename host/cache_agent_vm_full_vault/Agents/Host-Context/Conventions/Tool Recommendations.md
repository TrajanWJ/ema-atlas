# Tool Recommendations

> **Last reviewed:** 2026-04-12 — All tool recommendations remain current. Biome v2, Oxlint 1.0+, Vitest, Playwright, Semgrep all still best-in-class for their roles.

Sources: Research conducted 2026-03-11. See [[Research - Security and Quality Tools 2026]] for full analysis.

Related: [[Coding Standards]], [[Testing Philosophy]], [[Security Standards]], [[My Stack Decisions]]

---

## Linting & Formatting

| Tool | Role | When to Run | Notes |
|------|------|-------------|-------|
| **Biome** | Linter + Formatter | On save, pre-commit | Replaces ESLint + Prettier. 20x faster. Single binary, zero deps |
| **Oxlint** | Fast lint pass | On save (IDE), pre-commit | 50-100x faster than ESLint. Use alongside Biome for type-aware rules via tsgo |
| **typescript-eslint v8+** | Type-aware rules | Pre-commit, CI | Only if you need rules Biome/Oxlint lack. ESLint flat config only |

### Recommended: Biome as Primary

```bash
# Install
pnpm add -D @biomejs/biome

# Init config
pnpm biome init

# Format + lint
pnpm biome check --write .
```

**biome.json** (minimal):
```json
{
  "$schema": "https://biomejs.dev/schemas/2.0/schema.json",
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  }
}
```

### Oxlint for Speed Layer

```bash
# Install
pnpm add -D oxlint

# Run (50-100x faster than ESLint)
pnpm oxlint .
```

Oxlint 1.0+ uses tsgo (TypeScript 7's Go port) for type-aware linting. Catches floating promises, no-unnecessary-type-assertion, and similar rules at native speed.

---

## Testing

| Tool | Role | When to Run | Notes |
|------|------|-------------|-------|
| **Vitest** | Unit + integration | On save, pre-commit, CI | 10-20x faster than Jest. Native ESM, Vite-powered |
| **React Testing Library** | Component testing | With Vitest | Behavior-focused queries. v15+ supports React 19 |
| **Playwright** | E2E + component | CI, pre-merge | Cross-browser. Component testing still experimental |

### Vitest Setup

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: { branches: 80, functions: 80, lines: 80 },
    },
  },
})
```

### Testing AI-Generated Code

When Claude writes the code, testing requires extra rigor:

1. **Specify behavior first** — Write test specs as comments before asking Claude to generate
2. **Review AI-drafted tests** — Treat as first draft. Check for AAA structure, user-centric queries
3. **Edge case prompting** — Ask "what edge cases are missing?" then implement 1-2 yourself
4. **Mutation testing** — Validates tests actually catch failures, not just green-light AI output
5. **Never trust generated mocks** — Verify mocks match real API contracts

### Playwright E2E

```bash
pnpm add -D @playwright/test
pnpm playwright install
```

Reserve for critical user journeys per [[Testing Philosophy]] pyramid (~10% of tests).

---

## Security Scanning

| Tool | Role | When to Run | Notes |
|------|------|-------------|-------|
| **Semgrep** | SAST (static analysis) | Pre-commit hook, CI | Pattern-matching + semantic analysis. Free tier available |
| **Socket.dev** | Supply chain | On `pnpm add`, CI | Detects typosquatting, install scripts, obfuscated code |
| **npm/pnpm audit** | Known CVEs | Pre-commit, CI | Built-in. Fast but only catches known vulnerabilities |
| **Claude Code Security** | AI security review | CI (GitHub Action) | Reasons about code like a human reviewer. Traces data flows |
| [[Lasso claude-hooks]] | Prompt injection | PostToolUse hook | Already chosen. 50+ injection patterns |

### Semgrep Setup

```bash
# Install
pip install semgrep  # or brew install semgrep

# Run with TypeScript/React rules
semgrep --config=auto .

# Run specific security ruleset
semgrep --config=p/typescript --config=p/react .
```

### Claude Code Security Review (GitHub Action)

```yaml
# .github/workflows/security-review.yml
name: Security Review
on: [pull_request]

permissions:
  contents: read
  pull-requests: write

jobs:
  security-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-security-review@main
        with:
          anthropic_api_key: ${{ secrets.CLAUDE_API_KEY }}
```

### Socket.dev for Supply Chain

```bash
# Install CLI
npm install -g socket
# or use the GitHub App for automatic PR scanning
```

Socket scores packages across: Supply Chain Security, Vulnerability, Quality, Maintenance, License. Alerts on install scripts, obfuscated code, and newly-created maintainer accounts.

### Claude Code PreToolUse Security Hook

Add to `.claude/settings.json`:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "bash -c 'echo \"$TOOL_INPUT\" | grep -qiE \"(password|secret|api_key|token)\\s*[:=]\\s*[\"'\\''\\`]\" && echo \"BLOCKED: Potential hardcoded secret detected\" && exit 2 || exit 0'"
      }
    ]
  }
}
```

Exit code 2 blocks the action. Exit code 0 allows it.

---

## Type Safety

| Tool | Role | Install | Notes |
|------|------|---------|-------|
| **Zod** | Runtime validation | `pnpm add zod` | TypeScript-first. Use for all API boundaries |
| **ts-reset** | Better built-in types | `pnpm add -D @total-typescript/ts-reset` | Makes JSON.parse return `unknown`, fixes `.filter(Boolean)` |
| **Effect** | Typed error handling | `pnpm add effect` | Rust-style errors in TS. v4 beta with smaller bundles. Adopt incrementally |

### tsconfig.json Strict Mode

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Zod at API Boundaries

```typescript
import { z } from 'zod'

// Define schema
const UserInput = z.strictObject({
  email: z.string().email(),
  name: z.string().min(1).max(100),
})

// In Server Action / API route
export async function createUser(raw: unknown) {
  const result = UserInput.safeParse(raw)
  if (!result.success) return { error: result.error.flatten() }
  // result.data is fully typed
}
```

### ts-reset Setup

```typescript
// src/reset.d.ts
import '@total-typescript/ts-reset'
```

App code only (not libraries). Makes `.json()` return `unknown` instead of `any`, `.filter(Boolean)` narrows types correctly.

---

## Performance Monitoring

| Tool | Role | When to Run | Notes |
|------|------|-------------|-------|
| **Next.js Bundle Analyzer** | Bundle size | CI, on demand | `next analyze` built into Next.js 16.1+ with Turbopack |
| **Lighthouse CI** | Performance budgets | CI (every PR) | Enforce scores for LCP, CLS, INP |
| **useReportWebVitals** | Real user monitoring | Production | Built into Next.js. Send to analytics |

### Lighthouse CI Setup

```bash
pnpm add -D @lhci/cli
```

```yaml
# lighthouserc.json
{
  "ci": {
    "collect": { "url": ["http://localhost:3000"] },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }]
      }
    }
  }
}
```

### Next.js 16.1 Bundle Analyzer

```bash
# Built-in with Turbopack — no plugin needed
next analyze
```

Shows server and client modules with import tracing. Identifies bloated dependencies.

---

## Git Hooks & CI

| Tool | Role | Notes |
|------|------|-------|
| **Husky** | Git hook manager | Runs scripts on pre-commit, commit-msg, pre-push |
| **lint-staged** | Staged file runner | Only lints/formats files you changed |
| **commitlint** | Commit message validation | Enforces conventional commits |

### Setup

```bash
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional

# Init Husky
pnpm husky init
```

**.husky/pre-commit**:
```bash
pnpm lint-staged
```

**package.json**:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "biome check --write",
      "vitest related --run"
    ],
    "*.{json,md}": [
      "biome format --write"
    ]
  }
}
```

**commitlint.config.ts**:
```typescript
export default { extends: ['@commitlint/config-conventional'] }
```

### What Runs Where

| Trigger | Tools | Purpose |
|---------|-------|---------|
| **On save** | Biome format, Oxlint | Instant feedback |
| **Pre-commit** | lint-staged (Biome + Vitest related), secrets scan | Catch issues before commit |
| **Commit-msg** | commitlint | Enforce message format |
| **CI (every PR)** | Full Vitest suite, Semgrep, Lighthouse CI, Claude Security Review | Comprehensive gates |
| **Weekly** | `pnpm audit`, Socket.dev scan, dependency updates | Supply chain hygiene |

---

## Prompt Injection Defense

| Tool | Role | Notes |
|------|------|-------|
| [[Lasso claude-hooks]] | Pattern-based detection | PostToolUse hook. 50+ patterns. Warns rather than blocks |
| Claude Code built-in | Permission system | Explicit approval for sensitive ops. Command blocklist |
| Sandboxing | Isolation | Prevents compromised sessions from accessing system resources |
| [[Dippy]] | Command gating | Auto-approve safe commands, block destructive ones |

### Defense-in-Depth Configuration

1. **Lasso** for prompt injection scanning (already configured)
2. **Dippy** for command approval gating (already configured)
3. **PreToolUse hooks** for secrets detection (see Security Scanning above)
4. **Never use** `--dangerously-skip-permissions` unless scoped tightly
5. **Audit MCP servers** — treat each connection as a trust boundary
6. **Deny rules** for `curl`, raw `fetch`, `.env` file access in Claude Code settings

#tools #security #testing #linting #quality #type-safety
